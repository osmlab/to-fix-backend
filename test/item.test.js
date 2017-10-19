'use strict';

const test = require('./lib/test');
const removeDates = require('./lib/remove-dates');
const checkLock = require('./lib/check-lock');

const listItemsFixture = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '77',
        pin: [77, 77]
      },
      {
        id: '30',
        pin: [30, 30]
      }
    ]
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Project 1'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Project 2',
    items: [
      {
        id: '30',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      },
      {
        id: '31',
        pin: [31, 31]
      },
      {
        id: '32',
        pin: [32, 32],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      },
      {
        id: '33',
        pin: [33, 33],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      }
    ]
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Project 3',
    items: [
      {
        id: '30',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60)
      },
      {
        id: '31',
        pin: [31, 31],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '32',
        pin: [32, 32],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now())
      }
    ]
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Project 4',
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
      },
      {
        id: '40',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60)
      },
      {
        id: '42',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '43',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now())
      },
      {
        id: '50',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60)
      },
      {
        id: '52',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '53',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now())
      },
      {
        id: '60',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60)
      },
      {
        id: '62',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '63',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now())
      }
    ]
  }
];
const getItemsFixture = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Project 1',
    items: [
      {
        id: '30',
        pin: [30, 30]
      }
    ]
  }
];
const projectWithOneUnlockedItem = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '30',
        pin: [30, 30]
      }
    ]
  }
];
const projectWithOneItemLockedByUserTwo = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
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
const projectWithOneItemLockedByUserOne = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '30',
        pin: [30, 30],
        lockedBy: 'test-user',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      }
    ]
  }
];
const delay = time => new Promise(res => setTimeout(res, time));

/* GET /projects/:project/items */

test(
  'GET /projects/:id/items - get a project that is not in the db',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/projects/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/items')
      .set('authorization', token)
      .expect(404, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.ok(res.body.message, 'has message attr');
        assert.end();
      });
  }
);

test(
  'GET /projects/:id/items - get a project without items',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 0, 'has no items');
        assert.end();
      });
  }
);

test(
  'GET /projects/:id/items - get a project with items',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 2, 'has right number of items');
        var items = res.body.reduce(function(m, i) {
          m[i.id] = removeDates(i);
          return m;
        }, {});
        assert.equal(
          items['30'].project_id,
          '00000000-0000-0000-0000-000000000000',
          'item 30 should have the right project'
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
          items['77'].project_id,
          '00000000-0000-0000-0000-000000000000',
          'item 77 should have the right project'
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
  }
);

test(
  'GET /projects/:id/items?page=X&page_size=Y - get a project with pagination',
  listItemsFixture,
  (assert, token) => {
    var requests = [
      assert.app
        .get(
          '/projects/44444444-4444-4444-4444-444444444444/items?page=0&page_size=10'
        )
        .set('authorization', token)
        .expect(200)
        .then(res => {
          assert.equal(
            res.body.length,
            10,
            'page 0 with size 10 should have 10 items'
          );
        }),
      assert.app
        .get('/projects/44444444-4444-4444-4444-444444444444/items?page=0')
        .set('authorization', token)
        .expect(200)
        .then(function(res) {
          assert.equal(
            res.body.length,
            12,
            'page 0 with default size should have 12 items'
          );
        }),
      assert.app
        .get(
          '/projects/44444444-4444-4444-4444-444444444444/items?page=0&page_size=5'
        )
        .set('authorization', token)
        .expect(200)
        .then(function(res) {
          assert.equal(
            res.body.length,
            5,
            'page 0 with size 5 should have 5 items'
          );
        }),
      assert.app
        .get(
          '/projects/44444444-4444-4444-4444-444444444444/items?page=1&page_size=5'
        )
        .set('authorization', token)
        .expect(200)
        .then(function(res) {
          assert.equal(
            res.body.length,
            5,
            'page 1 with size 5 should have 5 items'
          );
        }),
      assert.app
        .get(
          '/projects/44444444-4444-4444-4444-444444444444/items?page=2&page_size=5'
        )
        .set('authorization', token)
        .expect(200)
        .then(function(res) {
          assert.equal(
            res.body.length,
            2,
            'page 2 with size 5 should have 2 items'
          );
        }),
      assert.app
        .get(
          '/projects/44444444-4444-4444-4444-444444444444/items?page=3&page_size=5'
        )
        .set('authorization', token)
        .expect(200)
        .then(function(res) {
          assert.equal(
            res.body.length,
            0,
            'page 3 with size 5 should have 0 items'
          );
        }),
      assert.app
        .get(
          '/projects/44444444-4444-4444-4444-444444444444/items?page=3000&page_size=5'
        )
        .set('authorization', token)
        .expect(200)
        .then(function(res) {
          assert.equal(
            res.body.length,
            0,
            'page 3000 with size 5 should have 0 items'
          );
        }),
      assert.app
        .get(
          '/projects/44444444-4444-4444-4444-444444444444/items?page=0&page_size=0'
        )
        .set('authorization', token)
        .expect(200)
        .then(function(res) {
          assert.equal(
            res.body.length,
            0,
            'page 0 with size 0 should have 0 items'
          );
        }),
      assert.app
        .get(
          '/projects/44444444-4444-4444-4444-444444444444/items?page=-1&page_size=5'
        )
        .set('authorization', token)
        .expect(400)
    ];

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
  'GET /projects/:id/items?lock=locked - get a project with locked items',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/projects/22222222-2222-2222-2222-222222222222/items?lock=locked')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 3, 'should have 3 locked items');
        assert.end();
      });
  }
);

