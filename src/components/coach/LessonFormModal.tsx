/**
 * LessonFormModal - 레슨 생성/수정 모달
 * 코치 레슨 게시판에서 새 레슨을 등록하거나 기존 레슨을 수정
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { TextInput, Button, Text, IconButton, ActivityIndicator } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getLightningPickleballTheme } from '../../theme';
import { getCurrencyByCountry } from '../../utils/currencyUtils';
import { CoachLesson, CreateLessonRequest, LessonLocation } from '../../types/coachLesson';
import coachLessonService from '../../services/coachLessonService';

interface LessonFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editLesson?: CoachLesson; // 수정 모드일 때
}

const LessonFormModal: React.FC<LessonFormModalProps> = ({
  visible,
  onClose,
  onSuccess,
  editLesson,
}) => {
  const { theme: currentTheme } = useTheme();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const colors = themeColors.colors as unknown as Record<string, string>;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [fee, setFee] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editLesson;

  // 🌍 사용자 국가에 따른 통화 설정 (동적 화폐 코드 사용)
  const userCountry = currentUser?.profile?.location?.country;
  const currency = getCurrencyByCountry(userCountry);
  const currencySymbol = currency.symbol;
  // 💰 동적 라벨: "Плата (RUB)", "Fee (JPY)" 등
  const currencyLabel = `${t('lessonForm.feeLabel')} (${currency.code})`;

  // 수정 모드일 때 기존 값 로드
  useEffect(() => {
    if (editLesson) {
      setTitle(editLesson.title);
      setDescription(editLesson.description || '');
      setLocation(editLesson.location || '');
      setFee(editLesson.fee?.toString() || '');
      setMaxParticipants(editLesson.maxParticipants?.toString() || '');
      setSelectedDate(editLesson.dateTime?.toDate() || new Date());
    } else {
      // 새 레슨: 기본값 초기화
      setTitle('');
      setDescription('');
      setLocation('');
      setFee('');
      setMaxParticipants('');
      setSelectedDate(new Date());
    }
  }, [editLesson, visible]);

  // 날짜 포맷팅 (짧은 형식으로 박스 오버플로우 방지)
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString(t('common.locale'), options);
  };

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleTimeString(t('common.locale'), options);
  };

  // 날짜 변경
  const onDateChange = (_event: unknown, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(newDate);
    }
  };

  // 시간 변경
  const onTimeChange = (_event: unknown, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      const newDate = new Date(selectedDate);
      newDate.setHours(time.getHours(), time.getMinutes());
      setSelectedDate(newDate);
    }
  };

  // 유효성 검사 (제목과 설명만 필수)
  const validateForm = (): boolean => {
    if (!title.trim()) return false;
    if (!description.trim()) return false;
    return true;
  };

  // 제출
  const handleSubmit = async () => {
    if (!validateForm() || !currentUser) return;

    // 🎯 [KIM FIX v2] 위치 정보 필수 체크 - 거리 필터링을 위해 좌표 필수
    const hasValidCoordinates = currentUser.profile?.location?.latitude;
    if (!hasValidCoordinates) {
      Alert.alert(t('lessonForm.locationRequiredTitle'), t('lessonForm.locationRequiredMessage'));
      return;
    }

    setIsSubmitting(true);
    try {
      // 🎯 [KIM FIX v2] 사용자 위치 정보 가져오기 - ServiceFormModal과 동일하게 처리
      // GPS 좌표가 있을 때만 저장 (0,0 placeholder 제거 - 거리 계산 오류 방지)
      const userLocation = currentUser.profile?.location;
      let coordinates: LessonLocation | undefined;

      const lat = userLocation?.latitude ?? userLocation?.lat;
      const lng = userLocation?.longitude ?? userLocation?.lng;
      if (lat && lng) {
        coordinates = {
          latitude: lat,
          longitude: lng,
          city: userLocation?.city,
          country: userLocation?.country,
        };
      }
      // GPS 좌표 없으면 coordinates를 저장하지 않음 (ServiceFormModal과 동일)

      const request: CreateLessonRequest = {
        title: title.trim(),
        description: description.trim(),
        dateTime: selectedDate,
        location: location.trim() || undefined,
        fee: fee ? Number(fee) : undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        coordinates,
      };

      if (isEditMode && editLesson) {
        // 수정
        await coachLessonService.updateLesson(editLesson.id, {
          title: request.title,
          description: request.description,
          dateTime: request.dateTime,
          location: request.location,
          fee: request.fee,
          maxParticipants: request.maxParticipants,
        });
      } else {
        // 생성
        const displayName =
          (currentUser.profile as unknown as { displayName?: string })?.displayName || currentUser.displayName || 'Unknown';
        const photoURL = currentUser.photoURL || undefined;

        // 🎯 [KIM FIX] Author 좌표 추출 - 거리 기반 필터링을 위해 필요
        const loc = currentUser.profile?.location;
        const authorLat = loc?.latitude ?? loc?.lat;
        const authorLng = loc?.longitude ?? loc?.lng;
        const authorCoordinates = authorLat && authorLng
          ? { latitude: authorLat, longitude: authorLng }
          : undefined;

        await coachLessonService.createLesson(
          request,
          currentUser.uid,
          displayName,
          photoURL,
          authorCoordinates
        );
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ [LessonFormModal] Error:', error);

      // 🛡️ 게시 제한 에러 처리
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.startsWith('DAILY_LIMIT_EXCEEDED')) {
        const limit = errorMessage.split(':')[1];
        Alert.alert(t('lessonForm.dailyLimitTitle'), t('lessonForm.dailyLimitMessage', { limit }));
      } else if (errorMessage.startsWith('MAX_POSTS_EXCEEDED')) {
        const limit = errorMessage.split(':')[1];
        Alert.alert(t('lessonForm.maxPostsTitle'), t('lessonForm.maxPostsMessage', { limit }));
      } else {
        Alert.alert(t('lessonForm.errorTitle'), t('lessonForm.errorMessage'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType='slide' transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* 헤더 */}
          <View style={[styles.header, { borderBottomColor: colors.outline }]}>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
              {isEditMode ? t('lessonForm.editTitle') : t('lessonForm.newTitle')}
            </Text>
            <IconButton
              icon='close'
              size={24}
              iconColor={colors.onSurfaceVariant}
              onPress={onClose}
            />
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* 제목 */}
            <TextInput
              label={t('lessonForm.titleLabel')}
              value={title}
              onChangeText={setTitle}
              mode='outlined'
              style={styles.input}
              maxLength={100}
              right={<TextInput.Affix text={`${title.length}/100`} />}
            />

            {/* 설명 */}
            <TextInput
              label={t('lessonForm.descriptionLabel')}
              value={description}
              onChangeText={setDescription}
              mode='outlined'
              style={styles.input}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            {/* 날짜 선택 */}
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
              {t('lessonForm.dateTimeLabel')}
            </Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateTimeButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name='calendar-outline' size={20} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.onSurface }]}>
                  {formatDate(selectedDate)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateTimeButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name='time-outline' size={20} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.onSurface }]}>
                  {formatTime(selectedDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode='date'
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
                themeVariant={currentTheme === 'dark' ? 'dark' : 'light'}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={selectedDate}
                mode='time'
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                themeVariant={currentTheme === 'dark' ? 'dark' : 'light'}
              />
            )}

            {/* 장소 */}
            <TextInput
              label={t('lessonForm.locationLabel')}
              value={location}
              onChangeText={setLocation}
              mode='outlined'
              style={styles.input}
              maxLength={200}
            />

            {/* 레슨료 */}
            <TextInput
              label={currencyLabel}
              value={fee}
              onChangeText={setFee}
              mode='outlined'
              style={styles.input}
              keyboardType='numeric'
              left={<TextInput.Affix text={currencySymbol} />}
            />

            {/* 모집 인원 */}
            <TextInput
              label={t('lessonForm.maxParticipantsLabel')}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              mode='outlined'
              style={styles.input}
              keyboardType='numeric'
              right={<TextInput.Affix text={t('lessonForm.participantsUnit')} />}
            />

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* 제출 버튼 */}
          <View style={[styles.footer, { borderTopColor: colors.outline }]}>
            <Button
              mode='contained'
              onPress={handleSubmit}
              disabled={!validateForm() || isSubmitting}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} size='small' />
              ) : isEditMode ? (
                t('lessonForm.updateButton')
              ) : (
                t('lessonForm.submitButton')
              )}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonContent: {
    height: 48,
  },
});

export default LessonFormModal;
