const test = require('./lib/test');
const formatLog = require('../lib/helper/format-log');

const simpleLogInput = {
  timestamp: '2017-10-31T20:24:59.402Z',
  level: 'info',
  label: 'to-fix-backend',
  context: 'index.js',
  message: 'listing on port: 8889'
};

const simpleLogOutput = `{"created":"2017-10-31T20:24:59.402Z","level":"info","label":"to-fix-backend","context":"index.js","message":"listing on port: 8889"}\n`;

const detailedLogInput = {
  timestamp: '2017-10-31T20:24:59.402Z',
  level: 'info',
  label: 'to-fix-backend',
  context: 'item route',
  event: 'get_item_response',
  message: {
    item: {
      id: 'foo',
      lockedBy: 'Mortimer Snerd',
      lockedTill: '2017-10-31T20:39:59.402Z'
    }
  }
};

const detailedLogOutput = `{"created":"2017-10-31T20:24:59.402Z","level":"info","label":"to-fix-backend","context":"item route","event":"get_item_response","item":{"id":"foo","lockedBy":"Mortimer Snerd","lockedTill":"2017-10-31T20:39:59.402Z"}}\n`;

test('simple log outputs with expected format', [], assert => {
  assert.deepEqual(formatLog(simpleLogInput), simpleLogOutput);
  assert.end();
});

test('detailed log outputs with expected format', [], assert => {
  assert.deepEqual(formatLog(detailedLogInput), detailedLogOutput);
  assert.end();
});
