"use strict";

var massive = require("massive");

var user = process.env.DBUsername || 'postgres';
var password = process.env.DBPassword || '';
var address = process.env.DBAddress || 'localhost';
var database = process.env.Database || 'tofix';
var path = process.env.UploadPath;

var conString = 'postgres://' +
  user + ':' +
  password + '@' +
  address + '/' +
  database;


var db = massive.connectSync({
  connectionString: conString
});


module.exports.findByID = function(request, reply) {


};
