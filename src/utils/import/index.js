'use strict';
var fs = require('fs');
var os = require('os');
var AWS = require('aws-sdk');
var path = require('path');
var d3 = require('d3-queue');
var _ = require('lodash');
var elasticsearch = require('elasticsearch');
var AwsEsConnector = require('http-aws-es');
var config = require('./../../configs/config');
var readline = require('readline');
var argv = require('minimist')(process.argv.slice(2));
var folder = os.tmpdir();
var localClient = require('./../connection');
var format = require('./formatGeojson');
var task = JSON.parse(argv.task);
var file = argv.file;

var client;
if (config.envType) {
  var creds = new AWS.ECSCredentials();
  creds.get();
  creds.refresh(function(err) {
    if (err) throw err;
    var amazonES = {
      region: config.region,
      credentials: creds
    };
    client = new elasticsearch.Client({
      host: config.ElasticHost,
      connectionClass: AwsEsConnector,
      amazonES: amazonES
    });
    init(task, file);
  });
} else {
  client = localClient.connect();
  init(task, file);
}

function init(task, file) {
  var q = d3.queue(1);
  var task = task;
  var bulk = [];
  q.defer(function(cb) {
    //format geojson file
    format.formatGeojson(file, task, function(currentTask) {
      task = currentTask;
      cb();
    });
  });

  q.defer(function(cb) {
    loadItems(task, function(err, data) {
      if (err) cb(err);
      bulk = data;
      cb();
    });
  });

  q.defer(function(cb) {
    // save data on type
    if (bulk.length > 0) {
      var bulkChunks = _.chunk(bulk, config.arrayChunks);
      var counter = 0;
      var errorsCounter = 0;

      function saveData(bulkChunk) {
        client.bulk({
          maxRetries: 5,
          index: config.index,
          id: task.idtask + task.value.stats[task.value.stats.length - 1].type,
          type: task.idtask + task.value.stats[task.value.stats.length - 1].type,
          body: bulkChunk
        }, function(err) {
          if (err) {
            //try 3 times to save the chunk
            errorsCounter++;
            if (errorsCounter === 3) {
              cb(err);
            } else {
              saveData(bulkChunks[counter]);
            }
          } else {
            counter++;
            if (bulkChunks.length > counter) {
              saveData(bulkChunks[counter]);
            } else {
              cb();
            }
          }
        });
      }
      saveData(bulkChunks[0]);
    } else {
      task.isAllItemsLoad = true;
      task.isCompleted = true;
      cb();
    }
  });

  //update stats, number of issues
  q.defer(function(cb) {
    // client.create({
    //   index: config.index,
    //   type: task.idtask + '_stats',
    //   id: task.value.stats[0].date,
    //   body: task.value.stats[0]
    // }, function(err) {
    //   if (err) {
    //     cb(err);
    //   } else {
    //     cb();
    //   }
    // });
    client.update({
      index: config.index,
      type: task.idtask + '_stats',
      id: task.value.stats[0].date,
      body: {
        doc: task.value.stats[0]
      }
    }, function(err) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  });

  q.await(function(error) {
    if (error) {
      task.status = false;
    }
    task.isAllItemsLoad = true;
    client.update({
      index: config.index,
      type: 'tasks',
      id: task.idtask,
      body: {
        doc: task
      }
    }, function(err) {
      if (err) console.info(err);
      console.info('finish upload ' + task.idtask);
    });
  });
}

function loadItems(task, done) {
  //set all features in a array to insert massive features  on my type
  var bulk = [];
  var rd = readline.createInterface({
    input: fs.createReadStream(path.join(folder, task.idtask)),
    output: process.stdout,
    terminal: false
  });
  rd.on('line', function(line) {
    var obj = JSON.parse(line);
    var index = {
      index: {
        _index: config.index,
        _type: task.idtask + task.value.stats[task.value.stats.length - 1].type,
        _id: obj.properties._key
      }
    };
    bulk.push(index, obj);
  }).on('close', function() {
    done(null, bulk);
  }).on('error', function(e) {
    done(e, null);
  });
}