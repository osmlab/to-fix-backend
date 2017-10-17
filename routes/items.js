const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const paginateSearch = require('../lib/helper/paginateSearch');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../database/db');
const ProjectItems = db.ProjectItems;
const Projects = db.Projects;
const geojsonhint = require('@mapbox/geojsonhint');
const constants = require('../lib/constants');
const putItemWrapper = require('../lib/put-item');

module.exports = {
  getItems: getItems,
  getItem: getItem,
  createItem: createItem,
  updateItem: updateItem,
  deleteItem: deleteItem
};

/**
 * Get a paginated list of items for a project
 * @name  get-project-items
 * @param {Object} params - what the keys in the url mean
 * @param {String} params.project - the project id
 * @param {Object} query - what queryparams are valid
 * @param {String} [query.lock] - if provided this must either be 'unlocked' or 'locked'
 * @param {String} [query.page=0] - starting page
 * @param {String} [query.page_size=constants.PAGE_SIZE] - the size of the page
 * @example
 * curl https://host/projects/project-id/items?lock=unlocked
 * [
 *   {
 *     "id": "item-id",
 *     "project_id": "project-id",
 *     "lockedTill": "2017-09-01T00:00:00Z"
 *   }
 * ]
 */
function getItems(req, res, next) {
  let search;
  try {
    search = paginateSearch(req.query, {
      where: {
        project_id: req.params.project
      }
    });
  } catch (e) {
    return next(e);
  }

  if (req.query.lock) {
    if (req.query.lock !== 'locked' && req.query.lock !== 'unlocked') {
      return next(new ErrorHTTP('Invalid query lock value ', 400));
    }
    const locked = req.query.lock === 'locked';
    // all items less than current time are unlocked
    // and vice versa
    search.where.lockedTill = {
      [locked ? Op.gt : Op.lt]: new Date()
    };
  }
  ProjectItems.findAll(search)
    .then(function(data) {
      if (data.length > 0) return res.json(data);
      return Projects.findOne({
        where: { id: req.params.project }
      }).then(function(data) {
        if (data === null) return next();
        res.json([]); // there is a project but it has no items
      });
    })
    .catch(next);
}

/**
 * Get an item from a project
 * @name get-project-item
 * @param {Object} params - what the keys in the url mean
 * @param {String} params.project - the project id
 * @param {String} params.item - the item id
 * @example
 * curl https://host/projects/project-id/items/item-id
 *   {
 *     "id": "item-id",
 *     "project_id": "project-id",
 *     "lockedTill": "2017-09-01T00:00:00Z"
 *   }
 */
function getItem(req, res, next) {
  ProjectItems.findOne({
    where: {
      id: req.params.item,
      project_id: req.params.project
    }
  })
    .then(function(data) {
      if (data === null) return next();
      res.json(data);
    })
    .catch(next);
}

/**
 */
function createItem(req, res, next) {
  return next();
}

/**
 * Put an item in a project
 * @name put-project-item
 * @param {Object} params - what the keys in the url mean
 * @param {String} params.project - the project id
 * @param {String} params.item - the item id
 * @param {Object} body - the body of the request
 * @param {('unlocked' | 'locked')} [body.lock] - lock
 * @param {[Lon, Lat]} [body.pin] - a 2d geometry point to represent the feature
 * @param {('open' | 'fixed' | 'noterror')} [body.status] - the status of current item
 * @param {FeatureCollection} [body.featureCollection] - featureCollection
 * @param {String} [body.instructions] - instructions on how to work on the item
 * @example
 * Change the lock to unlocked for `item-id` in `project-id`
 * curl -X PUT -H "Content-Type: application/json" -d \
 * '{"lock":"unlocked"}' \
 * https://host/projects/project-id/items/item-id
 * @example
 * Change the status to fixed for `item-id` in `project-id`
 * curl -X PUT -H "Content-Type: application/json" -d \
 * '{"status":"fixed"}' \
 * https://host/projects/project-id/items/item-id
 * @example
 * Change the pin for `item-id` in `project-id`
 * curl -X PUT -H "Content-Type: application/json" -d \
 * '{"pin": [20.0212, 71.01212]}' \
 * https://host/projects/project-id/items/item-id
 * @example
 * Change the featureCollection for `item-id` in `project-id`
 * curl -X PUT -H "Content-Type: application/json" -d \
 * '{"featureCollection": {type: "FeatureCollection", "features": []}}' \
 * https://host/projects/project-id/items/item-id
 * @example
 * Change the instructions for `item-id` in `project-id`
 * curl -X PUT -H "Content-Type: application/json" -d \
 * '{"instructions": "Filler instruction"' \
 * https://host/projects/project-id/items/item-id
 */
function updateItem(req, res, next) {
  // TODO: provide different status codes based on the status of the item
  const validBodyAttrs = [
    'lock',
    'pin',
    'status',
    'featureCollection',
    'instructions'
  ];
  const invalidBodyAttrs = Object.keys(req.body).filter(function(attr) {
    return validBodyAttrs.indexOf(attr) === -1;
  });

  if (invalidBodyAttrs.length !== 0) {
    return next(new ErrorHTTP('Request contains unexpected attributes', 400));
  }

  // validate pin
  const values = { id: req.params.item, project_id: req.params.project };
  if (Array.isArray(req.body.pin)) {
    values.pin = {
      type: 'Point',
      coordinates: req.body.pin
    };
    var pinErrors = geojsonhint.hint(values.pin, {
      precisionWarning: false
    });
    if (pinErrors.length) {
      return next(new ErrorHTTP('Invalid Pin: ' + pinErrors[0].message, 400));
    }
  }

  if (req.body.instructions) {
    const instructions = req.body.instructions;
    if (typeof instructions !== 'string' || instructions.length < 1) {
      return next(ErrorHTTP('An item must have a valid instruction', 400));
    }
    values.instructions = instructions;
  }

  // validate lock
  if (req.body.lock === 'unlocked') {
    values.lockedTill = new Date();
    values.lockedBy = null;
  } else if (req.body.lock === 'locked') {
    values.lockedTill = new Date(Date.now() + 1000 * 60 * 15); // put a lock 15 min in future
    values.lockedBy = req.user;
  } else if (req.body.lock !== undefined) {
    return next(new ErrorHTTP('Invalid lock change action'));
  } else if (req.body.lock && req.body.status) {
    return next(
      new ErrorHTTP(
        'It is invalid to set the status and change the lock in one request'
      ),
      400
    );
  }

  // validate status
  if (req.body.status) {
    if (constants.ALL_STATUS.indexOf(req.body.status) === -1) {
      return next(new ErrorHTTP('Invalid status', 400));
    }
    values.status = req.body.status;
    if (constants.INACTIVE_STATUS.indexOf(values.status) !== -1) {
      // if the item has been marked as done, expire the lock
      values.lockedTill = new Date();
      values.lockedBy = null;
    }
  }

  // validate feature collection
  if (req.body.featureCollection) {
    values.featureCollection = req.body.featureCollection;
    var fcErrors = geojsonhint.hint(values.featureCollection, {
      precisionWarning: false
    });

    if (fcErrors.length) {
      return next(
        new ErrorHTTP('Invalid featureCollection: ' + fcErrors[0].message, 400)
      );
    }
  }

  values.user = req.user;
  values.project = req.params.project;
  values.item = req.params.item;

  putItemWrapper(values)
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 */
function deleteItem(req, res, next) {
  return next();
}
