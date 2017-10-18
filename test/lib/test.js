const tape = require('tape');
process.env.PG_DATABASE = 'tofix_test';
const server = require('../../lib/server');
const supertest = require('supertest');
const app = supertest(server);
const nock = require('nock');
const path = require('path');
const exec = require('child_process').execSync;
const fs = require('fs');
const join = require('path').join;
const db = require('../../database/db');

var pendingTests = 0;

module.exports = function(testName, fixture, cb) {
  setupNock();
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
    fixture.map(function(project) {
      return db.Projects
        .create({ id: project.id, metadata: project.metadata || {} })
        .then(function() {
          var items = project.items || [];
          var fc = { type: 'FeatureCollection', features: [] };
          var morePromise = items.map(function(item) {
            return db.ProjectItems.create({
              id: item.id,
              project_id: project.id,
              pin: {
                type: 'Point',
                coordinates: item.pin || [0, 0],
                crs: { type: 'name', properties: { name: 'EPSG:4326' } }
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

          var stats = project.stats || {};
          morePromise = morePromise.concat(
            Object.keys(stats).map(function(user) {
              return db.ProjectUserStats.create({
                project_id: project.id,
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

function setupNock() {
  return nock('https://www.openstreetmap.org')
    .get('/api/0.6/user/details')
    .reply(function() {
      const headers = this.req.headers;
      if (headers.authorization) {
        //TODO: actually verify the auth header is as expected
        return [
          200,
          fs.readFileSync(
            join(__dirname, '../fixtures/user-detail.xml'),
            'utf-8'
          )
        ];
      } else {
        return [401, "Couldn't authenticate you"];
      }
    });
}

function teardown() {
  db.close();
}
