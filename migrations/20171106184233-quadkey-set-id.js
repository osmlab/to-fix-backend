module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('projects', 'quadkey_set_id', {
      type: Sequelize.STRING,
      defaultValue: null
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('projects', 'quadkey_set_id');
  }
};
