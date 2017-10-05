// Right now get-user-details does not interact with the DB,
// so we can use vanilla `tape`.

const tape = require('tape');
const getUserDetails = require('../lib/get-user-details');

tape('test get user details', assert => {
  const oauthTokenSecret = 'faketokensecret';
  const oauthToken = 'faketoken';

  //TODO: mock the OSM API for tests
  getUserDetails(oauthToken, oauthTokenSecret).then(user => {
    //TODO: assert response is as expected from our mocks
    assert.deepEqual(user, {});

    assert.end();
  });
});
