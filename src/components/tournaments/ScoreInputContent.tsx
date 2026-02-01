/**
 * Score Input Content Component for Tournament Detail Screen
 * 토너먼트 상세 화면 내 점수 입력 컴포넌트 (모달 없이)
 *
 * 🏓 Pickleball Scoring Rules:
 * - Rally scoring to 11 or 15 points
 * - Win by 2 points
 * - Single game (default) or Best of 3 games
 * - NO tiebreaks (win by 2 rule applies)
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { Button, TextInput as PaperTextInput, RadioButton, SegmentedButtons } from 'react-native-paper';
import {
  SetScore,
  ScoreInputForm,
  Match,
  PickleballGameTarget,
  PickleballMatchFormat,
  determinePickleballGameWinner,
  determineBestOf3Winner,
} from '../../types/match';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';

// 🏓 피클볼 게임 점수 인터페이스
interface PickleballGame {
  player1: string; // 포인트 (0-25+)
  player2: string;
}

interface ScoreInputContentProps {
  match: Match;
  // 🏓 피클볼 설정 (레거시 테니스 prop들은 무시됨)
  setsToWin?: number; // 레거시 - 사용되지 않음
  gamesPerSet?: number; // 레거시 - 사용되지 않음
  onCancel: () => void;
  onSubmit: (scoreData: ScoreInputForm) => Promise<void>;
}

const ScoreInputContent: React.FC<ScoreInputContentProps> = ({
  match,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const { paperTheme: theme } = useTheme();
  const styles = createStyles(theme);

  // 🏓 피클볼 매치 설정
  const [matchFormat, setMatchFormat] = useState<PickleballMatchFormat>('single_game');
  const [targetScore, setTargetScore] = useState<PickleballGameTarget>(11);

  // 🏓 피클볼 게임 점수 (최대 3게임)
  const [games, setGames] = useState<PickleballGame[]>([
    { player1: '', player2: '' },
    { player1: '', player2: '' },
    { player1: '', player2: '' },
  ]);

  const [retired, setRetired] = useState(false);
  const [walkover, setWalkover] = useState(false);
  const [manualWinner, setManualWinner] = useState<'player1' | 'player2' | null>(null);
  const [notes, setNotes] = useState('');
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

  // Reset form when match changes
  useEffect(() => {
    console.log('🏓 [ScoreInputContent] Reset for match:', {
      matchId: match.id,
      player1: match.player1.userName,
      player2: match.player2.userName,
    });

    setGames([
      { player1: '', player2: '' },
      { player1: '', player2: '' },
      { player1: '', player2: '' },
    ]);
    setMatchFormat('single_game');
    setTargetScore(11);
    setRetired(false);
    setWalkover(false);
    setManualWinner(null);
    setNotes('');
  }, [match.id]);

  // 🏓 피클볼 게임 승자 결정 (win by 2 규칙)
  const getGameWinner = useCallback(
    (game: PickleballGame): 'player1' | 'player2' | null => {
      if (!game.player1.trim() || !game.player2.trim()) {
        return null;
      }

      const p1 = parseInt(game.player1, 10);
      const p2 = parseInt(game.player2, 10);

      if (isNaN(p1) || isNaN(p2)) {
        return null;
      }

      return determinePickleballGameWinner(p1, p2, targetScore);
    },
    [targetScore]
  );

  // 🏓 표시할 게임 수 계산
  const calculateGamesToDisplay = useCallback(() => {
    if (matchFormat === 'single_game') {
      return 1;
    }

    // Best of 3: 현재 진행 상황에 따라 동적으로 표시
    let player1GameWins = 0;
    let player2GameWins = 0;

    for (let i = 0; i < games.length; i++) {
      const winner = getGameWinner(games[i]);
      if (winner === 'player1') player1GameWins++;
      else if (winner === 'player2') player2GameWins++;
    }

    // 누군가 2승하면 더 이상 게임 표시 안함
    if (player1GameWins >= 2 || player2GameWins >= 2) {
      return player1GameWins + player2GameWins;
    }

    // 첫 게임 완료 전
    if (player1GameWins === 0 && player2GameWins === 0) {
      return 1;
    }

    // 1-0 또는 0-1
    if (player1GameWins + player2GameWins === 1) {
      return 2;
    }

    // 1-1
    if (player1GameWins === 1 && player2GameWins === 1) {
      return 3;
    }

    return Math.max(2, player1GameWins + player2GameWins + 1);
  }, [games, getGameWinner, matchFormat]);

  // 🏓 매치 승자 계산
  const calculateMatchWinner = useCallback((): 'player1' | 'player2' | null => {
    let player1GameWins = 0;
    let player2GameWins = 0;

    const gamesToCheck = matchFormat === 'single_game' ? 1 : 3;

    for (let i = 0; i < gamesToCheck; i++) {
      const winner = getGameWinner(games[i]);
      if (winner === 'player1') player1GameWins++;
      else if (winner === 'player2') player2GameWins++;
    }

    if (matchFormat === 'single_game') {
      return player1GameWins > 0 ? 'player1' : player2GameWins > 0 ? 'player2' : null;
    }

    // Best of 3
    return determineBestOf3Winner(
      games.map(g => ({
        player1Points: parseInt(g.player1) || 0,
        player2Points: parseInt(g.player2) || 0,
        winner: getGameWinner(g),
      }))
    );
  }, [games, getGameWinner, matchFormat]);

  // 🏓 점수 업데이트
  const updateScore = (gameIndex: number, player: 'player1' | 'player2', value: string) => {
    // 숫자만 허용
    if (value && !/^\d*$/.test(value)) return;

    const newGames = [...games];
    newGames[gameIndex][player] = value;
    setGames(newGames);
  };

  // 🔴 기권 ↔ 부전승 상호 배타성 핸들러
  const handleRetiredChange = () => {
    const newRetired = !retired;
    setRetired(newRetired);
    if (newRetired) {
      setWalkover(false);
    }
    setManualWinner(null);
  };

  const handleWalkoverChange = () => {
    const newWalkover = !walkover;
    setWalkover(newWalkover);
    if (newWalkover) {
      setRetired(false);
    }
    setManualWinner(null);
  };

  // 🏓 점수 포맷 (예: "11-7" 또는 "11-8, 9-11, 11-6")
  const formatScore = (): string => {
    const gameScores: string[] = [];
    const gamesToFormat = calculateGamesToDisplay();

    for (let i = 0; i < gamesToFormat; i++) {
      const game = games[i];
      if (game.player1.trim() && game.player2.trim()) {
        gameScores.push(`${game.player1}-${game.player2}`);
      }
    }

    return gameScores.join(', ');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 기권/부전승 시 승자 선택 필수
      if ((retired || walkover) && !manualWinner) {
        Alert.alert(t('scoreInput.winnerSelectionRequired'), t('scoreInput.pleaseSelectWinner'));
        return;
      }

      const _winner = calculateMatchWinner();

      // 기권/부전승이 아닐 때 매치 완료 확인
      if (!_winner && !retired && !walkover) {
        const winsNeeded = matchFormat === 'single_game' ? 1 : 2;
        Alert.alert(
          t('scoreInput.matchIncomplete'),
          matchFormat === 'single_game'
            ? t('scoreInput.pickleballSingleGameIncomplete')
            : t('scoreInput.pickleballBestOf3Incomplete', { wins: winsNeeded })
        );
        return;
      }

      // 점수 검증
      if (!retired && !walkover) {
        const gamesToCheck = calculateGamesToDisplay();
        for (let i = 0; i < gamesToCheck; i++) {
          const game = games[i];
          if (!game.player1.trim() || !game.player2.trim()) continue;

          const p1 = parseInt(game.player1, 10);
          const p2 = parseInt(game.player2, 10);
          const maxScore = Math.max(p1, p2);
          const diff = Math.abs(p1 - p2);

          if (maxScore < targetScore || diff < 2) {
            Alert.alert(
              t('scoreInput.invalidScore'),
              t('scoreInput.pickleballScoreRequirement', { target: targetScore, game: i + 1 })
            );
            return;
          }
        }
      }

      // 🏓 피클볼 점수를 레거시 SetScore 포맷으로 변환 (호환성)
      const convertedSets: SetScore[] = games
        .filter(game => game.player1.trim() && game.player2.trim())
        .map(game => ({
          player1Games: parseInt(game.player1, 10) || 0,
          player2Games: parseInt(game.player2, 10) || 0,
        }));

      const scoreData: ScoreInputForm = {
        matchId: match.id,
        sets: convertedSets,
        _winner: retired || walkover ? manualWinner : _winner,
        finalScore: retired ? 'RET' : walkover ? 'W.O.' : formatScore(),
        retired,
        walkover,
        notes: notes.trim(),
        // 🏓 피클볼 메타데이터
        matchFormat,
        targetScore,
      };

      console.log('🏓 ScoreInputContent submitting:', scoreData);

      await onSubmit(scoreData);
    } catch (error) {
      console.error('Error in ScoreInputContent:', error);
      Alert.alert(t('scoreInput.error'), t('scoreInput.savingError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const player1Name = match.player1?.userName || 'Player 1';
  const player2Name = match.player2?.userName || 'Player 2';
  const matchWinner = calculateMatchWinner();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {t('scoreInput.enterMatchResult')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Match Info */}
        <View style={[styles.matchInfo, { backgroundColor: theme.colors.surface }]}>
          <Text
            style={[styles.matchPlayerName, { color: theme.colors.onSurface }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {player1Name}
          </Text>
          <Text style={[styles.matchVsText, { color: theme.colors.onSurfaceVariant }]}>vs</Text>
          <Text
            style={[styles.matchPlayerName, { color: theme.colors.onSurface }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {player2Name}
          </Text>
        </View>

        {/* 🏓 Match Settings */}
        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.settingsSectionTitle, { color: theme.colors.onSurface }]}>
            {t('recordScore.matchSettings')}
          </Text>

          {/* Match Format */}
          <Text style={[styles.settingLabel, { color: theme.colors.onSurfaceVariant }]}>
            {t('recordScore.matchFormat')}
          </Text>
          <SegmentedButtons
            value={matchFormat}
            onValueChange={value => setMatchFormat(value as PickleballMatchFormat)}
            buttons={[
              { value: 'single_game', label: t('recordScore.singleGame') },
              { value: 'best_of_3', label: t('recordScore.bestOf3') },
            ]}
            style={styles.segmentedButtons}
          />

          {/* Target Score */}
          <Text style={[styles.settingLabel, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
            {t('recordScore.targetScore')}
          </Text>
          <SegmentedButtons
            value={targetScore.toString()}
            onValueChange={value => setTargetScore(parseInt(value) as PickleballGameTarget)}
            buttons={[
              { value: '11', label: '11 ' + t('recordScore.points') },
              { value: '15', label: '15 ' + t('recordScore.points') },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={[styles.settingHint, { color: theme.colors.onSurfaceVariant }]}>
            {t('recordScore.pickleballWinBy2Hint')}
          </Text>
        </View>

        {/* 🏓 Games Input */}
        <View style={styles.gamesContainer}>
          {Array.from({ length: calculateGamesToDisplay() }, (_, index) => {
            const game = games[index];
            const gameWinner = getGameWinner(game);

            return (
              <View key={index} style={[styles.gameRow, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.gameLabel, { color: theme.colors.onSurface }]}>
                  {matchFormat === 'single_game'
                    ? t('recordScore.game')
                    : `${t('recordScore.game')} ${index + 1}`}
                  {gameWinner && (
                    <Text style={[styles.gameWinnerIndicator, { color: theme.colors.primary }]}>
                      {' '}✓
                    </Text>
                  )}
                </Text>

                <View style={styles.scoreInputs}>
                  <View style={styles.playerScore}>
                    {splitDoublesName(player1Name) ? (
                      <View style={styles.doublesNameContainer}>
                        <Text
                          style={[
                            styles.doublesPlayerName,
                            { color: theme.colors.onSurface },
                            gameWinner === 'player1' && { color: theme.colors.primary, fontWeight: 'bold' },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {splitDoublesName(player1Name)!.player1}
                        </Text>
                        <Text style={[styles.doublesSlash, { color: theme.colors.onSurfaceVariant }]}>/</Text>
                        <Text
                          style={[
                            styles.doublesPlayerName,
                            { color: theme.colors.onSurface },
                            gameWinner === 'player1' && { color: theme.colors.primary, fontWeight: 'bold' },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
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
                          gameWinner === 'player1' && { color: theme.colors.primary, fontWeight: 'bold' },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {player1Name}
                        {matchWinner === 'player1' && ' 👑'}
                      </Text>
                    )}
                    <PaperTextInput
                      disabled={retired || walkover}
                      style={[
                        styles.scoreInput,
                        gameWinner === 'player1' && styles.winnerScoreInput,
                        (retired || walkover) && styles.disabledInput,
                      ]}
                      value={game.player1}
                      onChangeText={text => updateScore(index, 'player1', text)}
                      keyboardType="numeric"
                      maxLength={2}
                      dense
                      selectTextOnFocus
                      placeholder={targetScore.toString()}
                    />
                  </View>

                  <Text style={[styles.scoreSeparator, { color: theme.colors.onSurfaceVariant }]}>-</Text>

                  <View style={styles.playerScore}>
                    {splitDoublesName(player2Name) ? (
                      <View style={styles.doublesNameContainer}>
                        <Text
                          style={[
                            styles.doublesPlayerName,
                            { color: theme.colors.onSurface },
                            gameWinner === 'player2' && { color: theme.colors.primary, fontWeight: 'bold' },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {splitDoublesName(player2Name)!.player1}
                        </Text>
                        <Text style={[styles.doublesSlash, { color: theme.colors.onSurfaceVariant }]}>/</Text>
                        <Text
                          style={[
                            styles.doublesPlayerName,
                            { color: theme.colors.onSurface },
                            gameWinner === 'player2' && { color: theme.colors.primary, fontWeight: 'bold' },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
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
                          gameWinner === 'player2' && { color: theme.colors.primary, fontWeight: 'bold' },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {player2Name}
                        {matchWinner === 'player2' && ' 👑'}
                      </Text>
                    )}
                    <PaperTextInput
                      disabled={retired || walkover}
                      style={[
                        styles.scoreInput,
                        gameWinner === 'player2' && styles.winnerScoreInput,
                        (retired || walkover) && styles.disabledInput,
                      ]}
                      value={game.player2}
                      onChangeText={text => updateScore(index, 'player2', text)}
                      keyboardType="numeric"
                      maxLength={2}
                      dense
                      selectTextOnFocus
                      placeholder={targetScore.toString()}
                    />
                  </View>
                </View>

                {/* Game Winner Badge */}
                {gameWinner && (
                  <View style={[styles.gameWinnerBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text style={[styles.gameWinnerText, { color: theme.colors.onPrimaryContainer }]}>
                      🏆 {gameWinner === 'player1' ? player1Name.split(' / ')[0] : player2Name.split(' / ')[0]} {t('recordScore.winsGame')}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Match Status Preview */}
          {games.some(g => g.player1.trim() && g.player2.trim()) && (
            <View style={[styles.matchStatusContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.matchStatusTitle, { color: theme.colors.onSurface }]}>
                {t('scoreInput.currentMatchStatus')}
              </Text>

              <Text style={[styles.scorePreviewText, { color: theme.colors.primary }]}>
                {formatScore()}
              </Text>

              {matchWinner && (
                <View style={styles.matchWinnerContainer}>
                  <Text style={[styles.matchWinnerLabel, { color: theme.colors.onSurfaceVariant }]}>
                    🏆 {t('scoreInput.currentWinner')}:
                  </Text>
                  <Text style={[styles.matchWinnerName, { color: theme.colors.primary }]}>
                    {matchWinner === 'player1' ? player1Name : player2Name}
                  </Text>
                </View>
              )}

              {!matchWinner && (
                <Text style={[styles.matchInProgressText, { color: theme.colors.onSurfaceVariant }]}>
                  ⚡ {t('scoreInput.matchInProgress')}
                </Text>
              )}
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

        {/* Winner Selection (for retired/walkover) */}
        {(retired || walkover) && (
          <View style={[styles.winnerSelectionContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.winnerSelectionTitle, { color: theme.colors.onSurface }]}>
              {t('scoreInput.selectWinnerRequired')}
            </Text>
            <RadioButton.Group
              onValueChange={value => setManualWinner(value as 'player1' | 'player2')}
              value={manualWinner || ''}
            >
              <RadioButton.Item label={player1Name} value="player1" color={theme.colors.primary} />
              <RadioButton.Item label={player2Name} value="player2" color={theme.colors.primary} />
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
            style={[styles.notesInput, { borderColor: theme.colors.outline, color: theme.colors.onSurface }]}
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
          mode="contained"
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
    surfaceVariant: string;
    primary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
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
    settingsCard: {
      margin: 16,
      marginTop: 0,
      padding: 16,
      borderRadius: 12,
    },
    settingsSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    settingHint: {
      fontSize: 12,
      marginTop: 12,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    segmentedButtons: {
      marginVertical: 4,
    },
    gamesContainer: {
      margin: 16,
      marginTop: 0,
    },
    gameRow: {
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
    },
    gameLabel: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 12,
    },
    gameWinnerIndicator: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    scoreInputs: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerScore: {
      alignItems: 'center',
      flex: 1,
      maxWidth: 120,
    },
    playerName: {
      fontSize: 14,
      marginBottom: 8,
      textAlign: 'center',
      width: '100%',
    },
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
      backgroundColor: '#FFF8DC',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    scoreSeparator: {
      fontSize: 20,
      fontWeight: 'bold',
      marginHorizontal: 16,
    },
    gameWinnerBadge: {
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: 'center',
    },
    gameWinnerText: {
      fontSize: 12,
      fontWeight: '600',
    },
    matchStatusContainer: {
      marginTop: 8,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    matchStatusTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    scorePreviewText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    matchWinnerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    matchWinnerLabel: {
      fontSize: 14,
    },
    matchWinnerName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    matchInProgressText: {
      fontSize: 14,
      fontStyle: 'italic',
      marginTop: 8,
    },
    specialCases: {
      margin: 16,
      marginTop: 0,
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
    winnerSelectionContainer: {
      margin: 16,
      marginTop: 0,
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
    notesContainer: {
      margin: 16,
      marginTop: 0,
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
    disabledInput: {
      backgroundColor: '#f0f0f0',
      opacity: 0.6,
    },
  });

export default ScoreInputContent;
