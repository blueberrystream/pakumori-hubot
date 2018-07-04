"use strict"
const { Client } = require('pg');
const databaseURL = process.env.DATABASE_URL;

module.exports = (robot) => {
  robot.hear(/https:\/\/(youtu\.be|www\.youtube\.com)\//, (res) => {
    robot.logger.info(res.message);
    robot.logger.info(databaseURL);
    if (res.room !== 'C8B0740R1') return;

    const client = new Client({
      connectionString: databaseURL,
    });
    const query = 'INSERT INTO "logs" ("username", "raw_text", "ts") VALUES ("$1", "$2", "$3")';
    const values = [res.user.name, res.rawText, res.id];

    client.connect();
    client.query(query, values)
      .then(res => robot.logger.info(res))
      .catch(e => robot.logger.error(e.stack));
  });
};
