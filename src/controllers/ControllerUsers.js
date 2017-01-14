'use strict';
var requestClient = require('request');
var oAuth = require('oauth-1.0a');
var crypto = require('crypto');
var AWS = require('aws-sdk');
var boom = require('boom');
var elasticsearch = require('elasticsearch');
var parseString = require('xml2js').parseString;
var AwsEsConnector = require('http-aws-es');
var d3 = require('d3-queue');
var JWT = require('jsonwebtoken');
var shortid = require('shortid');
var config = require('./../configs/config');
var osmAuthconfig = require('./../configs/config.json')[config.NODE_ENV];
var localClient = require('./../utils/connection');
var client;

if (config.envType) {
  var creds = new AWS.ECSCredentials();
  creds.get();
  creds.refresh(function(err) {
    if (err) throw err;
    var amazonES = {
      region: config.region,
      credentials: creds
    };
    client = new elasticsearch.Client({
      host: config.ElasticHost,
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
    key: osmAuthconfig.openstreetmap.key,
    secret: osmAuthconfig.openstreetmap.secret
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

module.exports.auth = function(request, reply) {
  if (request.session || request.yar) {
    var resp = (request.session || request.yar).get('grant').response;
    var token = {
      key: resp.access_token,
      secret: resp.access_secret
    };

    var q = d3.queue(1);
    var osmuser;
    var userExists = false;

    q.defer(function(cb) {
      requestClient({
        url: reqData.url,
        method: reqData.method,
        form: oauth.authorize(reqData, token)
      }, function(error, response, body) {
        if (error) cb(error);
        parseString(body, function(err, result) {
          if (err) cb(err);
          var user = result.osm.user;
          if (user) {
            osmuser = {
              id: user[0]['$'].id,
              user: user[0]['$'].display_name,
              img: user[0].img ? user[0].img[0]['$'].href : null,
              role: 'editor',
              scope: ['editor'],
              idsession: shortid.generate()
            };
            cb();
          } else {
            cb(new Error());
          }
        });
      });
    });

    //Check if the index exist
    q.defer(function(cb) {
      if (!indexExists()) {
        client.indices.create({
          index: config.index
        }, function(err) {
          if (err) return reply(boom.badRequest(err));
          cb();
        });
      } else {
        cb();
      }
    });

    //Check if the type exist
    q.defer(function(cb) {
      client.indices.existsType({
        index: config.index,
        type: 'users'
      }, function(err, resp) {
        if (err) cb(err);
        if (!resp) {
          osmuser.role = 'superadmin';
          osmuser.scope[0] = 'superadmin';
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
        userExists = exists;
        if (exists) {
          client.get({
            index: config.index,
            type: 'users',
            id: osmuser.id
          }, function(err, resp) {
            if (err) cb(err);
            osmuser = resp._source;
            osmuser.idsession = shortid.generate();
            cb();
          });
        } else {
          cb();
        }
      });
    });

    q.defer(function(cb) {
      if (!userExists) {
        //save user if not exist
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
        //update a user if exist
        client.update({
          index: config.index,
          type: 'users',
          id: osmuser.id,
          body: {
            doc: osmuser
          }
        }, function(err) {
          if (err) cb(err);
          cb();
        });
      }
    });

    q.await(function(error) {
      if (error) return reply(boom.unauthorized('Authentication failure'));
      var token = getToken(osmuser);
      osmuser.token = token;
      var qs = Object.keys(osmuser).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(osmuser[key]);
      }).join('&');
      reply.redirect(`${osmAuthconfig.server.redirect}?${qs}`);
    });
  } else {
    return reply(boom.unauthorized('Authentication failure'));
  }
};

module.exports.getUser = function(request, reply) {
  var userId = request.params.userId;
  client.get({
    index: config.index,
    type: 'users',
    id: userId
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    reply(resp._source);
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
    });
    reply({
      users: users
    });
  });
};

module.exports.changeRole = function(request, reply) {
  var data = request.payload;
  client.update({
    index: config.index,
    type: 'users',
    id: data.userId,
    body: {
      doc: {
        role: data.role,
        scope: [data.role]
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    return reply({
      index: resp._index,
      type: resp._type,
      key: resp._id,
      status: 'updated'
    });
  });
};

module.exports.deleteUser = function(request, reply) {
  var data = request.payload;
  client.delete({
    index: config.index,
    type: 'users',
    id: data.userId
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    return reply({
      index: resp._index,
      type: resp._type,
      key: resp._id,
      status: 'deleted'
    });
  });
};

module.exports.userDetails = function(request, reply) {
  reply(request.auth.credentials);
};

module.exports.logout = function(request, reply) {
  var decoded = request.auth.credentials;
  client.get({
    index: config.index,
    type: 'users',
    id: decoded.id
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var osmuser = resp._source;
    osmuser.idsession = null;
    client.update({
      index: config.index,
      type: 'users',
      id: decoded.id,
      body: {
        doc: osmuser
      }
    }, function(err) {
      if (err) return reply(boom.badRequest(err));
      return reply({
        status: 'Logout successful'
      });
    });
  });
};

function indexExists() {
  return client.indices.exists({
    index: config.index
  });
}

function getToken(osmuser) {
  var time = '1d';
  if (osmuser.role === 'machine') {
    time = '366d';
  }
  var secretKey = config.JWT;
  return JWT.sign(osmuser, secretKey, {
    expiresIn: time
  });
}
