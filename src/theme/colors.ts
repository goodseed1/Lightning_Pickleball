/**
 * Lightning Tennis Color System
 * Project Midnight - Phase 2: Centralized Color Definitions
 *
 * Comprehensive color palette system for Lightning Tennis app
 * Supporting both light and dark themes with Lightning Tennis branding
 */

import { Platform } from 'react-native';

// ==================== LIGHTNING TENNIS BRAND COLORS ====================

/**
 * Core Lightning Tennis Brand Colors (Light Mode)
 * These are the primary brand colors that define Lightning Tennis identity
 */
export const LightningTennisBrandColors = {
  // Primary brand colors
  primary: '#1976D2', // Lightning Tennis Blue
  secondary: '#FF6B35', // Tennis Orange
  accent: '#00BCD4', // Electric Cyan

  // Status colors
  success: '#4CAF50', // Success Green
  warning: '#FF9800', // Warning Amber
  error: '#F44336', // Error Red

  // Special brand colors
  tennis: '#7CB342', // Tennis Court Green
  lightning: '#FFD700', // Lightning Gold

  // Interaction colors
  likeActive: '#E91E63', // Like/Heart Active State
} as const;

/**
 * Lightning Tennis Dark Mode Colors
 * Optimized for dark backgrounds while maintaining brand identity
 */
export const LightningTennisDarkColors = {
  // Primary brand colors (softened for dark mode)
  primary: '#42A5F5', // Lighter Lightning Blue
  secondary: '#FF8A50', // Softer Tennis Orange
  accent: '#26C6DA', // Brighter Electric Cyan

  // Status colors (dark mode optimized)
  success: '#66BB6A', // Softer Success Green
  warning: '#FFB74D', // Softer Warning Amber
  error: '#EF5350', // Softer Error Red

  // Special brand colors (dark mode) - Enhanced for depth
  tennis: '#66BB6A', // Tennis Green
  tennisGlow: '#4CAF50', // Tennis Green Glow
  lightning: '#FFE082', // Softer Lightning Gold
  lightningGlow: '#FFC107', // Lightning Gold Glow

  // Enhanced primary colors for dark mode depth
  primaryElevated: '#64B5F6', // Elevated Primary Blue
  primaryGlow: '#1976D2', // Primary Blue Glow

  // Enhanced accent colors
  accentSoft: '#4DD0E1', // Soft Cyan for elevated elements

  // Interaction colors (dark mode optimized)
  likeActive: '#F48FB1', // Like/Heart Active State (softer pink for dark mode)
} as const;

// ==================== SEMANTIC COLOR SYSTEM ====================

/**
 * Light Mode Semantic Colors
 * These colors define the app's interface elements in light mode
 */
export const LightModeColors = {
  // Background colors
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6',

  // Text colors
  onBackground: '#1F2937',
  onSurface: '#1F2937',
  onSurfaceVariant: '#6B7280',

  // Border and outline colors
  outline: '#D1D5DB',
  outlineVariant: '#E5E7EB',

  // Status colors (for navigation theme compatibility)
  error: '#F44336', // Error Red

  // Semantic container colors
  warningContainer: '#FEF3C7', // Light yellow for warning cards
  onWarningContainer: '#92400E', // Dark yellow-brown text on warning background
  errorContainer: '#FFEBEE', // Light red for error/danger zones
  onErrorContainer: '#d32f2f', // Dark red text on error background

  // Interactive element colors
  scrim: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',

  // Inverse colors (for dark elements on light background)
  inverseSurface: '#1F2937',
  inverseOnSurface: '#FFFFFF',
  inversePrimary: '#42A5F5',
} as const;

/**
 * Dark Mode Semantic Colors
 * These colors define the app's interface elements in dark mode
 */
