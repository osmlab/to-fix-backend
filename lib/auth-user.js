const getUserDetails = require('./get-user-details');

const cachedGetUserDetails = cachify(getUserDetails);

function cachify(fn) {
  const cache = new Map();
  return (arg1, arg2) => {
    const cacheKey = `${arg1}${arg2}`;
    let value = cache.get(cacheKey);
    if (value) {
      return value;
    }
    value = fn(arg1, arg2);
    // only cache resolved promises
    value.then(() => cache.set(cacheKey, value));

    return value;
  };
}

/**
 * Middleware to handle user authentication
 *
 * Currently receives oauth_token and oauth_token_secret as query params
 * Calls out to getUserDetails to verify user and fetch details
 */
module.exports = function(req, res, next) {
  // TODO: think about a way to support robot users that do not have an OSM account
  // TODO: think about different permissions types based on the user

  // for testing environment skip this middleware
  if (process.env.NODE_ENV === 'test') {
    req.user = 'userone';
    return next();
  }
  // These two tokens are stored in localStorage after signing in with osm-auth
  const oauthToken = req.query.oauth_token;
  const oauthTokenSecret = req.query.oauth_token_secret;

  if (!oauthToken || !oauthTokenSecret) {
    return next(new Error('must provide oauthToken & oauthTokenSecret'));
  }
  cachedGetUserDetails(oauthToken, oauthTokenSecret)
    .then(user => {
      req.user = user.display_name;
      next();
    })
    .catch(next);
};
