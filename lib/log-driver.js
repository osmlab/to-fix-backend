const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

// Logging levels map to npm logging levels
// enable or disable an exported logger method by commenting out/in one of these levels
const LOGGING_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

// example: 2017-10-31T18:48:58.821Z [to-fix-backend:some_route] info: somebody hit a route
const logDriverFormat = printf(log => {
  const exportLog = log.exportLog ? 'EXPORT' : '';
  return `${exportLog} ${log.timestamp} [${log.label}:${log.secondaryLabel}] ${log.level}: ${log.message}`;
});

const logDriver = createLogger({
  format: combine(
    label({ label: 'to-fix-backend' }),
    timestamp(),
    logDriverFormat
  ),
  transports: [new transports.Console()]
});

module.exports = function(secondaryLabel) {
  const defaultOpts = {
    exportLog: false
  };
  return LOGGING_LEVELS.reduce((exportedMethods, level) => {
    exportedMethods[level] = (message, { exportLog } = defaultOpts) =>
      logDriver[level]({ secondaryLabel, exportLog, message });
    return exportedMethods;
  }, {});
};
