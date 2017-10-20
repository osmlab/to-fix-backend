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
      type: Sequelize.GEOMETRY('POINT', 4326)
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  });

  Comment.beforeSave(model => {
    if (!model.coordinates.crs) {
      model.coordinates.crs = {
        type: 'name',
        properties: { name: 'EPSG:4326' }
      };
    }
  });

  return Comment;
};
