'use strict';

require('dotenv').load();
const jwt = require('jwt-simple');

module.exports = function(req, res, cb) {
  /* To be replaced with token validation and/or authentication */
  const token = getToken(req);
  let payload;
  if (token) {
    payload = getPayload(token);
  } else {
    payload = null;
  }

  // QUESTION: should we check if the user if belongs to the list
  // of authorized users here and add like an `.isTrustedUser` property or
  // so to the request?
  if (payload) {
    req.user = payload;
  } else {
    req.user = null;
  }

  return cb();
};

/**
 * Gets the token from the Authorization header if it exists
 *
 * @param request {RequestObject} - Express request object
 * @returns {String} token extracted from Authorization header 
 */
function getToken(request) {
  if (!request.headers.Authorization) return null;
  const authHeader = request.headers.Authorization;
  const token = authHeader.replace('Token ', '');
  //TODO: validate that the token is a valid JWT token
  return token;
}

/**
 * Decodes token and returns encoded payload
 * 
 * @param token {String} JWT token to decode
 * @returns {Object} - Decoded payload
 */
function getPayload(token) {
  // TODO: do something intelligent if the token fails to decode
  return jwt.decode(token, process.env.APP_SECRET);
}
