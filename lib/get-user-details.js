const constants = require('./constants');
const ohauth = require('ohauth');
const rp = require('request-promise-native');
const parser = require('xml2json');
const cache = require('memory-cache');
require('dotenv').load();

module.exports = function(oauthToken, oauthTokenSecret) {
  const cacheKey = `${oauthToken}${oauthTokenSecret}`;
  const cacheValue = cache.get(cacheKey);
  const cacheTimeout = 1000000;
  if (cacheValue) {
    return Promise.resolve(cacheValue);
  }
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
      cache.put(cacheKey, data.osm.user, cacheTimeout);
      return data.osm.user;
    } else {
      // QUESTION: is this correct?
      throw 'invalid user xml';
    }
  });
};
