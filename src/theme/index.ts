/**
 * Lightning Tennis Theme System
 * Project Midnight - Phase 2: Enhanced Theme Architecture
 *
 * Centralized theme system with organized imports and exports
 * Built on React Native Paper with Lightning Tennis branding
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Platform } from 'react-native';
import { ThemeMode } from '../types/theme';

// Import centralized color system
import {
  LightningTennisBrandColors,
  LightningTennisDarkColors,
  LightModeColors,
  DarkModeColors,
  getPlatformLightColors,
  getPlatformDarkColors,
} from './colors';

// Import navigation theme system
import { getLightningTennisNavigationTheme, NavigationThemeVariants } from './navigation';

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
 * Consistent spacing system across all Lightning Tennis components
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

// ==================== LIGHTNING TENNIS THEMES ====================

/**
 * Lightning Tennis Light Theme
 * Professional light theme with Lightning Tennis branding
 * Optimized for React Native Paper components
 */
export const lightningTennisLightTheme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,

    // Core Lightning Tennis brand colors
    primary: LightningTennisBrandColors.primary,
    secondary: LightningTennisBrandColors.secondary,
    tertiary: LightningTennisBrandColors.accent,

    // Status colors
    success: LightningTennisBrandColors.success,
    warning: LightningTennisBrandColors.warning,
    error: LightningTennisBrandColors.error,

    // Special Lightning Tennis colors
    tennis: LightningTennisBrandColors.tennis,
    lightning: LightningTennisBrandColors.lightning,

    // Interaction colors
    likeActive: LightningTennisBrandColors.likeActive,

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
 * Lightning Tennis Dark Theme
 * Professional dark theme with Lightning Tennis branding
 * Optimized for React Native Paper components in dark mode
 */
export const lightningTennisDarkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,

    // Core Lightning Tennis brand colors (dark optimized)
    primary: LightningTennisDarkColors.primary,
    secondary: LightningTennisDarkColors.secondary,
    tertiary: LightningTennisDarkColors.accent,

    // Status colors (dark optimized)
    success: LightningTennisDarkColors.success,
    warning: LightningTennisDarkColors.warning,
    error: LightningTennisDarkColors.error,

    // Special Lightning Tennis colors (dark optimized)
    tennis: LightningTennisDarkColors.tennis,
    tennisGlow: LightningTennisDarkColors.tennisGlow,
    lightning: LightningTennisDarkColors.lightning,
    lightningGlow: LightningTennisDarkColors.lightningGlow,

    // Enhanced primary colors for depth
    primaryElevated: LightningTennisDarkColors.primaryElevated,
    primaryGlow: LightningTennisDarkColors.primaryGlow,

    // Enhanced accent colors
    accentSoft: LightningTennisDarkColors.accentSoft,

    // Interaction colors (dark optimized)
    likeActive: LightningTennisDarkColors.likeActive,

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
 * Get the appropriate Lightning Tennis theme based on mode
 * Main theme getter function for the application
 */
export const getLightningTennisTheme = (mode: ThemeMode) => {
  return mode === 'dark' ? lightningTennisDarkTheme : lightningTennisLightTheme;
};

/**
 * Get theme with navigation theme included
 * Convenience function that returns both Paper and Navigation themes
 * Defaults to dark mode for Project Midnight
 */
export const getCompleteTheme = (mode: ThemeMode = 'dark') => {
  const paperTheme = getLightningTennisTheme(mode);
  const navigationTheme = getLightningTennisNavigationTheme(mode === 'dark');

  return {
    paper: paperTheme,
    navigation: navigationTheme,
  };
};

/**
 * Create a custom theme variant
 * Allows customization while maintaining Lightning Tennis base styling
 */
export const createCustomTheme = (
  mode: ThemeMode,
  customColors: Record<string, string> = {},
  customProperties: Record<string, unknown> = {}
) => {
  const baseTheme = getLightningTennisTheme(mode);

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
 * @deprecated Use getLightningTennisTheme instead
 * Maintained for backwards compatibility with existing code
 */
export const getTheme = getLightningTennisTheme;

/**
 * @deprecated Use lightningTennisLightTheme instead
 * Maintained for backwards compatibility
 */
export const lightTheme = lightningTennisLightTheme;

/**
 * @deprecated Use lightningTennisDarkTheme instead
 * Maintained for backwards compatibility
 */
export const darkTheme = lightningTennisDarkTheme;

/**
 * @deprecated Use lightningTennisLightTheme instead
 * Maintained for backwards compatibility
 */
export const theme = lightningTennisLightTheme;

// ==================== EXPORTS ====================

// Re-export color system for direct access
export * from './colors';

// Re-export navigation themes for direct access
export * from './navigation';

// Main theme exports
export {
  lightningTennisLightTheme as LightningTennisLightTheme,
  lightningTennisDarkTheme as LightningTennisDarkTheme,
};

// ==================== TYPES ====================

/**
 * Main Lightning Tennis theme type
 */
export type LightningTennisTheme = typeof lightningTennisLightTheme;

/**
 * Extended theme colors including Lightning Tennis custom colors
 */
export type LightningTennisColors = typeof lightningTennisLightTheme.colors;

/**
 * Custom colors specific to Lightning Tennis
 */
export type CustomColors = {
  success: string;
  warning: string;
  tennis: string;
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
  paper: LightningTennisTheme;
  navigation: ReturnType<typeof getLightningTennisNavigationTheme>;
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
