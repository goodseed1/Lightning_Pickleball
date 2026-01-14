/**
 * Tennis Score Input Modal Component
 * 테니스 경기 점수 입력 모달 컴포넌트
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput as RNTextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Card, Title, TextInput, IconButton, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScoreInputForm, Match } from '../../types/match';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';

interface ScoreInputModalProps {
  visible: boolean;
  match: Match;
  currentUserId: string;
  onClose: () => void;
  onSubmit: (scoreData: ScoreInputForm) => Promise<void>;
}

const ScoreInputModal: React.FC<ScoreInputModalProps> = ({
  visible,
  match,
  currentUserId,
  onClose,
  onSubmit,
}) => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const { t } = useLanguage();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles = createStyles(themeColors.colors as any);

  // 🎯 [KIM FIX] 복식 팀 이름을 개별 선수로 분리 (a/b 형태)
  const isDoublesName = (name: string) => name.includes(' / ');
  const splitDoublesName = (name: string) => {
    if (isDoublesName(name)) {
      const parts = name.split(' / ');
      return { player1: parts[0] || '', player2: parts[1] || '' };
    }
    return null;
  };

  const [scoreSets, setScoreSets] = useState<
    {
      player1: string;
      player2: string;
      player1_tb?: string;
      player2_tb?: string;
    }[]
  >([
    { player1: '', player2: '', player1_tb: '', player2_tb: '' },
    { player1: '', player2: '', player1_tb: '', player2_tb: '' },
    { player1: '', player2: '', player1_tb: '', player2_tb: '' },
  ]);
  const [matchWinner, setMatchWinner] = useState<{ id: string; name: string } | null>(null);
  const [matchLoser, setMatchLoser] = useState<{ id: string; name: string } | null>(null);
  const [retired, setRetired] = useState(false);
  const [retiredAt, setRetiredAt] = useState<number | undefined>();
  const [walkover, setWalkover] = useState(false);
  const [manualWinner, setManualWinner] = useState<'player1' | 'player2' | null>(null); // 🔴 [HIGH] 기권/부전승 시 승자 수동 선택
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (visible) {
      setScoreSets([
        { player1: '', player2: '', player1_tb: '', player2_tb: '' },
        { player1: '', player2: '', player1_tb: '', player2_tb: '' },
        { player1: '', player2: '', player1_tb: '', player2_tb: '' },
      ]);
      setMatchWinner(null);
      setMatchLoser(null);
      setRetired(false);
      setRetiredAt(undefined);
      setWalkover(false);
      setManualWinner(null);
      setNotes('');
    }
  }, [visible]);

  // 현재 사용자가 player1인지 player2인지 확인
  const isPlayer1 = currentUserId === match.player1.userId;
  const isPlayer2 = currentUserId === match.player2.userId;
  const hasPermission = isPlayer1 || isPlayer2;

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

  // Unified set winner determination (moved before calculateSetsToDisplay to fix hoisting)
  const getSetWinner = useCallback(
    (
      set: { player1: string; player2: string; player1_tb?: string; player2_tb?: string },
      setIndex: number
    ): 'player1' | 'player2' | null => {
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
        winner: { id: match.player1.userId, name: match.player1.userName },
        loser: { id: match.player2.userId, name: match.player2.userName },
      };
    } else if (player2SetWins >= 2) {
      return {
        winner: { id: match.player2.userId, name: match.player2.userName },
        loser: { id: match.player1.userId, name: match.player1.userName },
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

  // 🚫 중복 제출 방지: 이미 점수가 제출된 경우 확인
  const isScoreAlreadySubmitted = !!(match.scoreSubmittedBy || match.scoreSubmittedAt);

  console.log('🏆 [ScoreInputModal] Score submission status:', {
    matchId: match.id,
    scoreSubmittedBy: match.scoreSubmittedBy,
    scoreSubmittedAt: match.scoreSubmittedAt,
    isAlreadySubmitted: isScoreAlreadySubmitted,
    currentUserId,
  });

  // League-style score update function
  const updateScore = (
    setIndex: number,
    player: 'player1' | 'player2' | 'player1_tb' | 'player2_tb',
    value: string
  ) => {
    if (player.includes('_tb')) {
      const newScoreSets = [...scoreSets];
      // Ensure we have enough sets
      while (newScoreSets.length <= setIndex) {
        newScoreSets.push({ player1: '', player2: '', player1_tb: '', player2_tb: '' });
      }
      newScoreSets[setIndex][player] = value;
      setScoreSets(newScoreSets);
      return;
    }

    const numValue = parseInt(value, 10);
    if (value !== '' && (isNaN(numValue) || numValue < 0)) return;

    const newScoreSets = [...scoreSets];
    // Ensure we have enough sets
    while (newScoreSets.length <= setIndex) {
      newScoreSets.push({ player1: '', player2: '', player1_tb: '', player2_tb: '' });
    }
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

  // Format score for display and submission
  const formatScore = (): string => {
    const sets = [];
    const setsToFormat = calculateSetsToDisplay();

    for (let i = 0; i < setsToFormat; i++) {
      if (i >= scoreSets.length) break;
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

  // League-style validation
  const validateScore = (): boolean => {
    if (!matchWinner || !matchLoser) {
      Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.matchNotComplete'));
      return false;
    }

    let completedSets = 0;
    const setsToCheck = calculateSetsToDisplay();

    for (let i = 0; i < setsToCheck; i++) {
      if (i >= scoreSets.length) break;
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

  // 점수 제출 처리
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 🔴 [HIGH] 기권/부전승 시 승자 선택 필수 검증
      if ((retired || walkover) && !manualWinner) {
        Alert.alert(
          t('recordScore.alerts.winnerSelectionRequired'),
          t('recordScore.alerts.pleaseSelectWinner')
        );
        return;
      }

      // 🔴 [HIGH] 기권/부전승이 아닌 경우에만 일반 검증 수행
      if (!retired && !walkover) {
        if (!validateScore() || !matchWinner || !matchLoser) {
          return;
        }
      }

      // Convert League format to Tournament format
      const formattedSets = scoreSets
        .filter(set => set.player1.trim() && set.player2.trim())
        .map(set => ({
          player1Games: parseInt(set.player1) || 0,
          player2Games: parseInt(set.player2) || 0,
          ...(set.player1_tb && { player1TiebreakPoints: parseInt(set.player1_tb) || 0 }),
          ...(set.player2_tb && { player2TiebreakPoints: parseInt(set.player2_tb) || 0 }),
        }));

      // 🔴 [HIGH] 기권/부전승 시 manualWinner 사용, 그 외에는 matchWinner에서 계산
      let winnerPosition: 'player1' | 'player2' | null = null;
      if (retired || walkover) {
        winnerPosition = manualWinner;
      } else {
        if (matchWinner?.id === match.player1.userId) {
          winnerPosition = 'player1';
        } else if (matchWinner?.id === match.player2.userId) {
          winnerPosition = 'player2';
        }
      }

      // Safety check
      if (!winnerPosition) {
        throw new Error('Winner position could not be determined');
      }

      const scoreData: ScoreInputForm = {
        sets: formattedSets,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _winner: winnerPosition as any,
        retired,
        retiredAt,
        walkover,
        ...(retired && { finalScore: 'RET' }),
        ...(walkover && { finalScore: 'W.O.' }),
        notes: notes.trim(),
      };

      await onSubmit(scoreData);
      onClose();
    } catch (error) {
      console.error('Score submission error:', error);
      Alert.alert(t('recordScore.alerts.error'), t('recordScore.alerts.submissionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // League-style score input rendering
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderScoreInput = (setIndex: number, setLabel: string) => {
    const isPlayer1Winner = matchWinner?.id === match.player1.userId;
    const isPlayer2Winner = matchWinner?.id === match.player2.userId;

    // Safety check: ensure setIndex is within bounds
    if (setIndex >= scoreSets.length) {
      return null;
    }

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
              {splitDoublesName(match.player1.userName) ? (
                <View style={styles.doublesNameContainer}>
                  <Text
                    style={[styles.playerLabel, isPlayer1Winner && styles.winnerLabel]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {splitDoublesName(match.player1.userName)!.player1}
                  </Text>
                  <Text style={styles.doublesSlash}>/</Text>
                  <Text
                    style={[styles.playerLabel, isPlayer1Winner && styles.winnerLabel]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {splitDoublesName(match.player1.userName)!.player2}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.playerLabel, isPlayer1Winner && styles.winnerLabel]}>
                  {match.player1.userName}
                </Text>
              )}
              {isPlayer1Winner && <Text style={styles.winnerIcon}>👑</Text>}
            </View>
            <TextInput
              value={scoreSets[setIndex]?.player1 || ''}
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
              {/* 🎯 [KIM FIX] 복식: 각 선수 이름을 개별 truncate */}
              {splitDoublesName(match.player2.userName) ? (
                <View style={styles.doublesNameContainer}>
                  <Text
                    style={[styles.playerLabel, isPlayer2Winner && styles.winnerLabel]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {splitDoublesName(match.player2.userName)!.player1}
                  </Text>
                  <Text style={styles.doublesSlash}>/</Text>
                  <Text
                    style={[styles.playerLabel, isPlayer2Winner && styles.winnerLabel]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {splitDoublesName(match.player2.userName)!.player2}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.playerLabel, isPlayer2Winner && styles.winnerLabel]}>
                  {match.player2.userName}
                </Text>
              )}
              {isPlayer2Winner && <Text style={styles.winnerIcon}>👑</Text>}
            </View>
            <TextInput
              value={scoreSets[setIndex]?.player2 || ''}
              onChangeText={value => updateScore(setIndex, 'player2', value)}
              style={[styles.scoreInput, isPlayer2Winner && styles.winnerScoreInput]}
              keyboardType='numeric'
              maxLength={1}
              dense
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
                {splitDoublesName(match.player1.userName) ? (
                  <View style={styles.tiebreakDoublesNameContainer}>
                    <Text
                      style={[styles.tiebreakPlayerLabel, isPlayer1Winner && styles.winnerLabel]}
                      numberOfLines={1}
                      ellipsizeMode='tail'
                    >
                      {splitDoublesName(match.player1.userName)!.player1}
                    </Text>
                    <Text style={styles.tiebreakDoublesSlash}>/</Text>
                    <Text
                      style={[styles.tiebreakPlayerLabel, isPlayer1Winner && styles.winnerLabel]}
                      numberOfLines={1}
                      ellipsizeMode='tail'
                    >
                      {splitDoublesName(match.player1.userName)!.player2}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.tiebreakPlayerLabel, isPlayer1Winner && styles.winnerLabel]}>
                    {match.player1.userName}
                  </Text>
                )}
                <View style={styles.tiebreakInputWrapper}>
                  <Text style={styles.tiebreakBracket}>(</Text>
                  <RNTextInput
                    value={currentSet.player1_tb || ''}
                    onChangeText={value => updateScore(setIndex, 'player1_tb', value)}
                    style={[styles.tiebreakInput, isPlayer1Winner && styles.winnerScoreInput]}
                    keyboardType='numeric'
                    maxLength={2}
                    placeholder={tiebreakType === 'super' ? '10' : '7'}
                    placeholderTextColor={themeColors.colors.onSurfaceVariant}
                  />
                  <Text style={styles.tiebreakBracket}>)</Text>
                </View>
              </View>

              <Text style={styles.tiebreakSeparator}>-</Text>

              <View style={styles.tiebreakPlayerContainer}>
                {/* 🎯 [KIM FIX] 복식: 타이브레이크 선수 이름 개별 truncate */}
                {splitDoublesName(match.player2.userName) ? (
                  <View style={styles.tiebreakDoublesNameContainer}>
                    <Text
                      style={[styles.tiebreakPlayerLabel, isPlayer2Winner && styles.winnerLabel]}
                      numberOfLines={1}
                      ellipsizeMode='tail'
                    >
                      {splitDoublesName(match.player2.userName)!.player1}
                    </Text>
                    <Text style={styles.tiebreakDoublesSlash}>/</Text>
                    <Text
                      style={[styles.tiebreakPlayerLabel, isPlayer2Winner && styles.winnerLabel]}
                      numberOfLines={1}
                      ellipsizeMode='tail'
                    >
                      {splitDoublesName(match.player2.userName)!.player2}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.tiebreakPlayerLabel, isPlayer2Winner && styles.winnerLabel]}>
                    {match.player2.userName}
                  </Text>
                )}
                <View style={styles.tiebreakInputWrapper}>
                  <Text style={styles.tiebreakBracket}>(</Text>
                  <RNTextInput
                    value={currentSet.player2_tb || ''}
                    onChangeText={value => updateScore(setIndex, 'player2_tb', value)}
                    style={[styles.tiebreakInput, isPlayer2Winner && styles.winnerScoreInput]}
                    keyboardType='numeric'
                    maxLength={2}
                    placeholder={tiebreakType === 'super' ? '10' : '7'}
                    placeholderTextColor={themeColors.colors.onSurfaceVariant}
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

  // 권한 확인 (참가자만 점수 입력 가능)
  if (!hasPermission) {
    return null;
  }

  // 🚨 FINAL COMPONENT IDENTITY CONFIRMATION 🚨
  console.log('--- ⚡ SCOREMODAL COMPONENT RENDER ---');
  console.log('This is the ACTUAL ScoreInputModal being rendered!');
  console.log('File path: src/components/match/ScoreInputModal.tsx');
  console.log('Match type:', match.type);
  console.log('Player 1:', match.player1.userName);
  console.log('Player 2:', match.player2.userName);
  console.log('Modal visible:', visible);
  console.log('--- ⚡ CONFIRMED: THIS IS THE COMPONENT! ---');

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.colors.background }]}>
        <View style={styles.header}>
          <IconButton icon='close' size={24} onPress={onClose} style={styles.closeButton} />
          <Title style={styles.title}>{t('recordScore.title')}</Title>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Match Info - 리그 스타일과 완전 동일 */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('recordScore.matchInfo')}</Text>
              <Text style={styles.matchTitle}>
                {match.player1.userName} vs {match.player2.userName}
              </Text>
            </Card.Content>
          </Card>

          {/* Score Input - 리그 스타일과 완전 동일 */}
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
                  <Text style={styles.scorePreviewText}>{formatScore()}</Text>

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

          {/* Special Options: Retired & Walkover */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('recordScore.specialCases')}</Text>
              <Text style={styles.sectionDescription}>
                {t('recordScore.specialCasesDescription')}
              </Text>

              {/* Retired (기권) */}
              <View
                style={[styles.specialOption, retired && styles.specialOptionActive]}
                onTouchEnd={() => {
                  const newRetired = !retired;
                  setRetired(newRetired);
                  if (newRetired) {
                    setWalkover(false);
                  } else {
                    setRetiredAt(undefined);
                  }
                  setManualWinner(null); // 🔴 [HIGH] 승자 선택 초기화
                }}
              >
                <IconButton
                  icon={retired ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  style={{ margin: 0 }}
                  onPress={() => {
                    const newRetired = !retired;
                    setRetired(newRetired);
                    if (newRetired) {
                      setWalkover(false);
                    } else {
                      setRetiredAt(undefined);
                    }
                    setManualWinner(null); // 🔴 [HIGH] 승자 선택 초기화
                  }}
                />
                <Text style={styles.specialOptionText}>{t('recordScore.retired')}</Text>
              </View>

              {retired && (
                <View style={styles.retiredAtContainer}>
                  <Text style={styles.retiredAtLabel}>{t('recordScore.retiredAtLabel')}</Text>
                  <View style={styles.retiredAtOptions}>
                    {[1, 2, 3].map(setNum => (
                      <View
                        key={setNum}
                        style={[
                          styles.retiredAtOption,
                          retiredAt === setNum && styles.retiredAtOptionActive,
                        ]}
                        onTouchEnd={() => setRetiredAt(setNum)}
                      >
                        <Text
                          style={[
                            styles.retiredAtOptionText,
                            retiredAt === setNum && styles.retiredAtOptionTextActive,
                          ]}
                        >
                          {t('recordScore.setN', { n: setNum })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Walkover (부전승) */}
              <View
                style={[styles.specialOption, walkover && styles.specialOptionActive]}
                onTouchEnd={() => {
                  const newWalkover = !walkover;
                  setWalkover(newWalkover);
                  if (newWalkover) {
                    setRetired(false);
                    setRetiredAt(undefined);
                  }
                  setManualWinner(null); // 🔴 [HIGH] 승자 선택 초기화
                }}
              >
                <IconButton
                  icon={walkover ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  style={{ margin: 0 }}
                  onPress={() => {
                    const newWalkover = !walkover;
                    setWalkover(newWalkover);
                    if (newWalkover) {
                      setRetired(false);
                      setRetiredAt(undefined);
                    }
                    setManualWinner(null); // 🔴 [HIGH] 승자 선택 초기화
                  }}
                />
                <Text style={styles.specialOptionText}>{t('recordScore.walkover')}</Text>
              </View>
            </Card.Content>
          </Card>

          {/* 🔴 [HIGH] Winner Selection (only shown when retired or walkover is checked) */}
          {(retired || walkover) && (
            <Card style={styles.sectionCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>{t('recordScore.selectWinnerRequired')}</Text>
                <RadioButton.Group
                  onValueChange={value => setManualWinner(value as 'player1' | 'player2')}
                  value={manualWinner || ''}
                >
                  <RadioButton.Item
                    label={match.player1.userName}
                    value='player1'
                    color={themeColors.colors.primary}
                  />
                  <RadioButton.Item
                    label={match.player2.userName}
                    value='player2'
                    color={themeColors.colors.primary}
                  />
                </RadioButton.Group>
                <Text style={styles.winnerSelectionHint}>
                  {retired
                    ? t('recordScore.selectPlayerWhoDidNotRetire')
                    : t('recordScore.selectPlayerWhoShowedUp')}
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* Submit Button - 리그 스타일과 완전 동일 */}
          <View style={styles.submitContainer}>
            <Button
              mode='contained'
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={
                isSubmitting ||
                (!matchWinner && !retired && !walkover) ||
                ((retired || walkover) && !manualWinner)
              }
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {isSubmitting ? t('recordScore.saving') : t('recordScore.submit')}
            </Button>

            <Text style={styles.submitNote}>
              {match.type === 'lightning_match'
                ? t('recordScore.submitNoteLightning')
                : t('recordScore.submitNoteTournament')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
      backgroundColor: colors.surface,
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
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
    },
    headerSpace: {
      width: 32,
    },
    matchInfo: {
      padding: 16,
      backgroundColor: '#f8f9fa',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    matchTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    matchSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
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
    scoreSection: {
      padding: 16,
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
    scoreSetContainer: {
      marginBottom: 24,
    },
    setLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
      textAlign: 'center',
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
      justifyContent: 'center',
    },
    playerLabel: {
      fontSize: 14,
      color: colors.onSurface,
      fontWeight: '500',
    },
    winnerLabel: {
      color: colors.primary,
      fontWeight: '600',
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
      backgroundColor: colors.primaryContainer || '#FFF8DC',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    scoreSeparator: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    setContainer: {
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    setHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    setTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
    },
    removeSetButton: {
      padding: 4,
    },
    setScoreContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gameScoreContainer: {
      alignItems: 'center',
      flex: 1,
    },
    gameScoreLabel: {
      fontSize: 12,
      color: '#666',
      marginBottom: 8,
      textAlign: 'center',
    },
    gameScoreInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scoreButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#e0e0e0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gameScoreInput: {
      width: 50,
      height: 40,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '600',
      marginHorizontal: 8,
      backgroundColor: '#fff',
    },
    tiebreakSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#ddd',
    },
    tiebreakTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
      marginBottom: 12,
    },
    tiebreakScoreContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tiebreakContainer: {
      alignItems: 'center',
      flex: 1,
    },
    tiebreakLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
      textAlign: 'center',
    },
    tiebreakInput: {
      width: 50,
      height: 40,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 8,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
      backgroundColor: colors.surface,
      color: colors.onSurface,
    },
    tiebreakInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: 12,
    },
    tiebreakPlayerContainer: {
      alignItems: 'center',
      flex: 1,
    },
    tiebreakPlayerLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
      textAlign: 'center',
    },
    tiebreakInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tiebreakBracket: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginHorizontal: 2,
    },
    tiebreakSeparator: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.onSurfaceVariant,
    },
    tiebreakHint: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    addSetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderWidth: 1,
      borderColor: '#2196f3',
      borderRadius: 8,
      borderStyle: 'dashed',
    },
    addSetText: {
      marginLeft: 8,
      color: '#2196f3',
      fontWeight: '500',
    },
    specialSection: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    specialOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      paddingHorizontal: 8,
    },
    specialOptionActive: {
      backgroundColor: colors.primaryContainer || 'rgba(33, 150, 243, 0.1)',
    },
    specialOptionText: {
      marginLeft: 12,
      fontSize: 14,
      color: colors.onSurface,
      fontWeight: '500',
    },
    retiredAtContainer: {
      marginTop: 12,
      marginLeft: 32,
    },
    retiredAtLabel: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    retiredAtOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    retiredAtOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    retiredAtOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    retiredAtOptionText: {
      fontSize: 12,
      color: colors.onSurface,
    },
    retiredAtOptionTextActive: {
      color: colors.surface,
      fontWeight: '600',
    },
    notesSection: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    notesInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    submitContainer: {
      marginHorizontal: 16,
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
    scorePreview: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.primaryContainer || 'rgba(33, 150, 243, 0.1)',
      borderRadius: 12,
      alignItems: 'center',
    },
    scorePreviewLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
      textAlign: 'center',
    },
    scorePreviewText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 12,
    },
    winnerStatus: {
      marginTop: 8,
      alignItems: 'center',
    },
    winnerStatusLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
      textAlign: 'center',
    },
    winnerStatusText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
    },
    neutralStatusLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    scoreHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    scoreContainer: {
      marginTop: 8,
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
    // 🔴 [HIGH] Winner Selection Styles
    winnerSelectionHint: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default ScoreInputModal;
