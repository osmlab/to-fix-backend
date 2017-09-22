const tape = require('tape');
process.env.PG_DATABASE = 'to-fix-test';
const server = require('../../lib/server');
const supertest = require('supertest');
const app = supertest(server);

const path = require('path');
const exec = require('child_process').execSync;

const db = require('../../lib/db');

var pendingTests = 0;

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
        cb(t);
      })
      .catch(function(err) {
        t.end(err);
      });
  });
};

function setup(fixture) {
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
    fixture.map(function(task) {
      return db.Tasks
        .create({ id: task.id, metadata: task.metadata || {} })
        .then(function() {
          var items = task.items || [];
          var fc = { type: 'FeatureCollection', features: [] };
          var morePromise = items.map(function(item) {
            return db.TaskItems.create({
              id: item.id,
              task_id: task.id,
              pin: {
                type: 'Point',
                coordinates: item.pin || [0, 0]
              },
              featureCollection: item.featureCollection || fc,
              metadata: {},
              status: item.status,
              lockedBy: item.lockedBy || null,
              lockedTill: item.lockedTill,
              createdBy: item.createdBy || 'userone',
              instructions: item.instructions || 'created via the tests'
            });
          });

          var stats = task.stats || {};
          morePromise = morePromise.concat(
            Object.keys(stats).map(function(user) {
              return db.TaskUserStats.create({
                task_id: task.id,
                user: user,
                stats: stats[user]
              });
            })
          );
          return Promise.all(morePromise);
        });
    })
  );
}

function teardown() {
  db.close();
}
