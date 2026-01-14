// Jest setup for Lightning Tennis React Native App
require('@testing-library/jest-native/extend-expect');

// Set required Firebase environment variables for testing
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'mock-api-key';
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'mock-auth-domain';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'mock-project-id';
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'mock-storage-bucket';
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'mock-sender-id';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = 'mock-app-id';

// Global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock react-native-paper components
jest.mock('react-native-paper', () => ({
  Card: ({ children }) => children,
  Title: ({ children }) => children,
  Button: ({ children, onPress }) => ({ children, onPress }),
  TextInput: ({ onChangeText, placeholder }) => ({ onChangeText, placeholder }),
  ActivityIndicator: () => null,
  SegmentedButtons: () => null,
  IconButton: () => null,
  MD3LightTheme: {
    colors: {
      primary: '#1976D2',
      secondary: '#FF6B35',
      surface: '#FFFFFF',
      background: '#FAFAFA',
      onSurface: '#000000',
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '600' },
    },
  },
  MD3DarkTheme: {
    colors: {
      primary: '#1976D2',
      secondary: '#FF6B35',
      surface: '#121212',
      background: '#121212',
      onSurface: '#FFFFFF',
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '600' },
    },
  },
}));

// Mock @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock @react-native-community/slider
jest.mock('@react-native-community/slider', () => 'Slider');

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock Alert
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));