test(
  'GET /projects/:id/items?lock=locked - get a project with locked items with Project3 data',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/projects/33333333-3333-3333-3333-333333333333/items?lock=locked')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 1, 'should have 1 locked items');
        assert.end();
      });
  }
);

test(
  'GET /projects/:id/items?lock=unlocked - get a project with unlocked items',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/projects/22222222-2222-2222-2222-222222222222/items?lock=unlocked')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 1, 'should have one unlocked item');
        assert.end();
      });
  }
);

test(
  'GET /projects/:id/items?lock=unlocked - get a project with unlocked items with Project3 data',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/projects/33333333-3333-3333-3333-333333333333/items?lock=unlocked')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 2, 'should have 2 unlocked items');
        assert.end();
      });
  }
);

test(
  'GET /projects/:id/items?lock=unlocked - get a project with unlocked items with Project3 data',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/projects/33333333-3333-3333-3333-333333333333/items?lock=unlocked')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 2, 'should have 2 unlocked items');
        assert.end();
      });
  }
);

/* POST /projects/:project/items */

test(
  'POST /projects/:project/items/:item - invalid body attributes',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '405270',
        instructions: 'Fix this item',
        pin: [0, 0],
        invalidAttr: true
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Request contains unexpected attribute invalidAttr'
        );
        assert.end();
      });
  }
);

test(
  'POST /projects/:project/items/:item - missing required body attributes',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({ id: '405270', instructions: 'Fix this item' })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'req.body.pin is a required body attribute'
        );
        assert.end();
      });
  }
);

test(
  'POST /projects/:project/items/:item - bad ID',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '******',
        instructions: 'Fix this item',
        pin: [0, 0]
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'An item must have a valid ID comprised only of letters, numbers, and hyphens'
        );
        assert.end();
      });
  }
);

test(
  'POST /projects/:project/items/:item - bad instructions',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '405270',
        instructions: 5,
        pin: [0, 0]
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'An item must have a valid instruction'
        );
        assert.end();
      });
  }
);

test(
  'POST /projects/:project/items/:item - bad pin 1',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '405270',
        instructions: 'Fix this item',
        pin: [0]
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'An item must have a pin in the [longitude, latitude] format'
        );
        assert.end();
      });
  }
);

test(
  'POST /projects/:project/items/:item - bad pin 2',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '405270',
        instructions: 'Fix this item',
        pin: ['-1000', '1000']
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Invalid Pin each element in a position must be a number'
        );
        assert.end();
      });
  }
);

