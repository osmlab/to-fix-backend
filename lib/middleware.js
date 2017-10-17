'use strict';

module.exports = function(req, res, cb) {
  /* To be replaced with token validation and/or authentication */
  const validated = Object.assign(req, {
    user: 'test-user',
    isAdmin: false
  });
  return cb(null, validated);
};
