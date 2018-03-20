"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn("items", "lastModifiedBy", Sequelize.STRING);
    queryInterface.addColumn("items", "lastModifiedDate", Sequelize.STRING);
  },

  down: queryInterface => {
    queryInterface.removeColumn("items", "lastModifiedBy");
    queryInterface.removeColumn("items", "lastModifiedDate");
  }
};
