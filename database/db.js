require('dotenv').load();
var Sequelize = require('sequelize');

var user = process.env.PG_USER;
var password = process.env.PG_PASSWORD;
var database = process.env.PG_DATABASE;
var host = process.env.PG_HOST;
var port = process.env.PG_PORT;

var db = (module.exports = new Sequelize(database, user, password, {
  host: host,
  port: port,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  operatorsAliases: false
}));

var ProjectItems = (module.exports.ProjectItems = require('./project-items')(
  db
));
var Projects = (module.exports.Projects = require('./projects')(db));
var ProjectUserStats = (module.exports.ProjectUserStats = require('./project-user-stats')(
  db
));
var ItemComments = (module.exports.ItemComments = require('./item-comments')(
  db
));
var ItemTags = (module.exports.ItemTags = require('./item-tags')(db));

ProjectItems.belongsToMany(ItemTags, {
  through: 'projectitems_tags'
});

ItemTags.belongsToMany(ProjectItems, {
  through: 'projectitems_tags'
});

ItemComments.belongsTo(ProjectItems);

ProjectItems.belongsTo(Projects, { foreignKey: 'project_id' });
ProjectUserStats.belongsTo(Projects, { foreignKey: 'project_id' });
