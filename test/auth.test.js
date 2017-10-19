'use strict';

const test = require('./lib/test');

test('GET /projects without auth', [], assert => {
  assert.app.get('/projects').expect(401, (err, res) => {
    assert.equal(res.body.message, 'Token Authentication Failed');
    assert.end();
  });
});

test('GET /projects with incorrect auth', [], assert => {
  assert.app
    .get('/projects')
    .send('authorization', 'token faketoken')
    .expect(401, (err, res) => {
      assert.equal(res.body.message, 'Token Authentication Failed');
      assert.end();
    });
});

test('GET /projects with token in query params', [], (assert, token) => {
  assert.app.get(`/projects?token=${token}`).expect(200, () => {
    assert.end();
  });
});

test(
  'GET /projects with token in authorization header',
  [],
  (assert, token) => {
    assert.app
      .get('/projects')
      .send('authorization', token)
      .expect(200, () => {
        assert.end();
      });
  }
);
