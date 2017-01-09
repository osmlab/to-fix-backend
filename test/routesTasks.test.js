var server = require('../index');
var FormData = require('form-data');
var streamToPromise = require('stream-to-promise');
var test = require('tape');
var fs = require('fs');
var auth = require('./auth');
var idtask;

auth(function(user) {
  console.log(user);
  // options to create a task
  var optionsCreate = {
    name: 'Broken polygons',
    description: 'Unclosed ways which should be closed',
    changesetComment: 'Fixing invalid multipolygon relation by closing unclosed rings and self intersecting areas using #to-fix https://github.com/mapbox/mapping/issues/206',
    file: fs.createReadStream(__dirname + '/fixtures/simple.geojson')
  };

  //Create a task
  test('POST /tasks', function(t) {
    t.plan(6);
    var form = new FormData();
    form.append('name', optionsCreate.name);
    form.append('description', optionsCreate.description);
    form.append('changesetComment', optionsCreate.changesetComment);
    form.append('file', optionsCreate.file);

    streamToPromise(form).then(function(payload) {
      var headers = form.getHeaders();
      headers.authorization = 'Bearer ' + user.token;
      server.inject({
        url: '/tasks',
        method: 'POST',
        headers: headers,
        payload: payload
      }, (res) => {
        idtask = res.result.idtask;
        t.equal(res.statusCode, 200, 'HTTP 200 OK');
        t.equal(res.result.value.name, optionsCreate.name, 'Name OK');
        t.equal(res.result.value.description, optionsCreate.description, 'Description OK');
        t.equal(res.result.value.changesetComment, optionsCreate.changesetComment, 'Changeset Comment OK');
        t.equal(res.result.value.stats[0].items, 3, 'number of Items OK');
        t.equal(res.result.isCompleted, false, 'Is Completed OK');
        t.end();
      });
    });
  });

  // Returns the list of existing tasks
  test('GET /tasks', function(t) {
    t.plan(2);
    server.inject('/tasks', (res) => {
      t.equal(res.statusCode, 200, 'HTTP 200 OK');
      t.ok(res.result.tasks.length > 0, 'Tasks length is greater than 0');
      t.end();
    });
  });

  //Returns a specific tasks
  test('GET /tasks/{idtask}', function(t) {
    t.plan(6);
    server.inject('/tasks/' + idtask, (res) => {
      t.equal(res.statusCode, 200, 'HTTP 200 OK');
      t.equal(res.result.value.name, optionsCreate.name, 'Name OK');
      t.equal(res.result.value.description, optionsCreate.description, 'Description OK');
      t.equal(res.result.value.changesetComment, optionsCreate.changesetComment, 'Changeset Comment OK');
      t.equal(res.result.value.stats[0].items, 3, 'number of Items OK');
      t.equal(res.result.isCompleted, false, 'Task is not completed OK');
      t.end();
    });
  });

  //option to update the tasks
  var optionsUpdate = {
    name: 'Broken polygons',
    description: 'Unclosed ways which should be closed',
    changesetComment: 'Fixing invalid multipolygon relation by closing unclosed rings and self intersecting areas using #to-fix https://github.com/mapbox/mapping/issues/206',
    file: fs.createReadStream(__dirname + '/fixtures/simple.geojson'),
    password: 'test'
  };

  //Update a task
  test('PUT /tasks', function(t) {
    t.plan(6);
    var form = new FormData();
    form.append('idtask', idtask);
    form.append('name', optionsUpdate.name);
    form.append('description', optionsUpdate.description);
    form.append('changesetComment', optionsUpdate.changesetComment);
    form.append('file', optionsUpdate.file);
    form.append('isCompleted', 'false');

    streamToPromise(form).then(function(payload) {
      var headers = form.getHeaders();
      headers.authorization = 'Bearer ' + user.token;
      server.inject({
        url: '/tasks',
        method: 'PUT',
        headers: headers,
        payload: payload
      }, (res) => {
        t.equal(res.statusCode, 200, 'HTTP 200 OK');
        t.equal(res.result.value.name, optionsUpdate.name, 'Name OK');
        t.equal(res.result.value.description, optionsUpdate.description, 'Description OK');
        t.equal(res.result.value.changesetComment, optionsUpdate.changesetComment, 'Changeset Comment OK');
        t.equal(res.result.value.stats[1].items, 3, 'number of Items OK');
        t.equal(res.result.isCompleted, false, 'Task is not completed OK');
        t.end();
        server.stop();
      });
    });
  });
});