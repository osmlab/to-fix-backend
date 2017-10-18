const db = require('../database/index');

module.exports = {
  getStatus: getStatus
};

/**
 * Get the status of server
 * @name get-status
 * @example
 * curl https://host/
 *  { status: 'OK' }
 */
function getStatus(req, res, next) {
  db
    .authenticate()
    .then(() => {
      res.json({ status: 'OK' });
    })
    .catch(next);
}
