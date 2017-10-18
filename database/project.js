var Sequelize = require('sequelize');

module.exports = function(db) {
  var Project = db.define('Project', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false
    }
  });

  return Project;
};
