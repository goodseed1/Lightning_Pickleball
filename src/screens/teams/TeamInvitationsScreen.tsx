/**
 * 🏛️ TEAM INVITATIONS SCREEN
 * 팀 초대 수락/거절 화면
 *
 * 파트너가 보낸 팀 초대를 확인하고 수락하거나 거절할 수 있는 화면입니다.
 * 마치 결혼식 초대장에 RSVP를 보내는 것처럼요! 💌
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text as PaperText, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import teamService from '../../services/teamService';
import { Team, getInviteHoursRemaining } from '../../types/team';

const TeamInvitationsScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors);

  // State
  const [pendingInvites, setPendingInvites] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingTeamId, setProcessingTeamId] = useState<string | null>(null);

  // 초대 목록 불러오기
  const loadInvitations = async () => {
    if (!currentUser?.uid) return;

    try {
      console.log('🏛️ [TEAM INVITATIONS] Loading invitations for user:', currentUser.uid);
      const overview = await teamService.getUserTeamsOverview(currentUser.uid);
      setPendingInvites(overview.pendingInvitesReceived);
      console.log(
        '✅ [TEAM INVITATIONS] Loaded:',
        overview.pendingInvitesReceived.length,
        'invites'
      );
    } catch (error) {
      console.error('❌ [TEAM INVITATIONS] Error loading invitations:', error);
      Alert.alert(t('teamInvitations.error'), t('teamInvitations.loadingError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 실시간 구독 설정
  useEffect(() => {
    if (!currentUser?.uid) return;

    console.log('🏛️ [TEAM INVITATIONS] Setting up real-time subscription');

    // 실시간 초대 구독
    const unsubscribe = teamService.subscribeToUserPendingInvites(currentUser.uid, invites => {
      console.log('🔔 [TEAM INVITATIONS] Real-time update:', invites.length, 'invites');
      setPendingInvites(invites);
      setLoading(false);
    });

    return () => {
      console.log('🏛️ [TEAM INVITATIONS] Cleaning up subscription');
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // 새로고침
  const handleRefresh = () => {
    setRefreshing(true);
    loadInvitations();
  };

  // 초대 수락
  const handleAccept = async (team: Team) => {
    if (!currentUser?.uid) return;

    try {
      setProcessingTeamId(team.id);

      console.log('✅ [TEAM INVITATIONS] Accepting team invite:', team.id);

      await teamService.acceptTeamInvite(team.id, currentUser.uid);

      // 🔔 Phase 2: Check if this is a league team (has leagueId)
      // If yes, automatically apply for the league
      const teamData = team as Team & { leagueId?: string };
      if (teamData.leagueId) {
        console.log(
          '🏆 [LEAGUE AUTO-APPLY] League team accepted, applying for league:',
          teamData.leagueId
        );

        try {
          // Import leagueService dynamically to avoid circular dependency
          const { default: leagueService } = await import('../../services/leagueService');
          await leagueService.applyForLeagueAsTeam(teamData.leagueId, team.id);

          console.log('✅ [LEAGUE AUTO-APPLY] League application completed');

          Alert.alert(
            t('teamInvitations.leagueAppliedTitle'),
            t('teamInvitations.leagueAppliedMessage', { playerName: team.player1.playerName }),
            [{ text: t('teamInvitations.ok') }]
          );
        } catch (leagueError) {
          const errorMessage =
            leagueError instanceof Error ? leagueError.message : String(leagueError);

          // ✅ Check if it's a "already applied" error (this is actually success!)
          if (errorMessage.includes('already applied')) {
            console.log('✅ [LEAGUE AUTO-APPLY] Team already applied, treating as success');

            Alert.alert(
              t('teamInvitations.leagueAppliedTitle'),
              t('teamInvitations.leagueAlreadyAppliedMessage', {
                playerName: team.player1.playerName,
              }),
              [{ text: t('teamInvitations.ok') }]
            );
          } else {
            // Real error
            console.error('❌ [LEAGUE AUTO-APPLY] Failed to apply for league:', leagueError);

            Alert.alert(
              t('teamInvitations.leagueApplicationFailedTitle'),
              t('teamInvitations.leagueApplicationFailedMessage', {
                playerName: team.player1.playerName,
              }),
              [{ text: t('teamInvitations.ok') }]
            );
          }
        }
      } else {
        // Tournament team (original behavior)
        Alert.alert(
          t('teamInvitations.teamConfirmedTitle'),
          t('teamInvitations.teamConfirmedMessage', { playerName: team.player1.playerName }),
          [
            {
              text: t('teamInvitations.ok'),
              onPress: () => {
                // 토너먼트 화면으로 이동
                navigation.navigate('ClubDetail', {
                  clubId: team.tournamentId, // TODO: Need to get clubId from tournament
                  initialTab: 'tournaments',
                });
              },
            },
          ]
        );
      }
    } catch (error: unknown) {
      console.error('❌ [TEAM INVITATIONS] Error accepting invite:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('teamInvitations.unknownError');
      Alert.alert(
        t('teamInvitations.acceptFailed'),
        t('teamInvitations.acceptError', { errorMessage })
      );
    } finally {
      setProcessingTeamId(null);
    }
  };

  // 초대 거절
  const handleReject = async (team: Team) => {
    if (!currentUser?.uid) return;

    Alert.alert(
      t('teamInvitations.rejectInvitation'),
      t('teamInvitations.rejectConfirmMessage', { playerName: team.player1.playerName }),
      [
        {
          text: t('teamInvitations.cancel'),
          style: 'cancel',
        },
        {
          text: t('teamInvitations.reject'),
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingTeamId(team.id);

              console.log('❌ [TEAM INVITATIONS] Rejecting team invite:', team.id);

              await teamService.rejectTeamInvite(team.id, currentUser.uid);

              Alert.alert(
                t('teamInvitations.invitationRejected'),
                t('teamInvitations.invitationRejectedMessage')
              );
            } catch (error: unknown) {
              console.error('❌ [TEAM INVITATIONS] Error rejecting invite:', error);
              const errorMessage =
                error instanceof Error ? error.message : t('teamInvitations.unknownError');
              Alert.alert(
                t('teamInvitations.rejectFailed'),
                t('teamInvitations.rejectError', { errorMessage })
              );
            } finally {
              setProcessingTeamId(null);
            }
          },
        },
      ]
    );
  };

  // 로딩 화면
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name='arrow-back' size={24} color={themeColors.colors.onSurface} />
          </TouchableOpacity>
          <PaperText variant='titleLarge' style={styles.headerTitle}>
            {t('teamInvitations.title')}
          </PaperText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary} />
          <PaperText style={styles.loadingText}>
            {t('teamInvitations.loadingInvitations')}
          </PaperText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={themeColors.colors.onSurface} />
        </TouchableOpacity>
        <PaperText variant='titleLarge' style={styles.headerTitle}>
          {t('teamInvitations.title')}
        </PaperText>
        <Chip style={styles.badge} textStyle={styles.badgeText}>
          {pendingInvites.length}
        </Chip>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[themeColors.colors.primary]}
          />
        }
      >
        {/* 초대 목록 */}
        {pendingInvites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name='mail-open-outline'
              size={64}
              color={themeColors.colors.onSurfaceVariant}
            />
            <PaperText variant='titleMedium' style={styles.emptyTitle}>
              {t('teamInvitations.noInvitations')}
            </PaperText>
            <PaperText variant='bodyMedium' style={styles.emptyText}>
              {t('teamInvitations.noInvitationsMessage')}
            </PaperText>
          </View>
        ) : (
          pendingInvites.map(team => {
            const hoursRemaining = getInviteHoursRemaining(team);
            const isProcessing = processingTeamId === team.id;

            return (
              <Card key={team.id} style={styles.inviteCard}>
                <Card.Content>
                  {/* 초대자 정보 */}
                  <View style={styles.inviterSection}>
                    <View style={styles.inviterAvatar}>
                      <Ionicons name='person-circle' size={48} color={themeColors.colors.primary} />
                    </View>
                    <View style={styles.inviterInfo}>
                      <PaperText variant='titleMedium' style={styles.inviterName}>
                        {team.player1.playerName}
                      </PaperText>
                      <PaperText variant='bodySmall' style={styles.inviterLabel}>
                        {t('teamInvitations.inviterLabel')}
                      </PaperText>
                    </View>
                  </View>

                  {/* 토너먼트 정보 */}
                  <View style={styles.tournamentSection}>
                    <Ionicons name='trophy-outline' size={20} color={themeColors.colors.primary} />
                    <PaperText variant='bodyMedium' style={styles.tournamentName}>
                      {team.tournamentName}
                    </PaperText>
                  </View>

                  {/* 만료 시간 */}
                  <View style={styles.expirationSection}>
                    <Ionicons
                      name='time-outline'
                      size={16}
                      color={
                        hoursRemaining < 12
                          ? themeColors.colors.error
                          : themeColors.colors.onSurfaceVariant
                      }
                    />
                    <PaperText
                      variant='bodySmall'
                      style={[
                        styles.expirationText,
                        hoursRemaining < 12 && styles.expirationWarning,
                      ]}
                    >
                      {t('teamInvitations.expiresIn', { hours: hoursRemaining })}
                    </PaperText>
                  </View>

                  {/* 버튼 */}
                  <View style={styles.buttonSection}>
                    <Button
                      mode='outlined'
                      onPress={() => handleReject(team)}
                      disabled={isProcessing}
                      style={styles.rejectButton}
                      labelStyle={styles.rejectButtonLabel}
                      icon='close'
                    >
                      {t('teamInvitations.reject')}
                    </Button>
                    <Button
                      mode='contained'
                      onPress={() => handleAccept(team)}
                      disabled={isProcessing}
                      loading={isProcessing}
                      style={styles.acceptButton}
                      icon='check'
                    >
                      {t('teamInvitations.accept')}
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
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
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontWeight: '600',
      color: colors.onSurface,
    },
    badge: {
      backgroundColor: colors.primary,
      height: 28,
    },
    badgeText: {
      color: colors.onPrimary || '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      color: colors.onSurfaceVariant,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    emptyTitle: {
      marginTop: 16,
      fontWeight: '600',
      color: colors.onSurface,
    },
    emptyText: {
      marginTop: 8,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    inviteCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    inviterSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    inviterAvatar: {
      marginRight: 12,
    },
    inviterInfo: {
      flex: 1,
    },
    inviterName: {
      fontWeight: '600',
      color: colors.onSurface,
    },
    inviterLabel: {
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    tournamentSection: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      marginBottom: 12,
    },
    tournamentName: {
      marginLeft: 8,
      flex: 1,
      color: colors.onSurface,
      fontWeight: '500',
    },
    expirationSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    expirationText: {
      marginLeft: 6,
      color: colors.onSurfaceVariant,
      fontSize: 13,
    },
    expirationWarning: {
      color: colors.error,
      fontWeight: '600',
    },
    buttonSection: {
      flexDirection: 'row',
      gap: 12,
    },
    rejectButton: {
      flex: 1,
      borderColor: colors.error,
    },
    rejectButtonLabel: {
      color: colors.error,
    },
    acceptButton: {
      flex: 1,
    },
  });

export default TeamInvitationsScreen;
