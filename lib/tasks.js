var Sequelize = require('sequelize');

module.exports = function(db) {
  var Tasks = db.define('tasks', {
    id: {
      type: Sequelize.STRING,
      unique: 'taskid',
      allowNull: false,
      primaryKey: true
    },
    metadata: { allowNull: false, type: Sequelize.JSONB }
  });

  return Tasks;
};
