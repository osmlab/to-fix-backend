var Sequelize = require('sequelize');

module.exports = function(db) {
  var Stat = db.define('stat', {
    user: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    stats: {
      type: Sequelize.JSONB,
      allowNull: false
    }
  });

  return Stat;
};
