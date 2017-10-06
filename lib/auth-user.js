const getUserDetails = require('./get-user-details');

/**
 * Middleware to handle user authentication
 *
 * Currently receives oauth_token and oauth_token_secret as query params
 * Calls out to getUserDetails to verify user and fetch details
 */
module.exports = function(req, res, next) {
  // TODO: think about a way to support robot users that do not have an OSM account
  // TODO: think about different permissions types based on the user

  // These two tokens are stored in localStorage after signing in with osm-auth
  const oauthToken = req.query.oauth_token;
  const oauthTokenSecret = req.query.oauth_token_secret;

  //TODO: cache the resolution of the promise for this combination of token / secret
  getUserDetails(oauthToken, oauthTokenSecret)
    .then(user => {
      req.user = user.display_name;
      next();
    })
    .catch(next);
};
