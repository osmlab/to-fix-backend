const db = require('../../database/index');
const Quadkey = db.Quadkey;

module.exports = {
  createQuadkeys
};

function createQuadkeys(quadkeys) {
  const promises = quadkeys.map(quadkey => {
    return Quadkey.create({
      quadkey: quadkey.quadkey,
      set_id: quadkey.set_id,
      priority: quadkey.priority
    });
  });
  return Promise.all(promises);
}
