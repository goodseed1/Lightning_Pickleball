/**
 * UserProfileScreen - Display another user's profile information
 * 다른 사용자의 프로필을 보여주는 화면
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Avatar, Button, Chip } from 'react-native-paper';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import userService from '../services/userService';
import rankingService from '../services/rankingService';
import clubService from '../services/clubService';
import friendshipService from '../services/friendshipService';
import RankingsCard, { GlobalRankingData } from '../components/stats/RankingsCard';
import { convertEloToLtr } from '../utils/lprUtils';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import HallOfFameSection from '../components/profile/HallOfFameSection';

// Types

// 🎯 [KIM FIX] Type for raw Firestore data from userService.getUserProfile
interface FirestoreUserData {
  uid?: string;
  displayName?: string;
  nickname?: string;
  email?: string;
  photoURL?: string;
  ltrLevel?: string | number;
  gender?: string;
  zipCode?: string;
  preferredLanguage?: string;
  languages?: string[];
  playingStyle?: string;
  bio?: string;
  createdAt?: Date;
  profile?: {
    nickname?: string;
    skillLevel?: string;
    ltrLevel?: string | number;
    gender?: string;
    location?: {
      address?: string;
      name?: string;
      city?: string;
      state?: string;
      region?: string;
      district?: string;
      lat?: number;
      lng?: number;
    };
    zipCode?: string;
    preferredLanguage?: string;
    languages?: string[];
    playingStyle?: string;
    bio?: string;
    photoURL?: string; // 🎯 [KIM FIX] Profile photo URL
    availabilityPreference?: 'weekdays' | 'weekends';
    preferredTimesWeekdays?: string[];
    preferredTimesWeekends?: string[];
  };
  location?:
    | {
        address?: string;
        name?: string;
        city?: string;
        state?: string;
        region?: string;
        district?: string;
        lat?: number;
        lng?: number;
      }
    | string;
  availabilityPreference?: 'weekdays' | 'weekends';
  preferredTimesWeekdays?: string[];
  preferredTimesWeekends?: string[];
  preferences?: {
    availabilityPreference?: 'weekdays' | 'weekends';
    preferredTimesWeekdays?: string[];
    preferredTimesWeekends?: string[];
    playingStyle?: string;
    [key: string]: unknown;
  };
  stats?: {
    wins?: number;
    losses?: number;
    eloPoints?: number;
    eloRating?: number;
    totalMatches?: number;
    matchesPlayed?: number;
    winRate?: number;
    currentStreak?: number;
    publicStats?: {
      singles?: { matchesPlayed: number; wins: number; losses: number; elo: number };
      doubles?: { matchesPlayed: number; wins: number; losses: number; elo: number };
      mixed_doubles?: { matchesPlayed: number; wins: number; losses: number; elo: number };
    };
    [key: string]: unknown;
  };
  achievements?: {
    badges?: Array<{
      id: string;
      name: string;
      description: string;
      unlockedAt: Date;
    }>;
  };
  [key: string]: unknown;
}

interface UserProfile {
  uid: string;
  photoURL?: string; // 🎯 [KIM FIX] Add photoURL for profile image display
  profile: {
    nickname: string;
    skillLevel: string;
    gender: string;
    location?:
      | {
          address?: string;
          name?: string;
          city?: string;
          state?: string;
          region?: string;
          district?: string;
          lat?: number;
          lng?: number;
        }
      | string
      | null;
    zipCode: string;
    preferredLanguage: string;
    languages: string[];
    playingStyle?: string;
    bio?: string;
    joinedAt?: Date;
  };
  preferences?: {
    availabilityPreference?: 'weekdays' | 'weekends';
    preferredTimesWeekdays?: string[];
    preferredTimesWeekends?: string[];
  };
  stats?: {
    wins: number;
    losses: number;
    eloPoints: number;
    eloRating: number;
    totalMatches: number;
    matchesPlayed: number;
    winRate: number;
    currentStreak?: number;
    // 🆕 [KIM] Per-matchType stats with ELO
    publicStats?: {
      singles?: { matchesPlayed: number; wins: number; losses: number; elo: number };
      doubles?: { matchesPlayed: number; wins: number; losses: number; elo: number };
      mixed_doubles?: { matchesPlayed: number; wins: number; losses: number; elo: number };
    } | null;
  };
  matchHistory?: Array<{
    id: string;
    title: string;
    opponent: string;
    result: 'win' | 'loss';
    score: string;
    eloChange: number;
    completedAt: Date;
    location: string;
  }>;
  achievements?: {
    badges: Array<{
      id: string;
      name: string;
      description: string;
      unlockedAt: Date;
    }>;
  };
}

type RootStackParamList = {
  UserProfile: {
    userId: string;
    nickname?: string;
  };
  DirectChatRoom: {
    conversationId: string;
    otherUserId: string;
    otherUserName: string;
    otherUserPhotoURL?: string;
  };
};

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const UserProfileScreen: React.FC = () => {
  // 🎨 [DARK GLASS] Theme setup
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors, currentTheme);

  const route = useRoute<UserProfileScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();

  const { userId, nickname } = route.params;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 🎯 [KIM FIX] 친구 상태 확인 - 'accepted' | 'pending' | null
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);

  // 🆕 [KIM] Extract target user's gender for gender-specific rankings
  const targetUserGender = React.useMemo(() => {
    const gender = userProfile?.profile?.gender;
    if (gender === 'male' || gender === '남성') return 'male';
    if (gender === 'female' || gender === '여성') return 'female';
    return undefined;
  }, [userProfile?.profile?.gender]);

  // 🆕 [KIM] Rankings state for RankingsCard
  const [rankings, setRankings] = useState<GlobalRankingData>({
    monthly: { currentRank: null, totalPlayers: 0 },
    season: { currentRank: null, totalPlayers: 0 },
    alltime: { currentRank: null, totalPlayers: 0 },
  });
  const [isLoadingRankings, setIsLoadingRankings] = useState(true);

  // Time slot translation mapping
  const getTimeSlotLabel = (timeCode: string): string => {
    const timeMap: { [key: string]: string } = {
      // Weekday times
      early_morning_wd: 'earlyMorning',
      morning_wd: 'morning',
      afternoon_wd: 'afternoon',
      evening_wd: 'evening',
      night_wd: 'night',
      // Weekend times
      early_morning_we: 'earlyMorning',
      brunch_we: 'brunch',
      afternoon_we: 'afternoon',
      evening_we: 'evening',
      night_we: 'night',
    };
    const translationKey = timeMap[timeCode];
    return translationKey ? t(`profile.userProfile.timeSlots.${translationKey}`) : timeCode;
  };

  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use userService to get comprehensive profile data
      // 🎯 [KIM FIX] 친구 상태도 함께 확인
      const [profileData, matchHistory, friendStatus] = await Promise.all([
        userService.getUserProfile(userId) as Promise<FirestoreUserData | null>,
        userService.getUserMatchHistory(userId, 10),
        currentUser?.uid
          ? friendshipService.getFriendshipStatus(currentUser.uid, userId)
          : Promise.resolve(null),
      ]);

      // 🎯 [KIM FIX] 친구 상태 저장
      setFriendshipStatus(friendStatus);

      // 🛡️ [KIM FIX] Handle null profileData (user not found)
      if (!profileData) {
        setError(t('profile.userProfile.notFound'));
        return;
      }

      // 🔍 [KIM DEBUG] playingStyle 데이터 확인
      console.log('🔍 [UserProfileScreen] profileData playingStyle locations:', {
        'profile.playingStyle': profileData.profile?.playingStyle,
        playingStyle: profileData.playingStyle,
        'preferences.playingStyle': profileData.preferences?.playingStyle,
      });

      // 🔍 [DEBUG] Log photoURL locations to identify where it's stored
      console.log('📸 [UserProfileScreen] photoURL locations:', {
        userId,
        'root.photoURL': profileData.photoURL,
        'profile.photoURL': profileData.profile?.photoURL,
        'profile.avatar': (profileData.profile as Record<string, unknown>)?.avatar,
        'root.avatar': (profileData as Record<string, unknown>).avatar,
        'root.profileImage': (profileData as Record<string, unknown>).profileImage,
      });

      const profile: UserProfile = {
        uid: userId,
        // 🎯 [KIM FIX] Check all possible photoURL field locations (profile first, then root)
        photoURL:
          profileData.profile?.photoURL ||
          profileData.photoURL ||
          ((profileData as Record<string, unknown>).avatar as string) ||
          ((profileData as Record<string, unknown>).profileImage as string),
        profile: {
          nickname:
            profileData.profile?.displayName ||
            profileData.displayName ||
            nickname ||
            t('profile.userProfile.defaultNickname'),
          skillLevel: profileData.profile?.skillLevel
            ? `LPR ${profileData.profile.skillLevel}`
            : profileData.ltrLevel
              ? `LPR ${profileData.ltrLevel}`
              : 'Beginner',
          gender: profileData.profile?.gender || profileData.gender || 'Other',
          // 🎯 [KIM FIX] location은 profile.location 또는 root level에 있을 수 있음
          location: profileData.profile?.location || profileData.location || null,
          zipCode: profileData.profile?.zipCode || profileData.zipCode || '',
          preferredLanguage:
            profileData.profile?.preferredLanguage || profileData.preferredLanguage || 'ko',
          languages: profileData.profile?.languages || profileData.languages || [],
          // 🎯 [KIM FIX] playingStyle은 profile 내부 또는 루트 레벨에 저장될 수 있음
          playingStyle:
            profileData.profile?.playingStyle ||
            profileData.playingStyle ||
            profileData.preferences?.playingStyle ||
            '',
          bio: profileData.profile?.bio || profileData.bio || '',
          joinedAt: profileData.createdAt || new Date(),
        },
        preferences: {
          // Check both nested and root level for availability data
          availabilityPreference:
            profileData.profile?.availabilityPreference ||
            profileData.availabilityPreference ||
            profileData.preferences?.availabilityPreference ||
            undefined,
          preferredTimesWeekdays:
            profileData.profile?.preferredTimesWeekdays ||
            profileData.preferredTimesWeekdays ||
            profileData.preferences?.preferredTimesWeekdays ||
            [],
          preferredTimesWeekends:
            profileData.profile?.preferredTimesWeekends ||
            profileData.preferredTimesWeekends ||
            profileData.preferences?.preferredTimesWeekends ||
            [],
          ...profileData.preferences,
        },
        stats: (() => {
          const wins = profileData.stats?.wins || 0;
          const losses = profileData.stats?.losses || 0;
          const eloRating = profileData.stats?.eloRating || profileData.stats?.eloPoints || 1200;
          const totalMatches =
            profileData.stats?.totalMatches || profileData.stats?.matchesPlayed || 0;
          const winRate =
            profileData.stats?.winRate || (totalMatches > 0 ? (wins / totalMatches) * 100 : 0);
          const currentStreak = profileData.stats?.currentStreak || 0;

          const userStats = {
            wins,
            losses,
            eloPoints: eloRating,
            eloRating,
            totalMatches,
            matchesPlayed: totalMatches,
            winRate,
            currentStreak,
            // 🆕 [KIM] Include publicStats for per-matchType ELO display
            publicStats: profileData.stats?.publicStats || null,
          };

          // 💥 CCTV #2: PublicProfile 데이터 소스 추적 💥
          console.log('🔍 === PUBLIC PROFILE STATS PIPELINE ===');
          console.log('📊 Source: userService.getUserProfile (REAL FIRESTORE DATA)');
          console.log('📊 Stats Data:', JSON.stringify(userStats, null, 2));
          console.log('📊 User ID:', userId);
          console.log('📊 Profile Data Keys:', Object.keys(profileData));
          console.log('📊 publicStats:', JSON.stringify(userStats.publicStats, null, 2));
          console.log('🔍 =======================================');

          return userStats;
        })(),
        matchHistory: matchHistory || [],
        achievements: {
          badges: profileData.achievements?.badges || [],
        },
        // 🎾 [ELO-BASED LPR] Include eloRatings for consistent LPR display
        eloRatings: profileData.eloRatings,
      };

      // 🔄 MIGRATION: Add default availability data for existing users who don't have it
      if (
        !profile.preferences?.preferredTimesWeekdays?.length &&
        !profile.preferences?.preferredTimesWeekends?.length
      ) {
        console.log('🔄 MIGRATION: User missing availability data, adding defaults...');

        // Add default availability preferences for existing users (both weekdays and weekends)
        const defaultAvailability = {
          availabilityPreference: 'weekends' as const, // Keep for backward compatibility
          preferredTimesWeekdays: ['evening_wd'], // Default weekday preference
          preferredTimesWeekends: ['afternoon_we', 'evening_we'], // Default weekend preferences
        };

        profile.preferences = {
          ...profile.preferences,
          ...defaultAvailability,
        };

        console.log('🔄 MIGRATION: Added dual availability defaults:', defaultAvailability);

        // Note: For now, just applying defaults to display.
        // Future enhancement: Save to Firebase for persistence
        console.log('🔄 MIGRATION: Dual availability defaults applied for display only');
      }

      setUserProfile(profile);

      // 🔍 BLACK BOX LOGGER - Complete profile data structure
      console.log('--- 👤 USER PROFILE DATA RECEIVED ---');
      console.log('Raw profileData from Firebase:', JSON.stringify(profileData, null, 2));
      console.log('Availability data check:');
      console.log(
        '  - profile.availabilityPreference:',
        profileData.profile?.availabilityPreference
      );
      console.log('  - root availabilityPreference:', profileData.availabilityPreference);
      console.log(
        '  - profile.preferredTimesWeekdays:',
        profileData.profile?.preferredTimesWeekdays
      );
      console.log(
        '  - profile.preferredTimesWeekends:',
        profileData.profile?.preferredTimesWeekends
      );
      console.log('Constructed profile object:', JSON.stringify(profile, null, 2));
      console.log('✅ User profile loaded successfully with updated stats');
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      setError(error instanceof Error ? error.message : t('profile.userProfile.loadError'));
    } finally {
      setLoading(false);
    }
  }, [userId, nickname]);

  useEffect(() => {
    loadUserProfile();
  }, [userId, loadUserProfile]);

  // 🆕 [KIM] Rankings loading function with gender filter
  const fetchRankings = useCallback(async () => {
    setIsLoadingRankings(true);
    try {
      if (!userId) {
        setRankings({
          monthly: { currentRank: null, totalPlayers: 0 },
          season: { currentRank: null, totalPlayers: 0 },
          alltime: { currentRank: null, totalPlayers: 0 },
        });
        return;
      }

      // 🆕 [KIM] Fetch rankings using win rate with gender filter
      const [monthlyRanking, seasonRanking, alltimeRanking] = await Promise.all([
        rankingService.getPublicRankingByWinRate(userId, 'monthly', targetUserGender),
        rankingService.getPublicRankingByWinRate(userId, 'season', targetUserGender),
        rankingService.getPublicRankingByWinRate(userId, 'alltime', targetUserGender),
      ]);

      // 🎯 [KIM FIX] Include ELO from ranking service to display correct average ELO
      setRankings({
        monthly: {
          currentRank: monthlyRanking?.currentRank || null,
          totalPlayers: monthlyRanking?.totalPlayers || 0,
          elo: monthlyRanking?.elo || 1200,
        },
        season: {
          currentRank: seasonRanking?.currentRank || null,
          totalPlayers: seasonRanking?.totalPlayers || 0,
          elo: seasonRanking?.elo || 1200,
        },
        alltime: {
          currentRank: alltimeRanking?.currentRank || null,
          totalPlayers: alltimeRanking?.totalPlayers || 0,
          elo: alltimeRanking?.elo || 1200,
        },
      });

      console.log('🏆 [UserProfileScreen] Rankings loaded:', {
        gender: targetUserGender,
        monthly: monthlyRanking,
        season: seasonRanking,
        alltime: alltimeRanking,
      });
    } catch (error) {
      console.error('Rankings loading failed for user:', userId, error);
      setRankings({
        monthly: { currentRank: null, totalPlayers: 0 },
        season: { currentRank: null, totalPlayers: 0 },
        alltime: { currentRank: null, totalPlayers: 0 },
      });
    } finally {
      setIsLoadingRankings(false);
    }
  }, [userId, targetUserGender]);

  // Load rankings when userId changes
  useEffect(() => {
    if (userId) {
      fetchRankings();
    } else {
      setIsLoadingRankings(false);
    }
  }, [userId, fetchRankings]);

  const handleSendFriendRequest = () => {
    Alert.alert(
      t('profile.userProfile.friendRequest.title'),
      t('profile.userProfile.friendRequest.message', { nickname: userProfile?.profile.nickname }),
      [
        { text: t('profile.userProfile.friendRequest.cancel'), style: 'cancel' },
        {
          text: t('profile.userProfile.friendRequest.send'),
          onPress: async () => {
            try {
              const result = await friendshipService.sendFriendRequest(userId);
              if (result.success) {
                if (result.autoAccepted) {
                  // 🎉 자동 수락됨 - 상대방이 이미 친구 요청을 보낸 상태였음
                  setFriendshipStatus('accepted'); // 🔄 [KIM FIX] 상태 업데이트 - 친구로 변경
                  Alert.alert(
                    t('profile.userProfile.friendRequest.autoAccepted'),
                    t('profile.userProfile.friendRequest.autoAcceptedMessage')
                  );
                } else {
                  setFriendshipStatus('pending'); // 🔄 [KIM FIX] 상태 업데이트 - 요청 대기중
                  Alert.alert(
                    t('profile.userProfile.friendRequest.success'),
                    t('profile.userProfile.friendRequest.successMessage')
                  );
                }
              } else {
                Alert.alert(
                  t('profile.userProfile.friendRequest.notification'),
                  result.message || t('profile.userProfile.friendRequest.cannotSend')
                );
              }
            } catch (error) {
              console.error('Friend request error:', error);
              Alert.alert(
                t('profile.userProfile.friendRequest.error'),
                t('profile.userProfile.friendRequest.errorMessage')
              );
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = () => {
    if (!currentUser?.uid || !userProfile) {
      Alert.alert(
        t('profile.userProfile.sendMessage.error'),
        t('profile.userProfile.sendMessage.loginRequired')
      );
      return;
    }

    // 🎯 [KIM FIX] Generate conversationId and navigate to DirectChatRoom
    const conversationId = clubService.getConversationId(currentUser.uid, userProfile.uid);

    navigation.navigate('DirectChatRoom', {
      conversationId,
      otherUserId: userProfile.uid,
      otherUserName: userProfile.profile.nickname,
      otherUserPhotoURL: userProfile.photoURL || '', // 🎯 [KIM FIX] Pass photoURL to chat room
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.loadingContainer, { backgroundColor: themeColors.colors.background }]}
        edges={['bottom', 'left', 'right']}
      >
        <ActivityIndicator size='large' color={themeColors.colors.primary} />
        <Text style={styles.loadingText}>{t('profile.userProfile.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.errorContainer, { backgroundColor: themeColors.colors.background }]}
        edges={['bottom', 'left', 'right']}
      >
        <Text style={styles.errorText}>{error}</Text>
        <Button mode='contained' onPress={() => navigation.goBack()} style={styles.backButton}>
          {t('profile.userProfile.backButton')}
        </Button>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView
        style={[styles.errorContainer, { backgroundColor: themeColors.colors.background }]}
        edges={['bottom', 'left', 'right']}
      >
        <Text style={styles.errorText}>{t('profile.userProfile.notFound')}</Text>
        <Button mode='contained' onPress={() => navigation.goBack()} style={styles.backButton}>
          {t('profile.userProfile.backButton')}
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: themeColors.colors.background }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* 🎯 [KIM FIX] Custom Header - like DirectChatRoomScreen */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name='arrow-back' size={24} color={themeColors.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.screenHeaderTitle, { color: themeColors.colors.onSurface }]}>
          {t('profile.userProfile.screenTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <View style={styles.profileHeader}>
              {/* 🎯 [KIM FIX] Show Avatar.Image if photoURL exists, otherwise Avatar.Text */}
              {userProfile.photoURL ? (
                <Avatar.Image
                  size={80}
                  source={{ uri: userProfile.photoURL }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={80}
                  label={userProfile.profile.nickname.charAt(0).toUpperCase()}
                  style={[styles.avatar, { backgroundColor: themeColors.colors.primary }]}
                />
              )}
              <View style={styles.profileInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text variant='headlineSmall' style={styles.nickname}>
                    {userProfile.profile.nickname}
                  </Text>
                  {/* 🎯 [KIM FIX] Show gender icon only for male/female */}
                  {(userProfile.profile.gender === 'male' ||
                    userProfile.profile.gender === '남성' ||
                    userProfile.profile.gender === 'female' ||
                    userProfile.profile.gender === '여성') && (
                    <Text
                      style={{
                        marginLeft: 6,
                        fontSize: 18,
                        color:
                          userProfile.profile.gender === 'male' ||
                          userProfile.profile.gender === '남성'
                            ? '#4A90D9'
                            : '#E91E8C',
                      }}
                    >
                      {userProfile.profile.gender === 'male' ||
                      userProfile.profile.gender === '남성'
                        ? '♂'
                        : '♀'}
                    </Text>
                  )}
                </View>
                <Text variant='bodyMedium' style={styles.location}>
                  📍{' '}
                  {(() => {
                    // 🎯 [KIM FIX] ProfileHeader와 동일한 로직 사용
                    const location = userProfile.profile.location;
                    if (!location) return t('profile.userProfile.noLocation');

                    if (typeof location === 'object') {
                      // Priority: city + state + country → address → fallback
                      const loc = location as {
                        city?: string;
                        state?: string;
                        district?: string;
                        region?: string;
                        country?: string;
                        address?: string;
                      };
                      const parts = [loc.city, loc.state || loc.region, loc.country].filter(
                        Boolean
                      );
                      if (parts.length > 0) {
                        return parts.join(', ');
                      }
                      if (loc.address) {
                        return loc.address;
                      }
                      return t('profile.userProfile.noLocation');
                    } else if (typeof location === 'string') {
                      return location;
                    }
                    return t('profile.userProfile.noLocation');
                  })()}
                </Text>
                <Chip
                  icon='trophy'
                  style={[
                    styles.skillChip,
                    { backgroundColor: themeColors.colors.primaryContainer },
                  ]}
                  textStyle={{ color: themeColors.colors.onPrimaryContainer }}
                >
                  {(() => {
                    // 🎾 [KIM FIX v25] Use eloRatings only (Single Source of Truth)
                    const eloRatings = userProfile.eloRatings as
                      | {
                          singles?: { current?: number };
                          doubles?: { current?: number };
                          mixed?: { current?: number };
                        }
                      | undefined;

                    const singlesElo = eloRatings?.singles?.current || null;
                    const doublesElo = eloRatings?.doubles?.current || null;
                    const mixedElo = eloRatings?.mixed?.current || null;

                    const eloData = [
                      { type: t('profile.userProfile.matchTypes.singles'), elo: singlesElo },
                      { type: t('profile.userProfile.matchTypes.doubles'), elo: doublesElo },
                      { type: t('profile.userProfile.matchTypes.mixed'), elo: mixedElo },
                    ].filter(item => item.elo !== null && item.elo !== undefined);

                    if (eloData.length === 0) {
                      return 'LPR N/A';
                    }

                    // 가장 높은 ELO와 해당 게임 타입 찾기
                    const highest = eloData.reduce((max, item) =>
                      (item.elo || 0) > (max.elo || 0) ? item : max
                    );
                    const calculatedLtr = convertEloToLtr(highest.elo || 1200);
                    return `LPR ${calculatedLtr} (${highest.type})`;
                  })()}
                </Chip>
                {/* 🎯 [KIM FIX] Join Date - Show when user joined the app (inside profileInfo for proper alignment) */}
                {userProfile.profile.joinedAt && (
                  <Text style={styles.joinDate}>
                    📅{' '}
                    {t('profile.userProfile.joinedDate', {
                      date: (() => {
                        const date =
                          userProfile.profile.joinedAt instanceof Date
                            ? userProfile.profile.joinedAt
                            : new Date(userProfile.profile.joinedAt);
                        return date.toLocaleDateString(
                          currentLanguage === 'ko' ? 'ko-KR' : 'en-US',
                          {
                            year: 'numeric',
                            month: currentLanguage === 'ko' ? 'long' : 'short',
                            day: 'numeric',
                          }
                        );
                      })(),
                    })}
                  </Text>
                )}
              </View>
            </View>

            {/* Bio */}
            {userProfile.profile.bio && userProfile.profile.bio.length > 0 ? (
              <View style={styles.bioSection}>
                <Text variant='bodyMedium' style={styles.bio}>
                  {userProfile.profile.bio}
                </Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            {/* 🎯 [KIM FIX] 친구 상태에 따라 버튼 변경 */}
            <View style={styles.actionButtons}>
              {friendshipStatus === 'accepted' ? (
                // 🎉 이미 친구인 경우
                <Button mode='contained' icon='account-check' style={styles.actionButton} disabled>
                  {t('profile.userProfile.actionButtons.alreadyFriends')}
                </Button>
              ) : friendshipStatus === 'pending' ? (
                // ⏳ 친구 요청 대기중인 경우
                <Button mode='outlined' icon='clock-outline' style={styles.actionButton} disabled>
                  {t('profile.userProfile.actionButtons.requestPending')}
                </Button>
              ) : (
                // 📤 친구가 아닌 경우 - 요청 가능
                <Button
                  mode='contained'
                  icon='account-plus'
                  onPress={handleSendFriendRequest}
                  style={styles.actionButton}
                >
                  {t('profile.userProfile.actionButtons.addFriend')}
                </Button>
              )}
              <Button
                mode='outlined'
                icon='message'
                onPress={handleSendMessage}
                style={styles.actionButton}
              >
                {t('profile.userProfile.actionButtons.sendMessage')}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 🏛️ [KIM FIX] Hall of Fame Section - 배지, 트로피, 명예 배지 통합 */}
        <HallOfFameSection userId={userId} currentLanguage={currentLanguage} />

        {/* 🆕 [KIM] Rankings Card - Before Stats */}
        <Card style={styles.infoCard}>
          <Card.Title title={t('profile.userProfile.rankings.title')} titleVariant='titleMedium' />
          <Card.Content>
            {isLoadingRankings ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size='small' color={themeColors.colors.primary} />
              </View>
            ) : (
              // 🆕 [KIM] Pass gender for gender-specific ranking label
              <RankingsCard type='global' data={rankings} gender={targetUserGender} />
            )}
          </Card.Content>
        </Card>

        {/* Stats */}
        <Card style={styles.infoCard}>
          <Card.Title title={t('profile.userProfile.stats.title')} titleVariant='titleMedium' />
          <Card.Content>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text
                  variant='headlineMedium'
                  style={[styles.statNumber, { color: themeColors.colors.primary }]}
                >
                  {userProfile.stats?.matchesPlayed || userProfile.stats?.totalMatches || 0}
                </Text>
                <Text variant='bodySmall' style={styles.statLabel}>
                  {t('profile.userProfile.stats.totalMatches')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant='headlineMedium' style={[styles.statNumber, { color: '#4caf50' }]}>
                  {userProfile.stats?.wins || 0}
                </Text>
                <Text variant='bodySmall' style={styles.statLabel}>
                  {t('profile.userProfile.stats.wins')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant='headlineMedium' style={[styles.statNumber, { color: '#f44336' }]}>
                  {userProfile.stats?.losses || 0}
                </Text>
                <Text variant='bodySmall' style={styles.statLabel}>
                  {t('profile.userProfile.stats.losses')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  variant='headlineMedium'
                  style={[styles.statNumber, { color: themeColors.colors.primary }]}
                >
                  {/* 🎯 [KIM FIX] Calculate winRate from wins/totalMatches instead of using stored value */}
                  {(() => {
                    const wins = userProfile.stats?.wins || 0;
                    const totalMatches =
                      userProfile.stats?.matchesPlayed || userProfile.stats?.totalMatches || 0;
                    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
                    return winRate.toFixed(1);
                  })()}
                  %
                </Text>
                <Text variant='bodySmall' style={styles.statLabel}>
                  {t('profile.userProfile.stats.winRate')}
                </Text>
              </View>
            </View>

            {/* 🆕 [KIM] LPR & ELO Ratings by Match Type */}
            <View style={styles.eloSection}>
              {/* Per-matchType LPR & ELO Display */}
              {(() => {
                // 🎾 [KIM FIX v25] Use eloRatings only (Single Source of Truth)
                const eloRatings = userProfile.eloRatings as
                  | {
                      singles?: { current?: number };
                      doubles?: { current?: number };
                      mixed?: { current?: number };
                    }
                  | undefined;

                const singlesElo = eloRatings?.singles?.current || 1200;
                const doublesElo = eloRatings?.doubles?.current || 1200;
                const mixedElo = eloRatings?.mixed?.current || 1200;

                return (
                  <View style={styles.eloGrid}>
                    <View style={styles.eloGridItem}>
                      <Text variant='bodySmall' style={styles.eloTypeLabel}>
                        🎾 {t('profile.userProfile.matchTypes.singles')}
                      </Text>
                      <Text
                        variant='titleMedium'
                        style={[styles.eloValue, { color: themeColors.colors.primary }]}
                      >
                        LPR {convertEloToLtr(singlesElo)}
                      </Text>
                      <Text variant='bodySmall' style={styles.eloSubValue}>
                        ELO {singlesElo}
                      </Text>
                    </View>
                    <View style={styles.eloGridItem}>
                      <Text variant='bodySmall' style={styles.eloTypeLabel}>
                        👥 {t('profile.userProfile.matchTypes.doubles')}
                      </Text>
                      <Text
                        variant='titleMedium'
                        style={[styles.eloValue, { color: themeColors.colors.primary }]}
                      >
                        LPR {convertEloToLtr(doublesElo)}
                      </Text>
                      <Text variant='bodySmall' style={styles.eloSubValue}>
                        ELO {doublesElo}
                      </Text>
                    </View>
                    <View style={styles.eloGridItem}>
                      <Text variant='bodySmall' style={styles.eloTypeLabel}>
                        👫 {t('profile.userProfile.matchTypes.mixedDoubles')}
                      </Text>
                      <Text
                        variant='titleMedium'
                        style={[styles.eloValue, { color: themeColors.colors.primary }]}
                      >
                        LPR {convertEloToLtr(mixedElo)}
                      </Text>
                      <Text variant='bodySmall' style={styles.eloSubValue}>
                        ELO {mixedElo}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>

            {userProfile.stats?.currentStreak && userProfile.stats.currentStreak > 0 ? (
              <View style={styles.streakSection}>
                <Text
                  variant='bodyMedium'
                  style={[styles.streak, { color: themeColors.colors.primary }]}
                >
                  🔥{' '}
                  {t('profile.userProfile.stats.currentStreak', {
                    count: userProfile.stats.currentStreak,
                  })}
                </Text>
              </View>
            ) : null}
          </Card.Content>
        </Card>

        {/* Player Information */}
        <Card
          style={[
            styles.infoCard,
            userProfile.matchHistory && userProfile.matchHistory.length > 0 ? {} : styles.lastCard,
          ]}
        >
          <Card.Title
            title={t('profile.userProfile.playerInfo.title')}
            titleVariant='titleMedium'
          />
          <Card.Content>
            <View style={styles.infoGrid}>
              {/* 첫 번째 행: 플레이 스타일 + 사용 언어 */}
              <View style={styles.horizontalInfoRow}>
                {/* --- 플레이 스타일 블록 --- */}
                <View style={styles.halfInfoBlock}>
                  <Text style={[styles.label, { color: themeColors.colors.onSurfaceVariant }]}>
                    {t('profile.userProfile.playerInfo.playingStyle')}
                  </Text>
                  <View style={styles.chipContainer}>
                    {userProfile.profile.playingStyle ? (
                      <Chip style={styles.chip}>
                        {(() => {
                          // 🎯 [KIM FIX] playingStyle 번역 - 키가 없으면 원본 사용
                          const translatedStyle = t(
                            `profileData.playingStyles.${userProfile.profile.playingStyle}`
                          );
                          return translatedStyle.includes('profileData.')
                            ? userProfile.profile.playingStyle
                            : translatedStyle;
                        })()}
                      </Chip>
                    ) : (
                      <Text variant='bodySmall' style={styles.noDataText}>
                        {t('profile.userProfile.playerInfo.noInfo')}
                      </Text>
                    )}
                  </View>
                </View>

                {/* --- 사용 언어 블록 --- */}
                <View style={styles.halfInfoBlock}>
                  <Text style={[styles.label, { color: themeColors.colors.onSurfaceVariant }]}>
                    {t('profile.userProfile.playerInfo.languages')}
                  </Text>
                  <View style={styles.chipContainer}>
                    {userProfile.profile.languages && userProfile.profile.languages.length > 0 ? (
                      userProfile.profile.languages.map((lang, index) => (
                        <Chip key={index} style={styles.chip}>
                          {t(`profileData.languages.${lang}`) || lang}
                        </Chip>
                      ))
                    ) : (
                      <Text variant='bodySmall' style={styles.noDataText}>
                        {t('profile.userProfile.playerInfo.noInfo')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* 두 번째 행: 활동 가능 시간 (전체 폭) */}
              <View style={styles.infoBlock}>
                <Text style={[styles.label, { color: themeColors.colors.onSurfaceVariant }]}>
                  {t('profile.userProfile.playerInfo.availability')}
                </Text>

                {/* Show weekdays if available */}
                {userProfile.preferences?.preferredTimesWeekdays &&
                  userProfile.preferences.preferredTimesWeekdays.length > 0 && (
                    <View style={styles.timeSlotRow}>
                      <View style={styles.chipContainer}>
                        <Chip style={[styles.chip, styles.dayTypeChip]}>
                          {t('profile.userProfile.playerInfo.weekdays')}
                        </Chip>
                        {userProfile.preferences.preferredTimesWeekdays.map((time, index) => (
                          <Chip key={`weekday-${index}`} style={styles.chip}>
                            {getTimeSlotLabel(time)}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  )}

                {/* Show weekends if available */}
                {userProfile.preferences?.preferredTimesWeekends &&
                  userProfile.preferences.preferredTimesWeekends.length > 0 && (
                    <View style={styles.timeSlotRow}>
                      <View style={styles.chipContainer}>
                        <Chip style={[styles.chip, styles.dayTypeChip]}>
                          {t('profile.userProfile.playerInfo.weekends')}
                        </Chip>
                        {userProfile.preferences.preferredTimesWeekends.map((time, index) => (
                          <Chip key={`weekend-${index}`} style={styles.chip}>
                            {getTimeSlotLabel(time)}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  )}

                {/* Show no data message if both are empty */}
                {!userProfile.preferences?.preferredTimesWeekdays?.length &&
                  !userProfile.preferences?.preferredTimesWeekends?.length && (
                    <Text variant='bodySmall' style={styles.noDataText}>
                      {t('profile.userProfile.playerInfo.noInfo')}
                    </Text>
                  )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Match History */}
        {userProfile.matchHistory && userProfile.matchHistory.length > 0 ? (
          <Card style={[styles.infoCard, styles.lastCard]}>
            <Card.Title
              title={t('profile.userProfile.matchHistory.title')}
              titleVariant='titleMedium'
            />
            <Card.Content>
              {userProfile.matchHistory.slice(0, 5).map(match => (
                <View key={match.id} style={styles.matchHistoryItem}>
                  <View style={styles.matchResult}>
                    <Text
                      style={[
                        styles.matchResultText,
                        { color: match.result === 'win' ? '#4caf50' : '#f44336' },
                      ]}
                    >
                      {match.result === 'win'
                        ? t('profile.userProfile.matchHistory.win')
                        : t('profile.userProfile.matchHistory.loss')}
                    </Text>
                  </View>
                  <View style={styles.matchInfo}>
                    <Text variant='titleSmall' style={styles.matchTitle}>
                      {match.title}
                    </Text>
                    <Text variant='bodySmall' style={styles.matchScore}>
                      {t('profile.userProfile.matchHistory.score')} {match.score}
                    </Text>
                    <Text variant='bodySmall' style={styles.matchDate}>
                      {match.completedAt.toLocaleDateString(
                        currentLanguage === 'ko' ? 'ko-KR' : 'en-US'
                      )}{' '}
                      · {match.location}
                    </Text>
                  </View>
                  <View style={styles.eloChange}>
                    <Text
                      style={[
                        styles.eloChangeText,
                        { color: match.eloChange >= 0 ? '#4caf50' : '#f44336' },
                      ]}
                    >
                      {match.eloChange >= 0 ? '+' : ''}
                      {match.eloChange}
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

// 🎨 [DARK GLASS] Dynamic styles with theme support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: Record<string, any>, theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      color: colors.error,
    },
    // 🎯 [KIM FIX] Custom screen header styles (like DirectChatRoomScreen)
    screenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    backButton: {
      padding: 8,
    },
    screenHeaderTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40, // Same width as back button for centering
    },
    // 🎨 [DARK GLASS] Header card with glass border effect
    headerCard: {
      marginBottom: 16,
      borderRadius: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    headerContent: {
      padding: 20,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      marginRight: 16,
    },
    profileInfo: {
      flex: 1,
    },
    nickname: {
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.onSurface,
    },
    location: {
      marginBottom: 8,
      color: colors.onSurfaceVariant,
    },
    skillChip: {
      alignSelf: 'flex-start',
    },
    joinDate: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    bioSection: {
      marginBottom: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    bio: {
      lineHeight: 20,
      color: colors.onSurfaceVariant,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 12,
    },
    actionButton: {
      flex: 1,
    },
    // 🎨 [DARK GLASS] Info card with glass border effect
    infoCard: {
      marginBottom: 16,
      borderRadius: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    lastCard: {
      marginBottom: 32,
    },
    infoSection: {
      marginBottom: 16,
    },
    infoGrid: {
      gap: 16,
    },
    horizontalInfoRow: {
      flexDirection: 'row',
      gap: 12,
    },
    halfInfoBlock: {
      flex: 1,
    },
    infoBlock: {
      // 각 정보 블록의 시각적 구분을 위한 스타일
    },
    timeSlotRow: {
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      marginBottom: 8,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },
    sectionLabel: {
      marginBottom: 8,
      fontWeight: 'bold',
      color: colors.onSurfaceVariant,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      // marginBottom removed - gap property in chipContainer handles spacing
    },
    dayTypeChip: {
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      marginRight: 8,
    },
    noDataText: {
      fontStyle: 'italic',
      color: colors.onSurfaceVariant,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      marginTop: 4,
      color: colors.onSurfaceVariant,
    },
    streakSection: {
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    streak: {
      fontWeight: 'bold',
      fontSize: 16,
      color: colors.primary,
    },
    eloSection: {
      alignItems: 'center',
      paddingVertical: 16,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      borderRadius: 8,
      marginTop: 16,
    },
    eloTitle: {
      fontWeight: 'bold',
      fontSize: 18,
      marginBottom: 4,
      color: colors.primary,
    },
    eloDescription: {
      color: colors.onSurfaceVariant,
      fontSize: 14,
    },
    // 🆕 [KIM] ELO Grid styles for per-matchType display
    eloGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      marginBottom: 12,
    },
    eloGridItem: {
      alignItems: 'center',
      flex: 1,
    },
    eloTypeLabel: {
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    eloValue: {
      fontWeight: 'bold',
      fontSize: 18,
      color: colors.primary,
    },
    eloSubValue: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    overallLevelContainer: {
      alignItems: 'center',
      paddingTop: 8,
    },
    matchHistoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    matchResult: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    matchResultText: {
      fontWeight: 'bold',
      fontSize: 16,
      color: colors.onSurface,
    },
    matchInfo: {
      flex: 1,
    },
    matchTitle: {
      fontWeight: '600',
      marginBottom: 2,
      color: colors.onSurface,
    },
    matchScore: {
      color: colors.onSurfaceVariant,
      marginBottom: 2,
    },
    matchDate: {
      color: colors.onSurfaceVariant,
      fontSize: 12,
    },
    eloChange: {
      alignItems: 'center',
      marginLeft: 8,
    },
    eloChangeText: {
      fontWeight: 'bold',
      fontSize: 14,
    },
    achievementItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    achievementIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    achievementEmoji: {
      fontSize: 24,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementName: {
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.onSurface,
    },
    achievementDescription: {
      color: colors.onSurfaceVariant,
      marginBottom: 4,
      lineHeight: 18,
    },
    achievementDate: {
      color: colors.onSurfaceVariant,
      fontSize: 12,
    },
    // Badge styles - mirroring MyProfileScreen design
    badgeLoadingContainer: {
      alignItems: 'center',
      padding: 20,
    },
    badgeLoadingText: {
      marginTop: 10,
      color: colors.onSurfaceVariant,
    },
    badgeList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    badgeItem: {
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      minWidth: 80,
    },
    badgeIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    badgeName: {
      textAlign: 'center',
      fontWeight: '500',
      color: colors.onSurfaceVariant,
    },
    emptyBadgeContainer: {
      alignItems: 'center',
      padding: 20,
    },
    emptyBadgeText: {
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
  });

export default UserProfileScreen;
