module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/__tests__/**/*.(js|jsx|ts|tsx)', '**/?(*.)+(spec|test).(js|jsx|ts|tsx)'],

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // 💥 최종 해결책: 표준 Expo/React Native ES 모듈 지원 패턴 💥
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-reanimated|react-native-paper|react-native-svg|firebase|@firebase/.*)',
  ],

  // Module name mapping for common imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    // Mock React Native components
    'react-native$': 'react-native-web',
    'react-native-reanimated$': '<rootDir>/node_modules/react-native-reanimated/mock',
    // Mock AsyncStorage
    '@react-native-async-storage/async-storage':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    // Mock Firebase modules
    '^firebase/app$': '<rootDir>/__mocks__/firebase/app.js',
    '^firebase/firestore$': '<rootDir>/__mocks__/firebase/firestore.js',
    '^firebase/auth$': '<rootDir>/__mocks__/firebase/auth.js',
    '^firebase/functions$': '<rootDir>/__mocks__/firebase/functions.js',
    '^firebase/storage$': '<rootDir>/__mocks__/firebase/storage.js',
    // Mock Firebase config
    '^@/firebase/config$': '<rootDir>/__mocks__/firebase/config.js',
    // Mock relative firebase config path
    '\\.\\.\/firebase\/config$': '<rootDir>/__mocks__/firebase/config.js',
    // Mock AuthService - 중앙화된 인증 서비스 모킹
    '^@/services/authService$': '<rootDir>/__mocks__/services/authService.js',
    '(.+)/services/authService$': '<rootDir>/__mocks__/services/authService.js',
    '\\.\\./authService$': '<rootDir>/__mocks__/services/authService.js',
    // Mock Expo modules
    '^expo$': '<rootDir>/__mocks__/expo.js',
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/.share/'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.(js|jsx|ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/index.(js|ts)',
    '!src/**/*.(test|spec).(js|jsx|ts|tsx)',
    '!src/**/__tests__/**',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Clear mocks between tests
  clearMocks: true,

  // Test timeout
  testTimeout: 10000,

  // Mock static assets
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],

  // Verbose output
  verbose: false,
};
