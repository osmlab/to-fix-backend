var fs = require('fs');
var formatGeojson = require('../src/utils/formatGeojson').formatGeojson;
var formatFeature = require('../src/utils/formatGeojson').formatFeature;
var os = require('os');
var sha1 = require('sha1');
var test = require('tape');

var fixturesPath = __dirname + '/fixtures/';
var toJSON = buffer => JSON.parse(buffer.toString());
var loadFixture = filename => toJSON(fs.readFileSync(fixturesPath + filename));

var fixtures = {
  strangeLayer: loadFixture('strangelayerpql.json'),
  simpleGeoJSON: loadFixture('simple.geojson'),
  simpleFeature: loadFixture('feature.json')
};

test('it converts a GeoJSON file into line-delimited features', function(t) {
  var geojsonPath = __dirname + '/fixtures/simple.geojson'
  formatGeojson(geojsonPath, fixtures.strangeLayer, (result) => {
    t.equal(result.value.stats[0].items, 3, 'it appends number of items to task');
    t.end();
  });
});

test('it stores line-delimited features in temp file', function(t) {
  var geojsonPath = __dirname + '/fixtures/simple.geojson'
  formatGeojson(geojsonPath, fixtures.strangeLayer, (result) => {
    var tempfile = os.tmpDir() + '/' + result.idtask;
    t.true(fs.existsSync(tempfile), `finds a temp file at ${tempfile}`);
    t.end();
  });
});

test('it format the feature to be an item', function(t) {
  var data = formatFeature(fixtures.simpleFeature);
  var _key = '308195d6bec09f2514082e7feaeb836939789d57';
  var _osmType = 'node';
  t.equal(data.properties._key, _key, 'same hash for feature');
  t.equal(data.properties._osmType, _osmType, 'same osm obj type');
  t.end();
});
