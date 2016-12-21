'use strict';
var request = require('request');
var oAuth = require('oauth-1.0a');
var crypto = require('crypto');
var AWS = require('aws-sdk');
var boom = require('boom');
var elasticsearch = require('elasticsearch');
var parseString = require('xml2js').parseString;
var AwsEsConnector = require('http-aws-es');
var config = require('./../configs/config');
var localClient = require('./../utils/connection');

var client;
if (process.env.NODE_ENV === 'production') {
  var creds = new AWS.ECSCredentials();
  creds.get();
  creds.refresh(function(err) {
    if (err) throw err;
    var amazonES = {
      region: config.region,
      credentials: creds
    };
    client = new elasticsearch.Client({
      host: process.env.ElasticHost,
      connectionClass: AwsEsConnector,
      amazonES: amazonES
    });
  });
} else {
  client = localClient.connect();
}

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
  var token = isAthorized(req);
  if (token) {
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
          user: result.osm.user[0]['$'].display_name,
          img: result.osm.user[0].img ? result.osm.user[0].img[0]['$'].href : null,
          role: 'editor'
        };
        //save a user
        client.exists({
          index: 'tofix',
          type: 'users',
          id: osmuser.user.toLowerCase()
        }, function(error, exists) {
          if (exists === true) {
            return reply(osmuser);
          } else {
            client.create({
              index: 'tofix',
              type: 'users',
              id: osmuser.user.toLowerCase(),
              body: osmuser
            }, function(err) {
              if (err) return reply(boom.badRequest(err));
              return reply(osmuser);
            });
          }
        });
      });
    });
  } else {
    return reply(boom.unauthorized('Bad authentications'));
  }
};

module.exports.userDetails = function(req, reply) {
  var token = isAthorized(req);
  if (token) {
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
          user: result.osm.user[0]['$'].display_name,
          img: result.osm.user[0].img ? result.osm.user[0].img[0]['$'].href : null
        };
        reply(osmuser);
      });
    });
  } else {
    return reply(boom.unauthorized('Bad authentications'));
  }
};

module.exports.getUser = function(request, reply) {
  var user = request.params.user;
  client.get({
    index: 'tofix',
    type: 'users',
    id: user.toLowerCase()
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp._source);
  });
};

module.exports.changeRole = function(request, reply) {
  var user = request.params.user;
  var data = request.payload;
  if (isAthorized(request)) {
    client.update({
      index: 'tofix',
      type: 'users',
      id: user.toLowerCase(),
      body: {
        doc: {
          role: data.role
        }
      }
    }, function(err, res) {
      if (err) console.log(err);
      return reply(res);
    });
  } else {
    return reply(boom.unauthorized('Bad authentications'));
  }
};

function isAthorized(request) {
  if (request.session || request.yar) {
    var resp = (request.session || request.yar).get('grant').response;
    if (resp) {
      return {
        key: resp.access_token,
        secret: resp.access_secret
      };
    } else {
      return false;
    }
  } else {
    return false;
  }
}
