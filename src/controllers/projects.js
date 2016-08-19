'use strict';
var boom = require('boom');
var randomString = require('random-string');
var db = require('./../utils/dbmassive');
module.exports.listProjects = function(request, reply) {
  db.projects.find({
    status: true
  }, function(err, projects) {
    if (err) return reply(boom.badRequest(err));
    return reply(projects);
  });
};
module.exports.listProjectsById = function(request, reply) {
  db.projects.find({
    idstr: request.params.idproject,
    status: true
  }, function(err, project) {
    if (err) return reply(boom.badRequest(err));
    var objProject = project[0];
    db.tasks.find({
      idproject: request.params.idproject,
      status: true
    }, function(err, tasks) {
      if (err) return reply(boom.badRequest(err));
      tasks.forEach(function(v) {
        v.body.stats = [v.body.stats[v.body.stats.length - 1]];
      });
      objProject.tasks = tasks;
      return reply(objProject);
    });
  });
};
module.exports.createProjects = function(request, reply) {
  var data = request.payload;
  var project = {
    idstr: data.name.replace(/[^a-zA-Z]+/g, '').concat(randomString({
      length: 3
    })).toLowerCase(),
    status: true,
    body: {
      name: data.name,
      admin: data.admin,
      description: data.description
    }
  };
  db.projects.save(project, function(err, res) {
    if (err) return reply(boom.badRequest(err));
    return reply(res);
  });
};
module.exports.updateProjects = function(request, reply) {
  var data = request.payload;
  var idproject = request.params.idproject;
  var project = {
    idstr: idproject,
    status: data.status,
    body: {
      name: data.name,
      admin: data.admin,
      description: data.description
    }
  };
  db.projects.update({
    idstr: idproject
  }, {
    body: project.body
  }, function(err, res) {
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
    return reply(res[0]);
  });
};
