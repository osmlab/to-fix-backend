'use strict';

const test = require('./lib/test');

test('GET /:version/user - user details', [], (assert, token) => {
  assert.app
    .get('/v1/user')
    .set('authorization', token)
    .expect(200, (err, res) => {
      if (err) return assert.end(err);
      assert.deepEqual(res.body, {
        id: 123,
        username: 'test-user',
        image: 'https://gravatar.com/awesome/image'
      });
      assert.end();
    });
});
