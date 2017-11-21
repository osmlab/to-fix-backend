/**
 * parses a non number value and returns the default
 * in case NaN.
 * @param {*} num
 * @param {number} defaultVal
 */
module.exports = function sanitizeNumber(num, defaultVal) {
  const parsed = parseInt(num, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return defaultVal;
  }
  return parsed;
};
