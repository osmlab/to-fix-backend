var Sequelize = require('sequelize');

module.exports = function(db) {
  var Tags = db.define('tags', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      unique: true
    }
  });

  return Tags;
};
