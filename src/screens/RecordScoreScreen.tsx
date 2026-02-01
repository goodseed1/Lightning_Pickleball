/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 *
 * 🏓 피클볼 점수 시스템 (2026-01-29 업데이트)
 * - Rally scoring: 11점 또는 15점 먼저 도달 (win by 2)
 * - 포맷: 단일 게임 또는 Best of 3 게임
 * - 타이브레이크 없음! (win by 2 규칙이 연장 처리)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Card, Title, Button, TextInput, ActivityIndicator, IconButton, SegmentedButtons } from 'react-native-paper';
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

// 🏓 피클볼 타입 정의
type PickleballGameTarget = 11 | 15;
type PickleballMatchFormat = 'single_game' | 'best_of_3';

interface Participant {
  id: string;
  displayName: string;
  name?: string; // Alias for compatibility
  profileImage?: string;
  ltrLevel?: number;
}

// 🏓 피클볼 게임 점수 (테니스 세트가 아님!)
interface PickleballGame {
  player1: string;  // 점수 (0-25+)
  player2: string;
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

// 🏓 피클볼 게임 승자 결정 (win by 2!)
const determinePickleballGameWinner = (
  p1Score: number,
  p2Score: number,
  targetScore: PickleballGameTarget
): 'player1' | 'player2' | null => {
  const maxScore = Math.max(p1Score, p2Score);
  const diff = Math.abs(p1Score - p2Score);

  // 목표 점수 도달 + 2점 차이 필요
  if (maxScore >= targetScore && diff >= 2) {
    return p1Score > p2Score ? 'player1' : 'player2';
  }
  return null;
};

// 🏓 Best of 3 매치 승자 결정
const determineBestOf3Winner = (
  games: PickleballGame[],
  targetScore: PickleballGameTarget
): 'player1' | 'player2' | null => {
  let p1Wins = 0;
  let p2Wins = 0;

  for (const game of games) {
    const p1 = parseInt(game.player1 || '0', 10);
    const p2 = parseInt(game.player2 || '0', 10);
    const winner = determinePickleballGameWinner(p1, p2, targetScore);

    if (winner === 'player1') p1Wins++;
    else if (winner === 'player2') p2Wins++;
  }

  if (p1Wins >= 2) return 'player1';
  if (p2Wins >= 2) return 'player2';
  return null;
};

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

  // 🏓 피클볼 점수 설정
  const [matchFormat, setMatchFormat] = useState<PickleballMatchFormat>('single_game');
  const [targetScore, setTargetScore] = useState<PickleballGameTarget>(11);
  const [games, setGames] = useState<PickleballGame[]>([
    { player1: '', player2: '' },
    { player1: '', player2: '' },
    { player1: '', player2: '' },
  ]);
  const [matchWinner, setMatchWinner] = useState<Participant | null>(null);
  const [matchLoser, setMatchLoser] = useState<Participant | null>(null);

  // 🏓 피클볼 게임 승자 결정 (컴포넌트 내부 버전)
  const getGameWinner = useCallback(
    (game: PickleballGame): 'player1' | 'player2' | null => {
      if (!game.player1.trim() || !game.player2.trim()) {
        return null; // 미완료 게임
      }

      const p1 = parseInt(game.player1, 10);
      const p2 = parseInt(game.player2, 10);

      if (isNaN(p1) || isNaN(p2)) {
        return null; // 유효하지 않은 점수
      }

      return determinePickleballGameWinner(p1, p2, targetScore);
    },
    [targetScore]
  );

  // 🏓 피클볼 점수 검증 (rally scoring)
  const isValidPickleballScore = useCallback((p1: number, p2: number): boolean => {
    // 음수는 불가
    if (p1 < 0 || p2 < 0) return false;
    // 점수가 너무 높으면 불가 (현실적인 제한)
    if (p1 > 30 || p2 > 30) return false;
    return true;
  }, []);

  // 🏓 게임이 완료되었는지 확인
  const isGameComplete = useCallback((p1: number, p2: number): boolean => {
    const maxScore = Math.max(p1, p2);
    const diff = Math.abs(p1 - p2);
    return maxScore >= targetScore && diff >= 2;
  }, [targetScore]);

