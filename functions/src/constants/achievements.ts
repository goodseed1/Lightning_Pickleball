/**
 * Achievement System Constants for Cloud Functions
 * Simplified version for server-side processing
 */

// Achievement interface for functions
export interface Achievement {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: 'matches' | 'social' | 'clubs' | 'tournaments' | 'streaks' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: {
    set: 'MaterialCommunityIcons';
    name: string;
    color: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  points: number;
  unlockedAt: string;
  hidden: boolean;
  condition: {
    type: string;
    value: number;
  };
}

// Achievement categories
export const ACHIEVEMENT_CATEGORIES = {
  MATCHES: 'matches',
  SOCIAL: 'social',
  CLUBS: 'clubs',
  TOURNAMENTS: 'tournaments',
  STREAKS: 'streaks',
  SPECIAL: 'special',
} as const;

// Achievement tiers
export const ACHIEVEMENT_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;

/**
 * Core Achievement Definitions (simplified for functions)
 */
export const ACHIEVEMENT_DEFINITIONS = {
  FIRST_VICTORY: {
    id: 'first_victory',
    name: 'First Victory',
    nameKo: '첫 승리의 감격',
    description: 'Win your first match',
    descriptionKo: '첫 경기에서 승리하세요',
    category: ACHIEVEMENT_CATEGORIES.MATCHES,
    tiers: {
      bronze: {
        condition: { type: 'wins', value: 1 },
        points: 100,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'trophy-variant',
          color: '#CD7F32',
          tier: 'bronze' as const,
        },
      },
    },
    hidden: false,
  },

