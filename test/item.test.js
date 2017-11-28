'use strict';
const _ = require('lodash');

const test = require('./lib/test');
const removeDates = require('./lib/remove-dates');
const checkLock = require('./lib/check-lock');
const turfRandom = require('@turf/random');
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
        lockedTill: new Date(Date.now() - 1000 * 15 * 60),
        status: 'open'
      },
      {
        id: '32',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60),
        status: 'fixed'
      },
      {
        id: '33',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now()),
        status: 'noterror'
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
        lockedTill: new Date(Date.now()),
        createdAt: '2017-09-03T17:49:25.928Z'
      },
      {
        id: '60',
        pin: [30, 30],
        lockedBy: 'userone',
        lockedTill: new Date(Date.now() - 1000 * 15 * 60),
        createdAt: '2017-10-03T17:49:25.928Z'
      },
      {
        id: '62',
        pin: [30, 30],
        lockedBy: 'usertwo',
        lockedTill: new Date(Date.now() + 2 * 1000 * 15 * 60),
        createdAt: '2017-10-05T17:49:25.928Z'
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

const filterItemsFixture = [
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Project 1',
    items: [
      {
        id: '10',
        pin: [0, 0]
      },
      {
        id: '30',
        pin: [30, 30]
      },
      {
        id: '40',
        pin: [0, 0],
        status: 'closed'
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

const itemsWithTags = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Project 0',
    items: [
      {
        id: '111111',
        pin: [77, 77],
        tags: ['My Tag', 'My Other Tag']
      },
      {
        id: '222222',
        pin: [33, 33],
        tags: ['My Other Tag']
      },
      {
        id: '333333',
        pin: [44, 44]
      }
    ],
    tags: [
      {
        name: 'My Tag'
      },
      {
        name: 'My Other Tag'
      }
    ]
  }
];

const delay = time => new Promise(res => setTimeout(res, time));

/* GET /projects/:project/items */

test(
  'GET /:version/projects/:id/items - get a project that is not in the db',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/v1/projects/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/items')
      .set('authorization', token)
      .expect(404, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.ok(res.body.message, 'has message attr');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items - get a project without items',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/v1/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 0, 'has no items');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items - get a project with items',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get('/v1/projects/00000000-0000-0000-0000-000000000000/items')
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
  'GET /:version/projects/:id/items?page=X&page_size=Y - get a project with pagination',
  listItemsFixture,
  (assert, token) => {
    var requests = [
      assert.app
        .get(
          '/v1/projects/44444444-4444-4444-4444-444444444444/items?page=0&page_size=10'
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
        .get('/v1/projects/44444444-4444-4444-4444-444444444444/items?page=0')
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
          '/v1/projects/44444444-4444-4444-4444-444444444444/items?page=0&page_size=5'
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
          '/v1/projects/44444444-4444-4444-4444-444444444444/items?page=1&page_size=5'
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
          '/v1/projects/44444444-4444-4444-4444-444444444444/items?page=2&page_size=5'
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
          '/v1/projects/44444444-4444-4444-4444-444444444444/items?page=3&page_size=5'
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
          '/v1/projects/44444444-4444-4444-4444-444444444444/items?page=3000&page_size=5'
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
          '/v1/projects/44444444-4444-4444-4444-444444444444/items?page=0&page_size=0'
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
          '/v1/projects/44444444-4444-4444-4444-444444444444/items?page=-1&page_size=5'
        )
        .set('authorization', token)
        .expect(200)
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
  'GET /:version/projects/:id/items?status=<status> - filter items by status',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/44444444-4444-4444-4444-444444444444/items?status=noterror'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 1, 'should have 1 noterror item');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?from=<date>&to=<date> - filter items by date',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/44444444-4444-4444-4444-444444444444/items?from=2017-10-01&to=2017-10-10'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'date filtering should not error');
        assert.equal(
          res.body.length,
          2,
          'should have 2 items within date filter'
        );
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?from=<date> - filter items by from date',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/44444444-4444-4444-4444-444444444444/items?from=2017-11-01'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'date filtering by from should not error');
        assert.equal(
          res.body.length,
          9,
          'should have 9 items with from filter'
        );
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?to=<date> - filter items by to date',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/44444444-4444-4444-4444-444444444444/items?to=2017-10-04'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'date filtering by to should not error');
        assert.equal(res.body.length, 2, 'should have 2 items with to filter');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?from=<date>&to=<date> - filter items by invalid date',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/44444444-4444-4444-4444-444444444444/items?from=foobar'
      )
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err, 'invalid date filter does not error');
        assert.equal(
          res.body.message,
          'from parameter must be a valid ISO 8601 date string'
        );
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?bbox=<bbox> - flter items by bbox',
  filterItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/66666666-6666-6666-6666-666666666666/items?bbox=-1,-1,1,1'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'bbox query should not error');
        assert.equal(res.body.length, 2, 'bbox query should return 2 items');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?bbox=<bbox>&status=<status> - filter items by bbox and status',
  filterItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/66666666-6666-6666-6666-666666666666/items?bbox=-1,-1,1,1&status=open'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'bbox + status query should not error');
        assert.equal(
          res.body.length,
          1,
          'bbox + status query should return 1 item'
        );
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?lock=locked - get a project with locked items',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/22222222-2222-2222-2222-222222222222/items?lock=locked'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 3, 'should have 3 locked items');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?lock=locked - get a project with locked items with Project3 data',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/33333333-3333-3333-3333-333333333333/items?lock=locked'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 1, 'should have 1 locked items');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?lock=unlocked - get a project with unlocked items',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/22222222-2222-2222-2222-222222222222/items?lock=unlocked'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 1, 'should have one unlocked item');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?lock=unlocked - get a project with unlocked items with Project3 data',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/33333333-3333-3333-3333-333333333333/items?lock=unlocked'
      )
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 2, 'should have 2 unlocked items');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:id/items?tags=<tags> - filter items by tags',
  itemsWithTags,
  (assert, token) => {
    assert.app
      .get('/v1/projects/00000000-0000-0000-0000-000000000000/tags')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'fetching project tags should not error');
        const filterTag = res.body.filter(tag => {
          return tag.name === 'My Tag';
        });
        const tagId = filterTag[0].id;
        assert.app
          .get(
            `/v1/projects/00000000-0000-0000-0000-000000000000/items?tags=${
              tagId
            }`
          )
          .set('authorization', token)
          .expect(200, (err, res) => {
            assert.ifError(err, 'filtering by tag does not error');
            assert.equal(
              res.body.length,
              1,
              'returns one item with tag filter'
            );
            assert.end();
          });
      });
  }
);

