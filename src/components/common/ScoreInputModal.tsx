/**
 * Common Score Input Modal Component
 * 공통 피클볼 점수 입력 모달 (간소화 버전)
 *
 * 🏓 Pickleball Scoring:
 * - Rally scoring to 11 or 15 points
 * - Win by 2 points
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  PickleballGameTarget,
  PickleballMatchFormat,
  determinePickleballGameWinner,
} from '../../types/match';

interface Player {
  playerId: string;
  playerName: string;
}

interface ScoreInputModalProps {
  visible: boolean;
  player1: Player;
  player2: Player;
  onSubmit: (result: MatchResult) => void;
  onClose: () => void;
}

interface MatchResult {
  winner: string;
  loser: string;
  score: {
    games: { player1Points: number; player2Points: number }[];
  };
  matchType: 'completed' | 'retired' | 'walkover';
  format: PickleballMatchFormat;
  targetScore: PickleballGameTarget;
}

const ScoreInputModal: React.FC<ScoreInputModalProps> = ({
  visible,
  player1,
  player2,
  onSubmit,
  onClose,
}) => {
  const { t } = useLanguage();

  // 🎯 복식 팀 이름 분리
  const isDoublesName = (name: string) => name.includes(' / ');
  const splitDoublesName = (name: string) => {
    if (isDoublesName(name)) {
      const parts = name.split(' / ');
      return { player1: parts[0] || '', player2: parts[1] || '' };
    }
    return null;
  };

  // 🏓 피클볼 스코어링 상태
  const [matchFormat, setMatchFormat] = useState<PickleballMatchFormat>('single_game');
  const [targetScore, setTargetScore] = useState<PickleballGameTarget>(11);
  const [games, setGames] = useState<{ p1: string; p2: string }[]>([{ p1: '', p2: '' }]);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [matchType, setMatchType] = useState<'completed' | 'retired' | 'walkover'>('completed');

  const resetForm = () => {
    setMatchFormat('single_game');
    setTargetScore(11);
    setGames([{ p1: '', p2: '' }]);
    setSelectedWinner(null);
    setMatchType('completed');
  };

  const updateGameScore = (gameIndex: number, player: 'p1' | 'p2', score: string) => {
    const numScore = parseInt(score) || 0;
    if (score !== '' && (numScore < 0 || numScore > 30)) return;

    const newGames = [...games];
    newGames[gameIndex][player] = score;
    setGames(newGames);

    // Best of 3에서 자동으로 다음 게임 추가
    if (matchFormat === 'best_of_3' && newGames.length < 3) {
      const p1Score = parseInt(newGames[gameIndex].p1) || 0;
      const p2Score = parseInt(newGames[gameIndex].p2) || 0;
      const winner = determinePickleballGameWinner(p1Score, p2Score, targetScore);

      if (winner && gameIndex === newGames.length - 1) {
        const p1Wins = newGames.filter(g => {
          const s1 = parseInt(g.p1) || 0;
          const s2 = parseInt(g.p2) || 0;
          return determinePickleballGameWinner(s1, s2, targetScore) === 'player1';
        }).length;
        const p2Wins = newGames.filter(g => {
          const s1 = parseInt(g.p1) || 0;
          const s2 = parseInt(g.p2) || 0;
          return determinePickleballGameWinner(s1, s2, targetScore) === 'player2';
        }).length;

        if (p1Wins < 2 && p2Wins < 2) {
          setGames([...newGames, { p1: '', p2: '' }]);
        }
      }
    }
  };

  const validateScore = (): boolean => {
    if (matchType !== 'completed') return true;

    let p1Wins = 0;
    let p2Wins = 0;

    for (const game of games) {
      const p1Score = parseInt(game.p1) || 0;
      const p2Score = parseInt(game.p2) || 0;

      if (p1Score === 0 && p2Score === 0) continue;

      const winner = determinePickleballGameWinner(p1Score, p2Score, targetScore);
      if (winner === 'player1') p1Wins++;
      else if (winner === 'player2') p2Wins++;
    }

    if (matchFormat === 'single_game') {
      if (p1Wins === 0 && p2Wins === 0) {
        Alert.alert(t('alert.score.invalidScore'), t('alert.score.pickleballInvalidScore'));
        return false;
      }
    } else {
      // Best of 3
      if (p1Wins < 2 && p2Wins < 2) {
        Alert.alert(t('alert.score.invalidScore'), t('alert.score.pickleballBestOf3Incomplete'));
        return false;
      }
    }

    // Set winner
    if (p1Wins > p2Wins) {
      setSelectedWinner(player1.playerId);
    } else {
      setSelectedWinner(player2.playerId);
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateScore()) return;

    if (matchType === 'walkover' && !selectedWinner) {
      Alert.alert(t('alert.score.selectWinner'), t('alert.score.selectWinnerWalkover'));
      return;
    }

    const winner = selectedWinner || '';
    const loser = winner === player1.playerId ? player2.playerId : player1.playerId;

    const validGames = games
      .filter(g => (parseInt(g.p1) || 0) > 0 || (parseInt(g.p2) || 0) > 0)
      .map(g => ({
        player1Points: parseInt(g.p1) || 0,
        player2Points: parseInt(g.p2) || 0,
      }));

    const result: MatchResult = {
      winner,
      loser,
      score: {
        games: validGames,
      },
      matchType,
      format: matchFormat,
      targetScore,
    };

    onSubmit(result);
    resetForm();
    onClose();
  };

  const renderScoreInput = () => {
    if (matchType === 'walkover') {
      return (
        <View style={styles.walkoverContainer}>
          <Text style={styles.walkoverTitle}>{t('recordScore.selectWinner')}</Text>
          <TouchableOpacity
            style={[
              styles.playerSelector,
              selectedWinner === player1.playerId && styles.selectedPlayer,
            ]}
            onPress={() => setSelectedWinner(player1.playerId)}
          >
            {splitDoublesName(player1.playerName) ? (
              <View style={styles.doublesNameContainer}>
                <Text style={styles.playerName} numberOfLines={1} ellipsizeMode='tail'>
                  {splitDoublesName(player1.playerName)!.player1}
                </Text>
                <Text style={styles.doublesSlash}>/</Text>
                <Text style={styles.playerName} numberOfLines={1} ellipsizeMode='tail'>
                  {splitDoublesName(player1.playerName)!.player2}
                </Text>
              </View>
            ) : (
              <Text style={styles.playerName}>{player1.playerName}</Text>
            )}
            {selectedWinner === player1.playerId && (
              <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playerSelector,
              selectedWinner === player2.playerId && styles.selectedPlayer,
            ]}
            onPress={() => setSelectedWinner(player2.playerId)}
          >
            {splitDoublesName(player2.playerName) ? (
              <View style={styles.doublesNameContainer}>
                <Text style={styles.playerName} numberOfLines={1} ellipsizeMode='tail'>
                  {splitDoublesName(player2.playerName)!.player1}
                </Text>
                <Text style={styles.doublesSlash}>/</Text>
                <Text style={styles.playerName} numberOfLines={1} ellipsizeMode='tail'>
                  {splitDoublesName(player2.playerName)!.player2}
                </Text>
              </View>
            ) : (
              <Text style={styles.playerName}>{player2.playerName}</Text>
            )}
            {selectedWinner === player2.playerId && (
              <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scoreContainer}>
        {/* Header */}
        <View style={styles.scoreHeader}>
          {splitDoublesName(player1.playerName) ? (
            <View style={styles.headerDoublesNameContainer}>
              <Text style={styles.playerHeaderName} numberOfLines={1} ellipsizeMode='tail'>
                {splitDoublesName(player1.playerName)!.player1}
              </Text>
              <Text style={styles.headerDoublesSlash}>/</Text>
              <Text style={styles.playerHeaderName} numberOfLines={1} ellipsizeMode='tail'>
                {splitDoublesName(player1.playerName)!.player2}
              </Text>
            </View>
          ) : (
            <Text style={styles.playerHeaderName}>{player1.playerName}</Text>
          )}
          {splitDoublesName(player2.playerName) ? (
            <View style={styles.headerDoublesNameContainer}>
              <Text style={styles.playerHeaderName} numberOfLines={1} ellipsizeMode='tail'>
                {splitDoublesName(player2.playerName)!.player1}
              </Text>
              <Text style={styles.headerDoublesSlash}>/</Text>
              <Text style={styles.playerHeaderName} numberOfLines={1} ellipsizeMode='tail'>
                {splitDoublesName(player2.playerName)!.player2}
              </Text>
            </View>
          ) : (
            <Text style={styles.playerHeaderName}>{player2.playerName}</Text>
          )}
        </View>

        {/* Target Score Selection */}
        <View style={styles.targetScoreSection}>
          <Text style={styles.targetScoreLabel}>{t('recordScore.pickleballTargetScore')}</Text>
          <View style={styles.targetScoreButtons}>
            <TouchableOpacity
              style={[styles.targetBtn, targetScore === 11 && styles.targetBtnActive]}
              onPress={() => setTargetScore(11)}
            >
              <Text style={[styles.targetBtnText, targetScore === 11 && styles.targetBtnTextActive]}>
                11 ({t('recordScore.pickleballStandard')})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.targetBtn, targetScore === 15 && styles.targetBtnActive]}
              onPress={() => setTargetScore(15)}
            >
              <Text style={[styles.targetBtnText, targetScore === 15 && styles.targetBtnTextActive]}>
                15
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Games */}
        {games.map((game, gameIndex) => (
          <View key={gameIndex} style={styles.gameRow}>
            <Text style={styles.gameLabel}>
              {matchFormat === 'single_game'
                ? t('recordScore.pickleballGame')
                : `${t('recordScore.pickleballGame')} ${gameIndex + 1}`}
            </Text>

            <View style={styles.scoreInputs}>
              <TextInput
                style={styles.scoreInput}
                value={game.p1}
                onChangeText={text => updateGameScore(gameIndex, 'p1', text)}
                keyboardType='numeric'
                maxLength={2}
                placeholder='0'
              />

              <Text style={styles.scoreSeparator}>-</Text>

              <TextInput
                style={styles.scoreInput}
                value={game.p2}
                onChangeText={text => updateGameScore(gameIndex, 'p2', text)}
                keyboardType='numeric'
                maxLength={2}
                placeholder='0'
              />
            </View>
          </View>
        ))}

        <Text style={styles.winBy2Hint}>{t('recordScore.pickleballWinBy2Hint')}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name='close' size={24} color='#666' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('recordScore.title')}</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.submitText}>{t('recordScore.submit')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Match Format Selector */}
          <View style={styles.formatContainer}>
            <Text style={styles.sectionTitle}>{t('recordScore.pickleballFormat')}</Text>
            <View style={styles.formatButtons}>
              <TouchableOpacity
                style={[styles.formatButton, matchFormat === 'single_game' && styles.activeFormat]}
                onPress={() => {
                  setMatchFormat('single_game');
                  setGames([{ p1: '', p2: '' }]);
                }}
              >
                <Text
                  style={[
                    styles.formatText,
                    matchFormat === 'single_game' && styles.activeFormatText,
                  ]}
                >
                  {t('recordScore.pickleballSingleGame')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatButton, matchFormat === 'best_of_3' && styles.activeFormat]}
                onPress={() => {
                  setMatchFormat('best_of_3');
                  setGames([
                    { p1: '', p2: '' },
                    { p1: '', p2: '' },
                  ]);
                }}
              >
                <Text
                  style={[
                    styles.formatText,
                    matchFormat === 'best_of_3' && styles.activeFormatText,
                  ]}
                >
                  {t('recordScore.pickleballBestOf3')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Match Type Selector */}
          <View style={styles.matchTypeContainer}>
            <Text style={styles.sectionTitle}>{t('recordScore.matchResultType')}</Text>
            <View style={styles.matchTypeButtons}>
              <TouchableOpacity
                style={[styles.matchTypeButton, matchType === 'completed' && styles.activeMatchType]}
                onPress={() => setMatchType('completed')}
              >
                <Text
                  style={[
                    styles.matchTypeText,
                    matchType === 'completed' && styles.activeMatchTypeText,
                  ]}
                >
                  {t('recordScore.completed')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.matchTypeButton, matchType === 'retired' && styles.activeMatchType]}
                onPress={() => setMatchType('retired')}
              >
                <Text
                  style={[
                    styles.matchTypeText,
                    matchType === 'retired' && styles.activeMatchTypeText,
                  ]}
                >
                  {t('recordScore.retired')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.matchTypeButton, matchType === 'walkover' && styles.activeMatchType]}
                onPress={() => setMatchType('walkover')}
              >
                <Text
                  style={[
                    styles.matchTypeText,
                    matchType === 'walkover' && styles.activeMatchTypeText,
                  ]}
                >
                  {t('recordScore.walkover')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {renderScoreInput()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  formatContainer: {
    marginBottom: 24,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeFormat: {
    backgroundColor: '#4CAF50',
  },
  formatText: {
    fontSize: 14,
    color: '#666',
  },
  activeFormatText: {
    color: 'white',
    fontWeight: '500',
  },
  matchTypeContainer: {
    marginBottom: 24,
  },
  matchTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  matchTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeMatchType: {
    backgroundColor: '#4CAF50',
  },
  matchTypeText: {
    fontSize: 14,
    color: '#666',
  },
  activeMatchTypeText: {
    color: 'white',
    fontWeight: '500',
  },
  scoreContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  playerHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  targetScoreSection: {
    marginBottom: 20,
  },
  targetScoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  targetScoreButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  targetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  targetBtnActive: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  targetBtnText: {
    fontSize: 14,
    color: '#666',
  },
  targetBtnTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  gameRow: {
    marginBottom: 16,
  },
  gameLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scoreInput: {
    width: 70,
    height: 50,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    backgroundColor: 'white',
  },
  scoreSeparator: {
    fontSize: 22,
    fontWeight: '600',
    color: '#666',
  },
  winBy2Hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  walkoverContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  walkoverTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  playerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedPlayer: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  doublesNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    maxWidth: 140,
    flex: 1,
  },
  doublesSlash: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 2,
  },
  headerDoublesNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    maxWidth: 120,
  },
  headerDoublesSlash: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 2,
  },
});

export default ScoreInputModal;
