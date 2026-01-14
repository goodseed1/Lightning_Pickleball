/**
 * 💰 [HEIMDALL] Annual Dues Report Generator
 *
 * 매년 1월 1일 자동 실행되어 전년도 회비 수입 보고서를 생성합니다.
 *
 * 보고서 내용:
 * - 회원 통계 (총 회원, 활성 회원, 신규 회원)
 * - 수입 요약 (총 수입, 회비 유형별 수입)
 * - 월별 수입 내역
 * - 미수금 및 연체금
 * - 징수율
 *
 * Schedule: 매년 1월 2일 오전 9시 (한국 시간)
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface MonthlyBreakdown {
  month: number;
  joinFee: number;
  monthlyDues: number;
  yearlyDues: number;
  lateFee: number;
  total: number;
  paidCount: number;
}

/**
 * 특정 클럽의 연간 보고서 생성
 */
async function generateClubAnnualReport(clubId: string, year: number): Promise<void> {
  console.log(`📊 [ANNUAL REPORT] Generating report for club ${clubId}, year ${year}`);

  try {
    // 1. 해당 연도의 모든 납부 기록 조회
    const recordsRef = db.collection('member_dues_records');

    // 납부 완료된 기록 조회
    const paidRecordsQuery = recordsRef.where('clubId', '==', clubId).where('status', '==', 'paid');

    const paidSnapshot = await paidRecordsQuery.get();

    // 미납/연체 기록 조회
    const unpaidRecordsQuery = recordsRef
      .where('clubId', '==', clubId)
      .where('status', 'in', ['unpaid', 'overdue']);

    const unpaidSnapshot = await unpaidRecordsQuery.get();

    // 2. 회원 통계 조회
    const membersRef = db.collection('clubMembers');
    const activeMembersQuery = membersRef
      .where('clubId', '==', clubId)
      .where('status', '==', 'active');

    const membersSnapshot = await activeMembersQuery.get();
    const totalMembers = membersSnapshot.size;

    // 해당 연도에 가입한 신규 회원 수
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    let newMembers = 0;

    membersSnapshot.forEach(doc => {
      const memberData = doc.data();
      const joinedAt = memberData.joinedAt?.toDate() || memberData.createdAt?.toDate();
      if (joinedAt && joinedAt >= startOfYear && joinedAt <= endOfYear) {
        newMembers++;
      }
    });

    // 3. 수입 집계
    let joinFeeRevenue = 0;
    let monthlyDuesRevenue = 0;
    let yearlyDuesRevenue = 0;
    let lateFeeRevenue = 0;

    const monthlyBreakdown: MonthlyBreakdown[] = [];
    for (let i = 1; i <= 12; i++) {
      monthlyBreakdown.push({
        month: i,
        joinFee: 0,
        monthlyDues: 0,
        yearlyDues: 0,
        lateFee: 0,
        total: 0,
        paidCount: 0,
      });
    }

    // 납부 완료 기록 집계
    paidSnapshot.forEach(doc => {
      const record = doc.data();
      const paidAt = record.paidAt?.toDate();

      // 해당 연도에 납부된 건만 집계
      if (!paidAt || paidAt.getFullYear() !== year) {
        return;
      }

      const amount = record.paidAmount || record.amount || 0;
      const month = paidAt.getMonth(); // 0-based

      switch (record.duesType) {
        case 'join':
          joinFeeRevenue += amount;
          monthlyBreakdown[month].joinFee += amount;
          break;
        case 'monthly':
          monthlyDuesRevenue += amount;
          monthlyBreakdown[month].monthlyDues += amount;
          break;
        case 'yearly':
          yearlyDuesRevenue += amount;
          monthlyBreakdown[month].yearlyDues += amount;
          break;
        case 'late_fee':
          lateFeeRevenue += amount;
          monthlyBreakdown[month].lateFee += amount;
          break;
      }

      monthlyBreakdown[month].total += amount;
      monthlyBreakdown[month].paidCount++;
    });

    const totalRevenue = joinFeeRevenue + monthlyDuesRevenue + yearlyDuesRevenue + lateFeeRevenue;

    // 4. 미수금 집계
    let totalOutstanding = 0;
    let overdueAmount = 0;

    unpaidSnapshot.forEach(doc => {
      const record = doc.data();
      const amount = record.amount || 0;

      // 해당 연도 기록만 집계
      const period = record.period;
      if (period?.year === year || record.duesType === 'join') {
        totalOutstanding += amount;

        if (record.status === 'overdue') {
          overdueAmount += amount;
        }
      }
    });

    // 5. 징수율 계산
    const expectedRevenue = totalRevenue + totalOutstanding;
    const collectionRate = expectedRevenue > 0 ? (totalRevenue / expectedRevenue) * 100 : 100;

    // 6. 통화 조회
    const clubRef = db.doc(`pickleball_clubs/${clubId}`);
    const clubSnap = await clubRef.get();
    const currency = clubSnap.data()?.settings?.currency || 'USD';

    // 7. 보고서 저장
    const report = {
      clubId,
      year,
      totalMembers,
      activeMembers: totalMembers,
      newMembers,
      totalRevenue,
      currency,
      joinFeeRevenue,
      monthlyDuesRevenue,
      yearlyDuesRevenue,
      lateFeeRevenue,
      monthlyBreakdown,
      totalOutstanding,
      overdueAmount,
      collectionRate: Math.round(collectionRate * 100) / 100,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 기존 보고서가 있으면 업데이트, 없으면 생성
    const reportRef = db.collection('annual_dues_reports');
    const existingQuery = reportRef.where('clubId', '==', clubId).where('year', '==', year);

    const existingSnapshot = await existingQuery.get();

    if (!existingSnapshot.empty) {
      await existingSnapshot.docs[0].ref.update(report);
      console.log(`✅ [ANNUAL REPORT] Updated existing report for club ${clubId}`);
    } else {
      await reportRef.add(report);
      console.log(`✅ [ANNUAL REPORT] Created new report for club ${clubId}`);
    }

    console.log(`📊 [ANNUAL REPORT] Club ${clubId} Summary:`);
    console.log(`   - Total Revenue: ${currency} ${totalRevenue.toLocaleString()}`);
    console.log(`   - Collection Rate: ${collectionRate.toFixed(1)}%`);
    console.log(`   - Outstanding: ${currency} ${totalOutstanding.toLocaleString()}`);
  } catch (error) {
    console.error(`❌ [ANNUAL REPORT] Error generating report for club ${clubId}:`, error);
    throw error;
  }
}

/**
 * 메인 스케줄러 함수
 * 매년 1월 2일 오전 9시(한국시간) 실행
 */
export const generateAnnualDuesReports = onSchedule(
  {
    schedule: '0 0 2 1 *', // 매년 1월 2일 UTC 0시
    timeZone: 'Asia/Seoul',
    retryCount: 3,
  },
  async () => {
    console.log('📊 [ANNUAL REPORT] Starting annual report generation...');

    const previousYear = new Date().getFullYear() - 1;

    try {
      // 모든 클럽 조회
      const clubsRef = db.collection('pickleball_clubs');
      const clubsSnapshot = await clubsRef.get();

      console.log(
        `🏢 [ANNUAL REPORT] Processing ${clubsSnapshot.size} clubs for year ${previousYear}`
      );

      for (const clubDoc of clubsSnapshot.docs) {
        try {
          await generateClubAnnualReport(clubDoc.id, previousYear);
        } catch (error) {
          console.error(`❌ [ANNUAL REPORT] Failed for club ${clubDoc.id}:`, error);
          // 개별 클럽 실패해도 계속 진행
        }
      }

      console.log('🎉 [ANNUAL REPORT] Annual report generation completed!');
    } catch (error) {
      console.error('❌ [ANNUAL REPORT] Error:', error);
      throw error;
    }
  }
);

/**
 * 수동 보고서 생성 함수 (HTTP Callable)
 */
export const generateAnnualReportManual = async (
  clubId: string,
  year: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    await generateClubAnnualReport(clubId, year);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
