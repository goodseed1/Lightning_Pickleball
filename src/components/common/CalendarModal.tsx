import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';

interface CalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDaySelect: (day: any) => void;
  selectedDate?: Date;
  minimumDate?: Date;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isVisible,
  onClose,
  onDaySelect,
  selectedDate,
  minimumDate,
}) => {
  const { paperTheme: theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  const formatDateForCalendar = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const markedDates = selectedDate
    ? {
        [formatDateForCalendar(selectedDate)]: {
          selected: true,
          selectedColor: theme.colors.primary,
        },
      }
    : {};

  const minDate = minimumDate ? formatDateForCalendar(minimumDate) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDayPress = (day: any) => {
    onDaySelect(day);
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType='fade' onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('calendarModal.selectDate')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name='close' size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Calendar */}
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            minDate={minDate}
            theme={{
              backgroundColor: theme.colors.surface,
              calendarBackground: theme.colors.surface,
              textSectionTitleColor: theme.colors.onSurfaceVariant,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: theme.colors.onPrimary,
              todayTextColor: theme.colors.primary,
              dayTextColor: theme.colors.onSurface,
              textDisabledColor: theme.colors.outline,
              arrowColor: theme.colors.primary,
              monthTextColor: theme.colors.onSurface,
              indicatorColor: theme.colors.primary,
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            firstDay={1} // Monday as first day of week
          />

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      width: '90%',
      maxWidth: 400,
      margin: 20,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      flex: 1,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'transparent',
    },
    footer: {
      padding: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
  });
