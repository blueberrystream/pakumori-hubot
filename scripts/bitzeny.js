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
const mposURLs = [
  'https://bitzeny.mizutamari.work',
  'https://bitzeny.mypool.tokyo',
  'https://bunnymining.work/bitzeny',
  'https://coinrush.work',
  'https://hogepool.net',
  'https://n-zeny.mdpool.info',
  'https://pool.knyacki.xyz',
  'https://pool1.znymining.net',
  'https://portal.bitzenypool.work',
  'https://soup.misosi.ru',
  'https://ukkey3.space/bitzeny',
  'https://www.wmapool.net',
  'https://zny.arunyastyle.com',
  'https://zny.coiner.site',
  'https://zny.powerpool.jp'
];
const nompURLs = [
  'https://wpool.work'
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
    mposURLs.forEach((url) => {
      robot.http(url + '/?page=api&action=public').header('Accept', 'application/json').get()((err, response, body) => {
        let message = "";
        if (err) {
          message = err;
        } else {
          if (response.statusCode !== 200) {
            message = 'response status code: ' + response.statusCode;
          } else {
            const publicData = JSON.parse(body);
            message = format('{siteName} {siteURL} {hashRate}KH/s', {
              'siteName': publicData.pool_name,
              'siteURL': url,
              'hashRate': publicData.hashrate
            });
          }
        }

        postMessageWithSlack(message, res.message.room, 'BitZeny', ':bitzeny:');
      });
    });
    nompURLs.forEach((url) => {
      robot.http(url + '/api/stats').header('Accept', 'application/json').get()((err, response, body) => {
        let message = "";
        if (err) {
          message = err;
        } else {
          if (response.statusCode !== 200) {
            message = 'response status code: ' + response.statusCode;
          } else {
            const publicData = JSON.parse(body);
            message = format('{siteURL} {hashRate}KH/s', {
              'siteURL': url,
              'hashRate': publicData.pools.bitzeny.hashrate / 1000
            });
          }
        }

        postMessageWithSlack(message, res.message.room, 'BitZeny', ':bitzeny:');
      });
    });
  });

  robot.respond(/(z|zny|zeny) (相場|s|souba|soba)/i, (res) => {
    robot.http('https://c-cex.com/t/zny-btc.json').header('Accept', 'application/json').get()((err, response, body) => {
      if (!err && response.statusCode === 200) {
        const znyBtcAvg = JSON.parse(body).ticker.avg;
        robot.http('https://api.zaif.jp/api/1/ticker/btc_jpy').header('Accept', 'application/json').get()((err, response, body) => {
          if (!err && response.statusCode === 200) {
            const btcJpyBid = JSON.parse(body).bid;
            postMessageWithSlack(format('ZNY/JPY {yen}', { 'yen': znyBtcAvg * btcJpyBid }), res.message.room, 'BitZeny', ':bitzeny:');
          } else {
            postMessageWithSlack('failed: zaif api', res.message.room, 'BitZeny', ':bitzeny:');
          }
        });
      } else {
        postMessageWithSlack('failed: c-cex api', res.message.room, 'BitZeny', ':bitzeny:');
      }
    });
  });
};
