/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLightningPickleballTheme } from '../../theme';
import { getDistanceUnit } from '../../utils/unitUtils';
import { getTimezoneFromCoordinates } from '../../utils/timezoneUtils';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import {
  nicknameService,
  CheckNicknameResponse,
  NicknameStatus,
} from '../../services/nicknameService';

interface ProfileSetupScreenProps {
  onComplete: (profileData: ProfileData) => void;
  onBack: () => void;
}

export interface ProfileData {
  // Step 1: Basic Info
  nickname: string;
  gender: 'male' | 'female';

  // Step 2: Pickleball Details
  skillLevel?: number; // LPR 1-10 (set in LPR assessment)
  communicationLanguages: string[];
  preferredPlayingStyle: string[];

  // Step 3: Location & Permissions
  location: {
    latitude: number;
    longitude: number;
    address: string;
    country: string;
    state: string; // 🎯 [KIM FIX] Changed from 'region' to 'state' for consistency with MyProfileScreen
    city: string;
    timezone: string; // 🌍 IANA timezone identifier (e.g., "America/New_York")
  } | null;
  locationPermissionGranted: boolean;
  notificationPermissionGranted: boolean;
  maxTravelDistance: number; // in miles or km based on location

  // Step 4: Preferences
  notificationDistance: number; // in miles or km
  availabilityPreference: 'weekdays' | 'weekends';
  preferredTimesWeekdays: string[];
  preferredTimesWeekends: string[];

