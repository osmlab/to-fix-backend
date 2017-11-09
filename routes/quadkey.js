const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const db = require('../database/index');
const Quadkey = db.Quadkey;
const validator = require('validator');
const Sequelize = require('sequelize');
const validateBody = require('../lib/helper/validateBody');

module.exports = {
  getQuadkey,
  postQuadkey
};

function isValidQuadkey(quadkey) {
  return /^[0-3]+$/.test(quadkey);
}

/**
 * Gets priority value for a quadkey+project. If quadkey does not exist, will return a priority of -1
 * 
 * @name get-quadkey-priority
 * @param {Object} params - Request URL parameters
 * @param {string} params.quadkey - Quadkey to request priority for
 * @param {Object} [query] - Request URL query parameters
 * @param {string} [query.set_id] - Quadkey Set ID to get priority values for
 * @example
 * curl https://host/v1/quadkeys/11002211
 * { "priority": 0.777 }
 */
function getQuadkey(req, res, next) {
  const quadkey = req.params.quadkey;
  if (!isValidQuadkey(quadkey)) {
    return next(new ErrorHTTP('Please supply a valid quadkey identifier', 400));
  }
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
      res.json({ priority: -1 });
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
 * @param {string} [body.set_id] - Quadkey Set ID or null
 * @param {float} body.priority - Priority value for Quadkey
 */
function postQuadkey(req, res, next) {
  const quadkey = req.params.quadkey;
  if (!isValidQuadkey(quadkey)) {
    return next(new ErrorHTTP('Please supply a valid quadkey identifier', 400));
  }
  const body = req.body;
  const validBodyAttrs = ['set_id', 'priority'];
  const requiredBodyAttrs = ['priority'];
  const validationError = validateBody(
    req.body,
    validBodyAttrs,
    requiredBodyAttrs
  );
  if (validationError) return next(new ErrorHTTP(validationError, 400));
  const setId = body.set_id || null;
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
        Quadkey.update(
          {
            priority: priority
          },
          {
            where: {
              set_id: setId,
              quadkey: quadkey
            }
          }
        )
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
