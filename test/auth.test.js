'use strict';

const test = require('./lib/test');

test('GET /:version/projects without auth', [], assert => {
  assert.app.get('/v1/projects').expect(401, (err, res) => {
    assert.equal(res.body.message, 'Token Authentication Failed');
    assert.end();
  });
});

test('GET /:version/projects with incorrect auth', [], assert => {
  assert.app
    .get('/v1/projects')
    .send('authorization', 'token faketoken')
    .expect(401, (err, res) => {
      assert.equal(res.body.message, 'Token Authentication Failed');
      assert.end();
    });
});

test(
  'GET /:version/projects with token in query params',
  [],
  (assert, token) => {
    assert.app.get(`/v1/projects?token=${token}`).expect(200, () => {
      assert.end();
    });
  }
);

test(
  'GET /:version/projects with token in authorization header',
  [],
  (assert, token) => {
    assert.app
      .get('/v1/projects')
      .send('authorization', token)
      .expect(200, () => {
        assert.end();
      });
  }
);
