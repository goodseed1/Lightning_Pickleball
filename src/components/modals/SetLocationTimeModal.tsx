/**
 * SetLocationTimeModal.tsx
 * 퀵 매치 장소/시간 설정 모달
 * 호스트가 수락된 매치의 장소와 시간을 설정할 때 사용
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';

interface SetLocationTimeModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  onSuccess: () => void;
}

const SetLocationTimeModal: React.FC<SetLocationTimeModalProps> = ({
  visible,
  onClose,
  eventId,
  eventTitle,
  onSuccess,
}) => {
  const { paperTheme: theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  // State
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Minimum date is today
  const minDate = new Date();

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    };
    return date.toLocaleDateString(t('common.locale'), options);
  };

  // Format time for display
  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleTimeString(t('common.locale'), options);
  };

  // Handle date change
  const onDateChange = (_event: unknown, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      // Keep the time, update the date
      const newDate = new Date(selectedDate);
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(newDate);
    }
  };

  // Handle time change
  const onTimeChange = (_event: unknown, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      // Keep the date, update the time
      const newDate = new Date(selectedDate);
      newDate.setHours(time.getHours(), time.getMinutes());
      setSelectedDate(newDate);
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!location.trim()) {
      Alert.alert(
        t('setLocationTimeModal.alerts.locationRequired.title'),
        t('setLocationTimeModal.alerts.locationRequired.message')
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const setEventLocationTimeFn = httpsCallable(functions, 'setEventLocationTime');
      await setEventLocationTimeFn({
        eventId,
        location: location.trim(),
        placeDetails: null, // 간단한 텍스트 입력만 지원
        scheduledTime: selectedDate.toISOString(),
      });

      Alert.alert(
        t('setLocationTimeModal.alerts.success.title'),
        t('setLocationTimeModal.alerts.success.message')
      );

      onSuccess();
      onClose();

      // Reset state
      setLocation('');
      setSelectedDate(new Date());
    } catch (error: unknown) {
      console.error('Error setting location/time:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to set location and time';
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType='slide' onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('setLocationTimeModal.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name='close' size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Event Title */}
          <View style={styles.eventTitleContainer}>
            <Ionicons name='trophy-outline' size={18} color={theme.colors.primary} />
            <Text style={styles.eventTitle} numberOfLines={1}>
              {eventTitle}
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Location Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                <Ionicons name='location-outline' size={16} color={theme.colors.primary} />
                {' ' + t('setLocationTimeModal.location')}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('setLocationTimeModal.locationPlaceholder')}
                placeholderTextColor={theme.colors.outline}
                value={location}
                onChangeText={setLocation}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Date Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                <Ionicons name='calendar-outline' size={16} color={theme.colors.primary} />
                {' ' + t('setLocationTimeModal.date')}
              </Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
                <Ionicons name='chevron-forward' size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Time Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                <Ionicons name='time-outline' size={16} color={theme.colors.primary} />
                {' ' + t('setLocationTimeModal.time')}
              </Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>{formatTime(selectedDate)}</Text>
                <Ionicons name='chevron-forward' size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Ionicons name='information-circle-outline' size={18} color={theme.colors.primary} />
              <Text style={styles.infoText}>{t('setLocationTimeModal.infoText')}</Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <Button
              mode='outlined'
              onPress={onClose}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonLabel}
            >
              {t('setLocationTimeModal.cancel')}
            </Button>
            <Button
              mode='contained'
              onPress={handleSubmit}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size='small' color={theme.colors.onPrimary} />
              ) : (
                t('setLocationTimeModal.confirm')
              )}
            </Button>
          </View>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode='date'
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={minDate}
            />
          )}

          {/* Time Picker Modal */}
          {showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode='time'
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
              minuteInterval={5}
            />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const createStyles = (theme: { colors: Record<string, string> }) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '80%',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
    },
    eventTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.colors.primaryContainer,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 12,
      gap: 8,
    },
    eventTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.onPrimaryContainer,
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.colors.onSurface,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    dateTimeButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
    },
    dateTimeText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 12,
      padding: 12,
      gap: 8,
      marginTop: 8,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.onPrimaryContainer,
      lineHeight: 18,
    },
    footer: {
      flexDirection: 'row',
      padding: 16,
      paddingBottom: 32,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      borderColor: theme.colors.outline,
    },
    cancelButtonLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    submitButton: {
      flex: 2,
      backgroundColor: theme.colors.primary,
    },
    submitButtonLabel: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    },
  });

export default SetLocationTimeModal;
