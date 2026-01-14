/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db as firestore } from '../firebase/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import i18n from '../i18n';

export interface UserPerformanceData {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageMatchRating: number;
  skillLevelHistory: SkillLevelHistory[];
  timeSlotPerformance: TimeSlotPerformance;
  opponentTypePerformance: OpponentTypePerformance;
  playingFrequency: PlayingFrequency;
  currentStreak: number;
  bestStreak: number;
}

export interface SkillLevelHistory {
  date: string;
  skillLevel: number;
  ntrpRating: number;
  improvement: number;
}

export interface TimeSlotPerformance {
  morning: { matches: number; wins: number; winRate: number };
  afternoon: { matches: number; wins: number; winRate: number };
  evening: { matches: number; wins: number; winRate: number };
}

export interface OpponentTypePerformance {
  beginners: { matches: number; wins: number; winRate: number };
  intermediate: { matches: number; wins: number; winRate: number };
  advanced: { matches: number; wins: number; winRate: number };
}

export interface PlayingFrequency {
  averagePerWeek: number;
  averagePerMonth: number;
  totalActiveDays: number;
  longestActiveStreak: number;
}

export interface PerformanceTrend {
  metric: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  confidence: number;
}

export interface PerformanceInsight {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  title: string;
  description: string;
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export interface MonthlyReport {
  month: string;
  year: number;
  highlights: string[];
  improvements: string[];
  nextMonthGoals: string[];
  overallRating: number;
  keyMetrics: {
    matchesPlayed: number;
    winRateImprovement: number;
    skillLevelGrowth: number;
    consistencyScore: number;
  };
}

interface CachedData {
  data: unknown;
  timestamp: number;
}

class PerformanceAnalyticsService {
  private static instance: PerformanceAnalyticsService;
  private cache = new Map<string, CachedData>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5분

  static getInstance(): PerformanceAnalyticsService {
    if (!PerformanceAnalyticsService.instance) {
      PerformanceAnalyticsService.instance = new PerformanceAnalyticsService();
    }
    return PerformanceAnalyticsService.instance;
  }

  // 사용자 성과 데이터 생성
  async generateUserPerformanceData(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ): Promise<UserPerformanceData> {
    const cacheKey = `performance_${userId}_${period}`;

    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return cached.data as any;
      }
    }

    try {
      // Firestore에서 사용자 매치 데이터 가져오기
      const matchesQuery = query(
        collection(firestore, 'matches'),
        where('participants', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );

      const matchSnapshot = await getDocs(matchesQuery);
      const matches = matchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 기간별 필터링
      const filteredMatches = this.filterMatchesByPeriod(matches, period);

      // 성과 데이터 계산
      const performanceData = this.calculatePerformanceMetrics(userId, filteredMatches, period);

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: performanceData,
        timestamp: Date.now(),
      });

