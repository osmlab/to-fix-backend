'use strict';
const massive = require("massive");
const boom = require('boom');
const config = require('./../configs/config');

let db = massive.connectSync({
  connectionString: config.connectionString
});

module.exports.getItemById = function(request, reply) {
  const iditem = request.params.iditem;
  const idtask = request.params.idtask;
  db[idtask].find({
    'idsrt': iditem
  }, function(err, item) {
    reply(item);
  });
};

module.exports.getItem = function(request, reply) {
  const now = Math.round((new Date()).getTime() / 1000);
  const idtask = request.params.idtask;
  db[idtask].findOne({
    'time <': now
  }, function(err, item) {
    reply(item);
    db[idtask].save({
      id: item.id,
      time: now + config.lockPeriod
    }, function(err, updated) {
      console.log('was updated ' + updated);
    });
  });
};