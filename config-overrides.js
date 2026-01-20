module.exports = function override(config) {
  config.ignoreWarnings = [
    {
      module: /dag-jose/,
    },
  ];
  return config;
};
