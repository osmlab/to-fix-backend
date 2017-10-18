var Sequelize = require('sequelize');

module.exports = function(db) {
  var Comment = db.define('Comment', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true
    },
    createdBy: {
      type: Sequelize.STRING,
      allowNull: false
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    coordinates: {
      type: Sequelize.GEOMETRY('POINT')
    }
  });

  return Comment;
};
