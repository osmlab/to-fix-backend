var Sequelize = require('sequelize');

module.exports = function(db) {
  var Stat = db.define('Stat', {
    user: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
      unique: 'compositeIndex'
    },
    project_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'compositeIndex'
    },
    stats: {
      type: Sequelize.JSONB,
      allowNull: false
    }
  });

  return Stat;
};
