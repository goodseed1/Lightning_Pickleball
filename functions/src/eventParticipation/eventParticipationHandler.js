const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 이벤트 참여 요청 처리 Cloud Function
 * - 일반 Lightning 이벤트: 관리자 승인 필요
 * - 정기 모임 + 클럽 회원: 즉시 자동 승인
 * - 정기 모임 + 비회원: 관리자 승인 필요
 */
exports.requestEventParticipation = functions.https.onCall(async (data, context) => {
  console.log('🎾 Event participation request started');

  try {
    // 1. 사용자 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { eventId, participationType = 'participant' } = data;

    // 2. 입력 데이터 검증
    if (!eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
    }

    if (!['participant', 'spectator', 'helper'].includes(participationType)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid participation type');
    }

    console.log(`📋 Processing participation request for event ${eventId} by user ${userId}`);

    // 3. 이벤트 정보 조회
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();

    // 4. 이벤트 상태 확인
    if (eventData.status !== 'active' && eventData.status !== 'scheduled') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Event is not available for participation'
      );
    }

    // 5. 중복 참여 확인
    const existingParticipation = await checkExistingParticipation(eventId, userId);
    if (existingParticipation) {
      throw new functions.https.HttpsError(
        'already-exists',
        'Already requested or participating in this event'
      );
    }

    // 6. 참가자 수 제한 확인
    const currentParticipants = await getCurrentParticipantCount(eventId);
    const maxParticipants = eventData.participantSettings?.maxParticipants;

    if (maxParticipants && currentParticipants >= maxParticipants) {
      // 대기자 명단에 추가
      const participationId = await addToWaitlist(eventId, userId, participationType, eventData);
      return {
        success: true,
        status: 'waitlisted',
        participationId,
        position: await getWaitlistPosition(eventId, participationId),
      };
    }

    // 7. 정기 모임 자동 승인 로직
    const autoApprovalResult = await checkAutoApprovalEligibility(eventData, userId);

    let participationStatus = 'pending'; // 기본: 승인 대기
    let approvalReason = 'general_event';

    if (autoApprovalResult.eligible) {
      participationStatus = 'approved';
      approvalReason = autoApprovalResult.reason;
      console.log(`✅ Auto-approved: ${approvalReason}`);
    }

    // 8. 참여 요청 생성
    const participationId = await createParticipationRequest({
      eventId,
      userId,
      participationType,
      status: participationStatus,
      approvalReason,
      eventData,
    });

    // 9. 이벤트 통계 업데이트
    if (participationStatus === 'approved') {
      await updateEventParticipantCount(eventId, 1);

      // 활동 피드 생성
      await createActivityFeedItem({
        type: 'event_joined',
        userId,
        eventId,
        eventData,
        autoApproved: autoApprovalResult.eligible,
      });
    }

    // 10. 알림 발송
    await sendParticipationNotifications({
      participationId,
      eventData,
      userId,
      status: participationStatus,
      autoApproved: autoApprovalResult.eligible,
    });

    console.log(`🎉 Participation request processed: ${participationStatus}`);

    return {
      success: true,
      participationId,
      status: participationStatus,
      autoApproved: autoApprovalResult.eligible,
      reason: approvalReason,
      eventTitle: eventData.title,
    };
  } catch (error) {
    console.error('❌ Error processing participation request:', error);
    throw error;
  }
});

/**
 * 자동 승인 대상 확인
 * - 정기 모임 이벤트 && 클럽 회원 = 자동 승인
 */
async function checkAutoApprovalEligibility(eventData, userId) {
  try {
    // 1. 정기 모임 이벤트인지 확인
    const isRegularMeeting =
      eventData.tags &&
      (eventData.tags.includes('정기모임') ||
        eventData.tags.includes('regular_meeting') ||
        eventData.recurringTags?.includes('정기모임'));

    if (!isRegularMeeting) {
      return { eligible: false, reason: 'not_regular_meeting' };
    }

    // 2. 클럽 이벤트인지 확인
    const clubId = eventData.clubId;
    if (!clubId) {
      return { eligible: false, reason: 'not_club_event' };
    }

    // 3. 사용자가 해당 클럽의 회원인지 확인
    const membershipQuery = await db
      .collection('clubMembers')
      .where('clubId', '==', clubId)
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (membershipQuery.empty) {
      return { eligible: false, reason: 'not_club_member' };
    }

    console.log(`✅ Auto-approval eligible: Regular meeting + Club member`);

    return {
      eligible: true,
      reason: 'club_member_regular_meeting',
      clubId,
      membershipData: membershipQuery.docs[0].data(),
    };
  } catch (error) {
    console.error('Error checking auto-approval eligibility:', error);
    return { eligible: false, reason: 'error_checking_eligibility' };
  }
}

