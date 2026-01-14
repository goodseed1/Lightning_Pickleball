/**
 * Achievements Guide Screen
 * Displays all available trophies and badges with their unlock conditions
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Divider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { getLightningPickleballTheme } from '../theme';
import { SEASON_TROPHIES } from '../constants/seasonTrophies';
import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_CATEGORIES } from '../constants/achievements';

interface AchievementsGuideScreenProps {
  navigation: {
    goBack: () => void;
  };
}

const AchievementsGuideScreen: React.FC<AchievementsGuideScreenProps> = ({ navigation }) => {
  // Theme & i18n
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const themedStyles = createThemedStyles(themeColors.colors as any);
  const { t } = useLanguage();

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

  const renderIcon = (iconDef: { set: string; name: string; color: string }) => {
    const IconComponent = iconDef.set === 'FontAwesome5' ? FontAwesome5 : MaterialCommunityIcons;
    return <IconComponent name={iconDef.name} size={32} color={iconDef.color} />;
  };

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

  const renderTrophy = (
    trophyKey: string,
    trophy: (typeof SEASON_TROPHIES)[keyof typeof SEASON_TROPHIES]
  ) => {
    const IconComponent =
      trophy.icon.set === 'FontAwesome5' ? FontAwesome5 : MaterialCommunityIcons;
    const translationKeys = getTrophyTranslationKey(trophyKey);

    return (
      <View key={trophyKey} style={themedStyles.itemCard}>
        <View style={styles.itemHeader}>
          <IconComponent name={trophy.icon.name} size={32} color={trophy.icon.color} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>
              {t(`achievementsGuide.seasonTrophyItems.${translationKeys.name}`)}
            </Text>
            <Text style={styles.itemDescription}>
              {t(`achievementsGuide.seasonTrophyItems.${translationKeys.desc}`)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBadge = (
    achievement: (typeof ACHIEVEMENT_DEFINITIONS)[keyof typeof ACHIEVEMENT_DEFINITIONS]
  ) => {
    const tiers = Object.entries(achievement.tiers);
    // Use translation key based on achievement id
    const badgeName = t(`achievementsGuide.badgeItems.${achievement.id}.name`, {
      defaultValue: achievement.name,
    });
    const badgeDesc = t(`achievementsGuide.badgeItems.${achievement.id}.desc`, {
      defaultValue: achievement.description,
    });

    return (
      <View key={achievement.id} style={themedStyles.itemCard}>
        <View style={styles.badgeHeader}>
          <Text style={styles.badgeName}>{badgeName}</Text>
          <Text style={styles.badgeDescription}>{badgeDesc}</Text>
        </View>

        {tiers.map(([tierKey, tierData]) => {
          const conditionText = getConditionText(tierData.condition);

          return (
            <View key={`${achievement.id}_${tierKey}`} style={styles.tierRow}>
              {renderIcon(tierData.icon)}
              <View style={styles.tierInfo}>
                <Text style={styles.tierName}>{tierKey.toUpperCase()}</Text>
                <Text style={styles.tierCondition}>{conditionText}</Text>
              </View>
              <Text style={styles.tierPoints}>+{tierData.points}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const getConditionText = (condition: {
    type: string;
    value: number;
    minTournaments?: number;
  }): string => {
    const { type, value, minTournaments } = condition;

    // Use translation with interpolation
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
    <SafeAreaView style={themedStyles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={themedStyles.header}>
        <IconButton icon='arrow-left' size={24} onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('achievementsGuide.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('achievementsGuide.subtitle')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Season Trophies Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('achievementsGuide.seasonTrophies')}</Text>
          <Divider style={styles.divider} />
          {Object.entries(SEASON_TROPHIES).map(([key, trophy]) => renderTrophy(key, trophy))}
        </View>

        {/* Badges by Category */}
        {Object.entries(ACHIEVEMENT_CATEGORIES).map(([categoryKey, categoryValue]) => {
          const categoryBadges = badgesByCategory[categoryValue];
          if (!categoryBadges || categoryBadges.length === 0) return null;

          return (
            <View key={categoryKey} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t(`achievementsGuide.categories.${categoryValue}`)}
              </Text>
              <Divider style={styles.divider} />
              {categoryBadges.map(badge => renderBadge(badge))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

// Theme-aware styles
const createThemedStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    itemCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
      padding: 16,
      marginBottom: 12,
    },
  });

const styles = StyleSheet.create({
  headerText: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  badgeHeader: {
    marginBottom: 12,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tierInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tierName: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tierCondition: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  tierPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
});

export default AchievementsGuideScreen;
