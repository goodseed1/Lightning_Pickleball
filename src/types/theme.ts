/**
 * Theme-related types for Lightning Pickleball
 * Separated from ThemeContext to satisfy ESLint fast-refresh requirements
 */

import { MD3Theme } from 'react-native-paper';
import { Theme as NavigationTheme } from '@react-navigation/native';

// Theme preference types
export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

// Theme context interface with proper theme object types
export interface ThemeContextType {
  theme: ThemeMode;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  isThemeReady: boolean;
  // Complete theme objects managed within React state - properly typed
  paperTheme: MD3Theme;
  navigationTheme: NavigationTheme;
}
