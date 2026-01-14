/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title, Paragraph, Card, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { theme } from '../../theme';
import { cctvLog, CCTV_PHASES } from '../../utils/cctvLogger';
import LocationService from '../../services/LocationService';

// 🎯 [ONBOARDING LIMIT] 온보딩에서 최대 선택 가능 LPR: 3.5
// 초보자(2.5) ~ 초급(3.5)만 선택 가능
// 4.0 이상은 매치를 통해서만 달성 가능 (실력으로 증명!)
// 🌍 [i18n] SKILL_LEVELS and TIME_SLOTS are now defined inside the component using useMemo

/**
 * 🏛️ TEAM-FIRST 2.0: Convert numeric skill level to string label
 * Maps onboarding skill slider values (25, 50, 75, 90) to standardized levels
 */
function convertNumericToLevel(num: number): string {
  if (num <= 30) return 'beginner';
  if (num <= 60) return 'intermediate';
  if (num <= 80) return 'advanced';
  return 'expert';
}

/**
 * 🎯 [KIM FIX] Convert skill level to initial ELO rating
 * NTRP to ELO conversion (reverse of convertEloToLtr):
 * - Beginner (2.5) → ELO 1100
 * - Intermediate (3.5) → ELO 1300
 * - Advanced (4.5) → ELO 1500
 * - Expert (5.5) → ELO 1700
 */
