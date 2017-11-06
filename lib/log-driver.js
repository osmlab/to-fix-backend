const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const WFirehose = require('winston-firehose');

// Logging levels map to npm logging levels
// enable or disable an exported logger method by commenting out/in one of these levels
const LOGGING_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

/*
example output
{
  "created": "2017-10-31T20:24:59.402Z",
  "level": "info",
  "label": "to-fix-backend",
  "secondaryLabel": "index",
  "event": "app_start",
  "message": "listing on port: 8889"
}
*/
const logDriverFormat = combine(
  label({ label: 'to-fix-backend' }),
  timestamp(),
  printf(log => {
    const { timestamp, label, secondaryLabel, level, message, event } = log;
    return multilineStringify({
      created: timestamp,
      level,
      label,
      secondaryLabel,
      event,
      message
    });
  })
);

const exportDriver = createLogger({
  format: logDriverFormat,
  transports: [new WFirehose()]
});

const internalLogger = createLogger({
  format: logDriverFormat,
  transports: [new transports.Console()]
});

module.exports = function(secondaryLabel) {
  const defaultOpts = {
    exportLog: false,
    event: ''
  };
  return LOGGING_LEVELS.reduce((exportedMethods, level) => {
    exportedMethods[level] = (message, { exportLog, event } = defaultOpts) => {
      if (exportLog) {
        return exportDriver.log({
          level,
          secondaryLabel,
          exportLog,
          event,
          message
        });
      } else {
        return internalLogger.log({
          level,
          secondaryLabel,
          exportLog,
          event,
          message
        });
      }
    };
    return exportedMethods;
  }, {});
};

const multilineStringify = obj => {
  return JSON.stringify(obj, null, ' ');
};
