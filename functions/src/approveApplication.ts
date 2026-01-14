/**
 * Cloud Function for handling application approvals
 * Sends push notifications and manages participant data
 *
 * 🔄 [HEIMDALL] Migrated to Firebase Functions v2 API
 */

// ✅ [v2] Updated imports
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { getApplicationApprovalNotification } from './utils/notificationSender';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

export interface ApprovalRequest {
  applicationId: string;
  hostId?: string; // Optional - for backwards compatibility, not used in logic
  eventId: string;
  applicantId: string;
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Internal function to handle application approval logic
 * Can be called from both onCall handlers and triggers
 */
export async function approveApplicationLogic(
  data: ApprovalRequest,
  authUid: string
): Promise<{
  success: boolean;
  message: string;
  data: {
    applicationId: string;
    chatRoomId: string;
    approvedAt: string;
  };
}> {
  const { applicationId, eventId, applicantId } = data;

  // Note: We'll verify authUid against event ownership after fetching the event

  // Start a batch write
  const batch = db.batch();

  // Get application document
  const applicationRef = db.collection('participation_applications').doc(applicationId);
  const applicationDoc = await applicationRef.get();

  if (!applicationDoc.exists) {
    throw new HttpsError('not-found', 'Application not found');
  }

  const applicationData = applicationDoc.data();
  if (!applicationData) {
    throw new HttpsError('internal', 'Invalid application data');
  }

  // ✅ [TEAM FIX] 파트너 정보 확인
  const partnerId = applicationData?.partnerId;
  const isTeamApplication = !!partnerId && applicationData?.partnerStatus === 'accepted';

  logger.info('📊 [TEAM] Application type check:', {
    applicationId,
    isTeamApplication,
    partnerId,
    partnerStatus: applicationData?.partnerStatus,
  });

  // Note: Application status is managed both client-side (activityService) and server-side
  // This Cloud Function handles: league.participants, notifications, AND closing remaining solo applications

  // Try to find event in multiple collections (leagues, tournaments, lightning_events)
  let eventRef = db.collection('leagues').doc(eventId);
  let eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    // Try tournaments collection
    eventRef = db.collection('tournaments').doc(eventId);
    eventDoc = await eventRef.get();
  }

  if (!eventDoc.exists) {
    // Try lightning_events collection
    eventRef = db.collection('lightning_events').doc(eventId);
    eventDoc = await eventRef.get();
  }

  if (!eventDoc.exists) {
    // Try events collection
    eventRef = db.collection('events').doc(eventId);
    eventDoc = await eventRef.get();
  }

  if (!eventDoc.exists) {
    throw new HttpsError('not-found', 'Event not found in any collection');
  }

  const eventData = eventDoc.data();
  if (!eventData) {
    throw new HttpsError('internal', 'Invalid event data');
  }

  // 🔍 [DEBUG] Log event data for troubleshooting
  logger.info('📊 [DEBUG] Event data retrieved:', {
    eventId,
    hasTitle: !!eventData.title,
    hasName: !!eventData.name,
    title: eventData.title,
    name: eventData.name,
    allFields: Object.keys(eventData),
  });

  // 🔐 [SECURITY] Verify event ownership
  // Check if the authenticated user is actually the owner of this event
  const isEventHost =
    eventData.createdBy === authUid || // leagues, tournaments
    eventData.organizerId === authUid || // leagues, tournaments (alternative field)
    eventData.hostId === authUid || // lightning_events
    eventData.host === authUid; // lightning_events (alternative field)

  if (!isEventHost) {
    logger.warn('🚨 [SECURITY] Unauthorized approval attempt:', {
      authUid,
      eventId,
      eventCreatedBy: eventData.createdBy,
      eventOrganizerId: eventData.organizerId,
      eventHostId: eventData.hostId,
    });
    throw new HttpsError(
      'permission-denied',
      'You are not the host of this event. Only the event host can approve applications.'
    );
  }

  // Get applicant's user profile for participant name
  let applicantName = 'Unknown User';
  try {
    const userDoc = await db.collection('users').doc(applicantId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      applicantName =
        userData?.profile?.displayName ||
        userData?.profile?.nickname ||
        userData?.displayName ||
        userData?.nickname ||
        `User ${applicantId.slice(-4)}`;
    }
  } catch (error) {
    logger.warn('Failed to fetch applicant user profile:', error);
  }

  // Add participant to event participants array
  // Use LeagueParticipant format for proper name display
  const participantData = {
    playerId: applicantId,
    playerName: applicantName,
  };

  // 🔧 [FIX] 팀 신청이 아닌 경우에만 여기서 participants 추가
  // 팀 신청인 경우 아래에서 신청자+파트너를 함께 추가 (batch write 충돌 방지)
  if (!isTeamApplication) {
    batch.update(eventRef, {
      participants: admin.firestore.FieldValue.arrayUnion(participantData),
    });
  }