  // 🏓 표시할 게임 수 계산
  const calculateGamesToDisplay = useCallback(() => {
    if (matchFormat === 'single_game') {
      return 1;
    }

    // Best of 3: 동적으로 게임 수 표시
    let gamesCompleted = 0;
    let p1Wins = 0;
    let p2Wins = 0;

    for (const game of games) {
      const winner = getGameWinner(game);
      if (winner === null) break;

      if (winner === 'player1') p1Wins++;
      else if (winner === 'player2') p2Wins++;
      gamesCompleted++;

      // 2승 달성시 중단
      if (p1Wins >= 2 || p2Wins >= 2) break;
    }

    // 최소 1게임, 완료된 게임 + 1 (진행 중인 게임용)
    if (gamesCompleted === 0) return 1;
    if (p1Wins >= 2 || p2Wins >= 2) return gamesCompleted;
    return Math.min(gamesCompleted + 1, 3);
  }, [matchFormat, games, getGameWinner]);

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

  // 🏓 피클볼 매치 승자 계산
  const calculateMatchWinner = useCallback(
    (games: PickleballGame[], participants: Participant[]) => {
      if (participants.length !== 2) {
        return { winner: null, loser: null };
      }

      if (matchFormat === 'single_game') {
        // 단일 게임: 첫 번째 게임만 확인
        const game = games[0];
        if (!game.player1.trim() || !game.player2.trim()) {
          return { winner: null, loser: null };
        }

        const p1 = parseInt(game.player1, 10);
        const p2 = parseInt(game.player2, 10);

        if (isNaN(p1) || isNaN(p2)) {
          return { winner: null, loser: null };
        }

        const gameWinner = determinePickleballGameWinner(p1, p2, targetScore);

        if (gameWinner === 'player1') {
          return { winner: participants[0], loser: participants[1] };
        } else if (gameWinner === 'player2') {
          return { winner: participants[1], loser: participants[0] };
        }

        return { winner: null, loser: null };
      } else {
        // Best of 3: 2게임 먼저 이긴 사람 승리
        const matchWinnerKey = determineBestOf3Winner(games, targetScore);

        if (matchWinnerKey === 'player1') {
          return { winner: participants[0], loser: participants[1] };
        } else if (matchWinnerKey === 'player2') {
          return { winner: participants[1], loser: participants[0] };
        }

        return { winner: null, loser: null };
      }
    },
    [matchFormat, targetScore]
  );

  useEffect(() => {
    loadEventAndParticipants();
  }, [loadEventAndParticipants]);

  // 🏓 실시간 승자 계산 - 점수가 변경될 때마다 실행
  useEffect(() => {
    if (participants.length === 2) {
      const result = calculateMatchWinner(games, participants);

      setMatchWinner(result.winner);
      setMatchLoser(result.loser);

      // winnerId와 loserId 업데이트 (기존 검증과의 호환성)
      if (result.winner && result.loser) {
        setWinnerId(result.winner.id);
        setLoserId(result.loser.id);
      } else {
        // 승자가 없으면 초기화
        setWinnerId('');
        setLoserId('');
      }
    }
  }, [games, participants, calculateMatchWinner, matchFormat, targetScore]);

  // 🏓 피클볼 점수 검증
  const validateScore = (): boolean => {
    // 자동 감지로 승자가 결정되었는지 확인
    if (!matchWinner || !matchLoser) {
      Alert.alert(
        t('recordScore.alerts.notice'),
        t('recordScore.alerts.matchNotComplete')
      );
      return false;
    }

    const gamesToCheck = calculateGamesToDisplay();

    // 필요한 게임 수 확인
    const requiredWins = matchFormat === 'single_game' ? 1 : 2;
    let p1Wins = 0;
    let p2Wins = 0;
    let completedGames = 0;

    for (let i = 0; i < gamesToCheck; i++) {
      const game = games[i];

      // 빈 게임은 건너뛰기
      if (!game.player1.trim() && !game.player2.trim()) {
        continue;
      }

      // 한쪽만 입력된 경우
      if (!game.player1.trim() || !game.player2.trim()) {
        Alert.alert(
          t('recordScore.alerts.notice'),
          t('recordScore.alerts.bothScoresRequired', { game: i + 1 })
        );
        return false;
      }

      const p1 = parseInt(game.player1, 10);
      const p2 = parseInt(game.player2, 10);

      // 숫자 검증
      if (isNaN(p1) || isNaN(p2)) {
        Alert.alert(
          t('recordScore.alerts.notice'),
          t('recordScore.alerts.scoresMustBeNumbers')
        );
        return false;
      }

      // 범위 검증
      if (p1 < 0 || p2 < 0) {
        Alert.alert(
          t('recordScore.alerts.notice'),
          t('recordScore.alerts.scoresCannotBeNegative')
        );
        return false;
      }

      if (p1 > 30 || p2 > 30) {
        Alert.alert(
          t('recordScore.alerts.notice'),
          t('recordScore.alerts.scoresTooHigh')
        );
        return false;
      }

      // 🏓 피클볼 승리 조건 검증: 목표 점수 도달 + 2점 차이
      const maxScore = Math.max(p1, p2);
      const diff = Math.abs(p1 - p2);

      if (maxScore < targetScore) {
        Alert.alert(
          t('recordScore.alerts.notice'),
          t('recordScore.alerts.needTargetScore', { game: i + 1, target: targetScore })
        );
        return false;
      }

      if (diff < 2) {
        Alert.alert(
          t('recordScore.alerts.notice'),
          t('recordScore.alerts.needWinByTwo', { game: i + 1 })
        );
        return false;
      }

      // 승자 카운트
      if (p1 > p2) p1Wins++;
      else p2Wins++;
      completedGames++;

      // Best of 3에서 2승 달성하면 중단
      if (matchFormat === 'best_of_3' && (p1Wins >= 2 || p2Wins >= 2)) {
        break;
      }
    }

    // 최소 게임 수 확인
    if (completedGames === 0) {
      Alert.alert(
        t('recordScore.alerts.notice'),
        t('recordScore.alerts.enterAtLeastOneGame')
      );
      return false;
    }

    // 승리 조건 확인
    if (matchFormat === 'single_game' && completedGames < 1) {
      Alert.alert(
        t('recordScore.alerts.notice'),
        t('recordScore.alerts.enterGameScore')
      );
      return false;
    }

    if (matchFormat === 'best_of_3' && Math.max(p1Wins, p2Wins) < 2) {
      Alert.alert(
        t('recordScore.alerts.notice'),
        t('recordScore.alerts.needTwoWins')
      );
      return false;
    }

    return true;
  };

