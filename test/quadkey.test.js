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
  'GET /:version/quadkeys/:quadkey - expect -1 priority for not found quadkey',
  [],
  (assert, token) => {
    assert.app
      .get('/v1/quadkeys/111111')
      .set('authorization', token)
      .expect(200, (err, res) => {
        assert.ifError(err);
        assert.equal(res.body.priority, -1);
        assert.end();
      });
  }
);

test(
  'GET /:version/quadkeys/:quadkey?set_id=foobar - expect -1 priority for not found quadkey+set_id',
  [],
  (assert, token) => {
    createQuadkeys(quadkeysWithSetFixture).then(() => {
      assert.app
        .get('/v1/quadkeys/11002122?set_id=foobar')
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err);
          assert.equal(res.body.priority, -1);
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
        .get('/v1/quadkeys/11002122?set_id=abc')
        .set('authorization', token)
        .expect(200, (err, res) => {
          assert.ifError(err, 'fetching quadkey for set_id should not error');
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
          set_id: null,
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
        set_id: null,
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
  'POST /:version/quadkeys/:quadkey - POSTing quadkey with set_id',
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

test(
  'POST /:version/quadkeys/:quadkey - POSTing invalid quadkey returns 400',
  [],
  (assert, token) => {
    assert.app
      .post('/v1/quadkeys/foobar')
      .set('authorization', token)
      .send({
        set_id: 'xyz',
        priority: 0.666
      })
      .expect(400, (err, res) => {
        assert.ifError(err, 'does not error');
        assert.equal(
          res.body.message,
          'Please supply a valid quadkey identifier'
        );
        assert.end();
      });
  }
);
