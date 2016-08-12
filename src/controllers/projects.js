'use strict';

const massive = require("massive");
const boom = require('boom');
const config = require('./../configs/config');
let db;

module.exports.init = function(dbconnection) {
  db = dbconnection;
};

module.exports.getAllProjects = function(request, reply) {
  db.projects.find({}, function(err, projects) {
    reply(projects);
  });
};

module.exports.getAProjects = function(request, reply) {
  db.projects.find({
    idstr: request.params.idproject
  }, function(err, project) {
    reply(project);
  });
};

module.exports.saveProjects = function(request, reply) {
  const data = request.payload;
  var project = {
    'idstr': data.name.replace(/[^a-zA-Z]+/g, '').toLowerCase(),
    'name': data.name,
    'admin': data.admin,
    'status': true
  };
  db.projects.save(project, function(err, res) {
    reply(res);
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
    reply(res);
  });
};

module.exports.deleteProjects = function(request, reply) {
  db.projects.update({
    idstr: request.params.idproject
  }, {
    'status': false
  }, function(err, res) {
    reply(res);
  });
};

module.exports.getTasksPerProject = function(request, reply) {
  db.tasks.find({
    idproject: request.params.idproject
  }, function(err, project) {
    reply(project);
  });
};