import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useClub } from '../../contexts/ClubContext';
import { useTheme } from '../../hooks/useTheme';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase/config';
import tournamentService from '../../services/tournamentService';
import {
  Tournament,
  TournamentStatus,
  BracketMatch,
  DoublesTeam,
  TournamentScore,
  getMatchFormatFromTournamentEventType,
} from '../../types/tournament';
import { ScoreInputForm, Match } from '../../types/match';
import CreateClubTournamentForm from '../../components/clubs/tournaments/CreateClubTournamentForm';
import TournamentBracketView from '../../components/tournaments/TournamentBracketView';
import TournamentRankingsTab from '../../components/tournaments/TournamentRankingsTab';
import ScoreInputContent from '../../components/tournaments/ScoreInputContent';
import UserSearchModal from '../../components/modals/UserSearchModal';
import TeamPairingModal from '../../components/modals/TeamPairingModal';
import { modalStyles } from '../../styles/modalStyles';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type ClubTournamentManagementRouteProp = RouteProp<RootStackParamList, 'ClubTournamentManagement'>;
type ClubTournamentManagementNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ClubTournamentManagementScreen = () => {
  const navigation = useNavigation<ClubTournamentManagementNavigationProp>();
  const route = useRoute<ClubTournamentManagementRouteProp>();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { currentClub } = useClub();
  const { paperTheme: theme } = useTheme();

  // Get clubId and autoCreate from route params or current club context
  const clubId = route.params?.clubId || currentClub?.id;
  const autoCreate = route.params?.autoCreate;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<{ [tournamentId: string]: BracketMatch[] }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Tournament detail modal states
  const [showTournamentDetail, setShowTournamentDetail] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<
    'matches' | 'participants' | 'standings' | 'management'
  >('management');

  // Score input state - Flow Switch pattern for management screen
  const [scoreInputMode, setScoreInputMode] = useState(false);
  const [selectedMatchForScoring, setSelectedMatchForScoring] = useState<BracketMatch | null>(null);

  // Manual round generation state
  const [isGeneratingRound, setIsGeneratingRound] = useState(false);
  // 🎯 [KIM FIX] Bracket generation loading state for UX improvement
  const [isGeneratingBracket, setIsGeneratingBracket] = useState(false);
  const [roundGenerationStatus, setRoundGenerationStatus] = useState<{
    [tournamentId: string]: {
      canGenerate: boolean;
      reason?: string;
      currentRound?: number;
      nextRound?: number;
    };
  }>({});

  // 🏛️ OLYMPUS MISSION - Phase 1.1: User search modal state
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  // 🏛️ OLYMPUS MISSION - Phase 1.2: Team pairing modal state (for doubles tournaments)
  const [showTeamPairingModal, setShowTeamPairingModal] = useState(false);
  const [selectedPlayersForTeaming, setSelectedPlayersForTeaming] = useState<
    Array<{ uid: string; displayName: string; photoURL?: string }>
  >([]);

  // 🏛️ OLYMPUS MISSION - Phase 1.1: Memoize excludeUserIds to prevent infinite loop
  // Prevents infinite re-renders by only creating new array when participants actually change
  const excludeUserIds = useMemo(() => {
    return selectedTournament?.participants?.map(p => p.playerId) || [];
  }, [selectedTournament?.participants]);

  // Real-time match subscription references
  const matchSubscriptions = useRef<{ [tournamentId: string]: () => void }>({});

  // 🎯 [KIM FIX] Track if current user is deleting to skip "deleted by another admin" alert
  const isDeletingRef = useRef(false);

  // Set up real-time subscription for selected tournament's matches
  const subscribeToTournamentMatches = useCallback((tournamentId: string) => {
    // Clean up existing subscription for this tournament
    if (matchSubscriptions.current[tournamentId]) {
      matchSubscriptions.current[tournamentId]();
      delete matchSubscriptions.current[tournamentId];
    }

    console.log(
      '🏆 [Management] Setting up real-time match subscription for tournament:',
      tournamentId
    );

    // Set up new subscription
    const unsubscribe = tournamentService.subscribeToTournamentMatches(
      tournamentId,
      matchesData => {
        setMatches(prevMatches => ({
          ...prevMatches,
          [tournamentId]: matchesData,
        }));
      }
    );

    matchSubscriptions.current[tournamentId] = unsubscribe;
  }, []);

  // Clean up all match subscriptions
  const cleanupMatchSubscriptions = useCallback(() => {
    Object.values(matchSubscriptions.current).forEach(unsubscribe => unsubscribe());
    matchSubscriptions.current = {};
  }, []);

  useEffect(() => {
    if (clubId) {
      loadTournaments();
    }
  }, [clubId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open create form if autoCreate parameter is true
  useEffect(() => {
    if (autoCreate) {
      setShowCreateForm(true);
    }
  }, [autoCreate]);

  // Refresh tournament data when screen gains focus (for real-time updates from other screens)
  useFocusEffect(
    useCallback(() => {
      if (clubId && !showCreateForm) {
        loadTournaments();
      }
    }, [clubId, showCreateForm]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      cleanupMatchSubscriptions();
    };
  }, [cleanupMatchSubscriptions]);

  // Real-time tournament subscription for automatic participant count updates
  useEffect(() => {
    if (!clubId) return;

    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('clubId', '==', clubId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      tournamentsQuery,
      snapshot => {
        const tournamentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Tournament[];

        setTournaments(tournamentData);

        // Also refresh matches data for updated tournaments
        const matchPromises = tournamentData
          .filter(tournament => tournament.status === 'in_progress')
          .map(async tournament => {
            try {
              const tournamentMatches = await tournamentService.getTournamentMatches(tournament.id);
              return { tournamentId: tournament.id, matches: tournamentMatches };
            } catch (error) {
              console.error(`Error loading matches for tournament ${tournament.id}:`, error);
              return { tournamentId: tournament.id, matches: [] };
            }
          });

        Promise.all(matchPromises).then(matchResults => {
          const newMatchesData: { [tournamentId: string]: BracketMatch[] } = {};
          matchResults.forEach(({ tournamentId, matches }) => {
            newMatchesData[tournamentId] = matches as BracketMatch[];
          });
          setMatches(newMatchesData);
        });
      },
      error => {
        console.error(
          '🏆 [ClubTournamentManagement] Real-time tournament subscription error:',
          error
        );
      }
    );

    return unsubscribe;
  }, [clubId]);

  // 🚀 Real-time sync for selectedTournament
  useEffect(() => {
    if (!selectedTournament) return;

    console.log(
      '🔄 [Real-time] Setting up listener for selected tournament:',
      selectedTournament.id
    );

    const unsubscribe = onSnapshot(
      doc(db, 'tournaments', selectedTournament.id),
      docSnapshot => {
        if (docSnapshot.exists()) {
          const updatedTournament = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          } as Tournament;

          console.log('🔄 [Real-time] Selected tournament updated:', {
            id: updatedTournament.id,
            status: updatedTournament.status,
            currentRound: updatedTournament.currentRound,
          });

          setSelectedTournament(updatedTournament);

          // Also update in tournaments list
          setTournaments(prev =>
            prev.map(t => (t.id === updatedTournament.id ? updatedTournament : t))
          );
        } else {
          // 🎯 [KIM FIX] Tournament was deleted - check if by current user or another admin
          console.warn('🔄 [Real-time] Tournament was deleted:', selectedTournament.id);

          // 🚨 CRITICAL: Close modal and clear state FIRST to immediately block UI interactions
          setShowTournamentDetail(false);
          setSelectedTournament(null);

          // Remove deleted tournament from list
          setTournaments(prev => prev.filter(t => t.id !== selectedTournament.id));

          // 🎯 [KIM FIX] Only show "deleted by another admin" alert if current user didn't delete it
          if (!isDeletingRef.current) {
            Alert.alert(
              '토너먼트 삭제됨',
              '이 토너먼트가 다른 운영진에 의해 삭제되었습니다. 필요시 새로 생성해주세요.',
              [{ text: '확인' }],
              { cancelable: false }
            );
          }
          // If isDeletingRef.current is true, the delete function will show its own success alert
        }
      },
      error => {
        console.error('❌ [Real-time] Error listening to selected tournament:', error);
      }
    );

    return () => {
      console.log('🔄 [Real-time] Cleaning up selected tournament listener');
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament?.id]);

  // 🏛️ OLYMPUS MISSION - Phase 1.1: Sync UserSearchModal lifecycle with Tournament Detail Modal
  // When tournament detail modal closes, also close user search modal to prevent orphaned state
  useEffect(() => {
    if (!showTournamentDetail) {
      setShowUserSearchModal(false);
    }
  }, [showTournamentDetail]);

  // 🔍 DEBUG: Track showUserSearchModal state changes
  useEffect(() => {
    console.log('🔍 [State] showUserSearchModal changed to:', showUserSearchModal);
  }, [showUserSearchModal]);

  // 🏛️ OLYMPUS MISSION - Phase 1.1: Reset UserSearchModal state on mount
  // Prevents hot reload from leaving modal in open state
  useEffect(() => {
    setShowUserSearchModal(false);
  }, []);

  const loadTournaments = useCallback(async () => {
    try {
      if (!clubId) return;
      const allTournaments = await tournamentService.getClubTournaments(clubId);
      setTournaments(allTournaments);

      // 각 토너먼트의 경기 정보도 로드하여 완료 가능 여부 확인
      const matchesData: { [tournamentId: string]: BracketMatch[] } = {};
      await Promise.all(
        allTournaments.map(async tournament => {
          if (tournament.status === 'in_progress') {
            try {
              const tournamentMatches = await tournamentService.getTournamentMatches(tournament.id);
              matchesData[tournament.id] = tournamentMatches;
            } catch (error) {
              console.error(`Error loading matches for tournament ${tournament.id}:`, error);
              matchesData[tournament.id] = [];
            }
          }
        })
      );
      setMatches(matchesData);

      // Check round generation status for in-progress tournaments
      await Promise.all(
        allTournaments
          .filter(t => t.status === 'in_progress')
          .map(async tournament => {
            try {
              await checkRoundGenerationStatus(tournament.id);
            } catch (error) {
              console.error(`Error checking round generation status for ${tournament.id}:`, error);
            }
          })
      );
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId]);

  const canConcludeTournament = (tournament: Tournament): boolean => {
    // 진행 중인 토너먼트만 종료 가능
    if (tournament.status !== 'in_progress') return false;

    // 해당 토너먼트의 결승전이 완료되었는지 확인
    const tournamentMatches = matches[tournament.id] || [];
    if (tournamentMatches.length === 0) return false;

    // 결승전(final round)이 완료된 경우 우승자 선정 가능
    return tournamentMatches.some(
      match =>
        match.round === 'final' && (match.status === 'completed' || match.status === 'confirmed')
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTournaments();
  };

  const handleCreateTournamentSuccess = async (tournamentId: string) => {
    setShowCreateForm(false);

    console.log('✅ Tournament created successfully:', tournamentId);

    // Load the newly created tournament and navigate to its management screen
    try {
      // 🎯 [KIM FIX] Auto-start registration when tournament is created
      // This eliminates the extra step of clicking "참가 신청 시작" button
      await tournamentService.updateTournamentStatus(tournamentId, 'registration');
      console.log('🚀 [KIM FIX] Auto-started registration for tournament:', tournamentId);

      const tournament = await tournamentService.getTournament(tournamentId);
      if (tournament) {
        setSelectedTournament(tournament);
        setDetailActiveTab('management'); // Ensure management tab is active for new tournaments
        setShowTournamentDetail(true);
        console.log('🎯 Auto-navigated to tournament management screen:', tournamentId);
      }
    } catch (error) {
      console.error('Error loading created tournament:', error);
    } finally {
      // Always refresh the tournament list
      loadTournaments();
    }
  };

  const handleTournamentPress = (tournament: Tournament) => {
    console.log('🏆 [TournamentManagement] Tournament pressed:', tournament.id);
    setSelectedTournament(tournament);
    setShowTournamentDetail(true);

    // Set up real-time subscription for this tournament's matches
    if (
      tournament.status === 'in_progress' ||
      tournament.status === 'bracket_generation' ||
      tournament.status === 'completed'
    ) {
      subscribeToTournamentMatches(tournament.id);
    }
  };

  // Tournament status management handlers
  const handleStatusChange = async (tournamentId: string, newStatus: TournamentStatus) => {
    try {
      await tournamentService.updateTournamentStatus(tournamentId, newStatus);
      loadTournaments(); // Reload tournaments to reflect status change

      // Update selected tournament if it's the one being changed
      if (selectedTournament && selectedTournament.id === tournamentId) {
        const updatedTournament = await tournamentService.getTournament(tournamentId);
        setSelectedTournament(updatedTournament);
      }

      console.log(`✅ Tournament status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error updating tournament status:', error);
      // TODO: Show error message to user
    }
  };

  // 🎮 MANUAL ROUND GENERATION HANDLERS

  /**
   * Check if next round can be generated for a tournament
   */
  const checkRoundGenerationStatus = async (tournamentId: string) => {
    try {
      const status = await tournamentService.canGenerateNextRound(tournamentId);
      setRoundGenerationStatus(prev => ({
        ...prev,
        [tournamentId]: status,
      }));
      return status;
    } catch (error) {
      console.error('Error checking round generation status:', error);
      return { canGenerate: false, reason: 'Error checking status' };
    }
  };

  /**
   * Handle manual next round generation
   */
  const handleGenerateNextRound = async (tournamentId: string) => {
    if (isGeneratingRound) return;

    try {
      setIsGeneratingRound(true);

      // First check if generation is possible
      const status = await checkRoundGenerationStatus(tournamentId);
      if (!status.canGenerate) {
        Alert.alert(
          t('clubTournamentManagement.roundGeneration.cannotGenerateTitle'),
          status.reason || t('common.unknownError'),
          [{ text: 'OK' }]
        );
        return;
      }

      // Confirm with user
      Alert.alert(
        t('clubTournamentManagement.roundGeneration.nextRoundTitle'),
        t('clubTournamentManagement.roundGeneration.confirmMessage', {
          current: status.currentRound,
          next: status.nextRound,
        }),
        [
          {
            text: t('clubTournamentManagement.common.cancel'),
            style: 'cancel',
          },
          {
            text: t('clubTournamentManagement.common.generate'),
            onPress: async () => {
              try {
                console.log('🎮 [Manual Generation] Starting round generation for:', tournamentId);

                await tournamentService.generateNextRoundManually(tournamentId);

                console.log('✅ [Manual Generation] Round generated successfully');

                // Show success message
                Alert.alert(
                  t('clubTournamentManagement.common.success'),
                  t('clubTournamentManagement.roundGeneration.successMessage', {
                    round: status.nextRound,
                  }),
                  [{ text: 'OK' }]
                );

                // Refresh tournament data
                loadTournaments();

                // If this tournament is currently selected, refresh its data
                if (selectedTournament && selectedTournament.id === tournamentId) {
                  const updatedTournament = await tournamentService.getTournament(tournamentId);
                  setSelectedTournament(updatedTournament);

                  // Refresh matches for this tournament
                  const updatedMatches = await tournamentService.getTournamentMatches(tournamentId);
                  setMatches(prev => ({ ...prev, [tournamentId]: updatedMatches }));
                }

                // Update round generation status
                await checkRoundGenerationStatus(tournamentId);
              } catch (generationError) {
                console.error('❌ [Manual Generation] Error:', generationError);
                const errMsg =
                  generationError instanceof Error
                    ? generationError.message
                    : String(generationError);

                Alert.alert(
                  t('clubTournamentManagement.common.error'),
                  `${t('clubTournamentManagement.roundGeneration.errorMessage')}\n${errMsg}`,
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleGenerateNextRound:', error);
      Alert.alert(
        t('clubTournamentManagement.common.error'),
        t('clubTournamentManagement.tournamentStart.roundCheckError'),
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingRound(false);
    }
  };

  const handleOpenRegistration = () => {
    if (selectedTournament) {
      handleStatusChange(selectedTournament.id, 'registration');
    }
  };

  const handleCloseRegistration = async () => {
    if (!selectedTournament) return;

    // 🎾 복식 토너먼트 홀수 참가자 검증
    const isDoubles =
      getMatchFormatFromTournamentEventType(selectedTournament.eventType) === 'doubles';
    const participantCount = selectedTournament.participants?.length || 0;

    if (isDoubles && participantCount % 2 !== 0) {
      Alert.alert(
        t('clubTournamentManagement.tournamentStart.participantError'),
        t('clubTournamentManagement.tournamentStart.participantErrorMessage', {
          current: participantCount,
          required: '',
        }).replace(
          'do not match the required count ().',
          `is ${participantCount} (odd). Please add or remove participants to make it even.`
        ),
        [{ text: t('clubTournamentManagement.common.confirm') }]
      );
      return;
    }

    // 🔄 수동 시딩인 경우: 상태만 변경하고 사용자가 직접 시드 배정 후 시작
    if (selectedTournament.settings.seedingMethod === 'manual') {
      await handleStatusChange(selectedTournament.id, 'bracket_generation');
      setDetailActiveTab('participants');
      Alert.alert(
        t('clubTournamentManagement.tournamentStart.seedRequired'),
        t('clubTournamentManagement.tournamentStart.manualSeedingMessage')
      );
      return;
    }

    // 🚀 자동 시딩인 경우: 즉시 대진표 생성 및 토너먼트 시작
    // 🎯 [KIM FIX] Add loading indicator during bracket generation
    setIsGeneratingBracket(true);

    try {
      await tournamentService.generateTournamentBracket(selectedTournament.id);
      console.log('✅ Tournament bracket generated and started automatically');

      // Reload tournaments to reflect changes
      loadTournaments();

      // Update selected tournament
      const updatedTournament = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(updatedTournament);

      Alert.alert(
        t('clubTournamentManagement.tournamentStart.successTitle'),
        t('clubTournamentManagement.tournamentStart.registrationClosedMessage'),
        [
          {
            text: t('clubTournamentManagement.common.confirm'),
            // 🎯 [KIM FIX] Auto-navigate to matches tab to show bracket
            onPress: () => setDetailActiveTab('matches'),
          },
        ]
      );
    } catch (error) {
      console.error('Error starting tournament:', error);
      Alert.alert(
        t('clubTournamentManagement.common.error'),
        t('clubTournamentManagement.tournamentStart.bracketGenerationError')
      );
    } finally {
      // 🎯 [KIM FIX] Always clear loading state
      setIsGeneratingBracket(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournament) return;

    const isInProgress = selectedTournament.status === 'in_progress';
    const alertTitle = t('clubTournamentManagement.deletion.title');
    const alertMessage = isInProgress
      ? t('clubTournamentManagement.deletion.confirmMessageInProgress')
      : t('clubTournamentManagement.deletion.confirmMessageSimple');

    Alert.alert(alertTitle, alertMessage, [
      {
        text: t('clubTournamentManagement.common.cancel'),
        style: 'cancel',
      },
      {
        text: t('clubTournamentManagement.common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🗑️ [UI] Deleting tournament:', selectedTournament.id);

            // 🎯 [KIM FIX] Set flag to prevent "deleted by another admin" alert
            isDeletingRef.current = true;

            await tournamentService.deleteTournament(selectedTournament.id);

            Alert.alert(
              t('clubTournamentManagement.deletion.successTitle'),
              t('clubTournamentManagement.deletion.successMessage'),
              [{ text: t('clubTournamentManagement.common.confirm') }]
            );

            // Close modal and refresh list
            setShowTournamentDetail(false);
            setSelectedTournament(null);
            loadTournaments();
          } catch (error) {
            console.error('❌ [UI] Error deleting tournament:', error);
            const errMsg = error instanceof Error ? error.message : String(error);
            Alert.alert(
              t('clubTournamentManagement.common.error'),
              `${t('clubTournamentManagement.deletion.errorMessage')}\n${errMsg}`,
              [{ text: t('clubTournamentManagement.common.confirm') }]
            );
          }
        },
      },
    ]);
  };

  const handleStartTournament = async () => {
    if (selectedTournament) {
      // ⚠️ RACE CONDITION PREVENTION: Don't allow bracket generation while participants are being added
      if (isAddingParticipant) {
        Alert.alert(
          t('clubTournamentManagement.tournamentStart.addingParticipants'),
          t('clubTournamentManagement.tournamentStart.waitForParticipantAddition')
        );
        return;
      }

      try {
        // Generate bracket first
        await tournamentService.generateTournamentBracket(selectedTournament.id);
        console.log('✅ Tournament bracket generated and started');

        // Reload tournaments to reflect changes
        loadTournaments();

        // Update selected tournament
        const updatedTournament = await tournamentService.getTournament(selectedTournament.id);
        setSelectedTournament(updatedTournament);

        // 🎯 [KIM FIX] 성공 Alert 표시 및 경기 탭으로 이동
        Alert.alert(
          t('clubTournamentManagement.tournamentStart.successTitle'),
          t('clubTournamentManagement.tournamentStart.bracketGeneratedMessage'),
          [
            {
              text: t('clubTournamentManagement.common.confirm'),
              onPress: () => setDetailActiveTab('matches'),
            },
          ]
        );
      } catch (error) {
        console.error('Error starting tournament:', error);
        Alert.alert(
          t('clubTournamentManagement.common.error'),
          t('clubTournamentManagement.tournamentStart.bracketGenerationError')
        );
      }
    }
  };

  const handleAssignSeed = async (participant: Record<string, unknown>) => {
    if (!selectedTournament) return;

    // 🎾 복식 토너먼트인 경우 팀 수 기준으로 시드 계산
    const isDoubles =
      getMatchFormatFromTournamentEventType(selectedTournament.eventType) === 'doubles';
    const totalParticipants = selectedTournament.participants?.length || 1;
    const maxSeed = isDoubles ? Math.floor(totalParticipants / 2) : totalParticipants;

    // UI 메시지 (복식은 "팀", 단식은 이름)
    const targetName = isDoubles
      ? participant.partnerId
        ? `${participant.playerName} / ${participant.partnerName} 팀`
        : `${participant.playerName} 팀`
      : participant.playerName;

    Alert.prompt(
      t('clubTournamentManagement.seedAssignment.title'),
      t('clubTournamentManagement.seedAssignment.prompt', { name: targetName, max: maxSeed }),
      [
        {
          text: t('clubTournamentManagement.common.cancel'),
          style: 'cancel',
        },
        {
          text: t('clubTournamentManagement.common.assign'),
          onPress: async seedText => {
            if (!seedText) return;

            const seedNumber = parseInt(seedText, 10);
            if (isNaN(seedNumber) || seedNumber < 1 || seedNumber > maxSeed) {
              Alert.alert(
                t('clubTournamentManagement.common.error'),
                t('clubTournamentManagement.seedAssignment.seedRangeError', { max: maxSeed })
              );
              return;
            }

            try {
              // Check if seed is already assigned (파트너는 제외)
              const existingParticipant = selectedTournament.participants?.find(
                p =>
                  p.seed === seedNumber &&
                  p.playerId !== participant.playerId &&
                  p.playerId !== participant.partnerId // 파트너 제외
              );

              if (existingParticipant) {
                Alert.alert(
                  t('clubTournamentManagement.seedAssignment.duplicateTitle'),
                  t('clubTournamentManagement.seedAssignment.duplicateMessage', {
                    seed: seedNumber,
                    name: existingParticipant.playerName,
                  })
                );
                return;
              }

              // 🎾 복식: 파트너에게도 같은 시드 자동 배정
              const seedAssignments = [{ playerId: participant.playerId, seed: seedNumber }];

              if (isDoubles && participant.partnerId) {
                seedAssignments.push({
                  playerId: participant.partnerId,
                  seed: seedNumber,
                });
                console.log(
                  `🎾 [DOUBLES] Assigning seed ${seedNumber} to both ${participant.playerName} and partner ${participant.partnerName}`
                );
              }

              // Assign seed(s)
              await tournamentService.assignSeeds(
                selectedTournament.id,
                seedAssignments as { playerId: string; seed: number }[]
              );

              // Refresh tournament data
              const updatedTournament = await tournamentService.getTournament(
                selectedTournament.id
              );
              setSelectedTournament(updatedTournament);

              console.log(`✅ Seed ${seedNumber} assigned to ${targetName}`);
            } catch (error) {
              console.error('Error assigning seed:', error);
              Alert.alert(
                t('clubTournamentManagement.common.error'),
                t('clubTournamentManagement.seedAssignment.errorAssigning')
              );
            }
          },
        },
      ],
      'plain-text',
      participant.seed?.toString() || ''
    );
  };

  /**
   * 🦾 Iron Man: Team-Based Seed Assignment
   * 복식 토너먼트에서 팀 전체에 시드를 배정
   */
  const handleAssignSeedToTeam = async (team: DoublesTeam) => {
    if (!selectedTournament) return;

    // 팀 수 기준으로 maxSeed 계산
    const teams = tournamentService.groupParticipantsIntoTeams(selectedTournament.participants);
    const maxSeed = teams.length;

    Alert.prompt(
      t('clubTournamentManagement.seedAssignment.teamTitle'),
      t('clubTournamentManagement.seedAssignment.teamPrompt', {
        team: team.teamName,
        max: maxSeed,
      }),
      [
        {
          text: t('clubTournamentManagement.common.cancel'),
          style: 'cancel',
        },
        {
          text: t('clubTournamentManagement.common.assign'),
          onPress: async seedText => {
            // 🎯 [KIM FIX] 빈 값 입력 시 시드 제거
            if (!seedText || seedText.trim() === '') {
              if (!team.seed) {
                // 이미 시드가 없으면 아무것도 안 함
                return;
              }

              // 시드 제거 실행
              try {
                // 팀의 두 선수 모두 시드 0 (제거)
                const seedAssignments = [
                  { playerId: team.player1.playerId, seed: 0 },
                  { playerId: team.player2.playerId, seed: 0 },
                ];

                console.log(`🗑️ [TEAM SEED] Removing seed from team: ${team.teamName}`);

                await tournamentService.assignSeeds(
                  selectedTournament.id,
                  seedAssignments as { playerId: string; seed: number }[]
                );

                const updatedTournament = await tournamentService.getTournament(
                  selectedTournament.id
                );
                setSelectedTournament(updatedTournament);

                console.log(`✅ [TEAM SEED] Seed removed from ${team.teamName}`);
              } catch (error) {
                console.error('Error removing team seed:', error);
                Alert.alert(
                  t('clubTournamentManagement.common.error'),
                  t('clubTournamentManagement.seedAssignment.errorRemoving')
                );
              }
              return;
            }

            const seedNumber = parseInt(seedText.trim(), 10);

            if (isNaN(seedNumber) || seedNumber < 1 || seedNumber > maxSeed) {
              Alert.alert(
                t('clubTournamentManagement.common.error'),
                t('clubTournamentManagement.seedAssignment.seedRangeError', { max: maxSeed })
              );
              return;
            }

            // 🎯 [KIM FIX] 같은 시드 재배정 시 스킵 (불필요한 서버 호출 방지)
            if (team.seed === seedNumber) {
              console.log(`ℹ️ [TEAM SEED] Same seed ${seedNumber}, skipping update`);
              return;
            }

            try {
              // 🎯 중복 시드 체크: 다른 팀이 이미 사용 중인지 확인
              const otherTeam = teams.find(t => t.teamId !== team.teamId && t.seed === seedNumber);

              if (otherTeam) {
                Alert.alert(
                  t('clubTournamentManagement.seedAssignment.duplicateTitle'),
                  t('clubTournamentManagement.seedAssignment.duplicateMessage', {
                    seed: seedNumber,
                    name: otherTeam.teamName,
                  })
                );
                return;
              }

              // 🎾 팀의 두 선수 모두에게 같은 시드 배정
              const seedAssignments = [
                { playerId: team.player1.playerId, seed: seedNumber },
                { playerId: team.player2.playerId, seed: seedNumber },
              ];

              console.log(`🦾 [TEAM SEED] Assigning seed ${seedNumber} to team: ${team.teamName}`);
              console.log(`  👥 Player 1: ${team.player1.playerName}`);
              console.log(`  👥 Player 2: ${team.player2.playerName}`);

              // Assign seed(s)
              await tournamentService.assignSeeds(
                selectedTournament.id,
                seedAssignments as { playerId: string; seed: number }[]
              );

              // Refresh tournament data
              const updatedTournament = await tournamentService.getTournament(
                selectedTournament.id
              );
              setSelectedTournament(updatedTournament);

              console.log(`✅ [TEAM SEED] Seed ${seedNumber} assigned to ${team.teamName}`);
            } catch (error) {
              console.error('Error assigning team seed:', error);
              Alert.alert(
                t('clubTournamentManagement.common.error'),
                t('clubTournamentManagement.seedAssignment.errorAssigning')
              );
            }
          },
        },
      ],
      'plain-text',
      team.seed?.toString() || ''
    );
  };

  const handleRemoveParticipant = async (participant: {
    playerId: string;
    playerName?: string;
    partnerId?: string;
    partnerName?: string;
  }) => {
    if (!selectedTournament) return;

    // ⚡ [THOR] Re-fetch full participant info from selectedTournament
    // This ensures we have the latest partnerId information
    const fullParticipant = selectedTournament.participants.find(
      p => p.playerId === participant.playerId
    );

    if (!fullParticipant) {
      console.error('❌ Participant not found in tournament:', participant.playerId);
      Alert.alert(
        t('clubTournamentManagement.common.error'),
        t('clubTournamentManagement.participantRemoval.notFoundError')
      );
      return;
    }

    // ⚡ [THOR] Check if this is a doubles tournament
    const isDoubles =
      selectedTournament.eventType === 'mens_doubles' ||
      selectedTournament.eventType === 'womens_doubles' ||
      selectedTournament.eventType === 'mixed_doubles';

    // ⚡ [THOR] For doubles, find partner information using fullParticipant
    let partner: { playerId: string; playerName?: string } | null = null;
    if (isDoubles && fullParticipant.partnerId) {
      partner =
        selectedTournament.participants.find(p => p.playerId === fullParticipant.partnerId) || null;

      console.log('🔍 [DEBUG] Partner search:', {
        participantId: fullParticipant.playerId,
        participantName: fullParticipant.playerName,
        partnerId: fullParticipant.partnerId,
        partnerFound: !!partner,
        partnerName: partner?.playerName,
      });
    }

    // ⚡ [THOR] Build display name (team name for doubles, player name for singles)
    const displayName =
      isDoubles && partner
        ? `${fullParticipant.playerName || t('common.unknown')} / ${partner.playerName || t('common.unknown')}`
        : fullParticipant.playerName || t('common.unknownPlayer');

    Alert.alert(
      isDoubles
        ? t('clubTournamentManagement.participantRemoval.confirmTitle') + ' ' + t('common.delete')
        : t('clubTournamentManagement.participantRemoval.confirmTitle'),
      isDoubles
        ? t('clubTournamentManagement.participantRemoval.confirmMessageTeam', { name: displayName })
        : t('clubTournamentManagement.participantRemoval.confirmMessage', { name: displayName }),
      [
        {
          text: t('clubTournamentManagement.common.cancel'),
          style: 'cancel',
        },
        {
          text: t('clubTournamentManagement.common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(
                '🏆 [UI] Removing participant:',
                fullParticipant.playerId,
                isDoubles && partner ? `and partner: ${partner.playerId}` : '',
                'from tournament:',
                selectedTournament.id
              );

              // Server handles partner removal automatically for doubles tournaments
              await tournamentService.removeParticipant(
                selectedTournament.id,
                fullParticipant.playerId
              );

              // No need for second call - withdrawFromTournament Cloud Function removes both partners

              console.log('✅ [UI] Participant(s) removed successfully');

              // Show success message
              Alert.alert(
                t('clubTournamentManagement.participantRemoval.successTitle'),
                isDoubles
                  ? t('clubTournamentManagement.participantRemoval.successMessageTeam', {
                      name: displayName,
                    })
                  : t('clubTournamentManagement.participantRemoval.successMessage')
              );

              // Real-time subscription will automatically update the UI
              // But we can also manually refresh to ensure immediate update
              const updatedTournament = await tournamentService.getTournament(
                selectedTournament.id
              );
              setSelectedTournament(updatedTournament);
            } catch (error) {
              console.error('Error removing participant:', error);

              const errorMessage =
                (error as Error).message ||
                t('clubTournamentManagement.participantRemoval.unknownError');

              Alert.alert(
                t('clubTournamentManagement.common.error'),
                t('clubTournamentManagement.participantRemoval.errorMessageWithDetails', {
                  error: errorMessage,
                })
              );
            }
          },
        },
      ]
    );
  };

  // 🎯 SEED ASSIGNMENT COMPLETION LOGIC

  /**
   * Check if all participants have been assigned seeds with strict validation
   * Ensures seeds form a complete sequence from 1 to N with no gaps or duplicates
   * 🎯 [KIM FIX] 복식 토너먼트에서는 팀 수 기준으로 시드 검증
   */
  const isAllSeedsAssigned = (tournament: Tournament): boolean => {
    if (!tournament.participants || tournament.participants.length === 0) {
      return false;
    }

    // For manual seeding, check if all participants have seeds assigned
    if (tournament.settings?.seedingMethod === 'manual') {
      const totalParticipants = tournament.participants.length;

      // 🎯 [KIM FIX] 복식 토너먼트는 팀 수 기준으로 계산
      const isDoubles =
        tournament.eventType === 'mens_doubles' ||
        tournament.eventType === 'womens_doubles' ||
        tournament.eventType === 'mixed_doubles';
      const totalTeams = isDoubles ? Math.floor(totalParticipants / 2) : totalParticipants;

      // 1. Check all participants have seeds
      // 🎯 [KIM FIX] 복식에서는 두 파트너가 같은 시드를 가짐 (1,1,2,2,3,3...)
      const participantsWithSeeds = tournament.participants.filter(
        participant => participant.seed != null && participant.seed > 0
      );

      // 유니크 시드 개수로 확인 (파트너 둘 다 같은 시드를 가지므로)
      const uniqueSeeds = [...new Set(participantsWithSeeds.map(p => p.seed!))];

      if (uniqueSeeds.length !== totalTeams) {
        console.log('🎯 [isAllSeedsAssigned] Unique seed count mismatch:', {
          participantsWithSeeds: participantsWithSeeds.length,
          uniqueSeeds: uniqueSeeds.length,
          totalTeams,
          isDoubles,
        });
        return false;
      }

      // 2. Validate completeness: seeds 1 through N with no gaps/duplicates
      // 유니크 시드 배열로 검증 (복식 대응)
      const assignedSeeds = uniqueSeeds.sort((a, b) => a - b);
      const requiredSeeds = Array.from({ length: totalTeams }, (_, i) => i + 1);

      const isValid = JSON.stringify(assignedSeeds) === JSON.stringify(requiredSeeds);
      console.log('🎯 [isAllSeedsAssigned] Validation result:', {
        assignedSeeds,
        requiredSeeds,
        isValid,
        isDoubles,
        totalTeams,
      });

      return isValid;
    }

    // For other seeding methods, seeds are automatically assigned
    return true;
  };

  /**
   * 🏛️ OLYMPUS MISSION - Phase 1.1: Handle adding participant manually
   * 🆕 Now supports adding multiple participants at once
   */
  const handleAddParticipant = async (
    users: Array<{
      uid: string;
      displayName: string;
      partnerId?: string;
      partnerName?: string;
    }>
  ) => {
    if (!selectedTournament) {
      console.error('❌ [handleAddParticipant] No tournament selected');
      return;
    }

    if (users.length === 0) {
      console.warn('⚠️ [handleAddParticipant] No users provided');
      return;
    }

    try {
      setIsAddingParticipant(true);
      console.log(`👥 [handleAddParticipant] Adding ${users.length} participant(s)...`);

      const addParticipantFunction = httpsCallable(functions, 'addTournamentParticipant');
      const results = {
        success: [] as string[],
        failed: [] as { name: string; error: string }[],
      };

      // Add participants sequentially to avoid race conditions
      for (const user of users) {
        try {
          console.log(`👤 [handleAddParticipant] Adding: ${user.displayName}`);
          if (user.partnerId && user.partnerName) {
            console.log(`🤝 [handleAddParticipant] With partner: ${user.partnerName}`);
          }

          // 🔍 DEBUG: Log the exact payload being sent to Cloud Function
          const payload = {
            tournamentId: selectedTournament.id,
            userId: user.uid,
            partnerId: user.partnerId || null,
            partnerName: user.partnerName || null,
          };
          console.log(
            '🚀 [handleAddParticipant] PAYLOAD BEING SENT TO CLOUD FUNCTION:',
            JSON.stringify(payload, null, 2)
          );

          await addParticipantFunction(payload);
          results.success.push(user.displayName);
          console.log(`✅ [handleAddParticipant] Successfully added: ${user.displayName}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
          results.failed.push({ name: user.displayName, error: errorMessage });
          console.error(`❌ [handleAddParticipant] Failed to add ${user.displayName}:`, error);
        }
      }

      // Show result summary
      if (results.success.length > 0 && results.failed.length === 0) {
        // All succeeded
        Alert.alert(
          t('clubTournamentManagement.common.success'),
          t('clubTournamentManagement.participantAdd.successMessageWithNames', {
            count: results.success.length,
            names: results.success.join(', '),
          }),
          [{ text: 'OK' }]
        );
      } else if (results.success.length === 0 && results.failed.length > 0) {
        // All failed
        Alert.alert(
          t('clubTournamentManagement.common.error'),
          t('clubTournamentManagement.participantAdd.allFailedMessage', {
            details: results.failed.map(f => `${f.name}: ${f.error}`).join('\n'),
          }),
          [{ text: 'OK' }]
        );
      } else {
        // Partial success
        Alert.alert(
          t('clubTournamentManagement.participantAdd.partialSuccessTitle'),
          t('clubTournamentManagement.participantAdd.partialSuccessMessageWithDetails', {
            successCount: results.success.length,
            successNames: results.success.join(', '),
            failedCount: results.failed.length,
            failedDetails: results.failed.map(f => `${f.name}: ${f.error}`).join('\n'),
          }),
          [{ text: 'OK' }]
        );
      }

      console.log('📊 [handleAddParticipant] Summary:', {
        total: users.length,
        success: results.success.length,
        failed: results.failed.length,
      });

      // Refresh tournament data to show the new participants
      // The real-time listener should automatically update the UI
    } catch (error: unknown) {
      console.error('❌ [handleAddParticipant] Unexpected error:', error);

      // Show error message
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      Alert.alert(
        t('clubTournamentManagement.common.error'),
        t('clubTournamentManagement.participantAdd.errorMessageWithDetails', {
          error: errorMessage,
        }),
        [{ text: 'OK' }]
      );
    } finally {
      setIsAddingParticipant(false);
      setShowUserSearchModal(false); // Always close modal after operation
    }
  };

  /**
   * Handle seed assignment completion and navigate to management tab
   */
  const handleSeedAssignmentComplete = () => {
    if (!selectedTournament) return;

    // Double-check that all seeds are assigned
    if (!isAllSeedsAssigned(selectedTournament)) {
      Alert.alert(
        t('clubTournamentManagement.seedAssignment.incompleteTitle'),
        t('clubTournamentManagement.seedAssignment.incompleteMessage'),
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('🎯 [Seed Assignment] All seeds assigned, navigating to management tab');

    // Navigate to management tab
    setDetailActiveTab('management');

    // Show success message
    Alert.alert(
      t('clubTournamentManagement.seedAssignment.completeTitle'),
      t('clubTournamentManagement.seedAssignment.completeMessageWithBracket'),
      [{ text: 'OK' }]
    );
  };

  const getTournamentStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'draft':
        return '#757575';
      case 'registration':
        return '#ff9800';
      case 'bracket_generation':
        return '#9c27b0';
      case 'in_progress':
        return '#4caf50';
      case 'completed':
        return '#2196f3';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getTournamentStatusText = (status: TournamentStatus) => {
    // Use translation keys for all languages
    const statusKeys: Record<TournamentStatus, string> = {
      draft: 'clubTournamentManagement.status.draft',
      registration: 'clubTournamentManagement.status.registration',
      bracket_generation: 'clubTournamentManagement.status.bracketGeneration',
      in_progress: 'clubTournamentManagement.status.inProgress',
      completed: 'clubTournamentManagement.status.completed',
      cancelled: 'clubTournamentManagement.status.cancelled',
    };

    return t(statusKeys[status] || 'clubTournamentManagement.status.draft');
  };

  // 🚀 TRUST SERVER DATA: Simple grouping function without destructive processing
  const createSimpleBracket = (tournamentMatches: BracketMatch[]) => {
    if (!tournamentMatches || tournamentMatches.length === 0) {
      return {
        rounds: [],
        champion: null,
      };
    }

    // Simple grouping by round number - NO destructive processing
    const roundsMap: { [roundNum: number]: BracketMatch[] } = {};

    tournamentMatches.forEach(match => {
      const roundNum = match.roundNumber || 1;

      if (!roundsMap[roundNum]) {
        roundsMap[Number(roundNum)] = [];
      }

      // Simple conversion - preserve ALL server data
      const simpleMatch = {
        id: match.id,
        matchNumber: match.matchNumber || match.bracketPosition || 1,
        player1: match.player1
          ? {
              playerId: match.player1.playerId,
              playerName: match.player1.playerName,
              seed: match.player1.seed || 0, // Trust server seed data
            }
          : null,
        player2: match.player2
          ? {
              playerId: match.player2.playerId,
              playerName: match.player2.playerName,
              seed: match.player2.seed || 0, // Trust server seed data
            }
          : null,
        winner: match._winner
          ? match.player1?.playerId === match._winner
            ? {
                playerId: match.player1.playerId,
                playerName: match.player1.playerName,
                seed: match.player1.seed || 0,
              }
            : match.player2?.playerId === match._winner
              ? {
                  playerId: match.player2.playerId,
                  playerName: match.player2.playerName,
                  seed: match.player2.seed || 0,
                }
              : null
          : null,
        score: match.score || null,
        status: match.status || 'scheduled',
        nextMatchId: match.nextMatch?.matchId,
      };

      roundsMap[Number(roundNum)].push(simpleMatch as unknown as BracketMatch);
    });

    // Convert to rounds array
    const rounds = Object.keys(roundsMap)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(roundNum => ({
        roundNumber: parseInt(roundNum),
        matches: roundsMap[parseInt(roundNum)].sort((a, b) => a.matchNumber - b.matchNumber),
      }));

    // Find champion from final round
    let champion = null;
    if (rounds.length > 0) {
      const finalRound = rounds[rounds.length - 1];
      if (finalRound.matches.length > 0) {
        const finalMatch = finalRound.matches[0];
        champion = finalMatch.winner;
      }
    }

    return {
      rounds,
      champion,
    };
  };

  // 🔥 OLD DESTRUCTIVE FUNCTION (DEPRECATED) - DO NOT USE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const convertToBracketFormat = (
    tournamentMatches: BracketMatch[],
    tournamentData: Tournament
  ) => {
    console.log('🔥 [DEPRECATED] Old destructive function called - this should be replaced!');
    // Keep old function for compatibility but warn when used

    // 🔍 CRITICAL FIX: Create participantSeedMap FIRST before using it
    const participantsData = tournamentData.participants || [];
    const participantSeedMap = new Map();

    participantsData.forEach(participant => {
      if (participant.playerId && participant.seed) {
        participantSeedMap.set(participant.playerId, {
          seed: participant.seed,
          playerName: participant.playerName || t('common.unknown'),
          playerId: participant.playerId,
        });
      }
    });

    console.log('🔍 [SEED MAP DEBUG] Created participantSeedMap:', {
      mapSize: participantSeedMap.size,
      entries: Array.from(participantSeedMap.entries()),
    });

    interface ConvertedMatch {
      id: string;
      matchNumber: number;
      player1: { playerId: string; playerName: string; seed: number } | null;
      player2: { playerId: string; playerName: string; seed: number } | null;
      winner: { playerId: string; playerName: string; seed: number } | null;
      score: unknown;
      status: string;
      nextMatchId?: string;
    }

    // Sort matches by bracket position to reconstruct rounds properly
    const sortedMatches = [...tournamentMatches].sort(
      (a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)
    );

    // Attempt to reconstruct rounds based on tournament structure if round numbers are incorrect
    const totalMatches = sortedMatches.length;
    let reconstructedRounds = false;

    // Check if all matches have the same round number (indicating a data issue)
    const uniqueRounds = new Set(sortedMatches.map(m => m.roundNumber || m.round || 1));
    if (uniqueRounds.size === 1 && totalMatches > 1) {
      console.log(
        '🏆 [BRACKET DEBUG] Detected round assignment issue - all matches in same round. Reconstructing...'
      );
      reconstructedRounds = true;
    }

    // Group matches by round
    const roundsMap: { [round: number]: ConvertedMatch[] } = {};

    sortedMatches.forEach((match, index) => {
      let roundNum: number;

      if (reconstructedRounds) {
        // Reconstruct round numbers based on tournament bracket structure
        // For single elimination: Round 1 = first half matches, Round 2 = quarter finals, etc.
        if (totalMatches <= 4) {
          // 4 or fewer matches: likely semifinals (round 2) and final (round 3)
          roundNum = totalMatches === 1 ? 3 : index < totalMatches - 1 ? 2 : 3;
        } else if (totalMatches <= 8) {
          // 5-8 matches: Round 1 (4-6 matches) + Round 2 (1-2 matches) + Round 3 (1 match)
          if (index < totalMatches - 3) roundNum = 1;
          else if (index < totalMatches - 1) roundNum = 2;
          else roundNum = 3;
        } else {
          // Larger tournaments: use bracket position to determine round
          const numFirstRoundMatches = Math.ceil(totalMatches * 0.6);
          if (index < numFirstRoundMatches) roundNum = 1;
          else if (index < totalMatches - 1) roundNum = 2;
          else roundNum = 3;
        }

        console.log('🏆 [BRACKET DEBUG] Reconstructed round for match:', {
          matchId: match.id,
          index,
          totalMatches,
          reconstructedRound: roundNum,
          originalRound: match.round,
          originalRoundNumber: match.roundNumber,
        });
      } else {
        // Use existing round numbers
        roundNum = Number(match.roundNumber || match.round || 1);
      }

      console.log('🏆 [BRACKET DEBUG] Processing match for round grouping:', {
        matchId: match.id,
        originalRound: match.round,
        roundNumber: match.roundNumber,
        assignedRound: roundNum,
        player1: match.player1?.playerName,
        player2: match.player2?.playerName,
        status: match.status,
        bracketPosition: match.bracketPosition,
        wasReconstructed: reconstructedRounds,
      });

      if (!roundsMap[roundNum]) {
        roundsMap[Number(roundNum)] = [];
      }

      // Convert BracketMatch to format expected by TournamentBracketView
      let winner = null;
      // Enhanced winner determination with detailed logging
      // Priority: _winner → score.winner → legacy winnerId
      let winnerPlayerId =
        match._winner || (match as BracketMatch & { winnerId?: string }).winnerId;

      // If no winner field set but match is completed with score, try to get winner from score
      if (!winnerPlayerId && match.status === 'completed' && match.score?.winner) {
        if (match.score.winner === 'player1' && match.player1) {
          winnerPlayerId = match.player1.playerId;
        } else if (match.score.winner === 'player2' && match.player2) {
          winnerPlayerId = match.player2.playerId;
        }
      }

      if (winnerPlayerId && match.status === 'completed') {
        if (match.player1?.playerId === winnerPlayerId) {
          winner = {
            playerId: match.player1.playerId,
            playerName: match.player1.playerName,
            seed: match.player1.seed || 0,
          };
        } else if (match.player2?.playerId === winnerPlayerId) {
          winner = {
            playerId: match.player2.playerId,
            playerName: match.player2.playerName,
            seed: match.player2.seed || 0,
          };
        }
      }

      // Enhanced player conversion with seed restoration
      const convertedMatch = {
        id: match.id,
        matchNumber: match.bracketPosition || match.matchNumber || 1,
        player1: match.player1
          ? {
              playerId: match.player1.playerId,
              playerName: match.player1.playerName,
              seed: match.player1.seed || participantSeedMap.get(match.player1.playerId)?.seed || 0,
            }
          : null,
        player2: match.player2
          ? {
              playerId: match.player2.playerId,
              playerName: match.player2.playerName,
              seed: match.player2.seed || participantSeedMap.get(match.player2.playerId)?.seed || 0,
            }
          : null,
        winner,
        score: match.score || null,
        status: match.status || 'scheduled',
        nextMatchId: match.nextMatch?.matchId,
      };

      // Log seed restoration for debugging
      if (match.player1 && !match.player1.seed && participantSeedMap.has(match.player1.playerId)) {
        console.log(
          `🔧 [SEED SYNC] Restored seed ${convertedMatch.player1?.seed} for ${match.player1.playerName} during conversion`
        );
      }
      if (match.player2 && !match.player2.seed && participantSeedMap.has(match.player2.playerId)) {
        console.log(
          `🔧 [SEED SYNC] Restored seed ${convertedMatch.player2?.seed} for ${match.player2.playerName} during conversion`
        );
      }

      roundsMap[Number(roundNum)].push(convertedMatch);
    });

    // Convert to rounds array
    const rounds = Object.keys(roundsMap)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(roundNum => ({
        roundNumber: parseInt(roundNum),
        matches: roundsMap[parseInt(roundNum)].sort((a, b) => a.matchNumber - b.matchNumber),
      }));

    console.log('🏆 [BRACKET DEBUG] Rounds map after grouping:', {
      roundsMapKeys: Object.keys(roundsMap),
      roundsMapStructure: Object.entries(roundsMap).map(([round, matches]) => ({
        round: parseInt(round),
        matchCount: matches.length,
        matches: matches.map(m => ({
          id: m.id,
          player1: m.player1?.playerName,
          player2: m.player2?.playerName,
          status: m.status,
        })),
      })),
    });

    console.log('🏆 [BRACKET DEBUG] Final bracket structure:', {
      totalRounds: rounds.length,
      roundsStructure: rounds.map(r => ({
        roundNumber: r.roundNumber,
        matchCount: r.matches.length,
        matches: r.matches.map(
          m => `${m.player1?.playerName || 'TBD'} vs ${m.player2?.playerName || 'TBD'}`
        ),
      })),
    });

    // 🔍 Seed Data Synchronization - merge participant data with bracket data (REMOVED DUPLICATE)

    // Apply seed information to bracket matches if missing
    rounds.forEach(round => {
      round.matches.forEach(match => {
        if (match.player1 && participantSeedMap.has(match.player1.playerId)) {
          const participantData = participantSeedMap.get(match.player1.playerId);
          if (!match.player1.seed && participantData.seed) {
            console.log(
              `🔧 [SEED SYNC] Restoring seed ${participantData.seed} for ${match.player1.playerName}`
            );
            match.player1.seed = participantData.seed;
          }
        }

        if (match.player2 && participantSeedMap.has(match.player2.playerId)) {
          const participantData = participantSeedMap.get(match.player2.playerId);
          if (!match.player2.seed && participantData.seed) {
            console.log(
              `🔧 [SEED SYNC] Restoring seed ${participantData.seed} for ${match.player2.playerName}`
            );
            match.player2.seed = participantData.seed;
          }
        }
      });
    });

    // 🔍 Player validation - check for missing key players (especially seed 1)
    const allPlayers = rounds.flatMap(round =>
      round.matches.flatMap(match => [match.player1, match.player2].filter(Boolean))
    );

    const uniquePlayers = new Map();
    allPlayers.forEach(player => {
      if (player) {
        uniquePlayers.set(player.playerId, player);
      }
    });

    const seedOnePlayers = Array.from(uniquePlayers.values()).filter(p => p.seed === 1);
    const jongPlayer = Array.from(uniquePlayers.values()).find(p => p.playerName === 'Jong');
    const sukiPlayer = Array.from(uniquePlayers.values()).find(p => p.playerName === '숙이');

    console.log('🔍 [PLAYER VALIDATION] Tournament player analysis:', {
      totalUniquePlayers: uniquePlayers.size,
      seedOnePlayersCount: seedOnePlayers.length,
      seedOnePlayers: seedOnePlayers.map(p => p.playerName),
      jongPresent: !!jongPlayer,
      jongData: jongPlayer,
      sukiPresent: !!sukiPlayer,
      sukiData: sukiPlayer,
      allPlayersSummary: Array.from(uniquePlayers.values()).map(
        p => `${p.playerName}(seed:${p.seed})`
      ),
      participantsSeedData: Array.from(participantSeedMap.values()),
    });

    // Alert if seed 1 players are missing
    if (seedOnePlayers.length === 0) {
      console.warn('⚠️ [PLAYER VALIDATION] No seed 1 players found in bracket!');
      if (sukiPlayer && !sukiPlayer.seed) {
        console.warn('⚠️ [PLAYER VALIDATION] 숙이 found but missing seed information');
      }
    } else {
      console.log(
        '✅ [PLAYER VALIDATION] Seed 1 players found:',
        seedOnePlayers.map(p => p.playerName)
      );
    }

    // 🔍 Tournament Structure Validation - Check for missing players in matches
    const structureIssues: string[] = [];
    const incompleteMatches: Array<{
      roundNumber: number;
      matchNumber: number;
      issue: string;
      player1: string;
      player2: string;
    }> = [];

    rounds.forEach((round, roundIndex) => {
      round.matches.forEach((match, matchIndex) => {
        const isFirstRound = roundIndex === 0;
        const isScheduled = match.status === 'scheduled';
        // const isCompleted = match.status === 'completed';

        // For first round, both players should be assigned
        if (isFirstRound && (!match.player1 || !match.player2)) {
          structureIssues.push(
            `Round ${round.roundNumber} Match ${matchIndex + 1}: Missing player(s) in first round`
          );
          incompleteMatches.push({
            roundNumber: round.roundNumber,
            matchNumber: matchIndex + 1,
            issue: 'missing_first_round_player',
            player1: match.player1?.playerName || 'MISSING',
            player2: match.player2?.playerName || 'MISSING',
          });
        }

        // For later rounds, scheduled matches should have at least one player (unless both are TBD)
        if (!isFirstRound && isScheduled && !match.player1 && !match.player2) {
          structureIssues.push(
            `Round ${round.roundNumber} Match ${matchIndex + 1}: Both players missing in later round`
          );
          incompleteMatches.push({
            roundNumber: round.roundNumber,
            matchNumber: matchIndex + 1,
            issue: 'both_players_missing',
            player1: 'MISSING',
            player2: 'MISSING',
          });
        }

        // For later rounds, if one player is assigned but not the other, this indicates incomplete advancement
        if (
          !isFirstRound &&
          isScheduled &&
          ((match.player1 && !match.player2) || (!match.player1 && match.player2))
        ) {
          structureIssues.push(
            `Round ${round.roundNumber} Match ${matchIndex + 1}: Incomplete player assignment (one player missing)`
          );
          incompleteMatches.push({
            roundNumber: round.roundNumber,
            matchNumber: matchIndex + 1,
            issue: 'incomplete_advancement',
            player1: match.player1?.playerName || 'MISSING',
            player2: match.player2?.playerName || 'MISSING',
          });
        }
      });
    });

    if (structureIssues.length > 0) {
      console.warn('🚨 [TOURNAMENT STRUCTURE] Issues detected:', {
        issueCount: structureIssues.length,
        issues: structureIssues,
        incompleteMatches,
        tournamentId: tournamentData.id,
        tournamentStatus: tournamentData.status,
      });
    } else {
      console.log('✅ [TOURNAMENT STRUCTURE] No structural issues detected');
    }

    // Find champion (winner of final round)
    let champion = null;
    if (tournamentData.status === 'completed' && rounds.length > 0) {
      const finalRound = rounds[rounds.length - 1];
      const finalMatch = finalRound.matches.find(m => m.winner);
      if (finalMatch?.winner) {
        champion = finalMatch.winner;
      }
    }

    return {
      rounds,
      champion,
    };
  };

  // Handle match press for direct score input (copied from TournamentDetailScreen)
  const handleMatchPress = (matchFromBracket: {
    id: string;
    player1?: { playerName: string } | null;
    player2?: { playerName: string } | null;
    status?: string;
  }) => {
    if (!selectedTournament) return;

    console.log('🏆 Match pressed in management screen:', {
      id: matchFromBracket.id,
      player1: matchFromBracket.player1?.playerName,
      player2: matchFromBracket.player2?.playerName,
      status: matchFromBracket.status,
    });

    // Find the full BracketMatch object from our matches state
    const tournamentMatches = matches[selectedTournament.id] || [];
    const fullMatch = tournamentMatches.find(m => m.id === matchFromBracket.id);
    if (!fullMatch) {
      Alert.alert(
        t('clubTournamentManagement.common.error'),
        t('clubTournamentManagement.matchResult.notFound')
      );
      return;
    }

    // In management screen, admin always has permission
    const isTournamentAdmin = true; // Admin view in management screen
    const canEnterScore = isTournamentAdmin;

    console.log('🏆 Management screen match press validation:', {
      matchId: matchFromBracket.id,
      status: matchFromBracket.status,
      isTournamentAdmin,
      canEnterScore,
      hasBothPlayers: !!(fullMatch.player1 && fullMatch.player2),
    });

    // Allow score entry for scheduled/in_progress matches where admin has permission
    if (
      (matchFromBracket.status === 'scheduled' || matchFromBracket.status === 'in_progress') &&
      canEnterScore &&
      fullMatch.player1 &&
      fullMatch.player2
    ) {
      // 🚀 Flow Switch: 모달 대신 조건부 렌더링 모드 활성화
      setSelectedMatchForScoring(fullMatch);
      setScoreInputMode(true);
    } else if (matchFromBracket.status === 'completed') {
      // Show match result details
      Alert.alert(
        t('clubTournamentManagement.matchResult.title'),
        `${matchFromBracket.player1?.playerName || 'TBD'} vs ${matchFromBracket.player2?.playerName || 'TBD'}`
      );
    } else {
      Alert.alert(
        t('clubTournamentManagement.matchResult.info'),
        `${matchFromBracket.player1?.playerName || 'TBD'} vs ${matchFromBracket.player2?.playerName || 'TBD'}`
      );
    }
  };

  // Score submission handler (copied from TournamentDetailScreen)
  const handleScoreSubmit = async (scoreData: ScoreInputForm) => {
    if (!selectedMatchForScoring || !selectedTournament) return;

    try {
      console.log('🏆 [Management] Original score data:', {
        matchId: selectedMatchForScoring.id,
        scoreData,
        _winner: scoreData._winner,
        selectedMatch: {
          player1: selectedMatchForScoring.player1,
          player2: selectedMatchForScoring.player2,
        },
      });

      // Convert _winner to actual user ID
      let winnerId: string | undefined = undefined;
      if (scoreData._winner === 'player1' && selectedMatchForScoring.player1) {
        winnerId = selectedMatchForScoring.player1.playerId;
      } else if (scoreData._winner === 'player2' && selectedMatchForScoring.player2) {
        winnerId = selectedMatchForScoring.player2.playerId;
      }

      console.log('🏆 [Management] Winner calculation:', {
        _winner: scoreData._winner,
        player1Id: selectedMatchForScoring.player1?.playerId,
        player2Id: selectedMatchForScoring.player2?.playerId,
        calculatedWinnerId: winnerId,
      });

      // Validate that we have a winner if the match is complete
      if (scoreData._winner && !winnerId) {
        throw new Error(
          `Winner identified as '${scoreData._winner}' but corresponding player ID not found`
        );
      }

      // Convert ScoreInputForm to tournament service format
      // 🎯 [KIM FIX] walkover 필드 누락 버그 수정 - Cloud Function VAR 시스템에서 walkover 감지 필요
      const tournamentResult = {
        winnerId: winnerId || null,
        score: {
          sets: scoreData.sets,
          winner: scoreData._winner || undefined,
          retired: scoreData.retired || false,
          walkover: scoreData.walkover || false, // 🎯 [KIM FIX] 부전승 필드 추가!
          finalScore:
            scoreData.sets.length > 0
              ? scoreData.sets.map(set => `${set.player1Games}-${set.player2Games}`).join(', ')
              : '',
          duration: 0,
        } as TournamentScore,
        notes: scoreData.notes || '',
      };

      console.log('🏆 [Management] Converted tournament result:', tournamentResult);

      // Submit the score using tournament service
      await tournamentService.submitMatchResult(
        selectedTournament.id,
        selectedMatchForScoring.id,
        tournamentResult
      );

      // 🚀 Flow Switch: 점수 입력 모드 종료하고 관리 화면으로 복귀
      setScoreInputMode(false);
      setSelectedMatchForScoring(null);

      console.log('🏆 [Management] Score submitted successfully');

      // 🔄 Auto-refresh tournament data to capture any new rounds generated by Cloud Functions
      console.log('🔄 [Management] Auto-refreshing tournament data after score submission...');

      // Small delay to allow Cloud Functions time to process and generate new rounds
      setTimeout(async () => {
        try {
          console.log('🔄 [Management] Starting tournament data refresh...');

          // Reload tournaments to capture any status changes or new rounds
          await loadTournaments();

          // Force re-subscription to matches to ensure we get the latest data
          if (selectedTournament?.id) {
            console.log(
              '🔄 [Management] Re-subscribing to tournament matches:',
              selectedTournament.id
            );
            subscribeToTournamentMatches(selectedTournament.id);
          } else {
            console.warn('⚠️ [Management] No selected tournament for re-subscription');
          }

          console.log('✅ [Management] Tournament data refreshed successfully');

          // Additional refresh after a longer delay to catch any delayed Cloud Function updates
          setTimeout(async () => {
            try {
              console.log('🔄 [Management] Secondary refresh to catch delayed updates...');
              await loadTournaments();
              if (selectedTournament?.id) {
                subscribeToTournamentMatches(selectedTournament.id);

                // 🚀 Fallback: Check if manual round generation is needed
                try {
                  const status = await checkRoundGenerationStatus(selectedTournament.id);
                  if (status.canGenerate) {
                    console.log(
                      '🎯 [AUTO-FALLBACK] Manual round generation needed, triggering automatically...'
                    );
                    await tournamentService.generateNextRoundManually(selectedTournament.id);
                    console.log(
                      '✅ [AUTO-FALLBACK] Manual round generation completed successfully'
                    );

                    // Refresh once more after manual generation
                    setTimeout(async () => {
                      await loadTournaments();
                      if (selectedTournament?.id) {
                        subscribeToTournamentMatches(selectedTournament.id);
                      }
                      console.log('✅ [AUTO-FALLBACK] Post-generation refresh completed');
                    }, 2000);
                  }
                } catch (fallbackError) {
                  console.error(
                    '❌ [AUTO-FALLBACK] Error in automatic manual round generation:',
                    fallbackError
                  );
                }
              }
              console.log('✅ [Management] Secondary refresh completed');
            } catch (secondaryError) {
              console.error('❌ [Management] Error in secondary refresh:', secondaryError);
            }
          }, 5000); // 5 second secondary refresh
        } catch (error) {
          console.error('❌ [Management] Error refreshing tournament data:', error);
          // Retry once more after a longer delay
          setTimeout(async () => {
            try {
              console.log('🔄 [Management] Retrying tournament data refresh...');
              await loadTournaments();
              if (selectedTournament?.id) {
                subscribeToTournamentMatches(selectedTournament.id);
              }
              console.log('✅ [Management] Retry refresh completed');
            } catch (retryError) {
              console.error('❌ [Management] Retry refresh also failed:', retryError);
            }
          }, 3000);
        }
      }, 2000); // 2 second delay to allow Cloud Functions to complete

      Alert.alert(
        t('clubTournamentManagement.matchResult.submitted'),
        t('clubTournamentManagement.matchResult.successMessage')
      );
    } catch (error) {
      console.error('[Management] Error submitting tournament match score:', error);
      Alert.alert(
        t('clubTournamentManagement.common.error'),
        t('clubTournamentManagement.matchResult.errorMessage')
      );
    }
  };

  const handleScoreInputCancel = () => {
    setScoreInputMode(false);
    setSelectedMatchForScoring(null);
  };

  // Convert BracketMatch to Match format for ScoreInputContent (copied from TournamentDetailScreen)
  const convertBracketMatchToMatch = (bracketMatch: BracketMatch): Match | null => {
    if (!bracketMatch.player1 || !bracketMatch.player2) {
      console.log('🏆 [Management] Cannot convert bracket match - missing players:', {
        matchId: bracketMatch.id,
        hasPlayer1: !!bracketMatch.player1,
        hasPlayer2: !!bracketMatch.player2,
      });
      return null;
    }

    console.log('🏆 [Management] Converting BracketMatch to Match:', {
      matchId: bracketMatch.id,
      player1: bracketMatch.player1,
      player2: bracketMatch.player2,
    });

    return {
      id: bracketMatch.id,
      type: 'tournament',
      format: 'singles', // Default to singles for tournaments
      eventType: 'mens_singles', // Default event type

      // Create proper MatchParticipant objects
      player1: {
        userId: bracketMatch.player1.playerId,
        userName: bracketMatch.player1.playerName || 'Player 1',
        skillLevel: 'intermediate', // Default skill level
        photoURL: undefined,
      },
      player2: {
        userId: bracketMatch.player2.playerId,
        userName: bracketMatch.player2.playerName || 'Player 2',
        skillLevel: 'intermediate', // Default skill level
        photoURL: undefined,
      },

      // Match scheduling info
      scheduledAt: bracketMatch.scheduledTime
        ? typeof bracketMatch.scheduledTime.toDate === 'function'
          ? bracketMatch.scheduledTime
          : new Date()
        : new Date(),

      // Match metadata for compatibility
      status: bracketMatch.status || 'scheduled',
      location: bracketMatch.court || '',

      // Required fields for Match interface
      clubId: bracketMatch.tournamentId,
      createdBy: '',
      createdAt: bracketMatch.createdAt,
      updatedAt: bracketMatch.updatedAt,
    } as Match;
  };

  const renderTournamentCard = (tournament: Tournament) => {
    const participantCount = tournament.participants?.length || 0;
    const maxParticipants = tournament.settings?.maxParticipants || 8;
    const champion = tournament.champion;

    return (
      <TouchableOpacity
        key={tournament.id}
        style={dynamicStyles.tournamentCard}
        onPress={() => handleTournamentPress(tournament)}
      >
        <View style={styles.tournamentHeader}>
          <View style={styles.tournamentTitleContainer}>
            <Text style={[styles.tournamentTitle, { color: theme.colors.onSurface }]}>
              {tournament.tournamentName || tournament.title}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getTournamentStatusColor(tournament.status) },
              ]}
            >
              <Text style={styles.statusText}>{getTournamentStatusText(tournament.status)}</Text>
            </View>
          </View>

          <Ionicons name='chevron-forward' size={20} color={theme.colors.onSurfaceVariant} />
        </View>

        <View style={styles.tournamentInfo}>
          <View style={styles.infoRow}>
            <Ionicons name='people-outline' size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
              {t('clubTournamentManagement.labels.participantCount', {
                current: participantCount,
                max: maxParticipants,
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name='trophy-outline' size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
              {tournament.format === 'single_elimination'
                ? t('clubTournamentManagement.formats.singleElimination')
                : tournament.format === 'double_elimination'
                  ? t('clubTournamentManagement.formats.doubleElimination')
                  : t('clubTournamentManagement.formats.roundRobin')}
            </Text>
          </View>

          {tournament.startDate && (
            <View style={styles.infoRow}>
              <Ionicons name='calendar-outline' size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                {tournament.startDate.toDate().toLocaleDateString()}
              </Text>
            </View>
          )}

          {champion && (
            <View style={styles.infoRow}>
              <Ionicons name='trophy' size={16} color='#ffc107' />
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubTournamentManagement.stats.champion')}
                {champion.playerName}
              </Text>
            </View>
          )}

          {tournament.currentRound && tournament.status === 'in_progress' ? (
            <View style={styles.infoRow}>
              <Ionicons name='flag-outline' size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubTournamentManagement.roundGeneration.currentRoundLabel', {
                  round: tournament.currentRound,
                })}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 🤖 SPACE OPTIMIZATION: Removed action buttons ('대진표 관리', '상세 관리')
            to reduce card height and optimize screen real estate */}

        {/* 🎮 Manual Round Generation Button */}
        {tournament.status === 'in_progress' &&
          roundGenerationStatus[tournament.id]?.canGenerate && (
            <View style={styles.manualRoundContainer}>
              <TouchableOpacity
                style={[
                  styles.manualRoundButton,
                  { backgroundColor: theme.colors.primary },
                  isGeneratingRound && { opacity: 0.7 },
                ]}
                onPress={() => handleGenerateNextRound(tournament.id)}
                disabled={isGeneratingRound}
              >
                {isGeneratingRound ? (
                  <ActivityIndicator size='small' color='#fff' />
                ) : (
                  <Ionicons name='play-forward' size={18} color='#fff' />
                )}
                <Text style={styles.manualRoundButtonText}>
                  {isGeneratingRound
                    ? t('clubTournamentManagement.roundGeneration.generating')
                    : t('clubTournamentManagement.roundGeneration.generateNextRound', {
                        round: roundGenerationStatus[tournament.id]?.nextRound,
                      })}
                </Text>
              </TouchableOpacity>

              <View
                style={[styles.manualRoundInfo, { backgroundColor: theme.colors.primaryContainer }]}
              >
                <Ionicons
                  name='information-circle-outline'
                  size={14}
                  color={theme.colors.onPrimaryContainer}
                />
                <Text
                  style={[styles.manualRoundInfoText, { color: theme.colors.onPrimaryContainer }]}
                >
                  {t('clubTournamentManagement.roundGeneration.roundComplete', {
                    round: roundGenerationStatus[tournament.id]?.currentRound,
                  })}
                </Text>
              </View>
            </View>
          )}

        {/* Round generation status info for incomplete rounds */}
        {tournament.status === 'in_progress' &&
          roundGenerationStatus[tournament.id] &&
          !roundGenerationStatus[tournament.id]?.canGenerate && (
            <View
              style={[styles.roundStatusInfo, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Ionicons name='time-outline' size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.roundStatusInfoText, { color: theme.colors.onSurfaceVariant }]}>
                {roundGenerationStatus[tournament.id]?.reason ||
                  t('clubTournamentManagement.stats.roundInProgress')}
              </Text>
            </View>
          )}

        {/* 우승자 선정하기 버튼 */}
        {canConcludeTournament(tournament) && (
          <View style={styles.concludeButtonContainer}>
            <TouchableOpacity
              style={styles.concludeButton}
              onPress={() => {
                console.warn('Feature not implemented');
              }}
            >
              <Ionicons name='trophy' size={20} color='#fff' />
              <Text style={styles.concludeButtonText}>
                {t('clubTournamentManagement.buttons.crownWinner')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 🤖 SPACE OPTIMIZATION: Removed warning message about finals completion
            to further reduce card height and optimize screen real estate */}

        {tournament.stats && (
          <View style={[styles.tournamentStats, { borderTopColor: theme.colors.outline }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {tournament.stats.totalMatches}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubTournamentManagement.stats.totalMatches')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {tournament.stats.completedMatches}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubTournamentManagement.stats.completed')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {tournament.currentRound}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubTournamentManagement.stats.currentRound')}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const activeTournaments = tournaments.filter(t =>
    ['draft', 'registration', 'bracket_generation', 'in_progress'].includes(t.status)
  );

  const completedTournaments = tournaments.filter(t =>
    ['completed', 'cancelled'].includes(t.status)
  );

  const displayedTournaments = activeTab === 'active' ? activeTournaments : completedTournaments;

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    tournamentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {t('clubTournamentManagement.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 🔧 Calculate setsToWin from matchFormat (more reliable than stored value)
  const calculateSetsToWin = (matchFormat: string | undefined): number => {
    const result = matchFormat === 'best_of_5' ? 3 : matchFormat === 'best_of_3' ? 2 : 1;
    console.log('🐛 [Management] calculateSetsToWin called:', {
      matchFormat,
      result,
      tournamentSettings: selectedTournament?.settings,
    });
    return result;
  };

  // 🐛 [DEBUG] Calculate and log setsToWin BEFORE passing to ScoreInputContent
  const setsToWinForScoreInput = (() => {
    const result = calculateSetsToWin(selectedTournament?.settings?.matchFormat);
    console.log('🚨 [Management] Passing setsToWin to ScoreInputContent:', {
      tournamentId: selectedTournament?.id,
      'selectedTournament?.settings': selectedTournament?.settings,
      'selectedTournament?.settings?.matchFormat': selectedTournament?.settings?.matchFormat,
      'selectedTournament?.settings?.scoringFormat': selectedTournament?.settings?.scoringFormat,
      calculatedSetsToWin: result,
    });
    return result;
  })();

  // 🚀 Flow Switch: 조건부 렌더링으로 점수 입력 모드와 관리 모드 전환
  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      {scoreInputMode && selectedMatchForScoring ? (
        // 📝 점수 입력 모드: ScoreInputContent 렌더링
        <ScoreInputContent
          match={convertBracketMatchToMatch(selectedMatchForScoring)!}
          setsToWin={setsToWinForScoreInput} // ⚡ [THOR] Calculate from matchFormat instead of stored value
          gamesPerSet={selectedTournament?.settings?.scoringFormat?.gamesPerSet || 6} // ⚡ [THOR] Pass games per set with fallback
          onCancel={handleScoreInputCancel}
          onSubmit={handleScoreSubmit}
        />
      ) : (
        // 🏆 기본 모드: 토너먼트 관리 화면
        <>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name='arrow-back' size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              {t('clubTournamentManagement.title')}
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateForm(true)}>
              <Ionicons name='add' size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={dynamicStyles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'active' && { borderBottomColor: theme.colors.primary },
              ]}
              onPress={() => setActiveTab('active')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.onSurfaceVariant },
                  activeTab === 'active' && { color: theme.colors.primary },
                ]}
              >
                {t('clubTournamentManagement.tabs.active')}
              </Text>
              {activeTournaments.length > 0 ? (
                <View style={[styles.tabBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.tabBadgeText, { color: theme.colors.onPrimary }]}>
                    {activeTournaments.length}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'completed' && { borderBottomColor: theme.colors.primary },
              ]}
              onPress={() => setActiveTab('completed')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.onSurfaceVariant },
                  activeTab === 'completed' && { color: theme.colors.primary },
                ]}
              >
                {t('clubTournamentManagement.tabs.completed')}
              </Text>
              {completedTournaments.length > 0 ? (
                <View style={[styles.tabBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.tabBadgeText, { color: theme.colors.onPrimary }]}>
                    {completedTournaments.length}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          {/* Tournament List */}
          <ScrollView
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {displayedTournaments.length > 0 ? (
              displayedTournaments.map(renderTournamentCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name='trophy-outline'
                  size={64}
                  color={theme.colors.outlineVariant}
                  style={styles.emptyIcon}
                />
                <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                  {activeTab === 'active'
                    ? t('clubTournamentManagement.emptyStates.noActiveTournaments')
                    : t('clubTournamentManagement.emptyStates.noCompletedTournaments')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {activeTab === 'active'
                    ? t('clubTournamentManagement.emptyStates.createNewMessage')
                    : ''}
                </Text>
                {activeTab === 'active' ? (
                  <TouchableOpacity
                    style={[
                      styles.emptyCreateButton,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
                    ]}
                    onPress={() => setShowCreateForm(true)}
                  >
                    <Ionicons name='add-circle-outline' size={20} color={theme.colors.primary} />
                    <Text style={[styles.emptyCreateButtonText, { color: theme.colors.primary }]}>
                      {t('clubTournamentManagement.buttons.create')}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </ScrollView>

          {/* Create Tournament Modal */}
          <Modal
            visible={showCreateForm}
            animationType='slide'
            presentationStyle='pageSheet'
            onRequestClose={() => setShowCreateForm(false)}
          >
            <SafeAreaView style={dynamicStyles.modalContainer}>
              <View style={[modalStyles.modalHeader, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity
                  onPress={() => setShowCreateForm(false)}
                  style={modalStyles.modalCloseButton}
                >
                  <Ionicons name='close' size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>

              <CreateClubTournamentForm
                clubId={clubId!}
                onSuccess={handleCreateTournamentSuccess}
                onCancel={() => setShowCreateForm(false)}
              />
            </SafeAreaView>
          </Modal>

          {/* Tournament Detail Modal */}
          {/* Hide when UserSearchModal is open to prevent modal stacking conflicts */}
          <Modal
            visible={showTournamentDetail && !showUserSearchModal}
            animationType='slide'
            presentationStyle='pageSheet'
            onRequestClose={() => setShowTournamentDetail(false)}
          >
            <SafeAreaView style={dynamicStyles.modalContainer}>
              {/* Modal Header */}
              <View style={[modalStyles.modalHeader, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity
                  onPress={() => setShowTournamentDetail(false)}
                  style={modalStyles.modalCloseButton}
                >
                  <Ionicons name='close' size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <Text style={[modalStyles.modalTitle, { color: theme.colors.onSurface }]}>
                  {selectedTournament?.tournamentName || '토너먼트 상세'}
                </Text>
                <View style={{ width: 24 }} />
              </View>

              {/* Tournament Detail Tabs */}
              <View style={[styles.tabs, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    detailActiveTab === 'matches' && [
                      styles.activeTab,
                      { borderBottomColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setDetailActiveTab('matches')}
                >
                  <Ionicons
                    name='trophy-outline'
                    size={16}
                    color={
                      detailActiveTab === 'matches'
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: theme.colors.onSurfaceVariant },
                      detailActiveTab === 'matches' && [
                        styles.activeTabText,
                        { color: theme.colors.primary },
                      ],
                    ]}
                  >
                    {t('clubTournamentManagement.detailTabs.matches')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    detailActiveTab === 'participants' && [
                      styles.activeTab,
                      { borderBottomColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setDetailActiveTab('participants')}
                >
                  <Ionicons
                    name='people-outline'
                    size={16}
                    color={
                      detailActiveTab === 'participants'
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: theme.colors.onSurfaceVariant },
                      detailActiveTab === 'participants' && [
                        styles.activeTabText,
                        { color: theme.colors.primary },
                      ],
                    ]}
                  >
                    {t('clubTournamentManagement.detailTabs.participants')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    detailActiveTab === 'standings' && [
                      styles.activeTab,
                      { borderBottomColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setDetailActiveTab('standings')}
                >
                  <Ionicons
                    name='podium-outline'
                    size={16}
                    color={
                      detailActiveTab === 'standings'
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: theme.colors.onSurfaceVariant },
                      detailActiveTab === 'standings' && [
                        styles.activeTabText,
                        { color: theme.colors.primary },
                      ],
                    ]}
                  >
                    {t('clubTournamentManagement.detailTabs.standings')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    detailActiveTab === 'management' && [
                      styles.activeTab,
                      { borderBottomColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setDetailActiveTab('management')}
                >
                  <Ionicons
                    name='settings-outline'
                    size={16}
                    color={
                      detailActiveTab === 'management'
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: theme.colors.onSurfaceVariant },
                      detailActiveTab === 'management' && [
                        styles.activeTabText,
                        { color: theme.colors.primary },
                      ],
                    ]}
                  >
                    {t('clubTournamentManagement.detailTabs.management')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              <ScrollView
                style={styles.content}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                showsVerticalScrollIndicator={false}
              >
                {detailActiveTab === 'matches' && selectedTournament && (
                  <View style={styles.bracketViewContainer}>
                    {selectedTournament.status === 'draft' ||
                    selectedTournament.status === 'registration' ? (
                      <View style={styles.emptyStateContainer}>
                        <Ionicons name='trophy-outline' size={64} color='#ddd' />
                        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                          {t('clubTournamentManagement.emptyStates.bracketNotGenerated')}
                        </Text>
                        <Text
                          style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
                        >
                          {t('clubTournamentManagement.emptyStates.bracketAfterRegistration')}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.bracketContentContainer}>
                        {/* Tournament Info Header */}
                        <View
                          style={[
                            styles.tournamentInfoHeader,
                            { backgroundColor: theme.colors.surface },
                          ]}
                        >
                          <Text
                            style={[styles.tournamentInfoTitle, { color: theme.colors.onSurface }]}
                          >
                            {selectedTournament.tournamentName || selectedTournament.title}
                          </Text>
                          <Text
                            style={[
                              styles.tournamentInfoStatus,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
                          >
                            {selectedTournament.status === 'bracket_generation' &&
                              t('clubTournamentManagement.status.bracketGeneration')}
                            {selectedTournament.status === 'in_progress' &&
                              t('clubTournamentManagement.status.inProgress')}
                            {selectedTournament.status === 'completed' &&
                              t('clubTournamentManagement.tabs.completed')}
                          </Text>
                          {selectedTournament.participants && (
                            <Text
                              style={[
                                styles.tournamentInfoParticipants,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                            >
                              {t('clubTournamentManagement.detailTabs.participants')}:{' '}
                              {selectedTournament.participants.length}
                            </Text>
                          )}
                        </View>

                        {/* Embedded Bracket View */}
                        {(() => {
                          const tournamentMatches = matches[selectedTournament.id] || [];
                          const bracket = createSimpleBracket(tournamentMatches); // Type assertion handled in component

                          return (
                            <View style={styles.embeddedBracketContainer}>
                              {/* eslint-disable @typescript-eslint/no-explicit-any */}
                              <TournamentBracketView
                                bracket={bracket as any}
                                participants={selectedTournament.participants as any}
                                currentUserId={undefined} // Admin view, no specific user
                                isTournamentAdmin={true}
                                onMatchPress={handleMatchPress}
                              />
                              {/* eslint-enable @typescript-eslint/no-explicit-any */}
                            </View>
                          );
                        })()}

                        {/* Keep the navigation button as requested */}
                        <View style={styles.bracketNavigationContainer}>
                          <Text
                            style={[
                              styles.bracketHintText,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
                          >
                            {t('clubTournamentManagement.emptyStates.clickMatchesForDetails')}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {detailActiveTab === 'participants' && selectedTournament && (
                  <View style={styles.participantsContent}>
                    {/* Participants Summary */}
                    <View style={styles.participantsSummary}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                        {t('clubTournamentManagement.participants.overview')}
                      </Text>
                      <View style={styles.summaryRow}>
                        <View
                          style={[
                            styles.summaryCard,
                            { backgroundColor: theme.colors.surfaceVariant },
                          ]}
                        >
                          <Text style={[styles.summaryNumber, { color: theme.colors.primary }]}>
                            {selectedTournament.participants?.length || 0}
                          </Text>
                          <Text
                            style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}
                          >
                            {t('clubTournamentManagement.participants.current')}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.summaryCard,
                            { backgroundColor: theme.colors.surfaceVariant },
                          ]}
                        >
                          <Text
                            style={[styles.summaryNumber, { color: theme.colors.onSurfaceVariant }]}
                          >
                            {selectedTournament.settings?.maxParticipants || 8}
                          </Text>
                          <Text
                            style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}
                          >
                            {t('clubTournamentManagement.participants.max')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Participants List */}
                    {selectedTournament.participants &&
                    selectedTournament.participants.length > 0 ? (
                      <View style={styles.participantsList}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                          {t('clubTournamentManagement.participants.list')}
                        </Text>
                        {/* 🎾 Iron Man: Team-First UI - 복식은 팀 목록, 단식은 선수 목록 */}
                        {(() => {
                          // 🛡️ CCTV: Gatekeeper Interrogation
                          console.log('--- 🛡️ GATEKEEPER INTERROGATION ---');
                          console.log('Tournament Status:', selectedTournament.status);
                          console.log('Event Type:', selectedTournament.eventType);
                          console.log(
                            'Participants Count:',
                            selectedTournament.participants?.length
                          );
                          console.log(
                            'Participants Data:',
                            JSON.stringify(selectedTournament.participants, null, 2)
                          );

                          const isDoubles =
                            getMatchFormatFromTournamentEventType(selectedTournament.eventType) ===
                            'doubles';

                          console.log('Is Doubles?', isDoubles);

                          if (isDoubles) {
                            // 🦾 복식: 팀 목록 표시
                            const teams = tournamentService.groupParticipantsIntoTeams(
                              selectedTournament.participants
                            );

                            console.log('Teams Created:', teams.length);
                            console.log('Teams Data:', JSON.stringify(teams, null, 2));

                            // 🚨 팀 생성 실패 감지
                            if (teams.length === 0 && selectedTournament.participants.length > 0) {
                              console.error('❌ [ERROR] No teams created! Check partner data.');
                              console.error('  Participants have data but teams array is empty.');
                              console.error(
                                '  Possible causes: Missing partnerId fields or partner not found.'
                              );

                              // 🦾 Iron Man: Fallback UI - 팀 생성 실패 시 경고 메시지
                              return (
                                <View
                                  style={[
                                    styles.participantCard,
                                    {
                                      backgroundColor: '#FFF3CD',
                                      borderColor: '#856404',
                                      borderWidth: 1,
                                      padding: 16,
                                      marginBottom: 12,
                                    },
                                  ]}
                                >
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      marginBottom: 8,
                                    }}
                                  >
                                    <Ionicons name='warning-outline' size={24} color='#856404' />
                                    <Text
                                      style={{
                                        color: '#856404',
                                        fontSize: 16,
                                        fontWeight: 'bold',
                                        marginLeft: 8,
                                      }}
                                    >
                                      {t('clubTournamentManagement.emptyStates.cannotLoadTeamInfo')}
                                    </Text>
                                  </View>
                                  <Text style={{ color: '#856404', marginBottom: 8 }}>
                                    {t(
                                      'clubTournamentManagement.emptyStates.participantsCannotFormTeams'
                                    )}
                                  </Text>
                                  <Text style={{ color: '#856404', fontSize: 12, marginTop: 4 }}>
                                    Debug: {selectedTournament.participants.length} participants, 0
                                    teams created
                                  </Text>
                                </View>
                              );
                            }

                            return teams.map(team => (
                              <View
                                key={team.teamId}
                                style={[
                                  styles.participantCard,
                                  { backgroundColor: theme.colors.surface },
                                ]}
                              >
                                <View style={styles.participantInfo}>
                                  <View style={styles.participantHeader}>
                                    <Text
                                      style={[
                                        styles.participantName,
                                        { color: theme.colors.onSurface },
                                      ]}
                                    >
                                      {team.teamName ||
                                        `${team.player1.playerName} / ${team.player2.playerName}`}
                                    </Text>
                                    {team.seed && (
                                      <View
                                        style={[
                                          styles.seedBadge,
                                          { backgroundColor: theme.colors.primary },
                                        ]}
                                      >
                                        <Text style={styles.seedText}>#{team.seed}</Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text
                                    style={[
                                      styles.participantDetails,
                                      { color: theme.colors.onSurfaceVariant },
                                    ]}
                                  >
                                    {t('clubTournamentManagement.participants.player1')}:{' '}
                                    {team.player1.playerName} ({team.player1.skillLevel || 'N/A'})
                                  </Text>
                                  <Text
                                    style={[
                                      styles.participantDetails,
                                      { color: theme.colors.onSurfaceVariant },
                                    ]}
                                  >
                                    {t('clubTournamentManagement.participants.player2')}:{' '}
                                    {team.player2.playerName} ({team.player2.skillLevel || 'N/A'})
                                  </Text>
                                </View>
                                <View style={styles.participantActions}>
                                  {/* Manual seed assignment for bracket_generation status */}
                                  {selectedTournament.status === 'bracket_generation' &&
                                    selectedTournament.settings.seedingMethod === 'manual' && (
                                      <View style={styles.seedAssignmentContainer}>
                                        <Text
                                          style={[
                                            styles.seedLabel,
                                            { color: theme.colors.onSurfaceVariant },
                                          ]}
                                        >
                                          {t('clubTournamentManagement.matchInfo.seed')}:
                                        </Text>
                                        <TouchableOpacity
                                          style={[
                                            styles.seedInputButton,
                                            { borderColor: theme.colors.primary },
                                          ]}
                                          onPress={() => handleAssignSeedToTeam(team)}
                                        >
                                          <Text
                                            style={[
                                              styles.seedInputText,
                                              { color: theme.colors.primary },
                                            ]}
                                          >
                                            {team.seed || '-'}
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    )}

                                  {/* Remove button - only show during registration phase */}
                                  {selectedTournament.status === 'registration' && (
                                    <TouchableOpacity
                                      style={[
                                        styles.actionButtonSmall,
                                        { borderColor: theme.colors.error },
                                      ]}
                                      onPress={() => handleRemoveParticipant(team.player1)}
                                    >
                                      <Ionicons
                                        name='close-outline'
                                        size={16}
                                        color={theme.colors.error}
                                      />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            ));
                          } else {
                            // 단식: 기존 선수 목록 표시
                            return selectedTournament.participants.map((participant, index) => (
                              <View
                                key={participant.playerId || index}
                                style={[
                                  styles.participantCard,
                                  { backgroundColor: theme.colors.surface },
                                ]}
                              >
                                <View style={styles.participantInfo}>
                                  <View style={styles.participantHeader}>
                                    <Text
                                      style={[
                                        styles.participantName,
                                        { color: theme.colors.onSurface },
                                      ]}
                                    >
                                      {participant.playerName || t('common.unknownPlayer')}
                                    </Text>
                                    {participant.seed && (
                                      <View
                                        style={[
                                          styles.seedBadge,
                                          { backgroundColor: theme.colors.primary },
                                        ]}
                                      >
                                        <Text style={styles.seedText}>#{participant.seed}</Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text
                                    style={[
                                      styles.participantDetails,
                                      { color: theme.colors.onSurfaceVariant },
                                    ]}
                                  >
                                    {t('clubTournamentManagement.matchInfo.skill')}:{' '}
                                    {participant.skillLevel || 'N/A'}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.participantDetails,
                                      { color: theme.colors.onSurfaceVariant },
                                    ]}
                                  >
                                    {t('clubTournamentManagement.matchInfo.registered')}:{' '}
                                    {participant.registeredAt?.toDate?.()?.toLocaleDateString() ||
                                      'N/A'}
                                  </Text>
                                </View>
                                <View style={styles.participantActions}>
                                  {/* Manual seed assignment for bracket_generation status */}
                                  {selectedTournament.status === 'bracket_generation' &&
                                    selectedTournament.settings.seedingMethod === 'manual' && (
                                      <View style={styles.seedAssignmentContainer}>
                                        <Text
                                          style={[
                                            styles.seedLabel,
                                            { color: theme.colors.onSurfaceVariant },
                                          ]}
                                        >
                                          {t('clubTournamentManagement.matchInfo.seed')}:
                                        </Text>
                                        <TouchableOpacity
                                          style={[
                                            styles.seedInputButton,
                                            { borderColor: theme.colors.primary },
                                          ]}
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                          onPress={() => handleAssignSeed(participant as any)}
                                        >
                                          <Text
                                            style={[
                                              styles.seedInputText,
                                              { color: theme.colors.primary },
                                            ]}
                                          >
                                            {participant.seed || '-'}
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    )}

                                  {/* Remove button - only show during registration phase */}
                                  {selectedTournament.status === 'registration' && (
                                    <TouchableOpacity
                                      style={[
                                        styles.actionButtonSmall,
                                        { borderColor: theme.colors.error },
                                      ]}
                                      onPress={() => handleRemoveParticipant(participant)}
                                    >
                                      <Ionicons
                                        name='close-outline'
                                        size={16}
                                        color={theme.colors.error}
                                      />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            ));
                          }
                        })()}
                      </View>
                    ) : (
                      <View style={styles.emptyParticipants}>
                        <Ionicons
                          name='people-outline'
                          size={48}
                          color={theme.colors.outlineVariant}
                          style={styles.emptyIcon}
                        />
                        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                          {selectedTournament.status === 'draft'
                            ? t('clubTournamentManagement.emptyStates.openRegistrationMessage')
                            : t('clubTournamentManagement.emptyStates.noParticipants')}
                        </Text>
                        <Text
                          style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
                        >
                          {selectedTournament.status === 'draft'
                            ? t('clubTournamentManagement.emptyStates.goToManagementTab')
                            : t('clubTournamentManagement.emptyStates.waitForRegistrations')}
                        </Text>
                      </View>
                    )}

                    {/* Add Participant Button (for manual addition) */}
                    {/* 🏛️ OLYMPUS MISSION - Phase 1.1: Manual participant addition */}
                    {selectedTournament.status === 'registration' && (
                      <TouchableOpacity
                        style={[styles.addParticipantButton, { borderColor: theme.colors.primary }]}
                        onPress={() => {
                          console.log('👥 [Add Participant] Opening user search modal');
                          console.log(
                            '🔍 [Debug] Before setState - showUserSearchModal:',
                            showUserSearchModal
                          );
                          console.log('🔍 [Debug] excludeUserIds:', excludeUserIds);
                          console.log('🔍 [Debug] excludeUserIds length:', excludeUserIds.length);
                          console.log(
                            '🔍 [Debug] selectedTournament exists:',
                            !!selectedTournament
                          );
                          console.log('🔍 [Debug] selectedTournament.id:', selectedTournament?.id);
                          setShowUserSearchModal(true);
                          console.log('🔍 [Debug] After setState called');
                        }}
                        disabled={isAddingParticipant}
                      >
                        <Ionicons name='add-outline' size={20} color={theme.colors.primary} />
                        <Text
                          style={[styles.addParticipantButtonText, { color: theme.colors.primary }]}
                        >
                          {t('clubTournamentManagement.buttons.addParticipantManually')}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* 🎯 Seed Assignment Complete Button */}
                    {selectedTournament.status === 'bracket_generation' &&
                      selectedTournament.settings?.seedingMethod === 'manual' &&
                      selectedTournament.participants &&
                      selectedTournament.participants.length > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.seedCompleteButton,
                            {
                              backgroundColor: isAllSeedsAssigned(selectedTournament)
                                ? theme.colors.primary
                                : theme.colors.surfaceVariant,
                            },
                            !isAllSeedsAssigned(selectedTournament) && { opacity: 0.6 },
                          ]}
                          onPress={handleSeedAssignmentComplete}
                          disabled={!isAllSeedsAssigned(selectedTournament)}
                        >
                          <Ionicons
                            name='checkmark-circle'
                            size={20}
                            color={
                              isAllSeedsAssigned(selectedTournament)
                                ? '#fff'
                                : theme.colors.onSurfaceVariant
                            }
                          />
                          <Text
                            style={[
                              styles.seedCompleteButtonText,
                              {
                                color: isAllSeedsAssigned(selectedTournament)
                                  ? '#fff'
                                  : theme.colors.onSurfaceVariant,
                              },
                            ]}
                          >
                            {t('clubTournamentManagement.buttons.completeAssignment')}
                          </Text>
                          <Ionicons
                            name='arrow-forward'
                            size={20}
                            color={
                              isAllSeedsAssigned(selectedTournament)
                                ? '#fff'
                                : theme.colors.onSurfaceVariant
                            }
                          />
                        </TouchableOpacity>
                      )}
                  </View>
                )}

                {detailActiveTab === 'standings' && selectedTournament && (
                  <TournamentRankingsTab
                    participants={selectedTournament.participants || []}
                    matches={matches[selectedTournament.id] || []}
                    currentUserId={currentUser?.uid}
                    eventType={selectedTournament.eventType}
                  />
                )}

                {detailActiveTab === 'management' && selectedTournament && (
                  <View style={styles.managementContent}>
                    {/* Tournament Status Display */}
                    <View style={styles.statusSection}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                        {t('clubTournamentManagement.management.statusTitle')}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          styles.statusBadgeLarge,
                          { backgroundColor: getTournamentStatusColor(selectedTournament.status) },
                        ]}
                      >
                        <Text style={[styles.statusText, styles.statusTextLarge]}>
                          {getTournamentStatusText(selectedTournament.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Tournament Actions */}
                    <View style={styles.actionsSection}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                        {t('clubTournamentManagement.title')}
                      </Text>

                      {/* Draft Status - Show "Open Registration" button */}
                      {selectedTournament.status === 'draft' && (
                        <View style={styles.actionGroup}>
                          <TouchableOpacity
                            style={[
                              styles.primaryActionButton,
                              { backgroundColor: theme.colors.primary },
                            ]}
                            onPress={handleOpenRegistration}
                          >
                            <Ionicons name='person-add-outline' size={20} color='#fff' />
                            <Text style={styles.primaryActionButtonText}>
                              {t('clubTournamentManagement.buttons.openRegistration')}
                            </Text>
                          </TouchableOpacity>
                          <Text
                            style={[
                              styles.actionDescription,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
                          >
                            {t('clubTournamentManagement.management.openRegistrationDescription')}
                          </Text>

                          {/* 🗑️ Delete Tournament Button with Warning - 리그 화면 스타일과 통일 */}
                          <View
                            style={[
                              styles.dangerZone,
                              {
                                backgroundColor: theme.colors.errorContainer,
                                borderColor: theme.colors.error,
                              },
                            ]}
                          >
                            <View style={styles.dangerHeader}>
                              <Ionicons name='warning' size={24} color={theme.colors.error} />
                              <View style={styles.dangerTextContainer}>
                                <Text style={[styles.dangerTitle, { color: theme.colors.error }]}>
                                  {t('clubTournamentManagement.deletion.title')}
                                </Text>
                                <Text
                                  style={[
                                    styles.dangerSubtitle,
                                    { color: theme.colors.onErrorContainer },
                                  ]}
                                >
                                  {t('clubTournamentManagement.management.deleteDescription')}
                                </Text>
                              </View>
                            </View>

                            <TouchableOpacity
                              style={[styles.dangerButton, { backgroundColor: theme.colors.error }]}
                              onPress={handleDeleteTournament}
                            >
                              <Ionicons name='trash' size={20} color='#fff' />
                              <Text style={styles.dangerButtonText}>
                                {t('clubTournamentManagement.deletion.title')}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* Registration Status - Show participant count and close registration */}
                      {selectedTournament.status === 'registration' &&
                        (() => {
                          // 🎾 복식 토너먼트 홀수 참가자 검증
                          const isDoubles =
                            getMatchFormatFromTournamentEventType(selectedTournament.eventType) ===
                            'doubles';
                          const participantCount = selectedTournament.participants?.length || 0;
                          const isOddParticipants = isDoubles && participantCount % 2 !== 0;

                          // 🎯 [KIM FIX] 최소 참가자 수 검증
                          // 단식: 최소 2명, 복식/혼복: 최소 2팀 (= 4명 participants 또는 2개 doublesTeams)
                          const doublesTeamsCount = selectedTournament.doublesTeams?.length || 0;
                          const hasMinimumParticipants = isDoubles
                            ? doublesTeamsCount >= 2 || participantCount >= 4 // 복식: 2팀 이상
                            : participantCount >= 2; // 단식: 2명 이상

                          return (
                            <View style={styles.actionGroup}>
                              <View
                                style={[
                                  styles.participantCountCard,
                                  { backgroundColor: theme.colors.surfaceVariant },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.participantCountNumber,
                                    { color: theme.colors.primary },
                                  ]}
                                >
                                  {participantCount}
                                </Text>
                                <Text
                                  style={[
                                    styles.participantCountLabel,
                                    { color: theme.colors.onSurfaceVariant },
                                  ]}
                                >
                                  {participantCount}/
                                  {selectedTournament.settings?.maxParticipants || 8}
                                  {t('clubTournamentManagement.participants.count')}
                                </Text>
                              </View>

                              {/* 🎯 [KIM FIX] 최소 참가자 경고 */}
                              {!hasMinimumParticipants && (
                                <View
                                  style={[
                                    styles.registrationCompleteCard,
                                    {
                                      backgroundColor: '#FFF3CD',
                                      borderColor: '#856404',
                                      borderWidth: 1,
                                    },
                                  ]}
                                >
                                  <Ionicons name='warning-outline' size={20} color='#856404' />
                                  <Text
                                    style={[
                                      styles.registrationCompleteText,
                                      { color: '#856404', flex: 1 },
                                    ]}
                                  >
                                    {isDoubles
                                      ? t(
                                          'clubTournamentManagement.management.minimumTeamsRequired',
                                          {
                                            count:
                                              doublesTeamsCount || Math.floor(participantCount / 2),
                                          }
                                        )
                                      : t(
                                          'clubTournamentManagement.management.minimumParticipantsRequired',
                                          { count: participantCount }
                                        )}
                                  </Text>
                                </View>
                              )}

                              {/* 🎾 복식 홀수 참가자 경고 */}
                              {hasMinimumParticipants && isOddParticipants && (
                                <View
                                  style={[
                                    styles.registrationCompleteCard,
                                    {
                                      backgroundColor: '#FFF3CD',
                                      borderColor: '#856404',
                                      borderWidth: 1,
                                    },
                                  ]}
                                >
                                  <Ionicons name='warning-outline' size={20} color='#856404' />
                                  <Text
                                    style={[
                                      styles.registrationCompleteText,
                                      { color: '#856404', flex: 1 },
                                    ]}
                                  >
                                    {t(
                                      'clubTournamentManagement.management.evenParticipantsNeeded',
                                      { count: participantCount }
                                    )}
                                  </Text>
                                </View>
                              )}

                              {/* Registration Complete Message */}
                              {hasMinimumParticipants &&
                                !isOddParticipants &&
                                participantCount >=
                                  (selectedTournament.settings?.maxParticipants || 8) && (
                                  <View
                                    style={[
                                      styles.registrationCompleteCard,
                                      {
                                        backgroundColor: theme.colors.primary + '15',
                                        borderColor: theme.colors.primary,
                                      },
                                    ]}
                                  >
                                    <Ionicons
                                      name='checkmark-circle-outline'
                                      size={20}
                                      color={theme.colors.primary}
                                    />
                                    <Text
                                      style={[
                                        styles.registrationCompleteText,
                                        { color: theme.colors.primary },
                                      ]}
                                    >
                                      {t(
                                        'clubTournamentManagement.management.registrationFullMessage'
                                      )}
                                    </Text>
                                  </View>
                                )}

                              {/* 참가자 직접 추가 버튼 (관리 탭) */}
                              <TouchableOpacity
                                style={[
                                  styles.secondaryActionButton,
                                  isAddingParticipant && styles.disabledButton,
                                  {
                                    marginBottom: 12,
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.primary,
                                  },
                                ]}
                                onPress={() => setShowUserSearchModal(true)}
                                disabled={isAddingParticipant}
                              >
                                <Ionicons
                                  name='person-add-outline'
                                  size={20}
                                  color={
                                    isAddingParticipant
                                      ? theme.colors.onSurfaceVariant
                                      : theme.colors.primary
                                  }
                                  style={{ marginRight: 8 }}
                                />
                                <Text
                                  style={[
                                    styles.secondaryActionButtonText,
                                    {
                                      color: isAddingParticipant
                                        ? theme.colors.onSurfaceVariant
                                        : theme.colors.primary,
                                    },
                                  ]}
                                >
                                  {t('clubTournamentManagement.buttons.addParticipantManually')}
                                </Text>
                                {isAddingParticipant && (
                                  <ActivityIndicator
                                    size='small'
                                    color={theme.colors.primary}
                                    style={{ marginLeft: 8 }}
                                  />
                                )}
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.secondaryActionButton,
                                  {
                                    borderColor: theme.colors.primary,
                                    // 🎨 [KIM FIX] Add background color for better visibility
                                    backgroundColor: theme.colors.primary,
                                    // 🎯 [KIM FIX] 최소 참가자 조건 추가
                                    opacity:
                                      isOddParticipants ||
                                      isGeneratingBracket ||
                                      !hasMinimumParticipants
                                        ? 0.5
                                        : 1,
                                  },
                                ]}
                                onPress={handleCloseRegistration}
                                disabled={
                                  isOddParticipants ||
                                  isGeneratingBracket ||
                                  !hasMinimumParticipants
                                }
                              >
                                {isGeneratingBracket ? (
                                  <ActivityIndicator size='small' color='#FFFFFF' />
                                ) : (
                                  <Ionicons name='stop-outline' size={20} color='#FFFFFF' />
                                )}
                                <Text
                                  style={[styles.secondaryActionButtonText, { color: '#FFFFFF' }]}
                                >
                                  {isGeneratingBracket
                                    ? t('clubTournamentManagement.buttons.generateBracket')
                                    : t('clubTournamentManagement.buttons.closeRegistration')}
                                </Text>
                              </TouchableOpacity>
                              <Text
                                style={[
                                  styles.actionDescription,
                                  { color: theme.colors.onSurfaceVariant },
                                ]}
                              >
                                {t(
                                  'clubTournamentManagement.management.closeRegistrationDescription'
                                )}
                              </Text>

                              {/* 🗑️ Delete Tournament Button with Warning - 리그 화면 스타일과 통일 */}
                              <View
                                style={[
                                  styles.dangerZone,
                                  {
                                    backgroundColor: theme.colors.errorContainer,
                                    borderColor: theme.colors.error,
                                  },
                                ]}
                              >
                                <View style={styles.dangerHeader}>
                                  <Ionicons name='warning' size={24} color={theme.colors.error} />
                                  <View style={styles.dangerTextContainer}>
                                    <Text
                                      style={[styles.dangerTitle, { color: theme.colors.error }]}
                                    >
                                      {t('clubTournamentManagement.buttons.delete')}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.dangerSubtitle,
                                        { color: theme.colors.onErrorContainer },
                                      ]}
                                    >
                                      {t(
                                        'clubTournamentManagement.management.deleteAllParticipantsWarning'
                                      )}
                                    </Text>
                                  </View>
                                </View>

                                <TouchableOpacity
                                  style={[
                                    styles.dangerButton,
                                    { backgroundColor: theme.colors.error },
                                  ]}
                                  onPress={handleDeleteTournament}
                                >
                                  <Ionicons name='trash' size={20} color='#fff' />
                                  <Text style={styles.dangerButtonText}>
                                    {t('clubTournamentManagement.buttons.delete')}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })()}

                      {/* Bracket Generation Status - Show seed assignment or start tournament button */}
                      {selectedTournament.status === 'bracket_generation' && (
                        <View style={styles.actionGroup}>
                          {selectedTournament.settings.seedingMethod === 'manual' && (
                            <>
                              <TouchableOpacity
                                style={[
                                  styles.secondaryActionButton,
                                  {
                                    borderColor: theme.colors.primary,
                                    backgroundColor: theme.colors.surface,
                                    marginBottom: 12,
                                  },
                                ]}
                                onPress={() => setDetailActiveTab('participants')}
                              >
                                <Ionicons
                                  name='list-outline'
                                  size={20}
                                  color={theme.colors.primary}
                                />
                                <Text
                                  style={[
                                    styles.secondaryActionButtonText,
                                    { color: theme.colors.primary },
                                  ]}
                                >
                                  {t('clubTournamentManagement.buttons.assignSeeds')}
                                </Text>
                              </TouchableOpacity>
                              <Text
                                style={[
                                  styles.actionDescription,
                                  { color: theme.colors.onSurfaceVariant, marginBottom: 16 },
                                ]}
                              >
                                {t('clubTournamentManagement.management.assignSeedsManually')}
                              </Text>
                            </>
                          )}

                          <TouchableOpacity
                            style={[
                              styles.primaryActionButton,
                              { backgroundColor: isAddingParticipant ? '#cccccc' : '#4caf50' },
                            ]}
                            onPress={handleStartTournament}
                            disabled={isAddingParticipant}
                          >
                            <Ionicons name='play-outline' size={20} color='#fff' />
                            <Text style={styles.primaryActionButtonText}>
                              {t('clubTournamentManagement.management.generateBracketAndStart')}
                            </Text>
                          </TouchableOpacity>
                          <Text
                            style={[
                              styles.actionDescription,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
                          >
                            {selectedTournament.settings.seedingMethod === 'manual'
                              ? t('clubTournamentManagement.management.manualSeedingInstructions')
                              : t('clubTournamentManagement.management.autoSeedingInstructions')}
                          </Text>

                          {/* 🚨 Race Condition Prevention: Loading feedback */}
                          {isAddingParticipant && (
                            <View
                              style={[
                                styles.warningContainer,
                                { backgroundColor: theme.colors.secondaryContainer },
                              ]}
                            >
                              <Ionicons
                                name='hourglass-outline'
                                size={16}
                                color={theme.colors.onSecondaryContainer}
                              />
                              <Text
                                style={[
                                  styles.warningText,
                                  { color: theme.colors.onSecondaryContainer },
                                ]}
                              >
                                {t('clubTournamentManagement.management.addingParticipantsWait')}
                              </Text>
                            </View>
                          )}

                          {/* 🗑️ Delete Tournament Button with Warning - 리그 화면 스타일과 통일 */}
                          <View
                            style={[
                              styles.dangerZone,
                              {
                                backgroundColor: theme.colors.errorContainer,
                                borderColor: theme.colors.error,
                              },
                            ]}
                          >
                            <View style={styles.dangerHeader}>
                              <Ionicons name='warning' size={24} color={theme.colors.error} />
                              <View style={styles.dangerTextContainer}>
                                <Text style={[styles.dangerTitle, { color: theme.colors.error }]}>
                                  {t('clubTournamentManagement.deletion.title')}
                                </Text>
                                <Text
                                  style={[
                                    styles.dangerSubtitle,
                                    { color: theme.colors.onErrorContainer },
                                  ]}
                                >
                                  {t('clubTournamentManagement.management.cancelAndDeleteWarning')}
                                </Text>
                              </View>
                            </View>

                            <TouchableOpacity
                              style={[styles.dangerButton, { backgroundColor: theme.colors.error }]}
                              onPress={handleDeleteTournament}
                            >
                              <Ionicons name='trash' size={20} color='#fff' />
                              <Text style={styles.dangerButtonText}>
                                {t('clubTournamentManagement.deletion.title')}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* In Progress - Show current status */}
                      {selectedTournament.status === 'in_progress' && (
                        <View style={styles.actionGroup}>
                          <View
                            style={[
                              styles.infoCard,
                              { backgroundColor: theme.colors.surfaceVariant },
                            ]}
                          >
                            <Ionicons
                              name='play-circle-outline'
                              size={24}
                              color={theme.colors.primary}
                            />
                            <Text
                              style={[
                                styles.infoCardText,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                            >
                              {t('clubTournamentManagement.management.tournamentInProgress')}
                            </Text>
                          </View>

                          {/* 🗑️ Delete Tournament Button with Warning - 리그 화면 스타일과 통일 */}
                          <View
                            style={[
                              styles.dangerZone,
                              {
                                backgroundColor: theme.colors.errorContainer,
                                borderColor: theme.colors.error,
                              },
                            ]}
                          >
                            <View style={styles.dangerHeader}>
                              <Ionicons name='warning' size={24} color={theme.colors.error} />
                              <View style={styles.dangerTextContainer}>
                                <Text style={[styles.dangerTitle, { color: theme.colors.error }]}>
                                  {t('clubTournamentManagement.deletion.title')}
                                </Text>
                                <Text
                                  style={[
                                    styles.dangerSubtitle,
                                    { color: theme.colors.onErrorContainer },
                                  ]}
                                >
                                  {t('clubTournamentManagement.management.resetTournamentWarning')}
                                </Text>
                              </View>
                            </View>

                            <TouchableOpacity
                              style={[styles.dangerButton, { backgroundColor: theme.colors.error }]}
                              onPress={handleDeleteTournament}
                            >
                              <Ionicons name='trash' size={20} color='#fff' />
                              <Text style={styles.dangerButtonText}>
                                {t('clubTournamentManagement.deletion.title')}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* Completed - Show results */}
                      {selectedTournament.status === 'completed' && (
                        <View style={styles.actionGroup}>
                          <View
                            style={[
                              styles.infoCard,
                              { backgroundColor: theme.colors.surfaceVariant },
                            ]}
                          >
                            <Ionicons name='trophy-outline' size={24} color='#ffc107' />
                            <Text
                              style={[
                                styles.infoCardText,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                            >
                              {t('clubTournamentManagement.management.tournamentCompleted')}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </>
      )}

      {/* 🏛️ OLYMPUS MISSION - Phase 1.1: User Search Modal (Root Level) */}
      {/* Moved outside tournament detail modal to prevent modal-in-modal stacking issues */}
      <UserSearchModal
        visible={showUserSearchModal}
        onClose={() => setShowUserSearchModal(() => false)}
        onUserSelect={handleAddParticipant}
        excludeUserIds={excludeUserIds}
        clubId={clubId}
        isLoading={isAddingParticipant}
        tournamentFormat={
          selectedTournament
            ? getMatchFormatFromTournamentEventType(selectedTournament.eventType)
            : 'singles'
        }
        gameType={selectedTournament?.eventType}
        onTeamPairingRequired={async (players, autoGeneratedTeams) => {
          console.log('🎾 [Team Pairing Required] Processing auto-generated teams');
          console.log('🎾 [Players]:', players);
          console.log('🎾 [Auto-generated Teams]:', autoGeneratedTeams);

          if (autoGeneratedTeams && autoGeneratedTeams.length > 0) {
            // Use auto-generated teams directly
            console.log(`✅ Using ${autoGeneratedTeams.length} auto-generated teams`);

            // Create players array with partner information
            const playersWithPartners: Array<{
              uid: string;
              displayName: string;
              partnerId: string;
              partnerName: string;
            }> = [];

            autoGeneratedTeams.forEach(team => {
              // Add player1 with player2 as partner
              playersWithPartners.push({
                uid: team.player1.uid,
                displayName: team.player1.displayName,
                partnerId: team.player2.uid,
                partnerName: team.player2.displayName,
              });

              // Add player2 with player1 as partner
              playersWithPartners.push({
                uid: team.player2.uid,
                displayName: team.player2.displayName,
                partnerId: team.player1.uid,
                partnerName: team.player1.displayName,
              });
            });

            console.log('👥 [Players with Partners]:', playersWithPartners);

            // Add players to tournament with partner info
            await handleAddParticipant(playersWithPartners);
          }
        }}
      />

      {/* 🏛️ OLYMPUS MISSION - Phase 1.2: Team Pairing Modal (for doubles tournaments) */}
      <TeamPairingModal
        visible={showTeamPairingModal}
        onClose={() => {
          setShowTeamPairingModal(false);
          setSelectedPlayersForTeaming([]);
        }}
        onConfirm={async teams => {
          console.log('✅ [Team Pairing Confirmed] Teams:', teams);
          console.log(`🎾 [Team Pairing] Processing ${teams.length} teams for doubles tournament`);

          // Extract all players from teams to add as individual participants
          // The tournament service will handle team pairing on the backend
          const allPlayers: Array<{ uid: string; displayName: string }> = [];
          teams.forEach((team, index) => {
            console.log(
              `🎾 [Team ${index + 1}] ${team.player1.displayName} + ${team.player2.displayName}`
            );
            allPlayers.push({
              uid: team.player1.uid,
              displayName: team.player1.displayName,
            });
            allPlayers.push({
              uid: team.player2.uid,
              displayName: team.player2.displayName,
            });
          });

          console.log(`👥 [Team Pairing] Adding ${allPlayers.length} players to tournament`);

          // Close team pairing modal
          setShowTeamPairingModal(false);
          setSelectedPlayersForTeaming([]);

          // Add all players using existing handler
          await handleAddParticipant(allPlayers);
        }}
        players={selectedPlayersForTeaming}
      />
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
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    borderBottomColor: '#1976d2',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#1976d2',
  },
  tabBadge: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tournamentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tournamentTitleContainer: {
    flex: 1,
    gap: 8,
  },
  tournamentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  tournamentInfo: {
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
    color: '#666',
  },
  tournamentStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  emptyCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Modal styles (common styles imported from modalStyles)
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
  },
  concludeButtonContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  concludeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  concludeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    gap: 8,
  },
  progressInfoText: {
    fontSize: 12,
    color: '#e65100',
    flex: 1,
  },
  // Management Tab Styles
  managementContent: {
    paddingVertical: 16,
  },
  statusSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusBadgeLarge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statusTextLarge: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionGroup: {
    marginBottom: 24,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    gap: 8,
  },
  secondaryActionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  participantCountCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
    borderRadius: 12,
  },
  participantCountNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  participantCountLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  registrationCompleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  registrationCompleteText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoCardText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  // Delete Button Styles
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    // backgroundColor set inline for dark/light mode support
    marginTop: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f44336',
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  // Participants Tab Styles
  participantsContent: {
    paddingVertical: 16,
  },
  participantsSummary: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  participantsList: {
    marginBottom: 24,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  participantInfo: {
    flex: 1,
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  seedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  participantDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  participantActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  seedAssignmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seedLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  seedInputButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  seedInputText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  participantActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyParticipants: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  addParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 16,
    gap: 8,
  },
  addParticipantButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Bracket Navigation Styles
  bracketViewContainer: {
    flex: 1,
    padding: 16,
  },
  bracketContentContainer: {
    flex: 1,
  },
  tournamentInfoHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 16,
  },
  tournamentInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tournamentInfoStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  tournamentInfoParticipants: {
    fontSize: 12,
    marginTop: 2,
  },
  embeddedBracketContainer: {
    flex: 1,
    minHeight: 400,
    marginBottom: 20,
  },
  bracketNavigationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  bracketInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  bracketInfoText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  viewBracketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    minWidth: 200,
  },
  viewBracketButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bracketHintText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  // 🎮 Manual Round Generation Styles
  manualRoundContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  manualRoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  manualRoundButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  manualRoundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  manualRoundInfoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  roundStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  roundStatusInfoText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  // 🎯 Seed Assignment Complete Button Styles
  seedCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  seedCompleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  // 🔴 Danger Zone Styles - 리그 화면과 통일된 스타일
  dangerZone: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  dangerHeader: {
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
    marginBottom: 4,
  },
  dangerSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ClubTournamentManagementScreen;
