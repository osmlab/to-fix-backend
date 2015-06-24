var request = require('request');
var queries = require('./queries');
var fs = require('fs');

fs.writeFile('query.sql', '', function(err) {});


request.get('http://osmlab.github.io/to-fix/src/data/tasks.json', {
	json: {
		key: 'value'
	}
}, function(error, response, body) {
	if (!error && response.statusCode == 200) {
		for (var i = 0; i < body.tasks.length; i++) {
			console.log(body.tasks[i].id);
			fs.appendFile('query.sql', '--FUNCTION FOR ' + body.tasks[i].title + '\n', function(err) {});
			fs.appendFile('query.sql', queries.create_function(body.tasks[i].id.replace(/[^a-zA-Z]+/g, '').toLowerCase())+'\n', function(err) {});
		}
	}
});