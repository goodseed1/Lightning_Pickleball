/**
 * 💰 [HEIMDALL] Scheduled Dues Status Updater
 *
 * 매일 실행되어 마감일이 지난 미납 회비의 상태를 업데이트합니다.
 * ⚠️ 알림은 자동 발송하지 않음! 관리자가 "독려 알림" 버튼을 누를 때만 발송됨.
 *
 * 로직:
 * 1. 미납(unpaid) 상태인 모든 회비 레코드 조회
 * 2. 마감일(dueDay) 기준으로 연체 여부 확인
 * 3. 상태를 overdue로 업데이트 (알림은 발송하지 않음)
 *
 * Schedule: 매일 오전 10시 (한국 시간)
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
// 연체 알림용 import (sendDuesSoonReminders에서 사용)
import { sendExpoPushNotification, getUserPushToken } from '../utils/clubNotificationSender';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 클럽의 회비 마감일 정보 조회
 */
async function getClubDueDay(clubId: string): Promise<number> {
  try {
    // club_dues_settings에서 조회
    const settingsRef = db.collection('club_dues_settings');
    const q = settingsRef.where('clubId', '==', clubId).where('isActive', '==', true).limit(1);

    const snapshot = await q.get();

    if (!snapshot.empty) {
      const settings = snapshot.docs[0].data();
      return settings.dueDay || 25; // 기본값 25일
    }

    // pickleball_clubs에서 조회
    const clubRef = db.doc(`pickleball_clubs/${clubId}`);
    const clubSnap = await clubRef.get();

    if (clubSnap.exists) {
      const clubData = clubSnap.data();
      return clubData?.settings?.dueDay || 25;
    }

    return 25; // 기본값
  } catch (error) {
    console.error('❌ [DUES REMINDER] Error getting club due day:', error);
    return 25;
  }
}

/**
 * 클럽 이름 조회
 */
async function getClubName(clubId: string): Promise<string> {
  try {
    const clubRef = db.doc(`pickleball_clubs/${clubId}`);
    const clubSnap = await clubRef.get();

    if (!clubSnap.exists) {
      return 'Unknown Club';
    }

    const clubData = clubSnap.data();
    return clubData?.profile?.name || clubData?.name || 'Unknown Club';
  } catch {
    return 'Unknown Club';
  }
}

/**
 * 회비 유형 한글 변환
 */
function getDuesTypeKo(duesType: string): string {
  const types: { [key: string]: string } = {
    join: '가입비',
    monthly: '월회비',
    yearly: '연회비',
    late_fee: '연체료',
  };
  return types[duesType] || '회비';
}

/**
 * 기간 표시 문자열 생성
 */
function getPeriodString(duesType: string, period?: { year?: number; month?: number }): string {
  if (!period) return '';

  if (duesType === 'monthly' && period.month) {
    return `${period.year}년 ${period.month}월`;
  } else if (duesType === 'yearly') {
    return `${period.year}년`;
  }
  return '';
}

/**
 * 메인 스케줄러 함수
 * 매일 오전 10시(한국시간) 실행
 */
