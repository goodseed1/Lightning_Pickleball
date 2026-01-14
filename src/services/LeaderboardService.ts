import StorageService from './StorageService';
import i18n from '../i18n';

/**
 * User statistics interface for achievement system
 */
interface UserStats {
  totalMatches: number;
  totalWins: number;
  winStreak: number;
  skillLevel: number;
  uniqueOpponents: number;
  monthlyMatches: number;
  earlyMatches: number;
  nightMatches: number;
}

export interface UserRanking {
  userId: string;
  username: string;
  profileImage?: string;
  rank: number;
  previousRank?: number;
  score: number;

  // 세부 통계
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    skillLevel: number;
    averageRating: number;
  };

  // 추가 정보
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master';
  badges: string[];
  streak: {
    current: number;
    type: 'win' | 'loss' | 'none';
    best: number;
  };

  // 활동 지표
  activity: {
    lastActive: string;
    monthlyMatches: number;
    consistency: number; // 0-100
  };
}

export interface LeaderboardCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  timeframe: 'weekly' | 'monthly' | 'alltime';
  rankingType: 'skill' | 'wins' | 'winrate' | 'activity' | 'improvement';
  rankings: UserRanking[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'matches' | 'wins' | 'skill' | 'social' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: {
    type: string;
    value: number;
    timeframe?: string;
  };
  reward: {
    points: number;
    badge: string;
    title?: string;
  };
  unlockedBy: string[]; // 사용자 ID 목록
  unlockedAt?: { [userId: string]: string }; // 달성 날짜
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number; // 0-100
  isNotified: boolean;
}

export interface RankingCalculation {
  baseScore: number;
  skillBonus: number;
  activityBonus: number;
  achievementBonus: number;
  consistencyBonus: number;
  totalScore: number;
  tier: string;
}

class LeaderboardService {
  private static instance: LeaderboardService;

  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  /**
   * 전체 리더보드 카테고리 조회
   */
  async getLeaderboardCategories(): Promise<LeaderboardCategory[]> {
    try {
      const categories = await this.generateLeaderboardCategories();
      return categories;
    } catch (error) {
      console.error('Error getting leaderboard categories:', error);
      return [];
    }
  }

  /**
   * 특정 카테고리 리더보드 조회
   */
  async getCategoryLeaderboard(categoryId: string): Promise<LeaderboardCategory | null> {
    try {
      const categories = await this.getLeaderboardCategories();
      return categories.find(cat => cat.id === categoryId) || null;
    } catch (error) {
      console.error('Error getting category leaderboard:', error);
      return null;
    }
  }

  /**
   * 사용자 랭킹 정보 조회
   */
  async getUserRanking(userId: string): Promise<{
    global: UserRanking;
    categories: { [categoryId: string]: UserRanking };
  }> {
    try {
      const allRankings = await this.generateAllUserRankings();
      const userGlobalRanking = allRankings.find(ranking => ranking.userId === userId);

      if (!userGlobalRanking) {
        throw new Error('User ranking not found');
      }

      // 카테고리별 랭킹 계산
      const categories: { [categoryId: string]: UserRanking } = {};
      const categoryList = await this.getLeaderboardCategories();

      for (const category of categoryList) {
        const categoryRanking = category.rankings.find(ranking => ranking.userId === userId);
        if (categoryRanking) {
          categories[category.id] = categoryRanking;
        }
      }

      return {
        global: userGlobalRanking,
        categories,
      };
    } catch (error) {
      console.error('Error getting user ranking:', error);
      throw error;
    }
  }

