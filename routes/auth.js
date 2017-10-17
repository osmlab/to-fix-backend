const parser = require('xml2json');
const OAuth = require('oauth').OAuth;
const jwt = require('jwt-simple');

const constants = require('../lib/constants');

const osmOauth = new OAuth(
  'https://www.openstreetmap.org/oauth/request_token',
  'https://www.openstreetmap.org/oauth/access_token',
  process.env.OSM_CONSUMER_KEY,
  process.env.OSM_CONSUMER_SECRET,
  '1.0',
  '',
  'HMAC-SHA1'
);

module.exports = {
  redirectOsmAuth: redirectOsmAuth,
  handleOSMCallback: handleOSMCallback
};

/**
 * Redirects the user to the OSM login URL
 */
function redirectOsmAuth(req, res) {
  osmOauth.getOAuthRequestToken(function(
    error,
    oauth_token,
    oauth_token_secret
  ) {
    if (error) {
      // console.log(error);
      res.send('Authentication Failed!');
    } else {
      req.session.oauth = {
        token: oauth_token,
        token_secret: oauth_token_secret
      };
      // console.log(req.session.oauth);
      res.redirect(
        'https://openstreetmap.org/oauth/authorize?oauth_token=' + oauth_token
      );
    }
  });
}

/**
 * URL that is called by openstreetmap.org after user successfully logs in
 * This verifies the user's OSM login credentials, gets the user profile info,
 * generates a JWT token that encodes this info, and redirects back to a frontend
 * URL with the token as a query parameter
 */
function handleOSMCallback(req, res, next) {
  // console.log('SESSION: ', req.session);
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier;
    var oauth_data = req.session.oauth;

    osmOauth.getOAuthAccessToken(
      oauth_data.token,
      oauth_data.token_secret,
      oauth_data.verifier,
      function(error, oauth_access_token, oauth_access_token_secret) {
        if (error) {
          // console.log(error);
          res.send('Authentication Failure!');
        } else {
          osmOauth.get(
            `${constants.OSM_API}user/details`,
            oauth_access_token,
            oauth_access_token_secret,
            function(err, data) {
              if (err) next(err);
              const userData = parser.toJson(data, {
                object: true
              });
              const user = {
                id: userData.osm.user.id,
                username: userData.osm.user.display_name
              };
              const token = jwt.encode(user, 'secret'); //FIXME: make secret from env var
              res.json({ token: token });
            }
          );
        }
      }
    );
  } else {
    res.send('Session foobar'); // Redirect to login page
  }
}