export const sendDuesReminders = onSchedule(
  {
    schedule: '0 1 * * *', // 매일 UTC 1시 (한국시간 오전 10시)
    timeZone: 'Asia/Seoul',
    retryCount: 3,
  },
  async () => {
    console.log('💰 [DUES STATUS] Starting daily dues status check...');

    const now = new Date();

    try {
      // 1. 미납(unpaid) 상태인 모든 회비 레코드 조회
      const recordsRef = db.collection('member_dues_records');
      const unpaidQuery = recordsRef.where('status', '==', 'unpaid');

      const snapshot = await unpaidQuery.get();
      console.log(`📋 [DUES STATUS] Found ${snapshot.size} unpaid records`);

      let overdueCount = 0;

      // 클럽별 마감일 캐시
      const clubDueDayCache: { [clubId: string]: number } = {};

      for (const doc of snapshot.docs) {
        const record = doc.data();
        const recordId = doc.id;
        const { clubId, userId, duesType, period } = record;

        // 클럽 마감일 조회 (캐시 사용)
        if (!clubDueDayCache[clubId]) {
          clubDueDayCache[clubId] = await getClubDueDay(clubId);
        }
        const dueDay = clubDueDayCache[clubId];

        // 연체 여부 확인
        let isOverdue = false;

        if (duesType === 'monthly' && period?.year && period?.month) {
          // 월회비: 해당 월의 마감일 기준 (예: 1월 회비 → 1월 25일 마감)
          // period.month는 1-12, Date 생성자의 month는 0-11이므로 -1
          const dueDate = new Date(period.year, period.month - 1, dueDay);
          isOverdue = now > dueDate;
        } else if (duesType === 'yearly' && period?.year) {
          // 연회비: 전년도 12월 마감일 기준
          const dueDate = new Date(period.year - 1, 11, dueDay);
          isOverdue = now > dueDate;
        } else if (duesType === 'join') {
          // 가입비: 생성 후 30일 기준
          const createdAt = record.createdAt?.toDate();
          if (createdAt) {
            const dueDate = new Date(createdAt);
            dueDate.setDate(dueDate.getDate() + 30);
            isOverdue = now > dueDate;
          }
        }

        if (!isOverdue) {
          continue;
        }

        overdueCount++;

        // 2. 상태를 overdue로 업데이트 (알림은 발송하지 않음 - 관리자가 수동으로 "독려 알림" 버튼 클릭 시에만 발송)
        await doc.ref.update({
          status: 'overdue',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`📝 [DUES STATUS] Updated record ${recordId} to overdue for user ${userId}`);
      }

      console.log(`🎉 [DUES STATUS] Completed!`);
      console.log(`   - Overdue records updated: ${overdueCount}`);
    } catch (error) {
      console.error('❌ [DUES REMINDER] Error:', error);
      throw error;
    }
  }
);

/**
 * 마감 임박 알림 (마감 3일 전)
 * 매일 오전 9시(한국시간) 실행
 */
export const sendDuesSoonReminders = onSchedule(
  {
    schedule: '0 0 * * *', // 매일 UTC 0시 (한국시간 오전 9시)
    timeZone: 'Asia/Seoul',
    retryCount: 3,
  },
  async () => {
    console.log('💰 [DUES SOON] Starting dues soon reminder check...');

    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    try {
      // 미납 상태인 모든 회비 레코드 조회
      const recordsRef = db.collection('member_dues_records');
      const unpaidQuery = recordsRef.where('status', '==', 'unpaid');

      const snapshot = await unpaidQuery.get();

      let remindersSent = 0;

      const clubDueDayCache: { [clubId: string]: number } = {};
      const clubNameCache: { [clubId: string]: string } = {};

      for (const doc of snapshot.docs) {
        const record = doc.data();
        const { clubId, userId, duesType, period, amount } = record;

        if (!clubDueDayCache[clubId]) {
          clubDueDayCache[clubId] = await getClubDueDay(clubId);
          clubNameCache[clubId] = await getClubName(clubId);
        }
        const dueDay = clubDueDayCache[clubId];
        const clubName = clubNameCache[clubId];

        // 마감 3일 전인지 확인
        let isDueSoon = false;
        let dueDate: Date | null = null;

        if (duesType === 'monthly' && period?.year && period?.month) {
          // 월회비: 해당 월의 마감일 기준 (예: 1월 회비 → 1월 25일 마감)
          // period.month는 1-12, Date 생성자의 month는 0-11이므로 -1
          dueDate = new Date(period.year, period.month - 1, dueDay);
        } else if (duesType === 'yearly' && period?.year) {
          // 연회비: 전년도 12월 마감일 기준
          dueDate = new Date(period.year - 1, 11, dueDay);
        }

        if (dueDate) {
          const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          isDueSoon = diffDays > 0 && diffDays <= 3;
        }

        if (!isDueSoon) {
          continue;
        }

        // 알림 발송
        const pushToken = await getUserPushToken(userId);

        if (pushToken) {
          const duesTypeKo = getDuesTypeKo(duesType);
          const periodStr = getPeriodString(duesType, period);
          const title = '📅 회비 납부 마감 임박';
          const body = `${clubName} ${periodStr} ${duesTypeKo} 납부 마감일이 3일 남았습니다.`;

          await sendExpoPushNotification(pushToken, title, body, {
            type: 'dues_due_soon',
            notificationType: 'DUES_DUE_SOON',
            clubId,
            duesType,
            amount,
          });

          // 인앱 알림 저장 (notifications 컬렉션)
          const recordId = doc.id;
          await db.collection('notifications').add({
            recipientId: userId,
            type: 'DUES_DUE_SOON',
            clubId: clubId,
            message: body,
            amount: amount,
            duesType: duesType,
            period: periodStr,
            status: 'unread',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              notificationType: 'dues_due_soon',
              actionRequired: true,
              recordId: recordId,
              deepLink: `club/${clubId}/my-dues`,
            },
          });

          remindersSent++;
        }
      }

      console.log(`🎉 [DUES SOON] Completed! Reminders sent: ${remindersSent}`);
    } catch (error) {
      console.error('❌ [DUES SOON] Error:', error);
      throw error;
    }
  }
);
