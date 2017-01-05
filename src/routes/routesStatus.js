'use strict';
var controllerStatus = require('./../controllers/ControllerStatus');

module.exports = [{
  method: 'GET',
  path: '/',
  config: {
    auth: false,
    description: 'Confirms the server is working',
    handler: controllerStatus.status
  }
}];
