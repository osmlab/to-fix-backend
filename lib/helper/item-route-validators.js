const validator = require('validator');
const ErrorHTTP = require('mapbox-error').ErrorHTTP;
const constants = require('../constants');
const Sequelize = require('sequelize');
const validateBody = require('./validateBody');
const geojsonhint = require('@mapbox/geojsonhint');
const validateFC = require('@mapbox/to-fix-validate').validateFeatureCollection;
const Op = Sequelize.Op;

const blankFC = {
  type: 'FeatureCollection',
  features: []
};

function getLockedTill(lock) {
  if (constants.LOCKED_STATUS.indexOf(lock) === -1) {
    throw new ErrorHTTP(`Invalid req.query.lock: ${lock}`, 400);
  }
  const locked = lock === constants.LOCKED;
  return {
    [locked ? Op.gt : Op.lt]: new Date()
  };
}

function validateDate(date) {
  if (!validator.isISO8601(date)) {
    throw new ErrorHTTP(
      'from parameter must be a valid ISO 8601 date string',
      400
    );
  }
  return date;
}

function validateStatus(status) {
  if (constants.ALL_STATUS.indexOf(status) === -1) {
    throw new ErrorHTTP(`Invalid status: ${status}`, 400);
  }
  return status;
}

function validateLock(lock, status) {
  if (lock && status) {
    throw new ErrorHTTP(
      'It is invalid to set the status and change the lock in one request',
      400
    );
  }
  if (constants.LOCKED_STATUS.indexOf(lock) === -1) {
    throw new ErrorHTTP(`Invalid lock change action`, 400);
  }
  return lock;
}

/**
 * Checks the mutual exclusivity of lock and status.
 * This validation check the fact that lock, status
 * can never be updated simultaneously
 * @param {string} lock
 * @param {string} status
 * @returns {Object} {lock, status}
 */
function validateLockStatus(lock, status) {
  if (lock && status) {
    throw new ErrorHTTP(
      'It is invalid to set the status and change the lock in one request',
      400
    );
  }
  if (lock) {
    lock = validateLock(lock);
  } else if (status) {
    status = validateStatus(status);
  }

  return { lock, status };
}

function bboxToEnvelope(bbox) {
  const bb = bbox.split(',').map(n => parseFloat(n));
  if (bb.find(n => Number.isNaN(n) || bb.length !== 4)) {
    throw new ErrorHTTP(`Invalid req.query.bbox: ${bbox}`, 400);
  }
  //TODO: do some validation of the bbox
  return Sequelize.where(
    Sequelize.fn(
      'ST_Within',
      Sequelize.col('pin'),
      Sequelize.fn('ST_MakeEnvelope', bb[0], bb[1], bb[2], bb[3], 4326)
    ),
    true
  );
}

function validateCreateItemBody(body) {
  const validBodyAttrs = [
    'id',
    'lock',
    'pin',
    'status',
    'featureCollection',
    'instructions',
    'metadata'
  ];
  const requiredBodyAttr = ['id', 'instructions', 'pin'];
  const validationError = validateBody(body, validBodyAttrs, requiredBodyAttr);

  if (validationError) {
    throw new ErrorHTTP(validationError, 400);
  }
  return body;
}

function validateAlphanumeric(string) {
  if (!/^[a-zA-Z0-9-]+$/.test(string)) {
    throw new ErrorHTTP(
      'An item must have a valid ID comprised only of letters, numbers, and hyphens',
      400
    );
  }
  return string;
}

function validateInstructions(instructions) {
  if (typeof instructions !== 'string' || instructions.length < 1) {
    throw new ErrorHTTP('An item must have a valid instruction', 400);
  }
  return instructions;
}

function validatePoint(point) {
  const pin = point.coordinates;

  if (!Array.isArray(pin) || pin.length !== 2)
    throw new ErrorHTTP(
      'An item must have a pin in the [longitude, latitude] format',
      400
    );
  const pinErrors = geojsonhint.hint(point, { precisionWarning: false });

  if (pinErrors.length > 0) {
    throw new ErrorHTTP(`Invalid Pin ${pinErrors[0].message}`, 400);
  }

  return point;
}

function validateFeatureCollection(fc) {
  var fcErrors = geojsonhint.hint(fc, {
    precisionWarning: false
  });
  if (fcErrors.length > 0) {
    throw new ErrorHTTP(
      'Invalid featureCollection: ' + fcErrors[0].message,
      400
    );
  }
  const tofixValidationErrors = validateFC(fc);
  if (tofixValidationErrors) {
    throw new ErrorHTTP(tofixValidationErrors, 400);
  }
  return fc;
}

function validateUpdateItemBody(body) {
  const validBodyAttrs = [
    'lock',
    'pin',
    'status',
    'featureCollection',
    'instructions',
    'metadata'
  ];
  const validationError = validateBody(body, validBodyAttrs);

  if (validationError) {
    throw new ErrorHTTP(validationError, 400);
  }
  return body;
}

module.exports = {
  blankFC,
  getLockedTill,
  validateDate,
  validateStatus,
  bboxToEnvelope,
  validateLockStatus,
  validateCreateItemBody,
  validateAlphanumeric,
  validateInstructions,
  validatePoint,
  validateLock,
  validateFeatureCollection,
  validateUpdateItemBody
};
