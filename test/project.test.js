'use strict';

const removeDates = require('./lib/remove-dates');
const test = require('./lib/test');

const projectStatsFixture = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'My Project',
    tags: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'foo'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'bar'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'baz'
      }
    ],
    items: [
      {
        id: '11',
        pin: [0, 0],
        status: 'open',
        tags: ['foo']
      },
      {
        id: '22',
        pin: [1, 1],
        status: 'closed',
        tags: ['bar']
      },
      {
        id: '33',
        pin: [2, 2],
        status: 'open',
        tags: ['foo', 'bar', 'baz']
      }
    ]
  }
];

test(
  'GET /:version/projects',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'My Project'
    },
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'My Other Project'
    }
  ],
  (assert, token) => {
    assert.app
      .get('/v1/projects')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        assert.equal(res.body.length, 2, 'has two projects');

        var projects = res.body.reduce(function(memo, t) {
          t = removeDates(t);
          memo[t.id] = t;
          return memo;
        }, {});
        assert.deepEqual(
          projects['00000000-0000-0000-0000-000000000000'],
          {
            id: '00000000-0000-0000-0000-000000000000',
            name: 'My Project',
            metadata: {},
            quadkey_set_id: null
          },
          'project one should look like the fixture'
        );
        assert.deepEqual(
          projects['11111111-1111-1111-1111-111111111111'],
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'My Other Project',
            metadata: {},
            quadkey_set_id: null
          },
          'project two should look like the fixture'
        );
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/<project>/stats - get project stats',
  projectStatsFixture,
  (assert, token) => {
    assert.app
      .get('/v1/projects/00000000-0000-0000-0000-000000000000/stats')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'project stats should not error');
        const stats = res.body;
        assert.equal(stats.total, 3, 'total is correct');
        assert.equal(stats.tags.foo, 2, 'tag foo has correct count');
        assert.equal(stats.tags.bar, 2, 'tag bar has correct count');
        assert.equal(stats.tags.baz, 1, 'tag baz has correct count');
        assert.equal(stats.status.open, 2, 'status open has correct count');
        assert.equal(stats.status.closed, 1, 'status closed has correct count');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects?name=<name> - get project filtered by name',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'My Project'
    },
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'My Other Project'
    }
  ],
  (assert, token) => {
    assert.app
      .get('/v1/projects?name=My%20Project')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err);
        assert.equal(res.body.length, 1, '1 item returned');
        assert.equal(res.body[0].id, '00000000-0000-0000-0000-000000000000');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:project - get project with invalid UUID',
  [],
  (assert, token) => {
    assert.app
      .get('/v1/projects/invalid-uuid')
      .set('authorization', token)
      .expect(400, (err, res) => {
        assert.ifError(err);
        assert.equal(res.body.message, 'Project ID must be a valid UUID');
        assert.end();
      });
  }
);

test(
  'CREATE /:version/projects - invalid body attributes',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'My Project'
    }
  ],
  (assert, token) => {
    assert.app
      .post('/v1/projects')
      .set('authorization', token)
      .send({ name: 'My Other Project', invalidAttr: true })
      .expect(400)
      .end((err, res) => {
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
  'CREATE /:version/projects',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'My Project'
    }
  ],
  (assert, token) => {
    assert.app
      .post('/v1/projects')
      .set('authorization', token)
      .send({ name: 'My Other Project' })
      .expect(200, (err, res) => {
        assert.ifError(err);
        const t = removeDates(res.body);
        assert.ok(
          /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/.test(
            t.id
          )
        );
        assert.deepEqual(t.name, 'My Other Project');
        assert.deepEqual(t.metadata, {});
        assert.end();
      });
  }
);

test(
  'CREATE /:version/projects - correct error when duplication project creation',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'My Project'
    }
  ],
  (assert, token) => {
    assert.app
      .post('/v1/projects')
      .set('authorization', token)
      .send({ name: 'My Project' })
      .expect(400, (err, res) => {
        assert.ifError(err);
        assert.equal(
          res.body.message,
          'Project with name already exists',
          'correct error message'
        );
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:project - does not exist',
  [],
  (assert, token) => {
    assert.app
      .get('/v1/projects/00000000-0000-0000-0000-000000000000')
      .set('authorization', token)
      .expect(404)
      .end((err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(res.body.message, 'Not Found');
        assert.end();
      });
  }
);

test(
  'GET /:version/projects/:project',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'My Project',
      metadata: {},
      createdAt: '2017-10-18T00:00:00.000Z',
      updatedAt: '2017-10-18T00:00:00.000Z'
    }
  ],
  (assert, token) => {
    assert.app
      .get('/v1/projects/00000000-0000-0000-0000-000000000000')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        var t = removeDates(res.body);
        assert.deepEqual(
          t,
          {
            id: '00000000-0000-0000-0000-000000000000',
            name: 'My Project',
            quadkey_set_id: null,
            metadata: {}
          },
          'project one should look like the fixture without dates'
        );
        assert.end();
      });
  }
);

const oneproject = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'My Project',
    metadata: {
      keep: 'keep'
    }
  }
];

test(
  'PUT /:version/projects/:project - update project one',
  oneproject,
  (assert, token) => {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000')
      .set('authorization', token)
      .send({ metadata: { test: 'test' } })
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        var t = removeDates(res.body);
        assert.deepEqual(
          t,
          {
            id: '00000000-0000-0000-0000-000000000000',
            name: 'My Project',
            metadata: { keep: 'keep', test: 'test' },
            quadkey_set_id: null
          },
          'check update worked'
        );
        assert.end();
      });
  }
);

test(
  'PUT /:version/projects/:project - invalid body attributes',
  oneproject,
  function(assert, token) {
    assert.app
      .put('/v1/projects/00000000-0000-0000-0000-000000000000')
      .set('authorization', token)
      .send({ metadata: { test: 'test' }, invalidAttr: true })
      .expect(400)
      .end((err, res) => {
        assert.ifError(err, 'should not error');
        assert.deepEqual(
          res.body.message,
          'Request contains unexpected attribute invalidAttr'
        );
        assert.end();
      });
  }
);

const twoprojects = oneproject.concat([
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Project 2'
  }
]);

test(
  'DELETE /:version/projects/:project - DELETE a project',
  twoprojects,
  (assert, token) => {
    assert.app
      .delete('/v1/projects/11111111-1111-1111-1111-111111111111')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err, 'DELETE does not error');
        assert.equal(
          res.body.id,
          '11111111-1111-1111-1111-111111111111',
          'expected response for DELETE'
        );
        assert.app
          .get('/v1/projects')
          .set('authorization', token)
          .expect(200, (err, res) => {
            const results = res.body;
            assert.equal(results.length, 1, 'One result returned');
            const returnedIds = res.body.map(project => project.id);
            assert.equal(
              returnedIds.indexOf('11111111-1111-1111-1111-111111111111'),
              -1,
              'deleted project not present in results'
            );
            assert.end();
          });
      });
  }
);

test(
  'DELETE /:version/projects/:project - DELETING unknown project id should 404',
  twoprojects,
  (assert, token) => {
    assert.app
      .delete('/v1/projects/22222222-2222-2222-2222-222222222222')
      .set('authorization', token)
      .expect(404, err => {
        assert.ifError(err, 'does not error');
        assert.end();
      });
  }
);
