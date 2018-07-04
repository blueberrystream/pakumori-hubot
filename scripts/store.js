"use strict"
const { Client } = require('pg');

module.exports = (robot) => {
  robot.hear(/https:\/\/(youtu\.be|www\.youtube\.com)\//, (res) => {
    if (res.room !== 'C8B0740R1') return;

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    const query = 'INSERT INTO "logs" ("username", "raw_text", "ts") VALUES ("$1", "$2", "$3")';
    const values = [res.user.name, res.rawText, res.id];

    client.connect();
    client.query(query, values)
      .then(res => robot.logger.info(res))
      .catch(e => robot.logger.error(e.stack));
  });
};
