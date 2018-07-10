"use strict"
const { Client } = require('pg');
const databaseURL = process.env.DATABASE_URL;
const slackAPI = require('slackbotapi');
const slackAPIToken = process.env.HUBOT_SLACK_TOKEN;

function initSlackAPI(token) {
  if (token === undefined) {
    throw new Error(`HUBOT_SLACK_TOKEN cannot be empty! value: undefined`);
  }
  return new slackAPI({
    'token': token,
    'logging': false,
    'autoReconnect': true
  });
}


module.exports = (robot) => {
  let slack;
  try {
    slack = initSlackAPI(slackAPIToken);
  } catch (e) {
    robot.logger.error(e.toString());
  }

  function postMessageWithSlack(message, channel, userName, icon) {
    return new Promise((resolve, reject) => {
      slack.reqAPI("chat.postMessage", {
        channel: channel,
        text: message,
        username: userName,
        link_names: 0,
        pretty: 1,
        icon_emoji: icon
      }, (res) => {
        if(!res.ok) {
          robot.logger.error(`something occured with slack api. ${res.error}`);
          reject(new Error(`something occured with slack api. ${res.error}`));
        }
        resolve();
      });
    });
  }

  robot.hear(/https:\/\/(youtu\.be|www\.youtube\.com|soundcloud\.com)\//, (res) => {
    if (res.message.room !== 'C9A5XLRNG') return;

    const client = new Client({
      connectionString: databaseURL,
      ssl: true
    });
    const query = 'INSERT INTO "logs" ("username", "text", "ts") VALUES ($1, $2, $3)';
    const values = [res.message.user.name, res.message.text, res.message.id];

    client.connect();
    client.query(query, values)
      .then(res => robot.logger.debug(res))
      .catch(e => robot.logger.error(e.stack))
      .then(() => client.end());
  });

  robot.respond(/jukelist( \d+)?/, (res) => {
    const client = new Client({
      connectionString: databaseURL,
      ssl: true
    });
    let count = res.message.text.match(/jukelist ?\d+?/)[1];
    if (count === void 0) {
      count = 5;
    } else {
      count = count * 1;
    }
    if (count > 100) count = 100;
    const query = `SELECT * FROM "logs" ORDER BY id DESC LIMIT ${count}`;

    client.connect();
    client.query(query)
      .then(result => {
        let message = '';
        let timestamp = '';
        result.rows.forEach(row => {
          timestamp = new Date(row.ts * 1000);
          timestamp = timestamp.toLocaleString();
          message += `[${row.timestamp}] ${row.username}: ${row.text}\n`;
        });

        postMessageWithSlack(message, res.message.room, 'Jukebox', ':radio:');
      })
      .catch(e => robot.logger.error(e.stack))
      .then(() => client.end());
  });
};
