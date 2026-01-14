import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Text,
  Platform,
} from 'react-native';
import { Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { useTheme } from '../../../hooks/useTheme';
import { getLightningTennisTheme } from '../../../theme';
import { useLanguage } from '../../../contexts/LanguageContext';
import { modalStyles } from '../../../styles/modalStyles';

interface Meeting {
  day: string;
  startTime: string;
  endTime: string;
}

interface MeetingScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMeeting: (meeting: Meeting) => void;
}

export default function MeetingScheduleModal({
  visible,
  onClose,
  onAddMeeting,
}: MeetingScheduleModalProps) {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors;
  const { t } = useLanguage();

  // iOS time picker options (AM/PM format)
  const TIME_OPTIONS = [
    '6:00 AM',
    '6:30 AM',
    '7:00 AM',
    '7:30 AM',
    '8:00 AM',
    '8:30 AM',
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '12:30 PM',
    '1:00 PM',
    '1:30 PM',
    '2:00 PM',
    '2:30 PM',
    '3:00 PM',
    '3:30 PM',
    '4:00 PM',
    '4:30 PM',
    '5:00 PM',
    '5:30 PM',
    '6:00 PM',
    '6:30 PM',
    '7:00 PM',
    '7:30 PM',
    '8:00 PM',
    '8:30 PM',
    '9:00 PM',
    '9:30 PM',
    '10:00 PM',
  ];

  const DAYS_OF_WEEK = [
    t('editClubPolicy.monday'),
    t('editClubPolicy.tuesday'),
    t('editClubPolicy.wednesday'),
    t('editClubPolicy.thursday'),
    t('editClubPolicy.friday'),
    t('editClubPolicy.saturday'),
    t('editClubPolicy.sunday'),
  ];

  // Local state
  const [showTimeList, setShowTimeList] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [selectedTimeString, setSelectedTimeString] = useState('6:00 PM');
  const [newMeeting, setNewMeeting] = useState({
    day: t('editClubPolicy.saturday'),
    startTime: (() => {
      const startTime = new Date();
      startTime.setHours(18, 0, 0, 0); // 6:00 PM = 18:00
      return startTime;
    })(),
  });

  const styles = StyleSheet.create({
    daySelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    dayChip: {
      margin: 6,
      minWidth: 80,
    },
    timeSelector: {
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    timeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceVariant,
      padding: 18,
      borderRadius: 12,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    timeLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
      paddingLeft: 16,
    },
    firstSectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
      marginTop: 20,
      paddingLeft: 16,
    },
    timeValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      paddingTop: 16,
      paddingBottom: 20,
      paddingRight: 16,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
      marginTop: 8,
    },
    cancelButton: {
      minWidth: 100,
    },
    saveButton: {
      minWidth: 100,
    },
    timeList: {
      marginTop: 8,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      maxHeight: 200,
      overflow: 'hidden',
    },
    timeListItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outline,
    },
    selectedTimeListItem: {
      backgroundColor: colors.primaryContainer,
    },
    timeListText: {
      fontSize: 14,
      color: colors.onSurface,
    },
    selectedTimeListText: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const toggleTimeList = () => {
    if (Platform.OS === 'ios') {
      setShowTimeList(!showTimeList);
    } else {
      setShowStartTimePicker(true);
    }
  };

  const selectTime = (time: string) => {
    console.log('📅 Time selected via inline list:', time);
    setSelectedTimeString(time);
    setShowTimeList(false);
  };

  const onStartTimeChange = useCallback((_event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }

    if (selectedTime) {
      console.log('📅 Start time selected:', formatTime(selectedTime));
      setNewMeeting(prev => ({ ...prev, startTime: selectedTime }));
    }
  }, []);

  const resetNewMeeting = () => {
    const startTime = new Date();
    startTime.setHours(18, 0, 0, 0); // 6:00 PM = 18:00

    setNewMeeting({
      day: t('editClubPolicy.saturday'),
      startTime,
    });

    setSelectedTimeString('6:00 PM');
    setShowTimeList(false);
  };

  const handleAddMeeting = () => {
    const startTimeStr =
      Platform.OS === 'ios' ? selectedTimeString : formatTime(newMeeting.startTime);

    const meeting = {
      day: newMeeting.day,
      startTime: startTimeStr,
      endTime: startTimeStr, // Temporary - same value for now
    };

    onAddMeeting(meeting);
    onClose();
    resetNewMeeting();
  };

  const handleClose = () => {
    onClose();
    resetNewMeeting();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType='slide'
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[modalStyles.modalTitle, { color: colors.onSurface }]}>
              {t('createClub.meeting_modal_title')}
            </Text>

            {/* Day Selection */}
            <Text style={styles.firstSectionLabel}>{t('createClub.day_selection')}</Text>
            <View style={styles.daySelector}>
              {DAYS_OF_WEEK.map(day => (
                <Chip
                  key={day}
                  mode={newMeeting.day === day ? 'flat' : 'outlined'}
                  selected={newMeeting.day === day}
                  onPress={() => setNewMeeting(prev => ({ ...prev, day }))}
                  style={styles.dayChip}
                  theme={{ colors }}
                >
                  {day}
                </Chip>
              ))}
            </View>

            {/* Time Selection */}
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>{t('createClub.meeting_time')}</Text>

              <TouchableOpacity style={styles.timeButton} onPress={toggleTimeList}>
                <Text style={styles.timeValue}>
                  {Platform.OS === 'ios' ? selectedTimeString : formatTime(newMeeting.startTime)}
                </Text>
                <MaterialCommunityIcons
                  name={showTimeList ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              </TouchableOpacity>

              {/* iOS: Inline expandable time list */}
              {Platform.OS === 'ios' && showTimeList && (
                <View style={styles.timeList}>
                  <ScrollView
                    style={{ maxHeight: 200 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {TIME_OPTIONS.map(time => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeListItem,
                          selectedTimeString === time && styles.selectedTimeListItem,
                        ]}
                        onPress={() => selectTime(time)}
                      >
                        <Text
                          style={[
                            styles.timeListText,
                            selectedTimeString === time && styles.selectedTimeListText,
                          ]}
                        >
                          {time}
                        </Text>
                        {selectedTimeString === time && (
                          <MaterialCommunityIcons name='check' size={16} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                mode='outlined'
                onPress={handleClose}
                style={styles.cancelButton}
                theme={{ colors }}
              >
                {t('createClub.cancel')}
              </Button>
              <Button
                mode='contained'
                onPress={handleAddMeeting}
                style={styles.saveButton}
                theme={{ colors }}
              >
                {t('createClub.add')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Android Time Picker */}
      {Platform.OS === 'android' && showStartTimePicker && (
        <DateTimePicker
          value={newMeeting.startTime}
          mode='time'
          is24Hour={false}
          display='default'
          onChange={onStartTimeChange}
        />
      )}
    </>
  );
}
