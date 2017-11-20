const constants = require('../constants');
const sanitizeNumber = require('./sanitizeNumber');

/**
 * helper function for adding `limit` & `offset` props
 * to a sequalize search object.
 * Note: it doesn't mutate the object and instead returns
 * a new object, overwriting the existing `limit` & `offset` props if any.
 * @param {Object} reqParams the params object from the request.
 * @param {string} [reqParams.page=0] the page number, starting from 0.
 * @param {string} [reqParams.page_size=constants.PAGE_SIZE] the page size.
 * @param {Object} searchQuery the object to be sent to sequelize search eg. Model.findAll(searchQuery)
 */
module.exports = function paginateSearch(reqParams, searchQuery) {
  const pageSize = sanitizeNumber(reqParams.page_size, constants.PAGE_SIZE);
  const page = sanitizeNumber(reqParams.page, 0);
  return Object.assign({}, searchQuery, {
    limit: pageSize,
    offset: page * pageSize
  });
};
