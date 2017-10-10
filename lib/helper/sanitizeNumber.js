/**
 * parses a non number value and returns the default
 * in case NaN.
 * @param {*} num 
 * @param {number} defaultVal 
 */
module.exports = function sanitizeNumber(num, defaultVal) {
  const parsed = parseInt(num, 10);
  return Number.isNaN(parsed) ? defaultVal : parsed;
};