  VICTORY_MILESTONES: {
    id: 'victory_milestones',
    name: 'Victory Milestones',
    nameKo: '승리 이정표',
    description: 'Achieve victory milestones',
    descriptionKo: '승리 이정표를 달성하세요',
    category: ACHIEVEMENT_CATEGORIES.MATCHES,
    tiers: {
      bronze: {
        condition: { type: 'wins', value: 10 },
        points: 250,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'pickleball-ball',
          color: '#CD7F32',
          tier: 'bronze' as const,
        },
      },
      silver: {
        condition: { type: 'wins', value: 25 },
        points: 500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'pickleball',
          color: '#C0C0C0',
          tier: 'silver' as const,
        },
      },
      gold: {
        condition: { type: 'wins', value: 50 },
        points: 1000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'medal',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
      platinum: {
        condition: { type: 'wins', value: 100 },
        points: 2000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'crown',
          color: '#E5E4E2',
          tier: 'platinum' as const,
        },
      },
    },
    hidden: false,
  },

  // === TOURNAMENT ACHIEVEMENTS (🏛️ PROJECT OLYMPUS) ===

  // 1. First Tournament Victory - 첫 토너먼트 우승
  FIRST_TOURNAMENT_VICTORY: {
    id: 'first_tournament_victory',
    name: 'First Tournament Victory',
    nameKo: '첫 토너먼트 우승',
    description: 'Win your first tournament',
    descriptionKo: '첫 토너먼트에서 우승하세요',
    category: ACHIEVEMENT_CATEGORIES.TOURNAMENTS,
    tiers: {
      bronze: {
        condition: { type: 'tournamentWins', value: 1 },
        points: 500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'trophy-variant',
          color: '#CD7F32',
          tier: 'bronze' as const,
        },
      },
    },
    hidden: false,
  },

  // 2. Tournament Champion - 토너먼트 챔피언 (기존 배지, 다중 우승)
  TOURNAMENT_CHAMPION: {
    id: 'tournament_champion',
    name: 'Tournament Champion',
    nameKo: '토너먼트 챔피언',
    description: 'Win multiple tournaments',
    descriptionKo: '여러 토너먼트에서 우승하세요',
    category: ACHIEVEMENT_CATEGORIES.TOURNAMENTS,
    tiers: {
      silver: {
        condition: { type: 'tournamentWins', value: 3 },
        points: 1000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'tournament',
          color: '#C0C0C0',
          tier: 'silver' as const,
        },
      },
      gold: {
        condition: { type: 'tournamentWins', value: 5 },
        points: 2000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'trophy',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
      platinum: {
        condition: { type: 'tournamentWins', value: 10 },
        points: 5000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'trophy-award',
          color: '#E5E4E2',
          tier: 'platinum' as const,
        },
      },
    },
    hidden: false,
  },

  // 3. Grand Slam Champion - 그랜드 슬램 챔피언 (4회 우승)
  GRAND_SLAM_CHAMPION: {
    id: 'grand_slam_champion',
    name: 'Grand Slam Champion',
    nameKo: '그랜드 슬램 챔피언',
    description: 'Win 4 or more tournaments',
    descriptionKo: '4개 이상의 토너먼트에서 우승하세요',
    category: ACHIEVEMENT_CATEGORIES.TOURNAMENTS,
    tiers: {
      platinum: {
        condition: { type: 'tournamentWins', value: 4 },
        points: 3000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'trophy-variant-outline',
          color: '#E5E4E2',
          tier: 'platinum' as const,
        },
      },
    },
    hidden: false,
  },

  // 4. Veteran Competitor - 베테랑 참가자 (10회 참가)
  VETERAN_COMPETITOR: {
    id: 'veteran_competitor',
    name: 'Veteran Competitor',
    nameKo: '베테랑 참가자',
    description: 'Participate in 10 or more tournaments',
    descriptionKo: '10개 이상의 토너먼트에 참가하세요',
    category: ACHIEVEMENT_CATEGORIES.TOURNAMENTS,
    tiers: {
      bronze: {
        condition: { type: 'tournamentsParticipated', value: 5 },
        points: 300,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'calendar-check',
          color: '#CD7F32',
          tier: 'bronze' as const,
        },
      },
      silver: {
        condition: { type: 'tournamentsParticipated', value: 10 },
        points: 600,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'calendar-star',
          color: '#C0C0C0',
          tier: 'silver' as const,
        },
      },
      gold: {
        condition: { type: 'tournamentsParticipated', value: 20 },
        points: 1200,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'calendar-multiple',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
    },
    hidden: false,
  },

  // 5. Hot Streak - 연승 행진 (3연속 우승)
  HOT_STREAK: {
    id: 'hot_streak',
    name: 'Hot Streak',
    nameKo: '뜨거운 연승',
    description: 'Win 3 consecutive tournaments',
    descriptionKo: '3개의 토너먼트를 연속으로 우승하세요',
    category: ACHIEVEMENT_CATEGORIES.TOURNAMENTS,
    tiers: {
      gold: {
        condition: { type: 'consecutiveTournamentWins', value: 3 },
        points: 2000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'fire',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
    },
    hidden: false,
  },

  // 6. Pickleball Prodigy - 피클볼 신동 (100% 승률, 최소 5회 참가)
  TENNIS_PRODIGY: {
    id: 'pickleball_prodigy',
    name: 'Pickleball Prodigy',
    nameKo: '피클볼 신동',
    description: 'Maintain 100% tournament win rate (minimum 5 tournaments)',
    descriptionKo: '토너먼트 100% 승률 유지 (최소 5회 참가)',
    category: ACHIEVEMENT_CATEGORIES.TOURNAMENTS,
    tiers: {
      platinum: {
        condition: { type: 'tournamentWinRate', value: 100, minTournaments: 5 },
        points: 5000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'star-circle',
          color: '#E5E4E2',
          tier: 'platinum' as const,
        },
      },
    },
    hidden: false,
  },

  // 7. Runner-Up Resilience - 준우승의 끈기 (3회 준우승)
  RUNNER_UP_RESILIENCE: {
    id: 'runner_up_resilience',
    name: 'Runner-Up Resilience',
    nameKo: '준우승의 끈기',
    description: 'Finish as runner-up in 3 or more tournaments',
    descriptionKo: '3개 이상의 토너먼트에서 준우승하세요',
    category: ACHIEVEMENT_CATEGORIES.TOURNAMENTS,
    tiers: {
      bronze: {
        condition: { type: 'tournamentRunnerUps', value: 1 },
        points: 200,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'medal-outline',
          color: '#CD7F32',
          tier: 'bronze' as const,
        },
      },
      silver: {
        condition: { type: 'tournamentRunnerUps', value: 3 },
        points: 500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'medal',
          color: '#C0C0C0',
          tier: 'silver' as const,
        },
      },
      gold: {
        condition: { type: 'tournamentRunnerUps', value: 5 },
        points: 1000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'podium-silver',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
    },
    hidden: false,
  },

  // 8. Season Dominator - 시즌 지배자 (한 시즌에 5회 우승)
  SEASON_DOMINATOR: {
    id: 'season_dominator',
    name: 'Season Dominator',
    nameKo: '시즌 지배자',
    description: 'Win 5 tournaments in a single season',
    descriptionKo: '한 시즌에 5개 토너먼트에서 우승하세요',
    category: ACHIEVEMENT_CATEGORIES.TOURNAMENTS,
    tiers: {
      platinum: {
        condition: { type: 'tournamentWinsInSeason', value: 5 },
        points: 3500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'crown-circle',
          color: '#E5E4E2',
          tier: 'platinum' as const,
        },
      },
    },
    hidden: false,
  },

  // 9. Speed Champion - 스피드 챔피언 (싱글 토너먼트 우승)
  SPEED_CHAMPION: {
    id: 'speed_champion',
    name: 'Speed Champion',
    nameKo: '스피드 챔피언',
    description: 'Win a singles tournament',
    descriptionKo: '싱글 토너먼트에서 우승하세요',
    category: ACHIEVEMENT_CATEGORIES.TOURNAMENTS,
    tiers: {
      gold: {
        condition: { type: 'singlesTournamentWins', value: 1 },
        points: 1500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'run-fast',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
    },
    hidden: false,
  },

  // 10. Doubles Master - 복식 마스터 (복식 토너먼트 우승)
  DOUBLES_MASTER: {
    id: 'doubles_master',
    name: 'Doubles Master',
    nameKo: '복식 마스터',
    description: 'Win a doubles tournament',
    descriptionKo: '복식 토너먼트에서 우승하세요',
    category: ACHIEVEMENT_CATEGORIES.TOURNAMENTS,
    tiers: {
      gold: {
        condition: { type: 'doublesTournamentWins', value: 1 },
        points: 1500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'account-multiple',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
    },
    hidden: false,
  },
};

/**
 * Get all achievements as a flat array for easier processing
 */
export function getAllAchievements(): Achievement[] {
  const achievements: Achievement[] = [];

  Object.entries(ACHIEVEMENT_DEFINITIONS).forEach(([, definition]) => {
    Object.entries(definition.tiers).forEach(([tierKey, tierData]) => {
      achievements.push({
        id: `${definition.id}_${tierKey}`,
        name: `${definition.name} (${tierKey.toUpperCase()})`,
        nameKo: `${definition.nameKo} (${tierKey.toUpperCase()})`,
        description: definition.description,
        descriptionKo: definition.descriptionKo,
        category: definition.category,
        tier: tierData.icon.tier,
        icon: tierData.icon,
        points: tierData.points,
        unlockedAt: '', // Will be set when unlocked
        hidden: definition.hidden,
        condition: tierData.condition,
      });
    });
  });

  return achievements;
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: string): Achievement[] {
  return getAllAchievements().filter(achievement => achievement.category === category);
}

/**
 * Get achievements by tier
 */
export function getAchievementsByTier(tier: string): Achievement[] {
  return getAllAchievements().filter(achievement => achievement.tier === tier);
}
