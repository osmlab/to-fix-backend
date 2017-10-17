const OAuth = require('oauth').OAuth;
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

function handleOSMCallback(req, res) {
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
          req.session.oauth.access_token = oauth_access_token;
          req.session.oauth.access_token_secret = oauth_access_token_secret;
          // console.log(results, req.session.oauth);
          res.send('Authentication Successful');
          // res.redirect('/'); // You might actually want to redirect!
        }
      }
    );
  } else {
    res.send('Session foobar'); // Redirect to login page
  }
}
