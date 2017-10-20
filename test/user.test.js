'use strict';

const test = require('./lib/test');

test('GET / - db connection success', [], (assert, token) => {
  assert.app
    .get('/user')
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
