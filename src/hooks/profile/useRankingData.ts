import { useState, useCallback, useEffect } from 'react';
import rankingService from '../../services/rankingService';

interface RankingData {
  monthly: { currentRank: number; totalPlayers: number; rankingType: 'monthly' } | null;
  season: { currentRank: number; totalPlayers: number; rankingType: 'season' } | null;
  alltime: { currentRank: number; totalPlayers: number; rankingType: 'alltime' } | null;
}

// 🆕 [KIM] Added gender parameter for gender-specific rankings
export const useRankingData = (userId: string | undefined, gender?: 'male' | 'female') => {
  const [rankingData, setRankingData] = useState<RankingData>({
    monthly: null,
    season: null,
    alltime: null,
  });
  const [rankingLoading, setRankingLoading] = useState(false);

  // 🏆 실시간 랭킹 데이터 로드 함수
  // 🎯 [KIM FIX] getPublicRankingByWinRate 사용 (평균 ELO 기반) - 통계 탭 "전체"와 동일한 데이터 소스
  const loadRankingData = useCallback(async () => {
    if (!userId) {
      console.log('🏆 [랭킹 로드] 사용자 프로필이 없어 랭킹 로드 건너뜀');
      return;
    }

    console.log('🏆 [랭킹 로드] 시작 - 사용자 ID:', userId);
    setRankingLoading(true);

    try {
      // 🎯 [KIM FIX] 월간, 시즌, 전체 랭킹을 병렬로 로드
      // getPublicRankingByWinRate 사용 (평균 ELO 기반) - 통계 탭의 "전체" 랭킹과 동일한 기준
      // 🆕 [KIM] Pass gender for gender-specific rankings
      const [monthlyRank, seasonRank, alltimeRank] = await Promise.all([
        rankingService.getPublicRankingByWinRate(userId, 'monthly', gender),
        rankingService.getPublicRankingByWinRate(userId, 'season', gender),
        rankingService.getPublicRankingByWinRate(userId, 'alltime', gender),
      ]);

      console.log('🏆 [랭킹 로드] 성공 (평균 ELO 기반):', {
        monthly: monthlyRank,
        season: seasonRank,
        alltime: alltimeRank,
      });

      setRankingData({
        monthly: { ...monthlyRank, rankingType: 'monthly' as const },
        season: { ...seasonRank, rankingType: 'season' as const },
        alltime: { ...alltimeRank, rankingType: 'alltime' as const },
      });
    } catch (error) {
      console.error('❌ [랭킹 로드] 실패:', error);
      // 에러 시 기본값 설정
      setRankingData({
        monthly: { currentRank: 0, totalPlayers: 0, rankingType: 'monthly' },
        season: { currentRank: 0, totalPlayers: 0, rankingType: 'season' },
        alltime: { currentRank: 0, totalPlayers: 0, rankingType: 'alltime' },
      });
    } finally {
      setRankingLoading(false);
    }
  }, [userId, gender]);

  // 🎯 [KIM FIX] Auto-load ranking data when userId is available
  useEffect(() => {
    if (userId) {
      loadRankingData();
    }
  }, [userId, loadRankingData]);

  return { rankingData, rankingLoading, loadRankingData };
};
