require('dotenv').load();

const parser = require('xml2json');
const OAuth = require('oauth').OAuth;
const jwt = require('jwt-simple');
const _ = require('lodash');

const constants = require('../lib/constants');

const osmOauth = new OAuth(
  constants.OSM_REQUEST_TOKEN_URL,
  constants.OSM_ACCESS_TOKEN_URL,
  process.env.CONSUMER_KEY,
  process.env.CONSUMER_SECRET,
  '1.0',
  '',
  'HMAC-SHA1'
);

module.exports = {
  redirectOsmAuth: redirectOsmAuth,
  handleOSMCallback: handleOSMCallback,
  authJOSM: authJOSM
};

// Redirects the user to the OSM login URL
function redirectOsmAuth(req, res) {
  osmOauth.getOAuthRequestToken(function(
    error,
    oauth_token,
    oauth_token_secret
  ) {
    if (error) {
      res.send('Authentication Failed!');
    } else {
      req.session.oauth = {
        token: oauth_token,
        token_secret: oauth_token_secret
      };
      res.redirect(
        `https://openstreetmap.org/oauth/authorize?oauth_token=${oauth_token}`
      );
    }
  });
}

// URL that is called by openstreetmap.org after user successfully logs in
// This verifies the user's OSM login credentials, gets the user profile info,
// generates a JWT token that encodes this info, and redirects back to a frontend
// URL with the token as a query parameter
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
              if (err) {
                return next(err);
              }

              const userData = parser.toJson(data, {
                object: true
              });

              const user = {
                id: _.get(userData, 'osm.user.id'),
                username: _.get(userData, 'osm.user.display_name', ''),
                image: _.get(userData, 'osm.user.img.href', '')
              };

              const token = jwt.encode(user, process.env.APP_SECRET);
              res.redirect(
                `${process.env.FRONTEND_URL}/landing.html?token=${token}`
              );
            }
          );
        }
      }
    );
  } else {
    res.redirect('/auth/openstreetmap'); // Redirect to login page
  }
}

function authJOSM(req, res) {
  if (JSON.stringify(req.query).length > 2) {
    const user = {
      id: req.query.id,
      username: req.query.name,
      image: req.query.image
    };
    res.json(
      _.merge(user, { tfx_token: jwt.encode(user, process.env.APP_SECRET) })
    );
  } else {
    res.json({ msg: 'Authentication Failure!' });
  }
}
