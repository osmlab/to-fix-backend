'use strict';

const removeDates = require('./lib/remove-dates');
const test = require('./lib/test');

test(
  'GET /projects',
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
  assert => {
    assert.app.get('/projects').expect(200, (err, res) => {
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
          metadata: {}
        },
        'project one should look like the fixture'
      );
      assert.deepEqual(
        projects['11111111-1111-1111-1111-111111111111'],
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'My Other Project',
          metadata: {}
        },
        'project two should look like the fixture'
      );
      assert.end();
    });
  }
);

test(
  'CREATE /projects - invalid body attributes',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'My Project'
    }
  ],
  assert => {
    assert.app
      .post('/projects')
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
  'CREATE /projects',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'My Project'
    }
  ],
  assert => {
    assert.app
      .post('/projects')
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

test('GET /projects/:project - does not exist', [], assert => {
  assert.app
    .get('/projects/00000000-0000-0000-0000-000000000000')
    .expect(404)
    .end((err, res) => {
      assert.ifError(err, 'should not error');
      assert.deepEqual(res.body.message, 'Not Found');
      assert.end();
    });
});

test(
  'GET /projects/:project',
  [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'My Project',
      metadata: {},
      createdAt: '2017-10-18T00:00:00.000Z',
      updatedAt: '2017-10-18T00:00:00.000Z'
    }
  ],
  assert => {
    assert.app
      .get('/projects/00000000-0000-0000-0000-000000000000')
      .expect(200, (err, res) => {
        assert.ifError(err, 'should not error');
        var t = removeDates(res.body);
        assert.deepEqual(
          t,
          {
            id: '00000000-0000-0000-0000-000000000000',
            name: 'My Project',
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

test('PUT /projects/:project - update project one', oneproject, assert => {
  assert.app
    .put('/projects/00000000-0000-0000-0000-000000000000')
    .send({ metadata: { test: 'test' } })
    .expect(200, (err, res) => {
      assert.ifError(err, 'should not error');
      var t = removeDates(res.body);
      assert.deepEqual(
        t,
        {
          id: '00000000-0000-0000-0000-000000000000',
          name: 'My Project',
          metadata: { keep: 'keep', test: 'test' }
        },
        'check update worked'
      );
      assert.end();
    });
});

test('PUT /projects/:project - invalid body attributes', oneproject, function(
  assert
) {
  assert.app
    .put('/projects/00000000-0000-0000-0000-000000000000')
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
});
