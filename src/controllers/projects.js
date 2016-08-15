'use strict';
var massive = require('massive');
var boom = require('boom');
var config = require('./../configs/config');

var db = massive.connectSync({
  connectionString: config.connectionString
});

module.exports.getAllProjects = function(request, reply) {
  db.projects.find({}, function(err, projects) {
    if (err) return reply(boom.badRequest(err));
    return reply(projects);
  });
};

module.exports.getAProjects = function(request, reply) {
  db.projects.find({
    idstr: request.params.idproject
  }, function(err, project) {
    if (err) return reply(boom.badRequest(err));
    return reply(project);
  });
};

module.exports.saveProjects = function(request, reply) {
  var data = request.payload;
  var project = {
    idstr: data.name.replace(/[^a-zA-Z]+/g, '').toLowerCase(),
    body: {
      name: data.name,
      admin: data.admin,
      status: true
    }
  };
  db.projects.save(project, function(err, res) {
    if (err) return reply(boom.badRequest(err));
    return reply(res);
  });
};

module.exports.updateProjects = function(request, reply) {
  var project = {
    'idstr': request.params.idproject,
    'name': request.payload.name,
    'admin': request.payload.admin,
    'status': request.payload.status
  };
  db.projects.update({
    idstr: project.idstr
  }, project, function(err, res) {
    if (err) return reply(boom.badRequest(err));
    return reply(res);
  });
};

module.exports.deleteProjects = function(request, reply) {
  db.projects.update({
    idstr: request.params.idproject
  }, {
    'status': false
  }, function(err, res) {
    if (err) return reply(boom.badRequest(err));
    return reply(res);
  });
};

module.exports.getTasksPerProject = function(request, reply) {
  db.tasks.find({
    idproject: request.params.idproject
  }, function(err, project) {
    if (err) return reply(boom.badRequest(err));
    return reply(project);
  });
};
