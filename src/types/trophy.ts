/**
 * Trophy Type Definitions
 */

export interface SeasonTrophy {
  id: string;
  type:
    | 'season_champion_gold'
    | 'season_champion_silver'
    | 'season_champion_bronze'
    | 'rank_up'
    | 'iron_man'
    | 'ace';
  seasonId: string;
  seasonName: string;
  gradeGroup?: string; // For champion trophies (e.g., "4" for 4.0-4.5 group)
  awardedAt: Date;
  metadata?: {
    rank?: number; // Final rank within grade group
    totalInGroup?: number; // Total players in grade group
    matchesPlayed?: number; // For iron man trophy
    winRate?: number; // For ace trophy
    previousGrade?: string; // For rank up trophy (e.g., "3.5")
    newGrade?: string; // For rank up trophy (e.g., "4.0")
  };
}
