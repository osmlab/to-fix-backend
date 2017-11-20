const getQuadkeyForPoint = require('./get-quadkey-for-point');

module.exports = getQuadkeyForPin;

/**
 * Returns a quadkey string for a PIN at specified zoom level
 * @param {array} pin - Coordinates array, as [lon, lat]
 * @param {Number} [zoomLevel] - zoomLevel to get quadkey for, defaults to `config.DEFAULT_ZOOM`
 * @returns {string} quadkey string
 */
function getQuadkeyForPin(pin, zoomLevel) {
  const point = { type: 'Point', coordinates: pin };

  return getQuadkeyForPoint(point, zoomLevel);
}
