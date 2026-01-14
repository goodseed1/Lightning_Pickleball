# CreateClub Review Bundle

Generated: 20250817_131514

---

## src/screens/clubs/CreateClubScreen.tsx

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
  Keyboard,
  Pressable,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Text,
  Switch,
  List,
  ActivityIndicator,
  Chip,
  Surface,
  IconButton,
  useTheme,
  MD3LightTheme,
  Portal,
  Modal as PaperModal,
  HelperText,
  Avatar,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import SafeGooglePlacesAutocomplete from '../../components/common/SafeGooglePlacesAutocomplete';
import Section from '../../components/layout/Section';
import Field from '../../components/layout/Field';
import TwoColChips from '../../components/layout/TwoColChips';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  ClubDetail: { clubId: string };
  CreateClub: { clubId?: string; mode?: string };
  [key: string]: any;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Conditional image picker imports
let __ExpoImagePicker: any = null;
try {
  __ExpoImagePicker = require('expo-image-picker');
} catch (e) {}
let __RNImagePicker: any = null;
try {
  __RNImagePicker = require('react-native-image-picker');
} catch (e) {}

import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import clubService from '../../services/clubService';
import { normalizeMultiline, normalizeArray } from '../../utils/text';
import { sx } from '../../utils/safe';

// Light theme constants to override system dark mode
const LIGHT = {
  screen: '#F7F9FC',
  card: '#FFFFFF',
  border: 'rgba(0,0,0,0.06)',
  text: '#1F2937',
  hint: '#6B7280',
  // 🔧 undefined로 쓰이던 값을 명시적으로 정의 (여러 스타일에서 사용됨)
  cardVariant: '#F1F5F9',
};

// ---------- 공통 유틸 ----------
const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 2 },
  default: {},
});

function isNonEmpty(v: unknown) {
  return typeof v === 'string' ? v.trim().length > 0 : !!v;
}

interface ClubFormData {
  name: string;
  description: string;
  region: string;
  logoUri?: string;
  isPublic: boolean;
  facilities: string[];
  joinFee?: number;
  monthlyFee?: number;
  rules: string;
  courtAddress?: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    placeId?: string;
  };
  meetings: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

