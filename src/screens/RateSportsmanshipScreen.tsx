/**
 * RateSportsmanshipScreen - 스포츠맨십 평가 화면
 * 매치/모임 종료 후 상대방에 대한 평가를 입력하는 화면
 *
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Title, Button, Avatar, ActivityIndicator, Chip } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningTennisTheme } from '../theme';
import ActivityService from '../services/activityService';
import userService from '../services/userService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { LightningEvent, ParticipationApplication } from '../types/activity';
import { RootStackParamList } from '../navigation/AppNavigator';

// 명예 태그 정의
const HONOR_TAGS = [
  { id: 'sharp_eyed', ko: '#칼같은라인콜', en: '#SharpEyed' },
  { id: 'full_of_energy', ko: '#파이팅넘침', en: '#FullOfEnergy' },
  { id: 'mr_manner', ko: '#매너장인', en: '#MrManner' },
  { id: 'punctual_pro', ko: '#시간은금이다', en: '#PunctualPro' },
  { id: 'mental_fortress', ko: '#강철멘탈', en: '#MentalFortress' },
  { id: 'court_jester', ko: '#코트의코미디언', en: '#CourtJester' },
];

// Types
type RateSportsmanshipScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RateSportsmanship'
>;
type RateSportsmanshipScreenRouteProp = RouteProp<RootStackParamList, 'RateSportsmanship'>;

interface ParticipantProfile {
  id: string;
  displayName: string;
  nickname: string;
  ltrLevel: string;
  profilePhotoURL: string | null;
}

interface MatchResult {
  winnerId: string;
  score: string;
  submittedAt: Date;
}

interface UserProfileData {
  nickname?: string;
  displayName?: string;
  ltrLevel?: number;
  profilePhotoURL?: string | null;
}

const RateSportsmanshipScreen = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const navigation = useNavigation<RateSportsmanshipScreenNavigationProp>();
  const route = useRoute<RateSportsmanshipScreenRouteProp>();

  const { eventId, eventType } = route.params;
  const fromScoreSubmission = eventType === 'fromScoreSubmission';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState<(LightningEvent & { matchResult?: MatchResult }) | null>(null);
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({});
  const [hasMatchResult, setHasMatchResult] = useState(false);

  useEffect(() => {
    loadEventData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  /**
   * 이벤트 데이터 로드
   */
  const loadEventData = async () => {
    try {
      setLoading(true);

      const eventDataRaw = await ActivityService.getEventById(eventId);
      if (!eventDataRaw) {
        throw new Error(t('screens.rateSportsmanship.eventNotFound'));
      }

      const eventData = eventDataRaw as LightningEvent & { matchResult?: MatchResult };
      setEvent(eventData);

      // 🏆 매치 결과 확인 - 점수가 이미 입력되었는지 체크
      const eventHasMatchResult = !!eventData.matchResult;
      setHasMatchResult(eventHasMatchResult);

      console.log('🏆 [RateSportsmanshipScreen] Event match result status:', {
        eventId,
        hasMatchResult: eventHasMatchResult,
        matchResult: eventData.matchResult,
        fromScoreSubmission,
      });

      // participation_applications 컬렉션에서 승인된 참가자들 가져오기
      const applicationsQuery = query(
        collection(db, 'participation_applications'),
        where('eventId', '==', eventId),
        where('status', '==', 'approved')
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      const approvedApplications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (ParticipationApplication & { applicantName?: string })[];

      console.log('Approved applications:', approvedApplications);

      // 승인된 참가자들의 사용자 정보 가져오기
      const participantProfiles: ParticipantProfile[] = [];
      for (const application of approvedApplications) {
        if (application.applicantId && application.applicantId !== currentUser?.uid) {
          try {
            const userProfileRaw = await userService.getUserProfile(application.applicantId);
            if (userProfileRaw) {
              const userProfile = userProfileRaw as UserProfileData;
              participantProfiles.push({
                id: application.applicantId,
                displayName:
                  userProfile.nickname ||
                  userProfile.displayName ||
                  application.applicantName ||
                  t('common.unknown'),
                nickname: userProfile.nickname || application.applicantName || t('common.unknown'),
                ltrLevel: userProfile.ltrLevel?.toString() || t('common.unspecified'),
                profilePhotoURL: userProfile.profilePhotoURL || null,
              });
            }
          } catch (error) {
            console.error(`Error fetching profile for ${application.applicantId}:`, error);
            // 프로필을 가져올 수 없는 경우 기본 정보로 추가
            participantProfiles.push({
              id: application.applicantId,
              displayName: application.applicantName || t('common.unknown'),
              nickname: application.applicantName || t('common.unknown'),
              ltrLevel: t('common.unspecified'),
              profilePhotoURL: null,
            });
          }
        }
      }

      console.log('Final participant profiles:', participantProfiles);
      setParticipants(participantProfiles);

      // 태그 선택 초기값 설정
      const initialSelectedTags: Record<string, string[]> = {};
      participantProfiles.forEach(participant => {
        initialSelectedTags[participant.id] = [];
      });

      setSelectedTags(initialSelectedTags);
    } catch (error) {
      console.error('Error loading event data:', error);
      Alert.alert(t('rateSportsmanship.alerts.error'), t('rateSportsmanship.alerts.loadFailed'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  /**
   * 뒤로가기 버튼 핸들러 - 스마트 네비게이션
   */
  const handleBackButton = () => {
    // 이미 점수가 입력된 경우 또는 점수 제출 후 온 경우: 피드로 이동
    if (hasMatchResult || fromScoreSubmission) {
      console.log('🚀 [RateSportsmanshipScreen] Navigating to Feed (scores already submitted)');
      navigation.navigate('MainTabs', { screen: 'Feed' });
    } else {
      // 점수가 아직 입력되지 않은 경우: 이전 화면으로 돌아가기
      console.log('🚀 [RateSportsmanshipScreen] Going back to previous screen');
      navigation.goBack();
    }
  };

  /**
   * 태그 토글
   */
  const toggleTag = (participantId: string, tagId: string) => {
    setSelectedTags(prev => ({
      ...prev,
      [participantId]: prev[participantId].includes(tagId)
        ? prev[participantId].filter(id => id !== tagId)
        : [...prev[participantId], tagId],
    }));
  };

  /**
   * 태그 선택 유효성 검사
   */
  const validateTags = () => {
    for (const participantId of Object.keys(selectedTags)) {
      if (selectedTags[participantId].length === 0) {
        return false;
      }
    }
    return true;
  };

  /**
   * 태그 제출
   */
  const handleSubmitTags = async () => {
    if (!validateTags()) {
      Alert.alert(
        t('rateSportsmanship.alerts.tagsRequired'),
        t('rateSportsmanship.alerts.tagsRequiredMessage')
      );
      return;
    }

    try {
      setSubmitting(true);

      // 각 참가자에 대한 태그 제출
      const tagPromises = participants.map(async participant => {
        const tagIds = selectedTags[participant.id];
        if (tagIds.length > 0 && currentUser) {
          return await userService.awardSportsmanshipTags(participant.id, tagIds, currentUser.uid);
        }
      });

      await Promise.all(tagPromises);

      Alert.alert(
        t('rateSportsmanship.alerts.badgesAwarded'),
        t('rateSportsmanship.alerts.badgesAwardedMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // 메인 화면으로 돌아가기
              navigation.navigate('MainTabs', { screen: 'Feed' });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting tags:', error);
      Alert.alert(t('rateSportsmanship.alerts.error'), t('rateSportsmanship.alerts.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 참가자 태그 선택 카드 렌더링
   */
  const renderParticipantCard = (participant: ParticipantProfile) => {
    const participantTags = selectedTags[participant.id] || [];

    return (
      <Card key={participant.id} style={styles.participantCard}>
        <Card.Content>
          {/* 참가자 정보 */}
          <View style={styles.participantHeader}>
            <Avatar.Text
              size={50}
              label={participant.displayName?.charAt(0) || 'U'}
              style={styles.participantAvatar}
            />
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {participant.displayName || participant.nickname || t('common.unknown')}
              </Text>
              {participant.ltrLevel && (
                <Chip compact style={styles.ntrpChip}>
                  NTRP {participant.ltrLevel}
                </Chip>
              )}
            </View>
          </View>

          {/* 명예 태그 선택 섹션 */}
          <View style={styles.tagSection}>
            <Text style={styles.tagSectionTitle}>{t('rateSportsmanship.selectBadges')}</Text>
            <Text style={styles.tagSectionDescription}>
              {t('rateSportsmanship.selectBadgesDescription')}
            </Text>

            <View style={styles.tagsContainer}>
              {HONOR_TAGS.map(tag => (
                <Chip
                  key={tag.id}
                  mode={participantTags.includes(tag.id) ? 'flat' : 'outlined'}
                  selected={participantTags.includes(tag.id)}
                  onPress={() => toggleTag(participant.id, tag.id)}
                  style={[
                    styles.tagChip,
                    participantTags.includes(tag.id) && styles.selectedTagChip,
                  ]}
                  textStyle={[
                    styles.tagChipText,
                    participantTags.includes(tag.id) && styles.selectedTagChipText,
                  ]}
                >
                  {t(
                    `rateSportsmanship.honorTags.${tag.id.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`
                  )}
                </Chip>
              ))}
            </View>

            {/* 선택된 태그 개수 표시 */}
            <Text style={styles.selectedCount}>
              {t('rateSportsmanship.selectedCount', { count: participantTags.length })}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const styles = getStyles(themeColors.colors as unknown as ThemeColors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Title style={styles.title}>{t('rateSportsmanship.title')}</Title>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary || '#007AFF'} />
          <Text style={styles.loadingText}>{t('rateSportsmanship.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={themeColors.colors.onSurface || '#000'} />
        </TouchableOpacity>
        <Title style={styles.title}>{t('rateSportsmanship.title')}</Title>
        <View style={styles.placeholder} />
      </View>

      {/* 이벤트 정보 */}
      <Card style={styles.eventCard}>
        <Card.Content>
          <Text style={styles.eventTitle}>{event?.title || 'Event'}</Text>
          <Text style={styles.eventDescription}>{t('rateSportsmanship.eventDescription')}</Text>
        </Card.Content>
      </Card>

      {/* 참가자 평가 목록 */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {participants.map(renderParticipantCard)}

        {/* 제출 버튼 */}
        <View style={styles.submitContainer}>
          <Button
            mode='contained'
            onPress={handleSubmitTags}
            loading={submitting}
            disabled={submitting || !validateTags()}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            textColor='#000000'
            labelStyle={{ fontWeight: '700', fontSize: 16, color: '#000000' }}
          >
            {submitting ? t('rateSportsmanship.submitting') : t('rateSportsmanship.submitButton')}
          </Button>

          <Text style={styles.submitNote}>{t('rateSportsmanship.submitNote')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  surfaceElevated: string;
  onSurface: string;
  onSurfaceHigh: string;
  onSurfaceMedium: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  primaryContainer: string;
  primaryElevated: string;
  primaryGlow: string;
}

const getStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background, // Level 0: 심연 (가장 깊은 배경)
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.outline,
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.onSurface,
    },
    placeholder: {
      width: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: themeColors.onSurfaceVariant,
    },
    eventCard: {
      margin: 16,
      marginBottom: 8,
      backgroundColor: themeColors.surface, // Level 1: 기본 표면
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    eventTitle: {
      fontSize: 18,
      fontWeight: '700', // 최고 중요도 텍스트
      color: themeColors.onSurface,
      marginBottom: 8,
    },
    eventDescription: {
      fontSize: 14,
      fontWeight: '500', // 중간 중요도 텍스트
      color: themeColors.onSurfaceHigh,
    },
    scrollView: {
      flex: 1,
      padding: 16,
    },
    participantCard: {
      marginBottom: 24,
      borderRadius: 12,
      backgroundColor: themeColors.surfaceVariant, // Level 2: 상위 표면
      borderWidth: 1,
      borderColor: themeColors.outlineVariant,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    participantHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    participantAvatar: {
      backgroundColor: themeColors.primary,
      marginRight: 16,
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.onSurface,
      marginBottom: 8,
    },
    ntrpChip: {
      backgroundColor: themeColors.primaryContainer,
      alignSelf: 'flex-start',
    },
    tagSection: {
      marginTop: 16,
    },
    tagSectionTitle: {
      fontSize: 16,
      fontWeight: '700', // 높은 중요도 제목
      color: themeColors.onSurface,
      marginBottom: 8,
    },
    tagSectionDescription: {
      fontSize: 13,
      fontWeight: '500',
      color: themeColors.onSurfaceHigh, // 높은 중요도 텍스트
      marginBottom: 16,
      lineHeight: 18,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    tagChip: {
      borderColor: themeColors.outline,
      backgroundColor: themeColors.surfaceElevated, // Level 3: 부상된 표면
      borderWidth: 1.5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
      borderRadius: 8,
    },
    selectedTagChip: {
      backgroundColor: themeColors.primary, // Lightning Tennis 브랜드 블루
      borderColor: themeColors.primaryElevated,
      borderWidth: 2,
      shadowColor: themeColors.primaryGlow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
      borderRadius: 8,
    },
    tagChipText: {
      fontSize: 12,
      color: themeColors.onSurface, // 최고 중요도 텍스트
      fontWeight: '600',
    },
    selectedTagChipText: {
      color: '#FFFFFF', // 선택된 태그는 순백색으로 최대 대비
      fontWeight: '800',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    selectedCount: {
      fontSize: 12,
      color: themeColors.onSurfaceMedium, // 중간 중요도 텍스트
      textAlign: 'center',
      fontStyle: 'italic',
      fontWeight: '500',
    },
    submitContainer: {
      marginTop: 16,
      marginBottom: 32,
    },
    submitButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      shadowColor: themeColors.primaryGlow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    submitButtonContent: {
      paddingVertical: 12,
    },
    submitNote: {
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '500',
      color: themeColors.onSurfaceVariant, // 낮은 중요도 텍스트
      marginTop: 12,
      lineHeight: 18,
    },
  });

export default RateSportsmanshipScreen;
