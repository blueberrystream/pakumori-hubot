"use strict"
const { Client } = require('pg');
const databaseURL = process.env.DATABASE_URL;

module.exports = (robot) => {
  robot.hear(/https:\/\/(youtu\.be|www\.youtube\.com)\//, (res) => {
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
      .catch(e => robot.logger.error(e.stack));
  });
};
