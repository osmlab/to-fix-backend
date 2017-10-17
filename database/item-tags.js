var Sequelize = require('sequelize');

module.exports = function(db) {
  var ItemTags = db.define('item_tags', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    }
  });

  return ItemTags;
};
