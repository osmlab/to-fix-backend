'use strict';
const massive = require("massive");
const fs = require('fs');
const os = require('os');
const path = require('path');
const user = process.env.DBUsername || 'postgres';
const password = process.env.DBPassword || '';
const address = process.env.DBAddress || 'localhost';
const database = process.env.Database || 'tofix';
const conString = 'postgres://' +
  user + ':' +
  password + '@' +
  address + '/' +
  database;

const db = massive.connectSync({
  connectionString: conString
});


module.exports.tasks = function(request, reply) {
  //Listar
  reply({
    list: "listar"
  });
};


module.exports.findeOne = function(request, reply) {
  reply({
    list: "listar uno"
  });
  //list one
};

module.exports.createTasks = function(request, reply) {
  //create
  const data = request.payload;
  if (data.file) {
    const name = data.file.hapi.filename;
    const folder = os.tmpDir();
    const fileSrc = path.join(folder, name);
    const file = fs.createWriteStream(fileSrc);
    file.on('error', function(err) {
      console.error(err);
    });
    data.file.pipe(file);
    data.file.on('end', function(err) {
      const rep = {
        filename: data.file.hapi.filename,
        headers: data.file.hapi.headers
      };
      reply(JSON.stringify(rep));
    });
  }
};