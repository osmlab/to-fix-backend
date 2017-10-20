var Sequelize = require('sequelize');

module.exports = function(db) {
  var Comment = db.define('comment', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
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
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  });

  return Comment;
};
