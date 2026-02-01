import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ScheduleType, DayOfWeek } from '../../../types/clubSchedule';

interface ClubScheduleFormProps {
  // Form data
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  scheduleType: ScheduleType;
  setScheduleType: (type: ScheduleType) => void;
  dayOfWeek: DayOfWeek;
  setDayOfWeek: (day: DayOfWeek) => void;
  selectedTime: Date;
  setSelectedTime: (time: Date) => void;
  duration: string;
  setDuration: (duration: string) => void;

  // Location
  locationName: string;
  setLocationName: (name: string) => void;
  locationAddress: string;
  setLocationAddress: (address: string) => void;
  locationInstructions: string;
  setLocationInstructions: (instructions: string) => void;
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  setIndoorOutdoor: (type: 'indoor' | 'outdoor' | 'both') => void;

  // Participation
  maxParticipants: string;
  setMaxParticipants: (max: string) => void;
  minParticipants: string;
  setMinParticipants: (min: string) => void;
  skillLevelRequired: string;
  setSkillLevelRequired: (skill: string) => void;
  memberOnly: boolean;
  setMemberOnly: (memberOnly: boolean) => void;
  registrationRequired: boolean;
  setRegistrationRequired: (required: boolean) => void;
  registrationDeadline: string;
  setRegistrationDeadline: (deadline: string) => void;

  // Time picker
  showTimePicker: boolean;
  setShowTimePicker: (show: boolean) => void;
}

const ClubScheduleForm: React.FC<ClubScheduleFormProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  scheduleType,
  setScheduleType,
  dayOfWeek,
  setDayOfWeek,
  selectedTime,
  setSelectedTime,
  duration,
  setDuration,
  locationName,
  setLocationName,
  locationAddress,
  setLocationAddress,
  locationInstructions,
  setLocationInstructions,
  indoorOutdoor,
  setIndoorOutdoor,
  maxParticipants,
  setMaxParticipants,
  minParticipants,
  setMinParticipants,
  skillLevelRequired,
  setSkillLevelRequired,
  memberOnly,
  setMemberOnly,
  registrationRequired,
  setRegistrationRequired,
  registrationDeadline,
  setRegistrationDeadline,
  showTimePicker,
  setShowTimePicker,
}) => {
  const { t, currentLanguage } = useLanguage();

  const CustomSwitch: React.FC<{
    value: boolean;
    onValueChange: (value: boolean) => void;
    label: string;
  }> = ({ value, onValueChange, label }) => (
    <View style={styles.switchGroup}>
      <Text style={styles.switchLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.switch, value && styles.switchActive]}
        onPress={() => onValueChange(!value)}
      >
        <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      {/* Basic Information */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('schedules.form.title')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('schedules.form.titlePlaceholder')}
          placeholderTextColor='#999'
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('schedules.form.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('schedules.form.descriptionPlaceholder')}
          placeholderTextColor='#999'
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Schedule Type */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('schedules.form.scheduleType')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={scheduleType}
            onValueChange={setScheduleType}
            style={styles.picker}
          >
            <Picker.Item label={t('types.clubSchedule.scheduleTypes.practice')} value='practice' />
            <Picker.Item label={t('types.clubSchedule.scheduleTypes.social')} value='social' />
            <Picker.Item
              label={t('types.clubSchedule.scheduleTypes.league_match')}
              value='league_match'
            />
            <Picker.Item label={t('types.clubSchedule.scheduleTypes.clinic')} value='clinic' />
            <Picker.Item
              label={t('types.clubSchedule.scheduleTypes.mixed_doubles')}
              value='mixed_doubles'
            />
            <Picker.Item label={t('types.clubSchedule.scheduleTypes.custom')} value='custom' />
          </Picker>
        </View>
      </View>

      {/* Day and Time */}
      <View style={styles.formRow}>
        <View style={[styles.formGroup, styles.halfWidth]}>
          <Text style={styles.label}>{t('schedules.form.dayOfWeek')}</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={dayOfWeek} onValueChange={setDayOfWeek} style={styles.picker}>
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
          <Text style={styles.label}>{t('schedules.form.startTime')}</Text>
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
        </View>
      </View>

      {/* Time Picker Modal */}
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('schedules.form.duration')}</Text>
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
      <Text style={styles.subsectionTitle}>{t('schedules.form.locationInfo')}</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('schedules.form.locationName')}</Text>
        <TextInput
          style={styles.input}
          value={locationName}
          onChangeText={setLocationName}
          placeholder={t('schedules.form.locationNamePlaceholder')}
          placeholderTextColor='#999'
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('schedules.form.address')}</Text>
        <TextInput
          style={styles.input}
          value={locationAddress}
          onChangeText={setLocationAddress}
          placeholder={t('schedules.form.addressPlaceholder')}
          placeholderTextColor='#999'
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('schedules.form.directions')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={locationInstructions}
          onChangeText={setLocationInstructions}
          placeholder={t('schedules.form.directionsPlaceholder')}
          placeholderTextColor='#999'
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('schedules.form.courtType')}</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[styles.radioButton, indoorOutdoor === 'indoor' && styles.radioButtonActive]}
            onPress={() => setIndoorOutdoor('indoor')}
          >
            <Text style={[styles.radioText, indoorOutdoor === 'indoor' && styles.radioTextActive]}>
              {t('schedules.form.indoor')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, indoorOutdoor === 'outdoor' && styles.radioButtonActive]}
            onPress={() => setIndoorOutdoor('outdoor')}
          >
            <Text style={[styles.radioText, indoorOutdoor === 'outdoor' && styles.radioTextActive]}>
              {t('schedules.form.outdoor')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, indoorOutdoor === 'both' && styles.radioButtonActive]}
            onPress={() => setIndoorOutdoor('both')}
          >
            <Text style={[styles.radioText, indoorOutdoor === 'both' && styles.radioTextActive]}>
              {t('schedules.form.both')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Participation Section */}
      <Text style={styles.subsectionTitle}>{t('schedules.form.participationInfo')}</Text>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, styles.halfWidth]}>
          <Text style={styles.label}>{t('schedules.form.minParticipants')}</Text>
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
          <Text style={styles.label}>{t('schedules.form.maxParticipants')}</Text>
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
        <Text style={styles.label}>{t('schedules.form.skillLevel')}</Text>
        <TextInput
          style={styles.input}
          value={skillLevelRequired}
          onChangeText={setSkillLevelRequired}
          placeholder={t('schedules.form.skillLevelPlaceholder')}
          placeholderTextColor='#999'
        />
      </View>

      <CustomSwitch
        value={memberOnly}
        onValueChange={setMemberOnly}
        label={t('schedules.form.membersOnly')}
      />

      <CustomSwitch
        value={registrationRequired}
        onValueChange={setRegistrationRequired}
        label={t('schedules.form.registrationRequired')}
      />

      {registrationRequired && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('schedules.form.registrationDeadline')}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 16,
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
});

export default ClubScheduleForm;
