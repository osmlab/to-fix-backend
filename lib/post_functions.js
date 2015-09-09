var fs = require('fs'),
    boom = require('boom'),
    pg_copy = require('pg-copy-streams'),
    hstore = require('pg-hstore')(),
    queue = require('queue-async'),
    reformatCsv = require('./reformat-csv'),
    queries = require('./queries'),
    rs = require('random-strings');

var uploadPassword = process.env.UploadPassword;
var path = process.env.UploadPath;

module.exports = {

    track: function(client, table, time, attributes, callback) {
        // filter undefined track after a task was complete
        if (typeof attributes.key !== 'undefined') {
            // validate time, is int, is within range
            time = time || Math.round(+new Date() / 1000);
            var query = 'INSERT INTO ' + table + '_stats VALUES($1, $2);';
            client.query(query, [time, hstore.stringify(attributes)], function(err, results) {
                if (err) return callback(err);
                callback(null, results);
            });
        }
    },

    task: function(client, request, reply, lockPeriod, table) {
        var query = 'SELECT key, value FROM task_' + table + '($1,$2)'; //this is a function
        var now = Math.round(+new Date() / 1000);
        client.query(query, [lockPeriod, now], function(err, results) {
            if (err) return reply(boom.badRequest(err));
            if (results.rows[0].key === 'complete') {
                return reply(boom.resourceGone(JSON.stringify({
                    key: results.rows[0].key,
                    value: JSON.parse(results.rows[0].value.split('|').join('"'))
                })));
            } else {
                return reply(JSON.stringify({
                    key: results.rows[0].key,
                    value: JSON.parse(results.rows[0].value.split('|').join('"'))
                }));
            }
        });
    },

    fixed: function(client, request, reply,table) {
        var query = 'UPDATE ' + table + ' SET time=2147483647 WHERE key=$1;';
        client.query(query, [request.payload.key], function(err, results) {
            if (err) return boom.badRequest(err);
            // check for a real update, err if not
            return reply('ok');
        });

        var attributes = {
            user: request.payload.user,
            key: request.payload.key,
            action: 'fix'
        };

        var table_stats =table.substring(0, table.length - 3);
        this.track(client, table_stats, false, attributes, function(err, results) {
            if (err) console.error('/fixed tracking err', err);
        });
    },

    noterror: function(client, request, reply,table) {
        var query = 'UPDATE ' + table + ' SET time=2147483647 WHERE key=$1;';
        client.query(query, [request.payload.key], function(err, results) {
            if (err) return boom.badRequest(err);
            return reply('ok');
        });
        var attributes = {
            user: request.payload.user,
            key: request.payload.key,
            action: 'noterror'
        };
        var table_stats =table.substring(0, table.length - 3);
        this.track(client, table_stats, false, attributes, function(err, results) {
            if (err) console.error('/Not a error tracking err', err);
        });
    },

    csv: function(client, request, reply, callback) {
        // confirm db config vars are set
        // err immeditately if not
        var data = request.payload;
        if (!data.file ||
            (!data.password || data.password === '') ||
            (!data.name || data.name === '')) return reply(boom.badRequest('missing something'));

        if (data.password != uploadPassword) return reply(boom.unauthorized('invalid password'));

        if (data.file) {

            var new_task = (data.newtask === 'true');
            var name = data.file.hapi.filename;

            var table_stats = data.name.replace(/[^a-zA-Z]+/g, '').toLowerCase() + '_stats';
            var tableName = data.name.replace(/[^a-zA-Z]+/g, '').toLowerCase() + rs.alphaLower(3);
            var taskid = data.name.replace(/[^a-zA-Z]+/g, '').toLowerCase();

            // just looking at the extension for now
            if (name.slice(-4) != '.csv') return reply(boom.badRequest('.csv files only'));
            if (path[path.length - 1] !== '/') path = path + '/';
            var file = fs.createWriteStream(path + name);

            file.on('error', function(err) {
                reply(boom.badRequest(err));
            });

            data.file.pipe(file);

            data.file.on('end', function(err) {
                reformatCsv(path, path + name, function(err, filename) {
                    if (err) {
                        fs.unlink(path + name, function() {
                            reply(boom.badRequest(err));
                        });
                    } else {
                        var closed = 0;

                        client.query('CREATE TABLE temp_' + tableName + ' (key VARCHAR(255), value TEXT);', function(err, results) {
                            if (err) {
                                console.log('create temp');
                                return reply(boom.badRequest(err));
                            }
                        });

                        var stream = client.query(pg_copy.from('COPY temp_' + tableName + ' FROM STDIN (FORMAT CSV);'));
                        var fileStream = fs.createReadStream(filename, {
                            encoding: 'utf8'
                        });

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
                                queue(1)
                                    .defer(function(cb) {
                                        var query = 'ALTER TABLE temp_' + tableName + ' ADD COLUMN time INT DEFAULT 0;';
                                        client.query(query, cb);
                                    })
                                    .defer(function(cb) {
                                        var ramdom = (data.preserve === "true");
                                        var order = ' ORDER BY RANDOM();';
                                        if (ramdom) order = ';';
                                        var query = 'CREATE TABLE ' + tableName + ' as SELECT * FROM temp_' + tableName + order;
                                        client.query(query, cb);
                                    })
                                    .defer(function(cb) {
                                        var query = 'CREATE INDEX CONCURRENTLY ON ' + tableName + ' (time);';
                                        client.query(query, cb);
                                    })
                                    .defer(function(cb) {
                                        if (new_task) {
                                            var query = 'CREATE TABLE ' + table_stats + ' (time INT, attributes HSTORE);';
                                            client.query(query, cb);
                                        } else {
                                            cb();
                                        }
                                    })
                                    .defer(function(cb) {
                                        if (new_task) {
                                            var query = 'CREATE INDEX CONCURRENTLY ON ' + table_stats + ' (time);';
                                            client.query(query, cb);
                                        } else {
                                            cb();
                                        }
                                    }).defer(function(cb) {
                                        var query = queries.create_type();
                                        client.query(query, cb);
                                    }).defer(function(cb) {
                                        var query = queries.create_function(tableName, taskid);
                                        client.query(query, cb);
                                    })
                                    .defer(function(cb) {
                                        var query = 'DROP TABLE temp_' + tableName + ';';
                                        client.query(query, cb);
                                    })
                                    .defer(function(cb) { //Lets avoid create tables out off this file
                                        var query = queries.create_task_details();
                                        client.query(query, cb);
                                    })
                                    .defer(function(cb) {
                                        if (new_task) {
                                            var details = [];
                                            details.push(taskid);
                                            details.push(data.name);
                                            details.push(data.source);
                                            details.push(tableName);
                                            details.push(data.description);
                                            details.push(Math.round(+new Date() / 1000));
                                            details.push(false) //status =false, for a new task
                                            var query = 'INSERT INTO task_details VALUES($1, $2, $3, $4, $5, $6, $7);';
                                            client.query(query, details, cb);
                                        } else {
                                            var details = [];
                                            details.push(data.source);
                                            details.push(tableName);
                                            details.push(data.description);
                                            details.push(false) //status =false, change to avalible task
                                            details.push(data.id); // modifed id task
                                            var query = 'UPDATE task_details SET source=$1, tasktable=$2, description=$3, status=$4 WHERE id=$5;';
                                            client.query(query, details, cb);
                                        }
                                    })
                                    .awaitAll(function(err, results) {
                                        if (err) return reply(boom.badRequest(err));
                                        callback({"status" : true, taskid:taskid});                                        
                                    });
                            }, 500);
                        }
                    }
                });
            });

        }
    }
};