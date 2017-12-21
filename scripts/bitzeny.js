// Description:
//   BitZeny pool information.
//
// Commands
//   hubot zny|zeny pools
/* jshint esversion: 6 */

"use strict"
const format = require("string-template");

const slackAPI = require('slackbotapi');
const slackAPIToken = process.env.HUBOT_SLACK_TOKEN;
const apiURLs = [
  'https://bitzeny.mizutamari.work/?page=api&action=public',
  'https://bunnymining.work/bitzeny/?page=api&action=public',
  'https://hogepool.net/?page=api&action=public',
  'https://n-zeny.mdpool.info/?page=api&action=public',
  'https://pool.knyacki.xyz/?page=api&action=public',
  'https://pool.knyacki.xyz/?page=api&action=public',
  'https://pool1.znymining.net/?page=api&action=public',
  'https://pool1.znymining.net/?page=api&action=public',
  'https://portal.bitzenypool.work/?page=api&action=public',
  'https://soup.misosi.ru/?page=api&action=public',
  'https://wpool.work/?page=api&action=public',
  'https://zny.arunyastyle.com/?page=api&action=public',
  'https://zny.coiner.site/?page=api&action=public',
  'https://zny.coiner.site/?page=api&action=public',
  'https://zny.powerpool.jp/?page=api&action=public'
];

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

  robot.respond(/(z|zny|zeny) (ps|pools)/i, (res) => {
    apiURLs.forEach((url) => {
      robot.http(url)
        .header('Accept', 'application/json')
        .get()((err, response, body) => {
          let message = "";
          if (err) {
            message = err;
          } else {
            if (response.statusCode !== 200) {
              message = 'response status code: ' + response.statusCode;
            } else {
              const publicData = JSON.parse(body);
              const siteURL = url.replace(/\?.*/, '');
              message = format('{siteName} {siteURL} {hashRate}KH/s', {
                'siteName': publicData.pool_name,
                'siteURL': siteURL,
                'hashRate': publicData.hashrate
              });
            }
          }

          postMessageWithSlack(message, res.message.room, 'BitZeny', ':bitzeny:');
        });
    });
  });
};
