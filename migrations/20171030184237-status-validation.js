'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('items', 'status_validated', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('items', 'status_validated');
  }
};
