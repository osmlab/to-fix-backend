'use strict';
module.exports.lockPeriod = 10 * 60; //for an item 10 min
module.exports.lockPeriodGroup = 60 * 60; //for an hour
module.exports.maxNum = 2147483647;
module.exports.messages = {
  badData: 'The data is bad and you should fix it.',
  dataGone: 'The task is already finished or the items are already working by someone else.',
  wrongPassword: 'password does not match.'
};
module.exports.arrayChunks = 1000;
module.exports.region = 'us-east-1';
module.exports.ElasticHost = process.env.ElasticHost || 'localhost:9200';
module.exports.Port = process.env.Port || 8000;
module.exports.index = process.env.EsIndex || 'tofix';
module.exports.sessionPassword = process.env.Password || 'abcdefghigklmnopqrsdasdasdadadadsdtuvwxyz123456';
module.exports.NODE_ENV = process.env.NODE_ENV || 'development';
module.exports.JWT = process.env.JWT || 'kiraargos';
module.exports.envType = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'internal';
module.exports.osmApi = 'http://api.openstreetmap.org/api/0.6/';
