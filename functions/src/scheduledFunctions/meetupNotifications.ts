/**
 * 📢 [MEETUP NOTIFICATIONS] 모임 푸시 알림 시스템
 *
 * 새 모임이 생성되면 클럽 회원들에게 푸시 알림을 전송합니다.
 *
 * **알림 규칙**:
 * 1. 모임 당일 오전 9시에 알림 전송
 * 2. 당일 9시 이후에 생성된 모임은 즉시 전송
 * 3. ⚠️ 삭제된 모임은 알림이 전송되지 않음 (status !== 'confirmed')
 *
 * **삭제된 모임 처리**:
 * - 모임이 삭제되면 Firestore document가 완전히 삭제됨
 * - 9시 스케줄러는 'confirmed' 상태인 모임만 조회하므로
 *   삭제된 모임은 자동으로 알림 대상에서 제외됨
 *
 * **Schedule**: 매일 오전 9시 실행 (cron: '0 9 * * *')
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

// Constants
const NOTIFICATION_HOUR = 9; // 오전 9시

interface MeetupData {
  clubId: string;
  dateTime: admin.firestore.Timestamp;
  location?: {
    name?: string;
    address?: string;
  };
  courtDetails?: {
    availableCourts?: number;
  };
  status: string;
  notificationSent?: boolean;
  createdAt?: admin.firestore.Timestamp;
}

/**
 * 오늘 날짜인지 확인 (EST/EDT 기준)
 */
function isSameDay(timestamp: admin.firestore.Timestamp): boolean {
  const meetupDate = timestamp.toDate();
  const now = new Date();

  // EST/EDT로 변환하여 비교 (America/New_York)
  const meetupLocal = new Date(
    meetupDate.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  const nowLocal = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

  return (
    meetupLocal.getFullYear() === nowLocal.getFullYear() &&
    meetupLocal.getMonth() === nowLocal.getMonth() &&
    meetupLocal.getDate() === nowLocal.getDate()
  );
}

/**
 * 현재 시간이 오전 9시 이후인지 확인 (EST/EDT 기준)
 */
function isAfter9AM(): boolean {
  const now = new Date();
  const nowLocal = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return nowLocal.getHours() >= NOTIFICATION_HOUR;
}

/**
 * 모임 시간을 포맷팅 (예: "오후 7:30")
 */
function formatMeetupTime(timestamp: admin.firestore.Timestamp): string {
  const date = timestamp.toDate();
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  };
  return date.toLocaleString('ko-KR', options);
}

/**
 * 클럽 멤버들의 User ID 목록 가져오기 (피드 표시용)
 */
async function getClubMemberIds(clubId: string): Promise<string[]> {
  const membersSnapshot = await db
    .collection('clubMembers')
    .where('clubId', '==', clubId)
    .where('status', '==', 'active')
    .get();

  if (membersSnapshot.empty) {
    return [];
  }

  return membersSnapshot.docs.map(doc => doc.data().userId).filter(Boolean);
}

/**
 * 🎾 모임 알림 피드 아이템 생성
 */
async function createMeetupFeedItem(
  clubId: string,
  clubName: string,
  meetupId: string,
  meetupTime: string,
  locationName?: string,
  visibleToUserIds?: string[]
): Promise<void> {
  try {
    // 클럽 회원 ID 목록 가져오기 (visibleTo 배열용)
    const memberIds = visibleToUserIds || (await getClubMemberIds(clubId));

    if (memberIds.length === 0) {
      logger.info(`📰 [MEETUP FEED] No members to show feed for club: ${clubId}`);
      return;
    }

    const locationText = locationName ? ` @ ${locationName}` : '';

    const feedItemData = {
      type: 'meetup_reminder',
      actorId: clubId, // 시스템/클럽이 생성한 피드
      actorName: clubName,
      clubId: clubId,
      clubName: clubName,
      eventId: meetupId, // meetupId를 eventId로 저장
      visibility: 'club_members',
      visibleTo: memberIds,
      isActive: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        meetupTime: meetupTime,
        locationName: locationName || null,
        feedTitle: `🎾 오늘 모임이 있습니다!`,
        feedBody: `${clubName} - ${meetupTime}${locationText}`,
      },
    };

    // feed 컬렉션에 피드 아이템 추가
    const feedRef = await db.collection('feed').add(feedItemData);

    logger.info(`📰 [MEETUP FEED] Feed item created`, {
      feedId: feedRef.id,
      meetupId,
      clubId,
      visibleToCount: memberIds.length,
    });
  } catch (error) {
    logger.error('📰 [MEETUP FEED] Failed to create feed item', { error, meetupId, clubId });
    // 피드 생성 실패는 알림 전송에 영향을 주지 않도록 에러를 throw하지 않음
  }
}

