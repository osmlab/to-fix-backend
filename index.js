var fs = require('fs'),
    hapi = require('hapi'),
    pg = require('pg'),
    boom = require('boom'),
    pg_copy = require('pg-copy-streams'),
    reformatCsv = require('./lib/reformat-csv');

var user = process.env.DBUsername;
var password = process.env.DBPassword;
var address = process.env.DBAddress;
var database = process.env.Database;

// short term, to prevent the need from building out user authentication until later
var uploadPassword = process.env.uploadPassword;

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
    path:'/error/{error}',
    handler: function(request, reply) {
        // I know
        var soWonderful = request.params.error.replace(/[^a-zA-Z]+/g, '').toLowerCase();
        var query = 'UPDATE ' + soWonderful + ' x SET unixtime=$1 FROM (SELECT key, unixtime FROM ' + soWonderful + ' WHERE unixtime < $2 LIMIT 1) AS sub WHERE x.key=sub.key RETURNING x.key, x.value;';
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
    handler: function(request, reply) {
        reply('ok');
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

            var path = (process.env.UploadPath || '/mnt/uploads');
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

                        client.query('create table temp_' + internalName + ' (key varchar(255), value text);', function(err, results) {
                            if (err) {
                                console.log('create temp');
                                return reply(boom.badRequest(err));
                            }
                        });

                        var stream = client.query(pg_copy.from('COPY temp_' + internalName + ' FROM STDIN (format csv);'));
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

                        // do this because both will emit something, and reply twice errors
                        function theEnd(err) {
                            if (err) {
                                closed = 1;
                                return closed ? null : reply(boom.badRequest(err));
                            }
                            setTimeout(function() {
                                // https://github.com/brianc/node-pg-copy-streams/issues/22
                                client.query('ALTER TABLE temp_' + internalName + ' ADD COLUMN unixtime integer default 0;', function(err, results) {
                                    if (err) {
                                        return reply(boom.badRequest(err));
                                    }
                                    client.query('ALTER TABLE temp_' + internalName + ' RENAME TO ' + internalName, function(err, results) {
                                        if (err) return reply(boom.badRequest(err));
                                        return reply('ok');
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

// curl -i -F name=something -F file=@with-cats.csv http://localhost:8000/csv
