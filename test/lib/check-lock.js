var check = function(item, isLocked) {
  var now = new Date();
  var lockedTill = new Date(item.lockedTill);

  if (isLocked) {
    return lockedTill > now;
  } else {
    return lockedTill < now;
  }
};

var api = (module.exports = {});

api.unlocked = function(item) {
  return check(item, false);
};

api.locked = function(item) {
  return check(item, true);
};
