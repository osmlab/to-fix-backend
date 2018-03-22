const Sequelize = require('sequelize');

module.exports = function(db) {
  var ItemTag = db.define(
    'item_tag',
    {
      tag_author: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      createdAt: {
        type: Sequelize.DATE,
        field: 'createdAt'
      },
      updatedAt: {
        type: Sequelize.DATE,
        field: 'updatedAt'
      }
    },
    {
      timestamps: true
    }
  );

  return ItemTag;
};
