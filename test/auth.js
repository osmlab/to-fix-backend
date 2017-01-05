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
  controllerUsers.auth(request, reply);

  function reply(auth) {
    cb(auth);
  }
};