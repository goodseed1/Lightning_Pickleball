/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput as RNTextInput } from 'react-native';
import { Card, Title, Button, TextInput, ActivityIndicator, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import ActivityService from '../services/activityService';
import userService from '../services/userService';
import rankingService from '../services/rankingService';
import { useLanguage } from '../contexts/LanguageContext';

interface Participant {
  id: string;
  displayName: string;
  name?: string; // Alias for compatibility
  profileImage?: string;
  ltrLevel?: number;
}

interface ScoreSet {
  player1: string;
  player2: string;
  player1_tb?: string; // Tiebreak points for player 1
  player2_tb?: string; // Tiebreak points for player 2
}

interface EventData {
  id: string;
  type: 'rankedMatch' | 'match' | string;
  hostId: string;
  hostName?: string;
  participants?: string[];
  approvedApplications?: unknown[];
  appliedUsers?: unknown[];
  maxParticipants?: number;
  currentParticipants?: number;
  title?: string;
  location?: string;
  eventDate?: Date;
  startTime?: Date;
  clubId?: string;
  clubName?: string;
}

type RecordScoreNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecordScore'>;
type RecordScoreRouteProp = RouteProp<RootStackParamList, 'RecordScore'>;

export default function RecordScoreScreen() {
  const navigation = useNavigation<RecordScoreNavigationProp>();
  const route = useRoute<RecordScoreRouteProp>();
  const { currentUser } = useAuth();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const { t } = useLanguage();

  const { eventId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<EventData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winnerId, setWinnerId] = useState('');
  const [loserId, setLoserId] = useState('');
  const [scoreSets, setScoreSets] = useState<ScoreSet[]>([
    { player1: '', player2: '', player1_tb: '', player2_tb: '' },
    { player1: '', player2: '', player1_tb: '', player2_tb: '' },
    { player1: '', player2: '', player1_tb: '', player2_tb: '' },
  ]);
  const [matchWinner, setMatchWinner] = useState<Participant | null>(null);
  const [matchLoser, setMatchLoser] = useState<Participant | null>(null);

  // Unified set winner determination - handles all tiebreak types correctly
  const getSetWinner = useCallback(
    (set: ScoreSet, setIndex: number): 'player1' | 'player2' | null => {
      if (!set.player1.trim() || !set.player2.trim()) {
        return null; // Incomplete set
      }

      const player1Games = parseInt(set.player1, 10);
      const player2Games = parseInt(set.player2, 10);

      if (isNaN(player1Games) || isNaN(player2Games)) {
        return null; // Invalid scores
      }

      // Check for tiebreak situations
      const isTiebreakSet = player1Games === 6 && player2Games === 6;

      if (isTiebreakSet) {
        // 6-6 requires tiebreak - check tiebreak scores
        const player1TB = parseInt(set.player1_tb || '0', 10);
        const player2TB = parseInt(set.player2_tb || '0', 10);

        // Determine tiebreak type: 3rd set (index 2) uses 10-point, others use 7-point
        const pointsToWin = setIndex === 2 ? 10 : 7;

        // Apply appropriate tiebreak rules
        if (player1TB >= pointsToWin && player1TB - player2TB >= 2) {
          return 'player1';
        } else if (player2TB >= pointsToWin && player2TB - player1TB >= 2) {
          return 'player2';
        }
        // If no clear tiebreak winner, set is not complete
        return null;
      } else {
        // Regular set - higher score wins
        if (player1Games > player2Games) {
          return 'player1';
        } else if (player2Games > player1Games) {
          return 'player2';
        }
        // Equal scores that aren't 6-6 are invalid
        return null;
      }
    },
    []
  );

  // Pickleball score validation function
  const isValidPickleballScore = (score1: number, score2: number): boolean => {
    const maxScore = Math.max(score1, score2);
    const minScore = Math.min(score1, score2);

    // 7점 이상은 불가능
    if (maxScore > 7) return false;

    // 6점 이하면 항상 유효
    if (maxScore <= 6) return true;

    // 7점인 경우: 7-5만 가능
    if (maxScore === 7) {
      return minScore === 5;
    }

    return true;
  };

  // Calculate how many sets should be displayed dynamically
  const calculateSetsToDisplay = useCallback(() => {
    let setsCompleted = 0;
    let player1SetWins = 0;
    let player2SetWins = 0;

    // Count completed sets using proper tiebreak logic
    for (let i = 0; i < scoreSets.length; i++) {
      const set = scoreSets[i];
      const winner = getSetWinner(set, i);

      if (winner === null) {
        break; // Stop at first incomplete set
      }

      if (winner === 'player1') {
        player1SetWins++;
      } else if (winner === 'player2') {
        player2SetWins++;
      }
      setsCompleted++;
    }

    // Start with 1 set, add more as needed
    if (setsCompleted === 0) {
      return 1; // Always show at least the first set
    } else if (setsCompleted === 1) {
      return 2; // Show second set after first is completed
    } else if (setsCompleted === 2 && player1SetWins === 1 && player2SetWins === 1) {
      return 3; // Show third set only if tied 1-1
    }

    return Math.max(2, setsCompleted);
  }, [scoreSets, getSetWinner]);

  const loadEventAndParticipants = useCallback(async () => {
    try {
      setLoading(true);

      // Load event details
      const eventDataRaw = await ActivityService.getEventById(eventId);
      console.log('🏆 Event data loaded:', JSON.stringify(eventDataRaw, null, 2));

      const eventData = eventDataRaw as EventData;
      setEvent(eventData);

      // Verify this is a ranked match or a competitive match
      if (eventData.type !== 'rankedMatch' && eventData.type !== 'match') {
        Alert.alert(t('recordScore.alerts.error'), t('recordScore.alerts.onlyRankedEvents'));
        navigation.goBack();
        return;
      }

      // Verify user is the creator
      if (eventData.hostId !== currentUser?.uid) {
        Alert.alert(t('recordScore.alerts.error'), t('recordScore.alerts.onlyCreatorCanRecord'));
        navigation.goBack();
        return;
      }

      // Debug participants data - DETAILED ANALYSIS
      console.log('🔍 === FULL EVENT DATA ANALYSIS ===');
      console.log('📄 Complete Event Data:', JSON.stringify(eventData, null, 2));
      console.log('👥 Event participants (raw):', eventData.participants);
      console.log('👥 Event approvedApplications (raw):', eventData.approvedApplications);
      console.log('👥 Event appliedUsers (raw):', eventData.appliedUsers);
      console.log('👥 Event hostId:', eventData.hostId);
      console.log('👥 Event maxParticipants:', eventData.maxParticipants);
      console.log('👥 Event currentParticipants:', eventData.currentParticipants);
      console.log('🔍 ========================');

      // Get approved applications from applications collection
      console.log('🔍 Fetching approved applications from applications collection...');
      let approvedApplications: Array<{
        id: string;
        applicantId: string;
        applicantName: string;
        [key: string]: unknown;
      }> = [];
      try {
        // Import Firebase if needed
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');

        const applicationsQuery = query(
          collection(db, 'participation_applications'),
          where('eventId', '==', eventId),
          where('status', '==', 'approved')
        );

        const applicationsSnapshot = await getDocs(applicationsQuery);
        approvedApplications = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          applicantId: doc.data().applicantId,
          applicantName: doc.data().applicantName,
          ...doc.data(),
        }));

        console.log('✅ Approved applications found:', approvedApplications);
      } catch (error) {
        console.error('❌ Error fetching approved participants:', error);
      }

      // Collect all participant IDs
      let participantIds = [];

      // Add participants from participants array
      if (eventData.participants && Array.isArray(eventData.participants)) {
        participantIds.push(...eventData.participants);
      }

      // Add approved applications' IDs
      if (approvedApplications.length > 0) {
        participantIds.push(...approvedApplications.map(p => p.applicantId));
      }

      // Always include the host
      if (eventData.hostId && !participantIds.includes(eventData.hostId)) {
        participantIds.push(eventData.hostId);
      }

      // Remove duplicates
      participantIds = [...new Set(participantIds)];

      console.log('👤 Final participant IDs to load:', participantIds);

      // Load participant details with error handling
      let participantData = [];
      try {
        if (participantIds.length > 0) {
          participantData = await userService.getUserProfiles(participantIds);
          console.log(
            '✅ Participant profiles loaded successfully:',
            JSON.stringify(participantData, null, 2)
          );
        } else {
          console.log('⚠️ No participant IDs found - creating fallback participants');
          // Fallback: create mock participants for testing
          participantData = [
            {
              id: eventData.hostId,
              displayName: eventData.hostName || 'Host',
              ltrLevel: 3.5,
            },
          ];

          // If this is supposed to be a 2-player match, add a placeholder
          if (eventData.maxParticipants === 2) {
            participantData.push({
              id: 'placeholder_player',
              displayName: 'Player 2',
              ltrLevel: 3.5,
            });
          }
        }
      } catch (error) {
        console.error('❌ Error loading participant profiles:', error);
        console.log('🔄 Creating fallback participant data...');

        // Create fallback data
        participantData = [
          {
            id: eventData.hostId,
            displayName: eventData.hostName || 'Host',
            ltrLevel: 3.5,
          },
        ];

        if (eventData.maxParticipants === 2) {
          participantData.push({
            id: 'placeholder_player',
            displayName: 'Player 2',
            ltrLevel: 3.5,
          });
        }
      }

      console.log('🎯 Final participant data to use:', JSON.stringify(participantData, null, 2));
      setParticipants(participantData);

      // For 1v1, auto-set the participants
      if (participantData.length === 2) {
        // Don't auto-select winner, let user choose
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert(t('recordScore.alerts.error'), t('recordScore.alerts.cannotLoadEvent'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [eventId, navigation, currentUser?.uid]);

  // Calculate match winner based on set scores with tiebreak rules
  const calculateMatchWinner = useCallback(
    (scoreSets: ScoreSet[], participants: Participant[]) => {
      if (participants.length !== 2) {
        return { winner: null, loser: null };
      }

      let player1SetWins = 0;
      let player2SetWins = 0;

      // Count completed sets using unified set winner logic
      for (let i = 0; i < scoreSets.length; i++) {
        const set = scoreSets[i];
        const winner = getSetWinner(set, i);

        if (winner === 'player1') {
          player1SetWins++;
        } else if (winner === 'player2') {
          player2SetWins++;
        }
        // If winner is null, set is not complete - continue checking others
      }

      // Determine match winner: first to win 2 sets
      if (player1SetWins >= 2) {
        return {
          winner: participants[0],
          loser: participants[1],
        };
      } else if (player2SetWins >= 2) {
        return {
          winner: participants[1],
          loser: participants[0],
        };
      }

      // No winner yet
      return { winner: null, loser: null };
    },
    [getSetWinner]
  );

  useEffect(() => {
    loadEventAndParticipants();
  }, [loadEventAndParticipants]);

  // Real-time winner calculation - runs whenever scores change
  useEffect(() => {
    if (participants.length === 2) {
      const result = calculateMatchWinner(scoreSets, participants);

      setMatchWinner(result.winner);
      setMatchLoser(result.loser);

      // Update winnerId and loserId for compatibility with existing validation
      if (result.winner && result.loser) {
        setWinnerId(result.winner.id);
        setLoserId(result.loser.id);
      } else {
        // Clear winner/loser if no clear winner yet
        setWinnerId('');
        setLoserId('');
      }
    }
  }, [scoreSets, participants, calculateMatchWinner]);

  const validateScore = (): boolean => {
    // Check if we have a clear winner from automatic detection
    if (!matchWinner || !matchLoser) {
      Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.matchNotComplete'));
      return false;
    }

    // Comprehensive pickleball rules validation
    let completedSets = 0;
    const setsToCheck = calculateSetsToDisplay();

    for (let i = 0; i < setsToCheck; i++) {
      const set = scoreSets[i];
      if (!set.player1.trim() || !set.player2.trim()) {
        continue; // Skip incomplete sets
      }

      const score1 = parseInt(set.player1);
      const score2 = parseInt(set.player2);

      if (isNaN(score1) || isNaN(score2)) {
        Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.scoresMustBeNumbers'));
        return false;
      }

      if (score1 < 0 || score2 < 0 || score1 > 7 || score2 > 7) {
        Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.scoresOutOfRange'));
        return false;
      }

      // Pickleball scoring rules validation
      const isTiebreakSet = score1 === 6 && score2 === 6;

      if (isTiebreakSet) {
        // Tiebreak validation - different rules for 3rd set (10-point) vs 1st/2nd sets (7-point)
        const tb1 = parseInt(set.player1_tb || '0');
        const tb2 = parseInt(set.player2_tb || '0');

        if (isNaN(tb1) || isNaN(tb2)) {
          Alert.alert(
            t('recordScore.alerts.notice'),
            t('recordScore.alerts.tiebreakRequired', { set: i + 1 })
          );
          return false;
        }

        if (tb1 < 0 || tb2 < 0 || tb1 > 99 || tb2 > 99) {
          Alert.alert(
            t('recordScore.alerts.notice'),
            t('recordScore.alerts.tiebreakInvalid', { set: i + 1 })
          );
          return false;
        }

        // Apply different tiebreak rules: 3rd set = 10 points, others = 7 points
        const pointsToWin = i === 2 ? 10 : 7;
        const isValidTiebreak =
          (tb1 >= pointsToWin || tb2 >= pointsToWin) && Math.abs(tb1 - tb2) >= 2;

        if (!isValidTiebreak) {
          const tiebreakName =
            i === 2
              ? t('recordScore.alerts.superTiebreak')
              : t('recordScore.alerts.standardTiebreak');
          Alert.alert(
            t('recordScore.alerts.notice'),
            t('recordScore.alerts.tiebreakRuleViolation', {
              set: i + 1,
              type: tiebreakName,
              points: pointsToWin,
            })
          );
          return false;
        }
      } else {
        // Regular set validation
        if (score1 === score2) {
          if (score1 !== 6) {
            Alert.alert(
              t('recordScore.alerts.notice'),
              t('recordScore.alerts.equalScoresInvalid', { set: i + 1 })
            );
            return false;
          }
          Alert.alert(
            t('recordScore.alerts.notice'),
            t('recordScore.alerts.needTiebreakAt66', { set: i + 1 })
          );
          return false;
        }

        // Check valid set scores
        const maxScore = Math.max(score1, score2);
        const minScore = Math.min(score1, score2);

        if (maxScore >= 6) {
          if (maxScore === 6 && minScore <= 4) {
            // Valid: 6-0, 6-1, 6-2, 6-3, 6-4
          } else if (maxScore === 7 && (minScore === 5 || minScore === 6)) {
            // Valid: 7-5, 7-6 (but 7-6 should have tiebreak)
            if (minScore === 6) {
              Alert.alert(
                t('recordScore.alerts.notice'),
                t('recordScore.alerts.needTiebreakAt76', { set: i + 1 })
              );
              return false;
            }
          } else {
            Alert.alert(
              t('recordScore.alerts.notice'),
              t('recordScore.alerts.invalidPickleballScore', { set: i + 1 })
            );
            return false;
          }
        } else {
          Alert.alert(
            t('recordScore.alerts.notice'),
            t('recordScore.alerts.needSixGames', { set: i + 1 })
          );
          return false;
        }
      }

      completedSets++;
    }

    if (completedSets === 0) {
      Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.enterAtLeastOneSet'));
      return false;
    }

    // Ensure we have enough completed sets to determine a winner
    const setsNeededToWin = 2;
    if (completedSets < setsNeededToWin) {
      Alert.alert(
        t('recordScore.alerts.notice'),
        t('recordScore.alerts.needMoreSets', { count: setsNeededToWin })
      );
      return false;
    }

    return true;
  };

  const formatScore = (): string => {
    const sets = [];
    const setsToFormat = calculateSetsToDisplay();

    for (let i = 0; i < setsToFormat; i++) {
      const set = scoreSets[i];
      const isMatchTiebreak = i === 2 && isSetsTied();

      if (isMatchTiebreak) {
        // Match tiebreak - only show tiebreak score
        if (set.player1_tb && set.player2_tb) {
          const player1TB = parseInt(set.player1_tb || '0', 10);
          const player2TB = parseInt(set.player2_tb || '0', 10);
          const scoreString = `${t('recordScore.matchTB')}: ${player1TB}-${player2TB}`;
          sets.push(scoreString);
        }
        continue; // Skip regular score formatting for match tiebreak
      }

      if (set.player1.trim() && set.player2.trim()) {
        const player1Games = parseInt(set.player1, 10);
        const player2Games = parseInt(set.player2, 10);
        let scoreString = `${set.player1}-${set.player2}`;

        // Add tiebreak scores in proper pickleball format for 6-6 sets
        const isTiebreakSet = player1Games === 6 && player2Games === 6;

        if (isTiebreakSet && (set.player1_tb || set.player2_tb)) {
          const player1TB = parseInt(set.player1_tb || '0', 10);
          const player2TB = parseInt(set.player2_tb || '0', 10);

          // 🎯 [KIM FIX] 타이브레이크 양쪽 점수 모두 표시 (예: 6-6(9-11))
          if (player1TB > 0 || player2TB > 0) {
            scoreString += `(${player1TB}-${player2TB})`;
          }
        }

        sets.push(scoreString);
      }
    }

    return sets.join(', ');
  };

  const handleSubmit = async () => {
    if (!validateScore()) return;

    try {
      setSaving(true);
      console.log(
        '▶️ 1단계: 경기 결과 제출 시 clubId 유무에 따라 올바른 랭킹 시스템을 호출하도록 수정합니다...'
      );

      const resultData = {
        winnerId,
        loserId,
        score: formatScore(),
      };

      // Record match result first
      await eventService.recordMatchResult(eventId, resultData);

      // Update rankings using the Executive Branch Integration
      // Route to appropriate ELO system based on match context
      console.log('🏛️ Executive Branch: Determining ranking context...');
      console.log('📊 Event clubId:', event?.clubId);
      console.log('🎯 Match context:', event?.clubId ? 'club' : 'global');

      const winnerProfile = participants.find(p => p.id === winnerId);
      const loserProfile = participants.find(p => p.id === loserId);

      if (winnerProfile && loserProfile) {
        try {
          // Get current ELOs for both players
          const matchContext = event?.clubId
            ? { type: 'club' as const, clubId: event.clubId, clubName: event.clubName }
            : { type: 'public' as const };

          const winnerCurrentElo = await rankingService.getCurrentElo(winnerId);
          const loserCurrentElo = await rankingService.getCurrentElo(loserId);

          console.log(`🎾 Winner (${winnerProfile.displayName}) current ELO: ${winnerCurrentElo}`);
          console.log(`🎾 Loser (${loserProfile.displayName}) current ELO: ${loserCurrentElo}`);

          // Process ranking updates for both players
          const winnerRankingUpdate = {
            userId: winnerId,
            context: matchContext,
            result: 'win' as const,
            opponentElo: loserCurrentElo,
            matchId: eventId,
          };

          const loserRankingUpdate = {
            userId: loserId,
            context: matchContext,
            result: 'loss' as const,
            opponentElo: winnerCurrentElo,
            matchId: eventId,
          };

          console.log('⚖️ Processing winner ranking update:', winnerRankingUpdate);
          console.log('⚖️ Processing loser ranking update:', loserRankingUpdate);

          // Execute ranking updates
          const [winnerResult, loserResult] = await Promise.all([
            rankingService.processMatchResult(winnerRankingUpdate),
            rankingService.processMatchResult(loserRankingUpdate),
          ]);

          console.log('✅ Winner ranking result:', winnerResult);
          console.log('✅ Loser ranking result:', loserResult);

          if (winnerResult.success && loserResult.success) {
            const contextDisplay = event?.clubId
              ? t('recordScore.alerts.clubRanking', { clubName: event.clubName })
              : t('recordScore.alerts.globalRanking');
            Alert.alert(
              t('recordScore.alerts.success'),
              t('recordScore.alerts.resultRecorded', {
                context: contextDisplay,
                winnerChange: `${winnerResult.eloChange > 0 ? '+' : ''}${winnerResult.eloChange}`,
                loserChange: `${loserResult.eloChange > 0 ? '+' : ''}${loserResult.eloChange}`,
              }),
              [
                {
                  text: t('recordScore.alerts.confirm'),
                  onPress: () => {
                    try {
                      // Navigate to sportsmanship rating screen
                      navigation.navigate('RateSportsmanship', {
                        eventId: eventId,
                        eventType: 'match',
                      });
                    } catch (navError) {
                      console.warn('Navigation error:', navError);
                      // Fallback: just go back to previous screen
                      navigation.goBack();
                    }
                  },
                },
              ]
            );
          } else {
            // Ranking update failed but match result was recorded
            console.warn('⚠️ Ranking update failed but match result was recorded');
            Alert.alert(
              t('recordScore.alerts.partialSuccess'),
              t('recordScore.alerts.rankingUpdateFailed'),
              [
                {
                  text: t('recordScore.alerts.confirm'),
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }
        } catch (rankingError) {
          console.error('❌ Ranking update error:', rankingError);
          // Match result was recorded successfully, but ranking failed
          Alert.alert(
            t('recordScore.alerts.partialSuccess'),
            t('recordScore.alerts.rankingUpdateFailed'),
            [
              {
                text: t('recordScore.alerts.confirm'),
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      } else {
        console.error('❌ Could not find winner or loser profiles');
        Alert.alert(
          t('recordScore.alerts.success'),
          t('recordScore.alerts.resultRecordedNoRanking'),
          [
            {
              text: t('recordScore.alerts.confirm'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error recording result:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('recordScore.alerts.recordError');
      Alert.alert(t('recordScore.alerts.error'), errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateScore = (
    setIndex: number,
    player: 'player1' | 'player2' | 'player1_tb' | 'player2_tb',
    value: string
  ) => {
    // 타이브레이크 점수는 별도 처리 (검증 없음)
    if (player.includes('_tb')) {
      const newScoreSets = [...scoreSets];
      newScoreSets[setIndex][player] = value;
      setScoreSets(newScoreSets);
      return;
    }

    // 일반 세트 점수 검증
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    const newScoreSets = [...scoreSets];

    // 임시로 점수 설정
    newScoreSets[setIndex][player] = value;

    const player1Score = parseInt(newScoreSets[setIndex].player1 || '0', 10);
    const player2Score = parseInt(newScoreSets[setIndex].player2 || '0', 10);

    // 피클볼 규칙 검증 (둘 다 점수가 입력된 경우에만)
    if (newScoreSets[setIndex].player1 && newScoreSets[setIndex].player2) {
      if (!isValidPickleballScore(player1Score, player2Score)) {
        // 유효하지 않은 점수면 경고 표시하고 입력 차단
        Alert.alert(
          t('recordScore.alerts.invalidScore'),
          t('recordScore.alerts.invalidScoreExplanation'),
          [{ text: t('recordScore.alerts.confirm'), style: 'default' }]
        );
        return;
      }
    }

    setScoreSets(newScoreSets);
  };

  // Check if sets are tied 1-1 (for match tiebreak determination)
  const isSetsTied = useCallback(() => {
    let player1SetWins = 0;
    let player2SetWins = 0;

    for (let i = 0; i < 2; i++) {
      // Only check first 2 sets
      const set = scoreSets[i];
      const winner = getSetWinner(set, i);

      if (winner === null) {
        return false; // Set not complete
      }

      if (winner === 'player1') {
        player1SetWins++;
      } else if (winner === 'player2') {
        player2SetWins++;
      }
    }

    return player1SetWins === 1 && player2SetWins === 1;
  }, [scoreSets, getSetWinner]);

  const renderScoreInput = (setIndex: number, setLabel: string) => {
    const isPlayer1Winner = matchWinner?.id === participants[0]?.id;
    const isPlayer2Winner = matchWinner?.id === participants[1]?.id;

    // Intelligent 6-6 detection for tiebreak
    const currentSet = scoreSets[setIndex];
    const isStandardTiebreak = currentSet.player1 === '6' && currentSet.player2 === '6';
    const showTiebreak = isStandardTiebreak;

    // Determine tiebreak type based on official pickleball rules:
    // - 1st/2nd set at 6-6: 7-point tiebreak
    // - 3rd set at 6-6: 10-point super tiebreak
    let tiebreakType = 'standard';
    let tiebreakPlaceholder = t('recordScore.tiebreak7pt');

    if (setIndex === 2 && isStandardTiebreak) {
      // 3rd set super tiebreak (when it reaches 6-6)
      tiebreakType = 'super';
      tiebreakPlaceholder = t('recordScore.tiebreakSuper');
    }

    return (
      <View key={setIndex} style={styles.scoreSetContainer}>
        <Text style={styles.setLabel}>{setLabel}</Text>

        {/* Always show regular set inputs - tiebreak appears in addition when 6-6 */}
        <View style={styles.scoreInputRow}>
          <View style={styles.playerInputContainer}>
            <View style={styles.playerLabelContainer}>
              <Text style={[styles.playerLabel, isPlayer1Winner && styles.winnerLabel]}>
                {participants[0]?.displayName || participants[0]?.name || 'Player 1'}
              </Text>
              {isPlayer1Winner && <Text style={styles.winnerIcon}>👑</Text>}
            </View>
            <TextInput
              value={scoreSets[setIndex].player1}
              onChangeText={value => updateScore(setIndex, 'player1', value)}
              style={[styles.scoreInput, isPlayer1Winner && styles.winnerScoreInput]}
              keyboardType='numeric'
              maxLength={1}
              dense
            />
          </View>

          <Text style={styles.scoreSeparator}>-</Text>

          <View style={styles.playerInputContainer}>
            <View style={styles.playerLabelContainer}>
              <Text style={[styles.playerLabel, isPlayer2Winner && styles.winnerLabel]}>
                {participants[1]?.displayName || participants[1]?.name || 'Player 2'}
              </Text>
              {isPlayer2Winner && <Text style={styles.winnerIcon}>👑</Text>}
            </View>
            <TextInput
              value={scoreSets[setIndex].player2}
              onChangeText={value => updateScore(setIndex, 'player2', value)}
              style={[styles.scoreInput, isPlayer2Winner && styles.winnerScoreInput]}
              keyboardType='numeric'
              maxLength={1}
              dense
            />
          </View>
        </View>

        {/* Conditional Tiebreak UI - appears magically when 6-6 */}
        {showTiebreak && (
          <View style={styles.tiebreakContainer}>
            <Text style={styles.tiebreakLabel}>
              {t('recordScore.tiebreakLabel', { placeholder: tiebreakPlaceholder })}
            </Text>
            <View style={styles.tiebreakInputRow}>
              <View style={styles.tiebreakPlayerContainer}>
                <Text style={[styles.tiebreakPlayerLabel, isPlayer1Winner && styles.winnerLabel]}>
                  {participants[0]?.displayName || 'Player 1'}
                </Text>
                <View style={styles.tiebreakInputWrapper}>
                  <Text style={styles.tiebreakBpaddle}>(</Text>
                  <RNTextInput
                    value={currentSet.player1_tb || ''}
                    onChangeText={value => updateScore(setIndex, 'player1_tb', value)}
                    style={[styles.tiebreakInput, isPlayer1Winner && styles.winnerScoreInput]}
                    keyboardType='numeric'
                    maxLength={2}
                    placeholder={tiebreakType === 'match' || tiebreakType === 'super' ? '10' : '7'}
                    placeholderTextColor={themeColors.colors.onSurfaceVariant}
                  />
                  <Text style={styles.tiebreakBpaddle}>)</Text>
                </View>
              </View>

              <Text style={styles.tiebreakSeparator}>-</Text>

              <View style={styles.tiebreakPlayerContainer}>
                <Text style={[styles.tiebreakPlayerLabel, isPlayer2Winner && styles.winnerLabel]}>
                  {participants[1]?.displayName || 'Player 2'}
                </Text>
                <View style={styles.tiebreakInputWrapper}>
                  <Text style={styles.tiebreakBpaddle}>(</Text>
                  <RNTextInput
                    value={currentSet.player2_tb || ''}
                    onChangeText={value => updateScore(setIndex, 'player2_tb', value)}
                    style={[styles.tiebreakInput, isPlayer2Winner && styles.winnerScoreInput]}
                    keyboardType='numeric'
                    maxLength={2}
                    placeholder={tiebreakType === 'match' || tiebreakType === 'super' ? '10' : '7'}
                    placeholderTextColor={themeColors.colors.onSurfaceVariant}
                  />
                  <Text style={styles.tiebreakBpaddle}>)</Text>
                </View>
              </View>
            </View>

            <Text style={styles.tiebreakHint}>
              {tiebreakType === 'match' || tiebreakType === 'super'
                ? t('recordScore.tiebreakHintSuper')
                : t('recordScore.tiebreakHintStandard')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Create styles once at the top level
  const styles = createStyles(
    themeColors.colors as unknown as Record<string, string>,
    currentTheme === 'dark'
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Title style={styles.title}>{t('recordScore.title')}</Title>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary} />
          <Text style={styles.loadingText}>{t('recordScore.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon='close'
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        />
        <Title style={styles.title}>{t('recordScore.title')}</Title>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Info */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('recordScore.matchInfo')}</Text>
            <Text style={styles.eventTitle}>{event?.title}</Text>
            <Text style={styles.eventLocation}>📍 {event?.location}</Text>
            <Text style={styles.eventDate}>
              🗓️ {event?.eventDate?.toLocaleDateString('ko-KR')}{' '}
              {event?.startTime?.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Card.Content>
        </Card>

        {/* Score Input */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.scoreHeader}>
              <Text style={styles.sectionTitle}>{t('recordScore.scoreInput')}</Text>
            </View>

            <Text style={styles.sectionDescription}>{t('recordScore.scoreInputDescription')}</Text>

            <View style={styles.scoreContainer}>
              {Array.from({ length: calculateSetsToDisplay() }, (_, index) =>
                renderScoreInput(index, t('recordScore.setN', { n: index + 1 }))
              )}
            </View>

            {formatScore() && (
              <View style={styles.scorePreview}>
                <Text style={styles.scorePreviewLabel}>{t('recordScore.finalScore')}</Text>
                <Text style={[styles.scorePreviewText, { color: themeColors.colors.primary }]}>
                  {formatScore()}
                </Text>

                {matchWinner && (
                  <View style={styles.winnerStatus}>
                    <Text style={styles.winnerStatusLabel}>{t('recordScore.currentWinner')}</Text>
                    <Text style={styles.winnerStatusText}>
                      {matchWinner.displayName || matchWinner.name}
                    </Text>
                  </View>
                )}

                {!matchWinner && formatScore() && (
                  <View style={styles.winnerStatus}>
                    <Text style={styles.neutralStatusLabel}>
                      {t('recordScore.matchInProgress')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            mode='contained'
            onPress={handleSubmit}
            loading={saving}
            disabled={saving || !matchWinner || !matchLoser}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            {saving ? t('recordScore.saving') : t('recordScore.submit')}
          </Button>

          <Text style={styles.submitNote}>{t('recordScore.submitNote')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    closeButton: {
      margin: 0,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    placeholder: {
      width: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    sectionCard: {
      marginBottom: 16,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      backgroundColor: colors.surface,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 16,
      lineHeight: 20,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    eventLocation: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    eventDate: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    scoreHeader: {
      marginBottom: 8,
    },
    scoreContainer: {
      gap: 16,
    },
    scoreSetContainer: {
      alignItems: 'center',
    },
    setLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
    },
    scoreInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    playerInputContainer: {
      flex: 1,
      alignItems: 'center',
    },
    playerLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      minHeight: 24,
    },
    playerLabel: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    winnerLabel: {
      color: '#FFD700',
      fontWeight: '700',
    },
    winnerIcon: {
      fontSize: 16,
      marginLeft: 4,
    },
    scoreInput: {
      backgroundColor: colors.surface,
      textAlign: 'center',
      width: 80,
    },
    winnerScoreInput: {
      backgroundColor: isDarkMode ? colors.warningContainer : '#FFF8DC',
      borderWidth: 2,
      borderColor: colors.lightning,
    },
    scoreSeparator: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    scorePreview: {
      marginTop: 20,
      padding: 16,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      alignItems: 'center',
    },
    scorePreviewLabel: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    scorePreviewText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    winnerStatus: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FFD700',
      alignItems: 'center',
    },
    winnerStatusLabel: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
      fontWeight: '500',
    },
    winnerStatusText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFD700',
    },
    neutralStatusLabel: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
      fontWeight: '500',
    },
    tiebreakContainer: {
      marginTop: 16,
      padding: 16,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.outline,
      borderStyle: 'dashed',
    },
    tiebreakLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 12,
    },
    tiebreakInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    tiebreakPlayerContainer: {
      flex: 1,
      alignItems: 'center',
    },
    tiebreakPlayerLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
      marginBottom: 4,
    },
    tiebreakInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tiebreakBpaddle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      marginHorizontal: 2,
    },
    tiebreakInput: {
      width: 40,
      height: 40,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 8,
      textAlign: 'center',
      textAlignVertical: 'center',
      fontSize: 16,
      fontWeight: '600',
      paddingHorizontal: 0,
      paddingVertical: 0,
      color: colors.onSurface,
    },
    tiebreakSeparator: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      marginHorizontal: 16,
    },
    tiebreakHint: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    submitContainer: {
      marginTop: 24,
      marginBottom: 32,
    },
    submitButton: {
      borderRadius: 12,
      marginBottom: 12,
    },
    submitButtonContent: {
      paddingVertical: 8,
    },
    submitNote: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 16,
      fontStyle: 'italic',
    },
  });
