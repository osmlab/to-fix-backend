'use strict';
var request = require('request');
var oAuth = require('oauth-1.0a');
var crypto = require('crypto');
var AWS = require('aws-sdk');
var boom = require('boom');
var elasticsearch = require('elasticsearch');
var parseString = require('xml2js').parseString;
var AwsEsConnector = require('http-aws-es');
var d3 = require('d3-queue');
var config = require('./../configs/config');
var localClient = require('./../utils/connection');

var client;
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
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
  if (req.session || req.yar) {
    var resp = (req.session || req.yar).get('grant').response;
    console.log(resp);
    var token = {
      key: resp.access_token,
      secret: resp.access_secret
    };
    console.log(token);

    var q = d3.queue(1);
    var osmuser;
    var userExists = false;

    q.defer(function(cb) {
      request({
        url: reqData.url,
        method: reqData.method,
        form: oauth.authorize(reqData, token)
      }, function(error, response, body) {
        if (error) cb(error);
        parseString(body, function(err, result) {
          if (err) cb(err);
          osmuser = {
            id: result.osm.user[0]['$'].id,
            user: result.osm.user[0]['$'].display_name,
            img: result.osm.user[0].img ? result.osm.user[0].img[0]['$'].href : null,
            role: 'editor'
          };
          cb();
        });
      });
    });

    q.defer(function(cb) {
      client.count({
        index: config.index,
        type: 'users'
      }, function(err, resp) {
        if (err) cb(err);
        if (resp.count === 0) {
          osmuser.role = 'superadmin';
        }
        cb();
      });
    });

    q.defer(function(cb) {
      client.exists({
        index: config.index,
        type: 'users',
        id: osmuser.id
      }, function(err, exists) {
        if (err) cb(err);
        if (exists === true) {
          userExists = true;
          client.get({
            index: config.index,
            type: 'users',
            id: osmuser.id
          }, function(err, resp) {
            if (err) cb(err);
            osmuser = resp._source;
            cb();
          });
        } else {
          cb();
        }
      });
    });
    q.defer(function(cb) {
      if (!userExists) {
        client.create({
          index: config.index,
          type: 'users',
          id: osmuser.id,
          body: osmuser
        }, function(err) {
          if (err) cb(err);
          cb();
        });
      } else {
        cb();
      }
    });
    q.await(function(error) {
      if (error) return reply(boom.unauthorized('Bad authentications'));
      req.yar.set('osmuser', osmuser);
      return reply(osmuser);
    });
  } else {
    return reply(boom.unauthorized('Bad authentications'));
  }
};

module.exports.userDetails = function(req, reply) {
  if (req.session || req.yar) {
    var user = (request.session || request.yar).get('osmuser');
    return reply(user);
  } else {
    return reply(boom.unauthorized('Bad authentications'));
  }
};

module.exports.getUser = function(request, reply) {
  var user = request.params.user;
  // reply(isAuthenticated(request));
  client.search({
    index: config.index,
    type: 'users',
    body: {
      query: {
        filtered: {
          query: {
            match: {
              user: user
            }
          }
        }
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp.hits.hits[0]._source);
  });
};


module.exports.listUsers = function(request, reply) {
  client.search({
    index: config.index,
    type: 'users',
    body: {
      size: 200,
      query: {
        match_all: {}
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var users = resp.hits.hits.map(function(v) {
      return v._source;
      // return v;
    });
    reply({
      users: users
    });
  });
};

module.exports.changeRole = function(request, reply) {
  var user = request.params.user;
  var data = request.payload;
  if (isAuthenticated(request)) {
    client.search({
      index: config.index,
      type: 'users',
      body: {
        query: {
          filtered: {
            query: {
              match: {
                user: user
              }
            }
          }
        }
      }
    }, function(err, resp) {
      if (err) return reply(boom.badRequest(err));
      var id = resp.hits.hits[0]._source.id;
      client.update({
        index: config.index,
        type: 'users',
        id: id,
        body: {
          doc: {
            role: data.role
          }
        }
      }, function(err, resp) {
        if (err) console.log(err);
        return reply({
          index: resp._index,
          type: resp._type,
          key: resp._id,
          user: user,
          status: 'updated'
        });
      });
    });
  } else {
    return reply(boom.unauthorized('Bad authentications'));
  }
};

module.exports.deleteUser = function(request, reply) {
  var id = request.params.id;
  console.log(id);
  client.delete({
    index: config.index,
    type: 'users',
    id: id
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp);
  });
};

function isAuthenticated(request) {
  if (request.session || request.yar) {
    var user = (request.session || request.yar).get('osmuser');
    if (user.role === 'superadmin') {
      return user;
    }
  }
  return null;
}
