module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('projects', 'is_archived', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('projects', 'is_archived');
  }
};
