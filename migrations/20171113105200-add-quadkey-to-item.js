module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('items', 'quadkey', {
      type: Sequelize.STRING,
      defaultValue: null
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('projects', 'quadkey');
  }
};
