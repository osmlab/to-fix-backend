var Sequelize = require('sequelize');

module.exports = function(db) {
  var Projects = db.define('projects', {
    id: {
      type: Sequelize.STRING,
      unique: 'projectid',
      allowNull: false,
      primaryKey: true
    },
    metadata: { allowNull: false, type: Sequelize.JSONB }
  });

  return Projects;
};