  // Auto-detected settings
  currencyUnit: 'USD' | 'KRW' | 'EUR' | 'JPY';
  distanceUnit: 'miles' | 'km';
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete, onBack }) => {
  const { currentLanguage, t } = useLanguage();
  // FORCE DARK MODE for onboarding
  const forcedTheme = 'dark';
  const themeColors = getLightningPickleballTheme(forcedTheme);
  const [currentStep, setCurrentStep] = useState(1);
  // 🎯 [KIM] Location Required Modal - shows when user denies location permission
  const [showLocationRequiredModal, setShowLocationRequiredModal] = useState(false);
  // 🎯 [KIM] Notification Required Modal - shows when user skips notification permission
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const [profileData, setProfileData] = useState<ProfileData>({
    nickname: '',
    gender: 'male', // 🆕 기본값: 남자 (성별 필수 선택)
    // skillLevel will be set by NTRP assessment in OnboardingContainer
    communicationLanguages: [currentLanguage],
    preferredPlayingStyle: [],
    location: null,
    locationPermissionGranted: false,
    notificationPermissionGranted: false,
    maxTravelDistance: 15,
    notificationDistance: 10,
    availabilityPreference: 'weekdays',
    preferredTimesWeekdays: [],
    preferredTimesWeekends: [],
    currencyUnit: 'USD',
    distanceUnit: 'miles',
  });

  // 🏷️ [NICKNAME] State for nickname availability checking
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle');
  const [nicknameError, setNicknameError] = useState<string>('');
  const nicknameCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user's country for distance unit formatting
  const userCountry = profileData.location?.country;

  // 🏷️ [NICKNAME] Debounced nickname availability check
  const checkNicknameAvailability = useCallback(
    async (nickname: string) => {
      // Clear previous timeout
      if (nicknameCheckTimeoutRef.current) {
        clearTimeout(nicknameCheckTimeoutRef.current);
      }

      // Validate locally first
      const localValidation = nicknameService.validateLocally(nickname);
      if (!localValidation.valid) {
        if (localValidation.reason) {
          setNicknameStatus('unavailable');
          setNicknameError(nicknameService.getErrorMessage(localValidation.reason));
        }
        return;
      }

      // Set checking status
      setNicknameStatus('checking');
      setNicknameError('');

      // Debounce the API call (500ms)
      nicknameCheckTimeoutRef.current = setTimeout(async () => {
        try {
          const result: CheckNicknameResponse = await nicknameService.checkAvailability(nickname);

          if (result.available) {
            setNicknameStatus('available');
            setNicknameError('');
          } else {
            setNicknameStatus('unavailable');
            setNicknameError(
              result.reason
                ? nicknameService.getErrorMessage(result.reason)
                : t('profileSetup.nicknameUnavailable')
            );
          }
        } catch (error) {
          console.error('🏷️ [ProfileSetup] Nickname check error:', error);
          setNicknameStatus('error');
          setNicknameError(t('profileSetup.nicknameCheckError'));
        }
      }, 500);
    },
    [t]
  );

  // 🏷️ [NICKNAME] Handle nickname change with availability check
  const handleNicknameChange = useCallback(
    (text: string) => {
      updateProfileData({ nickname: text });

      // Reset status if empty
      if (!text.trim()) {
        setNicknameStatus('idle');
        setNicknameError('');
        return;
      }

      // Trigger availability check
      checkNicknameAvailability(text);
    },
    [checkNicknameAvailability]
  );

  // 🏷️ [NICKNAME] Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (nicknameCheckTimeoutRef.current) {
        clearTimeout(nicknameCheckTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentStep, fadeAnim]);

  const animateToNextStep = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(prev => prev + 1);
    });
  };

  const animateToPrevStep = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(prev => prev - 1);
    });
  };

  const handleNext = () => {
    // 🎯 [KIM FIX] Step 2 (피클볼 정보) 스킵 - 이제 2단계만 존재
    // Step 1: 기본 정보 (닉네임, 성별)
    // Step 2: 위치 및 권한 (기존 Step 3)
    switch (currentStep) {
      case 1:
        if (!profileData.nickname.trim()) {
          Alert.alert(
            t('profileSetup.alerts.nicknameRequired.title'),
            t('profileSetup.alerts.nicknameRequired.message'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        if (profileData.nickname.length < 2) {
          Alert.alert(
            t('profileSetup.alerts.nicknameLength.title'),
            t('profileSetup.alerts.nicknameLength.message'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        // 🏷️ [NICKNAME] Check nickname availability status
        if (nicknameStatus === 'checking') {
          Alert.alert(
            t('profileSetup.alerts.nicknameChecking.title'),
            t('profileSetup.alerts.nicknameChecking.message'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        if (nicknameStatus === 'unavailable') {
          Alert.alert(
            t('profileSetup.alerts.nicknameUnavailable.title'),
            nicknameError || t('profileSetup.alerts.nicknameUnavailable.message'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        // 🆕 성별 필수 - 남/녀만 선택 가능
        break;
      // 🎯 [KIM FIX] 기존 Step 2 (소통 언어, 플레이 스타일) 제거됨
      // - 소통 언어: LanguageSelectionScreen에서 선택한 언어 자동 적용
      // - 플레이 스타일: 프로필 수정에서 선택 가능
      case 2:
        // 🎯 [KIM UPDATE] 위치 권한 없으면 설득 모달 표시
        if (!profileData.locationPermissionGranted) {
          setShowLocationRequiredModal(true);
          return; // 모달에서 "나중에 하기" 선택 시 다음으로 넘어감
        }
        // 🎯 [KIM UPDATE] 알림 권한 없으면 설득 모달 표시
        if (!profileData.notificationPermissionGranted) {
          setShowNotificationModal(true);
          return; // 모달에서 "나중에 하기" 선택 시 다음으로 넘어감
        }
        break;
    }

    if (currentStep < 2) {
      animateToNextStep();
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      animateToPrevStep();
    } else {
      onBack();
    }
  };

  const handleComplete = () => {
    // Final validation - nickname and location are required
    if (!profileData.nickname.trim()) {
      Alert.alert(
        t('profileSetup.alerts.completeProfile.title'),
        t('profileSetup.alerts.completeProfile.message'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    // 🎯 [KIM UPDATE] 위치 정보 선택 - 위치 없이도 프로필 완료 허용

    // Unify distance settings: use maxTravelDistance for both event filtering and notifications
    const unifiedProfileData = {
      ...profileData,
      notificationDistance: profileData.maxTravelDistance,
    };

    console.log('🏁 ProfileSetupScreen: Profile completion initiated');
    console.log('📋 Profile data (unified distances):', unifiedProfileData);

    // Call onComplete callback with profile data
    onComplete(unifiedProfileData);
  };

  const updateProfileData = (updates: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }));
  };

  // 🎯 [KIM FIX] toggleArrayItem 제거됨 - renderPickleballDetailsStep와 함께 사용되지 않음
  // 향후 필요시 git history에서 복구 가능

  const getStepTitle = () => {
    // 🎯 [KIM FIX] 2단계로 축소 (기존 Step 2 피클볼 정보 스킵)
    switch (currentStep) {
      case 1:
        return t('profileSetup.step1'); // 기본 정보
      case 2:
        return t('profileSetup.step3'); // 위치 및 권한 (기존 step3)
      default:
        return '';
    }
  };

  const renderStepContent = () => {
    // 🎯 [KIM FIX] Step 2 (피클볼 정보) 스킵 - Step 1 → Step 2 (기존 위치)
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderLocationStep(); // 기존 Step 3
      default:
        return null;
    }
  };

  const renderBasicInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: themeColors.colors.onSurface }]}>
        {getStepTitle()}
      </Text>
      <Text style={[styles.stepDescription, { color: themeColors.colors.onSurfaceVariant }]}>
        {t('profileSetup.basicInfoDescription')}
      </Text>

      {/* Nickname */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: themeColors.colors.onSurface }]}>
          {t('profileSetup.nickname')} *
        </Text>
        <View style={styles.nicknameInputContainer}>
          <TextInput
            style={[
              styles.textInput,
              styles.nicknameInput,
              {
                backgroundColor: themeColors.colors.surface,
                borderColor:
                  nicknameStatus === 'available'
                    ? '#4caf50'
                    : nicknameStatus === 'unavailable'
                      ? '#f44336'
                      : themeColors.colors.outline,
                color: themeColors.colors.onSurface,
              },
            ]}
            placeholder={t('profileSetup.nicknamePlaceholder')}
            placeholderTextColor={themeColors.colors.onSurfaceVariant}
            value={profileData.nickname}
            onChangeText={handleNicknameChange}
            maxLength={20}
          />
          {/* Status indicator */}
          <View style={styles.nicknameStatusIcon}>
            {nicknameStatus === 'checking' && (
              <ActivityIndicator size='small' color={themeColors.colors.primary} />
            )}
            {nicknameStatus === 'available' && (
              <Ionicons name='checkmark-circle' size={24} color='#4caf50' />
            )}
            {nicknameStatus === 'unavailable' && (
              <Ionicons name='close-circle' size={24} color='#f44336' />
            )}
          </View>
        </View>
        {/* Helper text / Error message */}
        {nicknameStatus === 'unavailable' && nicknameError ? (
          <Text style={[styles.helperText, styles.nicknameError]}>{nicknameError}</Text>
        ) : nicknameStatus === 'available' ? (
          <Text style={[styles.helperText, styles.nicknameAvailable]}>
            {t('profileSetup.nicknameAvailable')}
          </Text>
        ) : (
          <Text style={[styles.helperText, { color: themeColors.colors.onSurfaceVariant }]}>
            {t('profileSetup.nicknameCharCount', { count: profileData.nickname.length })}
          </Text>
        )}
      </View>

      {/* Gender */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: themeColors.colors.onSurface }]}>
          {t('profileSetup.gender')}
        </Text>
        <View style={styles.optionsGrid}>
          {[
            { key: 'male', label: t('profileSetup.male') },
            { key: 'female', label: t('profileSetup.female') },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    profileData.gender === option.key
                      ? themeColors.colors.primary
                      : themeColors.colors.surface,
                  borderColor:
                    profileData.gender === option.key
                      ? themeColors.colors.primary
                      : themeColors.colors.outline,
                },
                profileData.gender === option.key && styles.selectedOptionButton,
              ]}
              onPress={() => updateProfileData({ gender: option.key as ProfileData['gender'] })}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color:
                      profileData.gender === option.key
                        ? themeColors.colors.onPrimary
                        : themeColors.colors.onSurface,
                  },
                  profileData.gender === option.key && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* 🎯 [KIM FIX] Gender selection hint */}
        <Text
          style={[styles.helperText, { color: themeColors.colors.onSurfaceVariant, marginTop: 8 }]}
        >
          {t('profileSetup.genderHint')}
        </Text>
      </View>
    </View>
  );

  // 🎯 [KIM FIX] renderPickleballDetailsStep 제거됨 - Step 2 스킵
  // - 소통 언어: LanguageSelectionScreen에서 선택한 언어 자동 적용 (currentLanguage)
  // - 플레이 스타일: 프로필 수정에서 선택 가능
  // - 향후 필요시 git history에서 복구 가능

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        updateProfileData({ locationPermissionGranted: true });

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Reverse geocode to get address
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          // 🌍 Calculate timezone from coordinates
          const timezone = getTimezoneFromCoordinates(
            location.coords.latitude,
            location.coords.longitude
          );
          console.log('🌍 [TIMEZONE] Detected timezone:', timezone);

          updateProfileData({
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              address:
                `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim(),
              country: address.country || 'US',
              state: address.region || '', // 🎯 [KIM FIX] Changed from 'region' to 'state' for MyProfileScreen consistency
              city: address.city || '',
              timezone, // 🌍 Save timezone for local time notifications
            },
            currencyUnit: address.country === 'KR' ? 'KRW' : 'USD',
            distanceUnit: [
              'US',
              'GB',
              'LR',
              'MM',
              'United States',
              'United Kingdom',
              'Liberia',
              'Myanmar',
            ].includes(address.country || '')
              ? 'miles'
              : 'km',
          });
        }
        // ✅ 위치 권한 허용 시 Alert 제거 - UI가 이미 상태를 보여주므로 불필요
      } else {
        // 🎯 [KIM] Show Location Required Modal when permission denied
        updateProfileData({ locationPermissionGranted: false });
        setShowLocationRequiredModal(true);
      }
    } catch (error) {
      console.error('Location permission error:', error);
      // 🎯 [KIM] Show Location Required Modal on error as well
      setShowLocationRequiredModal(true);
    }
  };

  const requestNotificationPermission = async () => {
    // 이미 허용된 상태면 토글로 해제
    if (profileData.notificationPermissionGranted) {
      updateProfileData({ notificationPermissionGranted: false });
      return;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        updateProfileData({ notificationPermissionGranted: true });
        // ✅ 알림 권한 허용 시 Alert 제거 - UI가 이미 상태를 보여주므로 불필요
      } else {
        updateProfileData({ notificationPermissionGranted: false });
        Alert.alert(
          t('profileSetup.alerts.notificationDenied.title'),
          t('profileSetup.alerts.notificationDenied.message'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: themeColors.colors.onSurface }]}>
        {getStepTitle()}
      </Text>
      <Text style={[styles.stepDescription, { color: themeColors.colors.onSurfaceVariant }]}>
        {t('profileSetup.locationDescription')}
      </Text>

      {/* Location Permission Section - OPTIONAL (Recommended) */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: themeColors.colors.onSurface }]}>
          📍 {t('profileSetup.gpsLocationPermission')}
          <Text style={{ color: '#4caf50', fontSize: 12 }}> ({t('profileSetup.recommended')})</Text>
        </Text>
        <Text style={[styles.helperText, { color: themeColors.colors.onSurfaceVariant }]}>
          {t('profileSetup.locationHint')}
        </Text>

        <TouchableOpacity
          style={[
            styles.permissionButton,
            {
              backgroundColor: profileData.locationPermissionGranted
                ? themeColors.colors.primaryContainer
                : themeColors.colors.surface,
              borderColor: profileData.locationPermissionGranted
                ? themeColors.colors.primary
                : themeColors.colors.outline,
            },
            profileData.locationPermissionGranted && styles.permissionButtonGranted,
          ]}
          onPress={requestLocationPermission}
        >
          <View style={styles.permissionButtonContent}>
            <Text style={styles.permissionIcon}>
              {profileData.locationPermissionGranted ? '✅' : '📍'}
            </Text>
            <View style={styles.permissionTextContainer}>
              <Text
                style={[
                  styles.permissionButtonText,
                  {
                    color: profileData.locationPermissionGranted
                      ? themeColors.colors.onPrimaryContainer
                      : themeColors.colors.onSurface,
                  },
                  profileData.locationPermissionGranted && styles.permissionButtonTextGranted,
                ]}
              >
                {profileData.locationPermissionGranted
                  ? t('profileSetup.locationGranted')
                  : t('profileSetup.allowLocation')}
              </Text>
              {profileData.location && (
                <Text style={styles.locationText}>
                  📍 {profileData.location.city}, {profileData.location.state}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Push Notification Permission Section - OPTIONAL */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: themeColors.colors.onSurface }]}>
          🔔 {t('profileSetup.pushNotificationPermission')}
          <Text style={{ color: '#4caf50', fontSize: 12 }}> ({t('profileSetup.recommended')})</Text>
        </Text>
        <Text style={[styles.helperText, { color: themeColors.colors.onSurfaceVariant }]}>
          {t('profileSetup.notificationHint')}
        </Text>

        <TouchableOpacity
          style={[
            styles.permissionButton,
            {
              backgroundColor: profileData.notificationPermissionGranted
                ? themeColors.colors.primaryContainer
                : themeColors.colors.surface,
              borderColor: profileData.notificationPermissionGranted
                ? themeColors.colors.primary
                : themeColors.colors.outline,
            },
            profileData.notificationPermissionGranted && styles.permissionButtonGranted,
          ]}
          onPress={requestNotificationPermission}
        >
          <View style={styles.permissionButtonContent}>
            <Text style={styles.permissionIcon}>
              {profileData.notificationPermissionGranted ? '✅' : '🔔'}
            </Text>
            <View style={styles.permissionTextContainer}>
              <Text
                style={[
                  styles.permissionButtonText,
                  {
                    color: profileData.notificationPermissionGranted
                      ? themeColors.colors.onPrimaryContainer
                      : themeColors.colors.onSurface,
                  },
                  profileData.notificationPermissionGranted && styles.permissionButtonTextGranted,
                ]}
              >
                {profileData.notificationPermissionGranted
                  ? t('profileSetup.notificationGranted')
                  : t('profileSetup.allowNotifications')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Max Travel Distance */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: themeColors.colors.onSurface }]}>
          {t('profileSetup.maxTravelDistance')}: {profileData.maxTravelDistance}{' '}
          {getDistanceUnit(t, userCountry)}
        </Text>
        <Text style={[styles.helperText, { color: themeColors.colors.onSurfaceVariant }]}>
          {t('profileSetup.travelDistanceHint')}
        </Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={50}
            value={profileData.maxTravelDistance}
            onValueChange={value => updateProfileData({ maxTravelDistance: Math.round(value) })}
            step={1}
            minimumTrackTintColor={themeColors.colors.primary}
            maximumTrackTintColor={themeColors.colors.outline}
            thumbTintColor={themeColors.colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>5 {getDistanceUnit(t, userCountry)}</Text>
            <Text style={styles.sliderLabel}>50 {getDistanceUnit(t, userCountry)}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name='chevron-back' size={24} color={themeColors.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.colors.onSurface }]}>
          {t('profileSetup.title')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator - 🎯 [KIM FIX] 2단계로 축소 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / 2) * 100}%`, backgroundColor: themeColors.colors.primary },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: themeColors.colors.onSurfaceVariant }]}>
          {t('profileSetup.stepProgress', { current: currentStep, total: 2 })}
        </Text>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: themeColors.colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.nextButtonText, { color: themeColors.colors.onPrimary }]}>
              {currentStep === 3 ? t('profileSetup.completeProfile') : t('common.next')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* 🎯 [KIM UPDATE] Location Value Modal - Explains benefits but allows skipping */}
      <Modal
        visible={showLocationRequiredModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowLocationRequiredModal(false)}
      >
        <View style={styles.locationModalOverlay}>
          <View
            style={[styles.locationModalContent, { backgroundColor: themeColors.colors.surface }]}
          >
            {/* Icon */}
            <View style={styles.locationModalIcon}>
              <Ionicons name='location' size={48} color={themeColors.colors.primary} />
            </View>

            {/* Title */}
            <Text style={[styles.locationModalTitle, { color: themeColors.colors.onSurface }]}>
              {t('profileSetup.locationModal.title')}
            </Text>

            {/* Description */}
            <Text
              style={[
                styles.locationModalDescription,
                { color: themeColors.colors.onSurfaceVariant },
              ]}
            >
              {t('profileSetup.locationModal.description')}
            </Text>

            {/* Warning subtitle - 강조 */}
            <Text style={[styles.locationModalWarningSubtitle, { color: '#FF9800' }]}>
              {t('profileSetup.locationModal.warningSubtitle')}
            </Text>

            {/* Feature list - Warning style */}
            <View style={styles.locationModalFeatures}>
              <View style={styles.locationModalFeatureItem}>
                <Ionicons name='globe-outline' size={20} color='#FF9800' />
                <Text
                  style={[styles.locationModalFeatureText, { color: themeColors.colors.onSurface }]}
                >
                  {t('profileSetup.locationModal.feature1')}
                </Text>
              </View>
              <View style={styles.locationModalFeatureItem}>
                <Ionicons name='calendar-outline' size={20} color='#FF9800' />
                <Text
                  style={[styles.locationModalFeatureText, { color: themeColors.colors.onSurface }]}
                >
                  {t('profileSetup.locationModal.feature2')}
                </Text>
              </View>
              <View style={styles.locationModalFeatureItem}>
                <Ionicons name='settings-outline' size={20} color='#FF9800' />
                <Text
                  style={[styles.locationModalFeatureText, { color: themeColors.colors.onSurface }]}
                >
                  {t('profileSetup.locationModal.feature3')}
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.locationModalButtons}>
              <TouchableOpacity
                style={[
                  styles.locationModalButton,
                  { backgroundColor: themeColors.colors.primary },
                ]}
                onPress={() => {
                  setShowLocationRequiredModal(false);
                  requestLocationPermission();
                }}
              >
                <Ionicons name='location' size={20} color={themeColors.colors.onPrimary} />
                <Text
                  style={[styles.locationModalButtonText, { color: themeColors.colors.onPrimary }]}
                >
                  {t('profileSetup.locationModal.enableButton')}
                </Text>
              </TouchableOpacity>

              {/* Skip button - 나중에 하기 선택 시 알림 권한 체크 후 진행 */}
              <TouchableOpacity
                style={[styles.locationModalButtonSecondary, { borderColor: 'transparent' }]}
                onPress={() => {
                  setShowLocationRequiredModal(false);
                  // 🎯 [KIM FIX] 위치 스킵 후 알림 권한도 체크, 이제 Step 2가 마지막
                  if (!profileData.notificationPermissionGranted) {
                    setShowNotificationModal(true);
                  } else {
                    handleComplete(); // 🎯 [KIM FIX] Step 2가 마지막이므로 완료
                  }
                }}
              >
                <Text
                  style={[
                    styles.locationModalButtonText,
                    { color: themeColors.colors.onSurfaceVariant },
                  ]}
                >
                  {t('profileSetup.locationModal.maybeLater')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Privacy note */}
            <Text
              style={[styles.locationModalPrivacy, { color: themeColors.colors.onSurfaceVariant }]}
            >
              {t('profileSetup.locationModal.privacy')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* 🎯 [KIM UPDATE] Notification Value Modal - Explains benefits but allows skipping */}
      <Modal
        visible={showNotificationModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.locationModalOverlay}>
          <View
            style={[styles.locationModalContent, { backgroundColor: themeColors.colors.surface }]}
          >
            {/* Icon */}
            <View style={[styles.locationModalIcon, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
              <Ionicons name='notifications' size={48} color='#FF9800' />
            </View>

            {/* Title */}
            <Text style={[styles.locationModalTitle, { color: themeColors.colors.onSurface }]}>
              {t('profileSetup.notificationModal.title')}
            </Text>

            {/* Description */}
            <Text
              style={[
                styles.locationModalDescription,
                { color: themeColors.colors.onSurfaceVariant },
              ]}
            >
              {t('profileSetup.notificationModal.description')}
            </Text>

            {/* Warning subtitle - 강조 */}
            <Text style={[styles.locationModalWarningSubtitle, { color: '#FF9800' }]}>
              {t('profileSetup.notificationModal.warningSubtitle')}
            </Text>

            {/* Feature list - Warning style */}
            <View style={styles.locationModalFeatures}>
              <View style={styles.locationModalFeatureItem}>
                <Ionicons name='ellipse-outline' size={20} color='#FF9800' />
                <Text
                  style={[styles.locationModalFeatureText, { color: themeColors.colors.onSurface }]}
                >
                  {t('profileSetup.notificationModal.feature1')}
                </Text>
              </View>
              <View style={styles.locationModalFeatureItem}>
                <Ionicons name='calendar-outline' size={20} color='#FF9800' />
                <Text
                  style={[styles.locationModalFeatureText, { color: themeColors.colors.onSurface }]}
                >
                  {t('profileSetup.notificationModal.feature2')}
                </Text>
              </View>
              <View style={styles.locationModalFeatureItem}>
                <Ionicons name='chatbubble-outline' size={20} color='#FF9800' />
                <Text
                  style={[styles.locationModalFeatureText, { color: themeColors.colors.onSurface }]}
                >
                  {t('profileSetup.notificationModal.feature3')}
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.locationModalButtons}>
              <TouchableOpacity
                style={[styles.locationModalButton, { backgroundColor: '#FF9800' }]}
                onPress={() => {
                  setShowNotificationModal(false);
                  requestNotificationPermission();
                }}
              >
                <Ionicons name='notifications' size={20} color='#FFFFFF' />
                <Text style={[styles.locationModalButtonText, { color: '#FFFFFF' }]}>
                  {t('profileSetup.notificationModal.enableButton')}
                </Text>
              </TouchableOpacity>

              {/* Skip button - 나중에 하기 선택 시 프로필 완료 */}
              <TouchableOpacity
                style={[styles.locationModalButtonSecondary, { borderColor: 'transparent' }]}
                onPress={() => {
                  setShowNotificationModal(false);
                  handleComplete(); // 🎯 [KIM FIX] Step 2가 마지막이므로 완료
                }}
              >
                <Text
                  style={[
                    styles.locationModalButtonText,
                    { color: themeColors.colors.onSurfaceVariant },
                  ]}
                >
                  {t('profileSetup.notificationModal.maybeLater')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Privacy note */}
            <Text
              style={[styles.locationModalPrivacy, { color: themeColors.colors.onSurfaceVariant }]}
            >
              {t('profileSetup.notificationModal.privacy')}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e1e8ed',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1976d2',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  // 🏷️ [NICKNAME] Input container with status icon
  nicknameInputContainer: {
    position: 'relative',
  },
  nicknameInput: {
    paddingRight: 44, // Space for status icon
  },
  nicknameStatusIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  nicknameError: {
    color: '#f44336',
    fontWeight: '500',
  },
  nicknameAvailable: {
    color: '#4caf50',
    fontWeight: '500',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  selectedOptionButton: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  skillLevelContainer: {
    gap: 10,
  },
  skillLevelButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  skillLevelText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  selectedSkillLevelText: {
    color: '#fff',
  },
  languageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectedLanguageButton: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  languageFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  languageText: {
    fontSize: 14,
    color: '#333',
  },
  selectedLanguageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  playingStyleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playingStyleButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
  },
  selectedPlayingStyleButton: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800',
  },
  playingStyleText: {
    fontSize: 12,
    color: '#333',
  },
  selectedPlayingStyleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sliderContainer: {
    marginTop: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  regionButtons: {
    marginTop: 10,
  },
  metroAreaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  metroAreaButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  regionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedRegionButton: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  regionText: {
    fontSize: 12,
    color: '#333',
  },
  selectedRegionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  availabilityButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  availabilityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 14,
  },
  timeSlotButtons: {
    gap: 8,
  },
  timeSlotButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 14,
  },
  navigationContainer: {
    padding: 20,
  },
  nextButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8f9fa',
    marginTop: 10,
  },
  permissionButtonGranted: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
  },
  permissionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  permissionButtonTextGranted: {
    color: '#4caf50',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // NTRP Level Grid
  ltrLevelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  ltrLevelItem: {
    width: '22%',
    minWidth: 70,
    alignItems: 'center',
  },
  ltrLevelButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ltrLevelValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ltrLevelLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  infoIconButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputHint: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  modalSection: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  modalSectionContent: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Warning Modal Styles
  warningModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  warningMessage: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  warningButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  warningButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  warningButtonSecondary: {
    borderWidth: 1,
  },
  warningButtonPrimary: {
    // backgroundColor set dynamically
  },
  warningButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Auto-Recommend Button Styles
  autoRecommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 16,
    marginBottom: 8,
  },
  autoRecommendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  // 🎯 [KIM] Location Required Modal Styles
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  locationModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  locationModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  locationModalDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  locationModalWarningSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 8,
    marginTop: 4,
    width: '100%',
    paddingHorizontal: 12,
  },
  locationModalFeatures: {
    width: '100%',
    marginBottom: 24,
  },
  locationModalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  locationModalFeatureText: {
    fontSize: 14,
    marginLeft: 12,
  },
  locationModalButtons: {
    width: '100%',
    gap: 12,
  },
  locationModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  locationModalButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  locationModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationModalPrivacy: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default ProfileSetupScreen;
