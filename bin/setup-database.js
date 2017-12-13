var db = require('../models/index');
const logDriver = require('../lib/log-driver')('setup-database');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

db
  .query('SELECT * FROM public.geometry_columns')
  .catch(function(err) {
    if (err.message !== 'relation "public.geometry_columns" does not exist')
      throw err;
    return db.query('create extension postgis');
  })
  .then(function() {
    return db.sync({ force: process.env.DROP === 'true', logging: false });
  })
  .then(function() {
    const sessionStore = new SequelizeStore({
      db: db,
      checkExpirationInterval: -1
    });
    return sessionStore.sync();
  })
  .then(function() {
    logDriver.info('database is setup');
    db.close();
  })
  .catch(function(err) {
    logDriver.error(err.message);
    db.close();
  });
