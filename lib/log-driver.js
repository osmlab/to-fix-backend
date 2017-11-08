const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const WinstonFiretruck = require('winston-firetruck');
const formatLog = require('./helper/format-log');

// Logging levels map to npm logging levels
// enable or disable an exported logger method by commenting out/in one of these levels
const LOGGING_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

const logDriverFormat = combine(
  label({ label: 'to-fix-backend' }),
  timestamp(),
  printf(formatLog)
);

const internalLogger = createLogger({
  format: logDriverFormat,
  transports: [new transports.Console()]
});

let exportLogger;
if (process.env.LOG_STREAM_NAME && process.env.ENABLE_KINESIS_LOGGING) {
  exportLogger = createLogger({
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
} else {
  exportLogger = internalLogger;
}

module.exports = function(context) {
  const defaultOpts = {
    exportLog: false,
    event: ''
  };
  return LOGGING_LEVELS.reduce((exportedMethods, level) => {
    // message can either be a string, or an object containing arbitrary data
    exportedMethods[level] = (message, { exportLog, event } = defaultOpts) => {
      if (exportLog && !event) {
        throw new Error(
          'to export a log, you must have an event key AND exportLog to true'
        );
      }
      const log = {
        level,
        context,
        exportLog,
        event,
        message
      };
      if (exportLog && process.env.ENABLE_KINESIS_LOGGING) {
        return exportLogger.log(log);
      } else {
        return internalLogger.log(log);
      }
    };
    return exportedMethods;
  }, {});
};
