// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 🔧 [FIX] Disable unstable_enablePackageExports to fix Metro bundler serializer error
// This is needed for compatibility with @shopify/react-native-skia and other packages
// that don't fully support the new package.json exports resolution in React Native 0.79
// See: https://expo.dev/changelog/sdk-53
// See: https://github.com/expo/expo/issues/25969
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
