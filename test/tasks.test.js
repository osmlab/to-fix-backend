const test = require('./lib/test');
const removeDates = require('./lib/remove-dates');

test('GET /tasks', [{ id: 'one' }, { id: 'two' }], function(assert) {
  assert.app.get('/tasks').expect(200, function(err, res) {
    if (err) return assert.end(err);
    assert.equal(res.body.length, 2, 'has two tasks');
    var tasks = res.body.reduce(function(memo, t) {
      t = removeDates(t);
      memo[t.id] = t;
      return memo;
    }, {});
    assert.deepEqual(
      tasks.one,
      { id: 'one', metadata: {} },
      'task one should look like the fixture'
    );
    assert.deepEqual(
      tasks.two,
      { id: 'two', metadata: {} },
      'task two should look like the fixture'
    );
    assert.end();
  });
});

test('GET /tasks/:id', [{ id: 'one' }, { id: 'two' }], function(assert) {
  assert.app.get('/tasks/one').expect(200, function(err, res) {
    if (err) return assert.end(err);
    var t = removeDates(res.body);
    assert.deepEqual(
      t,
      { id: 'one', metadata: {} },
      'task one should look like the fixture'
    );
    assert.end();
  });
});

const oneTask = [{ id: 'one', metadata: { keep: 'keep' } }];

test('PUT /tasks/:id - update task one', oneTask, function(assert) {
  assert.app
    .put('/tasks/one')
    .send({ metadata: { test: 'test' } })
    .expect(200, function(err, res) {
      if (err) return assert.end(err);
      var t = removeDates(res.body);
      assert.deepEqual(
        { id: 'one', metadata: { keep: 'keep', test: 'test' } },
        t,
        'check update worked'
      );
      assert.end();
    });
});

test('PUT /tasks/:id - create task two', oneTask, function(assert) {
  assert.app
    .put('/tasks/two')
    .send({ metadata: { test: 'test' } })
    .expect(200, function(err, res) {
      if (err) return assert.end(err);
      var t = removeDates(res.body);
      assert.deepEqual(
        { id: 'two', metadata: { test: 'test' } },
        t,
        'check create worked'
      );
      assert.end();
    });
});
