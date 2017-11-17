var constants = (module.exports = {});

constants.ACTIVE_STATUS = ['open'];
constants.INACTIVE_STATUS = ['fixed', 'noterror', 'unfixable'];
constants.VERIFIED_STATUS = [
  'fixed-verified',
  'noterror-verified',
  'unfixable-verified'
];
constants.LOCKED = 'locked';
constants.UNLOCKED = 'unlocked';
constants.LOCKED_STATUS = [constants.LOCKED, constants.UNLOCKED];

constants.ALL_STATUS = constants.ACTIVE_STATUS
  .concat(constants.INACTIVE_STATUS)
  .concat(constants.VERIFIED_STATUS);

constants.OSM_API = 'https://www.openstreetmap.org/api/0.6/';
constants.OSM_REQUEST_TOKEN_URL =
  'https://www.openstreetmap.org/oauth/request_token';
constants.OSM_ACCESS_TOKEN_URL =
  'https://www.openstreetmap.org/oauth/access_token';

constants.PAGE_SIZE = 100;

constants.DEFAULT_ZOOM = 13;