/**
 * 클럽 멤버들의 FCM 토큰 가져오기
 */
async function getClubMemberTokens(clubId: string, excludeUserId?: string): Promise<string[]> {
  // 1. 클럽 멤버 목록 조회
  const membersSnapshot = await db
    .collection('clubMembers')
    .where('clubId', '==', clubId)
    .where('status', '==', 'active')
    .get();

  if (membersSnapshot.empty) {
    logger.info(`📢 [MEETUP] No active members found for club: ${clubId}`);
    return [];
  }

  const memberIds = membersSnapshot.docs
    .map(doc => doc.data().userId)
    .filter(id => id !== excludeUserId); // 생성자 제외 (옵션)

  if (memberIds.length === 0) {
    return [];
  }

  // 2. 멤버들의 FCM 토큰 조회
  const allTokens: string[] = [];

  // Firestore 'in' 쿼리는 최대 30개까지만 지원하므로 배치 처리
  for (let i = 0; i < memberIds.length; i += 30) {
    const batch = memberIds.slice(i, i + 30);
    const tokensSnapshot = await db
      .collection('user_fcm_tokens')
      .where('userId', 'in', batch)
      .where('isActive', '==', true)
      .get();

    tokensSnapshot.docs.forEach(doc => {
      const token = doc.data().token;
      if (token) {
        allTokens.push(token);
      }
    });
  }

  logger.info(`📢 [MEETUP] Found ${allTokens.length} FCM tokens for ${memberIds.length} members`);
  return allTokens;
}

/**
 * 클럽 이름 가져오기
 */
async function getClubName(clubId: string): Promise<string> {
  const clubDoc = await db.collection('pickleball_clubs').doc(clubId).get();
  if (clubDoc.exists) {
    const data = clubDoc.data();
    return data?.profile?.clubName || data?.name || '클럽';
  }
  return '클럽';
}

/**
 * 푸시 알림 전송
 */
async function sendMeetupNotification(
  tokens: string[],
  clubId: string,
  clubName: string,
  meetupId: string,
  meetupTime: string,
  locationName?: string
): Promise<{ successCount: number; failureCount: number }> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const locationText = locationName ? ` @ ${locationName}` : '';

  const notificationPayload: admin.messaging.MulticastMessage = {
    tokens: tokens,
    notification: {
      title: `🎾 오늘 모임이 있습니다!`,
      body: `${clubName} - ${meetupTime}${locationText}`,
    },
    data: {
      type: 'meetup_reminder',
      clubId: clubId,
      meetupId: meetupId,
      clickAction: 'OPEN_CLUB_ACTIVITY',
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          category: 'MEETUP_REMINDER',
        },
      },
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'meetup_notifications',
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(notificationPayload);

    logger.info(`📢 [MEETUP] Notification sent`, {
      meetupId,
      clubId,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    // 유효하지 않은 토큰 정리
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(tokens[idx]);
        }
      });

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
        logger.info(`📢 [MEETUP] Cleaned up ${invalidTokens.length} invalid tokens`);
      }
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    logger.error('📢 [MEETUP] Failed to send notification', { error, meetupId });
    return { successCount: 0, failureCount: tokens.length };
  }
}

/**
 * 🕘 매일 오전 9시 스케줄 함수
 * 오늘 예정된 모임에 대해 클럽 회원들에게 알림 전송
 */