function convertSkillLevelToElo(num: number): number {
  if (num <= 30) return 1100; // beginner → NTRP 2.5
  if (num <= 60) return 1300; // intermediate → NTRP 3.5
  if (num <= 80) return 1500; // advanced → NTRP 4.5
  return 1700; // expert → NTRP 5.5
}

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    skillLevel: 50,
    maxTravelDistance: 10,
    preferredTimeSlots: [] as string[],
    bio: '',
  });

  const { updateUserProfile } = useAuth();
  const { getCurrentLocation, requestLocationPermission } = useLocation();
  const { t } = useLanguage();

  // 🌍 [i18n] Dynamic skill levels with translations
  const SKILL_LEVELS = useMemo(
    () => [
      {
        label: t('onboarding.skillLevels.beginner'),
        value: 25,
        description: t('onboarding.skillLevels.beginnerDesc'),
      },
      {
        label: t('onboarding.skillLevels.elementary'),
        value: 50,
        description: t('onboarding.skillLevels.elementaryDesc'),
      },
    ],
    [t]
  );

  // 🌍 [i18n] Dynamic time slots with translations
  const TIME_SLOTS = useMemo(
    () => [
      { key: 'morning', label: t('onboarding.timeSlots.morning') },
      { key: 'afternoon', label: t('onboarding.timeSlots.afternoon') },
      { key: 'evening', label: t('onboarding.timeSlots.evening') },
      { key: 'night', label: t('onboarding.timeSlots.night') },
    ],
    [t]
  );

  // 🎥 CCTV: Component initialization logging
  cctvLog('OnboardingScreen', CCTV_PHASES.COMPONENT_MOUNT, 'Component mounted', {
    initialStep: currentStep,
    initialProfile: profile,
  });

  // 🌍 [i18n] Dynamic steps with translations
  const steps = useMemo(
    () => [
      {
        title: t('onboarding.steps.skillLevel'),
        subtitle: t('onboarding.steps.skillLevelSubtitle'),
      },
      {
        title: t('onboarding.steps.preferredTime'),
        subtitle: t('onboarding.steps.preferredTimeSubtitle'),
      },
      {
        title: t('onboarding.steps.travelDistance'),
        subtitle: t('onboarding.steps.travelDistanceSubtitle'),
      },
      { title: t('onboarding.steps.bio'), subtitle: t('onboarding.steps.bioSubtitle') },
      { title: t('onboarding.steps.location'), subtitle: t('onboarding.steps.locationSubtitle') },
    ],
    [t]
  );

  const handleSkillLevelSelect = (level: number) => {
    setProfile(prev => ({ ...prev, skillLevel: level }));
  };

  // 🌍 [i18n] Using key instead of translated label for storage
  const handleTimeSlotToggle = (timeSlotKey: string) => {
    setProfile(prev => {
      const currentSlots = prev.preferredTimeSlots;
      const isSelected = currentSlots.includes(timeSlotKey);

      return {
        ...prev,
        preferredTimeSlots: isSelected
          ? currentSlots.filter(slot => slot !== timeSlotKey)
          : [...currentSlots, timeSlotKey],
      };
    });
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    cctvLog('OnboardingScreen', CCTV_PHASES.INIT, 'Starting onboarding completion process', {
      currentStep,
      profileData: profile,
    });

    try {
      // 🎥 CCTV: Location permission request sequence
      cctvLog(
        'OnboardingScreen',
        CCTV_PHASES.LOCATION_PERMISSION,
        'Requesting location permission'
      );
      const hasLocationPermission = await requestLocationPermission();

      if (!hasLocationPermission) {
        cctvLog('OnboardingScreen', CCTV_PHASES.ERROR, 'Location permission denied by user');
        Alert.alert(
          t('onboarding.alerts.locationPermissionRequired'),
          t('onboarding.alerts.locationPermissionMessage')
        );
        setIsLoading(false);
        return;
      }

      cctvLog(
        'OnboardingScreen',
        CCTV_PHASES.LOCATION_PERMISSION,
        'Location permission granted, acquiring location'
      );
      const currentLocation = await getCurrentLocation();

      if (!currentLocation) {
        cctvLog('OnboardingScreen', CCTV_PHASES.ERROR, 'Failed to acquire current location');
        Alert.alert(
          t('onboarding.alerts.locationError'),
          t('onboarding.alerts.locationErrorMessage')
        );
        setIsLoading(false);
        return;
      }

      cctvLog(
        'OnboardingScreen',
        CCTV_PHASES.LOCATION_ACQUIRED,
        'Current location acquired successfully',
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }
      );

      // 🎯 [KIM FIX] Reverse geocode to get city, state, country (like useProfileSettings does)
      let addressInfo: { address: string; city: string; state: string; country: string } | null =
        null;
      try {
        addressInfo = await LocationService.reverseGeocode(
          currentLocation.latitude,
          currentLocation.longitude
        );
        cctvLog('OnboardingScreen', 'REVERSE_GEOCODE_SUCCESS', 'Address info retrieved', {
          city: addressInfo?.city,
          state: addressInfo?.state,
          country: addressInfo?.country,
        });
      } catch (geocodeError) {
        console.warn('Reverse geocode failed, using fallback:', geocodeError);
      }

      // 프로필 업데이트
      // 🎯 [KIM FIX] Calculate initial ELO from skill level
      const initialElo = convertSkillLevelToElo(profile.skillLevel);

      const profileData = {
        ...profile,
        // 🏛️ TEAM-FIRST 2.0: Convert numeric skillLevel to NEW structure
        skillLevel: {
          selfAssessed: convertNumericToLevel(profile.skillLevel),
          lastUpdated: new Date().toISOString(),
          source: 'onboarding' as const,
        },
        // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
        // publicStats.elo는 더 이상 저장하지 않음 - 통계 데이터만 저장
        eloRatings: {
          singles: {
            initial: initialElo,
            current: initialElo,
            peak: initialElo,
            history: [],
          },
          doubles: {
            initial: initialElo,
            current: initialElo,
            peak: initialElo,
            history: [],
          },
          mixed: {
            initial: initialElo,
            current: initialElo,
            peak: initialElo,
            history: [],
          },
        },
        // 🎯 [KIM FIX v25] publicStats는 통계만 저장 (elo 필드 제거)
        stats: {
          publicStats: {
            singles: { matchesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
            doubles: { matchesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
            mixed_doubles: { matchesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
          },
        },
        // 🎯 [KIM FIX] city, state, country, address를 profile.location에 저장 (UserProfileScreen에서 표시용)
        // address는 "City, State" 형식의 완전한 주소 (fallback용)
        // country는 통화 표시에 필수 (미국: $, 한국: 원)
        // NOTE: updateUserProfile reads from updatedUser.profile.location, so we must nest it here
        // 🎯 [KIM FIX] Use addressInfo from reverseGeocode (not currentLocation which only has coords)
        profile: {
          location: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: addressInfo?.address || '',
            city: addressInfo?.city || '',
            state: addressInfo?.state || '',
            country: addressInfo?.country || 'United States',
          },
        },
        preferences: {
          maxTravelDistance: profile.maxTravelDistance,
          preferredTimeSlots: profile.preferredTimeSlots,
        },
      };

      cctvLog(
        'OnboardingScreen',
        'PROFILE_UPDATE_START',
        'Updating user profile with location data',
        {
          profileData,
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateUserProfile(profileData as any);
      cctvLog('OnboardingScreen', 'PROFILE_UPDATE_COMPLETE', 'User profile updated successfully');

      Alert.alert(
        t('onboarding.alerts.profileComplete'),
        t('onboarding.alerts.profileCompleteMessage'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      cctvLog('OnboardingScreen', CCTV_PHASES.ERROR, 'Onboarding completion failed', {
        error: err.message,
        stack: err.stack,
      });
      Alert.alert(t('onboarding.alerts.error'), t('onboarding.alerts.errorMessage'));
    } finally {
      setIsLoading(false);
      cctvLog('OnboardingScreen', 'COMPLETION_END', 'Onboarding completion process finished', {
        success: !isLoading,
      });
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0:
        return true; // 스킬 레벨은 기본값 있음
      case 1:
        return profile.preferredTimeSlots.length > 0;
      case 2:
        return profile.maxTravelDistance > 0;
      case 3:
        return profile.bio.trim().length >= 10;
      case 4:
        return true; // 위치는 완료 단계에서 처리
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.skillLevelContainer}>
              {SKILL_LEVELS.map(level => (
                <Card
                  key={level.value}
                  style={[
                    styles.skillCard,
                    profile.skillLevel === level.value && styles.selectedSkillCard,
                  ]}
                  onPress={() => handleSkillLevelSelect(level.value)}
                >
                  <Card.Content style={styles.skillCardContent}>
                    <Title style={styles.skillLabel}>{level.label}</Title>
                    <Paragraph style={styles.skillDescription}>{level.description}</Paragraph>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.timeSlotContainer}>
              {TIME_SLOTS.map(timeSlot => (
                <Chip
                  key={timeSlot.key}
                  selected={profile.preferredTimeSlots.includes(timeSlot.key)}
                  onPress={() => handleTimeSlotToggle(timeSlot.key)}
                  style={styles.timeSlotChip}
                  mode={profile.preferredTimeSlots.includes(timeSlot.key) ? 'flat' : 'outlined'}
                >
                  {timeSlot.label}
                </Chip>
              ))}
            </View>
            <Paragraph style={styles.hint}>{t('onboarding.timeSlotHint')}</Paragraph>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.distanceContainer}>
              <Paragraph style={styles.distanceLabel}>
                {t('onboarding.maxDistance', { distance: profile.maxTravelDistance })}
              </Paragraph>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={profile.maxTravelDistance}
                onValueChange={value => setProfile(prev => ({ ...prev, maxTravelDistance: value }))}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor='#d3d3d3'
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...({ thumbStyle: { backgroundColor: theme.colors.primary } } as any)}
              />
              <View style={styles.distanceLabels}>
                <Paragraph style={styles.distanceEnd}>1km</Paragraph>
                <Paragraph style={styles.distanceEnd}>50km</Paragraph>
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <TextInput
              label={t('onboarding.bioLabel')}
              value={profile.bio}
              onChangeText={text => setProfile(prev => ({ ...prev, bio: text }))}
              mode='outlined'
              multiline
              numberOfLines={4}
              style={styles.bioInput}
              placeholder={t('onboarding.bioPlaceholder')}
            />
            <Paragraph style={styles.charCount}>
              {t('onboarding.bioCharCount', { count: profile.bio.length })}
            </Paragraph>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.locationContainer}>
              <Paragraph style={styles.locationText}>{t('onboarding.locationText')}</Paragraph>
              <Paragraph style={styles.locationNote}>{t('onboarding.locationNote')}</Paragraph>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
        >
          <View style={styles.header}>
            <Title style={styles.title}>{steps[currentStep].title}</Title>
            <Paragraph style={styles.subtitle}>{steps[currentStep].subtitle}</Paragraph>
            <View style={styles.progressContainer}>
              <Paragraph style={styles.progressText}>
                {currentStep + 1} / {steps.length}
              </Paragraph>
            </View>
          </View>

          <Card style={styles.contentCard}>
            <Card.Content>{renderStepContent()}</Card.Content>
          </Card>

          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <Button
                mode='outlined'
                onPress={handlePrevious}
                style={styles.button}
                disabled={isLoading}
              >
                {t('onboarding.previous')}
              </Button>
            )}
            <Button
              mode='contained'
              onPress={handleNext}
              style={[styles.button, styles.nextButton]}
              disabled={!isStepValid() || isLoading}
              loading={isLoading && currentStep === steps.length - 1}
            >
              {currentStep === steps.length - 1 ? t('onboarding.complete') : t('onboarding.next')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.onSurface,
    fontSize: 16,
    opacity: 0.7,
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.large,
  },
  progressText: {
    color: 'white',
    fontWeight: 'bold',
  },
  contentCard: {
    flex: 1,
    marginBottom: theme.spacing.lg,
  },
  stepContent: {
    minHeight: 300,
  },
  skillLevelContainer: {
    gap: theme.spacing.md,
  },
  skillCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSkillCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  skillCardContent: {
    alignItems: 'center',
  },
  skillLabel: {
    fontSize: 18,
    marginBottom: theme.spacing.xs,
  },
  skillDescription: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  timeSlotChip: {
    flexBasis: '45%',
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.6,
  },
  distanceContainer: {
    padding: theme.spacing.md,
  },
  distanceLabel: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: theme.spacing.md,
  },
  distanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceEnd: {
    fontSize: 12,
    opacity: 0.6,
  },
  bioInput: {
    marginBottom: theme.spacing.sm,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    opacity: 0.6,
  },
  locationContainer: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  locationText: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontSize: 16,
  },
  locationNote: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
  },
  nextButton: {
    // 다음 버튼 스타일
  },
});
