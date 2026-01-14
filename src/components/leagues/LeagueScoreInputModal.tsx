import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput as RNTextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Card, Title, Button, TextInput, IconButton, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { LeagueMatch } from '../../types/league';
import { useLanguage } from '../../contexts/LanguageContext';

interface ScoreSet {
  player1: string;
  player2: string;
  player1_tb?: string;
  player2_tb?: string;
}

interface LeagueScoreInputModalProps {
  visible: boolean;
  match: LeagueMatch | null;
  onSubmit: (result: {
    matchId: string;
    winnerId: string;
    loserId: string;
    score: string;
    sets: ScoreSet[];
  }) => void;
  onClose: () => void;
  submitting?: boolean;
}

const LeagueScoreInputModal: React.FC<LeagueScoreInputModalProps> = ({
  visible,
  match,
  onSubmit,
  onClose,
  submitting = false,
}) => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const { t } = useLanguage();

  // 🎯 [KIM FIX] 복식 팀 이름을 개별 선수로 분리 (a/b 형태)
  const isDoublesName = (name: string) => name.includes(' / ');
  const splitDoublesName = (name: string) => {
    if (isDoublesName(name)) {
      const parts = name.split(' / ');
      return { player1: parts[0] || '', player2: parts[1] || '' };
    }
    return null;
  };

  const [scoreSets, setScoreSets] = useState<ScoreSet[]>([
    { player1: '', player2: '', player1_tb: '', player2_tb: '' },
    { player1: '', player2: '', player1_tb: '', player2_tb: '' },
    { player1: '', player2: '', player1_tb: '', player2_tb: '' },
  ]);
  const [matchWinner, setMatchWinner] = useState<{ id: string; name: string } | null>(null);
  const [matchLoser, setMatchLoser] = useState<{ id: string; name: string } | null>(null);
  const [retired, setRetired] = useState(false);
  const [walkover, setWalkover] = useState(false);
  const [manualWinner, setManualWinner] = useState<'player1' | 'player2' | null>(null);

  // Reset form when modal opens/closes OR pre-fill existing scores
  useEffect(() => {
    if (visible && match) {
      // Pre-fill existing scores if match already has results (for admin corrections)
      if (match.score && match.score.sets && match.score.sets.length > 0) {
        console.log('📝 [Pre-fill] Loading existing scores:', match.score);

        const existingSets = match.score.sets.map(set => ({
          player1: set.player1Games?.toString() || '',
          player2: set.player2Games?.toString() || '',
          player1_tb: set.tiebreak?.player1Points?.toString() || '',
          player2_tb: set.tiebreak?.player2Points?.toString() || '',
        }));

        // Pad with empty sets if needed (minimum 3 sets shown)
        while (existingSets.length < 3) {
          existingSets.push({ player1: '', player2: '', player1_tb: '', player2_tb: '' });
        }

        setScoreSets(existingSets);

        // Pre-fill winner/loser
        if (match._winner) {
          const winnerId = match._winner;
          const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;
          const winnerName = winnerId === match.player1Id ? match.player1Name : match.player2Name;
          const loserName = winnerId === match.player1Id ? match.player2Name : match.player1Name;

          setMatchWinner({ id: winnerId, name: winnerName });
          setMatchLoser({ id: loserId, name: loserName });
        }

        // Pre-fill retired/walkover if present
        if (match.score.retiredPlayer) {
          setRetired(true);
          setManualWinner(match.score.retiredPlayer === match.player1Id ? 'player2' : 'player1');
        } else if (match.score.walkover) {
          setWalkover(true);
          setManualWinner(match._winner === match.player1Id ? 'player1' : 'player2');
        }
      } else {
        // No existing scores - start fresh
        setScoreSets([
          { player1: '', player2: '', player1_tb: '', player2_tb: '' },
          { player1: '', player2: '', player1_tb: '', player2_tb: '' },
          { player1: '', player2: '', player1_tb: '', player2_tb: '' },
        ]);
        setMatchWinner(null);
        setMatchLoser(null);
        setRetired(false);
        setWalkover(false);
        setManualWinner(null);
      }
    }
  }, [visible, match]);

  // Tennis score validation function
  const isValidTennisScore = (score1: number, score2: number): boolean => {
    const maxScore = Math.max(score1, score2);
    const minScore = Math.min(score1, score2);

    if (maxScore > 7) return false;
    if (maxScore <= 6) return true;
    if (maxScore === 7) {
      return minScore === 5;
    }
    return true;
  };

  // Unified set winner determination
  const getSetWinner = useCallback(
    (set: ScoreSet, setIndex: number): 'player1' | 'player2' | null => {
      if (!set.player1.trim() || !set.player2.trim()) {
        return null;
      }

      const player1Games = parseInt(set.player1, 10);
      const player2Games = parseInt(set.player2, 10);

      if (isNaN(player1Games) || isNaN(player2Games)) {
        return null;
      }

      const isTiebreakSet = player1Games === 6 && player2Games === 6;

      if (isTiebreakSet) {
        const player1TB = parseInt(set.player1_tb || '0', 10);
        const player2TB = parseInt(set.player2_tb || '0', 10);

        const pointsToWin = setIndex === 2 ? 10 : 7;

        if (player1TB >= pointsToWin && player1TB - player2TB >= 2) {
          return 'player1';
        } else if (player2TB >= pointsToWin && player2TB - player1TB >= 2) {
          return 'player2';
        }
        return null;
      } else {
        if (player1Games > player2Games) {
          return 'player1';
        } else if (player2Games > player1Games) {
          return 'player2';
        }
        return null;
      }
    },
    []
  );

  // Calculate how many sets should be displayed dynamically
  const calculateSetsToDisplay = useCallback(() => {
    let setsCompleted = 0;
    let player1SetWins = 0;
    let player2SetWins = 0;

    for (let i = 0; i < scoreSets.length; i++) {
      const set = scoreSets[i];
      const winner = getSetWinner(set, i);

      if (winner === null) {
        break;
      }

      if (winner === 'player1') {
        player1SetWins++;
      } else if (winner === 'player2') {
        player2SetWins++;
      }
      setsCompleted++;
    }

    if (setsCompleted === 0) {
      return 1;
    } else if (setsCompleted === 1) {
      return 2;
    } else if (setsCompleted === 2 && player1SetWins === 1 && player2SetWins === 1) {
      return 3;
    }

    return Math.max(2, setsCompleted);
  }, [scoreSets, getSetWinner]);

  // Calculate match winner based on set scores
  const calculateMatchWinner = useCallback(() => {
    if (!match) return { winner: null, loser: null };

    let player1SetWins = 0;
    let player2SetWins = 0;

    for (let i = 0; i < scoreSets.length; i++) {
      const set = scoreSets[i];
      const winner = getSetWinner(set, i);

      if (winner === 'player1') {
        player1SetWins++;
      } else if (winner === 'player2') {
        player2SetWins++;
      }
    }

    if (player1SetWins >= 2) {
      return {
        winner: { id: match.player1Id, name: match.player1Name },
        loser: { id: match.player2Id, name: match.player2Name },
      };
    } else if (player2SetWins >= 2) {
      return {
        winner: { id: match.player2Id, name: match.player2Name },
        loser: { id: match.player1Id, name: match.player1Name },
      };
    }

    return { winner: null, loser: null };
  }, [scoreSets, match, getSetWinner]);

  // Real-time winner calculation
  useEffect(() => {
    const result = calculateMatchWinner();
    setMatchWinner(result.winner);
    setMatchLoser(result.loser);
  }, [scoreSets, calculateMatchWinner]);

  // Update matchWinner/matchLoser when manualWinner changes (for retired/walkover)
  useEffect(() => {
    if ((retired || walkover) && manualWinner && match) {
      const winnerId = manualWinner === 'player1' ? match.player1Id : match.player2Id;
      const winnerName = manualWinner === 'player1' ? match.player1Name : match.player2Name;
      const loserId = manualWinner === 'player1' ? match.player2Id : match.player1Id;
      const loserName = manualWinner === 'player1' ? match.player2Name : match.player1Name;

      setMatchWinner({ id: winnerId, name: winnerName });
      setMatchLoser({ id: loserId, name: loserName });
    } else if (!retired && !walkover) {
      // Clear manual winner when returning to normal mode
      // (matchWinner will be recalculated from scoreSets by the other useEffect)
    }
  }, [retired, walkover, manualWinner, match]);

  // 🔴 [HIGH] 기권 ↔ 부전승 상호 배타성 핸들러
  const handleRetiredChange = () => {
    const newRetired = !retired;
    setRetired(newRetired);
    if (newRetired) {
      setWalkover(false); // 기권 활성화 시 부전승 비활성화
    }
    setManualWinner(null); // 승자 선택 초기화
  };

  const handleWalkoverChange = () => {
    const newWalkover = !walkover;
    setWalkover(newWalkover);
    if (newWalkover) {
      setRetired(false); // 부전승 활성화 시 기권 비활성화
    }
    setManualWinner(null); // 승자 선택 초기화
  };

  const updateScore = (
    setIndex: number,
    player: 'player1' | 'player2' | 'player1_tb' | 'player2_tb',
    value: string
  ) => {
    if (player.includes('_tb')) {
      const newScoreSets = [...scoreSets];
      newScoreSets[setIndex][player] = value;
      setScoreSets(newScoreSets);
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    const newScoreSets = [...scoreSets];
    newScoreSets[setIndex][player] = value;

    const player1Score = parseInt(newScoreSets[setIndex].player1 || '0', 10);
    const player2Score = parseInt(newScoreSets[setIndex].player2 || '0', 10);

    if (newScoreSets[setIndex].player1 && newScoreSets[setIndex].player2) {
      if (!isValidTennisScore(player1Score, player2Score)) {
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

  const formatScore = (): string => {
    const sets = [];
    const setsToFormat = calculateSetsToDisplay();

    for (let i = 0; i < setsToFormat; i++) {
      const set = scoreSets[i];
      if (set.player1.trim() && set.player2.trim()) {
        const player1Games = parseInt(set.player1, 10);
        const player2Games = parseInt(set.player2, 10);
        let scoreString = `${set.player1}-${set.player2}`;

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

  const validateScore = (): boolean => {
    // 기권/부전승 시 점수 검증 스킵
    if (retired || walkover) {
      return true;
    }

    if (!matchWinner || !matchLoser) {
      Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.matchNotComplete'));
      return false;
    }

    let completedSets = 0;
    const setsToCheck = calculateSetsToDisplay();

    for (let i = 0; i < setsToCheck; i++) {
      const set = scoreSets[i];
      if (!set.player1.trim() || !set.player2.trim()) {
        continue;
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

      const isTiebreakSet = score1 === 6 && score2 === 6;

      if (isTiebreakSet) {
        const tb1 = parseInt(set.player1_tb || '0');
        const tb2 = parseInt(set.player2_tb || '0');

        if (isNaN(tb1) || isNaN(tb2)) {
          Alert.alert(
            t('recordScore.alerts.notice'),
            t('recordScore.alerts.tiebreakRequired', { set: i + 1 })
          );
          return false;
        }

        const pointsToWin = i === 2 ? 10 : 7;
        const isValidTiebreak =
          (tb1 >= pointsToWin || tb2 >= pointsToWin) && Math.abs(tb1 - tb2) >= 2;

        if (!isValidTiebreak) {
          Alert.alert(
            t('recordScore.alerts.notice'),
            t('recordScore.alerts.tiebreakInvalid', { set: i + 1 })
          );
          return false;
        }
      } else {
        if (score1 === score2) {
          if (score1 !== 6) {
            Alert.alert(
              t('recordScore.alerts.notice'),
              t('recordScore.alerts.tieOnly66', { set: i + 1 })
            );
            return false;
          }
          Alert.alert(
            t('recordScore.alerts.notice'),
            t('recordScore.alerts.tiebreakAt66', { set: i + 1 })
          );
          return false;
        }

        const maxScore = Math.max(score1, score2);
        const minScore = Math.min(score1, score2);

        if (maxScore >= 6) {
          if (maxScore === 6 && minScore <= 4) {
            // Valid: 6-0, 6-1, 6-2, 6-3, 6-4
          } else if (maxScore === 7 && (minScore === 5 || minScore === 6)) {
            if (minScore === 6) {
              Alert.alert(
                t('recordScore.alerts.notice'),
                t('recordScore.alerts.tiebreakRequired76', { set: i + 1 })
              );
              return false;
            }
          } else {
            Alert.alert(
              t('recordScore.alerts.notice'),
              t('recordScore.alerts.invalidTennisScore', { set: i + 1 })
            );
            return false;
          }
        } else {
          Alert.alert(
            t('recordScore.alerts.notice'),
            t('recordScore.alerts.minGamesRequired', { set: i + 1 })
          );
          return false;
        }
      }

      completedSets++;
    }

    if (completedSets === 0) {
      Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.minOneSetRequired'));
      return false;
    }

    if (completedSets < 2) {
      Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.minTwoSetsRequired'));
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    console.log('🎾 [LeagueScoreInputModal] handleSubmit called with:', {
      match: match
        ? {
            id: match.id,
            player1Id: match.player1Id,
            player2Id: match.player2Id,
            player1Name: match.player1Name,
            player2Name: match.player2Name,
            fullMatch: match,
          }
        : null,
      matchWinner: matchWinner
        ? {
            id: matchWinner.id,
            name: matchWinner.name,
          }
        : null,
      matchLoser: matchLoser
        ? {
            id: matchLoser.id,
            name: matchLoser.name,
          }
        : null,
      scoreSets: scoreSets,
      retired,
      walkover,
      manualWinner,
      validationPassed: validateScore(),
    });

    // 기권/부전승 시 승자 필수 확인
    if ((retired || walkover) && !manualWinner) {
      Alert.alert(t('recordScore.alerts.notice'), t('recordScore.pleaseSelectWinner'));
      return;
    }

    // 기권/부전승이 아닐 때는 점수 검증
    if (!retired && !walkover) {
      if (!validateScore() || !match || !matchWinner || !matchLoser) {
        console.log('❌ [LeagueScoreInputModal] Validation failed:', {
          validateScore: validateScore(),
          hasMatch: !!match,
          hasMatchWinner: !!matchWinner,
          hasMatchLoser: !!matchLoser,
        });
        return;
      }
    } else {
      // 기권/부전승 시 수동 선택된 승자 사용
      if (!match || !manualWinner) {
        Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.invalidMatchInfo'));
        return;
      }

      const winnerId = manualWinner === 'player1' ? match.player1Id : match.player2Id;
      const winnerName = manualWinner === 'player1' ? match.player1Name : match.player2Name;
      const loserId = manualWinner === 'player1' ? match.player2Id : match.player1Id;
      const loserName = manualWinner === 'player1' ? match.player2Name : match.player1Name;

      setMatchWinner({ id: winnerId, name: winnerName });
      setMatchLoser({ id: loserId, name: loserName });
    }

    // 매치 ID 유효성 검사
    if (!match.id || match.id.trim() === '') {
      console.error('❌ [LeagueScoreInputModal] Invalid match ID:', {
        matchId: match.id,
        match: match,
      });
      Alert.alert(t('recordScore.alerts.error'), t('recordScore.alerts.invalidMatchInfo'));
      return;
    }

    // Convert scoreSets format to the expected format
    const formattedSets = scoreSets
      .filter(set => set.player1.trim() && set.player2.trim())
      .map(set => ({
        player1Games: parseInt(set.player1) || 0,
        player2Games: parseInt(set.player2) || 0,
      }));

    const result = {
      matchId: match.id,
      winnerId: matchWinner!.id,
      loserId: matchLoser!.id,
      score: retired || walkover ? (retired ? 'Retired' : 'Walkover') : formatScore(),
      sets: retired || walkover ? [] : formattedSets,
      retired,
      walkover,
    };

    console.log('✅ [LeagueScoreInputModal] Calling onSubmit with result:', result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit(result as any);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderScoreInput = (setIndex: number, setLabel: string) => {
    if (!match) return null;

    const isPlayer1Winner = matchWinner?.id === match.player1Id;
    const isPlayer2Winner = matchWinner?.id === match.player2Id;

    const currentSet = scoreSets[setIndex];
    const isStandardTiebreak = currentSet.player1 === '6' && currentSet.player2 === '6';
    const showTiebreak = isStandardTiebreak;

    let tiebreakType = 'standard';
    let tiebreakPlaceholder = t('recordScore.tiebreak7pt');

    if (setIndex === 2 && isStandardTiebreak) {
      tiebreakType = 'super';
      tiebreakPlaceholder = t('recordScore.tiebreakSuper');
    }

    return (
      <View key={setIndex} style={styles.scoreSetContainer}>
        <Text style={styles.setLabel}>{t('recordScore.setN', { n: setIndex + 1 })}</Text>

        <View style={styles.scoreInputRow}>
          <View style={styles.playerInputContainer}>
            <View style={styles.playerLabelContainer}>
              {/* 🎯 [KIM FIX] 복식: 각 선수 이름을 개별 truncate */}
              {splitDoublesName(match.player1Name) ? (
                <View style={styles.doublesNameContainer}>
                  <Text
                    style={[styles.playerLabel, isPlayer1Winner && styles.winnerLabel]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {splitDoublesName(match.player1Name)!.player1}
                  </Text>
                  <Text style={styles.doublesSlash}>/</Text>
                  <Text
                    style={[styles.playerLabel, isPlayer1Winner && styles.winnerLabel]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {splitDoublesName(match.player1Name)!.player2}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.playerLabel, isPlayer1Winner && styles.winnerLabel]}>
                  {match.player1Name}
                </Text>
              )}
              {isPlayer1Winner && <Text style={styles.winnerIcon}>👑</Text>}
            </View>
            <TextInput
              disabled={retired || walkover}
              value={scoreSets[setIndex].player1}
              onChangeText={value => updateScore(setIndex, 'player1', value)}
              style={[
                styles.scoreInput,
                isPlayer1Winner && styles.winnerScoreInput,
                (retired || walkover) && styles.disabledInput,
              ]}
              keyboardType='numeric'
              maxLength={1}
              dense
              selectTextOnFocus
            />
          </View>

          <Text style={styles.scoreSeparator}>-</Text>

          <View style={styles.playerInputContainer}>
            <View style={styles.playerLabelContainer}>
              {/* 🎯 [KIM FIX] 복식: 각 선수 이름을 개별 truncate */}
              {splitDoublesName(match.player2Name) ? (
                <View style={styles.doublesNameContainer}>
                  <Text
                    style={[styles.playerLabel, isPlayer2Winner && styles.winnerLabel]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {splitDoublesName(match.player2Name)!.player1}
                  </Text>
                  <Text style={styles.doublesSlash}>/</Text>
                  <Text
                    style={[styles.playerLabel, isPlayer2Winner && styles.winnerLabel]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {splitDoublesName(match.player2Name)!.player2}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.playerLabel, isPlayer2Winner && styles.winnerLabel]}>
                  {match.player2Name}
                </Text>
              )}
              {isPlayer2Winner && <Text style={styles.winnerIcon}>👑</Text>}
            </View>
            <TextInput
              disabled={retired || walkover}
              value={scoreSets[setIndex].player2}
              onChangeText={value => updateScore(setIndex, 'player2', value)}
              style={[
                styles.scoreInput,
                isPlayer2Winner && styles.winnerScoreInput,
                (retired || walkover) && styles.disabledInput,
              ]}
              keyboardType='numeric'
              maxLength={1}
              dense
              selectTextOnFocus
            />
          </View>
        </View>

        {showTiebreak && (
          <View style={styles.tiebreakContainer}>
            <Text style={styles.tiebreakLabel}>
              {t('recordScore.tiebreakLabel', { placeholder: tiebreakPlaceholder })}
            </Text>
            <View style={styles.tiebreakInputRow}>
              <View style={styles.tiebreakPlayerContainer}>
                {/* 🎯 [KIM FIX] 복식: 타이브레이크 선수 이름 개별 truncate */}
                {splitDoublesName(match.player1Name) ? (
                  <View style={styles.tiebreakDoublesNameContainer}>
                    <Text
                      style={[styles.tiebreakPlayerLabel, isPlayer1Winner && styles.winnerLabel]}
                      numberOfLines={1}
                      ellipsizeMode='tail'
                    >
                      {splitDoublesName(match.player1Name)!.player1}
                    </Text>
                    <Text style={styles.tiebreakDoublesSlash}>/</Text>
                    <Text
                      style={[styles.tiebreakPlayerLabel, isPlayer1Winner && styles.winnerLabel]}
                      numberOfLines={1}
                      ellipsizeMode='tail'
                    >
                      {splitDoublesName(match.player1Name)!.player2}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.tiebreakPlayerLabel, isPlayer1Winner && styles.winnerLabel]}>
                    {match.player1Name}
                  </Text>
                )}
                <View style={styles.tiebreakInputWrapper}>
                  <Text style={styles.tiebreakBracket}>(</Text>
                  <RNTextInput
                    editable={!retired && !walkover}
                    value={currentSet.player1_tb || ''}
                    onChangeText={value => updateScore(setIndex, 'player1_tb', value)}
                    style={[
                      styles.tiebreakInput,
                      isPlayer1Winner && styles.winnerScoreInput,
                      (retired || walkover) && styles.disabledInput,
                    ]}
                    keyboardType='numeric'
                    maxLength={2}
                    placeholder={tiebreakType === 'super' ? '10' : '7'}
                    placeholderTextColor={themeColors.colors.onSurfaceVariant}
                    selectTextOnFocus={true}
                  />
                  <Text style={styles.tiebreakBracket}>)</Text>
                </View>
              </View>

              <Text style={styles.tiebreakSeparator}>-</Text>

              <View style={styles.tiebreakPlayerContainer}>
                {/* 🎯 [KIM FIX] 복식: 타이브레이크 선수 이름 개별 truncate */}
                {splitDoublesName(match.player2Name) ? (
                  <View style={styles.tiebreakDoublesNameContainer}>
                    <Text
                      style={[styles.tiebreakPlayerLabel, isPlayer2Winner && styles.winnerLabel]}
                      numberOfLines={1}
                      ellipsizeMode='tail'
                    >
                      {splitDoublesName(match.player2Name)!.player1}
                    </Text>
                    <Text style={styles.tiebreakDoublesSlash}>/</Text>
                    <Text
                      style={[styles.tiebreakPlayerLabel, isPlayer2Winner && styles.winnerLabel]}
                      numberOfLines={1}
                      ellipsizeMode='tail'
                    >
                      {splitDoublesName(match.player2Name)!.player2}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.tiebreakPlayerLabel, isPlayer2Winner && styles.winnerLabel]}>
                    {match.player2Name}
                  </Text>
                )}
                <View style={styles.tiebreakInputWrapper}>
                  <Text style={styles.tiebreakBracket}>(</Text>
                  <RNTextInput
                    editable={!retired && !walkover}
                    value={currentSet.player2_tb || ''}
                    onChangeText={value => updateScore(setIndex, 'player2_tb', value)}
                    style={[
                      styles.tiebreakInput,
                      isPlayer2Winner && styles.winnerScoreInput,
                      (retired || walkover) && styles.disabledInput,
                    ]}
                    keyboardType='numeric'
                    maxLength={2}
                    placeholder={tiebreakType === 'super' ? '10' : '7'}
                    placeholderTextColor={themeColors.colors.onSurfaceVariant}
                    selectTextOnFocus={true}
                  />
                  <Text style={styles.tiebreakBracket}>)</Text>
                </View>
              </View>
            </View>

            <Text style={styles.tiebreakHint}>
              {tiebreakType === 'super'
                ? t('recordScore.tiebreakHintSuper')
                : t('recordScore.tiebreakHintStandard')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles = createStyles(themeColors.colors as any, currentTheme === 'dark');

  if (!match) return null;

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon='close' size={24} onPress={onClose} style={styles.closeButton} />
          <Title style={styles.title}>{t('recordScore.title')}</Title>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Match Info */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('recordScore.matchInfo')}</Text>
              <Text style={styles.matchTitle}>
                {match.player1Name} vs {match.player2Name}
              </Text>
              {match.scheduledDate && (
                <Text style={styles.matchDate}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  🗓️ {(match.scheduledDate as any).toLocaleDateString('ko-KR')}
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Score Input */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.scoreHeader}>
                <Text style={styles.sectionTitle}>{t('recordScore.scoreInput')}</Text>
              </View>

              <Text style={styles.sectionDescription}>
                {t('recordScore.scoreInputDescription')}
              </Text>

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
                      <Text style={styles.winnerStatusText}>{matchWinner.name}</Text>
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

          {/* Special Cases - Retired/Walkover */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('recordScore.specialCases')}</Text>

              <TouchableOpacity onPress={handleRetiredChange} style={styles.checkboxRow}>
                <Ionicons
                  name={retired ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={themeColors.colors.primary}
                />
                <Text style={styles.checkboxLabel}>{t('recordScore.retired')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleWalkoverChange} style={styles.checkboxRow}>
                <Ionicons
                  name={walkover ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={themeColors.colors.primary}
                />
                <Text style={styles.checkboxLabel}>{t('recordScore.walkover')}</Text>
              </TouchableOpacity>

              {/* Winner Selection (only shown when retired or walkover is checked) */}
              {(retired || walkover) && (
                <View style={styles.winnerSelectionContainer}>
                  <Text style={styles.winnerSelectionTitle}>
                    {t('recordScore.selectWinnerRequired')}
                  </Text>
                  <RadioButton.Group
                    onValueChange={value => setManualWinner(value as 'player1' | 'player2')}
                    value={manualWinner || ''}
                  >
                    <View
                      style={[
                        styles.radioButtonItem,
                        manualWinner === 'player1' && styles.radioButtonItemSelected,
                      ]}
                    >
                      <RadioButton.Item
                        label={match.player1Name}
                        value='player1'
                        color={themeColors.colors.primary}
                        labelStyle={[
                          styles.radioButtonLabel,
                          manualWinner === 'player1' && styles.radioButtonLabelSelected,
                        ]}
                      />
                    </View>
                    <View
                      style={[
                        styles.radioButtonItem,
                        manualWinner === 'player2' && styles.radioButtonItemSelected,
                      ]}
                    >
                      <RadioButton.Item
                        label={match.player2Name}
                        value='player2'
                        color={themeColors.colors.primary}
                        labelStyle={[
                          styles.radioButtonLabel,
                          manualWinner === 'player2' && styles.radioButtonLabelSelected,
                        ]}
                      />
                    </View>
                  </RadioButton.Group>
                  <Text style={styles.winnerSelectionHint}>
                    {retired
                      ? t('recordScore.selectPlayerWhoDidNotRetire')
                      : t('recordScore.selectPlayerWhoShowedUp')}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              mode='contained'
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || !matchWinner || !matchLoser}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {submitting ? t('recordScore.saving') : t('recordScore.submit')}
            </Button>

            <Text style={styles.submitNote}>{t('recordScore.submitNoteLeague')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

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
    matchTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    matchDate: {
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
    tiebreakBracket: {
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
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      gap: 12,
    },
    checkboxLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#E8EAED' : '#202124',
    },
    winnerSelectionContainer: {
      marginTop: 16,
      padding: 12,
      backgroundColor: isDarkMode ? '#3C4043' : '#F1F3F4',
      borderRadius: 8,
    },
    winnerSelectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
      color: isDarkMode ? '#E8EAED' : '#202124',
    },
    winnerSelectionHint: {
      fontSize: 12,
      marginTop: 8,
      color: isDarkMode ? '#9AA0A6' : '#5F6368',
      fontStyle: 'italic',
    },
    disabledInput: {
      opacity: 0.5,
      backgroundColor: isDarkMode ? '#3C4043' : '#F1F3F4',
    },
    radioButtonItem: {
      borderRadius: 8,
      marginVertical: 4,
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    },
    radioButtonItemSelected: {
      backgroundColor: isDarkMode ? '#1E3A5F' : '#E3F2FD',
      borderColor: colors.primary,
      borderWidth: 2,
    },
    radioButtonLabel: {
      fontSize: 16,
      fontWeight: '500',
    },
    radioButtonLabelSelected: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    // 🎯 [KIM FIX] 복식 선수 이름 스타일
    doublesNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
      maxWidth: 120,
    },
    doublesSlash: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginHorizontal: 2,
    },
    tiebreakDoublesNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
      maxWidth: 100,
      marginBottom: 4,
    },
    tiebreakDoublesSlash: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginHorizontal: 1,
    },
  });

export default LeagueScoreInputModal;
