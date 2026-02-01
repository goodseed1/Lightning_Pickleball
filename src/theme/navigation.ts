/**
 * Lightning Pickleball Navigation Themes
 * Project Midnight - Phase 2: Dedicated Navigation Theme System
 *
 * Professional navigation themes with Lightning Pickleball branding
 * Optimized for React Navigation with platform-specific styling
 */

import { Theme as NavigationTheme } from '@react-navigation/native';
import {
  LightningPickleballBrandColors,
  LightningPickleballDarkColors,
  LightModeColors,
  DarkModeColors,
  getPlatformLightColors,
  getPlatformDarkColors,
  withOpacity,
} from './colors';

// ==================== LIGHTNING PICKLEBALL NAVIGATION THEMES ====================

/**
 * Lightning Pickleball Light Navigation Theme
 * Professional light theme with Lightning Pickleball branding
 */
export const LightningPickleballLightNavigationTheme: NavigationTheme = {
  dark: false,
  colors: {
    // Enhanced Lightning Pickleball branding (spread first to allow overrides)
    ...getPlatformLightColors(),

    // Core navigation colors (these override platform colors)
    primary: LightningPickleballBrandColors.primary,
    background: LightModeColors.background,
    card: LightModeColors.surface,
    text: LightModeColors.onSurface,
    border: LightModeColors.outline,
    notification: LightningPickleballBrandColors.error,
  },
};

/**
 * Lightning Pickleball Dark Navigation Theme
 * Professional dark theme with Lightning Pickleball branding optimized for dark mode
 */
export const LightningPickleballDarkNavigationTheme: NavigationTheme = {
  dark: true,
  colors: {
    // Enhanced Lightning Pickleball dark branding (spread first to allow overrides)
    ...getPlatformDarkColors(),

    // Core navigation colors (these override platform colors)
    primary: LightningPickleballDarkColors.primary,
    background: DarkModeColors.background,
    card: DarkModeColors.surface,
    text: DarkModeColors.onSurface,
    border: DarkModeColors.outline,
    notification: LightningPickleballDarkColors.error,
  },
};

// ==================== SPECIALIZED NAVIGATION THEMES ====================

/**
 * Lightning Pickleball Tournament Navigation Theme (Light)
 * Special theme for tournament/competition screens
 */
export const TournamentLightNavigationTheme: NavigationTheme = {
  ...LightningPickleballLightNavigationTheme,
  colors: {
    ...LightningPickleballLightNavigationTheme.colors,
    primary: LightningPickleballBrandColors.pickleball, // Pickleball green for tournaments
    card: withOpacity(LightningPickleballBrandColors.pickleball, 0.05), // Subtle pickleball background
    border: withOpacity(LightningPickleballBrandColors.pickleball, 0.2),
  },
};

/**
 * Lightning Pickleball Tournament Navigation Theme (Dark)
 * Special dark theme for tournament/competition screens
 */
export const TournamentDarkNavigationTheme: NavigationTheme = {
  ...LightningPickleballDarkNavigationTheme,
  colors: {
    ...LightningPickleballDarkNavigationTheme.colors,
    primary: LightningPickleballDarkColors.pickleball, // Pickleball green for tournaments
    card: withOpacity(LightningPickleballDarkColors.pickleball, 0.08), // Subtle pickleball background
    border: withOpacity(LightningPickleballDarkColors.pickleball, 0.3),
  },
};

/**
 * Lightning Pickleball Electric Navigation Theme (Light)
 * High-energy theme for matching/lightning features
 */
export const ElectricLightNavigationTheme: NavigationTheme = {
  ...LightningPickleballLightNavigationTheme,
  colors: {
    ...LightningPickleballLightNavigationTheme.colors,
    primary: LightningPickleballBrandColors.accent, // Electric cyan
    card: withOpacity(LightningPickleballBrandColors.accent, 0.03),
    border: withOpacity(LightningPickleballBrandColors.accent, 0.2),
    notification: LightningPickleballBrandColors.lightning, // Lightning gold notifications
  },
};

/**
 * Lightning Pickleball Electric Navigation Theme (Dark)
 * High-energy dark theme for matching/lightning features
 */
