'use strict';

module.exports = {
  up: queryInterface => {
    return queryInterface.addIndex('items', {
      fields: ['createdAt']
    });
  },
  down: queryInterface => {
    return queryInterface.removeIndex('items', {
      fields: ['createdAt']
    });
  }
};
