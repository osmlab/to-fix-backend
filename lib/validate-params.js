const validator = require('validator');
const ErrorHTTP = require('mapbox-error').ErrorHTTP;

module.exports = function(req, res, next) {
  if (req.params.project) {
    if (!validator.isUUID(req.params.project)) {
      return next(new ErrorHTTP('Project ID must be a valid UUID', 400));
    }
  }
  return next();
};
