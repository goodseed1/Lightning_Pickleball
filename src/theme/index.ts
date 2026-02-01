/**
 * Lightning Pickleball Theme System
 * Project Midnight - Phase 2: Enhanced Theme Architecture
 *
 * Centralized theme system with organized imports and exports
 * Built on React Native Paper with Lightning Pickleball branding
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Platform } from 'react-native';
import { ThemeMode } from '../types/theme';

// Import centralized color system
import {
  LightningPickleballBrandColors,
  LightningPickleballDarkColors,
  LightModeColors,
  DarkModeColors,
  getPlatformLightColors,
  getPlatformDarkColors,
} from './colors';

// Import navigation theme system
import { getLightningPickleballNavigationTheme, NavigationThemeVariants } from './navigation';

// ==================== COMMON THEME ELEMENTS ====================

/**
 * Common fonts configuration for both themes
 * Platform-optimized typography following system conventions
 */
const commonFonts = {
  // iOS는 San Francisco, Android는 Roboto
  regular: Platform.select({
    ios: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    android: {
      fontFamily: 'Roboto',
      fontWeight: '400' as const,
    },
  }),
  medium: Platform.select({
    ios: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    android: {
      fontFamily: 'Roboto',
      fontWeight: '500' as const,
    },
  }),
  bold: Platform.select({
    ios: {
      fontFamily: 'System',
      fontWeight: '600' as const,
    },
    android: {
      fontFamily: 'Roboto',
      fontWeight: '700' as const,
    },
  }),
};

/**
 * Common spacing and layout values
 * Consistent spacing system across all Lightning Pickleball components
 */
const commonLayout = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    round: 50,
  },
};

/**
 * Shadow styles for light theme
 * Optimized for readability and depth perception
 */
const lightShadows = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
};

/**
 * Shadow styles for dark theme
 * Enhanced shadows for better visibility in dark mode
 */
const darkShadows = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
    },
    android: {
      elevation: 3,
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
    },
    android: {
      elevation: 6,
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
    },
    android: {
      elevation: 12,
    },
  }),
};

// ==================== LIGHTNING PICKLEBALL THEMES ====================

/**
 * Lightning Pickleball Light Theme
 * Professional light theme with Lightning Pickleball branding
 * Optimized for React Native Paper components
 */
export const lightningPickleballLightTheme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,

    // Core Lightning Pickleball brand colors
    primary: LightningPickleballBrandColors.primary,
    secondary: LightningPickleballBrandColors.secondary,
    tertiary: LightningPickleballBrandColors.accent,

    // Status colors
    success: LightningPickleballBrandColors.success,
    warning: LightningPickleballBrandColors.warning,
    error: LightningPickleballBrandColors.error,

    // Special Lightning Pickleball colors
    pickleball: LightningPickleballBrandColors.pickleball,
    lightning: LightningPickleballBrandColors.lightning,

    // Interaction colors
    likeActive: LightningPickleballBrandColors.likeActive,

    // Platform-specific colors
    ...getPlatformLightColors(),

    // Semantic colors
    background: LightModeColors.background,
    surface: LightModeColors.surface,
    surfaceVariant: LightModeColors.surfaceVariant,
    onBackground: LightModeColors.onBackground,
    onSurface: LightModeColors.onSurface,
    onSurfaceVariant: LightModeColors.onSurfaceVariant,
    outline: LightModeColors.outline,
    outlineVariant: LightModeColors.outlineVariant,

    // Semantic container colors
    warningContainer: LightModeColors.warningContainer,
    onWarningContainer: LightModeColors.onWarningContainer,
    errorContainer: LightModeColors.errorContainer,
    onErrorContainer: LightModeColors.onErrorContainer,

    // Inverse colors
    inverseSurface: LightModeColors.inverseSurface,
    inverseOnSurface: LightModeColors.inverseOnSurface,
    inversePrimary: LightModeColors.inversePrimary,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    ...commonFonts,
  },
  ...commonLayout,
  shadows: lightShadows,
};

/**
 * Lightning Pickleball Dark Theme
 * Professional dark theme with Lightning Pickleball branding
 * Optimized for React Native Paper components in dark mode
 */
