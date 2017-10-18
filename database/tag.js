var Sequelize = require('sequelize');

module.exports = function(db) {
  var Tag = db.define('Tag', {
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
    }
  });

  return Tag;
};
