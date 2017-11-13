const tilebelt = require('@mapbox/tilebelt');
const DEFAULT_ZOOM = require('../../lib/constants').DEFAULT_ZOOM;

module.exports = getQuadkeyForPoint;

/**
 * Returns a quadkey string for a point at specified zoom level
 * @param {Object} pt - GeoJSON point geometry
 * @param {string} pt.type - Geometry type, MUST be `Point`
 * @param {array} pt.coordinates - Coordinates array, as [lon, lat]
 * @param {Number} [zoomLevel] - zoomLevel to get quadkey for, defaults to `config.DEFAULT_ZOOM`
 * @returns {string} quadkey string
*/
function getQuadkeyForPoint(pt, zoomLevel) {
  zoomLevel = zoomLevel || DEFAULT_ZOOM;
  const coords = pt.coordinates;
  const tile = tilebelt.pointToTile(coords[0], coords[1], zoomLevel);
  return tilebelt.tileToQuadkey(tile);
}
