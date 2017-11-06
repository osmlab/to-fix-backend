var Sequelize = require('sequelize');

module.exports = function(db) {
  var Project = db.define('project', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    quadkey_set_id: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    },
    metadata: {
      type: Sequelize.JSONB,
      defaultValue: {}
    }
  });

  return Project;
};
