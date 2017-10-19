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
        name: 'Item 77',
        pin: [77, 77]
      },
      {
        id: '30',
        name: 'Item 30',
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
        name: 'Item 30',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      },
      {
        id: '31',
        name: 'Item 31',
        pin: [31, 31]
      },
      {
        id: '32',
        name: 'Item 32',
        pin: [32, 32],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 1000 * 15 * 60)
      },
      {
        id: '33',
        name: 'Item 33',
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
        name: 'Item 30',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60)
      },
      {
        id: '31',
        name: 'Item 31',
        pin: [31, 31],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '32',
        name: 'Item 32',
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
        name: 'Item 30',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60)
      },
      {
        id: '32',
        name: 'Item 32',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '33',
        name: 'Item 33',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now())
      },
      {
        id: '40',
        name: 'Item 40',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60)
      },
      {
        id: '42',
        name: 'Item 42',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '43',
        name: 'Item 43',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now())
      },
      {
        id: '50',
        name: 'Item 50',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60)
      },
      {
        id: '52',
        name: 'Item 52',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '53',
        name: 'Item 53',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now())
      },
      {
        id: '60',
        name: 'Item 60',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60)
      },
      {
        id: '62',
        name: 'Item 62',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60)
      },
      {
        id: '63',
        name: 'Item 63',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now())
      }
    ]
  }
];

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
  'GET /projects/:id/items - get items without providing auth',
  listItemsFixture,
  assert => {
    assert.app
      .get('/projects/00000000-0000-0000-0000-000000000000/items')
      .expect(401, (err, res) => {
        assert.equal(res.body.error, 'Token Authentication Failed');
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
  'GET /projects/:id/items?lock=locked - get a project with locked items with lockers2 data',
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
  'GET /projects/:id/items?lock=unlocked - get a project with unlocked items with lockers2 data',
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
  'GET /projects/:id/items?lock=unlocked - get a project with unlocked items with lockers2 data',
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

const getItemsFixture = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Project 1',
    items: [
      {
        id: '30',
        name: 'Item 30',
        pin: [30, 30]
      }
    ]
  }
];

test(
  'CREATE /projects/:project/items/:item - invalid body attributes',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '405270',
        name: 'My Item',
        instructions: 'Fix this item',
        pin: [0, 0],
        invalidAttr: true
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Request contains unexpected attributes'
        );
        assert.end();
      });
  }
);

test(
  'CREATE /projects/:project/items/:item - missing required body attributes',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({ id: '405270', name: 'My Item', instructions: 'Fix this item' })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.message, 'pin is required');
        assert.end();
      });
  }
);

test(
  'CREATE /projects/:project/items/:item',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '405270',
        name: 'My Item',
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
          name: 'My Item',
          instructions: 'Fix this item',
          featureCollection: { type: 'FeatureCollection', features: [] },
          createdBy: 'test-user',
          lockedBy: null
        });
        assert.end();
      });
  }
);

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
        name: 'Item 30',
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
