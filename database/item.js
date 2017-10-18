var Sequelize = require('sequelize');

module.exports = function(db) {
  var Item = db.define('Item', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'compositeIndex'
    },
    project_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'compositeIndex'
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

  return Item;
};
