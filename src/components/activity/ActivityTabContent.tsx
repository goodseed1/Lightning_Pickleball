/**
 * Enhanced Activity Tab Content Component
 * Handles all three activity tabs with proper data management
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLightningPickleballTheme } from '../../theme';
import { EventWithParticipation } from '../../types/activity';
import { PartnerInvitation } from '../../types/match';
import { FriendInvitation } from '../cards/FriendInvitationCard';
import ActivityService from '../../services/activityService';
import HostedEventCard, {
  PendingApplication,
  ApprovedApplication,
  HostedEvent,
} from '../cards/HostedEventCard';
import AppliedEventCard from '../cards/AppliedEventCard';
import AppliedEventsSection from './AppliedEventsSection';
import HostedEventsSection from './HostedEventsSection';
import PastEventsSection from './PastEventsSection';
import UserSearchModal from '../modals/UserSearchModal';
import SetLocationTimeModal from '../modals/SetLocationTimeModal';
import { safeToDate } from '../../utils/dateUtils';
import {
  safeString,
  safeNumber,
  safeEventType,
  safeLocation,
  safeSkillLevel,
} from '../../utils/dataUtils';

type RootStackParamList = {
  EventChat: { eventId: string; eventTitle?: string };
  EditEvent: { eventId: string };
  UserProfile: { userId: string };
  // 🎾 경기 분석용 ChatScreen 타입 추가
  ChatScreen: {
    autoAnalyzeEvent?: {
      id: string;
      title: string;
      gameType?: string;
      hostId?: string;
      clubId?: string;
      scheduledTime?: Date;
      matchResult?: unknown;
    };
  };
};

interface ActivityTabContentProps {
  currentLanguage: string;
  appliedEvents: EventWithParticipation[];
  hostedEvents: EventWithParticipation[];
  pastEvents: EventWithParticipation[];
  partnerInvitations?: (PartnerInvitation & { id: string })[];
  // 🎯 [FRIEND INVITE] Friend invitation props
  friendInvitations?: FriendInvitation[];
  onAcceptFriendInvitation?: (eventId: string) => void;
  onRejectFriendInvitation?: (eventId: string) => void;
  onAcceptInvitation?: (invitationId: string) => void;
  onRejectInvitation?: (invitationId: string) => void;
  onReAcceptInvitation?: (invitationId: string) => void;
  loading: boolean;
  onRefresh: () => void;
  onEditEvent?: (eventId: string, eventData: EventWithParticipation) => void; // 🛡️ [IRON MAN ALPHA] Added for MyActivitiesScreen compatibility
  initialTab?: 'applied' | 'hosted' | 'past'; // ✅ 외부에서 초기 탭 설정 가능
}

const ActivityTabContent: React.FC<ActivityTabContentProps> = ({
  currentLanguage,
  appliedEvents,
  hostedEvents,
  pastEvents,
  partnerInvitations = [],
  friendInvitations = [],
  onAcceptFriendInvitation,
  onRejectFriendInvitation,
  onAcceptInvitation,
  onRejectInvitation,
  onReAcceptInvitation,
  loading,
  onRefresh,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEditEvent: _onEditEvent, // 🛡️ [IRON MAN ALPHA] Destructured for use (prefixed for future use)
  initialTab = 'applied', // ✅ 기본값은 'applied'
}) => {
  // 🔍 DEBUG: Log hostedEvents props to see if currentParticipants exists
  console.log('🔍🔍 [ActivityTabContent] hostedEvents props received:', {
    count: hostedEvents.length,
    firstEventAllKeys: hostedEvents.length > 0 ? Object.keys(hostedEvents[0]) : [],
    firstEventId: hostedEvents.length > 0 ? hostedEvents[0].id : null,
    firstEventHasCurrentParticipants:
      hostedEvents.length > 0 ? 'currentParticipants' in hostedEvents[0] : false,
    firstEventCurrentParticipants:
      hostedEvents.length > 0 ? hostedEvents[0].currentParticipants : null,
  });

  const { theme: currentTheme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors as unknown as { [key: string]: string });
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'applied' | 'hosted' | 'past'>(initialTab);

  // 🎯 [KIM FIX] Handle navigation parameters - update tab when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // 🎯 [OPERATION DUO - PHASE 2A] Re-invite partner state
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [selectedReinviteInfo, setSelectedReinviteInfo] = useState<{
    applicationId: string;
    eventId: string;
    clubId: string | null;
    gameType: string | null;
    partnerInvitationId: string | null;
    existingParticipantIds: string[];
    genderFilter: 'male' | 'female' | null;
  } | null>(null);

  // ⚡ Quick Match Location/Time Modal state
  const [locationTimeModalVisible, setLocationTimeModalVisible] = useState(false);
  const [selectedEventForLocationTime, setSelectedEventForLocationTime] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // ⚡ Quick Match 장소/시간 설정 핸들러
  const handleSetLocationTime = (eventId: string, eventTitle: string) => {
    setSelectedEventForLocationTime({ id: eventId, title: eventTitle });
    setLocationTimeModalVisible(true);
  };

  // 🎯 [KIM FIX] Navigate to player profile
  const handlePlayerPress = (playerId: string) => {
    navigation.navigate('UserProfile', { userId: playerId });
  };

  // 🎾 [KIM FIX] Navigate to host profile from match invitation card
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleHostPress = (hostId: string, _hostName: string) => {
    navigation.navigate('UserProfile', { userId: hostId });
  };

  const handleLocationTimeSuccess = () => {
    onRefresh(); // 이벤트 목록 새로고침
  };

  // 🎯 [OPERATION DUO - PHASE 2A] Handle re-invite partner button click
  const handleReinvitePartner = (applicationId: string, eventId: string) => {
    // Find the event to get clubId and gameType
    const event = appliedEvents.find(e => e.id === eventId);
    const application = event?.applications?.find(a => a.id === applicationId);

    if (!event) {
      Alert.alert(t('activityTab.error'), t('activityTab.eventNotFound'));
      return;
    }

    // Extract already participating user IDs (host + approved participants)
    const existingParticipantIds = [
      event.hostId, // Host (use hostId instead of createdBy)
      ...(event.participants?.map(p => p.userId) || []), // Approved participants
    ].filter(Boolean) as string[];

    // Extract gender filter from gameType
    let genderFilter: 'male' | 'female' | null = null;
    const gameTypeLower = event.gameType?.toLowerCase() || '';
    if (gameTypeLower.includes('남자') || gameTypeLower.includes('men')) {
      genderFilter = 'male';
    } else if (gameTypeLower.includes('여자') || gameTypeLower.includes('women')) {
      genderFilter = 'female';
    }

    setSelectedReinviteInfo({
      applicationId,
      eventId,
      clubId: event.clubId || null,
      gameType: event.gameType || null,
      partnerInvitationId: application?.partnerInvitationId || null,
      existingParticipantIds,
      genderFilter,
    });
    setShowPartnerModal(true);
  };

  // 🎯 [OPERATION DUO - PHASE 2A] Handle partner selection from UserSearchModal
  const handlePartnerSelected = async (
    selectedUsers: Array<{ uid: string; displayName: string }>
  ) => {
    if (!selectedReinviteInfo || selectedUsers.length === 0) return;

    // Take the first selected user (partner invitation is 1:1)
    const partner = selectedUsers[0];
    const partnerId = partner.uid;
    const partnerName = partner.displayName;

    try {
      setShowPartnerModal(false);

      await ActivityService.reinviteApplicationPartner(
        selectedReinviteInfo.applicationId,
        selectedReinviteInfo.partnerInvitationId,
        partnerId,
        partnerName
      );

      Alert.alert(t('activityTab.success'), t('activityTab.partnerInviteSuccess', { partnerName }));

      // Refresh data to show updated status
      onRefresh();
      setSelectedReinviteInfo(null);
    } catch (error) {
      console.error('Error reinviting partner:', error);
      Alert.alert(t('activityTab.error'), t('activityTab.partnerInviteError'));
      setSelectedReinviteInfo(null);
    }
  };

  const handleCancelRequest = async (applicationId: string) => {
    Alert.alert(t('activityTab.cancelRequest'), t('activityTab.cancelRequestConfirm'), [
      {
        text: t('activityTab.no'),
        style: 'cancel',
      },
      {
        text: t('activityTab.cancelButton'),
        style: 'destructive',
        onPress: async () => {
          try {
            await ActivityService.cancelApplication(applicationId);
            Alert.alert(t('activityTab.success'), t('activityTab.requestCancelled'));
            onRefresh();
          } catch (error) {
            console.error('Error cancelling request:', error);
            Alert.alert(t('activityTab.error'), t('activityTab.cancelError'));
          }
        },
      },
    ]);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleApproveApplication = async (applicationId: string, _applicantName: string) => {
    if (!currentUser?.uid) return;

    try {
      await ActivityService.approveApplication(applicationId, currentUser.uid);
      onRefresh();
    } catch (error) {
      console.error('Error approving application:', error);
      throw error; // Re-throw so HostedEventCard can handle the error display
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRejectApplication = async (applicationId: string, _applicantName: string) => {
    if (!currentUser?.uid) return;

    try {
      await ActivityService.declineApplication(applicationId, currentUser.uid);
      onRefresh();
    } catch (error) {
      console.error('Error rejecting application:', error);
      throw error; // Re-throw so HostedEventCard can handle the error display
    }
  };

  // Helper function to get application status for event
  const getApplicationStatus = (eventId: string): string | undefined => {
    const event = appliedEvents.find(e => e.id === eventId);
    return event?.myApplication?.status;
  };

  const handleOpenChat = async (eventId: string, eventTitle: string) => {
    try {
      console.log('Opening chat for event:', eventId, eventTitle);

      // Check application status
      const applicationStatus = getApplicationStatus(eventId);

      // If application is still pending, show friendly message
      if (applicationStatus === 'pending') {
        Alert.alert(t('activityTab.chatRoomNotice'), t('activityTab.chatAccessDenied'));
        return;
      }

      // Only navigate if approved (or if status is unknown for hosted events)
      if (applicationStatus === 'approved' || !applicationStatus) {
        // EventChatScreen으로 네비게이션
        navigation.navigate('EventChat', {
          eventId,
          eventTitle,
        });
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert(t('activityTab.error'), t('activityTab.cannotOpenChat'));
    }
  };

  // 🎾 경기 분석 핸들러 - ChatScreen으로 이동하며 자동 분석 실행
  const handleAnalyzeMatch = (eventData: {
    id: string;
    title: string;
    gameType?: string;
    hostId?: string;
    clubId?: string;
    scheduledTime?: Date;
    matchResult?: unknown;
  }) => {
    try {
      console.log(
        '🎾 [ActivityTabContent] Navigating to ChatScreen for match analysis:',
        eventData.title
      );
      navigation.navigate('ChatScreen', {
        autoAnalyzeEvent: eventData,
      });
    } catch (error) {
      console.error('Error navigating to ChatScreen:', error);
      Alert.alert(t('activityTab.error'), t('activityTab.cannotOpenChat'));
    }
  };

  const handleEditEvent = (eventId: string) => {
    try {
      console.log('Editing event:', eventId);

      // Navigate to EditEvent screen
      navigation.navigate('EditEvent', { eventId });
    } catch (error) {
      console.error('Error navigating to edit event:', error);
      Alert.alert(t('activityTab.error'), t('activityTab.cannotEditEvent'));
    }
  };

  const handleCancelEvent = async (event: EventWithParticipation) => {
    Alert.alert(
      t('activityTab.cancelEvent'),
      t('activityTab.cancelEventConfirm', { eventTitle: event.title }),
      [
        {
          text: t('activityTab.no'),
          style: 'cancel',
        },
        {
          text: t('activityTab.cancelEventButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Cancelling event:', event.id, event.title);

              // Call ActivityService to cancel event
              if (!currentUser?.uid) {
                throw new Error('User not authenticated');
              }
              await ActivityService.cancelEvent(event.id, currentUser.uid);

              Alert.alert(t('activityTab.success'), t('activityTab.eventCancelled'));
              onRefresh();
            } catch (error) {
              console.error('Error cancelling event:', error);
              Alert.alert(t('activityTab.error'), t('activityTab.cancelEventError'));
            }
          },
        },
      ]
    );
  };

  const handleCancelMyParticipation = async (applicationId: string, eventTitle: string) => {
    if (!currentUser?.uid) return;

    Alert.alert(
      t('activityTab.cancelParticipation'),
      t('activityTab.cancelParticipationConfirm', { eventTitle }),
      [
        {
          text: t('activityTab.no'),
          style: 'cancel',
        },
        {
          text: t('activityTab.cancelParticipationButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              await ActivityService.cancelMyParticipation(applicationId, currentUser.uid);
              Alert.alert(t('activityTab.success'), t('activityTab.participationCancelled'));
              onRefresh();
            } catch (error) {
              console.error('Error cancelling my participation:', error);
              Alert.alert(t('activityTab.error'), t('activityTab.cancelParticipationError'));
            }
          },
        },
      ]
    );
  };

  const convertToEventCardType = (event: EventWithParticipation, isHosted: boolean = false) => {
    // 🛡️ Operation: Quarantine Expansion - Enhanced data conversion with safety checks

    // 🛡️ Safe date extraction with fallback protection
    const safeScheduledTime = safeToDate(event.scheduledTime) || new Date();

    // 🎯 [KIM FIX] Calculate participants based on game type and approved applications
    // For doubles: host team (2) + approved guest team (2) = 4
    // For singles: host (1) + approved guest (1) = 2
    const participants = (() => {
      const maxParticipants = event.maxParticipants || 4;
      const isDoublesMatch = maxParticipants >= 4;

      // 🎯 [KIM FIX v3] Check for GUEST TEAM approval (not partner_invitation)
      // partner_invitation = host's partner accepting invitation (NOT guest team)
      // team application = guest team applying (what we want to detect)
      const approvedGuestTeam =
        Array.isArray(event.approvedApplications) &&
        event.approvedApplications.find(app => app.status === 'approved');

      const hasApprovedGuestTeam = !!approvedGuestTeam;

      // 🔍 DEBUG: Log all participant count sources
      console.log('🔍 [PARTICIPANT_COUNT_DEBUG_v3]', {
        eventId: event.id,
        eventTitle: event.title,
        currentParticipants: event.currentParticipants,
        maxParticipants,
        isDoublesMatch,
        hasApprovedGuestTeam,
        approvedGuestTeam: approvedGuestTeam
          ? {
              applicantName: approvedGuestTeam.applicantName,
              partnerName: approvedGuestTeam.partnerName,
              status: approvedGuestTeam.status,
            }
          : null,
        allApprovedApplications: event.approvedApplications?.map(app => ({
          applicantName: app.applicantName,
          status: app.status,
        })),
        isHosted,
      });

      // 🎯 [KIM FIX v3] Calculate based on game state - ignore Firestore currentParticipants
      // because it's often stale (subscriptions don't detect event document changes)
      const hostTeamSize = isDoublesMatch ? 2 : 1;

      if (hasApprovedGuestTeam) {
        // Guest team approved → match is full
        const guestTeamSize = isDoublesMatch ? 2 : 1;
        const total = hostTeamSize + guestTeamSize;
        console.log('✅ [PARTICIPANT_COUNT_v3] Calculated (has approved guest):', total);
        return total;
      }

      // No approved guest team yet → only host team
      console.log('✅ [PARTICIPANT_COUNT_v3] Calculated (host only):', hostTeamSize);
      return hostTeamSize;
    })();

    // 🛡️ Safe location processing using unified utility
    const safeLocationString = safeLocation(event.location);

    // 🛡️ Safe time formatting with error handling
    const safeTimeString = (() => {
      try {
        return safeScheduledTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } catch (error) {
        console.warn('⚠️ [ActivityTabContent] Time formatting error:', error);
        return 'TBD';
      }
    })();

    // 🎯 [KIM FIX] Infer correct type from gameType if type is incorrect
    // gameType is more reliable than type field (which can be incorrectly set during event creation)
    const inferredType = (() => {
      const gameType = event.gameType?.toLowerCase();

      // Match types: singles/doubles games
      if (gameType?.includes('singles') || gameType?.includes('doubles')) {
        return 'match';
      }

      // Meetup types: rally, practice sessions
      if (gameType === 'rally') {
        return 'meetup';
      }

      // Fallback to original type
      return event.type;
    })();

    // 🛡️ Safe type validation using unified utility
    const eventType = safeEventType(inferredType);

    return {
      id: safeString(event.id) || `fallback_${Date.now()}`,
      title: safeString(event.title, 'Untitled Event'),
      clubName: safeString(
        (event as unknown as { clubName?: string }).clubName,
        eventType === 'meetup' ? 'Practice & Social' : 'Public Match'
      ),
      date: safeScheduledTime,
      time: safeTimeString,
      location: safeLocationString,
      distance:
        typeof (event as unknown as { distance?: number }).distance === 'number'
          ? (event as unknown as { distance: number }).distance
          : null,
      participants,
      currentParticipants: event.currentParticipants, // 🔥 [KIM FIX] Pass currentParticipants from Firestore
      maxParticipants: Math.max(1, safeNumber(event.maxParticipants, 2)), // Ensure minimum capacity
      skillLevel: (() => {
        // 🔍 SIMPLE TEST: Verify this code is running
        console.log('🔍 TEST: ActivityTabContent processing skillLevel for event:', event.title);

        // 🔍 ENHANCED DEBUG: ActivityTabContent skill level analysis
        const eventRecord = event as unknown as Record<string, unknown>;
        console.log('🔍 [ACTIVITY TAB DEBUG] Event Skill Level Analysis:', {
          eventTitle: event.title,
          eventId: event.id,
          originalSkillLevel: eventRecord.skillLevel,
          skillLevelType: typeof eventRecord.skillLevel,
          allEventFields: Object.keys(event),
          // Check for alternative skill level fields
          alternativeFields: {
            minSkillLevel: eventRecord.minSkillLevel,
            maxSkillLevel: eventRecord.maxSkillLevel,
            requiredSkillLevel: eventRecord.requiredSkillLevel,
            hostSkillLevel: eventRecord.hostSkillLevel,
            preferencesSkillLevel: (eventRecord.preferences as { skillLevel?: string })?.skillLevel,
            creatorSkillLevel: eventRecord.creatorSkillLevel,
          },
          isTargetEvent:
            event.title &&
            (event.title.includes('번개13') ||
              event.title.includes('번개') ||
              event.title.includes('13')),
          dataSource: 'ActivityTabContent',
        });

        // 🔍 Priority: Use ltrLevel as primary skill level source
        return safeSkillLevel(
          eventRecord.ltrLevel || event.ltrLevel,
          event as unknown as Record<string, unknown>
        );
      })(),
      type: eventType,
      description: safeString(event.description),
      hostId: safeString(event.hostId), // 🎯 작전명 카멜레온 버튼: 호스트 ID 추가
      status: event.status, // 🛡️ Quarantine Expansion: Pass status field for completion detection
      gameType: event.gameType, // 🎯 Pass gameType for partner invitation logic
      matchResult: (() => {
        const eventRecord = event as unknown as Record<string, unknown>;
        console.log('🔍 [MATCH RESULT DEBUG] Converting matchResult for event:', {
          eventId: event.id,
          eventTitle: event.title,
          hasMatchResult: !!event.matchResult,
          matchResult: event.matchResult,
          matchResultType: typeof event.matchResult,
          hasScore: !!eventRecord.score,
          score: eventRecord.score,
          scoreType: typeof eventRecord.score,
        });
        return event.matchResult || null;
      })(), // 🏆 매치 결과 데이터 전달 with null fallback
      hostName: event.hostName, // 🏆 Player names for match result display
      hostLtrLevel: (event as unknown as { hostLtrLevel?: number }).hostLtrLevel, // 🎯 [KIM FIX] Host's actual NTRP level
      applicantName: (event as unknown as { applicantName?: string }).applicantName, // 🏆 Player names for match result display
      // 🌤️ [KIM FIX] Pass coordinates and placeDetails for weather display
      coordinates: (event as unknown as { coordinates?: { lat: number; lng: number } }).coordinates,
      placeDetails: event.placeDetails,
      locationDetails: (event as unknown as { locationDetails?: string }).locationDetails,
    };
  };

  // ✅ 표준 EventCard 사용으로 데이터 파이프라인 통합
  const renderEventCard = (
    event: EventWithParticipation,
    isHosted: boolean = false,
    uniqueKey?: string,
    handleReinvite?: (eventId: string, gameType?: string) => void
  ) => {
    const convertedEvent = convertToEventCardType(event, isHosted);

    // Get application info for applied events
    const application = event.myApplication;

    // 🔍 DEBUG: ActivityTabContent에서 prop 전달 확인
    console.log('🔍 [ACTIVITY_TAB_DEBUG] Passing props to EventCard:', {
      eventId: event.id,
      eventTitle: event.title,
      isHosted,
      onRecordScoreProp: isHosted ? 'function provided' : 'undefined',
      onCancelProp: isHosted ? 'function provided' : 'undefined',
      // 🎯 [KIM DEBUG] Team information (host + partner)
      eventHostName: event.hostName,
      eventHostPartnerName: event.hostPartnerName,
      convertedHostName: convertedEvent.hostName,
      // 🎯 [KIM DEBUG] Partner information
      eventPartnerName: event.partnerName,
      eventPartnerStatus: event.partnerStatus,
      applicationPartnerName: application?.partnerName,
      applicationPartnerStatus: application?.partnerStatus,
      myApplicationExists: !!event.myApplication,
    });

    return (
      <View key={uniqueKey || event.id} style={{ marginBottom: 12 }}>
        {isHosted ? (
          // Use HostedEventCard for hosted events (includes pending applications inside!)
          <HostedEventCard
            event={
              {
                ...convertedEvent,
                pendingApplications: event.pendingApplications?.map(
                  app =>
                    ({
                      id: app.id,
                      applicantName: app.applicantName,
                      applicantId: app.applicantId,
                      message: app.message,
                      // 🎯 [KIM FIX] Include teamId and partnerId to filter team applications
                      teamId: app.teamId,
                      partnerId: app.partnerId,
                      partnerName: app.partnerName,
                      appliedAt:
                        app.appliedAt instanceof Date
                          ? app.appliedAt
                          : typeof app.appliedAt === 'object' && 'seconds' in app.appliedAt
                            ? new Date((app.appliedAt as { seconds: number }).seconds * 1000)
                            : new Date(app.appliedAt as string),
                    }) as PendingApplication
                ),
                approvedApplications: event.approvedApplications?.map(
                  app =>
                    ({
                      id: app.id,
                      applicantName: app.applicantName,
                      applicantId: app.applicantId,
                      partnerId: app.partnerId,
                      partnerName: app.partnerName,
                      teamId: app.teamId,
                      message: app.message,
                      appliedAt:
                        app.appliedAt instanceof Date
                          ? app.appliedAt
                          : typeof app.appliedAt === 'object' && 'seconds' in app.appliedAt
                            ? new Date((app.appliedAt as { seconds: number }).seconds * 1000)
                            : new Date(app.appliedAt as string),
                    }) as ApprovedApplication
                ),
                chatUnreadCount: event.chatUnreadCount,
                // 🛡️ [CAPTAIN AMERICA] Partner rejection fields
                partnerStatus: event.partnerStatus,
                partnerAccepted: event.partnerAccepted,
                lastRejectedPartnerName: event.lastRejectedPartnerName,
                hostPartnerId: event.hostPartnerId,
                hostPartnerName: event.hostPartnerName,
              } as HostedEvent
            }
            // 🔍 DEBUG: Check what's being passed
            {...(() => {
              console.log('🔍 [ActivityTabContent] Passing to HostedEventCard:', {
                eventId: event.id,
                eventTitle: event.title,
                partnerStatus: event.partnerStatus,
                lastRejectedPartnerName: event.lastRejectedPartnerName,
                hostPartnerName: event.hostPartnerName,
                partnerAccepted: event.partnerAccepted,
              });
              return {};
            })()}
            currentUserId={currentUser?.uid}
            onEditEvent={() => handleEditEvent(event.id)}
            onCancelEvent={() => handleCancelEvent(event)}
            onOpenChat={() => handleOpenChat(event.id, event.title)}
            onApproveApplication={handleApproveApplication}
            onRejectApplication={handleRejectApplication}
            onReinvite={handleReinvite || (() => {})}
            onSetLocationTime={handleSetLocationTime}
            onRefresh={onRefresh}
            onPlayerPress={handlePlayerPress}
            style={{ marginHorizontal: 0 }}
          />
        ) : (
          // Use AppliedEventCard for applied events
          <AppliedEventCard
            event={
              {
                ...convertedEvent,
                // Map EventStatus to AppliedEvent status type
                status: (() => {
                  const status = convertedEvent.status;
                  if (
                    status === 'upcoming' ||
                    status === 'active' ||
                    status === 'completed' ||
                    status === 'cancelled'
                  ) {
                    return status;
                  }
                  return 'upcoming'; // Default for partner_pending
                })(),
                applicationStatus: (() => {
                  const status = application?.status;
                  // Map ParticipationStatus to AppliedEvent applicationStatus
                  if (
                    status === 'pending' ||
                    status === 'approved' ||
                    status === 'rejected' ||
                    status === 'pending_partner_approval' ||
                    status === 'looking_for_partner' ||
                    status === 'closed'
                  ) {
                    return status;
                  }
                  return undefined;
                })(),
                applicationId: application?.id,
                chatUnreadCount: event.chatUnreadCount,
                // 🎯 [KIM FIX] Host team info (호스트팀)
                hostId: event.hostId,
                // hostName is already in convertedEvent from conversion function (line 543)
                hostPartnerId: event.hostPartnerId,
                hostPartnerName: event.hostPartnerName,
                // 🎯 [KIM FIX] Challenger team info (도전팀)
                applicantId: application?.applicantId,
                applicantName: application?.applicantName,
                partnerId: application?.partnerId,
                // 🆕 [KIM FIX] Use application's partnerName first (source of truth for applicant's partner)
                partnerName: application?.partnerName || event.partnerName,
                // 🆕 [KIM FIX] Use application's partnerStatus first (source of truth for applicant's partner status)
                partnerStatus: (() => {
                  const status = application?.partnerStatus || event.partnerStatus;
                  if (status === 'pending' || status === 'accepted' || status === 'rejected') {
                    return status as 'pending' | 'accepted' | 'rejected';
                  }
                  return undefined;
                })(),
                partnerInvitationId:
                  (event as unknown as { partnerInvitationId?: string }).partnerInvitationId ||
                  application?.partnerInvitationId,
                // 🎯 [KIM FIX] Approved applications (for host team to see opponent)
                approvedApplications: event.approvedApplications,
              } as import('../cards/AppliedEventCard').AppliedEvent
            }
            currentUserId={currentUser?.uid}
            onCancelApplication={(applicationId, eventTitle) => {
              // 🆕 [KIM] Handle all cancel-able statuses
              if (
                application?.status === 'pending' ||
                application?.status === 'pending_partner_approval' ||
                application?.status === 'looking_for_partner' // 🎯 [KIM FIX] Solo lobby status
              ) {
                handleCancelRequest(applicationId);
              } else if (application?.status === 'approved') {
                handleCancelMyParticipation(applicationId, eventTitle);
              }
            }}
            onOpenChat={() => handleOpenChat(event.id, event.title)}
            onReinvitePartner={handleReinvitePartner}
            style={{ marginHorizontal: 0 }}
          />
        )}
      </View>
    );
  };

  // Calculate total pending applicants for hosted events
  const totalPendingApplicants = hostedEvents.reduce(
    (sum, event) => sum + (event.pendingApplications?.length || 0),
    0
  );

  // 🎯 [KIM FIX] Calculate pending partner invitations for applied events
  // These are invitations where I'm waiting for partner's response
  const pendingPartnerInvitationsCount = partnerInvitations.filter(
    inv => inv.status === 'pending'
  ).length;

  // 🎯 [KIM FIX] Calculate pending friend invitations waiting for my response
  const pendingFriendInvitationsCount = friendInvitations.filter(
    inv => inv.status === 'pending'
  ).length;

  // 🎯 [SOLO LOBBY] Calculate pending team proposals I received from other solo applicants
  const pendingTeamProposalsCount = appliedEvents.filter(event => {
    if (event.myApplication?.status !== 'looking_for_partner') return false;
    // Check if there's a pending proposal on this application
    const app = event.myApplication as { pendingProposalFrom?: string };
    return !!app.pendingProposalFrom;
  }).length;

  // Total pending items for applied tab (partner invitations I sent + friend invitations I received + team proposals)
  const totalPendingAppliedItems =
    pendingPartnerInvitationsCount + pendingFriendInvitationsCount + pendingTeamProposalsCount;

  // 🎯 [KIM FIX] Calculate total unread chat count for hosted events (for red badge)
  const totalHostedUnreadChat = hostedEvents.reduce((sum, event) => {
    const userId = currentUser?.uid;
    if (!userId || !event.chatUnreadCount) return sum;
    const unread = event.chatUnreadCount[userId] || 0;
    return sum + unread;
  }, 0);

  // 🎯 [KIM FIX] Calculate total unread chat count for applied events (for red badge)
  const totalAppliedUnreadChat = appliedEvents.reduce((sum, event) => {
    const userId = currentUser?.uid;
    if (!userId || !event.chatUnreadCount) return sum;
    const unread = event.chatUnreadCount[userId] || 0;
    return sum + unread;
  }, 0);

  // 🎯 [KIM FIX] Calculate total unread chat count for past events (for red badge)
  const totalPastUnreadChat = pastEvents.reduce((sum, event) => {
    const userId = currentUser?.uid;
    if (!userId || !event.chatUnreadCount) return sum;
    const unread = event.chatUnreadCount[userId] || 0;
    return sum + unread;
  }, 0);

  // 🚀 [PERFORMANCE] Memoize tab counts to prevent lag
  const tabs = useMemo(() => {
    // 🎯 [KIM FIX] Helper to check if application should be hidden
    // Must match AppliedEventsSection.tsx filtering logic for consistency!
    const shouldHideApplication = (event: EventWithParticipation): boolean => {
      const status = event.myApplication?.status;
      const partnerStatus = event.myApplication?.partnerStatus;

      // 💥 Immediately hide all negative statuses (matching AppliedEventsSection.tsx lines 76-91)
      if (
        status === 'cancelled_by_user' ||
        status === 'cancelled_by_host' ||
        status === 'cancelled' ||
        status === 'declined' ||
        status === 'rejected' ||
        status === 'closed'
      ) {
        return true;
      }

      // 🎯 [KIM FIX] Hide applications where partner rejected the invitation
      if (partnerStatus === 'rejected') {
        return true;
      }

      return false;
    };

    return [
      {
        key: 'applied' as const,
        label: t('activityTab.appliedTab'),
        count: appliedEvents.filter(event => !shouldHideApplication(event)).length,
      },
      {
        key: 'hosted' as const,
        label: t('activityTab.hostedTab'),
        count: hostedEvents.filter(event => event.status !== 'cancelled').length, // ✅ Filter cancelled events
      },
      {
        key: 'past' as const,
        label: t('activityTab.pastTab'),
        count: pastEvents.length,
      },
    ];
  }, [t, appliedEvents, hostedEvents, pastEvents]);

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
              <Text style={[styles.tabCount, activeTab === tab.key && styles.activeTabCount]}>
                ({tab.count})
              </Text>
              {/* 🎯 [KIM FIX] Dual badges for applied tab - Yellow (pending invitations) + Red (unread chat) */}
              {tab.key === 'applied' &&
                (totalPendingAppliedItems > 0 || totalAppliedUnreadChat > 0) && (
                  <View style={{ flexDirection: 'row', marginLeft: 8, gap: 2 }}>
                    {/* 🟡 Yellow badge - pending invitations to respond */}
                    {totalPendingAppliedItems > 0 && (
                      <Badge
                        size={18}
                        style={{
                          backgroundColor: '#F59E0B', // Yellow/Amber
                          color: '#FFFFFF', // 🎯 White text for visibility
                        }}
                      >
                        {totalPendingAppliedItems}
                      </Badge>
                    )}
                    {/* 🔴 Red badge - unread chat messages */}
                    {totalAppliedUnreadChat > 0 && (
                      <Badge
                        size={18}
                        style={{
                          backgroundColor: '#EF4444', // Red
                          color: '#FFFFFF', // 🎯 White text for visibility
                        }}
                      >
                        {totalAppliedUnreadChat}
                      </Badge>
                    )}
                  </View>
                )}
              {/* 🎯 [KIM FIX] Dual badges for hosted tab - Yellow (pending) + Red (unread chat) */}
              {tab.key === 'hosted' &&
                (totalPendingApplicants > 0 || totalHostedUnreadChat > 0) && (
                  <View style={{ flexDirection: 'row', marginLeft: 8, gap: 2 }}>
                    {/* 🟡 Yellow badge - pending applicants */}
                    {totalPendingApplicants > 0 && (
                      <Badge
                        size={18}
                        style={{
                          backgroundColor: '#F59E0B', // Yellow/Amber
                          color: '#FFFFFF', // 🎯 White text for visibility
                        }}
                      >
                        {totalPendingApplicants}
                      </Badge>
                    )}
                    {/* 🔴 Red badge - unread chat messages */}
                    {totalHostedUnreadChat > 0 && (
                      <Badge
                        size={18}
                        style={{
                          backgroundColor: '#EF4444', // Red
                          color: '#FFFFFF', // 🎯 White text for visibility
                        }}
                      >
                        {totalHostedUnreadChat}
                      </Badge>
                    )}
                  </View>
                )}
              {/* 🎯 [KIM FIX] Red badge for past tab - unread chat messages only */}
              {tab.key === 'past' && totalPastUnreadChat > 0 && (
                <View style={{ flexDirection: 'row', marginLeft: 8, gap: 2 }}>
                  {/* 🔴 Red badge - unread chat messages */}
                  <Badge
                    size={18}
                    style={{
                      backgroundColor: '#EF4444', // Red
                      color: '#FFFFFF', // 🎯 White text for visibility
                    }}
                  >
                    {totalPastUnreadChat}
                  </Badge>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary} />
          <Text style={styles.loadingText}>{t('activityTab.loadingActivities')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'applied' && (
            <AppliedEventsSection
              currentLanguage={currentLanguage}
              appliedEvents={appliedEvents}
              partnerInvitations={partnerInvitations}
              friendInvitations={friendInvitations}
              onAcceptFriendInvitation={onAcceptFriendInvitation}
              onRejectFriendInvitation={onRejectFriendInvitation}
              onHostPress={handleHostPress} // 🎾 [KIM FIX] Navigate to host profile from match invitation
              onAcceptInvitation={onAcceptInvitation}
              onRejectInvitation={onRejectInvitation}
              onReAcceptInvitation={onReAcceptInvitation}
              loading={loading}
              onRefresh={onRefresh}
              renderEventCard={renderEventCard}
            />
          )}
          {activeTab === 'hosted' && (
            <HostedEventsSection
              hostedEvents={hostedEvents}
              loading={loading}
              onRefresh={onRefresh}
              renderEventCard={renderEventCard}
            />
          )}
          {activeTab === 'past' && (
            <PastEventsSection
              currentLanguage={currentLanguage}
              pastEvents={pastEvents}
              loading={loading}
              onRefresh={onRefresh}
              onOpenChat={handleOpenChat}
              onAnalyzeMatch={handleAnalyzeMatch} // 🎾 경기 분석
            />
          )}
        </ScrollView>
      )}

      {/* 🎯 [OPERATION DUO - PHASE 2A] Partner Selection Modal for Re-invite */}
      {showPartnerModal && selectedReinviteInfo && (
        <UserSearchModal
          visible={showPartnerModal}
          onClose={() => {
            setShowPartnerModal(false);
            setSelectedReinviteInfo(null);
          }}
          onUserSelect={handlePartnerSelected}
          excludeUserIds={[
            ...(currentUser?.uid ? [currentUser.uid] : []), // Current user (영수)
            ...(selectedReinviteInfo.existingParticipantIds || []), // Host + participants (회장, 철수)
          ]}
          clubId={selectedReinviteInfo.clubId || undefined}
          genderFilter={selectedReinviteInfo.genderFilter || null}
        />
      )}

      {/* ⚡ Quick Match Location/Time Modal */}
      <SetLocationTimeModal
        visible={locationTimeModalVisible}
        onClose={() => setLocationTimeModalVisible(false)}
        eventId={selectedEventForLocationTime?.id || ''}
        eventTitle={selectedEventForLocationTime?.title || ''}
        onSuccess={handleLocationTimeSuccess}
      />
    </View>
  );
};

const createStyles = (colors: { [key: string]: string }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    tabNavigation: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.outline,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.primary,
      backgroundColor: 'rgba(66, 165, 245, 0.15)', // ✨ Darker blue-tinted background for better contrast
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF', // ✨ Direct white color for maximum visibility in dark mode
      textAlign: 'center',
      opacity: 0.7, // ✨ Slightly dimmed for inactive tabs
    },
    activeTabText: {
      color: '#64B5F6', // ✨ Brighter blue for better contrast against dark background
      opacity: 1, // ✨ Full opacity for active tab
    },
    tabCount: {
      fontSize: 11,
      color: '#FFFFFF', // ✨ Direct white color for maximum visibility
      marginTop: 2,
      opacity: 0.9, // ✨ Increased from 0.85 to 0.9 for better visibility
    },
    activeTabCount: {
      color: colors.primary,
      opacity: 1, // ✨ Full opacity for active tab count
    },
    scrollContent: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
  });

export default ActivityTabContent;
