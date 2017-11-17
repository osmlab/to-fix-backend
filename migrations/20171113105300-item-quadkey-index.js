'use strict';

module.exports = {
  up: queryInterface => {
    return queryInterface.addIndex('items', {
      fields: ['quadkey']
    });
  },
  down: queryInterface => {
    return queryInterface.removeIndex('items', {
      fields: ['quadkey']
    });
  }
};
