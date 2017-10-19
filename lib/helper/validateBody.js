'use strict';

/**
 * Validate a request body.
 * @name validate-body
 * @param {Object} body - A request body
 * @param {Array<string>} validProps - An array of valid body properties
 * @param {Array<string>} requiredProps - An array of required body properties
 */
module.exports = (body, validProps, requiredProps) => {
  let error;
  Object.keys(body).forEach(attr => {
    if (validProps.indexOf(attr) === -1)
      error = `Request contains unexpected attribute ${attr}`;
  });
  if (requiredProps)
    requiredProps.forEach(attr => {
      if (!body[attr]) error = `req.body.${attr} is a required body attribute`;
    });
  return error;
};
