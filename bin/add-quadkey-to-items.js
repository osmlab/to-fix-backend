const getQuadkeyForPoint = require('../lib/helper/get-quadkey-for-point');
const db = require('../models/index');
const Item = db.Item;
const pMap = require('p-map');

Item.findAll({
  where: {
    quadkey: null
  }
})
  .then(items => {
    return pMap(items, updateQuadkey, { concurrency: 50 });
  })
  .then(() => {
    console.log('all items updated'); // eslint-disable-line no-console
    return;
  })
  .catch(err => {
    console.log('ERROR: ', err); // eslint-disable-line no-console
    return;
  });

function updateQuadkey(item) {
  const quadkey = getQuadkeyForPoint(item.pin);
  return Item.update(
    {
      quadkey: quadkey
    },
    {
      where: {
        id: item.id,
        project_id: item.project_id
      }
    }
  );
}