export const DarkModeColors = {
  // Background colors - Hierarchical depth system
  background: '#0A0A0A', // Level 0: 심연 (가장 깊은 배경)
  surface: '#121212', // Level 1: 기본 표면
  surfaceVariant: '#1E1E1E', // Level 2: 상위 표면
  surfaceElevated: '#252525', // Level 3: 부상된 표면
  surfaceHighlight: '#2C2C2E', // Level 4: 강조된 표면

  // Text colors - Hierarchical importance system
  onBackground: '#FFFFFF',
  onSurface: '#FFFFFF', // 최고 중요도 텍스트
  onSurfaceHigh: '#E8E8E8', // 높은 중요도 텍스트
  onSurfaceMedium: '#BDBDBD', // 중간 중요도 텍스트
  onSurfaceVariant: '#8E8E93', // 낮은 중요도 텍스트 (iOS-style secondary text)

  // Border and outline colors
  outline: '#3A3A3C', // iOS-style dark outline
  outlineVariant: '#48484A', // iOS-style secondary outline

  // Status colors (for navigation theme compatibility)
  error: '#EF5350', // Softer Error Red

  // Semantic container colors
  warningContainer: '#4d442a', // Dark yellow-brown for warning cards
  onWarningContainer: '#FDE68A', // Light yellow text on warning background
  errorContainer: '#5f2120', // Dark red for error/danger zones
  onErrorContainer: '#EF5350', // Light red text on error background

  // Interactive element colors
  scrim: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',

  // Inverse colors (for light elements on dark background)
  inverseSurface: '#FFFFFF',
  inverseOnSurface: '#1F2937',
  inversePrimary: '#1976D2',
} as const;

// ==================== PLATFORM-SPECIFIC COLORS ====================

/**
 * iOS Platform Colors (Light Mode)
 * Following iOS Human Interface Guidelines
 */
export const IOSLightColors = {
  primary: '#007AFF', // iOS Blue
  background: '#F2F2F7', // iOS System Background
  surface: '#FFFFFF', // iOS Secondary System Background
  onSurface: '#000000', // iOS Label

  // iOS specific semantic colors
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
} as const;

/**
 * iOS Platform Colors (Dark Mode)
 * Following iOS Human Interface Guidelines for dark appearance
 */
export const IOSDarkColors = {
  primary: '#0A84FF', // iOS Dark Blue
  background: '#000000', // iOS System Background (Dark)
  surface: '#1C1C1E', // iOS Secondary System Background (Dark)
  onSurface: '#FFFFFF', // iOS Label (Dark)

  // iOS specific semantic colors (dark)
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',
} as const;

/**
 * Android Platform Colors (Light Mode)
 * Following Material Design Guidelines
 */
export const AndroidLightColors = {
  primary: LightningTennisBrandColors.primary,
  background: '#FAFAFA', // Material Light Background
  surface: '#FFFFFF', // Material Light Surface
  onSurface: '#000000', // Material On Surface

  // Material specific colors
  elevation1: '#FFFFFF',
  elevation2: '#F5F5F5',
  elevation3: '#EEEEEE',
} as const;

/**
 * Android Platform Colors (Dark Mode)
 * Following Material Design Guidelines for dark theme
 */
export const AndroidDarkColors = {
  primary: LightningTennisDarkColors.primary,
  background: '#121212', // Material Dark Background
  surface: '#1E1E1E', // Material Dark Surface
  onSurface: '#FFFFFF', // Material On Surface (Dark)

  // Material specific colors (dark)
  elevation1: '#1E1E1E',
  elevation2: '#232323',
  elevation3: '#252525',
} as const;

// ==================== PLATFORM-AWARE COLOR FUNCTIONS ====================

/**
 * Get platform-specific light colors
 */
export const getPlatformLightColors = () =>
  Platform.select({
    ios: IOSLightColors,
    android: AndroidLightColors,
    default: AndroidLightColors,
  });

/**
 * Get platform-specific dark colors
 */
export const getPlatformDarkColors = () =>
  Platform.select({
    ios: IOSDarkColors,
    android: AndroidDarkColors,
    default: AndroidDarkColors,
  });

// ==================== UTILITY FUNCTIONS ====================

/**
 * Create a color with opacity
 */
export const withOpacity = (color: string, opacity: number): string => {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Handle rgba colors
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
  }

  // Handle rgb colors
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }

  return color;
};

/**
 * Lightning Tennis gradient colors
 */
export const LightningTennisGradients = {
  primary: [LightningTennisBrandColors.primary, LightningTennisBrandColors.accent],
  secondary: [LightningTennisBrandColors.secondary, LightningTennisBrandColors.lightning],
  success: [LightningTennisBrandColors.success, LightningTennisBrandColors.tennis],
  dark: [DarkModeColors.surface, DarkModeColors.background],
} as const;

// ==================== TYPE EXPORTS ====================

export type BrandColorName = keyof typeof LightningTennisBrandColors;
export type SemanticColorName = keyof typeof LightModeColors;
export type PlatformColorName = keyof typeof IOSLightColors | keyof typeof AndroidLightColors;