export const lightningPickleballDarkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,

    // Core Lightning Pickleball brand colors (dark optimized)
    primary: LightningPickleballDarkColors.primary,
    secondary: LightningPickleballDarkColors.secondary,
    tertiary: LightningPickleballDarkColors.accent,

    // Status colors (dark optimized)
    success: LightningPickleballDarkColors.success,
    warning: LightningPickleballDarkColors.warning,
    error: LightningPickleballDarkColors.error,

    // Special Lightning Pickleball colors (dark optimized)
    pickleball: LightningPickleballDarkColors.pickleball,
    pickleballGlow: LightningPickleballDarkColors.pickleballGlow,
    lightning: LightningPickleballDarkColors.lightning,
    lightningGlow: LightningPickleballDarkColors.lightningGlow,

    // Enhanced primary colors for depth
    primaryElevated: LightningPickleballDarkColors.primaryElevated,
    primaryGlow: LightningPickleballDarkColors.primaryGlow,

    // Enhanced accent colors
    accentSoft: LightningPickleballDarkColors.accentSoft,

    // Interaction colors (dark optimized)
    likeActive: LightningPickleballDarkColors.likeActive,

    // Platform-specific colors
    ...getPlatformDarkColors(),

    // Semantic colors - Hierarchical depth system
    background: DarkModeColors.background,
    surface: DarkModeColors.surface,
    surfaceVariant: DarkModeColors.surfaceVariant,
    surfaceElevated: DarkModeColors.surfaceElevated,
    surfaceHighlight: DarkModeColors.surfaceHighlight,
    onBackground: DarkModeColors.onBackground,
    onSurface: DarkModeColors.onSurface,
    onSurfaceHigh: DarkModeColors.onSurfaceHigh,
    onSurfaceMedium: DarkModeColors.onSurfaceMedium,
    onSurfaceVariant: DarkModeColors.onSurfaceVariant,
    outline: DarkModeColors.outline,
    outlineVariant: DarkModeColors.outlineVariant,

    // Semantic container colors
    warningContainer: DarkModeColors.warningContainer,
    onWarningContainer: DarkModeColors.onWarningContainer,
    errorContainer: DarkModeColors.errorContainer,
    onErrorContainer: DarkModeColors.onErrorContainer,

    // Inverse colors
    inverseSurface: DarkModeColors.inverseSurface,
    inverseOnSurface: DarkModeColors.inverseOnSurface,
    inversePrimary: DarkModeColors.inversePrimary,
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    ...commonFonts,
  },
  ...commonLayout,
  shadows: darkShadows,
};

// ==================== THEME UTILITIES ====================

/**
 * Get the appropriate Lightning Pickleball theme based on mode
 * Main theme getter function for the application
 */
export const getLightningPickleballTheme = (mode: ThemeMode) => {
  return mode === 'dark' ? lightningPickleballDarkTheme : lightningPickleballLightTheme;
};

/**
 * Get theme with navigation theme included
 * Convenience function that returns both Paper and Navigation themes
 * Defaults to dark mode for Project Midnight
 */
export const getCompleteTheme = (mode: ThemeMode = 'dark') => {
  const paperTheme = getLightningPickleballTheme(mode);
  const navigationTheme = getLightningPickleballNavigationTheme(mode === 'dark');

  return {
    paper: paperTheme,
    navigation: navigationTheme,
  };
};

/**
 * Create a custom theme variant
 * Allows customization while maintaining Lightning Pickleball base styling
 */
export const createCustomTheme = (
  mode: ThemeMode,
  customColors: Record<string, string> = {},
  customProperties: Record<string, unknown> = {}
) => {
  const baseTheme = getLightningPickleballTheme(mode);

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...customColors,
    },
    ...customProperties,
  };
};

// ==================== BACKWARDS COMPATIBILITY ====================

/**
 * @deprecated Use getLightningPickleballTheme instead
 * Maintained for backwards compatibility with existing code
 */
export const getTheme = getLightningPickleballTheme;

/**
 * @deprecated Use lightningPickleballLightTheme instead
 * Maintained for backwards compatibility
 */
export const lightTheme = lightningPickleballLightTheme;

/**
 * @deprecated Use lightningPickleballDarkTheme instead
 * Maintained for backwards compatibility
 */
export const darkTheme = lightningPickleballDarkTheme;

/**
 * @deprecated Use lightningPickleballLightTheme instead
 * Maintained for backwards compatibility
 */
export const theme = lightningPickleballLightTheme;

// ==================== EXPORTS ====================

// Re-export color system for direct access
export * from './colors';

// Re-export navigation themes for direct access
export * from './navigation';

// Main theme exports
export {
  lightningPickleballLightTheme as LightningPickleballLightTheme,
  lightningPickleballDarkTheme as LightningPickleballDarkTheme,
};

// ==================== TYPES ====================

/**
 * Main Lightning Pickleball theme type
 */
export type LightningPickleballTheme = typeof lightningPickleballLightTheme;

/**
 * Extended theme colors including Lightning Pickleball custom colors
 */
export type LightningPickleballColors = typeof lightningPickleballLightTheme.colors;

/**
 * Custom colors specific to Lightning Pickleball
 */
export type CustomColors = {
  success: string;
  warning: string;
  pickleball: string;
  lightning: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
};

/**
 * Complete theme package with Paper and Navigation themes
 */
export type CompleteTheme = {
  paper: LightningPickleballTheme;
  navigation: ReturnType<typeof getLightningPickleballNavigationTheme>;
};

// ==================== THEME CONSTANTS ====================

/**
 * Default theme configuration
 * Dark mode first for Project Midnight
 */
export const DEFAULT_THEME_CONFIG = {
  mode: 'dark' as ThemeMode,
  navigationVariant: 'standard' as keyof typeof NavigationThemeVariants,
  customColors: {},
} as const;
