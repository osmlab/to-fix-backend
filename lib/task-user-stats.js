var Sequelize = require('sequelize');

module.exports = function(db) {
  var TaskUserStats = db.define('task_user_stats', {
    user: {
      type: Sequelize.STRING,
      unique: 'taskUserId',
      allowNull: false,
      primaryKey: true
    },
    task_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'taskUserId',
      primaryKey: true
    },
    stats: { allowNull: false, type: Sequelize.JSONB }
  });

  return TaskUserStats;
};
