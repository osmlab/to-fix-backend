'use strict';

module.exports = {
  up: queryInterface => {
    return queryInterface.addIndex('items', {
      fields: ['is_archived']
    });
  },
  down: queryInterface => {
    return queryInterface.removeIndex('items', {
      fields: ['is_archived']
    });
  }
};
