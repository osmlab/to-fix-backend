var Sequelize = require('sequelize');

module.exports = function(db) {
  var ItemTags = db.define('item_tags', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: Sequelize.STRING,
      unique: 'compositeIndex',
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      unique: 'compositeIndex',
      allowNull: false
    }
  });

  return ItemTags;
};
