const db = require('../models/index');

module.exports = {
  getStatus: getStatus
};

/**
 * Get the server status.
 * @name get-status
 * @example
 * curl https://host
 *
 * {
 *   status: 'OK'
 * }
 */
function getStatus(req, res, next) {
  db
    .authenticate()
    .then(() => {
      res.json({ status: 'OK' });
    })
    .catch(next);
}
