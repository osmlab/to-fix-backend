var massive = require("massive");
var user = process.env.DBUsername || 'postgres';
var password = process.env.DBPassword || '';
var address = process.env.DBAddress || 'localhost';
var database = process.env.Database || 'tofix';
var conString = 'postgres://' +
  user + ':' +
  password + '@' +
  address + '/' +
  database;

var db = massive.connectSync({
  connectionString: conString
});

// var newUser = {
//   email : "test@teset.com",
//   first : "Joe",
//   last : "Test"
// };

// db.us.save(newUser, function(err,result){
//   console.log(result);  
// });

var task = {
  idstr :'dasdasd',
  name: 'character varying(150)',
  description: 'text',
  updated: 3213,
  status: true,
  changeset_comment: 'text'
};

db.tasks.save(task, function(err, result) {
  if (err) {
    console.log(err);
  }
  console.log(result);

});