export default function CreateClubScreen() {
  // ✅ 안전한 theme/colors: PaperProvider 미마운트 시에도 MD3LightTheme로 폴백
  const theme = useTheme() as any; // from react-native-paper
  const defaultColors = {
    ...MD3LightTheme.colors,
    onPrimary: '#FFFFFF',
    onSurfaceVariant: '#6B7280',
    surfaceVariant: '#F3F4F6',
  };
  const colors = theme?.colors ? { ...defaultColors, ...theme.colors } : defaultColors;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background || '#F7F9FC' },
    scroll: { padding: 12, paddingBottom: 80, gap: 12 }, // Compact padding + space for sticky button
    input: {
      marginTop: 8, // Compact spacing
    },
    keyboardView: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 16, color: colors.onSurfaceVariant },

    // Fun logo styles
    logoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
      marginBottom: 6,
    },
    logoInner: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: '#EEF0FF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#D9DEFF',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      gap: 6,
    },
    logoText: {
      fontSize: 12,
      color: '#5E6AD2',
      fontWeight: '600',
    },

    // Compact text styles
    hintText: { color: colors.onSurfaceVariant || '#6B7280', fontSize: 11, marginTop: -4 },
    charCount: {
      textAlign: 'right',
      fontSize: 10,
      opacity: 0.6,
      marginTop: -6,
      color: colors.onSurfaceVariant,
    },

    // Compact chip grid (2 columns)
    facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    facilityChip: { minWidth: '45%', marginBottom: 4 },
    facilityChipSelected: { backgroundColor: colors.primary },

    // Meeting items
    meetingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceVariant,
      padding: 8,
      borderRadius: 6,
      marginBottom: 6,
    },
    meetingText: { fontSize: 14, color: colors.onSurface },
    addMeetingButton: {
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: colors.primary,
      marginTop: 8,
    },

    // Address display
    selectedAddress: {
      marginTop: 8,
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.surfaceVariant,
    },
    addressInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addressText: { flex: 1 },
    addressName: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
    addressFull: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },

    // Sticky footer
    stickyFooter: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 10,
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.outline || '#ddd',
      ...shadow,
    },

    // Modal styles (keep existing)
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      margin: 20,
      borderRadius: 12,
      padding: 20,
      maxWidth: 400,
      width: '90%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: colors.onSurface,
    },
    daySelector: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    dayChip: { marginRight: 4, marginBottom: 4 },
    timeSelector: { marginBottom: 20 },
    timeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceVariant,
      padding: 16,
      borderRadius: 8,
      marginVertical: 8,
    },
    timeLabel: { fontSize: 16, color: colors.onSurface },
    timeValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    cancelButton: { flex: 1 },
    saveButton: { flex: 1 },
  } as const);

  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { currentUser } = useAuth();

  // Google Places API key
  const googleApiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_IOS
      : process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_ANDROID;
  const hasPlacesKey = !!googleApiKey;

  const clubId = route.params?.clubId;
  const isEditMode = !!clubId;

  const { t } = useTranslation();

  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    description: '',
    region: '',
    logoUri: undefined,
    isPublic: true,
    facilities: [],
    joinFee: undefined,
    monthlyFee: undefined,
    rules: '',
    courtAddress: undefined,
    meetings: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingClub, setIsLoadingClub] = useState(false);

  // 정기 모임 모달 관련 상태
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    day: '토요일',
    startTime: new Date(),
    endTime: new Date(),
  });

  // 장소 검색 모달 상태
  const [showPlacesModal, setShowPlacesModal] = useState(false);

  // 안전한 배열 레퍼런스 (초기/비정상 데이터 대비)
  const facilitiesSafe = Array.isArray(formData?.facilities) ? formData.facilities : [];
  const meetingsSafe = Array.isArray(formData?.meetings) ? formData.meetings : [];

  // Load club data if in edit mode
  useEffect(() => {
    if (isEditMode && clubId) {
      loadClubData();
    }
  }, [isEditMode, clubId]);

  const loadClubData = async () => {
    if (!clubId) return;

    try {
      setIsLoadingClub(true);
      const clubData = await clubService.getClubDetails(clubId);

      if (clubData) {
        setFormData({
          name: clubData.name || '',
          description: clubData.description || '',
          region: clubData.region || '',
          logoUri: clubData.logoUri || undefined,
          isPublic: clubData.isPublic ?? true,
          facilities: clubData.facilities || [],
          joinFee: clubData.joinFee || undefined,
          monthlyFee: clubData.monthlyFee || undefined,
          rules: clubData.rules?.join('\n') || '',
          courtAddress: clubData.courtAddress || undefined,
          meetings: clubData.meetings || [],
        });
      }
    } catch (error: any) {
      console.error('Failed to load club data:', error);
      Alert.alert('오류', '클럽 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingClub(false);
    }
  };

  const updateFormData = <K extends keyof ClubFormData>(key: K, value: ClubFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Facility management
  const availableFacilities = [
    '실내 코트',
    '실외 코트',
    '주차장',
    '라커룸',
    '샤워실',
    '휴게실',
    '용품 대여',
    '음료 판매',
    '프로샵',
    '레슨 제공',
  ];

  const toggleFacility = (facility: string) => {
    const currentFacilities = facilitiesSafe;
    if (currentFacilities.includes(facility)) {
      updateFormData(
        'facilities',
        currentFacilities.filter(f => f !== facility)
      );
    } else {
      updateFormData('facilities', [...currentFacilities, facility]);
    }
  };

  // 정기 모임 관리
  const DAYS_OF_WEEK = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

  const addMeeting = () => {
    const startTimeStr = formatTime(newMeeting.startTime);
    const endTimeStr = formatTime(newMeeting.endTime);

    // 시간 검증
    if (newMeeting.startTime >= newMeeting.endTime) {
      Alert.alert('알림', '종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    const meeting = {
      day: newMeeting.day,
      startTime: startTimeStr,
      endTime: endTimeStr,
    };

    updateFormData('meetings', [...meetingsSafe, meeting]);
    setShowMeetingModal(false);
    resetNewMeeting();
  };

  const removeMeeting = (index: number) => {
    updateFormData(
      'meetings',
      meetingsSafe.filter((_, i) => i !== index)
    );
  };

  const resetNewMeeting = () => {
    const now = new Date();
    const startTime = new Date();
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date();
    endTime.setHours(11, 0, 0, 0);

    setNewMeeting({
      day: '토요일',
      startTime,
      endTime,
    });
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setNewMeeting(prev => ({ ...prev, startTime: selectedTime }));
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setNewMeeting(prev => ({ ...prev, endTime: selectedTime }));
    }
  };

  const pickClubLogo = async () => {
    try {
      // 권한(Expo Image Picker)
      if ((__ExpoImagePicker as any)?.requestMediaLibraryPermissionsAsync) {
        const { status } = await (__ExpoImagePicker as any).requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Media library permission was denied');
          return;
        }
      }
      const result = await __ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: __ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });
      const asset = Array.isArray(result?.assets) ? result.assets[0] : undefined;
      const uri = !result?.canceled && asset?.uri ? asset.uri : null;
      if (uri) setFormData(prev => ({ ...prev, logoUri: uri }));
    } catch (e) {
      console.error('Image picker error:', e);
    }
  };

  // 간단 유효성 검사 (코트 주소 필수 추가)
  const validate = useCallback(() => {
    if (!isNonEmpty(formData?.name)) return { ok: false, msg: '클럽 이름을 입력하세요.' };
    if (!formData?.courtAddress) return { ok: false, msg: '코트 주소를 선택하세요.' };
    // 설명은 선택이지만 있으면 너무 짧지 않게
    if (isNonEmpty(formData?.description) && String(formData.description).trim().length < 5) {
      return { ok: false, msg: '클럽 소개를 조금 더 자세히 작성해 주세요.' };
    }
    return { ok: true as const };
  }, [formData]);

  const handleCreate = useCallback(async () => {
    if (isLoading) return; // 중복 클릭 방지
    Keyboard.dismiss();
    const v = validate();
    if (!v.ok) {
      Alert.alert('입력 확인', v.msg);
      return;
    }
    try {
      setIsLoading(true);
      // 배열 필드/멀티라인 정규화(있다면)
      const facilities = normalizeArray<string>(formData?.facilities);
      const rules = normalizeMultiline((formData as any)?.rulesText ?? '');
      const meetings = normalizeArray<any>(formData?.meetings);

      const payload = {
        name: String(formData.name).trim(),
        region: String(formData.region).trim(),
        description: String(formData.description ?? '').trim(),
        isPublic: Boolean(formData.isPublic ?? true),
        logoUri: formData.logoUri ?? '',
        facilities,
        rules,
        meetings,
        createdAt: new Date().toISOString(),
      };

      const res = await clubService.createClub(payload);
      const newId =
        res && (res.id || (res as any).clubId || (res as any).docId)
          ? res.id || (res as any).clubId || (res as any).docId
          : null;
      if (!newId) throw new Error('클럽 ID를 확인할 수 없습니다.');

      (navigation as any).replace?.('ClubDetail', {
        clubId: newId,
        fallbackClub: { id: newId, ...payload },
      }) ||
        navigation.navigate('ClubDetail', {
          clubId: newId,
          fallbackClub: { id: newId, ...payload },
        });
    } catch (e) {
      console.error('CreateClubScreen createClub error:', e);
      Alert.alert('클럽 생성 실패', String((e as any)?.message || e));
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, navigation, validate]);

  // Show loading spinner when loading club data for edit
  if (isLoadingClub) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>클럽 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          style={{ backgroundColor: colors.background }}
          keyboardShouldPersistTaps='handled'
        >
          {/* 1. 기본 정보 (필수) - Always open for essential fields */}
          <Section
            title={t('createClub.basic_info')}
            requiredBadge={t('common.required')}
            icon={<MaterialCommunityIcons name='information' size={18} color='#007AFF' />}
            tone='blue'
            defaultExpanded
          >
            <Pressable style={styles.logoWrap} onPress={pickClubLogo}>
              {isUploading ? (
                <ActivityIndicator size='small' color={colors.primary} />
              ) : formData.logoUri ? (
                <Avatar.Image size={64} source={{ uri: formData.logoUri }} />
              ) : (
                <View style={styles.logoInner}>
                  <MaterialCommunityIcons name='camera' size={22} color='#5E6AD2' />
                  <Text style={styles.logoText}>{t('createClub.fields.logo')}</Text>
                </View>
              )}
            </Pressable>

            <TextInput
              dense
              mode='outlined'
              label={t('createClub.fields.name')}
              value={formData.name}
              onChangeText={text => updateFormData('name', text)}
              placeholder='예: 둘루스 한인 피클볼 클럽'
              maxLength={30}
              style={styles.input}
            />

            <TextInput
              dense
              mode='outlined'
              label={t('createClub.fields.intro')}
              value={formData.description}
              onChangeText={text => updateFormData('description', text)}
              multiline
              numberOfLines={3}
              placeholder='아틀란타 메트로 한인 피클볼 클럽의 목표, 분위기, 특징 등을 소개해주세요'
              maxLength={200}
              style={styles.input}
              right={<TextInput.Affix text={`${formData.description.length}/200`} />}
            />
          </Section>

          {/* 2. 코트 주소 (필수) */}
          <Section
            title={t('createClub.court_address')}
            requiredBadge={t('common.required')}
            icon={<MaterialCommunityIcons name='map-marker' size={18} color='#FF3B30' />}
            tone='red'
          >
            <TouchableOpacity onPress={() => hasPlacesKey && setShowPlacesModal(true)}>
              <TextInput
                dense
                mode='outlined'
                label='피클볼 코트 주소'
                value={formData.courtAddress?.address || ''}
                placeholder={t('createClub.fields.address_placeholder')}
                editable={false}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon='magnify'
                    onPress={() => hasPlacesKey && setShowPlacesModal(true)}
                  />
                }
              />
            </TouchableOpacity>

            <HelperText
              type={!formData.courtAddress ? 'error' : 'info'}
              visible={!formData.courtAddress}
            >
              {t('createClub.errors.address_required')}
            </HelperText>

            {formData.courtAddress && (
              <Surface style={styles.selectedAddress}>
                <View style={styles.addressInfo}>
                  <MaterialCommunityIcons name='map-marker' size={16} color={colors.primary} />
                  <View style={styles.addressText}>
                    <Text style={styles.addressName}>{formData.courtAddress.name}</Text>
                    <Text style={styles.addressFull}>{formData.courtAddress.address}</Text>
                  </View>
                  <IconButton
                    icon='close'
                    size={16}
                    onPress={() => updateFormData('courtAddress', undefined)}
                  />
                </View>
              </Surface>
            )}
          </Section>

          {/* 3. 정기 모임 */}
          <Section
            title={t('createClub.regular_meet')}
            icon={<MaterialCommunityIcons name='calendar' size={18} color='#34C759' />}
            tone='green'
          >
            {meetingsSafe.length > 0 && (
              <View>
                {meetingsSafe.map((meeting, index) => (
                  <View key={index} style={styles.meetingItem}>
                    <Text style={styles.meetingText}>
                      {meeting.day} {meeting.startTime} ~ {meeting.endTime}
                    </Text>
                    <IconButton icon='close' size={16} onPress={() => removeMeeting(index)} />
                  </View>
                ))}
              </View>
            )}

            <Button
              mode='outlined'
              onPress={() => setShowMeetingModal(true)}
              style={styles.addMeetingButton}
              icon='plus'
              compact
            >
              정기 모임 시간 추가
            </Button>
          </Section>

          {/* 4. 공개 설정 */}
          <Section
            title={t('createClub.visibility')}
            icon={
              formData.isPublic ? (
                <MaterialCommunityIcons name='earth' size={18} color='#0A84FF' />
              ) : (
                <MaterialCommunityIcons name='lock' size={18} color='#8E8E93' />
              )
            }
            tone='violet'
          >
            <TwoColChips
              options={[
                { key: 'public', label: t('createClub.visibility_public') },
                { key: 'private', label: t('createClub.visibility_private') },
              ]}
              values={[formData.isPublic ? 'public' : 'private']}
              single
              onChange={vals => updateFormData('isPublic', vals[0] === 'public')}
            />
            <HelperText type='info' style={styles.hintText}>
              공개 클럽은 다른 사용자가 검색하고 가입 신청할 수 있습니다.
            </HelperText>
          </Section>

          {/* 5. 비용 정보 */}
          <Section
            title={t('createClub.fees')}
            icon={<MaterialCommunityIcons name='currency-usd' size={18} color='#FF9F0A' />}
            tone='yellow'
          >
            <TextInput
              dense
              mode='outlined'
              keyboardType='numeric'
              label={t('createClub.fields.fee')}
              value={formData.joinFee ? formData.joinFee.toString() : ''}
              onChangeText={text => {
                const value = text.replace(/[^0-9]/g, '');
                updateFormData('joinFee', value ? parseInt(value) : undefined);
              }}
              placeholder='예: 50'
              style={styles.input}
            />
          </Section>

          {/* 6. 시설 정보 */}
          <Section
            title={t('createClub.facilities')}
            icon={<MaterialCommunityIcons name='office-building' size={18} color='#5856D6' />}
            tone='indigo'
          >
            <TwoColChips
              options={[
                { key: 'lights', label: t('createClub.facility.lights') },
                { key: 'indoor', label: t('createClub.facility.indoor') },
                { key: 'parking', label: t('createClub.facility.parking') },
                { key: 'ballmachine', label: t('createClub.facility.ballmachine') },
                { key: 'locker', label: t('createClub.facility.locker') },
                { key: 'proshop', label: t('createClub.facility.proshop') },
              ]}
              values={facilitiesSafe}
              onChange={vals => updateFormData('facilities', vals)}
            />
          </Section>

          {/* 7. 클럽 규칙 */}
          <Section
            title={t('createClub.rules')}
            icon={<MaterialCommunityIcons name='file-document-outline' size={18} color='#FF3B30' />}
            tone='rose'
          >
            <TextInput
              dense
              mode='outlined'
              label={t('createClub.fields.rules')}
              value={formData.rules}
              onChangeText={text => updateFormData('rules', text)}
              style={styles.input}
              multiline
              numberOfLines={4}
              placeholder='예:&#10;• 정기 모임 참석률 70% 이상 유지&#10;• 상호 예의와 배려&#10;• 시설 이용 후 정리정돈'
              maxLength={500}
            />
          </Section>

          {/* Scroll 하단 여백(고정 버튼과 겹침 방지) */}
          <View style={{ height: 88 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Footer Button (disabled when validation fails) */}
      <View style={styles.stickyFooter}>
        <Button
          mode='contained'
          onPress={handleCreate}
          disabled={isLoading || validate().ok === false}
          icon={
            isLoading
              ? undefined
              : () => <MaterialCommunityIcons name='trophy' size={16} color='#fff' />
          }
          loading={isLoading}
          contentStyle={styles.stickyContent}
        >
          {isLoading ? '만드는 중…' : t('createClub.cta')}
        </Button>
      </View>

      {/* Places Search Modal - Renders outside ScrollView to avoid nested VirtualizedList */}
      <Portal>
        <PaperModal
          visible={showPlacesModal}
          onDismiss={() => setShowPlacesModal(false)}
          contentContainerStyle={{
            backgroundColor: colors.surface || 'white',
            margin: 16,
            padding: 16,
            borderRadius: 12,
            maxHeight: '85%',
          }}
        >
          <Title style={{ marginBottom: 16 }}>피클볼 코트 주소 검색</Title>

          <SafeGooglePlacesAutocomplete
            placeholder='피클볼 코트 주소를 검색하세요'
            onPress={(data, details) => {
              const locationData = {
                name: data.structured_formatting?.main_text || data.description || '',
                address: details?.formatted_address || data.description || '',
                coordinates: details?.geometry?.location
                  ? {
                      lat: details.geometry.location.lat,
                      lng: details.geometry.location.lng,
                    }
                  : undefined,
                placeId: data.place_id,
              };
              updateFormData('courtAddress', locationData);
              setShowPlacesModal(false);
            }}
            query={{
              key: googleApiKey,
              language: 'en',
              types: 'establishment',
            }}
            fetchDetails={true}
            enablePoweredByContainer={false}
            debounce={300}
            minLength={2}
            listViewProps={{
              nestedScrollEnabled: true,
              keyboardShouldPersistTaps: 'handled',
            }}
            styles={{
              container: {
                flex: 0,
              },
              textInputContainer: {
                backgroundColor: 'transparent',
                borderTopWidth: 0,
                borderBottomWidth: 1,
                borderBottomColor: colors.outline || '#ddd',
                marginBottom: 8,
              },
              textInput: {
                backgroundColor: colors.surfaceVariant || '#f5f5f5',
                borderRadius: 4,
                color: colors.onSurface || '#333',
                fontSize: 16,
                height: 48,
                paddingHorizontal: 12,
              },
              listView: {
                backgroundColor: colors.surface || 'white',
                borderRadius: 4,
                maxHeight: 300,
              },
              row: {
                backgroundColor: colors.surface || 'white',
                paddingVertical: 12,
                paddingHorizontal: 16,
              },
              separator: {
                height: StyleSheet.hairlineWidth,
                backgroundColor: colors.outline || '#ddd',
              },
              description: {
                color: colors.onSurface || '#333',
                fontSize: 14,
              },
            }}
          />

          <Button mode='text' onPress={() => setShowPlacesModal(false)} style={{ marginTop: 16 }}>
            취소
          </Button>
        </PaperModal>
      </Portal>

      {/* 정기 모임 추가 모달 */}
      <Modal
        visible={showMeetingModal}
        animationType='slide'
        transparent={true}
        onRequestClose={() => setShowMeetingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>정기 모임 시간 추가</Text>

            {/* 요일 선택 */}
            <Text style={styles.timeLabel}>요일 선택</Text>
            <View style={styles.daySelector}>
              {DAYS_OF_WEEK.map(day => (
                <Chip
                  key={day}
                  mode={newMeeting.day === day ? 'flat' : 'outlined'}
                  selected={newMeeting.day === day}
                  onPress={() => setNewMeeting(prev => ({ ...prev, day }))}
                  style={styles.dayChip}
                >
                  {day}
                </Chip>
              ))}
            </View>

            {/* 시간 선택 */}
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>모임 시간</Text>

              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timeLabel}>시작 시간</Text>
                <Text style={styles.timeValue}>{formatTime(newMeeting.startTime)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timeLabel}>종료 시간</Text>
                <Text style={styles.timeValue}>{formatTime(newMeeting.endTime)}</Text>
              </TouchableOpacity>
            </View>

            {/* 액션 버튼 */}
            <View style={styles.modalActions}>
              <Button
                mode='outlined'
                onPress={() => setShowMeetingModal(false)}
                style={styles.cancelButton}
              >
                취소
              </Button>
              <Button mode='contained' onPress={addMeeting} style={styles.saveButton}>
                추가
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* 시작 시간 피커 */}
      {showStartTimePicker && (
        <DateTimePicker
          value={newMeeting.startTime}
          mode='time'
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartTimeChange}
        />
      )}

      {/* 종료 시간 피커 */}
      {showEndTimePicker && (
        <DateTimePicker
          value={newMeeting.endTime}
          mode='time'
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndTimeChange}
        />
      )}
    </SafeAreaView>
  );
}
```

---

## src/components/layout/Section.tsx

```tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  title: string;
  requiredBadge?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: string;
};

export default function Section({
  title,
  requiredBadge,
  defaultExpanded,
  children,
  icon,
  tone,
}: Props) {
  const [expanded, setExpanded] = useState(!!defaultExpanded);

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded(v => !v)}>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-down' : 'chevron-right'}
          size={16}
          color='#666'
        />
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={styles.title}>{title}</Text>
        {requiredBadge ? <Text style={styles.badge}>{requiredBadge}</Text> : null}
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  iconContainer: {
    marginLeft: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B00020',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F1C5C5',
    borderRadius: 999,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
  },
});
```
