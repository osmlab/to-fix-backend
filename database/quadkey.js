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
        unique: 'quadkey_set'
      },
      set_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: 'quadkey_set'
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
        },
        {
          fields: ['set_id']
        }
      ]
    }
  );

  return Quadkey;
};
