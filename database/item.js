const Sequelize = require('sequelize');
const _ = require('lodash');

module.exports = function(db) {
  var Item = db.define(
    'item',
    {
      auto_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'projectItemId'
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: 'projectItemId'
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
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      }
    },
    {
      indexes: [
        {
          fields: ['status']
        },
        {
          fields: ['lockedTill']
        },
        {
          fields: ['pin'],
          using: 'gist'
        },
        {
          fields: ['id', 'project_id'],
          unique: true
        }
      ]
    }
  );

  Item.prototype.toJSON = function() {
    return _.omit(this.dataValues, 'auto_id');
  };

  return Item;
};
