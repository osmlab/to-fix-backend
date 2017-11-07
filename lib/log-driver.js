const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const WinstonFiretruck = require('winston-firetruck');

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
const formatLog = log => {
  const { timestamp, label, secondaryLabel, level, message, event } = log;
  return newlineStringify({
    created: timestamp,
    level,
    label,
    secondaryLabel,
    event,
    message
  });
};
const logDriverFormat = combine(
  label({ label: 'to-fix-backend' }),
  timestamp(),
  printf(formatLog)
);

const exportDriver = createLogger({
  format: logDriverFormat,
  transports: [
    new WinstonFiretruck({
      formatMessage: formatLog,
      firehoseParams: {
        DeliveryStreamName: process.env.LOG_STREAM_NAME
      }
    })
  ]
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
      const log = {
        level,
        secondaryLabel,
        exportLog,
        event,
        message
      };
      if (exportLog && process.env.ENABLE_KINESIS_LOGGING) {
        return exportDriver.log(log);
      } else {
        return internalLogger.log(log);
      }
    };
    return exportedMethods;
  }, {});
};

const newlineStringify = obj => {
  return `${JSON.stringify(obj)}\n`;
};
