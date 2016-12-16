'use strict';
var request = require('request');
var oAuth = require('oauth-1.0a');
var crypto = require('crypto');
var boom = require('boom');
var parseString = require('xml2js').parseString;
var config = require('./../configs/config');

/* eslint-disable camelcase */
var oauth = oAuth({
  consumer: {
    key: config.consumerKey,
    secret: config.consumerSecret
  },
  signature_method: 'HMAC-SHA1',
  hash_function: function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  }
});
var reqData = {
  url: config.osmApi + 'user/details',
  method: 'GET'
};

module.exports.auth = function(req, reply) {
  var response = (req.session || req.yar).get('grant').response;
  var token = {
    key: response.access_token,
    secret: response.access_secret
  };
  request({
    url: reqData.url,
    method: reqData.method,
    form: oauth.authorize(reqData, token)
  }, function(error, response, body) {
    if (error) return reply(boom.badRequest(error));
    parseString(body, function(err, result) {
      if (err) return reply(boom.badRequest(err));
      var osmuser = {
        id: result.osm.user[0]['$'].id,
        display_name: result.osm.user[0]['$'].display_name,
        img: result.osm.user[0].img ? result.osm.user[0].img[0]['$'].href : null
      };
      reply(osmuser);
    });
  });
};

/* eslint-enable camelcase */
