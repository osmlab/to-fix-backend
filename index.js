var fs = require('fs'),
    hapi = require('hapi'),
    pg = require('pg'),
    boom = require('boom'),
    pg_copy = require('pg-copy-streams'),
    hstore = require('pg-hstore')(),
    reformatCsv = require('./lib/reformat-csv');

var user = process.env.DBUsername || 'postgres';
var password = process.env.DBPassword || '';
var address = process.env.DBAddress || 'localhost';
var database = process.env.Database || 'tofix';
var path = process.env.UploadPath;

// short term, to prevent the need from building out user authentication until later
var uploadPassword = process.env.UploadPassword;

if (!path) return console.log('env variable UploadPath must be set');
if (!uploadPassword) return console.log('env variable UploadPassword must be set');

// from the db connection
var client, done;

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

server.route({
    method: 'GET',
    path: '/status',
    handler: function(request, reply) {
        reply({status: 'a ok'});
    }
});

server.route({
    method: 'POST',
    path: '/track/{task}',
    handler: function(request, reply) {
        var table = request.params.task;
        var time = request.payload.time;
        var attributes = request.payload.attributes;

        track(table, time, attributes, function(err, results) {
            if (err) return reply(boom.badRequest(err));
            return reply();
        });
    }
});

function track(table, time, attributes, callback) {
    // validate time, is int, is within range
    time = time || Math.round(+new Date()/1000);
    table = table.replace(/[^a-zA-Z]+/g, '').toLowerCase();
    var query = 'INSERT INTO ' + table + '_stats VALUES($1, $2);';

    client.query(query, [time, hstore.stringify(attributes)], function(err, results) {
        if (err) return callback(err);
        callback(null, results);
    });
}

server.route({
    method: 'GET',
    path: '/count/{task}',
    handler: function(request, reply) {
        var table = request.params.task.replace(/[^a-zA-Z]+/g, '').toLowerCase();;

        client.query('SELECT count(*) FROM ' + table + ';', function(err, results) {
            if (err) return reply(boom.badRequest(err));
            var total = results.rows[0].count;
            client.query('SELECT count(*) FROM ' + table + ' WHERE unixtime != 2147483647;', function(err, results) {
                if (err) return reply(boom.badRequest(err));
                var unfixed = results.rows[0].count;
                reply({
                    'total': total,
                    'available': unfixed
                });
            });
        });

    }
});

server.route({
    method: 'GET',
    path: '/track/{task}/{key}:{value}',
    handler: function(request, reply) {
        // future, add range param
        var table = request.params.task.replace(/[^a-zA-Z]+/g, '').toLowerCase();
        var key = request.params.key;
        var value = request.params.value;
        var query = 'SELECT time AS unixtime, hstore_to_json_loose(attributes) AS attributes FROM ' + table + '_stats WHERE attributes->$1=$2 ORDER BY time ASC;';

        client.query(query, [key, value], function(err, results) {
            if (err) return console.log(err);
            reply({
                updated: Math.round(+new Date()/1000),
                data: results.rows
            });
        });
    }
});

server.route({
    method: 'POST',
    path: '/error/{error}',
    handler: function(request, reply) {
        // I know
        var soWonderful = request.params.error.replace(/[^a-zA-Z]+/g, '').toLowerCase();
        var query = 'UPDATE ' + soWonderful + ' x SET unixtime=$1 FROM (SELECT key, unixtime FROM ' + soWonderful + ' WHERE unixtime < $2 AND unixtime != 2147483647 LIMIT 1) AS sub WHERE x.key=sub.key RETURNING x.key, x.value;';
        var now = Math.round(+new Date()/1000);
        client.query(query, [now+lockPeriod, now], function(err, results) {
            if (err) return console.log(err);
            return reply(JSON.stringify({
                key: results.rows[0].key,
                value: JSON.parse(results.rows[0].value.split('|').join('"'))
            }));
        });
    }
});

