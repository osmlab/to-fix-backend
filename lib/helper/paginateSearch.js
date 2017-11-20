const constants = require('../constants');
const sanitizeNumber = require('./sanitizeNumber');

/**
 * helper function for adding `limit` & `offset` props
 * to a sequalize search object.
 * @param {string} [page=0] the page number, starting from 0.
 * @param {string} [pageSize=constants.PAGE_SIZE] the page size.
 * @param {Object} searchQuery the object to be sent to sequelize search eg. Model.findAll(searchQuery)
 */
module.exports = function paginateSearch(page, pageSize) {
  pageSize = sanitizeNumber(pageSize, constants.PAGE_SIZE);
  page = sanitizeNumber(page, 0);
  return {
    limit: pageSize,
    offset: page * pageSize
  };
};
