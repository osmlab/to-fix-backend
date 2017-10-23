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

var Project = (module.exports.Project = require('./project')(db));
var Item = (module.exports.Item = require('./item')(db));
var Comment = (module.exports.Comment = require('./comment')(db));
var Tag = (module.exports.Tag = require('./tag')(db));
var Stat = (module.exports.Stat = require('./stat')(db));

Item.belongsTo(Project, { foreignKey: 'project_id', targetKey: 'id' });
Tag.belongsTo(Project, { foreignKey: 'project_id', targetKey: 'id' });
Stat.belongsTo(Project, { foreignKey: 'project_id', targetKey: 'id' });

// Comment.belongsTo(Item, { foreignKey: 'item_id', targetKey: 'auto_id' });
Item.hasMany(Comment);

Item.belongsToMany(Tag, { through: 'item_tag' });
Tag.belongsToMany(Item, { through: 'item_tag' });
