'use strict';
var oauth = require('oauth-request');
var crypto = require('crypto');
var parseString = require('xml2js').parseString;
var shortid = require('shortid');
var config = require('./../configs/config');
var osmAuthconfig = require('./../configs/config.json')[config.NODE_ENV];
/* eslint-disable camelcase */
process.on('message', function(token) {
  var reqData = {
    url: config.osmApi + 'user/details',
    method: 'GET'
  };
  var consumer = {
    key: osmAuthconfig.openstreetmap.key,
    secret: osmAuthconfig.openstreetmap.secret
  };
  var osmAuth = oauth({
    consumer: consumer,
    signature_method: 'HMAC-SHA1',
    hash_function: function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64');
    }
  });
  osmAuth.setToken(token);
  osmAuth.get(reqData.url, function(err, res, body) {
    if (err) {
      process.send(err);
    } else {
      parseString(body, function(err, result) {
        if (err) process.send(err);
        var user = result.osm.user;
        if (user) {
          var osmuser = {
            id: user[0]['$'].id,
            user: user[0]['$'].display_name,
            img: user[0].img ? user[0].img[0]['$'].href : null,
            role: 'editor',
            scope: ['editor'],
            idsession: shortid.generate()
          };
          process.send(osmuser);
        } else {
          process.send(new Error());
        }
      });
    }
  });
});
