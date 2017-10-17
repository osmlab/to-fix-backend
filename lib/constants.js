var constants = (module.exports = {});

constants.ACTIVE_STATUS = ['open'];
constants.INACTIVE_STATUS = ['fixed', 'noterror'];

constants.ALL_STATUS = constants.ACTIVE_STATUS.concat(
  constants.INACTIVE_STATUS
);

constants.OSM_API = 'https://www.openstreetmap.org/api/0.6/';
constants.OSM_REQUEST_TOKEN_URL =
  'https://www.openstreetmap.org/oauth/request_token';
constants.OSM_ACCESS_TOKEN_URL =
  'https://www.openstreetmap.org/oauth/access_token';

constants.PAGE_SIZE = 100;
