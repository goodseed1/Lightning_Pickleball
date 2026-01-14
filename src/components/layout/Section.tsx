import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';

type Props = {
  title: string;
  requiredBadge?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: string;
};

export default function Section({
  title,
  requiredBadge,
  defaultExpanded,
  children,
  icon,
}: Props) {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors;
  const [expanded, setExpanded] = useState(!!defaultExpanded);

  const styles = StyleSheet.create({
    container: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.outline,
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    iconContainer: {
      marginLeft: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      flex: 1,
      color: colors.onSurface,
    },
    badge: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.error,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.errorContainer,
      borderRadius: 999,
      overflow: 'hidden',
    },
    body: {
      paddingHorizontal: 10,
      paddingBottom: 10,
      gap: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded(v => !v)}>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-down' : 'chevron-right'}
          size={16}
          color={colors.onSurfaceVariant}
        />
        {icon && (
          <View style={styles.iconContainer}>
            {typeof icon === 'string' ? <Text>{icon}</Text> : icon}
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        {requiredBadge && <Text style={styles.badge}>{requiredBadge}</Text>}
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}
