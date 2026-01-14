/**
 * 📝 LPR (Lightning Pickleball Rating) System
 *
 * ⚡ LPR 1-10: Lightning Pickleball의 고유 레이팅 시스템
 *    - UI 표시: "LPR" (Lightning Pickleball Rating)
 *    - 7-Tier System: Bronze/Silver/Gold/Platinum/Diamond/Master/Legend
 */
import React, { useRef } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import ProfileHeader from './ProfileHeader';
import HallOfFameSection from './HallOfFameSection';
import LtrExplanationCard from './LtrExplanationCard';
import AchievementsGuideCard from './AchievementsGuideCard';

interface UserProfile {
  uid: string;
  profile?: {
    location?: unknown;
  };
}

interface RankingData {
  monthly: { currentRank: number; totalPlayers: number; rankingType: 'monthly' } | null;
  season: { currentRank: number; totalPlayers: number; rankingType: 'season' } | null;
  alltime: { currentRank: number; totalPlayers: number; rankingType: 'alltime' } | null;
}

interface InformationTabContentProps {
  userProfile: UserProfile;
  rankingData: RankingData | null;
  sportsmanshipTags: Record<string, number>;
  isLoadingSportsmanshipTags: boolean;
  onEditProfile: () => void;
  onUpdateLocation: () => void;
  isUpdatingLocation: boolean;
  locationUpdateProgress: string;
  cancelLocationUpdate: () => void;
  getLtrLevelDescription: (ltrLevel: string | number | object | undefined) => string;
  // 🆕 [KIM] User gender for gender-specific ranking label
  userGender?: 'male' | 'female';
}

const InformationTabContent: React.FC<InformationTabContentProps> = ({
  userProfile,
  rankingData,
  sportsmanshipTags,
  isLoadingSportsmanshipTags,
  onEditProfile,
  onUpdateLocation,
  isUpdatingLocation,
  locationUpdateProgress,
  cancelLocationUpdate,
  getLtrLevelDescription,
  userGender,
}) => {
  const { t } = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);

  if (!userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' />
        <Text style={styles.loadingText}>{t('profile.loading.profile')}</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <ProfileHeader
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rankingData={rankingData as any}
        onEditProfile={onEditProfile}
        onUpdateLocation={onUpdateLocation}
        getLtrLevelDescription={getLtrLevelDescription}
        isUpdatingLocation={isUpdatingLocation}
        locationUpdateProgress={locationUpdateProgress}
        cancelLocationUpdate={cancelLocationUpdate}
        // 🆕 [KIM] Pass gender for gender-specific ranking label
        userGender={userGender}
      />

      {/* ⚡ LPR Explanation Card - "What is LPR?" */}
      <LtrExplanationCard />

      {/* 🏆 Achievements Guide Card - "Achievements Guide" */}
      <AchievementsGuideCard scrollViewRef={scrollViewRef} />

      {/* 🏛️ Hall of Fame Section - Unified achievements display */}
      {userProfile?.uid && (
        <HallOfFameSection
          userId={userProfile.uid}
          honorTags={sportsmanshipTags}
          isLoadingHonorTags={isLoadingSportsmanshipTags}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  tabContent: {
    flex: 1,
  },
});

export default InformationTabContent;
