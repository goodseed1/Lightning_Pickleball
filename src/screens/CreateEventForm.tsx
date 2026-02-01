/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Platform,
  Image,
} from 'react-native';
import * as Localization from 'expo-localization';
import * as SMS from 'expo-sms';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import { CreationStackParamList } from '../navigation/CreationNavigator';
import ParticipantSelector from '../components/common/ParticipantSelector';
import activityService from '../services/activityService';
import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { convertEloToLtr } from '../utils/lprUtils';
import { formatDistance } from '../utils/unitUtils';
import { useLocation } from '../contexts/LocationContext';
import { getCurrencySymbolByCountry } from '../utils/currencyUtils';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';
import { ActivityIndicator, FlatList } from 'react-native';
import { LocationData } from '../types/mapTypes';

type NavigationProp = NativeStackNavigationProp<CreationStackParamList, 'CreateEventForm'>;
type RoutePropType = RouteProp<CreationStackParamList, 'CreateEventForm'>;

/**
 * Extended LocationData with optional name field for display
 */
interface ExtendedLocationData extends LocationData {
  name?: string;
  formatted_address?: string;
  types?: string[];
}

/**
 * Extended Event Data with additional optional fields for form
 */
interface EventData {
  title: string;
  description?: string;
  ltrLevel?: string | string[];
  skillLevel?: string;
  ltrLevels?: string[];
  languages: string[];
  autoApproval: boolean;
  participationFee?: number | string;
  gameType: string;
  scheduledTime?: Date | string;
  maxParticipants?: number;
  location?: ExtendedLocationData | string;
  locationDetails?: ExtendedLocationData | null;
  invitedFriends: string[];
  smsInvites: string[];
}

/**
 * 🛡️ [OPERATION AUTOMATED FAIRNESS] User with NTRP data interface
 */
interface UserWithNtrp {
  profile?: {
    ltrLevel?: string;
  };
  ltrLevel?: string;
  skillLevel?: {
    selfAssessed?: string;
    calculated?: number;
  };
}

