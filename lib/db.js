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
  }
}));

var TaskItems = (module.exports.TaskItems = require('./task-items')(db));
var Tasks = (module.exports.Tasks = require('./tasks')(db));
var TaskUserStats = (module.exports.TaskUserStats = require('./task-user-stats')(
  db
));
var ItemComments = (module.exports.ItemComments = require('./item-comments')(
  db
));
var ItemTags = (module.exports.ItemTags = require('./item-tags')(db));

TaskItems.belongsToMany(ItemTags, {
  through: 'taskitems_tags'
});

ItemTags.belongsToMany(TaskItems, {
  through: 'taskitems_tags'
});

ItemComments.belongsTo(TaskItems);

TaskItems.belongsTo(Tasks, { foreignKey: 'task_id' });
TaskUserStats.belongsTo(Tasks, { foreignKey: 'task_id' });
