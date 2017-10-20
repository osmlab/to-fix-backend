module.exports = {
  getUser
};

/**
 * Get the user info.
 * @name get-user
 * @example
 * curl https://host/user
 *
 * {
 *   id: 'testId',
 *   username: 'testUsername',
 *   image: 'https://gravatar.com/awesome/image'
 * }
 */
function getUser(req, res) {
  return res.json(req.user);
}
