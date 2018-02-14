'use strict';

require('dotenv').load();
const jwt = require('jwt-simple');
const ErrorHTTP = require('mapbox-error').ErrorHTTP;

module.exports = function(req, res, next) {
  const whiteListPath = '/v1/auth/';

  // don't check for tokens if user is hitting an auth url
  if (req.path.startsWith(whiteListPath) || req.path === '/') {
    return next();
  }

  const token = getToken(req);
  const payload = token ? getPayload(token) : null;

  if (payload && payload.id) {
    req.user = payload;
  } else {
    req.user = null;
  }

  if (!req.user) {
    return next(new ErrorHTTP('Token Authentication Failed', 401));
  } else {
    return next();
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
    // JWT_TRUSTED_CLIENT_SECRET can be used to wrap the JWT in another JWT token
    // This is useful for running your own instance and restricting access to your
    // project data to users of your trusted frontend client app.
    if (process.env.JWT_TRUSTED_CLIENT_SECRET) {
      token = jwt.decode(token, process.env.JWT_TRUSTED_CLIENT_SECRET);
    }
    decoded = jwt.decode(token, process.env.APP_SECRET);
  } catch (err) {
    decoded = undefined;
  }
  return decoded;
}
