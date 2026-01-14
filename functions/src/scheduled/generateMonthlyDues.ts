/**
 * 💰 [HEIMDALL] Scheduled Monthly Dues Generator
 *
 * 매일 실행되어 납부 마감일 10일 전에 해당 월 월회비 레코드를 생성합니다.
 *
 * 로직:
 * 1. 회비 설정이 있는 모든 클럽 조회
 * 2. 각 클럽의 납부 마감일(dueDate) 확인
 * 3. 오늘이 납부 마감일 10일 전인 경우에만 회비 생성
 * 4. 각 클럽의 활성 회원 조회
 * 5. 연회비 면제 기간 내인 회원 제외
 * 6. 나머지 회원에게 해당 월 월회비 레코드 생성
 *
 * Schedule: 매일 오전 9시 (한국 시간)
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 회원이 연회비 면제 기간 내인지 확인
 */
async function isYearlyExempted(
  clubId: string,
  userId: string,
  targetYear: number,
  targetMonth: number
): Promise<boolean> {
  try {
    const exemptionsRef = db.collection('member_yearly_exemptions');
    const q = exemptionsRef.where('clubId', '==', clubId).where('userId', '==', userId);

    const snapshot = await q.get();

    if (snapshot.empty) {
      return false;
    }

    for (const doc of snapshot.docs) {
      const exemption = doc.data();

      const checkDate = targetYear * 12 + targetMonth;
      const startDate = exemption.startYear * 12 + exemption.startMonth;
      const endDate = exemption.endYear * 12 + exemption.endMonth;

      if (checkDate >= startDate && checkDate <= endDate) {
        console.log(
          `✅ [MONTHLY DUES] Member ${userId} is exempted (yearly dues: ${exemption.startYear}/${exemption.startMonth} - ${exemption.endYear}/${exemption.endMonth})`
        );
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ [MONTHLY DUES] Error checking yearly exemption:', error);
    return false;
  }
}

/**
 * 회원이 분기 회비 면제 기간 내인지 확인
 */
async function isQuarterlyExempted(
  clubId: string,
  userId: string,
  targetYear: number,
  targetMonth: number
): Promise<boolean> {
  try {
    const exemptionsRef = db.collection('member_quarterly_exemptions');
    const q = exemptionsRef.where('clubId', '==', clubId).where('userId', '==', userId);

    const snapshot = await q.get();

    if (snapshot.empty) {
      return false;
    }

    for (const doc of snapshot.docs) {
      const exemption = doc.data();

      const checkDate = targetYear * 12 + targetMonth;
      const startDate = exemption.startYear * 12 + exemption.startMonth;
      const endDate = exemption.endYear * 12 + exemption.endMonth;

      if (checkDate >= startDate && checkDate <= endDate) {
        console.log(
          `✅ [MONTHLY DUES] Member ${userId} is exempted (quarterly dues: ${exemption.startYear}/${exemption.startMonth} - ${exemption.endYear}/${exemption.endMonth})`
        );
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ [MONTHLY DUES] Error checking quarterly exemption:', error);
    return false;
  }
}

/**
 * 회원이 커스텀 금액 면제 기간 내인지 확인
 */
async function isCustomExempted(
  clubId: string,
  userId: string,
  targetYear: number,
  targetMonth: number
): Promise<boolean> {
  try {
    const exemptionsRef = db.collection('member_custom_exemptions');
    const q = exemptionsRef.where('clubId', '==', clubId).where('userId', '==', userId);

    const snapshot = await q.get();

    if (snapshot.empty) {
      return false;
    }

    for (const doc of snapshot.docs) {
      const exemption = doc.data();

      const checkDate = targetYear * 12 + targetMonth;
      const startDate = exemption.startYear * 12 + exemption.startMonth;
      const endDate = exemption.endYear * 12 + exemption.endMonth;

      if (checkDate >= startDate && checkDate <= endDate) {
        console.log(
          `✅ [MONTHLY DUES] Member ${userId} is exempted (custom dues: ${exemption.startYear}/${exemption.startMonth} - ${exemption.endYear}/${exemption.endMonth})`
        );
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ [MONTHLY DUES] Error checking custom exemption:', error);
    return false;
  }
}

/**
 * 특정 월에 적용할 크레딧 조회
 */
async function getMonthCredit(
  clubId: string,
  userId: string,
  targetYear: number,
  targetMonth: number
): Promise<number> {
  try {
    const exemptionsRef = db.collection('member_custom_exemptions');
    const q = exemptionsRef.where('clubId', '==', clubId).where('userId', '==', userId);

    const snapshot = await q.get();

    for (const doc of snapshot.docs) {
      const exemption = doc.data();

      if (
        exemption.creditApplyYear === targetYear &&
        exemption.creditApplyMonth === targetMonth &&
        exemption.remainingCredit > 0
      ) {
        console.log(
          `💰 [MONTHLY DUES] Member ${userId} has credit: $${exemption.remainingCredit} for ${targetYear}/${targetMonth}`
        );
        return exemption.remainingCredit;
      }
    }

    return 0;
  } catch (error) {
    console.error('❌ [MONTHLY DUES] Error getting month credit:', error);
    return 0;
  }
}

/**
 * 회원이 월회비 면제 기간 내인지 확인 (연회비, 분기회비, 또는 커스텀)
 */
async function isMemberExemptedFromMonthlyDues(
  clubId: string,
  userId: string,
  targetYear: number,
  targetMonth: number
): Promise<boolean> {
  // 연회비 면제 확인
  const yearlyExempted = await isYearlyExempted(clubId, userId, targetYear, targetMonth);
  if (yearlyExempted) return true;

  // 분기 회비 면제 확인
  const quarterlyExempted = await isQuarterlyExempted(clubId, userId, targetYear, targetMonth);
  if (quarterlyExempted) return true;

  // 커스텀 금액 면제 확인
  const customExempted = await isCustomExempted(clubId, userId, targetYear, targetMonth);
  return customExempted;
}

/**
 * 이미 해당 월의 회비 레코드가 있는지 확인
 */
async function hasExistingMonthlyRecord(
  clubId: string,
  userId: string,
  year: number,
  month: number
): Promise<boolean> {
  const recordsRef = db.collection('member_dues_records');
  const q = recordsRef
    .where('clubId', '==', clubId)
    .where('userId', '==', userId)
    .where('duesType', '==', 'monthly')
    .where('period.year', '==', year)
    .where('period.month', '==', month);

  const snapshot = await q.get();
  return !snapshot.empty;
}

/**
 * 월회비 레코드 생성
 * @param creditApplied 크레딧 적용 금액 (있는 경우)
 */
async function createMonthlyDuesRecord(
  clubId: string,
  userId: string,
  year: number,
  month: number,
  amount: number,
  currency: string,
  creditApplied?: number
): Promise<void> {
  const finalAmount = creditApplied ? Math.max(0, amount - creditApplied) : amount;

  const record: Record<string, unknown> = {
    clubId,
    userId,
    duesType: 'monthly',
    period: {
      year,
      month,
    },
    amount: finalAmount,
    currency,
    status: 'unpaid',
    reminderCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // 크레딧이 적용된 경우 원래 금액과 적용된 크레딧 기록
  if (creditApplied && creditApplied > 0) {
    record.originalAmount = amount;
    record.creditApplied = creditApplied;
    record.notes = `크레딧 $${creditApplied} 적용 (원래 금액: $${amount})`;
  }

  await db.collection('member_dues_records').add(record);
}

/**
 * 납부 마감일 10일 전인지 확인
 * @param dueDay 클럽의 납부 마감일 (1-31)
 * @param today 오늘 날짜
 * @returns 10일 전이면 true, 아니면 false
 */
function shouldGenerateDues(dueDay: number, today: Date): boolean {
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 이번 달 납부 마감일
  let targetDueDate = new Date(currentYear, currentMonth, dueDay);

  // 만약 이번 달 마감일이 이미 지났다면 다음 달 마감일 기준
  if (targetDueDate < today) {
    targetDueDate = new Date(currentYear, currentMonth + 1, dueDay);
  }

  // 10일 전 날짜 계산
  const tenDaysBefore = new Date(targetDueDate);
  tenDaysBefore.setDate(tenDaysBefore.getDate() - 10);

  // 오늘이 10일 전인지 확인 (날짜만 비교)
  const todayDateOnly = new Date(currentYear, currentMonth, currentDay);
  const tenDaysBeforeDateOnly = new Date(
    tenDaysBefore.getFullYear(),
    tenDaysBefore.getMonth(),
    tenDaysBefore.getDate()
  );

  return todayDateOnly.getTime() === tenDaysBeforeDateOnly.getTime();
}

/**
 * 메인 스케줄러 함수
 * 매일 오전 3시(미국 동부시간) 실행
 * 각 클럽의 납부 마감일 10일 전에 해당 월 회비 생성
 */
export const generateMonthlyDues = onSchedule(
  {
    schedule: '0 3 * * *', // 매일 오전 3시 (미국 동부시간)
    timeZone: 'America/New_York',
    retryCount: 3,
  },
  async () => {
    console.log('💰 [MONTHLY DUES] Starting daily dues generation check...');

    const now = new Date();
    const currentDay = now.getDate();
    console.log(`📅 [MONTHLY DUES] Today is ${now.toISOString().split('T')[0]}, day ${currentDay}`);

    try {
      // 1. 모든 클럽의 회비 설정 조회
      const clubsRef = db.collection('tennis_clubs');
      const clubsSnapshot = await clubsRef.get();

      let totalRecordsCreated = 0;
      let totalMembersSkipped = 0;
      let totalClubsProcessed = 0;

      for (const clubDoc of clubsSnapshot.docs) {
        const clubId = clubDoc.id;
        const clubData = clubDoc.data();
        const settings = clubData.settings || {};

        // 월회비 금액이 설정되어 있지 않으면 스킵
        const monthlyFee = settings.membershipFee || settings.monthlyFee || 0;
        if (monthlyFee <= 0) {
          continue;
        }

        // 납부 마감일 (기본값: 25일)
        const dueDay = settings.dueDate || settings.dueDay || 25;

        // 오늘이 납부 마감일 10일 전인지 확인
        if (!shouldGenerateDues(dueDay, now)) {
          continue;
        }

        totalClubsProcessed++;
        const currency = settings.currency || 'USD';

        // 이번 달 또는 다음 달 회비 생성 (10일 전이 속한 달 기준)
        let targetMonth = now.getMonth() + 1; // 1-based month
        let targetYear = now.getFullYear();

        // 마감일이 이번 달보다 앞에 있으면 다음 달 회비
        if (dueDay < currentDay + 10) {
          targetMonth++;
          if (targetMonth > 12) {
            targetMonth = 1;
            targetYear++;
          }
        }

        console.log(
          `🏢 [MONTHLY DUES] Processing club ${clubId}: dueDay=${dueDay}, generating ${targetYear}/${targetMonth} dues`
        );

        // 2. 활성 회원 조회
        const membersRef = db.collection('clubMembers');
        const membersQuery = membersRef
          .where('clubId', '==', clubId)
          .where('status', '==', 'active');

        const membersSnapshot = await membersQuery.get();
        console.log(`👥 [MONTHLY DUES] Found ${membersSnapshot.size} active members`);

        for (const memberDoc of membersSnapshot.docs) {
          const memberData = memberDoc.data();
          const userId = memberData.userId;

          // 3. 이미 레코드가 있는지 확인
          const hasRecord = await hasExistingMonthlyRecord(clubId, userId, targetYear, targetMonth);
          if (hasRecord) {
            console.log(`⏭️ [MONTHLY DUES] Record already exists for user ${userId}, skipping`);
            totalMembersSkipped++;
            continue;
          }

          // 4. 연회비/분기회비/커스텀 면제 기간인지 확인
          const isExempted = await isMemberExemptedFromMonthlyDues(
            clubId,
            userId,
            targetYear,
            targetMonth
          );

          if (isExempted) {
            totalMembersSkipped++;
            continue;
          }

          // 5. 크레딧이 있는지 확인
          const credit = await getMonthCredit(clubId, userId, targetYear, targetMonth);

          // 6. 월회비 레코드 생성 (크레딧 있으면 차감)
          await createMonthlyDuesRecord(
            clubId,
            userId,
            targetYear,
            targetMonth,
            monthlyFee,
            currency,
            credit > 0 ? credit : undefined
          );

          totalRecordsCreated++;
          if (credit > 0) {
            console.log(
              `✅ [MONTHLY DUES] Created record for user ${userId} with credit $${credit} applied`
            );
          } else {
            console.log(`✅ [MONTHLY DUES] Created record for user ${userId}`);
          }
        }
      }

      console.log(`🎉 [MONTHLY DUES] Completed!`);
      console.log(`   - Clubs processed: ${totalClubsProcessed}`);
      console.log(`   - Records created: ${totalRecordsCreated}`);
      console.log(`   - Members skipped: ${totalMembersSkipped}`);
    } catch (error) {
      console.error('❌ [MONTHLY DUES] Error generating monthly dues:', error);
      throw error;
    }
  }
);

/**
 * 수동 실행용 HTTP 함수 (테스트/관리용)
 */
export const generateMonthlyDuesManual = async (
  clubId?: string,
  targetYear?: number,
  targetMonth?: number
): Promise<{ created: number; skipped: number }> => {
  const now = new Date();
  const year = targetYear || now.getFullYear();
  let month = targetMonth || now.getMonth() + 2;

  if (month > 12) {
    month = month - 12;
  }

  console.log(`💰 [MONTHLY DUES MANUAL] Generating dues for ${year}/${month}`);

  let totalCreated = 0;
  let totalSkipped = 0;

  const clubsQuery = clubId
    ? db.collection('tennis_clubs').where(admin.firestore.FieldPath.documentId(), '==', clubId)
    : db.collection('tennis_clubs');

  const clubsSnapshot = await clubsQuery.get();

  for (const clubDoc of clubsSnapshot.docs) {
    const cId = clubDoc.id;
    const clubData = clubDoc.data();
    const settings = clubData.settings || {};

    const monthlyFee = settings.membershipFee || settings.monthlyFee || 0;
    if (monthlyFee <= 0) continue;

    const currency = settings.currency || 'USD';

    const membersRef = db.collection('clubMembers');
    const membersQuery = membersRef.where('clubId', '==', cId).where('status', '==', 'active');

    const membersSnapshot = await membersQuery.get();

    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const userId = memberData.userId;

      const hasRecord = await hasExistingMonthlyRecord(cId, userId, year, month);
      if (hasRecord) {
        totalSkipped++;
        continue;
      }

      const isExempted = await isMemberExemptedFromMonthlyDues(cId, userId, year, month);
      if (isExempted) {
        totalSkipped++;
        continue;
      }

      await createMonthlyDuesRecord(cId, userId, year, month, monthlyFee, currency);
      totalCreated++;
    }
  }

  return { created: totalCreated, skipped: totalSkipped };
};
