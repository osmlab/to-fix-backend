const test = require('./lib/test');
const removeDates = require('./lib/remove-dates');
const checkLock = require('./lib/check-lock');

const taskWithNoItems = [{ id: 'one' }];
const taskWithOneUnlockedItem = [
  {
    id: 'one',
    items: [{ id: '30', pin: [30, 30] }]
  }
];
const taskWithOneItemLockedByUserTwo = [
  {
    id: 'one',
    items: [
      {
        id: '30',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      }
    ]
  }
];
const taskWithOneItemLockedByUserOne = [
  {
    id: 'one',
    items: [
      {
        id: '30',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      }
    ]
  }
];

const delay = time => new Promise(res => setTimeout(res, time));

test(
  'PUT /tasks/:id/items:id - an item must have instructions',
  taskWithNoItems,
  function(assert) {
    assert.app
      .put('/tasks/one/items/no-instructions')
      .send({ pin: [30, 30] })
      .expect(400, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'instructions is required',
          'has expected error message'
        );
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - creating an item with an invalid pin errors',
  taskWithNoItems,
  function(assert) {
    assert.app
      .put('/tasks/one/items/bad-pin')
      .send({ pin: [], instructions: 'test' })
      .expect(400, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'Invalid Pin: position must have 2 or more elements',
          'expected message'
        );
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - updating an item with an invalid pin errors',
  taskWithOneUnlockedItem,
  function(assert) {
    assert.app
      .put('/tasks/one/items/30')
      .send({ pin: [] })
      .expect(400, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'Invalid Pin: position must have 2 or more elements',
          'expected message'
        );
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - creating an item without a pin should fail',
  taskWithNoItems,
  function(assert) {
    assert.app
      .put('/tasks/one/items/no-pin')
      .send({ instructions: 'test' })
      .expect(400, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.message, 'pin is required', 'expected message');
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - creating an item with an invalid feature collection errors',
  taskWithNoItems,
  function(assert) {
    assert.app
      .put('/tasks/one/items/bad-fc')
      .send({
        pin: [30, 30],
        instructions: 'test',
        featureCollection: { type: 'FeatureCollection' }
      })
      .expect(400, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'Invalid featureCollection: "features" member required',
          'expected message'
        );
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - should create a valid item without errors',
  taskWithNoItems,
  function(assert) {
    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { type: 'node' },
          geometry: {
            type: 'Point',
            coordinates: [30, 30]
          }
        }
      ]
    };
    assert.app
      .put('/tasks/one/items/good-item')
      .send({
        pin: [30, 30],
        instructions: 'test',
        featureCollection
      })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        var item = removeDates(res.body);
        assert.deepEqual(
          {
            status: 'open',
            id: 'good-item',
            task_id: 'one',
            pin: { type: 'Point', coordinates: [30, 30] },
            instructions: 'test',
            featureCollection: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: { type: 'node' },
                  geometry: {
                    type: 'Point',
                    coordinates: [30, 30]
                  }
                }
              ]
            },
            createdBy: 'userone',
            lockedBy: null
          },
          item
        );
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - updating an item with an invalid feature collection errors',
  taskWithOneUnlockedItem,
  function(assert) {
    assert.app
      .put('/tasks/one/items/30')
      .send({ featureCollection: { type: 'FeatureCollection' } })
      .expect(400, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'Invalid featureCollection: "features" member required',
          'expected message'
        );
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - update an item',
  taskWithOneUnlockedItem,
  function(assert) {
    var fc = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { type: 'node' },
          geometry: {
            type: 'Point',
            coordinates: [30, 30]
          }
        }
      ]
    };
    assert.app
      .put('/tasks/one/items/30')
      .send({ featureCollection: fc })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        var item = removeDates(res.body);
        assert.deepEqual(item.featureCollection, fc);
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - the lock can be activated via {lock: locked}',
  taskWithOneUnlockedItem,
  function(assert) {
    assert.app
      .put('/tasks/one/items/30')
      .send({ lock: 'locked' })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.ok(checkLock.locked(res.body), 'the item is locked');
        assert.equal(
          res.body.lockedBy,
          'userone',
          'item locked by the current user'
        );
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - the lock can be deactivated via {lock: unlocked}',
  taskWithOneItemLockedByUserOne,
  function(assert) {
    assert.app
      .put('/tasks/one/items/30')
      .send({ lock: 'unlocked' })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.ok(checkLock.unlocked(res.body), 'the item is unlocked');
        assert.equal(
          res.body.lockedBy,
          null,
          'item locked by the current user'
        );
        assert.end();
      });
  }
);
test(
  'PUT /tasks/:id/items:id - the status cannot be changed by a user who doesnt have an active lock',
  taskWithOneUnlockedItem,
  function(assert) {
    assert.app
      .put('/tasks/one/items/30')
      .send({ status: 'fixed' })
      .expect(423, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'Cannot update an items status without a lock',
          'right message'
        );
        assert.end();
      });
  }
);
test(
  'PUT /tasks/:id/items:id - the status can be changed by the user who has the active lock',
  taskWithOneItemLockedByUserOne,
  function(assert) {
    assert.app
      .put('/tasks/one/items/30')
      .send({ lock: 'locked' })
      .expect(200, function(err) {
        if (err) return assert.end(err);
        assert.app
          .put('/tasks/one/items/30')
          .send({ status: 'fixed' })
          .expect(200, function(err, res) {
            if (err) return assert.end(err);
            assert.equal(res.body.status, 'fixed', 'the right status');
            assert.equal(
              res.body.lockedBy,
              null,
              'the lock was released because it was moved to a complete status'
            );
            assert.ok(checkLock.unlocked(res.body), 'is unlocked');
            assert.end();
          });
      });
  }
);
test(
  'PUT /tasks/:id/items:id - an active lock cannot be changed by a non-locking user',
  taskWithOneItemLockedByUserTwo,
  function(assert) {
    assert.app
      .put('/tasks/one/items/30')
      .send({ lock: 'unlocked' })
      .expect(423, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'This item is currently locked by usertwo'
        );
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - an active lock can be changed by the locking user',
  taskWithOneItemLockedByUserOne,
  function(assert) {
    assert.app
      .put('/tasks/one/items/30')
      .send({ lock: 'locked' })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.lockedBy, 'userone', 'userone holds the lock');
        assert.ok(checkLock.locked(res.body), 'locked');
        assert.app
          .put('/tasks/one/items/30')
          .send({ lock: 'unlocked' })
          .expect(200, function(err, res) {
            if (err) return assert.end(err);
            assert.equal(res.body.lockedBy, null, 'no one holds the lock');
            assert.ok(checkLock.unlocked(res.body), 'not locked');
            assert.end();
          });
      });
  }
);

