const db = require('../../database/index');
const Project = db.Project;
const Quadkey = db.Quadkey;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = getQuadkeyPriorities;

/**
 * Gets max quadkey priorities for a project
 *
 * @param {UUID} projectId - project id
 * @param {number} zoomLevel - zoom level at which to aggregate max priority values
 * @param {quadkey} within - quadkey substring to search within
 * @return {Promise<Array>} array of objects with `{'quadkey': '<quadkey>', 'max_priority': <float>}`
 */
function getQuadkeyPriorities(projectId, zoomLevel, within) {
  return Project.findById(projectId).then(project => {
    const setId = project.quadkey_set_id;
    return Quadkey.findAll({
      attributes: [
        [
          Sequelize.fn('substring', Sequelize.col('quadkey'), 1, zoomLevel),
          'quadkey'
        ],
        [Sequelize.fn('MAX', Sequelize.col('priority')), 'max_priority']
      ],
      where: {
        quadkey: {
          [Op.like]: `${within}%`
        },
        set_id: setId
      },
      group: [Sequelize.fn('substring', Sequelize.col('quadkey'), 1, zoomLevel)]
    });
  });
}