export const sendDailyMeetupReminders = onSchedule(
  {
    schedule: '0 9 * * *', // 매일 오전 9시 (cron format)
    timeZone: 'America/New_York', // Eastern Time
    memory: '256MiB',
    timeoutSeconds: 540,
  },
  async () => {
    logger.info('🕘 [MEETUP DAILY] Starting daily meetup reminder job...');

    let totalNotifications = 0;
    let meetupsProcessed = 0;
    const errors: string[] = [];

    try {
      // 오늘 날짜 범위 계산 (EST/EDT)
      const now = new Date();
      const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      // 오늘 모임 중 알림 미발송 건 조회
      // ⚠️ IMPORTANT: status === 'confirmed' 조건으로 삭제된/취소된 모임은 자동 제외
      // 모임 삭제 시 document가 완전히 삭제되거나 status가 변경되므로 안전함
      const meetupsSnapshot = await db
        .collection('regular_meetups')
        .where('status', '==', 'confirmed') // 삭제된 모임 제외 (deleted/cancelled)
        .where('dateTime', '>=', admin.firestore.Timestamp.fromDate(todayStart))
        .where('dateTime', '<=', admin.firestore.Timestamp.fromDate(todayEnd))
        .get();

      if (meetupsSnapshot.empty) {
        logger.info('🕘 [MEETUP DAILY] No meetups scheduled for today');
        return;
      }

      logger.info(`🕘 [MEETUP DAILY] Found ${meetupsSnapshot.docs.length} meetups for today`);

      // 각 모임에 대해 알림 전송
      for (const meetupDoc of meetupsSnapshot.docs) {
        const meetupData = meetupDoc.data() as MeetupData;

        // 이미 알림 전송된 경우 스킵
        if (meetupData.notificationSent) {
          logger.info(`🕘 [MEETUP DAILY] Skipping already notified: ${meetupDoc.id}`);
          continue;
        }

        try {
          const clubId = meetupData.clubId;
          const clubName = await getClubName(clubId);
          const tokens = await getClubMemberTokens(clubId);

          if (tokens.length > 0) {
            const meetupTime = formatMeetupTime(meetupData.dateTime);
            const locationName = meetupData.location?.name;

            const result = await sendMeetupNotification(
              tokens,
              clubId,
              clubName,
              meetupDoc.id,
              meetupTime,
              locationName
            );

            totalNotifications += result.successCount;

            // 🎾 [KIM] 피드 아이템 생성 (푸시 알림과 동시에)
            await createMeetupFeedItem(clubId, clubName, meetupDoc.id, meetupTime, locationName);

            // 알림 전송 완료 표시
            await meetupDoc.ref.update({
              notificationSent: true,
              notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          meetupsProcessed++;
        } catch (error) {
          const errorMsg = `Failed to process meetup ${meetupDoc.id}: ${error}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to query meetups: ${error}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
    }

    logger.info(
      `🎉 [MEETUP DAILY] Job completed! ${meetupsProcessed} meetups processed, ${totalNotifications} notifications sent`
    );

    if (errors.length > 0) {
      logger.error(`⚠️ [MEETUP DAILY] Encountered ${errors.length} errors`);
    }
  }
);

/**
 * 📢 모임 생성 트리거
 * 당일 9시 이후에 생성된 모임은 즉시 알림 전송
 */
export const onMeetupCreated = onDocumentCreated(
  {
    document: 'regular_meetups/{meetupId}',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async event => {
    const meetupId = event.params.meetupId;
    const meetupData = event.data?.data() as MeetupData | undefined;

    if (!meetupData) {
      logger.error('📢 [MEETUP CREATED] No meetup data found');
      return;
    }

    logger.info(`📢 [MEETUP CREATED] New meetup created: ${meetupId}`, {
      clubId: meetupData.clubId,
      dateTime: meetupData.dateTime?.toDate(),
      status: meetupData.status,
    });

    // confirmed 상태가 아니면 스킵
    if (meetupData.status !== 'confirmed') {
      logger.info(`📢 [MEETUP CREATED] Skipping non-confirmed meetup: ${meetupId}`);
      return;
    }

    // 모임 날짜가 오늘이 아니면 스킵 (9시 스케줄러가 처리)
    if (!isSameDay(meetupData.dateTime)) {
      logger.info(`📢 [MEETUP CREATED] Meetup is not today, will be handled by scheduler`);
      return;
    }

    // 현재 시간이 9시 이전이면 스킵 (9시 스케줄러가 처리)
    if (!isAfter9AM()) {
      logger.info(`📢 [MEETUP CREATED] Before 9 AM, will be handled by scheduler`);
      return;
    }

    // 9시 이후 당일 모임 → 즉시 알림 전송
    logger.info(`📢 [MEETUP CREATED] Same day after 9 AM - sending immediate notification`);

    try {
      const clubId = meetupData.clubId;
      const clubName = await getClubName(clubId);
      const tokens = await getClubMemberTokens(clubId);

      if (tokens.length === 0) {
        logger.info(`📢 [MEETUP CREATED] No tokens found for club members`);
        return;
      }

      const meetupTime = formatMeetupTime(meetupData.dateTime);
      const locationName = meetupData.location?.name;

      const result = await sendMeetupNotification(
        tokens,
        clubId,
        clubName,
        meetupId,
        meetupTime,
        locationName
      );

      // 🎾 [KIM] 피드 아이템 생성 (푸시 알림과 동시에)
      await createMeetupFeedItem(clubId, clubName, meetupId, meetupTime, locationName);

      // 알림 전송 완료 표시
      await event.data?.ref.update({
        notificationSent: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`📢 [MEETUP CREATED] Immediate notification sent`, {
        meetupId,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });
    } catch (error) {
      logger.error('📢 [MEETUP CREATED] Failed to send notification', { error, meetupId });
    }
  }
);
