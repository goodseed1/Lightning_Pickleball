/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Card, Title, Button, ActivityIndicator, Chip, Avatar, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ActivityService from '../services/activityService';
import userService from '../services/userService';
import {
  participationApplicationService,
  TeamApplication,
} from '../services/participationApplicationService';
import { RootStackParamList } from '../navigation/AppNavigator';

interface EventDetail {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  type: 'rankedMatch' | 'casualMeetup';
  maxParticipants: number;
  participants: string[];
  waitingList: string[];
  status: string;
  isPublic: boolean;
  minNTRP?: number;
  maxNTRP?: number;
  isRanked: boolean;
  gameType?: string; // 'singles', 'doubles', 'mixed_doubles' 등
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  creatorInfo?: {
    id: string;
    name: string;
    profileImage?: string;
  };
  result?: {
    winnerId: string;
    loserId: string;
    score: string;
    recordedAt: Date;
  };
  completedAt?: Date;
}

interface Participant {
  id: string;
  displayName: string;
  profileImage?: string;
  ltrLevel?: number;
}

type EventDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EventDetail'>;
type EventDetailScreenRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;

export default function EventDetailScreen() {
  const navigation = useNavigation<EventDetailScreenNavigationProp>();
  const route = useRoute<EventDetailScreenRouteProp>();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const { eventId } = route.params;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  // 🎯 Stage 2B: Individual applicants state
  const [individualApplicants, setIndividualApplicants] = useState<TeamApplication[]>([]);

  useEffect(() => {
    loadEventDetail();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEventDetail = async () => {
    try {
      setLoading(true);

      // Load event details
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eventData = (await ActivityService.getEventById(eventId)) as any;
      setEvent(eventData as EventDetail);

      // Load participant details
      if (eventData.participants && eventData.participants.length > 0) {
        // 🆕 [KIM FIX] Extract userId strings from participant objects

        const userIds = eventData.participants.map((p: { userId?: string } | string) =>
          typeof p === 'string' ? p : p.userId || ''
        );
        const participantData = await userService.getUserProfiles(userIds);
        setParticipants(participantData);
      }

      // 🎯 Stage 2B: Load individual applicants for doubles events
      try {
        const individuals = await participationApplicationService.getIndividualApplicants(eventId);
        setIndividualApplicants(individuals);
        console.log('✅ [EventDetailScreen] Individual applicants loaded:', individuals.length);
      } catch (error) {
        console.error('Error loading individual applicants:', error);
        // Don't fail the entire load if this fails
      }
    } catch (error) {
      console.error('Error loading event detail:', error);
      Alert.alert(t('common.error'), t('eventDetail.errors.loadFailed'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!currentUser?.uid) {
      Alert.alert(
        t('eventDetail.alerts.loginRequired.title'),
        t('eventDetail.alerts.loginRequired.message')
      );
      return;
    }

    if (!event) return;

    if (event.participants.includes(currentUser.uid)) {
      Alert.alert(
        t('eventDetail.alerts.alreadyJoined.title'),
        t('eventDetail.alerts.alreadyJoined.message')
      );
      return;
    }

    if (event.createdBy === currentUser.uid) {
      Alert.alert(t('eventDetail.alerts.ownEvent.title'), t('eventDetail.alerts.ownEvent.message'));
      return;
    }

    // 🔧 [FIX] Check if already applied (for doubles events)
    const alreadyApplied = individualApplicants.some(app => app.applicantId === currentUser.uid);
    if (alreadyApplied) {
      Alert.alert(
        t('eventDetail.alerts.alreadyApplied.title'),
        t('eventDetail.alerts.alreadyApplied.message')
      );
      return;
    }

    try {
      setJoinLoading(true);

      // 🔧 [FIX] 복식 이벤트의 경우 participation_applications에 개별 신청 생성
      const isDoublesEvent = event.gameType?.toLowerCase().includes('doubles');

      if (isDoublesEvent) {
        // 복식: 개별 신청 생성 (파트너 초대 및 호스트 승인 필요)
        const applicantName = currentUser.displayName || currentUser.email || t('common.user');
        await participationApplicationService.createIndividualApplication(
          eventId,
          currentUser.uid,
          applicantName
        );
        Alert.alert(
          t('eventDetail.alerts.applicationComplete.title'),
          t('eventDetail.alerts.applicationComplete.message')
        );
      } else {
        // 단식: 직접 참가
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (await eventService.joinEvent(eventId, currentUser.uid)) as any;

        if (result && result.status === 'joined') {
          Alert.alert(t('common.success'), t('eventDetail.alerts.joinSuccess.message'));
        } else if (result && result.status === 'waitlisted') {
          Alert.alert(
            t('eventDetail.alerts.waitlisted.title'),
            t('eventDetail.alerts.waitlisted.message')
          );
        }
      }

      // Refresh event details
      await loadEventDetail();
    } catch (error) {
      console.error('Error joining event:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('eventDetail.errors.joinFailed');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!currentUser?.uid || !event) return;

    Alert.alert(
      t('eventDetail.alerts.leaveConfirm.title'),
      t('eventDetail.alerts.leaveConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('eventDetail.actions.leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              setJoinLoading(true);
              await eventService.leaveEvent(eventId, currentUser.uid);
              Alert.alert(
                t('eventDetail.alerts.leaveSuccess.title'),
                t('eventDetail.alerts.leaveSuccess.message')
              );
              await loadEventDetail();
            } catch (error) {
              console.error('Error leaving event:', error);
              const errorMessage =
                error instanceof Error ? error.message : t('eventDetail.errors.leaveFailed');
              Alert.alert(t('common.error'), errorMessage);
            } finally {
              setJoinLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRecordScore = () => {
    navigation.navigate('RecordScore', { eventId });
  };

  const handleEvaluateParticipants = () => {
    if (!event) return;
    navigation.navigate('RateSportsmanship', {
      eventId: event.id,
      eventType: 'meetup',
    });
  };

  // 🎯 Stage 2B: Handle partner invitation
  const handleInvitePartner = async (
    partnerAppId: string,
    partnerId: string,
    partnerName: string
  ) => {
    if (!currentUser?.uid) {
      Alert.alert(
        t('eventDetail.alerts.loginRequired.title'),
        t('eventDetail.alerts.loginRequired.message')
      );
      return;
    }

    // Find my individual application
    const myApp = individualApplicants.find(app => app.applicantId === currentUser.uid);
    if (!myApp || !myApp.id) {
      Alert.alert(t('common.error'), t('eventDetail.errors.applicationNotFound'));
      return;
    }

    try {
      await participationApplicationService.convertToTeamApplication(
        myApp.id,
        currentUser.uid,
        currentUser.displayName || currentUser.email || t('common.user'),
        partnerAppId,
        partnerId,
        partnerName,
        eventId // 🔧 [FIX] Added for host real-time update trigger
      );

      Alert.alert(
        t('eventDetail.alerts.inviteSent.title'),
        t('eventDetail.alerts.inviteSent.message', { partnerName })
      );

      // Refresh data
      await loadEventDetail();
    } catch (error) {
      console.error('Error inviting partner:', error);
      Alert.alert(t('common.error'), t('eventDetail.errors.inviteFailed'));
    }
  };

  const getEventTypeInfo = (type: string) => {
    switch (type) {
      case 'rankedMatch':
        return {
          icon: '🏆',
          label: t('eventDetail.eventTypes.rankedMatch'),
          color: '#ff6b35',
          bgColor: '#fff3f0',
        };
      case 'casualMeetup':
        return {
          icon: '😊',
          label: t('eventDetail.eventTypes.casualMeetup'),
          color: '#4caf50',
          bgColor: '#f1f8e9',
        };
      default:
        return {
          icon: '🎾',
          label: t('eventDetail.eventTypes.default'),
          color: '#666',
          bgColor: '#f5f5f5',
        };
    }
  };

  // 🎯 [KIM FIX] Convert Firestore Timestamp or string to Date object
  const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    // Firestore Timestamp has toDate() method
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      return (value as { toDate: () => Date }).toDate();
    }
    // String date
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  const formatDateTime = (dateInput: unknown) => {
    const date = toDate(dateInput);
    if (!date) {
      return t('eventDetail.time.unknown') || t('common.unknown');
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow =
      date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    const locale = t('common.locale');
    const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `${t('eventDetail.time.today')} ${timeStr}`;
    } else if (isTomorrow) {
      return `${t('eventDetail.time.tomorrow')} ${timeStr}`;
    } else {
      return `${date.toLocaleDateString(locale)} ${timeStr}`;
    }
  };

  const isEventCompleted = () => {
    return event?.status === 'completed' || (event?.endTime && event.endTime < new Date());
  };

  const isEventStarted = () => {
    return event?.startTime && event.startTime < new Date();
  };

  const canRecordScore = () => {
    if (!event || !currentUser?.uid) return false;
    return (
      event.type === 'rankedMatch' &&
      event.createdBy === currentUser.uid &&
      isEventCompleted() &&
      !event.result
    );
  };

  const canJoinEvent = () => {
    if (!event || !currentUser?.uid) return false;
    if (event.createdBy === currentUser.uid) return false;
    if (event.participants.includes(currentUser.uid)) return false;
    if (isEventStarted()) return false;
    return event.status === 'active';
  };

  const isUserJoined = () => {
    return event?.participants?.includes(currentUser?.uid || '') || false;
  };

  const canEvaluateParticipants = () => {
    if (!event || !currentUser?.uid) return false;
    // Note: EventDetail.type is 'rankedMatch' | 'casualMeetup', not 'meetup'
    // This function should return false as 'meetup' is not a valid event type
    return event.type === 'casualMeetup' && isUserJoined() && isEventCompleted();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('eventDetail.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name='alert-circle-outline' size={64} color='#ccc' />
          <Text style={styles.errorText}>{t('eventDetail.errors.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = getEventTypeInfo(event.type);

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navigationHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name='arrow-back' size={24} color='#333' />
        </TouchableOpacity>
        <Text style={styles.navigationTitle}>{t('eventDetail.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Header */}
        <Surface style={styles.eventHeader}>
          <View style={styles.typeContainer}>
            <View style={[styles.typeChip, { backgroundColor: typeInfo.bgColor }]}>
              <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
              <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
            </View>
            {event.isRanked && event.minNTRP && event.maxNTRP && (
              <Chip compact style={styles.ntrpChip} textStyle={styles.ntrpText}>
                LTR {event.minNTRP}-{event.maxNTRP}
              </Chip>
            )}
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>

          <View style={styles.eventInfo}>
            <View style={styles.infoRow}>
              <Ionicons name='time-outline' size={20} color='#666' />
              <Text style={styles.infoText}>
                {formatDateTime(event.startTime)} -{' '}
                {toDate(event.endTime)?.toLocaleTimeString(t('common.locale'), {
                  hour: '2-digit',
                  minute: '2-digit',
                }) || ''}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name='location-outline' size={20} color='#666' />
              <Text style={styles.infoText}>{event.location}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name='people-outline' size={20} color='#666' />
              <Text style={styles.infoText}>
                {event.participants?.length || 0}/{event.maxParticipants}{' '}
                {t('eventDetail.participants.label')}
                {(event.waitingList?.length || 0) > 0 &&
                  ` (${t('eventDetail.participants.waiting')} ${event.waitingList?.length || 0}${t('eventDetail.participants.count')})`}
              </Text>
            </View>
          </View>

          {/* Creator Info */}
          <View style={styles.creatorContainer}>
            <Avatar.Text
              size={40}
              label={event.creatorInfo?.name?.charAt(0) || 'U'}
              style={styles.creatorAvatar}
            />
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>
                {t('eventDetail.creator.label')} {event.creatorInfo?.name || t('common.unknown')}
              </Text>
              <Text style={styles.createdDate}>
                {toDate(event.createdAt)?.toLocaleDateString(t('common.locale')) || ''}{' '}
                {t('eventDetail.creator.created')}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Event Description */}
        {event.description && (
          <Card style={styles.descriptionCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>{t('eventDetail.sections.description')}</Title>
              <Text style={styles.description}>{event.description}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Match Result (if completed) */}
        {event.result && (
          <Card style={styles.resultCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>{t('eventDetail.sections.result')}</Title>
              <View style={styles.resultContainer}>
                <Text style={styles.resultScore}>{event.result.score}</Text>
                <Text style={styles.resultInfo}>
                  {t('eventDetail.result.winner')}{' '}
                  {participants.find(p => p.id === event.result?.winnerId)?.displayName ||
                    t('common.unknown')}
                </Text>
                <Text style={styles.resultDate}>
                  {toDate(event.result.recordedAt)?.toLocaleDateString(t('common.locale')) || ''}{' '}
                  {t('eventDetail.result.recorded')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Participants */}
        <Card style={styles.participantsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              {t('eventDetail.sections.participants', { count: participants.length })}
            </Title>

            <View style={styles.participantsList}>
              {participants.map(participant => (
                <View key={participant.id} style={styles.participantItem}>
                  <Avatar.Text
                    size={40}
                    label={participant.displayName?.charAt(0) || 'U'}
                    style={styles.participantAvatar}
                  />
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>
                      {participant.displayName}
                      {participant.id === event.createdBy &&
                        ` (${t('eventDetail.participants.host')})`}
                    </Text>
                    {participant.ltrLevel && (
                      <Text style={styles.participantNTRP}>LTR {participant.ltrLevel}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* 🎯 Stage 2B: Individual Applicants (Partner Finding) */}
        {individualApplicants.length > 0 && (
          <Card style={styles.participantsCard}>
            <Card.Content>
              <View style={styles.individualsHeader}>
                <Ionicons name='people-outline' size={24} color='#FF9800' />
                <Title style={styles.sectionTitle}>
                  {t('eventDetail.sections.findPartner', { count: individualApplicants.length })}
                </Title>
              </View>

              <View style={styles.participantsList}>
                {individualApplicants.map(applicant => (
                  <View key={applicant.id} style={styles.applicantItem}>
                    <Avatar.Text
                      size={40}
                      label={applicant.applicantName?.charAt(0) || 'U'}
                      style={styles.applicantAvatar}
                    />
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{applicant.applicantName}</Text>
                      {applicant.applicantId === currentUser?.uid && (
                        <Text style={styles.meLabel}>{t('eventDetail.participants.me')}</Text>
                      )}
                    </View>
                    {applicant.applicantId !== currentUser?.uid && (
                      <Button
                        mode='outlined'
                        compact
                        onPress={() =>
                          handleInvitePartner(
                            applicant.id!,
                            applicant.applicantId,
                            applicant.applicantName
                          )
                        }
                        style={styles.inviteButton}
                      >
                        {t('eventDetail.actions.invitePartner')}
                      </Button>
                    )}
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {canRecordScore() && (
            <Button
              mode='contained'
              onPress={handleRecordScore}
              style={[styles.actionButton, styles.recordButton]}
              contentStyle={styles.actionButtonContent}
              icon='clipboard-text'
            >
              {t('eventDetail.actions.recordResult')}
            </Button>
          )}

          {canEvaluateParticipants() && (
            <Button
              mode='contained'
              onPress={handleEvaluateParticipants}
              style={[styles.actionButton, styles.evaluateButton]}
              contentStyle={styles.actionButtonContent}
              icon='star'
            >
              {t('eventDetail.actions.evaluateParticipants')}
            </Button>
          )}

          {canJoinEvent() && (
            <Button
              mode='contained'
              onPress={handleJoinEvent}
              loading={joinLoading}
              disabled={joinLoading}
              style={[styles.actionButton, styles.joinButton]}
              contentStyle={styles.actionButtonContent}
            >
              {(event.participants?.length || 0) >= event.maxParticipants
                ? t('eventDetail.actions.joinWaitlist')
                : t('eventDetail.actions.join')}
            </Button>
          )}

          {isUserJoined() && !isEventStarted() && (
            <Button
              mode='outlined'
              onPress={handleLeaveEvent}
              loading={joinLoading}
              disabled={joinLoading}
              style={[styles.actionButton, styles.leaveButton]}
              contentStyle={styles.actionButtonContent}
            >
              {t('eventDetail.actions.leave')}
            </Button>
          )}

          {isUserJoined() && (
            <View style={styles.joinedIndicator}>
              <Ionicons name='checkmark-circle' size={20} color='#4caf50' />
              <Text style={styles.joinedText}>{t('eventDetail.status.joined')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  eventHeader: {
    padding: 20,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  typeIcon: {
    fontSize: 16,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ntrpChip: {
    backgroundColor: '#e3f2fd',
  },
  ntrpText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    lineHeight: 32,
  },
  eventInfo: {
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  creatorAvatar: {
    backgroundColor: theme.colors.primary,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  createdDate: {
    fontSize: 14,
    color: '#666',
  },
  descriptionCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  resultCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  resultContainer: {
    alignItems: 'center',
    gap: 8,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  resultInfo: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  resultDate: {
    fontSize: 14,
    color: '#666',
  },
  participantsCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  participantsList: {
    gap: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participantAvatar: {
    backgroundColor: theme.colors.primary,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  participantNTRP: {
    fontSize: 14,
    color: '#666',
  },
  individualsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  applicantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  applicantAvatar: {
    backgroundColor: '#FF9800',
  },
  meLabel: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
    marginTop: 2,
  },
  inviteButton: {
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  recordButton: {
    backgroundColor: '#ff6b35',
  },
  evaluateButton: {
    backgroundColor: '#9c27b0',
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
  },
  leaveButton: {
    borderColor: '#f44336',
  },
  joinedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  joinedText: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '600',
  },
});
