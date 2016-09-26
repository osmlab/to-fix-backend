'use strict';
var controllerStatus = require('./../controllers/ControllerStatus');

module.exports = [{
  method: 'GET',
  path: '/',
  config: {
    description: 'Confirms the server is working',
    handler: controllerStatus.status
  }
}];
