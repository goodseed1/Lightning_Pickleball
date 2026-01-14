import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Card, Button, Chip } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import leagueService from '../services/leagueService';
import { League, LeagueMatch } from '../types/league';
import { RootStackParamList } from '../navigation/AppNavigator';

type ManageLeagueParticipantsScreenRouteProp = RouteProp<
  RootStackParamList,
  'ManageLeagueParticipants'
>;
type ManageLeagueParticipantsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ManageLeagueParticipants'
>;

// Extended LeagueMatch with optional players array for compatibility
interface ExtendedLeagueMatch extends LeagueMatch {
  players?: Array<{
    userId: string;
    name: string;
  }>;
}

const ManageLeagueParticipantsScreen = () => {
  const navigation = useNavigation<ManageLeagueParticipantsScreenNavigationProp>();
  const route = useRoute<ManageLeagueParticipantsScreenRouteProp>();
  const { paperTheme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(paperTheme.colors);

  // Get params
  const { leagueId, leagueName } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [, setLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<ExtendedLeagueMatch[]>([]);

  // 경기 관리 상태
  const [showMatchEditModal, setShowMatchEditModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<ExtendedLeagueMatch | null>(null);
  const [editingResult, setEditingResult] = useState({
    sets: [{ player1Games: 0, player2Games: 0 }],
    winnerId: '',
    finalScore: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load league info
      const leagueData = await leagueService.getLeague(leagueId);
      setLeague(leagueData);

      // Load matches directly
      const leagueMatches = await leagueService.getLeagueMatches(leagueId);

      // Transform match data to ensure player names are available
      const transformedMatches: ExtendedLeagueMatch[] = leagueMatches.map(match => {
        const extendedMatch = match as ExtendedLeagueMatch;
        const players = extendedMatch.players || [];
        return {
          ...extendedMatch,
          player1Id: players[0]?.userId || extendedMatch.player1Id,
          player1Name: players[0]?.name || extendedMatch.player1Name,
          player2Id: players[1]?.userId || extendedMatch.player2Id,
          player2Name: players[1]?.name || extendedMatch.player2Name,
        };
      });

      setMatches(transformedMatches);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(t('common.error'), t('manageLeagueParticipants.errors.loadDataFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leagueId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadMatches = async () => {
    try {
      const leagueMatches = await leagueService.getLeagueMatches(leagueId);

      // Transform match data to ensure player names are available
      const transformedMatches: ExtendedLeagueMatch[] = leagueMatches.map(match => {
        const extendedMatch = match as ExtendedLeagueMatch;
        const players = extendedMatch.players || [];
        return {
          ...extendedMatch,
          player1Id: players[0]?.userId || extendedMatch.player1Id,
          player1Name: players[0]?.name || extendedMatch.player1Name,
          player2Id: players[1]?.userId || extendedMatch.player2Id,
          player2Name: players[1]?.name || extendedMatch.player2Name,
        };
      });

      setMatches(transformedMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      throw error;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApproveMatch = async (matchId: string) => {
    Alert.alert(
      t('manageLeagueParticipants.approveMatchResult'),
      t('manageLeagueParticipants.confirmApproveMatch'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('manageLeagueParticipants.approve'),
          onPress: async () => {
            try {
              console.log('🐛 DEBUG: About to call approveMatchResult with:', {
                leagueId,
                matchId,
              });
              await leagueService.approveMatchResult(leagueId, matchId);
              console.log('🐛 DEBUG: approveMatchResult completed successfully');
              Alert.alert(t('common.success'), t('manageLeagueParticipants.matchApproved'));
              loadMatches();
            } catch (error) {
              console.error('🐛 DEBUG: Error in handleApproveMatch:', error);
              console.error('🐛 DEBUG: Error type:', typeof error);
              if (error instanceof Error) {
                console.error('🐛 DEBUG: Error message:', error.message);
                console.error('🐛 DEBUG: Error stack:', error.stack);
              }
              Alert.alert(t('common.error'), t('manageLeagueParticipants.errors.approveFailed'));
            }
          },
        },
      ]
    );
  };

  const handleEditMatch = (match: ExtendedLeagueMatch) => {
    setSelectedMatch(match);

    // 기존 결과가 있으면 로드
    if (match.score) {
      setEditingResult({
        sets: match.score.sets || [{ player1Games: 0, player2Games: 0 }],
        winnerId: match.winner || '',
        finalScore: match.score.finalScore || '',
      });
    } else {
      setEditingResult({
        sets: [{ player1Games: 0, player2Games: 0 }],
        winnerId: '',
        finalScore: '',
      });
    }

    setShowMatchEditModal(true);
  };

  const updateSetScore = (setIndex: number, player: 'player1' | 'player2', games: number) => {
    setEditingResult(prev => ({
      ...prev,
      sets: prev.sets.map((set, index) =>
        index === setIndex ? { ...set, [`${player}Games`]: games } : set
      ),
    }));
  };

  const addSet = () => {
    setEditingResult(prev => ({
      ...prev,
      sets: [...prev.sets, { player1Games: 0, player2Games: 0 }],
    }));
  };

  const removeSet = () => {
    if (editingResult.sets.length > 1) {
      setEditingResult(prev => ({
        ...prev,
        sets: prev.sets.slice(0, -1),
      }));
    }
  };

  const calculateWinnerAndScore = () => {
    const sets = editingResult.sets;
    let player1Sets = 0;
    let player2Sets = 0;

    sets.forEach(set => {
      if (set.player1Games > set.player2Games) {
        player1Sets++;
      } else if (set.player2Games > set.player1Games) {
        player2Sets++;
      }
    });

    const winnerId =
      player1Sets > player2Sets ? selectedMatch?.player1Id : selectedMatch?.player2Id;
    const finalScore = sets.map(set => `${set.player1Games}-${set.player2Games}`).join(', ');

    setEditingResult(prev => ({
      ...prev,
      winnerId: winnerId || '',
      finalScore,
    }));
  };

  const saveMatchResult = async () => {
    if (!selectedMatch || !editingResult.winnerId) {
      Alert.alert(t('common.error'), t('manageLeagueParticipants.errors.selectWinner'));
      return;
    }

    setProcessing(true);
    try {
      await leagueService.updateMatchResult(leagueId, selectedMatch.id, editingResult.winnerId, {
        sets: editingResult.sets,
        finalScore: editingResult.finalScore,
      });

      Alert.alert(t('common.success'), t('manageLeagueParticipants.matchResultSaved'), [
        {
          text: t('common.ok'),
          onPress: () => {
            setShowMatchEditModal(false);
            loadMatches();
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving match result:', error);
      Alert.alert(t('common.error'), t('manageLeagueParticipants.errors.saveFailed'));
    } finally {
      setProcessing(false);
    }
  };

  const pendingMatches = matches.filter(m => m.status === 'pending_approval');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');

  const getMatchStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      scheduled: t('manageLeagueParticipants.status.scheduled'),
      in_progress: t('manageLeagueParticipants.status.inProgress'),
      completed: t('manageLeagueParticipants.status.completed'),
      pending_approval: t('manageLeagueParticipants.status.pendingApproval'),
      cancelled: t('manageLeagueParticipants.status.cancelled'),
    };
    return statusMap[status] || status;
  };

  const getMatchStatusColor = (status: string) => {
    // Use color constants from theme/colors.ts
    const warningColor = '#FF9800'; // Warning Amber
    const successColor = '#4CAF50'; // Success Green

    switch (status) {
      case 'scheduled':
        return paperTheme.colors.onSurfaceVariant;
      case 'in_progress':
        return warningColor;
      case 'completed':
        return successColor;
      case 'pending_approval':
        return paperTheme.colors.primary;
      case 'cancelled':
        return paperTheme.colors.error;
      default:
        return paperTheme.colors.onSurfaceVariant;
    }
  };

  const renderMatchCard = (match: ExtendedLeagueMatch) => {
    const isPendingApproval = match.status === 'pending_approval';

    return (
      <Card key={match.id} style={[styles.matchCard, isPendingApproval && styles.pendingMatchCard]}>
        <Card.Content>
          <View style={styles.matchHeader}>
            <View style={styles.playersContainer}>
              <Text style={styles.matchPlayerName}>{match.player1Name}</Text>
              <Text style={styles.vs}>vs</Text>
              <Text style={styles.matchPlayerName}>{match.player2Name}</Text>
            </View>

            <Chip
              style={[
                styles.matchStatusChip,
                { backgroundColor: getMatchStatusColor(match.status) },
              ]}
              textStyle={styles.matchStatusText}
            >
              {getMatchStatusText(match.status)}
            </Chip>
          </View>

          <View style={styles.matchInfo}>
            <View style={styles.matchDetailRow}>
              <Ionicons name='flag-outline' size={16} color={paperTheme.colors.onSurfaceVariant} />
              <Text style={styles.matchDetailText}>
                {t('manageLeagueParticipants.round')} {match.round}
              </Text>
            </View>

            {match.scheduledDate && (
              <View style={styles.matchDetailRow}>
                <Ionicons
                  name='calendar-outline'
                  size={16}
                  color={paperTheme.colors.onSurfaceVariant}
                />
                <Text style={styles.matchDetailText}>
                  {match.scheduledDate.toDate().toLocaleDateString('ko-KR')}
                </Text>
              </View>
            )}

            {match.score && (
              <View style={styles.matchDetailRow}>
                <Ionicons
                  name='trophy-outline'
                  size={16}
                  color={paperTheme.colors.onSurfaceVariant}
                />
                <Text style={styles.matchDetailText}>
                  {match.score.finalScore} - {t('manageLeagueParticipants.winner')}:{' '}
                  {match.winner === match.player1Id ? match.player1Name : match.player2Name}
                </Text>
              </View>
            )}
          </View>

          {isPendingApproval && (
            <View style={styles.matchActions}>
              <Button
                mode='contained'
                onPress={() => handleApproveMatch(match.id)}
                style={styles.approveMatchButton}
                compact
              >
                {t('manageLeagueParticipants.approve')}
              </Button>

              <Button
                mode='outlined'
                onPress={() => handleEditMatch(match)}
                style={styles.editMatchButton}
                compact
              >
                {t('common.edit')}
              </Button>
            </View>
          )}

          {(match.status === 'scheduled' || match.status === 'completed') && (
            <View style={styles.matchActions}>
              <Button
                mode='outlined'
                onPress={() => handleEditMatch(match)}
                style={styles.editMatchButton}
                compact
              >
                {match.status === 'completed'
                  ? t('manageLeagueParticipants.editResult')
                  : t('manageLeagueParticipants.enterResult')}
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={paperTheme.colors.primary} />
          <Text style={styles.loadingText}>{t('manageLeagueParticipants.loadingMatches')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={paperTheme.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('manageLeagueParticipants.title')}</Text>
          <Text style={styles.headerSubtitle}>{leagueName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {pendingMatches.length > 0 && (
          <View style={styles.matchSection}>
            <Text style={styles.sectionTitle}>
              {t('manageLeagueParticipants.pendingApprovalMatches')} ({pendingMatches.length})
            </Text>
            {pendingMatches.map(renderMatchCard)}
          </View>
        )}

        {scheduledMatches.length > 0 && (
          <View style={styles.matchSection}>
            <Text style={styles.sectionTitle}>
              {t('manageLeagueParticipants.scheduledMatches')} ({scheduledMatches.length})
            </Text>
            {scheduledMatches.map(renderMatchCard)}
          </View>
        )}

        {completedMatches.length > 0 && (
          <View style={styles.matchSection}>
            <Text style={styles.sectionTitle}>
              {t('manageLeagueParticipants.completedMatches')} ({completedMatches.length})
            </Text>
            {completedMatches.map(renderMatchCard)}
          </View>
        )}

        {matches.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name='pickleballball-outline'
              size={64}
              color={paperTheme.colors.outline}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>{t('manageLeagueParticipants.noMatches')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('manageLeagueParticipants.noMatchesDescription')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Match Edit Modal */}
      <Modal
        visible={showMatchEditModal}
        animationType='slide'
        transparent={true}
        onRequestClose={() => setShowMatchEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('manageLeagueParticipants.editMatchResult')}</Text>
              <TouchableOpacity
                onPress={() => setShowMatchEditModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name='close' size={24} color={paperTheme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedMatch && (
                <View style={styles.matchInfo}>
                  <Text style={styles.matchInfoText}>
                    {selectedMatch.player1Name} vs {selectedMatch.player2Name}
                  </Text>
                </View>
              )}

              <Text style={styles.sectionLabel}>{t('manageLeagueParticipants.setScores')}</Text>

              {editingResult.sets.map((set, index) => (
                <View key={index} style={styles.setInputContainer}>
                  <Text style={styles.setLabel}>
                    {t('manageLeagueParticipants.set')} {index + 1}
                  </Text>
                  <View style={styles.scoreInputRow}>
                    <View style={styles.scoreInput}>
                      <Text style={styles.playerLabel}>{selectedMatch?.player1Name}</Text>
                      <TextInput
                        style={styles.scoreTextInput}
                        value={set.player1Games.toString()}
                        onChangeText={text => updateSetScore(index, 'player1', parseInt(text) || 0)}
                        keyboardType='numeric'
                        maxLength={2}
                      />
                    </View>

                    <Text style={styles.scoreSeparator}>-</Text>

                    <View style={styles.scoreInput}>
                      <Text style={styles.playerLabel}>{selectedMatch?.player2Name}</Text>
                      <TextInput
                        style={styles.scoreTextInput}
                        value={set.player2Games.toString()}
                        onChangeText={text => updateSetScore(index, 'player2', parseInt(text) || 0)}
                        keyboardType='numeric'
                        maxLength={2}
                      />
                    </View>
                  </View>
                </View>
              ))}

              <View style={styles.setActions}>
                <Button mode='outlined' onPress={addSet} compact>
                  {t('manageLeagueParticipants.addSet')}
                </Button>
                {editingResult.sets.length > 1 && (
                  <Button mode='outlined' onPress={removeSet} compact>
                    {t('manageLeagueParticipants.removeSet')}
                  </Button>
                )}
              </View>

              <Button
                mode='contained'
                onPress={calculateWinnerAndScore}
                style={styles.calculateButton}
              >
                {t('manageLeagueParticipants.calculateWinner')}
              </Button>

              {editingResult.winnerId && (
                <View style={styles.resultPreview}>
                  <Text style={styles.resultLabel}>
                    {t('manageLeagueParticipants.resultPreview')}
                  </Text>
                  <Text style={styles.resultScore}>{editingResult.finalScore}</Text>
                  <Text style={styles.resultWinner}>
                    {t('manageLeagueParticipants.winner')}:{' '}
                    {editingResult.winnerId === selectedMatch?.player1Id
                      ? selectedMatch?.player1Name
                      : selectedMatch?.player2Name}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                mode='outlined'
                onPress={() => setShowMatchEditModal(false)}
                style={styles.modalButton}
                disabled={processing}
              >
                {t('common.cancel')}
              </Button>

              <Button
                mode='contained'
                onPress={saveMatchResult}
                style={styles.modalButton}
                loading={processing}
                disabled={processing || !editingResult.winnerId}
              >
                {t('common.save')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const createStyles = (colors: any) =>
  StyleSheet.create({
    /* eslint-enable @typescript-eslint/no-explicit-any */
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    headerRight: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      margin: 20,
      maxWidth: 400,
      width: '100%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalContent: {
      padding: 20,
    },
    modalMessage: {
      fontSize: 16,
      color: colors.onSurface,
      marginBottom: 16,
      lineHeight: 24,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.onSurface,
      backgroundColor: colors.surface,
      textAlignVertical: 'top',
      minHeight: 80,
    },
    modalActions: {
      flexDirection: 'row',
      padding: 20,
      paddingTop: 0,
      gap: 12,
    },
    modalButton: {
      flex: 1,
      borderRadius: 8,
    },
    matchSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    matchCard: {
      marginBottom: 12,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    pendingMatchCard: {
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer,
    },
    matchHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    playersContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    matchPlayerName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      flex: 1,
    },
    vs: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginHorizontal: 8,
    },
    matchStatusChip: {
      marginLeft: 8,
    },
    matchStatusText: {
      fontSize: 12,
      color: colors.onPrimary,
      fontWeight: '600',
    },
    matchInfo: {
      gap: 6,
      marginBottom: 12,
    },
    matchDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    matchDetailText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    matchActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    approveMatchButton: {
      backgroundColor: colors.success,
      flex: 1,
    },
    editMatchButton: {
      borderColor: colors.primary,
      flex: 1,
    },
    matchInfoText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 16,
    },
    setInputContainer: {
      marginBottom: 16,
    },
    setLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    scoreInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreInput: {
      alignItems: 'center',
      flex: 1,
    },
    playerLabel: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    scoreTextInput: {
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: colors.onSurface,
      backgroundColor: colors.surface,
      textAlign: 'center',
      width: 60,
    },
    scoreSeparator: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginHorizontal: 16,
    },
    setActions: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    calculateButton: {
      backgroundColor: colors.primary,
      marginBottom: 16,
    },
    resultPreview: {
      backgroundColor: colors.surfaceVariant,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    resultLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    resultScore: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    resultWinner: {
      fontSize: 16,
      color: colors.success,
      fontWeight: '600',
    },
  });

export default ManageLeagueParticipantsScreen;