const CreateEventForm = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { eventType, editEvent, selectedLocation } = route.params;
  const { t, currentLanguage } = useLanguage();
  const { currentUser } = useAuth();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors as unknown as Record<string, string>);

  // 🌍 [KIM FIX] Get user's country for distance unit display
  const userCountry = currentUser?.profile?.location?.country;

  // 💰 [CURRENCY] Get user's GPS location for currency display
  const { location: gpsLocation } = useLocation();
  const currencySymbol = getCurrencySymbolByCountry(gpsLocation?.country);

  // Enhanced edit mode detection
  const isEditMode = Boolean(editEvent);

  // ✅ 강화된 초기 데이터 설정 (수정 모드 지원)
  const getInitialFormData = () => {
    if (isEditMode && editEvent) {
      // NTRP 레벨 파싱 (쉼표로 구분된 문자열을 배열로 변환)
      let parsedLtrLevels: string[] = [];
      if (editEvent.ltrLevel) {
        if (typeof editEvent.ltrLevel === 'string') {
          parsedLtrLevels = editEvent.ltrLevel
            .split(',')
            .map((level: string) => level.trim())
            .filter(Boolean);
        } else if (Array.isArray(editEvent.ltrLevel)) {
          parsedLtrLevels = editEvent.ltrLevel;
        }
      }

      // 레거시 skillLevel 지원
      if (parsedLtrLevels.length === 0 && editEvent.skillLevel) {
        const skillLevelMapping: { [key: string]: string } = {
          Beginner: '1.0-2.5',
          Novice: '1.0-2.5',
          Intermediate: '3.0-3.5',
          Advanced: '4.0-4.5',
          Expert: '5.0+',
          Professional: '5.0+',
          'Any Level': 'any',
          [t('createEvent.skillLevelOptions.anyLevel')]: 'any',
        };
        const mappedLevel = skillLevelMapping[editEvent.skillLevel];
        if (mappedLevel) {
          parsedLtrLevels = [mappedLevel];
        }
      }

      // This return was unreachable - removed

      const editLocation =
        typeof editEvent.location === 'string'
          ? editEvent.location
          : (editEvent.location as ExtendedLocationData | undefined);
      const selectedLoc = selectedLocation as ExtendedLocationData | undefined;

      return {
        title: editEvent.title || '',
        description: editEvent.description || '',
        location:
          (editLocation && typeof editLocation === 'object'
            ? editLocation.name || editLocation.address
            : editLocation) ||
          selectedLoc?.name ||
          selectedLoc?.address ||
          '',
        locationDetails:
          (editLocation && typeof editLocation === 'object' ? editLocation : null) ||
          selectedLoc ||
          null,
        skillLevel: editEvent.skillLevel || '', // 레거시 지원
        gameType: editEvent.gameType || '',
        ltrLevels: parsedLtrLevels,
        languages: Array.isArray(editEvent.languages) ? editEvent.languages : [],
        autoApproval: Boolean(editEvent.autoApproval),
        participationFee: editEvent.participationFee ? String(editEvent.participationFee) : '',
        invitedFriends: Array.isArray(editEvent.invitedFriends) ? editEvent.invitedFriends : [],
        smsInvites: Array.isArray(editEvent.smsInvites) ? editEvent.smsInvites : [],
      } as EventData;
    }

    // 생성 모드 기본값
    // 🎯 [KIM FIX] Meetups default to "any" (실력 무관), matches default to empty
    const defaultLtrLevels = eventType === 'meetup' ? ['any'] : [];
    // 🎯 [KIM FIX] Meetups default to "rally" (랠리/연습), matches default to empty
    const defaultGameType = eventType === 'meetup' ? 'rally' : '';

    const selectedLoc = selectedLocation as ExtendedLocationData | undefined;

    return {
      title: '',
      description: '',
      location: selectedLoc?.name || selectedLoc?.address || '', // 🎯 "마스터 키": name 필드 우선 처리
      locationDetails: selectedLoc || null,
      skillLevel: '',
      gameType: defaultGameType,
      ltrLevels: defaultLtrLevels as string[],
      languages: [] as string[],
      autoApproval: false,
      participationFee: '',
      invitedFriends: [] as string[],
      smsInvites: [] as string[],
    } as EventData;
  };

  const [formData, setFormData] = useState(getInitialFormData());

  // 🎯 [FOCUS MANAGEMENT] Ref for title input to enable programmatic focus
  const titleInputRef = useRef<TextInput>(null);

  // 🎯 [STALE CLOSURE FIX v3] Ref to always hold the latest searchFriendsToInvite function
  const searchFriendsToInviteRef =
    useRef<((searchText?: string, gameTypeParam?: string) => Promise<void>) | undefined>(undefined);

  // ✅ 날짜/시간 관련 상태 (수정 모드 지원)
  const getInitialDate = () => {
    if (isEditMode && editEvent?.scheduledTime) {
      return new Date(editEvent.scheduledTime);
    }
    return new Date();
  };
  const [selectedDate, setSelectedDate] = useState(getInitialDate());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  // 🎯 [KIM FIX] Android에서 날짜와 시간 picker를 분리하기 위한 state
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // ✅ 참가자 수 관련 상태 (수정 모드 지원)
  const getInitialMaxParticipants = () => {
    if (isEditMode && editEvent?.maxParticipants) {
      return editEvent.maxParticipants;
    }
    return eventType === 'match' ? 2 : 4;
  };
  const [maxParticipants, setMaxParticipants] = useState<number>(getInitialMaxParticipants());

  // 추가 상태들
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFriendInviteModal, setShowFriendInviteModal] = useState(false);
  const [showSMSInviteModal, setShowSMSInviteModal] = useState(false);
  const [tempSMSNumber, setTempSMSNumber] = useState('');

  // Partner selection state (for doubles matches)
  const [hostPartnerId, setHostPartnerId] = useState<string>('');
  const [hostPartnerName, setHostPartnerName] = useState<string>('');
  const [hostPartnerLtr, setHostPartnerLtr] = useState<number>(5); // LPR default (1-10 scale)
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [users, setUsers] = useState<
    Array<{
      id: string;
      displayName: string;
      email: string;
      ltrLevel?: string;
      gender?: string;
      photoURL?: string;
      distance?: number; // 🎯 [KIM FIX] Distance in km for sorting
    }>
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 🎯 Friend invite state
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState<
    Array<{
      id: string;
      displayName: string;
      email: string;
      ltrLevel?: string;
      gender?: string;
      photoURL?: string;
      distance?: number; // 🎯 [KIM FIX] Distance in km for sorting
    }>
  >([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<
    Array<{ id: string; displayName: string; ltrLevel?: string }>
  >([]);

  // 🔄 [SAVE LOADING] Save button loading state
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Update location when returning from LocationSearchScreen (수정 모드에서도 작동)
  useEffect(() => {
    if (selectedLocation && !isEditMode) {
      const selectedLoc = selectedLocation as ExtendedLocationData;
      // 생성 모드에서만 위치 자동 업데이트
      setFormData(prev => ({
        ...prev,
        location: selectedLoc.name || selectedLoc.address, // 🎯 "마스터 키": name 필드 우선 처리
        locationDetails: selectedLoc,
      }));
    } else if (selectedLocation && isEditMode) {
      const selectedLoc = selectedLocation as ExtendedLocationData;
      // 수정 모드에서는 사용자가 명시적으로 위치를 변경한 경우에만 업데이트
      setFormData(prev => ({
        ...prev,
        location: selectedLoc.name || selectedLoc.address, // 🎯 "마스터 키": name 필드 우선 처리
        locationDetails: selectedLoc,
      }));
    }
  }, [selectedLocation, isEditMode]);

  // ✅ 수정 모드 데이터 재초기화 (editEvent 변경 시)
  useEffect(() => {
    if (isEditMode && editEvent) {
      const newFormData = getInitialFormData();
      setFormData(newFormData);
      setSelectedDate(getInitialDate());
      setMaxParticipants(getInitialMaxParticipants());
    }
  }, [editEvent, isEditMode, getInitialDate, getInitialFormData, getInitialMaxParticipants]);

  const isMatch = eventType === 'match';
  const isDoublesMatch =
    formData.gameType === 'mixed_doubles' ||
    formData.gameType === 'mens_doubles' ||
    formData.gameType === 'womens_doubles';
  // 🎯 [FRIEND INVITE] Singles match check - friend invite only available for singles
  const isSinglesMatch =
    formData.gameType === 'mens_singles' || formData.gameType === 'womens_singles';

  // 🎯 [KIM FIX] Helper to get translated game type label (handles empty string case)
  const getGameTypeLabel = (gameType: string): string => {
    if (!gameType) return '';
    // Map snake_case game types to translation keys
    const gameTypeMap: Record<string, string> = {
      mens_singles: 'singles',
      womens_singles: 'singles',
      mens_doubles: 'doubles',
      womens_doubles: 'doubles',
      mixed_doubles: 'mixed',
      rally: 'rally',
    };
    const key = gameTypeMap[gameType] || gameType;
    return t(`createEvent.gameTypes.${key}`);
  };
  // 🎯 [KIM FIX] Friend invite available for: singles matches + all meetups (not doubles matches)
  const canInviteFriends = isSinglesMatch || !isMatch;
  const icon = isMatch ? '🏆' : '😊';
  const typeLabel = isMatch
    ? t('createEvent.eventType.lightningMatch')
    : t('createEvent.eventType.lightningMeetup');

  // 🎯 [KIM FIX] Phone number placeholder based on device locale/region
  const phonePlaceholder = useMemo(() => {
    try {
      const locales = Localization.getLocales();
      const regionCode = locales?.[0]?.regionCode?.toUpperCase();
      // Korean region: use Korean phone format
      if (regionCode === 'KR') {
        return t('createEvent.phone.placeholderKR');
      }
      // US/Canada region: use US phone format
      if (regionCode === 'US' || regionCode === 'CA') {
        return t('createEvent.phone.placeholderUS');
      }
      // Default: international format
      return t('createEvent.phone.placeholderIntl');
    } catch {
      return t('createEvent.phone.placeholderIntl');
    }
  }, [t]);

  // 🎯 [OPERATION DUO - PHASE 4.5 PART 2] Gender-based game type restrictions
  const userGender = currentUser?.profile?.gender;

  // 🎯 [KIM FIX] Check if user has a specific gender (male/female)
  const specificGenders = [
    'male',
    'female',
    t('createEvent.genders.male'),
    t('createEvent.genders.female'),
  ];
  const userHasSpecificGender = userGender && specificGenders.includes(userGender.toLowerCase());

  const isGameTypeDisabled = (gameType: string): boolean => {
    // 🎯 [KIM FIX] No restrictions if gender is not male/female (기타 성별은 모든 게임 타입 가능)
    if (!userHasSpecificGender) {
      return false;
    }

    const normalizedGender = userGender?.toLowerCase();
    if (
      normalizedGender === 'male' ||
      normalizedGender === t('createEvent.genders.male').toLowerCase()
    ) {
      return gameType === 'womens_singles' || gameType === 'womens_doubles';
    }

    if (
      normalizedGender === 'female' ||
      normalizedGender === t('createEvent.genders.female').toLowerCase()
    ) {
      return gameType === 'mens_singles' || gameType === 'mens_doubles';
    }

    return false;
  };

  // 🎯 [OPERATION DUO - PHASE 4.5 PART 2] Calculate gender filter based on game type
  // Used for both partner selection AND friend invite
  const getPartnerGenderFilter = (overrideGameType?: string): 'male' | 'female' | null => {
    const gameType = overrideGameType || formData.gameType;
    const hostGender = userGender;

    // 🎯 [KIM FIX] No gender filter if host gender is not male/female (모든 성별의 파트너 선택 가능)
    if (!userHasSpecificGender) {
      return null;
    }

    // 🎯 [KIM FIX] Singles games - filter by game type gender
    if (gameType === 'mens_singles') return 'male';
    if (gameType === 'womens_singles') return 'female';

    // 🎯 Doubles games
    if (gameType === 'mens_doubles') return 'male';
    if (gameType === 'womens_doubles') return 'female';
    if (gameType === 'mixed_doubles') {
      const normalizedGender = hostGender?.toLowerCase();
      if (
        normalizedGender === 'male' ||
        normalizedGender === t('createEvent.genders.male').toLowerCase()
      )
        return 'female';
      if (
        normalizedGender === 'female' ||
        normalizedGender === t('createEvent.genders.female').toLowerCase()
      )
        return 'male';
    }

    return null; // No filter for unknown game types
  };

  // LPR 레벨 비교 함수 (1-10 스케일)
  // 🎯 [KIM FIX v16] Return LPR scale (1-10)
  const getLtrLevel = (ntrpString: string): number => {
    if (ntrpString === '1.0-2.5') return 3; // Beginner → LPR 3
    if (ntrpString === '3.0-3.5') return 5; // Intermediate → LPR 5
    if (ntrpString === '4.0-4.5') return 7; // Advanced → LPR 7
    if (ntrpString === '5.0+') return 9; // Expert → LPR 9
    if (ntrpString === 'any') return 0; // '실력 무관'은 가장 낮은 값으로 처리

    // 개별 값인 경우 (예: '3.5', '4.0')
    const numLevel = parseFloat(ntrpString);
    return isNaN(numLevel) ? 0 : numLevel;
  };

  // 🎯 [KIM FIX] 호스트의 LPR 레벨 계산 함수 (게임 타입별 ELO 기반, 1-10 정수)
  // 🎯 [STALE CLOSURE FIX] Accept optional gameType parameter to avoid stale closure issues
  const getHostLtrLevel = (gameTypeOverride?: string): number => {
    if (!currentUser) return 5; // LPR default

    const userAny = currentUser as unknown as Record<string, unknown>;
    // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
    const eloRatings = userAny.eloRatings as
      | {
          singles?: { current?: number };
          doubles?: { current?: number };
          mixed?: { current?: number };
        }
      | undefined;

    // 🎯 [STALE CLOSURE FIX] Use passed gameType or fall back to formData.gameType
    const currentGameType = gameTypeOverride || formData.gameType;

    // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
    // 🔍 DEBUG: Log all ELO values
    console.log('🔍 [getHostLtrLevel] DEBUG:', {
      currentGameType,
      eloRatings: {
        singles: eloRatings?.singles?.current,
        doubles: eloRatings?.doubles?.current,
        mixed: eloRatings?.mixed?.current,
      },
    });

    // 게임 타입에 맞는 ELO 선택 (eloRatings만 사용!)
    let targetElo: number | null = null;

    if (currentGameType === 'mens_singles' || currentGameType === 'womens_singles') {
      targetElo = eloRatings?.singles?.current || null;
    } else if (currentGameType === 'mens_doubles' || currentGameType === 'womens_doubles') {
      targetElo = eloRatings?.doubles?.current || null;
    } else if (currentGameType === 'mixed_doubles') {
      targetElo = eloRatings?.mixed?.current || null;
    } else {
      // 게임 타입이 선택되지 않은 경우, 가장 높은 ELO 사용
      const singlesElo = eloRatings?.singles?.current || null;
      const doublesElo = eloRatings?.doubles?.current || null;
      const mixedElo = eloRatings?.mixed?.current || null;
      const eloValues = [singlesElo, doublesElo, mixedElo].filter(
        (elo): elo is number => elo !== null && elo !== undefined && elo > 0
      );
      if (eloValues.length > 0) {
        targetElo = Math.max(...eloValues);
      }
    }

    console.log(
      '🔍 [getHostLtrLevel] Selected targetElo:',
      targetElo,
      'for gameType:',
      currentGameType
    );

    if (targetElo && targetElo > 0) {
      const ltr = convertEloToLtr(targetElo);
      console.log('🔍 [getHostLtrLevel] Converted LPR:', ltr);
      return ltr;
    }

    // Fallback
    const skillLevel = (currentUser as unknown as UserWithNtrp)?.skillLevel;
    console.log('🔍 [getHostLtrLevel] Fallback skillLevel:', skillLevel);
    if (typeof skillLevel === 'number') return skillLevel;
    if (skillLevel?.calculated) return skillLevel.calculated;

    return 5; // LPR default (1-10 scale)
  };

  // NTRP 레벨이 선택 가능한지 확인하는 함수
  const isLtrLevelSelectable = (levelKey: string): boolean => {
    if (!isMatch) return true; // 모임은 모든 레벨 선택 가능

    const levelValue = getLtrLevel(levelKey);

    // '실력 무관'은 매치에서 비활성화
    if (levelKey === 'any') return false;

    // 호스트보다 낮은 레벨은 비활성화
    const hostLtrLevel = getHostLtrLevel();
    return levelValue >= hostLtrLevel;
  };

  // 게임 타입에 따른 참가자 수 자동 계산
  const getParticipantCountFromGameType = (gameType: string): number => {
    switch (gameType) {
      case 'mens_singles':
      case 'womens_singles':
        return 2; // 단식은 2명
      case 'mens_doubles':
      case 'womens_doubles':
      case 'mixed_doubles':
        return 4; // 복식은 4명
      default:
        return 4; // 기본값 (랠리/연습 등은 수동 선택 유지)
    }
  };

  // 날짜/시간 형식화 함수
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return t('createEvent.dateFormat', { year, month, day, hours, minutes });
  };

  /**
   * 🎯 [KIM FIX] Extract LPR from user profile based on game type
   * Uses game-type-specific ELO: singles → singles ELO, doubles → doubles ELO, mixed → mixed ELO
   * Returns LPR (1-10 integer scale)
   * @deprecated Use ltrLevel string extraction in handleSelectPartner instead
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const extractLtr = (user: UserWithNtrp | null | undefined, gameTypeOverride?: string): number => {
    if (!user) {
      return 5; // LPR default (1-10 scale)
    }

    // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
    const userAny = user as unknown as Record<string, unknown>;
    const eloRatings = userAny.eloRatings as
      | {
          singles?: { current?: number };
          doubles?: { current?: number };
          mixed?: { current?: number };
        }
      | undefined;

    // 현재 선택된 게임 타입 사용 (override가 있으면 override 사용)
    const currentGameType = gameTypeOverride || formData.gameType;

    // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
    let targetElo: number | null = null;

    if (currentGameType === 'mens_singles' || currentGameType === 'womens_singles') {
      targetElo = eloRatings?.singles?.current || null;
    } else if (currentGameType === 'mens_doubles' || currentGameType === 'womens_doubles') {
      targetElo = eloRatings?.doubles?.current || null;
    } else if (currentGameType === 'mixed_doubles') {
      targetElo = eloRatings?.mixed?.current || null;
    }

    // ELO가 있으면 LPR로 변환 (1-10 integer)
    if (targetElo && targetElo > 0) {
      return convertEloToLtr(targetElo);
    }

    // 🎯 [KIM FIX v4] Fallback: profile.ltrLevel (사용자가 설정한 LPR)
    const userAnyForProfile = user as unknown as { profile?: { ltrLevel?: string } };
    if (userAnyForProfile?.profile?.ltrLevel) {
      const profileLtr = parseFloat(userAnyForProfile.profile.ltrLevel);
      if (!isNaN(profileLtr) && profileLtr > 0) {
        return profileLtr;
      }
    }

    // Fallback: skillLevel 객체에서 추출 (레거시 지원)
    if (typeof user?.skillLevel === 'number') return user.skillLevel;
    if (user?.skillLevel?.calculated) return user.skillLevel.calculated;

    // Default: LPR mid-point
    return 5;
  };

  // 🎯 Friend search function for invite modal
  // 🎯 [STALE CLOSURE FIX] Accept gameType as parameter to avoid stale closure issues
  const searchFriendsToInvite = async (searchText: string = '', gameTypeParam?: string) => {
    // Use passed gameType or fall back to formData.gameType
    const effectiveGameType = gameTypeParam || formData.gameType;
    if (!currentUser?.uid) return;

    try {
      setLoadingFriends(true);
      const usersRef = collection(db, 'users');
      let q;

      if (searchText.trim()) {
        q = query(
          usersRef,
          where('displayName', '>=', searchText),
          where('displayName', '<=', searchText + '\uf8ff'),
          firestoreLimit(100) // Get more for gender filtering
        );
      } else {
        // 🎯 [KIM FIX] 더 많은 유저 로드 후 필터링 (성별 필터 적용)
        q = query(usersRef, firestoreLimit(100));
      }

      const querySnapshot = await getDocs(q);
      const usersList: Array<{
        id: string;
        displayName: string;
        email: string;
        ltrLevel?: string;
        gender?: string;
        photoURL?: string;
        distance?: number; // 🎯 [KIM FIX] Distance in km for sorting
      }> = [];

      // 🎯 [KIM FIX] Get current user's location for distance calculation
      const currentUserLocation = currentUser?.profile?.location || currentUser?.location;
      const currentUserLat = currentUserLocation?.latitude || currentUserLocation?.lat;
      const currentUserLon = currentUserLocation?.longitude || currentUserLocation?.lng;

      // 🎯 [LPR FILTER] Get current user's LPR using effectiveGameType
      // This ensures the same LPR value is used for both display and filtering
      // 🎯 [STALE CLOSURE FIX] Use effectiveGameType instead of relying on closure
      const currentUserLtr = getHostLtrLevel(effectiveGameType);
      // 🎯 [STALE CLOSURE FIX] Calculate isSinglesMatch from effectiveGameType
      const effectiveIsSingles =
        effectiveGameType === 'mens_singles' || effectiveGameType === 'womens_singles';
      console.log(
        `🎯 [LPR FILTER] Current user LPR: ${currentUserLtr}, isSinglesMatch: ${effectiveIsSingles}, gameType: ${effectiveGameType}`
      );

      // 🎯 [KIM FIX] Get gender filter based on game type
      // 🎯 [STALE CLOSURE FIX v2] Pass effectiveGameType to avoid stale closure
      const genderFilter = getPartnerGenderFilter(effectiveGameType);

      // 🎯 [STALE CLOSURE FIX] Use effectiveGameType passed as parameter
      const currentGameType = effectiveGameType;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        // Exclude current user and already selected friends
        if (doc.id !== currentUser.uid) {
          // 🎯 [KIM FIX] Get gender from profile or root level
          const userGenderRaw = data.profile?.gender || data.gender;

          // 🎯 Apply gender filter if required (case-insensitive + translation-aware)
          // 🐛 [DEBUG] 필터링 원인 추적
          console.log(
            `🔍 [FRIEND_CHECK] ${data.displayName}: gender="${userGenderRaw}", filter="${genderFilter}"`
          );

          if (genderFilter && userGenderRaw) {
            const normalizedUserGender = userGenderRaw.toLowerCase();
            const isMale =
              normalizedUserGender === 'male' ||
              normalizedUserGender === t('createEvent.genders.male').toLowerCase();
            const isFemale =
              normalizedUserGender === 'female' ||
              normalizedUserGender === t('createEvent.genders.female').toLowerCase();

            if (genderFilter === 'male' && !isMale) {
              console.log(`❌ [GENDER_SKIP] ${data.displayName}: need male, got ${userGenderRaw}`);
              return; // Skip - need male but user is not male
            }
            if (genderFilter === 'female' && !isFemale) {
              console.log(
                `❌ [GENDER_SKIP] ${data.displayName}: need female, got ${userGenderRaw}`
              );
              return; // Skip - need female but user is not female
            }
          }
          // 🎾 [ELO-BASED LPR] Get ELO from multiple possible locations (same as ProfileHeader)
          // 🎯 [KIM FIX v3] publicStats는 matchesPlayed > 0인 경우에만 사용!
          // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
          let ltrDisplay: string | undefined;

          const singlesElo = data.eloRatings?.singles?.current;
          const doublesElo = data.eloRatings?.doubles?.current;
          const mixedElo = data.eloRatings?.mixed?.current;

          // 🎯 [KIM FIX] 게임 타입에 맞는 ELO 선택 (getHostLtrLevel과 동일한 로직!)
          // - 단식: singlesElo
          // - 복식: doublesElo
          // - 혼복: mixedElo
          let targetElo: number | null = null;

          if (currentGameType === 'mens_singles' || currentGameType === 'womens_singles') {
            targetElo = singlesElo || null;
          } else if (currentGameType === 'mens_doubles' || currentGameType === 'womens_doubles') {
            targetElo = doublesElo || null;
          } else if (currentGameType === 'mixed_doubles') {
            targetElo = mixedElo || null;
          }

          // 🐛 [DEBUG] ELO 값 확인
          console.log(
            `🔍 [ELO_CHECK] ${data.displayName}: gameType=${currentGameType}, singles=${singlesElo}, doubles=${doublesElo}, mixed=${mixedElo}, targetElo=${targetElo}`
          );

          if (targetElo && targetElo > 0) {
            ltrDisplay = String(convertEloToLtr(targetElo));
            console.log(
              `🔍 [ELO_TO_LPR] ${data.displayName}: targetElo=${targetElo} → LPR=${ltrDisplay} (game-type specific)`
            );
          } else {
            // Fallback to highest ELO if game-type specific ELO not found
            const eloValues = [singlesElo, doublesElo, mixedElo].filter(
              (elo): elo is number => elo !== null && elo !== undefined && elo > 0
            );
            if (eloValues.length > 0) {
              const highestElo = Math.max(...eloValues);
              ltrDisplay = String(convertEloToLtr(highestElo));
              console.log(
                `🔍 [ELO_TO_LPR] ${data.displayName}: highestElo=${highestElo} → LPR=${ltrDisplay} (fallback)`
              );
            }
          }

          if (!ltrDisplay) {
            // 🐛 [DEBUG] ELO가 없으면 profile.ltrLevel 확인
            const profileLtr = data.profile?.ltrLevel;
            console.log(`🔍 [NO_ELO] ${data.displayName}: profile.ltrLevel="${profileLtr}"`);
            if (profileLtr) {
              ltrDisplay = profileLtr;
            }
          }

          // 🎯 [2025.01 RULE CHANGE] LPR filter based on game type
          // Singles: 0~+1 only (host can invite same level or 1 level higher)
          // Doubles/Mixed: ±2 (more relaxed for team play)

          if (ltrDisplay) {
            const userLtr = parseFloat(ltrDisplay);
            const diff = userLtr - currentUserLtr; // Positive = user is higher level
            // 🎯 [STALE CLOSURE FIX] Use effectiveIsSingles instead of isSinglesMatch
            const matchType = effectiveIsSingles ? 'SINGLES' : 'DOUBLES';

            let skip = false;
            if (effectiveIsSingles) {
              // Singles: Host can invite same (0) or 1 level higher (+1) only
              skip = diff < 0 || diff > 1;
            } else {
              // Doubles/Mixed: ±2 tolerance
              skip = Math.abs(diff) > 2;
            }

            console.log(
              `🎯 [LPR CHECK] ${data.displayName}: LPR ${userLtr}, myLPR ${currentUserLtr}, diff: ${diff}, skip: ${skip} (${matchType})`
            );
            if (skip) {
              return; // Skip - LPR doesn't meet requirements
            }
          } else {
            console.log(`⚠️ [NO_LPR] ${data.displayName}: no LPR display, skipping filter`);
          }

          // 🎯 [KIM FIX] Check profile.photoURL FIRST (most common Firestore location)
          const photoURL =
            data.profile?.photoURL ||
            data.photoURL ||
            data.profile?.profileImage ||
            data.profileImage;

          // 🎯 [KIM FIX] Calculate distance if both users have location
          let distance: number | undefined;
          if (currentUserLat && currentUserLon) {
            const userLocation = data.profile?.location || data.location;
            const targetLat = userLocation?.latitude || userLocation?.lat;
            const targetLon = userLocation?.longitude || userLocation?.lng;
            if (targetLat && targetLon) {
              distance = calculateDistanceKm(currentUserLat, currentUserLon, targetLat, targetLon);
            }
          }

          usersList.push({
            id: doc.id,
            displayName: data.displayName || data.email || t('common.unknownUser'),
            email: data.email || '',
            ltrLevel: ltrDisplay,
            gender: userGenderRaw, // Use the already extracted gender
            photoURL,
            distance,
          });
        }
      });

      // 🎯 [KIM FIX] Sort by distance (nearest first) and take only 20
      const sortedUsers = usersList.sort((a, b) => {
        // Users with distance come first, then by distance
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
      const nearest20 = sortedUsers.slice(0, 20);

      setFriendSearchResults(nearest20);
      console.log(
        `🎯 [FRIEND_SEARCH] Found ${usersList.length} users, showing nearest ${nearest20.length} (gender filter: ${genderFilter || 'none'})`
      );
    } catch (error) {
      console.error('Error searching friends:', error);
      Alert.alert(t('createEvent.alerts.error'), t('createEvent.alerts.userSearchError'));
    } finally {
      setLoadingFriends(false);
    }
  };

  // 🎯 [STALE CLOSURE FIX v3] Always keep ref updated to latest function
  searchFriendsToInviteRef.current = searchFriendsToInvite;

  // 🎯 [LPR FILTER FIX] Auto-load friend list when modal opens (apply fresh LPR filter)
  // 🎯 [STALE CLOSURE FIX v3] Use ref to ALWAYS call the latest function version
  useEffect(() => {
    if (showFriendInviteModal) {
      console.log(
        `🎯 [MODAL_OPEN] Friend invite modal opened, gameType: ${formData.gameType}, isSinglesMatch: ${isSinglesMatch}`
      );
      // Use ref to call the latest function, bypassing stale closure
      searchFriendsToInviteRef.current?.('', formData.gameType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFriendInviteModal, formData.gameType]);

  // Handle friend selection/deselection
  // 🎯 [LPR] Now stores ltrLevel and limits singles to 1 friend
  const handleToggleFriend = (user: { id: string; displayName: string; ltrLevel?: string }) => {
    const isSelected = selectedFriends.some(f => f.id === user.id);

    if (isSelected) {
      setSelectedFriends(prev => prev.filter(f => f.id !== user.id));
    } else {
      // 🎯 [SINGLES LIMIT] For singles matches, replace existing selection (only 1 allowed)
      if (isSinglesMatch) {
        setSelectedFriends([
          { id: user.id, displayName: user.displayName, ltrLevel: user.ltrLevel },
        ]);
      } else {
        setSelectedFriends(prev => [
          ...prev,
          { id: user.id, displayName: user.displayName, ltrLevel: user.ltrLevel },
        ]);
      }
    }
  };

  // Confirm friend invitations
  const handleConfirmFriendInvites = () => {
    setFormData(prev => ({
      ...prev,
      invitedFriends: selectedFriends.map(f => f.id),
    }));
    setShowFriendInviteModal(false);
  };

  // 🎯 [KIM FIX] Haversine formula for distance calculation (km)
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Partner selection functions
  // 🎯 [KIM FIX] Load nearest 20 users by distance
  const loadUsers = async (searchText: string = '', overrideGameType?: string) => {
    if (!currentUser?.uid) return;

    try {
      setLoadingUsers(true);
      const usersRef = collection(db, 'users');
      let q;

      if (searchText.trim()) {
        // Search by displayName
        q = query(
          usersRef,
          where('displayName', '>=', searchText),
          where('displayName', '<=', searchText + '\uf8ff'),
          firestoreLimit(50) // Get more for distance filtering
        );
      } else {
        // 🎯 [KIM FIX] Load more users initially, then filter/sort by distance
        q = query(usersRef, firestoreLimit(100)); // Get 100, sort by distance, take 20
      }

      const querySnapshot = await getDocs(q);
      const usersList: Array<{
        id: string;
        displayName: string;
        email: string;
        ltrLevel?: string;
        gender?: string;
        photoURL?: string;
        distance?: number; // 🎯 [KIM FIX] Distance in km for sorting
      }> = [];

      // 🎯 [KIM FIX] Get current user's location for distance calculation
      const currentUserLocation = currentUser?.profile?.location || currentUser?.location;
      const currentUserLat = currentUserLocation?.latitude || currentUserLocation?.lat;
      const currentUserLon = currentUserLocation?.longitude || currentUserLocation?.lng;

      // 🎯 [OPERATION DUO - PHASE 4.5 PART 2] Get gender filter based on game type
      const genderFilter = getPartnerGenderFilter(overrideGameType);

      // 🎯 [KIM FIX] 현재 게임 타입 결정 (overrideGameType > formData.gameType)
      const currentGameType = overrideGameType || formData.gameType;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        // Exclude current user from the list
        if (doc.id !== currentUser.uid) {
          const userGender = data.profile?.gender || data.gender;

          // 🎯 Apply gender filter if required (case-insensitive + translation-aware)
          if (genderFilter && userGender) {
            const normalizedUserGender = userGender.toLowerCase();
            // Check if user gender matches the filter (support translated values)
            const isMale =
              normalizedUserGender === 'male' ||
              normalizedUserGender === t('createEvent.genders.male').toLowerCase();
            const isFemale =
              normalizedUserGender === 'female' ||
              normalizedUserGender === t('createEvent.genders.female').toLowerCase();

            if (genderFilter === 'male' && !isMale) {
              return; // Skip - need male but user is not male
            }
            if (genderFilter === 'female' && !isFemale) {
              return; // Skip - need female but user is not female
            }
          }

          // 🎯 [KIM FIX] 게임 타입에 맞는 ELO 기반 LPR 계산
          const eloRatings = data.eloRatings as
            | {
                singles?: { current?: number };
                doubles?: { current?: number };
                mixed?: { current?: number };
              }
            | undefined;
          // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (stats 제거)
          let targetElo: number | null = null;
          let gameTypeLabel = '';

          if (currentGameType === 'mens_singles' || currentGameType === 'womens_singles') {
            targetElo = eloRatings?.singles?.current || null;
            gameTypeLabel = t('createEvent.gameTypes.singles');
          } else if (currentGameType === 'mens_doubles' || currentGameType === 'womens_doubles') {
            targetElo = eloRatings?.doubles?.current || null;
            gameTypeLabel = t('createEvent.gameTypes.doubles');
          } else if (currentGameType === 'mixed_doubles') {
            targetElo = eloRatings?.mixed?.current || null;
            gameTypeLabel = t('createEvent.gameTypes.mixed');
          }

          // 🎾 [ELO-BASED LPR] All users have ELO from onboarding
          let ltrDisplay: string | undefined;
          if (targetElo && targetElo > 0) {
            const ltr = convertEloToLtr(targetElo);
            ltrDisplay = `${ltr} (${gameTypeLabel})`;
          }
          // No NTRP fallback needed - all users have ELO from onboarding

          // 🎯 [KIM FIX] Check profile.photoURL FIRST (most common Firestore location)
          const photoURL =
            data.profile?.photoURL ||
            data.photoURL ||
            data.profile?.profileImage ||
            data.profileImage;

          // 🎯 [KIM FIX] Get target user's location for distance calculation
          const targetLocation = data.profile?.location || data.location;
          const targetLat = targetLocation?.latitude || targetLocation?.lat;
          const targetLon = targetLocation?.longitude || targetLocation?.lng;

          // Calculate distance if both locations are available
          let distance: number | undefined;
          if (currentUserLat && currentUserLon && targetLat && targetLon) {
            distance = calculateDistanceKm(currentUserLat, currentUserLon, targetLat, targetLon);
          }

          usersList.push({
            id: doc.id,
            displayName: data.displayName || data.email || t('common.unknownUser'),
            email: data.email || '',
            ltrLevel: ltrDisplay,
            gender: userGender,
            photoURL,
            distance,
          });
        }
      });

      // 🎯 [KIM FIX v2] Get host LPR for partner filtering
      // 🎯 [STALE CLOSURE FIX] Pass currentGameType to avoid stale closure
      const hostLtr = getHostLtrLevel(currentGameType);

      // 🎯 [STALE CLOSURE FIX] Calculate isSingles from currentGameType, not closure
      const effectiveIsSingles =
        currentGameType === 'mens_singles' || currentGameType === 'womens_singles';

      // 🎯 [2025.01 RULE CHANGE] Filter by LPR based on game type
      // - Singles: Host can only invite same level (0) or +1 higher
      // - Doubles/Mixed: ±2 tolerance
      const filteredByLtr = usersList.filter(user => {
        // Extract numeric LPR from ltrLevel string like "5 (Singles)"
        if (!user.ltrLevel) return true; // Include users without LPR
        const ltrMatch = user.ltrLevel.match(/^(\d+)/);
        if (!ltrMatch) return true;
        const userLtr = parseInt(ltrMatch[1], 10);
        const diff = userLtr - hostLtr; // positive = user is higher level

        // 🎯 [STALE CLOSURE FIX] Use effectiveIsSingles instead of isSinglesMatch
        if (effectiveIsSingles) {
          // Singles: Host can invite same level (diff=0) or 1 level higher (diff=1)
          return diff >= 0 && diff <= 1;
        } else {
          // Doubles/Mixed: ±2 tolerance
          return Math.abs(diff) <= 2;
        }
      });

      const sortedUsers = filteredByLtr
        .sort((a, b) => {
          // Users with location come first, sorted by distance
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          // Users without distance go to the end
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return 0;
        })
        .slice(0, 20);

      setUsers(sortedUsers);
      console.log(
        `🎯 [PARTNER_SEARCH] Loaded ${sortedUsers.length} nearest users (sorted from ${usersList.length} total, gender filter: ${genderFilter || 'none'})`
      );
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert(t('createEvent.alerts.error'), t('createEvent.alerts.userListError'));
    } finally {
      setLoadingUsers(false);
    }
  };

  /**
   * 🛡️ [OPERATION AUTOMATED FAIRNESS] Partner selection with LPR validation
   * Prevents selecting partners with LPR gap > 2 (LPR uses 1-10 scale)
   */
  const handleSelectPartner = (user: {
    id: string;
    displayName: string;
    email: string;
    ltrLevel?: string;
    gender?: string;
  }) => {
    // Extract LPR values (게임 타입에 맞는 ELO 사용)
    const hostLtr = getHostLtrLevel();

    // 🎯 [KIM FIX v2] Extract LPR from ltrLevel string like "7 (복식)" or "5 (Singles)"
    // loadUsers에서 이미 게임 타입별 ELO로 LPR을 계산해서 문자열로 저장함
    let partnerLtr = 5; // default
    if (user.ltrLevel) {
      const ltrMatch = user.ltrLevel.match(/^(\d+)/);
      if (ltrMatch) {
        partnerLtr = parseInt(ltrMatch[1], 10);
      }
    }

    // 🔍 Debug logs
    console.log('🛡️ [LPR_VALIDATION] Partner selection attempt:', {
      host: currentUser?.displayName,
      hostLtr,
      partner: user.displayName,
      partnerLtr,
    });

    // 💥 LPR gap validation: maximum 2 levels difference (LPR 1-10 scale) 💥
    const gap = Math.abs(hostLtr - partnerLtr);

    if (gap > 2) {
      Alert.alert(
        t('createEvent.alerts.partnerSelectionFailed'),
        t('createEvent.alerts.partnerLevelGap', {
          hostLtr: hostLtr,
          partnerLtr: partnerLtr,
          gap: gap,
        }),
        [{ text: t('createEvent.alerts.confirm') }]
      );
      console.log('❌ [LPR_VALIDATION] Partner rejected - LPR gap too large:', gap);
      return;
    }

    // ✅ Validation passed
    console.log('✅ [LPR_VALIDATION] Partner approved - LPR gap acceptable:', gap);
    setHostPartnerId(user.id);
    setHostPartnerName(user.displayName);

    // 🎯 Store partner LPR for auto-calculation
    setHostPartnerLtr(partnerLtr);

    console.log('🎯 Partner selected with LPR', {
      partnerId: user.id,
      partnerName: user.displayName,
      partnerLtr,
    });

    setShowPartnerModal(false);
    Alert.alert(
      t('createEvent.alerts.partnerSelected'),
      t('createEvent.alerts.partnerSelectedMessage', { displayName: user.displayName })
    );
  };

  // 🎯 [KIM FIX] Send SMS invitations after event creation
  const sendSMSInvitations = async (eventTitle: string) => {
    if (formData.smsInvites.length === 0) return;

    const appDownloadLink = 'https://lightning-pickleball.app/download'; // TODO: Replace with actual app link
    const senderName = currentUser?.displayName || t('createEvent.sms.defaultSender');
    const message = t('createEvent.sms.invitationMessage', {
      sender: senderName,
      eventTitle,
      link: appDownloadLink,
    });

    try {
      // Check if SMS is available (may return false on simulator, but we'll still try)
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        console.warn('📱 [SMS] isAvailableAsync returned false (expected on simulator)');
      }

      // Try to open SMS app with pre-filled message regardless of isAvailable
      const { result } = await SMS.sendSMSAsync(formData.smsInvites, message);
      console.log('📱 [SMS] SMS result:', result);

      if (result === 'sent') {
        console.log('📱 [SMS] SMS sent successfully');
      } else if (result === 'cancelled') {
        console.log('📱 [SMS] User cancelled SMS');
      }
    } catch (error) {
      console.error('📱 [SMS] Error sending SMS:', error);
      Alert.alert(t('createEvent.errors.smsError'), t('createEvent.errors.smsErrorMessage'));
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.title.trim()) {
      Alert.alert(t('createEvent.alerts.notice'), t('createEvent.alerts.titleRequired'), [
        {
          text: 'OK',
          onPress: () => {
            // Focus on title input after alert is dismissed
            setTimeout(() => {
              titleInputRef.current?.focus();
            }, 100);
          },
        },
      ]);
      return;
    }

    const locationValue =
      typeof formData.location === 'string' ? formData.location : formData.location?.address || '';
    if (!locationValue.trim()) {
      Alert.alert(t('createEvent.alerts.notice'), t('createEvent.alerts.locationRequired'));
      return;
    }

    if (!formData.gameType) {
      Alert.alert(t('createEvent.alerts.notice'), t('createEvent.alerts.gameTypeRequired'));
      return;
    }

    // Validate partner for doubles matches
    const isDoublesMatch =
      formData.gameType === 'mixed_doubles' ||
      formData.gameType === 'mens_doubles' ||
      formData.gameType === 'womens_doubles';

    if (eventType === 'match' && isDoublesMatch && !hostPartnerId) {
      Alert.alert(t('createEvent.alerts.notice'), t('createEvent.alerts.doublesRequiresPartner'));
      return;
    }

    // NTRP validation - skip for all matches (auto-calculated), only check for meetups
    if (eventType !== 'match' && (!formData.ltrLevels || formData.ltrLevels.length === 0)) {
      Alert.alert(t('createEvent.alerts.notice'), t('createEvent.alerts.skillLevelRequired'));
      return;
    }

    // 🔄 [SAVE LOADING] Set loading state to prevent double submission
    setIsSaving(true);

    try {
      // 🎯 [KIM FIX] Check if friends are invited
      const hasInvitedFriends = formData.invitedFriends.length > 0;

      // 🎯 [KIM FIX] Visibility logic:
      // - Match: If friends invited → private (hidden from discovery)
      // - Meetup: If invited friends < available spots → public (shown in discovery)
      const invitedCount = formData.invitedFriends.length + formData.smsInvites.length;
      const availableSpots = maxParticipants - 1; // Subtract 1 for host
      const shouldBePublic = isMatch
        ? !hasInvitedFriends // Match: public only if no friends invited
        : invitedCount < availableSpots; // Meetup: public if spots remain

      // Prepare event data for database
      // 🔍 [DEBUG] Log autoApproval value before saving
      console.log('🔍 [DEBUG] formData.autoApproval:', formData.autoApproval);
      console.log('🔍 [DEBUG] typeof formData.autoApproval:', typeof formData.autoApproval);

      const eventData = {
        type: eventType, // 'match' or 'meetup'
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        location: typeof formData.location === 'string' ? formData.location.trim() : '',
        locationDetails: formData.locationDetails,
        scheduledTime: selectedDate,
        maxParticipants: maxParticipants,
        gameType: formData.gameType,
        ltrLevel: (formData.ltrLevels || []).join(','), // Convert array to comma-separated string
        languages: formData.languages,
        autoApproval: formData.autoApproval,
        participationFee: formData.participationFee
          ? parseInt(String(formData.participationFee), 10)
          : 0,
        invitedFriends: formData.invitedFriends,
        smsInvites: formData.smsInvites,
        hostId: currentUser?.uid,
        hostName: currentUser?.displayName || 'Anonymous Host',
        // 🎯 [KIM FIX] Firestore undefined 값 사용 금지 - 조건부로 필드 추가
        ...(hostPartnerId && { hostPartnerId }),
        ...(hostPartnerName && { hostPartnerName }),
        // 🎯 [KIM FIX] Visibility and invite settings:
        // - isPublic: Whether to show in discovery (Match: no friends, Meetup: spots remain)
        // - isInviteOnly: Whether friends are invited (needed for invitation queries)
        isPublic: shouldBePublic,
        isInviteOnly: hasInvitedFriends, // True if any friends invited (for invitation lookup)
        // 🎯 [KIM FIX] Create friendInvitations array for invited friends
        ...(hasInvitedFriends && {
          friendInvitations: formData.invitedFriends.map((friendId: string) => ({
            userId: friendId,
            status: 'pending',
            invitedAt: new Date().toISOString(),
          })),
        }),
      };

      if (isEditMode && editEvent?.id) {
        // ✅ 수정 모드: 기존 이벤트 업데이트

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await activityService.updateEvent(editEvent.id, eventData as any);

        console.log('✅ Event updated successfully with ID:', editEvent.id);

        // Show success message and navigate back
        Alert.alert(
          t('createEvent.alerts.success'),
          t('createEvent.alerts.eventUpdated', { typeLabel }),
          [
            {
              text: t('createEvent.alerts.confirm'),
              onPress: () => {
                // Navigate to MyProfile > Activity > Hosted tab
                const parentNav = navigation.getParent();
                if (parentNav) {
                  parentNav.navigate('MainTabs', {
                    screen: 'MyProfile',
                    params: {
                      initialTab: 'activity',
                      initialActivityTab: 'hosted',
                    },
                  });
                }
              },
            },
          ]
        );
      } else {
        // ✅ 생성 모드: 새 이벤트 생성

        if (eventType === 'match') {
          // 🎯 [OPERATION DUO] Use Cloud Function for match creation
          const functions = getFunctions();
          const createMatchFn = httpsCallable(functions, 'createMatchAndInvite');

          // Calculate LPR based on match type (server uses minLtr/maxLtr field names for compatibility)
          let minLtr: number;
          let maxLtr: number;

          const isDoublesMatch =
            formData.gameType === 'mixed_doubles' ||
            formData.gameType === 'mens_doubles' ||
            formData.gameType === 'womens_doubles';

          if (isDoublesMatch) {
            // 🎯 [OPERATION AUTOMATED FAIRNESS] Auto-calculate from host + partner LPR
            const hostLtr = getHostLtrLevel();
            const partnerLtr = hostPartnerLtr;
            const combinedLtr = hostLtr + partnerLtr;

            // Send combinedLtr / 2 as both min and max
            // Server will multiply by 2 to validate against actual combined LPR
            minLtr = combinedLtr / 2;
            maxLtr = combinedLtr / 2;

            console.log('🎯 [AUTOMATED_FAIRNESS] Auto-calculated doubles LPR', {
              hostLtr,
              partnerLtr,
              combinedLtr,
              minLtr,
              maxLtr,
              sentToServer: { minLtr: minLtr, maxLtr: maxLtr },
            });
          } else {
            // 🎯 [OPERATION AUTOMATED FAIRNESS] Singles matches: auto-calculate from host LPR ± 1
            const hostLtr = getHostLtrLevel();
            minLtr = Math.max(1, hostLtr - 1); // 최소 1
            maxLtr = Math.min(10, hostLtr + 1); // 최대 10

            console.log('🎯 [AUTOMATED_FAIRNESS] Auto-calculated singles LPR (±1 range)', {
              hostLtr,
              minLtr,
              maxLtr,
            });
          }

          // Prepare payload for Cloud Function
          const payload = {
            matchData: {
              title: formData.title.trim(),
              description: formData.description?.trim() || '',
              location:
                typeof formData.location === 'string'
                  ? formData.location.trim()
                  : formData.location?.address || '',
              // 🎯 [KIM FIX] Include locationDetails with coordinates for distance filtering
              locationDetails: formData.locationDetails,
              scheduledTime: selectedDate.toISOString(), // ✅ [PHASE 4.5] Fix host visibility
              date: selectedDate.toISOString(),
              time: selectedDate.toISOString(),
              minLtr: minLtr, // Server API uses 'ntrp' field names for compatibility
              maxLtr: maxLtr,
              hostLtr: getHostLtrLevel(), // 🎯 [LPR FIX] Host's individual LPR for partner selection
              maxParticipants: maxParticipants,
              autoApproval: formData.autoApproval, // 🎯 [AUTO-APPROVAL FIX] 선착순 자동 승인
            },
            hostProfile: {
              uid: currentUser?.uid,
              displayName: currentUser?.displayName || 'Anonymous Host',
              ltrLevel:
                (currentUser?.profile as { ltrLevel?: string } | undefined)?.ltrLevel ||
                (currentUser?.skillLevel as { selfAssessed?: string } | undefined)?.selfAssessed ||
                '3.0',
            },
            partnerProfile: hostPartnerId
              ? {
                  uid: hostPartnerId,
                  displayName: hostPartnerName,
                  ltrLevel: '3.0', // Partner NTRP will be fetched server-side
                }
              : undefined,
            gameType: formData.gameType,
            // 🎯 [FRIEND INVITE] Pass invited friends to Cloud Function
            invitedFriends: selectedFriends.map(f => f.id),
          };

          console.log('🎯 [MATCH_CREATE] Calling createMatchAndInvite with payload:', payload);

          const result = await createMatchFn(payload);

          console.log('✅ [MATCH_CREATE] Cloud Function result:', result.data);

          // 🚀 [PERFORMANCE] Extract new event ID from result
          const resultData = result.data as { eventId?: string };
          const newEventId = resultData?.eventId;

          // 🎯 [SMS INVITE] Send SMS invitations after match creation
          if (formData.smsInvites.length > 0) {
            await sendSMSInvitations(formData.title.trim());
          }

          const partnerMessage = hostPartnerId ? t('createEvent.alerts.partnerInvited') : '';
          const friendInviteMessage =
            selectedFriends.length > 0
              ? t('createEvent.alerts.friendsInvited', { count: selectedFriends.length })
              : '';
          Alert.alert(
            t('createEvent.alerts.success'),
            t('createEvent.alerts.eventCreatedWithInvites', {
              typeLabel,
              partnerMessage,
              friendInviteMessage,
            }),
            [
              {
                text: t('createEvent.alerts.confirm'),
                onPress: () => {
                  // Navigate to MyProfile > Activity > Hosted tab
                  // 🚀 [PERFORMANCE] Pass newEventId for immediate display
                  const parentNav = navigation.getParent();
                  if (parentNav) {
                    parentNav.navigate('MainTabs', {
                      screen: 'MyProfile',
                      params: {
                        initialTab: 'activity',
                        initialActivityTab: 'hosted',
                        newEventId, // 🚀 New event ID for instant display
                      },
                    });
                  }
                },
              },
            ]
          );
        } else {
          // Meetup: Use existing activityService
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const eventId = await activityService.createEvent(eventData as any);

          console.log('✅ Event created successfully with ID:', eventId);

          // 🎯 [KIM FIX] Send SMS invitations after event creation
          if (formData.smsInvites.length > 0) {
            await sendSMSInvitations(formData.title.trim());
          }

          // Show success message and navigate to "내 활동" tab
          Alert.alert(
            t('createEvent.alerts.success'),
            t('createEvent.alerts.eventCreated', { typeLabel }),
            [
              {
                text: t('createEvent.alerts.confirm'),
                onPress: () => {
                  // Navigate to MyProfile > Activity > Hosted tab
                  const parentNav = navigation.getParent();
                  if (parentNav) {
                    parentNav.navigate('MainTabs', {
                      screen: 'MyProfile',
                      params: {
                        initialTab: 'activity',
                        initialActivityTab: 'hosted',
                      },
                    });
                  }
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Error saving event:', error);
      const actionText = isEditMode
        ? t('createEvent.alerts.updating')
        : t('createEvent.alerts.creating');
      Alert.alert(
        t('createEvent.alerts.error'),
        t('createEvent.alerts.saveError', { typeLabel, actionText }),
        [{ text: t('createEvent.alerts.confirm') }]
      );
    } finally {
      // 🔄 [SAVE LOADING] Reset loading state after save completes or fails
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* StatusBar now managed centrally by ThemeProvider */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name='arrow-back' size={24} color={themeColors.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isEditMode ? t('createEvent.header.editEvent') : t('createEvent.header.createNew')}
          </Text>
          <View style={styles.eventTypeIndicator}>
            <Text style={styles.eventTypeIcon}>{icon}</Text>
            <Text style={styles.eventTypeText}>{typeLabel}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? t('createEvent.buttons.update') : t('common.save')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('createEvent.fields.titleLabel')}</Text>
          <TextInput
            ref={titleInputRef}
            style={styles.textInput}
            value={formData.title}
            onChangeText={text => setFormData(prev => ({ ...prev, title: text }))}
            placeholder={
              isMatch
                ? t('createEvent.placeholders.titleMatch')
                : t('createEvent.placeholders.titleMeetup')
            }
            placeholderTextColor={themeColors.colors.onSurfaceVariant}
          />
        </View>

        {/* Description Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('createEvent.fields.description')}</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={formData.description}
            onChangeText={text => setFormData(prev => ({ ...prev, description: text }))}
            placeholder={t('createEvent.placeholders.description')}
            placeholderTextColor={themeColors.colors.onSurfaceVariant}
            multiline
            numberOfLines={3}
            textAlignVertical='top'
          />
        </View>

        {/* Location Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('createEvent.fields.locationLabel')}</Text>
          <TouchableOpacity
            style={styles.locationInput}
            onPress={() => navigation.navigate('LocationSearch', { eventType })}
          >
            <Ionicons
              name='location-outline'
              size={20}
              color={themeColors.colors.onSurfaceVariant}
            />
            <Text
              style={[styles.locationTextInput, !formData.location && styles.locationPlaceholder]}
            >
              {(typeof formData.location === 'string'
                ? formData.location
                : formData.location?.address) || t('createEvent.fields.selectLocation')}
            </Text>
            <Ionicons name='search-outline' size={20} color={themeColors.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Date and Time */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('createEvent.fields.dateTimeLabel')}</Text>
          <TouchableOpacity style={styles.dateTimeButton} onPress={() => setIsDatePickerOpen(true)}>
            <Ionicons
              name='calendar-outline'
              size={20}
              color={themeColors.colors.onSurfaceVariant}
            />
            <Text style={styles.dateTimeButtonText}>{formatDateTime(selectedDate)}</Text>
            <Ionicons
              name='chevron-down-outline'
              size={20}
              color={themeColors.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {/* Max Participants - Conditional rendering based on event type */}
        <View style={styles.fieldContainer}>
          {isMatch ? (
            // 번개 매치: 자동 계산된 참가자 수 표시
            <View>
              <Text style={styles.fieldLabel}>{t('createEvent.fields.maxParticipants')}</Text>
              <View style={styles.autoParticipantContainer}>
                <Ionicons name='people-outline' size={20} color={themeColors.colors.primary} />
                <View style={styles.autoParticipantContent}>
                  <Text style={styles.autoParticipantCount}>
                    {maxParticipants}
                    {t('createEvent.fields.people')}
                  </Text>
                  <Text style={styles.autoParticipantDescription}>
                    {t('createEvent.fields.autoSetByGameType')}
                  </Text>
                </View>
                <View style={styles.autoParticipantBadge}>
                  <Text style={styles.autoParticipantBadgeText}>
                    {t('createEvent.fields.auto')}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            // 번개 모임: 수동 선택 가능
            <ParticipantSelector
              initialValue={maxParticipants}
              onParticipantChange={setMaxParticipants}
            />
          )}
        </View>

        {/* Game Type Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('createEvent.fields.gameTypeLabel')}</Text>
          <View style={styles.gameTypeContainer}>
            {[
              { key: 'rally', label: t('createEvent.gameTypeOptions.rally') },
              {
                key: 'mixed_doubles',
                label: t('createEvent.gameTypeOptions.mixedDoubles'),
              },
              {
                key: 'mens_doubles',
                label: t('createEvent.gameTypeOptions.mensDoubles'),
              },
              {
                key: 'womens_doubles',
                label: t('createEvent.gameTypeOptions.womensDoubles'),
              },
              {
                key: 'mens_singles',
                label: t('createEvent.gameTypeOptions.mensSingles'),
              },
              {
                key: 'womens_singles',
                label: t('createEvent.gameTypeOptions.womensSingles'),
              },
            ]
              .filter(type => {
                // 번개 매치일 때는 '랠리/연습' 옵션 제외
                if (isMatch && type.key === 'rally') {
                  return false;
                }
                return true;
              })
              .map(type => {
                const isDisabled = isGameTypeDisabled(type.key);
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.gameTypeButton,
                      formData.gameType === type.key && styles.gameTypeButtonActive,
                      isDisabled && styles.gameTypeButtonDisabled,
                    ]}
                    onPress={() => {
                      if (isDisabled) return; // Prevent selection if disabled

                      setFormData(prev => ({ ...prev, gameType: type.key }));

                      // Auto-open partner modal for doubles
                      if (
                        type.key === 'mixed_doubles' ||
                        type.key === 'mens_doubles' ||
                        type.key === 'womens_doubles'
                      ) {
                        setShowPartnerModal(true);
                        loadUsers('', type.key); // Load users with correct game type filter
                      } else {
                        // Clear partner for non-doubles games
                        setHostPartnerId('');
                        setHostPartnerName('');
                      }

                      // 번개 매치일 경우 게임 타입에 따라 참가자 수 자동 설정
                      if (isMatch && type.key !== 'rally') {
                        const autoParticipantCount = getParticipantCountFromGameType(type.key);
                        setMaxParticipants(autoParticipantCount);
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.gameTypeButtonText,
                        formData.gameType === type.key && styles.gameTypeButtonTextActive,
                        isDisabled && styles.gameTypeButtonTextDisabled,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>

          {/* Partner Display (for doubles) */}
          {(formData.gameType === 'mixed_doubles' ||
            formData.gameType === 'mens_doubles' ||
            formData.gameType === 'womens_doubles') && (
            <TouchableOpacity
              style={styles.partnerDisplayButton}
              onPress={() => {
                setShowPartnerModal(true);
                // 🎯 [KIM FIX] 항상 현재 게임 타입으로 사용자 목록 로드
                // 이전에 다른 게임 타입으로 로드된 목록이 재사용되면 잘못된 LPR이 표시됨
                loadUsers('', formData.gameType);
              }}
            >
              <Text style={styles.partnerLabel}>{t('createEvent.fields.partner')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.partnerValue}>
                  {hostPartnerName
                    ? `${hostPartnerName} (LPR ${hostPartnerLtr})`
                    : t('createEvent.fields.selectPartner')}
                </Text>
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={themeColors.colors.onSurfaceVariant}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* NTRP Skill Level - Hide for all matches (auto-calculated), only show for meetups */}
        {eventType !== 'match' && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('createEvent.fields.skillLevelMultiple')}</Text>
            <Text style={styles.fieldDescription}>
              {t('createEvent.fields.selectSkillLevelsDesc', {
                hostLevel: isMatch ? getHostLtrLevel() : '',
              })}
            </Text>
            {isMatch && (
              <Text style={styles.fieldWarning}>
                {t('createEvent.warnings.matchLevelRestriction')}
              </Text>
            )}
            <View style={styles.ntrpContainer}>
              {[
                {
                  key: '1.0-2.5',
                  label: '1.0-2.5',
                  description: t('createEvent.skillDescriptions.beginner'),
                },
                {
                  key: '3.0-3.5',
                  label: '3.0-3.5',
                  description: t('createEvent.skillDescriptions.elementary'),
                },
                {
                  key: '4.0-4.5',
                  label: '4.0-4.5',
                  description: t('createEvent.skillDescriptions.intermediate'),
                },
                {
                  key: '5.0+',
                  label: '5.0+',
                  description: t('createEvent.skillDescriptions.advanced'),
                },
                {
                  key: 'any',
                  label: t('createEvent.skillLevelOptions.anyLevel'),
                  description: t('createEvent.skillLevelOptions.anyLevelDesc'),
                },
              ].map(level => {
                const isSelectable = isLtrLevelSelectable(level.key);
                const isSelected = (formData.ltrLevels || []).includes(level.key);

                return (
                  <TouchableOpacity
                    key={level.key}
                    style={[
                      styles.ntrpCheckboxItem,
                      isSelected && styles.ntrpCheckboxItemActive,
                      !isSelectable && styles.ntrpCheckboxItemDisabled,
                    ]}
                    onPress={() => {
                      if (!isSelectable) return; // 비활성화된 항목은 클릭 불가

                      const currentLevels = formData.ltrLevels || [];
                      const newLevels = isSelected
                        ? currentLevels.filter((l: string) => l !== level.key)
                        : [...currentLevels, level.key];
                      setFormData(prev => ({ ...prev, ltrLevels: newLevels }));
                    }}
                    disabled={!isSelectable}
                  >
                    <View style={styles.ntrpCheckboxContent}>
                      <View
                        style={[
                          styles.ntrpCheckbox,
                          isSelected && styles.ntrpCheckboxActive,
                          !isSelectable && styles.ntrpCheckboxDisabled,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name='checkmark'
                            size={16}
                            color={isSelectable ? themeColors.colors.surface : '#ccc'}
                          />
                        )}
                      </View>
                      <View style={styles.ntrpLabelContainer}>
                        <Text
                          style={[
                            styles.ntrpLabel,
                            isSelected && styles.ntrpLabelActive,
                            !isSelectable && styles.ntrpLabelDisabled,
                          ]}
                        >
                          {level.label}
                        </Text>
                        <Text
                          style={[
                            styles.ntrpDescription,
                            !isSelectable && styles.ntrpDescriptionDisabled,
                          ]}
                        >
                          {level.description}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Auto-calculated NTRP Display for ALL Matches (Singles + Doubles) */}
        {eventType === 'match' && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('createEvent.fields.matchLevelAuto')}</Text>
            <View
              style={[
                styles.autoNtrpContainer,
                { backgroundColor: themeColors.colors.surfaceVariant },
              ]}
            >
              {/* 🎯 호스트 LPR */}
              <Text style={[styles.autoNtrpText, { color: themeColors.colors.onSurface }]}>
                {t('createEvent.autoNtrp.hostLevelWithType', {
                  level: getHostLtrLevel(),
                  type: getGameTypeLabel(formData.gameType),
                })}
              </Text>
              {/* 🎯 파트너 LPR (복식만 표시) */}
              {isDoublesMatch && (
                <>
                  <Text style={[styles.autoNtrpText, { color: themeColors.colors.onSurface }]}>
                    {t('createEvent.autoNtrp.partnerLevelWithType', {
                      level: hostPartnerLtr,
                      type: getGameTypeLabel(formData.gameType),
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.autoNtrpSum,
                      { color: themeColors.colors.primary, fontWeight: 'bold' },
                    ]}
                  >
                    {t('createEvent.autoNtrp.combinedLevel', {
                      level: getHostLtrLevel() + hostPartnerLtr,
                    })}
                  </Text>
                </>
              )}
              <Text style={[styles.autoNtrpBadge, { color: themeColors.colors.secondary }]}>
                {t('createEvent.fields.autoConfigured')}
              </Text>
            </View>
            <Text style={[styles.helperText, { color: themeColors.colors.onSurfaceVariant }]}>
              {isDoublesMatch
                ? t('createEvent.helperText.doublesMatchLevel')
                : t('createEvent.helperText.singlesMatchLevel')}
            </Text>
          </View>
        )}

        {/* Available Languages */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('createEvent.fields.availableLanguages')}</Text>
          <TouchableOpacity
            style={styles.languageSelector}
            onPress={() => setShowLanguageModal(true)}
          >
            <Ionicons
              name='language-outline'
              size={20}
              color={themeColors.colors.onSurfaceVariant}
            />
            <Text style={styles.languageSelectorText}>
              {formData.languages.length > 0
                ? formData.languages.join(', ')
                : t('createEvent.fields.selectLanguages')}
            </Text>
            <Ionicons
              name='chevron-down-outline'
              size={20}
              color={themeColors.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {/* Auto Approval */}
        <View style={styles.fieldContainer}>
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setFormData(prev => ({ ...prev, autoApproval: !prev.autoApproval }))}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>{t('createEvent.fields.autoApproval')}</Text>
              <Text style={styles.toggleDescription}>
                {t('createEvent.toggleDescriptions.autoApprovalDetailed')}
              </Text>
            </View>
            <View style={[styles.toggleSwitch, formData.autoApproval && styles.toggleSwitchActive]}>
              <View
                style={[styles.toggleThumb, formData.autoApproval && styles.toggleThumbActive]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Participation Fee */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('createEvent.fields.participationFee')}</Text>
          <View style={styles.feeInputContainer}>
            <Text style={styles.currencySymbol}>{currencySymbol}</Text>
            <TextInput
              style={styles.feeInput}
              value={
                typeof formData.participationFee === 'number'
                  ? String(formData.participationFee)
                  : formData.participationFee
              }
              onChangeText={text =>
                setFormData(prev => ({ ...prev, participationFee: text.replace(/[^0-9]/g, '') }))
              }
              placeholder={t('createEvent.fields.feePlaceholder')}
              placeholderTextColor={themeColors.colors.onSurfaceVariant}
              keyboardType='numeric'
            />
          </View>
        </View>

        {/* Friend Invitations - Enabled for singles matches and meetups */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('createEvent.fields.inviteFriends')}</Text>
          <TouchableOpacity
            style={[styles.inviteButton, !canInviteFriends && styles.inviteButtonDisabled]}
            onPress={() => canInviteFriends && setShowFriendInviteModal(true)}
            disabled={!canInviteFriends}
          >
            <Ionicons
              name='person-add-outline'
              size={20}
              color={
                canInviteFriends ? themeColors.colors.primary : themeColors.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.inviteButtonText,
                !canInviteFriends && styles.inviteButtonTextDisabled,
              ]}
            >
              {t('createEvent.fields.inviteAppUsers')}
            </Text>
            {selectedFriends.length > 0 && (
              <View style={styles.inviteCount}>
                <Text style={styles.inviteCountText}>{selectedFriends.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Display selected friends */}
          {selectedFriends.length > 0 && (
            <View style={styles.invitedFriendsDisplayContainer}>
              {selectedFriends.map(friend => (
                <View key={friend.id} style={styles.invitedFriendItem}>
                  <Ionicons name='person' size={16} color={themeColors.colors.onSurfaceVariant} />
                  <Text style={styles.invitedFriendName}>{friend.displayName}</Text>
                  {/* 🎯 [LPR DISPLAY] Show LPR level */}
                  {friend.ltrLevel && (
                    <View style={styles.invitedFriendLtrBadge}>
                      <Text style={styles.invitedFriendLtrText}>LPR {friend.ltrLevel}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFriends(prev => prev.filter(f => f.id !== friend.id));
                      setFormData(prev => ({
                        ...prev,
                        invitedFriends: prev.invitedFriends.filter(
                          (id: string) => id !== friend.id
                        ),
                      }));
                    }}
                  >
                    <Ionicons name='close-circle' size={18} color={themeColors.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* SMS Invitations - Enabled for singles matches and meetups */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('createEvent.fields.smsFriendInvitations')}</Text>
          <TouchableOpacity
            style={[styles.inviteButton, !canInviteFriends && styles.inviteButtonDisabled]}
            onPress={() => canInviteFriends && setShowSMSInviteModal(true)}
            disabled={!canInviteFriends}
          >
            <Ionicons
              name='chatbubble-outline'
              size={20}
              color={
                canInviteFriends ? themeColors.colors.primary : themeColors.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.inviteButtonText,
                !canInviteFriends && styles.inviteButtonTextDisabled,
              ]}
            >
              {t('createEvent.fields.sendSmsInvitations')}
            </Text>
            {formData.smsInvites.length > 0 && (
              <View style={styles.inviteCount}>
                <Text style={styles.inviteCountText}>{formData.smsInvites.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.smsDescription}>{t('createEvent.sms.descriptionDetailed')}</Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name='information-circle-outline'
            size={20}
            color={themeColors.colors.primary}
          />
          <Text style={styles.infoText}>
            {isMatch ? t('createEvent.infoText.matchInfo') : t('createEvent.infoText.meetupInfo')}
          </Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('createEvent.modals.selectLanguages')}</Text>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalConfirmText}>{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.languageList}>
              {[
                t('createEvent.languages.korean'),
                t('createEvent.languages.english'),
                t('createEvent.languages.chinese'),
                t('createEvent.languages.japanese'),
                t('createEvent.languages.spanish'),
                t('createEvent.languages.french'),
                t('createEvent.languages.german'),
                t('createEvent.languages.italian'),
                t('createEvent.languages.portuguese'),
                t('createEvent.languages.russian'),
              ].map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={styles.languageItem}
                  onPress={() => {
                    const newLanguages = formData.languages.includes(lang)
                      ? formData.languages.filter((l: string) => l !== lang)
                      : [...formData.languages, lang];
                    setFormData(prev => ({ ...prev, languages: newLanguages }));
                  }}
                >
                  <Text style={styles.languageItemText}>{lang}</Text>
                  {formData.languages.includes(lang) && (
                    <Ionicons name='checkmark' size={20} color={themeColors.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Friend Invite Modal */}
      <Modal
        visible={showFriendInviteModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowFriendInviteModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.colors.background }}>
          {/* Modal Header */}
          <View style={styles.partnerModalHeader}>
            <TouchableOpacity onPress={() => setShowFriendInviteModal(false)}>
              <Ionicons name='close' size={24} color={themeColors.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.partnerModalTitle}>{t('createEvent.fields.inviteFriends')}</Text>
            <TouchableOpacity onPress={handleConfirmFriendInvites}>
              <Text style={[styles.modalConfirmText, { fontSize: 16 }]}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>

          {/* 🎯 [KIM FIX] Filter Info Banner - Show game type and LPR range */}
          {isSinglesMatch && (
            <View
              style={{
                backgroundColor: themeColors.colors.surface,
                borderWidth: 1,
                borderColor: themeColors.colors.outline,
                borderRadius: 12,
                marginHorizontal: 16,
                marginTop: 12,
                marginBottom: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name='filter'
                size={16}
                color={themeColors.colors.primary}
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: themeColors.colors.onSurface,
                  }}
                >
                  {getGameTypeLabel(formData.gameType)} · LPR {getHostLtrLevel()} -{' '}
                  {Math.min(getHostLtrLevel() + 1, 10)}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: themeColors.colors.onSurfaceVariant,
                    marginTop: 2,
                  }}
                >
                  {t('createEvent.friendInviteFilter.description')}
                </Text>
              </View>
            </View>
          )}

          {/* Selected Friends Display */}
          {selectedFriends.length > 0 && (
            <View style={styles.selectedFriendsContainer}>
              <Text style={styles.selectedFriendsLabel}>
                {t('createEvent.selectedFriends', { count: selectedFriends.length })}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedFriends.map(friend => (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.selectedFriendChip}
                    onPress={() => handleToggleFriend(friend)}
                  >
                    <Text style={styles.selectedFriendName}>{friend.displayName}</Text>
                    {/* 🎯 [LPR DISPLAY] Show LPR in modal chip */}
                    {friend.ltrLevel && (
                      <Text style={styles.selectedFriendLtr}>LPR {friend.ltrLevel}</Text>
                    )}
                    <Ionicons name='close-circle' size={18} color={themeColors.colors.error} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Search Input */}
          <View style={styles.partnerSearchContainer}>
            <View style={styles.partnerSearchInputWrapper}>
              <Ionicons
                name='search'
                size={20}
                color={themeColors.colors.onSurfaceVariant}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.partnerSearchInput}
                value={friendSearchQuery}
                onChangeText={text => {
                  setFriendSearchQuery(text);
                  // 🎯 [STALE CLOSURE FIX] Pass gameType explicitly
                  searchFriendsToInvite(text, formData.gameType);
                }}
                placeholder={t('createEvent.search.searchByName')}
                placeholderTextColor={themeColors.colors.onSurfaceVariant}
              />
            </View>
          </View>

          {/* User List */}
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {loadingFriends ? (
              <View style={styles.partnerLoadingContainer}>
                <ActivityIndicator size='large' color={themeColors.colors.primary} />
                <Text style={styles.partnerLoadingText}>
                  {t('createEvent.search.searchingUsers')}
                </Text>
              </View>
            ) : friendSearchResults.length === 0 ? (
              <View style={styles.partnerEmptyContainer}>
                <Ionicons
                  name='people-outline'
                  size={48}
                  color={themeColors.colors.onSurfaceVariant}
                />
                <Text style={styles.partnerEmptyText}>
                  {friendSearchQuery
                    ? t('createEvent.search.noResults')
                    : t('createEvent.search.searchPrompt')}
                </Text>
              </View>
            ) : (
              <FlatList
                data={friendSearchResults}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedFriends.some(f => f.id === item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.partnerUserItem, isSelected && styles.friendUserItemSelected]}
                      onPress={() => handleToggleFriend(item)}
                    >
                      {/* 🎯 [KIM FIX] Show profile image if available */}
                      {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={styles.partnerUserAvatar} />
                      ) : (
                        <View
                          style={[styles.partnerUserAvatar, styles.partnerUserAvatarPlaceholder]}
                        >
                          <Ionicons
                            name='person'
                            size={24}
                            color={themeColors.colors.onSurfaceVariant}
                          />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.partnerUserName}>{item.displayName}</Text>
                        <Text style={styles.partnerUserNtrp}>
                          {/* 🎯 [KIM FIX] Show LPR, Gender symbols ♂/♀, and Distance */}
                          {[
                            item.ltrLevel ? `LPR ${item.ltrLevel}` : null,
                            item.gender === 'male' || item.gender === t('createEvent.genders.male')
                              ? '♂'
                              : item.gender === 'female' ||
                                  item.gender === t('createEvent.genders.female')
                                ? '♀'
                                : null,
                            item.distance !== undefined
                              ? formatDistance(item.distance, userCountry, t)
                              : t('createEvent.search.noLocationInfo'),
                          ]
                            .filter(Boolean)
                            .join(' · ') || t('createEvent.fields.levelNotSet')}
                        </Text>
                      </View>
                      <View
                        style={[styles.friendCheckbox, isSelected && styles.friendCheckboxSelected]}
                      >
                        {isSelected && (
                          <Ionicons
                            name='checkmark'
                            size={16}
                            color={themeColors.colors.onPrimary}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
            )}
          </View>

          {/* Load Initial Users Button */}
          {!loadingFriends && friendSearchResults.length === 0 && !friendSearchQuery && (
            <View style={styles.partnerLoadButtonContainer}>
              <TouchableOpacity
                style={styles.partnerLoadButton}
                // 🎯 [STALE CLOSURE FIX] Pass gameType explicitly
                onPress={() => searchFriendsToInvite('', formData.gameType)}
              >
                <Text style={styles.partnerLoadButtonText}>
                  {t('createEvent.search.loadUsers')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* SMS Invite Modal */}
      <Modal
        visible={showSMSInviteModal}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setShowSMSInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSMSInviteModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('createEvent.modals.smsInvitation')}</Text>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => {
                  if (tempSMSNumber.trim()) {
                    setFormData(prev => ({
                      ...prev,
                      smsInvites: [...prev.smsInvites, tempSMSNumber.trim()],
                    }));
                    setTempSMSNumber('');
                  }
                  setShowSMSInviteModal(false);
                }}
              >
                <Text style={styles.modalConfirmText}>{t('createEvent.modals.add')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.smsInviteContent}>
              <TextInput
                style={styles.smsInput}
                value={tempSMSNumber}
                onChangeText={setTempSMSNumber}
                placeholder={phonePlaceholder}
                placeholderTextColor={themeColors.colors.onSurfaceVariant}
                keyboardType='phone-pad'
              />

              {formData.smsInvites.length > 0 && (
                <View style={styles.smsInvitesList}>
                  <Text style={styles.smsInvitesTitle}>{t('createEvent.sms.numbersToInvite')}</Text>
                  {formData.smsInvites.map((number: string, index: number) => (
                    <View key={index} style={styles.smsInviteItem}>
                      <Text style={styles.smsInviteNumber}>{number}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setFormData(prev => ({
                            ...prev,
                            smsInvites: prev.smsInvites.filter(
                              (_: string, i: number) => i !== index
                            ),
                          }));
                        }}
                      >
                        <Ionicons name='close-circle' size={20} color={themeColors.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 🎯 [KIM FIX] Date Picker Modal - iOS uses datetime spinner, Android uses separate date/time pickers */}
      {Platform.OS === 'ios' ? (
        // iOS: Modal with datetime spinner
        <Modal
          visible={isDatePickerOpen}
          transparent={true}
          animationType='slide'
          onRequestClose={() => setIsDatePickerOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsDatePickerOpen(false)}
                >
                  <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{t('createEvent.modals.selectDateTime')}</Text>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={() => setIsDatePickerOpen(false)}
                >
                  <Text style={styles.modalConfirmText}>{t('common.ok')}</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={selectedDate}
                mode='datetime'
                display='spinner'
                onChange={(_event, date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                locale={currentLanguage}
                themeVariant={currentTheme}
                accentColor={themeColors.colors.primary}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      ) : (
        // Android: Separate date and time pickers (native dialogs)
        <>
          {isDatePickerOpen && (
            <DateTimePicker
              value={selectedDate}
              mode='date'
              display='default'
              onChange={(event, date) => {
                setIsDatePickerOpen(false);
                if (event.type === 'set' && date) {
                  // 날짜 선택 완료 -> 시간 선택기 열기
                  const newDate = new Date(selectedDate);
                  newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setSelectedDate(newDate);
                  // 짧은 딜레이 후 시간 선택기 열기 (Android에서 연속 다이얼로그 문제 방지)
                  setTimeout(() => {
                    setIsTimePickerOpen(true);
                  }, 100);
                }
              }}
            />
          )}
          {isTimePickerOpen && (
            <DateTimePicker
              value={selectedDate}
              mode='time'
              display='default'
              onChange={(event, time) => {
                setIsTimePickerOpen(false);
                if (event.type === 'set' && time) {
                  // 시간 선택 완료
                  const newDate = new Date(selectedDate);
                  newDate.setHours(time.getHours(), time.getMinutes());
                  setSelectedDate(newDate);
                }
              }}
            />
          )}
        </>
      )}

      {/* Partner Selection Modal */}
      <Modal
        visible={showPartnerModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowPartnerModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.colors.background }}>
          {/* Modal Header */}
          <View style={styles.partnerModalHeader}>
            <TouchableOpacity onPress={() => setShowPartnerModal(false)}>
              <Ionicons name='close' size={24} color={themeColors.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.partnerModalTitle}>{t('createEvent.modals.selectPartner')}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search Input */}
          <View style={styles.partnerSearchContainer}>
            <View style={styles.partnerSearchInputWrapper}>
              <Ionicons
                name='search'
                size={20}
                color={themeColors.colors.onSurfaceVariant}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.partnerSearchInput}
                value={searchQuery}
                onChangeText={text => {
                  setSearchQuery(text);
                  loadUsers(text);
                }}
                placeholder={t('createEvent.search.searchByName')}
                placeholderTextColor={themeColors.colors.onSurfaceVariant}
              />
            </View>
          </View>

          {/* 🎯 [KIM FIX] LPR Filter Explanation */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text
              style={{
                fontSize: 12,
                color: themeColors.colors.onSurfaceVariant,
                fontStyle: 'italic',
              }}
            >
              {t('createEvent.search.partnerLevelFilter')}
            </Text>
            {/* 🎾 Partner Invite Flow Explanation */}
            <Text
              style={{
                fontSize: 12,
                color: themeColors.colors.primary,
                fontStyle: 'italic',
                marginTop: 4,
              }}
            >
              {t('createEvent.search.partnerInviteExplanation')}
            </Text>
          </View>

          {/* User List */}
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {loadingUsers ? (
              <View style={styles.partnerLoadingContainer}>
                <ActivityIndicator size='large' color={themeColors.colors.primary} />
                <Text style={styles.partnerLoadingText}>
                  {t('createEvent.search.searchingUsers')}
                </Text>
              </View>
            ) : users.length === 0 ? (
              <View style={styles.partnerEmptyContainer}>
                <Ionicons
                  name='people-outline'
                  size={48}
                  color={themeColors.colors.onSurfaceVariant}
                />
                <Text style={styles.partnerEmptyText}>
                  {searchQuery
                    ? t('createEvent.search.noResults')
                    : t('createEvent.search.searchPrompt')}
                </Text>
              </View>
            ) : (
              <FlatList
                data={users}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.partnerUserItem}
                    onPress={() => handleSelectPartner(item)}
                  >
                    {/* 🎯 [KIM FIX] Show profile image if available */}
                    {item.photoURL ? (
                      <Image source={{ uri: item.photoURL }} style={styles.partnerUserAvatar} />
                    ) : (
                      <View style={[styles.partnerUserAvatar, styles.partnerUserAvatarPlaceholder]}>
                        <Ionicons
                          name='person'
                          size={24}
                          color={themeColors.colors.onSurfaceVariant}
                        />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.partnerUserName}>{item.displayName}</Text>
                        {/* 🎯 [KIM FIX] Show gender icon only for male/female */}
                        {(item.gender === 'male' ||
                          item.gender === t('createEvent.genders.male') ||
                          item.gender === 'female' ||
                          item.gender === t('createEvent.genders.female')) && (
                          <Text
                            style={{
                              marginLeft: 6,
                              fontSize: 14,
                              color:
                                item.gender === 'male' ||
                                item.gender === t('createEvent.genders.male')
                                  ? '#4A90D9'
                                  : '#E91E8C',
                            }}
                          >
                            {item.gender === 'male' || item.gender === t('createEvent.genders.male')
                              ? '♂'
                              : '♀'}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.partnerUserNtrp}>
                        {/* 🎯 [KIM FIX] Show LPR and Distance */}
                        {[
                          item.ltrLevel ? `LPR ${item.ltrLevel}` : null,
                          item.distance !== undefined
                            ? formatDistance(item.distance, userCountry, t)
                            : t('createEvent.search.noLocationInfo'),
                        ]
                          .filter(Boolean)
                          .join(' · ') || t('createEvent.fields.levelNotSet')}
                      </Text>
                    </View>
                    <Ionicons
                      name='chevron-forward'
                      size={20}
                      color={themeColors.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
            )}
          </View>

          {/* Load Initial Users Button */}
          {!loadingUsers && users.length === 0 && !searchQuery && (
            <View style={styles.partnerLoadButtonContainer}>
              <TouchableOpacity style={styles.partnerLoadButton} onPress={() => loadUsers()}>
                <Text style={styles.partnerLoadButtonText}>
                  {t('createEvent.search.loadUsers')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    backButton: {
      padding: 8,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
    },
    eventTypeIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    eventTypeIcon: {
      fontSize: 16,
      marginRight: 4,
    },
    eventTypeText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: colors.onPrimary,
      fontWeight: '600',
      fontSize: 14,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
    },
    fieldContainer: {
      marginBottom: 20,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    fieldDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 12,
      lineHeight: 20,
    },
    fieldWarning: {
      fontSize: 12,
      color: colors.error,
      marginBottom: 12,
      lineHeight: 16,
      fontStyle: 'italic',
    },
    textInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.onSurface,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    multilineInput: {
      height: 80,
      textAlignVertical: 'top',
    },
    locationInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    locationTextInput: {
      flex: 1,
      fontSize: 16,
      color: colors.onSurface,
      marginHorizontal: 12,
    },
    locationPlaceholder: {
      color: colors.onSurfaceVariant,
    },
    dateTimeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    dateTimeButtonText: {
      fontSize: 16,
      color: colors.onSurface,
      marginLeft: 12,
      flex: 1,
    },
    skillLevelContainer: {
      gap: 8,
    },
    skillLevelButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
    },
    skillLevelButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    skillLevelButtonText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
      textAlign: 'center',
    },
    skillLevelButtonTextActive: {
      color: colors.surface,
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surfaceVariant,
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: colors.primary,
      marginLeft: 12,
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34, // Safe area padding for iOS
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    modalCancelButton: {
      padding: 4,
    },
    modalCancelText: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
    },
    modalConfirmButton: {
      padding: 4,
    },
    modalConfirmText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    datePicker: {
      backgroundColor: colors.surface,
      height: 200,
    },
    // Game Type Styles
    gameTypeContainer: {
      gap: 8,
    },
    gameTypeButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
    },
    gameTypeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    gameTypeButtonText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
      textAlign: 'center',
    },
    gameTypeButtonTextActive: {
      color: colors.surface,
    },
    gameTypeButtonDisabled: {
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.outline,
      opacity: 0.3,
    },
    gameTypeButtonTextDisabled: {
      color: colors.onSurfaceVariant,
      opacity: 0.4,
    },
    // NTRP Styles
    ntrpContainer: {
      gap: 8,
    },
    ntrpButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
    },
    ntrpButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    ntrpButtonText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
      textAlign: 'center',
    },
    ntrpButtonTextActive: {
      color: colors.surface,
    },
    // NTRP Checkbox Styles
    ntrpCheckboxItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
      marginBottom: 8,
      overflow: 'hidden',
    },
    ntrpCheckboxItemActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer, // 🎯 [KIM FIX] 다크모드 지원
    },
    ntrpCheckboxContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    ntrpCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    ntrpCheckboxActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    ntrpLabelContainer: {
      flex: 1,
    },
    ntrpLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 2,
    },
    ntrpLabelActive: {
      color: colors.primary,
    },
    ntrpDescription: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      lineHeight: 18,
    },
    // NTRP Disabled Styles
    ntrpCheckboxItemDisabled: {
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.outline,
      opacity: 0.3,
    },
    ntrpCheckboxDisabled: {
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.outline,
      opacity: 0.3,
    },
    ntrpLabelDisabled: {
      color: colors.onSurfaceVariant,
      opacity: 0.4,
    },
    ntrpDescriptionDisabled: {
      color: colors.onSurfaceVariant,
      opacity: 0.3,
    },
    // Language Selector Styles
    languageSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    languageSelectorText: {
      flex: 1,
      fontSize: 16,
      color: colors.onSurface,
      marginLeft: 12,
    },
    languageList: {
      padding: 20,
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    languageItemText: {
      fontSize: 16,
      color: colors.onSurface,
    },
    // Toggle Styles
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    toggleInfo: {
      flex: 1,
    },
    toggleTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 2,
    },
    toggleDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    helperText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    toggleSwitch: {
      width: 50,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.outline,
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    toggleSwitchActive: {
      backgroundColor: colors.primary,
    },
    toggleThumb: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 4,
    },
    toggleThumbActive: {
      alignSelf: 'flex-end',
    },
    // Fee Input Styles
    feeInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
      paddingHorizontal: 16,
    },
    currencySymbol: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      marginRight: 8,
    },
    feeInput: {
      flex: 1,
      fontSize: 16,
      color: colors.onSurface,
      paddingVertical: 12,
    },
    // Invite Button Styles
    inviteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    // 🎯 [FRIEND INVITE] Disabled state for invite button
    inviteButtonDisabled: {
      borderColor: colors.outline,
      opacity: 0.5,
    },
    inviteButtonText: {
      flex: 1,
      fontSize: 16,
      color: colors.primary,
      marginLeft: 12,
      fontWeight: '500',
    },
    // 🎯 [FRIEND INVITE] Disabled state for invite button text
    inviteButtonTextDisabled: {
      color: colors.onSurfaceVariant,
    },
    inviteCount: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inviteCountText: {
      color: colors.surface,
      fontSize: 12,
      fontWeight: '600',
    },
    smsDescription: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 8,
      lineHeight: 16,
    },
    // SMS Modal Styles
    smsInviteContent: {
      padding: 20,
    },
    smsInput: {
      backgroundColor: colors.surfaceVariant, // 🎯 [KIM FIX] Use theme color for dark mode support
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.onSurface,
      marginBottom: 16,
    },
    smsInvitesList: {
      marginTop: 8,
    },
    smsInvitesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    smsInviteItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    smsInviteNumber: {
      fontSize: 16,
      color: colors.onSurface,
    },
    friendsList: {
      padding: 40,
      alignItems: 'center',
    },
    comingSoonText: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    // Auto Participant Styles
    autoParticipantContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    autoParticipantContent: {
      flex: 1,
      marginLeft: 12,
    },
    autoParticipantCount: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 2,
    },
    autoParticipantDescription: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      lineHeight: 18,
    },
    autoParticipantBadge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    autoParticipantBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    // Partner Selection Styles
    partnerDisplayButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
      marginTop: 16,
    },
    partnerLabel: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    partnerValue: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.onSurface,
    },
    partnerModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    partnerModalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
    },
    partnerSearchContainer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    partnerSearchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    partnerSearchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.onSurface,
    },
    partnerLoadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    partnerLoadingText: {
      marginTop: 12,
      color: colors.onSurfaceVariant,
    },
    partnerEmptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    partnerEmptyText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    partnerUserItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    partnerUserAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
    },
    // 🎯 [KIM FIX] Placeholder style for when no profile image
    partnerUserAvatarPlaceholder: {
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    partnerUserName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    partnerUserNtrp: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    partnerLoadButtonContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    partnerLoadButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    partnerLoadButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    autoNtrpContainer: {
      padding: 16,
      borderRadius: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    autoNtrpText: {
      fontSize: 15,
      fontWeight: '500',
    },
    autoNtrpSum: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 8,
    },
    autoNtrpBadge: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 4,
    },
    // 🎯 Friend invite styles
    selectedFriendsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surfaceVariant,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    selectedFriendsLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    selectedFriendChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      gap: 6,
    },
    selectedFriendName: {
      fontSize: 14,
      color: colors.onPrimary,
      fontWeight: '500',
    },
    friendUserItemSelected: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}10`,
    },
    friendCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    friendCheckboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    invitedFriendsDisplayContainer: {
      marginTop: 12,
      gap: 8,
    },
    invitedFriendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    invitedFriendName: {
      flex: 1,
      fontSize: 14,
      color: colors.onSurface,
    },
    // 🎯 [LPR DISPLAY] Styles for LPR badge in invited friends list
    invitedFriendLtrBadge: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginRight: 4,
    },
    invitedFriendLtrText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.onPrimaryContainer,
    },
    selectedFriendLtr: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 4,
    },
  });

export default CreateEventForm;
