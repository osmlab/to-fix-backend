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

// on RDS, how do I set a security group?
    // or whitelist this instance or something, somehow
    // this must not happen in the main app, probably in install somewhere

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
    path:'/stuff',
    handler: function(request, reply) {
        reply('between the bars');
    }
});

server.route({
    method: 'GET',
    path: '/status',
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
        if (data.password != uploadPassword) return reply(boom.unauthorized('invalid password'));

        if (data.file) {
            var name = data.file.hapi.filename;

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

                        pg.connect(conString, function(err, client, done) {
                            // why does this not catch basic non-auth errors from rds?
                            if (err) return reply(boom.badRequest(err));

                            client.query('create table if not exists temp_' + name.split('.').join('') + ' (key varchar(255), value text);', function(err, results) {
                                if (err) {
                                    client.end();
                                    return reply(boom.badRequest(err));
                                }
                            });

                            var stream = client.query(pg_copy.from('COPY temp_' + name.split('.').join('') + ' FROM STDIN (format csv);'));
                            var fileStream = fs.createReadStream(filename, {encoding: 'utf8'});

                            fileStream
                                .on('error', function(err) {
                                    client.end();
                                    return reply(boom.badRequest(err));
                                })
                                .pipe(stream)
                                    .on('finish', theend)
                                    .on('error', theend);

                            // do this because both will emit something, and reply twice errors
                            function theend(err) {
                                if (err) {
                                    if (!closed) client.end();
                                    closed = 1;
                                    return closed ? null : reply(boom.badRequest(err));
                                }
                                setTimeout(function() {
                                    // something wrong with pg-copy-streams
                                    // https://github.com/brianc/node-pg-copy-streams/issues/22
                                    client.end();
                                }, 500);
                                return reply('ok');
                            }
                        });

                    }
                });
            });

        }
    }
});

server.start(function() {
    console.log('started on port', port);
});

// soooo, we need server side user auth
    // in order to restrict uploads to specific users
    // just use an env var for first pass?
        // require a cooldown
    // every POST must then

// first pass, upload a csv
    // retructure into k/v, hash, full object as string
    // later we can pull special columns, latitude, longitude, _country
        // what does the editor geocoder do? ffforest?

// curl -i -F name=something -F file=@with-cats.csv http://localhost:8000/csv
