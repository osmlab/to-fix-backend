var taskObjects = require('./../src/controllers/ControllerTasks').taskObjects;
var test = require('tape');

test('Create a task object', function(t) {
  var data = {
    name: 'overlapped highways',
    description: 'Detecting major roads which overlap other major highways.',
    changesetComment: 'Deleting overlapped highways using #to-fix https://github.com/mapbox/mapping/issues/167',
    password: 'xxx',
    file: null
  };
  var task = taskObjects(data, null);
  t.equal(task.value.name, 'overlapped highways', 'name ok');
  t.equal(task.value.stats[0].edit, 0, 'edit, ok');
  t.equal(task.value.stats[0].fixed, 0, 'fixed, ok');
  t.equal(task.value.stats[0].noterror, 0, 'noterror, ok');
  t.equal(task.value.stats[0].skip, 0, 'skip, ok');
  t.equal(task.value.stats[0].edit, 0, 'edits, ok');
  t.end();
});

test('Update a task object', function(t) {
  var data = {
    idtask: 'overlappedhighwaysxxx',
    name: 'overlapped highways',
    description: 'Detecting major roads which overlap other major highways.',
    changesetComment: 'Deleting overlapped highways using #to-fix https://github.com/mapbox/mapping/issues/167',
    password: 'xxx',
    file: 'path/to/geojson'
  };
  var result = {
    value: {
      stats: [{
        edit: 0,
        fixed: 0,
        noterror: 0,
        skip: 0,
        date: 1479831637,
        items: 32
      }, {
        edit: 0,
        fixed: 0,
        noterror: 0,
        skip: 0,
        date: 1479831662,
        items: 572
      }]
    }
  };
  var task = taskObjects(data, result);
  t.equal(task.value.name, 'overlapped highways', 'name ok');
  t.equal(task.value.stats[2].edit, 0, 'edit, ok');
  t.equal(task.value.stats[2].fixed, 0, 'fixed, ok');
  t.equal(task.value.stats[2].noterror, 0, 'noterror, ok');
  t.equal(task.value.stats[2].skip, 0, 'skip, ok');
  t.equal(task.value.stats[2].edit, 0, 'edits, ok');
  t.end();
});
