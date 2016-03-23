var hapi = require('hapi');
var pg = require('pg');
var routes = require('./routes');
// var updateTask = require('./src/updateTask');

var user = process.env.DBUsername || 'postgres';
var password = process.env.DBPassword || '';
var address = process.env.DBAddress || 'localhost';
var database = process.env.Database || 'tofix';
var path = process.env.UploadPath || '/tmp';
// short term, to prevent the need from building out user authentication until later
var uploadPassword = process.env.UploadPassword;
if (!path) return console.log('env variable UploadPath must be set');
if (!uploadPassword) return console.log('env variable UploadPassword must be set');
// from the db connection
var client;
// seconds to lock each item
var lockPeriod = 600;

var conString = 'postgres://' +
  user + ':' +
  password + '@' +
  address + '/' +
  database;

var server = new hapi.Server();
var port = 8000;

server.connection({
  port: port,
  routes: {
    cors: true
  }
});

var tasks = {};

pg.connect(conString, function(err, c, d) {
  if (err) return console.log(err);
  console.log('connected to:', address);
  client = c;
  server.route(routes(client, conString, lockPeriod, tasks));
  // updateTask(client,path);
  server.start(function() {
    console.log('server on port', port);
  });
});