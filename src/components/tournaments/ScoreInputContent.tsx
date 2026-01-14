/**
 * Score Input Content Component for Tournament Detail Screen
 * 토너먼트 상세 화면 내 점수 입력 컴포넌트 (모달 없이)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, TextInput as PaperTextInput, RadioButton } from 'react-native-paper';
import { SetScore, ScoreInputForm, Match, validatePickleballScore } from '../../types/match';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';

// 🧹 [REFACTOR] 문자열 기반 로컬 타입 - 리그/일반경기와 동일한 패턴
interface StringSetScore {
  player1: string;
  player2: string;
  player1_tb: string;
  player2_tb: string;
}

interface ScoreInputContentProps {
  match: Match;
  setsToWin?: number; // 🦾 [IRON MAN] Number of sets required to win (1, 2, or 3)
  gamesPerSet?: number; // ⚡ [THOR] Number of games per set (6 for regular, 4 for short sets)
  onCancel: () => void;
  onSubmit: (scoreData: ScoreInputForm) => Promise<void>;
}

const ScoreInputContent: React.FC<ScoreInputContentProps> = ({
  match,
  setsToWin = 2, // 🦾 [IRON MAN] Default to best-of-3 for backward compatibility
  gamesPerSet = 6, // ⚡ [THOR] Default to regular 6-game sets
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const { paperTheme: theme } = useTheme();
  const styles = createStyles(theme);

  // 🧹 [REFACTOR] 문자열 기반 상태 - 빈 문자열('')로 미입력 상태 표현
  // 리그/일반경기와 동일한 패턴으로 일관성 확보
  const [sets, setSets] = useState<StringSetScore[]>([
    { player1: '', player2: '', player1_tb: '', player2_tb: '' },
  ]);
  const [retired, setRetired] = useState(false);
  // 🟡 [MEDIUM] retiredAt는 이제 handleSubmit에서 자동 계산되므로 state 불필요
  const [walkover, setWalkover] = useState(false);
  const [manualWinner, setManualWinner] = useState<'player1' | 'player2' | null>(null); // 🔴 [HIGH] 기권/부전승 시 승자 수동 선택
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pickleball score validation function (adapted from league system)
  // ⚡ [THOR] 단축 세트 지원: gamesPerSet 기반 동적 검증
  const isValidPickleballScore = (score1: number, score2: number): boolean => {
    const maxScore = Math.max(score1, score2);
    const minScore = Math.min(score1, score2);

    const maxGamesAllowed = gamesPerSet + 1; // 일반 7 / 단축 5

    if (maxScore > maxGamesAllowed) return false;
    if (maxScore <= gamesPerSet) return true;
    if (maxScore === maxGamesAllowed) {
      return minScore === gamesPerSet - 1 || minScore === gamesPerSet;
    }
    return true;
  };

  // 🧹 [REFACTOR] 문자열 기반 세트 승자 판정 - 리그와 동일한 패턴
  const getSetWinner = (set: StringSetScore, setIndex: number): 'player1' | 'player2' | null => {
    // 🧹 빈 문자열 체크 - 미입력 상태 감지
    if (!set.player1.trim() || !set.player2.trim()) {
      return null; // 한 쪽이라도 미입력이면 세트 미완료
    }

    const player1Games = parseInt(set.player1, 10);
    const player2Games = parseInt(set.player2, 10);

    if (isNaN(player1Games) || isNaN(player2Games)) {
      return null; // 숫자가 아니면 미완료
    }

    if (player1Games === 0 && player2Games === 0) {
      return null; // Empty set (both explicitly set to 0)
    }

    const isTiebreakSet = player1Games === gamesPerSet && player2Games === gamesPerSet;

    if (isTiebreakSet) {
      const player1TB = parseInt(set.player1_tb || '0', 10);
      const player2TB = parseInt(set.player2_tb || '0', 10);

      if (!set.player1_tb.trim() || !set.player2_tb.trim()) {
        return null; // Need tiebreak points
      }

      const pointsToWin = setIndex === 2 ? 10 : 7; // Super tiebreak for 3rd set

      if (player1TB >= pointsToWin && player1TB - player2TB >= 2) {
        return 'player1';
      } else if (player2TB >= pointsToWin && player2TB - player1TB >= 2) {
        return 'player2';
      }
      return null;
    } else {
      // 세트가 실제로 완료되었는지 확인
      // 승자 조건: gamesPerSet 이상 + 2게임 차이 (예: 6-4, 6-3, 6-2, 6-1, 6-0)
      // 또는 (gamesPerSet + 1)-(gamesPerSet - 1) (예: 7-5)
      const minGamesToWin = gamesPerSet; // 일반: 6, 단축: 4

      if (player1Games >= minGamesToWin && player1Games - player2Games >= 2) {
        return 'player1';
      }
      if (player2Games >= minGamesToWin && player2Games - player1Games >= 2) {
        return 'player2';
      }

      // 세트가 아직 끝나지 않음 (예: 2-0, 5-4, 3-3 등)
      return null;
    }
  };

  // 🦾 [IRON MAN] Calculate match winner based on sets (dynamic based on setsToWin)
  const calculateMatchWinner = (): 'player1' | 'player2' | null => {
    let player1SetWins = 0;
    let player2SetWins = 0;

    for (let i = 0; i < sets.length; i++) {
      const winner = getSetWinner(sets[i], i);
      if (winner === 'player1') {
        player1SetWins++;
      } else if (winner === 'player2') {
        player2SetWins++;
      }
    }

    // 🦾 [IRON MAN] Dynamic validation: 1 set for best_of_1, 2 sets for best_of_3, 3 sets for best_of_5
    if (player1SetWins >= setsToWin) return 'player1';
    if (player2SetWins >= setsToWin) return 'player2';
    return null;
  };

  // 🎯 [KIM FIX] Calculate max sets based on setsToWin setting
  // setsToWin=1: Best of 1 (max 1 set)
  // setsToWin=2: Best of 3 (max 3 sets)
  // setsToWin=3: Best of 5 (max 5 sets)
  const maxSets = setsToWin === 1 ? 1 : setsToWin === 2 ? 3 : 5;

  // 🎯 [KIM FIX] Calculate how many sets to display dynamically (like league)
  const calculateSetsToDisplay = (): number => {
    let setsCompleted = 0;
    let player1SetWins = 0;
    let player2SetWins = 0;

    for (let i = 0; i < sets.length; i++) {
      const winner = getSetWinner(sets[i], i);

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

    // 1세트 경기: 항상 1세트만 표시
    if (maxSets === 1) {
      return 1;
    }

    // 승자가 결정되면 더 이상 세트 추가 안함
    if (player1SetWins >= setsToWin || player2SetWins >= setsToWin) {
      return setsCompleted;
    }

    // 3세트/5세트 경기: 점진적으로 세트 표시
    if (setsCompleted === 0) {
      return 1; // 처음에는 1세트만 표시
    }

    // 다음 세트 추가 (최대 maxSets까지)
    return Math.min(setsCompleted + 1, maxSets);
  };

  const setsToDisplay = calculateSetsToDisplay();

  // 🧹 [REFACTOR] Auto-add sets when needed (like league) - 문자열 기반
  useEffect(() => {
    const neededSets = calculateSetsToDisplay();
    if (sets.length < neededSets) {
      const newSets = [...sets];
      while (newSets.length < neededSets) {
        newSets.push({ player1: '', player2: '', player1_tb: '', player2_tb: '' });
      }
      setSets(newSets);
      console.log('🧹 [REFACTOR] Auto-added set. Now showing:', neededSets, 'sets');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setsToDisplay]);

  // 🧹 [REFACTOR] Reset form when match changes - 문자열 기반
  useEffect(() => {
    const initialSets: StringSetScore[] = [
      { player1: '', player2: '', player1_tb: '', player2_tb: '' },
    ];

    console.log('🧹 [REFACTOR] ScoreInputContent reset for match:', {
      matchId: match.id,
      player1: match.player1.userName,
      player2: match.player2.userName,
      setsToWin,
      gamesPerSet,
      maxSets,
    });

    setSets(initialSets);
    setRetired(false);
    setWalkover(false);
    setManualWinner(null);
    setNotes('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  // 🧹 [REFACTOR] 문자열 기반 점수 업데이트 - 리그와 동일한 패턴
  const updateSetScore = (setIndex: number, player: 'player1' | 'player2', value: string) => {
    const newSets = [...sets];

    // Ensure we have enough sets
    while (newSets.length <= setIndex) {
      newSets.push({ player1: '', player2: '', player1_tb: '', player2_tb: '' });
    }

    // 빈 문자열이면 그대로 저장 (미입력 상태)
    if (value === '') {
      newSets[setIndex][player] = '';
      setSets(newSets);
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    // 🦾 [IRON MAN] Basic validation - ensure reasonable values
    const maxGamesAllowed = gamesPerSet + 1; // 일반: 7, 단축: 5
    if (numValue > maxGamesAllowed) {
      const maxScoreMessage =
        gamesPerSet === 4
          ? t('scoreInput.shortSetsMaxGamesExceeded', { max: maxGamesAllowed })
          : t('scoreInput.gamesMustBeBetween');
      Alert.alert(t('scoreInput.invalidScore'), maxScoreMessage);
      return;
    }

    // 상대방 점수와 함께 피클볼 규칙 검증
    const otherPlayer = player === 'player1' ? 'player2' : 'player1';
    const otherPlayerValue = newSets[setIndex][otherPlayer];
    if (otherPlayerValue.trim()) {
      const otherNumValue = parseInt(otherPlayerValue, 10);
      if (!isNaN(otherNumValue) && !isValidPickleballScore(numValue, otherNumValue)) {
        Alert.alert(t('scoreInput.invalidScore'), t('scoreInput.invalidPickleballScore'));
        return;
      }
    }

    // Update the score
    newSets[setIndex][player] = value;

    // Clear tiebreak when not 6-6
    const p1 = parseInt(newSets[setIndex].player1 || '0', 10);
    const p2 = parseInt(newSets[setIndex].player2 || '0', 10);
    if (!(p1 === gamesPerSet && p2 === gamesPerSet)) {
      newSets[setIndex].player1_tb = '';
      newSets[setIndex].player2_tb = '';
    }

    setSets(newSets);
  };

  // 🧹 [REFACTOR] 문자열 기반 타이브레이크 점수 업데이트
  const updateTiebreakPoints = (setIndex: number, player: 'player1' | 'player2', value: string) => {
    const newSets = [...sets];
    const propertyName = player === 'player1' ? 'player1_tb' : 'player2_tb';

    // 빈 문자열이면 그대로 저장
    if (value === '') {
      newSets[setIndex][propertyName] = '';
      setSets(newSets);
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    newSets[setIndex][propertyName] = value;
    setSets(newSets);
  };

  // 🔴 [HIGH] 기권 ↔ 부전승 상호 배타성 핸들러
  // 기권 체크 시 부전승 자동 해제
  const handleRetiredChange = () => {
    const newRetired = !retired;
    setRetired(newRetired);
    if (newRetired) {
      setWalkover(false); // 기권 활성화 시 부전승 비활성화
    }
    setManualWinner(null); // 승자 선택 초기화
  };

  // 부전승 체크 시 기권 자동 해제
  const handleWalkoverChange = () => {
    const newWalkover = !walkover;
    setWalkover(newWalkover);
    if (newWalkover) {
      setRetired(false); // 부전승 활성화 시 기권 비활성화
    }
    setManualWinner(null); // 승자 선택 초기화
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 🧹 [REFACTOR] 검증용 SetScore[] 변환
      const setsForValidation: SetScore[] = sets
        .filter(set => set.player1.trim() || set.player2.trim())
        .map(set => ({
          player1Games: parseInt(set.player1, 10) || 0,
          player2Games: parseInt(set.player2, 10) || 0,
          ...(set.player1_tb.trim() && {
            player1TiebreakPoints: parseInt(set.player1_tb, 10) || 0,
          }),
          ...(set.player2_tb.trim() && {
            player2TiebreakPoints: parseInt(set.player2_tb, 10) || 0,
          }),
        }));

      // 🟢 [LOW] 부전승 시 점수 검증 스킵
      if (!walkover) {
        const validationResult = validatePickleballScore(setsForValidation, gamesPerSet);
        if (!validationResult.isValid) {
          const errorMessage =
            validationResult.errors.length > 0
              ? validationResult.errors.join('\n')
              : t('scoreInput.pleaseCheckScore');

          Alert.alert(t('scoreInput.invalidScore'), errorMessage);
          return;
        }
      }

      // Calculate winner
      const _winner = calculateMatchWinner();

      // 🐛 [DEBUG] Log winner calculation
      console.log('🐛 [DEBUG] Winner calculation result:', {
        _winner,
        retired,
        walkover,
        setsToWin,
        gamesPerSet,
        sets,
        setsLength: sets.length,
        setWinners: sets.map((s, i) => getSetWinner(s, i)),
      });

      // 🔴 [HIGH] 기권/부전승 시 승자 선택 필수
      if ((retired || walkover) && !manualWinner) {
        Alert.alert(t('scoreInput.winnerSelectionRequired'), t('scoreInput.pleaseSelectWinner'));
        return;
      }

      if (!_winner && !retired && !walkover) {
        console.log('❌ [ERROR] Match incomplete - showing alert');
        Alert.alert(
          t('scoreInput.matchIncomplete'),
          t('scoreInput.matchNotComplete', { sets: setsToWin })
        );
        return;
      }

      // 🧹 [REFACTOR] 문자열 → 숫자 변환하여 SetScore[] 생성
      const convertedSets: SetScore[] = sets
        .filter(set => set.player1.trim() && set.player2.trim())
        .map(set => ({
          player1Games: parseInt(set.player1, 10) || 0,
          player2Games: parseInt(set.player2, 10) || 0,
          ...(set.player1_tb.trim() && {
            player1TiebreakPoints: parseInt(set.player1_tb, 10) || 0,
          }),
          ...(set.player2_tb.trim() && {
            player2TiebreakPoints: parseInt(set.player2_tb, 10) || 0,
          }),
        }));

      // 🟡 [MEDIUM] retiredAt 자동 감지
      const calculatedRetiredAt = retired
        ? (() => {
            const lastSetIndex = sets.findLastIndex(
              set => set.player1.trim() || set.player2.trim()
            );
            return lastSetIndex >= 0 ? lastSetIndex + 1 : undefined;
          })()
        : undefined;

      const scoreData: ScoreInputForm = {
        matchId: match.id,
        sets: convertedSets,
        _winner: retired || walkover ? manualWinner : _winner,
        finalScore: retired ? 'RET' : walkover ? 'W.O.' : undefined,
        retired,
        retiredAt: calculatedRetiredAt,
        walkover,
        notes: notes.trim(),
      };

      console.log('🎾 ScoreInputContent submitting:', scoreData);

      await onSubmit(scoreData);

      // 🤖 IRON MAN: Removed redundant success alert - parent screen will show final confirmation
      // Alert was showing "저장되었습니다" before parent's "입력되었습니다" causing double alerts
    } catch (error) {
      console.error('Error in ScoreInputContent:', error);
      Alert.alert(t('scoreInput.error'), t('scoreInput.savingError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const player1Name = match.player1?.userName || 'Player 1';
  const player2Name = match.player2?.userName || 'Player 2';

  // 🎯 [KIM FIX] 복식 팀 이름을 개별 선수로 분리 (a/b 형태)
  const isDoublesName = (name: string) => name.includes(' / ');
  const splitDoublesName = (name: string) => {
    if (isDoublesName(name)) {
      const parts = name.split(' / ');
      return { player1: parts[0] || '', player2: parts[1] || '' };
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {t('scoreInput.enterMatchResult')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Match Info */}
        <View style={[styles.matchInfo, { backgroundColor: theme.colors.surface }]}>
          {/* 🎯 [KIM FIX] 복식 긴 이름을 위해 세로 레이아웃으로 변경 */}
          <Text
            style={[styles.matchPlayerName, { color: theme.colors.onSurface }]}
            numberOfLines={1}
            ellipsizeMode='tail'
          >
            {player1Name}
          </Text>
          <Text style={[styles.matchVsText, { color: theme.colors.onSurfaceVariant }]}>vs</Text>
          <Text
            style={[styles.matchPlayerName, { color: theme.colors.onSurface }]}
            numberOfLines={1}
            ellipsizeMode='tail'
          >
            {player2Name}
          </Text>
          <Text style={[styles.matchSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t('scoreInput.enterScoreForEachSet')}
          </Text>
        </View>

        {/* Sets Input - 🎯 [KIM FIX] Auto-display sets like league */}
        <View style={styles.setsContainer}>
          {sets.slice(0, setsToDisplay).map((set, index) => {
            // 🧹 [REFACTOR] 문자열에서 숫자로 변환하여 타이브레이크 조건 체크
            const p1Games = parseInt(set.player1, 10) || 0;
            const p2Games = parseInt(set.player2, 10) || 0;
            const isTiebreak = p1Games === gamesPerSet && p2Games === gamesPerSet;
            const setWinner = getSetWinner(set, index);
            const matchWinner = calculateMatchWinner();

            return (
              <View key={index} style={[styles.setRow, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.setRowContent}>
                  <Text style={[styles.setLabel, { color: theme.colors.onSurface }]}>
                    {t('scoreInput.setNumber', { number: index + 1 })}
                    {setWinner && (
                      <Text style={[styles.setWinnerIndicator, { color: theme.colors.primary }]}>
                        {' '}
                        ✓
                      </Text>
                    )}
                  </Text>

                  <View style={styles.scoreInputs}>
                    <View style={styles.playerScore}>
                      {/* 🎯 [KIM FIX] 복식: 각 선수 이름을 개별 truncate */}
                      {splitDoublesName(player1Name) ? (
                        <View style={styles.doublesNameContainer}>
                          <Text
                            style={[
                              styles.doublesPlayerName,
                              { color: theme.colors.onSurface },
                              setWinner === 'player1' && {
                                color: theme.colors.primary,
                                fontWeight: 'bold',
                              },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode='tail'
                          >
                            {splitDoublesName(player1Name)!.player1}
                          </Text>
                          <Text
                            style={[styles.doublesSlash, { color: theme.colors.onSurfaceVariant }]}
                          >
                            /
                          </Text>
                          <Text
                            style={[
                              styles.doublesPlayerName,
                              { color: theme.colors.onSurface },
                              setWinner === 'player1' && {
                                color: theme.colors.primary,
                                fontWeight: 'bold',
                              },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode='tail'
                          >
                            {splitDoublesName(player1Name)!.player2}
                            {matchWinner === 'player1' && ' 👑'}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.playerName,
                            { color: theme.colors.onSurface },
                            setWinner === 'player1' && {
                              color: theme.colors.primary,
                              fontWeight: 'bold',
                            },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode='tail'
                        >
                          {player1Name}
                          {matchWinner === 'player1' && ' 👑'}
                        </Text>
                      )}
                      <PaperTextInput
                        disabled={retired || walkover}
                        style={[
                          styles.scoreInput,
                          setWinner === 'player1' && styles.winnerScoreInput,
                          (retired || walkover) && styles.disabledInput,
                        ]}
                        value={set.player1}
                        onChangeText={text => updateSetScore(index, 'player1', text)}
                        keyboardType='numeric'
                        maxLength={1}
                        dense
                        selectTextOnFocus
                      />
                    </View>

                    <Text style={[styles.scoreSeparator, { color: theme.colors.onSurfaceVariant }]}>
                      -
                    </Text>

                    <View style={styles.playerScore}>
                      {/* 🎯 [KIM FIX] 복식: 각 선수 이름을 개별 truncate */}
                      {splitDoublesName(player2Name) ? (
                        <View style={styles.doublesNameContainer}>
                          <Text
                            style={[
                              styles.doublesPlayerName,
                              { color: theme.colors.onSurface },
                              setWinner === 'player2' && {
                                color: theme.colors.primary,
                                fontWeight: 'bold',
                              },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode='tail'
                          >
                            {splitDoublesName(player2Name)!.player1}
                          </Text>
                          <Text
                            style={[styles.doublesSlash, { color: theme.colors.onSurfaceVariant }]}
                          >
                            /
                          </Text>
                          <Text
                            style={[
                              styles.doublesPlayerName,
                              { color: theme.colors.onSurface },
                              setWinner === 'player2' && {
                                color: theme.colors.primary,
                                fontWeight: 'bold',
                              },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode='tail'
                          >
                            {splitDoublesName(player2Name)!.player2}
                            {matchWinner === 'player2' && ' 👑'}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.playerName,
                            { color: theme.colors.onSurface },
                            setWinner === 'player2' && {
                              color: theme.colors.primary,
                              fontWeight: 'bold',
                            },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode='tail'
                        >
                          {player2Name}
                          {matchWinner === 'player2' && ' 👑'}
                        </Text>
                      )}
                      <PaperTextInput
                        disabled={retired || walkover}
                        style={[
                          styles.scoreInput,
                          setWinner === 'player2' && styles.winnerScoreInput,
                          (retired || walkover) && styles.disabledInput,
                        ]}
                        value={set.player2}
                        onChangeText={text => updateSetScore(index, 'player2', text)}
                        keyboardType='numeric'
                        maxLength={1}
                        dense
                        selectTextOnFocus
                      />
                    </View>
                  </View>

                  {/* 🎯 [KIM FIX] Removed manual set removal - sets are auto-managed */}
                </View>

                {/* Tiebreak Input Section */}
                {isTiebreak && (
                  <View
                    style={[
                      styles.tiebreakContainer,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    <Text style={[styles.tiebreakLabel, { color: theme.colors.primary }]}>
                      {index === 2 ? t('scoreInput.superTiebreak') : t('scoreInput.tiebreak')}
                    </Text>

                    <View style={styles.tiebreakInputs}>
                      <View style={styles.tiebreakPlayerScore}>
                        {/* 🎯 [KIM FIX] 복식: 타이브레이크에서도 개별 truncate */}
                        {splitDoublesName(player1Name) ? (
                          <View style={styles.tiebreakDoublesName}>
                            <Text
                              style={[styles.tiebreakPlayerName, { color: theme.colors.onSurface }]}
                              numberOfLines={1}
                              ellipsizeMode='tail'
                            >
                              {splitDoublesName(player1Name)!.player1}
                            </Text>
                            <Text
                              style={[
                                styles.tiebreakDoublesSlash,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                            >
                              /
                            </Text>
                            <Text
                              style={[styles.tiebreakPlayerName, { color: theme.colors.onSurface }]}
                              numberOfLines={1}
                              ellipsizeMode='tail'
                            >
                              {splitDoublesName(player1Name)!.player2}
                            </Text>
                          </View>
                        ) : (
                          <Text
                            style={[styles.tiebreakPlayerName, { color: theme.colors.onSurface }]}
                            numberOfLines={1}
                            ellipsizeMode='tail'
                          >
                            {player1Name}
                          </Text>
                        )}
                        <View style={styles.tiebreakInputWrapper}>
                          <Text style={[styles.tiebreakBpaddle, { color: theme.colors.primary }]}>
                            (
                          </Text>
                          <TextInput
                            style={[
                              styles.tiebreakInput,
                              {
                                borderColor: theme.colors.primary,
                                color: theme.colors.onSurface,
                              },
                            ]}
                            value={set.player1_tb}
                            onChangeText={text => updateTiebreakPoints(index, 'player1', text)}
                            keyboardType='numeric'
                            maxLength={2}
                            placeholder={index === 2 ? '10' : '7'}
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                            selectTextOnFocus={true}
                          />
                          <Text style={[styles.tiebreakBpaddle, { color: theme.colors.primary }]}>
                            )
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.tiebreakSeparator, { color: theme.colors.primary }]}>
                        -
                      </Text>

                      <View style={styles.tiebreakPlayerScore}>
                        {/* 🎯 [KIM FIX] 복식: 타이브레이크에서도 개별 truncate */}
                        {splitDoublesName(player2Name) ? (
                          <View style={styles.tiebreakDoublesName}>
                            <Text
                              style={[styles.tiebreakPlayerName, { color: theme.colors.onSurface }]}
                              numberOfLines={1}
                              ellipsizeMode='tail'
                            >
                              {splitDoublesName(player2Name)!.player1}
                            </Text>
                            <Text
                              style={[
                                styles.tiebreakDoublesSlash,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                            >
                              /
                            </Text>
                            <Text
                              style={[styles.tiebreakPlayerName, { color: theme.colors.onSurface }]}
                              numberOfLines={1}
                              ellipsizeMode='tail'
                            >
                              {splitDoublesName(player2Name)!.player2}
                            </Text>
                          </View>
                        ) : (
                          <Text
                            style={[styles.tiebreakPlayerName, { color: theme.colors.onSurface }]}
                            numberOfLines={1}
                            ellipsizeMode='tail'
                          >
                            {player2Name}
                          </Text>
                        )}
                        <View style={styles.tiebreakInputWrapper}>
                          <Text style={[styles.tiebreakBpaddle, { color: theme.colors.primary }]}>
                            (
                          </Text>
                          <TextInput
                            style={[
                              styles.tiebreakInput,
                              {
                                borderColor: theme.colors.primary,
                                color: theme.colors.onSurface,
                              },
                            ]}
                            value={set.player2_tb}
                            onChangeText={text => updateTiebreakPoints(index, 'player2', text)}
                            keyboardType='numeric'
                            maxLength={2}
                            placeholder={index === 2 ? '10' : '7'}
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                            selectTextOnFocus={true}
                          />
                          <Text style={[styles.tiebreakBpaddle, { color: theme.colors.primary }]}>
                            )
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={[styles.tiebreakHint, { color: theme.colors.onSurfaceVariant }]}>
                      {index === 2
                        ? t('scoreInput.superTiebreakHint')
                        : t('scoreInput.tiebreakHint')}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* 🎯 [KIM FIX] Removed manual "세트 추가" button - sets are auto-added like league */}

          {/* 🧹 [REFACTOR] Match Status Preview - 문자열 기반 */}
          {sets.some(set => set.player1.trim() && set.player2.trim()) && (
            <View
              style={[
                styles.matchStatusContainer,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Text style={[styles.matchStatusTitle, { color: theme.colors.onSurface }]}>
                {t('scoreInput.currentMatchStatus')}
              </Text>

              <View style={styles.matchStatusContent}>
                <Text style={[styles.scorePreviewText, { color: theme.colors.primary }]}>
                  {sets
                    .filter(set => set.player1.trim() && set.player2.trim())
                    .map((set, idx) => {
                      const p1 = parseInt(set.player1, 10) || 0;
                      const p2 = parseInt(set.player2, 10) || 0;
                      let setScore = `${p1}-${p2}`;

                      if (
                        p1 === 6 &&
                        p2 === 6 &&
                        (set.player1_tb.trim() || set.player2_tb.trim())
                      ) {
                        const tb1 = parseInt(set.player1_tb, 10) || 0;
                        const tb2 = parseInt(set.player2_tb, 10) || 0;
                        if (idx === 2) {
                          setScore += `(${tb1}-${tb2})`;
                        } else {
                          setScore += `(${Math.max(tb1, tb2)})`;
                        }
                      }

                      return setScore;
                    })
                    .join(', ')}
                </Text>

                {calculateMatchWinner() && (
                  <View style={styles.matchWinnerContainer}>
                    <Text
                      style={[styles.matchWinnerLabel, { color: theme.colors.onSurfaceVariant }]}
                    >
                      🏆 {t('scoreInput.currentWinner')}:
                    </Text>
                    <Text style={[styles.matchWinnerName, { color: theme.colors.primary }]}>
                      {calculateMatchWinner() === 'player1' ? player1Name : player2Name}
                    </Text>
                  </View>
                )}

                {!calculateMatchWinner() && (
                  <Text
                    style={[styles.matchInProgressText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    ⚡ {t('scoreInput.matchInProgress')}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Special Cases */}
        <View style={[styles.specialCases, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity onPress={handleRetiredChange} style={styles.checkboxRow}>
            <Ionicons
              name={retired ? 'checkbox' : 'square-outline'}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.checkboxLabel, { color: theme.colors.onSurface }]}>
              {t('scoreInput.retired')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleWalkoverChange} style={styles.checkboxRow}>
            <Ionicons
              name={walkover ? 'checkbox' : 'square-outline'}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.checkboxLabel, { color: theme.colors.onSurface }]}>
              {t('scoreInput.walkover')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔴 [HIGH] Winner Selection (only shown when retired or walkover is checked) */}
        {(retired || walkover) && (
          <View
            style={[
              styles.winnerSelectionContainer,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text style={[styles.winnerSelectionTitle, { color: theme.colors.onSurface }]}>
              {t('scoreInput.selectWinnerRequired')}
            </Text>
            <RadioButton.Group
              onValueChange={value => setManualWinner(value as 'player1' | 'player2')}
              value={manualWinner || ''}
            >
              <RadioButton.Item label={player1Name} value='player1' color={theme.colors.primary} />
              <RadioButton.Item label={player2Name} value='player2' color={theme.colors.primary} />
            </RadioButton.Group>
            <Text style={[styles.winnerSelectionHint, { color: theme.colors.onSurfaceVariant }]}>
              {retired
                ? t('scoreInput.selectPlayerWhoDidNotRetire')
                : t('scoreInput.selectPlayerWhoShowedUp')}
            </Text>
          </View>
        )}

        {/* Notes */}
        <View style={[styles.notesContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.notesLabel, { color: theme.colors.onSurface }]}>
            {t('scoreInput.notesOptional')}
          </Text>
          <PaperTextInput
            style={[
              styles.notesInput,
              {
                borderColor: theme.colors.outline,
                color: theme.colors.onSurface,
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('scoreInput.notesPlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.submitContainer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode='contained'
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          {t('scoreInput.saveResult')}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: {
  colors: {
    background: string;
    surface: string;
    primary: string;
    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
    error: string;
  };
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    headerRight: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    matchInfo: {
      padding: 16,
      margin: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    // 🎯 [KIM FIX] 복식 긴 이름을 위한 새로운 스타일
    matchPlayerName: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      width: '100%',
    },
    matchVsText: {
      fontSize: 14,
      marginVertical: 4,
    },
    matchSubtitle: {
      fontSize: 14,
      marginTop: 8,
    },
    setsContainer: {
      margin: 16,
    },
    setRow: {
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: 16,
      marginBottom: 16,
      borderRadius: 12,
      minHeight: 'auto',
    },
    setRowContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 0,
    },
    setLabel: {
      fontSize: 16,
      fontWeight: '600',
      width: 60,
    },
    scoreInputs: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerScore: {
      alignItems: 'center',
      flex: 1,
      maxWidth: 120, // 🎯 [KIM FIX] 긴 이름 오버플로우 방지
    },
    playerName: {
      fontSize: 14,
      marginBottom: 8,
      textAlign: 'center',
      width: '100%', // 🎯 [KIM FIX] 부모 너비 내에서만 표시
    },
    // 🎯 [KIM FIX] 복식 선수 이름 개별 truncate 스타일
    doublesNameContainer: {
      alignItems: 'center',
      marginBottom: 8,
      width: '100%',
    },
    doublesPlayerName: {
      fontSize: 12,
      textAlign: 'center',
      maxWidth: '100%',
    },
    doublesSlash: {
      fontSize: 11,
      marginVertical: 1,
    },
    scoreInput: {
      backgroundColor: theme.colors.surface,
      textAlign: 'center',
      width: 80,
    },
    winnerScoreInput: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      backgroundColor: (theme.colors as any).warningContainer || '#FFF8DC',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    scoreSeparator: {
      fontSize: 20,
      fontWeight: 'bold',
      marginHorizontal: 16,
    },
    removeSetButton: {
      marginLeft: 12,
    },
    addSetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      borderStyle: 'solid',
    },
    addSetText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
    },
    specialCases: {
      margin: 16,
      padding: 16,
      borderRadius: 12,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    checkboxLabel: {
      marginLeft: 12,
      fontSize: 16,
    },
    notesContainer: {
      margin: 16,
      padding: 16,
      borderRadius: 12,
    },
    notesLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    notesInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    submitContainer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.1)',
    },
    submitButton: {
      marginVertical: 8,
    },
    submitButtonContent: {
      paddingVertical: 8,
    },
    // Tiebreak styles
    setWinnerIndicator: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    tiebreakContainer: {
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderStyle: 'solid',
    },
    tiebreakLabel: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 8,
    },
    tiebreakInputs: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    tiebreakPlayerScore: {
      flex: 1,
      alignItems: 'center',
    },
    tiebreakPlayerName: {
      fontSize: 11,
      fontWeight: '500',
      marginBottom: 3,
    },
    // 🎯 [KIM FIX] 복식 타이브레이크 선수 이름
    tiebreakDoublesName: {
      alignItems: 'center',
      marginBottom: 3,
    },
    tiebreakDoublesSlash: {
      fontSize: 9,
      marginVertical: 0,
    },
    tiebreakInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tiebreakBpaddle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginHorizontal: 2,
    },
    tiebreakInput: {
      width: 35,
      height: 35,
      borderWidth: 1,
      borderRadius: 6,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    tiebreakSeparator: {
      fontSize: 16,
      fontWeight: 'bold',
      marginHorizontal: 12,
    },
    tiebreakHint: {
      fontSize: 10,
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: 2,
    },
    // Match Status Preview - 🎨 아이언맨의 디자인 개선!
    matchStatusContainer: {
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      backgroundColor: (theme.colors as any).primaryContainer || theme.colors.surface, // 🎨 배경색 개선
      alignItems: 'center', // 🎯 중앙 정렬 추가
    },
    matchStatusTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      color: (theme.colors as any).onPrimaryContainer || theme.colors.onSurface, // 🎨 대비 색상
    },
    matchStatusContent: {
      alignItems: 'center',
      gap: 8,
    },
    scorePreviewText: {
      fontSize: 20, // 🎨 크기 증가
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      color: theme.colors.primary, // 🎨 더 밝고 강조되는 색상
      letterSpacing: 1, // 🎨 글자 간격으로 가독성 향상
    },
    matchWinnerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center', // 🎯 중앙 정렬
      gap: 8,
      padding: 12, // 🎨 패딩 증가
      borderRadius: 8,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      backgroundColor: (theme.colors as any).secondaryContainer || theme.colors.surface, // 🎨 다른 배경색으로 구분
      marginTop: 8, // 🎨 간격 추가
    },
    matchWinnerLabel: {
      fontSize: 14,
      fontWeight: '500',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      color: (theme.colors as any).onSecondaryContainer || theme.colors.onSurface, // 🎨 대비 색상
    },
    matchWinnerName: {
      fontSize: 18, // 🎨 크기 증가
      fontWeight: 'bold',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      color: (theme.colors as any).secondary || theme.colors.primary, // 🎨 강조 색상
    },
    matchInProgressText: {
      fontSize: 16, // 🎨 크기 증가
      fontStyle: 'italic',
      textAlign: 'center',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      color: (theme.colors as any).secondary || theme.colors.primary, // 🎨 더 명확한 색상
      fontWeight: '500', // 🎨 약간의 두께 추가
    },
    // 🔴 [HIGH] Retired/Walkover Winner Selection Styles
    disabledInput: {
      backgroundColor: '#f0f0f0',
      opacity: 0.6,
    },
    winnerSelectionContainer: {
      margin: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    winnerSelectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
    },
    winnerSelectionHint: {
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default ScoreInputContent;
