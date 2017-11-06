const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const db = require('../database/index');
const Quadkey = db.Quadkey;
const validator = require('validator');
const Sequelize = require('sequelize');

module.exports = {
  getQuadkey,
  postQuadkey
};

/**
 * Gets priority value for a quadkey+project
 * 
 * @name get-quadkey-priority
 * @param {Object} params - Request URL parameters
 * @param {string} params.quadkey - Quadkey to request priority for
 * @param {Object} [query] - Request URL query parameters
 * @param {string} [query.set_id] - Quadkey Set ID to get priority values for
 */
function getQuadkey(req, res, next) {
  const quadkey = req.params.quadkey;
  const setId = req.query.set_id || null;
  Quadkey.findOne({
    where: {
      quadkey: quadkey,
      set_id: setId
    }
  })
    .then(quadkey => {
      res.json({ priority: quadkey.priority });
    })
    .catch(() => {
      return next(
        new ErrorHTTP('quadkey and set_id combination not found', 404)
      );
    });
}

/**
 * Write priority values for a quadkey (optionally tied to project)
 * The backend will handle either INSERTing or UPDATEing as appropriate
 *
 * @name post-quadkey-priority
 * @param {Object} params - Request URL parameters
 * @param {string} params.quadkey - Quadkey to POST
 * @param {Object} body - Request body
 * @param {string|null} body.set_id - Quadkey Set ID or null
 * @param {float} body.priority - Priority value for Quadkey
 */
function postQuadkey(req, res, next) {
  const quadkey = req.params.quadkey;
  const body = req.body;
  const setId = body.set_id || null;
  // console.log('params', quadkey, projectId, body.priority);
  let priority = body.priority;
  if (!validator.isFloat(String(priority))) {
    return next(new ErrorHTTP('Priority must be a float', 400));
  }
  priority = Number(priority);
  Quadkey.create({
    set_id: setId,
    quadkey: quadkey,
    priority: priority
  })
    .then(quadkey => {
      return res.json(quadkey);
    })
    .catch(err => {
      if (err instanceof Sequelize.UniqueConstraintError) {
        Quadkey.update({
          priority: priority,
          where: {
            set_id: setId,
            quadkey: quadkey
          }
        })
          .then(quadkey => {
            return res.json(quadkey);
          })
          .catch(err => {
            return next(new ErrorHTTP(err));
          });
      } else {
        return next(new ErrorHTTP(err));
      }
    });
}