/**
 * 기존 참여 요청 확인
 */
async function checkExistingParticipation(eventId, userId) {
  try {
    const participationQuery = await db
      .collection('eventParticipations')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    return !participationQuery.empty;
  } catch (error) {
    console.error('Error checking existing participation:', error);
    return false;
  }
}

/**
 * 현재 참가자 수 조회
 */
async function getCurrentParticipantCount(eventId) {
  try {
    const participationQuery = await db
      .collection('eventParticipations')
      .where('eventId', '==', eventId)
      .where('status', 'in', ['approved', 'confirmed'])
      .get();

    return participationQuery.docs.length;
  } catch (error) {
    console.error('Error getting participant count:', error);
    return 0;
  }
}

/**
 * 대기자 명단에 추가
 */
async function addToWaitlist(eventId, userId, participationType, eventData) {
  try {
    const participationRef = await db.collection('eventParticipations').add({
      eventId,
      userId,
      participationType,
      status: 'waitlisted',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      waitlistedAt: admin.firestore.FieldValue.serverTimestamp(),
      priority: calculateWaitlistPriority(userId, eventData),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`📝 Added to waitlist: ${participationRef.id}`);
    return participationRef.id;
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    throw error;
  }
}

/**
 * 대기자 순서 조회
 */
async function getWaitlistPosition(eventId, participationId) {
  try {
    const waitlistQuery = await db
      .collection('eventParticipations')
      .where('eventId', '==', eventId)
      .where('status', '==', 'waitlisted')
      .orderBy('waitlistedAt', 'asc')
      .get();

    const position = waitlistQuery.docs.findIndex(doc => doc.id === participationId) + 1;
    return position || -1;
  } catch (error) {
    console.error('Error getting waitlist position:', error);
    return -1;
  }
}

/**
 * 대기자 우선순위 계산
 */
function calculateWaitlistPriority(userId, eventData) {
  // 기본 우선순위 점수 (높을수록 우선)
  let priority = 50;

  // 클럽 회원은 우선순위 +30
  if (eventData.clubId) {
    priority += 30; // 실제로는 클럽 회원 여부를 체크해야 함
  }

  // 정기 참석자는 우선순위 +20 (향후 구현)
  // if (isRegularParticipant(userId, eventData)) {
  //   priority += 20;
  // }

  return priority;
}

/**
 * 참여 요청 생성
 */
async function createParticipationRequest({
  eventId,
  userId,
  participationType,
  status,
  approvalReason,
  eventData,
}) {
  try {
    const participationRef = await db.collection('eventParticipations').add({
      eventId,
      userId,
      participationType,
      status,
      approvalReason,
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedAt: status === 'approved' ? admin.firestore.FieldValue.serverTimestamp() : null,

      // 이벤트 정보 스냅샷 (참조 용도)
      eventSnapshot: {
        title: eventData.title,
        dateTime: eventData.dateTime,
        location: eventData.location,
        clubId: eventData.clubId,
        type: eventData.type,
        isRegularMeeting: eventData.tags?.includes('정기모임') || false,
      },

      // 메타데이터
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`📝 Participation request created: ${participationRef.id}`);
    return participationRef.id;
  } catch (error) {
    console.error('Error creating participation request:', error);
    throw error;
  }
}

/**
 * 이벤트 참가자 수 업데이트
 */
async function updateEventParticipantCount(eventId, increment) {
  try {
    await db
      .collection('events')
      .doc(eventId)
      .update({
        participantCount: admin.firestore.FieldValue.increment(increment),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`📊 Event participant count updated by ${increment}`);
  } catch (error) {
    console.error('Error updating participant count:', error);
    throw error;
  }
}

/**
 * 활동 피드 아이템 생성
 */
async function createActivityFeedItem({ type, userId, eventId, eventData, autoApproved }) {
  try {
    const feedItemData = {
      type,
      userId,
      eventId,
      title: autoApproved ? '정기 모임에 참여했습니다' : '이벤트 참여를 요청했습니다',
      description: `${eventData.title} - ${eventData.location?.name || ''}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        eventType: eventData.type,
        isRegularMeeting: eventData.tags?.includes('정기모임') || false,
        autoApproved,
        clubId: eventData.clubId,
      },
    };

    // 사용자 개인 피드에 추가
    await db.collection('activityFeed').doc(userId).collection('items').add(feedItemData);

    // 클럽 피드에 추가 (클럽 이벤트인 경우)
    if (eventData.clubId) {
      await db
        .collection('clubs')
        .doc(eventData.clubId)
        .collection('activityFeed')
        .add({
          ...feedItemData,
          participantId: userId,
        });
    }

    console.log(`📰 Activity feed item created`);
  } catch (error) {
    console.error('Error creating activity feed item:', error);
    // 피드 생성 실패는 치명적이지 않음
  }
}

/**
 * 참여 관련 알림 발송
 */
async function sendParticipationNotifications({
  participationId,
  eventData,
  userId,
  status,
  autoApproved,
}) {
  try {
    console.log(`📱 Sending participation notifications - Status: ${status}`);

    // 1. 참여자에게 알림
    await sendParticipantNotification({
      userId,
      eventData,
      status,
      autoApproved,
    });

    // 2. 이벤트 호스트/관리자에게 알림 (자동 승인이 아닌 경우)
    if (!autoApproved) {
      await sendHostNotification({
        eventData,
        participantId: userId,
        participationId,
      });
    }

    // 3. 클럽 관리자에게 알림 (클럽 이벤트인 경우)
    if (eventData.clubId) {
      await sendClubAdminNotification({
        clubId: eventData.clubId,
        eventData,
        participantId: userId,
        autoApproved,
      });
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
    // 알림 실패는 치명적이지 않음
  }
}

/**
 * 참여자에게 알림 발송
 */
async function sendParticipantNotification({ userId, eventData, status, autoApproved }) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;
    if (!fcmToken) return;

    const language = userData.profile?.preferredLanguage || 'ko';

    let title, body;

    if (autoApproved) {
      title =
        language === 'ko' ? '정기 모임 참여 확정!' : 'Regular Meeting Participation Confirmed!';
      body =
        language === 'ko'
          ? `${eventData.title} 모임 참여가 자동으로 승인되었습니다.`
          : `Your participation in ${eventData.title} has been automatically approved.`;
    } else {
      title = language === 'ko' ? '이벤트 참여 요청 완료' : 'Event Participation Request Sent';
      body =
        language === 'ko'
          ? `${eventData.title} 참여 요청이 전송되었습니다. 승인을 기다려주세요.`
          : `Your participation request for ${eventData.title} has been sent. Please wait for approval.`;
    }

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: {
        type: 'participation_status',
        eventId: eventData.id || '',
        status,
        autoApproved: autoApproved.toString(),
      },
    };

    await admin.messaging().send(message);
    console.log(`📱 Participant notification sent to ${userId}`);
  } catch (error) {
    console.error('Error sending participant notification:', error);
  }
}

/**
 * 호스트에게 알림 발송
 */
async function sendHostNotification({ eventData, participantId, participationId }) {
  try {
    const hostId = eventData.hostId;
    if (!hostId) return;

    const hostDoc = await db.collection('users').doc(hostId).get();
    if (!hostDoc.exists) return;

    const hostData = hostDoc.data();
    const fcmToken = hostData.fcmToken;
    if (!fcmToken) return;

    const language = hostData.profile?.preferredLanguage || 'ko';

    const title = language === 'ko' ? '새로운 참여 요청' : 'New Participation Request';
    const body =
      language === 'ko'
        ? `${eventData.title}에 새로운 참여 요청이 있습니다.`
        : `New participation request for ${eventData.title}.`;

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: {
        type: 'participation_request',
        eventId: eventData.id || '',
        participationId,
        participantId,
      },
    };

    await admin.messaging().send(message);
    console.log(`📱 Host notification sent to ${hostId}`);
  } catch (error) {
    console.error('Error sending host notification:', error);
  }
}

/**
 * 클럽 관리자에게 알림 발송
 */
async function sendClubAdminNotification({ clubId, eventData, participantId, autoApproved }) {
  try {
    // 클럽 관리자 조회
    const adminMembersQuery = await db
      .collection('clubMembers')
      .where('clubId', '==', clubId)
      .where('role', 'in', ['admin', 'manager'])
      .where('status', '==', 'active')
      .get();

    if (adminMembersQuery.empty) return;

    const notificationPromises = adminMembersQuery.docs.map(async doc => {
      const memberData = doc.data();
      const adminId = memberData.userId;

      const adminDoc = await db.collection('users').doc(adminId).get();
      if (!adminDoc.exists) return;

      const adminData = adminDoc.data();
      const fcmToken = adminData.fcmToken;
      if (!fcmToken) return;

      const language = adminData.profile?.preferredLanguage || 'ko';

      let title, body;

      if (autoApproved) {
        title = language === 'ko' ? '회원 자동 참여' : 'Member Auto-Joined';
        body =
          language === 'ko'
            ? `클럽 회원이 ${eventData.title} 정기 모임에 자동 참여했습니다.`
            : `A club member automatically joined ${eventData.title} regular meeting.`;
      } else {
        title = language === 'ko' ? '새로운 참여 요청' : 'New Participation Request';
        body =
          language === 'ko'
            ? `${eventData.title}에 새로운 참여 요청이 있습니다.`
            : `New participation request for ${eventData.title}.`;
      }

      const message = {
        token: fcmToken,
        notification: { title, body },
        data: {
          type: 'club_event_participation',
          clubId,
          eventId: eventData.id || '',
          participantId,
          autoApproved: autoApproved.toString(),
        },
      };

      return admin.messaging().send(message);
    });

    await Promise.allSettled(notificationPromises);
    console.log(`📱 Club admin notifications sent`);
  } catch (error) {
    console.error('Error sending club admin notifications:', error);
  }
}

/**
 * 참여 요청 승인/거절 처리 함수
 */
exports.updateParticipationStatus = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { participationId, status, reason } = data;
    const adminId = context.auth.uid;

    if (!participationId || !status) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    if (!['approved', 'rejected'].includes(status)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid status');
    }

    // 참여 요청 조회
    const participationDoc = await db.collection('eventParticipations').doc(participationId).get();
    if (!participationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Participation request not found');
    }

    const participationData = participationDoc.data();

    // 권한 확인 (이벤트 호스트 또는 클럽 관리자)
    const hasPermission = await checkApprovalPermission(adminId, participationData);
    if (!hasPermission) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'No permission to approve this request'
      );
    }

    // 상태 업데이트
    await db
      .collection('eventParticipations')
      .doc(participationId)
      .update({
        status,
        approvedAt: status === 'approved' ? admin.firestore.FieldValue.serverTimestamp() : null,
        rejectedAt: status === 'rejected' ? admin.firestore.FieldValue.serverTimestamp() : null,
        approvedBy: adminId,
        rejectionReason: reason || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // 승인된 경우 이벤트 참가자 수 업데이트
    if (status === 'approved') {
      await updateEventParticipantCount(participationData.eventId, 1);
    }

    console.log(`✅ Participation status updated: ${participationId} -> ${status}`);

    return {
      success: true,
      participationId,
      status,
    };
  } catch (error) {
    console.error('❌ Error updating participation status:', error);
    throw error;
  }
});

/**
 * 승인 권한 확인
 */
async function checkApprovalPermission(userId, participationData) {
  try {
    const eventId = participationData.eventId;
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) return false;

    const eventData = eventDoc.data();

    // 이벤트 호스트인 경우
    if (eventData.hostId === userId) return true;

    // 클럽 관리자인 경우
    if (eventData.clubId) {
      const adminQuery = await db
        .collection('clubMembers')
        .where('clubId', '==', eventData.clubId)
        .where('userId', '==', userId)
        .where('role', 'in', ['admin', 'manager'])
        .where('status', '==', 'active')
        .limit(1)
        .get();

      return !adminQuery.empty;
    }

    return false;
  } catch (error) {
    console.error('Error checking approval permission:', error);
    return false;
  }
}

// Export helper functions for testing
module.exports.helpers = {
  checkAutoApprovalEligibility,
  checkExistingParticipation,
  getCurrentParticipantCount,
  createParticipationRequest,
  checkApprovalPermission,
};
