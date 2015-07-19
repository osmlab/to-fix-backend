var pg = require('pg');
var request = require('request');
var queue = require('queue-async');
var queries = require('./queries');
var user = process.env.DBUsername || 'postgres';
var password = process.env.DBPassword || '';
var address = process.env.DBAddress || 'localhost';
var database = process.env.Database || 'tofix';

var client;

var conString = 'postgres://' +
    user + ':' +
    password + '@' +
    address + '/' +
    database;

pg.connect(conString, function(err, c, d) {
    if (err) return console.log(err);
    console.log('connected to:', address);
    client = c;

});

var tasks = [];
var ramdom = 'xxx';

//Read tasks.json to load all task in task_details table
request.get('http://osmlab.github.io/to-fix/src/data/tasks.json', {
    json: {
        key: 'value'
    }
}, function(error, response, body) {
    var tks = body.tasks;
    if (!error && response.statusCode == 200) {
        for (var i = 0; i < tks.length; i++) {
            var task = {};
            task.id = tks[i].id.replace(/[^a-zA-Z]+/g, '').toLowerCase();
            task.title = tks[i].title;
            task.source = tks[i].source;
            task.owner = 'mapbox';
            task.description = 'Mapbox ' + tks[i].title + ' task';
            task.updated = 0; //for now
            task.status = true; //supose all tak are completed
            tasks.push(task);
        }
    }
});


// Add two task where data-team have been worked --disconnectednepal --nycbuildingoverlaps
var task_nepal = {};
task_nepal.id = 'disconnectednepal';
task_nepal.title = 'Disconnected Nepal';
task_nepal.source = 'unconnected'; // for now source=unconnected, i dont know waht source is this
task_nepal.owner = 'mapbox';
task_nepal.description = 'Mapbox Disconnected Nepal task';
task_nepal.updated = 0; //for now
task_nepal.status = true; //tak are completed

var task_nyc = {};
task_nyc.id = 'nycbuildingoverlaps';
task_nyc.title = 'NYC Building Overlaps';
task_nyc.source = 'nycbuildings';
task_nyc.owner = 'mapbox';
task_nyc.description = 'Mapbox NYC Building Overlaps task';
task_nyc.updated = 0; //for now
task_nyc.status = true; //tak are completed

tasks.push(task_nepal);
tasks.push(task_nyc);


setTimeout(function() {
    queue(1)
        //Drop exist table task_details.
        .defer(function(cb) {
            var query = 'DROP TABLE task_details;';
            client.query(query, cb);
        })
        //Create table task_details
        .defer(function(cb) {
            var query = ' CREATE TABLE task_details( \
                          id VARCHAR(100) NOT NULL, \
                          title VARCHAR(150), \
                          source VARCHAR(150), \
                          owner VARCHAR(150), \
                          description TEXT, \
                          updated INTEGER, \
                          status BOOLEAN )';
            client.query(query, cb);
        })
        //Insert  data in task_details table
        .defer(function(cb) {
            var query = ''
            for (var i = 0; i < tasks.length; i++) {
                var id = '\'' + tasks[i].id + '\''; //lets do ramdom 
                var title = '\'' + tasks[i].title + '\'';
                var source = '\'' + tasks[i].source + '\'';
                var owner = '\'' + tasks[i].owner + '\'';
                var description = '\'' + tasks[i].description + '\'';
                var status = tasks[i].status; //lets supose for now all task are not complete
                var updated = tasks[i].updated
                    //INSERT INTO task_details(id, title, source, owner, description, updated, status)
                query += 'INSERT INTO task_details VALUES(' + id + ', ' + title + ', ' + source + ', ' + owner + ', ' + description + ', ' + updated + ', ' + status + ');\n';
            };
            client.query(query, cb);

        })
        //Last updated in each table task
        .defer(function(cb) {
            var query = '';
            for (var i = 0; i < tasks.length; i++) {
                query += 'UPDATE task_details SET updated = subquery.updated FROM (SELECT MAX("time") as updated FROM ' + tasks[i].id + '_stats) AS subquery WHERE task_details.id=\'' + tasks[i].id + '\';\n';
            };
            client.query(query, cb);
        })
        //Update status of each task
        .defer(function(cb) {
            var query = '';
            for (var i = 0; i < tasks.length; i++) {
                query += 'UPDATE task_details SET status = subquery.status FROM (SELECT false as status  FROM ' + tasks[i].id + ' WHERE "time" < 2147483647) AS subquery WHERE task_details.id=\'' + tasks[i].id + '\';\n'
            };
            client.query(query, cb);
        })
        //Remove function and remove old
        .defer(function(cb) {
            console.log('Remove function and remove old')
            var query = '';
            for (var i = 0; i < tasks.length; i++) {
                var id = tasks[i].id + ramdom;
                // query += ' DROP FUNCTION task_' + tasks[i].id + ' (integer, integer);\n';
                var tableName = id;
                var table_stats = tasks[i].id + '_stats';
                query += queries.create_function(tableName, table_stats);
            };
            client.query(query, cb);
        })
        //Update ID for each task
        .defer(function(cb) {
            var query = '';
            for (var i = 0; i < tasks.length; i++) {
                var id = tasks[i].id + ramdom;
                query += 'UPDATE task_details SET id =\'' + id + '\' WHERE task_details.id=\'' + tasks[i].id + '\';\n';
            };
            client.query(query, cb);
        })
        // Clone tables and remove, it is because i could not rename in 9.3.5
        .defer(function(cb) {
            var query = '';
            for (var i = 0; i < tasks.length; i++) {
                var id = tasks[i].id + ramdom;
                query += 'CREATE TABLE ' + id + ' AS SELECT * FROM ' + tasks[i].id + ';\n';
                query += 'DROP TABLE ' + tasks[i].id + ';\n'
            };
            client.query(query, cb);
        })
        //Remove tables that we never use
        // .defer(function(cb) {
        //     var query = 'DROP TABLE nycadreessspaciala_stats; \
        //                 DROP TABLE nycoverlappingbuildings;  \
        //                 DROP TABLE nycoverlappingbuildings_stats;  \
        //                 DROP TABLE nycoverlappingbuildingsversion; \
        //                 DROP TABLE nycoverlappingbuildingsversion_stats; \
        //                 DROP TABLE nycspeciala; \
        //                 DROP TABLE nycspeciala_stats; \
        //                 DROP TABLE nycspecialb; \
        //                 DROP TABLE nycspecialb_stats; \
        //                 DROP TABLE temp_nycaddressspecialcoa; \
        //                 DROP TABLE temp_nycaddressspecialcob; \
        //                 DROP TABLE temp_tigerdelta; \
        //                 DROP TABLE temp_unconnectedmajor; \
        //                 DROP TABLE test; \
        //                 DROP TABLE testruben; \
        //                 DROP TABLE testruben_stats; \
        //                 DROP TABLE test_stats; \
        //                 DROP TABLE usabuildingsoverlap; \
        //                 DROP TABLE usabuildingsoverlap_stats; \
        //                 DROP FUNCTION task_test(integer, integer); \ //also remove invalidation functions
        //                 DROP FUNCTION task_testruben(integer, integer);';
        //     client.query(query, cb);
        // })
        .awaitAll(function(err, results) {
            console.log('done')
        });
}, 8000)