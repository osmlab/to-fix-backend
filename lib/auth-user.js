module.exports = function(req, res, next) {
  // TODO: Do this for real
  req.user = 'userone';
  next();
};
