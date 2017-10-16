var Sequelize = require('sequelize');

module.exports = function(db) {
  var ItemComments = db.define('item_comments', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    body: {
      type: Sequelize.TEXT
    },
    point: {
      type: Sequelize.GEOMETRY('POINT')
    },
    user: {
      type: Sequelize.STRING
    }
  });

  return ItemComments;
};
