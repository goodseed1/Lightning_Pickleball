// Mock Expo
export default {};

// Mock common Expo modules
export const Constants = {
  expoConfig: {},
  manifest: {},
};

export const Asset = {
  fromModule: jest.fn(),
};

export const AppLoading = jest.fn();

// Export anything else as empty functions
export const __ExpoImportMetaRegistry = {};

// Mock for dynamic imports
export const registerRootComponent = jest.fn();
