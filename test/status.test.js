'use strict';

const proxyquire = require('proxyquire');
const supertest = require('supertest');
const tape = require('tape');
const test = require('./lib/test');
const db = require('../database/index');
const sinon = require('sinon');

test('GET / - db connection success', [], assert => {
  assert.app.get('/').expect(200, (err, res) => {
    if (err) return assert.end(err);
    assert.equal(res.body.status, 'OK', 'status returns OK');
    assert.end();
  });
});

tape('GET / - db connection failure', assert => {
  const server = proxyquire('../lib/server', {});
  sinon.stub(db, 'authenticate').yields(() => {
    return Promise.reject(new Error('error'));
  });
  supertest(server)
    .get('/')
    .expect(500)
    .end((err, res) => {
      assert.ifError(err, 'should not throw error');
      assert.equal(
        res.body.message,
        'Internal Server Error',
        'should return error'
      );
      assert.end();
    });
});
