const test = require('./lib/test');
const removeDates = require('./lib/remove-dates');
const checkLock = require('./lib/check-lock');

const listItemsFixture = [
  {
    id: 'one',
    items: [{ id: '77', pin: [77, 77] }, { id: '30', pin: [30, 30] }]
  },
  { id: 'empty' },
  {
    id: 'lockers1',
    items: [
      {
        id: '30',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      },
      {
        id: '31',
        pin: [30, 30]
      },
      {
        id: '32',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      },
      {
        id: '33',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      }
    ]
  },
  {
    id: 'lockers2',
    items: [
      {
        id: '30',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60)
      },
      {
        id: '32',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '33',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now())
      }
    ]
  }
];

test(
  'GET /tasks/:id/items - get a task that is not in the db',
  listItemsFixture,
  function(assert) {
    assert.app.get('/tasks/wave/items').expect(404, function(err, res) {
      if (err) return assert.end(err);
      assert.ok(res.body.message, 'has message attr');
      assert.end();
    });
  }
);

test(
  'GET /tasks/:id/items - get a task without items',
  listItemsFixture,
  function(assert) {
    assert.app.get('/tasks/empty/items').expect(200, function(err, res) {
      if (err) return assert.end(err);
      assert.equal(res.body.length, 0, 'has no items');
      assert.end();
    });
  }
);

test('GET /tasks/:id/items - get a task with items', listItemsFixture, function(
  assert
) {
  assert.app.get('/tasks/one/items').expect(200, function(err, res) {
    if (err) return assert.end(err);
    assert.equal(res.body.length, 2, 'has right number of items');
    var items = res.body.reduce(function(m, i) {
      m[i.id] = removeDates(i);
      return m;
    }, {});
    assert.equal(
      items['30'].task_id,
      'one',
      'item 30 should have the right task'
    );
    assert.deepEqual(
      items['30'].pin,
      {
        type: 'Point',
        coordinates: [30, 30]
      },
      'item 30 should be pin at the right spot'
    );
    assert.equal(
      items['77'].task_id,
      'one',
      'item 77 should have the right task'
    );
    assert.deepEqual(
      items['77'].pin,
      {
        type: 'Point',
        coordinates: [77, 77]
      },
      'item 77 should be pin at the right spot'
    );
    assert.end();
  });
});

test(
  'GET /tasks/:id/items?lock=locked - get a task with locked items',
  listItemsFixture,
  function(assert) {
    assert.app
      .get('/tasks/lockers1/items?lock=locked')
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.length, 3, 'should have 3 locked items');
        assert.end();
      });
  }
);

test(
  'GET /tasks/:id/items?lock=locked - get a task with locked items with lockers2 data',
  listItemsFixture,
  function(assert) {
    assert.app
      .get('/tasks/lockers2/items?lock=locked')
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.length, 1, 'should have 1 locked items');
        assert.end();
      });
  }
);

test(
  'GET /tasks/:id/items?lock=unlocked - get a task with unlocked items',
  listItemsFixture,
  function(assert) {
    assert.app
      .get('/tasks/lockers1/items?lock=unlocked')
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.length, 1, 'should have one unlocked item');
        assert.end();
      });
  }
);

test(
  'GET /tasks/:id/items?lock=unlocked - get a task with unlocked items with lockers2 data',
  listItemsFixture,
  function(assert) {
    assert.app
      .get('/tasks/lockers2/items?lock=unlocked')
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.length, 2, 'should have 2 unlocked items');
        assert.end();
      });
  }
);

const getItemsFixture = [
  {
    id: 'one',
    items: [{ id: '30', pin: [30, 30] }]
  }
];

test('GET /tasks/:id/items/:id', getItemsFixture, function(assert) {
  assert.app.get('/tasks/one/items/30').expect(200, function(err, res) {
    if (err) return assert.end(err);
    assert.ok(
      checkLock.unlocked(res.body),
      'lock ended before the test started'
    );
    var item = removeDates(res.body);
    assert.deepEqual(item, {
      id: '30',
      task_id: 'one',
      pin: {
        type: 'Point',
        coordinates: [30, 30]
      },
      status: 'open',
      lockedBy: null,
      featureCollection: {
        type: 'FeatureCollection',
        features: []
      },
      createdBy: 'userone',
      instructions: 'created via the tests'
    });
    assert.end();
  });
});