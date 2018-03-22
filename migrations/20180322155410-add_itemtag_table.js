'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ItemTag', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      tag_author: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      createdAt: {
        type: Sequelize.DATE,
        field: 'createdAt'
      },
      updatedAt: {
        type: Sequelize.DATE,
        field: 'updatedAt'
      }
    });
  },

  down: queryInterface => {
    return queryInterface.dropTable('ItemTag');
  }
};
