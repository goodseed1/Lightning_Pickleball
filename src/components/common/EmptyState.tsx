import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Paragraph, Button, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  onActionPress?: () => void;
  variant?: 'default' | 'centered';
}

export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionText,
  onActionPress,
  variant = 'centered',
}: EmptyStateProps) {
  const theme = useTheme();

  const containerStyle =
    variant === 'centered' ? [styles.container, styles.centered] : styles.container;

  return (
    <View style={containerStyle}>
      <Icon name={icon} size={64} color={theme.colors.outline} style={styles.icon} />

      <Title style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Title>

      {description && (
        <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {description}
        </Paragraph>
      )}

      {actionText && onActionPress && (
        <Button mode='contained' onPress={onActionPress} style={styles.button}>
          {actionText}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  button: {
    minWidth: 120,
  },
});