test(
  'GET /:version/projects/:id/items?tags=<tags> - filter items by multiple tags',
  itemsWithTags,
  (assert, token) => {
    assert.app
      .get('/v1/projects/00000000-0000-0000-0000-000000000000/tags')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'fetching project tags should not error');
        const tagIds = res.body
          .map(tag => {
            return tag.id;
          })
          .join(',');
        assert.app
          .get(
            `/v1/projects/00000000-0000-0000-0000-000000000000/items?tags=${
              tagIds
            }`
          )
          .set('authorization', token)
          .expect(200, (err, res) => {
            assert.ifError(err, 'filtering by tag does not error');
            assert.equal(
              res.body.length,
              2,
              'returns two item with multi-tag filter'
            );
            assert.end();
          });
      });
  }
);

test(
  'GET /:version/projects/:id/items?lock=unlocked - get a project with unlocked items with Project3 data',
  listItemsFixture,
  (assert, token) => {
    assert.app
      .get(
        '/v1/projects/33333333-3333-3333-3333-333333333333/items?lock=unlocked'
      )
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
  'POST /:version/projects/:project/items/:item - invalid feature collection properties',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '1234',
        instructions: 'Fix this',
        pin: [0, 0],
        featureCollection: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [0, 0]
              },
              properties: {
                'tofix:category': 'cat',
                invalidProp: 'foobar'
              }
            }
          ]
        }
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.message[0], 'Keys must have a type prefix');
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/items/:item - invalid body attributes',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
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
  'POST /:version/projects/:project/items/:item - POST large items',
  getItemsFixture,
  (assert, token) => {
    const randomFc = turfRandom('points', 10000);
    randomFc.features = randomFc.features.map(feature => {
      feature.properties['tofix:category'] = 'cat';
      return feature;
    });
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '1234',
        instructions: 'fix',
        pin: [0, 0],
        featureCollection: randomFc
      })
      .expect(200, err => {
        assert.ifError(err, 'should not error');
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/items/:item - missing required body attributes',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
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
  'POST /:version/projects/:project/items/:item - bad ID',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
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
  'POST /:version/projects/:project/items/:item - bad instructions',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
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
  'POST /:version/projects/:project/items/:item - bad pin 1',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
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
  'POST /:version/projects/:project/items/:item - bad pin 2',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
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
  'POST /:version/projects/:project/items/:item - posting item with same id raises 400',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '30',
        pin: [0, 0],
        instructions: 'tofix'
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(
          res.body.message,
          'Item with this id already exists',
          'error message is correct'
        );
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/items/:item',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
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
          metadata: {},
          id: '405270',
          project_id: '11111111-1111-1111-1111-111111111111',
          pin: { type: 'Point', coordinates: [0, 0] },
          quadkey: '3000000000000',
          instructions: 'Fix this item',
          featureCollection: { type: 'FeatureCollection', features: [] },
          createdBy: 'test-user',
          lockedBy: null,
          sort: 0
        });
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:project/items/:item - posting metadata works',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        id: '405270',
        instructions: 'Fix this item',
        pin: [0, 0],
        metadata: {
          foo: 'bar'
        }
      })
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(
          res.body.metadata.foo,
          'bar',
          'metadata saved and returned correctly'
        );
        assert.end();
      });
  }
);

