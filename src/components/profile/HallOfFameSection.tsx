/**
 * 🏛️ Hall of Fame Section
 * Iron Man's Grand Museum - Displays trophies, badges, and honor badges
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Text, Divider, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import TrophyDisplay from './TrophyDisplay';
import BadgeDisplay, { Badge } from './BadgeDisplay';
import { Trophy } from '../../types/user';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';

// 명예 태그 정의 (Honor Tags)
const HONOR_TAGS = [
  { id: 'sharp_eyed', ko: '#칼같은라인콜', en: '#SharpEyed' },
  { id: 'full_of_energy', ko: '#파이팅넘침', en: '#FullOfEnergy' },
  { id: 'mr_manner', ko: '#매너장인', en: '#MrManner' },
  { id: 'punctual_pro', ko: '#시간은금이다', en: '#PunctualPro' },
  { id: 'mental_fortress', ko: '#강철멘탈', en: '#MentalFortress' },
  { id: 'court_jester', ko: '#코트의코미디언', en: '#CourtJester' },
];

// 🏅 [FIX] Badge definitions for icon mapping (emoji → vector icon)
const BADGE_ICON_MAP: Record<
  string,
  { set: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5'; name: string; color: string }
> = {
  league_champion: {
    set: 'MaterialCommunityIcons',
    name: 'crown',
    color: '#FFD700',
  },
  tournament_champion: {
    set: 'MaterialCommunityIcons',
    name: 'trophy',
    color: '#FFD700',
  },
  first_victory: {
    set: 'MaterialCommunityIcons',
    name: 'trophy-variant',
    color: '#CD7F32',
  },
  social_player: {
    set: 'MaterialCommunityIcons',
    name: 'account-group',
    color: '#4CAF50',
  },
  winning_streak_3: {
    set: 'MaterialCommunityIcons',
    name: 'fire',
    color: '#FF5722',
  },
  winning_streak_5: {
    set: 'MaterialCommunityIcons',
    name: 'fire',
    color: '#FF9800',
  },
  winning_streak_10: {
    set: 'MaterialCommunityIcons',
    name: 'fire',
    color: '#FFD700',
  },
  match_milestone_10: {
    set: 'MaterialCommunityIcons',
    name: 'pickleball-ball',
    color: '#8BC34A',
  },
  match_milestone_50: {
    set: 'MaterialCommunityIcons',
    name: 'pickleball',
    color: '#4CAF50',
  },
  match_milestone_100: {
    set: 'MaterialCommunityIcons',
    name: 'medal',
    color: '#FFD700',
  },
};

// Default icon for unknown badges
const DEFAULT_BADGE_ICON = {
  set: 'MaterialCommunityIcons' as const,
  name: 'medal',
  color: '#9E9E9E',
};

interface HallOfFameSectionProps {
  userId: string;
  honorTags?: Record<string, number>;
  isLoadingHonorTags?: boolean;
}

const HallOfFameSection: React.FC<HallOfFameSectionProps> = ({
  userId,
  honorTags = {},
  isLoadingHonorTags = false,
}) => {
  // 🎨 [DARK GLASS] Theme setup
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const themedStyles = createThemedStyles(themeColors.colors as any);

  // 🌐 i18n
  const { t } = useLanguage();

  // Navigation
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);

      // Load trophies
      const trophiesRef = collection(db, `users/${userId}/trophies`);
      const trophiesSnap = await getDocs(trophiesRef);
      const trophiesData = trophiesSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Trophy[];

      // Sort by date (newest first)
      // 🏛️ PROJECT OLYMPUS: Defensive coding for Firestore Timestamp handling
      trophiesData.sort((a, b) => {
        // Handle both Timestamp and fallback to createdAt if awardedAt is missing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateA = (a.awardedAt as any)?.toMillis?.() || (a.createdAt as any)?.toMillis?.() || 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateB = (b.awardedAt as any)?.toMillis?.() || (b.createdAt as any)?.toMillis?.() || 0;
        return dateB - dateA;
      });

      setTrophies(trophiesData);

      // Load badges
      const badgesRef = collection(db, `users/${userId}/badges`);
      const badgesSnap = await getDocs(badgesRef);

      // 🏅 [FIX] Transform badge data to match BadgeDisplay interface
      // 🌐 [i18n] Use translation keys instead of Firestore name
      const badgesData = badgesSnap.docs.map(doc => {
        const data = doc.data();
        const badgeId = doc.id;

        // 🔧 [FIX] Strip tier suffix from badgeId for translation lookup
        // e.g., "first_victory_bronze" -> "first_victory", "lightning_host_silver" -> "lightning_host"
        const tierSuffixes = ['_bronze', '_silver', '_gold', '_platinum', '_diamond'];
        let baseBadgeId = badgeId;
        for (const suffix of tierSuffixes) {
          if (badgeId.endsWith(suffix)) {
            baseBadgeId = badgeId.slice(0, -suffix.length);
            break;
          }
        }

        // Get icon from mapping or use default (try both original and base ID)
        const iconDef =
          BADGE_ICON_MAP[badgeId] || BADGE_ICON_MAP[baseBadgeId] || DEFAULT_BADGE_ICON;

        // 🌐 [i18n] Get translated badge name from badgeGallery.badges (existing translations)
        // Fallback to hallOfFame.badges, then Firestore data or badgeId
        // Try base badge ID first (without tier suffix)
        const galleryName = t(`badgeGallery.badges.${baseBadgeId}.name`);
        const hallOfFameName = t(`hallOfFame.badges.${baseBadgeId}.name`);
        const galleryDesc = t(`badgeGallery.badges.${baseBadgeId}.description`);
        const hallOfFameDesc = t(`hallOfFame.badges.${baseBadgeId}.description`);

        // Check if translation key exists (not returning the key itself)
        const hasGalleryTranslation = !galleryName.includes('badgeGallery.badges.');
        const hasHallOfFameTranslation = !hallOfFameName.includes('hallOfFame.badges.');
        const hasGalleryDescTranslation = !galleryDesc.includes('badgeGallery.badges.');
        const hasHallOfFameDescTranslation = !hallOfFameDesc.includes('hallOfFame.badges.');

        // Priority: badgeGallery > hallOfFame > Firestore data
        const translatedName = hasGalleryTranslation
          ? galleryName
          : hasHallOfFameTranslation
            ? hallOfFameName
            : null;
        const translatedDescription = hasGalleryDescTranslation
          ? galleryDesc
          : hasHallOfFameDescTranslation
            ? hallOfFameDesc
            : null;
        const hasTranslation = translatedName !== null;
        const hasDescTranslation = translatedDescription !== null;

        // Format badge name with count if available (e.g., "Lightning Host (5)")
        let displayName = hasTranslation ? translatedName : data.name || data.nameKo || badgeId;
        if (data.count && data.count > 1) {
          displayName = `${displayName} (${data.count})`;
        }

        return {
          id: badgeId,
          type: data.category || 'achievement',
          name: displayName,
          description: hasDescTranslation
            ? translatedDescription
            : data.description || data.descriptionKo || '',
          icon: iconDef,
          awardedAt: data.unlockedAt || data.createdAt,
        } as Badge;
      });

      console.log(
        '🏅 [HallOfFameSection] Loaded badges:',
        badgesData.map(b => b.id)
      );
      setBadges(badgesData);
    } catch (error) {
      console.error(
        '🚨 [HallOfFameSection] Failed to load achievements for userId:',
        userId,
        error
      );
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  if (loading) {
    return (
      <Card style={themedStyles.card}>
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator size='large' />
          <Text style={styles.loadingText}>{t('hallOfFame.loading')}</Text>
        </Card.Content>
      </Card>
    );
  }

  const hasTrophies = trophies.length > 0;
  const hasBadges = badges.length > 0;
  const sortedHonorTags = Object.entries(honorTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const hasHonors = sortedHonorTags.length > 0;
  const hasAchievements = hasTrophies || hasBadges || hasHonors;

  if (!hasAchievements && !isLoadingHonorTags) {
    return (
      <Card style={themedStyles.card}>
        <Card.Title
          title={t('hallOfFame.title')}
          titleStyle={styles.title}
          subtitle={t('hallOfFame.subtitle')}
          right={props => (
            <IconButton
              {...props}
              icon='help-circle-outline'
              size={24}
              onPress={() => navigation.navigate('AchievementsGuide')}
            />
          )}
        />
        <Card.Content>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('hallOfFame.emptyState')}</Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  // Build subtitle with counts
  const subtitleParts = [];
  if (trophies.length > 0) {
    subtitleParts.push(t('hallOfFame.counts.trophies', { count: trophies.length }));
  }
  if (badges.length > 0) {
    subtitleParts.push(t('hallOfFame.counts.badges', { count: badges.length }));
  }
  if (hasHonors) {
    subtitleParts.push(t('hallOfFame.counts.honors', { count: sortedHonorTags.length }));
  }
  const subtitle = subtitleParts.join(' • ');

  return (
    <Card style={themedStyles.card}>
      <Card.Title
        title={t('hallOfFame.title')}
        titleStyle={styles.title}
        subtitle={subtitle}
        right={props => (
          <IconButton
            {...props}
            icon='help-circle-outline'
            size={24}
            onPress={() => navigation.navigate('AchievementsGuide')}
          />
        )}
      />
      <Card.Content>
        {/* Trophies Section */}
        {hasTrophies && (
          <View style={styles.section}>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              {t('hallOfFame.sections.trophies')}
            </Text>
            <Divider style={styles.divider} />
            {trophies.map(trophy => (
              <TrophyDisplay key={trophy.id} trophy={trophy} />
            ))}
          </View>
        )}

        {/* Badges Section */}
        {hasBadges && (
          <View style={styles.section}>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              {t('hallOfFame.sections.badges')}
            </Text>
            <Divider style={styles.divider} />
            <View style={styles.badgesContainer}>
              {badges.map(badge => (
                <BadgeDisplay key={badge.id} badge={badge} unlocked={true} />
              ))}
            </View>
          </View>
        )}

        {/* Honor Badges Section */}
        {isLoadingHonorTags ? (
          <View style={styles.section}>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              {t('hallOfFame.sections.honorBadges')}
            </Text>
            <Divider style={styles.divider} />
            <View style={styles.honorLoadingContainer}>
              <ActivityIndicator size='small' />
              <Text style={styles.loadingText}>{t('hallOfFame.honorBadges.loading')}</Text>
            </View>
          </View>
        ) : (
          hasHonors && (
            <View style={styles.section}>
              <Text variant='titleMedium' style={styles.sectionTitle}>
                {t('hallOfFame.sections.honorBadges')}
              </Text>
              <Divider style={styles.divider} />
              <View style={styles.honorBadgesList}>
                {sortedHonorTags.map(([tagId, count]) => {
                  const tag = HONOR_TAGS.find(t => t.id === tagId);
                  if (!tag) return null;

                  return (
                    <View key={tagId} style={styles.honorBadgeItem}>
                      <View style={styles.honorBadgeContent}>
                        <Text style={styles.honorBadgeTag}>
                          {t(`hallOfFame.honorTags.${tagId}`)}
                        </Text>
                        <Text style={styles.honorBadgeCount}>
                          {t('hallOfFame.honorBadges.receivedCount', { count })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )
        )}
      </Card.Content>
    </Card>
  );
};

// 🎨 [DARK GLASS] Theme-aware styles for card with glass border effect
// 🎯 [KIM FIX] marginHorizontal 제거 - 부모 container의 padding과 중복 방지
const createThemedStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    card: {
      marginBottom: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      // 🎯 [KIM FIX] Shadow 추가 - 다른 infoCard들과 동일한 스타일
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
  });

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  honorLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  honorBadgesList: {
    gap: 12,
  },
  honorBadgeItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  honorBadgeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  honorBadgeTag: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  honorBadgeCount: {
    fontSize: 13,
    color: '#666',
  },
});

export default HallOfFameSection;
