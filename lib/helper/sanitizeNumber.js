const ErrorHTTP = require('mapbox-error').ErrorHTTP;

/**
 * parses a non number value and returns the default
 * in case NaN.
 * @param {*} num
 * @param {number} defaultVal
 */
module.exports = function sanitizeNumber(num, defaultVal) {
  const parsed = parseInt(num, 10);
  if (Number.isNaN(parsed)) {
    return defaultVal;
  }
  if (parsed < 0) {
    throw new ErrorHTTP('Request contains unexpected query params', 400);
  }
  return parsed;
};
