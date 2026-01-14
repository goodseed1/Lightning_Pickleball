/**
 * Tournament Bracket Screen
 * Shows tournament bracket view for members to see matches and progress
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import tournamentService from '../../services/tournamentService';
import { useLanguage } from '../../contexts/LanguageContext';
import { Tournament, BracketMatch } from '../../types/tournament';
import { ScoreInputForm, Match } from '../../types/match';
import TournamentBracketView from '../../components/tournaments/TournamentBracketView';
import TournamentRankingsTab from '../../components/tournaments/TournamentRankingsTab';
import ScoreInputModal from '../../components/match/ScoreInputModal';

interface RouteParams {
  tournamentId: string;
  tournamentName: string;
  clubId: string;
  isAdminView?: boolean;
}

const TournamentBracketScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { tournamentId, tournamentName, isAdminView = false } = route.params as RouteParams;
  const { currentUser } = useAuth();
  const { paperTheme: theme } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'participants' | 'standings'>('matches');

  // Real-time subscription reference
  const matchesUnsubscribe = useRef<(() => void) | null>(null);

  const loadTournamentData = useCallback(async () => {
    try {
      setLoading(true);

      console.log('🎾 Loading tournament data:', { tournamentId });

      // Load tournament details
      const tournamentData = await tournamentService.getTournament(tournamentId);
      setTournament(tournamentData);

      // Set up real-time subscription for matches
      if (matchesUnsubscribe.current) {
        matchesUnsubscribe.current();
      }

      matchesUnsubscribe.current = tournamentService.subscribeToTournamentMatches(
        tournamentId,
        matchesData => {
          console.log('🎾 Real-time matches update received:', {
            matchCount: matchesData.length,
            completedMatches: matchesData.filter(m => m.status === 'completed').length,
            matchesData: matchesData.map(m => ({
              id: m.id,
              status: m.status,
              player1: m.player1?.playerName,
              player2: m.player2?.playerName,
              _winner: m._winner,
              hasScore: !!m.score,
            })),
          });
          setMatches(matchesData);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error loading tournament data:', error);
      Alert.alert(t('common.error'), t('tournamentBracket.errorLoadingData'));
      navigation.goBack();
      setLoading(false);
    }
  }, [tournamentId, navigation]);

  useEffect(() => {
    loadTournamentData();

    // Cleanup function to unsubscribe from real-time listeners
    return () => {
      if (matchesUnsubscribe.current) {
        console.log('🎾 Cleaning up real-time subscription');
        matchesUnsubscribe.current();
        matchesUnsubscribe.current = null;
      }
    };
  }, [loadTournamentData]);

  // 🏗️ 아이언맨의 지능형 브라켓 건축사 헬퍼
  const calculateRoundFromBracketPosition = (position: number): number => {
    if (!position) return 1;
    // 토너먼트 구조 분석:
    // bracketPosition 1-2: Round 1 (첫 번째 라운드)
    // bracketPosition 3-4: Round 2 (준결승)
    // bracketPosition 5+: Round 3 (결승)
    if (position <= 2) return 1;
    if (position <= 4) return 2;
    return 3;
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

    // 🏗️ 지능형 라운드 그룹화 로직 - 여러 필드에서 라운드 번호 추출
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const roundsMap: { [round: number]: ConvertedMatch[] } = {};

    console.log('🏗️ [ARCHITECT] Starting intelligent bracket grouping...');

    tournamentMatches.forEach(match => {
      // 🎯 다중 소스 라운드 번호 결정 전략
      const roundNum =
        match.round ||
        match.roundNumber ||
        calculateRoundFromBracketPosition(match.bracketPosition) ||
        1;

      console.log('🏗️ [BRACKET GROUPING]', {
        matchId: match.id,
        bracketPosition: match.bracketPosition,
        round: match.round,
        roundNumber: match.roundNumber,
        calculatedRound: roundNum,
        player1: match.player1?.playerName,
        player2: match.player2?.playerName,
      });

      if (!(roundsMap as any)[roundNum]) {
        (roundsMap as any)[roundNum] = [];
      }

      // Convert BracketMatch to format expected by TournamentBracketView
      // Fix winner display: create winner object from _winner field
      console.log('🎾 Processing match for bracket display:', {
        matchId: match.id,
        status: match.status,
        _winner: match._winner,
        player1: match.player1?.playerName,
        player2: match.player2?.playerName,
        score: match.score,
      });

      let winner = null;
      // Enhanced winner determination with detailed logging
      // Priority: _winner → score.winner → legacy winnerId
      let winnerPlayerId =
        match._winner || (match as BracketMatch & { winnerId?: string }).winnerId;

      // If no winner field set but match is completed with score, try to get winner from score
      if (!winnerPlayerId && match.status === 'completed' && match.score?.winner) {
        if (match.score.winner === 'player1' && match.player1) {
          winnerPlayerId = match.player1.playerId;
          console.log('🎾 Winner determined from score.winner=player1:', winnerPlayerId);
        } else if (match.score.winner === 'player2' && match.player2) {
          winnerPlayerId = match.player2.playerId;
          console.log('🎾 Winner determined from score.winner=player2:', winnerPlayerId);
        }
      }

      // Log winner determination process for debugging
      console.log('🎾 Winner determination for match', match.id, ':', {
        status: match.status,
        _winner: match._winner,
        scoreWinner: match.score?.winner,
        legacyWinnerId: (match as BracketMatch & { winnerId?: string }).winnerId,
        finalWinnerPlayerId: winnerPlayerId,
        hasScore: !!match.score,
      });

      if (winnerPlayerId && match.status === 'completed') {
        if (match.player1?.playerId === winnerPlayerId) {
          winner = {
            playerId: match.player1.playerId,
            playerName: match.player1.playerName,
            seed: match.player1.seed || 0,
          };
          console.log('✅ Winner object created for player1:', winner.playerName);
        } else if (match.player2?.playerId === winnerPlayerId) {
          winner = {
            playerId: match.player2.playerId,
            playerName: match.player2.playerName,
            seed: match.player2.seed || 0,
          };
          console.log('✅ Winner object created for player2:', winner.playerName);
        } else {
          console.warn('⚠️ Winner ID found but does not match either player:', {
            winnerPlayerId,
            player1Id: match.player1?.playerId,
            player2Id: match.player2?.playerId,
          });
        }
      } else if (match.status === 'completed' && !winnerPlayerId) {
        console.warn('⚠️ Match completed but no winner determined:', match.id);
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

      (roundsMap as any)[roundNum].push(convertedMatch);
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Convert to rounds array
    const rounds = Object.keys(roundsMap)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(roundNum => ({
        roundNumber: parseInt(roundNum),
        matches: roundsMap[parseInt(roundNum)].sort((a, b) => a.matchNumber - b.matchNumber),
      }));

    // 🏗️ 아이언맨의 건축 결과 보고서
    console.log('🏗️ [ARCHITECT REPORT] Bracket construction completed:');
    rounds.forEach(round => {
      console.log(`  📍 Round ${round.roundNumber}: ${round.matches.length} matches`);
      round.matches.forEach(match => {
        console.log(
          `    - Match ${match.id}: ${match.player1?.playerName || 'TBD'} vs ${match.player2?.playerName || 'TBD'}`
        );
      });
    });
    console.log('🏗️ [ARCHITECT] Total rounds created:', rounds.length);

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

  const handleMatchPress = (matchFromBracket: {
    id: string;
    player1?: { playerName: string } | null;
    player2?: { playerName: string } | null;
    status?: string;
  }) => {
    console.log('🎾 Match pressed:', {
      id: matchFromBracket.id,
      player1: matchFromBracket.player1?.playerName,
      player2: matchFromBracket.player2?.playerName,
      status: matchFromBracket.status,
    });

    // Find the full BracketMatch object from our matches state
    const fullMatch = matches.find(m => m.id === matchFromBracket.id);
    if (!fullMatch) {
      Alert.alert(t('common.error'), t('tournamentBracket.matchNotFound'));
      return;
    }

    // Check if user can enter scores (participant in the match or tournament admin)
    const isParticipant =
      currentUser &&
      (fullMatch.player1?.playerId === currentUser.uid ||
        fullMatch.player2?.playerId === currentUser.uid);
    const isTournamentCreator =
      currentUser && tournament && tournament.createdBy === currentUser.uid;
    const isTournamentAdmin = isTournamentCreator || isAdminView; // Admin view from management screen
    const canEnterScore = isParticipant || isTournamentAdmin;

    console.log('🎾 Match press validation:', {
      matchId: matchFromBracket.id,
      status: matchFromBracket.status,
      currentUserId: currentUser?.uid,
      player1Id: fullMatch.player1?.playerId,
      player2Id: fullMatch.player2?.playerId,
      isParticipant,
      isTournamentCreator,
      isAdminView,
      isTournamentAdmin,
      canEnterScore,
      hasBothPlayers: !!(fullMatch.player1 && fullMatch.player2),
    });

    // Allow score entry for scheduled/in_progress matches where user is a participant or admin
    if (
      (matchFromBracket.status === 'scheduled' || matchFromBracket.status === 'in_progress') &&
      canEnterScore &&
      fullMatch.player1 &&
      fullMatch.player2
    ) {
      // 💥 여기가 바로 '진실의 순간'! 💥
      console.log('--- 🕵️‍♂️ TRACING COMPONENT IDENTITY ---');
      console.log('Attempting to open score input for match:', matchFromBracket.id);
      console.log('Component being used:', ScoreInputModal.name);
      console.log('Component import path: ../../components/match/ScoreInputModal');
      console.log('About to call setShowScoreModal(true) which will render the modal');
      console.log('--- 🕵️‍♂️ END COMPONENT TRACE ---');

      setSelectedMatch(fullMatch);
      setShowScoreModal(true);
    } else if (matchFromBracket.status === 'completed') {
      // Show match result details
      Alert.alert(
        t('tournamentBracket.matchResult'),
        `${matchFromBracket.player1?.playerName || 'TBD'} vs ${matchFromBracket.player2?.playerName || 'TBD'}`
      );
    } else if (!canEnterScore) {
      Alert.alert(
        t('tournamentBracket.info'),
        t('tournamentBracket.onlyParticipantsCanEnterScore')
      );
    } else {
      Alert.alert(
        t('tournamentBracket.matchInfo'),
        `${matchFromBracket.player1?.playerName || 'TBD'} vs ${matchFromBracket.player2?.playerName || 'TBD'}`
      );
    }
  };

  const handleScoreSubmit = async (scoreData: ScoreInputForm) => {
    if (!selectedMatch || !tournament) return;

    try {
      // 💥 여기가 바로 '진실의 순간'! 💥
      console.log('--- 📡 PRE-FLIGHT CHECK ---');
      console.log('Component-level Tournament ID:', tournament.id);
      console.log('Component-level Tournament object:', {
        id: tournament.id,
        title: tournament.tournamentName || tournament.title,
        status: tournament.status,
        participantCount: tournament.participants?.length || 0,
      });
      console.log('Match-level Tournament ID:', selectedMatch.tournamentId);
      console.log('Match-level Match ID:', selectedMatch.id);
      console.log('Match object details:', {
        id: selectedMatch.id,
        tournamentId: selectedMatch.tournamentId,
        round: selectedMatch.round,
        status: selectedMatch.status,
        player1: selectedMatch.player1?.playerName,
        player2: selectedMatch.player2?.playerName,
        bracketPosition: selectedMatch.bracketPosition,
      });

      const tournamentIdForCall = selectedMatch.tournamentId || tournament.id;
      const matchIdForCall = selectedMatch.id;

      console.log(
        `Final IDs being sent to Cloud Function: tournamentId=${tournamentIdForCall}, matchId=${matchIdForCall}`
      );
      console.log('--- 📡 END PRE-FLIGHT CHECK ---');

      console.log('🎾 Original score data from ScoreInputModal:', {
        matchId: selectedMatch.id,
        scoreData,
        _winner: scoreData._winner,
        selectedMatch: {
          player1: selectedMatch.player1,
          player2: selectedMatch.player2,
        },
      });

      // Convert _winner to actual user ID
      let winnerId: string | undefined = undefined;
      if (scoreData._winner === 'player1' && selectedMatch.player1) {
        winnerId = selectedMatch.player1.playerId;
      } else if (scoreData._winner === 'player2' && selectedMatch.player2) {
        winnerId = selectedMatch.player2.playerId;
      }

      console.log('🎾 Winner calculation:', {
        _winner: scoreData._winner,
        player1Id: selectedMatch.player1?.playerId,
        player2Id: selectedMatch.player2?.playerId,
        calculatedWinnerId: winnerId,
      });

      // Validate that we have a winner if the match is complete
      if (scoreData._winner && !winnerId) {
        throw new Error(
          `Winner identified as '${scoreData._winner}' but corresponding player ID not found`
        );
      }

      // Convert ScoreInputForm to tournament service format
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const tournamentResult = {
        winnerId: winnerId || null,
        score: {
          sets: scoreData.sets,
          winner: scoreData._winner,
          isComplete: !!scoreData._winner,
          retired: scoreData.retired || false,
          retiredAt: scoreData.retiredAt,
          walkover: scoreData.walkover || false,
          finalScore:
            scoreData.sets.length > 0
              ? scoreData.sets.map(set => `${set.player1Games}-${set.player2Games}`).join(', ')
              : '',
        },
        notes: scoreData.notes || '',
      } as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */

      console.log('🎾 Converted tournament result:', tournamentResult);

      // 💥 현미경 프로토콜: 클라이언트 사이드 ID 문자열 분석 💥
      console.log('--- 🔬 CLIENT-SIDE MICROSCOPE ---');
      console.log(`Tournament ID Length: ${tournament.id.length}`);
      console.log(
        'Tournament ID Chars:',
        tournament.id
          .split('')
          .map(c => c.charCodeAt(0))
          .join(',')
      );
      console.log(`Match ID Length: ${selectedMatch.id.length}`);
      console.log(
        'Match ID Chars:',
        selectedMatch.id
          .split('')
          .map(c => c.charCodeAt(0))
          .join(',')
      );
      console.log('--- 🔬 END CLIENT MICROSCOPE ---');

      // 🚨 FINAL CALL VERIFICATION 🚨
      console.log('--- 🚀 ABOUT TO CALL CLOUD FUNCTION ---');
      console.log('tournamentService.submitMatchResult parameters:');
      console.log('  - tournamentId:', tournament.id);
      console.log('  - matchId:', selectedMatch.id);
      console.log('  - tournamentResult:', JSON.stringify(tournamentResult, null, 2));
      console.log('--- 🚀 CALLING NOW ---');

      // Submit the score using tournament service
      await tournamentService.submitMatchResult(tournament.id, selectedMatch.id, tournamentResult);

      // Close modal
      setShowScoreModal(false);
      setSelectedMatch(null);

      console.log('🎾 Score submitted successfully, real-time listener will update the UI');

      Alert.alert(
        t('tournamentBracket.scoreSubmitted'),
        t('tournamentBracket.scoreSubmittedSuccess'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Error submitting tournament match score:', error);
      Alert.alert(t('common.error'), t('tournamentBracket.errorSubmittingScore'));
    }
  };

  const handleScoreModalClose = () => {
    setShowScoreModal(false);
    setSelectedMatch(null);
  };

  // Convert BracketMatch to Match format for ScoreInputModal
  const convertBracketMatchToMatch = (bracketMatch: BracketMatch): Match | null => {
    if (!bracketMatch.player1 || !bracketMatch.player2) {
      console.log('🎾 Cannot convert bracket match - missing players:', {
        matchId: bracketMatch.id,
        hasPlayer1: !!bracketMatch.player1,
        hasPlayer2: !!bracketMatch.player2,
      });
      return null;
    }

    console.log('🎾 Converting BracketMatch to Match:', {
      matchId: bracketMatch.id,
      player1: bracketMatch.player1,
      player2: bracketMatch.player2,
    });

    return {
      id: bracketMatch.id,
      type: 'tournament',
      format: 'singles', // Default to singles for tournaments
      eventType: 'mens_singles', // Default event type

      // Create proper MatchParticipant objects
      player1: {
        userId: bracketMatch.player1.playerId,
        userName: bracketMatch.player1.playerName || 'Player 1',
        skillLevel: 'intermediate', // Default skill level
        photoURL: undefined,
      },
      player2: {
        userId: bracketMatch.player2.playerId,
        userName: bracketMatch.player2.playerName || 'Player 2',
        skillLevel: 'intermediate', // Default skill level
        photoURL: undefined,
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

  // Custom header component (since headerShown: false in navigator)
  const CustomHeader = () => (
    <View style={[styles.customHeader, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name='arrow-back' size={24} color={theme.colors.onSurface} />
      </TouchableOpacity>
      <Text style={[styles.customHeaderTitle, { color: theme.colors.onSurface }]}>
        {tournamentName}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <CustomHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {t('tournamentBracket.loadingBracket')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tournament) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <CustomHeader />
        <View style={styles.emptyContainer}>
          <Ionicons name='alert-circle-outline' size={64} color={theme.colors.outline} />
          <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            {t('tournamentBracket.tournamentNotFound')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (tournament.status === 'draft' || tournament.status === 'registration') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <CustomHeader />
        <View style={styles.emptyContainer}>
          <Ionicons name='trophy-outline' size={64} color={theme.colors.outline} />
          <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            {t('tournamentBracket.bracketNotGenerated')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t('tournamentBracket.bracketWillBeGenerated')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const bracket = convertToBracketFormat(matches, tournament);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bracketAsAny: any = bracket;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CustomHeader />
      {/* Tournament Info Header - Compact Layout 🎯 */}
      <View style={[styles.headerInfo, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.tournamentTitle, { color: theme.colors.onSurface }]}>
            {tournament.tournamentName || tournament.title}
          </Text>
          <Text style={[styles.headerSeparator, { color: theme.colors.onSurfaceVariant }]}>•</Text>
          <Text style={[styles.tournamentStatus, { color: theme.colors.onSurfaceVariant }]}>
            {tournament.status === 'bracket_generation' && t('tournamentBracket.generatingBracket')}
            {tournament.status === 'in_progress' && t('tournamentBracket.inProgress')}
            {tournament.status === 'completed' && t('tournamentBracket.completed')}
          </Text>
          {tournament.participants && (
            <>
              <Text style={[styles.headerSeparator, { color: theme.colors.onSurfaceVariant }]}>
                •
              </Text>
              <Text
                style={[styles.headerParticipantInfo, { color: theme.colors.onSurfaceVariant }]}
              >
                {t('tournamentBracket.participants')}: {tournament.participants.length}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Tabs - Iron Man's Public Archives! 🏆 */}
      <View style={[styles.tabs, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
          onPress={() => setActiveTab('matches')}
        >
          <Ionicons
            name='trophy-outline'
            size={16}
            color={activeTab === 'matches' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              activeTab === 'matches' && [styles.activeTabText, { color: theme.colors.primary }],
            ]}
          >
            {t('tournamentBracket.matches')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'participants' && styles.activeTab]}
          onPress={() => setActiveTab('participants')}
        >
          <Ionicons
            name='people-outline'
            size={16}
            color={
              activeTab === 'participants' ? theme.colors.primary : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              activeTab === 'participants' && [
                styles.activeTabText,
                { color: theme.colors.primary },
              ],
            ]}
          >
            {t('tournamentBracket.participantsTab')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'standings' && styles.activeTab]}
          onPress={() => setActiveTab('standings')}
        >
          <Ionicons
            name='podium-outline'
            size={16}
            color={activeTab === 'standings' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              activeTab === 'standings' && [styles.activeTabText, { color: theme.colors.primary }],
            ]}
          >
            {t('tournamentBracket.standings')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'matches' && (
          <TournamentBracketView
            bracket={bracketAsAny}
            currentUserId={currentUser?.uid}
            isTournamentAdmin={
              currentUser && tournament
                ? tournament.createdBy === currentUser.uid || isAdminView
                : isAdminView
            }
            onMatchPress={handleMatchPress}
          />
        )}

        {activeTab === 'participants' && (
          <View style={styles.participantsContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t('tournamentBracket.tournamentParticipants')}
            </Text>
            {tournament.participants && tournament.participants.length > 0 ? (
              tournament.participants.map((participant, index) => (
                <View
                  key={`participant-${participant.id}-${index}`}
                  style={[styles.participantCard, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <View style={styles.participantInfo}>
                    <Text style={[styles.participantRank, { color: theme.colors.primary }]}>
                      #{index + 1}
                    </Text>
                    <View style={styles.participantDetails}>
                      <Text style={[styles.participantName, { color: theme.colors.onSurface }]}>
                        {participant.playerName}
                      </Text>
                      {participant.seed && (
                        <Text
                          style={[styles.participantSeed, { color: theme.colors.onSurfaceVariant }]}
                        >
                          {t('tournamentBracket.seed')} #{participant.seed}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                {t('tournamentBracket.noParticipants')}
              </Text>
            )}
          </View>
        )}

        {activeTab === 'standings' && (
          <TournamentRankingsTab
            participants={tournament.participants || []}
            matches={matches}
            currentUserId={currentUser?.uid}
            eventType={tournament.eventType}
          />
        )}
      </ScrollView>

      {/* Score Input Modal */}
      {selectedMatch && currentUser && (
        <>
          {/* 🔍 MODAL RENDERING TRACE 🔍 */}
          {console.log('--- 🎯 MODAL RENDERING TRACE ---')}
          {console.log('ScoreInputModal is about to render with:')}
          {console.log('- Component Name:', ScoreInputModal.name)}
          {console.log('- Visible:', showScoreModal)}
          {console.log('- Match ID:', selectedMatch.id)}
          {console.log('- Current User ID:', currentUser.uid)}
          {console.log('--- 🎯 END MODAL TRACE ---')}
          <ScoreInputModal
            visible={showScoreModal}
            match={convertBracketMatchToMatch(selectedMatch)!}
            currentUserId={currentUser.uid}
            onClose={handleScoreModalClose}
            onSubmit={handleScoreSubmit}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Custom header styles (since headerShown: false in navigator)
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 4,
  },
  customHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  headerInfo: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tournamentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSeparator: {
    fontSize: 14,
    opacity: 0.5,
  },
  tournamentStatus: {
    fontSize: 13,
  },
  headerParticipantInfo: {
    fontSize: 13,
  },
  // 🎨 Iron Man's Tab Styles
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  // Participants Tab Styles
  participantsContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  participantCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participantRank: {
    fontSize: 16,
    fontWeight: '700',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantSeed: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
  },
});

export default TournamentBracketScreen;
