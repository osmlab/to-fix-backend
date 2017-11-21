module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('items', 'is_archived', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('items', 'is_archived');
  }
};