test(
  'POST /:version/projects/:id/items - bulk upload items with a linear wait',
  projectWithOneUnlockedItem,
  (assert, token) => {
    const TOTAL_REQUESTS = 10;
    const requests = [];
    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { 'tofix:category': 'cat' },
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
            .post(`/v1/projects/00000000-0000-0000-0000-000000000000/items`)
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
  'POST /:version/projects/:id/items - bulk upload items without waiting',
  projectWithOneUnlockedItem,
  (assert, token) => {
    const TOTAL_REQUESTS = 10;
    const requests = [];
    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { 'tofix:category': 'cat' },
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
          .post(`/v1/projects/00000000-0000-0000-0000-000000000000/items`)
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

test(
  'GET /:version/projects/:project/items/:item',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .get('/v1/projects/11111111-1111-1111-1111-111111111111/items/30')
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
          quadkey: '1221210321032',
          status: 'open',
          lockedBy: null,
          featureCollection: {
            type: 'FeatureCollection',
            features: []
          },
          createdBy: 'userone',
          instructions: 'created via the tests',
          sort: 0
        });
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project/items/:item - updating an item with an invalid pin errors',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
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
  'PUT /:version/projects/:id/items:id - updating an item with an invalid feature collection errors',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
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
  'PUT /:version/projects/:id/items:id - update an item',
  projectWithOneUnlockedItem,
  (assert, token) => {
    var fc = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { 'tofix:category': 'cat' },
          geometry: {
            type: 'Point',
            coordinates: [30, 30]
          }
        }
      ]
    };
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
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
  'PUT /:version/projects/:id/items:id - update an item shouldnt change the featureCollection',
  projectWithOneUnlockedItem,
  (assert, token) => {
    var fc = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { 'tofix:category': 'cat' },
          geometry: {
            type: 'Point',
            coordinates: [30, 30]
          }
        }
      ]
    };
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
      .send({ featureCollection: fc })
      .expect(200, function(err) {
        if (err) return assert.end(err);
        assert.app
          .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
          .set('authorization', token)
          .send({ lock: 'unlocked' })
          .expect(200, function(err, res) {
            if (err) return assert.end(err);
            assert.ok(checkLock.unlocked(res.body), 'the item is locked');
            var item = removeDates(res.body);
            assert.deepEqual(item.featureCollection, fc);
            assert.end();
          });
      });
  }
);

