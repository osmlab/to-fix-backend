'use strict';
var user = process.env.DBUsername || 'postgres';
var password = process.env.DBPassword || '';
var address = process.env.DBAddress || 'localhost';
var database = process.env.Database || 'tofix';

module.exports.connectionString = 'postgres://' +
  user + ':' +
  password + '@' +
  address + '/' +
  database;
module.exports.lockPeriod = 600;
module.exports.maxnum = 2147483647;
