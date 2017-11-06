const test = require('./lib/test');
const createQuadkeys = require('./lib/quadkeys').createQuadkeys;

const quadkeysNoSetFixture = [
  {
    quadkey: '11002122',
    set_id: null,
    priority: 0.1234
  },
  {
    quadkey: '11002123',
    set_id: null,
    priority: 0.4321
  }
];

const quadkeysWithSetFixture = [
  {
    quadkey: '11002122',
    set_id: 'abc',
    priority: 0.2222
  },
  {
    quadkey: '11002123',
    set_id: 'abc',
    priority: 0.3333
  }
];

test(
  'GET /:version/quadkeys/:quadkey - get priority for a quadkey without set_id',
  [],
  (assert, token) => {
    createQuadkeys(quadkeysNoSetFixture).then(() => {
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
  'GET /:version/quadkeys/:quadkey - get priority for a quadkey with set_id',
  [],
  (assert, token) => {
    createQuadkeys(quadkeysWithSetFixture).then(() => {
      assert.app
        .get('/v1/quadkeys/11002122?setId=abc')
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
    createQuadkeys(quadkeysNoSetFixture).then(() => {
      assert.app
        .post('/v1/quadkeys/11002122')
        .set('authorization', token)
        .send({
          setId: null,
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
        setId: null,
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
  [],
  (assert, token) => {
    assert.app
      .post('/v1/quadkeys/11002122')
      .set('authorization', token)
      .send({
        set_id: 'xyz',
        priority: 0.8888
      })
      .expect(200, (err, res) => {
        assert.ifError(err, 'does not error');
        assert.equal(res.body.set_id, 'xyz');
        assert.equal(res.body.priority, 0.8888);
        assert.equal(res.body.quadkey, '11002122');
        assert.end();
      });
  }
);