test(
  'PUT /:version/projects/:id/items:id - the lock can be activated via {lock: locked}',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
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
  'PUT /:version/projects/:project/items/:item - the lock can be deactivated via {lock: unlocked}',
  projectWithOneItemLockedByUserOne,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
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
  'PUT /:version/projects/:id/items:id - the status cannot be changed by a user who doesnt have an active lock',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
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
  'PUT /:version/projects/:id/items:id - the status can be changed by the user who has the active lock',
  projectWithOneItemLockedByUserOne,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
      .send({ lock: 'locked' })
      .expect(200, function(err) {
        if (err) return assert.end(err);
        assert.app
          .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
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
  'PUT /:version/projects/:id/items:id - an active lock cannot be changed by a non-locking user',
  projectWithOneItemLockedByUserTwo,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
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
  'PUT /:version/projects/:id/items:id - an active lock can be changed by the locking user',
  projectWithOneItemLockedByUserOne,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
      .send({ lock: 'locked' })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.lockedBy, 'test-user');
        assert.ok(checkLock.locked(res.body), 'locked');
        assert.app
          .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
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
  'PUT /:version/projects/:id/items/:id - an item update cannot have unexpected body content',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/30')
      .set('authorization', token)
      .send({ random: 'is bad' })
      .expect(400, function(err, res) {
        if (err) return assert.end();
        assert.equal(
          res.body.message,
          'Request contains unexpected attribute random',
          'has right message'
        );
        assert.end();
      });
  }
);
test(
  'DELETE /:version/projects/:id/items/:id - DELETE deletes an item',
  filterItemsFixture,
  (assert, token) => {
    assert.app
      .delete('/v1/projects/66666666-6666-6666-6666-666666666666/items/30')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'DELETE item does not error');
        assert.equal(res.body.id, '30', 'item id returned');
        assert.equal(
          res.body.project,
          '66666666-6666-6666-6666-666666666666',
          'project id returned'
        );
        assert.app
          .get('/v1/projects/66666666-6666-6666-6666-666666666666/items')
          .set('authorization', token)
          .expect(200, (err, res) => {
            const results = res.body;
            const resultIds = results.map(item => item.id);
            assert.equal(results.length, 2, '2 items returned after delete');
            assert.equal(
              resultIds.indexOf('30'),
              -1,
              'item id not in list result'
            );
            assert.end();
          });
      });
  }
);

/**
 * update-all-item test
 */

test(
  'PUT /:version/projects/:project/items - invalid body array',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .put('/v1/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        ids: '405270',
        status: 'fixed'
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.message, 'body.ids should be an array');
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project/items - valid body array',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .put('/v1/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        ids: ['30'],
        status: 'fixed'
      })
      .expect(200, () => {
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project/items - body array should have id',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .put('/v1/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        kid: '405270'
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.message, 'body.ids should be an array');
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project/items - try change both lock and status',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .put('/v1/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        ids: ['405270'],
        status: 'open',
        lock: 'locked'
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'It is invalid to set the status and change the lock in one request'
        );
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project/items - body array should throw error if body.length >500',
  getItemsFixture,
  (assert, token) => {
    assert.app
      .put('/v1/projects/11111111-1111-1111-1111-111111111111/items')
      .set('authorization', token)
      .send({
        ids: _.range(0, 501),
        lock: 'locked'
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Only allowed to update a maximum of 500 items and a minimum of 1 item at a time'
        );
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project/items - basic update array of items',
  itemsWithTags,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items/111111')
      .set('authorization', token)
      .send({ lock: 'locked' })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.ok(checkLock.locked(res.body), 'the item is locked');
        assert.app
          .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
          .set('authorization', token)
          .send({
            ids: ['111111'],
            lock: 'unlocked'
          })
          .expect(200, (err, res) => {
            assert.equal(res.body.length, 1, 'should update 1 items');
            assert.ok(checkLock.unlocked(res.body[0]), 'is unlocked');
            assert.end();
          });
      });
  }
);

