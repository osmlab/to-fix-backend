const test = require('./lib/test');
const createQuadkeys = require('./lib/quadkeys').createQuadkeys;

const quadkeysNoProjFixture = [
  {
    quadkey: '11002122',
    project: null,
    priority: 0.1234
  },
  {
    quadkey: '11002123',
    project: null,
    priority: 0.4321
  }
];

const quadkeysWithProjFixture = [
  {
    quadkey: '11002122',
    project: '00000000-0000-0000-0000-000000000000',
    priority: 0.2222
  },
  {
    quadkey: '11002123',
    project: '00000000-0000-0000-0000-000000000000',
    priority: 0.3333
  }
];

const projectsFixture = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'My Project'
  }
];

test(
  'GET /:version/quadkeys/:quadkey - get priority for a quadkey without project',
  [],
  (assert, token) => {
    createQuadkeys(quadkeysNoProjFixture).then(() => {
      assert.app
        .get('/v1/quadkeys/11002122')
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'fetching quadkey should not error');
          assert.equal(res.body.priority, 0.1234);
          assert.end();
        });
    });
  }
);

test(
  'GET /:version/quadkeys/:quadkey - get priority for a quadkey with project',
  projectsFixture,
  (assert, token) => {
    createQuadkeys(quadkeysWithProjFixture).then(() => {
      assert.app
        .get(
          '/v1/quadkeys/11002122?project=00000000-0000-0000-0000-000000000000'
        )
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'fetching quadkey for project should not error');
          assert.equal(res.body.priority, 0.2222);
          assert.end();
        });
    });
  }
);

test(
  'POST /:version/quadkeys/:quadkey - POST priority for a quadkey UPDATE',
  [],
  (assert, token) => {
    createQuadkeys(quadkeysNoProjFixture).then(() => {
      assert.app
        .post('/v1/quadkeys/11002122')
        .set('authorization', token)
        .send({
          project: null,
          priority: 0.1111
        })
        .expect(200, (err, res) => {
          assert.ifError(err, 'no error on POSTing quadkey');
          assert.equal(res.body.quadkey, '11002122');
          assert.equal(res.body.priority, 0.1111);
          assert.end();
        });
    });
  }
);

test(
  'POST /:version/quadkeys/:quadkey - POST priority for a quadkey INSERT',
  [],
  (assert, token) => {
    assert.app
      .post('/v1/quadkeys/11002122')
      .set('authorization', token)
      .send({
        project: null,
        priority: 0.3333
      })
      .expect(200, (err, res) => {
        assert.ifError(err, 'POSTing quadkey does not error');
        assert.equal(res.body.quadkey, '11002122');
        assert.equal(res.body.priority, 0.3333);
        assert.end();
      });
  }
);

test(
  'POST /:version/quadkeys/:quadkey - POSTing quadkey with project',
  projectsFixture,
  (assert, token) => {
    assert.app
      .post('/v1/quadkeys/11002122')
      .set('authorization', token)
      .send({
        project: '00000000-0000-0000-0000-000000000000',
        priority: 0.8888
      })
      .expect(200, (err, res) => {
        assert.ifError(err, 'does not error');
        assert.equal(
          res.body.project_id,
          '00000000-0000-0000-0000-000000000000'
        );
        assert.equal(res.body.priority, 0.8888);
        assert.equal(res.body.quadkey, '11002122');
        assert.end();
      });
  }
);
