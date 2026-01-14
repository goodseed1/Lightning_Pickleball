/**
 * Theme Context for Lightning Pickleball
 * Project Midnight - Phase 1: Dark Mode Management System
 *
 * Provides centralized theme management with support for:
 * - Light, Dark, and System preference modes
 * - AsyncStorage persistence for user preferences
 * - Real-time theme switching
 * - Integration with React Native Paper and Navigation themes
 */

import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme, Platform, StatusBar as RNStatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { ThemeMode, ThemePreference, ThemeContextType } from '../types/theme';
import { getCompleteTheme } from '../theme';

// Default context value - Dark Mode First!
// Initialize with empty objects to prevent undefined errors
const defaultThemeObjects = getCompleteTheme('dark');
const defaultContextValue: ThemeContextType = {
  theme: 'dark', // 🌙 Default to dark
  themePreference: 'system',
  setThemePreference: async () => {},
  isThemeReady: false,
  paperTheme: defaultThemeObjects.paper,
  navigationTheme: defaultThemeObjects.navigation,
};

// Create the context
const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

// AsyncStorage key for theme preference
const THEME_STORAGE_KEY = '@lightning_pickleball_theme_preference';

// Provider component interface
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get system color scheme
  const systemColorScheme = useColorScheme();

  // State for theme preference and current theme - Dark Mode First!
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('dark');
  const [theme, setTheme] = useState<ThemeMode>('dark'); // 🌙 Force dark mode on initial load
  const [isThemeReady, setIsThemeReady] = useState(false);

  // Load saved theme preference on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        console.log('🌙 THEME: Initializing theme system...');
        const savedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (savedPreference && ['light', 'dark', 'system'].includes(savedPreference)) {
          const preference = savedPreference as ThemePreference;
          setThemePreferenceState(preference);
          console.log(`🌙 THEME: Loaded preference: ${preference}`);
        } else {
          console.log('🌙 THEME: No saved preference, using dark default');
          setThemePreferenceState('dark');
        }
      } catch (error) {
        console.warn('🌙 THEME: Failed to load theme preference:', error);
      }

      // Bulletproof initialization sequence to ensure theme stability
      // This prevents race conditions with theme object initialization during hot reload
      setTimeout(() => {
        console.log('🌙 THEME: Theme system fully initialized - enabling rendering');
        setIsThemeReady(true);
      }, 100);
    };

    loadThemePreference();
  }, []);

  // Update actual theme when preference or system theme changes
  useEffect(() => {
    let newTheme: ThemeMode;

    if (themePreference === 'system') {
      // Follow system preference (but default to dark if no system preference)
      newTheme = systemColorScheme || 'dark'; // 🌙 Default to dark
      console.log(`🌙 THEME: Following system preference: ${newTheme}`);
    } else {
      // Use explicit preference
      newTheme = themePreference;
      console.log(`🌙 THEME: Using explicit preference: ${newTheme}`);
    }

    if (theme !== newTheme) {
      setTheme(newTheme);
      console.log(`🌙 THEME: Theme changed to: ${newTheme}`);
    }
  }, [themePreference, systemColorScheme, theme]);

  // Function to update theme preference with persistence
  const setThemePreference = async (preference: ThemePreference) => {
    try {
      console.log(`🌙 THEME: Setting theme preference to: ${preference}`);

      // Save to AsyncStorage
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);

      // Update state
      setThemePreferenceState(preference);

      console.log(`🌙 THEME: Theme preference saved successfully: ${preference}`);
    } catch (error) {
      console.error('🌙 THEME: Failed to save theme preference:', error);
      // Still update state even if storage fails
      setThemePreferenceState(preference);
    }
  };

  // Bulletproof theme object creation with React state management
  // This ensures theme objects are NEVER undefined and always stable during hot reload
  const themeObjects = useMemo(() => {
    // ALWAYS return valid theme objects, even during initialization
    // Use current theme if ready, otherwise use safe dark mode defaults
    const currentTheme = isThemeReady ? theme : 'dark';
    const completeTheme = getCompleteTheme(currentTheme);

    console.log(
      `🌙 THEME: Creating theme objects for mode: ${currentTheme} (ready: ${isThemeReady})`
    );

    // Ensure objects are always defined with required properties
    return {
      paper: completeTheme.paper,
      navigation: completeTheme.navigation,
    };
  }, [theme, isThemeReady]);

  // Context value with complete theme objects
  const contextValue: ThemeContextType = {
    theme,
    themePreference,
    setThemePreference,
    isThemeReady,
    paperTheme: themeObjects.paper,
    navigationTheme: themeObjects.navigation,
  };

  // 🎯 [KIM FIX] Android status bar background color based on theme
  const statusBarBgColor = theme === 'dark' ? '#121212' : '#FFFFFF';

  return (
    <ThemeContext.Provider value={contextValue}>
      {/* 🌙 Central Status Bar Management - Dark Mode First! */}
      {/* Dark theme = light status bar text (white), Light theme = dark status bar text (black) */}

      {/* 🎯 [KIM FIX] React Native StatusBar for Android - non-translucent with background color */}
      {/* This ensures Android status bar is NOT transparent and has proper background */}
      {Platform.OS === 'android' && (
        <RNStatusBar
          translucent={false}
          backgroundColor={statusBarBgColor}
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        />
      )}

      {/* expo-status-bar for iOS and as fallback */}
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
};

// Export context for hook usage
export { ThemeContext };