test(
  'PUT /:version/projects/:project/items - one item locked by another user',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Project 0',
      items: [
        {
          id: '1',
          pin: [30, 30],
          lockedBy: 'usertwo',
          lockedTill: new Date(Date.now() + 1000 * 15 * 60)
        },
        {
          id: '2',
          pin: [30, 30],
          lockedBy: 'test-user',
          lockedTill: new Date(Date.now() + 1000 * 15 * 60)
        }
      ]
    }
  ],
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({
        ids: ['1', '2'],
        lock: 'unlocked'
      })
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
  'PUT /:version/projects/:project/items - both items locked by another user',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Project 0',
      items: [
        {
          id: '1',
          pin: [30, 30],
          lockedBy: 'usertwo',
          lockedTill: new Date(Date.now() + 1000 * 15 * 60)
        },
        {
          id: '2',
          pin: [30, 30],
          lockedBy: 'usertwo',
          lockedTill: new Date(Date.now() + 1000 * 15 * 60)
        }
      ]
    }
  ],
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({
        ids: ['1', '2'],
        lock: 'locked'
      })
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
  'PUT /:version/projects/:project/items - both items available',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Project 0',
      items: [
        {
          id: '1',
          pin: [30, 30]
        },
        {
          id: '2',
          pin: [30, 30]
        }
      ]
    }
  ],
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({
        ids: ['1', '2'],
        lock: 'locked'
      })
      .expect(200, (err, res) => {
        assert.equal(res.body.length, 2, 'should update 2 items');
        assert.ok(checkLock.locked(res.body[0]), 'first is locked');
        assert.ok(checkLock.locked(res.body[1]), 'second is locked');
        assert.equal(
          res.body[0].lockedBy,
          'test-user',
          'item locked by the current user'
        );
        assert.equal(
          res.body[1].lockedBy,
          'test-user',
          'item locked by the current user'
        );
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:id/items - the lock can be activated via {lock: locked}',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({ lock: 'locked', ids: ['30'] })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.ok(checkLock.locked(res.body[0]), 'the item is locked');
        assert.equal(
          res.body[0].lockedBy,
          'test-user',
          'item locked by the current user'
        );
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project/items - the lock can be deactivated via {lock: unlocked}',
  projectWithOneItemLockedByUserOne,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({ lock: 'unlocked', ids: ['30'] })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.ok(checkLock.unlocked(res.body[0]), 'the item is unlocked');
        assert.equal(
          res.body[0].lockedBy,
          null,
          'item locked by the current user'
        );
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:id/items - the status cannot be changed by a user who doesnt have an active lock',
  projectWithOneUnlockedItem,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({ status: 'fixed', ids: ['30'] })
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
  'PUT /:version/projects/:id/items- the status can be changed by the user who has the active lock',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Project 0',
      items: [
        {
          id: '30',
          pin: [30, 30]
        },
        {
          id: '31',
          pin: [30, 30]
        }
      ]
    }
  ],
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({ lock: 'locked', ids: ['30', '31'] })
      .expect(200, function(err) {
        if (err) return assert.end(err);
        assert.app
          .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
          .set('authorization', token)
          .send({ status: 'fixed', ids: ['30', '31'] })
          .expect(200, function(err, res) {
            if (err) return assert.end(err);
            assert.equal(
              res.body[0].status,
              'fixed',
              'item1 has the right status'
            );
            assert.equal(
              res.body[1].status,
              'fixed',
              'item2 has the right status'
            );

            assert.equal(
              res.body[0].lockedBy,
              null,
              'the lock1 was released because it was moved to a complete status'
            );
            assert.equal(
              res.body[1].lockedBy,
              null,
              'the lock2 was released because it was moved to a complete status'
            );

            assert.ok(checkLock.unlocked(res.body[0]), 'item1 is unlocked');
            assert.ok(checkLock.unlocked(res.body[1]), 'item2 is unlocked');

            assert.end();
          });
      });
  }
);

test(
  'PUT /:version/projects/:id/items - an active lock cannot be changed by a non-locking user',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Project 0',
      items: [
        {
          id: '30',
          pin: [30, 30],
          lockedBy: 'usertwo',
          lockedTill: new Date(Date.now() + 1000 * 15 * 60)
        },
        {
          id: '31',
          pin: [30, 30],
          lockedBy: 'usertwo',
          lockedTill: new Date(Date.now() - 1000 * 15 * 60)
        }
      ]
    }
  ],
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({ lock: 'unlocked', ids: ['30', '31'] })
      .expect(423, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(
          res.body.message,
          'This item is currently locked by usertwo'
        );
        assert.app
          .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
          .set('authorization', token)
          .send({ lock: 'unlocked', ids: ['31'] })
          .expect(200, function(err, res) {
            if (err) return assert.end(err);
            assert.ok(checkLock.unlocked(res.body[0]), 'item31 is unlocked');
            assert.end();
          });
      });
  }
);

