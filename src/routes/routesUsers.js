'use strict';
var controllerUsers = require('./../controllers/ControllerUsers');

module.exports = [{
  method: 'GET',
  path: '/handle_openstreetmap_callback',
  handler: controllerUsers.auth
}, {
  method: 'GET',
  path: '/user/details',
  handler: controllerUsers.userDetails
}];
