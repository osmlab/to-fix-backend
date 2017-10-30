require('dotenv').config();

const configFromEnv = {
  database: process.env.PG_DATABASE,
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  dialect: 'postgres'
};

module.exports = {
  development: configFromEnv,
  production: configFromEnv
};
