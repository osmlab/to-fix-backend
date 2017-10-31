const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

// Logging levels map to npm logging levels
// enable or disable an exported logger method by commenting out/in one of these levels
const LOGGING_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

/*
example 
{
  "timestamp": "2017-10-31T20:24:59.402Z",
  "level": "info",
  "label": "to-fix-backend",
  "secondaryLabel": "index",
  "event": "app_start",
  "message": "listing on port: 8889",
  "exportLog": true
}
*/
const logDriverFormat = printf(log => {
  const {
    timestamp,
    label,
    secondaryLabel,
    level,
    message,
    exportLog,
    event
  } = log;
  return JSON.stringify({
    timestamp,
    level,
    label,
    secondaryLabel,
    event,
    message,
    exportLog
  });
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
    exportLog: false,
    event: ''
  };
  return LOGGING_LEVELS.reduce((exportedMethods, level) => {
    exportedMethods[level] = (message, { exportLog, event } = defaultOpts) =>
      logDriver.log({ level, secondaryLabel, exportLog, event, message });
    return exportedMethods;
  }, {});
};
