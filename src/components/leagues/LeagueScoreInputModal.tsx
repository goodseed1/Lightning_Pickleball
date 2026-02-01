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
import { Card, Title, Button, IconButton, RadioButton, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { LeagueMatch } from '../../types/league';
import { useLanguage } from '../../contexts/LanguageContext';

// 🏓 피클볼 게임 점수 인터페이스
interface PickleballGame {
  player1: string; // 포인트 (0-25+)
  player2: string;
}

// 🏓 매치 포맷 타입
type MatchFormat = 'single_game' | 'best_of_3';
type TargetScore = 11 | 15;

interface LeagueScoreInputModalProps {
  visible: boolean;
  match: LeagueMatch | null;
  onSubmit: (result: {
    matchId: string;
    winnerId: string;
    loserId: string;
    score: string;
    sets: { player1Games: number; player2Games: number }[];
    matchFormat?: MatchFormat;
    targetScore?: TargetScore;
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
  const themeColors = getLightningPickleballTheme(currentTheme);
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

  // 🏓 피클볼 매치 설정
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('single_game');
  const [targetScore, setTargetScore] = useState<TargetScore>(11);

  // 🏓 피클볼 게임 점수 (최대 3게임)
  const [games, setGames] = useState<PickleballGame[]>([
    { player1: '', player2: '' },
    { player1: '', player2: '' },
    { player1: '', player2: '' },
  ]);

  const [matchWinner, setMatchWinner] = useState<{ id: string; name: string } | null>(null);
  const [matchLoser, setMatchLoser] = useState<{ id: string; name: string } | null>(null);
  const [retired, setRetired] = useState(false);
  const [walkover, setWalkover] = useState(false);
  const [manualWinner, setManualWinner] = useState<'player1' | 'player2' | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible && match) {
      // Pre-fill existing scores if match already has results (for admin corrections)
      if (match.score && match.score.sets && match.score.sets.length > 0) {
        console.log('📝 [Pre-fill] Loading existing scores:', match.score);

        const existingGames = match.score.sets.map(set => ({
          player1: set.player1Games?.toString() || '',
          player2: set.player2Games?.toString() || '',
        }));

        // Pad with empty games if needed
        while (existingGames.length < 3) {
          existingGames.push({ player1: '', player2: '' });
        }

        setGames(existingGames);

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
        setGames([
          { player1: '', player2: '' },
          { player1: '', player2: '' },
          { player1: '', player2: '' },
        ]);
        setMatchWinner(null);
        setMatchLoser(null);
        setRetired(false);
        setWalkover(false);
        setManualWinner(null);
        setMatchFormat('single_game');
        setTargetScore(11);
      }
    }
  }, [visible, match]);

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

      const maxScore = Math.max(p1, p2);
      const diff = Math.abs(p1 - p2);

      // 승리 조건: targetScore 이상 + 2점 차이
      if (maxScore >= targetScore && diff >= 2) {
        return p1 > p2 ? 'player1' : 'player2';
      }

      return null;
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
  const calculateMatchWinner = useCallback(() => {
    if (!match) return { winner: null, loser: null };

    let player1GameWins = 0;
    let player2GameWins = 0;

    const gamesToCheck = matchFormat === 'single_game' ? 1 : 3;

    for (let i = 0; i < gamesToCheck; i++) {
      const winner = getGameWinner(games[i]);
      if (winner === 'player1') player1GameWins++;
      else if (winner === 'player2') player2GameWins++;
    }

    const winsNeeded = matchFormat === 'single_game' ? 1 : 2;

    if (player1GameWins >= winsNeeded) {
      return {
        winner: { id: match.player1Id, name: match.player1Name },
        loser: { id: match.player2Id, name: match.player2Name },
      };
    } else if (player2GameWins >= winsNeeded) {
      return {
        winner: { id: match.player2Id, name: match.player2Name },
        loser: { id: match.player1Id, name: match.player1Name },
      };
    }

    return { winner: null, loser: null };
  }, [games, match, getGameWinner, matchFormat]);

  // Real-time winner calculation
  useEffect(() => {
    const result = calculateMatchWinner();
    setMatchWinner(result.winner);
    setMatchLoser(result.loser);
  }, [games, calculateMatchWinner]);

  // Update matchWinner/matchLoser when manualWinner changes (for retired/walkover)
  useEffect(() => {
    if ((retired || walkover) && manualWinner && match) {
      const winnerId = manualWinner === 'player1' ? match.player1Id : match.player2Id;
      const winnerName = manualWinner === 'player1' ? match.player1Name : match.player2Name;
      const loserId = manualWinner === 'player1' ? match.player2Id : match.player1Id;
      const loserName = manualWinner === 'player1' ? match.player2Name : match.player1Name;

      setMatchWinner({ id: winnerId, name: winnerName });
      setMatchLoser({ id: loserId, name: loserName });
    }
  }, [retired, walkover, manualWinner, match]);

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

  // 🏓 점수 업데이트
  const updateScore = (gameIndex: number, player: 'player1' | 'player2', value: string) => {
    // 숫자만 허용
    if (value && !/^\d*$/.test(value)) return;

    const newGames = [...games];
    newGames[gameIndex][player] = value;
    setGames(newGames);
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

  // 🏓 점수 검증
  const validateScore = (): boolean => {
    if (retired || walkover) {
      return true;
    }

    if (!matchWinner || !matchLoser) {
      Alert.alert(
        t('recordScore.alerts.notice'),
        t('recordScore.alerts.pickleballMatchNotComplete')
      );
      return false;
    }

    const gamesToCheck = calculateGamesToDisplay();

    for (let i = 0; i < gamesToCheck; i++) {
      const game = games[i];

      if (!game.player1.trim() || !game.player2.trim()) {
        continue;
      }

      const p1 = parseInt(game.player1, 10);
      const p2 = parseInt(game.player2, 10);

      if (isNaN(p1) || isNaN(p2)) {
        Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.scoresMustBeNumbers'));
        return false;
      }

      if (p1 < 0 || p2 < 0) {
        Alert.alert(t('recordScore.alerts.notice'), t('recordScore.alerts.scoresCannotBeNegative'));
        return false;
      }

      const maxScore = Math.max(p1, p2);
      const minScore = Math.min(p1, p2);
      const diff = Math.abs(p1 - p2);

      // 승리 조건 검증: targetScore 이상 + 2점 차이
      if (maxScore < targetScore) {
        Alert.alert(
          t('recordScore.alerts.notice'),
          `${t('recordScore.alerts.pickleballMinScoreRequired')} ${targetScore} (${t('recordScore.alerts.game')} ${i + 1})`
        );
        return false;
      }

      if (diff < 2) {
        Alert.alert(
          t('recordScore.alerts.notice'),
          `${t('recordScore.alerts.pickleballWinBy2')} (${t('recordScore.alerts.game')} ${i + 1})`
        );
        return false;
      }

      // 연장전 점수 검증 (targetScore 이상에서 win by 2)
      if (maxScore > targetScore && minScore < targetScore - 1) {
        // 예: 15-10에서 15점 게임일 때 - 10은 13보다 작으므로 유효
        // 예: 13-11에서 11점 게임일 때 - 유효 (11-9, 12-10, 13-11...)
      }
    }

    return true;
  };

  const handleSubmit = () => {
    console.log('🏓 [LeagueScoreInputModal] handleSubmit called with:', {
      match: match
        ? {
            id: match.id,
            player1Id: match.player1Id,
            player2Id: match.player2Id,
          }
        : null,
      matchWinner,
      matchLoser,
      games,
      retired,
      walkover,
      manualWinner,
      matchFormat,
      targetScore,
    });

    // 기권/부전승 시 승자 필수 확인
    if ((retired || walkover) && !manualWinner) {
      Alert.alert(t('recordScore.alerts.notice'), t('recordScore.pleaseSelectWinner'));
      return;
    }

    // 기권/부전승이 아닐 때는 점수 검증
    if (!retired && !walkover) {
      if (!validateScore() || !match || !matchWinner || !matchLoser) {
        console.log('❌ [LeagueScoreInputModal] Validation failed');
        return;
      }
    } else {
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

    if (!match.id || match.id.trim() === '') {
      Alert.alert(t('recordScore.alerts.error'), t('recordScore.alerts.invalidMatchInfo'));
      return;
    }

    // 🏓 피클볼 점수 포맷으로 변환
    const formattedGames = games
      .filter(game => game.player1.trim() && game.player2.trim())
      .map(game => ({
        player1Games: parseInt(game.player1) || 0,
        player2Games: parseInt(game.player2) || 0,
      }));

    const result = {
      matchId: match.id,
      winnerId: matchWinner!.id,
      loserId: matchLoser!.id,
      score: retired || walkover ? (retired ? 'Retired' : 'Walkover') : formatScore(),
      sets: retired || walkover ? [] : formattedGames,
      matchFormat,
      targetScore,
      retired,
      walkover,
    };

    console.log('✅ [LeagueScoreInputModal] Calling onSubmit with result:', result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit(result as any);
  };

  // 🏓 피클볼 점수 입력 렌더링
  const renderGameInput = (gameIndex: number) => {
    if (!match) return null;

    const isPlayer1Winner = matchWinner?.id === match.player1Id;
    const isPlayer2Winner = matchWinner?.id === match.player2Id;
    const currentGame = games[gameIndex];
    const gameWinner = getGameWinner(currentGame);

    return (
      <View key={gameIndex} style={styles.gameContainer}>
        <Text style={styles.gameLabel}>
          {matchFormat === 'single_game'
            ? t('recordScore.game')
            : `${t('recordScore.game')} ${gameIndex + 1}`}
        </Text>

        <View style={styles.scoreInputRow}>
          <View style={styles.playerInputContainer}>
            <View style={styles.playerLabelContainer}>
              {splitDoublesName(match.player1Name) ? (
                <View style={styles.doublesNameContainer}>
                  <Text
                    style={[
                      styles.playerLabel,
                      (isPlayer1Winner || gameWinner === 'player1') && styles.winnerLabel,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {splitDoublesName(match.player1Name)!.player1}
                  </Text>
                  <Text style={styles.doublesSlash}>/</Text>
                  <Text
                    style={[
                      styles.playerLabel,
                      (isPlayer1Winner || gameWinner === 'player1') && styles.winnerLabel,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {splitDoublesName(match.player1Name)!.player2}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.playerLabel,
                    (isPlayer1Winner || gameWinner === 'player1') && styles.winnerLabel,
                  ]}
                >
                  {match.player1Name}
                </Text>
              )}
              {(isPlayer1Winner || gameWinner === 'player1') && (
                <Text style={styles.winnerIcon}>👑</Text>
              )}
            </View>
            <RNTextInput
              editable={!retired && !walkover}
              value={currentGame.player1}
              onChangeText={value => updateScore(gameIndex, 'player1', value)}
              style={[
                styles.scoreInput,
                gameWinner === 'player1' && styles.winnerScoreInput,
                (retired || walkover) && styles.disabledInput,
              ]}
              keyboardType="numeric"
              maxLength={2}
              placeholder={targetScore.toString()}
              placeholderTextColor={themeColors.colors.onSurfaceVariant}
              selectTextOnFocus
            />
          </View>

          <Text style={styles.scoreSeparator}>-</Text>

          <View style={styles.playerInputContainer}>
            <View style={styles.playerLabelContainer}>
              {splitDoublesName(match.player2Name) ? (
                <View style={styles.doublesNameContainer}>
                  <Text
                    style={[
                      styles.playerLabel,
                      (isPlayer2Winner || gameWinner === 'player2') && styles.winnerLabel,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {splitDoublesName(match.player2Name)!.player1}
                  </Text>
                  <Text style={styles.doublesSlash}>/</Text>
                  <Text
                    style={[
                      styles.playerLabel,
                      (isPlayer2Winner || gameWinner === 'player2') && styles.winnerLabel,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {splitDoublesName(match.player2Name)!.player2}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.playerLabel,
                    (isPlayer2Winner || gameWinner === 'player2') && styles.winnerLabel,
                  ]}
                >
                  {match.player2Name}
                </Text>
              )}
              {(isPlayer2Winner || gameWinner === 'player2') && (
                <Text style={styles.winnerIcon}>👑</Text>
              )}
            </View>
            <RNTextInput
              editable={!retired && !walkover}
              value={currentGame.player2}
              onChangeText={value => updateScore(gameIndex, 'player2', value)}
              style={[
                styles.scoreInput,
                gameWinner === 'player2' && styles.winnerScoreInput,
                (retired || walkover) && styles.disabledInput,
              ]}
              keyboardType="numeric"
              maxLength={2}
              placeholder={targetScore.toString()}
              placeholderTextColor={themeColors.colors.onSurfaceVariant}
              selectTextOnFocus
            />
          </View>
        </View>

        {/* 🏓 게임 승자 표시 */}
        {gameWinner && (
          <View style={styles.gameWinnerBadge}>
            <Text style={styles.gameWinnerText}>
              🏆{' '}
              {gameWinner === 'player1'
                ? match.player1Name.split(' / ')[0]
                : match.player2Name.split(' / ')[0]}{' '}
              {t('recordScore.winsGame')}
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
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="close" size={24} onPress={onClose} style={styles.closeButton} />
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

          {/* 🏓 Match Settings */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('recordScore.matchSettings')}</Text>

              {/* Match Format */}
              <Text style={styles.settingLabel}>{t('recordScore.matchFormat')}</Text>
              <SegmentedButtons
                value={matchFormat}
                onValueChange={value => setMatchFormat(value as MatchFormat)}
                buttons={[
                  { value: 'single_game', label: t('recordScore.singleGame') },
                  { value: 'best_of_3', label: t('recordScore.bestOf3') },
                ]}
                style={styles.segmentedButtons}
              />

              {/* Target Score */}
              <Text style={[styles.settingLabel, { marginTop: 16 }]}>
                {t('recordScore.targetScore')}
              </Text>
              <SegmentedButtons
                value={targetScore.toString()}
                onValueChange={value => setTargetScore(parseInt(value) as TargetScore)}
                buttons={[
                  { value: '11', label: '11 ' + t('recordScore.points') },
                  { value: '15', label: '15 ' + t('recordScore.points') },
                ]}
                style={styles.segmentedButtons}
              />

              <Text style={styles.settingHint}>
                {t('recordScore.pickleballWinBy2Hint')}
              </Text>
            </Card.Content>
          </Card>

          {/* Score Input */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.scoreHeader}>
                <Text style={styles.sectionTitle}>{t('recordScore.scoreInput')}</Text>
              </View>

              <Text style={styles.sectionDescription}>
                {t('recordScore.pickleballScoreInputDescription')}
              </Text>

              <View style={styles.scoreContainer}>
                {Array.from({ length: calculateGamesToDisplay() }, (_, index) =>
                  renderGameInput(index)
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
                        value="player1"
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
                        value="player2"
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
              mode="contained"
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
    settingLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    settingHint: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 12,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    segmentedButtons: {
      marginVertical: 4,
    },
    scoreHeader: {
      marginBottom: 8,
    },
    scoreContainer: {
      gap: 20,
    },
    gameContainer: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    gameLabel: {
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
      width: 70,
      height: 50,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '600',
      color: colors.onSurface,
    },
    winnerScoreInput: {
      backgroundColor: isDarkMode ? colors.warningContainer : '#FFF8DC',
      borderWidth: 2,
      borderColor: '#FFD700',
    },
    scoreSeparator: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    gameWinnerBadge: {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: isDarkMode ? '#2E7D32' : '#E8F5E9',
      borderRadius: 16,
    },
    gameWinnerText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#A5D6A7' : '#2E7D32',
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

export default LeagueScoreInputModal;
