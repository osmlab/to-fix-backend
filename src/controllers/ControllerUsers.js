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

var config = require('./../configs/config');
var osmAuthconfig = require('./../configs/config.json')[process.env.NODE_ENV || 'development'];
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
          osmuser = {
            id: result.osm.user[0]['$'].id,
            user: result.osm.user[0]['$'].display_name,
            img: result.osm.user[0].img ? result.osm.user[0].img[0]['$'].href : null,
            role: 'editor',
            scope: ['editor']
          };
          cb();
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
      // request.yar.set('osmuser', osmuser);
      var token = getToken(osmuser);
      osmuser.token = token;
      var qs = Object.keys(osmuser).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(osmuser[key]);
      }).join('&');
      // reply.redirect(`${osmAuthconfig.server.redirect}?${qs}`);
      return reply(osmuser);
    });
  } else {
    return reply(boom.unauthorized('Bad authentications'));
  }
};

module.exports.userDetails = function(request, reply) {
  if (request.yar && request.yar.get('osmuser')) {
    var user = request.yar.get('osmuser');
    return reply(user);
  } else {
    return reply(boom.unauthorized('Bad authentications'));
  }
};

module.exports.getUser = function(request, reply) {
  var user = request.params.user;
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
    });
    reply({
      users: users
    });
  });
};

module.exports.changeRole = function(request, reply) {
  var data = request.payload;
  client.search({
    index: config.index,
    type: 'users',
    body: {
      query: {
        filtered: {
          query: {
            match: {
              user: request.params.user
            }
          }
        }
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var user = resp.hits.hits[0]._source;
    var id = user.id;
    user.role = data.role;
    user.scope[0] = data.role;
    client.update({
      index: config.index,
      type: 'users',
      id: id,
      body: {
        doc: user
      }
    }, function(err, resp) {
      if (err) return reply(boom.badRequest(err));
      return reply({
        index: resp._index,
        type: resp._type,
        key: resp._id,
        user: user,
        status: 'updated'
      });
    });
  });
};

module.exports.deleteUser = function(request, reply) {
  client.search({
    index: config.index,
    type: 'users',
    body: {
      query: {
        filtered: {
          query: {
            match: {
              user: request.payload.user
            }
          }
        }
      }
    }
  }, function(err, resp) {
    if (err) return reply(boom.badRequest(err));
    var user = resp.hits.hits[0]._source;
    client.delete({
      index: config.index,
      type: 'users',
      id: user.id
    }, function(err, resp) {
      if (err) return reply(boom.badRequest(err));
      reply(resp);
    });
  });
};

module.exports.logout = function(request, reply) {
  console.log(request, reply);
};

function indexExists() {
  return client.indices.exists({
    index: config.index
  });
}

function getToken(osmuser) {
  var secretKey = process.env.JWT || 'kiraargos';
  return JWT.sign(osmuser, secretKey, {
    expiresIn: '30d'
  });
}
