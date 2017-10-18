const ErrorHTTP = require('mapbox-error').ErrorHTTP;

const _ = require('lodash');
const db = require('../database/index');
const ProjectItems = db.ProjectItems;
// const updateStats = require('./update-stats');

// This file currently handles every single update or create situation
// But we have at least three different kinds of actions
// 1. Lock or unlock the item
// 2. Update the status of the item
// 3. Change the pin, featureCollections, instructions
// It would be nice to have the endpoint figure out which of these three things
// the request is trying to do, and then have one file for each of these actions
// this would help remove the many optional attributes below

/**
 * handle all the logic and some validation for item creation and updating
 * @param {Object} opts - the opts for the action
 * @param {String} opts.project - the id of the project the item belongs to
 * @param {String} opts.item - the id of the item itself
 * @param {String} opts.user - the user making the change
 * @param {FeatureCollection} [opts.featureCollection] - a validated GeoJSON feature collection, required on create
 * @param {Point} [opts.pin] - a validated GeoJSON point representing the queryable location of this item, required on create
 * @param {String} [opts.instructions] - the instructions for what needs to be done, required on create
 * @param {String} [opts.status] - the status to set the item to
 * @param {String} [opts.lockedTill] - the time the lock expires at
 */
module.exports = function(opts) {
  return ProjectItems.findOne({
    where: { id: opts.item, project_id: opts.project }
  }).then(function(data) {
    // var was = data === null ? {} : data.toJSON();
    if (data !== null) {
      // there was data in the database, this is an update
      if (
        (opts.lockedTill !== undefined || opts.status !== undefined) && // we're changing the lock or the status
        data.lockedTill > new Date() && // there is an active lock
        data.lockedBy !== opts.user // and its not owned by this user
      ) {
        throw new ErrorHTTP(
          'This item is currently locked by ' + data.lockedBy,
          423
        );
      }

      // check for an expired lock on status update
      if (opts.status !== undefined && data.lockedTill < new Date()) {
        throw new ErrorHTTP(
          'Cannot update an items status without a lock',
          423
        );
      }

      var featureCollection = opts.featureCollection;
      delete opts.featureCollection; // removing so the merge doesn't try to merge the old feature collection with the new one
      var updated = _.merge({}, data.dataValues, opts);
      updated.featureCollection =
        featureCollection || updated.featureCollection; // set the feature collection back

      return data.update(updated);
    } else {
      // this is a create
      if (opts.instructions === undefined) {
        throw new ErrorHTTP('instructions is required', 400);
      }
      opts.featureCollection = opts.featureCollection || {
        type: 'FeatureCollection',
        features: []
      };
      opts.createdBy = opts.user;
      if (opts.pin === undefined) throw new ErrorHTTP('pin is required', 400);
      return ProjectItems.create(opts);
    }
  });
};
