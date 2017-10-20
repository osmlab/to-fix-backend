const Sequelize = require('sequelize');
const _ = require('lodash');

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
    pin: {
      type: Sequelize.GEOMETRY('POINT', 4326),
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  });

  Comment.beforeSave(model => {
    if (model.pin && !model.pin.crs) {
      model.pin.crs = {
        type: 'name',
        properties: { name: 'EPSG:4326' }
      };
    }
  });

  Comment.prototype.toJSON = function() {
    return _.omit(this.dataValues, 'itemAutoId');
  };

  return Comment;
};
