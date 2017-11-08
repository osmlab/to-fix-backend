/*
example output
{
  "created": "2017-10-31T20:24:59.402Z",
  "level": "info",
  "label": "to-fix-backend",
  "context": "index",
  "event": "app_start",
  "message": "listing on port: 8889"
}
*/
const formatLog = log => {
  const { timestamp, label, context, level, message, event } = log;
  const standardLog = {
    created: timestamp,
    level,
    label,
    context,
    event,
    message
  };
  if (typeof message === 'string') {
    return newlineStringify(standardLog);
  } else if (typeof message === 'object') {
    delete standardLog.message;
    return newlineStringify(Object.assign(standardLog, message));
  }
};

const newlineStringify = obj => {
  return `${JSON.stringify(obj)}\n`;
};

module.exports = formatLog;
