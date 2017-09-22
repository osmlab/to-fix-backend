module.exports = function(t) {
  delete t.createdAt;
  delete t.updatedAt;
  delete t.lockedTill;
  return t;
};
