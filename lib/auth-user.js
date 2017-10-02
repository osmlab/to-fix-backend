module.exports = function(req, res, next) {
  // TODO: user req.query.access_token to validate the user againts the osm api
  // TODO: think about a way to support robot users that do not have an OSM account
  // TODO: think about different permissions types based on the user
  req.user = 'userone';
  next();
};