export const ElectricDarkNavigationTheme: NavigationTheme = {
  ...LightningPickleballDarkNavigationTheme,
  colors: {
    ...LightningPickleballDarkNavigationTheme.colors,
    primary: LightningPickleballDarkColors.accent, // Electric cyan
    card: withOpacity(LightningPickleballDarkColors.accent, 0.05),
    border: withOpacity(LightningPickleballDarkColors.accent, 0.3),
    notification: LightningPickleballDarkColors.lightning, // Lightning gold notifications
  },
};

// ==================== NAVIGATION THEME BUILDER FUNCTIONS ====================

/**
 * Get the appropriate Lightning Pickleball navigation theme based on mode
 */
export const getLightningPickleballNavigationTheme = (isDark: boolean): NavigationTheme => {
  return isDark ? LightningPickleballDarkNavigationTheme : LightningPickleballLightNavigationTheme;
};

/**
 * Get tournament-specific navigation theme based on mode
 */
export const getTournamentNavigationTheme = (isDark: boolean): NavigationTheme => {
  return isDark ? TournamentDarkNavigationTheme : TournamentLightNavigationTheme;
};

/**
 * Get electric/lightning-specific navigation theme based on mode
 */
export const getElectricNavigationTheme = (isDark: boolean): NavigationTheme => {
  return isDark ? ElectricDarkNavigationTheme : ElectricLightNavigationTheme;
};

/**
 * Create a custom navigation theme with Lightning Pickleball base styling
 */
export const createCustomNavigationTheme = (
  isDark: boolean,
  customColors: Partial<NavigationTheme['colors']>
): NavigationTheme => {
  const baseTheme = getLightningPickleballNavigationTheme(isDark);

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...customColors,
    },
  };
};

// ==================== NAVIGATION THEME VARIANTS ====================

/**
 * Navigation Theme Variants for different app sections
 */
export const NavigationThemeVariants = {
  // Standard Lightning Pickleball themes
  standard: {
    light: LightningPickleballLightNavigationTheme,
    dark: LightningPickleballDarkNavigationTheme,
  },

  // Tournament/Competition themes
  tournament: {
    light: TournamentLightNavigationTheme,
    dark: TournamentDarkNavigationTheme,
  },

  // Lightning/Matching themes
  electric: {
    light: ElectricLightNavigationTheme,
    dark: ElectricDarkNavigationTheme,
  },

  // Club-specific themes
  club: {
    light: createCustomNavigationTheme(false, {
      primary: LightningPickleballBrandColors.secondary,
      border: withOpacity(LightningPickleballBrandColors.secondary, 0.2),
    }),
    dark: createCustomNavigationTheme(true, {
      primary: LightningPickleballDarkColors.secondary,
      border: withOpacity(LightningPickleballDarkColors.secondary, 0.3),
    }),
  },
} as const;

// ==================== NAVIGATION THEME UTILITIES ====================

/**
 * Get navigation theme for specific app section
 */
export const getNavigationThemeForSection = (
  section: keyof typeof NavigationThemeVariants,
  isDark: boolean
): NavigationTheme => {
  return NavigationThemeVariants[section][isDark ? 'dark' : 'light'];
};

/**
 * Navigation theme with enhanced shadows for elevated surfaces
 */
export const createElevatedNavigationTheme = (baseTheme: NavigationTheme): NavigationTheme => {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      card: baseTheme.colors.card, // Enhanced card color for elevation
    },
    // Note: React Navigation doesn't directly support shadow styling,
    // but this structure allows for future extension
  };
};

/**
 * Validate navigation theme completeness
 */
export const validateNavigationTheme = (theme: NavigationTheme): boolean => {
  const requiredColors = ['primary', 'background', 'card', 'text', 'border', 'notification'];

  return requiredColors.every(
    color => color in theme.colors && theme.colors[color as keyof typeof theme.colors]
  );
};

// ==================== TYPE EXPORTS ====================

export type LightningPickleballNavigationTheme = typeof LightningPickleballLightNavigationTheme;
export type NavigationThemeVariant = keyof typeof NavigationThemeVariants;
export type NavigationThemeMode = 'light' | 'dark';

// ==================== CONSTANTS ====================

/**
 * Default navigation theme configuration
 */
export const DEFAULT_NAVIGATION_THEME_CONFIG = {
  variant: 'standard' as NavigationThemeVariant,
  elevation: 0,
  customColors: {},
} as const;
