const db = require('../database/db');
const Tasks = db.Tasks;
const _ = require('lodash');

module.exports = {
  getTasks: getTasks,
  getTask: getTask,
  createTask: createTask,
  updateTask: updateTask,
  deleteTask: deleteTask
};

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
function getTasks(req, res, next) {
  Tasks.findAll()
    .then(function(tasks) {
      res.json(tasks);
    })
    .catch(next);
}

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
function getTask(req, res, next) {
  Tasks.findAll({
    limit: 1,
    where: { id: req.params.task }
  })
    .then(function(data) {
      if (data.length === 0) return next();
      res.json(data[0]);
    })
    .catch(next);
}

/**
 */
function createTask(req, res, next) {
  return next();
}

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
function updateTask(req, res, next) {
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
}

/**
 */
function deleteTask(req, res, next) {
  return next();
}
