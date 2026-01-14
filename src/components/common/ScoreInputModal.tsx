/**
 * Score Input Modal Component
 * Modal for entering pickleball match scores with validation
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
  matchFormat?: {
    sets: number; // Best of 3 or 5
    tiebreak: boolean;
  };
}

interface MatchResult {
  winner: string;
  loser: string;
  score: {
    sets: [number, number];
    games: [number, number][];
    tiebreaks?: [number, number][];
  };
  matchType: 'completed' | 'retired' | 'walkover';
}

const ScoreInputModal: React.FC<ScoreInputModalProps> = ({
  visible,
  player1,
  player2,
  onSubmit,
  onClose,
  matchFormat = { sets: 3, tiebreak: true },
}) => {
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
  const [sets, setSets] = useState<Array<[number, number]>>([[0, 0]]);
  const [tiebreaks, setTiebreaks] = useState<Array<[number, number]>>([]);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [matchType, setMatchType] = useState<'completed' | 'retired' | 'walkover'>('completed');

  const resetForm = () => {
    setSets([[0, 0]]);
    setTiebreaks([]);
    setSelectedWinner(null);
    setMatchType('completed');
  };

  const addSet = () => {
    if (sets.length < matchFormat.sets) {
      setSets([...sets, [0, 0]]);
    }
  };

  const updateSetScore = (setIndex: number, playerIndex: number, score: string) => {
    const newSets = [...sets];
    const numScore = parseInt(score) || 0;

    // Validate score
    if (numScore < 0 || numScore > 20) return;

    newSets[setIndex][playerIndex] = numScore;
    setSets(newSets);

    // Check if tiebreak is needed
    if (matchFormat.tiebreak && newSets[setIndex][0] === 6 && newSets[setIndex][1] === 6) {
      // Add tiebreak slot if not exists
      const newTiebreaks = [...tiebreaks];
      if (!newTiebreaks[setIndex]) {
        newTiebreaks[setIndex] = [0, 0];
        setTiebreaks(newTiebreaks);
      }
    }
  };

  const updateTiebreakScore = (setIndex: number, playerIndex: number, score: string) => {
    const newTiebreaks = [...tiebreaks];
    const numScore = parseInt(score) || 0;

    if (numScore < 0 || numScore > 20) return;

    if (!newTiebreaks[setIndex]) {
      newTiebreaks[setIndex] = [0, 0];
    }
    newTiebreaks[setIndex][playerIndex] = numScore;
    setTiebreaks(newTiebreaks);
  };

  const validateScore = (): boolean => {
    if (matchType !== 'completed') return true;

    let player1Sets = 0;
    let player2Sets = 0;

    // Count sets won
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      const tiebreak = tiebreaks[i];

      if (set[0] === 0 && set[1] === 0) continue; // Skip empty sets

      let winner = null;

      if (tiebreak && tiebreak[0] > 0 && tiebreak[1] > 0) {
        // Tiebreak set
        if (set[0] === 6 && set[1] === 6) {
          if (tiebreak[0] >= 7 && tiebreak[0] - tiebreak[1] >= 2) {
            winner = 0;
          } else if (tiebreak[1] >= 7 && tiebreak[1] - tiebreak[0] >= 2) {
            winner = 1;
          }
        }
      } else {
        // Regular set
        if (set[0] >= 6 && set[0] - set[1] >= 2) {
          winner = 0;
        } else if (set[1] >= 6 && set[1] - set[0] >= 2) {
          winner = 1;
        } else if (set[0] === 7 && set[1] === 6) {
          winner = 0;
        } else if (set[1] === 7 && set[0] === 6) {
          winner = 1;
        }
      }

      if (winner === 0) player1Sets++;
      else if (winner === 1) player2Sets++;
    }

    const setsToWin = Math.ceil(matchFormat.sets / 2);

    if (player1Sets < setsToWin && player2Sets < setsToWin) {
      Alert.alert(t('alert.score.invalidScore'), t('alert.score.matchNotComplete'));
      return false;
    }

    // Set winner
    if (player1Sets > player2Sets) {
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

    // Calculate final sets score
    let player1Sets = 0;
    let player2Sets = 0;

    sets.forEach((set, index) => {
      const tiebreak = tiebreaks[index];
      let setWinner = null;

      if (tiebreak && tiebreak[0] > 0 && tiebreak[1] > 0) {
        if (set[0] === 6 && set[1] === 6) {
          if (tiebreak[0] > tiebreak[1]) setWinner = 0;
          else setWinner = 1;
        }
      } else {
        if (set[0] > set[1]) setWinner = 0;
        else if (set[1] > set[0]) setWinner = 1;
      }

      if (setWinner === 0) player1Sets++;
      else if (setWinner === 1) player2Sets++;
    });

    const result: MatchResult = {
      winner,
      loser,
      score: {
        sets: [player1Sets, player2Sets] as [number, number],
        games: sets.filter(set => set[0] > 0 || set[1] > 0) as [number, number][],
        tiebreaks: tiebreaks.filter(tb => tb && (tb[0] > 0 || tb[1] > 0)) as [number, number][],
      },
      matchType,
    };

    onSubmit(result);
    resetForm();
    onClose();
  };

  const renderScoreInput = () => {
    if (matchType === 'walkover') {
      return (
        <View style={styles.walkoverContainer}>
          <Text style={styles.walkoverTitle}>Select Winner</Text>
          <TouchableOpacity
            style={[
              styles.playerSelector,
              selectedWinner === player1.playerId && styles.selectedPlayer,
            ]}
            onPress={() => setSelectedWinner(player1.playerId)}
          >
            {/* 🎯 [KIM FIX] 복식: 각 선수 이름 개별 truncate */}
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
            {/* 🎯 [KIM FIX] 복식: 각 선수 이름 개별 truncate */}
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
          {/* 🎯 [KIM FIX] 복식: 각 선수 이름 개별 truncate */}
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

        {/* Sets */}
        {sets.map((set, setIndex) => (
          <View key={setIndex} style={styles.setRow}>
            <Text style={styles.setLabel}>Set {setIndex + 1}</Text>

            <View style={styles.scoreInputs}>
              <TextInput
                style={styles.scoreInput}
                value={set[0].toString()}
                onChangeText={text => updateSetScore(setIndex, 0, text)}
                keyboardType='numeric'
                maxLength={2}
              />

              <Text style={styles.scoreSeparator}>-</Text>

              <TextInput
                style={styles.scoreInput}
                value={set[1].toString()}
                onChangeText={text => updateSetScore(setIndex, 1, text)}
                keyboardType='numeric'
                maxLength={2}
              />
            </View>

            {/* Tiebreak */}
            {tiebreaks[setIndex] && (
              <View style={styles.tiebreakRow}>
                <Text style={styles.tiebreakLabel}>TB</Text>
                <View style={styles.scoreInputs}>
                  <TextInput
                    style={styles.tiebreakInput}
                    value={tiebreaks[setIndex][0].toString()}
                    onChangeText={text => updateTiebreakScore(setIndex, 0, text)}
                    keyboardType='numeric'
                    maxLength={2}
                  />
                  <Text style={styles.scoreSeparator}>-</Text>
                  <TextInput
                    style={styles.tiebreakInput}
                    value={tiebreaks[setIndex][1].toString()}
                    onChangeText={text => updateTiebreakScore(setIndex, 1, text)}
                    keyboardType='numeric'
                    maxLength={2}
                  />
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Add Set Button */}
        {sets.length < matchFormat.sets && (
          <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
            <Ionicons name='add' size={20} color='#2196F3' />
            <Text style={styles.addSetText}>Add Set</Text>
          </TouchableOpacity>
        )}
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
          <Text style={styles.headerTitle}>Enter Score</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Match Type Selector */}
          <View style={styles.matchTypeContainer}>
            <Text style={styles.sectionTitle}>Match Result Type</Text>
            <View style={styles.matchTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.matchTypeButton,
                  matchType === 'completed' && styles.activeMatchType,
                ]}
                onPress={() => setMatchType('completed')}
              >
                <Text
                  style={[
                    styles.matchTypeText,
                    matchType === 'completed' && styles.activeMatchTypeText,
                  ]}
                >
                  Completed
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
                  Retired
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
                  Walkover
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
    color: '#2196F3',
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
    backgroundColor: '#2196F3',
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
  setRow: {
    marginBottom: 16,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scoreInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'white',
  },
  scoreSeparator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  tiebreakRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  tiebreakLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  tiebreakInput: {
    width: 50,
    height: 32,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#f8f9fa',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addSetText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 8,
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
  // 🎯 [KIM FIX] 복식 선수 이름 스타일
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
