/*
const proxyquire = require('proxyquire');
const supertest = require('supertest');
const test = require('./lib/test');
const tape = require('tape');
const db = require('../database/index');
const sinon = require('sinon');

test('GET / - check that status is OK when db connection works', [], function(
  assert
) {
  assert.app.get('/').expect(200, function(err, res) {
    if (err) return assert.end(err);
    assert.equal(res.body.status, 'OK', 'status returns OK');
    assert.end();
  });
});

// Directly use tape to mock db
tape('GET / - the status is NOTOK when db connection fails', function(assert) {
  const server = proxyquire('../lib/server', {});
  sinon.stub(db, 'authenticate').yields(() => {
    return Promise.reject(new Error('error'));
  });
  supertest(server)
    .get('/')
    .expect(500)
    .end(function(err, res) {
      if (err) return assert.end(err);
      assert.equal(res.body.message, 'Internal Server Error', 'throws error');
      assert.end();
    });
});
*/
