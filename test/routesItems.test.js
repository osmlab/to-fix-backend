var server = require('../index');
var test = require('tape');
var task;

server.inject('/tasks', (res) => {
  task = res.result.tasks[res.result.tasks.length - 1];
  var item;

  // Return a item randomly, and lock it and save the user an editor 
  test(`POST /tasks/${task.idtask}/items`, function(t) {
    var options = {
      method: 'POST',
      url: `/tasks/${task.idtask}/items`,
      payload: {
        user: 'rub21',
        editor: 'josm'
      }
    };
    server.inject(options, (res) => {
      item = res.result;
      t.equal(res.statusCode, 200, 'HTTP 200 OK');
      t.equal(res.result.type, 'Feature', 'Feature OK');
      t.equal(res.result.properties._tofix.length, 1, 'Num Editions 1 OK');
      t.end();
    });
  });

  var keys;
  var key;
  // Return group of items, exactly 2, and lock it and save the user an editor 
  test(`POST /tasks/${task.idtask}/items/2`, function(t) {
    setTimeout(function() {
      var options = {
        method: 'POST',
        url: `/tasks/${task.idtask}/items/2`,
        payload: {
          user: 'rub21',
          editor: 'josm'
        }
      };
      server.inject(options, (res) => {
        items = res.result;
        key = items[1].properties._key;
        keys = items[0].properties._key + ',' + items[1].properties._key;
        t.equal(res.statusCode, 200, 'HTTP 200 OK');
        t.equal(items.length, 2, 'Feature OK');
        t.equal(items[0].properties._tofix.length, 1, 'Num Editions 1 OK');
        t.end();
      });
    }, 1000);
  });

  //Unlocked group of items
  test(`POST /tasks/{idtask}/items/unlocked`, function(t) {
    setTimeout(function() {

      var options = {
        method: 'POST',
        url: `/tasks/${task.idtask}/items/unlocked`,
        payload: {
          groupIds: keys
        }
      };
      server.inject(options, (res) => {
        t.equal(res.statusCode, 200, 'HTTP 200 OK');
        t.equal(res.result.status, 'unlocked', 'Unlocked OK');
        t.equal(res.result.groupIds.length, 2, 'length of ids OK');
        t.end();
      });
    }, 1000);
  });

  // Return a item
  test(`GET /tasks/${task.idtask}/items/${key}`, function(t) {
    var options = {
      method: 'GET',
      url: `/tasks/${task.idtask}/items/${key}`
    };
    server.inject(options, (res) => {
      t.equal(res.statusCode, 200, 'HTTP 200 OK');
      t.end();
    });
  });

  // Update a item with an action = skip
  test(`PUT /tasks/${task.idtask}/items - skip`, function(t) {
    var options = {
      method: 'PUT',
      url: `/tasks/${task.idtask}/items`,
      payload: {
        user: 'rub21',
        editor: 'josm',
        action: 'skip',
        key: item.properties._key
      }
    };
    server.inject(options, (res) => {
      t.equal(res.statusCode, 200, 'HTTP 200 OK');
      t.equal(res.result.type, task.idtask, 'Idtask OK');
      t.equal(res.result.key, item.properties._key, 'Key OK');
      t.equal(res.result.status, 'updated', 'updated OK');
      t.end();
    });
  });

  // Update a item with an action = fixed
  test(`PUT /tasks/${task.idtask}/items - fixed`, function(t) {
    var options = {
      method: 'PUT',
      url: `/tasks/${task.idtask}/items`,
      payload: {
        user: 'rub21',
        editor: 'josm',
        action: 'fixed',
        key: item.properties._key
      }
    };
    server.inject(options, (res) => {
      t.equal(res.statusCode, 200, 'HTTP 200 OK');
      t.equal(res.result.type, task.idtask, 'Idtask OK');
      t.equal(res.result.key, item.properties._key, 'Key OK');
      t.equal(res.result.status, 'updated', 'updated OK');
      t.end();
    });
  });

  // Update a item with an action = noterror
  test(`PUT /tasks/${task.idtask}/items - noterror`, function(t) {
    var options = {
      method: 'PUT',
      url: `/tasks/${task.idtask}/items`,
      payload: {
        user: 'rub21',
        editor: 'josm',
        action: 'noterror',
        key: item.properties._key
      }
    };
    server.inject(options, (res) => {
      t.equal(res.statusCode, 200, 'HTTP 200 OK');
      t.equal(res.result.type, task.idtask, 'Idtask OK');
      t.equal(res.result.key, item.properties._key, 'Key OK');
      t.equal(res.result.status, 'updated', 'updated OK');
      t.end();
    });
  });

  // Return the list of id items from a task according an action
  test(`GET /tasks/{idtask}/items/action/{action} - noterror`, function(t) {
    var action = 'noterror';
    var options = {
      method: 'GET',
      url: `/tasks/${task.idtask}/items/action/${action}`
    };
    server.inject(options, (res) => {
      t.equal(res.statusCode, 200, 'HTTP 200 OK');
      t.equal(res.result.length, 0, 'a noterror item OK');
      t.end();
    });
  });

  // Return the list of 100 first items in the task
  test(`GET /tasks/{idtask}/items`, function(t) {
    var options = {
      method: 'GET',
      url: `/tasks/${task.idtask}/items`
    };
    server.inject(options, (res) => {
      t.equal(res.statusCode, 200, 'HTTP 200 OK');
      t.equal(res.result.length, 3, '3 items OK');
      t.end();
    });
  });

  // Returns the amount of item that exists in the task
  test(`GET /tasks/{idtask}/count`, function(t) {
    var options = {
      method: 'GET',
      url: `/tasks/${task.idtask}/count`
    };
    server.inject(options, (res) => {
      t.equal(res.statusCode, 200, 'HTTP 200 OK');
      t.equal(res.result.count, 3, 'Count of items OK');
      t.end();
    });
  });
});