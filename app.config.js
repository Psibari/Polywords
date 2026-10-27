const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = ({ config }) => ({
  ...config,

  name: IS_DEV ? 'POLYWORDS DEV' : config.name,

  ios: {
    ...config.ios,
    bundleIdentifier: IS_DEV
      ? 'com.pdb8080.polywords.dev'
      : config.ios?.bundleIdentifier,
  },

  android: {
    ...config.android,
    package: IS_DEV
      ? 'com.pdb8080.polywords.dev'
      : config.android?.package,
  },

  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-dev-client',
      {
        addGeneratedScheme: IS_DEV,
      },
    ],
  ],
});