  // 🏓 피클볼 점수 포맷
  const formatScore = (): string => {
    const gameScores: string[] = [];
    const gamesToFormat = calculateGamesToDisplay();

    for (let i = 0; i < gamesToFormat; i++) {
      const game = games[i];

      if (game.player1.trim() && game.player2.trim()) {
        const p1 = parseInt(game.player1, 10);
        const p2 = parseInt(game.player2, 10);

        if (!isNaN(p1) && !isNaN(p2)) {
          gameScores.push(`${p1}-${p2}`);
        }
      }
    }

    if (gameScores.length === 0) {
      return '';
    }

    // 포맷 정보 추가
    const formatLabel = matchFormat === 'single_game'
      ? t('recordScore.singleGame')
      : t('recordScore.bestOf3');

    return `${gameScores.join(', ')} (${formatLabel}, ${targetScore}pt)`;
  };

  const handleSubmit = async () => {
    if (!validateScore()) return;

    try {
      setSaving(true);
      console.log(
        '▶️ 1단계: 경기 결과 제출 시 clubId 유무에 따라 올바른 랭킹 시스템을 호출하도록 수정합니다...'
      );

      // 🏓 피클볼 매치 결과 저장
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');

      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        matchResult: {
          winnerId,
          loserId,
          score: formatScore(),
          matchFormat,
          targetScore,
          submittedAt: new Date(),
        },
      });

      console.log('✅ Match result saved to Firestore');

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

  // 🏓 피클볼 점수 업데이트
  const updateScore = (
    gameIndex: number,
    player: 'player1' | 'player2',
    value: string
  ) => {
    // 빈 문자열 또는 숫자만 허용
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    const numValue = value === '' ? 0 : parseInt(value, 10);

    // 범위 검증 (0-30)
    if (numValue < 0 || numValue > 30) {
      return;
    }

    const newGames = [...games];
    newGames[gameIndex] = {
      ...newGames[gameIndex],
      [player]: value,
    };

    setGames(newGames);
  };

