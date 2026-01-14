/**
 * Universal Reward Icon Renderer
 * Intelligently displays Trophy and Achievement icons with dynamic theming
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { RewardIcon as RewardIconType, Trophy, Achievement } from '../../types/user';

interface RewardIconProps {
  reward: Trophy | Achievement;
  size?: number;
  style?: ViewStyle;
  showGlow?: boolean;
  animated?: boolean;
}

// Icon set mapping
const iconSets = {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
};

// Tier-based color schemes
const tierColors = {
  bronze: {
    primary: '#CD7F32',
    glow: '#B8722C',
    shadow: 'rgba(205, 127, 50, 0.3)',
  },
  silver: {
    primary: '#C0C0C0',
    glow: '#A8A8A8',
    shadow: 'rgba(192, 192, 192, 0.3)',
  },
  gold: {
    primary: '#FFD700',
    glow: '#E6C200',
    shadow: 'rgba(255, 215, 0, 0.4)',
  },
  platinum: {
    primary: '#E5E4E2',
    glow: '#B8B8B8',
    shadow: 'rgba(229, 228, 226, 0.4)',
  },
};

// Season-based decorations
const seasonDecorations = {
  'Spring 2025': {
    decorativeColor: '#FF69B4', // Cherry blossom pink
    pattern: '🌸',
  },
  'Summer 2025': {
    decorativeColor: '#FFD700', // Sunny gold
    pattern: '☀️',
  },
  'Fall 2025': {
    decorativeColor: '#FF8C00', // Autumn orange
    pattern: '🍁',
  },
  'Winter 2025': {
    decorativeColor: '#87CEEB', // Winter blue
    pattern: '❄️',
  },
};

// Default icon mappings for different reward types
const defaultIconMappings = {
  // Tournament Trophies
  tournament_winner: {
    set: 'MaterialCommunityIcons' as const,
    name: 'trophy-variant',
    color: '#FFD700',
  },
  tournament_runnerup: { set: 'MaterialCommunityIcons' as const, name: 'medal', color: '#C0C0C0' },

  // Season/Performance Trophies
  'rank-up': {
    set: 'MaterialCommunityIcons' as const,
    name: 'arrow-up-bold-hexagon-outline',
    color: '#4CAF50',
  },
  'win-rate': { set: 'MaterialCommunityIcons' as const, name: 'percent-circle', color: '#2196F3' },
  participation: {
    set: 'MaterialCommunityIcons' as const,
    name: 'account-group',
    color: '#FF9800',
  },

  // Achievement Categories
  matches: { set: 'MaterialCommunityIcons' as const, name: 'tennis-ball', color: '#8BC34A' },
  social: { set: 'MaterialCommunityIcons' as const, name: 'account-heart', color: '#E91E63' },
  clubs: { set: 'MaterialCommunityIcons' as const, name: 'home-group', color: '#9C27B0' },
  tournaments: { set: 'MaterialCommunityIcons' as const, name: 'tournament', color: '#FF5722' },
  streaks: { set: 'MaterialCommunityIcons' as const, name: 'fire', color: '#FF5722' },
  special: { set: 'MaterialCommunityIcons' as const, name: 'star-circle', color: '#FFC107' },
};

const RewardIcon: React.FC<RewardIconProps> = ({ reward, size = 48, style, showGlow = true }) => {
  // Extract icon configuration
  let iconConfig: RewardIconType;

  if ('icon' in reward && reward.icon) {
    // Use provided icon configuration
    iconConfig = reward.icon;
  } else {
    // Generate default icon configuration
    const rewardType =
      'type' in reward ? reward.type : 'category' in reward ? reward.category : 'matches';
    const defaultIcon =
      defaultIconMappings[rewardType as keyof typeof defaultIconMappings] ||
      defaultIconMappings.matches;

    iconConfig = {
      set: defaultIcon.set,
      name: defaultIcon.name,
      color: defaultIcon.color,
      tier: 'tier' in reward ? reward.tier : 'bronze',
      season: 'season' in reward ? reward.season : undefined,
    };
  }

  // Get tier styling
  const tierStyle = tierColors[iconConfig.tier || 'bronze'];

  // Apply season decoration if available
  const seasonDecoration = iconConfig.season
    ? seasonDecorations[iconConfig.season as keyof typeof seasonDecorations]
    : null;

  // Apply club theming if available
  const clubTheme = iconConfig.clubTheme;
  const finalColor = clubTheme?.customColor || iconConfig.color || tierStyle.primary;

  // Get the appropriate icon component
  const IconComponent = iconSets[iconConfig.set];

  // Container styles
  const containerStyles: ViewStyle[] = [
    styles.container,
    {
      width: size + 16,
      height: size + 16,
    },
    style,
  ];

  if (showGlow) {
    containerStyles.push({
      shadowColor: tierStyle.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 8,
    });
  }

  return (
    <View style={containerStyles}>
      {/* Background glow effect */}
      {showGlow && (
        <View
          style={[
            styles.glowBackground,
            {
              width: size + 8,
              height: size + 8,
              borderRadius: (size + 8) / 2,
              backgroundColor: tierStyle.glow,
              opacity: 0.3,
            },
          ]}
        />
      )}

      {/* Main icon */}
      <View style={styles.iconContainer}>
        <IconComponent name={iconConfig.name} size={size} color={finalColor} />
      </View>

      {/* Season decoration */}
      {seasonDecoration && (
        <View style={[styles.seasonDecoration, { top: -4, right: -4 }]}>
          <View
            style={[
              styles.decorationBadge,
              {
                backgroundColor: seasonDecoration.decorativeColor,
                borderRadius: size * 0.15,
                padding: size * 0.05,
              },
            ]}
          >
            <IconComponent name='weather-partly-cloudy' size={size * 0.2} color='white' />
          </View>
        </View>
      )}

      {/* Club decoration */}
      {clubTheme?.decoration && (
        <View style={[styles.clubDecoration, { bottom: -2, right: -2 }]}>
          <View
            style={[
              styles.decorationBadge,
              {
                backgroundColor: clubTheme.customColor || tierStyle.primary,
                borderRadius: size * 0.1,
                padding: size * 0.03,
              },
            ]}
          >
            <MaterialCommunityIcons name='home' size={size * 0.15} color='white' />
          </View>
        </View>
      )}

      {/* Tier indicator */}
      <View
        style={[
          styles.tierIndicator,
          {
            top: -2,
            left: -2,
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: (size * 0.25) / 2,
            backgroundColor: tierStyle.primary,
            borderColor: 'white',
            borderWidth: 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    zIndex: -1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  seasonDecoration: {
    position: 'absolute',
    zIndex: 2,
  },
  clubDecoration: {
    position: 'absolute',
    zIndex: 2,
  },
  decorationBadge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  tierIndicator: {
    position: 'absolute',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default RewardIcon;
