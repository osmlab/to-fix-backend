/*
const test = require('./lib/test');
const removeDates = require('./lib/remove-dates');

test('GET /projects', [{ id: 'one' }, { id: 'two' }], function(assert) {
  assert.app.get('/projects').expect(200, function(err, res) {
    if (err) return assert.end(err);
    assert.equal(res.body.length, 2, 'has two projects');
    var projects = res.body.reduce(function(memo, t) {
      t = removeDates(t);
      memo[t.id] = t;
      return memo;
    }, {});
    assert.deepEqual(
      projects.one,
      { id: 'one', metadata: {} },
      'project one should look like the fixture'
    );
    assert.deepEqual(
      projects.two,
      { id: 'two', metadata: {} },
      'project two should look like the fixture'
    );
    assert.end();
  });
});

test('GET /projects/:id', [{ id: 'one' }, { id: 'two' }], function(assert) {
  assert.app.get('/projects/one').expect(200, function(err, res) {
    if (err) return assert.end(err);
    var t = removeDates(res.body);
    assert.deepEqual(
      t,
      { id: 'one', metadata: {} },
      'project one should look like the fixture'
    );
    assert.end();
  });
});

const oneproject = [{ id: 'one', metadata: { keep: 'keep' } }];

test('PUT /projects/:id - update project one', oneproject, function(assert) {
  assert.app
    .put('/projects/one')
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

test('PUT /projects/:id - create project two', oneproject, function(assert) {
  assert.app
    .put('/projects/two')
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
*/
