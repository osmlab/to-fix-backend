const db = require('../database/index');

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

function createItemComment(req, res, next) {
  return next();
}

function updateItemComment(req, res, next) {
  return next();
}

function deleteItemComment(req, res, next) {
  return next();
}
