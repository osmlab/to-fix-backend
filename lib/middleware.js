'use strict';

require('dotenv').load();
const jwt = require('jwt-simple');

module.exports = function(req, res, cb) {
  const whiteListPath = '/auth/';

  // don't check for tokens if user is hitting an auth url
  if (req.path.startsWith(whiteListPath) || req.path === '/') {
    return cb();
  }

  const token = getToken(req);
  const payload = token ? getPayload(token) : null;
  let isTrustedUser;

  if (payload && payload.id) {
    req.user = payload;
    if (process.env.trustedUsers) {
      const trustedUsers = JSON.parse(process.env.trustedUsers);
      isTrustedUser = trustedUsers.indexOf(payload.id) !== -1;
    } else {
      isTrustedUser = true; // if no env var, all OSM users are trusted
    }
  } else {
    req.user = null;
    isTrustedUser = false;
  }

  if (!isTrustedUser) {
    res.status(401);
    res.json({ Authentication: 'Fail' });
  } else {
    return cb();
  }
};

/**
 * Gets the token from the Authorization header if it exists
 *
 * @param request {RequestObject} - Express request object
 * @returns {String} token extracted from authorization header 
 */
function getToken(request) {
  if (request.query.token && process.env.NODE_ENV === 'test')
    return request.query.token;
  if (!request.headers.authorization) return null;
  const authHeader = request.headers.authorization;
  const token = authHeader.replace('Token ', '');
  return token;
}

/**
 * Decodes token and returns encoded payload
 * 
 * @param token {String} JWT token to decode
 * @returns {Object} - Decoded payload
 */
function getPayload(token) {
  let decoded;
  try {
    decoded = jwt.decode(token, process.env.APP_SECRET);
  } catch (err) {
    decoded = undefined;
  }
  return decoded;
}