  logger.info('📊 [DEBUG] Adding participant:', {
    applicantId,
    applicantName,
    participantData,
    isTeamApplication,
  });

  // Create notification document
  const notificationRef = db.collection('activity_notifications').doc();

  // Get event title/name - different field names for different event types
  const eventTitle = eventData.title || eventData.name || '이벤트';

  // 🎯 [KIM FIX] "매치" vs "모임" 구분 - gameType이 있으면 번개 매치, 없으면 모임
  const isLightningMatch = !!eventData.gameType;
  const eventTypeLabel = isLightningMatch ? '매치' : '모임';

  logger.info('📊 [DEBUG] Event title resolved:', {
    eventTitle,
    titleExists: !!eventData.title,
    nameExists: !!eventData.name,
    gameType: eventData.gameType,
    eventTypeLabel,
  });

  // 🎯 [KIM FIX] Use translation keys for i18n
  batch.set(notificationRef, {
    userId: applicantId,
    type: 'application_approved',
    title: 'notification.applicationApprovedTitle',
    message: 'notification.applicationApproved',
    data: {
      eventId: eventId,
      applicationId: applicationId,
      eventTitle: eventTitle,
      eventLocation: eventData.location || '',
      scheduledTime: eventData.scheduledTime || eventData.startDate || null,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 🎯 [KIM] Create feed item for applicant (visible only to them)
  const applicantFeedRef = db.collection('feed').doc();
  const applicantFeedData = {
    type: 'application_approved',
    actorId: eventData.hostId || authUid, // Host who approved
    actorName: '', // Will be filled by client if needed
    targetId: applicantId,
    targetName: applicantName,
    eventId: eventId,
    content: 'feed.applicationApproved',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(), // 🎯 [KIM FIX] Feed 쿼리가 createdAt으로 정렬하므로 필수!
    isActive: true,
    visibility: 'private',
    visibleTo: [applicantId], // 🔒 Only the applicant can see this
    metadata: {
      eventTitle: eventTitle,
      eventLocation: eventData.location || '',
      scheduledTime: eventData.scheduledTime || eventData.startDate || null,
      applicationId: applicationId,
      isTeamApplication: isTeamApplication,
    },
  };
  batch.set(applicantFeedRef, applicantFeedData);

  logger.info('📊 [FEED] Created approval feed item for applicant:', {
    feedId: applicantFeedRef.id,
    applicantId,
    type: 'application_approved',
    visibleTo: [applicantId],
  });

  // ✅ [TEAM FIX] 팀 신청인 경우 파트너도 처리
  let partnerName = 'Unknown Partner';
  if (isTeamApplication && partnerId) {
    // 1. 파트너 application 찾기 (같은 eventId, partnerId가 applicantId인 문서)
    const partnerAppQuery = await db
      .collection('participation_applications')
      .where('eventId', '==', eventId)
      .where('applicantId', '==', partnerId)
      .limit(1)
      .get();

    if (!partnerAppQuery.empty) {
      const partnerAppRef = partnerAppQuery.docs[0].ref;

      // 2. 파트너 application 상태 업데이트
      batch.update(partnerAppRef, {
        status: 'approved',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: authUid,
        // 🎯 [KIM FIX] 신청자 이름 저장 (팀원 간 상호 참조용)
        partnerName: applicantName,
      });

      logger.info('📊 [TEAM] Partner application updated:', {
        partnerAppId: partnerAppQuery.docs[0].id,
      });
    }

    // 3. 파트너 user 정보 가져오기
    try {
      const partnerUserDoc = await db.collection('users').doc(partnerId).get();
      if (partnerUserDoc.exists) {
        const partnerUserData = partnerUserDoc.data();
        partnerName =
          partnerUserData?.profile?.displayName ||
          partnerUserData?.profile?.nickname ||
          partnerUserData?.displayName ||
          `User ${partnerId.slice(-4)}`;
      }
    } catch (error) {
      logger.warn('Failed to fetch partner user profile:', error);
    }

    // 🎯 [KIM FIX] 신청자 application에 partnerName 저장 (호스트가 조회 시 필요)
    // approvedApplications에서 partnerName을 읽어오므로 여기서 확실히 저장
    batch.update(applicationRef, {
      status: 'approved',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: authUid,
      partnerName: partnerName, // 🎯 파트너 이름 저장!
    });

    logger.info('📊 [TEAM] Updated applicant application with partnerName:', {
      applicationId,
      partnerName,
    });

    // 4. 🔧 [FIX] 신청자 + 파트너를 함께 participants에 추가
    // 같은 document의 같은 필드에 대해 여러 batch.update를 호출하면 마지막 것만 적용됨
    // 따라서 하나의 arrayUnion에 두 명 모두 추가
    const partnerParticipantData = {
      playerId: partnerId,
      playerName: partnerName,
    };
    batch.update(eventRef, {
      participants: admin.firestore.FieldValue.arrayUnion(participantData, partnerParticipantData),
    });

    logger.info('📊 [TEAM] Adding both participants together:', {
      applicant: participantData,
      partner: partnerParticipantData,
    });

    // 5. 파트너 알림 생성
    const partnerNotificationRef = db.collection('activity_notifications').doc();
    // 🎯 [KIM FIX] Use translation keys for i18n
    batch.set(partnerNotificationRef, {
      userId: partnerId,
      type: 'application_approved',
      title: 'notification.applicationApprovedTitle',
      message: 'notification.applicationApprovedTeam',
      data: {
        eventId: eventId,
        applicationId: applicationId,
        eventTitle: eventTitle,
        eventLocation: eventData.location || '',
        scheduledTime: eventData.scheduledTime || eventData.startDate || null,
        isTeamApproval: true,
        teamPartnerId: applicantId,
      },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 🎯 [KIM] Create feed item for partner (visible only to them)
    const partnerFeedRef = db.collection('feed').doc();
    const partnerFeedData = {
      type: 'application_approved',
      actorId: eventData.hostId || authUid, // Host who approved
      actorName: '', // Will be filled by client if needed
      targetId: partnerId,
      targetName: partnerName,
      eventId: eventId,
      content: 'feed.applicationApprovedTeam',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // 🎯 [KIM FIX] Feed 쿼리가 createdAt으로 정렬하므로 필수!
      isActive: true,
      visibility: 'private',
      visibleTo: [partnerId], // 🔒 Only the partner can see this
      metadata: {
        eventTitle: eventTitle,
        eventLocation: eventData.location || '',
        scheduledTime: eventData.scheduledTime || eventData.startDate || null,
        applicationId: applicationId,
        isTeamApplication: true,
        teamPartnerId: applicantId,
        teamPartnerName: applicantName,
      },
    };
    batch.set(partnerFeedRef, partnerFeedData);

    logger.info('📊 [FEED] Created approval feed item for partner:', {
      feedId: partnerFeedRef.id,
      partnerId,
      partnerName,
      type: 'application_approved',
      visibleTo: [partnerId],
    });

    logger.info('📊 [TEAM] Partner processed:', {
      partnerId,
      partnerName,
    });
  }

  // 🎯 [KIM FIX] Create feed item for HOST PARTNER (회장) - they should also know about approved guests
  const hostPartnerId = eventData.hostPartnerId;
  const hostPartnerName = eventData.hostPartnerName || '';

  if (hostPartnerId) {
    // Create notification for host partner
    const hostPartnerNotificationRef = db.collection('activity_notifications').doc();
    // 🎯 [KIM FIX] Use translation keys for i18n
    batch.set(hostPartnerNotificationRef, {
      userId: hostPartnerId,
      type: 'application_approved',
      title: 'notification.teamApprovedTitle',
      message: isTeamApplication
        ? 'notification.teamApprovedTeam'
        : 'notification.teamApprovedSolo',
      data: {
        eventId: eventId,
        applicationId: applicationId,
        applicantName: applicantName,
        eventTitle: eventTitle,
      },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create feed item for host partner
    const hostPartnerFeedRef = db.collection('feed').doc();
    const hostPartnerFeedData = {
      type: 'guest_team_approved',
      actorId: eventData.hostId || authUid, // Host who approved
      actorName: eventData.hostName || '',
      targetId: hostPartnerId,
      targetName: hostPartnerName,
      eventId: eventId,
      content: isTeamApplication
        ? `'${eventTitle}' ${eventTypeLabel}에 ${applicantName} & ${partnerName || '파트너'} 팀이 승인되었습니다!`
        : `'${eventTitle}' ${eventTypeLabel}에 ${applicantName}님이 승인되었습니다!`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      visibility: 'private',
      visibleTo: [hostPartnerId],
      metadata: {
        eventTitle: eventTitle,
        eventLocation: eventData.location || '',
        scheduledTime: eventData.scheduledTime || eventData.startDate || null,
        applicationId: applicationId,
        isTeamApplication: isTeamApplication,
        guestApplicantName: applicantName,
        guestPartnerName: partnerName || null,
      },
    };
    batch.set(hostPartnerFeedRef, hostPartnerFeedData);

    logger.info('📊 [FEED] Created approval feed item for HOST PARTNER:', {
      feedId: hostPartnerFeedRef.id,
      hostPartnerId,
      hostPartnerName,
      type: 'guest_team_approved',
      visibleTo: [hostPartnerId],
    });
  }

  // ✅ [FULL AT] 승인 후 만석 여부 확인 및 fullAt 타임스탬프 설정
  // 현재 참가자 수 계산: 기존 participants + 방금 추가한 인원 + 호스트팀
  const existingParticipantCount = eventData.participants?.length || 0;
  const addedParticipants = isTeamApplication ? 2 : 1;

  // 🎯 [KIM FIX] Calculate host team size (host + partner for doubles)
  // For doubles matches (maxParticipants >= 4), host team = 2 (host + partner)
  // For singles matches, host team = 1 (just host)
  const maxParticipants = eventData.maxParticipants || 4;
  const isDoublesMatch = maxParticipants >= 4;
  const hostTeamSize = isDoublesMatch ? 2 : 1;

  // 🎯 [KIM FIX] currentParticipants = host team + guest team (participants array)
  const newCurrentParticipants = existingParticipantCount + addedParticipants + hostTeamSize;

  // 🆕 [KIM FIX] Always update currentParticipants when approving
  batch.update(eventRef, {
    currentParticipants: newCurrentParticipants,
  });

  logger.info('📊 [APPROVE_APPLICATION] Updated currentParticipants:', {
    eventId,
    existingParticipantCount,
    addedParticipants,
    hostTeamSize,
    isDoublesMatch,
    newCurrentParticipants,
    maxParticipants,
  });

  // 만석이 된 경우 fullAt 타임스탬프 설정
  if (newCurrentParticipants >= maxParticipants && !eventData.fullAt) {
    batch.update(eventRef, {
      fullAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('📊 [FULL AT] Event is now full:', {
      eventId,
      newCurrentParticipants,
      maxParticipants,
    });
  }

  // Get or create event chat room
  const chatRoomsQuery = await db
    .collection('event_chat_rooms')
    .where('eventId', '==', eventId)
    .limit(1)
    .get();

  let chatRoomId: string;

  if (chatRoomsQuery.empty) {
    // Create new chat room
    const newChatRoomRef = db.collection('event_chat_rooms').doc();
    chatRoomId = newChatRoomRef.id;

    // ✅ [TEAM FIX] 팀인 경우 파트너도 채팅방에 추가
    const chatParticipants =
      isTeamApplication && partnerId ? [authUid, applicantId, partnerId] : [authUid, applicantId];

    batch.set(newChatRoomRef, {
      eventId: eventId,
      eventTitle: eventTitle,
      eventLocation: eventData.location || '',
      scheduledTime: eventData.scheduledTime || eventData.startDate || null,
      hostId: authUid,
      participants: chatParticipants,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Add to existing chat room
    const chatRoomDoc = chatRoomsQuery.docs[0];
    chatRoomId = chatRoomDoc.id;
    const chatRoomData = chatRoomDoc.data();

    const currentParticipants = chatRoomData.participants || [];

    // ✅ [TEAM FIX] 팀인 경우 파트너도 채팅방에 추가
    if (isTeamApplication && partnerId) {
      const membersToAdd = [];
      if (!currentParticipants.includes(applicantId)) membersToAdd.push(applicantId);
      if (!currentParticipants.includes(partnerId)) membersToAdd.push(partnerId);

      if (membersToAdd.length > 0) {
        batch.update(chatRoomDoc.ref, {
          participants: admin.firestore.FieldValue.arrayUnion(...membersToAdd),
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else if (!currentParticipants.includes(applicantId)) {
      batch.update(chatRoomDoc.ref, {
        participants: admin.firestore.FieldValue.arrayUnion(applicantId),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  // 🆕 [KIM FIX] Always update event's updatedAt to trigger host's real-time listener
  // This ensures the host sees approved applications without needing to reload
  batch.update(eventRef, {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info('📝 [APPROVE_APPLICATION] Updating event updatedAt for real-time refresh', {
    eventId,
  });

  // 🆕 [KIM FIX] Update host partner's application to trigger their real-time listener
  // 철수 (host's partner) views the event from "참여 신청한 모임" tab
  // Their listener only fires when their own application changes, not when event changes
  // So we need to update their application's updatedAt to show the approved guest team
  const hostPartnerAppQuery = await db
    .collection('participation_applications')
    .where('eventId', '==', eventId)
    .where('type', '==', 'partner_invitation')
    .where('status', '==', 'approved')
    .get();

  if (!hostPartnerAppQuery.empty) {
    for (const partnerAppDoc of hostPartnerAppQuery.docs) {
      batch.update(partnerAppDoc.ref, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(
        '📝 [APPROVE_APPLICATION] Updating host partner application for real-time refresh',
        {
          partnerAppId: partnerAppDoc.id,
          partnerId: partnerAppDoc.data().applicantId,
        }
      );
    }
  }

  // 🎯 [KIM FIX] Close ALL remaining unapproved applications when a team is approved
  // This includes:
  // 1. Solo applicants (status: 'looking_for_partner')
  // 2. Pending team applications waiting for partner acceptance (status: 'pending', partnerStatus: 'pending')
  logger.info('🔍 [APPROVE_APPLICATION] Checking for remaining unapproved applications...', {
    eventId,
    currentApplicationId: applicationId,
    approvedTeamId: isTeamApplication ? applicationData?.teamId : null,
  });

  // Get the approved team's teamId to exclude both team members
  const approvedTeamId = isTeamApplication ? applicationData?.teamId : null;

  // Query all applications for this event that are not yet approved
  const allApplicationsQuery = await db
    .collection('participation_applications')
    .where('eventId', '==', eventId)
    .get();

  let closedCount = 0;
  const closedApplicants: string[] = [];

  for (const appDoc of allApplicationsQuery.docs) {
    const appData = appDoc.data();
    const appStatus = appData.status;
    const appTeamId = appData.teamId;

    // Skip the approved application itself
    if (appDoc.id === applicationId) {
      continue;
    }

    // Skip applications from the same approved team (partner's application)
    if (approvedTeamId && appTeamId === approvedTeamId) {
      logger.info('⏭️ [APPROVE_APPLICATION] Skipping approved team member:', {
        appId: appDoc.id,
        applicantName: appData.applicantName,
        teamId: appTeamId,
      });
      continue;
    }

    // 🎯 [KIM FIX] Skip if this is the approved applicant or partner (by userId)
    // This catches cases where teamId comparison fails (e.g., merged applications)
    if (appData.applicantId === applicantId || appData.applicantId === partnerId) {
      logger.info('⏭️ [APPROVE_APPLICATION] Skipping approved team member (by userId):', {
        appId: appDoc.id,
        applicantName: appData.applicantName,
        applicantId: appData.applicantId,
        reason: appData.applicantId === applicantId ? 'is_applicant' : 'is_partner',
      });
      continue;
    }

    // Skip already approved, closed, rejected, or merged applications
    // 🎯 [KIM FIX] Added 'merged' status - applications that were converted to team applications
    if (
      appStatus === 'approved' ||
      appStatus === 'closed' ||
      appStatus === 'rejected' ||
      appStatus === 'merged'
    ) {
      logger.info('⏭️ [APPROVE_APPLICATION] Skipping already processed application:', {
        appId: appDoc.id,
        applicantName: appData.applicantName,
        status: appStatus,
      });
      continue;
    }

    // Close this application (covers: 'looking_for_partner', 'pending', etc.)
    logger.info('🔍 [APPROVE_APPLICATION] Processing unapproved application:', {
      appId: appDoc.id,
      applicantId: appData.applicantId,
      applicantName: appData.applicantName,
      currentStatus: appStatus,
      isTeamApplication: appData.isTeamApplication,
      partnerStatus: appData.partnerStatus,
    });

    batch.update(appDoc.ref, {
      status: 'closed',
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
      closedReason: 'another_team_approved',
    });

    // Create notification for the closed applicant
    const closedNotificationRef = db.collection('activity_notifications').doc();
    // 🎯 [KIM FIX] Use translation keys for i18n
    batch.set(closedNotificationRef, {
      userId: appData.applicantId,
      type: 'application_closed',
      title: 'notification.applicationClosedTitle',
      message: 'notification.applicationClosed',
      data: {
        eventId: eventId,
        applicationId: appDoc.id,
        eventTitle: eventTitle,
        closedReason: 'another_team_approved',
      },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 🎯 [KIM FIX] Create feed item for auto-closed applicant (visible in home feed)
    const closedFeedRef = db.collection('feed').doc();
    const closedFeedData = {
      type: 'application_auto_rejected',
      actorId: eventData.hostId || authUid, // Host who approved another team
      actorName: '',
      targetId: appData.applicantId,
      targetName: appData.applicantName || '',
      eventId: eventId,
      content: 'feed.applicationAutoRejected',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // 🎯 [KIM FIX] Feed 쿼리가 createdAt으로 정렬하므로 필수!
      isActive: true,
      visibility: 'private',
      visibleTo: [appData.applicantId],
      metadata: {
        eventTitle: eventTitle,
        eventLocation: eventData.location || '',
        scheduledTime: eventData.scheduledTime || eventData.startDate || null,
        applicationId: appDoc.id,
        closedReason: 'another_team_approved',
        isTeamApplication: appData.isTeamApplication || false,
      },
    };
    batch.set(closedFeedRef, closedFeedData);

    logger.info('📊 [FEED] Created auto-rejection feed item for applicant:', {
      feedId: closedFeedRef.id,
      applicantId: appData.applicantId,
      applicantName: appData.applicantName,
      type: 'application_auto_rejected',
      visibleTo: [appData.applicantId],
    });

    // 🎯 [KIM FIX] If team application, also notify the partner
    const closedPartnerId = appData.partnerId;
    const isClosedTeamApp = !!closedPartnerId && appData.partnerStatus === 'accepted';

    if (isClosedTeamApp && closedPartnerId) {
      // Create notification for partner
      const partnerNotificationRef = db.collection('activity_notifications').doc();
      // 🎯 [KIM FIX] Use translation keys for i18n
      batch.set(partnerNotificationRef, {
        userId: closedPartnerId,
        type: 'application_closed',
        title: 'notification.applicationClosedTitle',
        message: 'notification.applicationClosed',
        data: {
          eventId: eventId,
          applicationId: appDoc.id,
          eventTitle: eventTitle,
          closedReason: 'another_team_approved',
        },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create feed item for partner
      const closedPartnerFeedRef = db.collection('feed').doc();
      const closedPartnerFeedData = {
        type: 'application_auto_rejected',
        actorId: eventData.hostId || authUid,
        actorName: '',
        targetId: closedPartnerId,
        targetName: appData.partnerName || '', // 🎯 [KIM FIX] Partner name from application data
        eventId: eventId,
        content: 'feed.applicationAutoRejected',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(), // 🎯 [KIM FIX] Feed 쿼리가 createdAt으로 정렬하므로 필수!
        isActive: true,
        visibility: 'private',
        visibleTo: [closedPartnerId],
        metadata: {
          eventTitle: eventTitle,
          eventLocation: eventData.location || '',
          scheduledTime: eventData.scheduledTime || eventData.startDate || null,
          applicationId: appDoc.id,
          closedReason: 'another_team_approved',
          isTeamApplication: true,
          teamPartnerId: appData.applicantId,
        },
      };
      batch.set(closedPartnerFeedRef, closedPartnerFeedData);

      logger.info('📊 [FEED] Created auto-rejection feed item for partner:', {
        feedId: closedPartnerFeedRef.id,
        partnerId: closedPartnerId,
        type: 'application_auto_rejected',
        visibleTo: [closedPartnerId],
      });
    }

    closedCount++;
    closedApplicants.push(appData.applicantName || appData.applicantId);

    logger.info('✅ [APPROVE_APPLICATION] Closed unapproved application:', {
      appId: appDoc.id,
      applicantId: appData.applicantId,
      applicantName: appData.applicantName,
      previousStatus: appStatus,
    });
  }

  logger.info('📊 [APPROVE_APPLICATION] Closure summary:', {
    eventId,
    totalClosed: closedCount,
    closedApplicants,
  });

  // Commit all changes
  logger.info('🚀 [APPROVE_APPLICATION] Starting batch commit...');
  await batch.commit();
  logger.info('✅ [APPROVE_APPLICATION] Batch commit SUCCESSFUL! All feed items should be saved.');

  // Send push notification (fire and forget)
  sendApprovalNotification(applicantId, eventTitle, eventData.location || '', chatRoomId).catch(
    error => {
      logger.warn('Failed to send approval notification', error);
    }
  );

  // ✅ [TEAM FIX] 파트너에게도 푸시 알림 전송
  if (isTeamApplication && partnerId) {
    sendApprovalNotification(partnerId, eventTitle, eventData.location || '', chatRoomId).catch(
      error => {
        logger.warn('Failed to send partner approval notification', error);
      }
    );
  }

  return {
    success: true,
    message: 'Application approved successfully',
    data: {
      applicationId,
      chatRoomId,
      approvedAt: new Date().toISOString(),
    },
  };
}

/**
 * HTTP Cloud Function to approve a participation application
 * ✅ [v2] Migrated to onCall from firebase-functions/v2/https
 */
export const approveApplication = onCall<ApprovalRequest>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to approve applications');
    }

    // ✅ [v2] Data is in request.data, auth is in request.auth
    return await approveApplicationLogic(request.data, request.auth.uid);
  } catch (error) {
    logger.error('Error approving application', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to approve application');
  }
});

/**
 * Send push notification to approved applicant
 * 🌍 i18n: Sends notification in user's preferred language
 */
export async function sendApprovalNotification(
  userId: string,
  eventTitle: string,
  eventLocation: string,
  chatRoomId: string
): Promise<void> {
  try {
    // Get user's language preference
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userLang =
      userData?.preferredLanguage || userData?.language || userData?.preferences?.language || 'ko';

    // Get localized notification
    const notification = getApplicationApprovalNotification(
      userLang as 'ko' | 'en' | 'ja' | 'zh' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru',
      eventTitle
    );

    // Get user's FCM tokens
    const userTokensQuery = await db
      .collection('user_fcm_tokens')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    if (userTokensQuery.empty) {
      logger.warn('No FCM tokens found for user', { userId });
      return;
    }

    const tokens = userTokensQuery.docs.map(doc => doc.data().token);

    // Prepare notification payload
    const notificationPayload: admin.messaging.MulticastMessage = {
      tokens: tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        type: 'application_approved',
        eventTitle: eventTitle,
        eventLocation: eventLocation,
        chatRoomId: chatRoomId,
        clickAction: 'OPEN_EVENT_CHAT',
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#1976d2',
          sound: 'default',
          channelId: 'lightning_pickleball_events',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            category: 'EVENT_APPROVAL',
          },
        },
      },
    };

    // Send notification
    const response = await messaging.sendEachForMulticast(notificationPayload);

    logger.info('Push notification sent', {
      userId,
      eventTitle,
      userLanguage: userLang,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(tokens[idx]);
        }
      });

      // Remove invalid tokens
      if (invalidTokens.length > 0) {
        const batch = db.batch();
        for (const token of invalidTokens) {
          const tokenQuery = await db
            .collection('user_fcm_tokens')
            .where('token', '==', token)
            .limit(1)
            .get();

          if (!tokenQuery.empty) {
            batch.update(tokenQuery.docs[0].ref, { isActive: false });
          }
        }
        await batch.commit();
      }
    }
  } catch (error) {
    logger.error('Error sending push notification', error);
  }
}

/**
 * HTTP Cloud Function to decline a participation application
 * ✅ [v2] Migrated to onCall from firebase-functions/v2/https
 */
export const declineApplication = onCall<{
  applicationId: string;
  hostId: string; // Legacy parameter - kept for backwards compatibility but NOT used for auth
  reason?: string;
}>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to decline applications');
    }

    const { applicationId, reason } = request.data;
    const authUid = request.auth.uid;

    // Get application document
    const applicationRef = db.collection('participation_applications').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      throw new HttpsError('not-found', 'Application not found');
    }

    const applicationData = applicationDoc.data();
    if (!applicationData) {
      throw new HttpsError('internal', 'Invalid application data');
    }

    // 🔐 [SECURITY AUDIT 2025-01-08] Verify event ownership from DATABASE, not client parameter
    // Try to find event in multiple collections
    let eventRef = db.collection('leagues').doc(applicationData.eventId);
    let eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      eventRef = db.collection('tournaments').doc(applicationData.eventId);
      eventDoc = await eventRef.get();
    }

    if (!eventDoc.exists) {
      eventRef = db.collection('lightning_events').doc(applicationData.eventId);
      eventDoc = await eventRef.get();
    }

    if (!eventDoc.exists) {
      eventRef = db.collection('events').doc(applicationData.eventId);
      eventDoc = await eventRef.get();
    }

    if (!eventDoc.exists) {
      throw new HttpsError('not-found', 'Event not found in any collection');
    }

    const eventData = eventDoc.data();
    if (!eventData) {
      throw new HttpsError('internal', 'Invalid event data');
    }

    // 🔐 [SECURITY] Verify event ownership - check multiple possible host fields
    const isEventHost =
      eventData.createdBy === authUid ||
      eventData.organizerId === authUid ||
      eventData.hostId === authUid ||
      eventData.host === authUid;

    if (!isEventHost) {
      logger.warn('🚨 [SECURITY] Unauthorized decline attempt:', {
        authUid,
        eventId: applicationData.eventId,
        eventCreatedBy: eventData.createdBy,
        eventOrganizerId: eventData.organizerId,
        eventHostId: eventData.hostId,
      });
      throw new HttpsError(
        'permission-denied',
        'You are not the host of this event. Only the event host can decline applications.'
      );
    }

    // 🎯 [KIM] Check if this is a team application
    const partnerId = applicationData?.partnerId;
    const isTeamApplication = !!partnerId && applicationData?.partnerStatus === 'accepted';
    const applicantId = applicationData.applicantId;
    const applicantName = applicationData.applicantName || 'Unknown';

    // Update application status
    await applicationRef.update({
      status: 'declined',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: authUid, // Use verified auth uid, not client-provided hostId
      hostMessage: reason || '',
    });

    // Event data already fetched above for security check
    const eventTitle = eventData?.title || eventData?.name || '이벤트';

    // 🎯 [KIM FIX] Use translation keys for i18n
    // Create notification for applicant
    await db.collection('activity_notifications').add({
      userId: applicantId,
      type: 'application_declined',
      title: 'notification.applicationDeclinedTitle',
      message: 'notification.applicationDeclined',
      data: {
        eventId: applicationData.eventId,
        applicationId: applicationId,
        reason: reason || '',
        eventTitle: eventTitle,
      },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 🎯 [KIM] Create feed item for applicant (visible only to them)
    await db.collection('feed').add({
      type: 'application_rejected',
      actorId: eventData?.hostId || authUid,
      actorName: '',
      targetId: applicantId,
      targetName: applicantName,
      eventId: applicationData.eventId,
      content: 'feed.applicationRejected',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      visibility: 'private',
      visibleTo: [applicantId],
      metadata: {
        eventTitle: eventTitle,
        eventLocation: eventData?.location || '',
        applicationId: applicationId,
        isTeamApplication: isTeamApplication,
        reason: reason || '',
      },
    });

    logger.info('📊 [FEED] Created rejection feed item for applicant:', { applicantId });

    // 🎯 [KIM] If team application, also notify partner
    if (isTeamApplication && partnerId) {
      // Get partner name
      let partnerName = 'Unknown Partner';
      try {
        const partnerUserDoc = await db.collection('users').doc(partnerId).get();
        if (partnerUserDoc.exists) {
          const partnerUserData = partnerUserDoc.data();
          partnerName =
            partnerUserData?.profile?.displayName ||
            partnerUserData?.profile?.nickname ||
            partnerUserData?.displayName ||
            `User ${partnerId.slice(-4)}`;
        }
      } catch (error) {
        logger.warn('Failed to fetch partner user profile:', error);
      }

      // 🎯 [KIM FIX] Use translation keys for i18n
      // Create notification for partner
      await db.collection('activity_notifications').add({
        userId: partnerId,
        type: 'application_declined',
        title: 'notification.applicationDeclinedTitle',
        message: 'notification.applicationDeclinedTeam',
        data: {
          eventId: applicationData.eventId,
          applicationId: applicationId,
          reason: reason || '',
          eventTitle: eventTitle,
          isTeamApproval: true,
          teamPartnerId: applicantId,
        },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create feed item for partner
      await db.collection('feed').add({
        type: 'application_rejected',
        actorId: eventData?.hostId || authUid,
        actorName: '',
        targetId: partnerId,
        targetName: partnerName,
        eventId: applicationData.eventId,
        content: 'feed.applicationRejectedTeam',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        visibility: 'private',
        visibleTo: [partnerId],
        metadata: {
          eventTitle: eventTitle,
          eventLocation: eventData?.location || '',
          applicationId: applicationId,
          isTeamApplication: true,
          teamPartnerId: applicantId,
          teamPartnerName: applicantName,
          reason: reason || '',
        },
      });

      logger.info('📊 [FEED] Created rejection feed item for partner:', {
        partnerId,
        partnerName,
      });
    }

    logger.info('Application declined', {
      applicationId,
      declinedBy: authUid, // Renamed from hostId for clarity
      reason,
      isTeamApplication,
      partnerId,
    });

    return {
      success: true,
      message: 'Application declined successfully',
    };
  } catch (error) {
    logger.error('Error declining application', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to decline application');
  }
});

/**
 * Firestore trigger for new applications
 * ✅ [v2] Migrated to onDocumentCreated from firebase-functions/v2/firestore
 */
export const onApplicationCreated = onDocumentCreated(
  'participation_applications/{applicationId}',
  async event => {
    try {
      // ✅ [v2] Snapshot is in event.data
      const snapshot = event.data;
      if (!snapshot) {
        logger.warn('No data associated with the event');
        return;
      }

      const applicationData = snapshot.data();
      const applicationId = event.params.applicationId;

      // Get event details
      const eventRef = db.collection('lightning_events').doc(applicationData.eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        logger.error('Event not found for application', {
          applicationId,
          eventId: applicationData.eventId,
        });
        return;
      }

      const eventData = eventDoc.data();
      if (!eventData) {
        logger.error('Invalid event data', { applicationId });
        return;
      }

      // 🎯 [KIM FIX] Use translation keys for i18n
      // Create notification for event host
      await db.collection('activity_notifications').add({
        userId: eventData.hostId,
        type: 'application_submitted',
        title: 'notification.newApplicationTitle',
        message: 'notification.newApplication',
        data: {
          eventId: applicationData.eventId,
          applicationId: applicationId,
          applicantName: applicationData.applicantName,
          eventTitle: eventData.title,
        },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // If auto-approval is enabled, automatically approve
      if (eventData.autoApproval) {
        // Auto-approval: Use the shared logic function safely
        logger.info('Auto-approving application', {
          applicationId,
          hostId: eventData.hostId,
        });

        try {
          await approveApplicationLogic(
            {
              applicationId: applicationId,
              hostId: eventData.hostId,
              eventId: applicationData.eventId,
              applicantId: applicationData.applicantId,
            },
            eventData.hostId
          );

          logger.info('Auto-approval successful', {
            applicationId,
            hostId: eventData.hostId,
          });
        } catch (error: unknown) {
          logger.error('Auto-approval failed', {
            applicationId,
            hostId: eventData.hostId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info('Application notification created', {
        applicationId,
        eventId: applicationData.eventId,
        autoApproval: eventData.autoApproval,
      });
    } catch (error) {
      logger.error('Error processing new application', error);
    }
  }
);

export default {
  approveApplication,
  declineApplication,
  onApplicationCreated,
};
