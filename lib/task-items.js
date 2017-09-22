var Sequelize = require('sequelize');

module.exports = function(db) {
  var TaskItems = db.define('task_items', {
    id: {
      type: Sequelize.STRING,
      unique: 'taskItemId',
      allowNull: false,
      primaryKey: true
    },
    task_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'taskItemId',
      primaryKey: true
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
    lockedBy: { type: Sequelize.STRING }
  });

  return TaskItems;
};
