/**
 * LessonCard - 코치 레슨 게시판 카드 컴포넌트
 * 레슨 정보를 표시하고 수정/삭제/채팅 기능 제공
 */

import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Text, Avatar, IconButton, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { getLightningTennisTheme } from '../../theme';
import { CoachLesson } from '../../types/coachLesson';
import { formatDistance } from '../../utils/unitUtils';
import { formatPriceByCountry } from '../../utils/currencyUtils';
import clubService from '../../services/clubService';

interface LessonCardProps {
  lesson: CoachLesson;
  onEdit?: (lesson: CoachLesson) => void;
  onDelete?: (lessonId: string) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, onEdit, onDelete }) => {
  const { currentLanguage, t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors as unknown as Record<string, string>;

  const isOwner = currentUser?.uid === lesson.authorId;
  const userCountry = currentUser?.profile?.location?.country;

  // 날짜 포맷팅
  const formatDateTime = (timestamp: { toDate: () => Date }) => {
    const date = timestamp.toDate();
    const locale = currentLanguage === 'ko' ? ko : enUS;

    if (currentLanguage === 'ko') {
      return format(date, 'M월 d일 (EEE) a h:mm', { locale });
    }
    return format(date, 'MMM d (EEE) h:mm a', { locale });
  };

  // 🌍 레슨료 포맷팅 (작성자의 국가 기반으로 화폐 결정)
  const authorCountry = lesson.coordinates?.country;
  // 작성자 국가가 있으면 작성자 국가 기준, 없으면 현재 사용자 국가 기준
  const priceCountry = authorCountry || userCountry;

  const formatFee = (fee: number) => {
    // 🌍 국가별 화폐로 포맷팅
    return formatPriceByCountry(fee, priceCountry);
  };

  // 작성자 아바타 클릭 -> 개인 대화방
  const handleAvatarPress = () => {
    if (!currentUser || currentUser.uid === lesson.authorId) {
      return; // 본인이면 채팅 불가
    }

    const conversationId = clubService.getConversationId(currentUser.uid, lesson.authorId);

    // @ts-expect-error - navigation type
    navigation.navigate('DirectChatRoom', {
      conversationId,
      otherUserId: lesson.authorId,
      otherUserName: lesson.authorName,
      otherUserPhotoURL: lesson.authorPhotoURL || '',
    });
  };

  // 삭제 확인
  const handleDeletePress = () => {
    Alert.alert(t('lessonCard.deleteTitle'), t('lessonCard.deleteMessage'), [
      {
        text: t('lessonCard.cancelButton'),
        style: 'cancel',
      },
      {
        text: t('lessonCard.deleteButton'),
        style: 'destructive',
        onPress: () => onDelete?.(lesson.id),
      },
    ]);
  };

  return (
    <Card style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* 헤더: 작성자 정보 + 버튼 */}
      <View style={styles.header}>
        <View style={styles.authorSection}>
          {lesson.authorPhotoURL ? (
            <Avatar.Image size={40} source={{ uri: lesson.authorPhotoURL }} />
          ) : (
            <Avatar.Text
              size={40}
              label={lesson.authorName.charAt(0).toUpperCase()}
              style={{ backgroundColor: colors.primaryContainer }}
            />
          )}
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.onSurface }]}>
              {lesson.authorName}
            </Text>
          </View>
        </View>

        {isOwner ? (
          <View style={styles.actionButtons}>
            <IconButton
              icon='pencil'
              size={20}
              iconColor={colors.onSurfaceVariant}
              onPress={() => onEdit?.(lesson)}
            />
            <IconButton
              icon='delete'
              size={20}
              iconColor={colors.error}
              onPress={handleDeletePress}
            />
          </View>
        ) : (
          <Button
            mode='contained'
            compact
            onPress={handleAvatarPress}
            style={styles.consultButton}
            labelStyle={styles.consultButtonLabel}
          >
            {t('lessonCard.consultButton')}
          </Button>
        )}
      </View>

      {/* 제목 */}
      <View style={styles.titleSection}>
        <Text style={[styles.title, { color: colors.onSurface }]}>{lesson.title}</Text>
        {lesson.description && (
          <Text style={[styles.description, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
            {lesson.description}
          </Text>
        )}
      </View>

      {/* 레슨 정보 (옵션 필드가 하나라도 있을 때만 표시) */}
      {(lesson.dateTime ||
        lesson.location ||
        lesson.fee !== undefined ||
        lesson.maxParticipants !== undefined) && (
        <View style={[styles.infoSection, { borderTopColor: colors.outline }]}>
          {/* 시간 */}
          {lesson.dateTime && (
            <View style={styles.infoRow}>
              <Ionicons name='calendar-outline' size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.onSurface }]}>
                {formatDateTime(lesson.dateTime)}
              </Text>
            </View>
          )}

          {/* 장소 + 거리 */}
          {lesson.location && (
            <View style={styles.infoRow}>
              <Ionicons name='location-outline' size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.onSurface }]}>
                {lesson.location}
                {lesson.distance !== undefined && lesson.distance !== null && (
                  <Text style={{ color: colors.onSurfaceVariant }}>
                    {' '}
                    ({formatDistance(lesson.distance, userCountry)})
                  </Text>
                )}
              </Text>
            </View>
          )}

          {/* 레슨료 */}
          {lesson.fee !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name='card-outline' size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.onSurface }]}>
                {formatFee(lesson.fee)}
              </Text>
            </View>
          )}

          {/* 모집 인원 */}
          {lesson.maxParticipants !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name='people-outline' size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.onSurface }]}>
                {t('lessonCard.capacity', { count: lesson.maxParticipants })}
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  consultButton: {
    borderRadius: 8,
  },
  consultButtonLabel: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  titleSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  infoSection: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
});

export default LessonCard;
