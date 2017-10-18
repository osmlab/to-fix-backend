const db = require('../database/db');
const ItemTags = db.ItemTags;
const ErrorHTTP = require('mapbox-error').ErrorHTTP;

module.exports = {
  /* Project-level operations */
  getProjectTags: getProjectTags,
  createProjectTag: createProjectTag,
  getProjectTag: getProjectTag,
  updateProjectTag: updateProjectTag,
  deleteProjectTag: deleteProjectTag,
  /* Item-level operations */
  getItemTags: getItemTags,
  createItemTag: createItemTag,
  deleteItemTag: deleteItemTag
};

/**
 */
function getProjectTags(req, res, next) {
  ItemTags.findAll({
    where: {
      project_id: req.params.project
    }
  })
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 */
function createProjectTag(req, res, next) {
  if (!req.body) return next(new ErrorHTTP('request.body is required', 422));
  if (!req.body.name)
    return next(new ErrorHTTP('request.body.name is required', 422));
  let values = { name: req.body.name, project_id: req.params.project };
  if (req.body.metadata) values.metadata = req.body.metadata;
  ItemTags.create(values)
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 */
function getProjectTag(req, res, next) {
  ItemTags.findAll({
    where: {
      id: req.params.tag,
      project_id: req.params.project
    }
  })
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 */
function updateProjectTag(req, res, next) {
  if (!req.body) return next(new ErrorHTTP('request.body is required', 422));
  if (!req.body.name)
    return next(new ErrorHTTP('request.body.name is required', 422));

  ItemTags.update(
    {
      name: req.body.name
    },
    {
      where: {
        id: req.params.tag,
        project_id: req.params.project
      }
    }
  )
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 */
function deleteProjectTag(req, res, next) {
  ItemTags.destroy({
    where: {
      id: req.params.tag,
      project_id: req.params.project
    }
  })
    .then(function(data) {
      res.json(data);
    })
    .catch(next);
}

/**
 */
function getItemTags(req, res, next) {
  return next();
}

/**
 */
function createItemTag(req, res, next) {
  return next();
}

/**
 */
function deleteItemTag(req, res, next) {
  return next();
}
