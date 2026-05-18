module.exports = ({ config }) => {
  const isEasBuild = !!process.env.EAS_BUILD;
  return {
    ...config,
    updates: {
      ...config.updates,
      enabled: isEasBuild,
      checkAutomatically: isEasBuild ? "ON_ERROR_RECOVERY" : "NEVER",
    },
  };
};
