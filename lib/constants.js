var constants = (module.exports = {});

constants.ACTIVE_STATUS = ['open'];
constants.INACTIVE_STATUS = ['fixed', 'noterror'];

constants.ALL_STATUS = constants.ACTIVE_STATUS.concat(
  constants.INACTIVE_STATUS
);
