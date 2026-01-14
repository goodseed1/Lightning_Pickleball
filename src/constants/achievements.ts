/**
 * Comprehensive Achievement System Constants
 * Defines all special achievements with multi-tier progression and dynamic icons
 */

import { Achievement } from '../types/user';

// Achievement category definitions
export const ACHIEVEMENT_CATEGORIES = {
  MATCHES: 'matches',
  SOCIAL: 'social',
  CLUBS: 'clubs',
  TOURNAMENTS: 'tournaments',
  STREAKS: 'streaks',
  SPECIAL: 'special',
} as const;

// Tier progression system
export const ACHIEVEMENT_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;

/**
 * Core Achievement Definitions
 * Each achievement includes multiple tiers for progression
 */
export const ACHIEVEMENT_DEFINITIONS = {
  // === MATCH ACHIEVEMENTS ===
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

  // === SPECIAL MATCH ACHIEVEMENTS ===
  GIANT_SLAYER: {
    id: 'giant_slayer',
    name: 'Giant Slayer',
    nameKo: '거인 사냥꾼',
    description: 'Defeat opponents with higher ELO',
    descriptionKo: '자신보다 높은 ELO의 상대를 물리치세요',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    tiers: {
      bronze: {
        condition: { type: 'upsetWins', value: 3 },
        points: 300,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'sword-cross',
          color: '#CD7F32',
          tier: 'bronze' as const,
        },
      },
      silver: {
        condition: { type: 'upsetWins', value: 10 },
        points: 750,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'shield-sword',
          color: '#C0C0C0',
          tier: 'silver' as const,
        },
      },
      gold: {
        condition: { type: 'upsetWins', value: 25 },
        points: 1500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'shield-crown',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
    },
    hidden: false,
  },

  BAGEL_MASTER: {
    id: 'bagel_master',
    name: 'Bagel Master',
    nameKo: '베이글 마스터',
    description: 'Win matches 6-0 or 6-0, 6-0',
    descriptionKo: '6-0 또는 6-0, 6-0으로 승리하세요',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    tiers: {
      bronze: {
        condition: { type: 'bagelWins', value: 1 },
        points: 200,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'food-croissant',
          color: '#CD7F32',
          tier: 'bronze' as const,
        },
      },
      silver: {
        condition: { type: 'bagelWins', value: 5 },
        points: 500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'food-variant',
          color: '#C0C0C0',
          tier: 'silver' as const,
        },
      },
      gold: {
        condition: { type: 'bagelWins', value: 15 },
        points: 1200,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'crown-outline',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
    },
    hidden: false,
  },

  // === STREAK ACHIEVEMENTS ===
  WINNING_STREAK: {
    id: 'winning_streak',
    name: 'Winning Streak',
    nameKo: '연승 행진',
    description: 'Achieve winning streaks',
    descriptionKo: '연승 행진을 이어가세요',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    tiers: {
      bronze: {
        condition: { type: 'currentWinStreak', value: 3 },
        points: 200,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'fire',
          color: '#CD7F32',
          tier: 'bronze' as const,
        },
      },
      silver: {
        condition: { type: 'currentWinStreak', value: 5 },
        points: 400,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'fire-circle',
          color: '#C0C0C0',
          tier: 'silver' as const,
        },
      },
      gold: {
        condition: { type: 'currentWinStreak', value: 10 },
        points: 1000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'fire-truck',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
      platinum: {
        condition: { type: 'currentWinStreak', value: 20 },
        points: 2500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'lightning-bolt',
          color: '#E5E4E2',
          tier: 'platinum' as const,
        },
      },
    },
    hidden: false,
  },

  // === SOCIAL ACHIEVEMENTS ===
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    nameKo: '사교적인 나비',
    description: 'Make friends in the pickleball community',
    descriptionKo: '피클볼 커뮤니티에서 친구를 만드세요',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    tiers: {
      bronze: {
        condition: { type: 'friendsCount', value: 5 },
        points: 150,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'account-group',
          color: '#CD7F32',
          tier: 'bronze' as const,
        },
      },
      silver: {
        condition: { type: 'friendsCount', value: 15 },
        points: 300,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'account-heart',
          color: '#C0C0C0',
          tier: 'silver' as const,
        },
      },
      gold: {
        condition: { type: 'friendsCount', value: 50 },
        points: 750,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'heart-multiple',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
    },
    hidden: false,
  },

  // === CLUB ACHIEVEMENTS ===
  COMMUNITY_PIONEER: {
    id: 'community_pioneer',
    name: 'Community Pioneer',
    nameKo: '커뮤니티 개척자',
    description: 'Join and participate in pickleball clubs',
    descriptionKo: '피클볼 클럽에 가입하고 참여하세요',
    category: ACHIEVEMENT_CATEGORIES.CLUBS,
    tiers: {
      bronze: {
        condition: { type: 'clubsJoined', value: 1 },
        points: 100,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'home-group',
          color: '#CD7F32',
          tier: 'bronze' as const,
        },
      },
      silver: {
        condition: { type: 'clubsJoined', value: 3 },
        points: 250,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'home-heart',
          color: '#C0C0C0',
          tier: 'silver' as const,
        },
      },
      gold: {
        condition: { type: 'clubEventsAttended', value: 25 },
        points: 600,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'home-city',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
    },
    hidden: false,
  },

  LIGHTNING_HOST: {
    id: 'lightning_host',
    name: 'Lightning Host',
    nameKo: '번개 호스트',
    description: 'Host lightning matches and gatherings',
    descriptionKo: '번개 매치와 모임을 주최하세요',
    category: ACHIEVEMENT_CATEGORIES.CLUBS,
    tiers: {
      silver: {
        condition: { type: 'lightningMatchesHosted', value: 5 },
        points: 500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'lightning-bolt',
          color: '#C0C0C0',
          tier: 'silver' as const,
        },
      },
      gold: {
        condition: { type: 'lightningMatchesHosted', value: 15 },
        points: 1000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'lightning-bolt-circle',
          color: '#FFD700',
          tier: 'gold' as const,
        },
      },
      platinum: {
        condition: { type: 'lightningMatchesHosted', value: 50 },
        points: 2500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'weather-lightning',
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

  // === SPECIAL/HIDDEN ACHIEVEMENTS ===
  PERFECTIONIST: {
    id: 'perfectionist',
    name: 'Perfectionist',
    nameKo: '완벽주의자',
    description: 'Win matches without losing a set',
    descriptionKo: '세트를 잃지 않고 경기에서 승리하세요',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    tiers: {
      platinum: {
        condition: { type: 'perfectMatches', value: 10 },
        points: 2000,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'diamond-stone',
          color: '#E5E4E2',
          tier: 'platinum' as const,
        },
      },
    },
    hidden: true,
  },

  EARLY_ADOPTER: {
    id: 'early_adopter',
    name: 'Early Adopter',
    nameKo: '얼리 어답터',
    description: 'Join Lightning Pickleball in its early days',
    descriptionKo: '번개 피클볼 초기에 가입하세요',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    tiers: {
      platinum: {
        condition: { type: 'joinDate', value: 1672531200000 }, // Jan 1, 2023
        points: 1500,
        icon: {
          set: 'MaterialCommunityIcons' as const,
          name: 'lightning-bolt-circle',
          color: '#E5E4E2',
          tier: 'platinum' as const,
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