server.route({
    method: 'POST',
    path: '/fixed/{error}',
    config: {
        payload: {
            output: 'data'
        }
    },
    handler: function(request, reply) {
        var payload = JSON.parse(request.payload);
        var soWonderful = request.params.error.replace(/[^a-zA-Z]+/g, '').toLowerCase();
        // 2147483647 is int max
        var query = 'UPDATE ' + soWonderful + ' SET unixtime=2147483647 WHERE key=$1;';
        client.query(query, [payload.state._id], function(err, results) {
            if (err) return boom.badRequest(err);
            return reply('ok');
        });
    }
});

server.route({
    method: 'POST',
    path: '/csv',
    config: {
        payload: {
            maxBytes: 200000000,
            output: 'stream',
            parse: true
        }
    },
    handler: function(request, reply) {
        // confirm db config vars are set
        // err immeditately if not

        var data = request.payload;

        if (!data.file ||
            (!data.password || data.password === '') ||
            (!data.name || data.name === '')) return reply(boom.badRequest('missing something'));

        if (data.password != uploadPassword) return reply(boom.unauthorized('invalid password'));

        if (data.file) {
            var name = data.file.hapi.filename;
            var internalName = data.name.replace(/[^a-zA-Z]+/g, '').toLowerCase();

            // just looking at the extension for now
            if (name.slice(-4) != '.csv') return reply(boom.badRequest('.csv files only'));

            if (path[path.length-1] !== '/') path = path + '/';

            var file = fs.createWriteStream(path + name);

            file.on('error', function (err) {
                reply(boom.badRequest(err));
            });

            data.file.pipe(file);

            data.file.on('end', function (err) {
                reformatCsv(path, path + name, function(err, filename) {
                    if (err) {
                        fs.unlink(path + name, function() {
                            reply(boom.badRequest(err));
                        });
                    } else {
                        var closed = 0;

                        client.query('CREATE TABLE temp_' + internalName + ' (key VARCHAR(255), value TEXT);', function(err, results) {
                            if (err) {
                                console.log('create temp');
                                return reply(boom.badRequest(err));
                            }
                        });

                        var stream = client.query(pg_copy.from('COPY temp_' + internalName + ' FROM STDIN (FORMAT CSV);'));
                        var fileStream = fs.createReadStream(filename, {encoding: 'utf8'});

                        // csv errors aren't being caught and surfaced very well, silent

                        fileStream
                            .on('error', function(err) {
                                console.log('err here', err);
                                return reply(boom.badRequest(err));
                            })
                            .pipe(stream)
                                .on('finish', theEnd)
                                .on('error', theEnd);

                        // do this because on error both will emit something and calling reply twice errors
                        function theEnd(err) {
                            if (err) {
                                closed = 1;
                                return closed ? null : reply(boom.badRequest(err));
                            }
                            setTimeout(function() {
                                // https://github.com/brianc/node-pg-copy-streams/issues/22
                                client.query('ALTER TABLE temp_' + internalName + ' ADD COLUMN unixtime INT DEFAULT 0;', function(err, results) {
                                    if (err) {
                                        return reply(boom.badRequest(err));
                                    }

                                    client.query('CREATE TABLE ' + internalName + ' as SELECT * FROM temp_' + internalName + ' ORDER BY RANDOM();', function(err, results) {
                                        if (err) return reply(boom.badRequest(err));

                                        client.query('CREATE TABLE ' + internalName + '_stats (time INT, attributes HSTORE);', function(err, results) {
                                            if (err) return reply(boom.badRequest(err));

                                            client.query('DROP TABLE temp_' + internalName + ';', function(err, results) {
                                                if (err) return reply(boom.badRequest(err));
                                                reply('ok');
                                            });

                                        });

                                    });
                                });
                            }, 500);
                        }

                    }
                });
            });

        }
    }
});

pg.connect(conString, function(err, c, d) {
    if (err) return console.log(err);
    console.log('connected to:', address);
    client = c;
    done = d;
    server.start(function() {
        console.log('server on port', port);
    });
});
