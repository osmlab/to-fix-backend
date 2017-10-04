const test = require('./lib/test');

test('GET / - check that status is OK when db connection works', [], function(
  assert
) {
  assert.app.get('/').expect(200, function(err, res) {
    if (err) return assert.end(err);
    assert.equal(res.body.status, 'OK', 'status returns OK');
    assert.end();
  });
});

//TODO: Figure out how to write test for when db connection fails
