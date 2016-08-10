'use strict';
const massive = require("massive");
const boom = require('boom');
const fs = require('fs');
const os = require('os');
const path = require('path');
const geojsonhint = require('geojsonhint');

const user = process.env.DBUsername || 'postgres';
const password = process.env.DBPassword || '';
const address = process.env.DBAddress || 'localhost';
const database = process.env.Database || 'tofix';
const conString = 'postgres://' +
  user + ':' +
  password + '@' +
  address + '/' +
  database;

const db = massive.connectSync({
  connectionString: conString
});


module.exports.item = function(request, reply) {
  //find first match

  console.log(request.params.idtask);
  db[request.params.idtask].findOne({
    "propeties._timestamp >": 1460172495
  }, function(err, item) {
    reply(item);
  });
};