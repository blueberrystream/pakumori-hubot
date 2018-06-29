"use strict"
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

  postMessageWithSlack('new revision is deployed!', 'C8B0740R1', 'hubot-pakumori', ':pakumori:');
};
