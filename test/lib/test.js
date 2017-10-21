const tape = require('tape');
process.env.PG_DATABASE = 'tofix_test';
process.env.APP_SECRET = 'fakesecret';
process.env.trustedUsers = '[123]';
const server = require('../../lib/server');
const supertest = require('supertest');
const app = supertest(server);
const jwt = require('jwt-simple');
const path = require('path');
const exec = require('child_process').execSync;
const db = require('../../database/index');
const _ = require('lodash');

var pendingTests = 0;

const testToken = jwt.encode(
  {
    id: 123,
    username: 'test-user'
  },
  process.env.APP_SECRET
);

module.exports = function(testName, fixture, cb) {
  pendingTests++;
  tape(testName, function(t) {
    // over write end to track how many pending tests there are
    const tEnd = t.end;
    t.end = function(err) {
      pendingTests--;
      if (pendingTests === 0) teardown();
      tEnd(err);
    };

    // overwrite test to block the user of nested tests
    const test = t.test;
    t.test = function(name) {
      test(name, function(a) {
        a.end(new Error('Please do not use subtests'));
      });
    };

    // allow people to write stub tests
    if (cb === undefined) {
      t.end(new Error('Not implemented'));
    }

    t.app = app; // give users access to the app
    t.fixture = fixture; // give users access to their fixtures

    setup(fixture)
      .then(function() {
        cb(t, testToken);
      })
      .catch(function(err) {
        t.end(err);
      });
  });
};

function setup(fixture) {
  const store = {};
  try {
    exec(
      `DROP=true PG_DATABASE='${process.env.PG_DATABASE}' node ${path.join(
        __dirname,
        '..',
        '..',
        'bin',
        'setup-database.js'
      )}`
    );
  } catch (err) {
    return Promise.reject(err);
  }
  return Promise.all(
    fixture.map(function(project) {
      return db.Project
        .create({
          id: project.id,
          name: project.name,
          metadata: project.metadata || {}
        })
        .then(function(createdProject) {
          store.createdProject = createdProject;
          var tags = project.tags || [];
          var promise = tags.map(tag => {
            return db.Tag.create({
              id: tag.id,
              project_id: project.id,
              name: tag.name,
              metadata: tag.metadata || {}
            });
          });
          return Promise.all(promise);
        })
        .then(function(createdTags) {
          store.createdTags = createdTags;
          var items = project.items || [];
          var fc = { type: 'FeatureCollection', features: [] };
          var promise = items.map(function(item) {
            return db.Item.create({
              id: item.id,
              project_id: project.id,
              pin: {
                type: 'Point',
                coordinates: item.pin || [0, 0]
              },
              featureCollection: item.featureCollection || fc,
              metadata: item.metadata || {},
              status: item.status,
              lockedBy: item.lockedBy || null,
              lockedTill: item.lockedTill,
              createdBy: item.createdBy || 'userone',
              instructions: item.instructions || 'created via the tests'
            });
          });
          return Promise.all(promise);
        })
        .then(function(createdItems) {
          store.createdItems = createdItems;
          store.createdItems.forEach(item => {
            const originalItem = _.find(project.items, { id: item.id });
            if (originalItem.tags) {
              originalItem.tags.forEach(tag => {
                return item.setTags(_.find(store.createdTags, { name: tag }));
              });
            }
          });
        })
        .then(function() {
          var stats = project.stats || {};
          var promise = Object.keys(stats).map(function(user) {
            return db.Stat.create({
              user: user,
              stats: stats[user]
            });
          });
          return Promise.all(promise);
        });
    })
  );
}

function teardown() {
  db.close();
}

// var anotherPromise = tags.map((tag) => {
//   if (item.tags) {
//     item.tags.forEach((tag) => {
//       const matchedTag = _.find(createdTags, { name: tag });
//       return db.
//     })
//   }
// })
