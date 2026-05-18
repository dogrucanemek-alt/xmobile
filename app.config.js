module.exports = ({ config }) => {
  const isEasBuild = !!process.env.EAS_BUILD;
  return {
    ...config,
    updates: {
      ...config.updates,
      enabled: isEasBuild,
      checkAutomatically: isEasBuild ? "ON_ERROR_RECOVERY" : "NEVER",
    },
    plugins: (config.plugins || []).map((p) =>
      p === "@sentry/react-native"
        ? [
            "@sentry/react-native",
            {
              organization: "xmobile",
              project: "react-native",
              url: "https://sentry.io/",
            },
          ]
        : p
    ),
  };
};
