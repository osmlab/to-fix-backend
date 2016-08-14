var child_process = require('child_process');
var numchild = require('os').cpus().length;


var child = child_process.fork('./load');
child.send({
  file: '/tmp/export.geojson',
  id: 'argitosbwzfjy'
});

child.on('message', function(message) {
  console.log('[parent] received message from child:', message);
});