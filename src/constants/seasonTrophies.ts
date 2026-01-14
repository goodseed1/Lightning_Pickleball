/**
 * 🏛️ PROJECT OLYMPUS - Honor System Phase 3
 * Season Trophy Definitions
 *
 * Trophies awarded at season end to official rankers:
 * - Season Champions (Gold/Silver/Bronze) - Top 3 in each LPR grade group
 * - Rank Up - Improved LPR grade during season
 * - Iron Man - Top 10% in matches played
 * - Ace - Top 5% win rate with 10+ matches
 */

export const SEASON_TROPHIES = {
  SEASON_CHAMPION_GOLD: {
    id: 'season_champion_gold',
    name: 'Season Champion',
    nameKo: '시즌 챔피언',
    description: 'Achieved 1st place in your LPR grade group',
    descriptionKo: 'LPR 등급 그룹 내 1위 달성',
    icon: {
      set: 'MaterialCommunityIcons' as const,
      name: 'trophy',
      color: '#FFD700',
    },
    rank: 1,
  },
  SEASON_CHAMPION_SILVER: {
    id: 'season_champion_silver',
    name: 'Season Runner-up',
    nameKo: '시즌 준우승',
    description: 'Achieved 2nd place in your LPR grade group',
    descriptionKo: 'LPR 등급 그룹 내 2위 달성',
    icon: {
      set: 'MaterialCommunityIcons' as const,
      name: 'trophy',
      color: '#C0C0C0',
    },
    rank: 2,
  },
  SEASON_CHAMPION_BRONZE: {
    id: 'season_champion_bronze',
    name: 'Season 3rd Place',
    nameKo: '시즌 3위',
    description: 'Achieved 3rd place in your LPR grade group',
    descriptionKo: 'LPR 등급 그룹 내 3위 달성',
    icon: {
      set: 'MaterialCommunityIcons' as const,
      name: 'trophy',
      color: '#CD7F32',
    },
    rank: 3,
  },
  RANK_UP: {
    id: 'rank_up',
    name: 'Rank Up',
    nameKo: '랭크업',
    description: 'Improved your LPR grade during the season',
    descriptionKo: '시즌 중 LPR 등급 상승',
    icon: {
      set: 'MaterialCommunityIcons' as const,
      name: 'rocket-launch',
      color: '#4CAF50',
    },
  },
  IRON_MAN: {
    id: 'iron_man',
    name: 'Iron Man',
    nameKo: '아이언맨',
    description: 'Top 10% in matches played this season',
    descriptionKo: '시즌 최다 경기 상위 10%',
    icon: {
      set: 'MaterialCommunityIcons' as const,
      name: 'fire',
      color: '#FF5722',
    },
  },
  ACE: {
    id: 'ace',
    name: 'Ace',
    nameKo: '에이스',
    description: 'Top 5% win rate with 10+ matches',
    descriptionKo: '10경기 이상 + 최고 승률 상위 5%',
    icon: {
      set: 'FontAwesome5' as const,
      name: 'star',
      color: '#9C27B0',
    },
  },
} as const;

export type SeasonTrophyId = keyof typeof SEASON_TROPHIES;
