var Sequelize = require('sequelize');
var _ = require('lodash');

module.exports = function(db) {
  var TaskItems = db.define('task_items', {
    auto_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    id: {
      type: Sequelize.STRING,
      unique: 'taskItemId',
      allowNull: false
    },
    task_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'taskItemId'
    },
    pin: { allowNull: false, type: Sequelize.GEOMETRY('POINT') },
    instructions: { allowNull: false, type: Sequelize.STRING },
    createdBy: { allowNull: false, type: Sequelize.STRING },
    featureCollection: { allowNull: false, type: Sequelize.JSONB }, // does postgis have a featureCollection
    status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'open' },
    lockedTill: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false
    },
    lockedBy: { type: Sequelize.STRING },
    siblings: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      defaultValue: [],
      allowNull: false
    }
  });

  TaskItems.prototype.toJSON = function() {
    return _.omit(this.dataValues, 'auto_id');
  };

  return TaskItems;
};
