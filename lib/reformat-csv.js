var fs = require('fs'),
    csv = require('csv-parser'),
    keyLib = require('./key');

module.exports = function(path, file, callback) {
    var fName = path + 'temp_' + keyLib.hashObject({file: file});
    var write = fs.createWriteStream(fName);
    var keys;
    var line = '';
    var count = 0;
    var errored = false;

    // why does this not work?
    // write.on('finish', callback);

    var read = fs.createReadStream(file).pipe(csv())
        .on('data', function(data) {
            var k = keyLib.hashObject(data);
            if (!keys) {
                keys = Object.keys(data);
                if (keys.length == 1) {
                    errored = true;
                    return callback('single column, probably not a csv');
                }
                write.write('key, value\n');
            }

            line += k + ',"' + JSON.stringify(data) + '"\n';
            count += 1;

            if (count > 1000) {
                write.write(line);
                line = '';
                count = 0;
            }
        })
        .on('error', callback)
        .on('end', function() {
            // not ideal
            if (errored) return;
            write.write(line);
            return callback(null, fName);
        });
};
