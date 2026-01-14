import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import tournamentService from '../../services/tournamentService';
import userService from '../../services/userService';
import { Tournament, BracketMatch } from '../../types/tournament';
import { ScoreInputForm, Match, SetScore } from '../../types/match';
import { UserProfile } from '../../types/user';
import TournamentBracketView from '../../components/tournaments/TournamentBracketView';
import TournamentRankingsTab from '../../components/tournaments/TournamentRankingsTab';
import ScoreInputContent from '../../components/tournaments/ScoreInputContent';
import { db } from '../../firebase/config';

// Route params type definition
type TournamentDetailRouteParams = {
  tournamentId: string;
};

const TournamentDetailScreen = () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const { currentUser } = useAuth();
  const { paperTheme: theme } = useTheme();
  const { currentLanguage, t } = useLanguage();
  const styles = createStyles(theme);

  // Get params
  const { tournamentId } = route.params as TournamentDetailRouteParams;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'rankings'>('matches');

  // Score input state - Flow Switch pattern instead of modal over modal
  const [scoreInputMode, setScoreInputMode] = useState(false);
  const [selectedMatchForScoring, setSelectedMatchForScoring] = useState<BracketMatch | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  // Real-time subscription handles all data loading
  useEffect(() => {
    if (!tournamentId) {
      console.log('🏆 [TournamentDetail] Waiting for tournamentId...', {
        tournamentId: !!tournamentId,
      });
      return;
    }

    console.log(
      '🏆 [TournamentDetail] Setting up real-time subscriptions for tournament:',
      tournamentId
    );

    // Set up real-time listeners
    const unsubscribeTournament = setupTournamentListener(tournamentId);
    const unsubscribeMatches = setupMatchesListener(tournamentId);

    // Cleanup function to unsubscribe from listeners
    return () => {
      console.log('🏆 [TournamentDetail] Cleaning up real-time subscriptions');
      unsubscribeTournament();
      unsubscribeMatches();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  // 🐛 [DEBUG] Log tournament data whenever it loads
  useEffect(() => {
    if (tournament) {
      console.log('🔍 [TournamentDetail] Tournament data loaded:', {
        tournamentId: tournament.id,
        tournamentName: tournament.tournamentName,
        matchFormat: tournament.settings?.matchFormat,
        scoringFormat: tournament.settings?.scoringFormat,
        fullSettings: tournament.settings,
      });
    }
  }, [tournament?.id, tournament?.settings]);

  const loadTournamentData = async () => {
    try {
      setLoading(true);

      console.log('🏆 Loading tournament data:', { tournamentId });

      // Load tournament details
      const tournamentData = await tournamentService.getTournament(tournamentId);
      setTournament(tournamentData);

      // Load tournament matches
      const matchesData = await tournamentService.getTournamentMatches(tournamentId);
      setMatches(matchesData);

      console.log(
        '✅ [SUCCESS] Tournament data loaded:',
        matchesData.map(m => `${m.player1?.playerName} vs ${m.player2?.playerName}`).join(', ')
      );
    } catch (error) {
      console.error('Error loading tournament data:', error);
      Alert.alert(t('common.error'), t('tournamentDetail.errorLoadingData'));
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTournamentData();
  };

  // 🚀 Phase 1-2: Real-time tournament data synchronization
  const setupTournamentListener = (tournamentId: string) => {
    const tournamentRef = doc(db, 'tournaments', tournamentId);

    return onSnapshot(
      tournamentRef,
      doc => {
        if (doc.exists()) {
          const tournamentData = { id: doc.id, ...doc.data() } as Tournament;
          setTournament(tournamentData);
          console.log('🏆 [Real-time] Tournament data updated:', {
            status: tournamentData.status,
            currentRound: tournamentData.currentRound,
            timestamp: new Date().toISOString(),
          });
        } else {
          // 🎯 [KIM FIX] Tournament was deleted by another admin - block UI immediately and notify
          console.warn('🏆 [Real-time] Tournament was deleted:', tournamentId);

          // 🚨 CRITICAL: Set tournament to null FIRST to immediately block UI interactions
          // This triggers the "Tournament not found" fallback UI at line 772-781
          setTournament(null);
          setMatches([]); // Also clear matches to prevent any stale data access

          Alert.alert(
            t('tournamentDetail.tournamentDeleted'),
            t('tournamentDetail.tournamentDeletedMessage'),
            [
              {
                text: t('common.ok'),
                onPress: () => navigation.goBack(),
              },
            ],
            { cancelable: false }
          );
          return; // Don't proceed further
        }
        setLoading(false);
        setRefreshing(false);
      },
      error => {
        console.error('🏆 [Real-time] Tournament listener error:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );
  };

  // 🚀 Phase 1-2: Real-time matches data synchronization
  const setupMatchesListener = (tournamentId: string) => {
    const matchesRef = collection(db, 'tournaments', tournamentId, 'matches');

    return onSnapshot(
      matchesRef,
      snapshot => {
        const matchesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            tournamentId: data.tournamentId || tournamentId,
            round: data.roundNumber || data.round || 1,
            roundNumber: data.roundNumber || data.round || 1,
            matchNumber: data.matchNumber || 1,
            bracketPosition: data.bracketPosition || 1,
            status: data.status || 'scheduled',
            player1: data.player1,
            player2: data.player2,
            _winner: data.winner,
            winnerId: data.winner,
            score: data.score,
            scheduledTime: data.scheduledTime,
            court: data.court,
            nextMatch: data.nextMatch,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            ...data,
          } as BracketMatch;
        });

        setMatches(matchesData);
        console.log('🏆 [Real-time] Matches data updated:', {
          totalMatches: matchesData.length,
          completedMatches: matchesData.filter(m => m.status === 'completed').length,
          timestamp: new Date().toISOString(),
        });
      },
      error => {
        console.error('🏆 [Real-time] Matches listener error:', error);
      }
    );
  };

  // Convert tournament matches to bracket view format
  const convertToBracketFormat = (
    tournamentMatches: BracketMatch[],
    tournamentData: Tournament
  ) => {
    if (!tournamentMatches || tournamentMatches.length === 0) {
      return {
        rounds: [],
        champion: null,
      };
    }

    interface ConvertedMatch {
      id: string;
      matchNumber: number;
      player1: { playerId: string; playerName: string; seed: number } | null;
      player2: { playerId: string; playerName: string; seed: number } | null;
      winner: { playerId: string; playerName: string; seed: number } | null;
      score: unknown;
      status: string;
      nextMatchId?: string;
    }

    // Group matches by round
    const roundsMap: Record<number, ConvertedMatch[]> = {};
    tournamentMatches.forEach(match => {
      const roundNum = match.round || 1;
      const roundKey = typeof roundNum === 'number' ? roundNum : parseInt(String(roundNum), 10);
      if (!roundsMap[roundKey]) {
        roundsMap[roundKey] = [];
      }

      // Convert BracketMatch to format expected by TournamentBracketView
      let winner = null;
      const winnerPlayerId = match._winner || match.winnerId;

      if (winnerPlayerId && match.status === 'completed') {
        if (match.player1?.playerId === winnerPlayerId) {
          winner = {
            playerId: match.player1.playerId,
            playerName: match.player1.playerName,
            seed: match.player1.seed || 0,
          };
        } else if (match.player2?.playerId === winnerPlayerId) {
          winner = {
            playerId: match.player2.playerId,
            playerName: match.player2.playerName,
            seed: match.player2.seed || 0,
          };
        }
      }

      const convertedMatch = {
        id: match.id,
        matchNumber: match.bracketPosition || match.matchNumber || 1,
        player1: match.player1
          ? {
              playerId: match.player1.playerId,
              playerName: match.player1.playerName,
              seed: match.player1.seed || 0,
            }
          : null,
        player2: match.player2
          ? {
              playerId: match.player2.playerId,
              playerName: match.player2.playerName,
              seed: match.player2.seed || 0,
            }
          : null,
        winner,
        score: match.score || null,
        status: match.status || 'scheduled',
        nextMatchId: match.nextMatch?.matchId,
      };

      roundsMap[roundKey].push(convertedMatch);
    });

    // Convert to rounds array
    const rounds = Object.keys(roundsMap)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(roundNum => {
        const roundNumKey = parseInt(roundNum);
        return {
          roundNumber: roundNumKey,
          matches: roundsMap[roundNumKey].sort((a, b) => a.matchNumber - b.matchNumber),
        };
      });

    // Find champion (winner of final round)
    let champion = null;
    if (tournamentData.status === 'completed' && rounds.length > 0) {
      const finalRound = rounds[rounds.length - 1];
      const finalMatch = finalRound.matches.find(m => m.winner);
      if (finalMatch?.winner) {
        champion = finalMatch.winner;
      }
    }

    return {
      rounds,
      champion,
    };
  };

  // 🚀 Operation: Fully Armed Deployment - Pre-load player profiles before entering score mode
  const handleEnterScorePress = async (match: BracketMatch) => {
    setIsLoadingProfiles(true);
    try {
      console.log('🎯 [Fully Armed Deployment] Pre-loading player profiles:', {
        player1Id: match.player1?.playerId,
        player2Id: match.player2?.playerId,
      });

      // 💥 Step 1: Pre-fetch complete user profiles from Firestore
      const player1Profile: UserProfile | null = match.player1?.playerId
        ? ((await userService.getUserProfile(match.player1.playerId)) as UserProfile | null)
        : null;
      const player2Profile: UserProfile | null = match.player2?.playerId
        ? ((await userService.getUserProfile(match.player2.playerId)) as UserProfile | null)
        : null;

      console.log('🎯 [Fully Armed Deployment] Player profiles loaded:', {
        player1HasStats: !!player1Profile?.stats?.unifiedEloRating,
        player2HasStats: !!player2Profile?.stats?.unifiedEloRating,
        player1Elo: player1Profile?.stats?.unifiedEloRating,
        player2Elo: player2Profile?.stats?.unifiedEloRating,
      });

      // 💥 Step 2: Defensive coding - fill in default values if data is missing
      const enhancedPlayer1 = {
        ...match.player1!,
        userProfile: player1Profile,
        stats: player1Profile?.stats || {
          unifiedEloRating: 1200,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        },
      };

      const enhancedPlayer2 = {
        ...match.player2!,
        userProfile: player2Profile,
        stats: player2Profile?.stats || {
          unifiedEloRating: 1200,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        },
      };

      // 💥 Step 3: Create fully armed match object with complete data
      const fullyArmedMatch: BracketMatch = {
        ...match,
        player1: enhancedPlayer1,
        player2: enhancedPlayer2,
      };

      console.log('✅ [Fully Armed Deployment] Match fully armed and ready:', {
        player1: enhancedPlayer1.playerName,
        player2: enhancedPlayer2.playerName,
        player1Elo: enhancedPlayer1.stats.unifiedEloRating,
        player2Elo: enhancedPlayer2.stats.unifiedEloRating,
      });

      // 💥 Step 4: Only NOW switch to score input mode with complete data
      setSelectedMatchForScoring(fullyArmedMatch);
      setScoreInputMode(true);
    } catch (error) {
      console.error('❌ [Fully Armed Deployment] Failed to pre-fetch player profiles:', error);
      Alert.alert(t('common.error'), t('tournamentDetail.errorLoadingPlayerInfo'));
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleMatchPress = (matchFromBracket: {
    id: string;
    player1?: { playerName: string } | null;
    player2?: { playerName: string } | null;
    status?: string;
  }) => {
    console.log('🏆 Match pressed in TournamentDetailScreen:', {
      id: matchFromBracket.id,
      player1: matchFromBracket.player1?.playerName,
      player2: matchFromBracket.player2?.playerName,
      status: matchFromBracket.status,
    });

    // Find the full BracketMatch object from our matches state
    const fullMatch = matches.find(m => m.id === matchFromBracket.id);
    if (!fullMatch) {
      Alert.alert(t('common.error'), t('tournamentDetail.matchNotFound'));
      return;
    }

    // Check if user can enter scores (participant in the match or admin)
    const isParticipant =
      currentUser &&
      (fullMatch.player1?.playerId === currentUser.uid ||
        fullMatch.player2?.playerId === currentUser.uid);
    const isTournamentCreator =
      currentUser && tournament && tournament.createdBy === currentUser.uid;
    const isTournamentAdmin = isTournamentCreator; // Admin view
    const canEnterScore = isParticipant || isTournamentAdmin;

    console.log('🏆 Match press validation:', {
      matchId: matchFromBracket.id,
      status: matchFromBracket.status,
      currentUserId: currentUser?.uid,
      player1Id: fullMatch.player1?.playerId,
      player2Id: fullMatch.player2?.playerId,
      isParticipant,
      isTournamentCreator,
      isTournamentAdmin,
      canEnterScore,
      hasBothPlayers: !!(fullMatch.player1 && fullMatch.player2),
    });

    // Allow score entry for scheduled/in_progress matches where user has permission
    if (
      (matchFromBracket.status === 'scheduled' || matchFromBracket.status === 'in_progress') &&
      canEnterScore &&
      fullMatch.player1 &&
      fullMatch.player2
    ) {
      // 🚀 Operation: Fully Armed Deployment - Pre-load player profiles
      handleEnterScorePress(fullMatch);
    } else if (matchFromBracket.status === 'completed') {
      // Show match result details
      Alert.alert(
        t('tournamentDetail.matchResult'),
        `${matchFromBracket.player1?.playerName || 'TBD'} vs ${matchFromBracket.player2?.playerName || 'TBD'}`
      );
    } else if (!canEnterScore) {
      Alert.alert(t('tournamentDetail.info'), t('tournamentDetail.onlyParticipantsCanEnterScore'));
    } else {
      Alert.alert(
        t('tournamentDetail.matchInfo'),
        `${matchFromBracket.player1?.playerName || 'TBD'} vs ${matchFromBracket.player2?.playerName || 'TBD'}`
      );
    }
  };

  const handleScoreSubmit = async (scoreData: ScoreInputForm) => {
    if (!selectedMatchForScoring || !tournament) return;

    try {
      console.log('🏆 Original score data from ScoreInputModal:', {
        matchId: selectedMatchForScoring.id,
        scoreData,
        _winner: scoreData._winner,
        selectedMatch: {
          player1: selectedMatchForScoring.player1,
          player2: selectedMatchForScoring.player2,
        },
      });

      // Convert _winner to actual user ID
      let winnerId: string | undefined = undefined;
      if (scoreData._winner === 'player1' && selectedMatchForScoring.player1) {
        winnerId = selectedMatchForScoring.player1.playerId;
      } else if (scoreData._winner === 'player2' && selectedMatchForScoring.player2) {
        winnerId = selectedMatchForScoring.player2.playerId;
      }

      console.log('🏆 Winner calculation:', {
        _winner: scoreData._winner,
        player1Id: selectedMatchForScoring.player1?.playerId,
        player2Id: selectedMatchForScoring.player2?.playerId,
        calculatedWinnerId: winnerId,
      });

      // Validate that we have a winner if the match is complete
      if (scoreData._winner && !winnerId) {
        throw new Error(
          `Winner identified as '${scoreData._winner}' but corresponding player ID not found`
        );
      }

      // Validate tiebreak data completeness
      for (let i = 0; i < scoreData.sets.length; i++) {
        const set = scoreData.sets[i];
        if (set.player1Games === 6 && set.player2Games === 6) {
          // If it's a 6-6 set, we need tiebreak points
          if (set.player1TiebreakPoints === undefined || set.player2TiebreakPoints === undefined) {
            throw new Error(
              `Set ${i + 1} is 6-6 but missing tiebreak points. Please enter complete tiebreak scores.`
            );
          }

          // Validate tiebreak rules
          const tb1 = set.player1TiebreakPoints;
          const tb2 = set.player2TiebreakPoints;
          const pointsToWin = i === 2 ? 10 : 7; // Super tiebreak for 3rd set
          const maxPoints = Math.max(tb1, tb2);
          const minPoints = Math.min(tb1, tb2);

          if (maxPoints < pointsToWin || maxPoints - minPoints < 2) {
            const tiebreakType = i === 2 ? 'Super tiebreak' : 'Tiebreak';
            throw new Error(
              `Set ${i + 1} ${tiebreakType}: Need ${pointsToWin}+ points with 2+ point margin. Current: ${tb1}-${tb2}`
            );
          }
        }
      }

      // Convert ScoreInputForm to TournamentScore format
      const convertedSets = scoreData.sets.map((set): SetScore => {
        const convertedSet: SetScore = {
          player1Games: set.player1Games,
          player2Games: set.player2Games,
        };

        // Add tiebreak data if it exists
        if (set.player1TiebreakPoints !== undefined || set.player2TiebreakPoints !== undefined) {
          convertedSet.player1TiebreakPoints = set.player1TiebreakPoints || 0;
          convertedSet.player2TiebreakPoints = set.player2TiebreakPoints || 0;
        }

        return convertedSet;
      });

      // Create final score string with tiebreak formatting
      const finalScore = scoreData.sets
        .map((set, index) => {
          let setScore = `${set.player1Games}-${set.player2Games}`;

          // Add tiebreak points to display
          if (
            set.player1Games === 6 &&
            set.player2Games === 6 &&
            (set.player1TiebreakPoints !== undefined || set.player2TiebreakPoints !== undefined)
          ) {
            const tb1 = set.player1TiebreakPoints || 0;
            const tb2 = set.player2TiebreakPoints || 0;

            // For 3rd set (super tiebreak), show full score. For regular tiebreak, show winner's score.
            if (index === 2) {
              setScore += `(${tb1}-${tb2})`;
            } else {
              setScore += `(${Math.max(tb1, tb2)})`;
            }
          }

          return setScore;
        })
        .join(', ');

      // Sanitize data by removing undefined values
      const tournamentResult = {
        winnerId: winnerId || null,
        score: {
          sets: convertedSets,
          finalScore,
          winner: scoreData._winner || null,
          retired: scoreData.retired || false,
          walkover: scoreData.walkover || false,
        } as const,
        // Only include notes if it has content
        ...(scoreData.notes && scoreData.notes.trim() && { notes: scoreData.notes.trim() }),
      };

      console.log('🏆 Converted tournament result:', tournamentResult);

      // Submit the score using tournament service
      /* eslint-disable @typescript-eslint/no-explicit-any */
      await tournamentService.submitMatchResult(
        tournament.id,
        selectedMatchForScoring.id,
        tournamentResult as any
      );
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // 🚀 Flow Switch: 점수 입력 모드 종료하고 토너먼트 화면으로 복귀
      setScoreInputMode(false);
      setSelectedMatchForScoring(null);

      // Real-time listeners will automatically update the UI
      console.log('🏆 Score submitted successfully - real-time updates will reflect changes');

      Alert.alert(
        t('tournamentDetail.scoreSubmitted'),
        t('tournamentDetail.scoreSubmittedMessage'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Error submitting tournament match score:', error);

      const errorMessage = (error as Error)?.message || 'Unknown error occurred';

      console.error('[Management] Error submitting tournament match score:', {
        error,
        errorMessage,
        stack: (error as Error)?.stack,
      });

      // Provide user-friendly error messages
      let userMessage = errorMessage;
      if (errorMessage.includes('missing tiebreak points')) {
        userMessage = t('tournamentDetail.tiebreakRequired');
      } else if (errorMessage.includes('Need') && errorMessage.includes('points with')) {
        userMessage = t('tournamentDetail.invalidTiebreak');
      } else if (errorMessage.includes('Unsupported field value: undefined')) {
        userMessage = t('tournamentDetail.incompleteScoreData');
      }

      Alert.alert(t('tournamentDetail.scoreSubmissionFailed'), userMessage);
    }
  };

  const handleScoreInputCancel = () => {
    setScoreInputMode(false);
    setSelectedMatchForScoring(null);
  };

  // Convert BracketMatch to Match format for ScoreInputModal
  // 🎯 PRESERVED: Fully Armed Deployment data preservation
  const convertBracketMatchToMatch = (bracketMatch: BracketMatch): Match | null => {
    if (!bracketMatch.player1 || !bracketMatch.player2) {
      console.log('🏆 Cannot convert bracket match - missing players:', {
        matchId: bracketMatch.id,
        hasPlayer1: !!bracketMatch.player1,
        hasPlayer2: !!bracketMatch.player2,
      });
      return null;
    }

    console.log('🎯 [Data Preservation] Converting BracketMatch with Fully Armed data:', {
      matchId: bracketMatch.id,
      player1Name: bracketMatch.player1.playerName,
      player2Name: bracketMatch.player2.playerName,
      player1HasStats: !!(bracketMatch.player1 as unknown as { stats?: unknown })?.stats,
      player2HasStats: !!(bracketMatch.player2 as unknown as { stats?: unknown })?.stats,
      player1Elo: (bracketMatch.player1 as unknown as { stats?: { unifiedEloRating?: number } })
        ?.stats?.unifiedEloRating,
      player2Elo: (bracketMatch.player2 as unknown as { stats?: { unifiedEloRating?: number } })
        ?.stats?.unifiedEloRating,
    });

    return {
      id: bracketMatch.id,
      type: 'tournament',
      format: 'singles', // Default to singles for tournaments
      eventType: 'mens_singles', // Default event type

      // 🎯 PRESERVED: Create MatchParticipant objects with Fully Armed data
      player1: {
        userId: bracketMatch.player1.playerId,
        userName: bracketMatch.player1.playerName || 'Player 1',
        skillLevel: 'intermediate', // Default skill level
        photoURL: undefined,
        // 🎯 PRESERVED: Add Fully Armed Deployment data
        userProfile: (bracketMatch.player1 as unknown as { userProfile?: UserProfile })
          ?.userProfile,
        stats: (bracketMatch.player1 as unknown as { stats?: unknown })?.stats,
      },
      player2: {
        userId: bracketMatch.player2.playerId,
        userName: bracketMatch.player2.playerName || 'Player 2',
        skillLevel: 'intermediate', // Default skill level
        photoURL: undefined,
        // 🎯 PRESERVED: Add Fully Armed Deployment data
        userProfile: (bracketMatch.player2 as unknown as { userProfile?: UserProfile })
          ?.userProfile,
        stats: (bracketMatch.player2 as unknown as { stats?: unknown })?.stats,
      },

      // Match scheduling info
      scheduledAt: bracketMatch.scheduledTime
        ? typeof bracketMatch.scheduledTime.toDate === 'function'
          ? bracketMatch.scheduledTime
          : new Date()
        : new Date(),

      // Match metadata for compatibility
      status: bracketMatch.status || 'scheduled',
      location: bracketMatch.court || '',

      // Required fields for Match interface
      clubId: bracketMatch.tournamentId,
      createdBy: '',
      createdAt: bracketMatch.createdAt,
      updatedAt: bracketMatch.updatedAt,
    } as Match;
  };

  // 🏆 Hall of Fame Rankings Display
  const renderRankingsTab = () => {
    return (
      <TournamentRankingsTab
        participants={tournament?.participants || []}
        matches={matches}
        currentUserId={currentUser?.uid}
        eventType={tournament?.eventType}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('tournamentDetail.loadingTournament')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tournament) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('tournamentDetail.tournamentNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const bracket = convertToBracketFormat(matches, tournament) as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const isTournamentCreator = !!(
    currentUser &&
    tournament &&
    tournament.createdBy === currentUser.uid
  );

  // 🔧 Calculate setsToWin from matchFormat (more reliable than stored value)
  const calculateSetsToWin = (matchFormat: string | undefined): number => {
    const result = matchFormat === 'best_of_5' ? 3 : matchFormat === 'best_of_3' ? 2 : 1;
    console.log('🐛 [TournamentDetail] calculateSetsToWin called:', {
      matchFormat,
      result,
      tournamentSettings: tournament?.settings,
    });
    return result;
  };

  // 🐛 [DEBUG] Calculate and log setsToWin BEFORE passing to ScoreInputContent
  const setsToWinForScoreInput = (() => {
    const result = calculateSetsToWin(tournament?.settings?.matchFormat);
    console.log('🚨 [TournamentDetail] Passing setsToWin to ScoreInputContent:', {
      tournamentId: tournament?.id,
      'tournament?.settings': tournament?.settings,
      'tournament?.settings?.matchFormat': tournament?.settings?.matchFormat,
      'tournament?.settings?.scoringFormat': tournament?.settings?.scoringFormat,
      calculatedSetsToWin: result,
    });
    return result;
  })();

  return (
    <SafeAreaView style={styles.container}>
      {scoreInputMode && selectedMatchForScoring && currentUser ? (
        // 📝 점수 입력 모드: ScoreInputContent 렌더링
        <ScoreInputContent
          match={convertBracketMatchToMatch(selectedMatchForScoring)!}
          setsToWin={setsToWinForScoreInput} // ⚡ [THOR] Calculate from matchFormat instead of stored value
          gamesPerSet={tournament?.settings?.scoringFormat?.gamesPerSet || 6} // ⚡ [THOR] Pass games per set with fallback
          onCancel={handleScoreInputCancel}
          onSubmit={handleScoreSubmit}
        />
      ) : (
        // 🏆 기본 모드: 토너먼트 대진표 표시
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name='arrow-back' size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {tournament.tournamentName || tournament.title}
              </Text>
              <Text style={styles.headerSubtitle}>
                {tournament.startDate?.toDate().toLocaleDateString() || ''}
                {tournament.endDate && ' - ' + tournament.endDate.toDate().toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.headerRight}>{/* Tournament status indicator */}</View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
              onPress={() => setActiveTab('matches')}
            >
              <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>
                {t('tournamentDetail.bracket')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'rankings' && styles.activeTab]}
              onPress={() => setActiveTab('rankings')}
            >
              <Text style={[styles.tabText, activeTab === 'rankings' && styles.activeTabText]}>
                {t('tournamentDetail.hallOfFame')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'matches' ? (
              tournament.status === 'draft' || tournament.status === 'registration' ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name='trophy-outline' size={64} color='#ddd' />
                  <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                    {t('tournamentDetail.bracketNotGenerated')}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    {t('tournamentDetail.bracketWillBeGenerated')}
                  </Text>
                </View>
              ) : (
                <>
                  {/* Tournament Info Header */}
                  <View
                    style={[styles.tournamentInfoHeader, { backgroundColor: theme.colors.surface }]}
                  >
                    <Text style={[styles.tournamentInfoTitle, { color: theme.colors.onSurface }]}>
                      {tournament.tournamentName || tournament.title}
                    </Text>
                    <Text
                      style={[
                        styles.tournamentInfoStatus,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {tournament.status === 'bracket_generation' &&
                        t('tournamentDetail.statusGeneratingBracket')}
                      {tournament.status === 'in_progress' &&
                        t('tournamentDetail.statusInProgress')}
                      {tournament.status === 'completed' && t('tournamentDetail.statusCompleted')}
                    </Text>
                    {tournament.participants && (
                      <Text
                        style={[
                          styles.tournamentInfoParticipants,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {t('tournamentDetail.participants')}: {tournament.participants.length}
                        {currentLanguage === 'ko' ? t('tournamentDetail.participantsSuffix') : ''}
                      </Text>
                    )}
                  </View>

                  {/* Tournament Bracket View */}
                  <TournamentBracketView
                    bracket={bracket}
                    currentUserId={currentUser?.uid}
                    isTournamentAdmin={isTournamentCreator}
                    onMatchPress={handleMatchPress}
                  />
                </>
              )
            ) : (
              renderRankingsTab()
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: {
  colors: {
    background: string;
    primary: string;
    surface: string;
    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
  };
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    headerRight: {
      width: 40,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    activeTabText: {
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
    tournamentInfoHeader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.1)',
      marginBottom: 16,
    },
    tournamentInfoTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    tournamentInfoStatus: {
      fontSize: 14,
      marginTop: 4,
    },
    tournamentInfoParticipants: {
      fontSize: 12,
      marginTop: 2,
    },
    emptyCard: {
      marginTop: 40,
    },
    emptyContent: {
      alignItems: 'center',
      paddingVertical: 40,
    },
  });

export default TournamentDetailScreen;
