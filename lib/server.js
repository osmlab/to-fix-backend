const errors = require('mapbox-error');
const ErrorHTTP = require('mapbox-error').ErrorHTTP;

const express = require('express');
const server = (module.exports = express());
const bodyParser = require('body-parser');
const _ = require('lodash');

const db = require('./db');
const TaskItems = db.TaskItems;
const TaskUserStats = db.TaskUserStats;
const Tasks = db.Tasks;

const authUser = require('./auth-user');
const putItem = require('./put-item');
const constants = require('./constants');

const geojsonhint = require('@mapbox/geojsonhint');

server.use(bodyParser.json());

// TODO: Write docs using https://github.com/tmcw/docbox

server.get('/', function(req, res, next) {
  db
    .authenticate()
    .then(() => {
      res.json({ status: 'OK' });
    })
    .catch(err => next(err));
});

server.get('/tasks', function(req, res, next) {
  Tasks.findAll()
    .then(function(tasks) {
      res.json(tasks);
    })
    .catch(next);
});

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

server.get('/tasks/:task/stats', function(req, res, next) {
  TaskUserStats.findAll({
    where: {
      task_id: req.params.task
    }
  })
    .then(function(data) {
      var stats = data.reduce(function(m, u) {
        m[u.user] = u.stats;
        return m;
      }, {});
      res.json(stats);
    })
    .catch(next);
});

server.get('/tasks/:task/items', function(req, res, next) {
  // TODO: allow lock=locked and lock=unlocked when listing items
  TaskItems.findAll({
    where: {
      task_id: req.params.task
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

server.get('/tasks/:task/items/:item', function(req, res, next) {
  TaskItems.findOne({
    where: {
      id: req.params.item,
      task_id: req.params.task
    }
  })
    .then(function(data) {
      if (data === null) return next();
      res.json(data);
    })
    .catch(next);
});

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
      res.json(data);
    })
    .catch(next);
});

server.use(errors.showError);
server.use(function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});