  /**
   * 사용자 랭킹 점수 계산
   */
  calculateUserRankingScore(
    skillLevel: number,
    totalMatches: number,
    winRate: number,
    averageRating: number,
    monthlyMatches: number,
    achievementCount: number,
    consistency: number
  ): RankingCalculation {
    // 기본 점수 (스킬 레벨 기반)
    const baseScore = skillLevel * 10;

    // 스킬 보너스 (경험과 승률 조합)
    const experienceMultiplier = Math.min(2, Math.sqrt(totalMatches / 10));
    const winRateBonus = (winRate - 50) * 2; // 50% 기준으로 보너스/페널티
    const skillBonus = (averageRating - 70) * 5 * experienceMultiplier + winRateBonus;

    // 활동 보너스 (월간 매치 수)
    const idealMonthlyMatches = 8;
    const activityRatio = Math.min(1, monthlyMatches / idealMonthlyMatches);
    const activityBonus = activityRatio * 100;

    // 업적 보너스
    const achievementBonus = achievementCount * 15;

    // 일관성 보너스
    const consistencyBonus = consistency * 0.5;

    // 총 점수 계산
    const totalScore = Math.max(
      0,
      baseScore + skillBonus + activityBonus + achievementBonus + consistencyBonus
    );

    // 티어 결정
    const tier = this.calculateTier(totalScore);

    return {
      baseScore: Math.round(baseScore),
      skillBonus: Math.round(skillBonus),
      activityBonus: Math.round(activityBonus),
      achievementBonus: Math.round(achievementBonus),
      consistencyBonus: Math.round(consistencyBonus),
      totalScore: Math.round(totalScore),
      tier,
    };
  }

  /**
   * 티어 계산
   */
  private calculateTier(score: number): string {
    if (score >= 1500) return 'Master';
    if (score >= 1200) return 'Diamond';
    if (score >= 900) return 'Platinum';
    if (score >= 600) return 'Gold';
    if (score >= 300) return 'Silver';
    return 'Bronze';
  }

  /**
   * 업적 시스템 초기화
   */
  async initializeAchievements(): Promise<void> {
    try {
      const achievements = await this.getDefaultAchievements();
      await StorageService.setItem('achievements_system', achievements);
    } catch (error) {
      console.error('Error initializing achievements:', error);
    }
  }

  /**
   * 사용자 업적 확인 및 업데이트
   */
  async checkAndUpdateUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const userStats = await this.getUserStats(userId);
      const achievements =
        (await StorageService.getItem<Achievement[]>('achievements_system')) || [];
      const userAchievements = await this.getUserAchievements(userId);
      const newlyUnlocked: Achievement[] = [];

      for (const achievement of achievements) {
        // 이미 달성한 업적은 스킵
        if (userAchievements.some(ua => ua.achievementId === achievement.id)) {
          continue;
        }

        // 업적 달성 조건 확인
        const isUnlocked = this.checkAchievementRequirement(achievement, userStats);

        if (isUnlocked) {
          // 새로운 업적 달성
          await this.unlockAchievement(userId, achievement.id);
          newlyUnlocked.push(achievement);
        } else {
          // 진행률 업데이트
          const progress = this.calculateAchievementProgress(achievement, userStats);
          await this.updateAchievementProgress(userId, achievement.id, progress);
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking user achievements:', error);
      return [];
    }
  }

