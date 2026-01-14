/**
 * Competitions Context for Lightning Tennis
 * Manages leagues, tournaments, and user competition data
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import leagueService from '../services/leagueService';
import tournamentService from '../services/tournamentService';
import { useAuth } from './AuthContext';
import i18n from '../i18n';

interface League {
  id: string;
  name: string;
  description: string;
  season: string;
  region: string;
  format: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  registrationDeadline: Date | string;
  totalPlayers: number;
  divisions: unknown[];
  userDivision?: string;
  userStats?: unknown;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  location: string;
  format: string;
  drawSize: number;
  status: string;
  startDate: Date | string;
  registrationDeadline: Date | string;
  entries: unknown[];
  maxEntries: number;
  entryFee: number;
  userResult?: {
    seed?: number;
    status: string;
    finalPosition: string;
  };
}

interface UserCompetitionStats {
  leagues: {
    total: number;
    active: number;
    completed: number;
    wins: number;
    bestDivision?: string;
  };
  tournaments: {
    total: number;
    active: number;
    completed: number;
    wins: number;
    bestResult?: string;
  };
}

interface CompetitionsContextType {
  // State
  userLeagues: League[];
  userTournaments: Tournament[];
  availableLeagues: League[];
  availableTournaments: Tournament[];
  competitionStats: UserCompetitionStats;
  loading: boolean;
  error: string | null;

  // Actions
  loadUserCompetitions: () => Promise<void>;
  loadAvailableCompetitions: () => Promise<void>;
  joinLeague: (leagueId: string) => Promise<void>;
  joinTournament: (tournamentId: string) => Promise<void>;
  submitMatchResult: (
    competitionType: 'league' | 'tournament',
    competitionId: string,
    matchId: string,
    result: unknown
  ) => Promise<void>;
  refreshData: () => Promise<void>;
}

const CompetitionsContext = createContext<CompetitionsContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useCompetitions = () => {
  const context = useContext(CompetitionsContext);
  if (context === undefined) {
    throw new Error('useCompetitions must be used within a CompetitionsProvider');
  }
  return context;
};

interface CompetitionsProviderProps {
  children: ReactNode;
}

export const CompetitionsProvider: React.FC<CompetitionsProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();

  // State
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [userTournaments, setUserTournaments] = useState<Tournament[]>([]);
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([]);
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);
  const [competitionStats, setCompetitionStats] = useState<UserCompetitionStats>({
    leagues: {
      total: 0,
      active: 0,
      completed: 0,
      wins: 0,
    },
    tournaments: {
      total: 0,
      active: 0,
      completed: 0,
      wins: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's competitions
  const loadUserCompetitions = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const [leagues, tournaments] = await Promise.all([
        (leagueService as any).getUserLeagues(currentUser.uid),
        (tournamentService as any).getUserTournaments(currentUser.uid),
      ]);
      /* eslint-enable @typescript-eslint/no-explicit-any */

      setUserLeagues(leagues);
      setUserTournaments(tournaments);

      // Calculate stats
      updateCompetitionStats(leagues, tournaments);

      console.log('✅ User competitions loaded');
    } catch (err: unknown) {
      console.error('❌ Failed to load user competitions:', err);
      setError(i18n.t('contexts.competitions.failedToLoadCompetitions'));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load available competitions
  const loadAvailableCompetitions = useCallback(async () => {
    try {
      setError(null);

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const [leagues, tournaments] = await Promise.all([
        (leagueService as any).getActiveLeagues(),
        (tournamentService as any).getUpcomingTournaments(),
      ]);
      /* eslint-enable @typescript-eslint/no-explicit-any */

      setAvailableLeagues(leagues);
      setAvailableTournaments(tournaments);

      console.log('✅ Available competitions loaded');
    } catch (err: unknown) {
      console.error('❌ Failed to load available competitions:', err);
      setError(i18n.t('contexts.competitions.failedToLoadAvailableCompetitions'));
    }
  }, []);

  // Join a league
  const joinLeague = async (leagueId: string) => {
    try {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      await (leagueService as any).registerForLeague(leagueId, currentUser?.uid);

      // Refresh data
      await Promise.all([loadUserCompetitions(), loadAvailableCompetitions()]);

      console.log('✅ Joined league successfully');
    } catch (err: unknown) {
      console.error('❌ Failed to join league:', err);
      throw err;
    }
  };

  // Join a tournament
  const joinTournament = async (tournamentId: string) => {
    try {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      await (tournamentService as any).registerForTournament(tournamentId, currentUser?.uid);

      // Refresh data
      await Promise.all([loadUserCompetitions(), loadAvailableCompetitions()]);

      console.log('✅ Joined tournament successfully');
    } catch (err: unknown) {
      console.error('❌ Failed to join tournament:', err);
      throw err;
    }
  };

  // Submit match result
  const submitMatchResult = async (
    competitionType: 'league' | 'tournament',
    competitionId: string,
    matchId: string,
    result: unknown
  ) => {
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      if (competitionType === 'league') {
        // Extract division ID from match ID if needed
        const divisionId = (result as any).divisionId || 'div_1';
        await (leagueService as any).submitMatchResult(competitionId, divisionId, matchId, result);
      } else {
        await (tournamentService as any).submitMatchResult(competitionId, matchId, result);
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // Refresh user competitions to show updated results
      await loadUserCompetitions();

      console.log('✅ Match result submitted successfully');
    } catch (err: unknown) {
      console.error('❌ Failed to submit match result:', err);
      throw err;
    }
  };

  // Calculate competition statistics
  const updateCompetitionStats = (leagues: League[], tournaments: Tournament[]) => {
    const leagueStats = {
      total: leagues.length,
      active: leagues.filter(l => l.status === 'in_progress' || l.status === 'registration').length,
      completed: leagues.filter(l => l.status === 'completed').length,
      wins: 0, // Calculate from user stats
      bestDivision: undefined as string | undefined,
    };

    const tournamentStats = {
      total: tournaments.length,
      active: tournaments.filter(t => t.status === 'in_progress' || t.status === 'check_in').length,
      completed: tournaments.filter(t => t.status === 'completed').length,
      wins: 0, // Calculate from user results
      bestResult: undefined as string | undefined,
    };

    // Find best results
    let bestDivisionLevel = 999;
    for (const league of leagues) {
      if (league.userDivision) {
        const divisionNumber = parseInt(league.userDivision.match(/\d+/)?.[0] || '999');
        if (divisionNumber < bestDivisionLevel) {
          bestDivisionLevel = divisionNumber;
          leagueStats.bestDivision = league.userDivision;
        }
      }
    }

    const resultRanking: Record<string, number> = {
      Champion: 1,
      'Runner-up': 2,
      Semifinalist: 3,
      Quarterfinalist: 4,
      'Round of 16': 5,
      'Round of 32': 6,
    };

    let bestResultRank = 999;
    for (const tournament of tournaments) {
      if (tournament.userResult?.finalPosition) {
        const rank = resultRanking[tournament.userResult.finalPosition] || 999;
        if (rank < bestResultRank) {
          bestResultRank = rank;
          tournamentStats.bestResult = tournament.userResult.finalPosition;
        }
        if (tournament.userResult.finalPosition === 'Champion') {
          tournamentStats.wins++;
        }
      }
    }

    setCompetitionStats({
      leagues: leagueStats,
      tournaments: tournamentStats,
    });
  };

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([loadUserCompetitions(), loadAvailableCompetitions()]);
  };

  // Load data when user changes
  useEffect(() => {
    if (currentUser) {
      loadUserCompetitions();
      loadAvailableCompetitions();
    } else {
      // Clear data when user logs out
      setUserLeagues([]);
      setUserTournaments([]);
      setAvailableLeagues([]);
      setAvailableTournaments([]);
      setCompetitionStats({
        leagues: { total: 0, active: 0, completed: 0, wins: 0 },
        tournaments: { total: 0, active: 0, completed: 0, wins: 0 },
      });
    }
  }, [currentUser, loadUserCompetitions, loadAvailableCompetitions]);

  const value: CompetitionsContextType = {
    // State
    userLeagues,
    userTournaments,
    availableLeagues,
    availableTournaments,
    competitionStats,
    loading,
    error,

    // Actions
    loadUserCompetitions,
    loadAvailableCompetitions,
    joinLeague,
    joinTournament,
    submitMatchResult,
    refreshData,
  };

  return <CompetitionsContext.Provider value={value}>{children}</CompetitionsContext.Provider>;
};
