const Sequelize = require('sequelize');

module.exports = function(db) {
  var ItemTag = db.define(
    'item_tag',
    {
      authorName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'authorName'
      },
      authorId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'authorId'
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
      timestamps: true,
      freezeTableName: true,
      tableName: 'item_tag'
    }
  );

  return ItemTag;
};
