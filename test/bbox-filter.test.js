const test = require('./lib/test');

const getItemsFixture = [
  {
    id: 'one',
    items: [{ id: '30', pin: [30, 30] }, { id: '40', pin: [40, 40] }]
  }
];

test(
  'GET /projects/:id/items/:id?bbox=-35,-35,35,35',
  getItemsFixture,
  function(assert) {
    assert.app
      .get('/projects/one/items?bbox=-35,-35,35,35')
      .expect(200, function(err, res) {
        assert.equal(res.body.length, 1, 'found one item for bbox query');
        assert.end();
      });
  }
);