      return performanceData;
    } catch (error) {
      console.error('Error generating performance data:', error);
      // 시뮬레이션 데이터 반환
      return this.generateSimulationData(userId, period);
    }
  }

  // 성과 트렌드 분석
  async analyzePerformanceTrends(userId: string): Promise<PerformanceTrend[]> {
    const cacheKey = `trends_${userId}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return cached.data as any;
      }
    }

    // 최근 3개월 데이터 분석
    const currentMonth = await this.generateUserPerformanceData(userId, 'monthly');

    // 트렌드 계산 (시뮬레이션)
    const trends: PerformanceTrend[] = [
      {
        metric: 'Win Rate',
        trend: currentMonth.winRate > 50 ? 'up' : currentMonth.winRate < 40 ? 'down' : 'stable',
        change: Math.random() * 10 - 5, // -5% ~ +5%
        confidence: 0.85,
      },
      {
        metric: 'Match Quality',
        trend: currentMonth.averageMatchRating > 4.0 ? 'up' : 'stable',
        change: Math.random() * 0.5,
        confidence: 0.78,
      },
      {
        metric: 'Playing Frequency',
        trend: currentMonth.playingFrequency.averagePerWeek > 2 ? 'up' : 'stable',
        change: Math.random() * 1.5,
        confidence: 0.72,
      },
    ];

    this.cache.set(cacheKey, {
      data: trends,
      timestamp: Date.now(),
    });

    return trends;
  }

  // 성과 인사이트 생성
  async generatePerformanceInsights(userId: string): Promise<PerformanceInsight[]> {
    const performanceData = await this.generateUserPerformanceData(userId);
    const insights: PerformanceInsight[] = [];

    // 강점 분석
    if (performanceData.winRate > 60) {
      insights.push({
        id: 'strength_winrate',
        type: 'strength',
        title: i18n.t('services.performanceAnalytics.insights.highWinRate.title'),
        description: i18n.t('services.performanceAnalytics.insights.highWinRate.description', {
          winRate: performanceData.winRate.toFixed(1),
        }),
        recommendations: [
          i18n.t('services.performanceAnalytics.insights.highWinRate.recommendations.maintain'),
          i18n.t('services.performanceAnalytics.insights.highWinRate.recommendations.challenge'),
        ],
        priority: 'medium',
        createdAt: new Date(),
      });
    }

    // 개선 기회
    if (performanceData.playingFrequency.averagePerWeek < 2) {
      insights.push({
        id: 'opportunity_frequency',
        type: 'opportunity',
        title: i18n.t('services.performanceAnalytics.insights.lowFrequency.title'),
        description: i18n.t('services.performanceAnalytics.insights.lowFrequency.description', {
          frequency: performanceData.playingFrequency.averagePerWeek.toFixed(1),
        }),
        recommendations: [
          i18n.t('services.performanceAnalytics.insights.lowFrequency.recommendations.setGoal'),
          i18n.t('services.performanceAnalytics.insights.lowFrequency.recommendations.schedule'),
        ],
        priority: 'high',
        createdAt: new Date(),
      });
    }

    // 시간대별 성과 분석
    const bestTimeSlot = this.findBestTimeSlot(performanceData.timeSlotPerformance);
    insights.push({
      id: 'pattern_timeslot',
      type: 'strength',
      title: i18n.t('services.performanceAnalytics.insights.bestTimeSlot.title', {
        timeSlot: bestTimeSlot,
      }),
      description: i18n.t('services.performanceAnalytics.insights.bestTimeSlot.description', {
        timeSlot: bestTimeSlot,
      }),
      recommendations: [
        i18n.t('services.performanceAnalytics.insights.bestTimeSlot.recommendations.increase', {
          timeSlot: bestTimeSlot,
        }),
        i18n.t('services.performanceAnalytics.insights.bestTimeSlot.recommendations.analyze'),
      ],
      priority: 'medium',
      createdAt: new Date(),
    });

    return insights;
  }

  // 월간 리포트 생성
  async generateMonthlyReport(userId: string): Promise<MonthlyReport> {
    const performanceData = await this.generateUserPerformanceData(userId, 'monthly');
    const now = new Date();

    return {
      month: now.toLocaleString('ko-KR', { month: 'long' }),
      year: now.getFullYear(),
      highlights: [
        i18n.t('services.performanceAnalytics.monthlyReport.highlights.matchesCompleted', {
          count: performanceData.totalMatches,
        }),
        i18n.t('services.performanceAnalytics.monthlyReport.highlights.winRateAchieved', {
          winRate: performanceData.winRate.toFixed(1),
        }),
        i18n.t('services.performanceAnalytics.monthlyReport.highlights.bestStreak', {
          streak: performanceData.bestStreak,
        }),
      ],
      improvements: [
        i18n.t('services.performanceAnalytics.monthlyReport.improvements.backhandStability'),
        i18n.t('services.performanceAnalytics.monthlyReport.improvements.serveSpeed'),
        i18n.t('services.performanceAnalytics.monthlyReport.improvements.netPlay'),
      ],
      nextMonthGoals: [
        i18n.t('services.performanceAnalytics.monthlyReport.nextMonthGoals.practiceFrequency'),
        i18n.t('services.performanceAnalytics.monthlyReport.nextMonthGoals.winRateTarget'),
        i18n.t('services.performanceAnalytics.monthlyReport.nextMonthGoals.newPartner'),
      ],
      overallRating: Math.min(4.8, 3.0 + (performanceData.winRate / 100) * 2),
      keyMetrics: {
        matchesPlayed: performanceData.totalMatches,
        winRateImprovement: Math.random() * 10,
        skillLevelGrowth: Math.random() * 0.5,
        consistencyScore: Math.random() * 100,
      },
    };
  }

  // 기간별 매치 필터링
  private filterMatchesByPeriod(matches: unknown[], period: string): unknown[] {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return matches.filter(match => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchData = match as any;
      const matchDate = matchData.createdAt?.toDate() || new Date(matchData.createdAt);
      return matchDate >= startDate;
    });
  }

  // 성과 지표 계산
  private calculatePerformanceMetrics(
    userId: string,
    matches: unknown[],
    period: string
  ): UserPerformanceData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wins = matches.filter(match => (match as any).winnerId === userId).length;
    const losses = matches.length - wins;
    const winRate = matches.length > 0 ? (wins / matches.length) * 100 : 0;

    // 시간대별 성과 계산
    const timeSlotPerformance = this.calculateTimeSlotPerformance(userId, matches);

    // 상대방 유형별 성과 계산
    const opponentTypePerformance = this.calculateOpponentTypePerformance(userId, matches);

    // 플레이 빈도 계산
    const playingFrequency = this.calculatePlayingFrequency(matches, period);

    // 스킬 레벨 히스토리 (시뮬레이션)
    const skillLevelHistory = this.generateSkillLevelHistory(matches.length);

    return {
      userId,
      period: period as 'daily' | 'weekly' | 'monthly' | 'yearly',
      totalMatches: matches.length,
      wins,
      losses,
      winRate,
      averageMatchRating: 4.2 + Math.random() * 0.6, // 4.2-4.8
      skillLevelHistory,
      timeSlotPerformance,
      opponentTypePerformance,
      playingFrequency,
      currentStreak: Math.floor(Math.random() * 5) + 1,
      bestStreak: Math.floor(Math.random() * 8) + 3,
    };
  }

  // 시뮬레이션 데이터 생성
  private generateSimulationData(userId: string, period: string): UserPerformanceData {
    const totalMatches = Math.floor(Math.random() * 20) + 5;
    const wins = Math.floor(totalMatches * (0.4 + Math.random() * 0.4)); // 40-80% 승률
    const losses = totalMatches - wins;
    const winRate = (wins / totalMatches) * 100;

    return {
      userId,
      period: period as 'daily' | 'weekly' | 'monthly' | 'yearly',
      totalMatches,
      wins,
      losses,
      winRate,
      averageMatchRating: 4.0 + Math.random() * 0.8,
      skillLevelHistory: this.generateSkillLevelHistory(totalMatches),
      timeSlotPerformance: {
        morning: { matches: 3, wins: 2, winRate: 66.7 },
        afternoon: { matches: 8, wins: 5, winRate: 62.5 },
        evening: { matches: 4, wins: 3, winRate: 75.0 },
      },
      opponentTypePerformance: {
        beginners: { matches: 5, wins: 4, winRate: 80.0 },
        intermediate: { matches: 8, wins: 4, winRate: 50.0 },
        advanced: { matches: 2, wins: 1, winRate: 50.0 },
      },
      playingFrequency: {
        averagePerWeek: 2.5 + Math.random() * 2,
        averagePerMonth: 10 + Math.random() * 8,
        totalActiveDays: Math.floor(Math.random() * 30) + 15,
        longestActiveStreak: Math.floor(Math.random() * 14) + 7,
      },
      currentStreak: Math.floor(Math.random() * 5) + 1,
      bestStreak: Math.floor(Math.random() * 8) + 3,
    };
  }

  // 시간대별 성과 계산 (시뮬레이션)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculateTimeSlotPerformance(userId: string, matches: unknown[]): TimeSlotPerformance {
    return {
      morning: { matches: 3, wins: 2, winRate: 66.7 },
      afternoon: { matches: 8, wins: 5, winRate: 62.5 },
      evening: { matches: 4, wins: 3, winRate: 75.0 },
    };
  }

  // 상대방 유형별 성과 계산 (시뮬레이션)
  private calculateOpponentTypePerformance(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    matches: unknown[]
  ): OpponentTypePerformance {
    return {
      beginners: { matches: 5, wins: 4, winRate: 80.0 },
      intermediate: { matches: 8, wins: 4, winRate: 50.0 },
      advanced: { matches: 2, wins: 1, winRate: 50.0 },
    };
  }

  // 플레이 빈도 계산
  private calculatePlayingFrequency(matches: unknown[], period: string): PlayingFrequency {
    const totalDays = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365;
    const averagePerWeek = (matches.length / totalDays) * 7;

    return {
      averagePerWeek: Math.max(0.5, averagePerWeek),
      averagePerMonth: averagePerWeek * 4.33,
      totalActiveDays: Math.floor(matches.length / 1.5), // 평균적으로 하루에 1.5경기
      longestActiveStreak: Math.floor(Math.random() * 14) + 7,
    };
  }

  // 스킬 레벨 히스토리 생성
  private generateSkillLevelHistory(matchCount: number): SkillLevelHistory[] {
    const history: SkillLevelHistory[] = [];
    let currentSkill = 3.0 + Math.random() * 2; // 3.0-5.0 시작

    const dates = this.generateDateRange(Math.min(matchCount, 10));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dates.forEach((date, index) => {
      const improvement = (Math.random() - 0.3) * 0.2; // 약간의 변화
      currentSkill = Math.max(1.0, Math.min(7.0, currentSkill + improvement));

      history.push({
        date: date.toISOString(),
        skillLevel: Math.round(currentSkill * 10) / 10,
        ntrpRating: Math.round(currentSkill * 2) / 2, // NTRP는 0.5 단위
        improvement,
      });
    });

    return history;
  }

  // 날짜 범위 생성
  private generateDateRange(count: number): Date[] {
    const dates: Date[] = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i * 7); // 주단위
      dates.push(date);
    }

    return dates;
  }

  // 최고 성과 시간대 찾기
  private findBestTimeSlot(timeSlotPerformance: TimeSlotPerformance): string {
    const slots = Object.entries(timeSlotPerformance);
    const bestSlot = slots.reduce((best, current) => {
      return current[1].winRate > best[1].winRate ? current : best;
    });

    const slotKey = bestSlot[0];
    return i18n.t(`services.performanceAnalytics.timeSlots.${slotKey}`);
  }

  // 캐시 클리어
  clearCache(): void {
    this.cache.clear();
  }

  // 특정 사용자 캐시 클리어
  clearUserCache(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(userId));
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export default PerformanceAnalyticsService.getInstance();
