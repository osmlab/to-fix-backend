var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var config = module.exports;

config.listFiles = function(done) {
  var params = {
    Bucket: 'mapbox',
    Prefix: 'to-fix/tasks/'
  };
  s3.listObjects(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      done(data.Contents);
    }
  });
};

config.getFile = function(key, done) {
  var file = require('fs').createWriteStream('osmi-latest.zip');
  s3.getObject({
    Bucket: "mapbox",
    Key: key
  }, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      done();
    }
  }).createReadStream().pipe(file);
};