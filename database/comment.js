var Sequelize = require('sequelize');

module.exports = function(db) {
  var Comment = db.define('Comment', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
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
