/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getDistanceUnit } from '../utils/unitUtils';
import { convertEloToLtr } from '../utils/ltrUtils';
import { useTheme } from '../hooks/useTheme';
import { getLightningTennisTheme } from '../theme';
import CameraService from '../services/CameraService';
import ImageUploadService from '../services/imageUploadService';
import { Appbar } from 'react-native-paper';
import {
  nicknameService,
  CheckNicknameResponse,
  NicknameStatus,
} from '../services/nicknameService';

type NavigationProp = NativeStackNavigationProp<Record<string, object | undefined>>;

const EditProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { currentUser, updateUserProfile } = useAuth();

  // 🎯 [KIM FIX] 다크 모드 지원
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const isDark = currentTheme === 'dark';

  // Get user's country for distance unit formatting
  const userCountry = currentUser?.profile?.location?.country;

  // 💥 Conditional Lock: Check if user has played matches 💥
  const hasPlayedMatches = (currentUser?.stats?.matchesPlayed ?? 0) > 0;

  // Helper function to get NTRP display text
  // 🎯 [KIM FIX v25] Calculate from highest ELO - use eloRatings only (Single Source of Truth)
  const getLtrDisplayText = () => {
    // Get ELO values from all game types
    const singlesElo = currentUser?.eloRatings?.singles?.current || null;
    const doublesElo = currentUser?.eloRatings?.doubles?.current || null;
    const mixedElo = currentUser?.eloRatings?.mixed?.current || null;

    // Filter out null values
    const eloValues = [singlesElo, doublesElo, mixedElo].filter(
      (elo): elo is number => elo !== null && elo !== undefined
    );

    // If user has ELO data, calculate LTR from highest ELO
    if (eloValues.length > 0) {
      const highestElo = Math.max(...eloValues);
      const calculatedLtr = convertEloToLtr(highestElo);

      // Determine skill level label based on LTR (1-10 scale)
      let skillLabel = t('editProfile.skillLevel.beginner');
      if (calculatedLtr >= 9) skillLabel = t('editProfile.skillLevel.expert');
      else if (calculatedLtr >= 7) skillLabel = t('editProfile.skillLevel.advanced');
      else if (calculatedLtr >= 5) skillLabel = t('editProfile.skillLevel.intermediate');

      return `${calculatedLtr} (${skillLabel})`;
    }

    // Fallback to self-assessed level for new users
    const skillLevel = currentUser?.skillLevel;
    if (!skillLevel) return t('common.unknown');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selfAssessed = (skillLevel as any).selfAssessed || '1.0-2.5';
    const levelLabels: Record<string, string> = {
      '1.0-2.5': t('editProfile.skillLevel.beginner'),
      '3.0-3.5': t('editProfile.skillLevel.intermediate'),
      '4.0-4.5': t('editProfile.skillLevel.advanced'),
      '5.0+': t('editProfile.skillLevel.expert'),
    };

    return `${selfAssessed} (${levelLabels[selfAssessed] || t('common.unknown')})`;
  };

  const [formData, setFormData] = useState({
    displayName: '',
    skillLevel: '', // Unified NTRP skill level (replaces both ltrLevel and skillLevel)
    playingStyle: '',
    maxTravelDistance: 15,
    languages: [] as string[],
    goals: '',
    photoURL: null as string | null, // 📸 프로필 사진 URL
    // 🎯 Activity Time Preferences
    availabilityPreference: 'weekdays' as 'weekdays' | 'weekends',
    preferredTimesWeekdays: [] as string[],
    preferredTimesWeekends: [] as string[],
  });

  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // 🎯 Helper function to toggle array items (for time slot selection)
  const toggleArrayItem = (array: string[], item: string): string[] => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };
  const [localImageUri, setLocalImageUri] = useState<string | null>(null); // 📸 로컬 이미지 URI (업로드 전)
  const [imageUploading, setImageUploading] = useState(false); // 📸 이미지 업로드 중 표시

  // 🏷️ [NICKNAME] State for nickname availability checking
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle');
  const [nicknameError, setNicknameError] = useState<string>('');
  const nicknameCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalNicknameRef = useRef<string>(''); // Track original nickname

  // 🏷️ [NICKNAME] Debounced nickname availability check
  const checkNicknameAvailability = useCallback(
    async (nickname: string) => {
      // Clear previous timeout
      if (nicknameCheckTimeoutRef.current) {
        clearTimeout(nicknameCheckTimeoutRef.current);
      }

      // If nickname is same as original, mark as available
      if (nickname.trim().toLowerCase() === originalNicknameRef.current.toLowerCase()) {
        setNicknameStatus('available');
        setNicknameError('');
        return;
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
                : t('editProfile.nickname.unavailableMessage')
            );
          }
        } catch (error) {
          console.error('🏷️ [EditProfile] Nickname check error:', error);
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
      setFormData(prev => ({ ...prev, displayName: text }));

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

  // 기존 데이터 마이그레이션 함수 (라벨 -> 코드 변환)
  const migrateLegacyLanguageData = (languages: string[]): string[] => {
    const labelToCodeMap: { [key: string]: string } = {
      한국어: 'ko',
      English: 'en',
      中文: 'zh',
      日本語: 'ja',
      Español: 'es',
      Français: 'fr',
      Deutsch: 'de',
      Italiano: 'it',
      Português: 'pt',
      Русский: 'ru',
    };

    return languages.map(lang => {
      // 이미 코드 형태인지 확인 (예: 'ko', 'en')
      if (availableLanguages.some(availLang => availLang.code === lang)) {
        return lang;
      }
      // 라벨 형태를 코드로 변환
      return labelToCodeMap[lang] || lang;
    });
  };

  // Initialize form data with current user data
  useEffect(() => {
    if (currentUser) {
      // 기존 사용자 데이터 마이그레이션 및 새로운 구조로 변환
      const migratedLanguages = migrateLegacyLanguageData(currentUser.languages || []);

      // 🏷️ [NICKNAME] Store original nickname for comparison
      originalNicknameRef.current = currentUser.displayName || '';

      setFormData({
        displayName: currentUser.displayName || '',
        skillLevel: currentUser.skillLevel || '1.0-2.5', // Unified NTRP skill level
        playingStyle: currentUser.playingStyle || '',
        maxTravelDistance: currentUser.maxTravelDistance || 15,
        languages: migratedLanguages,
        goals: currentUser.goals || '',
        photoURL: currentUser.photoURL || null, // 📸 프로필 사진 URL
        // 🎯 Activity Time Preferences
        availabilityPreference: currentUser.availabilityPreference || 'weekdays',
        preferredTimesWeekdays: currentUser.preferredTimesWeekdays || [],
        preferredTimesWeekends: currentUser.preferredTimesWeekends || [],
      });
    }
  }, [currentUser]);

  // 📸 프로필 사진 선택 핸들러 - 선택 즉시 업로드 및 저장
  const handleSelectImage = async () => {
    try {
      const result = await CameraService.pickProfileImage();
      if (result && currentUser) {
        // 로컬 미리보기 즉시 표시
        setLocalImageUri(result.uri);
        setImageUploading(true);

        try {
          // Firebase Storage에 업로드
          const fileName = `profile_${currentUser.uid}_${Date.now()}.jpg`;
          const uploadedUrl = await ImageUploadService.uploadImage(
            result.uri,
            `profiles/${currentUser.uid}`,
            fileName
          );

          // Firestore 프로필 업데이트 (사진만)
          await updateUserProfile({ photoURL: uploadedUrl });

          // formData 상태 업데이트
          setFormData(prev => ({ ...prev, photoURL: uploadedUrl }));
          setLocalImageUri(null); // 업로드 완료 후 로컬 URI 클리어

          console.log('📸 프로필 사진 업로드 및 저장 완료:', uploadedUrl);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert(t('editProfile.common.error'), t('editProfile.errors.imageUploadError'));
          setLocalImageUri(null); // 실패 시 로컬 URI 클리어
        } finally {
          setImageUploading(false);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(t('editProfile.common.error'), t('editProfile.errors.imageSelectError'));
    }
  };

  // 🎯 [KIM FIX] 뒤로 가기 시 자동 저장 - beforeRemove 이벤트 사용
  // iOS 스와이프 제스처, 안드로이드 백버튼, 헤더 뒤로가기 버튼 모두 처리
  const hasSavedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener(
      'beforeRemove',
      async (e: { preventDefault: () => void; data: { action: unknown } }) => {
        // 이미 저장했으면 스킵
        if (hasSavedRef.current) {
          return;
        }

        // 기본 동작 방지
        e.preventDefault();

        console.log('🔵 [EditProfile] beforeRemove triggered - auto saving...');
        console.log('🔵 [EditProfile] formData.playingStyle:', formData.playingStyle);

        // 🏷️ [NICKNAME] Check nickname availability before saving
        if (nicknameStatus === 'checking') {
          Alert.alert(
            t('editProfile.nickname.checking'),
            t('editProfile.nickname.checkingMessage'),
            [{ text: t('editProfile.common.ok') }]
          );
          hasSavedRef.current = false;
          return;
        }

        if (nicknameStatus === 'unavailable') {
          Alert.alert(
            t('editProfile.nickname.unavailable'),
            nicknameError || t('editProfile.nickname.unavailableMessage'),
            [{ text: t('editProfile.common.ok') }]
          );
          hasSavedRef.current = false;
          return;
        }

        try {
          // 저장 플래그 설정
          hasSavedRef.current = true;

          // 저장 로직 직접 실행 (handleSave는 navigation.goBack 호출하므로 직접 실행)
          const updateData: Record<string, unknown> = {
            displayName: formData.displayName.trim(),
            playingStyle: formData.playingStyle,
            maxTravelDistance: formData.maxTravelDistance,
            languages: formData.languages,
            goals: formData.goals.trim() || null,
            ...(formData.photoURL && { photoURL: formData.photoURL }),
            availabilityPreference: formData.availabilityPreference,
            preferredTimesWeekdays: formData.preferredTimesWeekdays,
            preferredTimesWeekends: formData.preferredTimesWeekends,
          };

          if (!hasPlayedMatches && formData.skillLevel) {
            updateData.skillLevel = formData.skillLevel;
          }

          console.log('🔵 [EditProfile] Saving updateData:', JSON.stringify(updateData));
          await updateUserProfile(updateData);
          console.log('✅ [EditProfile] Auto-save completed successfully');

          // 저장 완료 후 네비게이션 진행
          navigation.dispatch(e.data.action);
        } catch (error) {
          console.error('❌ [EditProfile] Auto-save failed:', error);
          hasSavedRef.current = false;
          // 에러 시에도 네비게이션 진행
          navigation.dispatch(e.data.action);
        }
      }
    );

    return unsubscribe;
  }, [navigation, formData, hasPlayedMatches, updateUserProfile, nicknameStatus, nicknameError, t]);

  const playingStyles = [
    { key: 'aggressive', label: t('editProfile.playingStyle.aggressive') },
    { key: 'defensive', label: t('editProfile.playingStyle.defensive') },
    { key: 'all-court', label: t('editProfile.playingStyle.allCourt') },
    { key: 'baseline', label: t('editProfile.playingStyle.baseline') },
    { key: 'net-player', label: t('editProfile.playingStyle.netPlayer') },
  ];

  // 클린 코드-라벨 구조를 사용하여 데이터 무결성 보장
  const availableLanguages = [
    { code: 'ko', label: '한국어' },
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
  ];

  // 언어 코드를 라벨로 변환하는 헬퍼 함수
  const getLanguageDisplayText = (languageCodes: string[]): string => {
    if (languageCodes.length === 0) {
      return t('editProfile.languages.select');
    }

    const labels = languageCodes.map(code => {
      const language = availableLanguages.find(lang => lang.code === code);
      return language ? language.label : code; // 없는 코드는 그대로 리턴
    });

    return labels.join(', ');
  };

  return (
    <>
      {/* 🔧 [KIM FIX] Android 상태바 겹침 방지 - Appbar.Header 패턴 사용 */}
      <Appbar.Header style={{ backgroundColor: themeColors.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title='프로필 수정' />
      </Appbar.Header>
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.colors.background }]}
        edges={['bottom', 'left', 'right']}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 📸 Profile Photo Section */}
          <View style={styles.profilePhotoSection}>
            <TouchableOpacity
              style={[styles.profilePhotoContainer, { borderColor: themeColors.colors.outline }]}
              onPress={handleSelectImage}
              disabled={imageUploading}
            >
              {imageUploading ? (
                <View style={styles.profilePhotoPlaceholder}>
                  <ActivityIndicator size='large' color={themeColors.colors.primary} />
                </View>
              ) : localImageUri || formData.photoURL ? (
                <Image
                  source={{ uri: localImageUri || formData.photoURL || '' }}
                  style={styles.profilePhoto}
                />
              ) : (
                <View
                  style={[
                    styles.profilePhotoPlaceholder,
                    { backgroundColor: themeColors.colors.surfaceVariant },
                  ]}
                >
                  <Ionicons name='person' size={50} color={themeColors.colors.onSurfaceVariant} />
                </View>
              )}
              {/* Camera Icon Overlay */}
              <View
                style={[styles.cameraIconOverlay, { backgroundColor: themeColors.colors.primary }]}
              >
                <Ionicons name='camera' size={16} color='#FFFFFF' />
              </View>
            </TouchableOpacity>
            <Text style={[styles.photoHintText, { color: themeColors.colors.onSurfaceVariant }]}>
              {t('editProfile.photoHint')}
            </Text>
          </View>

          {/* Display Name */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: themeColors.colors.onSurface }]}>
              {t('editProfile.nickname.label')}
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
                value={formData.displayName}
                onChangeText={handleNicknameChange}
                placeholder={t('editProfile.nickname.placeholder')}
                placeholderTextColor={themeColors.colors.onSurfaceVariant}
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
            ) : nicknameStatus === 'available' &&
              formData.displayName.toLowerCase() !== originalNicknameRef.current.toLowerCase() ? (
              <Text style={[styles.helperText, styles.nicknameAvailable]}>
                {t('editProfile.nickname.available')}
              </Text>
            ) : null}
          </View>

          {/* 🎯 [KIM FIX] Gender Display (read-only) */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: themeColors.colors.onSurface }]}>
              {t('editProfile.gender.label')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* 🎯 [KIM FIX] Use profile.gender (not root gender) */}
              {currentUser?.profile?.gender === 'male' ||
              currentUser?.profile?.gender === '남성' ? (
                <>
                  <Text style={{ fontSize: 16, color: '#4A90D9', marginRight: 6 }}>♂</Text>
                  <Text style={[styles.lockInfoText, { color: themeColors.colors.onSurface }]}>
                    {t('editProfile.gender.male')}
                  </Text>
                </>
              ) : currentUser?.profile?.gender === 'female' ||
                currentUser?.profile?.gender === '여성' ? (
                <>
                  <Text style={{ fontSize: 16, color: '#E91E8C', marginRight: 6 }}>♀</Text>
                  <Text style={[styles.lockInfoText, { color: themeColors.colors.onSurface }]}>
                    {t('editProfile.gender.female')}
                  </Text>
                </>
              ) : (
                <Text style={[styles.lockInfoText, { color: themeColors.colors.onSurfaceVariant }]}>
                  {t('editProfile.gender.notSpecified')}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.lockInfoText,
                { color: themeColors.colors.onSurfaceVariant, marginTop: 4, fontSize: 12 },
              ]}
            >
              {t('editProfile.gender.hint')}
            </Text>
          </View>

          {/* NTRP Skill Level Info (read-only) */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: themeColors.colors.onSurface }]}>
              {t('editProfile.skillLevel.label')}
            </Text>
            <Text
              style={[
                styles.calculatedLevelText,
                { color: isDark ? '#4CAF50' : '#28a745', marginBottom: 8 },
              ]}
            >
              {getLtrDisplayText()}
            </Text>
            <Text style={[styles.lockInfoText, { color: themeColors.colors.onSurfaceVariant }]}>
              {t('editProfile.skillLevel.hint')}
            </Text>
          </View>

          {/* Playing Style */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: themeColors.colors.onSurface }]}>
              {t('editProfile.playingStyle.label')}
            </Text>
            <View style={styles.optionsContainer}>
              {playingStyles.map(style => (
                <TouchableOpacity
                  key={style.key}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: themeColors.colors.surface,
                      borderColor: themeColors.colors.outline,
                    },
                    formData.playingStyle === style.key && {
                      backgroundColor: isDark
                        ? 'rgba(25, 118, 210, 0.2)'
                        : themeColors.colors.primaryContainer,
                      borderColor: themeColors.colors.primary,
                    },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, playingStyle: style.key }))}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      { color: themeColors.colors.onSurface },
                      formData.playingStyle === style.key && {
                        color: themeColors.colors.primary,
                      },
                    ]}
                  >
                    {style.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Max Travel Distance */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: themeColors.colors.onSurface }]}>
              {t('editProfile.travelDistance.label', { unit: getDistanceUnit(t, userCountry) })}
            </Text>
            <View
              style={[
                styles.sliderContainer,
                {
                  backgroundColor: themeColors.colors.surface,
                  borderColor: themeColors.colors.outline,
                },
              ]}
            >
              <Text style={[styles.sliderValue, { color: themeColors.colors.onSurface }]}>
                {formData.maxTravelDistance} {getDistanceUnit(t, userCountry)}
              </Text>
              <View style={styles.sliderButtons}>
                <TouchableOpacity
                  style={[styles.sliderButton, { backgroundColor: themeColors.colors.primary }]}
                  onPress={() =>
                    setFormData(prev => ({
                      ...prev,
                      maxTravelDistance: Math.max(1, prev.maxTravelDistance - 1),
                    }))
                  }
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sliderButton, { backgroundColor: themeColors.colors.primary }]}
                  onPress={() =>
                    setFormData(prev => ({
                      ...prev,
                      maxTravelDistance: Math.min(50, prev.maxTravelDistance + 1),
                    }))
                  }
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Languages */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: themeColors.colors.onSurface }]}>
              {t('editProfile.languages.label')}
            </Text>
            <TouchableOpacity
              style={[
                styles.selector,
                {
                  backgroundColor: themeColors.colors.surface,
                  borderColor: themeColors.colors.outline,
                },
              ]}
              onPress={() => setShowLanguageModal(true)}
            >
              <Ionicons
                name='language-outline'
                size={20}
                color={themeColors.colors.onSurfaceVariant}
              />
              <Text style={[styles.selectorText, { color: themeColors.colors.onSurface }]}>
                {getLanguageDisplayText(formData.languages)}
              </Text>
              <Ionicons
                name='chevron-down-outline'
                size={20}
                color={themeColors.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {/* Goals */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: themeColors.colors.onSurface }]}>
              {t('editProfile.goals.label')}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.multilineInput,
                {
                  backgroundColor: themeColors.colors.surface,
                  borderColor: themeColors.colors.outline,
                  color: themeColors.colors.onSurface,
                },
              ]}
              value={formData.goals}
              onChangeText={text => setFormData(prev => ({ ...prev, goals: text }))}
              placeholder={t('editProfile.goals.placeholder')}
              placeholderTextColor={themeColors.colors.onSurfaceVariant}
              multiline
              numberOfLines={3}
              textAlignVertical='top'
            />
          </View>

          {/* 🎯 Activity Time Preferences Section */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: themeColors.colors.onSurface }]}>
              {t('editProfile.activityTime.label')}
            </Text>
            <Text style={[styles.helperText, { color: themeColors.colors.onSurfaceVariant }]}>
              {t('editProfile.activityTime.hint')}
            </Text>

            {/* Weekday/Weekend Toggle */}
            <View style={styles.availabilityButtons}>
              {[
                { key: 'weekdays', label: t('editProfile.activityTime.weekdays') },
                { key: 'weekends', label: t('editProfile.activityTime.weekends') },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.availabilityButton,
                    {
                      backgroundColor:
                        formData.availabilityPreference === option.key
                          ? '#9c27b0'
                          : themeColors.colors.surface,
                      borderColor:
                        formData.availabilityPreference === option.key
                          ? '#9c27b0'
                          : themeColors.colors.outline,
                    },
                  ]}
                  onPress={() =>
                    setFormData(prev => ({
                      ...prev,
                      availabilityPreference: option.key as 'weekdays' | 'weekends',
                    }))
                  }
                >
                  <Text
                    style={{
                      color:
                        formData.availabilityPreference === option.key
                          ? '#FFFFFF'
                          : themeColors.colors.onSurface,
                      fontWeight:
                        formData.availabilityPreference === option.key ? 'bold' : 'normal',
                      fontSize: 14,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time Slot Selection */}
            <Text
              style={[
                styles.fieldLabel,
                { color: themeColors.colors.onSurface, marginTop: 16, marginBottom: 8 },
              ]}
            >
              {t('editProfile.activityTime.preferredTimesLabel', {
                type:
                  formData.availabilityPreference === 'weekdays'
                    ? t('editProfile.activityTime.weekdays')
                    : t('editProfile.activityTime.weekends'),
              })}
            </Text>

            <View style={styles.timeSlotButtons}>
              {formData.availabilityPreference === 'weekdays'
                ? // 평일 시간대
                  [
                    {
                      key: 'early_morning_wd',
                      label: t('editProfile.activityTime.earlyMorning'),
                    },
                    {
                      key: 'morning_wd',
                      label: t('editProfile.activityTime.morning'),
                    },
                    {
                      key: 'lunch_wd',
                      label: t('editProfile.activityTime.lunch'),
                    },
                    {
                      key: 'afternoon_wd',
                      label: t('editProfile.activityTime.afternoon'),
                    },
                    {
                      key: 'evening_wd',
                      label: t('editProfile.activityTime.evening'),
                    },
                    {
                      key: 'night_wd',
                      label: t('editProfile.activityTime.night'),
                    },
                  ].map(slot => (
                    <TouchableOpacity
                      key={slot.key}
                      style={[
                        styles.timeSlotButton,
                        {
                          backgroundColor: formData.preferredTimesWeekdays.includes(slot.key)
                            ? '#f44336'
                            : themeColors.colors.surface,
                          borderColor: formData.preferredTimesWeekdays.includes(slot.key)
                            ? '#f44336'
                            : themeColors.colors.outline,
                        },
                      ]}
                      onPress={() =>
                        setFormData(prev => ({
                          ...prev,
                          preferredTimesWeekdays: toggleArrayItem(
                            prev.preferredTimesWeekdays,
                            slot.key
                          ),
                        }))
                      }
                    >
                      <Text
                        style={{
                          color: formData.preferredTimesWeekdays.includes(slot.key)
                            ? '#FFFFFF'
                            : themeColors.colors.onSurface,
                          fontWeight: formData.preferredTimesWeekdays.includes(slot.key)
                            ? 'bold'
                            : 'normal',
                          fontSize: 13,
                        }}
                      >
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  ))
                : // 주말 시간대
                  [
                    {
                      key: 'early_morning_we',
                      label: t('editProfile.activityTime.earlyMorning'),
                    },
                    {
                      key: 'morning_we',
                      label: t('editProfile.activityTime.morning'),
                    },
                    {
                      key: 'lunch_we',
                      label: t('editProfile.activityTime.lunch'),
                    },
                    {
                      key: 'afternoon_we',
                      label: t('editProfile.activityTime.afternoon'),
                    },
                    {
                      key: 'evening_we',
                      label: t('editProfile.activityTime.evening'),
                    },
                    {
                      key: 'night_we',
                      label: t('editProfile.activityTime.night'),
                    },
                  ].map(slot => (
                    <TouchableOpacity
                      key={slot.key}
                      style={[
                        styles.timeSlotButton,
                        {
                          backgroundColor: formData.preferredTimesWeekends.includes(slot.key)
                            ? '#f44336'
                            : themeColors.colors.surface,
                          borderColor: formData.preferredTimesWeekends.includes(slot.key)
                            ? '#f44336'
                            : themeColors.colors.outline,
                        },
                      ]}
                      onPress={() =>
                        setFormData(prev => ({
                          ...prev,
                          preferredTimesWeekends: toggleArrayItem(
                            prev.preferredTimesWeekends,
                            slot.key
                          ),
                        }))
                      }
                    >
                      <Text
                        style={{
                          color: formData.preferredTimesWeekends.includes(slot.key)
                            ? '#FFFFFF'
                            : themeColors.colors.onSurface,
                          fontWeight: formData.preferredTimesWeekends.includes(slot.key)
                            ? 'bold'
                            : 'normal',
                          fontSize: 13,
                        }}
                      >
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
            </View>
          </View>
        </ScrollView>

        {/* Language Selection Modal */}
        <Modal
          visible={showLanguageModal}
          transparent={true}
          animationType='slide'
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: themeColors.colors.outline }]}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowLanguageModal(false)}
                >
                  <Text
                    style={[styles.modalCancelText, { color: themeColors.colors.onSurfaceVariant }]}
                  >
                    {t('editProfile.languageModal.cancel')}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: themeColors.colors.onSurface }]}>
                  {t('editProfile.languages.select')}
                </Text>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={() => setShowLanguageModal(false)}
                >
                  <Text style={[styles.modalConfirmText, { color: themeColors.colors.primary }]}>
                    {t('editProfile.languageModal.done')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalList}>
                {availableLanguages.map(langObj => (
                  <TouchableOpacity
                    key={langObj.code}
                    style={[styles.modalItem, { borderBottomColor: themeColors.colors.outline }]}
                    onPress={() => {
                      // 코드 기반으로 선택/해제 처리
                      const newLanguageCodes = formData.languages.includes(langObj.code)
                        ? formData.languages.filter(code => code !== langObj.code)
                        : [...formData.languages, langObj.code];
                      setFormData(prev => ({ ...prev, languages: newLanguageCodes }));
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: themeColors.colors.onSurface }]}>
                      {langObj.label}
                    </Text>
                    {formData.languages.includes(langObj.code) && (
                      <Ionicons name='checkmark' size={20} color={themeColors.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  // 📸 Profile Photo Styles
  profilePhotoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhotoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  profilePhotoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoHintText: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  optionButtonTextActive: {
    color: '#1976d2',
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  sliderContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sliderButton: {
    backgroundColor: '#1976d2',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancelButton: {
    padding: 4,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalConfirmButton: {
    padding: 4,
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '600',
  },
  modalList: {
    padding: 20,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  // 💥 Conditional Lock Styles 💥
  readOnlyContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  calculatedLevelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 8,
  },
  lockInfoText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  lockIcon: {
    marginRight: 8,
  },
  // 🎯 Activity Time Preferences Styles
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  availabilityButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  availabilityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
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
});

export default EditProfileScreen;