  // 🏓 피클볼 게임 점수 입력 UI
  const renderGameInput = (gameIndex: number, gameLabel: string) => {
    const isPlayer1Winner = matchWinner?.id === participants[0]?.id;
    const isPlayer2Winner = matchWinner?.id === participants[1]?.id;

    const currentGame = games[gameIndex];
    const p1Score = parseInt(currentGame.player1 || '0', 10);
    const p2Score = parseInt(currentGame.player2 || '0', 10);

    // 이 게임의 승자 확인
    const gameWinner = getGameWinner(currentGame);
    const isP1GameWinner = gameWinner === 'player1';
    const isP2GameWinner = gameWinner === 'player2';

    return (
      <View key={gameIndex} style={styles.scoreSetContainer}>
        <Text style={styles.setLabel}>{gameLabel}</Text>

        <View style={styles.scoreInputRow}>
          <View style={styles.playerInputContainer}>
            <View style={styles.playerLabelContainer}>
              <Text style={[
                styles.playerLabel,
                (isPlayer1Winner || isP1GameWinner) && styles.winnerLabel
              ]}>
                {participants[0]?.displayName || participants[0]?.name || 'Player 1'}
              </Text>
              {isP1GameWinner && <Text style={styles.winnerIcon}>✓</Text>}
              {isPlayer1Winner && <Text style={styles.winnerIcon}>👑</Text>}
            </View>
            <TextInput
              value={currentGame.player1}
              onChangeText={value => updateScore(gameIndex, 'player1', value)}
              style={[
                styles.scoreInput,
                isP1GameWinner && styles.winnerScoreInput
              ]}
              keyboardType='numeric'
              maxLength={2}
              dense
              placeholder='0'
            />
          </View>

          <Text style={styles.scoreSeparator}>-</Text>

          <View style={styles.playerInputContainer}>
            <View style={styles.playerLabelContainer}>
              <Text style={[
                styles.playerLabel,
                (isPlayer2Winner || isP2GameWinner) && styles.winnerLabel
              ]}>
                {participants[1]?.displayName || participants[1]?.name || 'Player 2'}
              </Text>
              {isP2GameWinner && <Text style={styles.winnerIcon}>✓</Text>}
              {isPlayer2Winner && <Text style={styles.winnerIcon}>👑</Text>}
            </View>
            <TextInput
              value={currentGame.player2}
              onChangeText={value => updateScore(gameIndex, 'player2', value)}
              style={[
                styles.scoreInput,
                isP2GameWinner && styles.winnerScoreInput
              ]}
              keyboardType='numeric'
              maxLength={2}
              dense
              placeholder='0'
            />
          </View>
        </View>

        {/* 🏓 피클볼 점수 힌트 */}
        {currentGame.player1.trim() && currentGame.player2.trim() && !gameWinner && (
          <View style={styles.gameHintContainer}>
            <Text style={styles.gameHintText}>
              {p1Score >= targetScore || p2Score >= targetScore
                ? t('recordScore.needWinByTwoHint')
                : t('recordScore.needTargetScoreHint', { target: targetScore })}
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

        {/* 🏓 피클볼 매치 설정 */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('recordScore.matchSettings')}</Text>

            {/* 매치 포맷 선택 */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('recordScore.matchFormat')}</Text>
              <SegmentedButtons
                value={matchFormat}
                onValueChange={value => setMatchFormat(value as PickleballMatchFormat)}
                buttons={[
                  { value: 'single_game', label: t('recordScore.singleGame') },
                  { value: 'best_of_3', label: t('recordScore.bestOf3') },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* 목표 점수 선택 */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('recordScore.targetScore')}</Text>
              <SegmentedButtons
                value={String(targetScore)}
                onValueChange={value => setTargetScore(parseInt(value, 10) as PickleballGameTarget)}
                buttons={[
                  { value: '11', label: '11' },
                  { value: '15', label: '15' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* 피클볼 규칙 힌트 */}
            <View style={styles.ruleHintContainer}>
              <Text style={styles.ruleHintText}>
                🏓 {t('recordScore.pickleballRuleHint', {
                  target: targetScore,
                  format: matchFormat === 'single_game'
                    ? t('recordScore.singleGame')
                    : t('recordScore.bestOf3'),
                })}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* 🏓 피클볼 점수 입력 */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.scoreHeader}>
              <Text style={styles.sectionTitle}>{t('recordScore.scoreInput')}</Text>
            </View>

            <Text style={styles.sectionDescription}>
              {matchFormat === 'single_game'
                ? t('recordScore.singleGameDescription', { target: targetScore })
                : t('recordScore.bestOf3Description', { target: targetScore })}
            </Text>

            <View style={styles.scoreContainer}>
              {Array.from({ length: calculateGamesToDisplay() }, (_, index) =>
                renderGameInput(index, t('recordScore.gameN', { n: index + 1 }))
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
    // 🏓 피클볼 매치 설정 스타일
    settingRow: {
      marginBottom: 16,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    segmentedButtons: {
      marginTop: 4,
    },
    ruleHintContainer: {
      marginTop: 8,
      padding: 12,
      backgroundColor: colors.primaryContainer,
      borderRadius: 8,
    },
    ruleHintText: {
      fontSize: 13,
      color: colors.onPrimaryContainer,
      textAlign: 'center',
      lineHeight: 18,
    },
    gameHintContainer: {
      marginTop: 8,
      padding: 8,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 6,
    },
    gameHintText: {
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
