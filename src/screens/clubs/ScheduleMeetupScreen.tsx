import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  ActivityIndicator,
  Chip,
  FAB,
  IconButton,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { theme } from '../../theme';
import { modalStyles } from '../../styles/modalStyles';
import { useLanguage } from '../../contexts/LanguageContext';
import clubService from '../../services/clubService';

interface ClubSchedule {
  id: string;
  clubId: string;
  title: string;
  location: string;
  dayOfWeek: number; // 0(일요일) ~ 6(토요일)
  startTime: string; // "09:00" 형식
  endTime: string; // "11:00" 형식
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

interface ScheduleFormData {
  title: string;
  location: string;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
}

export default function ScheduleMeetupScreen() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _navigation = useNavigation();
  const route = useRoute();
  const { clubId } = route.params;
  const { t } = useLanguage();

  const DAYS_OF_WEEK = [
    t('scheduleMeetup.days.sunday'),
    t('scheduleMeetup.days.monday'),
    t('scheduleMeetup.days.tuesday'),
    t('scheduleMeetup.days.wednesday'),
    t('scheduleMeetup.days.thursday'),
    t('scheduleMeetup.days.friday'),
    t('scheduleMeetup.days.saturday'),
  ];

  const [schedules, setSchedules] = useState<ClubSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    location: '',
    dayOfWeek: 0,
    startTime: new Date(),
    endTime: new Date(),
  });

  // Time picker states
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [clubId]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const clubSchedules = await clubService.getClubSchedules(clubId);
      setSchedules(clubSchedules);
    } catch (error) {
      console.error('Error loading club schedules:', error);
      Alert.alert(t('common.error'), t('scheduleMeetup.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      location: '',
      dayOfWeek: 0,
      startTime: new Date(),
      endTime: new Date(),
    });
  };

  const handleSaveSchedule = async () => {
    if (!formData.title.trim() || !formData.location.trim()) {
      Alert.alert(t('scheduleMeetup.alert.title'), t('scheduleMeetup.errors.requiredFields'));
      return;
    }

    if (formData.startTime >= formData.endTime) {
      Alert.alert(t('scheduleMeetup.alert.title'), t('scheduleMeetup.errors.invalidTime'));
      return;
    }

    try {
      setSaving(true);

      const scheduleData = {
        title: formData.title.trim(),
        location: formData.location.trim(),
        dayOfWeek: formData.dayOfWeek,
        startTime: formatTime(formData.startTime),
        endTime: formatTime(formData.endTime),
        isActive: true,
      };

      await clubService.createClubSchedule(clubId, scheduleData);

      Alert.alert(t('scheduleMeetup.alert.success'), t('scheduleMeetup.success.created'));
      setShowForm(false);
      resetForm();
      loadSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      Alert.alert(t('common.error'), t('scheduleMeetup.errors.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = (schedule: ClubSchedule) => {
    Alert.alert(
      t('scheduleMeetup.delete.title'),
      t('scheduleMeetup.delete.confirmMessage', { title: schedule.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clubService.deleteClubSchedule(schedule.id);
              Alert.alert(t('scheduleMeetup.alert.success'), t('scheduleMeetup.success.deleted'));
              loadSchedules();
            } catch (error) {
              console.error('Error deleting schedule:', error);
              Alert.alert(t('common.error'), t('scheduleMeetup.errors.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const formatTime = (date: Date): string => {
    return date.toTimeString().slice(0, 5); // "HH:MM" 형식
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const parseTime = (timeString: string): Date => {
    const timeParts = timeString ? timeString.split(':').map(Number) : [0, 0];
    const [hours, minutes] = timeParts;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatScheduleTime = (schedule: ClubSchedule): string => {
    return `${schedule.startTime} ~ ${schedule.endTime}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({ ...prev, startTime: selectedTime }));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({ ...prev, endTime: selectedTime }));
    }
  };

  const renderScheduleItem = ({ item: schedule }: { item: ClubSchedule }) => (
    <Card style={styles.scheduleCard}>
      <View style={styles.scheduleContent}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>{schedule.title}</Text>
          <TouchableOpacity
            onPress={() => handleDeleteSchedule(schedule)}
            style={styles.deleteButton}
          >
            <Ionicons name='trash-outline' size={20} color='#f44336' />
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.scheduleRow}>
            <Ionicons name='calendar' size={16} color='#666' />
            <Text style={styles.scheduleText}>
              {t('scheduleMeetup.weekly')} {DAYS_OF_WEEK[schedule.dayOfWeek]}
            </Text>
          </View>

          <View style={styles.scheduleRow}>
            <Ionicons name='time' size={16} color='#666' />
            <Text style={styles.scheduleText}>{formatScheduleTime(schedule)}</Text>
          </View>

          <View style={styles.scheduleRow}>
            <Ionicons name='location' size={16} color='#666' />
            <Text style={styles.scheduleText}>{schedule.location}</Text>
          </View>
        </View>

        {schedule.isActive && (
          <Chip compact style={styles.activeChip} textStyle={styles.activeChipText}>
            {t('scheduleMeetup.status.active')}
          </Chip>
        )}
      </View>
    </Card>
  );

  const DayPickerModal = () => (
    <Modal visible={showDayPicker} transparent animationType='slide'>
      <View style={modalStyles.modalOverlay}>
        <Surface style={styles.dayPickerContainer}>
          <Text style={modalStyles.modalTitle}>{t('scheduleMeetup.dayPicker.title')}</Text>
          {DAYS_OF_WEEK.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dayOption, formData.dayOfWeek === index && styles.selectedDayOption]}
              onPress={() => {
                setFormData(prev => ({ ...prev, dayOfWeek: index }));
                setShowDayPicker(false);
              }}
            >
              <Text
                style={[
                  styles.dayOptionText,
                  formData.dayOfWeek === index && styles.selectedDayOptionText,
                ]}
              >
                {t('scheduleMeetup.weekly')} {day}
              </Text>
            </TouchableOpacity>
          ))}
          <Button onPress={() => setShowDayPicker(false)}>{t('common.cancel')}</Button>
        </Surface>
      </View>
    </Modal>
  );

  const ScheduleForm = () => (
    <Modal visible={showForm} animationType='slide' presentationStyle='pageSheet'>
      <SafeAreaView style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>{t('scheduleMeetup.form.title')}</Text>
          <IconButton
            icon='close'
            size={24}
            onPress={() => {
              setShowForm(false);
              resetForm();
            }}
          />
        </View>

        <ScrollView style={styles.formContent}>
          {/* 모임 이름 */}
          <TextInput
            label={t('scheduleMeetup.form.meetingName')}
            value={formData.title}
            onChangeText={text => setFormData(prev => ({ ...prev, title: text }))}
            style={styles.formInput}
            placeholder={t('scheduleMeetup.form.meetingNamePlaceholder')}
          />

          {/* 장소 */}
          <TextInput
            label={t('scheduleMeetup.form.location')}
            value={formData.location}
            onChangeText={text => setFormData(prev => ({ ...prev, location: text }))}
            style={styles.formInput}
            placeholder={t('scheduleMeetup.form.locationPlaceholder')}
          />

          {/* 요일 선택 */}
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDayPicker(true)}>
            <Text style={styles.pickerLabel}>{t('scheduleMeetup.form.repeatDay')}</Text>
            <Text style={styles.pickerValue}>
              {t('scheduleMeetup.weekly')} {DAYS_OF_WEEK[formData.dayOfWeek]}
            </Text>
            <Ionicons name='chevron-down' size={20} color='#666' />
          </TouchableOpacity>

          {/* 시작 시간 */}
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Text style={styles.pickerLabel}>{t('scheduleMeetup.form.startTime')}</Text>
            <Text style={styles.pickerValue}>{formatTime(formData.startTime)}</Text>
            <Ionicons name='chevron-down' size={20} color='#666' />
          </TouchableOpacity>

          {/* 종료 시간 */}
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowEndTimePicker(true)}>
            <Text style={styles.pickerLabel}>{t('scheduleMeetup.form.endTime')}</Text>
            <Text style={styles.pickerValue}>{formatTime(formData.endTime)}</Text>
            <Ionicons name='chevron-down' size={20} color='#666' />
          </TouchableOpacity>

          <View style={styles.formActions}>
            <Button
              mode='outlined'
              onPress={() => {
                setShowForm(false);
                resetForm();
              }}
              style={styles.cancelButton}
            >
              {t('common.cancel')}
            </Button>
            <Button
              mode='contained'
              onPress={handleSaveSchedule}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            >
              {t('common.save')}
            </Button>
          </View>
        </ScrollView>

        {/* Time Pickers */}
        {showStartTimePicker && (
          <DateTimePicker
            value={formData.startTime}
            mode='time'
            is24Hour={true}
            onChange={onStartTimeChange}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={formData.endTime}
            mode='time'
            is24Hour={true}
            onChange={onEndTimeChange}
          />
        )}

        <DayPickerModal />
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Title style={styles.title}>{t('scheduleMeetup.title')}</Title>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('scheduleMeetup.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>{t('scheduleMeetup.title')}</Title>
        <Text style={styles.subtitle}>{t('scheduleMeetup.subtitle')}</Text>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name='calendar-outline' size={64} color='#ccc' />
          <Text style={styles.emptyTitle}>{t('scheduleMeetup.emptyState.title')}</Text>
          <Text style={styles.emptyDescription}>{t('scheduleMeetup.emptyState.description')}</Text>
          <Button mode='contained' onPress={() => setShowForm(true)} style={styles.emptyAction}>
            {t('scheduleMeetup.emptyState.action')}
          </Button>
        </View>
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderScheduleItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {schedules.length > 0 && (
        <FAB
          icon='plus'
          style={styles.fab}
          onPress={() => setShowForm(true)}
          label={t('scheduleMeetup.addMeeting')}
        />
      )}

      <ScheduleForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  emptyAction: {
    minWidth: 200,
  },
  listContainer: {
    padding: 16,
  },
  scheduleCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scheduleContent: {
    padding: 16,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  scheduleDetails: {
    gap: 8,
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#666',
  },
  activeChip: {
    backgroundColor: '#4caf50',
    alignSelf: 'flex-start',
  },
  activeChipText: {
    color: '#fff',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  // Form styles
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formInput: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
  },
  pickerValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  // Modal styles (common styles imported from modalStyles)
  dayPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
  },
  dayOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedDayOption: {
    backgroundColor: theme.colors.primary + '20',
  },
  dayOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDayOptionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
