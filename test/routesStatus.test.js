var server = require('../index');
var test = require('tape');

//Confirms the server is working
test('GET /', function(t) {
  server.inject('/', (res) => {
    t.equal(res.statusCode, 200, 'HTTP 200 OK');
    t.end();
  });
});

test.onFinish(function() {
  server.stop({
    timeout: 1000
  }, (err) => {
    console.log('shutting down');
    server.emit('stop');
  });
});