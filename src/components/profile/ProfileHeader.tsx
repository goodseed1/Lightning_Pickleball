/**
 * 📝 LPR (Lightning Pickleball Rating) System
 *
 * ⚡ LPR 1-10: Lightning Pickleball의 고유 레이팅 시스템
 *    - UI 표시: "LPR" (Lightning Pickleball Rating)
 *    - 7-Tier System: Bronze/Silver/Gold/Platinum/Diamond/Master/Legend
 */
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLocation } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { LocationProfile } from '../../types';
import { getLtrProfileDisplay } from '../../utils/eloUtils';
import { convertEloToLtr } from '../../constants/lpr';

interface RankingData {
  monthly: {
    currentRank: number;
    totalPlayers: number;
    rankingType: 'monthly' | 'season' | 'alltime';
  };
  season: {
    currentRank: number;
    totalPlayers: number;
    rankingType: 'monthly' | 'season' | 'alltime';
  };
  alltime: {
    currentRank: number;
    totalPlayers: number;
    rankingType: 'monthly' | 'season' | 'alltime';
  };
}

interface ProfileHeaderProps {
  rankingData?: RankingData;
  onEditProfile: () => void;
  onUpdateLocation: () => void;
  /** @deprecated Now using ELO-based calculation internally */
  getLtrLevelDescription?: (level: string | undefined) => string;
  isUpdatingLocation?: boolean;
  locationUpdateProgress?: string;
  cancelLocationUpdate?: () => void;
  // 🆕 [KIM] User gender for gender-specific ranking label
  userGender?: 'male' | 'female';
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  rankingData,
  onEditProfile,
  onUpdateLocation,
  isUpdatingLocation = false,
  locationUpdateProgress = '',
  cancelLocationUpdate,
  userGender,
}) => {
  // 🎯 DIRECT CONNECTION: Get data directly from AuthContext
  const { currentUser } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { location: deviceLocation } = useLocation();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors);

  // No more prop-based state - always use latest data from AuthContext
  // Early return if no user data - should never happen since this component only renders when authenticated
  if (!currentUser) {
    return null;
  }

  const profileData = currentUser;

  // 🍽️ SIMPLE PRESENTATION FUNCTION - No complex parsing, just formatted display
  const formatLocationDisplay = (
    location:
      | LocationProfile
      | {
          lat?: number;
          lng?: number;
          latitude?: number;
          longitude?: number;
          address?: string;
          city?: string;
          region?: string;
          country?: string;
        }
      | null
  ): string => {
    if (!location) return t('profileHeader.noLocation');

    // Priority: city + state → full address → fallback
    const city = 'city' in location ? location.city : undefined;
    const state = 'state' in location ? location.state : undefined;
    // 🎯 [KIM FIX] Avoid duplicate city/state (e.g., "Madrid, Madrid")
    const parts = city && state && city !== state ? [city, state] : [city || state];
    const filtered = parts.filter(Boolean);
    if (filtered.length > 0) {
      console.log('🍽️ [ProfileHeader] Using formatted city + state:', filtered.join(', '));
      return filtered.join(', '); // e.g., "Duluth, GA" or "Madrid"
    }

    // 🎯 [KIM FIX] Privacy: Never expose street address - show nothing instead
    // Removed address fallback to protect user privacy
    return t('profileHeader.noLocation');
  };

  return (
    <>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {/* Profile Image with Edit Overlay */}
        <TouchableOpacity style={styles.profileImageContainer} onPress={onEditProfile}>
          {profileData.photoURL ? (
            <Image source={{ uri: profileData.photoURL }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name='person' size={35} color={themeColors.colors.onSurfaceVariant} />
            </View>
          )}
          {/* Edit Icon Overlay */}
          <View style={styles.editIconOverlay}>
            <Ionicons name='pencil' size={12} color='#FFFFFF' />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          {/* Name + Gender Icon + Skill Level Badge */}
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>
              {profileData.displayName || profileData.nickname}
            </Text>
            {/* 🎯 [KIM FIX] Show gender icon only for male/female - use profile.gender */}
            {(profileData?.profile?.gender === 'male' ||
              profileData?.profile?.gender === '남성' ||
              profileData?.profile?.gender === 'female' ||
              profileData?.profile?.gender === '여성') && (
              <Text
                style={{
                  marginLeft: 6,
                  fontSize: 16,
                  color:
                    profileData?.profile?.gender === 'male' ||
                    profileData?.profile?.gender === '남성'
                      ? '#4A90D9'
                      : '#E91E8C',
                }}
              >
                {profileData?.profile?.gender === 'male' || profileData?.profile?.gender === '남성'
                  ? '♂'
                  : '♀'}
              </Text>
            )}
            {(() => {
              // ⚡ [KIM FIX v25] LPR: Calculate LPR from highest ELO - use eloRatings only (Single Source of Truth)
              const singlesElo = profileData?.eloRatings?.singles?.current || null;
              const doublesElo = profileData?.eloRatings?.doubles?.current || null;
              const mixedElo = profileData?.eloRatings?.mixed?.current || null;

              const eloValues = [singlesElo, doublesElo, mixedElo].filter(
                (elo): elo is number => elo !== null && elo !== undefined
              );

              // If no ELO data, show N/A badge
              if (eloValues.length === 0) {
                return (
                  <View style={styles.skillBadge}>
                    <Text style={styles.skillBadgeText}>{t('profileHeader.notAvailable')}</Text>
                  </View>
                );
              }

              const highestElo = Math.max(...eloValues);
              const ltrInfo = getLtrProfileDisplay(highestElo, currentLanguage as 'ko' | 'en');

              console.log('⚡ [ProfileHeader DEBUG] LPR badge calculation:', {
                highestElo,
                ltr: ltrInfo.level,
                tier: ltrInfo.tier,
                theme: ltrInfo.theme,
              });

              return (
                <View style={[styles.skillBadge, { backgroundColor: ltrInfo.color }]}>
                  <Text style={styles.skillBadgeText}>LPR {ltrInfo.level}</Text>
                </View>
              );
            })()}
          </View>

          {/* Email */}
          <Text style={styles.profileEmail}>{profileData.email}</Text>

          {/* 🎯 [KIM FIX] All-time Rank Only - ELO is already shown in the right grid */}
          {/* 🆕 [KIM] Gender-specific ranking label */}
          {rankingData && rankingData.alltime && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>
                  {userGender === 'male'
                    ? t('profileHeader.allTimeRankMale')
                    : userGender === 'female'
                      ? t('profileHeader.allTimeRankFemale')
                      : t('profileHeader.allTimeRank')}
                </Text>
                <Text style={styles.statLabel}>
                  <Text style={styles.statValue}>#{rankingData.alltime.currentRank}</Text> /{' '}
                  {rankingData.alltime.totalPlayers}
                </Text>
              </View>
            </View>
          )}

          {/* Playing Style + Location Row */}
          <View style={styles.infoRow}>
            {profileData.playingStyle && (
              <Text style={styles.profilePlayStyle}>
                {(() => {
                  const translatedStyle = t(
                    `profileData.playingStyles.${profileData.playingStyle}`
                  );
                  // 🎯 [KIM FIX] If translation returns the key itself, use original value
                  return translatedStyle.includes('profileData.')
                    ? profileData.playingStyle
                    : translatedStyle;
                })()}
              </Text>
            )}
            <TouchableOpacity
              style={[
                styles.profileLocationContainer,
                isUpdatingLocation && styles.profileLocationUpdating,
              ]}
              onPress={isUpdatingLocation ? undefined : onUpdateLocation}
              disabled={isUpdatingLocation}
            >
              <Text style={styles.profileLocation}>
                📍{' '}
                {isUpdatingLocation
                  ? locationUpdateProgress || t('profileHeader.updatingLocation')
                  : (() => {
                      const profileLocation = profileData?.profile?.location;
                      const finalLocation = profileLocation || deviceLocation;
                      return formatLocationDisplay(finalLocation);
                    })()}
              </Text>
              {isUpdatingLocation ? (
                <View style={styles.locationLoadingContainer}>
                  <ActivityIndicator
                    size='small'
                    color={themeColors.colors.primary}
                    style={{ marginLeft: 8 }}
                  />
                  {cancelLocationUpdate && (
                    <TouchableOpacity onPress={cancelLocationUpdate} style={styles.cancelButton}>
                      <Ionicons
                        name='close-outline'
                        size={16}
                        color={themeColors.colors.error}
                        style={{ marginLeft: 8 }}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Ionicons
                  name='refresh-outline'
                  size={16}
                  color={themeColors.colors.primary}
                  style={{ marginLeft: 8 }}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Languages */}
          {profileData.languages && profileData.languages.length > 0 && (
            <Text style={styles.profileLanguages}>
              💬{' '}
              {profileData.languages
                .map(lang => {
                  const translatedLang = t(`profileData.languages.${lang}`);
                  // 🎯 [KIM FIX] If translation returns the key itself, use original value
                  return translatedLang.includes('profileData.') ? lang : translatedLang;
                })
                .join(', ')}
            </Text>
          )}

          {/* 🎯 [KIM FIX] Join Date - Show when user joined the app */}
          {profileData.createdAt && (
            <Text style={styles.profileJoinDate}>
              📅{' '}
              {t('profileHeader.joinedDate', {
                date: (() => {
                  const date =
                    typeof profileData.createdAt === 'string'
                      ? new Date(profileData.createdAt)
                      : profileData.createdAt?.toDate
                        ? profileData.createdAt.toDate()
                        : new Date(profileData.createdAt);
                  return date.toLocaleDateString(t('common.locale'), {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                })(),
              })}
            </Text>
          )}
        </View>

        {/* ⚡ LPR Grid for All 3 Game Types */}
        {/* 🎯 [KIM FIX v25] Use eloRatings only (Single Source of Truth) */}
        <View style={styles.ltrGridContainer}>
          {(() => {
            const singlesElo = profileData?.eloRatings?.singles?.current || 1200;
            const doublesElo = profileData?.eloRatings?.doubles?.current || 1200;
            const mixedElo = profileData?.eloRatings?.mixed?.current || 1200;

            const gameTypes = [
              {
                emoji: '🎾',
                label: t('profileHeader.singles'),
                elo: singlesElo,
                ltr: convertEloToLtr(singlesElo),
              },
              {
                emoji: '👥',
                label: t('profileHeader.doubles'),
                elo: doublesElo,
                ltr: convertEloToLtr(doublesElo),
              },
              {
                emoji: '👫',
                label: t('profileHeader.mixed'),
                elo: mixedElo,
                ltr: convertEloToLtr(mixedElo),
              },
            ];

            return gameTypes.map((type, index) => (
              <View key={index} style={styles.ltrGridItem}>
                <Text style={styles.ltrGridLabel}>
                  {type.emoji} {type.label}
                </Text>
                <Text style={styles.ltrGridValue}>LPR {type.ltr}</Text>
                <Text style={styles.ltrGridElo}>ELO {type.elo}</Text>
              </View>
            ));
          })()}
        </View>
      </View>
    </>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const createStyles = (colors: any) =>
  StyleSheet.create({
    /* eslint-enable @typescript-eslint/no-explicit-any */
    // 🎨 [DARK GLASS] Profile header card with glass border effect
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    profileImageContainer: {
      marginRight: 12,
      position: 'relative',
    },
    profileImage: {
      width: 70,
      height: 70,
      borderRadius: 35,
    },
    profileImagePlaceholder: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editIconOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    profileInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      flexWrap: 'wrap',
    },
    profileName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginRight: 8,
    },
    skillBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    skillBadgeText: {
      fontSize: 12,
      color: '#000000', // 🎯 [KIM FIX] Changed from white to black for better visibility
      fontWeight: '600',
    },
    profileEmail: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginRight: 4,
    },
    statValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 12,
    },
    profilePlayStyle: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    profileLocationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    profileLocationUpdating: {
      opacity: 0.7,
    },
    profileLocation: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    locationLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cancelButton: {
      padding: 4,
    },
    profileLanguages: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    profileJoinDate: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    // ⚡ LPR Grid styles for 3 game types
    ltrGridContainer: {
      flexDirection: 'column',
      backgroundColor: colors.primaryContainer,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 6,
      marginLeft: 8,
      gap: 4,
    },
    ltrGridItem: {
      alignItems: 'center',
      paddingVertical: 4,
    },
    ltrGridLabel: {
      fontSize: 9,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
      marginBottom: 2,
    },
    ltrGridValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    ltrGridElo: {
      fontSize: 9,
      color: colors.onSurfaceVariant,
    },
  });

export default ProfileHeader;
