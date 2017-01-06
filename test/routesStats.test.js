var server = require('../index');
var test = require('tape');

// server.inject('/tasks', (res) => {
//   var task = res.result.tasks[res.result.tasks.length - 1];
//   var from = '2016-11-01';
//   var now = new Date();
//   var to = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
//   var user = 'rub21';

//   //Return activity in the task, e.g: /tasks/{idtask}/activity/from:2016-11-01/to:2016-11-30
//   test(`GET /tasks/${task.idtask}/activity/${from}/${to}`, function(t) {
//     var options = {
//       method: 'GET',
//       url: `/tasks/${task.idtask}/activity/${from}/${to}`
//     };
//     server.inject(options, (res) => {
//       t.equal(res.statusCode, 200, 'HTTP 200 OK');
//       t.end();
//     });
//   });

//   //Return the user activity in the task, e.g: /tasks/{idtask}/activity/{user}/from:2016-11-01/to:2016-11-30
//   test(`GET /tasks/${task.idtask}/activity/${user}/${from}/${to}`, function(t) {
//     var options = {
//       method: 'GET',
//       url: `/tasks/${task.idtask}/activity/${user}/${from}/${to}`
//     };
//     server.inject(options, (res) => {
//       t.equal(res.statusCode, 200, 'HTTP 200 OK');
//       t.end();
//     });
//   });

//   //Return the tracking stats, e.g:/tasks/{idtask}/track_stats/from:2016-11-01/to:2016-11-30
//   test(`GET /tasks/${task.idtask}/track_stats/${from}/${to}`, function(t) {
//     var options = {
//       method: 'GET',
//       url: `/tasks/${task.idtask}/track_stats/${from}/${to}`
//     };
//     server.inject(options, (res) => {
//       t.equal(res.statusCode, 200, 'HTTP 200 OK');
//       t.end();
//       server.emit(t.end);
//     });
//   });
// });

