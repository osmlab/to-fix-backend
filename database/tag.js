var Sequelize = require('sequelize');

module.exports = function(db) {
  var Tag = db.define('Tag', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    }
  });

  return Tag;
};
