const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const db = require('../database/index');
const validateBody = require('../lib/helper/validateBody');
const geojsonhint = require('@mapbox/geojsonhint');

module.exports = {
  getItemComments: getItemComments,
  getItemComment: getItemComment,
  createItemComment: createItemComment,
  updateItemComment: updateItemComment,
  deleteItemComment: deleteItemComment
};

/**
 * Get a list of comments for an item
 * @name get-item-comments
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {string} params.item - The item ID
 * @example
 * curl https://host/projects/:project/items/:item/comments
 * 
 * [
 * {
 *   "id": "e67c585d-d93f-4ea6-a59f-87b8b54e6efd",
 *   "createdBy": "usertwo",
 *   "body": "first",
 *   "coordinates": {
 *     "type": "Point",
 *     "coordinates": [
 *       0,
 *       0
 *     ]
 *   },
 *   "metadata": {},
 *   "createdAt": "2017-10-20T20:39:06.580Z",
 *   "updatedAt": "2017-10-20T20:39:06.580Z"
 * },
 * {
 *   "id": "3a47cd22-1761-4582-8cc6-32da1c0bd970",
 *   "createdBy": "userone",
 *   "body": "second",
 *   "coordinates": {
 *     "type": "Point",
 *     "coordinates": [
 *       0,
 *       0
 *     ]
 *   },
 *   "metadata": {},
 *   "createdAt": "2017-10-20T20:39:06.581Z",
 *   "updatedAt": "2017-10-20T20:39:06.581Z"
 * }
 * ]
 */
function getItemComments(req, res, next) {
  const projectId = req.params.project;
  const itemId = req.params.item;
  db.Item
    .findOne({
      where: {
        id: itemId,
        project_id: projectId
      }
    })
    .then(item => {
      return item.getComments();
    })
    .then(comments => {
      return res.json(comments);
    })
    .catch(e => {
      next(e); // do better error handling, return 404?
    });
}

/**
 * Get an individual comment
 * @name get-item-comment
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {string} params.item - The item ID
 * @param {string} params.comment - The comment ID
 * @example
 * curl https://host/projects/:project/items/:item/comments/:comment
 * {
 *   "id": "e67c585d-d93f-4ea6-a59f-87b8b54e6efd",
 *   "createdBy": "usertwo",
 *   "body": "first",
 *   "coordinates": {
 *     "type": "Point",
 *     "coordinates": [
 *       0,
 *       0
 *     ]
 *   },
 *   "metadata": {},
 *   "createdAt": "2017-10-20T20:39:06.580Z",
 *   "updatedAt": "2017-10-20T20:39:06.580Z"
 * }
 */
function getItemComment(req, res, next) {
  const commentId = req.params.comment;
  // I'm not a 100% sure if we even need this end-point,
  // so short-circuiting this ID lookup. We can think of how
  // to do this better later
  db.Comment
    .findOne({
      where: {
        id: commentId
      }
    })
    .then(comment => {
      res.json(comment);
    })
    .catch(err => {
      next(err);
    });
}

/**
 * Create a comment
 * @name create-item-comment
 * @param {Object} params - The request URL parameters
 * @param {string} params.project - The project ID
 * @param {string} params.item - The item ID
 * @param {Object} body - The request body
 * @param {string} body.body - Body of the comment (required)
 * @param {Array} body.pin - coordinates of pin
 */
function createItemComment(req, res, next) {
  const projectId = req.params.project;
  const itemId = req.params.item;
  const values = {};
  const validBodyAttrs = ['body', 'pin', 'metadata'];
  const requiredBodyAttrs = ['body'];
  const validationError = validateBody(
    req.body,
    validBodyAttrs,
    requiredBodyAttrs
  );
  if (validationError) return next(new ErrorHTTP(validationError, 400));

  /* Validate pin */
  if (
    req.body.pin &&
    (!Array.isArray(req.body.pin) || req.body.pin.length !== 2)
  ) {
    return next(
      new ErrorHTTP(
        'Comment pin must be in the [longitude, latitude] format',
        400
      )
    );
  }
  values.pin = { type: 'Point', coordinates: req.body.pin };
  var pinErrors = geojsonhint.hint(values.pin, { precisionWarning: false });
  if (pinErrors.length) {
    return next(new ErrorHTTP(`Invalid Pin ${pinErrors[0].message}`, 400));
  }
  if (req.body.body.trim() === '') {
    return next(new ErrorHTTP('Comment body cannot be empty', 400));
  }
  values.body = req.body.body;
  values.createdBy = req.user.username;
  db.Item
    .findOne({
      where: {
        project_id: projectId,
        id: itemId
      }
    })
    .then(item => {
      return db.Comment.create({
        itemAutoId: item.auto_id,
        createdBy: values.createdBy,
        body: values.body,
        pin: values.pin ? values.pin : null
      });
    })
    .then(comment => {
      res.json(comment);
    })
    .catch(err => {
      next(err);
    });
}

function updateItemComment(req, res, next) {
  return next();
}

function deleteItemComment(req, res, next) {
  return next();
}
