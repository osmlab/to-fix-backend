'use strict';

module.exports = {
  up: queryInterface => {
    return queryInterface.addIndex('projects', {
      fields: ['is_archived']
    });
  },
  down: queryInterface => {
    return queryInterface.removeIndex('projects', {
      fields: ['is_archived']
    });
  }
};
