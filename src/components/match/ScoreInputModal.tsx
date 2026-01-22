/**
 * Pickleball Score Input Modal Component
 * 피클볼 경기 점수 입력 모달 컴포넌트
 *
 * 🏓 Pickleball Scoring Rules:
 * - Rally scoring (every rally = point)
 * - Game to 11 (standard) or 15 points
 * - Win by 2 points
 * - Single game (default) or Best of 3
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
  TouchableOpacity,
} from 'react-native';
import { Button, Card, Title, IconButton, RadioButton, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScoreInputForm,
  Match,
  PickleballGameTarget,
  PickleballMatchFormat,
  PickleballGameScore,
  determinePickleballGameWinner,
  determineBestOf3Winner,
} from '../../types/match';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
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
  const themeColors = getLightningPickleballTheme(currentTheme);
  const { t } = useLanguage();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles = createStyles(themeColors.colors as any);

  // 🎯 피클볼 스코어링 상태
  const [matchFormat, setMatchFormat] = useState<PickleballMatchFormat>('single_game');
  const [targetScore, setTargetScore] = useState<PickleballGameTarget>(11);
  const [games, setGames] = useState<PickleballGameScore[]>([
    { player1Points: 0, player2Points: 0, winner: null },
  ]);
  const [matchWinner, setMatchWinner] = useState<{ id: string; name: string } | null>(null);
  const [matchLoser, setMatchLoser] = useState<{ id: string; name: string } | null>(null);
  const [retired, setRetired] = useState(false);
  const [walkover, setWalkover] = useState(false);
  const [manualWinner, setManualWinner] = useState<'player1' | 'player2' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 복식 팀 이름 분리
  const isDoublesName = (name: string) => name.includes(' / ');
  const splitDoublesName = (name: string) => {
    if (isDoublesName(name)) {
      const parts = name.split(' / ');
      return { player1: parts[0] || '', player2: parts[1] || '' };
    }
    return null;
  };

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (visible) {
      setMatchFormat('single_game');
      setTargetScore(11);
      setGames([{ player1Points: 0, player2Points: 0, winner: null }]);
      setMatchWinner(null);
      setMatchLoser(null);
      setRetired(false);
      setWalkover(false);
      setManualWinner(null);
    }
  }, [visible]);

  // 현재 사용자가 player1인지 player2인지 확인
  const isPlayer1 = currentUserId === match.player1.userId;
  const isPlayer2 = currentUserId === match.player2.userId;
  const hasPermission = isPlayer1 || isPlayer2;

  // 🏓 피클볼 게임 승자 계산
  const calculateGameWinners = useCallback(() => {
    const updatedGames = games.map(game => ({
      ...game,
      winner: determinePickleballGameWinner(game.player1Points, game.player2Points, targetScore),
    }));

    // 매치 승자 결정
    if (matchFormat === 'single_game') {
      const winner = updatedGames[0]?.winner;
      if (winner === 'player1') {
        setMatchWinner({ id: match.player1.userId, name: match.player1.userName });
        setMatchLoser({ id: match.player2.userId, name: match.player2.userName });
      } else if (winner === 'player2') {
        setMatchWinner({ id: match.player2.userId, name: match.player2.userName });
        setMatchLoser({ id: match.player1.userId, name: match.player1.userName });
      } else {
        setMatchWinner(null);
        setMatchLoser(null);
      }
    } else {
      // Best of 3
      const matchResult = determineBestOf3Winner(updatedGames);
      if (matchResult === 'player1') {
        setMatchWinner({ id: match.player1.userId, name: match.player1.userName });
        setMatchLoser({ id: match.player2.userId, name: match.player2.userName });
      } else if (matchResult === 'player2') {
        setMatchWinner({ id: match.player2.userId, name: match.player2.userName });
        setMatchLoser({ id: match.player1.userId, name: match.player1.userName });
      } else {
        setMatchWinner(null);
        setMatchLoser(null);
      }
    }

    return updatedGames;
  }, [games, targetScore, matchFormat, match]);

  // 실시간 승자 계산
  useEffect(() => {
    calculateGameWinners();
  }, [games, targetScore, matchFormat, calculateGameWinners]);

  // 매치 포맷 변경 시 게임 수 조정
  useEffect(() => {
    if (matchFormat === 'single_game') {
      setGames([{ player1Points: 0, player2Points: 0, winner: null }]);
    } else {
      // Best of 3 - 최소 2게임 시작
      setGames([
        { player1Points: 0, player2Points: 0, winner: null },
        { player1Points: 0, player2Points: 0, winner: null },
      ]);
    }
  }, [matchFormat]);

  // 점수 업데이트
  const updateScore = (gameIndex: number, player: 'player1' | 'player2', value: string) => {
    const numValue = parseInt(value, 10);
    if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 30)) return;

    const newGames = [...games];
    if (gameIndex >= newGames.length) return;

    if (player === 'player1') {
      newGames[gameIndex].player1Points = numValue || 0;
    } else {
      newGames[gameIndex].player2Points = numValue || 0;
    }

    // 게임 승자 업데이트
    newGames[gameIndex].winner = determinePickleballGameWinner(
      newGames[gameIndex].player1Points,
      newGames[gameIndex].player2Points,
      targetScore
    );

    setGames(newGames);

    // Best of 3에서 다음 게임 자동 추가
    if (matchFormat === 'best_of_3' && newGames[gameIndex].winner && newGames.length < 3) {
      const p1Wins = newGames.filter(g => g.winner === 'player1').length;
      const p2Wins = newGames.filter(g => g.winner === 'player2').length;

      // 아직 승자가 결정되지 않았고 게임이 완료되었으면 다음 게임 추가
      if (p1Wins < 2 && p2Wins < 2 && gameIndex === newGames.length - 1) {
        setGames([...newGames, { player1Points: 0, player2Points: 0, winner: null }]);
      }
    }
  };

  // 점수 포맷팅
  const formatScore = (): string => {
    return games
      .filter(g => g.player1Points > 0 || g.player2Points > 0)
      .map(g => `${g.player1Points}-${g.player2Points}`)
      .join(', ');
  };

  // 점수 유효성 검사
  const validateScore = (): boolean => {
    if (matchFormat === 'single_game') {
      const game = games[0];
      if (!game) return false;

      const max = Math.max(game.player1Points, game.player2Points);
      const diff = Math.abs(game.player1Points - game.player2Points);

      if (max < targetScore) {
        Alert.alert(
          t('recordScore.alerts.notice'),
          `${t('recordScore.alerts.pickleballMinScore')} ${targetScore}`
        );
        return false;
      }

      if (diff < 2) {
        Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.pickleballWinBy2'));
        return false;
      }
    } else {
      // Best of 3 validation
      const completedGames = games.filter(g => g.winner !== null);
      const p1Wins = completedGames.filter(g => g.winner === 'player1').length;
      const p2Wins = completedGames.filter(g => g.winner === 'player2').length;

      if (p1Wins < 2 && p2Wins < 2) {
        Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.pickleballBestOf3Incomplete'));
        return false;
      }
    }

    return true;
  };

  // 점수 제출 처리
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 기권/부전승 시 승자 선택 필수
      if ((retired || walkover) && !manualWinner) {
        Alert.alert(
          t('recordScore.alerts.winnerSelectionRequired'),
          t('recordScore.alerts.pleaseSelectWinner')
        );
        return;
      }

      // 일반 경기 검증
      if (!retired && !walkover) {
        if (!validateScore() || !matchWinner || !matchLoser) {
          return;
        }
      }

      // 승자 결정
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

      if (!winnerPosition) {
        throw new Error('Winner position could not be determined');
      }

      // 피클볼 점수를 기존 형식으로 변환 (호환성 유지)
      const formattedSets = games
        .filter(g => g.player1Points > 0 || g.player2Points > 0)
        .map(g => ({
          player1Games: g.player1Points,
          player2Games: g.player2Points,
        }));

      const scoreData: ScoreInputForm = {
        matchId: match.id,
        sets: formattedSets,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _winner: winnerPosition as any,
        retired,
        walkover,
        ...(retired && { finalScore: 'RET' }),
        ...(walkover && { finalScore: 'W.O.' }),
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

  // 게임 점수 입력 렌더링
  const renderGameInput = (gameIndex: number) => {
    const game = games[gameIndex];
    if (!game) return null;

    const isPlayer1Winner = game.winner === 'player1';
    const isPlayer2Winner = game.winner === 'player2';

    const gameLabel =
      matchFormat === 'single_game'
        ? t('recordScore.pickleballGame')
        : `${t('recordScore.pickleballGame')} ${gameIndex + 1}`;

    return (
      <View key={gameIndex} style={styles.gameContainer}>
        <Text style={styles.gameLabel}>{gameLabel}</Text>

        <View style={styles.scoreInputRow}>
          {/* Player 1 */}
          <View style={styles.playerInputContainer}>
            <View style={styles.playerLabelContainer}>
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
            <RNTextInput
              value={game.player1Points > 0 ? game.player1Points.toString() : ''}
              onChangeText={value => updateScore(gameIndex, 'player1', value)}
              style={[styles.scoreInput, isPlayer1Winner && styles.winnerScoreInput]}
              keyboardType='numeric'
              maxLength={2}
              placeholder='0'
              placeholderTextColor={themeColors.colors.onSurfaceVariant}
            />
          </View>

          <Text style={styles.scoreSeparator}>-</Text>

          {/* Player 2 */}
          <View style={styles.playerInputContainer}>
            <View style={styles.playerLabelContainer}>
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
            <RNTextInput
              value={game.player2Points > 0 ? game.player2Points.toString() : ''}
              onChangeText={value => updateScore(gameIndex, 'player2', value)}
              style={[styles.scoreInput, isPlayer2Winner && styles.winnerScoreInput]}
              keyboardType='numeric'
              maxLength={2}
              placeholder='0'
              placeholderTextColor={themeColors.colors.onSurfaceVariant}
            />
          </View>
        </View>

        {/* 게임 승자 표시 */}
        {game.winner && (
          <View style={styles.gameWinnerBadge}>
            <Text style={styles.gameWinnerText}>
              {game.winner === 'player1' ? match.player1.userName : match.player2.userName}{' '}
              {t('recordScore.pickleballWins')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // 권한 확인
  if (!hasPermission) {
    return null;
  }

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
          {/* Match Info */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('recordScore.matchInfo')}</Text>
              <Text style={styles.matchTitle}>
                {match.player1.userName} vs {match.player2.userName}
              </Text>
            </Card.Content>
          </Card>

          {/* 🏓 Match Format Selection */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('recordScore.pickleballFormat')}</Text>
              <SegmentedButtons
                value={matchFormat}
                onValueChange={value => setMatchFormat(value as PickleballMatchFormat)}
                buttons={[
                  {
                    value: 'single_game',
                    label: t('recordScore.pickleballSingleGame'),
                  },
                  {
                    value: 'best_of_3',
                    label: t('recordScore.pickleballBestOf3'),
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </Card.Content>
          </Card>

          {/* 🏓 Target Score Selection */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('recordScore.pickleballTargetScore')}</Text>
              <View style={styles.targetScoreContainer}>
                <TouchableOpacity
                  style={[
                    styles.targetScoreButton,
                    targetScore === 11 && styles.targetScoreButtonActive,
                  ]}
                  onPress={() => setTargetScore(11)}
                >
                  <Text
                    style={[
                      styles.targetScoreText,
                      targetScore === 11 && styles.targetScoreTextActive,
                    ]}
                  >
                    11 {t('recordScore.pickleballPoints')}
                  </Text>
                  <Text style={styles.targetScoreSubtext}>({t('recordScore.pickleballStandard')})</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.targetScoreButton,
                    targetScore === 15 && styles.targetScoreButtonActive,
                  ]}
                  onPress={() => setTargetScore(15)}
                >
                  <Text
                    style={[
                      styles.targetScoreText,
                      targetScore === 15 && styles.targetScoreTextActive,
                    ]}
                  >
                    15 {t('recordScore.pickleballPoints')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.winBy2Hint}>{t('recordScore.pickleballWinBy2Hint')}</Text>
            </Card.Content>
          </Card>

          {/* 🏓 Score Input */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('recordScore.scoreInput')}</Text>
              <Text style={styles.sectionDescription}>
                {`${t('recordScore.pickleballScoreDescription')} ${targetScore}`}
              </Text>

              <View style={styles.gamesContainer}>
                {games.map((_, index) => renderGameInput(index))}
              </View>

              {/* Score Preview */}
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

              {/* Retired */}
              <TouchableOpacity
                style={[styles.specialOption, retired && styles.specialOptionActive]}
                onPress={() => {
                  const newRetired = !retired;
                  setRetired(newRetired);
                  if (newRetired) setWalkover(false);
                  setManualWinner(null);
                }}
              >
                <IconButton
                  icon={retired ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  style={{ margin: 0 }}
                />
                <Text style={styles.specialOptionText}>{t('recordScore.retired')}</Text>
              </TouchableOpacity>

              {/* Walkover */}
              <TouchableOpacity
                style={[styles.specialOption, walkover && styles.specialOptionActive]}
                onPress={() => {
                  const newWalkover = !walkover;
                  setWalkover(newWalkover);
                  if (newWalkover) setRetired(false);
                  setManualWinner(null);
                }}
              >
                <IconButton
                  icon={walkover ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  style={{ margin: 0 }}
                />
                <Text style={styles.specialOptionText}>{t('recordScore.walkover')}</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Winner Selection (for retired/walkover) */}
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

          {/* Submit Button */}
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

            <Text style={styles.submitNote}>{t('recordScore.submitNotePickleball')}</Text>
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
    },
    segmentedButtons: {
      marginTop: 8,
    },
    targetScoreContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    targetScoreButton: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.outline,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    targetScoreButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer || 'rgba(76, 175, 80, 0.1)',
    },
    targetScoreText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
    },
    targetScoreTextActive: {
      color: colors.primary,
    },
    targetScoreSubtext: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    winBy2Hint: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 12,
      fontStyle: 'italic',
    },
    gamesContainer: {
      marginTop: 8,
    },
    gameContainer: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    gameLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
      textAlign: 'center',
    },
    scoreInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
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
      width: 80,
      height: 56,
      borderWidth: 2,
      borderColor: colors.outline,
      borderRadius: 12,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '600',
      backgroundColor: colors.surface,
      color: colors.onSurface,
    },
    winnerScoreInput: {
      backgroundColor: colors.primaryContainer || 'rgba(76, 175, 80, 0.1)',
      borderColor: colors.primary,
    },
    scoreSeparator: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    gameWinnerBadge: {
      marginTop: 12,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: colors.primaryContainer || 'rgba(76, 175, 80, 0.1)',
      borderRadius: 16,
      alignSelf: 'center',
    },
    gameWinnerText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    scorePreview: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.primaryContainer || 'rgba(76, 175, 80, 0.1)',
      borderRadius: 12,
      alignItems: 'center',
    },
    scorePreviewLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    scorePreviewText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
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
    },
    winnerStatusText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    neutralStatusLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
    },
    specialOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      paddingHorizontal: 8,
    },
    specialOptionActive: {
      backgroundColor: colors.primaryContainer || 'rgba(76, 175, 80, 0.1)',
    },
    specialOptionText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.onSurface,
      fontWeight: '500',
    },
    winnerSelectionHint: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 8,
      textAlign: 'center',
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
  });

export default ScoreInputModal;
