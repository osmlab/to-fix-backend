var Sequelize = require('sequelize');
var _ = require('lodash');

module.exports = function(db) {
  var Item = db.define('Item', {
    auto_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'compositeIndex'
    },
    project_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'compositeIndex'
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    pin: {
      type: Sequelize.GEOMETRY('POINT'),
      allowNull: false
    },
    instructions: {
      type: Sequelize.STRING,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.STRING,
      allowNull: false
    },
    featureCollection: {
      type: Sequelize.JSONB, // does postgis have a featureCollection
      allowNull: false
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'open'
    },
    lockedTill: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    lockedBy: {
      type: Sequelize.STRING
    },
    siblings: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
      defaultValue: []
    }
  });

  Item.prototype.toJSON = function() {
    return _.omit(this.dataValues, 'auto_id');
  };

  return Item;
};