test(
  'POST /projects/:project/items/:item',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '405270',
        instructions: 'Fix this item',
        pin: [0, 0]
      })
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        const item = removeDates(res.body);
        assert.deepEqual(item, {
          status: 'open',
          siblings: [],
          metadata: {},
          id: '405270',
          project_id: '11111111-1111-1111-1111-111111111111',
          pin: { type: 'Point', coordinates: [0, 0] },
          instructions: 'Fix this item',
          featureCollection: { type: 'FeatureCollection', features: [] },
          createdBy: 'test-user',
          lockedBy: null
        });
        assert.end();
      });
  }
);

test(
  'POST /projects/:id/items - bulk upload items with a linear wait',
  projectWithOneUnlockedItem,
  (assert, token) => {
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
            .post(`/projects/00000000-0000-0000-0000-000000000000/items`)
            .set('authorization', token)
            .send({
              id: `item${i}`,
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
  'POST /projects/:id/items - bulk upload items without waiting',
  projectWithOneUnlockedItem,
  (assert, token) => {
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
          .post(`/projects/00000000-0000-0000-0000-000000000000/items`)
          .set('authorization', token)
          .send({
            id: `item-${i}`,
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

/* GET /projects/:project/items/:item */

test('GET /projects/:project/items/:item', getItemsFixture, (assert, token) => {
  assert.app
    .get('/projects/11111111-1111-1111-1111-111111111111/items/30')
    .set('authorization', token)
    .expect(200, (err, res) => {
      assert.ifError(err, 'should not error');
      assert.ok(
        checkLock.unlocked(res.body),
        'lock ended before the test started'
      );
      var item = removeDates(res.body);
      assert.deepEqual(item, {
        id: '30',
        metadata: {},
        project_id: '11111111-1111-1111-1111-111111111111',
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
        instructions: 'created via the tests',
        siblings: []
      });
      assert.end();
    });
});

test(
  'PUT /projects/:project/items/:item - updating an item with an invalid pin errors',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
      .send({ pin: [] })
      .expect(400, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'An item must have a pin in the [longitude, latitude] format'
        );
        assert.end();
      });
  }
);

test(
  'PUT /projects/:id/items:id - updating an item with an invalid feature collection errors',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
      .send({ featureCollection: { type: 'FeatureCollection' } })
      .expect(400, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'Invalid featureCollection: "features" member required'
        );
        assert.end();
      });
  }
);

test(
  'PUT /projects/:id/items:id - update an item',
  projectWithOneUnlockedItem,
  (assert, token) => {
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
      .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
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
  'PUT /projects/:id/items:id - the lock can be activated via {lock: locked}',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
      .send({ lock: 'locked' })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.ok(checkLock.locked(res.body), 'the item is locked');
        assert.equal(
          res.body.lockedBy,
          'test-user',
          'item locked by the current user'
        );
        assert.end();
      });
  }
);

test(
  'PUT /projects/:project/items/:item - the lock can be deactivated via {lock: unlocked}',
  projectWithOneItemLockedByUserOne,
  (assert, token) => {
    assert.app
      .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
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
  'PUT /projects/:id/items:id - the status cannot be changed by a user who doesnt have an active lock',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
      .send({ status: 'fixed' })
      .expect(423, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'Cannot update an items status without a lock'
        );
        assert.end();
      });
  }
);

test(
  'PUT /projects/:id/items:id - the status can be changed by the user who has the active lock',
  projectWithOneItemLockedByUserOne,
  (assert, token) => {
    assert.app
      .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
      .send({ lock: 'locked' })
      .expect(200, function(err) {
        if (err) return assert.end(err);
        assert.app
          .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
          .set('authorization', token)
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
  'PUT /projects/:id/items:id - an active lock cannot be changed by a non-locking user',
  projectWithOneItemLockedByUserTwo,
  (assert, token) => {
    assert.app
      .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
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
  'PUT /projects/:id/items:id - an active lock can be changed by the locking user',
  projectWithOneItemLockedByUserOne,
  (assert, token) => {
    assert.app
      .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
      .send({ lock: 'locked' })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.lockedBy, 'test-user');
        assert.ok(checkLock.locked(res.body), 'locked');
        assert.app
          .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
          .set('authorization', token)
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
  'PUT /projects/:id/items:id - an item update cannot have unexpected body content',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
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