test(
  'PUT /:version/projects/:id/items - an active lock can be changed by the locking user',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Project 0',
      items: [
        {
          id: '30',
          pin: [30, 30],
          lockedBy: 'test-user',
          lockedTill: new Date(Date.now() + 1000 * 15 * 60)
        },
        {
          id: '31',
          pin: [30, 30],
          lockedBy: 'test-user',
          lockedTill: new Date(Date.now() + 1000 * 15 * 60)
        },
        {
          id: '32',
          pin: [30, 30],
          lockedBy: 'usertwo',
          lockedTill: new Date(Date.now() + 1000 * 15 * 60)
        }
      ]
    }
  ],
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({ lock: 'locked', ids: ['30', '31'] })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.length, 2, 'should change 2 ids only');
        assert.equal(res.body[0].lockedBy, 'test-user');
        assert.equal(res.body[1].lockedBy, 'test-user');

        assert.ok(checkLock.locked(res.body[0]), 'item30 locked');
        assert.ok(checkLock.locked(res.body[1]), 'item31 locked');

        assert.app
          .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
          .set('authorization', token)
          .send({ lock: 'unlocked', ids: ['31', '30'] })
          .expect(200, function(err, res) {
            if (err) return assert.end(err);
            assert.equal(res.body.length, 2, 'should change 2 ids only');
            assert.equal(
              res.body[0].lockedBy,
              null,
              'item30 no one holds the lock'
            );
            assert.equal(
              res.body[1].lockedBy,
              null,
              'item31 no one holds the lock'
            );

            assert.ok(checkLock.unlocked(res.body[0]), 'item30 not locked');
            assert.ok(checkLock.unlocked(res.body[1]), 'item31 not locked');
            assert.app
              .get('/v1/projects/00000000-0000-0000-0000-000000000000/items/32')
              .set('authorization', token)
              .expect(200, function(err, res) {
                if (err) return assert.end(err);
                assert.equal(
                  res.body.lockedBy,
                  'usertwo',
                  "doesn't change else's lock"
                );
                assert.end();
              });
          });
      });
  }
);

const variedData = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Project 0',
  items: [
    {
      id: '30',
      pin: [30, 30],
      status: 'fixed'
    },
    {
      id: '31',
      pin: [30, 30],
      status: 'fixed'
    },
    {
      id: '32',
      pin: [-122.45819852581384, 37.746826497065165],
      quadkey: '0230102033323',
      instructions: 'todo',
      createdBy: 'mapbox-machine',
      status: 'fixed',
      lockedTill: '2017-11-28T07:10:37.346Z',
      lockedBy: null,
      featureCollection: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            },
            properties: {
              'tofix:category': 'cat',
              invalidProp: 'foobar'
            }
          }
        ]
      },
      metadata: {
        test: 'metadata'
      },
      createdAt: '2017-11-21T21:02:23.442Z',
      updatedAt: '2017-11-28T07:10:37.701Z'
    }
  ]
};

