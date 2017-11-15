const getQuadkeyForPoint = require('../lib/helper/get-quadkey-for-point');
const test = require('tape');

test('Gets correct quadkey for point at z13', assert => {
  const pt = {
    type: 'Point',
    coordinates: [10, 10]
  };
  const quadkey = getQuadkeyForPoint(pt, 13);
  assert.equal(quadkey, '1222211122033');
  assert.end();
});
