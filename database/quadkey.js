const Sequelize = require('sequelize');

module.exports = function(db) {
  var Quadkey = db.define(
    'quadkey',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      quadkey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'quadkey_project'
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        unique: 'quadkey_project'
      },
      priority: {
        type: Sequelize.FLOAT,
        allowNull: false
      }
    },
    {
      indexes: [
        {
          fields: ['quadkey']
        },
        {
          fields: ['priority']
        }
      ]
    }
  );

  return Quadkey;
};
