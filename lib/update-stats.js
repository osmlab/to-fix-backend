const TaskUserStats = require('../database/db').TaskUserStats;
const constants = require('./constants');

/**
 * updates a tasks stats based on the current and previous user/status pairs
 * @param {String} task - the id of the task
 * @param {Object} was - the status and user before the change
 * @param {Object} is - the status and user after the change
 * @returns {Promise}
 */
module.exports = function(task, was, is) {
  if (was.status === is.status && was.user === is.user) {
    // there is no change, resolve
    return Promise.resolve();
  }

  // track the changes we need to make by user
  var userChanges = {};
  userChanges[was.user] = {};
  userChanges[is.user] = {};

  var wasActive = constants.ACTIVE_STATUS.includes(was.status);
  var isActive = constants.ACTIVE_STATUS.includes(is.status);

  if (!wasActive && isActive) {
    // was completed, is no longer completed, remove a completed stat from the was user
    userChanges[was.user] = userChanges[was.user] || {
      completed: 0
    };
    userChanges[was.user]['completed'] = -1;
  } else if (wasActive && !isActive) {
    // was not completed, is now completed, add a completed stat for the is user
    userChanges[is.user] = userChanges[is.user] || { completed: 0 };
    userChanges[is.user]['completed'] = 1;
  }

  // remove a stat for the was status from the was user
  userChanges[was.user][was.status] = -1;

  userChanges[is.user][is.status] = 1;

  var usersAffected = Object.keys(userChanges).filter(function(user) {
    if (user === 'null') return false; // remove 'null' user as this is the inital value
    return Object.keys(userChanges[user]).length > 0; // only keep the user if a change was added to their object
  });

  var date = new Date().toISOString().split('T')[0]; //the date stamp for today in UTC
  var defaultStats = JSON.stringify({
    completed: 0,
    fixed: 0,
    noterror: 0,
    open: 0
  });

  return TaskUserStats.findAll({
    // get the affected users
    where: {
      user: usersAffected,
      task_id: task
    }
  }).then(function(users) {
    // convert the array response to an object to match 'userChanges'
    // the values in this object are Sequalize objects
    var statsByUser = users.reduce(function(memo, stats) {
      memo[stats.dataValues.user] = stats;
      return memo;
    }, {});

    return Promise.all(
      usersAffected.map(function(user) {
        // update or create stats for all affected users
        var model = statsByUser[user];

        // get the stats for today if the exhist, else set them to the default
        var stats = model
          ? model.dataValues.stats[date] || JSON.parse(defaultStats)
          : JSON.parse(defaultStats);

        // apply the changes to the user's stats
        var change = userChanges[user];
        stats = Object.keys(change).reduce(function(m, c) {
          m[c] = m[c] + change[c];
          return m;
        }, stats);

        var allStats = {};
        if (model) {
          // if the model was found, this is an update
          allStats = model.dataValues.stats || {};
          allStats[date] = stats;
          return model.update({
            stats: allStats
          });
        } else {
          // if the model was not found, this is a create
          allStats = {};
          allStats[date] = stats;
          return TaskUserStats.create({
            user: user,
            task_id: task,
            stats: allStats
          });
        }
      })
    );
  });
};
