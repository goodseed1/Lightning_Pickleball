/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card, Title, Paragraph, Button, Avatar, RadioButton } from 'react-native-paper';

import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import leagueService from '../services/leagueService';
import userService from '../services/userService';
import { PlayerStanding } from '../types/league';
import { LeagueCompletedModal } from '../components/modals/LeagueCompletedModal';

interface ParticipantInfo {
  userId: string;
  displayName: string;
  email?: string;
  ltrLevel?: number;
  profileImage?: string;
  standing?: PlayerStanding;
}

// Extended LeagueParticipant for local processing
interface ExtendedLeagueParticipant {
  id: string;
  leagueId: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  status: string;
  appliedAt: Date;
}

// User profile type from userService
interface UserProfile {
  displayName?: string;
  email?: string;
  ltrLevel?: number;
  profileImage?: string;
}

const ConcludeLeagueScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { t: translate } = useTranslation();

  // Get params
  const { leagueId, leagueName } = route.params as { leagueId: string; leagueName: string };

  const [loading, setLoading] = useState(true);
  const [concluding, setConcluding] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [selectedRunnerUp, setSelectedRunnerUp] = useState<string>('');
  const [isPlayoffCompleted, setIsPlayoffCompleted] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [completedData, setCompletedData] = useState<{
    winner: {
      playerId: string;
      playerName: string;
      finalPoints: number;
      finalRecord: string;
    };
    runnerUp?: {
      playerId: string;
      playerName: string;
      finalPoints: number;
      finalRecord: string;
    };
    leagueName: string;
  } | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 리그 정보 로드
      const leagueData = await leagueService.getLeague(leagueId);

      if (!leagueData) {
        throw new Error('League not found');
      }

      // 플레이오프 완료 상태 확인
      if (leagueData.playoff?.isComplete && leagueData.playoff.winner) {
        setIsPlayoffCompleted(true);
        setSelectedWinner(leagueData.playoff.winner);
        if (leagueData.playoff.runnerUp) {
          setSelectedRunnerUp(leagueData.playoff.runnerUp);
        }
      }

      console.log('🏆 DEBUG: ConcludeLeagueScreen loadData');
      console.log('🏆 DEBUG: leagueData.participants:', leagueData.participants);
      console.log('🏆 DEBUG: leagueData.standings:', leagueData.standings);

      // 확정된 참가자들의 정보 로드
      const confirmedParticipants = await leagueService.getLeagueParticipants(
        leagueId,
        'confirmed'
      );
      console.log(
        '🏆 DEBUG: confirmedParticipants from league_participants collection:',
        confirmedParticipants
      );

      // If no confirmed participants in league_participants collection, try to get from standings
      let participantsToProcess: ExtendedLeagueParticipant[] = confirmedParticipants.map(p => ({
        id: p.id,
        leagueId: p.leagueId,
        userId: p.userId,
        userDisplayName: p.userDisplayName || '',
        userEmail: p.userEmail || '',
        status: p.status,
        appliedAt: p.appliedAt instanceof Date ? p.appliedAt : p.appliedAt.toDate(),
      }));

      if (
        confirmedParticipants.length === 0 &&
        leagueData.standings &&
        leagueData.standings.length > 0
      ) {
        console.log('🏆 DEBUG: No confirmed participants found, using standings data');
        // Create pseudo participants from standings
        participantsToProcess = leagueData.standings.map(standing => ({
          id: standing.playerId,
          leagueId: leagueId,
          userId: standing.playerId,
          userDisplayName: standing.playerName || `Player ${standing.playerId.slice(-4)}`,
          userEmail: '',
          status: 'confirmed',
          appliedAt: new Date(),
        }));
        console.log('🏆 DEBUG: Created pseudo participants from standings:', participantsToProcess);
      }

      // If still no participants, extract from league matches
      if (participantsToProcess.length === 0) {
        console.log('🏆 DEBUG: No participants found in collections, extracting from matches');
        const leagueMatches = await leagueService.getLeagueMatches(leagueId);
        console.log(
          '🏆 DEBUG: Retrieved matches for participant extraction:',
          leagueMatches.length
        );

        if (leagueMatches.length > 0) {
          // Log match data for debugging
          console.log(
            '🏆 DEBUG: First match data sample:',
            JSON.stringify(leagueMatches[0], null, 2)
          );

          // Extract unique participants from all matches
          const participantMap = new Map<string, ExtendedLeagueParticipant>();

          leagueMatches.forEach(match => {
            console.log('🏆 DEBUG: Processing match:', {
              player1Id: match.player1Id,
              player2Id: match.player2Id,
              player1Name: match.player1Name,
              player2Name: match.player2Name,
            });

            // Extract player1
            if (match.player1Id && !participantMap.has(match.player1Id)) {
              participantMap.set(match.player1Id, {
                id: match.player1Id,
                leagueId: leagueId,
                userId: match.player1Id,
                userDisplayName: match.player1Name || `Player ${match.player1Id.slice(-4)}`,
                userEmail: '',
                status: 'confirmed',
                appliedAt: new Date(),
              });
            }

            // Extract player2
            if (match.player2Id && !participantMap.has(match.player2Id)) {
              participantMap.set(match.player2Id, {
                id: match.player2Id,
                leagueId: leagueId,
                userId: match.player2Id,
                userDisplayName: match.player2Name || `Player ${match.player2Id.slice(-4)}`,
                userEmail: '',
                status: 'confirmed',
                appliedAt: new Date(),
              });
            }
          });

          participantsToProcess = Array.from(participantMap.values());
          console.log('🏆 DEBUG: Extracted participants from matches:', participantsToProcess);

          // Generate standings from match results
          const generatedStandings = generateStandingsFromMatches(
            leagueMatches,
            participantsToProcess
          );
          console.log('🏆 DEBUG: Generated standings from matches:', generatedStandings);

          // Update league data with generated standings
          leagueData.standings = generatedStandings;
        }
      }

      const participantsInfo = await Promise.all(
        participantsToProcess.map(async participant => {
          try {
            const userProfile = (await userService.getUserProfile(
              participant.userId
            )) as UserProfile;
            const standing = leagueData.standings.find(s => s.playerId === participant.userId);

            return {
              userId: participant.userId,
              displayName:
                userProfile.displayName ||
                participant.userDisplayName ||
                standing?.playerName ||
                translate('common.unknown'),
              email: userProfile.email || participant.userEmail,
              ltrLevel: userProfile.ltrLevel,
              profileImage: userProfile.profileImage,
              standing,
            };
          } catch (error) {
            console.warn(`Could not load user info for ${participant.userId}:`, error);
            const standing = leagueData.standings.find(s => s.playerId === participant.userId);

            return {
              userId: participant.userId,
              displayName:
                participant.userDisplayName || standing?.playerName || translate('common.unknown'),
              email: participant.userEmail,
              ltrLevel: undefined,
              profileImage: undefined,
              standing,
            };
          }
        })
      );

      // 순위 순으로 정렬
      const sortedParticipants = participantsInfo.sort((a, b) => {
        if (!a.standing) return 1;
        if (!b.standing) return -1;
        return a.standing.position - b.standing.position;
      });

      setParticipants(sortedParticipants);

      // 자동으로 1위를 우승자, 2위를 준우승자로 선택
      if (sortedParticipants.length >= 1 && sortedParticipants[0].standing) {
        setSelectedWinner(sortedParticipants[0].userId);
      }
      if (sortedParticipants.length >= 2 && sortedParticipants[1].standing) {
        setSelectedRunnerUp(sortedParticipants[1].userId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(t('common.error'), t('concludeLeague.errors.loadData'));
    } finally {
      setLoading(false);
    }
  };

  const generateStandingsFromMatches = (
    matches: Array<{ status: string; _winner?: string; player1Id: string; player2Id: string }>,
    participants: ExtendedLeagueParticipant[]
  ) => {
    // Initialize standings for all participants
    const standingsMap = new Map();

    participants.forEach(participant => {
      standingsMap.set(participant.userId, {
        playerId: participant.userId,
        playerName: participant.userDisplayName,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        position: 0,
      });
    });

    // Process completed matches to calculate stats
    matches.forEach(match => {
      if (match.status === 'completed' && match._winner) {
        const player1Id = match.player1Id;
        const player2Id = match.player2Id;
        const player1Standing = standingsMap.get(player1Id);
        const player2Standing = standingsMap.get(player2Id);

        if (player1Standing && player2Standing) {
          player1Standing.played++;
          player2Standing.played++;

          if (match._winner === player1Id) {
            player1Standing.won++;
            player1Standing.points += 3; // 3 points for win
            player2Standing.lost++;
          } else if (match._winner === player2Id) {
            player2Standing.won++;
            player2Standing.points += 3; // 3 points for win
            player1Standing.lost++;
          }
        }
      }
    });

    // Convert to array and sort by points, then by wins
    const standings = Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      return a.lost - b.lost;
    });

    // Assign positions
    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    return standings;
  };

  const handleConcludeLeague = async () => {
    if (!selectedWinner) {
      Alert.alert(t('common.error'), t('concludeLeague.errors.selectWinner'));
      return;
    }

    if (selectedWinner === selectedRunnerUp) {
      Alert.alert(t('common.error'), t('concludeLeague.errors.differentParticipants'));
      return;
    }

    const winnerName = participants.find(p => p.userId === selectedWinner)?.displayName;
    const runnerUpName = participants.find(p => p.userId === selectedRunnerUp)?.displayName;

    Alert.alert(
      t('concludeLeague.confirmTitle'),
      runnerUpName
        ? t('concludeLeague.confirmMessage', { leagueName, winnerName, runnerUpName })
        : t('concludeLeague.confirmMessageNoRunnerUp', { leagueName, winnerName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('concludeLeague.confirmButton'),
          style: 'destructive',
          onPress: performConcludeLeague,
        },
      ]
    );
  };

  const performConcludeLeague = async () => {
    setConcluding(true);
    try {
      // Server determines winner/runner-up automatically from standings
      await leagueService.completeLeague(leagueId);

      // Get winner and runner-up details
      const winner = participants.find(p => p.userId === selectedWinner);
      const runnerUp = selectedRunnerUp
        ? participants.find(p => p.userId === selectedRunnerUp)
        : undefined;

      if (winner) {
        // Format record string (e.g., "10W-2D-1L")
        const formatRecord = (standing?: PlayerStanding) => {
          if (!standing) return '0W-0L';
          const draws = standing.played - standing.won - standing.lost;
          return draws > 0
            ? `${standing.won}W-${draws}D-${standing.lost}L`
            : `${standing.won}W-${standing.lost}L`;
        };

        // Show completion modal
        setCompletedData({
          winner: {
            playerId: winner.userId,
            playerName: winner.displayName,
            finalPoints: winner.standing?.points || 0,
            finalRecord: formatRecord(winner.standing),
          },
          runnerUp: runnerUp
            ? {
                playerId: runnerUp.userId,
                playerName: runnerUp.displayName,
                finalPoints: runnerUp.standing?.points || 0,
                finalRecord: formatRecord(runnerUp.standing),
              }
            : undefined,
          leagueName: leagueName,
        });
        setShowCompletedModal(true);
      } else {
        // Fallback to old alert if winner not found
        Alert.alert(t('common.success'), t('concludeLeague.successMessage'), [
          {
            text: t('common.ok'),
            onPress: () => {
              navigation.goBack();
              navigation.goBack(); // 관리자 화면으로 돌아가기
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error concluding league:', error);
      Alert.alert(t('common.error'), t('concludeLeague.errors.concluding'));
    } finally {
      setConcluding(false);
    }
  };

  const renderParticipantCard = (participant: ParticipantInfo) => {
    const isWinner = selectedWinner === participant.userId;
    const isRunnerUp = selectedRunnerUp === participant.userId;

    return (
      <Card
        key={participant.userId}
        style={[
          styles.participantCard,
          isWinner && styles.winnerCard,
          isRunnerUp && styles.runnerUpCard,
        ]}
      >
        <Card.Content>
          <View style={styles.participantHeader}>
            <View style={styles.participantInfo}>
              <View style={styles.rankContainer}>
                {participant.standing && (
                  <View
                    style={[
                      styles.rankBadge,
                      participant.standing.position === 1 && styles.firstPlace,
                      participant.standing.position === 2 && styles.secondPlace,
                      participant.standing.position === 3 && styles.thirdPlace,
                    ]}
                  >
                    <Text style={styles.rankText}>{participant.standing.position}</Text>
                  </View>
                )}
              </View>

              <Avatar.Text
                size={48}
                label={participant.displayName.charAt(0)}
                style={[styles.avatar, isWinner && styles.winnerAvatar]}
              />

              <View style={styles.nameContainer}>
                <Text style={styles.participantName}>{participant.displayName}</Text>
                {participant.email && (
                  <Text style={styles.participantEmail}>{participant.email}</Text>
                )}
                {participant.ltrLevel && (
                  <Text style={styles.ltrLevel}>LTR {participant.ltrLevel}</Text>
                )}
              </View>
            </View>

            {participant.standing && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {t('concludeLeague.stats.record', {
                    wins: participant.standing.won,
                    losses: participant.standing.lost,
                  })}
                </Text>
                <Text style={styles.pointsText}>
                  {t('concludeLeague.stats.points', { points: participant.standing.points })}
                </Text>
              </View>
            )}
          </View>

          {/* 플레이오프 완료 상태에서는 라디오 버튼 대신 최종 결과 표시 */}
          {isPlayoffCompleted ? (
            <View style={styles.finalResultContainer}>
              {isWinner && (
                <View style={styles.winnerBadge}>
                  <Ionicons name='trophy' size={16} color='#FFD700' />
                  <Text style={styles.winnerBadgeText}>{t('concludeLeague.labels.winner')}</Text>
                </View>
              )}
              {isRunnerUp && (
                <View style={styles.runnerUpBadge}>
                  <Ionicons name='medal' size={16} color='#C0C0C0' />
                  <Text style={styles.runnerUpBadgeText}>
                    {t('concludeLeague.labels.runnerUp')}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.selectionContainer}>
              <View style={styles.selectionRow}>
                <RadioButton
                  value={participant.userId}
                  status={selectedWinner === participant.userId ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedWinner(participant.userId)}
                  color='#ff9800'
                />
                <Text style={styles.selectionLabel}>{t('concludeLeague.labels.winner')}</Text>
              </View>

              <View style={styles.selectionRow}>
                <RadioButton
                  value={participant.userId}
                  status={selectedRunnerUp === participant.userId ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedRunnerUp(participant.userId)}
                  color='#9e9e9e'
                />
                <Text style={styles.selectionLabel}>{t('concludeLeague.labels.runnerUp')}</Text>
              </View>
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
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>{t('concludeLeague.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color='#333' />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('concludeLeague.title')}</Text>
          <Text style={styles.headerSubtitle}>{leagueName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Ionicons
          name={isPlayoffCompleted ? 'trophy' : 'information-circle'}
          size={20}
          color={isPlayoffCompleted ? '#FFD700' : '#1976d2'}
        />
        <Text style={styles.instructionsText}>
          {isPlayoffCompleted
            ? t('concludeLeague.errors.differentParticipants')
              ? '플레이오프가 완료되어 최종 우승자가 결정되었습니다! 리그를 종료하여 공식 결과를 확정하세요.'
              : 'Playoff completed and final winner has been determined! Conclude the league to finalize the official results.'
            : t('concludeLeague.errors.differentParticipants')
              ? '순위를 기준으로 우승자와 준우승자를 선택하세요. 선택 완료 후 자동으로 배지가 수여되고 클럽 공지가 생성됩니다.'
              : 'Select winner and runner-up based on rankings. Badges will be automatically awarded and club announcement will be created.'}
        </Text>
      </View>

      {/* Participants List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {participants.length > 0 ? (
          participants.map(renderParticipantCard)
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name='people-outline' size={64} color='#ddd' />
              <Title style={styles.emptyTitle}>
                {t('concludeLeague.errors.differentParticipants')
                  ? '확정된 참가자가 없습니다'
                  : 'No confirmed participants'}
              </Title>
              <Paragraph style={styles.emptyText}>
                {t('concludeLeague.errors.differentParticipants')
                  ? '참가자가 확정되지 않아 리그를 종료할 수 없습니다'
                  : 'Cannot conclude league without confirmed participants'}
              </Paragraph>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Action Button */}
      {participants.length > 0 && (
        <View style={styles.actionContainer}>
          <Button
            mode='contained'
            onPress={handleConcludeLeague}
            style={styles.concludeButton}
            contentStyle={styles.concludeButtonContent}
            loading={concluding}
            disabled={concluding || !selectedWinner}
          >
            <Ionicons name='trophy' size={20} color='#fff' />
            <Text style={styles.concludeButtonText}>{t('concludeLeague.button')}</Text>
          </Button>
        </View>
      )}

      {/* Completion Modal */}
      {completedData && (
        <LeagueCompletedModal
          visible={showCompletedModal}
          onClose={() => {
            setShowCompletedModal(false);
            navigation.goBack();
            navigation.goBack(); // 관리자 화면으로 돌아가기
          }}
          winner={completedData.winner}
          runnerUp={completedData.runnerUp}
          leagueName={completedData.leagueName}
          onViewFeed={() => {
            navigation.navigate('Feed' as never);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  participantCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  winnerCard: {
    borderWidth: 2,
    borderColor: '#ff9800',
    backgroundColor: '#fff8e1',
  },
  runnerUpCard: {
    borderWidth: 2,
    borderColor: '#9e9e9e',
    backgroundColor: '#f5f5f5',
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstPlace: {
    backgroundColor: '#ff9800',
  },
  secondPlace: {
    backgroundColor: '#9e9e9e',
  },
  thirdPlace: {
    backgroundColor: '#795548',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatar: {
    backgroundColor: '#1976d2',
  },
  winnerAvatar: {
    backgroundColor: '#ff9800',
  },
  nameContainer: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  ltrLevel: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  pointsText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
    marginTop: 2,
  },
  selectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  concludeButton: {
    backgroundColor: '#ff9800',
    borderRadius: 8,
  },
  concludeButtonContent: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  concludeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // 플레이오프 완료 상태 스타일
  finalResultContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3C4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  winnerBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57C00',
    marginLeft: 6,
  },
  runnerUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  runnerUpBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#757575',
    marginLeft: 6,
  },
});

export default ConcludeLeagueScreen;
