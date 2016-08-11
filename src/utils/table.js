module.exports.createtable = function(request, idstr, done) {
  var client = request.pg.client;
  console.log('CREATE TABLE');
  client.query('CREATE TABLE ' + idstr + '( id serial PRIMARY KEY,  idsrt varchar(50),  time integer,  body jsonb );', function(err, result) {
    done(err, result);
  });
};