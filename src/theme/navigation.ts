/**
 * Lightning Tennis Navigation Themes
 * Project Midnight - Phase 2: Dedicated Navigation Theme System
 *
 * Professional navigation themes with Lightning Tennis branding
 * Optimized for React Navigation with platform-specific styling
 */

import { Theme as NavigationTheme } from '@react-navigation/native';
import {
  LightningTennisBrandColors,
  LightningTennisDarkColors,
  LightModeColors,
  DarkModeColors,
  getPlatformLightColors,
  getPlatformDarkColors,
  withOpacity,
} from './colors';

// ==================== LIGHTNING TENNIS NAVIGATION THEMES ====================

/**
 * Lightning Tennis Light Navigation Theme
 * Professional light theme with Lightning Tennis branding
 */
export const LightningTennisLightNavigationTheme: NavigationTheme = {
  dark: false,
  colors: {
    // Enhanced Lightning Tennis branding (spread first to allow overrides)
    ...getPlatformLightColors(),

    // Core navigation colors (these override platform colors)
    primary: LightningTennisBrandColors.primary,
    background: LightModeColors.background,
    card: LightModeColors.surface,
    text: LightModeColors.onSurface,
    border: LightModeColors.outline,
    notification: LightningTennisBrandColors.error,
  },
};

/**
 * Lightning Tennis Dark Navigation Theme
 * Professional dark theme with Lightning Tennis branding optimized for dark mode
 */
export const LightningTennisDarkNavigationTheme: NavigationTheme = {
  dark: true,
  colors: {
    // Enhanced Lightning Tennis dark branding (spread first to allow overrides)
    ...getPlatformDarkColors(),

    // Core navigation colors (these override platform colors)
    primary: LightningTennisDarkColors.primary,
    background: DarkModeColors.background,
    card: DarkModeColors.surface,
    text: DarkModeColors.onSurface,
    border: DarkModeColors.outline,
    notification: LightningTennisDarkColors.error,
  },
};

// ==================== SPECIALIZED NAVIGATION THEMES ====================

/**
 * Lightning Tennis Tournament Navigation Theme (Light)
 * Special theme for tournament/competition screens
 */
export const TournamentLightNavigationTheme: NavigationTheme = {
  ...LightningTennisLightNavigationTheme,
  colors: {
    ...LightningTennisLightNavigationTheme.colors,
    primary: LightningTennisBrandColors.tennis, // Tennis green for tournaments
    card: withOpacity(LightningTennisBrandColors.tennis, 0.05), // Subtle tennis background
    border: withOpacity(LightningTennisBrandColors.tennis, 0.2),
  },
};

/**
 * Lightning Tennis Tournament Navigation Theme (Dark)
 * Special dark theme for tournament/competition screens
 */
export const TournamentDarkNavigationTheme: NavigationTheme = {
  ...LightningTennisDarkNavigationTheme,
  colors: {
    ...LightningTennisDarkNavigationTheme.colors,
    primary: LightningTennisDarkColors.tennis, // Tennis green for tournaments
    card: withOpacity(LightningTennisDarkColors.tennis, 0.08), // Subtle tennis background
    border: withOpacity(LightningTennisDarkColors.tennis, 0.3),
  },
};

/**
 * Lightning Tennis Electric Navigation Theme (Light)
 * High-energy theme for matching/lightning features
 */
export const ElectricLightNavigationTheme: NavigationTheme = {
  ...LightningTennisLightNavigationTheme,
  colors: {
    ...LightningTennisLightNavigationTheme.colors,
    primary: LightningTennisBrandColors.accent, // Electric cyan
    card: withOpacity(LightningTennisBrandColors.accent, 0.03),
    border: withOpacity(LightningTennisBrandColors.accent, 0.2),
    notification: LightningTennisBrandColors.lightning, // Lightning gold notifications
  },
};

/**
 * Lightning Tennis Electric Navigation Theme (Dark)
 * High-energy dark theme for matching/lightning features
 */
export const ElectricDarkNavigationTheme: NavigationTheme = {
  ...LightningTennisDarkNavigationTheme,
  colors: {
    ...LightningTennisDarkNavigationTheme.colors,
    primary: LightningTennisDarkColors.accent, // Electric cyan
    card: withOpacity(LightningTennisDarkColors.accent, 0.05),
    border: withOpacity(LightningTennisDarkColors.accent, 0.3),
    notification: LightningTennisDarkColors.lightning, // Lightning gold notifications
  },
};

// ==================== NAVIGATION THEME BUILDER FUNCTIONS ====================

/**
 * Get the appropriate Lightning Tennis navigation theme based on mode
 */
export const getLightningTennisNavigationTheme = (isDark: boolean): NavigationTheme => {
  return isDark ? LightningTennisDarkNavigationTheme : LightningTennisLightNavigationTheme;
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
 * Create a custom navigation theme with Lightning Tennis base styling
 */
export const createCustomNavigationTheme = (
  isDark: boolean,
  customColors: Partial<NavigationTheme['colors']>
): NavigationTheme => {
  const baseTheme = getLightningTennisNavigationTheme(isDark);

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
  // Standard Lightning Tennis themes
  standard: {
    light: LightningTennisLightNavigationTheme,
    dark: LightningTennisDarkNavigationTheme,
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
      primary: LightningTennisBrandColors.secondary,
      border: withOpacity(LightningTennisBrandColors.secondary, 0.2),
    }),
    dark: createCustomNavigationTheme(true, {
      primary: LightningTennisDarkColors.secondary,
      border: withOpacity(LightningTennisDarkColors.secondary, 0.3),
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

export type LightningTennisNavigationTheme = typeof LightningTennisLightNavigationTheme;
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
