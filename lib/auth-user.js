const getUserDetails = require('./get-user-details');

module.exports = function(req, res, next) {
  // TODO: user req.query.access_token to validate the user againts the osm api
  // TODO: think about a way to support robot users that do not have an OSM account
  // TODO: think about different permissions types based on the user

  // These two tokens are stored in localStorage after signing in with osm-auth
  const oauthToken = req.query.oauth_token;
  const oauthTokenSecret = req.query.oauth_token_secret;

  //TODO: cache the resolution of the promise for this combination of token / secret
  getUserDetails(oauthToken, oauthTokenSecret)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(next);
};
