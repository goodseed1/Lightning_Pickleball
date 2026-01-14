import React, { useState, useEffect, useCallback } from 'react';
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
import { useClub } from '../../../contexts/ClubContext';
import { useTheme } from '../../../hooks/useTheme';
import tournamentService from '../../../services/tournamentService';
import clubService from '../../../services/clubService';
import {
  TournamentFormat,
  TournamentMatchFormat,
  SeedingMethod,
  TournamentSettings,
} from '../../../types/tournament';
import { TennisEventType, getTennisEventTypeDisplayName } from '../../../types/league';

// Tournament constants
const MIN_START_PARTICIPANTS = 4; // Minimum for tournaments (different from leagues)

interface CreateClubTournamentFormProps {
  clubId: string;
  onSuccess?: (tournamentId: string) => void;
  onCancel?: () => void;
}

const CreateClubTournamentForm: React.FC<CreateClubTournamentFormProps> = ({
  clubId,
  onSuccess,
  onCancel,
}) => {
  const { t, currentLanguage } = useLanguage();
  const { clubMembers: contextClubMembers } = useClub();
  const { paperTheme: theme } = useTheme();
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<TennisEventType>('mens_singles');
  // 🦾 [IRON MAN] Tournament format is now hardcoded to single_elimination
  const format: TournamentFormat = 'single_elimination';
  const [matchFormat, setMatchFormat] = useState<TournamentMatchFormat>('best_of_3'); // Default: 3세트 경기 (2세트 선승)
  const [shortSets, setShortSets] = useState(false); // 🦾 [IRON MAN] 단축 세트 옵션
  const [seedingMethod, setSeedingMethod] = useState<SeedingMethod>('manual');

  const [applicationDeadline, setApplicationDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [startDate, setStartDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date(Date.now() + (14 + 7) * 24 * 60 * 60 * 1000));

  const [minParticipants, setMinParticipants] = useState('4');
  const [maxParticipants, setMaxParticipants] = useState('16');
  const [entryFee, setEntryFee] = useState('0');

  const [isMaxParticipantsValid, setIsMaxParticipantsValid] = useState(true);

  // Match format options - 세트 수만 선택 (단축 세트는 별도 옵션)
  const matchFormatOptions: {
    value: TournamentMatchFormat;
    labelKey: string;
    descriptionKey: string;
  }[] = [
    {
      value: 'best_of_1',
      labelKey: 'createClubTournament.matchFormats.best_of_1',
      descriptionKey: 'createClubTournament.matchFormats.best_of_1_description',
    },
    {
      value: 'best_of_3',
      labelKey: 'createClubTournament.matchFormats.best_of_3',
      descriptionKey: 'createClubTournament.matchFormats.best_of_3_description',
    },
    {
      value: 'best_of_5',
      labelKey: 'createClubTournament.matchFormats.best_of_5',
      descriptionKey: 'createClubTournament.matchFormats.best_of_5_description',
    },
  ];

  // Enhanced seeding method options with detailed descriptions
  const seedingOptions: {
    value: SeedingMethod;
    labelKey: string;
    descriptionKey: string;
  }[] = [
    {
      value: 'manual',
      labelKey: 'createClubTournament.seedingMethods.manual',
      descriptionKey: 'createClubTournament.seedingMethods.manual_description',
    },
    {
      value: 'random',
      labelKey: 'createClubTournament.seedingMethods.random',
      descriptionKey: 'createClubTournament.seedingMethods.random_description',
    },
    {
      value: 'ranking',
      labelKey: 'createClubTournament.seedingMethods.ranking',
      descriptionKey: 'createClubTournament.seedingMethods.ranking_description',
    },
    {
      value: 'rating',
      labelKey: 'createClubTournament.seedingMethods.rating',
      descriptionKey: 'createClubTournament.seedingMethods.rating_description',
    },
  ];

  // Tennis event type options (same as league)
  const eventTypeOptions: {
    value: TennisEventType;
    labelKey: string;
    icon: string;
    descriptionKey: string;
  }[] = [
    {
      value: 'mens_singles',
      labelKey: 'createClubTournament.eventTypes.mens_singles',
      icon: 'person-outline',
      descriptionKey: 'createClubTournament.eventTypes.mens_singles_description',
    },
    {
      value: 'womens_singles',
      labelKey: 'createClubTournament.eventTypes.womens_singles',
      icon: 'person-outline',
      descriptionKey: 'createClubTournament.eventTypes.womens_singles_description',
    },
    {
      value: 'mens_doubles',
      labelKey: 'createClubTournament.eventTypes.mens_doubles',
      icon: 'people-outline',
      descriptionKey: 'createClubTournament.eventTypes.mens_doubles_description',
    },
    {
      value: 'womens_doubles',
      labelKey: 'createClubTournament.eventTypes.womens_doubles',
      icon: 'people-outline',
      descriptionKey: 'createClubTournament.eventTypes.womens_doubles_description',
    },
    {
      value: 'mixed_doubles',
      labelKey: 'createClubTournament.eventTypes.mixed_doubles',
      icon: 'heart-outline',
      descriptionKey: 'createClubTournament.eventTypes.mixed_doubles_description',
    },
  ];

  // Calendar modal state
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<
    'deadline' | 'startDate' | 'endDate' | null
  >(null);

  // Load club members from context or fallback to service
  useEffect(() => {
    if (contextClubMembers && contextClubMembers.length > 0) {
      // Club members already loaded from context
      setLoadingMembers(false);
    } else {
      // Load club members from service
      loadClubMembers();
    }
  }, [clubId, contextClubMembers, loadClubMembers]);

  // Validate max participants
  useEffect(() => {
    const numMax = Number(maxParticipants);
    const numMin = Number(minParticipants);

    const isValid = numMax >= MIN_START_PARTICIPANTS && numMax >= numMin && numMax > 0;
    setIsMaxParticipantsValid(isValid);

    console.log('🛡️ [GUARDIAN] Validating max participants for tournament:', {
      maxParticipants: numMax,
      minParticipants: numMin,
      minStartRequired: MIN_START_PARTICIPANTS,
      isValid,
    });
  }, [maxParticipants, minParticipants]);

  const loadClubMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      // Load club members to verify access
      await clubService.getClubMembers(clubId, 'active');
    } catch (error) {
      console.error('Error loading club members:', error);
      Alert.alert(t('common.error'), t('createClubTournament.errors.loadMembersFailed'));
    } finally {
      setLoadingMembers(false);
    }
  }, [clubId, t]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('createClubTournament.errors.nameRequired'));
      return false;
    }

    if (applicationDeadline > startDate) {
      Alert.alert(t('common.error'), t('createClubTournament.errors.deadlineBeforeStart'));
      return false;
    }

    if (startDate > endDate) {
      Alert.alert(t('common.error'), t('createClubTournament.errors.endBeforeStart'));
      return false;
    }

    return true;
  };

  const handleCreateTournament = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // 🐛 [DEBUG] Log matchFormat before creating tournament
      console.log('🐛 [CreateTournament] Creating tournament with:', {
        matchFormat,
        shortSets,
        calculatedSetsToWin: matchFormat === 'best_of_3' ? 2 : matchFormat === 'best_of_5' ? 3 : 1,
      });

      const tournamentSettings: TournamentSettings = {
        format,
        matchFormat,
        seedingMethod,
        minParticipants: parseInt(minParticipants) || 4,
        maxParticipants: parseInt(maxParticipants) || 16,
        allowByes: true,
        scoringFormat: {
          setsToWin: matchFormat === 'best_of_3' ? 2 : matchFormat === 'best_of_5' ? 3 : 1,
          gamesPerSet: shortSets ? 4 : 6, // 🦾 [IRON MAN] 단축 세트는 별도 옵션으로 제어
          tiebreakAt: shortSets ? 4 : 6, // 🦾 [IRON MAN] 단축 세트는 4-4에서 타이브레이크
          noAdScoring: false,
          tiebreakPoints: 7,
        },
        matchDuration: 90,
        // 🦾 [IRON MAN] Hardcoded for single elimination only
        thirdPlaceMatch: true,
        consolationBracket: false,
        allowWalkovers: true,
        eligibilityCriteria: {
          clubMemberOnly: true,
        },
      };

      const tournamentRequest = {
        clubId,
        tournamentName: name.trim(),
        title: name.trim(),
        description: description.trim() || '',
        eventType,
        format,
        settings: tournamentSettings,
        startDate,
        endDate,
        registrationDeadline: applicationDeadline,
        entryFee: (() => {
          const feeAmount = parseFloat(entryFee);
          return !isNaN(feeAmount) && feeAmount > 0
            ? {
                amount: feeAmount,
                currency: 'USD',
              }
            : undefined;
        })(),
      };

      const tournamentId = await tournamentService.createTournament(tournamentRequest);

      Alert.alert(t('common.success'), t('createClubTournament.success.created'), [
        {
          text: t('common.ok'),
          onPress: () => onSuccess?.(tournamentId),
        },
      ]);
    } catch (error) {
      console.error('Error creating tournament:', error);
      Alert.alert(t('common.error'), t('createClubTournament.errors.createFailed'));
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

  const handleDaySelect = (day: { timestamp: number }) => {
    const initialDate = new Date(day.timestamp);
    const selectedDate = new Date(
      initialDate.getUTCFullYear(),
      initialDate.getUTCMonth(),
      initialDate.getUTCDate()
    );

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

  const handleEventTypeChange = (newEventType: TennisEventType) => {
    setEventType(newEventType);

    if (!name.trim()) {
      const eventTypeName = getTennisEventTypeDisplayName(newEventType, t);
      const currentYear = new Date().getFullYear();
      setName(
        t('createClubTournament.defaultTournamentName', {
          year: currentYear,
          eventType: eventTypeName,
        })
      );
    }

    // Adjust minimum participants for doubles
    const isDoubles = newEventType.includes('doubles');
    if (isDoubles && parseInt(minParticipants) < 4) {
      setMinParticipants('4');
    }
    if (isDoubles && parseInt(maxParticipants) < 8) {
      setMaxParticipants('8');
    }
  };

  if (loadingMembers) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#1976d2' />
        <Text style={styles.loadingText}>{t('createClubTournament.loadingMembers')}</Text>
      </View>
    );
  }

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
          {t('createClubTournament.headerTitle')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {t('createClubTournament.headerSubtitle')}
        </Text>
      </View>

      {/* Tennis Event Type Selection */}
      <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('createClubTournament.matchType')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {t('createClubTournament.matchTypeSubtitle')}
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
                name={option.icon as keyof typeof Ionicons.glyphMap}
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
                {t(option.labelKey)}
              </Text>
              <Text style={[styles.eventTypeDescription, { color: theme.colors.onSurfaceVariant }]}>
                {t(option.descriptionKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 🦾 [IRON MAN] Tournament Format Selection UI removed - all tournaments are now single elimination */}

      {/* Tournament Information */}
      <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('createClubTournament.tournamentInfo')}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
            {t('createClubTournament.tournamentName')}
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
            placeholder={t('createClubTournament.tournamentNamePlaceholder', {
              eventType: getTennisEventTypeDisplayName(eventType, t),
            })}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
            {t('createClubTournament.description')}
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
            placeholder={t('createClubTournament.descriptionPlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Date Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
            {t('createClubTournament.applicationDeadline')}
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
              {t('createClubTournament.startDate')}
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
              {t('createClubTournament.endDate')}
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
              {t('createClubTournament.entryFee')}
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
              {t('createClubTournament.maxPlayers')}
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
            {!isMaxParticipantsValid && (
              <Text style={styles.errorText}>
                {t('createClubTournament.errors.maxPlayersInvalid', {
                  min: MIN_START_PARTICIPANTS,
                })}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Advanced Settings */}
      <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('createClubTournament.advancedSettings')}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
            {t('createClubTournament.matchFormat')}
          </Text>
          <View style={styles.optionRow}>
            {matchFormatOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outline,
                  },
                  matchFormat === option.value && {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primary + '15',
                  },
                ]}
                onPress={() => setMatchFormat(option.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    { color: theme.colors.onSurface },
                    matchFormat === option.value && { color: theme.colors.primary },
                  ]}
                >
                  {t(option.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 🦾 [IRON MAN] 단축 세트 옵션 - 체크박스 */}
        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={[
              styles.checkboxRow,
              { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface },
            ]}
            onPress={() => setShortSets(!shortSets)}
          >
            <Ionicons
              name={shortSets ? 'checkbox' : 'square-outline'}
              size={24}
              color={shortSets ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            <View style={styles.checkboxTextContainer}>
              <Text
                style={[
                  styles.checkboxLabel,
                  { color: theme.colors.onSurface },
                  shortSets && { color: theme.colors.primary, fontWeight: '600' },
                ]}
              >
                {t('createClubTournament.shortSets')}
              </Text>
              <Text style={[styles.checkboxDescription, { color: theme.colors.onSurfaceVariant }]}>
                {t('createClubTournament.shortSetsDescription')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
            {t('createClubTournament.seedingMethod')}
          </Text>
          <View style={styles.optionRow}>
            {seedingOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outline,
                  },
                  seedingMethod === option.value && {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primary + '15',
                  },
                ]}
                onPress={() => setSeedingMethod(option.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    { color: theme.colors.onSurface },
                    seedingMethod === option.value && { color: theme.colors.primary },
                  ]}
                >
                  {t(option.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
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
            {t('createClubTournament.cancel')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.createButton,
            (saving || !isMaxParticipantsValid) && styles.buttonDisabled,
          ]}
          onPress={handleCreateTournament}
          disabled={saving || !isMaxParticipantsValid}
        >
          {saving ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <>
              <Ionicons name='trophy-outline' size={20} color='#fff' />
              <Text style={styles.createButtonText}>
                {t('createClubTournament.createTournament')}
              </Text>
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
        minimumDate={currentDateField === 'endDate' ? startDate : undefined}
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
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
  eventTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  eventTypeDescription: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  formatGrid: {
    gap: 8,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 12,
  },
  formatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  formatDescription: {
    fontSize: 12,
    color: '#666',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // 🦾 [IRON MAN] 단축 세트 체크박스 스타일
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkboxDescription: {
    fontSize: 12,
    marginTop: 2,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
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

export default CreateClubTournamentForm;
