import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';

interface StatusChipProps {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  // 🎯 [KIM FIX] 'primary' variant 추가 (관리자 배지용)
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({
  text,
  icon,
  emoji,
  variant = 'default',
  size = 'medium',
}) => {
  const { theme } = useTheme();
  const themeColors = getLightningPickleballTheme(theme);
  const isDark = theme === 'dark';

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return isDark
          ? { backgroundColor: '#1B2B1B', textColor: '#81C784', borderColor: '#4CAF50' }
          : { backgroundColor: '#E8F5E8', textColor: '#2E7D32', borderColor: '#4CAF50' };
      case 'warning':
        return isDark
          ? { backgroundColor: '#2B251A', textColor: '#FFB74D', borderColor: '#FF9800' }
          : { backgroundColor: '#FFF8E1', textColor: '#F57C00', borderColor: '#FF9800' };
      case 'error':
        return isDark
          ? { backgroundColor: '#2B1B1B', textColor: '#EF5350', borderColor: '#F44336' }
          : { backgroundColor: '#FFEBEE', textColor: '#C62828', borderColor: '#F44336' };
      case 'info':
        return isDark
          ? { backgroundColor: '#1A2332', textColor: '#64B5F6', borderColor: '#2196F3' }
          : { backgroundColor: '#E3F2FD', textColor: '#1565C0', borderColor: '#2196F3' };
      // 🎯 [KIM FIX] primary variant 색상 (관리자 배지 - 보라색)
      case 'primary':
        return isDark
          ? { backgroundColor: '#2D1B4E', textColor: '#CE93D8', borderColor: '#9C27B0' }
          : { backgroundColor: '#F3E5F5', textColor: '#7B1FA2', borderColor: '#9C27B0' };
      default:
        return isDark
          ? {
              backgroundColor: themeColors.colors.surfaceVariant,
              textColor: themeColors.colors.onSurfaceVariant,
              borderColor: themeColors.colors.outline,
            }
          : { backgroundColor: '#F5F5F5', textColor: '#666', borderColor: '#E0E0E0' };
    }
  };

  const colors = getVariantColors();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          paddingHorizontal: isSmall ? 8 : 10,
          paddingVertical: isSmall ? 3 : 4,
        },
      ]}
    >
      {emoji ? (
        <Text style={[styles.emoji, { fontSize: isSmall ? 10 : 12 }]}>{emoji}</Text>
      ) : icon ? (
        <Ionicons
          name={icon}
          size={isSmall ? 12 : 14}
          color={colors.textColor}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          {
            color: colors.textColor,
            fontSize: isSmall ? 11 : 12,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  emoji: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default StatusChip;
