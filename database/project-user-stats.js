var Sequelize = require('sequelize');

module.exports = function(db) {
  var ProjectUserStats = db.define('project_user_stats', {
    user: {
      type: Sequelize.STRING,
      unique: 'projectUserId',
      allowNull: false,
      primaryKey: true
    },
    project_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'projectUserId',
      primaryKey: true
    },
    stats: { allowNull: false, type: Sequelize.JSONB }
  });

  return ProjectUserStats;
};
