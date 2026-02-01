/**
 * 🏆 Achievements Guide Card
 *
 * Collapsible dropdown card displaying achievements guide
 * Shows trophies and badges with their unlock conditions
 * Similar to LtrExplanationCard but for achievements
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  LayoutChangeEvent,
} from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { SEASON_TROPHIES } from '../../constants/seasonTrophies';
import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_CATEGORIES } from '../../constants/achievements';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AchievementsGuideCardProps {
  defaultExpanded?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollViewRef?: React.RefObject<any>;
}

const AchievementsGuideCard: React.FC<AchievementsGuideCardProps> = ({
  defaultExpanded = false,
  scrollViewRef,
}) => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const cardYPosition = useRef<number>(0);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Track card position via onLayout
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    cardYPosition.current = event.nativeEvent.layout.y;
  }, []);

  // Collapse and scroll to this card's position
  const handleCollapseAndScroll = () => {
    // First collapse the card
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(false);

    // Then scroll to the stored card position
    if (scrollViewRef?.current && cardYPosition.current > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, cardYPosition.current - 10),
          animated: true,
        });
      }, 100);
    }
  };

  const styles = createStyles(themeColors.colors as unknown as Record<string, string>, currentTheme);

  // Group badges by category
  const badgesByCategory = useMemo(() => {
    const grouped: Record<
      string,
      (typeof ACHIEVEMENT_DEFINITIONS)[keyof typeof ACHIEVEMENT_DEFINITIONS][]
    > = {};

    Object.values(ACHIEVEMENT_DEFINITIONS).forEach(achievement => {
      const category = achievement.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(achievement);
    });

    return grouped;
  }, []);

  // Map trophy keys to translation keys
  const getTrophyTranslationKey = (trophyKey: string): { name: string; desc: string } => {
    const keyMap: Record<string, { name: string; desc: string }> = {
      SEASON_CHAMPION_GOLD: { name: 'seasonChampion', desc: 'seasonChampionDesc' },
      SEASON_CHAMPION_SILVER: { name: 'seasonRunnerUp', desc: 'seasonRunnerUpDesc' },
      SEASON_CHAMPION_BRONZE: { name: 'season3rdPlace', desc: 'season3rdPlaceDesc' },
      RANK_UP: { name: 'rankUp', desc: 'rankUpDesc' },
      IRON_MAN: { name: 'ironMan', desc: 'ironManDesc' },
      ACE: { name: 'ace', desc: 'aceDesc' },
    };
    return keyMap[trophyKey] || { name: trophyKey, desc: trophyKey };
  };

  const renderIcon = (iconDef: { set: string; name: string; color: string }, size = 24) => {
    if (iconDef.set === 'FontAwesome5') {
      return <FontAwesome5 name={iconDef.name} size={size} color={iconDef.color} />;
    }
    return (
      <MaterialCommunityIcons name={iconDef.name as never} size={size} color={iconDef.color} />
    );
  };

  const getConditionText = (condition: {
    type: string;
    value: number;
    minTournaments?: number;
  }): string => {
    const { type, value, minTournaments } = condition;
    const conditionKey = `achievementsGuide.badgeItems.conditions.${type}`;
    const translated = t(conditionKey, {
      count: value,
      value: value,
      min: minTournaments,
      defaultValue: `${type}: ${value}`,
    });
    return translated;
  };

  return (
    <View onLayout={handleLayout}>
      <Card style={styles.card}>
        <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.8}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name='trophy' size={24} color='#FFD700' />
              <Text style={styles.headerTitle}>
                {t('achievementsGuide.title') || 'Achievements Guide'}
              </Text>
            </View>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={themeColors.colors.onSurfaceVariant}
            />
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.content}>
            {/* Introduction */}
            <Text style={styles.description}>
              {t('achievementsGuide.subtitle') ||
                'Unlock trophies and badges by achieving milestones'}
            </Text>

            {/* Season Trophies Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('achievementsGuide.seasonTrophies') || 'Season Trophies'}
              </Text>
              <Divider style={styles.divider} />

              {Object.entries(SEASON_TROPHIES)
                .slice(0, 3)
                .map(([key, trophy]) => {
                  const translationKeys = getTrophyTranslationKey(key);
                  return (
                    <View key={key} style={styles.itemRow}>
                      {renderIcon(trophy.icon)}
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>
                          {t(`achievementsGuide.seasonTrophyItems.${translationKeys.name}`) ||
                            trophy.name}
                        </Text>
                        <Text style={styles.itemDescription}>
                          {t(`achievementsGuide.seasonTrophyItems.${translationKeys.desc}`) ||
                            trophy.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>

            {/* Special Trophies */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('achievementsGuide.categories.special') || 'Special Awards'}
              </Text>
              <Divider style={styles.divider} />

              {Object.entries(SEASON_TROPHIES)
                .slice(3)
                .map(([key, trophy]) => {
                  const translationKeys = getTrophyTranslationKey(key);
                  return (
                    <View key={key} style={styles.itemRow}>
                      {renderIcon(trophy.icon)}
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>
                          {t(`achievementsGuide.seasonTrophyItems.${translationKeys.name}`) ||
                            trophy.name}
                        </Text>
                        <Text style={styles.itemDescription}>
                          {t(`achievementsGuide.seasonTrophyItems.${translationKeys.desc}`) ||
                            trophy.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>

            {/* Badges by Category - Show first 2 badges per category */}
            {Object.entries(ACHIEVEMENT_CATEGORIES).map(([categoryKey, categoryValue]) => {
              const categoryBadges = badgesByCategory[categoryValue];
              if (!categoryBadges || categoryBadges.length === 0) return null;

              // Show first 2 badges only for compact view
              const displayBadges = categoryBadges.slice(0, 2);

              return (
                <View key={categoryKey} style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {t(`achievementsGuide.categories.${categoryValue}`) ||
                      categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1)}
                  </Text>
                  <Divider style={styles.divider} />

                  {displayBadges.map(achievement => {
                    const firstTier = Object.entries(achievement.tiers)[0];
                    if (!firstTier) return null;

                    const [tierKey, tierData] = firstTier;
                    const badgeName = t(`achievementsGuide.badgeItems.${achievement.id}.name`, {
                      defaultValue: achievement.name,
                    });
                    const conditionText = getConditionText(tierData.condition);

                    return (
                      <View key={achievement.id} style={styles.itemRow}>
                        {renderIcon(tierData.icon)}
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemTitle}>{badgeName}</Text>
                          <Text style={styles.itemDescription}>
                            {tierKey.toUpperCase()}: {conditionText}
                          </Text>
                        </View>
                        <Text style={styles.points}>+{tierData.points}</Text>
                      </View>
                    );
                  })}

                  {/* Removed misleading "+N more" text - this is a guide card, not full list */}
                </View>
              );
            })}

            {/* Bottom Collapse Button */}
            <TouchableOpacity onPress={handleCollapseAndScroll} style={styles.collapseButton}>
              <Text style={styles.collapseText}>{t('common.collapse') || '접기'}</Text>
              <Ionicons name='chevron-up' size={18} color={themeColors.colors.onSurface} />
            </TouchableOpacity>
          </View>
        )}
      </Card>
    </View>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any, theme: 'light' | 'dark') =>
  StyleSheet.create({
    card: {
      marginBottom: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    description: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.onSurfaceVariant,
      marginBottom: 16,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    divider: {
      marginBottom: 12,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    itemInfo: {
      flex: 1,
      marginLeft: 12,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
    },
    itemDescription: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    points: {
      fontSize: 13,
      fontWeight: '600',
      color: '#4CAF50',
    },
    collapseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    collapseText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurface,
    },
  });

export default AchievementsGuideCard;
