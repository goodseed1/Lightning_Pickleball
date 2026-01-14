/**
 * calculateDailyUserStats
 * 매일 자정(KST)에 실행되어 DAU/WAU/MAU 통계 집계
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

export const calculateDailyUserStats = onSchedule(
  {
    schedule: '0 0 * * *', // 매일 자정
    timeZone: 'Asia/Seoul',
    region: 'asia-northeast3',
  },
  async () => {
    try {
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // 시간 기준점 계산
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 모든 사용자 조회
      const usersSnapshot = await db.collection('users').get();
      const totalUsers = usersSnapshot.size;

      let dau = 0;
      let wau = 0;
      let mau = 0;

      // 각 사용자의 lastActiveAt 확인
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const lastActiveAt = userData.lastActiveAt;

        if (lastActiveAt) {
          const lastActiveDate = lastActiveAt.toDate();

          if (lastActiveDate >= oneDayAgo) {
            dau++;
          }
          if (lastActiveDate >= sevenDaysAgo) {
            wau++;
          }
          if (lastActiveDate >= thirtyDaysAgo) {
            mau++;
          }
        }
      });

      const calculatedAt = Timestamp.now();

      // 1. daily_stats 컬렉션에 저장 (히스토리용)
      await db.collection('daily_stats').doc(dateKey).set({
        date: dateKey,
        totalUsers,
        dau,
        wau,
        mau,
        calculatedAt,
      });

      // 2. _internal/appStats 문서에 최신 통계 저장 (실시간 대시보드용)
      await db.collection('_internal').doc('appStats').set({
        totalUsers,
        dau,
        wau,
        mau,
        lastCalculatedAt: calculatedAt,
        lastDateKey: dateKey,
      });

      console.log(`Daily stats calculated for ${dateKey}:`, {
        totalUsers,
        dau,
        wau,
        mau,
      });
      console.log('Updated _internal/appStats document for real-time dashboard');
    } catch (error) {
      console.error('Error calculating daily user stats:', error);
      throw error;
    }
  }
);
