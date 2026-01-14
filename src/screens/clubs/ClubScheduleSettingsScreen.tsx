import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// @ts-expect-error - Picker type definitions issue
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useClub } from '../../contexts/ClubContext';
import { useAuth } from '../../contexts/AuthContext';
import clubScheduleService from '../../services/clubScheduleService';
import {
  ClubSchedule,
  ScheduleType,
  DayOfWeek,
  // validateScheduleTime, // eslint-disable-line @typescript-eslint/no-unused-vars
  formatScheduleTime,
} from '../../types/clubSchedule';

// Local interface for route params
interface RouteParams {
  clubId?: string;
  scheduleId?: string;
}

const ClubScheduleSettingsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentLanguage, t } = useLanguage();
  const { currentClub } = useClub();
  const { currentUser } = useAuth();

  // Get clubId from route params or current club context
  const clubId = (route.params as RouteParams)?.clubId || currentClub?.id;
  const scheduleId = (route.params as RouteParams)?.scheduleId; // For editing existing schedule

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingSchedules, setExistingSchedules] = useState<ClubSchedule[]>([]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('practice');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(3); // Default Wednesday
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [duration, setDuration] = useState('120'); // Default 2 hours
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Location states
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationInstructions, setLocationInstructions] = useState('');
  const [indoorOutdoor, setIndoorOutdoor] = useState<'indoor' | 'outdoor' | 'both'>('outdoor');

  // Participation states
  const [maxParticipants, setMaxParticipants] = useState('');
  const [minParticipants, setMinParticipants] = useState('');
  const [skillLevelRequired, setSkillLevelRequired] = useState('');
  const [memberOnly, setMemberOnly] = useState(true);
  const [registrationRequired, setRegistrationRequired] = useState(true);
  const [registrationDeadline, setRegistrationDeadline] = useState('24'); // Hours before event

  // Fee states
  const [hasFee, setHasFee] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeCurrency, setFeeCurrency] = useState('USD');
  const [feeDescription, setFeeDescription] = useState('');

  // Initialize time picker with 7 PM default
  useEffect(() => {
    const defaultTime = new Date();
    defaultTime.setHours(19, 0, 0, 0);
    setSelectedTime(defaultTime);
  }, []);

  // Load existing schedules
  useEffect(() => {
    if (clubId) {
      loadExistingSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  // Load schedule for editing
  useEffect(() => {
    if (scheduleId) {
      loadScheduleForEditing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  const loadExistingSchedules = async () => {
    try {
      // @ts-expect-error - clubId type check handled by service
      const schedules = await clubScheduleService.getClubSchedules(clubId, true);
      setExistingSchedules(schedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadScheduleForEditing = async () => {
    if (!scheduleId) return;

    setLoading(true);
    try {
      const schedule = await clubScheduleService.getSchedule(scheduleId);
      if (schedule) {
        // Populate form with existing data
        setTitle(schedule.title);
        setDescription(schedule.description || '');
        setScheduleType(schedule.scheduleType);
        setDayOfWeek(schedule.dayOfWeek);

        // Parse time
        const timeParts = schedule.time ? schedule.time.split(':').map(Number) : [0, 0];
        const [hours, minutes] = timeParts;
        const time = new Date();
        time.setHours(hours, minutes, 0, 0);
        setSelectedTime(time);

        setDuration(schedule.duration.toString());

        // Location
        setLocationName(schedule.location.name);
        setLocationAddress(schedule.location.address);
        setLocationInstructions(schedule.location.instructions || '');
        setIndoorOutdoor(schedule.location.indoorOutdoor);

        // Participation
        setMaxParticipants(schedule.participationInfo.maxParticipants?.toString() || '');
        setMinParticipants(schedule.participationInfo.minParticipants?.toString() || '');
        setSkillLevelRequired(schedule.participationInfo.skillLevelRequired || '');
        setMemberOnly(schedule.participationInfo.memberOnly);
        setRegistrationRequired(schedule.participationInfo.registrationRequired);
        setRegistrationDeadline(
          schedule.participationInfo.registrationDeadline?.toString() || '24'
        );

        // Fee
        if (schedule.participationInfo.fee) {
          setHasFee(true);
          setFeeAmount(schedule.participationInfo.fee.amount.toString());
          setFeeCurrency(schedule.participationInfo.fee.currency);
          setFeeDescription(schedule.participationInfo.fee.description || '');
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert(t('common.error'), t('clubScheduleSettings.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('clubScheduleSettings.validation.titleRequired'));
      return;
    }

    if (!locationName.trim() || !locationAddress.trim()) {
      Alert.alert(t('common.error'), t('clubScheduleSettings.validation.locationRequired'));
      return;
    }

    setSaving(true);

    try {
      // Format time as HH:MM
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      const scheduleData: Omit<ClubSchedule, 'id' | 'createdAt' | 'updatedAt'> = {
        // @ts-expect-error - clubId type check handled by service
        clubId,
        title: title.trim(),
        description: description.trim(),
        scheduleType,
        dayOfWeek,
        time: timeString,
        duration: parseInt(duration) || 120,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: {
          name: locationName.trim(),
          address: locationAddress.trim(),
          instructions: locationInstructions.trim(),
          indoorOutdoor,
        },
        participationInfo: {
          maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
          minParticipants: minParticipants ? parseInt(minParticipants) : undefined,
          skillLevelRequired: skillLevelRequired.trim() || undefined,
          registrationRequired,
          registrationDeadline: registrationRequired ? parseInt(registrationDeadline) : undefined,
          memberOnly,
          guestAllowed: !memberOnly,
          fee: hasFee
            ? {
                amount: parseFloat(feeAmount) || 0,
                currency: feeCurrency,
                type: 'per_session',
                description: feeDescription.trim(),
              }
            : undefined,
        },
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          // @ts-expect-error - Firestore Timestamp conversion handled by service
          startDate: new Date(),
        },
        isActive: true,
        createdBy: currentUser?.uid || 'unknown', // Get actual user ID from auth context
      };

      if (scheduleId) {
        // Update existing schedule
        await clubScheduleService.updateSchedule(scheduleId, scheduleData);
        Alert.alert(t('common.success'), t('clubScheduleSettings.success.updated'));
      } else {
        // Create new schedule
        // @ts-expect-error - Type compatibility handled by service (Timestamp conversion)
        await clubScheduleService.createSchedule(scheduleData);
        Alert.alert(t('common.success'), t('clubScheduleSettings.success.created'));
      }

      navigation.goBack();
    } catch (error: Error | unknown) {
      console.error('Error saving schedule:', error);
      Alert.alert(
        t('common.error'),
        (error as Error).message || t('clubScheduleSettings.errors.saveFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (schedule: ClubSchedule) => {
    Alert.alert(
      t('clubScheduleSettings.delete.title'),
      t('clubScheduleSettings.delete.confirm', { title: schedule.title }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clubScheduleService.deactivateSchedule(schedule.id);
              loadExistingSchedules();
              Alert.alert(t('common.success'), t('clubScheduleSettings.delete.success'));
            } catch (error) {
              console.error('Error deleting schedule:', error);
              Alert.alert(t('common.error'), t('clubScheduleSettings.delete.failed'));
            }
          },
        },
      ]
    );
  };

  const renderScheduleCard = (schedule: ClubSchedule) => {
    const dayLabel = t(`types.clubSchedule.daysOfWeek.${schedule.dayOfWeek}`);
    const typeLabel = t(`types.clubSchedule.scheduleTypes.${schedule.scheduleType}`);
    const timeDisplay = formatScheduleTime(schedule.time, schedule.duration, currentLanguage);

    return (
      <TouchableOpacity
        key={schedule.id}
        style={styles.scheduleCard}
        onPress={() =>
          // @ts-expect-error - Navigation params type compatibility
          navigation.navigate('ClubScheduleSettings', {
            clubId,
            scheduleId: schedule.id,
          })
        }
      >
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>{schedule.title}</Text>
          <TouchableOpacity onPress={() => handleDelete(schedule)} style={styles.deleteButton}>
            <Ionicons name='trash-outline' size={20} color='#f44336' />
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.scheduleDetailRow}>
            <Ionicons name='calendar-outline' size={16} color='#666' />
            <Text style={styles.scheduleDetailText}>{dayLabel}</Text>
          </View>

          <View style={styles.scheduleDetailRow}>
            <Ionicons name='time-outline' size={16} color='#666' />
            <Text style={styles.scheduleDetailText}>{timeDisplay}</Text>
          </View>

          <View style={styles.scheduleDetailRow}>
            <Ionicons name='location-outline' size={16} color='#666' />
            <Text style={styles.scheduleDetailText}>{schedule.location.name}</Text>
          </View>
        </View>

        <View style={styles.scheduleTypeTag}>
          <Text style={styles.scheduleTypeText}>{typeLabel}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name='arrow-back' size={24} color='#333' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('clubScheduleSettings.header.title')}</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Existing Schedules */}
          {existingSchedules.length > 0 && !scheduleId && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('clubScheduleSettings.sections.current')}</Text>
              {existingSchedules.map(renderScheduleCard)}
            </View>
          )}

          {/* Form Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {scheduleId
                ? t('clubScheduleSettings.sections.edit')
                : t('clubScheduleSettings.sections.new')}
            </Text>

            {/* Basic Information */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('clubScheduleSettings.fields.title')}</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={t('clubScheduleSettings.placeholders.title')}
                placeholderTextColor='#999'
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('clubScheduleSettings.fields.description')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('clubScheduleSettings.placeholders.description')}
                placeholderTextColor='#999'
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Schedule Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('clubScheduleSettings.fields.scheduleType')}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={scheduleType}
                  onValueChange={setScheduleType}
                  style={styles.picker}
                >
                  <Picker.Item
                    label={t('types.clubSchedule.scheduleTypes.practice')}
                    value='practice'
                  />
                  <Picker.Item
                    label={t('types.clubSchedule.scheduleTypes.social')}
                    value='social'
                  />
                  <Picker.Item
                    label={t('types.clubSchedule.scheduleTypes.league_match')}
                    value='league_match'
                  />
                  <Picker.Item
                    label={t('types.clubSchedule.scheduleTypes.clinic')}
                    value='clinic'
                  />
                  <Picker.Item
                    label={t('types.clubSchedule.scheduleTypes.tournament')}
                    value='tournament'
                  />
                  <Picker.Item
                    label={t('types.clubSchedule.scheduleTypes.mixed_doubles')}
                    value='mixed_doubles'
                  />
                  <Picker.Item
                    label={t('types.clubSchedule.scheduleTypes.custom')}
                    value='custom'
                  />
                </Picker>
              </View>
            </View>

            {/* Day and Time */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('clubScheduleSettings.fields.dayOfWeek')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={dayOfWeek}
                    onValueChange={setDayOfWeek}
                    style={styles.picker}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map(day => (
                      <Picker.Item
                        key={day}
                        label={t(`types.clubSchedule.daysOfWeek.${day}`)}
                        value={day}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('clubScheduleSettings.fields.startTime')}</Text>
                <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name='time-outline' size={20} color='#666' />
                  <Text style={styles.timeButtonText}>
                    {selectedTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: currentLanguage === 'en',
                    })}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={selectedTime}
                    mode='time'
                    is24Hour={currentLanguage === 'ko'}
                    display='default'
                    onChange={(event, selectedDate) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setSelectedTime(selectedDate);
                      }
                    }}
                  />
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('clubScheduleSettings.fields.duration')}</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType='numeric'
                placeholder='120'
                placeholderTextColor='#999'
              />
            </View>

            {/* Location Section */}
            <Text style={styles.subsectionTitle}>
              {t('clubScheduleSettings.sections.location')}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('clubScheduleSettings.fields.locationName')}</Text>
              <TextInput
                style={styles.input}
                value={locationName}
                onChangeText={setLocationName}
                placeholder={t('clubScheduleSettings.placeholders.locationName')}
                placeholderTextColor='#999'
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('clubScheduleSettings.fields.address')}</Text>
              <TextInput
                style={styles.input}
                value={locationAddress}
                onChangeText={setLocationAddress}
                placeholder={t('clubScheduleSettings.placeholders.address')}
                placeholderTextColor='#999'
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('clubScheduleSettings.fields.directions')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={locationInstructions}
                onChangeText={setLocationInstructions}
                placeholder={t('clubScheduleSettings.placeholders.directions')}
                placeholderTextColor='#999'
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('clubScheduleSettings.fields.courtType')}</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    indoorOutdoor === 'indoor' && styles.radioButtonActive,
                  ]}
                  onPress={() => setIndoorOutdoor('indoor')}
                >
                  <Text
                    style={[styles.radioText, indoorOutdoor === 'indoor' && styles.radioTextActive]}
                  >
                    {t('clubScheduleSettings.courtTypes.indoor')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    indoorOutdoor === 'outdoor' && styles.radioButtonActive,
                  ]}
                  onPress={() => setIndoorOutdoor('outdoor')}
                >
                  <Text
                    style={[
                      styles.radioText,
                      indoorOutdoor === 'outdoor' && styles.radioTextActive,
                    ]}
                  >
                    {t('clubScheduleSettings.courtTypes.outdoor')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, indoorOutdoor === 'both' && styles.radioButtonActive]}
                  onPress={() => setIndoorOutdoor('both')}
                >
                  <Text
                    style={[styles.radioText, indoorOutdoor === 'both' && styles.radioTextActive]}
                  >
                    {t('clubScheduleSettings.courtTypes.both')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Participation Section */}
            <Text style={styles.subsectionTitle}>
              {t('clubScheduleSettings.sections.participation')}
            </Text>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('clubScheduleSettings.fields.minParticipants')}</Text>
                <TextInput
                  style={styles.input}
                  value={minParticipants}
                  onChangeText={setMinParticipants}
                  keyboardType='numeric'
                  placeholder='4'
                  placeholderTextColor='#999'
                />
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('clubScheduleSettings.fields.maxParticipants')}</Text>
                <TextInput
                  style={styles.input}
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                  keyboardType='numeric'
                  placeholder='12'
                  placeholderTextColor='#999'
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t('clubScheduleSettings.fields.skillLevelRequired')}
              </Text>
              <TextInput
                style={styles.input}
                value={skillLevelRequired}
                onChangeText={setSkillLevelRequired}
                placeholder={t('clubScheduleSettings.placeholders.skillLevel')}
                placeholderTextColor='#999'
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>{t('clubScheduleSettings.fields.memberOnly')}</Text>
              <TouchableOpacity
                style={[styles.switch, memberOnly && styles.switchActive]}
                onPress={() => setMemberOnly(!memberOnly)}
              >
                <View style={[styles.switchThumb, memberOnly && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>
                {t('clubScheduleSettings.fields.registrationRequired')}
              </Text>
              <TouchableOpacity
                style={[styles.switch, registrationRequired && styles.switchActive]}
                onPress={() => setRegistrationRequired(!registrationRequired)}
              >
                <View
                  style={[styles.switchThumb, registrationRequired && styles.switchThumbActive]}
                />
              </TouchableOpacity>
            </View>

            {registrationRequired && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {t('clubScheduleSettings.fields.registrationDeadline')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={registrationDeadline}
                  onChangeText={setRegistrationDeadline}
                  keyboardType='numeric'
                  placeholder='24'
                  placeholderTextColor='#999'
                />
              </View>
            )}

            {/* Fee Section */}
            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>{t('clubScheduleSettings.fields.hasFee')}</Text>
              <TouchableOpacity
                style={[styles.switch, hasFee && styles.switchActive]}
                onPress={() => setHasFee(!hasFee)}
              >
                <View style={[styles.switchThumb, hasFee && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>

            {hasFee && (
              <>
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 2 }]}>
                    <Text style={styles.label}>{t('clubScheduleSettings.fields.feeAmount')}</Text>
                    <TextInput
                      style={styles.input}
                      value={feeAmount}
                      onChangeText={setFeeAmount}
                      keyboardType='decimal-pad'
                      placeholder='20'
                      placeholderTextColor='#999'
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                    <Text style={styles.label}>{t('clubScheduleSettings.fields.currency')}</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={feeCurrency}
                        onValueChange={setFeeCurrency}
                        style={styles.picker}
                      >
                        <Picker.Item label='USD' value='USD' />
                        <Picker.Item label='KRW' value='KRW' />
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    {t('clubScheduleSettings.fields.feeDescription')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={feeDescription}
                    onChangeText={setFeeDescription}
                    placeholder={t('clubScheduleSettings.placeholders.feeDescription')}
                    placeholderTextColor='#999'
                  />
                </View>
              </>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color='#fff' />
              ) : (
                <>
                  <Ionicons name='save-outline' size={20} color='#fff' />
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  scheduleDetails: {
    gap: 6,
  },
  scheduleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  scheduleTypeTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#1976d2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scheduleTypeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioButtonActive: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  radioText: {
    fontSize: 14,
    color: '#666',
  },
  radioTextActive: {
    color: '#1976d2',
    fontWeight: '600',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    padding: 3,
  },
  switchActive: {
    backgroundColor: '#1976d2',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ClubScheduleSettingsScreen;
