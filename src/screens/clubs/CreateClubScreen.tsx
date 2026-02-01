import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Text,
} from 'react-native';
import { Button, ActivityIndicator, Appbar } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import clubService from '../../services/clubService';
import { normalizeMultiline, normalizeArray } from '../../utils/text';
import { getCurrencyByCountry } from '../../utils/currencyUtils';

// Modular Components
import BasicInfoSection from '../../components/clubs/creation/BasicInfoSection';
import CourtAddressSection from '../../components/clubs/creation/CourtAddressSection';
import MeetingScheduleSection from '../../components/clubs/creation/MeetingScheduleSection';
import VisibilitySettingsSection from '../../components/clubs/creation/VisibilitySettingsSection';
import FeesSection from '../../components/clubs/creation/FeesSection';
import FacilitiesSection from '../../components/clubs/creation/FacilitiesSection';
import RulesSection from '../../components/clubs/creation/RulesSection';
import MeetingScheduleModal from '../../components/clubs/creation/MeetingScheduleModal';
import { ClubFormData, LocationData, Meeting } from '../../components/clubs/creation/types';

// ---------- TYPE DEFINITIONS ----------

type RootStackParamList = {
  ClubDetail: { clubId: string };
  CreateClub: { clubId?: string; mode?: string; selectedLocation?: LocationData };
  LocationSearch: { returnScreen?: string; clubId?: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ---------- UTILITIES ----------

function isNonEmpty(v: unknown) {
  return typeof v === 'string' ? v.trim().length > 0 : !!v;
}

// ---------- MAIN COMPONENT ----------

export default function CreateClubScreen() {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const colors = themeColors.colors;

  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  // Route params handling
  const params = route.params as { selectedLocation?: LocationData; clubId?: string };
  const clubId = params?.clubId;
  const isEditMode = !!clubId;

  // Form state
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    description: '',
    logoUri: undefined,
    isPublic: true,
    facilities: [],
    joinFee: undefined,
    monthlyFee: undefined,
    yearlyFee: undefined,
    rules: '',
    courtAddress: undefined,
    meetings: [],
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClub, setIsLoadingClub] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // 🎯 [KIM FIX] Auto-save on back navigation (edit mode only)
  const hasSavedRef = useRef(false);

  // Real-time validation state
  const [fieldValidation, setFieldValidation] = useState({
    name: { isValid: false, message: '' },
    description: { isValid: false, message: '' },
    courtAddress: { isValid: false, message: '' },
    meetings: { isValid: false, message: '' },
  });

  // Dynamic shadow based on theme
  const shadow = Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 2 },
    default: {},
  });

  // Styles
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    keyboardView: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 16, color: colors.onSurfaceVariant },
    scroll: { paddingHorizontal: 12, paddingTop: 0, paddingBottom: 80, gap: 12 },
    stickyFooter: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 10,
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.outline,
      ...shadow,
    },
    stickyContent: { paddingVertical: 8 },
  });

  // Custom header setup - Always hide React Navigation header, use Appbar.Header instead
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Form data handlers
  const updateFormData = useCallback(
    <K extends keyof ClubFormData>(key: K, value: ClubFormData[K]) => {
      setFormData(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  // Load club data for editing
  const loadClubData = useCallback(async () => {
    if (!clubId) return;

    try {
      setIsLoadingClub(true);
      // 🎯 [KIM FIX] Skip member loading for performance - edit mode only needs club basic info
      const clubData = (await clubService.getClubDetails(clubId, { includeMembers: false })) as {
        name?: string;
        description?: string;
        logoUri?: string;
        isPublic?: boolean;
        facilities?: string[];
        joinFee?: number;
        monthlyFee?: number;
        yearlyFee?: number;
        rules?: string[];
        courtAddress?: LocationData;
        meetings?: Meeting[];
      };

      if (clubData) {
        setFormData({
          name: clubData.name || '',
          description: clubData.description || '',
          logoUri: clubData.logoUri || undefined,
          isPublic: clubData.isPublic ?? true,
          facilities: clubData.facilities || [],
          joinFee: clubData.joinFee || undefined,
          monthlyFee: clubData.monthlyFee || undefined,
          yearlyFee: clubData.yearlyFee || undefined,
          rules: Array.isArray(clubData.rules) ? clubData.rules.join('\n') : clubData.rules || '',
          courtAddress: clubData.courtAddress || undefined,
          meetings: clubData.meetings || [],
        });
      }
    } catch (error: unknown) {
      console.error('Failed to load club data:', error);
      Alert.alert(t('common.error'), t('errors.general'));
    } finally {
      setIsLoadingClub(false);
    }
  }, [clubId, t]);

  // Overall validation (for button state)
  // 🎯 [KIM FIX] Edit mode has relaxed validation - only name is required
  // Create mode requires name, address, and meetings
  const validate = useCallback(() => {
    console.log('🔍 VALIDATION DEBUG - Form Data:', {
      name: formData?.name,
      courtAddress: formData?.courtAddress,
      meetings: formData?.meetings,
      description: formData?.description,
      isEditMode,
    });

    // Name is always required
    if (!isNonEmpty(formData?.name)) {
      console.log('❌ VALIDATION FAILED: Club name is empty');
      return { ok: false, msg: t('createClub.validation.nameRequired') };
    }
    console.log('✅ Club name is valid:', formData.name);

    // 🎯 [KIM FIX] In edit mode, only require name - allow partial updates
    if (isEditMode) {
      console.log('🎉 EDIT MODE - Relaxed validation passed!');
      return { ok: true as const };
    }

    // Create mode: require address and meetings
    if (!isNonEmpty(formData?.courtAddress?.address)) {
      console.log('❌ VALIDATION FAILED: Court address is empty');
      return { ok: false, msg: t('createClub.validation.addressRequired') };
    }
    console.log('✅ Court address is valid:', formData.courtAddress?.address);

    const meetings = Array.isArray(formData?.meetings) ? formData.meetings : [];
    console.log('🔍 Meetings array:', meetings, 'length:', meetings.length);
    if (!meetings.length) {
      console.log('❌ VALIDATION FAILED: No meetings found');
      return { ok: false, msg: t('createClub.validation.meetingsRequired') };
    }
    console.log('✅ Meetings are valid:', meetings);

    if (isNonEmpty(formData?.description) && String(formData.description).trim().length < 5) {
      console.log('❌ VALIDATION FAILED: Description too short');
      return { ok: false, msg: t('createClub.validation.descShort') };
    }
    console.log('✅ Description is valid');

    console.log('🎉 ALL VALIDATION PASSED!');
    return { ok: true as const };
  }, [formData, isEditMode, t]);

  // 🎯 [KIM FIX] Direct save handler for back navigation (more reliable than beforeRemove)
  const handleBackWithSave = useCallback(async () => {
    if (!isEditMode || !clubId) {
      navigation.goBack();
      return;
    }

    // Already saved - just go back
    if (hasSavedRef.current) {
      navigation.goBack();
      return;
    }

    console.log('🔵 [CreateClubScreen] handleBackWithSave - saving before navigation...');

    // Validate before saving
    const v = validate();
    if (!v.ok) {
      console.log('⚠️ [CreateClubScreen] Validation failed:', v.msg);
      navigation.goBack();
      return;
    }

    try {
      hasSavedRef.current = true;

      // Prepare payload
      const facilities = Array.isArray(formData?.facilities) ? formData.facilities : [];
      const rules = formData?.rules?.trim().split('\n').filter(Boolean) || [];
      const meetings = Array.isArray(formData?.meetings) ? formData.meetings : [];

      // 💰 Auto-detect currency from court address country
      const courtCountry = formData.courtAddress?.country;
      const currencyInfo = getCurrencyByCountry(courtCountry);

      const payload = {
        name: String(formData.name).trim(),
        region: '',
        description: String(formData.description ?? '').trim(),
        isPublic: Boolean(formData.isPublic ?? true),
        logoUri: formData.logoUri ?? '',
        courtAddress: formData.courtAddress,
        joinFee: formData.joinFee,
        monthlyFee: formData.monthlyFee,
        yearlyFee: formData.yearlyFee,
        currency: currencyInfo.code,
        facilities,
        rules,
        meetings,
        updatedAt: new Date().toISOString(),
      };

      console.log('📝 [CreateClubScreen] Saving payload:', JSON.stringify(payload, null, 2));
      await clubService.updateClub(clubId, payload);
      console.log('✅ [CreateClubScreen] Auto-save completed successfully');
    } catch (error) {
      console.error('❌ [CreateClubScreen] Auto-save failed:', error);
      hasSavedRef.current = false;
    }

    navigation.goBack();
  }, [isEditMode, clubId, formData, validate, navigation]);

  // Meeting handlers
  const handleAddMeeting = useCallback(
    (meeting: Meeting) => {
      const meetings = Array.isArray(formData?.meetings) ? formData.meetings : [];
      updateFormData('meetings', [...meetings, meeting]);
    },
    [formData?.meetings, updateFormData]
  );

  const handleRemoveMeeting = useCallback(
    (index: number) => {
      const meetings = Array.isArray(formData?.meetings) ? formData.meetings : [];
      updateFormData(
        'meetings',
        meetings.filter((_, i) => i !== index)
      );
    },
    [formData?.meetings, updateFormData]
  );

  // Field-specific validation for real-time feedback
  const validateField = useCallback(
    (field: keyof typeof fieldValidation): { isValid: boolean; message: string } => {
      switch (field) {
        case 'name':
          if (!formData?.name?.trim()) {
            return { isValid: false, message: t('createClub.validation.nameRequired') };
          }
          if (formData.name.trim().length < 2) {
            return { isValid: false, message: t('createClub.validation.nameMin') };
          }
          if (formData.name.length > 30) {
            return { isValid: false, message: t('createClub.validation.nameMax') };
          }
          return { isValid: true, message: t('createClub.validation.nameValid') };

        case 'description':
          if (!formData?.description?.trim()) {
            return { isValid: false, message: t('createClub.validation.descRequired') };
          }
          if (formData.description.trim().length < 10) {
            return {
              isValid: false,
              message: t('createClub.validation.descMin', {
                count: formData.description.trim().length,
              }),
            };
          }
          if (formData.description.length > 200) {
            return { isValid: false, message: t('createClub.validation.descMax') };
          }
          return { isValid: true, message: t('createClub.validation.descValid') };

        case 'courtAddress':
          if (!formData?.courtAddress?.address?.trim()) {
            return { isValid: false, message: t('createClub.validation.addressRequired') };
          }
          return { isValid: true, message: t('createClub.validation.addressValid') };

        case 'meetings': {
          const meetings = Array.isArray(formData?.meetings) ? formData.meetings : [];
          if (meetings.length === 0) {
            return { isValid: false, message: t('createClub.validation.meetingsRequired') };
          }
          return {
            isValid: true,
            message: t('createClub.validation.meetingsValid', { count: meetings.length }),
          };
        }
        default:
          return { isValid: false, message: '' };
      }
    },
    [formData]
  );

  // Real-time validation updates
  useEffect(() => {
    const newValidation = {
      name: validateField('name'),
      description: validateField('description'),
      courtAddress: validateField('courtAddress'),
      meetings: validateField('meetings'),
    };

    setFieldValidation(newValidation);
  }, [formData, validateField]);

  // Create or Update club handler
  const handleCreate = useCallback(async () => {
    if (isLoading) return;
    Keyboard.dismiss();
    const v = validate();
    if (!v.ok) {
      Alert.alert(t('common.error'), v.msg);
      return;
    }

    try {
      setIsLoading(true);

      // 🚫 CLUB CREATION LIMIT CHECK (only for new clubs, not edit mode)
      if (!isEditMode) {
        const limitCheck = await clubService.getUserOwnedClubsCount();
        console.log('🏛️ [ClubLimit] Pre-check result:', limitCheck);

        if (!limitCheck.canCreate) {
          setIsLoading(false);
          Alert.alert(
            t('createClub.alerts.limitTitle'),
            t('createClub.alerts.limitMessage', {
              max: limitCheck.maxAllowed,
              current: limitCheck.count,
            }),
            [{ text: t('common.ok'), style: 'default' }],
            { cancelable: true }
          );
          return;
        }
      }
      const facilities = normalizeArray(formData?.facilities);
      const rules = normalizeMultiline(formData?.rules ?? '');
      const meetings = normalizeArray(formData?.meetings);

      // 💰 Auto-detect currency from court address country
      const courtCountry = formData.courtAddress?.country;
      const currencyInfo = getCurrencyByCountry(courtCountry);
      console.log('💰 [CreateClubScreen] Currency auto-detection:', {
        country: courtCountry,
        currencyCode: currencyInfo.code,
      });

      const payload = {
        name: String(formData.name).trim(),
        region: '', // Not used in current form
        description: String(formData.description ?? '').trim(),
        isPublic: Boolean(formData.isPublic ?? true),
        logoUri: formData.logoUri ?? '',
        courtAddress: formData.courtAddress,
        joinFee: formData.joinFee,
        monthlyFee: formData.monthlyFee,
        yearlyFee: formData.yearlyFee,
        // 💰 Currency code based on court location country
        currency: currencyInfo.code,
        facilities,
        rules,
        meetings,
        ...(isEditMode
          ? { updatedAt: new Date().toISOString() }
          : { createdAt: new Date().toISOString() }),
      };

      if (isEditMode && clubId) {
        // 🎯 Edit Mode: Update existing club
        console.log('📝 Updating club:', clubId, 'with payload:', payload);
        await clubService.updateClub(clubId, payload);
        console.log('✅ Club updated successfully');

        Alert.alert(
          t('createClub.alerts.saveSuccess'),
          t('createClub.alerts.saveSuccessMessage', { name: formData.name }),
          [{ text: t('common.ok'), style: 'default' }],
          { cancelable: true }
        );

        // Navigate back to club detail
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } else {
        // 🎯 Create Mode: Create new club
        const res = (await clubService.createClub(payload)) as
          | string
          | { id?: string; clubId?: string; docId?: string }
          | null;
        console.log('✅ CreateClub response:', res, 'type:', typeof res);

        // Handle different response types
        let newId: string | null = null;
        if (typeof res === 'string') {
          newId = res;
        } else if (res && typeof res === 'object') {
          newId = res.id || res.clubId || res.docId || null;
        }

        if (!newId) {
          console.error('❌ Unable to extract club ID from response:', res);
          throw new Error(
            '클럽 생성은 완료되었으나 ID를 확인할 수 없습니다. 내 클럽 목록을 확인해주세요.'
          );
        }

        console.log('✅ Club created successfully with ID:', newId);

        Alert.alert(
          t('createClub.alerts.createSuccess'),
          t('createClub.alerts.createSuccessMessage', { name: formData.name }),
          [{ text: t('common.ok'), style: 'default' }],
          { cancelable: true }
        );

        // Navigate to club detail
        setTimeout(() => {
          (navigation.navigate as (screen: string, params: unknown) => void)('ClubDetail', {
            clubId: newId,
            isNewClub: true,
            fallbackClub: {
              id: newId,
              name: formData.name,
              description: formData.description,
              location: '',
            },
          });
        }, 500);
      }
    } catch (e) {
      console.error('CreateClubScreen error:', e);
      const errorMessage = String((e as Error)?.message || e);
      Alert.alert(
        isEditMode ? t('createClub.alerts.saveFailed') : t('createClub.alerts.createFailed'),
        errorMessage,
        [{ text: t('common.ok'), style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, navigation, validate, t, isEditMode, clubId]);

  // Load club data on mount if editing
  useEffect(() => {
    if (isEditMode && clubId) {
      loadClubData();
    }
  }, [isEditMode, clubId, loadClubData]);

  // Handle location selection from navigation
  useEffect(() => {
    if (params?.selectedLocation) {
      updateFormData('courtAddress', params.selectedLocation);
      // 🎯 [KIM FIX] Reset saved flag when location changes
      // This allows beforeRemove to save again with the new address
      hasSavedRef.current = false;
      console.log('📍 [CreateClubScreen] Location updated, reset hasSavedRef');
    }
  }, [params?.selectedLocation, updateFormData]);

  // 🎯 [KIM FIX] Auto-save on back navigation for edit mode (like EditProfileScreen)
  useEffect(() => {
    if (!isEditMode) return; // Only for edit mode

    const unsubscribe = navigation.addListener(
      'beforeRemove',
      async (e: { preventDefault: () => void; data: { action: unknown } }) => {
        // Already saved - proceed with navigation
        if (hasSavedRef.current) {
          return;
        }

        // Prevent default back navigation
        e.preventDefault();

        console.log('🔵 [CreateClubScreen] beforeRemove triggered - auto saving...');

        try {
          // Validate before saving
          const v = validate();
          if (!v.ok) {
            console.log('⚠️ [CreateClubScreen] Validation failed, navigating back without save');
            // Don't set hasSavedRef.current = true here! Allow retry.
            // @ts-expect-error Navigation action type
            navigation.dispatch(e.data.action);
            return;
          }

          // 🎯 [KIM FIX] Only set saved flag AFTER validation passes (like EditProfileScreen)
          hasSavedRef.current = true;

          // Prepare payload
          const facilities = Array.isArray(formData?.facilities) ? formData.facilities : [];
          const rules = formData?.rules?.trim().split('\n').filter(Boolean) || [];
          const meetings = Array.isArray(formData?.meetings) ? formData.meetings : [];

          // 💰 Auto-detect currency from court address country
          const courtCountry = formData.courtAddress?.country;
          const currencyInfo = getCurrencyByCountry(courtCountry);

          const payload = {
            name: String(formData.name).trim(),
            region: '',
            description: String(formData.description ?? '').trim(),
            isPublic: Boolean(formData.isPublic ?? true),
            logoUri: formData.logoUri ?? '',
            courtAddress: formData.courtAddress,
            joinFee: formData.joinFee,
            monthlyFee: formData.monthlyFee,
            yearlyFee: formData.yearlyFee,
            currency: currencyInfo.code,
            facilities,
            rules,
            meetings,
            updatedAt: new Date().toISOString(),
          };

          console.log('📝 [CreateClubScreen] Auto-saving club:', clubId, 'with payload:', payload);
          await clubService.updateClub(clubId!, payload);
          console.log('✅ [CreateClubScreen] Auto-save completed successfully');

          // Navigate after save
          // @ts-expect-error Navigation action type
          navigation.dispatch(e.data.action);
        } catch (error) {
          console.error('❌ [CreateClubScreen] Auto-save failed:', error);
          hasSavedRef.current = false;
          // Navigate anyway even if save fails
          // @ts-expect-error Navigation action type
          navigation.dispatch(e.data.action);
        }
      }
    );

    return unsubscribe;
  }, [navigation, formData, validate, clubId, isEditMode]);

  // Loading state
  if (isLoadingClub) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary} />
          <Text style={styles.loadingText}>{t('createClub.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      {/* 🎯 [KIM FIX] Consistent header for both create and edit modes */}
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction
          onPress={isEditMode ? handleBackWithSave : () => navigation.goBack()}
          iconColor={colors.onSurface}
        />
        <Appbar.Content title={isEditMode ? t('createClub.editTitle') : t('createClub.title')} />
      </Appbar.Header>
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        {/* StatusBar now managed centrally by ThemeProvider */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            style={{ backgroundColor: colors.background }}
            keyboardShouldPersistTaps='handled'
          >
            {/* Modular Section Components */}
            <BasicInfoSection
              formData={formData}
              onFormChange={updateFormData}
              clubId={clubId}
              validation={fieldValidation}
            />

            <CourtAddressSection formData={formData} clubId={clubId} />

            <MeetingScheduleSection
              formData={formData}
              onAddMeeting={() => setShowMeetingModal(true)}
              onRemoveMeeting={handleRemoveMeeting}
            />

            {/* 🎯 [KIM FIX] Hide visibility settings in edit mode - accessible via ClubAdminScreen "클럽 공개 설정" */}
            {!isEditMode && (
              <VisibilitySettingsSection formData={formData} onFormChange={updateFormData} />
            )}

            {/* 🎯 [KIM FIX] Hide fees section in edit mode - accessible via ClubAdminScreen "회비 관리" */}
            {!isEditMode && <FeesSection formData={formData} onFormChange={updateFormData} />}

            <FacilitiesSection formData={formData} onFormChange={updateFormData} />

            <RulesSection formData={formData} onFormChange={updateFormData} />

            {/* Bottom spacing for sticky footer (only needed in create mode) */}
            {!isEditMode && <View style={{ height: 88 + Math.max(insets.bottom, 10) }} />}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* 🎯 [KIM FIX] Sticky Footer Button - Only show in create mode */}
        {!isEditMode && (
          <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            {(() => {
              const validation = validate();
              const isButtonDisabled = isLoading || validation.ok === false;
              console.log('🔘 BUTTON STATE:', {
                isLoading,
                validationOk: validation.ok,
                isDisabled: isButtonDisabled,
                validationMessage: validation.ok ? 'Valid' : validation.msg,
              });

              return (
                <Button
                  mode='contained'
                  onPress={handleCreate}
                  disabled={isButtonDisabled}
                  icon={
                    isLoading
                      ? undefined
                      : () => <MaterialCommunityIcons name='trophy' size={16} color='white' />
                  }
                  loading={isLoading}
                  contentStyle={styles.stickyContent}
                  theme={{ colors }}
                  labelStyle={{ color: 'white' }}
                >
                  {isLoading ? t('createClub.creating') : t('createClub.cta')}
                </Button>
              );
            })()}
          </View>
        )}

        {/* Meeting Schedule Modal */}
        <MeetingScheduleModal
          visible={showMeetingModal}
          onClose={() => setShowMeetingModal(false)}
          onAddMeeting={handleAddMeeting}
        />
      </SafeAreaView>
    </>
  );
}
