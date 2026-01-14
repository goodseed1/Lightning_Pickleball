import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatIconProps {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  text: string;
  color?: string;
  size?: number;
}

const StatIcon: React.FC<StatIconProps> = ({
  icon,
  emoji,
  text,
  color = 'rgba(0, 0, 0, 0.6)',
  size = 14,
}) => {
  return (
    <View style={styles.container}>
      {emoji ? (
        <Text style={[styles.emoji, { fontSize: size }]}>{emoji}</Text>
      ) : icon ? (
        <Ionicons name={icon} size={size} color={color} style={styles.icon} />
      ) : null}
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    marginRight: 6,
  },
  emoji: {
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '400',
  },
});

export default StatIcon;
