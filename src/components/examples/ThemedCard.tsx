/**
 * ThemedCard - Example Component
 * Project Midnight - Phase 2: Theme-Aware Component Example
 *
 * Demonstrates how to create Lightning Pickleball components that adapt to themes
 * Shows proper usage of useTheme hook and Lightning Pickleball color system
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { LightningPickleballBrandColors, withOpacity } from '../../theme/colors';
import { createDynamicStyles } from '../../utils/themeUtils';

// ==================== COMPONENT INTERFACES ====================

interface ThemedCardProps {
  title: string;
  subtitle?: string;
  content: string;
  variant?: 'standard' | 'pickleball' | 'electric' | 'tournament';
  onPress?: () => void;
  showActions?: boolean;
}

// ==================== THEMED CARD COMPONENT ====================

/**
 * ThemedCard - A fully theme-aware card component
 *
 * Features:
 * - Automatically adapts colors based on current theme (light/dark)
 * - Multiple variants with Lightning Pickleball branding
 * - Proper contrast and accessibility
 * - Platform-optimized shadows and elevation
 *
 * Usage:
 * ```tsx
 * <ThemedCard
 *   title="Match Found!"
 *   subtitle="Lightning Pickleball"
 *   content="You have a new pickleball match request"
 *   variant="pickleball"
 *   onPress={() => navigateToMatch()}
 *   showActions={true}
 * />
 * ```
 */
export const ThemedCard: React.FC<ThemedCardProps> = ({
  title,
  subtitle,
  content,
  variant = 'standard',
  onPress,
  showActions = false,
}) => {
  // Access the current theme using our custom hook
  const { theme } = useTheme();

  // Create dynamic styles based on current theme and variant
  const dynamicStyles = createDynamicStyles(theme, variant);

  return (
    <Card style={dynamicStyles.card} onPress={onPress}>
      <Card.Content style={dynamicStyles.content}>
        {/* Header Section */}
        <View style={dynamicStyles.header}>
          {subtitle && (
            <Chip style={dynamicStyles.chip} textStyle={dynamicStyles.chipText} compact>
              {subtitle}
            </Chip>
          )}
          <Text style={dynamicStyles.title}>{title}</Text>
        </View>

        {/* Content Section */}
        <Text style={dynamicStyles.contentText}>{content}</Text>

        {/* Actions Section */}
        {showActions && (
          <View style={dynamicStyles.actions}>
            <Button
              mode='outlined'
              style={dynamicStyles.secondaryButton}
              labelStyle={dynamicStyles.secondaryButtonText}
            >
              View Details
            </Button>
            <Button
              mode='contained'
              style={dynamicStyles.primaryButton}
              labelStyle={dynamicStyles.primaryButtonText}
            >
              Accept
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

// ==================== ADDITIONAL THEMED COMPONENTS ====================

/**
 * Lightning Pickleball Status Indicator
 */
export const StatusIndicator = ({
  status,
  label,
}: {
  status: 'online' | 'playing' | 'offline';
  label: string;
}) => {
  const { theme } = useTheme();
  const styles = createStatusStyles(theme);

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, styles[status]]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

/**
 * Pickleball Court Themed Button
 */
export const PickleballButton = ({ title, onPress }: { title: string; onPress: () => void }) => {
  const { theme } = useTheme();
  const styles = createPickleballButtonStyles(theme);

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

/**
 * Theme-Aware Section Header
 */
export const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const { theme } = useTheme();
  const styles = createHeaderStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

// ==================== STYLE UTILITIES ====================

/**
 * Status indicator styles
 */
const createStatusStyles = (themeMode: 'light' | 'dark') => {
  const textColor = themeMode === 'dark' ? '#FFFFFF' : '#1F2937';

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    online: {
      backgroundColor: LightningPickleballBrandColors.success,
    },
    playing: {
      backgroundColor: LightningPickleballBrandColors.pickleball,
    },
    offline: {
      backgroundColor: '#9E9E9E',
    },
    label: {
      color: textColor,
      fontSize: 14,
    },
  });
};

/**
 * Pickleball button styles
 */
const createPickleballButtonStyles = (themeMode: 'light' | 'dark') => {
  const pickleballColor = themeMode === 'dark' ? '#9CCC65' : '#7CB342';

  return StyleSheet.create({
    button: {
      backgroundColor: withOpacity(pickleballColor, 0.15),
      borderColor: pickleballColor,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    text: {
      color: pickleballColor,
      fontSize: 16,
      fontWeight: '600',
    },
  });
};

/**
 * Header styles
 */
const createHeaderStyles = (themeMode: 'light' | 'dark') => {
  const colors = {
    title: themeMode === 'dark' ? '#FFFFFF' : '#1F2937',
    subtitle: themeMode === 'dark' ? '#8E8E93' : '#6B7280',
  };

  return StyleSheet.create({
    container: {
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.title,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtitle,
    },
  });
};

// ==================== USAGE EXAMPLES ====================

/**
 * Example usage showcase component
 * This component demonstrates various ways to use the theme system
 */
export const ThemeShowcase: React.FC = () => {
  const { theme, themePreference, setThemePreference } = useTheme();

  return (
    <View style={{ padding: 16 }}>
      <SectionHeader
        title='Lightning Pickleball Theme System'
        subtitle={`Current theme: ${theme} (preference: ${themePreference})`}
      />

      <ThemedCard
        title='Standard Card'
        subtitle='Default'
        content='This is a standard themed card that adapts to light and dark modes.'
        variant='standard'
        showActions={true}
      />

      <ThemedCard
        title='Pickleball Match'
        subtitle='Court Ready'
        content='Your pickleball match is scheduled for today at 3:00 PM.'
        variant='pickleball'
        showActions={true}
      />

      <ThemedCard
        title='Lightning Match'
        subtitle='Quick Play'
        content='Found a lightning match partner near you!'
        variant='electric'
        showActions={true}
      />

      <View style={{ marginTop: 16 }}>
        <StatusIndicator status='online' label='Available for matches' />
        <StatusIndicator status='playing' label='Currently playing' />
        <StatusIndicator status='offline' label='Offline' />
      </View>

      <View style={{ marginTop: 16 }}>
        <PickleballButton
          title='Switch Theme'
          onPress={() => setThemePreference(theme === 'light' ? 'dark' : 'light')}
        />
      </View>
    </View>
  );
};

export default ThemedCard;
