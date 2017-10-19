var Sequelize = require('sequelize');

module.exports = function(db) {
  var Tag = db.define(
    'tag',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: 'tagProjectId'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'tagProjectId'
      }
    },
    {
      indexes: [
        {
          fields: ['name']
        }
      ]
    }
  );

  return Tag;
};
