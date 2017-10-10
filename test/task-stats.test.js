const test = require('./lib/test');
const checkLock = require('./lib/check-lock');
const _ = require('lodash');

test(
  'GET /tasks/:id/stats',
  [
    {
      id: 'one',
      stats: {
        userone: {
          '2017-09-27': {
            fixed: 0,
            noterror: 1,
            inprogress: 1,
            completed: 1
          }
        },
        usertwo: {
          '2017-09-26': {
            fixed: 2,
            noterror: 0,
            inprogress: 0,
            completed: 2
          }
        }
      }
    }
  ],
  function(assert) {
    assert.app.get('/tasks/one/stats').expect(200, function(err, res) {
      if (err) return assert.end(err);
      assert.deepEqual(
        assert.fixture[0].stats,
        res.body,
        'returns the stats in the database'
      );
      assert.end();
    });
  }
);

test(
  'PUT /tasks/:id/items/:id - when a user marks an item as fixed, fixed stats + 1, open - 1, completed + 1',
  [
    {
      id: 'one',
      stats: makeStats('userone', {
        fixed: 0,
        noterror: 0,
        open: 1,
        completed: 0
      }),
      items: [
        {
          id: 'test',
          lockedTill: new Date(Date.now() + 1000 * 60 * 15),
          lockedBy: 'userone',
          status: 'open'
        }
      ]
    }
  ],
  function(assert) {
    assert.app
      .put('/tasks/one/items/test')
      .send({
        status: 'fixed',
        lock: 'unlocked'
      })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.ok(checkLock.unlocked(res.body), 'is not locked');
        assert.equal(res.body.status, 'fixed', 'status has been updated');
        getStats(assert.app, 'one', function(err, stats) {
          if (err) return assert.end(err);
          var changed = assert.fixture[0].stats;
          changed.userone = Object.keys(changed.userone).reduce(function(
            memo,
            date
          ) {
            var old = changed.userone[date];
            memo[date] = old;
            memo[date].fixed++;
            memo[date].open--;
            memo[date].completed++;
            return memo;
          }, {});
          assert.deepEqual(stats, changed, 'the stats changed');
          assert.end();
        });
      });
  }
);

test(
  'PUT /tasks/:id/items/:id - when taking an expired lock from another user their open - 1, your open + 1',
  [
    {
      id: 'one',
      stats: _.merge(
        makeStats('otheruser', { open: 1 }),
        makeStats('userone', { open: 0 })
      ),
      items: [{ id: 'old', lockedTill: new Date(), lockedBy: 'otheruser' }]
    }
  ],
  function(assert) {
    assert.app
      .put('/tasks/one/items/old')
      .send({ lock: 'locked' })
      .expect(200, function(err, res) {
        if (err) return assert.end(err);
        assert.ok(checkLock.locked(res.body), 'is currently locked');
        assert.equal(
          res.body.lockedBy,
          'userone',
          'is locked by the current user'
        );
        getStats(assert.app, 'one', function(err, stats) {
          if (err) return assert.end(err);
          assert.deepEqual(
            stats.otheruser,
            makeStats('otheruser', { open: 0 }).otheruser,
            'otheruser open was dropped by one'
          );
          assert.deepEqual(
            stats.userone,
            makeStats('userone', { open: 1 }).userone,
            'userone open was increased by one'
          );
          assert.end();
        });
      });
  }
);

function getStats(app, task, callback) {
  app.get('/tasks/' + task + '/stats').expect(200, function(err, res) {
    if (err) return callback(err);
    callback(null, res.body);
  });
}

function makeStats(user, stats) {
  var out = {};
  var today = new Date().toISOString().split('T')[0];
  out[user] = {};
  out[user][today] = stats;
  return out;
}
