const db = require('../database/index');

module.exports = {
  getStatus: getStatus
};

/**
 * Get the server status.
 * @name get-status
 * @example
 * curl https://host
 */
function getStatus(req, res, next) {
  db
    .authenticate()
    .then(() => {
      res.json({ status: 'OK' });
    })
    .catch(next);
}