test(
  'PUT /:version/projects/:id/items- relevant item keys should remain intact when the status can be changed by the user who has the active lock',
  [variedData],
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({ lock: 'locked', ids: ['30', '32'] })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        var response = _.cloneDeep(res.body[1]);
        var toMatch = _.cloneDeep(variedData.items[2]);

        // createdAt
        assert.equal(!!response['createdAt'], true);
        response = _.omit(response, 'createdAt');
        toMatch = _.omit(toMatch, 'createdAt');

        // updatedAt
        assert.equal(!!response['updatedAt'], true);
        response = _.omit(response, 'updatedAt');
        toMatch = _.omit(toMatch, 'updatedAt');

        // lockedTill
        assert.equal(
          new Date(response['lockedTill']) <
            new Date(Date.now() + 1000 * 60 * 15),
          true,
          'should be less than 15min'
        );
        assert.equal(
          new Date(response['lockedTill']) >
            new Date(Date.now() + 1000 * 60 * 14),
          true,
          'should be more than 14min'
        );
        response = _.omit(response, 'lockedTill');
        toMatch = _.omit(toMatch, 'lockedTill');

        // pin
        assert.deepEqual(response.pin, {
          type: 'Point',
          coordinates: toMatch.pin
        });
        response = _.omit(response, 'pin');
        toMatch = _.omit(toMatch, 'pin');

        // lockedBy
        assert.equal(response['lockedBy'], 'test-user');
        response = _.omit(response, 'lockedBy');
        toMatch = _.omit(toMatch, 'lockedBy');

        // project_id
        assert.equal(response['project_id'], variedData.id);
        response = _.omit(response, 'project_id');
        toMatch = _.omit(toMatch, 'project_id');

        // sort
        response = _.omit(response, 'sort');
        toMatch = _.omit(toMatch, 'sort');

        // deep equal anything left
        assert.deepEqual(response, toMatch);
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:id/items - relevant item keys should remain intact when locking ',
  [variedData],
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({ lock: 'locked', ids: ['32'] })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.length, 1, 'should change 1 ids only');
        assert.equal(res.body[0].lockedBy, 'test-user');
        assert.ok(checkLock.locked(res.body[0]), 'item32 locked');

        assert.app
          .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
          .set('authorization', token)
          .send({ lock: 'unlocked', ids: ['32'] })
          .expect(200, function(err, res) {
            if (err) return assert.end(err);
            var response = _.cloneDeep(res.body[0]);
            var toMatch = _.cloneDeep(variedData.items[2]);

            // createdAt
            assert.equal(!!response['createdAt'], true);
            response = _.omit(response, 'createdAt');
            toMatch = _.omit(toMatch, 'createdAt');

            // updatedAt
            assert.equal(!!response['updatedAt'], true);
            response = _.omit(response, 'updatedAt');
            toMatch = _.omit(toMatch, 'updatedAt');

            // lockedTill
            assert.equal(
              new Date(response['lockedTill']) < new Date(Date.now()),
              true,
              'should be in the past'
            );
            response = _.omit(response, 'lockedTill');
            toMatch = _.omit(toMatch, 'lockedTill');

            // pin
            assert.deepEqual(response.pin, {
              type: 'Point',
              coordinates: toMatch.pin
            });
            response = _.omit(response, 'pin');
            toMatch = _.omit(toMatch, 'pin');

            // lockedBy
            assert.equal(response['lockedBy'], null);
            response = _.omit(response, 'lockedBy');
            toMatch = _.omit(toMatch, 'lockedBy');

            // project_id
            assert.equal(response['project_id'], variedData.id);
            response = _.omit(response, 'project_id');
            toMatch = _.omit(toMatch, 'project_id');

            // sort
            response = _.omit(response, 'sort');
            toMatch = _.omit(toMatch, 'sort');

            // deep equal anything left
            assert.deepEqual(response, toMatch);
            assert.end();
          });
      });
  }
);

test(
  'PUT /:version/projects/:id/items - relevant item keys should remain intact when locking ',
  [variedData],
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
      .set('authorization', token)
      .send({ lock: 'locked', ids: ['30', '32'] })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.equal(res.body.length, 2, 'should change 1 ids only');
        assert.equal(res.body[0].lockedBy, 'test-user');
        assert.ok(checkLock.locked(res.body[0]), 'item32 locked');
        // change status
        assert.app
          .put('/v1/projects/00000000-0000-0000-0000-000000000000/items')
          .set('authorization', token)
          .send({ status: 'noterror', ids: ['30', '32'] })
          .expect(200, function(err, res) {
            for (var i = 0; i < 2; i++) {
              var response = _.cloneDeep(res.body[i]);
              var toMatch = _.cloneDeep(
                variedData.items.find(item => item.id == response.id)
              );
              // createdAt
              assert.equal(!!response['createdAt'], true);
              response = _.omit(response, 'createdAt');
              toMatch = _.omit(toMatch, 'createdAt');

              // updatedAt
              assert.equal(!!response['updatedAt'], true);
              response = _.omit(response, 'updatedAt');
              toMatch = _.omit(toMatch, 'updatedAt');

              // lockedTill
              assert.equal(
                new Date(response['lockedTill']) < new Date(Date.now()),
                true,
                'should be in the past'
              );
              response = _.omit(response, 'lockedTill');
              toMatch = _.omit(toMatch, 'lockedTill');

              // pin
              assert.deepEqual(response.pin, {
                type: 'Point',
                coordinates: toMatch.pin
              });
              response = _.omit(response, 'pin');
              toMatch = _.omit(toMatch, 'pin');

              // lockedBy
              assert.equal(response['lockedBy'], null);
              response = _.omit(response, 'lockedBy');
              toMatch = _.omit(toMatch, 'lockedBy');

              // project_id
              assert.equal(response['project_id'], variedData.id);
              response = _.omit(response, 'project_id');
              toMatch = _.omit(toMatch, 'project_id');

              // sort
              response = _.omit(response, 'sort');
              toMatch = _.omit(toMatch, 'sort');
            }
            assert.end();
          });
      });
  }
);
