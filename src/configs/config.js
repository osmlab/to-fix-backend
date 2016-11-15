'use strict';
module.exports.lockPeriod = 10 * 60; //for an item 10 min
module.exports.lockPeriodGroup = 60 * 60; //for an hour
module.exports.maxNum = 2147483647;
module.exports.skipItem = 30; //half minute for skip items
module.exports.password = process.env.UploadPassword;
module.exports.messages = {
  badData: 'The data is bad and you should fix it.',
  dataGone: 'The task is already finished or the items are already working by someone else.',
  wrongPassword: 'password does not match.'
};
module.exports.arrayChunks = 2000;
module.exports.region = 'us-east-1';
