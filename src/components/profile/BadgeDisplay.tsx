/**
 * 🏅 Badge Display Component
 * Iron Man's Design with multi-icon-set support via react-native-vector-icons
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { Timestamp } from 'firebase/firestore';

export interface Badge {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: {
    set: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5';
    name: string;
    color: string;
  };
  awardedAt?: Timestamp;
}

interface BadgeDisplayProps {
  badge: Badge;
  unlocked?: boolean;
  onPress?: () => void;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badge, unlocked = true, onPress }) => {
  // Render icon based on icon set
  const renderIcon = () => {
    const iconColor = unlocked ? badge.icon.color : '#9E9E9E';
    const iconSize = 32;

    switch (badge.icon.set) {
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={badge.icon.name} size={iconSize} color={iconColor} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={badge.icon.name} size={iconSize} color={iconColor} />;
      case 'Ionicons':
      default:
        return <Ionicons name={badge.icon.name} size={iconSize} color={iconColor} />;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, !unlocked && styles.locked]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: unlocked ? `${badge.icon.color}20` : '#E0E0E0' },
        ]}
      >
        {renderIcon()}
      </View>
      <Text
        variant='bodySmall'
        style={[styles.name, !unlocked && styles.lockedText]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 90,
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 16,
  },
  locked: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    textAlign: 'center',
    fontSize: 11,
  },
  lockedText: {
    color: '#9E9E9E',
  },
});

export default BadgeDisplay;
