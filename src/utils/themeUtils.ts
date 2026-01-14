/**
 * Theme Utility Functions
 * Helper functions for theme-aware styling
 */

import { StyleSheet } from 'react-native';
import { withOpacity } from '../theme/colors';

/**
 * Create dynamic styles based on current theme and variant
 */
export const createDynamicStyles = (themeMode: 'light' | 'dark', variant: string) => {
  // Get appropriate colors based on theme mode
  const colors =
    themeMode === 'dark'
      ? {
          surface: '#1E1E1E',
          onSurface: '#FFFFFF',
          surfaceVariant: '#2C2C2E',
          onSurfaceVariant: '#8E8E93',
          primary: '#42A5F5',
          tennis: '#9CCC65',
          accent: '#26C6DA',
          secondary: '#FF8A50',
        }
      : {
          surface: '#FFFFFF',
          onSurface: '#1F2937',
          surfaceVariant: '#F3F4F6',
          onSurfaceVariant: '#6B7280',
          primary: '#1976D2',
          tennis: '#7CB342',
          accent: '#00BCD4',
          secondary: '#FF6B35',
        };

  // Get variant-specific colors
  const variantColors = getVariantColors(variant, colors);

  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      marginVertical: 8,
      marginHorizontal: 16,
      elevation: themeMode === 'dark' ? 6 : 3,
      shadowOpacity: themeMode === 'dark' ? 0.3 : 0.1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: withOpacity(variantColors.accent, 0.2),
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    chip: {
      backgroundColor: withOpacity(variantColors.accent, 0.15),
      marginRight: 8,
      marginBottom: 4,
    },
    chipText: {
      color: variantColors.accent,
      fontSize: 12,
      fontWeight: '600',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.onSurface,
      flex: 1,
    },
    contentText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: 16,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    primaryButton: {
      backgroundColor: variantColors.primary,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    secondaryButton: {
      borderColor: variantColors.accent,
    },
    secondaryButtonText: {
      color: variantColors.accent,
    },
  });
};

/**
 * Get colors based on variant type
 */
export const getVariantColors = (variant: string, baseColors: Record<string, string>) => {
  switch (variant) {
    case 'tennis':
      return {
        primary: baseColors.tennis,
        accent: baseColors.tennis,
      };
    case 'electric':
      return {
        primary: baseColors.accent,
        accent: baseColors.accent,
      };
    case 'tournament':
      return {
        primary: baseColors.secondary,
        accent: baseColors.secondary,
      };
    default:
      return {
        primary: baseColors.primary,
        accent: baseColors.primary,
      };
  }
};
