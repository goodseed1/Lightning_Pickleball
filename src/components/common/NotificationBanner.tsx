/**
 * 🦾 IRON MAN: Notification Banner Component
 *
 * A reusable banner component for displaying important notifications
 * at the top of screens. Used for team invitations, announcements, etc.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text as PaperText, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';

interface NotificationBannerProps {
  message: string;
  destination: {
    screen: string;
    params?: Record<string, unknown>;
  };
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'info' | 'warning' | 'success' | 'error';
  onDismiss?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  destination,
  icon = 'notifications',
  variant = 'info',
  onDismiss,
}) => {
  const navigation = useNavigation();
  const { theme: currentTheme } = useTheme();
  const { t } = useLanguage();
  const themeColors = getLightningTennisTheme(currentTheme);

  const getVariantColor = () => {
    switch (variant) {
      case 'warning':
        return '#FF9500'; // Orange
      case 'success':
        return '#34C759'; // Green
      case 'error':
        return '#FF3B30'; // Red
      case 'info':
      default:
        return themeColors.colors.primary; // Primary blue
    }
  };

  const variantColor = getVariantColor();
  const styles = createStyles(themeColors.colors, variantColor);

  const handlePress = () => {
    navigation.navigate(destination.screen as never, destination.params as never);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Surface style={styles.banner} elevation={2}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={24} color={variantColor} />
          </View>
          <View style={styles.textContainer}>
            <PaperText variant='bodyMedium' style={styles.message}>
              {message}
            </PaperText>
            <PaperText variant='bodySmall' style={styles.actionText}>
              {t('common.tapToView')}
            </PaperText>
          </View>
          {onDismiss && (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                onDismiss();
              }}
              style={styles.dismissButton}
            >
              <Ionicons name='close' size={20} color={themeColors.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.bottomBorder, { backgroundColor: variantColor }]} />
      </Surface>
    </TouchableOpacity>
  );
};

const createStyles = (colors: Record<string, string>, variantColor: string) =>
  StyleSheet.create({
    banner: {
      backgroundColor: colors.surface,
      marginHorizontal: 0,
      marginVertical: 8,
      borderRadius: 0,
      overflow: 'hidden',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: variantColor + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
    },
    message: {
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    actionText: {
      color: variantColor,
      fontWeight: '500',
    },
    dismissButton: {
      padding: 4,
    },
    bottomBorder: {
      height: 4,
      width: '100%',
    },
  });

export default NotificationBanner;
