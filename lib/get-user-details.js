const constants = require('./constants');
const ohauth = require('ohauth');
const rp = require('request-promise-native');
const parser = require('xml2json');
require('dotenv').load();

/**
 * Takes an oauth token and oauth token secret and verifies the user against the OSM API
 *
 * @param oauthToken {String} user's oauth token
 * @param oauthTokenSecret {String} oauth token secret
 * @returns {Promise<Object>} Resolves with user object or error
 */
function validateUser(oauthToken, oauthTokenSecret) {
  const opts = {
    consumer_secret: process.env.CONSUMER_SECRET,
    consumer_key: process.env.CONSUMER_KEY,
    signature_method: 'HMAC-SHA1',
    version: '1.0',
    token: oauthToken,
    token_secret: oauthTokenSecret
  };
  const headerGenerator = ohauth.headerGenerator(opts);
  const uri = constants.OSM_API + 'user/details';
  const requestOptions = {
    method: 'GET',
    uri: uri,
    headers: {
      Authorization: headerGenerator('GET', uri)
    }
  };

  return rp(requestOptions).then(res => {
    const data = parser.toJson(res, {
      object: true
    });
    if (data.osm && data.osm.user) {
      return data.osm.user;
    } else {
      throw new Error('invalid user xml');
    }
  });
}

function cachify(fn) {
  const cache = new Map();
  return (arg1, arg2) => {
    const cacheKey = `${arg1}${arg2}`;
    let value = cache.get(cacheKey);
    if (value) {
      return value;
    }
    value = fn(arg1, arg2);
    cache.set(cacheKey, value);
    return value;
  };
}

module.exports = cachify(validateUser);
module.exports.validateUser = validateUser;
