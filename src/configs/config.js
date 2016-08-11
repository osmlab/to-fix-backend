const user = process.env.DBUsername || 'postgres';
const password = process.env.DBPassword || '';
const address = process.env.DBAddress || 'localhost';
const database = process.env.Database || 'tofix';

module.exports.connectionString = 'postgres://' +
  user + ':' +
  password + '@' +
  address + '/' +
  database;