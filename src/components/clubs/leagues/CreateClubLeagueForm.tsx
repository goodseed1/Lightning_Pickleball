import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarModal } from '../../common/CalendarModal';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../hooks/useTheme';
import leagueService from '../../../services/leagueService';
import {
  CreateLeagueRequest,
  LeagueSettings,
  PickleballEventType,
  getPickleballEventTypeDisplayName,
} from '../../../types/league';

// 🛡️ 가디언: 리그 시작을 위한 최소 인원 상수
const MIN_START_PARTICIPANTS = 6;

interface CreateClubLeagueFormProps {
  clubId: string;
  onSuccess?: (leagueId: string) => void;
  onCancel?: () => void;
}

const CreateClubLeagueForm: React.FC<CreateClubLeagueFormProps> = ({
  clubId,
  onSuccess,
  onCancel,
}) => {
  const { t, currentLanguage } = useLanguage();
  const { paperTheme: theme } = useTheme();
  const [saving, setSaving] = useState(false);

  // Form states (요구사항에 맞는 필드들)
  const [name, setName] = useState(''); // 요구사항: 시즌 이름
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<PickleballEventType>('mens_singles'); // ⭐ 경기 종류
  const [applicationDeadline, setApplicationDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ); // 일주일 후
  const [startDate, setStartDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)); // 2주일 후
  const [endDate, setEndDate] = useState(new Date(Date.now() + (14 + 60) * 24 * 60 * 60 * 1000)); // 시작일로부터 2개월 후

  // League settings (기본값)
  const [minParticipants, setMinParticipants] = useState('4');
  const [maxParticipants, setMaxParticipants] = useState('16');
  const [entryFee, setEntryFee] = useState('0');

  // 🛡️ 가디언: 최대 인원 유효성 검사 상태
  const [isMaxParticipantsValid, setIsMaxParticipantsValid] = useState(true);

  // ⭐ 경기 종류 옵션들
  const eventTypeOptions: {
    value: PickleballEventType;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    description: string;
  }[] = [
    {
      value: 'mens_singles',
      label: t('createClubLeague.eventType.mensSingles'),
      icon: 'person-outline',
      description: t('createClubLeague.eventType.mensSinglesDesc'),
    },
    {
      value: 'womens_singles',
      label: t('createClubLeague.eventType.womensSingles'),
      icon: 'person-outline',
      description: t('createClubLeague.eventType.womensSinglesDesc'),
    },
    {
      value: 'mens_doubles',
      label: t('createClubLeague.eventType.mensDoubles'),
      icon: 'people-outline',
      description: t('createClubLeague.eventType.mensDoublesDesc'),
    },
    {
      value: 'womens_doubles',
      label: t('createClubLeague.eventType.womensDoubles'),
      icon: 'people-outline',
      description: t('createClubLeague.eventType.womensDoublesDesc'),
    },
    {
      value: 'mixed_doubles',
      label: t('createClubLeague.eventType.mixedDoubles'),
      icon: 'heart-outline',
      description: t('createClubLeague.eventType.mixedDoublesDesc'),
    },
  ];

  // Calendar modal state
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<
    'deadline' | 'startDate' | 'endDate' | null
  >(null);

  // 🛡️ 가디언: 실시간 최대 인원 유효성 검사
  useEffect(() => {
    const numMax = Number(maxParticipants);
    const numMin = Number(minParticipants);

    // maxParticipants가 최소 시작 인원 이상이고, minParticipants 이상인지 검증
    const isValid = numMax >= MIN_START_PARTICIPANTS && numMax >= numMin && numMax > 0;
    setIsMaxParticipantsValid(isValid);

    console.log('🛡️ [GUARDIAN] Validating max participants:', {
      maxParticipants: numMax,
      minParticipants: numMin,
      minStartRequired: MIN_START_PARTICIPANTS,
      isValid,
    });
  }, [maxParticipants, minParticipants]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('createClubLeague.validation.nameRequired'));
      return false;
    }

    // 날짜 유효성 검증
    if (applicationDeadline > startDate) {
      Alert.alert(t('common.error'), t('createClubLeague.validation.deadlineBeforeStart'));
      return false;
    }

    if (startDate > endDate) {
      Alert.alert(t('common.error'), t('createClubLeague.validation.endAfterStart'));
      return false;
    }

    // 참가자 수 제한은 제거 (관리자가 나중에 승인/거절 할 수 있도록)

    return true;
  };

  const handleCreateLeague = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // 폼에서 입력받은 날짜들 사용

      // Default league settings
      const defaultSettings: LeagueSettings = {
        format: 'round_robin',
        scoringSystem: 'pickleball',
        pointsForWin: 2,
        pointsForLoss: 0,
        minParticipants: parseInt(minParticipants) || 4,
        maxParticipants: parseInt(maxParticipants) || 16,
        tiebreakRules: [
          { order: 1, type: 'head_to_head' },
          { order: 2, type: 'goal_difference' },
          { order: 3, type: 'goals_scored' },
        ],
        allowPostponements: true,
        maxPostponements: 2,
        defaultMatchDuration: 120,
      };

      // Create league request
      const leagueRequest: CreateLeagueRequest = {
        clubId,
        seasonName: name.trim(), // 요구사항: name 필드 사용
        title: name.trim(), // Use season name as title
        eventType: eventType, // ⭐ 경기 종류 추가
        description: description.trim() || '',
        settings: defaultSettings,
        startDate,
        endDate,
        registrationDeadline: applicationDeadline, // 요구사항: applicationDeadline 사용
        entryFee: (() => {
          const feeAmount = parseFloat(entryFee);
          return !isNaN(feeAmount)
            ? {
                amount: feeAmount,
                currency: 'USD',
              }
            : undefined;
        })(),
      };

      // Create league (status: 'preparing'로 생성됨)
      const leagueId = await leagueService.createLeague(leagueRequest);

      Alert.alert(t('common.success'), t('createClubLeague.success.created'), [
        {
          text: t('common.ok'),
          onPress: () => onSuccess?.(leagueId),
        },
      ]);
    } catch (error) {
      console.error('Error creating league:', error);
      Alert.alert(t('common.error'), t('createClubLeague.error.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Calendar modal handlers
  const openCalendarFor = (field: 'deadline' | 'startDate' | 'endDate') => {
    console.log('🗓️ Opening calendar for:', field);
    setCurrentDateField(field);
    setCalendarVisible(true);
  };

  const handleDaySelect = (day: { timestamp: number; dateString: string }) => {
    // 💥 기존 코드 (타임스탬프를 그대로 사용) - 시간대 변칙 발생
    // const selectedDate = new Date(day.timestamp);

    // ✨ 수정된 코드 (UTC 연/월/일을 사용하여 현지 시간대 날짜로 재구성)
    // 1. UTC 자정 기준의 날짜 객체를 생성합니다.
    const initialDate = new Date(day.timestamp);
    // 2. 이 객체에서 UTC 연/월/일을 추출하여, 시간대 정보가 없는 순수한 날짜 객체를 새로 만듭니다.
    // 이렇게 하면 사용자의 현지 시간대 기준으로 '선택된 날짜 00:00:00'이 됩니다.
    const selectedDate = new Date(
      initialDate.getUTCFullYear(),
      initialDate.getUTCMonth(),
      initialDate.getUTCDate()
    );

    console.log('🗓️ [TIMEZONE FIX] Original timestamp:', day.timestamp);
    console.log('🗓️ [TIMEZONE FIX] Initial UTC date:', initialDate.toISOString());
    console.log('🗓️ [TIMEZONE FIX] Corrected local date:', selectedDate.toString());
    console.log('🗓️ [TIMEZONE FIX] Selected for field:', currentDateField);

    if (currentDateField === 'deadline') {
      setApplicationDeadline(selectedDate);
    } else if (currentDateField === 'startDate') {
      setStartDate(selectedDate);
    } else if (currentDateField === 'endDate') {
      setEndDate(selectedDate);
    }

    setCalendarVisible(false);
    setCurrentDateField(null);
  };

  // Language code to locale mapping for date formatting
  const getDateLocale = (): string => {
    const localeMap: Record<string, string> = {
      en: 'en-US',
      ko: 'ko-KR',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      ja: 'ja-JP',
      zh: 'zh-CN',
      pt: 'pt-BR',
      it: 'it-IT',
      ru: 'ru-RU',
    };
    return localeMap[currentLanguage] || 'en-US';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(getDateLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ⭐ 경기 종류 변경 핸들러
  const handleEventTypeChange = (newEventType: PickleballEventType) => {
    setEventType(newEventType);

    // 경기 종류에 따라 리그 이름 자동 설정 (현재 언어 기준)
    if (!name.trim()) {
      const eventTypeName = getPickleballEventTypeDisplayName(newEventType, t);
      const currentYear = new Date().getFullYear();
      // 번역된 placeholder 형식 사용: "e.g., 2026 Men's Singles League" 형태에서 이름 부분만 추출
      setName(`${currentYear} ${eventTypeName} League`);
    }

    // 복식인 경우 최소 참가자 수 조정
    const isDoubles = newEventType.includes('doubles');
    if (isDoubles && parseInt(minParticipants) < 4) {
      setMinParticipants('4');
    }
    if (isDoubles && parseInt(maxParticipants) < 8) {
      setMaxParticipants('8');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {t('createClubLeague.header.title')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {t('createClubLeague.header.subtitle')}
        </Text>
      </View>

      {/* ⭐ Pickleball Event Type Selection */}
      <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('createClubLeague.matchType.title')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {t('createClubLeague.matchType.subtitle')}
        </Text>

        <View style={styles.eventTypeGrid}>
          {eventTypeOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.eventTypeOption,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
                eventType === option.value && {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primary + '15',
                },
              ]}
              onPress={() => handleEventTypeChange(option.value)}
            >
              <Ionicons
                name={option.icon}
                size={24}
                color={
                  eventType === option.value ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.eventTypeText,
                  { color: theme.colors.onSurface },
                  eventType === option.value && { color: theme.colors.primary },
                ]}
              >
                {option.label}
              </Text>
              <Text style={[styles.eventTypeDescription, { color: theme.colors.onSurfaceVariant }]}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.eventTypeInfo, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons
            name='information-circle-outline'
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.eventTypeInfoText, { color: theme.colors.onSurfaceVariant }]}>
            {t('createClubLeague.matchType.selected')}:{' '}
            {getPickleballEventTypeDisplayName(eventType, t)}
            {eventType.includes('doubles')
              ? ` ${t('createClubLeague.matchType.doublesNote')}`
              : ` ${t('createClubLeague.matchType.singlesNote')}`}
          </Text>
        </View>
      </View>

      {/* Season Name Input */}
      <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('createClubLeague.leagueInfo.title')}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
            {t('createClubLeague.leagueInfo.seasonName')}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
                color: theme.colors.onSurface,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder={t('createClubLeague.leagueInfo.seasonNamePlaceholder', {
              year: new Date().getFullYear(),
              eventType: getPickleballEventTypeDisplayName(eventType, t),
            })}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
            {t('createClubLeague.leagueInfo.description')}
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
                color: theme.colors.onSurface,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('createClubLeague.leagueInfo.descriptionPlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 날짜 선택 */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
            {t('createClubLeague.dates.applicationDeadline')}
          </Text>
          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
            ]}
            onPress={() => openCalendarFor('deadline')}
          >
            <Text style={[styles.dateButtonText, { color: theme.colors.onSurface }]}>
              {formatDate(applicationDeadline)}
            </Text>
            <Ionicons name='calendar-outline' size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
              {t('createClubLeague.dates.startDate')}
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
              ]}
              onPress={() => openCalendarFor('startDate')}
            >
              <Text style={[styles.dateButtonText, { color: theme.colors.onSurface }]}>
                {formatDate(startDate)}
              </Text>
              <Ionicons name='calendar-outline' size={16} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
              {t('createClubLeague.dates.endDate')}
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
              ]}
              onPress={() => openCalendarFor('endDate')}
            >
              <Text style={[styles.dateButtonText, { color: theme.colors.onSurface }]}>
                {formatDate(endDate)}
              </Text>
              <Ionicons name='calendar-outline' size={16} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
              {t('createClubLeague.settings.entryFee')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                  color: theme.colors.onSurface,
                },
              ]}
              value={entryFee}
              onChangeText={setEntryFee}
              placeholder='25'
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType='numeric'
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
              {t('createClubLeague.settings.maxPlayers')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                  color: theme.colors.onSurface,
                },
                !isMaxParticipantsValid && styles.inputError,
              ]}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              placeholder='16'
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType='numeric'
            />
            {/* 🛡️ 가디언: 최대 인원 유효성 오류 메시지 */}
            {!isMaxParticipantsValid && (
              <Text style={styles.errorText}>
                {t('createClubLeague.validation.maxParticipantsMin', {
                  min: MIN_START_PARTICIPANTS,
                })}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.onSurfaceVariant }]}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.createButton,
            (saving || !name.trim() || !isMaxParticipantsValid) && styles.buttonDisabled,
          ]}
          onPress={handleCreateLeague}
          disabled={saving || !name.trim() || !isMaxParticipantsValid}
        >
          {saving ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <>
              <Ionicons name='trophy-outline' size={20} color='#fff' />
              <Text style={styles.createButtonText}>{t('createClubLeague.buttons.create')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <CalendarModal
        isVisible={isCalendarVisible}
        onClose={() => {
          setCalendarVisible(false);
          setCurrentDateField(null);
        }}
        onDaySelect={handleDaySelect}
        selectedDate={
          currentDateField === 'deadline'
            ? applicationDeadline
            : currentDateField === 'startDate'
              ? startDate
              : currentDateField === 'endDate'
                ? endDate
                : undefined
        }
        minimumDate={currentDateField === 'endDate' ? startDate : new Date()}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  formSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  memberSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectAllText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  membersList: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  memberItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberSkill: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberImageContainer: {
    marginLeft: 12,
  },
  memberImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    // Default styles - colors will be overridden by inline theme styles
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // color will be overridden by inline theme styles
    color: '#666',
  },
  createButton: {
    backgroundColor: '#1976d2',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },

  // ⭐ Event Type Selection Styles
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  eventTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  eventTypeOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedEventTypeOption: {
    borderColor: '#1976d2',
    backgroundColor: '#1976d2' + '10',
  },
  eventTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedEventTypeText: {
    color: '#1976d2',
  },
  eventTypeDescription: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  eventTypeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  eventTypeInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  // 🛡️ 가디언: 오류 상태 스타일링
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 4,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#d32f2f',
    borderWidth: 2,
  },
});

export default CreateClubLeagueForm;
