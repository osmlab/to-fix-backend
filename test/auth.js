'use strict';
var controllerUsers = require('./../src/controllers/ControllerUsers');
var yar = {
  _grant: {
    response: {
      access_token: '208RoftKELqjEwE9EjnysDbQoYjCH7SYbUgHfvLu',
      access_secret: '5S9synVwrXwn36NvS9Ek7pYDN2McvwaG14xue4Bo'
    }
  },
  get: function(name) {
    return this['_' + name];
  },
  set: function(name, value) {
    this['_' + name] = value;
  }
};

module.exports = function(cb) {
  var request = {
    yar: yar
  };
  var reply = {
    redirect: function(auth) {
      cb(unserialize(auth));
    }
  };
  controllerUsers.auth(request, reply);
  // function reply(auth) {
  //   cb(auth);
  // }
};

function unserialize(str) {
  str = decodeURIComponent(str);
  var chunks = str.split('&'),
    obj = {};
  for (var c = 0; c < chunks.length; c++) {
    var split = chunks[c].split('=', 2);
    obj[split[0]] = split[1];
  }
  return obj;
}