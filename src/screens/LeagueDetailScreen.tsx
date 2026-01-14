import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  Portal,
  Dialog,
  TextInput as PaperTextInput,
  Chip,
  Text as PaperText,
} from 'react-native-paper';

import { useAuth } from '../contexts/AuthContext';
import { useActivities } from '../contexts/ActivityContext';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import leagueService from '../services/leagueService';
import {
  League,
  LeagueMatch,
  PlayoffMatch,
  PlayoffType,
  MatchStatus,
  SetScore,
  getMatchFormatFromEventType,
} from '../types/league';
import { doc, collection, onSnapshot, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db as firestore } from '../firebase/config';
import clubService from '../services/clubService';
import activityService from '../services/activityService';
import { MatchList } from '../components/leagues/MatchList';
import LeagueScoreInputModal from '../components/leagues/LeagueScoreInputModal';
import UserSearchModal from '../components/modals/UserSearchModal';
import TeamPairingModal from '../components/modals/TeamPairingModal';
import { PlayoffCreatedModal } from '../components/modals/PlayoffCreatedModal';
import TournamentBracketView from '../components/tournaments/TournamentBracketView';
import { MD3Theme } from 'react-native-paper';

// User interface matching UserSearchModal's format
interface User {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
}

// Application interface for participation applications
interface Application {
  id: string;
  eventId: string;
  applicantId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  applicantProfile?: {
    displayName?: string;
    nickname?: string;
    uid?: string;
  };
}

// Route params interface
interface LeagueDetailRouteParams {
  leagueId: string;
  initialTab?: 'matches' | 'participants' | 'standings' | 'management';
}

// Extended LeagueMatch type with players array for backward compatibility
interface ExtendedLeagueMatch extends LeagueMatch {
  players?: Array<{ userId: string; name: string }>;
  type?: PlayoffType;
  isPlayoffMatch?: boolean;
}

// Admin action data interface
interface AdminActionData {
  newDate?: Date;
  reason?: string;
  forfeitingPlayerId?: string;
}

const LeagueDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser } = useAuth();
  const { myApplications, isLoadingApplications, getMyApplicationStatus } = useActivities();
  const { paperTheme: theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  // Get params
  const { leagueId, initialTab } = (route.params as LeagueDetailRouteParams) || { leagueId: '' };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [league, setLeague] = useState<League | null>(null);

  // 🎯 [KIM FIX] Track if current user is deleting to skip "deleted by another admin" alert
  const isDeletingRef = useRef(false);
  const [matches, setMatches] = useState<ExtendedLeagueMatch[]>([]);
  const [activeTab, setActiveTab] = useState<
    'matches' | 'participants' | 'standings' | 'management'
  >(initialTab || 'matches'); // Default: matches tab (admin will change to management tab in useEffect if initialTab is not set)
  const [standingsViewMode, setStandingsViewMode] = useState<'standings' | 'bracket'>('standings');
  const [userRole, setUserRole] = useState<string | null>(null);
  // Grant manager permissions (except club deletion)
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
  const [isGeneratingBracket, setIsGeneratingBracket] = useState(false);
  const [isStartingPlayoffs, setIsStartingPlayoffs] = useState(false);
  const [isClearingMatches, setIsClearingMatches] = useState(false);

  // Result input modal state
  const [showScoreInputModal, setShowScoreInputModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<ExtendedLeagueMatch | null>(null);
  const [submittingResult, setSubmittingResult] = useState(false);

  // Admin menu states
  const [matchMenuVisible, setMatchMenuVisible] = useState<string | null>(null);
  // const [showCorrectResultDialog, setShowCorrectResultDialog] = useState(false); // DEPRECATED: Using LeagueScoreInputModal
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showWalkoverDialog, setShowWalkoverDialog] = useState(false);
  const [adminActionData, setAdminActionData] = useState<AdminActionData>({
    // player1Score: 0,  // DEPRECATED: Using LeagueScoreInputModal
    // player2Score: 0,  // DEPRECATED: Using LeagueScoreInputModal
    // winnerId: '',     // DEPRECATED: Using LeagueScoreInputModal
    newDate: new Date(), // Still used for reschedule
    reason: '', // Still used for reschedule/walkover
  });
  const [isApplyingToLeague, setIsApplyingToLeague] = useState(false);

  // Bulk approval state
  const [showBulkApprovalDialog, setShowBulkApprovalDialog] = useState(false);
  const [bulkApprovingMatches, setBulkApprovingMatches] = useState(false);

  // Manual participant addition state
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [showTeamPairingModal, setShowTeamPairingModal] = useState(false);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  // Individual doubles application state (partner selection)
  const [showPartnerSelectionModal, setShowPartnerSelectionModal] = useState(false);

  // 🔍 DEBUG: Log partner selection modal state changes
  useEffect(() => {
    console.log('🔍 [MODAL STATE] Partner Selection Modal visible:', showPartnerSelectionModal);
  }, [showPartnerSelectionModal]);

  // Participation applications state (for admin dashboard)
  const [applications, setApplications] = useState<Application[]>([]);
  // Removed: approvingApplications state (no longer needed after Phase 5.8 migration)

  // Playoff created modal state
  const [showPlayoffModal, setShowPlayoffModal] = useState(false);
  const [playoffCreatedData, setPlayoffCreatedData] = useState<{
    qualifiedPlayers: Array<{ playerId: string; playerName: string }>;
    playoffType: 'final' | 'semifinals';
  } | null>(null);
  const [selectedPlayersForTeaming, setSelectedPlayersForTeaming] = useState<
    Array<{ uid: string; displayName: string; photoURL?: string }>
  >([]);

  // Real-time subscription handles all data loading - loadData() removed to prevent conflicts

  // 🎭 [Center Stage] Real-time data pipeline for league and matches
  useEffect(() => {
    // Ultimate aegis shield: Check both the tool (firestore) and data (leagueId)
    if (!firestore || !leagueId) {
      console.log('🛡️ [Cosmic Ray] Waiting for firestore and leagueId...', {
        firestore: !!firestore,
        leagueId: !!leagueId,
      });
      return;
    }

    console.log(
      '🎭 [Center Stage] All systems go. Setting up real-time subscriptions for league:',
      leagueId
    );

    const leagueRef = doc(firestore, 'leagues', leagueId);

    // 1. Subscribe to league document changes
    const unsubLeague = onSnapshot(leagueRef, doc => {
      if (doc.exists()) {
        const leagueData = { id: doc.id, ...doc.data() } as League;
        console.log('🎭 [Center Stage] League status updated:', leagueData.status);

        // 🔍 DEBUG: League playoff data check
        console.log('🔍 [DEBUG - League Load] Playoff data:', {
          status: leagueData.status,
          hasPlayoff: !!leagueData.playoff,
          playoff: leagueData.playoff,
        });

        // 🔍 DEBUG: Participants data check
        console.log('🔍 [REAL-TIME LISTENER] Participants data:', {
          hasParticipants: !!leagueData.participants,
          participantsCount: leagueData.participants?.length || 0,
          participants: leagueData.participants,
          participantsType: typeof leagueData.participants,
          isArray: Array.isArray(leagueData.participants),
        });

        setLeague(leagueData);
      } else {
        // 🎯 [KIM FIX] League was deleted - check if by current user or another admin
        console.warn('🎭 [Center Stage] League was deleted:', leagueId);

        // 🚨 CRITICAL: Set league to null FIRST to immediately block UI interactions
        // This triggers the "League not found" fallback UI
        setLeague(null);
        setMatches([]); // Also clear matches to prevent any stale data access

        // 🎯 [KIM FIX] Only show "deleted by another admin" alert if current user didn't delete it
        if (!isDeletingRef.current) {
          Alert.alert(
            t('leagueDetail.leagueDeleted'),
            t('leagueDetail.leagueDeletedByAdmin'),
            [
              {
                text: t('common.confirm'),
                onPress: () => navigation.goBack(),
              },
            ],
            { cancelable: false }
          );
        }
        // If isDeletingRef.current is true, the handleDeleteLeague function will show its own success alert
        return; // Don't proceed further
      }
    });

    // 2. Subscribe to matches subcollection changes
    const matchesRef = collection(leagueRef, 'matches');

    // Subscribe to regular league matches
    const unsubMatches = onSnapshot(matchesRef, snapshot => {
      const fetchedMatches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ExtendedLeagueMatch[];

      console.log(
        '🎭 [Center Stage] Regular matches updated:',
        fetchedMatches.length,
        'matches found'
      );

      // 🔍 Transform Firebase data to expected format
      const transformedMatches = fetchedMatches
        .map(match => {
          const players = match.players || [];
          return {
            ...match,
            player1Id: match.player1Id || players[0]?.userId, // Use direct field or fallback
            player1Name: match.player1Name || players[0]?.name, // Use direct field or fallback
            player2Id: match.player2Id || players[1]?.userId, // Use direct field or fallback
            player2Name: match.player2Name || players[1]?.name, // Use direct field or fallback
          };
        })
        .sort((a, b) => {
          // Sort completed matches to the bottom
          // Status priority: scheduled(0) < in_progress(1) < completed(2)
          const statusPriority: Record<MatchStatus, number> = {
            scheduled: 0,
            in_progress: 1,
            completed: 2,
            pending_approval: 2, // Treat pending approval as completed
            cancelled: 3,
            postponed: 3,
            walkover: 2,
          };

          const aPriority = statusPriority[a.status] ?? 3;
          const bPriority = statusPriority[b.status] ?? 3;

          return aPriority - bPriority;
        });

      console.log(
        '✅ [SUCCESS] Match data transformed:',
        transformedMatches.map(m => `${m.player1Name} vs ${m.player2Name}`).join(', ')
      );

      setMatches(transformedMatches);

      console.log('🔄 [STATE] Matches state updated to:', transformedMatches.length, 'matches');

      // Log UI transition decision
      const willShowMatchList = transformedMatches.length > 0;
      console.log(
        '🎭 [Center Stage] UI mode:',
        willShowMatchList ? 'MATCH_LIST' : 'ADMIN_DASHBOARD'
      );

      // Stop loading when we have real-time data
      setLoading(false);
    });

    // Cleanup subscriptions
    return () => {
      console.log('🎭 [Center Stage] Cleaning up real-time subscriptions');
      unsubLeague();
      unsubMatches();
    };
  }, [leagueId]);

  // 🏆 플레이오프 매치 실시간 리스너
  useEffect(() => {
    // 🔍 [FIX] league가 null일 때 playoff matches를 제거하지 않도록 early return
    if (!league) {
      return;
    }

    // {t('leagueDetail.playoffInProgress')}이거나 완료된 리그에서만 플레이오프 매치 로드
    if (league.status !== 'playoffs' && league.status !== 'completed') {
      // 플레이오프 아닐 때는 플레이오프 {t('leagueDetail.matches')} 제거
      setMatches(prev => prev.filter(m => !m.isPlayoffMatch));
      return;
    }

    console.log('📡 [Playoff Matches] Setting up real-time listener for playoff_matches...');

    // 실시간 리스너 설정
    const playoffMatchesRef = collection(firestore, `leagues/${leagueId}/playoff_matches`);
    const unsubPlayoff = onSnapshot(
      playoffMatchesRef,
      snapshot => {
        console.log('🔄 [Playoff Matches] Snapshot received:', snapshot.docs.length, 'matches');

        const playoffMatches = snapshot.docs
          .map(
            doc =>
              ({
                ...doc.data(),
                id: doc.id,
                isPlayoffMatch: true, // 플레이오프 {t('leagueDetail.matches')} 마커
              }) as ExtendedLeagueMatch
          )
          .sort((a, b) => {
            // 📋 완료된 {t('leagueDetail.matches')}는 맨 아래로 정렬
            // 상태별 우선{t('leagueDetail.standings')}: scheduled(0) < in_progress(1) < completed(2)
            const statusPriority: Record<MatchStatus, number> = {
              scheduled: 0,
              in_progress: 1,
              completed: 2,
              pending_approval: 2,
              cancelled: 3,
              postponed: 3,
              walkover: 2,
            };

            const aPriority = statusPriority[a.status] ?? 3;
            const bPriority = statusPriority[b.status] ?? 3;

            return aPriority - bPriority;
          });

        // 기존 regular matches + 새로운 playoff matches
        setMatches(prev => {
          const regularMatches = prev.filter(m => !m.isPlayoffMatch);
          return [...regularMatches, ...playoffMatches];
        });

        console.log(
          '✅ [Playoff Matches] Matches updated:',
          playoffMatches.length,
          'playoff matches'
        );
      },
      error => {
        console.error('❌ [Playoff Matches] Error listening to playoff_matches:', error);
      }
    );

    // Cleanup: 컴포넌트 언마운트 또는 리그 상태 {t('leagueDetail.change')} 시
    return () => {
      console.log('🧹 [Playoff Matches] Cleaning up playoff matches listener');
      unsubPlayoff();
    };
  }, [league?.status, leagueId]);

  // 🚪 [Gatekeeper] Real-time participation applications subscription
  useEffect(() => {
    if (!league?.id) {
      return;
    }

    console.log('🔄 [REALITY SYNC P2] Setting up applications subscription for league:', league.id);

    const q = query(
      collection(firestore, 'participation_applications'),
      where('eventId', '==', league.id)
    );

    const unsubscribe = onSnapshot(
      q,
      async snapshot => {
        const fetchedApplications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Application[];

        console.log('🚪 [GATEKEEPER] Received applications:', fetchedApplications.length);

        // 🚪 게이트키퍼 Phase 1: 사용자 프로필 정보 가져오기
        if (fetchedApplications.length > 0) {
          try {
            // 1. 모든 신청자 ID 추출 (중복 제거)
            const userIds = [...new Set(fetchedApplications.map(app => app.applicantId))];
            console.log('🚪 [GATEKEEPER] Fetching user profiles for:', userIds.length, 'users');

            // 2. users 컬렉션에서 프로필 정보 일괄 조회 (배치 처리)
            const userProfileMap = new Map();
            const BATCH_SIZE = 30;

            for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
              const batch = userIds.slice(i, i + BATCH_SIZE);
              const usersQuery = query(collection(firestore, 'users'), where('uid', 'in', batch));
              const userSnapshots = await getDocs(usersQuery);

              // 3. 사용자 프로필 데이터를 Map으로 구성
              userSnapshots.docs.forEach(doc => {
                const userData = doc.data();
                userProfileMap.set(userData.uid, {
                  // 🎯 [KIM FIX] Unified naming: use displayName only
                  displayName: userData.profile?.displayName || userData.displayName,
                  uid: userData.uid,
                });
              });
            }

            // 4. 신청 데이터와 사용자 프로필 데이터 결합
            const enrichedApplications = fetchedApplications.map(app => ({
              ...app,
              applicantProfile: userProfileMap.get(app.applicantId) || {
                displayName: t('leagueDetail.unknownUser'),
                nickname: t('leagueDetail.unknownUser'),
                uid: app.applicantId,
              },
            }));

            console.log('🚪 [GATEKEEPER] Successfully enriched applications with user profiles');
            setApplications(enrichedApplications);
          } catch (error) {
            console.error('🚪 [GATEKEEPER] Error fetching user profiles:', error);
            // 오류 시 프로필 정보 없이 설정
            setApplications(fetchedApplications);
          }
        } else {
          setApplications(fetchedApplications);
        }
      },
      error => {
        console.error('❌ [GATEKEEPER] Error loading applications:', error);
      }
    );

    return () => {
      console.log('🔌 [REALITY SYNC P2] Cleaning up applications subscription');
      unsubscribe();
    };
  }, [league?.id]);

  // Debug ActivityContext connection
  useEffect(() => {
    console.log('🏆 LeagueDetailScreen - ActivityContext connected:', {
      leagueId,
      applicationsCount: myApplications.length,
      isLoadingApplications,
      applicationStatus: league?.id ? getMyApplicationStatus(league.id) : 'no_league_yet',
    });
  }, [leagueId, myApplications, isLoadingApplications, league?.id, getMyApplicationStatus]);

  const loadUserRole = useCallback(async () => {
    if (!currentUser?.uid || !league?.clubId) return;

    try {
      const userMemberships = await clubService.getUserClubMemberships(currentUser.uid);
      const membership = userMemberships.find(m => m.clubId === league.clubId);
      setUserRole(membership?.role || null);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }, [currentUser?.uid, league?.clubId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 리그 정보 로드
      const leagueData = await leagueService.getLeague(leagueId);
      if (!leagueData) {
        throw new Error('League not found');
      }
      console.log('🔍 [LEAGUE_DETAIL] League data loaded:', {
        leagueId,
        hasParticipants: !!leagueData.participants,
        participantsCount: leagueData.participants?.length || 0,
        participants: leagueData.participants,
      });
      setLeague(leagueData);

      // {t('leagueDetail.matches')} 목록 로드
      const matchData = await leagueService.getLeagueMatches(leagueId);

      // 🔧 Apply same transformation as real-time subscription
      const transformedMatchData = matchData.map((match): ExtendedLeagueMatch => {
        const players = (match as ExtendedLeagueMatch).players || [];
        return {
          ...match,
          player1Id: match.player1Id || players[0]?.userId, // Use direct field or fallback
          player1Name: match.player1Name || players[0]?.name, // Use direct field or fallback
          player2Id: match.player2Id || players[1]?.userId, // Use direct field or fallback
          player2Name: match.player2Name || players[1]?.name, // Use direct field or fallback
        };
      });

      console.log(
        '🔧 [LOADDATA] Transformed match data:',
        transformedMatchData.map(m => `${m.player1Name} vs ${m.player2Name}`).join(', ')
      );

      setMatches(transformedMatchData);
    } catch (error) {
      console.error('Error loading league data:', error);
      Alert.alert(t('common.error'), t('leagueDetail.errorLoadingLeague'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (league && currentUser?.uid) {
      loadUserRole();
    }
  }, [league, currentUser?.uid, loadUserRole]);

  // 🎯 {t('leagueDetail.management')}자일 때 자동으로 {t('leagueDetail.management')} 탭으로 전환 (단, initialTab이 명시되지 않은 경우에만)
  useEffect(() => {
    if (isAdminOrManager && !initialTab) {
      setActiveTab('management');
      console.log('👔 [Admin Mode] Switched to management tab');
    }
  }, [userRole, initialTab]);

  // 🔧 툴킷: Firestore Timestamp를 날짜 문자열로 변환
  // Removed: formatFirestoreDate (no longer needed after Phase 5.8 migration)
  // const formatFirestoreDate = useCallback((timestamp: Timestamp | Date | string | null): string => {
  //   if (!timestamp) return new Date().toISOString().split('T')[0];
  //
  //   // Firestore Timestamp 객체인 경우
  //   if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
  //     return timestamp.toDate().toISOString().split('T')[0];
  //   }
  //
  //   // 이미 Date 객체인 경우
  //   if (timestamp instanceof Date) {
  //     return timestamp.toISOString().split('T')[0];
  //   }
  //
  //   // 문자열인 경우
  //   return new Date(timestamp).toISOString().split('T')[0];
  // }, []);

  // Removed: handleApproveApplication (no longer needed after Phase 5.8 migration)
  // 🚪 게이트키퍼: 개별 {t('leagueDetail.participants')} {t('leagueDetail.wins')}인 핸들러
  // const handleApproveApplication = async (applicationId: string, applicantName: string) => {
  //   if (!currentUser?.uid) {
  //     Alert.alert('권한 오류', '{t('leagueDetail.management')}자 권한이 필요합니다.');
  //     return;
  //   }
  //
  //   try {
  //     // {t('leagueDetail.wins')}인 중 상태 설정
  //     setApprovingApplications(prev => new Set(prev).add(applicationId));
  //     console.log('🚪 [GATEKEEPER] Approving application:', applicationId, 'for:', applicantName);
  //
  //     // Cloud Function will verify ownership using authUid
  //     await activityService.approveApplication(applicationId, currentUser.uid);
  //
  //     Alert.alert('✅ {t('leagueDetail.wins')}인 완료', `${applicantName}님의 참가 신청이 {t('leagueDetail.wins')}인되었습니다.`, [
  //       { text: t('common.confirm'), style: 'default' },
  //     ]);
  //
  //     console.log('🚪 [GATEKEEPER] Successfully approved application for:', applicantName);
  //   } catch (error) {
  //     console.error('🚪 [GATEKEEPER] Error approving application:', error);
  //     Alert.alert('{t('leagueDetail.wins')}인 실{t('leagueDetail.losses')}', '참가 신청 {t('leagueDetail.wins')}인 중 오류가 발생했습니다. 다시 시도해 주세요.', [
  //       { text: t('common.confirm'), style: 'default' },
  //     ]);
  //   } finally {
  //     // {t('leagueDetail.wins')}인 중 상태 해제
  //     setApprovingApplications(prev => {
  //       const next = new Set(prev);
  //       next.delete(applicationId);
  //       return next;
  //     });
  //   }
  // };

  // excludeUserIds 메모이제이션
  // 복식 팀의 경우 player1Id, player2Id를 개별적으로 추출하여 제외 목록에 추가
  const excludeUserIds = useMemo((): string[] => {
    if (!league?.participants) return [];

    return league.participants
      .flatMap(p => {
        if (typeof p === 'string') {
          // Legacy format: string userId
          return [p];
        }

        // Phase 5.8 format: LeagueParticipant object
        // Check if this is a doubles team (has player1Id and player2Id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const participant = p as any;
        if (participant.player1Id && participant.player2Id) {
          // Doubles team: Return both player IDs separately
          return [participant.player1Id, participant.player2Id];
        }

        // Singles: Return playerId
        return participant.playerId ? [participant.playerId] : [];
      })
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  }, [league?.participants]);

  // 단식/복식 구분
  const isDoubles = league?.eventType?.includes('doubles');

  // 🔍 DEBUG: Log eventType and isDoubles whenever it changes
  useEffect(() => {
    console.log('🔍 [DOUBLES CHECK] ====================');
    console.log('🔍 [DOUBLES CHECK] League:', league?.id);
    console.log('🔍 [DOUBLES CHECK] eventType:', league?.eventType);
    console.log('🔍 [DOUBLES CHECK] isDoubles:', isDoubles);
    console.log('🔍 [DOUBLES CHECK] ====================');
  }, [league?.eventType, isDoubles, league?.id]);

  // {t('leagueDetail.addParticipantsDirectly')} 핸들러 (배열 지원)
  const handleUserSelect = async (users: User[]) => {
    console.log('🎯 [Add Participants] Selected users:', users.length);
    console.log('🎯 [Add Participants] User names:', users.map(u => u.displayName).join(', '));
    console.log('🎯 [Add Participants] League ID:', leagueId);
    console.log('🎯 [Add Participants] League format:', league?.eventType);
    console.log('🎯 [Add Participants] Is doubles:', isDoubles);

    if (users.length === 0) {
      Alert.alert(t('leagueDetail.notification'), t('leagueDetail.selectParticipants'));
      return;
    }

    try {
      setIsAddingParticipant(true);

      if (isDoubles) {
        // 복식: 팀 페어링 모달로 이동
        console.log('🎯 [Add Participants] Doubles mode - adding to team pairing list');
        setSelectedPlayersForTeaming(prev => [...prev, ...users]);
        setShowUserSearchModal(false);
        setShowTeamPairingModal(true);
      } else {
        // 단식: 모든 선택된 사용자 추가
        console.log(`🎯 [Add Participants] Singles mode - adding ${users.length} participants...`);

        // Verify leagueService has the function
        if (!leagueService.addParticipantManually) {
          throw new Error('addParticipantManually function not found in leagueService');
        }

        // Add each user to the league
        let successCount = 0;
        let errorCount = 0;

        for (const user of users) {
          try {
            console.log(`🎯 [Add Participant] Adding: ${user.displayName}`);

            await leagueService.addParticipantManually(leagueId, {
              userId: user.uid,
              userDisplayName: user.displayName,
              userProfileImage: user.photoURL,
              userEmail: user.email || '', // Default to empty string if email is undefined
            });

            successCount++;
            console.log(`✅ [Add Participant] Success: ${user.displayName}`);
          } catch (error) {
            errorCount++;
            console.error(`❌ [Add Participant] Error adding ${user.displayName}:`, error);
            console.error(`❌ [Add Participant] Error message:`, (error as Error)?.message);
          }
        }

        console.log(`✅ [Add Participants] Complete: ${successCount} added, ${errorCount} failed`);

        setShowUserSearchModal(false);

        if (errorCount === 0) {
          Alert.alert(
            t('common.success'),
            t('leagueDetail.participantsAddedSuccess', { count: successCount })
          );
        } else if (successCount === 0) {
          Alert.alert(t('common.error'), t('leagueDetail.participantsAddError'));
        } else {
          Alert.alert(
            t('leagueDetail.partialSuccess'),
            t('leagueDetail.participantsAddPartialSuccess', { successCount, errorCount })
          );
        }
      }
    } catch (error) {
      console.error('❌ [Add Participants] Fatal error:', error);
      console.error('❌ [Add Participants] Error message:', (error as Error)?.message);
      console.error('❌ [Add Participants] Error stack:', (error as Error)?.stack);

      Alert.alert(
        t('common.error'),
        (error as Error)?.message || t('leagueDetail.participantsAddError')
      );
    } finally {
      setIsAddingParticipant(false);
    }
  };

  // 복식 팀 추가 핸들러
  const handleTeamConfirm = async (
    teams: Array<{
      id: string;
      player1: { uid: string; displayName: string; photoURL?: string };
      player2: { uid: string; displayName: string; photoURL?: string };
    }>
  ) => {
    try {
      setIsAddingParticipant(true);

      // 모든 팀을 순차적으로 추가
      for (const team of teams) {
        const teamName = `${team.player1.displayName} & ${team.player2.displayName}`;

        await leagueService.addDoublesTeamManually(leagueId, {
          player1Id: team.player1.uid,
          player2Id: team.player2.uid,
          player1Name: team.player1.displayName,
          player2Name: team.player2.displayName,
          teamName,
        });
      }

      setShowTeamPairingModal(false);
      setSelectedPlayersForTeaming([]);
      Alert.alert(
        t('common.success'),
        t('leagueDetail.teamsAddedSuccess', { count: teams.length })
      );
    } catch (error) {
      console.error('Error adding team:', error);
      Alert.alert(t('common.error'), t('leagueDetail.teamsAddError'));
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle league application
  const handleApplyToLeague = async () => {
    console.log('🎾 [APPLY START] ====================');
    console.log('🎾 [APPLY] Current user:', currentUser?.uid);
    console.log('🎾 [APPLY] League ID:', league?.id);
    console.log('🎾 [APPLY] League eventType:', league?.eventType);
    console.log('🎾 [APPLY] Is doubles:', isDoubles);
    console.log('🎾 [APPLY] showPartnerSelectionModal state:', showPartnerSelectionModal);

    if (!currentUser?.uid || !league?.id) {
      Alert.alert(t('common.error'), t('leagueDetail.loginRequired'));
      return;
    }

    const status = getMyApplicationStatus(league.id);
    console.log('🎾 [APPLY] Application status:', status);
    if (status !== 'not_applied') {
      Alert.alert(t('leagueDetail.notification'), t('leagueDetail.alreadyAppliedOrJoined'));
      return; // Already applied or processed
    }

    // 복식 리그: 파트너 선택 모달 표시
    if (isDoubles) {
      console.log('🎾 [APPLY] ✅ Doubles league detected - showing partner selection modal');
      setShowPartnerSelectionModal(true);
      console.log('🎾 [APPLY] Partner selection modal state set to TRUE');
      return;
    }

    // 단식 리그: 바로 신청
    console.log('🎾 [APPLY] Singles league - applying directly');
    try {
      setIsApplyingToLeague(true);

      await activityService.applyToEvent(
        league.id,
        currentUser.uid,
        t('leagueDetail.applyingToLeague'),
        currentUser.displayName || t('leagueDetail.user')
      );

      Alert.alert(
        t('leagueDetail.applicationComplete'),
        t('leagueDetail.applicationCompleteMessage')
      );
    } catch (error) {
      console.error('❌ [APPLY] Error applying to league:', error);
      Alert.alert(t('leagueDetail.applicationFailed'), t('leagueDetail.applicationFailedMessage'));
    } finally {
      setIsApplyingToLeague(false);
    }
  };

  // Handle partner selection for doubles league application
  const handlePartnerSelected = async (selectedUsers: User[]) => {
    if (!currentUser?.uid || !league?.id) {
      Alert.alert(t('common.error'), t('leagueDetail.loginRequired'));
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert(t('leagueDetail.notification'), t('leagueDetail.selectPartner'));
      return;
    }

    const partner = selectedUsers[0];

    try {
      setIsApplyingToLeague(true);
      console.log('🎾 [APPLY AS TEAM] Applying with partner:', partner.displayName);

      // ✅ Create team using Cloud Function
      const teamResult = await leagueService.createLeagueTeam(
        currentUser.uid,
        partner.uid,
        league.id
      );

      if (!teamResult.success) {
        throw new Error(teamResult.message || 'Failed to create team');
      }

      console.log('✅ [APPLY AS TEAM] Team created:', teamResult.teamId, teamResult.teamName);

      // 🔔 Phase 2: Do NOT immediately apply for league
      // Wait for partner to accept the team invitation first
      // League application will happen automatically when partner accepts

      setShowPartnerSelectionModal(false);
      Alert.alert(
        t('leagueDetail.invitationSent'),
        t('leagueDetail.teamInviteSent', { partnerName: partner.displayName }),
        [{ text: t('common.confirm') }]
      );
    } catch (error) {
      console.error('❌ [APPLY AS TEAM] Error:', error);
      Alert.alert(
        t('leagueDetail.applicationFailed'),
        (error as Error)?.message || t('leagueDetail.teamApplicationFailedMessage')
      );
    } finally {
      setIsApplyingToLeague(false);
    }
  };

  // 🎭 Chameleon UI: Get dynamic header button config based on application status
  const getHeaderButtonConfig = () => {
    if (!league?.id) return null;

    const status = getMyApplicationStatus(league.id);

    if (isApplyingToLeague) {
      return {
        icon: 'loading',
        onPress: () => {},
        color: theme.colors.primary,
        disabled: true,
      };
    }

    switch (status) {
      case 'pending':
        return {
          icon: 'clock-outline',
          onPress: () =>
            Alert.alert(t('leagueDetail.notification'), t('leagueDetail.applicationPending')),
          color: theme.colors.outline,
          disabled: true,
        };
      case 'approved':
        return {
          icon: 'checkmark-circle',
          onPress: () =>
            Alert.alert(t('leagueDetail.notification'), t('leagueDetail.applicationApproved')),
          color: theme.colors.primary,
          disabled: true,
        };
      case 'rejected':
        return {
          icon: 'close-circle',
          onPress: () =>
            Alert.alert(t('leagueDetail.notification'), t('leagueDetail.applicationRejected')),
          color: theme.colors.error,
          disabled: true,
        };
      default: // 'not_applied'
        return {
          icon: 'plus-circle-outline',
          onPress: handleApplyToLeague,
          color: theme.colors.primary,
          disabled: false,
        };
    }
  };

  // 🎾 {t('leagueDetail.matches')} 탭 Empty State: 간단한 메시지만 표시
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <Ionicons name='calendar-outline' size={64} color={theme.colors.onSurfaceVariant} />
        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
          {t('leagueDetail.noMatchesYet')}
        </Text>
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          {isAdminOrManager
            ? t('leagueDetail.generateBracketMessage')
            : t('leagueDetail.generateBracketMessageSimple')}
        </Text>
      </View>
    );
  };

  const handleGenerateBracket = async () => {
    if (!league) return;

    Alert.alert(
      t('leagueDetail.generateBracket'),
      t('leagueDetail.generateBracketConfirm', { leagueName: league.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'default',
          onPress: async () => {
            try {
              setIsGeneratingBracket(true);
              console.log('🎭 [Curtain Up] 대진표 생성 시작 - 리그 전환 준비 중...');

              // Step 1: 리그 상태를 'preparing'으로 전환
              console.log('⚡ [Status Transition] Updating league status to preparing...');
              await leagueService.updateLeagueStatus(leagueId, 'preparing');
              console.log('✅ [Status Transition] League status updated to preparing');

              // Step 2: 라운드 로빈 대진표 생성
              await leagueService.generateRoundRobinMatches(leagueId);
              console.log('🎭 [Curtain Up] 대진표 생성 완료 - 실시간 UI 전환 대기 중...');

              Alert.alert(t('common.success'), t('leagueDetail.bracketGeneratedSuccess'), [
                {
                  text: t('common.confirm'),
                  onPress: () => {
                    console.log(
                      '🎭 [Curtain Up] 사용자 확인 - 실시간 구독이 UI를 자동 업데이트합니다'
                    );
                    // {t('leagueDetail.matches')} 탭으로 자동 이동
                    setActiveTab('matches');
                    console.log('🎭 [Auto-Navigation] Switched to matches tab');
                  },
                },
              ]);
            } catch (error) {
              console.error('Error generating bracket:', error);
              let errorMessage = t('leagueDetail.bracketGenerateError');

              // 클라이언트 사이드 에러 처리
              if (error instanceof Error && error.message) {
                errorMessage = error.message;
              }

              Alert.alert(t('common.error'), errorMessage);
            } finally {
              setIsGeneratingBracket(false);
            }
          },
        },
      ]
    );
  };

  // {t('leagueDetail.deleteBracket')} 함수
  const handleClearMatches = async () => {
    if (!league) return;

    Alert.alert(
      `⚠️ ${t('leagueDetail.deleteBracket')}`,
      t('leagueDetail.deleteBracketConfirm', { leagueName: league.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearingMatches(true);
              console.log('🗑️ [CLEAR MATCHES] Starting bracket deletion...');

              await leagueService.clearAllMatches(leagueId);

              Alert.alert(t('common.finish'), t('leagueDetail.bracketDeletedSuccess'), [
                {
                  text: t('common.confirm'),
                },
              ]);
            } catch (error) {
              console.error('Error clearing matches:', error);
              let errorMessage = t('leagueDetail.bracketDeleteError');

              if (error instanceof Error && error.message) {
                errorMessage = error.message;
              }

              Alert.alert(t('common.error'), errorMessage);
            } finally {
              setIsClearingMatches(false);
            }
          },
        },
      ]
    );
  };

  // 수동 플레이오프 시작 함수
  const handleStartPlayoffs = async () => {
    if (!league) return;

    Alert.alert(
      t('leagueDetail.startPlayoffs'),
      t('leagueDetail.startPlayoffsConfirm', { leagueName: league.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('leagueDetail.startPlayoffs'),
          style: 'default',
          onPress: async () => {
            try {
              setIsStartingPlayoffs(true);
              console.log('🏆 플레이오프 수동 시작...');

              await leagueService.checkRegularSeasonCompletion(leagueId);

              // ⭐ Show playoff created modal
              if (league?.playoff) {
                const qualifiedPlayers = league.standings
                  .slice(0, Math.min(4, league.standings.length))
                  .map(s => ({
                    playerId: s.playerId,
                    playerName: s.playerName,
                  }));

                // Only show modal for final or semifinals
                const playoffType = league.playoff.type;
                if (playoffType === 'final' || playoffType === 'semifinals') {
                  setPlayoffCreatedData({
                    qualifiedPlayers,
                    playoffType,
                  });
                  setShowPlayoffModal(true);
                }
              }

              Alert.alert(t('common.success'), t('leagueDetail.playoffsStartedSuccess'));
            } catch (error) {
              console.error('Error starting playoffs:', error);
              Alert.alert(t('common.error'), t('leagueDetail.playoffsStartError'));
            } finally {
              setIsStartingPlayoffs(false);
            }
          },
        },
      ]
    );
  };

  // {t('leagueDetail.deleteLeague')} 함수
  const handleDeleteLeague = async () => {
    if (!league) return;

    Alert.alert(
      `⚠️ ${t('leagueDetail.dialogs.deleteLeagueTitle')}`,
      t('leagueDetail.dialogs.deleteLeagueConfirm', { leagueName: league.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [DELETE LEAGUE] Starting league deletion...');

              // 🎯 [KIM FIX] Set flag to prevent "deleted by another admin" alert
              isDeletingRef.current = true;

              // ✅ Use Cloud Function for cascade delete
              await leagueService.deleteLeague(leagueId);

              console.log('✅ [DELETE LEAGUE] League deleted successfully');

              // Show success message FIRST, then navigate back when user dismisses alert
              Alert.alert(t('common.finish'), t('leagueDetail.leagueDeleteSuccess'), [
                {
                  text: t('common.confirm'),
                  onPress: () => {
                    // Navigate back AFTER user dismisses the alert
                    // This ensures useFocusEffect fires properly and refreshes the list
                    navigation.goBack();
                  },
                },
              ]);
            } catch (error) {
              console.error('❌ [DELETE LEAGUE] Error deleting league:', error);
              Alert.alert(t('common.error'), t('leagueDetail.leagueDeleteError'));
            }
          },
        },
      ]
    );
  };

  // {t('leagueDetail.participants')} 제거 함수
  const handleRemoveParticipant = async (userId: string, userName: string) => {
    if (!league) return;

    Alert.alert(
      t('leagueDetail.removeParticipant'),
      t('leagueDetail.removeParticipantConfirm', { userName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await leagueService.removeParticipant(leagueId, userId);

              // Reload league data
              await loadData();

              Alert.alert(
                t('common.finish'),
                t('leagueDetail.removeParticipantSuccess', { userName })
              );
            } catch (error) {
              console.error('Error removing participant:', error);
              const errorMessage =
                error instanceof Error ? error.message : t('leagueDetail.removeParticipantError');
              Alert.alert(t('common.error'), errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 플레이오프 시작 조건 확인 함수
  const shouldShowStartPlayoffsButton = () => {
    if (!league || userRole !== 'admin') {
      return false;
    }

    // Only show for ongoing leagues
    if (league.status !== 'ongoing') {
      return false;
    }

    // 플레이오프가 이미 시작된 경우 false
    if (league.playoff) {
      return false;
    }

    // 라운드 로빈 완료 조건 확인 - 안전한 {t('leagueDetail.participants')} 수 계산
    let participantCount = league.participants?.length || 0;

    // league.participants가 비어있으면 매치 데이터에서 {t('leagueDetail.participants')} 추출 (fallback)
    if (participantCount === 0 && matches.length > 0) {
      const uniquePlayerIds = new Set<string>();
      matches.forEach(match => {
        // Check all possible player ID fields from the match data
        const player1Id = match.player1Id;
        const player2Id = match.player2Id;

        console.log(
          `🏆 [PLAYOFF DEBUG] Match ${match.id}: player1Id=${player1Id}, player2Id=${player2Id}`
        );

        if (player1Id) uniquePlayerIds.add(player1Id);
        if (player2Id) uniquePlayerIds.add(player2Id);
      });
      participantCount = uniquePlayerIds.size;
      console.log(
        `🏆 [PLAYOFF DEBUG] Fallback: 매치 데이터에서 추출한 {t('leagueDetail.participants')} 수: ${participantCount}, {t('leagueDetail.participants')} IDs:`,
        Array.from(uniquePlayerIds)
      );
    }

    const expectedMatches = (participantCount * (participantCount - 1)) / 2;

    // 🔍 상세 디버깅 정보
    console.log(`🏆 [PLAYOFF DEBUG] ===== 플레이오프 조건 검사 시작 =====`);
    console.log(`🏆 [PLAYOFF DEBUG] participantCount: ${participantCount}`);
    console.log(`🏆 [PLAYOFF DEBUG] expectedMatches: ${expectedMatches}`);
    console.log(`🏆 [PLAYOFF DEBUG] matches.length: ${matches.length}`);
    console.log(`🏆 [PLAYOFF DEBUG] league.participants:`, league.participants);
    console.log(
      `🏆 [PLAYOFF DEBUG] matches:`,
      matches.map(m => ({
        id: m.id,
        status: m.status,
        round: m.round,
        player1: m.player1Name,
        player2: m.player2Name,
      }))
    );

    // 0. 최소 {t('leagueDetail.participants')} 수 검증 (라운드 로빈은 최소 2명 필요)
    if (participantCount < 2) {
      console.log(
        `🏆 [PLAYOFF CHECK] {t('leagueDetail.participants')}가 너무 적습니다: ${participantCount}명 (최소 2명 필요)`
      );
      return false;
    }

    // 1. 모든 필요한 {t('leagueDetail.matches')}가 생성되었는지 확인
    if (matches.length < expectedMatches) {
      console.log(
        `🏆 [PLAYOFF CHECK] 아직 더 많은 {t('leagueDetail.matches')}가 필요합니다: ${matches.length}/${expectedMatches}`
      );
      return false;
    }

    // 2. 생성된 모든 {t('leagueDetail.matches')}가 완료되었는지 확인
    const completedMatches = matches.filter(match => match.status === 'completed');
    console.log(`🏆 [PLAYOFF DEBUG] completedMatches.length: ${completedMatches.length}`);
    console.log(
      `🏆 [PLAYOFF DEBUG] completedMatches:`,
      completedMatches.map(m => ({
        id: m.id,
        status: m.status,
        player1: m.player1Name,
        player2: m.player2Name,
      }))
    );

    if (completedMatches.length < expectedMatches) {
      console.log(
        `🏆 [PLAYOFF CHECK] 아직 완료되지 않은 {t('leagueDetail.matches')}가 있습니다: ${completedMatches.length}/${expectedMatches}`
      );
      return false;
    }

    // 3. 각 {t('leagueDetail.participants')}가 올바른 수의 {t('leagueDetail.matches')}를 했는지 검증
    const playerMatchCounts = new Map();
    completedMatches.forEach(match => {
      if (match.player1Id) {
        playerMatchCounts.set(match.player1Id, (playerMatchCounts.get(match.player1Id) || 0) + 1);
      }
      if (match.player2Id) {
        playerMatchCounts.set(match.player2Id, (playerMatchCounts.get(match.player2Id) || 0) + 1);
      }
    });

    // 각 {t('leagueDetail.participants')}는 정확히 (n-1)번의 {t('leagueDetail.matches')}를 해야 함
    const expectedMatchesPerPlayer = participantCount - 1;
    console.log(`🏆 [PLAYOFF DEBUG] expectedMatchesPerPlayer: ${expectedMatchesPerPlayer}`);
    console.log(`🏆 [PLAYOFF DEBUG] playerMatchCounts:`, Object.fromEntries(playerMatchCounts));

    for (const [playerId, matchCount] of playerMatchCounts) {
      if (matchCount !== expectedMatchesPerPlayer) {
        console.log(
          `🏆 [PLAYOFF CHECK] ${playerId} {t('leagueDetail.player')}의 {t('leagueDetail.matches')} 수가 부족합니다: ${matchCount}/${expectedMatchesPerPlayer}`
        );
        return false;
      }
    }

    console.log(`🏆 [PLAYOFF CHECK] ===== 라운드 로빈 완료! 플레이오프 시작 가능 =====`);
    return true;
  };

  const handleSubmitResult = (match: LeagueMatch) => {
    console.log('📝 [LeagueDetailScreen] handleSubmitResult called with match:', {
      id: match.id,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      player1Name: match.player1Name,
      player2Name: match.player2Name,
      status: match.status,
      fullMatch: match,
    });
    setSelectedMatch(match);
    setShowScoreInputModal(true);
  };

  const handleScoreSubmit = async (result: {
    matchId: string;
    winnerId: string;
    loserId: string;
    score: string;
    sets: SetScore[];
  }): Promise<void> => {
    console.log('🎯 [LeagueDetailScreen] handleScoreSubmit called with result:', {
      matchId: result.matchId,
      winnerId: result.winnerId,
      loserId: result.loserId,
      score: result.score,
      sets: result.sets,
      selectedMatch: selectedMatch
        ? {
            id: selectedMatch.id,
            player1Id: selectedMatch.player1Id,
            player2Id: selectedMatch.player2Id,
            player1Name: selectedMatch.player1Name,
            player2Name: selectedMatch.player2Name,
          }
        : null,
    });

    setSubmittingResult(true);
    try {
      console.log('🚀 [LeagueDetailScreen] Calling leagueService.submitMatchResult with:', {
        matchId: result.matchId,
        _winner: result.winnerId,
        scoreData: {
          sets: result.sets,
          finalScore: result.score,
        },
      });

      // 플레이오프 매치인지 확인하여 다른 함수 호출
      // Determine if this is a playoff match using match.type field (stored in Firestore)
      const isActualPlayoffMatch =
        selectedMatch?.type === 'semifinals' ||
        selectedMatch?.type === 'final' ||
        selectedMatch?.type === 'consolation';

      if (league?.status === 'playoffs' && isActualPlayoffMatch) {
        console.log('✅ [Playoff] Correct path - using updatePlayoffMatchResult', {
          matchType: selectedMatch.type,
          leagueStatus: league.status,
        });
        await leagueService.updatePlayoffMatchResult(leagueId, result.matchId, result.winnerId, {
          sets: result.sets,
          finalScore: result.score,
        });
      } else if (isActualPlayoffMatch && league?.status !== 'playoffs') {
        // Defensive logic: Playoff match but league status doesn't match
        console.error(
          '🚨 [BUG PREVENTION] Playoff match detected but league status is not playoffs',
          {
            matchType: selectedMatch.type,
            leagueStatus: league?.status,
            isPlayoffMatch: selectedMatch?.isPlayoffMatch,
          }
        );
        Alert.alert(t('common.error'), t('leagueDetail.playoffMatchErrorMessage'));
        return;
      } else {
        console.log('✅ [Regular Match] Using submitMatchResult', {
          matchType: selectedMatch?.type,
          leagueStatus: league?.status,
        });
        await leagueService.submitMatchResult(result.matchId, leagueId, {
          _winner: result.winnerId,
          score: {
            sets: result.sets,
            finalScore: result.score,
          },
        });
      }

      const successMessage =
        league?.status === 'playoffs' && isActualPlayoffMatch
          ? t('leagueDetail.playoffResultUpdated')
          : t('leagueDetail.resultSubmitted');

      Alert.alert(t('leagueDetail.resultSubmitSuccess'), successMessage, [
        {
          text: t('common.confirm'),
          onPress: () => {
            setShowScoreInputModal(false);
            setSelectedMatch(null);
          },
        },
      ]);
    } catch (error) {
      console.error('💥 [LeagueDetailScreen] Error submitting match result:', error);

      let errorMessage = t('leagueDetail.resultSubmitError');
      if (error instanceof Error) {
        if (error.message.includes('Match not found')) {
          errorMessage = t('leagueDetail.matchNotFound');
        } else if (error.message.includes('Permission denied')) {
          errorMessage = t('leagueDetail.noPermission');
        } else if (error.message.includes('Network')) {
          errorMessage = t('leagueDetail.checkNetwork');
        }
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setSubmittingResult(false);
    }
  };

  // Admin action handlers
  // DEPRECATED: handleCorrectResult - Now using handleScoreSubmit via LeagueScoreInputModal for all score operations
  /*
  const handleCorrectResult = async () => {
    if (!selectedMatch || !currentUser?.uid) return;

    try {
      setSubmittingResult(true);
      await leagueService.correctMatchResult(
        leagueId,
        selectedMatch.id,
        {
          player1Score: adminActionData.player1Score,
          player2Score: adminActionData.player2Score,
        },
        adminActionData.winnerId,
        currentUser.uid,
        adminActionData.reason || t('leagueDetail.adminCorrection')
      );

      Alert.alert(t('common.success'), t('leagueDetail.resultCorrectedSuccess'));
      setShowCorrectResultDialog(false);
      // Real-time subscription will auto-update UI
    } catch (error) {
      console.error('Error correcting match result:', error);
      Alert.alert(t('common.error'), t('leagueDetail.resultCorrectError'));
    } finally {
      setSubmittingResult(false);
    }
  };
  */

  const handleRescheduleMatch = async () => {
    if (!selectedMatch || !currentUser?.uid || !adminActionData.newDate) return;

    try {
      setSubmittingResult(true);
      await leagueService.rescheduleMatch(
        leagueId,
        selectedMatch.id,
        adminActionData.newDate,
        currentUser.uid,
        adminActionData.reason || t('leagueDetail.adminScheduleChange')
      );

      Alert.alert(t('common.success'), t('leagueDetail.scheduleChangedSuccess'));
      setShowRescheduleDialog(false);
      // Real-time subscription will auto-update UI
    } catch (error) {
      console.error('Error rescheduling match:', error);
      Alert.alert(t('common.error'), t('leagueDetail.scheduleChangeError'));
    } finally {
      setSubmittingResult(false);
    }
  };

  const handleProcessWalkover = async () => {
    if (!selectedMatch || !currentUser?.uid) return;

    try {
      setSubmittingResult(true);
      const functions = getFunctions();
      const processWalkover = httpsCallable(functions, 'processWalkover');

      await processWalkover({
        leagueId,
        matchId: selectedMatch.id,
        forfeitingPlayerId: adminActionData.forfeitingPlayerId,
        reason: adminActionData.reason || t('leagueDetail.adminWalkover'),
      });

      Alert.alert(t('common.success'), t('leagueDetail.walkoverSuccess'));
      setShowWalkoverDialog(false);
      // Real-time subscription will auto-update UI
    } catch (error) {
      console.error('Error processing walkover:', error);
      Alert.alert(t('common.error'), t('leagueDetail.walkoverError'));
    } finally {
      setSubmittingResult(false);
    }
  };

  // Bulk approval handler
  const handleBulkApprovalConfirm = async () => {
    if (!currentUser?.uid) return;

    const pendingMatches = matches.filter(match => match.status === 'pending_approval');
    if (pendingMatches.length === 0) {
      Alert.alert(t('leagueDetail.notification'), t('leagueDetail.noPendingMatches'));
      return;
    }

    try {
      setBulkApprovingMatches(true);
      const matchIds = pendingMatches.map(match => match.id);

      console.log(`🚀 [BulkApproval] Starting bulk approval for ${matchIds.length} matches`);
      const result = await leagueService.bulkApproveMatchResults(leagueId, matchIds);

      setShowBulkApprovalDialog(false);

      if (result.failed.length === 0) {
        // All successful
        Alert.alert(
          t('leagueDetail.bulkApprovalSuccess'),
          t('leagueDetail.bulkApprovalSuccessMessage', { count: result.successful.length })
        );
      } else if (result.successful.length === 0) {
        // All failed
        Alert.alert(t('leagueDetail.bulkApprovalFailed'), t('leagueDetail.bulkApprovalAllFailed'));
      } else {
        // Partial success
        Alert.alert(
          t('leagueDetail.bulkApprovalPartial'),
          t('leagueDetail.bulkApprovalPartialMessage', {
            successCount: result.successful.length,
            failCount: result.failed.length,
          })
        );
      }

      // Real-time subscription will auto-update UI
    } catch (error) {
      console.error('Error in bulk approval:', error);
      Alert.alert(t('common.error'), t('leagueDetail.bulkApprovalError'));
    } finally {
      setBulkApprovingMatches(false);
    }
  };

  // 🏆 플레이오프 매치 → 브래킷 형식 변환
  const convertPlayoffToBracketFormat = (playoffMatches: LeagueMatch[]) => {
    if (!playoffMatches || playoffMatches.length === 0) {
      return {
        rounds: [],
        champion: null,
      };
    }

    interface ConvertedMatch {
      id: string;
      matchNumber: number;
      player1: { playerId: string; playerName: string; seed: number } | null;
      player2: { playerId: string; playerName: string; seed: number } | null;
      winner: { playerId: string; playerName: string; seed: number } | null;
      score: unknown;
      status: string;
      nextMatchId?: string;
      type?: string; // 'final' | 'consolation' | 'semifinals'
    }

    // 라운드별로 매치 그룹화 (round 필드 기준)
    const roundsMap: { [round: number]: ConvertedMatch[] } = {};

    playoffMatches.forEach(match => {
      const roundNum = match.round || 1;

      if (!roundsMap[roundNum]) {
        roundsMap[roundNum] = [];
      }

      // {t('leagueDetail.wins')}자 결정
      // 🎯 [KIM FIX] winner 또는 _winner 필드 모두 체크 (호환성)
      let winner = null;
      const matchWinnerId = match._winner || match.winner;
      if (matchWinnerId && match.status === 'completed') {
        if (match.player1Id === matchWinnerId) {
          winner = {
            playerId: match.player1Id,
            playerName: match.player1Name || match.player1Id,
            seed: 0,
          };
        } else if (match.player2Id === matchWinnerId) {
          winner = {
            playerId: match.player2Id,
            playerName: match.player2Name || match.player2Id,
            seed: 0,
          };
        }
      }

      const convertedMatch: ConvertedMatch = {
        id: match.id,
        matchNumber: match.round || 1,
        player1: match.player1Id
          ? {
              playerId: match.player1Id,
              playerName: match.player1Name || match.player1Id,
              seed: 0,
            }
          : null,
        player2: match.player2Id
          ? {
              playerId: match.player2Id,
              playerName: match.player2Name || match.player2Id,
              seed: 0,
            }
          : null,
        winner,
        score: match.score || null,
        status: match.status || 'scheduled',
        nextMatchId: undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: (match as any).type, // 'final' | 'consolation' | 'semifinals'
      };

      roundsMap[roundNum].push(convertedMatch);
    });

    // 라운드 배열 생성 (정순 정렬 후 roundNumber 재계산)
    const roundKeys = Object.keys(roundsMap).sort((a, b) => parseInt(a) - parseInt(b));
    const maxRoundNum = Math.max(...roundKeys.map(k => parseInt(k)));

    const rounds = roundKeys.map((roundNum, index) => {
      const parsedRoundNum = parseInt(roundNum);
      let sortedMatches = roundsMap[parsedRoundNum];

      // Final 라운드(마지막 라운드)인 경우, type 기준으로 정렬
      // 'final'(1,2위전)이 위에, 'consolation'(3,4위전)이 아래
      if (parsedRoundNum === maxRoundNum) {
        sortedMatches = sortedMatches.sort((a, b) => {
          if (a.type === 'final' && b.type === 'consolation') return -1;
          if (a.type === 'consolation' && b.type === 'final') return 1;
          return a.matchNumber - b.matchNumber;
        });
      } else {
        // 다른 라운드는 matchNumber로 정렬
        sortedMatches = sortedMatches.sort((a, b) => a.matchNumber - b.matchNumber);
      }

      return {
        roundNumber: index + 1, // 1부터 시작 (브래킷 컴포넌트가 높은 숫자를 Final로 인식)
        matches: sortedMatches,
      };
    });

    // 챔피언 찾기 (결{t('leagueDetail.wins')} {t('leagueDetail.wins')}자)
    // 🎯 [KIM FIX] 플레이오프에서도 champion이 표시되도록 수정
    // - playoffs 또는 completed 상태 모두 체크
    // - 마지막 라운드(Final)에서 type='final'인 매치의 {t('leagueDetail.wins')}자를 찾음
    let champion = null;
    if ((league?.status === 'completed' || league?.status === 'playoffs') && rounds.length > 0) {
      // 마지막 라운드 (가장 높은 roundNumber)
      const finalRound = rounds[rounds.length - 1];
      // type='final'인 매치 (1,2위전) 또는 가장 첫 번째 완료된 매치에서 {t('leagueDetail.wins')}자 찾기
      const finalMatch =
        finalRound?.matches.find(m => m.type === 'final' && m.status === 'completed' && m.winner) ||
        finalRound?.matches.find(m => m.status === 'completed' && m.winner);
      if (finalMatch?.winner) {
        champion = finalMatch.winner;
      }
    }

    return {
      rounds,
      champion,
    };
  };

  const renderStandingsCard = () => {
    if (!league?.standings || league.standings.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name='trophy-outline' size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            {t('leagueDetail.emptyStates.noStandings')}
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            {t('leagueDetail.emptyStates.noStandingsDescription')}
          </Text>
        </View>
      );
    }

    return (
      <View>
        {/* 순위표 헤더 - 데이터 행과 동일한 View>Text 구조로 정렬 */}
        <View style={[styles.standingsHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={[styles.standingsCell, { flex: 0.6 }]}>
            <Text style={[styles.standingsHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              #
            </Text>
          </View>
          <View style={[styles.standingsCell, { flex: 2 }]}>
            <Text style={[styles.standingsHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              {t('leagueDetail.player')}
            </Text>
          </View>
          <View style={[styles.standingsCell, { flex: 0.8 }]}>
            <Text style={[styles.standingsHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              {t('leagueDetail.matches')}
            </Text>
          </View>
          <View style={[styles.standingsCell, { flex: 0.6 }]}>
            <Text style={[styles.standingsHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              {t('leagueDetail.wins')}
            </Text>
          </View>
          <View style={[styles.standingsCell, { flex: 0.6 }]}>
            <Text style={[styles.standingsHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              {t('leagueDetail.losses')}
            </Text>
          </View>
          <View style={[styles.standingsCell, { flex: 0.8 }]}>
            <Text style={[styles.standingsHeaderText, { color: theme.colors.onSurfaceVariant }]}>
              {t('leagueDetail.pointsHeader')}
            </Text>
          </View>
        </View>

        {/* {t('leagueDetail.standings')}표 목록 */}
        {league.standings.map((standing, index) => {
          // 동점자 처리: 실제 {t('leagueDetail.standings')} 계산
          let actualRank = 1;
          if (index === 0) {
            actualRank = 1;
          } else {
            const prevStanding = league.standings[index - 1];
            // 이전 {t('leagueDetail.player')}와 {t('leagueDetail.wins')}점, {t('leagueDetail.wins')}, {t('leagueDetail.losses')}가 모두 같으면 같은 {t('leagueDetail.standings')}
            if (
              standing.points === prevStanding.points &&
              standing.won === prevStanding.won &&
              standing.lost === prevStanding.lost
            ) {
              // 이전 {t('leagueDetail.standings')} 찾기 (재귀적으로 거슬러 올라감)
              let prevIndex = index - 1;
              while (prevIndex > 0) {
                const prev = league.standings[prevIndex];
                const prevPrev = league.standings[prevIndex - 1];
                if (
                  prev.points === prevPrev.points &&
                  prev.won === prevPrev.won &&
                  prev.lost === prevPrev.lost
                ) {
                  prevIndex--;
                } else {
                  break;
                }
              }
              actualRank = prevIndex + 1;
            } else {
              actualRank = index + 1;
            }
          }

          // {t('leagueDetail.standings')}별 배경색 결정
          let rankBgColor = theme.colors.surface;
          if (actualRank === 1) {
            rankBgColor = theme.colors.primaryContainer;
          } else if (actualRank === 2) {
            rankBgColor = theme.colors.surfaceVariant;
          } else if (actualRank === 3) {
            rankBgColor = theme.colors.secondaryContainer;
          }

          return (
            <View
              key={standing.playerId}
              style={[
                styles.standingsRow,
                { backgroundColor: rankBgColor, borderBottomColor: theme.colors.outlineVariant },
              ]}
            >
              <View style={[styles.standingsCell, { flex: 0.6 }]}>
                <Text style={[styles.standingsCellText, { color: theme.colors.onSurface }]}>
                  {actualRank}
                </Text>
              </View>
              <View style={[styles.standingsCell, { flex: 2 }]}>
                <Text
                  style={[
                    styles.standingsCellText,
                    {
                      fontWeight: '600',
                      color: theme.colors.onSurface,
                    },
                  ]}
                >
                  {standing.playerName}
                </Text>
              </View>
              <View style={[styles.standingsCell, { flex: 0.8 }]}>
                <Text style={[styles.standingsCellText, { color: theme.colors.onSurface }]}>
                  {standing.played}
                </Text>
              </View>
              <View style={[styles.standingsCell, { flex: 0.6 }]}>
                <Text style={[styles.standingsCellText, { color: theme.colors.onSurface }]}>
                  {standing.won}
                </Text>
              </View>
              <View style={[styles.standingsCell, { flex: 0.6 }]}>
                <Text style={[styles.standingsCellText, { color: theme.colors.onSurface }]}>
                  {standing.lost}
                </Text>
              </View>
              <View style={[styles.standingsCell, { flex: 0.8 }]}>
                <Text
                  style={[
                    styles.standingsCellText,
                    {
                      fontWeight: 'bold',
                      color: theme.colors.primary,
                    },
                  ]}
                >
                  {standing.points}
                </Text>
              </View>
            </View>
          );
        })}

        {/* t('leagueDetail.playoffRankings')표 (playoffs 또는 completed 상태일 때만 표시) */}
        {(() => {
          // ✅ Calculate rankings from playoff_matches in real-time
          if (league?.status !== 'playoffs' && league?.status !== 'completed') {
            return null;
          }

          const playoffMatches = matches.filter(
            m => m.isPlayoffMatch === true
          ) as unknown as PlayoffMatch[];
          if (playoffMatches.length === 0) {
            return null;
          }

          // Find final and consolation matches (using type-based detection)
          const finalMatch = playoffMatches.find(m => m.type === 'final');
          const consolationMatch = playoffMatches.find(m => m.type === 'consolation');

          const rankings = [];

          // 1st and 2nd place from final match
          if (finalMatch?.status === 'completed' && finalMatch.winner) {
            const winnerId = finalMatch.winner;
            const loserId =
              finalMatch.player1Id === winnerId ? finalMatch.player2Id : finalMatch.player1Id;
            const winnerName =
              finalMatch.player1Id === winnerId ? finalMatch.player1Name : finalMatch.player2Name;
            const loserName =
              finalMatch.player1Id === loserId ? finalMatch.player1Name : finalMatch.player2Name;

            rankings.push({
              rank: 1,
              playerId: winnerId,
              playerName: winnerName,
              label: t('leagueDetail.champion'),
            });
            rankings.push({
              rank: 2,
              playerId: loserId,
              playerName: loserName,
              label: t('leagueDetail.runnerUp'),
            });
          }

          // 3rd and 4th place from consolation match
          if (consolationMatch?.status === 'completed' && consolationMatch.winner) {
            const winnerId = consolationMatch.winner;
            const loserId =
              consolationMatch.player1Id === winnerId
                ? consolationMatch.player2Id
                : consolationMatch.player1Id;
            const winnerName =
              consolationMatch.player1Id === winnerId
                ? consolationMatch.player1Name
                : consolationMatch.player2Name;
            const loserName =
              consolationMatch.player1Id === loserId
                ? consolationMatch.player1Name
                : consolationMatch.player2Name;

            rankings.push({
              rank: 3,
              playerId: winnerId,
              playerName: winnerName,
              label: t('leagueDetail.thirdPlace'),
            });
            rankings.push({
              rank: 4,
              playerId: loserId,
              playerName: loserName,
              label: t('leagueDetail.fourthPlace'),
            });
          }

          return rankings.length > 0 ? (
            <View style={styles.playoffRankingsCard}>
              <Text style={[styles.playoffRankingsTitle, { color: theme.colors.onSurface }]}>
                {t('leagueDetail.playoffRankings')}
              </Text>
              {rankings.map(ranking => (
                <View
                  key={ranking.playerId}
                  style={[styles.playoffRankingRow, { backgroundColor: theme.colors.surface }]}
                >
                  <View style={styles.playoffRankingLeft}>
                    <Text style={[styles.playoffRankNumber, { color: theme.colors.primary }]}>
                      {ranking.label}
                    </Text>
                  </View>
                  <Text style={[styles.playoffRankPlayerName, { color: theme.colors.onSurface }]}>
                    {ranking.playerName}
                  </Text>
                </View>
              ))}
            </View>
          ) : null;
        })()}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>{t('leagues.admin.dashboardSubtitle')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!league) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('leagueDetail.leagueNotFound')}</Text>
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
          <Text style={styles.headerTitle}>{league.name}</Text>
          <Text style={styles.headerSubtitle}>
            {league.startDate.toDate().toLocaleDateString('ko-KR')} -{' '}
            {league.endDate.toDate().toLocaleDateString('ko-KR')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {(() => {
            const buttonConfig = getHeaderButtonConfig();
            return buttonConfig ? (
              <IconButton
                icon={buttonConfig.icon}
                size={24}
                iconColor={buttonConfig.color}
                onPress={buttonConfig.onPress}
                disabled={buttonConfig.disabled}
              />
            ) : null;
          })()}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
          onPress={() => setActiveTab('matches')}
        >
          <Ionicons
            name='trophy-outline'
            size={16}
            color={activeTab === 'matches' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              activeTab === 'matches' && [styles.activeTabText, { color: theme.colors.primary }],
            ]}
          >
            {t('leagueDetail.tabs.matches')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'participants' && styles.activeTab]}
          onPress={() => setActiveTab('participants')}
        >
          <Ionicons
            name='people-outline'
            size={16}
            color={
              activeTab === 'participants' ? theme.colors.primary : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              activeTab === 'participants' && [
                styles.activeTabText,
                { color: theme.colors.primary },
              ],
            ]}
          >
            {t('leagueDetail.tabs.participants')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'standings' && styles.activeTab]}
          onPress={() => setActiveTab('standings')}
        >
          <Ionicons
            name='podium-outline'
            size={16}
            color={activeTab === 'standings' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              activeTab === 'standings' && [styles.activeTabText, { color: theme.colors.primary }],
            ]}
          >
            {t('leagueDetail.tabs.standings')}
          </Text>
        </TouchableOpacity>

        {/* Management 탭 - 관리자만 표시 */}
        {isAdminOrManager && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'management' && styles.activeTab]}
            onPress={() => setActiveTab('management')}
          >
            <Ionicons
              name='settings-outline'
              size={16}
              color={
                activeTab === 'management' ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.onSurfaceVariant },
                activeTab === 'management' && [
                  styles.activeTabText,
                  { color: theme.colors.primary },
                ],
              ]}
            >
              {t('leagueDetail.tabs.management')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'matches' &&
          // 🎭 [Center Stage] Conditional rendering for UI transition
          (league?.status === 'ongoing' || league?.status === 'playoffs' || matches.length > 0 ? (
            // Show matches list when league is active or matches exist
            <>
              {/* 플레이오프 상태 표시 */}
              {league?.status === 'playoffs' && league.playoff && (
                <Card
                  style={styles.playoffStatusCard}
                  onPress={() => {
                    setActiveTab('standings');
                    setStandingsViewMode('bracket');
                  }}
                >
                  <Card.Content>
                    <View style={styles.playoffStatusContainer}>
                      <View style={styles.playoffHeaderRow}>
                        <Ionicons name='trophy' size={28} color='#FFD700' />
                        <Title style={styles.playoffStatusTitle}>
                          {t('leagueDetail.playoffInProgress')}
                        </Title>
                      </View>
                      <View style={styles.playoffInfoRow}>
                        <Text style={styles.playoffInfoLabel}>
                          {t('leagueDetail.tournamentFormat')}
                        </Text>
                        <Text style={styles.playoffInfoValue}>
                          {league.playoff.type === 'final'
                            ? t('leagueDetail.finalMatch')
                            : t('leagueDetail.semifinals')}
                        </Text>
                      </View>
                      <View style={styles.playoffInfoRow}>
                        <Text style={styles.playoffInfoLabel}>
                          {league.eventType === 'mens_doubles' ||
                          league.eventType === 'womens_doubles' ||
                          league.eventType === 'mixed_doubles'
                            ? t('leagueDetail.qualifiedTeams')
                            : t('leagueDetail.qualifiedPlayers')}
                        </Text>
                        <Text style={styles.playoffInfoValue}>
                          {league.playoff.qualifiedPlayers.length}
                          {league.eventType === 'mens_doubles' ||
                          league.eventType === 'womens_doubles' ||
                          league.eventType === 'mixed_doubles'
                            ? t('leagueDetail.teams')
                            : t('leagueDetail.players')}
                        </Text>
                      </View>
                      {league.playoff.winner && (
                        <View style={styles.winnerContainer}>
                          <Ionicons name='medal' size={20} color='#FFD700' />
                          <Text style={styles.winnerText}>
                            우{t('leagueDetail.wins')}자:{' '}
                            {league.standings.find(s => s.playerId === league.playoff?.winner)
                              ?.playerName || t('leagueDetail.unknownPlayer')}
                          </Text>
                        </View>
                      )}
                      {/* 🎯 [KIM] 클릭 안내 문구 추가 */}
                      <View style={styles.playoffTapHintContainer}>
                        <Text style={styles.playoffTapHintText}>
                          {t('leagueDetail.tapToViewBracket')}
                        </Text>
                        <Ionicons name='chevron-forward' size={18} color={theme.colors.primary} />
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              )}

              {/* 플레이오프 시작 버튼 */}
              {shouldShowStartPlayoffsButton() && (
                <Card style={styles.playoffCard}>
                  <Card.Content>
                    <View style={styles.playoffContainer}>
                      <Ionicons name='trophy' size={32} color='#FFD700' />
                      <View style={styles.playoffTextContainer}>
                        <Title style={styles.playoffTitle}>
                          {t('leagueDetail.regularSeasonComplete')}
                        </Title>
                        <Paragraph style={styles.playoffSubtitle}>
                          {t('leagueDetail.allMatchesCompleteStartPlayoffs')}
                        </Paragraph>
                      </View>
                    </View>
                    <Button
                      mode='contained'
                      onPress={handleStartPlayoffs}
                      loading={isStartingPlayoffs}
                      disabled={isStartingPlayoffs}
                      style={styles.playoffButton}
                      icon='trophy'
                    >
                      {t('leagueDetail.startPlayoffsButton')}
                    </Button>
                  </Card.Content>
                </Card>
              )}

              {/* Bulk approval button for admin when there are pending matches */}
              {isAdminOrManager &&
                matches.filter(match => match.status === 'pending_approval').length > 0 && (
                  <Card style={[styles.roundProgressCard, { marginBottom: 16 }]}>
                    <Card.Content>
                      <View style={styles.bulkApprovalContainer}>
                        <Ionicons name='checkmark-circle-outline' size={24} color='#4CAF50' />
                        <View style={styles.bulkApprovalTextContainer}>
                          <Text style={styles.bulkApprovalTitle}>
                            {t('leagueDetail.wins')}인 대기 중인 {t('leagueDetail.matches')} (
                            {matches.filter(match => match.status === 'pending_approval').length}개)
                          </Text>
                          <Text style={styles.bulkApprovalText}>
                            제출된 모든 {t('leagueDetail.matches')} 결과를 한번에{' '}
                            {t('leagueDetail.wins')}인할 수 있습니다.
                          </Text>
                        </View>
                        <Button
                          mode='contained'
                          onPress={() => setShowBulkApprovalDialog(true)}
                          style={styles.bulkApprovalButton}
                          loading={bulkApprovingMatches}
                          disabled={bulkApprovingMatches}
                          icon='check-all'
                        >
                          모든 결과 {t('leagueDetail.wins')}인
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                )}

              <MatchList
                matches={matches}
                onMatchPress={handleSubmitResult}
                userRole={userRole}
                onAdminAction={{
                  onCorrectResult: match => {
                    console.log('🛠️ [Admin] Correcting match result:', match);
                    setSelectedMatch(match);
                    setShowScoreInputModal(true); // ✅ Reuse existing score input modal!
                  },
                  onReschedule: match => {
                    setSelectedMatch(match);
                    setShowRescheduleDialog(true);
                  },
                  onWalkover: match => {
                    setSelectedMatch(match);
                    setShowWalkoverDialog(true);
                  },
                }}
                matchMenuVisible={matchMenuVisible}
                setMatchMenuVisible={setMatchMenuVisible}
              />
            </>
          ) : (
            // Show pre-league dashboard when no matches yet
            renderEmptyState()
          ))}

        {activeTab === 'participants' && (
          <View>
            {/* Pre-league states: Show participant management for admins */}
            {isAdminOrManager && (league?.status === 'preparing' || league?.status === 'open') ? (
              <>
                {/* {t('leagueDetail.participantsStatus')} 카드 */}
                <Card style={styles.participantStatsCard}>
                  <Card.Content>
                    <Title style={styles.participantStatsTitle}>
                      {t('leagueDetail.participantsStatus')}
                    </Title>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <PaperText style={[styles.statValue, { color: theme.colors.primary }]}>
                          {league?.participants?.length || 0}
                        </PaperText>
                        <PaperText
                          style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                        >
                          {t('leagues.admin.approved')}
                        </PaperText>
                      </View>
                      <View style={styles.statItem}>
                        <PaperText style={[styles.statValue, { color: theme.colors.primary }]}>
                          {applications.filter(app => app.status === 'pending').length}
                        </PaperText>
                        <PaperText
                          style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                        >
                          {t('leagues.admin.pending')}
                        </PaperText>
                      </View>
                      <View style={styles.statItem}>
                        <PaperText style={[styles.statValue, { color: theme.colors.primary }]}>
                          {league?.settings?.maxParticipants || 16}
                        </PaperText>
                        <PaperText
                          style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                        >
                          {t('leagueDetail.maxParticipants')}
                        </PaperText>
                      </View>
                    </View>
                  </Card.Content>
                </Card>

                {/* {t('leagues.admin.participantList')} */}
                <Card style={styles.participantListCard}>
                  <Card.Content>
                    <Title style={styles.participantListTitle}>
                      {t('leagues.admin.participantList')}
                    </Title>
                    {league?.participants && league.participants.length > 0 ? (
                      league.participants.map((participant, index) => {
                        // Handle both formats: string (legacy) and object (Phase 5.8)
                        const isObject = typeof participant === 'object';
                        const playerId = isObject ? participant.playerId : participant;
                        const playerName = isObject
                          ? participant.playerName
                          : t('leagueDetail.noName');

                        return (
                          <View
                            key={playerId || `participant-${index}`}
                            style={styles.participantRow}
                          >
                            <View style={styles.participantInfo}>
                              <PaperText
                                style={[styles.participantName, { color: theme.colors.onSurface }]}
                                numberOfLines={2}
                              >
                                {playerName}
                              </PaperText>
                            </View>

                            {/* Approved status chip and remove button */}
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                flexShrink: 0,
                              }}
                            >
                              <Chip
                                mode='outlined'
                                textStyle={{
                                  color: theme.colors.primary,
                                  fontSize: 12,
                                  fontWeight: '500',
                                }}
                                style={{
                                  borderColor: theme.colors.primary,
                                  backgroundColor: theme.colors.primaryContainer,
                                }}
                                icon='check-circle'
                              >
                                {t('leagues.admin.approved')}
                              </Chip>
                              {/* Remove participant button */}
                              <TouchableOpacity
                                onPress={() => handleRemoveParticipant(playerId, playerName)}
                                style={{
                                  padding: 6,
                                  borderRadius: 16,
                                  backgroundColor: theme.colors.errorContainer,
                                }}
                              >
                                <Ionicons name='close' size={16} color={theme.colors.error} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.emptyState}>
                        <Ionicons
                          name='people-outline'
                          size={64}
                          color={theme.colors.onSurfaceVariant}
                        />
                        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                          {t('leagues.admin.noApplicants')}
                        </Text>
                        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                          {t('leagueDetail.waitingForApplications')}
                        </Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              </>
            ) : (
              <>
                {/* {t('leagueDetail.participantsStatus')} 카드 */}
                <View style={styles.participantStatsCard}>
                  <Text style={styles.participantStatsTitle}>
                    {league.eventType === 'mens_doubles' ||
                    league.eventType === 'womens_doubles' ||
                    league.eventType === 'mixed_doubles'
                      ? t('leagueDetail.participantsTeamStatus')
                      : t('leagueDetail.participantsStatus')}
                  </Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                        {league?.participants?.length || 0}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                        {league.eventType === 'mens_doubles' ||
                        league.eventType === 'womens_doubles' ||
                        league.eventType === 'mixed_doubles'
                          ? t('leagueDetail.participantsTeams')
                          : t('leagueDetail.participants')}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                        {league?.settings?.maxParticipants || 16}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                        {league.eventType === 'mens_doubles' ||
                        league.eventType === 'womens_doubles' ||
                        league.eventType === 'mixed_doubles'
                          ? t('leagueDetail.maxTeams')
                          : t('leagueDetail.maxParticipants')}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                        {league?.participants?.length && league?.settings?.maxParticipants
                          ? Math.round(
                              (league.participants.length / league.settings.maxParticipants) * 100
                            )
                          : 0}
                        %
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                        {t('leagueDetail.fillRate')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* t('leagueDetail.playoffRankings')표 (completed 또는 playoffs 상태일 때만 표시) */}
                {(() => {
                  // ✅ Calculate rankings from playoff_matches in real-time
                  if (league?.status !== 'playoffs' && league?.status !== 'completed') {
                    return null;
                  }

                  const playoffMatches = matches.filter(
                    m => m.isPlayoffMatch === true
                  ) as unknown as PlayoffMatch[];
                  if (playoffMatches.length === 0) {
                    return null;
                  }

                  // Find final and consolation matches (using type-based detection)
                  const finalMatch = playoffMatches.find(m => m.type === 'final');
                  const consolationMatch = playoffMatches.find(m => m.type === 'consolation');

                  const rankings = [];

                  // 1st and 2nd place from final match
                  if (finalMatch?.status === 'completed' && finalMatch.winner) {
                    const winnerId = finalMatch.winner;
                    const loserId =
                      finalMatch.player1Id === winnerId
                        ? finalMatch.player2Id
                        : finalMatch.player1Id;
                    const winnerName =
                      finalMatch.player1Id === winnerId
                        ? finalMatch.player1Name
                        : finalMatch.player2Name;
                    const loserName =
                      finalMatch.player1Id === loserId
                        ? finalMatch.player1Name
                        : finalMatch.player2Name;

                    rankings.push({
                      rank: 1,
                      playerId: winnerId,
                      playerName: winnerName,
                      label: t('leagueDetail.champion'),
                    });
                    rankings.push({
                      rank: 2,
                      playerId: loserId,
                      playerName: loserName,
                      label: t('leagueDetail.runnerUp'),
                    });
                  }

                  // 3rd and 4th place from consolation match
                  if (consolationMatch?.status === 'completed' && consolationMatch.winner) {
                    const winnerId = consolationMatch.winner;
                    const loserId =
                      consolationMatch.player1Id === winnerId
                        ? consolationMatch.player2Id
                        : consolationMatch.player1Id;
                    const winnerName =
                      consolationMatch.player1Id === winnerId
                        ? consolationMatch.player1Name
                        : consolationMatch.player2Name;
                    const loserName =
                      consolationMatch.player1Id === loserId
                        ? consolationMatch.player1Name
                        : consolationMatch.player2Name;

                    rankings.push({
                      rank: 3,
                      playerId: winnerId,
                      playerName: winnerName,
                      label: t('leagueDetail.thirdPlace'),
                    });
                    rankings.push({
                      rank: 4,
                      playerId: loserId,
                      playerName: loserName,
                      label: t('leagueDetail.fourthPlace'),
                    });
                  }

                  return rankings.length > 0 ? (
                    <View style={styles.playoffRankingsCard}>
                      <Text
                        style={[styles.playoffRankingsTitle, { color: theme.colors.onSurface }]}
                      >
                        {t('leagueDetail.playoffRankings')}
                      </Text>
                      {rankings.map(ranking => (
                        <View
                          key={ranking.playerId}
                          style={[
                            styles.playoffRankingRow,
                            { backgroundColor: theme.colors.surface },
                          ]}
                        >
                          <View style={styles.playoffRankingLeft}>
                            <Text
                              style={[styles.playoffRankNumber, { color: theme.colors.primary }]}
                            >
                              {ranking.label}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.playoffRankPlayerName,
                              { color: theme.colors.onSurface },
                            ]}
                          >
                            {ranking.playerName}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null;
                })()}

                {/* {t('leagues.admin.participantList')} */}
                {league?.participants && league.participants.length > 0 ? (
                  <>
                    <Text style={[styles.participantListTitle, { color: theme.colors.onSurface }]}>
                      {t('leagues.admin.participantList')}
                    </Text>
                    {/* Sort participants by standings (points, wins) if available */}
                    {league.participants
                      .map(participant => {
                        // Handle both formats: string (legacy) and object (Phase 5.8)
                        const isObject = typeof participant === 'object';
                        const playerId = isObject ? participant.playerId : participant;
                        const playerName = isObject
                          ? participant.playerName
                          : t('leagueDetail.noName');
                        const standing = league.standings?.find(s => s.playerId === playerId);

                        return {
                          isObject,
                          playerId,
                          playerName,
                          standing,
                          participant,
                        };
                      })
                      .sort((a, b) => {
                        // Sort by standings if available
                        if (a.standing && b.standing) {
                          // Primary: points
                          if (a.standing.points !== b.standing.points) {
                            return b.standing.points - a.standing.points;
                          }
                          // Secondary: wins
                          if (a.standing.won !== b.standing.won) {
                            return b.standing.won - a.standing.won;
                          }
                          // Tertiary: losses (fewer losses better)
                          if (a.standing.lost !== b.standing.lost) {
                            return a.standing.lost - b.standing.lost;
                          }
                        }
                        // If no standings or tie, keep original order
                        return 0;
                      })
                      .map((item, index) => {
                        const { playerId, playerName, standing } = item;

                        return (
                          <View
                            key={playerId}
                            style={[
                              styles.participantCard,
                              { backgroundColor: theme.colors.surface },
                            ]}
                          >
                            <View style={styles.participantInfo}>
                              <Text
                                style={[styles.participantRank, { color: theme.colors.primary }]}
                              >
                                #{index + 1}
                              </Text>
                              <Text
                                style={[styles.participantName, { color: theme.colors.onSurface }]}
                              >
                                {playerName}
                              </Text>
                            </View>
                            <View style={styles.participantRightSection}>
                              {standing && (
                                <View style={styles.participantStats}>
                                  <Text
                                    style={[
                                      styles.participantRecord,
                                      { color: theme.colors.onSurfaceVariant },
                                    ]}
                                  >
                                    {t('leagueDetail.winsLosses', {
                                      wins: standing.won,
                                      losses: standing.lost,
                                    })}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.participantPoints,
                                      { color: theme.colors.primary },
                                    ]}
                                  >
                                    {standing.points}
                                    {t('leagueDetail.points')}
                                  </Text>
                                </View>
                              )}
                              {isAdminOrManager &&
                                (league?.status === 'preparing' || league?.status === 'open') && (
                                  <TouchableOpacity
                                    onPress={() => handleRemoveParticipant(playerId, playerName)}
                                    style={styles.removeButton}
                                  >
                                    <Ionicons
                                      name='close-circle'
                                      size={24}
                                      color={theme.colors.error}
                                    />
                                  </TouchableOpacity>
                                )}
                            </View>
                          </View>
                        );
                      })}
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name='people-outline'
                      size={64}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                      {t('leagues.admin.noApplicants')}
                    </Text>
                    <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                      {league?.status === 'preparing'
                        ? t('leagueDetail.startApplicationsMessage')
                        : t('leagueDetail.waitingForApplications')}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {activeTab === 'standings' && (
          <>
            {/* 플레이오프 시: {t('leagueDetail.standings')}표/브래킷 토글 탭 */}
            {(() => {
              const playoffMatches = matches.filter(m => m.isPlayoffMatch);

              // 🔍 DEBUG: {t('leagueDetail.playoffBracket')} 탭 표시 조건 확인
              console.log('🔍 [DEBUG - Standings Tab] Playoff bracket toggle visibility check:', {
                leagueStatus: league?.status,
                totalMatches: matches.length,
                playoffMatches: playoffMatches.length,
                hasPlayoff: !!league?.playoff,
                playoffData: league?.playoff,
                matchesWithIsPlayoffMatch: matches.filter(m => m.isPlayoffMatch === true).length,
                allMatchesData: matches.map(m => ({
                  id: m.id,
                  isPlayoffMatch: m.isPlayoffMatch,
                  round: m.round,
                  status: m.status,
                })),
              });

              return (
                league?.playoff &&
                (league?.status === 'playoffs' || league?.status === 'completed') &&
                playoffMatches.length > 0 && (
                  <View style={styles.standingsSubTabs}>
                    <TouchableOpacity
                      style={[
                        styles.standingsSubTab,
                        standingsViewMode === 'standings' && styles.standingsSubTabActive,
                      ]}
                      onPress={() => setStandingsViewMode('standings')}
                    >
                      <Text
                        style={[
                          styles.standingsSubTabText,
                          standingsViewMode === 'standings' && styles.standingsSubTabTextActive,
                        ]}
                      >
                        {t('leagueDetail.standingsTable')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.standingsSubTab,
                        standingsViewMode === 'bracket' && styles.standingsSubTabActive,
                      ]}
                      onPress={() => setStandingsViewMode('bracket')}
                    >
                      <Text
                        style={[
                          styles.standingsSubTabText,
                          standingsViewMode === 'bracket' && styles.standingsSubTabTextActive,
                        ]}
                      >
                        {t('leagueDetail.playoffBracket')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              );
            })()}

            {/* 컨텐츠 렌더링 */}
            {(() => {
              const playoffMatches = matches.filter(m => m.isPlayoffMatch);
              const hasPlayoffMatches =
                (league?.status === 'playoffs' || league?.status === 'completed') &&
                playoffMatches.length > 0;

              return hasPlayoffMatches ? (
                // 플레이오프: 토글 기반 렌더링
                standingsViewMode === 'standings' ? (
                  renderStandingsCard()
                ) : (
                  <TournamentBracketView
                    bracket={
                      convertPlayoffToBracketFormat(
                        playoffMatches as LeagueMatch[]
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ) as any
                    }
                    currentUserId={currentUser?.uid}
                    isTournamentAdmin={isAdminOrManager}
                    onMatchPress={bracketMatch => {
                      // 브래킷 매치 ID로 원본 LeagueMatch 찾기
                      const originalMatch = matches.find(m => m.id === bracketMatch.id);
                      if (originalMatch) {
                        handleSubmitResult(originalMatch as LeagueMatch);
                      }
                    }}
                  />
                )
              ) : (
                // 일반 리그: {t('leagueDetail.standings')}표만 표시
                renderStandingsCard()
              );
            })()}
          </>
        )}

        {activeTab === 'management' && isAdminOrManager && (
          <View>
            {/* {t('leagueDetail.management')}자 대시보드 카드 (preparing 상태) */}
            {league?.status === 'preparing' && (
              <View
                style={[
                  styles.adminDashboardCard,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <View style={styles.dashboardIcon}>
                  <Ionicons name='shield-checkmark' size={40} color={theme.colors.primary} />
                </View>
                <Text style={[styles.dashboardTitle, { color: theme.colors.onPrimaryContainer }]}>
                  {t('leagueDetail.adminDashboard.title')}
                </Text>
                <Text style={[styles.dashboardSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {t('leagueDetail.adminDashboard.description')}
                </Text>
              </View>
            )}

            {/* {t('leagueDetail.participantsStatus')} 섹션 */}
            <View style={styles.managementSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('leagueDetail.participantsStatus')}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {league?.participants?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {t('leagues.admin.approved')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {league?.settings?.maxParticipants || 16}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {t('leagueDetail.maxParticipants')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {matches.length > 0
                      ? Math.round(
                          (matches.filter(m => m.status === 'completed').length / matches.length) *
                            100
                        )
                      : 0}
                    %
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {t('leagueDetail.matchProgress')}
                  </Text>
                </View>
              </View>

              {/* 정원 도달 알림 */}
              {league?.participants &&
                league.participants.length >= (league?.settings?.maxParticipants || 16) && (
                  <View
                    style={[
                      styles.registrationFullNotice,
                      { backgroundColor: theme.colors.primaryContainer },
                    ]}
                  >
                    <Ionicons name='checkmark-circle' size={20} color={theme.colors.primary} />
                    <Text style={[styles.registrationFullText, { color: theme.colors.primary }]}>
                      신청이 완료되었으니 마감하실 준비가 되었습니다.
                    </Text>
                  </View>
                )}
            </View>

            {/* {t('leagueDetail.addParticipantsDirectly')} 버튼 */}
            {league?.status === 'open' && (
              <TouchableOpacity
                style={[
                  styles.secondaryActionButton,
                  isAddingParticipant && styles.disabledButton,
                  {
                    marginBottom: 12,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.primary,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  },
                ]}
                onPress={() => setShowUserSearchModal(true)}
                disabled={isAddingParticipant}
              >
                <Ionicons name='person-add-outline' size={20} color={theme.colors.primary} />
                <Text style={[styles.secondaryActionButtonText, { color: theme.colors.primary }]}>
                  {t('leagueDetail.adminDashboard.addParticipantButton')}
                </Text>
              </TouchableOpacity>
            )}

            {/* {t('leagues.admin.participantList')} 섹션 (대진표 생성 전에만 표시) */}
            {(league?.status === 'preparing' || league?.status === 'open') && (
              <Card style={styles.participantListCard}>
                <Card.Content>
                  <Title style={styles.participantListTitle}>
                    {t('leagues.admin.participantList')}
                  </Title>
                  {league?.participants && league.participants.length > 0 ? (
                    league.participants.map(participant => {
                      // Handle both formats: string (legacy) and object (Phase 5.8)
                      const isObject = typeof participant === 'object';
                      const playerId = isObject ? participant.playerId : participant;
                      const playerName = isObject
                        ? participant.playerName
                        : t('leagueDetail.noName');

                      return (
                        <View key={playerId} style={styles.participantRow}>
                          <View style={styles.participantInfo}>
                            <PaperText
                              style={[styles.participantName, { color: theme.colors.onSurface }]}
                              numberOfLines={2}
                            >
                              {playerName}
                            </PaperText>
                          </View>

                          {/* Approved status chip and remove button */}
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                              flexShrink: 0,
                            }}
                          >
                            <Chip
                              mode='outlined'
                              textStyle={{
                                color: theme.colors.primary,
                                fontSize: 12,
                                fontWeight: '500',
                              }}
                              style={{
                                borderColor: theme.colors.primary,
                                backgroundColor: theme.colors.primaryContainer,
                              }}
                              icon='check-circle'
                            >
                              {t('leagues.admin.approved')}
                            </Chip>
                            {/* Remove participant button */}
                            <TouchableOpacity
                              onPress={() => handleRemoveParticipant(playerId, playerName)}
                              style={{
                                padding: 6,
                                borderRadius: 16,
                                backgroundColor: theme.colors.errorContainer,
                              }}
                            >
                              <Ionicons name='close' size={16} color={theme.colors.error} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons
                        name='people-outline'
                        size={64}
                        color={theme.colors.onSurfaceVariant}
                      />
                      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                        {t('leagues.admin.noApplicants')}
                      </Text>
                      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                        {t('leagueDetail.waitingForApplications')}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            )}

            {/* League Management Section */}
            <View style={styles.managementSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('leagueDetail.leagueManagement')}
              </Text>

              {/* 대진표 생성 버튼 (open 상태) */}
              {league?.status === 'open' &&
                (() => {
                  // 🎯 [KIM FIX] 최소 {t('leagueDetail.participants')} 수 검증 - 토너먼트와 동일한 로직 적용
                  const participantCount = league?.participants?.length || 0;
                  const isDoubles = league?.eventType
                    ? getMatchFormatFromEventType(league.eventType) === 'doubles'
                    : false;
                  // 단식: 최소 2명, 복식: 최소 4명 (2팀)
                  const hasMinimumParticipants = isDoubles
                    ? participantCount >= 4 // 복식: 2팀 = 4명
                    : participantCount >= 2; // 단식: 2명

                  return (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.primaryActionButton,
                          (isGeneratingBracket || !hasMinimumParticipants) && { opacity: 0.6 },
                          { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={handleGenerateBracket}
                        disabled={isGeneratingBracket || !hasMinimumParticipants}
                      >
                        <Ionicons name='grid-outline' size={20} color='#fff' />
                        <Text style={styles.primaryActionButtonText}>
                          {t('leagueDetail.generateBracketAndStartLeague')}
                        </Text>
                      </TouchableOpacity>

                      {/* 🎯 [KIM FIX] 최소 {t('leagueDetail.participants')} 미달 경고 메시지 */}
                      {!hasMinimumParticipants && (
                        <View
                          style={[
                            styles.warningBox,
                            { backgroundColor: theme.colors.errorContainer },
                          ]}
                        >
                          <Ionicons name='warning-outline' size={20} color={theme.colors.error} />
                          <Text style={[styles.warningText, { color: theme.colors.error }]}>
                            {isDoubles
                              ? t('leagueDetail.minParticipantsDoublesWarning', {
                                  current: participantCount,
                                })
                              : t('leagueDetail.minParticipantsSinglesWarning', {
                                  current: participantCount,
                                })}
                          </Text>
                        </View>
                      )}
                    </>
                  );
                })()}

              {/* 라운드 로빈 진행 상황 표시 */}
              {!shouldShowStartPlayoffsButton() &&
                league?.status === 'ongoing' &&
                isAdminOrManager && (
                  <Card style={styles.roundProgressCard}>
                    <Card.Content>
                      <View style={styles.roundProgressContainer}>
                        <Ionicons name='hourglass-outline' size={24} color='#FF9800' />
                        <View style={styles.roundProgressTextContainer}>
                          <Title style={styles.roundProgressTitle}>
                            {t('leagueDetail.roundRobinInProgress')}
                          </Title>
                          <Paragraph style={styles.roundProgressSubtitle}>
                            {(() => {
                              // Use same fallback logic as playoff detection
                              let participantCount = league.participants?.length || 0;

                              // league.participants가 비어있으면 매치 데이터에서 {t('leagueDetail.participants')} 추출 (fallback)
                              if (participantCount === 0 && matches.length > 0) {
                                const uniquePlayerIds = new Set<string>();
                                matches.forEach(match => {
                                  const player1Id = match.player1Id;
                                  const player2Id = match.player2Id;

                                  if (player1Id) uniquePlayerIds.add(player1Id);
                                  if (player2Id) uniquePlayerIds.add(player2Id);
                                });
                                participantCount = uniquePlayerIds.size;
                              }

                              const expectedMatches =
                                (participantCount * (participantCount - 1)) / 2;
                              const completedMatches = matches.filter(
                                m => m.status === 'completed'
                              ).length;
                              return t('leagueDetail.roundRobinProgress', {
                                completed: completedMatches,
                                total: expectedMatches,
                              });
                            })()}
                          </Paragraph>
                          <Paragraph style={styles.roundProgressNote}>
                            {t('leagueDetail.roundRobinRequirement')}
                          </Paragraph>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                )}

              {/* {t('leagueDetail.deleteBracket')} 버튼 ({t('leagueDetail.management')}자만, 매치가 있을 때만, 완료되지 않은 리그만 표시) */}
              {isAdminOrManager && matches.length > 0 && league?.status !== 'completed' && (
                <Card style={styles.dangerCard}>
                  <Card.Content>
                    <View style={styles.dangerContainer}>
                      <Ionicons name='warning' size={28} color='#F44336' />
                      <View style={styles.dangerTextContainer}>
                        <Title style={styles.dangerTitle}>{t('leagueDetail.deleteBracket')}</Title>
                        <Paragraph style={styles.dangerSubtitle}>
                          {t('leagueDetail.deleteBracketWarning')}
                        </Paragraph>
                      </View>
                    </View>
                    <Button
                      mode='contained'
                      onPress={handleClearMatches}
                      loading={isClearingMatches}
                      disabled={isClearingMatches}
                      style={styles.dangerButton}
                      icon='delete'
                    >
                      {t('leagueDetail.deleteBracket')}
                    </Button>
                  </Card.Content>
                </Card>
              )}
            </View>

            {/* Danger Zone (완료되지 않은 리그만 표시) */}
            {league?.status !== 'completed' && (
              <View style={styles.dangerZone}>
                <Text style={styles.dangerZoneTitle}>{t('leagueDetail.dangerZone')}</Text>
                <TouchableOpacity style={styles.deleteLeagueButton} onPress={handleDeleteLeague}>
                  <Ionicons name='trash' size={20} color='#fff' />
                  <Text style={styles.deleteLeagueButtonText}>
                    {t('leagueDetail.deleteLeague')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 점수 입력 모달 */}
      {selectedMatch ? (
        <LeagueScoreInputModal
          visible={showScoreInputModal}
          match={selectedMatch}
          onSubmit={result => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handleScoreSubmit(result as any);
          }}
          onClose={() => {
            setShowScoreInputModal(false);
            setSelectedMatch(null);
          }}
          submitting={submittingResult}
        />
      ) : null}

      <Portal>
        {/* Reschedule Match Dialog */}
        <Dialog visible={showRescheduleDialog} onDismiss={() => setShowRescheduleDialog(false)}>
          <Dialog.Title>{t('leagueDetail.changeSchedule')}</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label={t('leagueDetail.newDateLabel')}
              value={adminActionData.newDate?.toISOString().split('T')[0]}
              onChangeText={text => {
                const date = new Date(text);
                if (!isNaN(date.getTime())) {
                  setAdminActionData({ ...adminActionData, newDate: date });
                }
              }}
              style={{ marginBottom: 10 }}
            />
            <PaperTextInput
              label={t('leagueDetail.reasonLabel')}
              value={adminActionData.reason}
              onChangeText={text => setAdminActionData({ ...adminActionData, reason: text })}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRescheduleDialog(false)}>{t('common.cancel')}</Button>
            <Button onPress={handleRescheduleMatch} loading={submittingResult}>
              {t('leagueDetail.change')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Walkover Dialog */}
        <Dialog visible={showWalkoverDialog} onDismiss={() => setShowWalkoverDialog(false)}>
          <Dialog.Title>{t('leagues.match.walkover')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{t('leagueDetail.whichPlayerWalkover')}</Paragraph>
            <Button
              mode={
                adminActionData.forfeitingPlayerId === selectedMatch?.player1Id
                  ? 'contained'
                  : 'outlined'
              }
              onPress={() =>
                setAdminActionData({
                  ...adminActionData,
                  forfeitingPlayerId: selectedMatch?.player1Id,
                })
              }
              style={{ marginTop: 10 }}
            >
              {selectedMatch?.player1Name}
            </Button>
            <Button
              mode={
                adminActionData.forfeitingPlayerId === selectedMatch?.player2Id
                  ? 'contained'
                  : 'outlined'
              }
              onPress={() =>
                setAdminActionData({
                  ...adminActionData,
                  forfeitingPlayerId: selectedMatch?.player2Id,
                })
              }
              style={{ marginTop: 10 }}
            >
              {selectedMatch?.player2Name}
            </Button>
            <PaperTextInput
              label={t('leagueDetail.walkoverReasonLabel')}
              value={adminActionData.reason}
              onChangeText={text => setAdminActionData({ ...adminActionData, reason: text })}
              multiline
              style={{ marginTop: 10 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowWalkoverDialog(false)}>{t('common.cancel')}</Button>
            <Button
              onPress={handleProcessWalkover}
              loading={submittingResult}
              disabled={!adminActionData.forfeitingPlayerId}
            >
              {t('leagues.match.walkover')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Bulk Approval Dialog */}
        <Dialog
          visible={showBulkApprovalDialog}
          onDismiss={() => !bulkApprovingMatches && setShowBulkApprovalDialog(false)}
        >
          <Dialog.Title>{t('leagueDetail.bulkApproval')}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.bulkApprovalDialogContent}>
              <Ionicons name='checkmark-circle' size={48} color='#4CAF50' />
              <Text style={styles.bulkApprovalDialogText}>
                {matches.filter(match => match.status === 'pending_approval').length}
                {t('leagueDetail.pendingApprovalsCount')}
                중인 {t('leagueDetail.matches')} 결과를 {t('leagueDetail.approveAll')}하시겠습니까?
              </Text>
              <Text style={styles.bulkApprovalDialogSubtext}>
                {t('leagueDetail.wins')}인된 결과는 {t('leagueDetail.standings')}표에 반영되며,
                되돌릴 수 없습니다.
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowBulkApprovalDialog(false)}
              disabled={bulkApprovingMatches}
            >
              {t('common.cancel')}
            </Button>
            <Button onPress={handleBulkApprovalConfirm} loading={bulkApprovingMatches}>
              {t('leagueDetail.approveAll')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 대진표 생성 중 로딩 오버레이 */}
      {isGeneratingBracket && (
        <View style={styles.generatingOverlay}>
          <View style={styles.generatingContainer}>
            <ActivityIndicator size='large' color='#1976d2' />
            <Text style={styles.generatingTitle}>{t('leagueDetail.generatingBracket')}</Text>
            <Text style={styles.generatingSubtitle}>{t('leagueDetail.leagueSoonStarts')}</Text>
          </View>
        </View>
      )}

      {/* User Search Modal */}
      <UserSearchModal
        visible={showUserSearchModal}
        onClose={() => setShowUserSearchModal(false)}
        onUserSelect={handleUserSelect}
        excludeUserIds={excludeUserIds}
        clubId={league?.clubId || ''}
        gameType={league?.eventType}
      />

      {/* Team Pairing Modal (for doubles) */}
      {isDoubles && (
        <TeamPairingModal
          visible={showTeamPairingModal}
          onClose={() => {
            setShowTeamPairingModal(false);
            setSelectedPlayersForTeaming([]);
          }}
          onConfirm={handleTeamConfirm}
          players={selectedPlayersForTeaming.map(p => ({
            uid: p.uid,
            displayName: p.displayName,
            photoURL: p.photoURL,
          }))}
        />
      )}

      {/* Partner Selection Modal (for individual doubles application) */}
      {console.log(
        '🔍 [RENDER] Partner Selection Modal - visible:',
        showPartnerSelectionModal,
        'clubId:',
        league?.clubId
      )}
      <UserSearchModal
        visible={showPartnerSelectionModal}
        onClose={() => {
          console.log('🔍 [MODAL] Partner selection modal closed by user');
          setShowPartnerSelectionModal(false);
        }}
        onUserSelect={handlePartnerSelected}
        excludeUserIds={[currentUser?.uid || '', ...excludeUserIds]}
        clubId={league?.clubId || ''}
        tournamentFormat='singles'
        gameType={league?.eventType}
      />

      {/* Playoff Created Modal */}
      {playoffCreatedData && (
        <PlayoffCreatedModal
          visible={showPlayoffModal}
          onClose={() => setShowPlayoffModal(false)}
          qualifiedPlayers={playoffCreatedData.qualifiedPlayers}
          playoffType={playoffCreatedData.playoffType}
          leagueName={league?.name || t('leagueDetail.league')}
          onViewMatches={() => {
            // Switch to matches tab (index 0)
            setActiveTab('matches');
          }}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
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
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    headerRight: {
      width: 40,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 6,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    activeTabText: {
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
      padding: 16,
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
    matchHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    matchHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    playersContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    playerName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    },
    vs: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginHorizontal: 8,
    },
    statusChip: {
      marginLeft: 8,
    },
    statusText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '600',
    },
    matchInfo: {
      gap: 6,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    scoreContainer: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    scoreLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    scoreText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    winnerText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    actionContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
    },
    standingsCard: {
      marginBottom: 12,
    },
    standingsHeader: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    standingsHeaderText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    standingRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    standingText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 16,
    },
    emptyCard: {
      marginTop: 40,
    },
    emptyContent: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    // 모달 스타일
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      margin: 20,
      maxWidth: 400,
      width: '100%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalContent: {
      padding: 20,
      maxHeight: 400,
    },
    matchInfoText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 16,
    },
    setInputContainer: {
      marginBottom: 16,
    },
    setLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
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
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    scoreTextInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      textAlign: 'center',
      width: 60,
    },
    scoreSeparator: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginHorizontal: 16,
    },
    setActions: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    calculateButton: {
      backgroundColor: theme.colors.primary,
      marginBottom: 16,
    },
    resultPreview: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    resultLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    resultScore: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    resultWinner: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
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
    // 대진표 생성 중 로딩 오버레이 스타일
    generatingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    generatingContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 32,
      alignItems: 'center',
      minWidth: 200,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    generatingTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    generatingSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    // 플레이오프 시작 버튼 스타일
    playoffCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    playoffContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    playoffTextContainer: {
      flex: 1,
      marginLeft: 16,
    },
    playoffTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    playoffSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    playoffButton: {
      backgroundColor: theme.colors.primary,
    },
    // 라운드 로빈 진행 상황 스타일
    roundProgressCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    roundProgressContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    roundProgressTextContainer: {
      flex: 1,
    },
    roundProgressTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    roundProgressSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
      marginBottom: 4,
    },
    roundProgressNote: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    // 플레이오프 상태 표시 스타일
    playoffStatusCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    playoffStatusContainer: {
      gap: 8,
    },
    playoffHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    playoffStatusTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginLeft: 8,
    },
    playoffInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    playoffInfoLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    playoffInfoValue: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    winnerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      padding: 8,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 8,
    },
    // 🎯 [KIM] 플레이오프 카드 탭 안내 스타일
    playoffTapHintContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    playoffTapHintText: {
      fontSize: 15,
      color: theme.colors.primary,
      marginRight: 4,
      fontWeight: '500',
    },
    winnerTextAlt: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    // {t('leagueDetail.deleteBracket')} 버튼 스타일
    // Complete league styles
    completeLeagueCard: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    completeLeagueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    completeLeagueTextContainer: {
      flex: 1,
      marginLeft: 16,
    },
    completeLeagueTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    completeLeagueSubtitle: {
      fontSize: 14,
      lineHeight: 20,
    },
    completeLeagueButton: {
      borderRadius: 8,
    },
    dangerCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.error,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    dangerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    dangerTextContainer: {
      flex: 1,
      marginLeft: 16,
    },
    dangerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.error,
      marginBottom: 4,
    },
    dangerSubtitle: {
      fontSize: 14,
      color: theme.colors.onErrorContainer,
      lineHeight: 20,
    },
    dangerButton: {
      backgroundColor: theme.colors.error,
    },
    // Bulk approval styles
    bulkApprovalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    bulkApprovalTextContainer: {
      flex: 1,
    },
    bulkApprovalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    bulkApprovalText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 16,
    },
    bulkApprovalButton: {
      backgroundColor: theme.colors.primary,
    },
    bulkApprovalDialogContent: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    bulkApprovalDialogText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    bulkApprovalDialogSubtext: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    secondaryActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    secondaryActionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    disabledButton: {
      opacity: 0.6,
    },
    // Management tab styles
    managementSection: {
      marginBottom: 24,
    },
    adminDashboardCard: {
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginBottom: 24,
    },
    dashboardIcon: {
      marginBottom: 12,
    },
    dashboardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    dashboardSubtitle: {
      fontSize: 14,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 16,
      marginBottom: 12,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      padding: 16,
      borderRadius: 8,
    },
    statValue: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
    },
    registrationFullNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      gap: 8,
    },
    registrationFullText: {
      flex: 1,
      fontSize: 14,
    },
    primaryActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 8,
      gap: 8,
      marginBottom: 12,
    },
    primaryActionButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    dangerActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.error,
      padding: 16,
      borderRadius: 8,
      gap: 8,
      marginBottom: 12,
    },
    dangerActionButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.errorContainer,
      padding: 12,
      borderRadius: 8,
      gap: 8,
      marginTop: 12,
    },
    warningText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.error,
    },
    dangerZone: {
      backgroundColor: theme.colors.errorContainer,
      borderWidth: 1,
      borderColor: theme.colors.error,
      borderRadius: 12,
      padding: 16,
      marginTop: 24,
    },
    dangerZoneTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.error,
      marginBottom: 12,
    },
    deleteLeagueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.error,
      padding: 16,
      borderRadius: 8,
      gap: 8,
    },
    deleteLeagueButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    // Participants tab styles
    participantStatsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    participantStatsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.colors.onSurface,
    },
    playoffRankingsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    playoffRankingsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    playoffRankingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    playoffRankingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    playoffRankNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      minWidth: 40,
    },
    playoffRankLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    playoffRankPlayerName: {
      fontSize: 16,
      fontWeight: '600',
    },
    playoffRankingsEmpty: {
      fontSize: 14,
      textAlign: 'center',
      paddingVertical: 20,
    },
    participantListTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      marginTop: 8,
    },
    participantCard: {
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    participantInfo: {
      flex: 1, // 🎯 [KIM FIX] Take remaining space to prevent name overflow
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginRight: 8, // Space between name and chip
    },
    participantRank: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    participantName: {
      fontSize: 16,
      flexShrink: 1, // 🎯 [KIM FIX] Allow text to shrink when space is limited
    },
    participantStats: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    participantRecord: {
      fontSize: 14,
    },
    participantPoints: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    participantRightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    removeButton: {
      padding: 4,
    },
    // Participant list card styles
    participantListCard: {
      marginBottom: 16,
    },
    participantRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    participantDate: {
      fontSize: 12,
      marginTop: 2,
    },
    approveButton: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    // Standings tab styles
    standingsCell: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    standingsCellText: {
      fontSize: 14,
      textAlign: 'center',
    },
    standingsRow: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    // {t('leagueDetail.standings')} 탭 서브탭 ({t('leagueDetail.standings')}표/브래킷 토글)
    standingsSubTabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    standingsSubTab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    standingsSubTabActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    standingsSubTabText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    standingsSubTabTextActive: {
      color: theme.colors.primary,
    },
  });

export default LeagueDetailScreen;