test(
  'PUT /tasks/:id/items:id - create an item with the minimum attributes',
  taskWithNoItems,
  function(assert) {
    assert.app
      .put('/tasks/one/items/test')
      .send({
        pin: [8, 8],
        instructions: 'test'
      })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.ok(
          checkLock.unlocked(res.body),
          'lock ends before the api responds'
        );
        var item = removeDates(res.body);
        assert.deepEqual(item, {
          id: 'test',
          task_id: 'one',
          pin: {
            type: 'Point',
            coordinates: [8, 8]
          },
          featureCollection: {
            type: 'FeatureCollection',
            features: []
          },
          status: 'open',
          lockedBy: null,
          createdBy: 'userone',
          instructions: 'test'
        });
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items:id - an item update or create requests cannot have unexpected body content',
  taskWithNoItems,
  function(assert) {
    assert.app
      .put('/tasks/one/items/30')
      .send({ random: 'is bad' })
      .expect(400, function(err, res) {
        if (err) return assert.end();
        assert.equal(
          res.body.message,
          'Request contains unexpected attributes',
          'has right message'
        );
        assert.end();
      });
  }
);

test(
  'PUT /tasks/:id/items/:id - bulk upload items with a linear wait',
  taskWithNoItems,
  function(assert) {
    const TOTAL_REQUESTS = 10;
    const requests = [];
    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { type: 'node' },
          geometry: {
            type: 'Point',
            coordinates: [30, 30]
          }
        }
      ]
    };
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
      requests.push(
        delay(i * 50).then(() =>
          assert.app
            .put(`/tasks/one/items/item-${i}`)
            .send({
              pin: [30, 30],
              instructions: 'test',
              featureCollection
            })
            .expect(200)
        )
      );
    }
    Promise.all(requests)
      .then(function() {
        assert.end();
      })
      .catch(function(err) {
        return assert.end(err);
      });
  }
);

test(
  'PUT /tasks/:id/items/:id - bulk upload items without waiting',
  taskWithNoItems,
  function(assert) {
    const TOTAL_REQUESTS = 10;
    const requests = [];
    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { type: 'node' },
          geometry: {
            type: 'Point',
            coordinates: [30, 30]
          }
        }
      ]
    };
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
      requests.push(
        assert.app
          .put(`/tasks/one/items/item-${i}`)
          .send({
            pin: [30, 30],
            instructions: 'test',
            featureCollection
          })
          .expect(200)
      );
    }
    Promise.all(requests)
      .then(function() {
        assert.end();
      })
      .catch(function(err) {
        return assert.end(err);
      });
  }
);
