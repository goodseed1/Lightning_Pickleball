import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import clubScheduleService from '../../../services/clubScheduleService';
import {
  WeeklyScheduleView as WeeklyScheduleData,
  DailySchedule,
  ScheduleDisplayData,
  formatScheduleTime,
} from '../../../types/clubSchedule';

interface WeeklyScheduleViewProps {
  clubId: string;
  userId?: string;
  onSchedulePress?: (scheduleId: string) => void;
  onRegisterPress?: (eventId: string) => void;
}

const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  clubId,
  userId,
  onSchedulePress,
  onRegisterPress,
}) => {
  const { currentLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleData | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  useEffect(() => {
    // Set to start of current week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    setCurrentWeekStart(startOfWeek);
  }, []);

  const loadWeeklySchedule = useCallback(async () => {
    setLoading(true);
    try {
      const schedule = await clubScheduleService.getWeeklyScheduleView(
        clubId,
        currentWeekStart,
        userId
      );
      setWeeklySchedule(schedule);
    } catch (error) {
      console.error('Error loading weekly schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [clubId, currentWeekStart, userId]);

  useEffect(() => {
    if (clubId && currentWeekStart) {
      loadWeeklySchedule();
    }
  }, [clubId, currentWeekStart, loadWeeklySchedule]);

  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekStart(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekStart(nextWeek);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    setCurrentWeekStart(startOfWeek);
  };

  const formatWeekRange = () => {
    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    const locale = t('common.locale');
    const startStr = currentWeekStart.toLocaleDateString(locale, options);
    const endStr = endOfWeek.toLocaleDateString(locale, options);

    return `${startStr} - ${endStr}`;
  };

  const renderScheduleCard = (scheduleData: ScheduleDisplayData) => {
    const { schedule } = scheduleData;
    const typeLabel = t(`types.clubSchedule.scheduleTypes.${schedule.scheduleType}`);
    const timeDisplay = formatScheduleTime(schedule.time, schedule.duration, currentLanguage);

    const getRegistrationStatusStyle = () => {
      switch (scheduleData.userRegistrationStatus) {
        case 'registered':
          return styles.registeredStatus;
        case 'waitlisted':
          return styles.waitlistedStatus;
        default:
          return null;
      }
    };

    const getRegistrationStatusText = () => {
      switch (scheduleData.userRegistrationStatus) {
        case 'registered':
          return t('weeklySchedule.registered');
        case 'waitlisted':
          return t('weeklySchedule.waitlisted');
        default:
          return t('weeklySchedule.available');
      }
    };

    return (
      <TouchableOpacity
        key={schedule.id}
        style={[styles.scheduleCard, scheduleData.isToday && styles.todayScheduleCard]}
        onPress={() => onSchedulePress?.(schedule.id)}
      >
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>{schedule.title}</Text>
          <View style={styles.scheduleTypeTag}>
            <Text style={styles.scheduleTypeText}>{typeLabel}</Text>
          </View>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.scheduleDetailRow}>
            <Ionicons name='time-outline' size={16} color='#666' />
            <Text style={styles.scheduleDetailText}>{timeDisplay}</Text>
          </View>

          <View style={styles.scheduleDetailRow}>
            <Ionicons name='location-outline' size={16} color='#666' />
            <Text style={styles.scheduleDetailText}>{schedule.location.name}</Text>
          </View>

          {scheduleData.spotsAvailable !== undefined && (
            <View style={styles.scheduleDetailRow}>
              <Ionicons name='people-outline' size={16} color='#666' />
              <Text style={styles.scheduleDetailText}>
                {t('weeklySchedule.spotsLeft', { count: scheduleData.spotsAvailable })}
              </Text>
            </View>
          )}

          {schedule.participationInfo.skillLevelRequired && (
            <View style={styles.scheduleDetailRow}>
              <Ionicons name='trophy-outline' size={16} color='#666' />
              <Text style={styles.scheduleDetailText}>
                {schedule.participationInfo.skillLevelRequired}
              </Text>
            </View>
          )}
        </View>

        {userId && (
          <View style={styles.registrationStatus}>
            <View style={[styles.statusBadge, getRegistrationStatusStyle()]}>
              <Text style={styles.statusBadgeText}>{getRegistrationStatusText()}</Text>
            </View>

            {scheduleData.canRegister &&
              scheduleData.userRegistrationStatus === 'not_registered' && (
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => onRegisterPress?.(schedule.id)} // TODO: Pass actual event ID
                >
                  <Text style={styles.registerButtonText}>{t('weeklySchedule.register')}</Text>
                </TouchableOpacity>
              )}
          </View>
        )}

        {scheduleData.isToday && (
          <View style={styles.todayIndicator}>
            <Text style={styles.todayIndicatorText}>{t('weeklySchedule.today')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDaySchedule = (daySchedule: DailySchedule) => {
    const dayLabel = t(`types.clubSchedule.daysOfWeek.${daySchedule.dayOfWeek}`);
    const dateStr = daySchedule.date.getDate().toString();

    return (
      <View key={daySchedule.dayOfWeek} style={styles.dayContainer}>
        <View style={[styles.dayHeader, daySchedule.isToday && styles.todayDayHeader]}>
          <Text style={[styles.dayLabel, daySchedule.isToday && styles.todayDayLabel]}>
            {dayLabel}
          </Text>
          <Text style={[styles.dayDate, daySchedule.isToday && styles.todayDayDate]}>
            {dateStr}
          </Text>
        </View>

        <View style={styles.daySchedules}>
          {daySchedule.events.length > 0 ? (
            daySchedule.events.map(renderScheduleCard)
          ) : (
            <View style={styles.noSchedules}>
              <Text style={styles.noSchedulesText}>{t('weeklySchedule.noSchedules')}</Text>
            </View>
          )}
        </View>

        {daySchedule.hasConflicts && (
          <View style={styles.conflictWarning}>
            <Ionicons name='warning-outline' size={16} color='#ff9800' />
            <Text style={styles.conflictWarningText}>{t('weeklySchedule.timeConflict')}</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#1976d2' />
        <Text style={styles.loadingText}>{t('weeklySchedule.loadingSchedule')}</Text>
      </View>
    );
  }

  if (!weeklySchedule) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('weeklySchedule.failedToLoad')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity onPress={goToPreviousWeek} style={styles.weekNavButton}>
          <Ionicons name='chevron-back' size={24} color='#1976d2' />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToCurrentWeek} style={styles.weekRangeButton}>
          <Text style={styles.weekRangeText}>{formatWeekRange()}</Text>
          <Text style={styles.weekYearText}>{currentWeekStart.getFullYear()}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNextWeek} style={styles.weekNavButton}>
          <Ionicons name='chevron-forward' size={24} color='#1976d2' />
        </TouchableOpacity>
      </View>

      {/* Schedule Summary */}
      {userId && (
        <View style={styles.scheduleSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{weeklySchedule.totalEvents}</Text>
            <Text style={styles.summaryLabel}>{t('weeklySchedule.total')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{weeklySchedule.userRegisteredCount}</Text>
            <Text style={styles.summaryLabel}>{t('weeklySchedule.registeredCount')}</Text>
          </View>
        </View>
      )}

      {/* Weekly Schedule */}
      <ScrollView style={styles.scheduleContainer} showsVerticalScrollIndicator={false}>
        {weeklySchedule.schedules.map(renderDaySchedule)}
      </ScrollView>
    </View>
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
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  weekNavButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRangeButton: {
    flex: 1,
    alignItems: 'center',
  },
  weekRangeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  weekYearText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  scheduleSummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scheduleContainer: {
    flex: 1,
  },
  dayContainer: {
    backgroundColor: '#fff',
    marginVertical: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  todayDayHeader: {
    backgroundColor: '#e3f2fd',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  todayDayLabel: {
    color: '#1976d2',
  },
  dayDate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  todayDayDate: {
    color: '#1976d2',
  },
  daySchedules: {
    padding: 16,
  },
  noSchedules: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noSchedulesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  scheduleCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  todayScheduleCard: {
    borderColor: '#1976d2',
    borderWidth: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  scheduleTypeTag: {
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
  scheduleDetails: {
    gap: 6,
    marginBottom: 12,
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
  registrationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  registeredStatus: {
    backgroundColor: '#e8f5e8',
  },
  waitlistedStatus: {
    backgroundColor: '#fff3e0',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  registerButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  todayIndicator: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#1976d2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayIndicatorText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  conflictWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff3e0',
  },
  conflictWarningText: {
    fontSize: 12,
    color: '#ff9800',
    marginLeft: 6,
  },
});

export default WeeklyScheduleView;
