import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import userService from '../../services/userService';
// 🎥 CCTV: Enhanced logging for refresh behavior tracking
import { cctvLog, CCTV_PHASES } from '../../utils/cctvLogger';
import { useLanguage } from '../../contexts/LanguageContext';

// 🏆 Badge metadata (icon and tier only - names/descriptions from i18n)
const BADGE_METADATA: Record<string, { icon: string; tier: string }> = {
  first_victory: { icon: '🏆', tier: 'bronze' },
  social_player: { icon: '🤝', tier: 'bronze' },
  league_champion: { icon: '👑', tier: 'gold' },
  tournament_champion: { icon: '👑', tier: 'gold' },
  winning_streak_3: { icon: '🔥', tier: 'bronze' },
  winning_streak_5: { icon: '🔥', tier: 'silver' },
  winning_streak_10: { icon: '🔥', tier: 'gold' },
  match_milestone_10: { icon: '🎾', tier: 'bronze' },
  match_milestone_50: { icon: '🎾', tier: 'silver' },
  match_milestone_100: { icon: '🎾', tier: 'gold' },
};

export const useBadgesAndTags = (userId: string | undefined) => {
  const { t } = useLanguage();

  // Badge loading state - managed at screen level for focus-based triggers
  const [badges, setBadges] = useState<
    Array<{
      id: string;
      name: { ko: string; en: string };
      description: { ko: string; en: string };
      icon: string;
      tier: string;
      earnedAt: Date;
    }>
  >([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);

  // Sportsmanship tags state
  const [sportsmanshipTags, setSportsmanshipTags] = useState<Record<string, number>>({});
  const [isLoadingSportsmanshipTags, setIsLoadingSportsmanshipTags] = useState(true);

  // Badge loading managed at screen level with focus-based triggers
  useFocusEffect(
    useCallback(() => {
      const fetchBadges = async () => {
        // 🎥 CCTV: Badge refresh start
        cctvLog('useBadgesAndTags', CCTV_PHASES.DATA_REFRESH, 'Starting badge refresh', {
          userId: userId,
        });

        setIsLoadingBadges(true);

        try {
          if (!userId) {
            cctvLog(
              'useBadgesAndTags',
              'NO_USER_FOR_BADGES',
              'No user profile found for badge loading'
            );
            setBadges([]);
            return;
          }

          // 🏆 [FIX] Fetch REAL badges from Firestore (users/{userId}/badges collection)
          const badgesRef = collection(db, 'users', userId, 'badges');
          const q = query(badgesRef, orderBy('unlockedAt', 'desc'));
          const querySnapshot = await getDocs(q);

          const realBadges: Array<{
            id: string;
            name: { ko: string; en: string };
            description: { ko: string; en: string };
            icon: string;
            tier: string;
            earnedAt: Date;
          }> = [];

          querySnapshot.forEach(doc => {
            const badgeData = doc.data();
            const badgeId = doc.id;

            // Get badge metadata or use Firestore data as fallback
            const metadata = BADGE_METADATA[badgeId];

            // Convert Firestore timestamp to Date
            const unlockedAt = badgeData.unlockedAt?.toDate?.() || new Date();

            if (metadata) {
              // Use i18n translations for name and description
              realBadges.push({
                id: badgeId,
                name: {
                  ko: t(`badgeGallery.badges.${badgeId}.name`),
                  en: t(`badgeGallery.badges.${badgeId}.name`),
                },
                description: {
                  ko: t(`badgeGallery.badges.${badgeId}.description`),
                  en: t(`badgeGallery.badges.${badgeId}.description`),
                },
                icon: metadata.icon,
                tier: badgeData.tier || metadata.tier,
                earnedAt: unlockedAt,
              });
            } else {
              // Fallback: use Firestore data directly or i18n unknown badge
              realBadges.push({
                id: badgeId,
                name: {
                  ko: badgeData.nameKo || t('badgeGallery.badges.unknown.name'),
                  en: badgeData.name || t('badgeGallery.badges.unknown.name'),
                },
                description: {
                  ko: badgeData.descriptionKo || t('badgeGallery.badges.unknown.description'),
                  en: badgeData.description || t('badgeGallery.badges.unknown.description'),
                },
                icon: badgeData.icon || '🏅',
                tier: badgeData.tier || 'bronze',
                earnedAt: unlockedAt,
              });
            }
          });

          // 🎥 CCTV: Badge data loaded
          cctvLog('useBadgesAndTags', 'BADGES_LOADED', 'Real badges loaded from Firestore', {
            badgeCount: realBadges.length,
            badgeIds: realBadges.map(b => b.id),
          });

          setBadges(realBadges);
        } catch (error) {
          // 🎥 CCTV: Badge loading error
          cctvLog('useBadgesAndTags', CCTV_PHASES.ERROR, 'Badge loading failed', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });

          console.error('Badge loading failed:', error);
          setBadges([]); // Set empty array on error
        } finally {
          setIsLoadingBadges(false);
          cctvLog('useBadgesAndTags', 'BADGE_REFRESH_COMPLETE', 'Badge refresh completed', {
            finalBadgeCount: badges.length,
          });
        }
      };

      const fetchSportsmanshipTags = async () => {
        setIsLoadingSportsmanshipTags(true);
        try {
          if (!userId) {
            setSportsmanshipTags({});
            return;
          }

          const userProfileData = await userService.getUserProfile(userId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tags = (userProfileData as any)?.sportsmanshipTags || {};
          setSportsmanshipTags(tags);

          console.log('🏆 Loaded sportsmanship tags:', tags);
        } catch (error) {
          console.error('Failed to load sportsmanship tags:', error);
          setSportsmanshipTags({});
        } finally {
          setIsLoadingSportsmanshipTags(false);
        }
      };

      if (userId) {
        fetchBadges();
        fetchSportsmanshipTags();
      } else {
        setIsLoadingBadges(false);
        setBadges([]);
        setIsLoadingSportsmanshipTags(false);
        setSportsmanshipTags({});
      }

      // Cleanup function - called when screen loses focus
      return () => {
        // No cleanup needed for badge loading
      };
    }, [userId, badges.length, t]) // Re-run when dependencies change
  );

  return { badges, isLoadingBadges, sportsmanshipTags, isLoadingSportsmanshipTags };
};
