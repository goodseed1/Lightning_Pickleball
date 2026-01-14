/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Card, Text as PaperText, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { useTheme, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useActivities } from '../../../contexts/ActivityContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTheme as useLTTheme } from '../../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../../theme';
import leagueService from '../../../services/leagueService';
import tournamentService from '../../../services/tournamentService';
import clubService from '../../../services/clubService';
import teamService from '../../../services/teamService';
import { Tournament, getMatchFormatFromTournamentEventType } from '../../../types/tournament';
import { League } from '../../../types/league';
import { Team, getInviteHoursRemaining } from '../../../types/team';
import { functions } from '../../../firebase/config';
import { httpsCallable } from 'firebase/functions';

interface ClubLeaguesTournamentsScreenProps {
  clubId: string;
  userRole: string;
  initialSubTab?: 'leagues' | 'tournaments';
  // 🎯 [KIM FIX] Counter to force tab switch even when same tab is clicked multiple times
  tabSwitchCount?: number;
}

const ClubLeaguesTournamentsScreen: React.FC<ClubLeaguesTournamentsScreenProps> = ({
  clubId,
  userRole,
  initialSubTab,
  tabSwitchCount,
}) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const { currentLanguage, t } = useLanguage();
  const { myApplications, isLoadingApplications, getMyApplicationStatus } = useActivities();

  // Lightning Pickleball theme
  const { theme: currentTheme } = useLTTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const styles = createStyles(themeColors.colors as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // State for leagues and tournaments
  const [leagues, setLeagues] = useState<League[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  // 🎯 [KIM FIX] Use initialSubTab prop if provided, otherwise default to 'leagues'
  const [activeTab, setActiveTab] = useState<'leagues' | 'tournaments'>(initialSubTab || 'leagues');
  const [loading, setLoading] = useState(true);
  const [tournamentLoading, setTournamentLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  // 🦾 Partner Selection Modal State (Tournament)
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);
  const [selectedTournamentForPartner, setSelectedTournamentForPartner] =
    useState<Tournament | null>(null);

  // 🦾 Partner Selection Modal State (League)
  const [leaguePartnerModalVisible, setLeaguePartnerModalVisible] = useState(false);
  const [selectedLeagueForPartner, setSelectedLeagueForPartner] = useState<string | null>(null);
  const [clubMembers, setClubMembers] = useState<
    Array<{
      userId: string;
      userName?: string;
      displayName?: string;
      userEmail?: string;
      userAvatar?: string;
      // 🎯 [KIM FIX] Add gender for filtering in gender-specific events
      gender?: string;
    }>
  >([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');

  // 🦾 IRON MAN: Team Invitations State
  const [pendingInvites, setPendingInvites] = useState<Team[]>([]);
  const [_invitesLoading, setInvitesLoading] = useState(true); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [processingTeamId, setProcessingTeamId] = useState<string | null>(null);

  console.log('🎯 ClubLeaguesTournamentsScreen - ActivityContext connected:', {
    applicationsCount: myApplications.length,
    isLoadingApplications,
  });

  // 🎯 [KIM FIX] Update activeTab when initialSubTab prop changes (from parent callback)
  // tabSwitchCount ensures this fires even when clicking the same tab multiple times
  useEffect(() => {
    if (initialSubTab) {
      console.log(
        `🎯 [ClubLeaguesTournamentsScreen] Switching to tab: ${initialSubTab} (count: ${tabSwitchCount})`
      );
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab, tabSwitchCount]);

  // Load leagues
  useEffect(() => {
    console.log(
      '🎭 [CURTAIN CALL] Setting up role-based league subscription for club:',
      clubId,
      'userRole:',
      userRole
    );

    // 🎭 커튼콜: 역할 기반 실시간 Firestore 구독
    const unsubscribe = leagueService.subscribeToClubLeagues(clubId, userRole, leagues => {
      console.log(
        '🎭 [CURTAIN CALL] Received filtered leagues:',
        leagues.length,
        'for role:',
        userRole
      );
      setLeagues(leagues);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🎭 [CURTAIN CALL] Cleaning up role-based league subscription');
      unsubscribe();
    };
  }, [clubId, userRole]);

  // Load tournaments with real-time subscription
  useEffect(() => {
    console.log(
      '🏆 [TOURNAMENT SUBSCRIPTION] Setting up role-based tournament subscription for club:',
      clubId,
      'userRole:',
      userRole
    );

    // 🏆 Tournament real-time Firestore subscription
    const unsubscribe = tournamentService.subscribeToClubTournaments(
      clubId,
      userRole,
      tournaments => {
        console.log(
          '🏆 [TOURNAMENT SUBSCRIPTION] Received filtered tournaments:',
          tournaments.length,
          'for role:',
          userRole
        );
        setTournaments(tournaments);
        setTournamentLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🏆 [TOURNAMENT SUBSCRIPTION] Cleaning up role-based tournament subscription');
      unsubscribe();
    };
  }, [clubId, userRole]);

  // 🦾 IRON MAN: Subscribe to team invitations for this club
  useEffect(() => {
    if (!currentUser?.uid || !clubId) {
      console.log('🦾 [IRON MAN] Missing userId or clubId for invitations subscription');
      setInvitesLoading(false);
      return;
    }

    console.log('🦾 [IRON MAN] Subscribing to team invitations for club:', clubId);

    // Subscribe to user's pending team invites
    const unsubscribe = teamService.subscribeToUserPendingInvites(currentUser.uid, invites => {
      console.log('🦾 [IRON MAN] All pending invites:', invites.length);

      // Filter for invites related to tournaments/leagues in this club
      // We'll need to check each tournament/league to see if it belongs to this club
      const filterInvitesByClub = async () => {
        const clubInvites: Team[] = [];

        for (const invite of invites) {
          try {
            // Check if it's a tournament team or league team
            if (invite.tournamentId) {
              // Tournament team
              const tournament = await tournamentService.getTournament(invite.tournamentId);
              if (tournament && tournament.clubId === clubId) {
                clubInvites.push(invite);
              }
            } else if (invite.leagueId) {
              // League team
              const league = await leagueService.getLeague(invite.leagueId);
              if (league && league.clubId === clubId) {
                clubInvites.push(invite);
              }
            }
          } catch (error) {
            console.error('Error checking tournament/league clubId:', error);
          }
        }

        console.log('🦾 [IRON MAN] Club-specific invites:', clubInvites.length);
        setPendingInvites(clubInvites);
        setInvitesLoading(false);
      };

      filterInvitesByClub();
    });

    return () => {
      console.log('🦾 [IRON MAN] Cleaning up team invitations subscription');
      unsubscribe();
    };
  }, [currentUser?.uid, clubId]);

  const handleJoinLeague = async (leagueId: string) => {
    if (!currentUser?.uid) {
      Alert.alert(
        t('clubLeaguesTournaments.alerts.loginRequired.title'),
        t('clubLeaguesTournaments.alerts.loginRequired.message')
      );
      return;
    }

    // 🔍 Check if already a participant (added by admin)
    const league = leagues.find(l => l.id === leagueId);
    const isAlreadyParticipant = league?.participants?.some(p =>
      typeof p === 'string' ? p === currentUser.uid : p.playerId === currentUser.uid
    );

    if (isAlreadyParticipant) {
      Alert.alert(
        t('clubLeaguesTournaments.alerts.alreadyParticipant.title'),
        t('clubLeaguesTournaments.alerts.alreadyParticipant.message')
      );
      return;
    }

    const status = getMyApplicationStatus(leagueId);
    if (status !== 'not_applied') {
      return; // Already applied or processed
    }

    // ⭐ 복식 리그 체크 - 파트너 선택 모달 표시
    const isDoubles = league?.eventType?.includes('doubles');
    if (isDoubles) {
      console.log('🎾 [League Join] Doubles league - showing partner selection modal');
      setSelectedLeagueForPartner(leagueId);
      setLeaguePartnerModalVisible(true); // ← 즉시 모달 오픈! (스켈레톤 표시)
      loadClubMembers(); // ← 백그라운드 로딩
      return;
    }

    // 단식 리그: Cloud Function으로 신청 (자동 승인)
    try {
      setApplyingTo(leagueId);
      console.log('🚀 [Singles League] Calling applyForLeague Cloud Function:', leagueId);

      // Get user profile data
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const userProfile = (currentUser.profile || {}) as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */
      const userDisplayName = currentUser.displayName || '사용자';
      const userEmail = currentUser.email;
      const userLtrLevel = userProfile.ltrLevel;
      const userProfileImage = currentUser.photoURL;

      // Call applyForLeague Cloud Function (auto-approval)
      const applyForLeagueFn = httpsCallable(functions, 'applyForLeague');
      const result = await applyForLeagueFn({
        leagueId,
        userDisplayName,
        userEmail,
        userLtrLevel,
        userProfileImage,
      });

      const responseData = result.data as { success: boolean; message: string };

      console.log('✅ [Singles League] Cloud Function response:', responseData);

      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to apply for league');
      }

      Alert.alert(
        t('clubLeaguesTournaments.alerts.applicationComplete.title'),
        t('clubLeaguesTournaments.alerts.applicationComplete.message')
      );
    } catch (error) {
      console.error('❌ [Singles League] Error applying to league:', error);
      Alert.alert(
        t('clubLeaguesTournaments.alerts.registrationFailed.title'),
        t('clubLeaguesTournaments.alerts.registrationFailed.messageLeague')
      );
    } finally {
      setApplyingTo(null);
    }
  };

  const handleJoinTournament = async (tournamentId: string) => {
    if (!currentUser?.uid) {
      Alert.alert(
        t('clubLeaguesTournaments.alerts.loginRequired.title'),
        t('clubLeaguesTournaments.alerts.loginRequired.messageTournament')
      );
      return;
    }

    // 💥 NEW: Check club membership before allowing tournament registration
    if (!userRole || userRole === 'none') {
      Alert.alert(
        t('clubLeaguesTournaments.alerts.membershipRequired.title'),
        t('clubLeaguesTournaments.alerts.membershipRequired.message')
      );
      return;
    }

    // 🏛️ TEAM-FIRST 2.0: Check for confirmed team before showing invitation modal
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const isDoubles = getMatchFormatFromTournamentEventType(tournament.eventType) === 'doubles';

    if (isDoubles) {
      try {
        // Check if user already has a CONFIRMED team for this tournament
        console.log('🏛️ [TEAM-FIRST 2.0] Checking for confirmed team...');
        const confirmedTeam = await teamService.getUserConfirmedTeamForTournament(
          currentUser.uid,
          tournamentId
        );

        if (confirmedTeam) {
          // Team already confirmed! Proceed with team registration
          console.log('✅ [TEAM-FIRST 2.0] Confirmed team found:', {
            teamId: confirmedTeam.id,
            teamName: `${confirmedTeam.player1.playerName} / ${confirmedTeam.player2.playerName}`,
          });

          setApplyingTo(tournamentId);

          await tournamentService.registerTeamForTournament(
            tournamentId,
            confirmedTeam.id,
            currentUser.uid
          );

          Alert.alert(
            t('clubLeaguesTournaments.alerts.registrationComplete.title'),
            t('clubLeaguesTournaments.alerts.registrationComplete.messageTeam', {
              team: `${confirmedTeam.player1.playerName} / ${confirmedTeam.player2.playerName}`,
            })
          );

          setApplyingTo(null);
          return;
        }

        // No confirmed team yet - show team invitation modal
        console.log('🦾 [TEAM-FIRST 2.0] No confirmed team - opening invitation modal');
        setSelectedTournamentForPartner(tournament);
        setPartnerModalVisible(true); // ← 즉시 모달 오픈! (스켈레톤 표시)
        loadClubMembers(); // ← await 제거 - 백그라운드 로딩
        return;
      } catch (error: unknown) {
        console.error('❌ [TEAM-FIRST 2.0] Error checking for confirmed team:', error);
        const errorMessage =
          error instanceof Error ? error.message : t('common.errors.unknownError');
        Alert.alert(
          t('clubLeaguesTournaments.alerts.error.title'),
          t('clubLeaguesTournaments.alerts.error.checkingTeam', { error: errorMessage })
        );
        setApplyingTo(null);
        return;
      }
    }

    // For singles tournaments, proceed with normal registration
    try {
      setApplyingTo(tournamentId);
      console.log('🏆 Applying to tournament:', tournamentId);

      await tournamentService.registerForTournament(tournamentId, currentUser.uid);

      Alert.alert(
        t('clubLeaguesTournaments.alerts.registrationComplete.title'),
        t('clubLeaguesTournaments.alerts.registrationComplete.messageTournament')
      );

      // No need to manually reload - real-time subscription will handle updates automatically
    } catch (error: unknown) {
      console.error('Error applying to tournament:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.errors.unknownError');
      Alert.alert(
        t('clubLeaguesTournaments.alerts.registrationFailed.title'),
        t('clubLeaguesTournaments.alerts.registrationFailed.messageTournament', {
          error: errorMessage,
        })
      );
    } finally {
      setApplyingTo(null);
    }
  };

  // 🦾 Load club members for partner selection
  const loadClubMembers = async () => {
    try {
      setLoadingMembers(true);
      console.log('🦾 [IRON MAN] Loading club members for partner selection');
      const members = await clubService.getClubMembers(clubId, 'active');

      // Exclude current user from partner selection
      const filteredMembers = members.filter(m => m.userId !== currentUser?.uid);
      setClubMembers(filteredMembers);
      console.log(`🦾 [IRON MAN] Loaded ${filteredMembers.length} eligible partners`);
    } catch (error) {
      console.error('Error loading club members:', error);
      Alert.alert(
        t('clubLeaguesTournaments.alerts.error.title'),
        t('clubLeaguesTournaments.alerts.error.loadingMembers')
      );
    } finally {
      setLoadingMembers(false);
    }
  };

  // 🏛️ TEAM-FIRST 2.0: Send team invitation (NOT unilateral registration!)
  const handlePartnerConfirmation = async () => {
    if (!selectedPartnerId || !selectedTournamentForPartner || !currentUser) return;

    const selectedPartner = clubMembers.find(m => m.userId === selectedPartnerId);
    if (!selectedPartner) return;

    try {
      setApplyingTo(selectedTournamentForPartner.id);
      setPartnerModalVisible(false);

      console.log('🏛️ [TEAM-FIRST 2.0] Sending team invitation:', {
        inviterId: currentUser.uid,
        inviteeId: selectedPartner.userId,
        inviteeName: selectedPartner.userName || selectedPartner.displayName,
        tournamentId: selectedTournamentForPartner.id,
      });

      // 🦾 Send team invitation (mutual consent required!)
      // 🦾 OPERATION: INFORMATION DESK - Structured response handling
      const result = await teamService.createTeamInvite({
        tournamentId: selectedTournamentForPartner.id,
        tournamentName:
          selectedTournamentForPartner.tournamentName ||
          selectedTournamentForPartner.title ||
          '토너먼트',
        inviterId: currentUser.uid,
        inviterName: currentUser.displayName || currentUser.email || t('common.unknown'),
        inviteeId: selectedPartner.userId,
        inviteeName: selectedPartner.userName || selectedPartner.displayName || t('common.unknown'),
      });

      if (result.success) {
        console.log('✅ [TEAM-FIRST 2.0] Team invitation sent:', result.teamId);

        Alert.alert(
          t('clubLeaguesTournaments.alerts.teamInvitationSent.title'),
          t('clubLeaguesTournaments.alerts.teamInvitationSent.message', {
            partner: selectedPartner.userName || selectedPartner.displayName,
          })
        );

        // Reset states
        setSelectedTournamentForPartner(null);
        setSelectedPartnerId(null);
        setPartnerSearchQuery('');
      } else {
        // 💁‍♂️ INFORMATION DESK: Show friendly notice instead of scary error
        console.log('ℹ️ [TEAM-FIRST 2.0] Team invitation blocked:', result.reason);

        Alert.alert(
          t('clubLeaguesTournaments.alerts.notice.title'),
          currentLanguage === 'ko' ? result.message : result.messageEn
        );
      }

      setApplyingTo(null);
    } catch (error: unknown) {
      console.error('❌ [TEAM-FIRST 2.0] Unexpected error sending team invitation:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.errors.unknownError');
      Alert.alert(
        t('clubLeaguesTournaments.alerts.error.title'),
        t('clubLeaguesTournaments.alerts.error.unexpectedError', { error: errorMessage })
      );
      setApplyingTo(null);
    }
  };

  // 🦾 League: Handle partner selection for doubles league
  const handleLeaguePartnerConfirmation = async () => {
    if (!selectedPartnerId || !selectedLeagueForPartner || !currentUser) {
      Alert.alert(
        t('clubLeaguesTournaments.alerts.selectPartner.title'),
        t('clubLeaguesTournaments.alerts.selectPartner.messageNoPartner')
      );
      return;
    }

    const selectedPartner = clubMembers.find(m => m.userId === selectedPartnerId);
    if (!selectedPartner) {
      Alert.alert(
        t('clubLeaguesTournaments.alerts.selectPartner.title'),
        t('clubLeaguesTournaments.alerts.selectPartner.messagePartnerNotFound')
      );
      return;
    }

    try {
      setApplyingTo(selectedLeagueForPartner);
      setLeaguePartnerModalVisible(false);
      console.log(
        '🎾 [League Partner] Applying with partner:',
        selectedPartner.displayName || selectedPartner.userName
      );

      // 🌉 [HEIMDALL] Create team via Cloud Function (server-side)
      const teamResult = await leagueService.createLeagueTeam(
        currentUser.uid,
        selectedPartnerId,
        selectedLeagueForPartner
      );

      if (!teamResult.success) {
        throw new Error(teamResult.message || 'Failed to create team');
      }

      console.log('✅ [League Partner] Team created:', teamResult.teamId);

      // 🔔 Phase 2 Fix: Do NOT immediately apply for league
      // Wait for partner to accept the team invitation first
      // League application will happen automatically when partner accepts in TeamInvitationsScreen
      console.log('⏳ [League Partner] Waiting for partner to accept team invitation');

      Alert.alert(
        t('clubLeaguesTournaments.alerts.invitationSent.title'),
        t('clubLeaguesTournaments.alerts.invitationSent.message', {
          partner: selectedPartner.displayName || selectedPartner.userName,
        })
      );

      // Reset states
      setSelectedLeagueForPartner(null);
      setSelectedPartnerId(null);
      setPartnerSearchQuery('');
      setApplyingTo(null);
    } catch (error) {
      console.error('❌ [League Partner] Error:', error);
      Alert.alert(
        t('clubLeaguesTournaments.alerts.applicationFailed.title'),
        (error as Error)?.message || t('clubLeaguesTournaments.alerts.applicationFailed.message')
      );
      setApplyingTo(null);
    }
  };

  // 🦾 IRON MAN: Handle team invitation accept (tournament OR league)
  const handleAcceptInvite = async (team: Team) => {
    if (!currentUser?.uid) return;

    try {
      setProcessingTeamId(team.id);

      console.log('✅ [IRON MAN] Accepting team invite:', team.id);

      // Step 1: Accept the team invitation
      await teamService.acceptTeamInvite(team.id, currentUser.uid);

      // Step 2: Register for tournament or league based on team type
      if (team.tournamentId) {
        // Tournament team
        console.log(
          '✅ [IRON MAN] Team confirmed, now registering for tournament:',
          team.tournamentId
        );

        await tournamentService.registerTeamForTournament(
          team.tournamentId,
          team.id,
          currentUser.uid
        );

        console.log('🎉 [IRON MAN] Team successfully registered for tournament!');

        Alert.alert(
          t('clubLeaguesTournaments.alerts.teamConfirmed.titleTournament'),
          t('clubLeaguesTournaments.alerts.teamConfirmed.messageTournament', {
            tournament: team.tournamentName,
            partner: team.player1.playerName,
          })
        );
      } else if (team.leagueId) {
        // League team
        console.log('✅ [IRON MAN] Team confirmed, now registering for league:', team.leagueId);

        await leagueService.applyForLeagueAsTeam(team.leagueId, team.id);

        console.log('🎉 [IRON MAN] Team successfully registered for league!');

        Alert.alert(
          t('clubLeaguesTournaments.alerts.teamConfirmed.titleLeague'),
          t('clubLeaguesTournaments.alerts.teamConfirmed.messageLeague', {
            league: team.leagueName,
            partner: team.player1.playerName,
          })
        );
      }
    } catch (error: unknown) {
      console.error('❌ [IRON MAN] Error accepting invite:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.errors.unknownError');
      Alert.alert(
        t('clubLeaguesTournaments.alerts.acceptFailed.title'),
        t('clubLeaguesTournaments.alerts.acceptFailed.message', { error: errorMessage })
      );
    } finally {
      setProcessingTeamId(null);
    }
  };

  // 🦾 IRON MAN: Handle team invitation reject
  const handleRejectInvite = async (team: Team) => {
    if (!currentUser?.uid) return;

    Alert.alert(
      t('clubLeaguesTournaments.alerts.rejectInvitation.title'),
      t('clubLeaguesTournaments.alerts.rejectInvitation.message', {
        partner: team.player1.playerName,
      }),
      [
        {
          text: t('clubLeaguesTournaments.alerts.rejectInvitation.cancel'),
          style: 'cancel',
        },
        {
          text: t('clubLeaguesTournaments.alerts.rejectInvitation.reject'),
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingTeamId(team.id);

              console.log('❌ [IRON MAN] Rejecting team invite:', team.id);

              await teamService.rejectTeamInvite(team.id, currentUser.uid);

              Alert.alert(
                t('clubLeaguesTournaments.alerts.invitationRejected.title'),
                t('clubLeaguesTournaments.alerts.invitationRejected.message')
              );
            } catch (error: unknown) {
              console.error('❌ [IRON MAN] Error rejecting invite:', error);
              const errorMessage =
                error instanceof Error ? error.message : t('common.errors.unknownError');
              Alert.alert(
                t('clubLeaguesTournaments.alerts.rejectFailed.title'),
                t('clubLeaguesTournaments.alerts.rejectFailed.message', { error: errorMessage })
              );
            } finally {
              setProcessingTeamId(null);
            }
          },
        },
      ]
    );
  };

  // 🎭 Phantom Blink: Navigation handler for viewing matches
  const handleViewMatches = (leagueId: string) => {
    console.log('🎭 [PHANTOM BLINK] Navigating to LeagueDetail for ongoing league:', leagueId);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (navigation.navigate as any)('LeagueDetail', { leagueId, clubId });
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };

  // Get dynamic button state for tournaments
  const getTournamentButtonConfig = (tournament: Tournament) => {
    const isApplying = applyingTo === tournament.id;
    // 🔍 Check if user is participant (as player1, player2, or playerId for singles)
    const isParticipant = tournament.participants?.some(p => {
      // For doubles: check player1Id and player2Id
      if (p.player1Id === currentUser?.uid || p.player2Id === currentUser?.uid) return true;
      // For singles: check playerId
      if (p.playerId === currentUser?.uid) return true;
      return false;
    });

    // 🎯 [KIM FIX] Priority 0: Always allow viewing in_progress/completed tournaments
    // (Gender mismatch only blocks registration, not viewing!)
    if (
      tournament.status === 'in_progress' ||
      tournament.status === 'bpaddle_generation' ||
      tournament.status === 'completed'
    ) {
      // Participants get primary styled button
      if (isParticipant) {
        return {
          text: t('clubLeaguesTournaments.buttons.viewBpaddle'),
          disabled: false,
          mode: 'contained' as const,
          icon: 'trophy',
          color: theme.colors.primary,
          loading: false,
          action: 'view_bpaddle',
        };
      }
      // Non-participants can still view (white style)
      return {
        text: t('clubLeaguesTournaments.buttons.viewBpaddle'),
        disabled: false,
        mode: 'contained' as const,
        icon: 'trophy-outline',
        color: '#FFFFFF', // White color
        loading: false,
        action: 'view_bpaddle',
      };
    }

    if (isApplying) {
      return {
        text: t('clubLeaguesTournaments.buttons.joining'),
        disabled: true,
        mode: 'contained' as const,
        icon: 'loading',
        color: theme.colors.primary,
        loading: true,
        action: 'apply',
      };
    }

    if (isParticipant) {
      return {
        text: t('clubLeaguesTournaments.buttons.participating'),
        disabled: true,
        mode: 'contained' as const,
        icon: 'check-circle',
        color: theme.colors.primary,
        loading: false,
        action: 'view',
      };
    }

    // 🎯 [KIM FIX] Only check gender for registration phase
    // Registration is the only phase where gender restriction applies
    if (tournament.status === 'registration') {
      // Check gender match ONLY for registration
      if (!canUserParticipateByGender(tournament.eventType)) {
        return {
          text: t('clubLeaguesTournaments.status.genderMismatch'),
          disabled: true,
          mode: 'outlined' as const,
          icon: 'alert-circle',
          color: theme.colors.border,
          loading: false,
          action: 'blocked',
        };
      }

      const participantCount = tournament.participants?.length || 0;
      const maxParticipants = tournament.settings?.maxParticipants || 8;

      if (participantCount >= maxParticipants) {
        return {
          text: t('clubLeaguesTournaments.status.full'),
          disabled: true,
          mode: 'outlined' as const,
          icon: 'close',
          color: theme.colors.border,
          loading: false,
          action: 'apply',
        };
      }

      return {
        text: t('clubLeaguesTournaments.buttons.joinTournament'),
        disabled: false,
        mode: 'contained' as const,
        icon: 'plus',
        color: theme.colors.primary,
        loading: false,
        action: 'apply',
      };
    }

    return {
      text: t('clubLeaguesTournaments.status.unavailable'),
      disabled: true,
      mode: 'outlined' as const,
      icon: 'close',
      color: theme.colors.border,
      loading: false,
      action: 'apply',
    };
  };

  // 🎯 [KIM FIX] Helper to check if user's gender matches the event's required gender
  // Returns true if user can participate, false if gender mismatch
  const canUserParticipateByGender = (eventType: string | undefined): boolean => {
    if (!eventType) return true; // No event type specified, allow all

    const userGender = currentUser?.profile?.gender;
    if (!userGender) return true; // User hasn't set gender, allow (they can set it later)

    const et = eventType.toLowerCase();

    // Mixed doubles: everyone can participate
    if (et.includes('mixed')) return true;

    // ⚠️ Check 'womens' BEFORE 'mens' because 'womens' contains 'mens'!
    if (et.includes('womens') || et.startsWith('women')) {
      return userGender === 'female';
    }
    if (et.includes('mens') || et.startsWith('men')) {
      return userGender === 'male';
    }

    // No gender restriction found in event type
    return true;
  };

  // 🎭 Phantom Blink: Get dynamic button state based on league status AND application status
  const getLeagueButtonConfig = (league: League) => {
    const status = getMyApplicationStatus(league.id);
    const isApplying = applyingTo === league.id;

    // 🔍 Check if user is already in participants list (as player1, player2, or playerId for singles)
    const isAlreadyParticipant = league.participants?.some(p => {
      if (typeof p === 'string') return p === currentUser?.uid;
      // For doubles: check player1Id and player2Id
      if (p.player1Id === currentUser?.uid || p.player2Id === currentUser?.uid) return true;
      // For singles: check playerId
      if (p.playerId === currentUser?.uid) return true;
      return false;
    });

    // 🎯 [KIM FIX] Priority 0: Always allow viewing ongoing/completed leagues
    // (Gender mismatch only blocks registration, not viewing!)
    if (league.status === 'ongoing') {
      return {
        text: t('clubLeaguesTournaments.buttons.viewMatches'),
        disabled: false,
        mode: 'contained' as const,
        icon: 'eye',
        color: theme.colors.primary,
        loading: false,
        action: 'view',
      };
    }

    if (league.status === 'playoffs' || league.status === 'completed') {
      // Participants get primary (blue) styled button
      if (isAlreadyParticipant) {
        return {
          text: t('clubLeaguesTournaments.buttons.viewResults'),
          disabled: false,
          mode: 'contained' as const,
          icon: 'trophy',
          color: theme.colors.primary,
          loading: false,
          action: 'view',
        };
      }
      // Non-participants get white styled button
      return {
        text: t('clubLeaguesTournaments.buttons.viewResults'),
        disabled: false,
        mode: 'contained' as const,
        icon: 'trophy-outline',
        color: '#FFFFFF',
        loading: false,
        action: 'view',
      };
    }

    // 🎭 Priority 1: Participant Status - For open/preparing leagues
    // If already a confirmed participant, show "참가 확정" (prevent duplicate application)
    if (isAlreadyParticipant) {
      return {
        text: t('clubLeaguesTournaments.buttons.confirmed'),
        disabled: true,
        mode: 'contained' as const,
        icon: 'check-circle',
        color: theme.colors.primary,
        loading: false,
        action: 'view',
      };
    }

    // 🎯 [KIM FIX] Gender check ONLY for registration phase (open/preparing leagues)
    // This allows viewing ongoing/completed leagues regardless of gender
    if (!canUserParticipateByGender(league.eventType)) {
      return {
        text: t('clubLeaguesTournaments.status.genderMismatch'),
        disabled: true,
        mode: 'outlined' as const,
        icon: 'alert-circle',
        color: theme.colors.border,
        loading: false,
        action: 'blocked',
      };
    }

    // 🎭 Priority 2: Application Status - For open/preparing leagues
    if (isApplying) {
      return {
        text: t('clubLeaguesTournaments.buttons.applying'),
        disabled: true,
        mode: 'contained' as const,
        icon: 'loading',
        color: theme.colors.primary,
        loading: true,
        action: 'apply',
      };
    }

    switch (status) {
      case 'pending':
        return {
          text: t('clubLeaguesTournaments.buttons.pending'),
          disabled: true,
          mode: 'outlined' as const,
          icon: 'clock-outline',
          color: theme.colors.border,
          loading: false,
          action: 'apply',
        };
      case 'approved':
        return {
          text: t('clubLeaguesTournaments.buttons.confirmed'),
          disabled: true,
          mode: 'contained' as const,
          icon: 'check-circle',
          color: theme.colors.primary,
          loading: false,
          action: 'apply',
        };
      case 'rejected':
        return {
          text: t('clubLeaguesTournaments.buttons.rejected'),
          disabled: true,
          mode: 'outlined' as const,
          icon: 'close-circle',
          color: themeColors.colors.error,
          loading: false,
          action: 'apply',
        };
      default: // 'not_applied'
        return {
          text: t('clubLeaguesTournaments.buttons.applyToLeague'),
          disabled: false,
          mode: 'contained' as const,
          icon: 'plus',
          color: theme.colors.primary,
          loading: false,
          action: 'apply',
        };
    }
  };

  const renderTournamentCard = (tournament: Tournament) => {
    const buttonConfig = getTournamentButtonConfig(tournament);
    const participantCount = tournament.participants?.length || 0;
    const maxParticipants = tournament.settings?.maxParticipants || 8;

    const handlePress = () => {
      if (buttonConfig.action === 'apply') {
        handleJoinTournament(tournament.id);
      } else if (buttonConfig.action === 'view_bpaddle') {
        // Navigate to tournament bpaddle view
        /* eslint-disable @typescript-eslint/no-explicit-any */
        (navigation.navigate as any)('TournamentBpaddle', {
          tournamentId: tournament.id,
          tournamentName: tournament.tournamentName || tournament.title,
          clubId,
        });
        /* eslint-enable @typescript-eslint/no-explicit-any */
      }
      // TODO: Handle other actions for tournament details if needed
    };

    return (
      <Card key={tournament.id} style={styles.leagueCard}>
        <Card.Content>
          <View style={styles.leagueHeader}>
            <View style={styles.leagueInfo}>
              <PaperText variant='titleLarge' style={styles.leagueName}>
                {tournament.tournamentName || tournament.title}
              </PaperText>
              <PaperText variant='bodyMedium' style={styles.leagueStatus}>
                {t('clubLeaguesTournaments.labels.status')}:{' '}
                {tournament.status === 'registration'
                  ? canUserParticipateByGender(tournament.eventType)
                    ? t('clubLeaguesTournaments.status.registrationOpen')
                    : t('clubLeaguesTournaments.status.genderMismatch')
                  : tournament.status === 'in_progress'
                    ? t('clubLeaguesTournaments.status.inProgress')
                    : tournament.status === 'completed'
                      ? t('clubLeaguesTournaments.status.completed')
                      : tournament.status}
              </PaperText>
              <PaperText variant='bodySmall' style={styles.participantCount}>
                {t('clubLeaguesTournaments.labels.participants')}: {participantCount}/
                {maxParticipants}
              </PaperText>
              <PaperText variant='bodySmall' style={styles.participantCount}>
                {t('clubLeaguesTournaments.labels.format')}:{' '}
                {t('clubLeaguesTournaments.labels.singleElimination')}
              </PaperText>
            </View>
            <View style={styles.leagueActions}>
              <Button
                mode={buttonConfig.mode}
                onPress={handlePress}
                disabled={buttonConfig.disabled}
                style={[styles.joinButton, buttonConfig.disabled && styles.disabledButton]}
                buttonColor={buttonConfig.mode === 'outlined' ? undefined : buttonConfig.color}
                textColor={buttonConfig.mode === 'outlined' ? buttonConfig.color : undefined}
                icon={buttonConfig.loading ? undefined : buttonConfig.icon}
                loading={buttonConfig.loading}
              >
                {buttonConfig.text}
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && tournamentLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <PaperText variant='bodyMedium' style={styles.loadingText}>
          {t('clubLeaguesTournaments.loading')}
        </PaperText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Headers */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leagues' && styles.activeTab]}
          onPress={() => setActiveTab('leagues')}
        >
          <PaperText
            variant='titleMedium'
            style={[styles.tabText, activeTab === 'leagues' && styles.activeTabText]}
          >
            {t('clubLeaguesTournaments.tabs.leagues')}
          </PaperText>
          {leagues.length > 0 && (
            <View style={styles.tabBadge}>
              <PaperText style={styles.tabBadgeText}>{leagues.length}</PaperText>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'tournaments' && styles.activeTab]}
          onPress={() => setActiveTab('tournaments')}
        >
          <PaperText
            variant='titleMedium'
            style={[styles.tabText, activeTab === 'tournaments' && styles.activeTabText]}
          >
            {t('clubLeaguesTournaments.tabs.tournaments')}
          </PaperText>
          {tournaments.length > 0 && (
            <View style={styles.tabBadge}>
              <PaperText style={styles.tabBadgeText}>{tournaments.length}</PaperText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'leagues' && (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
          {/* 🦾 IRON MAN: Team Invitations Section */}
          {pendingInvites.length > 0 && (
            <View style={styles.invitationsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name='mail' size={20} color={theme.colors.primary} />
                <PaperText variant='titleMedium' style={styles.sectionTitle}>
                  {t('clubLeaguesTournaments.labels.newTeamInvitations')}
                </PaperText>
                <Chip style={styles.inviteCount} textStyle={styles.inviteCountText}>
                  {pendingInvites.length}
                </Chip>
              </View>

              {pendingInvites.map(team => {
                const hoursRemaining = getInviteHoursRemaining(team);
                const isProcessing = processingTeamId === team.id;

                return (
                  <Card key={team.id} style={styles.inviteCard}>
                    <Card.Content>
                      {/* Inviter Info */}
                      <View style={styles.inviterSection}>
                        <View style={styles.inviterAvatar}>
                          <Ionicons name='person-circle' size={48} color={theme.colors.primary} />
                        </View>
                        <View style={styles.inviterInfo}>
                          <PaperText variant='titleMedium' style={styles.inviterName}>
                            {team.player1.playerName}
                          </PaperText>
                          <PaperText variant='bodySmall' style={styles.inviterLabel}>
                            {t('clubLeaguesTournaments.labels.sentInvitation')}
                          </PaperText>
                        </View>
                      </View>

                      {/* Tournament Info */}
                      <View style={styles.tournamentSection}>
                        <Ionicons name='trophy-outline' size={20} color={theme.colors.primary} />
                        <PaperText variant='bodyMedium' style={styles.tournamentName}>
                          {team.tournamentName}
                        </PaperText>
                      </View>

                      {/* Expiration Time */}
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
                            hoursRemaining < 12 && { color: themeColors.colors.error },
                          ]}
                        >
                          {t('clubLeaguesTournaments.labels.expiresIn', { hours: hoursRemaining })}
                        </PaperText>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.inviteActions}>
                        <Button
                          mode='outlined'
                          onPress={() => handleRejectInvite(team)}
                          disabled={isProcessing}
                          style={styles.actionButton}
                          textColor={themeColors.colors.error}
                        >
                          {t('clubLeaguesTournaments.buttons.reject')}
                        </Button>
                        <Button
                          mode='contained'
                          onPress={() => handleAcceptInvite(team)}
                          disabled={isProcessing}
                          loading={isProcessing}
                          style={[styles.actionButton, styles.acceptButton]}
                        >
                          {t('clubLeaguesTournaments.buttons.accept')}
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          )}

          {leagues.length > 0 ? (
            leagues.map(league => {
              // Check if card should be clickable (ongoing or completed leagues)
              const isCardClickable =
                league.status === 'ongoing' ||
                league.status === 'completed' ||
                league.status === 'playoffs';

              const handleCardPress = () => {
                if (isCardClickable) {
                  handleViewMatches(league.id);
                }
              };

              const cardContent = (
                <Card.Content>
                  <View style={styles.leagueHeader}>
                    <View style={styles.leagueInfo}>
                      <PaperText variant='titleLarge' style={styles.leagueName}>
                        {league.name}
                      </PaperText>
                      <PaperText variant='bodyMedium' style={styles.leagueStatus}>
                        {t('clubLeaguesTournaments.labels.status')}:{' '}
                        {league.status === 'open'
                          ? canUserParticipateByGender(league.eventType)
                            ? t('clubLeaguesTournaments.status.open')
                            : t('clubLeaguesTournaments.status.genderMismatch')
                          : league.status === 'preparing'
                            ? t('clubLeaguesTournaments.status.preparing')
                            : league.status === 'ongoing'
                              ? t('clubLeaguesTournaments.status.ongoing')
                              : league.status === 'playoffs'
                                ? t('clubLeaguesTournaments.status.playoffs')
                                : league.status === 'completed'
                                  ? t('clubLeaguesTournaments.status.completed')
                                  : league.status}
                      </PaperText>
                      <PaperText variant='bodySmall' style={styles.participantCount}>
                        {t('clubLeaguesTournaments.labels.participants')}:{' '}
                        {league.participants?.length || 0}/{league.settings?.maxParticipants || 16}
                      </PaperText>
                    </View>
                    <View style={styles.leagueActions}>
                      {(() => {
                        const buttonConfig = getLeagueButtonConfig(league);

                        const handlePress = () => {
                          if (buttonConfig.action === 'view') {
                            handleViewMatches(league.id);
                          } else {
                            handleJoinLeague(league.id);
                          }
                        };

                        // 🎭 Phantom Blink: Determine if button should be disabled
                        const isDisabled =
                          buttonConfig.disabled ||
                          (buttonConfig.action === 'apply' && league.status !== 'open');

                        return (
                          <Button
                            mode={buttonConfig.mode}
                            onPress={handlePress}
                            disabled={isDisabled}
                            style={[styles.joinButton, isDisabled && styles.disabledButton]}
                            buttonColor={
                              buttonConfig.mode === 'outlined' ? undefined : buttonConfig.color
                            }
                            textColor={
                              buttonConfig.mode === 'outlined' ? buttonConfig.color : undefined
                            }
                            icon={buttonConfig.loading ? undefined : buttonConfig.icon}
                            loading={buttonConfig.loading}
                          >
                            {buttonConfig.text}
                          </Button>
                        );
                      })()}
                    </View>
                  </View>
                </Card.Content>
              );

              return isCardClickable ? (
                <TouchableOpacity key={league.id} onPress={handleCardPress} activeOpacity={0.7}>
                  <Card style={styles.leagueCard}>{cardContent}</Card>
                </TouchableOpacity>
              ) : (
                <Card key={league.id} style={styles.leagueCard}>
                  {cardContent}
                </Card>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name='trophy-outline' size={64} color='#ddd' />
              <PaperText variant='titleMedium' style={styles.emptyTitle}>
                {t('clubLeaguesTournaments.empty.noLeagues.title')}
              </PaperText>
              <PaperText variant='bodyMedium' style={styles.emptyText}>
                {t('clubLeaguesTournaments.empty.noLeagues.message')}
              </PaperText>
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'tournaments' && (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
          {/* 🦾 IRON MAN: Team Invitations Section (Same for tournaments tab) */}
          {pendingInvites.length > 0 && (
            <View style={styles.invitationsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name='mail' size={20} color={theme.colors.primary} />
                <PaperText variant='titleMedium' style={styles.sectionTitle}>
                  {t('clubLeaguesTournaments.labels.newTeamInvitations')}
                </PaperText>
                <Chip style={styles.inviteCount} textStyle={styles.inviteCountText}>
                  {pendingInvites.length}
                </Chip>
              </View>

              {pendingInvites.map(team => {
                const hoursRemaining = getInviteHoursRemaining(team);
                const isProcessing = processingTeamId === team.id;

                return (
                  <Card key={team.id} style={styles.inviteCard}>
                    <Card.Content>
                      {/* Inviter Info */}
                      <View style={styles.inviterSection}>
                        <View style={styles.inviterAvatar}>
                          <Ionicons name='person-circle' size={48} color={theme.colors.primary} />
                        </View>
                        <View style={styles.inviterInfo}>
                          <PaperText variant='titleMedium' style={styles.inviterName}>
                            {team.player1.playerName}
                          </PaperText>
                          <PaperText variant='bodySmall' style={styles.inviterLabel}>
                            {t('clubLeaguesTournaments.labels.sentInvitation')}
                          </PaperText>
                        </View>
                      </View>

                      {/* Tournament Info */}
                      <View style={styles.tournamentSection}>
                        <Ionicons name='trophy-outline' size={20} color={theme.colors.primary} />
                        <PaperText variant='bodyMedium' style={styles.tournamentName}>
                          {team.tournamentName}
                        </PaperText>
                      </View>

                      {/* Expiration Time */}
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
                            hoursRemaining < 12 && { color: themeColors.colors.error },
                          ]}
                        >
                          {t('clubLeaguesTournaments.labels.expiresIn', { hours: hoursRemaining })}
                        </PaperText>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.inviteActions}>
                        <Button
                          mode='outlined'
                          onPress={() => handleRejectInvite(team)}
                          disabled={isProcessing}
                          style={styles.actionButton}
                          textColor={themeColors.colors.error}
                        >
                          {t('clubLeaguesTournaments.buttons.reject')}
                        </Button>
                        <Button
                          mode='contained'
                          onPress={() => handleAcceptInvite(team)}
                          disabled={isProcessing}
                          loading={isProcessing}
                          style={[styles.actionButton, styles.acceptButton]}
                        >
                          {t('clubLeaguesTournaments.buttons.accept')}
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          )}

          {tournaments.length > 0 ? (
            tournaments.map(renderTournamentCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name='medal-outline' size={64} color='#ddd' />
              <PaperText variant='titleMedium' style={styles.emptyTitle}>
                {t('clubLeaguesTournaments.empty.noTournaments.title')}
              </PaperText>
              <PaperText variant='bodyMedium' style={styles.emptyText}>
                {t('clubLeaguesTournaments.empty.noTournaments.message')}
              </PaperText>
            </View>
          )}
        </ScrollView>
      )}

      {/* 🦾 Partner Selection Modal */}
      <Modal
        visible={partnerModalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => {
          setPartnerModalVisible(false);
          setSelectedPartnerId(null);
          setPartnerSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <PaperText variant='titleLarge' style={styles.modalTitle}>
                {t('clubLeaguesTournaments.modals.sendTeamInvitation')}
              </PaperText>
              <TouchableOpacity
                onPress={() => {
                  setPartnerModalVisible(false);
                  setSelectedPartnerId(null);
                  setPartnerSearchQuery('');
                }}
                style={styles.modalCloseButton}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                activeOpacity={0.6}
              >
                <Ionicons name='close' size={24} color={themeColors.colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <PaperText variant='bodyMedium' style={styles.modalInstructions}>
              {t('clubLeaguesTournaments.modals.sendInvitationInstructions')}
            </PaperText>

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder={t('clubLeaguesTournaments.modals.searchPartner')}
              placeholderTextColor={themeColors.colors.onSurfaceVariant}
              value={partnerSearchQuery}
              onChangeText={setPartnerSearchQuery}
            />

            {/* Partner List */}
            {loadingMembers ? (
              <View style={styles.partnerList}>
                {/* Skeleton UI - Show placeholders while loading */}
                {[1, 2, 3, 4, 5].map(index => (
                  <View key={index} style={styles.skeletonItem}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.skeletonContent}>
                      <View style={styles.skeletonNameLong} />
                      <View style={styles.skeletonEmailShort} />
                    </View>
                  </View>
                ))}
                <View style={styles.skeletonLoadingHint}>
                  <ActivityIndicator size='small' color={theme.colors.primary} />
                  <PaperText variant='bodySmall' style={styles.skeletonLoadingText}>
                    {t('clubLeaguesTournaments.modals.loadingPartners')}
                  </PaperText>
                </View>
              </View>
            ) : (
              <FlatList
                data={clubMembers.filter(member => {
                  // 🎯 [KIM FIX] Filter by search query
                  const matchesSearch = (member.userName || member.displayName || '')
                    .toLowerCase()
                    .includes(partnerSearchQuery.toLowerCase());
                  if (!matchesSearch) return false;

                  // 🎯 [KIM FIX] Filter by gender based on tournament eventType
                  const eventType = selectedTournamentForPartner?.eventType;
                  if (!eventType) return true; // No event type, show all

                  const et = eventType.toLowerCase();
                  // 🎾 Mixed doubles: show opposite gender only (for partner selection)
                  if (et.includes('mixed')) {
                    // Get current user's gender (check both top-level and profile.gender)
                    const myGender = (
                      currentUser?.gender || currentUser?.profile?.gender
                    )?.toLowerCase();
                    if (myGender === 'male') {
                      return member.gender?.toLowerCase() === 'female';
                    } else if (myGender === 'female') {
                      return member.gender?.toLowerCase() === 'male';
                    }
                    // If gender not set, show all
                    return true;
                  }
                  // ⚠️ Check 'womens' BEFORE 'mens' because 'womens' contains 'mens'!
                  if (et.includes('womens') || et.startsWith('women')) {
                    return member.gender?.toLowerCase() === 'female';
                  }
                  if (et.includes('mens') || et.startsWith('men')) {
                    return member.gender?.toLowerCase() === 'male';
                  }
                  return true; // No gender restriction
                })}
                keyExtractor={item => item.userId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.partnerItem,
                      selectedPartnerId === item.userId && styles.partnerItemSelected,
                    ]}
                    onPress={() => setSelectedPartnerId(item.userId)}
                  >
                    <View style={styles.partnerInfo}>
                      <View style={styles.partnerAvatar}>
                        {item.userAvatar ? (
                          <Ionicons name='person-circle' size={40} color={theme.colors.primary} />
                        ) : (
                          <Ionicons
                            name='person-circle-outline'
                            size={40}
                            color={themeColors.colors.onSurfaceVariant}
                          />
                        )}
                      </View>
                      <View style={styles.partnerDetails}>
                        <PaperText variant='bodyLarge' style={styles.partnerName}>
                          {item.userName || item.displayName || t('common.unknown')}
                        </PaperText>
                        <PaperText variant='bodySmall' style={styles.partnerEmail}>
                          {item.userEmail || ''}
                        </PaperText>
                      </View>
                    </View>
                    {selectedPartnerId === item.userId && (
                      <Ionicons name='checkmark-circle' size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons
                      name='people-outline'
                      size={48}
                      color={themeColors.colors.onSurfaceVariant}
                    />
                    <PaperText variant='bodyMedium' style={styles.emptyText}>
                      {t('clubLeaguesTournaments.modals.noMembersFound')}
                    </PaperText>
                  </View>
                }
                style={styles.partnerList}
              />
            )}

            {/* Confirmation Button */}
            <Button
              mode='contained'
              onPress={handlePartnerConfirmation}
              disabled={!selectedPartnerId || applyingTo !== null}
              loading={applyingTo !== null}
              style={styles.confirmButton}
              icon={applyingTo !== null ? undefined : 'send'}
            >
              {applyingTo !== null
                ? t('clubLeaguesTournaments.buttons.sendingInvitation')
                : t('clubLeaguesTournaments.buttons.sendInvitation')}
            </Button>
          </View>
        </View>
      </Modal>

      {/* 🦾 League Partner Selection Modal */}
      <Modal
        visible={leaguePartnerModalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => {
          setLeaguePartnerModalVisible(false);
          setSelectedPartnerId(null);
          setPartnerSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <PaperText variant='titleLarge' style={styles.modalTitle}>
                {t('clubLeaguesTournaments.modals.selectPartner')}
              </PaperText>
              <TouchableOpacity
                onPress={() => {
                  setLeaguePartnerModalVisible(false);
                  setSelectedPartnerId(null);
                  setPartnerSearchQuery('');
                }}
                style={styles.modalCloseButton}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                activeOpacity={0.6}
              >
                <Ionicons name='close' size={24} color={themeColors.colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <PaperText variant='bodyMedium' style={styles.modalInstructions}>
              {t('clubLeaguesTournaments.modals.selectPartnerInstructions')}
            </PaperText>

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder={t('clubLeaguesTournaments.modals.searchPartner')}
              placeholderTextColor={themeColors.colors.onSurfaceVariant}
              value={partnerSearchQuery}
              onChangeText={setPartnerSearchQuery}
            />

            {/* Partner List */}
            {loadingMembers ? (
              <View style={styles.partnerList}>
                {/* Skeleton UI - Show placeholders while loading */}
                {[1, 2, 3, 4, 5].map(index => (
                  <View key={index} style={styles.skeletonItem}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.skeletonContent}>
                      <View style={styles.skeletonNameLong} />
                      <View style={styles.skeletonEmailShort} />
                    </View>
                  </View>
                ))}
                <View style={styles.skeletonLoadingHint}>
                  <ActivityIndicator size='small' color={theme.colors.primary} />
                  <PaperText variant='bodySmall' style={styles.skeletonLoadingText}>
                    {t('clubLeaguesTournaments.modals.loadingPartners')}
                  </PaperText>
                </View>
              </View>
            ) : (
              <FlatList
                data={clubMembers.filter(member => {
                  // 🎯 [KIM FIX] Filter by search query
                  const matchesSearch = (member.userName || member.displayName || '')
                    .toLowerCase()
                    .includes(partnerSearchQuery.toLowerCase());
                  if (!matchesSearch) return false;

                  // 🎯 [KIM FIX] Filter by gender based on league eventType
                  const selectedLeague = leagues.find(l => l.id === selectedLeagueForPartner);
                  const eventType = selectedLeague?.eventType;
                  if (!eventType) return true; // No event type, show all

                  const et = eventType.toLowerCase();
                  // 🎾 Mixed doubles: show opposite gender only (for partner selection)
                  if (et.includes('mixed')) {
                    // Get current user's gender (check both top-level and profile.gender)
                    const myGender = (
                      currentUser?.gender || currentUser?.profile?.gender
                    )?.toLowerCase();
                    if (myGender === 'male') {
                      return member.gender?.toLowerCase() === 'female';
                    } else if (myGender === 'female') {
                      return member.gender?.toLowerCase() === 'male';
                    }
                    // If gender not set, show all
                    return true;
                  }
                  // ⚠️ Check 'womens' BEFORE 'mens' because 'womens' contains 'mens'!
                  if (et.includes('womens') || et.startsWith('women')) {
                    return member.gender?.toLowerCase() === 'female';
                  }
                  if (et.includes('mens') || et.startsWith('men')) {
                    return member.gender?.toLowerCase() === 'male';
                  }
                  return true; // No gender restriction
                })}
                keyExtractor={item => item.userId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.partnerItem,
                      selectedPartnerId === item.userId && styles.partnerItemSelected,
                    ]}
                    onPress={() => setSelectedPartnerId(item.userId)}
                  >
                    <View style={styles.partnerInfo}>
                      <View style={styles.partnerAvatar}>
                        {item.userAvatar ? (
                          <Ionicons name='person-circle' size={40} color={theme.colors.primary} />
                        ) : (
                          <Ionicons
                            name='person-circle-outline'
                            size={40}
                            color={themeColors.colors.onSurfaceVariant}
                          />
                        )}
                      </View>
                      <View style={styles.partnerDetails}>
                        <PaperText variant='bodyLarge' style={styles.partnerName}>
                          {item.userName || item.displayName || t('common.unknown')}
                        </PaperText>
                        <PaperText variant='bodySmall' style={styles.partnerEmail}>
                          {item.userEmail || ''}
                        </PaperText>
                      </View>
                    </View>
                    {selectedPartnerId === item.userId && (
                      <Ionicons name='checkmark-circle' size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons
                      name='people-outline'
                      size={48}
                      color={themeColors.colors.onSurfaceVariant}
                    />
                    <PaperText variant='bodyMedium' style={styles.emptyText}>
                      {t('clubLeaguesTournaments.modals.noMembersFound')}
                    </PaperText>
                  </View>
                }
                style={styles.partnerList}
              />
            )}

            {/* Confirmation Button */}
            <Button
              mode='contained'
              onPress={handleLeaguePartnerConfirmation}
              disabled={!selectedPartnerId || applyingTo !== null}
              loading={applyingTo !== null}
              style={styles.confirmButton}
              icon={applyingTo !== null ? undefined : 'check'}
            >
              {applyingTo !== null
                ? t('clubLeaguesTournaments.buttons.applying')
                : t('clubLeaguesTournaments.modals.applyToLeague')}
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      gap: 8,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
    },
    tabBadge: {
      backgroundColor: '#4CAF50', // 🎨 Green badge for leagues/tournaments count
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      minWidth: 20,
      alignItems: 'center',
    },
    tabBadgeText: {
      fontSize: 12,
      color: '#fff', // 🎨 White text for better contrast on green
      fontWeight: 'bold',
    },
    tabContent: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
      flexGrow: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      textAlign: 'center',
      opacity: 0.7,
      color: colors.onSurfaceVariant,
    },
    leagueCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    leagueHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    leagueInfo: {
      flex: 1,
      marginRight: 16,
    },
    leagueName: {
      fontWeight: '600',
      marginBottom: 8,
      color: colors.onSurface,
    },
    leagueStatus: {
      marginBottom: 4,
      opacity: 0.8,
      color: colors.onSurface,
    },
    participantCount: {
      opacity: 0.6,
      color: colors.onSurfaceVariant,
    },
    leagueActions: {
      alignItems: 'flex-end',
    },
    joinButton: {
      minWidth: 100,
    },
    disabledButton: {
      opacity: 0.7,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
    },
    emptyTitle: {
      marginTop: 16,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.onSurface,
    },
    emptyText: {
      marginTop: 8,
      opacity: 0.6,
      textAlign: 'center',
      lineHeight: 20,
      color: colors.onSurfaceVariant,
    },
    // 🦾 Partner Selection Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    modalTitle: {
      fontWeight: '600',
      color: colors.onSurface,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalInstructions: {
      padding: 16,
      color: colors.onSurfaceVariant,
      lineHeight: 20,
    },
    searchInput: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      fontSize: 16,
      color: colors.onSurface,
    },
    modalLoadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    modalLoadingText: {
      marginTop: 12,
      color: colors.onSurfaceVariant,
    },
    partnerList: {
      maxHeight: 400,
      paddingHorizontal: 16,
    },
    partnerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      marginBottom: 8,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    partnerItemSelected: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}15`,
    },
    partnerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    partnerAvatar: {
      marginRight: 12,
    },
    partnerDetails: {
      flex: 1,
    },
    partnerName: {
      fontWeight: '600',
      color: colors.onSurface,
    },
    partnerEmail: {
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    confirmButton: {
      marginHorizontal: 16,
      marginTop: 16,
    },
    // 🦾 IRON MAN: Team Invitation Styles
    invitationsSection: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    sectionTitle: {
      fontWeight: '600',
      color: colors.onSurface,
      flex: 1,
    },
    inviteCount: {
      backgroundColor: colors.primary,
      height: 24,
    },
    inviteCountText: {
      fontSize: 12,
      color: colors.onPrimary || '#fff',
      fontWeight: 'bold',
    },
    inviteCard: {
      marginBottom: 12,
      backgroundColor: colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    inviterSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
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
      gap: 8,
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
    },
    tournamentName: {
      flex: 1,
      color: colors.onSurface,
      fontWeight: '500',
    },
    expirationSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
    },
    expirationText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    inviteActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
    },
    acceptButton: {
      // Accept button specific styling
    },
    // 💀 Skeleton UI Styles
    skeletonItem: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
      alignItems: 'center',
    },
    skeletonAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      opacity: 0.6,
      marginRight: 12,
    },
    skeletonContent: {
      flex: 1,
    },
    skeletonNameLong: {
      width: '70%',
      height: 16,
      backgroundColor: colors.surfaceVariant,
      opacity: 0.6,
      borderRadius: 4,
      marginBottom: 8,
    },
    skeletonEmailShort: {
      width: '50%',
      height: 12,
      backgroundColor: colors.surfaceVariant,
      opacity: 0.4,
      borderRadius: 4,
    },
    skeletonLoadingHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      gap: 8,
    },
    skeletonLoadingText: {
      color: colors.onSurfaceVariant,
      opacity: 0.7,
    },
  });

export default ClubLeaguesTournamentsScreen;
