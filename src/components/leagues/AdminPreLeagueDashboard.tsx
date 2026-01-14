import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Divider,
  Text as PaperText,
  Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import leagueService from '../../services/leagueService';
import activityService from '../../services/activityService';
import { Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { League } from '../../types/league';
import { Timestamp } from 'firebase/firestore';

interface AdminPreLeagueDashboardProps {
  league: League | null;
  onGenerateBracket: () => void;
  isGenerating: boolean;
}

interface Participant {
  id: string;
  name: string;
  status: 'approved' | 'pending' | 'rejected';
  joinedAt: string;
}

interface Application {
  id: string;
  eventId: string;
  applicantId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // 🚪 게이트키퍼: 사용자 프로필 정보 추가
  applicantProfile?: {
    displayName?: string;
    nickname?: string;
    uid?: string;
  };
}

export const AdminPreLeagueDashboard: React.FC<AdminPreLeagueDashboardProps> = ({
  league,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onGenerateBracket: _onGenerateBracket,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isGenerating: _isGenerating,
}) => {
  const { paperTheme: theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  // 💥 Phase 2: 실시간 참가자 데이터 연동
  const [applications, setApplications] = useState<Application[]>([]);

  // 🎭 커튼콜: 리그 활성화 상태
  const [isOpeningLeague, setIsOpeningLeague] = useState(false);

  // 🚪 게이트키퍼 Phase 2: 개별 승인 상태 관리
  const [approvingApplications, setApprovingApplications] = useState<Set<string>>(new Set());
  const { currentUser } = useAuth();

  // 실시간 참가 신청 구독
  useEffect(() => {
    if (!league?.id) {
      return;
    }

    console.log('🔄 [REALITY SYNC P2] Setting up applications subscription for league:', league.id);

    const q = query(
      collection(db, 'participation_applications'),
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
              const usersQuery = query(collection(db, 'users'), where('uid', 'in', batch));
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
                displayName: t('leagues.admin.unknownUser'),
                nickname: t('leagues.admin.unknownUser'),
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

  // 🔧 툴킷: Firestore Timestamp를 날짜 문자열로 변환 (스코프 문제 해결)
  const formatFirestoreDate = useCallback((timestamp: Timestamp | Date | string | null): string => {
    if (!timestamp) return new Date().toISOString().split('T')[0];

    // Firestore Timestamp 객체인 경우
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate().toISOString().split('T')[0];
    }

    // 이미 Date 객체인 경우
    if (timestamp instanceof Date) {
      return timestamp.toISOString().split('T')[0];
    }

    // 문자열인 경우
    return new Date(timestamp).toISOString().split('T')[0];
  }, []);

  // 🚪 게이트키퍼: 신청 데이터를 참가자 형태로 변환 (실제 사용자 이름 포함)
  const participants: Participant[] = React.useMemo(() => {
    return applications.map(app => ({
      id: app.applicantId,
      name:
        app.applicantProfile?.displayName ||
        app.applicantProfile?.nickname ||
        `${t('leagues.admin.applicant')} ${app.applicantId.slice(-4)}`, // 프로필이 없는 경우 fallback
      status: app.status,
      joinedAt: formatFirestoreDate(app.createdAt),
    }));
  }, [applications, formatFirestoreDate, t]);

  const approvedCount = participants.filter(p => p.status === 'approved').length;
  const pendingCount = participants.filter(p => p.status === 'pending').length;

  // 🎭 커튼콜: 리그 신청 접수 시작 핸들러
  const handleOpenApplications = async () => {
    if (!league) return;

    try {
      setIsOpeningLeague(true);
      console.log('🎭 [CURTAIN CALL] Admin opening league for applications:', league.id);

      await leagueService.openLeagueForApplications(league.id);

      Alert.alert(t('leagues.admin.leagueOpenedTitle'), t('leagues.admin.leagueOpenedMessage'), [
        { text: t('common.confirm'), style: 'default' },
      ]);
    } catch (error) {
      console.error('🎭 [CURTAIN CALL] Error opening league:', error);
      Alert.alert(t('common.error'), t('leagues.admin.leagueOpenError'), [
        { text: t('common.confirm'), style: 'default' },
      ]);
    } finally {
      setIsOpeningLeague(false);
    }
  };

  // 🚪 게이트키퍼 Phase 2: 개별 참가자 승인 핸들러
  const handleApproveApplication = async (applicationId: string, applicantName: string) => {
    if (!currentUser?.uid) {
      Alert.alert(t('leagues.admin.permissionError'), t('leagues.admin.adminRequired'));
      return;
    }

    try {
      // 승인 중 상태 설정
      setApprovingApplications(prev => new Set(prev).add(applicationId));
      console.log('🚪 [GATEKEEPER] Approving application:', applicationId, 'for:', applicantName);

      await activityService.approveApplication(applicationId, currentUser.uid);

      Alert.alert(
        t('leagues.admin.approvalCompleteTitle'),
        t('leagues.admin.approvalCompleteMessage', { name: applicantName }),
        [{ text: t('common.confirm'), style: 'default' }]
      );

      console.log('🚪 [GATEKEEPER] Successfully approved application for:', applicantName);
    } catch (error) {
      console.error('🚪 [GATEKEEPER] Error approving application:', error);
      Alert.alert(t('leagues.admin.approvalFailed'), t('leagues.admin.approvalError'), [
        { text: t('common.confirm'), style: 'default' },
      ]);
    } finally {
      // 승인 중 상태 해제
      setApprovingApplications(prev => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Admin Dashboard Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Ionicons name='shield-checkmark' size={48} color={theme.colors.primary} />
            <View style={styles.headerText}>
              <Title style={styles.dashboardTitle}>{t('leagues.admin.dashboardTitle')}</Title>
              <Paragraph style={styles.dashboardSubtitle}>
                {t('leagues.admin.dashboardSubtitle')}
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Participants Overview */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>{t('leagues.admin.participantStatus')}</Title>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <PaperText style={styles.statNumber}>{approvedCount}</PaperText>
              <PaperText style={styles.statLabel}>{t('leagues.admin.approved')}</PaperText>
            </View>
            <View style={styles.statItem}>
              <PaperText style={styles.statNumber}>{pendingCount}</PaperText>
              <PaperText style={styles.statLabel}>{t('leagues.admin.pending')}</PaperText>
            </View>
            <View style={styles.statItem}>
              <PaperText style={styles.statNumber}>
                {league?.settings?.maxParticipants || 16}
              </PaperText>
              <PaperText style={styles.statLabel}>{t('leagues.admin.maxParticipants')}</PaperText>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Participant List */}
      <Card style={styles.participantCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>{t('leagues.admin.participantList')}</Title>
          {participants.length > 0 ? (
            participants.map((participant, index) => {
              // 🚪 게이트키퍼 Phase 2: 개별 승인 상태 관리
              const application = applications.find(app => app.applicantId === participant.id);
              const isApproving = application ? approvingApplications.has(application.id) : false;
              const isPending = participant.status === 'pending';
              const isApproved = participant.status === 'approved';

              return (
                <View key={participant.id}>
                  <View style={styles.participantRow}>
                    <View style={styles.participantInfo}>
                      <PaperText style={styles.participantName}>{participant.name}</PaperText>
                      <PaperText style={styles.participantDate}>
                        {t('leagues.admin.applicationDate')}: {participant.joinedAt}
                      </PaperText>
                    </View>

                    {/* 🚪 게이트키퍼: 인터랙티브 상태 칩 */}
                    {isPending && !isApproving ? (
                      // 대기중 - 클릭 가능한 승인 버튼
                      <TouchableOpacity
                        onPress={() =>
                          application && handleApproveApplication(application.id, participant.name)
                        }
                        style={styles.approveButton}
                      >
                        <Chip
                          mode='outlined'
                          textStyle={[styles.chipText, { color: theme.colors.primary }]}
                          style={[styles.statusChip, { borderColor: theme.colors.primary }]}
                          icon='check'
                        >
                          {t('leagues.admin.approve')}
                        </Chip>
                      </TouchableOpacity>
                    ) : isPending && isApproving ? (
                      // 승인 처리 중
                      <Chip
                        mode='outlined'
                        textStyle={[styles.chipText, { color: theme.colors.outline }]}
                        style={[styles.statusChip, { borderColor: theme.colors.outline }]}
                        icon='loading'
                      >
                        {t('leagues.admin.processing')}
                      </Chip>
                    ) : isApproved ? (
                      // 승인 완료 - 비활성 상태
                      <Chip
                        mode='outlined'
                        textStyle={[styles.chipText, { color: theme.colors.primary }]}
                        style={[
                          styles.statusChip,
                          {
                            borderColor: theme.colors.primary,
                            backgroundColor: theme.colors.primaryContainer,
                          },
                        ]}
                        icon='check-circle'
                      >
                        {t('leagues.admin.approved')}
                      </Chip>
                    ) : (
                      // 기타 상태 (거절됨 등)
                      <Chip
                        mode='outlined'
                        textStyle={[styles.chipText, { color: theme.colors.error }]}
                        style={[styles.statusChip, { borderColor: theme.colors.error }]}
                        icon='close-circle'
                      >
                        {t('leagues.admin.rejected')}
                      </Chip>
                    )}
                  </View>
                  {index < participants.length - 1 && <Divider style={styles.divider} />}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyParticipants}>
              <Ionicons name='people-outline' size={48} color={theme.colors.outline} />
              <PaperText style={styles.emptyText}>{t('leagues.admin.noApplicants')}</PaperText>
              <PaperText style={styles.emptySubtext}>
                {t('leagues.admin.applicantsWillAppear')}
              </PaperText>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 🎭 League Activation Section (only for preparing leagues) */}
      {league?.status === 'preparing' && (
        <Card style={styles.activationCard}>
          <Card.Content>
            <View style={styles.activationHeader}>
              <Ionicons name='eye-off' size={32} color={theme.colors.outline} />
              <View style={styles.activationText}>
                <Title style={styles.activationTitle}>
                  {t('leagues.admin.leaguePrivateTitle')}
                </Title>
                <Paragraph style={styles.activationSubtitle}>
                  {t('leagues.admin.leaguePrivateMessage')}
                </Paragraph>
              </View>
            </View>

            <Button
              mode='contained'
              onPress={handleOpenApplications}
              loading={isOpeningLeague}
              disabled={isOpeningLeague}
              style={styles.activationButton}
              icon={isOpeningLeague ? undefined : 'eye'}
            >
              {isOpeningLeague
                ? t('leagues.admin.opening')
                : t('leagues.admin.startAcceptingApplications')}
            </Button>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

interface ThemeColors {
  colors: {
    background: string;
    primary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    surface: string;
    surfaceVariant: string;
    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
    error: string;
    errorContainer: string;
    onErrorContainer: string;
  };
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: 16,
    },
    headerCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.primaryContainer,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerText: {
      marginLeft: 16,
      flex: 1,
    },
    dashboardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onPrimaryContainer,
      marginBottom: 4,
    },
    dashboardSubtitle: {
      color: theme.colors.onPrimaryContainer,
      opacity: 0.8,
    },
    statsCard: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: theme.colors.onSurface,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    participantCard: {
      marginBottom: 16,
    },
    participantRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    participantDate: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    statusChip: {
      marginLeft: 12,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '500',
    },
    divider: {
      marginVertical: 8,
    },
    actionsCard: {
      marginBottom: 16,
    },
    actionButtons: {
      gap: 12,
    },
    actionButton: {
      marginBottom: 8,
    },
    primaryActionButton: {
      marginBottom: 8,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      padding: 12,
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 8,
    },
    warningText: {
      marginLeft: 8,
      color: theme.colors.onErrorContainer,
      fontSize: 12,
    },
    emptyParticipants: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    emptySubtext: {
      marginTop: 8,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
      textAlign: 'center',
    },
    // 🎭 커튼콜: 리그 활성화 섹션 스타일
    activationCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      borderStyle: 'dashed',
    },
    activationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    activationText: {
      marginLeft: 16,
      flex: 1,
    },
    activationTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    activationSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.8,
    },
    activationButton: {
      marginTop: 8,
    },
    // 🚪 게이트키퍼 Phase 2: 인터랙티브 승인 버튼 스타일
    approveButton: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    // 🔒 에어락: 동적 경고 메시지 스타일
    airlockWarning: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
      paddingLeft: 16,
    },
  });
