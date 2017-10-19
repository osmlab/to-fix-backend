'use strict';

const getUserDetails = require('../lib/get-user-details');
const test = require('./lib/test');

test('test get user details', [], assert => {
  const oauthTokenSecret = 'faketokensecret';
  const oauthToken = 'faketoken';

  getUserDetails(oauthToken, oauthTokenSecret).then(user => {
    assert.equal(user.display_name, 'userone', 'user xml parsed as expected');
    assert.end();
  });
});
