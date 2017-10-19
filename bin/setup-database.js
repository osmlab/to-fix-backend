var db = require('../database/index');
const logger = require('fastlog')('setup-database');

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
    logger.info('database is setup');
    db.close();
  })
  .catch(function(err) {
    logger.error(err.message);
    db.close();
  });
