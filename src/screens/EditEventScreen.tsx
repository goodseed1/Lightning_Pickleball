/**
 * Edit Event Screen - 기존 이벤트 수정
 */

/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import ActivityService from '../services/activityService';
import { LightningEvent } from '../types/activity';

type RootStackParamList = {
  EditEvent: { eventId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditEvent'>;
type RoutePropType = RouteProp<RootStackParamList, 'EditEvent'>;

const EditEventScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { eventId } = route.params;
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = useMemo(() => createStyles(themeColors.colors as unknown as Record<string, string>), [themeColors.colors]);

  // 로딩 및 이벤트 데이터 상태
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalEvent, setOriginalEvent] = useState<LightningEvent | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    skillLevel: '',
    gameType: '',
    ltrLevel: '',
    languages: [] as string[],
    autoApproval: false,
    maxParticipants: 4,
    duration: 120,
    isPublic: true,
  });

  // 날짜/시간 관련 상태
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const loadEventData = useCallback(async () => {
    try {
      setLoading(true);

      const event = await ActivityService.getEventById(eventId);
      if (!event) {
        Alert.alert(t('common.error'), t('editEvent.eventNotFound'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() },
        ]);
        return;
      }

      // 권한 확인 (호스트만 수정 가능)
      if (event.hostId !== currentUser?.uid) {
        Alert.alert(t('editEvent.noPermission'), t('editEvent.noPermissionMessage'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() },
        ]);
        return;
      }

      setOriginalEvent(event);

      // 폼 데이터 채우기
      setFormData({
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        skillLevel: event.ltrLevel || 'All Levels',
        gameType: event.gameType || 'rally',
        ltrLevel: event.ltrLevel || 'All Levels',
        languages: event.languages || ['English'],
        autoApproval: event.autoApproval || false,
        maxParticipants: event.maxParticipants || 4,
        duration: event.duration || 120,
        isPublic: event.isPublic !== false,
      });

      // 날짜/시간 설정 - Firestore Timestamp 처리
      // 🎯 [KIM FIX] scheduledTime이 Firestore Timestamp일 수 있으므로 toDate() 호출
      const scheduledTimeAny = event.scheduledTime as unknown as { toDate?: () => Date };
      const eventDateTime =
        scheduledTimeAny && typeof scheduledTimeAny.toDate === 'function'
          ? scheduledTimeAny.toDate()
          : new Date(event.scheduledTime as unknown as Date);
      setSelectedDate(eventDateTime);
      setSelectedTime(eventDateTime);
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert(t('common.error'), t('editEvent.loadingError'));
    } finally {
      setLoading(false);
    }
  }, [eventId, currentUser?.uid, navigation, t]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (_event: unknown, date?: Date) => {
    // Android: 피커가 자동으로 닫힘
    // iOS: Modal에서 "완료" 버튼 클릭 시 닫힘
    if (Platform.OS === 'android') {
      setIsDatePickerOpen(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (_event: unknown, time?: Date) => {
    // Android: 피커가 자동으로 닫힘
    // iOS: Modal에서 "완료" 버튼 클릭 시 닫힘
    if (Platform.OS === 'android') {
      setIsTimePickerOpen(false);
    }
    if (time) {
      setSelectedTime(time);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert(t('editEvent.inputError'), t('editEvent.titleRequired'));
      return false;
    }

    if (!formData.location.trim()) {
      Alert.alert(t('editEvent.inputError'), t('editEvent.locationRequired'));
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !originalEvent) return;

    try {
      setSaving(true);

      // 날짜와 시간 결합
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(selectedTime.getHours());
      combinedDateTime.setMinutes(selectedTime.getMinutes());
      combinedDateTime.setSeconds(0);
      combinedDateTime.setMilliseconds(0);

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        scheduledTime: combinedDateTime,
        duration: formData.duration,
        maxParticipants: formData.maxParticipants,
        gameType: formData.gameType as 'mens_singles' | 'womens_singles' | 'mens_doubles' | 'womens_doubles' | 'mixed_doubles' | 'rally',
        ltrLevel: formData.ltrLevel,
        languages: formData.languages,
        autoApproval: formData.autoApproval,
        isPublic: formData.isPublic,
      };

      await ActivityService.updateEvent(eventId, updateData);

      Alert.alert(t('common.success'), t('editEvent.updateSuccess'), [
        {
          text: t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert(t('common.error'), t('editEvent.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (date: Date, time: Date) => {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());

    return combined.toLocaleDateString(t('common.locale'), {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary} />
          <Text style={styles.loadingText}>{t('editEvent.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name='close' size={24} color={themeColors.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editEvent.title')}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        >
          {saving ? (
            <ActivityIndicator size='small' color={themeColors.colors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>{t('editEvent.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목 */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('editEvent.labelTitle')} *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.title}
            onChangeText={value => updateFormData('title', value)}
            placeholder={t('editEvent.placeholderTitle')}
            placeholderTextColor={themeColors.colors.onSurfaceVariant}
            maxLength={100}
          />
        </View>

        {/* 설명 */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('editEvent.labelDescription')}</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.description}
            onChangeText={value => updateFormData('description', value)}
            placeholder={t('editEvent.placeholderDescription')}
            placeholderTextColor={themeColors.colors.onSurfaceVariant}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* 장소 */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('editEvent.labelLocation')} *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.location}
            onChangeText={value => updateFormData('location', value)}
            placeholder={t('editEvent.placeholderLocation')}
            placeholderTextColor={themeColors.colors.onSurfaceVariant}
            maxLength={200}
          />
        </View>

        {/* 날짜 및 시간 */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('editEvent.labelDateTime')} *</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                setIsTimePickerOpen(false); // 시간 피커 닫기
                setIsDatePickerOpen(true);
              }}
            >
              <Ionicons name='calendar-outline' size={20} color={themeColors.colors.primary} />
              <Text style={styles.dateTimeText}>
                {selectedDate.toLocaleDateString(t('common.locale'))}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                setIsDatePickerOpen(false); // 날짜 피커 닫기
                setIsTimePickerOpen(true);
              }}
            >
              <Ionicons name='time-outline' size={20} color={themeColors.colors.primary} />
              <Text style={styles.dateTimeText}>
                {selectedTime.toLocaleTimeString(t('common.locale'), {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.dateTimePreview}>{formatDateTime(selectedDate, selectedTime)}</Text>
        </View>

        {/* 최대 참가자 수 */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('editEvent.labelMaxParticipants')}</Text>
          <View style={styles.participantContainer}>
            <TouchableOpacity
              style={styles.participantButton}
              onPress={() =>
                updateFormData('maxParticipants', Math.max(2, formData.maxParticipants - 1))
              }
            >
              <Ionicons name='remove' size={20} color={themeColors.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.participantNumber}>{formData.maxParticipants}</Text>
            <TouchableOpacity
              style={styles.participantButton}
              onPress={() =>
                updateFormData('maxParticipants', Math.min(20, formData.maxParticipants + 1))
              }
            >
              <Ionicons name='add' size={20} color={themeColors.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 소요 시간 */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('editEvent.labelDuration')}</Text>
          <View style={styles.durationContainer}>
            {[60, 90, 120, 150, 180].map(duration => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationOption,
                  formData.duration === duration && styles.durationOptionSelected,
                ]}
                onPress={() => updateFormData('duration', duration)}
              >
                <Text
                  style={[
                    styles.durationOptionText,
                    formData.duration === duration && styles.durationOptionTextSelected,
                  ]}
                >
                  {duration} {t('editEvent.durationUnit')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (isDatePickerOpen || isTimePickerOpen) && (
        <Modal
          visible={isDatePickerOpen || isTimePickerOpen}
          transparent
          animationType='slide'
          onRequestClose={() => {
            setIsDatePickerOpen(false);
            setIsTimePickerOpen(false);
          }}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={[styles.pickerModalContent, { backgroundColor: '#1C1C1E' }]}>
              <View style={[styles.pickerModalHeader, { borderBottomColor: '#3A3A3C' }]}>
                <TouchableOpacity
                  onPress={() => {
                    setIsDatePickerOpen(false);
                    setIsTimePickerOpen(false);
                  }}
                >
                  <Text style={[styles.pickerModalDone, { color: themeColors.colors.primary }]}>
                    {t('editEvent.done')}
                  </Text>
                </TouchableOpacity>
              </View>
              {isDatePickerOpen && (
                <DateTimePicker
                  value={selectedDate}
                  mode='date'
                  display='inline'
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  style={styles.iosCalendarPicker}
                  themeVariant='dark'
                />
              )}
              {isTimePickerOpen && (
                <DateTimePicker
                  value={selectedTime}
                  mode='time'
                  display='spinner'
                  onChange={handleTimeChange}
                  style={styles.iosPicker}
                  themeVariant='dark'
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker */}
      {Platform.OS === 'android' && isDatePickerOpen && (
        <DateTimePicker
          value={selectedDate}
          mode='date'
          display='default'
          onChange={handleDateChange}
          minimumDate={new Date()}
          themeVariant='dark'
        />
      )}

      {/* Android Time Picker */}
      {Platform.OS === 'android' && isTimePickerOpen && (
        <DateTimePicker
          value={selectedTime}
          mode='time'
          display='default'
          onChange={handleTimeChange}
          themeVariant='dark'
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
    },
    saveButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.onSurface,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    dateTimeContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    dateTimeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 8,
    },
    dateTimeText: {
      fontSize: 16,
      color: colors.onSurface,
    },
    dateTimePreview: {
      marginTop: 8,
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    participantContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 8,
      paddingVertical: 8,
    },
    participantButton: {
      padding: 12,
    },
    participantNumber: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.onSurface,
      marginHorizontal: 24,
    },
    durationContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    durationOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    durationOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    durationOptionText: {
      fontSize: 14,
      color: colors.onSurface,
    },
    durationOptionTextSelected: {
      color: colors.onPrimary,
    },
    // iOS Picker Modal Styles
    pickerModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    pickerModalContent: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 32,
    },
    pickerModalHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    pickerModalDone: {
      fontSize: 17,
      fontWeight: '600',
    },
    iosPicker: {
      height: 216,
      alignSelf: 'center',
    },
    iosCalendarPicker: {
      height: 350,
      alignSelf: 'center',
    },
  });

export default EditEventScreen;
