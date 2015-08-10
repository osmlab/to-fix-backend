var boom = require('boom'),
	hstore = require('pg-hstore')(),
	queue = require('queue-async'),
	queries = require('./queries');

var uploadPassword = process.env.UploadPassword;
var path = process.env.UploadPath;

module.exports = {
	count: function(client, request, reply,table) {
		queue(1)
			.defer(function(cb) {
				// overall count
				client.query('SELECT count(*) FROM ' + table + ';', cb);
			})
			.defer(function(cb) {
				// unfixed items
				client.query('SELECT count(*) FROM ' + table + ' WHERE time != 2147483647;', cb);
			})
			.defer(function(cb) {
				// items that are active
				client.query('SELECT count(*) from ' + table + ' WHERE time > ' + Math.round(+new Date() / 1000) + ' AND time != 2147483647;', cb);
			})
			.awaitAll(function(err, results) {
				if (err) return reply(boom.badRequest(err));
				reply({
					total: parseInt(results[0].rows[0].count),
					available: parseInt(results[1].rows[0].count),
					active: parseInt(results[2].rows[0].count)
				});
			});
	},
	count_history: function(client, request, reply,table) {
		var query = "SELECT count(*), attributes->'action' AS action, date_trunc($1, to_timestamp(time)) AS time FROM " + table + "_stats WHERE attributes->'action'='skip' OR attributes->'action'='edit' OR attributes->'action'='fix' OR attributes->'action'='noterror' GROUP BY date_trunc($1, to_timestamp(time)), attributes->'action' ORDER BY date_trunc($1, to_timestamp(time));";
		client.query(query, [request.params.grouping], function(err, results) {
			if (err) return reply(boom.badRequest(err));
			var times = {};

			results.rows.forEach(function(row) {
				var time = Math.round(+new Date(row.time) / 1000);
				if (!times[time]) times[time] = {};
				times[time][row.action] = parseInt(row.count);
			});

			var out = [];
			for (var time in times) {
				times[time].start = parseInt(time);
				out.push(times[time]);
			}

			reply({
				updated: Math.round(+new Date() / 1000),
				data: out
			});
		});
	},
	track: function(client, request, reply,table) {
		// gets results filtered by key:value or by date range
		// user:joey, filters from hstore
		// or
		// from:2015-03-17/to:2015-03-19, filters on time
		var query = 'SELECT time AS time, hstore_to_json_loose(attributes) AS attributes FROM ' + table + '_stats WHERE ';
		var params;

		if (request.params.key == 'from' && request.params.to) {
			var from = Date.parse(request.params.value) / 1000;
			var to = Date.parse(request.params.to.split(':')[1]) / 1000;
			// go to the end of the to date
			to = to + 86400;
			query += 'time > $1 and time < $2;';
			params = [from, to];
		} else if (request.params.key == 'from' && !request.params.to) {
			var from = Date.parse(request.params.value) / 1000;
			query += 'time > $1;';
			params = [from];
		} else {
			query += 'attributes->$1=$2 ORDER BY time ASC;';
			params = [request.params.key, request.params.value];
		}
		client.query(query, params, function(err, results) {
			if (err) return reply(boom.badRequest(err));
			reply({
				updated: Math.round(+new Date() / 1000),
				data: results.rows
			});
		});
	},
	track_stats: function(client, request, reply, table) {
		// give stats for the given time period
		var from = Math.round(+new Date(request.params.from.split(':')[1]) / 1000);
		var to = Math.round(+new Date(request.params.to.split(':')[1]) / 1000);
		if (from == to) to = to + 86400;
		var query = "SELECT count(*), attributes->'user' AS user, attributes->'action' AS action FROM " + table + "_stats WHERE time < $1 AND time > $2 AND (attributes->'action'='edit' OR attributes->'action'='skip' OR attributes->'action'='fix' OR attributes->'action'='noterror') GROUP BY attributes->'user', attributes->'action' ORDER BY attributes->'user';";
		client.query(query, [to, from], function(err, results) {
			if (err) {
				reply(boom.badRequest(err));
				return false;
			}

			var users = {};
			results.rows.forEach(function(row) {
				if (row.user && row.user.trim()) {
					if (!users[row.user]) {
						users[row.user] = {};
					}
					users[row.user][row.action] = parseInt(row.count);
				}
			});

			users = Object.keys(users).map(function(user) {
				var out = users[user];
				out.user = user;
				return out;
			});

			reply({
				updated: Math.round(+new Date() / 1000),
				stats: users
			});
		});
	},
	detail: function(client, request, reply) {
		var idtask = request.params.idtask.replace(/[^a-zA-Z]+/g, '').toLowerCase();
		var query = 'SELECT id, title, source, description, updated, status from task_details where id =  $1';
		var task = {};
		var cliente = client.query(query, [idtask], function(err, results) {
			if (err) return boom.badRequest(err);
			results.rows.forEach(function(row) {
				task.id = row.id;
				task.title = row.title;
				task.source = row.source;
				task.description = row.description;
				task.updated = row.updated;
				task.status = row.status;
			});
		});
		cliente.on('end', function(result) {
			return reply(JSON.stringify(task));
		});
	},
	tasks: function(client, request, reply) {
		var query = 'SELECT id, title, source, status FROM task_details ORDER BY status, title;'; // WHERE status = $1
		var tasks = [];
		var cliente = client.query(query, /* [status],*/ function(err, results) {
			if (err) return boom.badRequest(err);
			results.rows.forEach(function(row) {
				var task = {};
				task.id = row.id;
				task.title = row.title;
				task.source = row.source;
				task.status = row.status;
				tasks.push(task);
			});
		});
		cliente.on('end', function(result) {
			return reply(JSON.stringify({
				tasks: tasks
			}));
		});
	}
}