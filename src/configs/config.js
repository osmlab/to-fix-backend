'use strict';
var user = process.env.DBUsername || 'postgres';
var password = process.env.DBPassword || '1234';
var address = process.env.DBAddress || 'localhost';
var database = process.env.Database || 'dbtofix';
module.exports.connectionString = 'postgres://' +
  user + ':' +
  password + '@' +
  address + '/' +
  database;
module.exports.lockPeriod = 600;
module.exports.maxnum = 2147483647;
module.exports.password = process.env.UploadPassword;
