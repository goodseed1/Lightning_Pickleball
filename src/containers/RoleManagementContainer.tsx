import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Avatar, Modal, Portal, ActivityIndicator } from 'react-native-paper';
import { RoleManagementCard } from '../components/clubs/RoleManagementCard';
import clubService from '../services/clubService';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

interface Member {
  id: string;
  displayName: string;
  userName?: string;
  userAvatar?: string;
  role: 'member' | 'manager' | 'admin';
  joinedAt?: Date;
}

interface RoleStats {
  admin: number;
  manager: number;
  member: number;
}

// 로컬 타입 정의 (타입 파일 수정 방지)
interface FetchedMember {
  id: string;
  displayName?: string;
  userName?: string;
  userAvatar?: string;
  role: string;
  joinedAt?: Date;
}

interface ClubRoleStatsResponse {
  admin?: number;
  manager?: number;
  organizer?: number;
  member?: number;
}

interface RoleManagementContainerProps {
  clubId: string;
  userRole: string;
}

interface TransferCandidate {
  id: string;
  userId: string;
  displayName: string;
  userAvatar: string | null;
  role: string;
}

export const RoleManagementContainer: React.FC<RoleManagementContainerProps> = ({
  clubId,
  userRole,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats>({ admin: 0, manager: 0, member: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const themeColors = getLightningPickleballTheme(theme);
  const { t } = useLanguage();

  // 🔄 오너 이전 관련 상태
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferCandidates, setTransferCandidates] = useState<TransferCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<TransferCandidate | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  const isCurrentUserAdmin = userRole === 'admin' || userRole === 'manager';
  // 🔄 [KIM FIX] 현재 시스템에서 'admin'이 오너 역할을 겸함 (별도의 'owner' role 없음)
  const isCurrentUserOwner = userRole === 'admin';

  // 🎨 다크 글래스 스타일 (더 어둡고 미묘한 효과)
  const darkGlassStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  };

  useEffect(() => {
    if (!clubId) return;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const unsubscribeMembers = clubService.subscribeToClubMembers(clubId, (fetchedMembers: any) => {
      const processedMembers: Member[] = (fetchedMembers as FetchedMember[]).map((member: any) => ({
        id: member.id,
        displayName: member.displayName || member.userName || 'Unknown',
        userName: member.userName,
        userAvatar: member.userAvatar,
        role: member.role === 'organizer' ? 'manager' : member.role,
        joinedAt: member.joinedAt,
      }));
      setMembers(processedMembers);
      setIsLoading(false);
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const loadRoleStats = async () => {
      try {
        const stats = await clubService.getClubRoleStats(clubId);

        const statsTyped = stats as ClubRoleStatsResponse;
        const processedStats = {
          admin: statsTyped.admin || 0,
          manager: (statsTyped.manager || 0) + (statsTyped.organizer || 0),
          member: statsTyped.member || 0,
        };

        setRoleStats(processedStats);
      } catch (error) {
        console.error('Error loading role stats:', error);
      }
    };

    loadRoleStats();

    return () => {
      unsubscribeMembers?.();
    };
  }, [clubId]);

  // 🔄 오너 이전 모달 열기
  const handleOpenTransferModal = useCallback(async () => {
    setIsLoadingCandidates(true);
    setShowTransferModal(true);

    try {
      const candidates = await clubService.getOwnershipTransferCandidates(clubId);
      setTransferCandidates(candidates);
      // 🔄 운영진이 1명이면 자동 선택
      if (candidates.length === 1) {
        setSelectedCandidate(candidates[0]);
      }
    } catch (error) {
      console.error('Error loading transfer candidates:', error);
      Alert.alert(
        t('roleManagement.alerts.loadError.title'),
        t('roleManagement.alerts.loadError.message')
      );
      setShowTransferModal(false);
    } finally {
      setIsLoadingCandidates(false);
    }
  }, [clubId]);

  // 🔄 오너 이전 확인
  const handleConfirmTransfer = useCallback(async () => {
    if (!selectedCandidate) return;

    Alert.alert(
      t('roleManagement.alerts.transferConfirm.title'),
      t('roleManagement.alerts.transferConfirm.message', { name: selectedCandidate.displayName }),
      [
        { text: t('roleManagement.modal.cancel'), style: 'cancel' },
        {
          text: t('roleManagement.modal.confirm'),
          style: 'destructive',
          onPress: async () => {
            setIsTransferring(true);
            try {
              await clubService.transferClubOwnership(clubId, selectedCandidate.userId);
              Alert.alert(
                t('roleManagement.alerts.transferSuccess.title'),
                t('roleManagement.alerts.transferSuccess.message', {
                  name: selectedCandidate.displayName,
                })
              );
              setShowTransferModal(false);
              setSelectedCandidate(null);
            } catch (error) {
              console.error('Error transferring ownership:', error);
              Alert.alert(
                t('roleManagement.alerts.transferError.title'),
                t('roleManagement.alerts.transferError.message')
              );
            } finally {
              setIsTransferring(false);
            }
          },
        },
      ]
    );
  }, [clubId, selectedCandidate]);

  // 역할별 현황 업데이트 핸들러
  const handleRoleUpdated = useCallback((memberId: string, oldRole: string, newRole: string) => {
    setRoleStats(prevStats => {
      const newStats = { ...prevStats };

      // 이전 역할에서 차감
      if (oldRole === 'manager') newStats.manager -= 1;
      else if (oldRole === 'member') newStats.member -= 1;

      // 새 역할에 추가
      if (newRole === 'manager') newStats.manager += 1;
      else if (newRole === 'member') newStats.member += 1;

      return newStats;
    });
  }, []);

  const filteredMembers = members.filter(member => member.role !== 'admin');

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 🎨 역할별 현황 - 다크 글래스 */}
      <View style={[styles.statsCard, darkGlassStyle]}>
        <View style={styles.cardContent}>
          <Text variant='titleMedium' style={styles.sectionTitle}>
            {t('roleManagement.statsTitle')}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant='headlineSmall'>{roleStats.admin}</Text>
              <Text variant='bodySmall' style={styles.statLabel}>
                {t('roleManagement.roles.admin')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant='headlineSmall'>{roleStats.manager}</Text>
              <Text variant='bodySmall' style={styles.statLabel}>
                {t('roleManagement.roles.manager')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant='headlineSmall'>{roleStats.member}</Text>
              <Text variant='bodySmall' style={styles.statLabel}>
                {t('roleManagement.roles.member')}
              </Text>
            </View>
          </View>
          {/* 운영진 권한 설명 */}
          <Text variant='bodySmall' style={styles.managerDescription}>
            {t('roleManagement.managerDescription')}
          </Text>
        </View>
      </View>

      {/* 🔄 관리자 이전 섹션 (관리자만 표시) */}
      {isCurrentUserOwner && (
        <View style={[styles.transferSection, darkGlassStyle]}>
          <Text variant='titleMedium' style={styles.sectionTitle}>
            {t('roleManagement.transferSection.title')}
          </Text>
          <Text variant='bodySmall' style={styles.transferDescription}>
            {t('roleManagement.transferSection.description')}
          </Text>
          <Button
            mode='outlined'
            onPress={handleOpenTransferModal}
            style={styles.transferButton}
            icon='swap-horizontal'
          >
            {t('roleManagement.transferSection.button')}
          </Button>
        </View>
      )}

      <Text variant='titleMedium' style={styles.sectionTitle}>
        {t('roleManagement.roleChangeTitle')}
      </Text>

      {filteredMembers.map(member => (
        <RoleManagementCard
          key={member.id}
          member={member}
          isCurrentUserAdmin={isCurrentUserAdmin}
          onRoleUpdated={handleRoleUpdated}
          theme={theme}
        />
      ))}

      {/* 🔄 오너 이전 모달 */}
      <Portal>
        <Modal
          visible={showTransferModal}
          onDismiss={() => {
            setShowTransferModal(false);
            setSelectedCandidate(null);
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: themeColors.colors.surface },
          ]}
        >
          <Text variant='titleLarge' style={styles.modalTitle}>
            {t('roleManagement.modal.title')}
          </Text>

          {isLoadingCandidates ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' />
              <Text style={styles.loadingText}>{t('roleManagement.modal.loading')}</Text>
            </View>
          ) : transferCandidates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('roleManagement.modal.noCandidates')}</Text>
            </View>
          ) : (
            <View style={transferCandidates.length > 3 ? styles.candidateList : undefined}>
              {transferCandidates.map(candidate => (
                <TouchableOpacity
                  key={candidate.id}
                  style={[
                    styles.candidateItem,
                    selectedCandidate?.userId === candidate.userId && styles.candidateSelected,
                  ]}
                  onPress={() => setSelectedCandidate(candidate)}
                >
                  {candidate.userAvatar ? (
                    <Avatar.Image size={40} source={{ uri: candidate.userAvatar }} />
                  ) : (
                    <Avatar.Text size={40} label={candidate.displayName[0] || 'U'} />
                  )}
                  <View style={styles.candidateInfo}>
                    <Text variant='bodyLarge'>{candidate.displayName}</Text>
                    <Text variant='bodySmall' style={styles.candidateRole}>
                      {candidate.role === 'manager'
                        ? t('roleManagement.roles.manager')
                        : t('roleManagement.roles.admin')}
                    </Text>
                  </View>
                  {selectedCandidate?.userId === candidate.userId && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.modalActions}>
            <Button
              mode='outlined'
              onPress={() => {
                setShowTransferModal(false);
                setSelectedCandidate(null);
              }}
              style={styles.modalButton}
            >
              {t('roleManagement.modal.cancel')}
            </Button>
            <Button
              mode='contained'
              onPress={handleConfirmTransfer}
              disabled={!selectedCandidate || isTransferring}
              loading={isTransferring}
              style={styles.modalButton}
            >
              {t('roleManagement.modal.confirm')}
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardContent: {
    // Card.Content 대체
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    opacity: 0.7,
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  managerDescription: {
    marginTop: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  // 🔄 오너 이전 섹션 스타일
  transferSection: {
    marginBottom: 16,
    padding: 16,
  },
  transferDescription: {
    opacity: 0.7,
    marginBottom: 12,
  },
  transferButton: {
    marginTop: 4,
  },
  // 🔄 모달 스타일
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  candidateList: {
    maxHeight: 250,
  },
  candidateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    minHeight: 72,
    overflow: 'visible',
  },
  candidateSelected: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  candidateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  candidateRole: {
    opacity: 0.7,
  },
  checkmark: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    minWidth: 100,
  },
});
