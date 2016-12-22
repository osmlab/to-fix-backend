'use strict';
module.exports.lockPeriod = 10 * 60; //for an item 10 min
module.exports.lockPeriodGroup = 60 * 60; //for an hour
module.exports.maxNum = 2147483647;
module.exports.password = process.env.UploadPassword;
module.exports.messages = {
  badData: 'The data is bad and you should fix it.',
  dataGone: 'The task is already finished or the items are already working by someone else.',
  wrongPassword: 'password does not match.'
};
module.exports.arrayChunks = 2000;
module.exports.region = 'us-east-1';
module.exports.index = process.env.EsIndex || 'tofix';
module.exports.consumerKey = '3JbsSK6fPxeoU8Utht0K0DmaPAPNl3Euu13YjESu';
module.exports.consumerSecret = 'nB0oSE7qiJl3zhAiKrqrfLG1SmIIWzbGs9MzaMD9';
module.exports.osmApi = 'http://api.openstreetmap.org/api/0.6/';
