const errors = require('mapbox-error');
const ErrorHTTP = require('mapbox-error').ErrorHTTP;

const express = require('express');
const cors = require('cors');
const server = (module.exports = express());
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const _ = require('lodash');

const db = require('./db');
const TaskItems = db.TaskItems;
const Tasks = db.Tasks;

const authUser = require('./auth-user');
const putItem = require('./put-item');
const constants = require('./constants');
const paginateSearch = require('./helper/paginateSearch');

const Op = Sequelize.Op;

const geojsonhint = require('@mapbox/geojsonhint');

server.use(cors());
server.use(bodyParser.json());

/**
 * Get the status of server
 * @name get-status
 * @example
 * curl https://host/
 *  { status: 'OK' }
 */
server.get('/', function(req, res, next) {
  db
    .authenticate()
    .then(() => {
      res.json({ status: 'OK' });
    })
    .catch(next);
});

/**
 * Get a list of tasks
 * @name get-tasks
 * @example
 * curl https://host/tasks/task-id
 *  [{
 *    id: 'one',
 *    metadata: {}
 *  }]
 */
server.get('/tasks', function(req, res, next) {
  Tasks.findAll()
    .then(function(tasks) {
      res.json(tasks);
    })
    .catch(next);
});

/**
 * Get a task
 * @name get-task
 * @param {Object} params - what the keys in the url mean
 * @param {String} params.task - the task id
 * @example
 * curl https://host/tasks/task-id
 *  {
 *    id: 'one',
 *    metadata: {}
 *  }
 */
server.get('/tasks/:task', function(req, res, next) {
  Tasks.findAll({
    limit: 1,
    where: { id: req.params.task }
  })
    .then(function(data) {
      if (data.length === 0) return next();
      res.json(data[0]);
    })
    .catch(next);
});

/**
 * Put a task
 * @name put-task
 * @param {Object} params - what the keys in the url mean
 * @param {String} params.task - the task id
 * @param {Object} body - the body of request
 * @param {Object} body.metadata - a flexible object for adding metadata
 * @example
 * curl -X PUT -H "Content-Type: application/json" -d \
 *  '{"metadata": {} }' \
 *   https://host/tasks/task-id
 */
server.put('/tasks/:task', authUser, function(req, res, next) {
  const values = { id: req.params.task };
  if (req.body.metadata) values.metadata = req.body.metadata;
  Tasks.findOne({ where: { id: req.params.task } })
    .then(function(data) {
      if (data !== null) {
        const updated = _.merge({}, data.toJSON(), values);
        return data.update(updated);
      }
      values.metadata = values.metadata || {};
      return Tasks.create(values);
    })
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
});

/**
 * Get a paginated list of items for a task
 * @name  get-task-items
 * @param {Object} params - what the keys in the url mean
 * @param {String} params.task - the task id
 * @param {Object} query - what queryparams are valid
 * @param {String} [query.lock] - if provided this must either be 'unlocked' or 'locked'
 * @param {String} [query.page=0] - starting page
 * @param {String} [query.page_size=constants.PAGE_SIZE] - the size of the page
 * @example
 * curl https://host/tasks/task-id/items?lock=unlocked
 * [
 *   {
 *     "id": "item-id",
 *     "task_id": "task-id",
 *     "lockedTill": "2017-09-01T00:00:00Z"
 *   }
 * ]
 */
server.get('/tasks/:task/items', function(req, res, next) {
  let search;
  try {
    search = paginateSearch(req.query, {
      where: {
        task_id: req.params.task
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
  TaskItems.findAll(search, {
    attributes: {
      exclude: ['auto_id']
    }
  })
    .then(function(data) {
      if (data.length > 0) return res.json(data);
      return Tasks.findOne({ where: { id: req.params.task } }).then(function(
        data
      ) {
        if (data === null) return next();
        res.json([]); // there is a task but it has no items
      });
    })
    .catch(next);
});

/**
 * Get an item from a task
 * @name get-task-item
 * @param {Object} params - what the keys in the url mean
 * @param {String} params.task - the task id
 * @param {String} params.item - the item id
 * @example
 * curl https://host/tasks/task-id/items/item-id
 *   {
 *     "id": "item-id",
 *     "task_id": "task-id",
 *     "lockedTill": "2017-09-01T00:00:00Z"
 *   }
 */
server.get('/tasks/:task/items/:item', function(req, res, next) {
  TaskItems.findOne({
    where: {
      id: req.params.item,
      task_id: req.params.task
    },
    attributes: {
      exclude: ['auto_id']
    }
  })
    .then(function(data) {
      if (data === null) return next();
      res.json(data);
    })
    .catch(next);
});

/**
 * Put an item in a task
 * @name put-task-item
 * @param {Object} params - what the keys in the url mean
 * @param {String} params.task - the task id
 * @param {String} params.item - the item id
 * @param {Object} body - the body of the request
 * @param {('unlocked' | 'locked')} [body.lock] - lock
 * @param {[Lon, Lat]} [body.pin] - a 2d geometry point to represent the feature
 * @param {('open' | 'fixed' | 'noterror')} [body.status] - the status of current item
 * @param {FeatureCollection} [body.featureCollection] - featureCollection
 * @param {String} [body.instructions] - instructions on how to work on the task
 * @example
 * Change the lock to unlocked for `item-id` in `task-id`
 * curl -X PUT -H "Content-Type: application/json" -d \
 * '{"lock":"unlocked"}' \
 * https://host/tasks/task-id/items/item-id
 * @example
 * Change the status to fixed for `item-id` in `task-id`
 * curl -X PUT -H "Content-Type: application/json" -d \
 * '{"status":"fixed"}' \
 * https://host/tasks/task-id/items/item-id
 * @example
 * Change the pin for `item-id` in `task-id`
 * curl -X PUT -H "Content-Type: application/json" -d \
 * '{"pin": [20.0212, 71.01212]}' \
 * https://host/tasks/task-id/items/item-id
 * @example
 * Change the featureCollection for `item-id` in `task-id`
 * curl -X PUT -H "Content-Type: application/json" -d \
 * '{"featureCollection": {type: "FeatureCollection", "features": []}}' \
 * https://host/tasks/task-id/items/item-id
 * @example
 * Change the instructions for `item-id` in `task-id`
 * curl -X PUT -H "Content-Type: application/json" -d \
 * '{"instructions": "Filler instruction"' \
 * https://host/tasks/task-id/items/item-id
 */
server.put('/tasks/:task/items/:item', authUser, function(req, res, next) {
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
  const values = { id: req.params.item, task_id: req.params.task };
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
  values.task = req.params.task;
  values.item = req.params.item;

  putItem(values)
    .then(function(data) {
      var ret = Object.assign({}, data);
      delete ret.auto_id;
      res.json(ret);
    })
    .catch(next);
});

server.use(errors.showError);
server.use(function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});
