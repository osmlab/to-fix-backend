var Sequelize = require('sequelize');

module.exports = function(db) {
  var ItemComments = db.define('item_comments', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.STRING,
      allowNull: false
    },
    coordinates: {
      type: Sequelize.GEOMETRY('POINT')
    }
  });

  return ItemComments;
};
