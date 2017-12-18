const isValidQuadkey = require('./is-valid-quadkey');
const constants = require('../constants');
const DEFAULT_ZOOM = constants.DEFAULT_ZOOM;
const ALL_STATUS = constants.ALL_STATUS;
const validator = require('validator');

module.exports = {
  validateQuadkeysQuery,
  validateItemsQuery
};

function validateQuadkeysQuery(q) {
  let errors = [];

  if (!isValidQuadkey(q.within) && q.within !== '') {
    errors.push('within parameter must be a valid quadkey string');
  }
  if (q.within.length > DEFAULT_ZOOM) {
    errors.push(
      '`length of quadkey to search within must be below z${DEFAULT_ZOOM}`'
    );
  }
  if (
    !validator.isNumeric(q.zoom_level) ||
    q.zoom_level < 1 ||
    q.zoom_level > DEFAULT_ZOOM
  ) {
    errors.push('zoom_level must be a number between 1 and ${DEFAULT_ZOOM}');
  }

  // do not allow queries that search more than 4 z levels deep
  if (q.zoom_level > q.within.length + 6) {
    errors.push(
      'zoom_level must be 4 or less zoom levels greater than zoom level of within parameter'
    );
  }
  const itemQuery = {
    status: q.item_status,
    tags: q.item_tags,
    lock: q.item_lock,
    from: q.item_from,
    to: q.item_to
  };
  const itemQueryErrors = validateItemsQuery(itemQuery);
  errors = itemQueryErrors ? errors.concat(itemQueryErrors) : errors;
  if (errors.length > 0) {
    return errors;
  } else {
    return false;
  }
}

function validateItemsQuery(q) {
  //TODO: Validate all items query param and use this module in items routes/item.js
  let errors = [];
  if (q.status) {
    if (ALL_STATUS.indexOf(q.status) === -1) {
      errors.push(`Invalid status parameter: ${q.status}`);
    }
  }
  if (q.lock) {
    if (constants.LOCKED_STATUS.indexOf(q.lock) === -1) {
      errors.push(`Invalid lock parameter: ${q.lock}`);
    }
  }
  if (q.from) {
    if (!validator.isISO8601(q.from)) {
      errors.push(`Invalid date: ${q.from}`);
    }
  }
  if (q.to) {
    if (!validator.isISO8601(q.to)) {
      errors.push(`Invalid date: ${q.to}`);
    }
  }
  if (q.tags) {
    const tags = q.tags.split(',');
    tags.forEach(tag => {
      if (!validator.isUUID(tag)) {
        errors.push(`Invalid tag: ${tag}`);
      }
    });
  }

  if (errors.length > 0) {
    return errors;
  } else {
    return false;
  }
}
