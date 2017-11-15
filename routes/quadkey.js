const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const db = require('../database/index');
const Item = db.Item;
const Quadkey = db.Quadkey;
const validator = require('validator');
const Sequelize = require('sequelize');
const validateBody = require('../lib/helper/validateBody');
const getQuadkeyPriorities = require('../lib/helper/get-quadkey-priorities');

module.exports = {
  getQuadkey,
  getQuadkeys,
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
 * Returns a list of quadkeys with priority and item count data.
 * The use-case is, for eg:
 *   - Give me data for all quadkeys at z8 within this z4 tile, with counts
 *      for items that have a status=open 
 *
 * @name get-quadkeys
 * @param {Object} params - URL parameters
 * @param {Object} params.project - Project ID
 * @param {Object} query - query parameters
 * @param {string} query.within - Quadkey to search within
 * @param {integer} query.zoom_level - The zoom level you want results in (can be max 4 greater than zoom level of `within` quadkey param)
 * @param {string} [query.item_status] - item status to filter by for item counts
 * @param {string} [query.item_tags] - item tags (comma separated) to filter by for item counts
 * @param {('locked'|'unlocked')} [query.item_lock] - The item's lock status, must be 'locked' or 'unlocked'
 * @return {Array<Object>} array of quadkey objects with the following keys:  
 *   - `quadkey`: quadkey value at zoom_level requested
 *   - `item_count`: number of items within quadkey (after applying filters)
 *   - `max_priority`: max priority of `constants.DEFAULT_ZOOM` tile within aggregation
 *
 * @example curl https://host/v1/quadkeys?within=0011&zoom_level=7&item_status=open
 *  [
 *    {
 *      quadkey: '0011000',
 *      item_count: 243,
 *      max_priority: 0.004
 *    },
 *    {
 *      quadkey: '00111001',
 *      item_count: 12,
 *      max_priority: 0.002
 *    },
 *    ...
 *  ]
 */

//eslint-disable-next-line no-unused-vars
function getQuadkeys(req, res, next) {
  const projectId = req.params.project;
  const zoomLevel = Number(req.query.zoom_level);
  const within = req.query.within;
  //TODO: build up `where` object with all item filters
  const queryProm1 = Item.findAll({
    attributes: [
      [
        Sequelize.fn(
          'COUNT',
          Sequelize.fn('substring', Sequelize.col('quadkey'), 1, zoomLevel)
        ),
        'item_count'
      ],
      [
        Sequelize.fn('substring', Sequelize.col('quadkey'), 1, zoomLevel),
        'quadkey'
      ]
    ],
    where: {
      project_id: projectId
    },
    group: [Sequelize.fn('substring', Sequelize.col('quadkey'), 1, zoomLevel)]
  });
  const queryProm2 = getQuadkeyPriorities(projectId, zoomLevel, within);
  Promise.all([queryProm1, queryProm2]).then(results => {
    const itemCounts = results[0];
    const priorities = results[1];
    const priorityMap = priorities.reduce((memo, val) => {
      memo[val.dataValues.quadkey] = val.dataValues.max_priority;
      return memo;
    }, {});
    const response = itemCounts.map(itemCount => {
      const maxPriority = priorityMap.hasOwnProperty(itemCount.quadkey)
        ? priorityMap[itemCount.quadkey]
        : -1;
      return {
        quadkey: itemCount.quadkey,
        item_count: Number(itemCount.dataValues.item_count),
        max_priority: maxPriority
      };
    });
    return res.json(response);
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