  /**
   * 사용자 업적 목록 조회
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const achievements =
        (await StorageService.getItem<UserAchievement[]>(`user_achievements_${userId}`)) || [];
      return achievements;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  /**
   * 주간/월간 챌린지 생성
   */
  async generateChallenges(timeframe: 'weekly' | 'monthly'): Promise<
    {
      id: string;
      title: string;
      description: string;
      goal: number;
      progress: number;
      reward: string;
      expiresAt: string;
    }[]
  > {
    const now = new Date();
    const challenges = [];

    if (timeframe === 'weekly') {
      challenges.push({
        id: 'weekly_matches',
        title: i18n.t('services.leaderboard.challenges.weeklyMatches.title'),
        description: i18n.t('services.leaderboard.challenges.weeklyMatches.description'),
        goal: 5,
        progress: Math.floor(Math.random() * 5), // 시뮬레이션
        reward: i18n.t('services.leaderboard.challenges.weeklyMatches.reward'),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      challenges.push({
        id: 'weekly_winstreak',
        title: i18n.t('services.leaderboard.challenges.winStreak.title'),
        description: i18n.t('services.leaderboard.challenges.winStreak.description'),
        goal: 3,
        progress: Math.floor(Math.random() * 3), // 시뮬레이션
        reward: i18n.t('services.leaderboard.challenges.winStreak.reward'),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } else {
      challenges.push({
        id: 'monthly_improvement',
        title: i18n.t('services.leaderboard.challenges.monthlyImprovement.title'),
        description: i18n.t('services.leaderboard.challenges.monthlyImprovement.description'),
        goal: 5,
        progress: Math.floor(Math.random() * 5), // 시뮬레이션
        reward: i18n.t('services.leaderboard.challenges.monthlyImprovement.reward'),
        expiresAt: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
      });

      challenges.push({
        id: 'monthly_social',
        title: i18n.t('services.leaderboard.challenges.socialPlayer.title'),
        description: i18n.t('services.leaderboard.challenges.socialPlayer.description'),
        goal: 10,
        progress: Math.floor(Math.random() * 10), // 시뮬레이션
        reward: i18n.t('services.leaderboard.challenges.socialPlayer.reward'),
        expiresAt: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
      });
    }

    return challenges;
  }

  /**
   * 지역별 랭킹 조회
   */
  async getRegionalRanking(region: string, limit: number = 50): Promise<UserRanking[]> {
    try {
      // 실제 구현에서는 지역 정보를 기반으로 필터링
      const allRankings = await this.generateAllUserRankings();

      // 지역 필터링 시뮬레이션 (실제로는 사용자의 위치 정보 기반)
      const regionalRankings = allRankings
        .filter(() => Math.random() > 0.3) // 임의로 70% 선택
        .slice(0, limit);

      return regionalRankings;
    } catch (error) {
      console.error('Error getting regional ranking:', error);
      return [];
    }
  }

  /**
   * 친구 랭킹 조회
   */
  async getFriendsRanking(userId: string, friendIds: string[]): Promise<UserRanking[]> {
    try {
      const allRankings = await this.generateAllUserRankings();
      const friendRankings = allRankings
        .filter(ranking => friendIds.includes(ranking.userId) || ranking.userId === userId)
        .sort((a, b) => b.score - a.score)
        .map((ranking, index) => ({ ...ranking, rank: index + 1 }));

      return friendRankings;
    } catch (error) {
      console.error('Error getting friends ranking:', error);
      return [];
    }
  }

  // =============================================================================
  // 프라이빗 헬퍼 메서드들
  // =============================================================================

  /**
   * 리더보드 카테고리 생성
   */
  private async generateLeaderboardCategories(): Promise<LeaderboardCategory[]> {
    const allRankings = await this.generateAllUserRankings();

    return [
      {
        id: 'overall',
        name: i18n.t('services.leaderboard.categories.overall.name'),
        description: i18n.t('services.leaderboard.categories.overall.description'),
        icon: 'emoji-events',
        timeframe: 'alltime',
        rankingType: 'skill',
        rankings: allRankings.slice(0, 100),
      },
      {
        id: 'skill_level',
        name: i18n.t('services.leaderboard.categories.skillLevel.name'),
        description: i18n.t('services.leaderboard.categories.skillLevel.description'),
        icon: 'trending-up',
        timeframe: 'alltime',
        rankingType: 'skill',
        rankings: [...allRankings]
          .sort((a, b) => b.stats.skillLevel - a.stats.skillLevel)
          .slice(0, 100)
          .map((ranking, index) => ({ ...ranking, rank: index + 1 })),
      },
      {
        id: 'win_rate',
        name: i18n.t('services.leaderboard.categories.winRate.name'),
        description: i18n.t('services.leaderboard.categories.winRate.description'),
        icon: 'star',
        timeframe: 'alltime',
        rankingType: 'winrate',
        rankings: [...allRankings]
          .filter(ranking => ranking.stats.totalMatches >= 10)
          .sort((a, b) => b.stats.winRate - a.stats.winRate)
          .slice(0, 100)
          .map((ranking, index) => ({ ...ranking, rank: index + 1 })),
      },
      {
        id: 'monthly_active',
        name: i18n.t('services.leaderboard.categories.monthlyActive.name'),
        description: i18n.t('services.leaderboard.categories.monthlyActive.description'),
        icon: 'local-fire-department',
        timeframe: 'monthly',
        rankingType: 'activity',
        rankings: [...allRankings]
          .sort((a, b) => b.activity.monthlyMatches - a.activity.monthlyMatches)
          .slice(0, 50)
          .map((ranking, index) => ({ ...ranking, rank: index + 1 })),
      },
      {
        id: 'improvement',
        name: i18n.t('services.leaderboard.categories.improvement.name'),
        description: i18n.t('services.leaderboard.categories.improvement.description'),
        icon: 'trending-up',
        timeframe: 'monthly',
        rankingType: 'improvement',
        rankings: [...allRankings]
          .sort(() => Math.random() - 0.5) // 시뮬레이션: 랜덤 정렬
          .slice(0, 50)
          .map((ranking, index) => ({ ...ranking, rank: index + 1 })),
      },
    ];
  }

  /**
   * 전체 사용자 랭킹 생성 (시뮬레이션)
   */
  private async generateAllUserRankings(): Promise<UserRanking[]> {
    const users: UserRanking[] = [];

    // 시뮬레이션 사용자 데이터 생성
    for (let i = 0; i < 200; i++) {
      const totalMatches = 5 + Math.floor(Math.random() * 50);
      const wins = Math.floor(totalMatches * (0.3 + Math.random() * 0.4));
      const losses = totalMatches - wins;
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
      const skillLevel = 40 + Math.random() * 50;
      const averageRating = 60 + Math.random() * 35;
      const monthlyMatches = Math.floor(Math.random() * 15);
      const achievementCount = Math.floor(Math.random() * 20);
      const consistency = 50 + Math.random() * 50;

      const rankingCalc = this.calculateUserRankingScore(
        skillLevel,
        totalMatches,
        winRate,
        averageRating,
        monthlyMatches,
        achievementCount,
        consistency
      );

      users.push({
        userId: `user_${i}`,
        username: `Player${i + 1}`,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        rank: i + 1, // 임시, 나중에 점수로 재정렬
        score: rankingCalc.totalScore,
        stats: {
          totalMatches,
          wins,
          losses,
          winRate: Math.round(winRate * 10) / 10,
          skillLevel: Math.round(skillLevel * 10) / 10,
          averageRating: Math.round(averageRating * 10) / 10,
        },
        tier: rankingCalc.tier as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond',
        badges: this.generateRandomBadges(),
        streak: {
          current: Math.floor(Math.random() * 8),
          type: Math.random() > 0.5 ? 'win' : Math.random() > 0.5 ? 'loss' : 'none',
          best: Math.floor(Math.random() * 15),
        },
        activity: {
          lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          monthlyMatches,
          consistency: Math.round(consistency),
        },
      });
    }

    // 점수로 정렬하고 랭크 재할당
    users.sort((a, b) => b.score - a.score);
    users.forEach((user, index) => {
      user.rank = index + 1;
      user.previousRank =
        user.rank + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3);
    });

    return users;
  }

  /**
   * 랜덤 배지 생성
   */
  private generateRandomBadges(): string[] {
    const allBadges = [
      'First Win',
      'Streak Master',
      'Social Player',
      'Consistent',
      'Improver',
      'Weekend Warrior',
      'Early Bird',
      'Night Owl',
      'Weather Fighter',
      'Court Master',
    ];

    const numBadges = Math.floor(Math.random() * 5);
    const selectedBadges: string[] = [];

    for (let i = 0; i < numBadges; i++) {
      const randomBadge = allBadges[Math.floor(Math.random() * allBadges.length)];
      if (!selectedBadges.includes(randomBadge)) {
        selectedBadges.push(randomBadge);
      }
    }

    return selectedBadges;
  }

  /**
   * 기본 업적 정의
   */
  private async getDefaultAchievements(): Promise<Achievement[]> {
    return [
      {
        id: 'first_win',
        name: i18n.t('services.leaderboard.achievements.firstWin.name'),
        description: i18n.t('services.leaderboard.achievements.firstWin.description'),
        icon: 'emoji-events',
        category: 'wins',
        tier: 'bronze',
        requirement: { type: 'wins', value: 1 },
        reward: { points: 50, badge: 'First Win' },
        unlockedBy: [],
      },
      {
        id: 'win_streak_3',
        name: i18n.t('services.leaderboard.achievements.winStreak3.name'),
        description: i18n.t('services.leaderboard.achievements.winStreak3.description'),
        icon: 'trending-up',
        category: 'wins',
        tier: 'silver',
        requirement: { type: 'win_streak', value: 3 },
        reward: { points: 100, badge: 'Streak Master' },
        unlockedBy: [],
      },
      {
        id: 'win_streak_5',
        name: i18n.t('services.leaderboard.achievements.winStreak5.name'),
        description: i18n.t('services.leaderboard.achievements.winStreak5.description'),
        icon: 'local-fire-department',
        category: 'wins',
        tier: 'gold',
        requirement: { type: 'win_streak', value: 5 },
        reward: { points: 200, badge: 'Dominator' },
        unlockedBy: [],
      },
      {
        id: 'total_wins_10',
        name: i18n.t('services.leaderboard.achievements.totalWins10.name'),
        description: i18n.t('services.leaderboard.achievements.totalWins10.description'),
        icon: 'star',
        category: 'wins',
        tier: 'bronze',
        requirement: { type: 'total_wins', value: 10 },
        reward: { points: 150, badge: 'Winner' },
        unlockedBy: [],
      },
      {
        id: 'total_wins_50',
        name: i18n.t('services.leaderboard.achievements.totalWins50.name'),
        description: i18n.t('services.leaderboard.achievements.totalWins50.description'),
        icon: 'military-tech',
        category: 'wins',
        tier: 'gold',
        requirement: { type: 'total_wins', value: 50 },
        reward: { points: 500, badge: 'Victory Master' },
        unlockedBy: [],
      },
      {
        id: 'matches_played_10',
        name: i18n.t('services.leaderboard.achievements.matchesPlayed10.name'),
        description: i18n.t('services.leaderboard.achievements.matchesPlayed10.description'),
        icon: 'sports-pickleball',
        category: 'matches',
        tier: 'bronze',
        requirement: { type: 'total_matches', value: 10 },
        reward: { points: 100, badge: 'Experienced' },
        unlockedBy: [],
      },
      {
        id: 'matches_played_100',
        name: i18n.t('services.leaderboard.achievements.matchesPlayed100.name'),
        description: i18n.t('services.leaderboard.achievements.matchesPlayed100.description'),
        icon: 'workspace-premium',
        category: 'matches',
        tier: 'platinum',
        requirement: { type: 'total_matches', value: 100 },
        reward: { points: 1000, badge: 'Veteran', title: 'Veteran Player' },
        unlockedBy: [],
      },
      {
        id: 'skill_level_70',
        name: i18n.t('services.leaderboard.achievements.skillLevel70.name'),
        description: i18n.t('services.leaderboard.achievements.skillLevel70.description'),
        icon: 'trending-up',
        category: 'skill',
        tier: 'silver',
        requirement: { type: 'skill_level', value: 70 },
        reward: { points: 200, badge: 'Skilled' },
        unlockedBy: [],
      },
      {
        id: 'skill_level_85',
        name: i18n.t('services.leaderboard.achievements.skillLevel85.name'),
        description: i18n.t('services.leaderboard.achievements.skillLevel85.description'),
        icon: 'school',
        category: 'skill',
        tier: 'gold',
        requirement: { type: 'skill_level', value: 85 },
        reward: { points: 500, badge: 'Expert' },
        unlockedBy: [],
      },
      {
        id: 'social_player',
        name: i18n.t('services.leaderboard.achievements.socialPlayer.name'),
        description: i18n.t('services.leaderboard.achievements.socialPlayer.description'),
        icon: 'people',
        category: 'social',
        tier: 'silver',
        requirement: { type: 'unique_opponents', value: 20 },
        reward: { points: 250, badge: 'Social Player' },
        unlockedBy: [],
      },
      {
        id: 'monthly_active',
        name: i18n.t('services.leaderboard.achievements.monthlyActive.name'),
        description: i18n.t('services.leaderboard.achievements.monthlyActive.description'),
        icon: 'local-fire-department',
        category: 'special',
        tier: 'gold',
        requirement: { type: 'monthly_matches', value: 15, timeframe: 'monthly' },
        reward: { points: 300, badge: 'Monthly Active' },
        unlockedBy: [],
      },
      {
        id: 'early_bird',
        name: i18n.t('services.leaderboard.achievements.earlyBird.name'),
        description: i18n.t('services.leaderboard.achievements.earlyBird.description'),
        icon: 'wb-sunny',
        category: 'special',
        tier: 'bronze',
        requirement: { type: 'early_matches', value: 10 },
        reward: { points: 150, badge: 'Early Bird' },
        unlockedBy: [],
      },
      {
        id: 'night_owl',
        name: i18n.t('services.leaderboard.achievements.nightOwl.name'),
        description: i18n.t('services.leaderboard.achievements.nightOwl.description'),
        icon: 'nightlight',
        category: 'special',
        tier: 'bronze',
        requirement: { type: 'night_matches', value: 10 },
        reward: { points: 150, badge: 'Night Owl' },
        unlockedBy: [],
      },
    ];
  }

  /**
   * 사용자 통계 조회 (시뮬레이션)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getUserStats(userId: string): Promise<UserStats> {
    // 실제 구현에서는 데이터베이스에서 조회
    return {
      totalMatches: 25,
      totalWins: 15,
      winStreak: 3,
      skillLevel: 72,
      uniqueOpponents: 18,
      monthlyMatches: 8,
      earlyMatches: 5,
      nightMatches: 3,
    };
  }

  /**
   * 타입 가드: UserStats 여부 확인
   */
  private isUserStats(stats: unknown): stats is UserStats {
    return (
      typeof stats === 'object' &&
      stats !== null &&
      'totalMatches' in stats &&
      'totalWins' in stats &&
      'winStreak' in stats &&
      'skillLevel' in stats &&
      'uniqueOpponents' in stats &&
      'monthlyMatches' in stats &&
      'earlyMatches' in stats &&
      'nightMatches' in stats
    );
  }

  /**
   * 업적 요구사항 확인
   */
  private checkAchievementRequirement(achievement: Achievement, userStats: unknown): boolean {
    if (!this.isUserStats(userStats)) {
      return false;
    }
    const { type, value } = achievement.requirement;

    switch (type) {
      case 'wins':
      case 'total_wins':
        return userStats.totalWins >= value;
      case 'win_streak':
        return userStats.winStreak >= value;
      case 'total_matches':
        return userStats.totalMatches >= value;
      case 'skill_level':
        return userStats.skillLevel >= value;
      case 'unique_opponents':
        return userStats.uniqueOpponents >= value;
      case 'monthly_matches':
        return userStats.monthlyMatches >= value;
      case 'early_matches':
        return userStats.earlyMatches >= value;
      case 'night_matches':
        return userStats.nightMatches >= value;
      default:
        return false;
    }
  }

  /**
   * 업적 진행률 계산
   */
  private calculateAchievementProgress(achievement: Achievement, userStats: unknown): number {
    if (!this.isUserStats(userStats)) {
      return 0;
    }

    const { type, value } = achievement.requirement;
    let current = 0;

    switch (type) {
      case 'wins':
      case 'total_wins':
        current = userStats.totalWins;
        break;
      case 'win_streak':
        current = userStats.winStreak;
        break;
      case 'total_matches':
        current = userStats.totalMatches;
        break;
      case 'skill_level':
        current = userStats.skillLevel;
        break;
      case 'unique_opponents':
        current = userStats.uniqueOpponents;
        break;
      case 'monthly_matches':
        current = userStats.monthlyMatches;
        break;
      case 'early_matches':
        current = userStats.earlyMatches;
        break;
      case 'night_matches':
        current = userStats.nightMatches;
        break;
    }

    return Math.min(100, (current / value) * 100);
  }

  /**
   * 업적 달성 처리
   */
  private async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    try {
      const userAchievements = await this.getUserAchievements(userId);

      const newAchievement: UserAchievement = {
        userId,
        achievementId,
        unlockedAt: new Date().toISOString(),
        progress: 100,
        isNotified: false,
      };

      userAchievements.push(newAchievement);
      await StorageService.setItem(`user_achievements_${userId}`, userAchievements);

      // 전체 업적 시스템 업데이트
      const allAchievements =
        (await StorageService.getItem<Achievement[]>('achievements_system')) || [];
      const achievement = allAchievements.find(a => a.id === achievementId);

      if (achievement) {
        if (!achievement.unlockedBy.includes(userId)) {
          achievement.unlockedBy.push(userId);
        }
        achievement.unlockedAt = achievement.unlockedAt || {};
        achievement.unlockedAt[userId] = new Date().toISOString();

        await StorageService.setItem('achievements_system', allAchievements);
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }

  /**
   * 업적 진행률 업데이트
   */
  private async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number
  ): Promise<void> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const existingAchievement = userAchievements.find(ua => ua.achievementId === achievementId);

      if (existingAchievement) {
        existingAchievement.progress = progress;
      } else {
        const newAchievement: UserAchievement = {
          userId,
          achievementId,
          unlockedAt: '',
          progress,
          isNotified: false,
        };
        userAchievements.push(newAchievement);
      }

      await StorageService.setItem(`user_achievements_${userId}`, userAchievements);
    } catch (error) {
      console.error('Error updating achievement progress:', error);
    }
  }
}

export default LeaderboardService.getInstance();
