import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Text, Avatar, Button, Menu, IconButton, Card, TextInput } from 'react-native-paper';
import { TabView, TabBar } from 'react-native-tab-view';
import { useTheme, useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme as useLTTheme } from '../../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../../theme';
import clubService from '../../../services/clubService';
import { RoleManagementContainer } from '../../../containers/RoleManagementContainer';
import { useLanguage } from '../../../contexts/LanguageContext';

type RootStackParamList = {
  UserProfile: { userId: string; nickname?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type TabRoute = { key: string; title: string };

interface ClubMembersScreenProps {
  clubId: string;
  userRole: string;
  initialSubTab?: 'applications' | 'all_members' | 'roles';
}

interface JoinRequest {
  id: string;
  userId: string;
  displayName: string;
  requestedAt?: string | number;
  message?: string;
  profile?: {
    photoURL?: string;
  };
  // 🎯 [KIM FIX v19] Include LPR values (1-10 scale) for accurate display
  singlesLtr?: number;
  doublesLtr?: number;
  mixedLtr?: number;
}

interface ClubMember {
  id: string;
  userId: string;
  userName?: string;
  displayName?: string;
  userAvatar?: string;
  role: 'admin' | 'owner' | 'manager' | 'member';
  joinedAt?: string | number;
}

const ClubMembersScreen: React.FC<ClubMembersScreenProps> = ({
  clubId,
  userRole,
  initialSubTab,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { width } = Dimensions.get('window');
  const { t } = useLanguage();
  // 🎯 [KIM FIX] 탐색/이벤트 화면과 동일한 테마 사용
  const { theme: currentTheme } = useLTTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const isDark = currentTheme === 'dark';
  const [memberTabIndex, setMemberTabIndex] = useState(0);
  const [memberRoutes, setMemberRoutes] = useState<TabRoute[]>([
    { key: 'all_members', title: t('club.clubMembers.tabs.allMembers') },
  ]);

  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);

  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [removalReason, setRemovalReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // 🔒 더블 클릭 방지
  const textInputRef = useRef<typeof TextInput>(null);

  const isAdmin = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';

  // 🎯 [KIM FIX] initialSubTab prop으로 초기 탭 인덱스 설정
  const [initialTabApplied, setInitialTabApplied] = useState(false);

  useEffect(() => {
    // 관리자인 경우 추가 탭 표시
    if (isAdmin) {
      // 🎯 [KIM FIX v2] 가입 신청 탭에 (숫자) 텍스트 표시
      const applicationTitle =
        joinRequests.length > 0
          ? t('club.clubMembers.tabs.applications', { count: joinRequests.length })
          : t('club.clubMembers.tabs.joinRequests');
      // 🎯 [KIM FIX v2] 탭 순서 변경: 전체 회원 → 역할 관리 → 가입 대기
      // Race condition 해결: 초기 index 0이 항상 "전체 회원"을 가리키도록
      const newRoutes = [
        { key: 'all_members', title: t('club.clubMembers.tabs.allMembers') },
        { key: 'roles', title: t('club.clubMembers.tabs.roleManagement') },
        { key: 'applications', title: applicationTitle },
      ];
      setMemberRoutes(newRoutes);

      // 🎯 [KIM FIX v2] initialSubTab이 있으면 해당 탭으로 설정
      if (initialSubTab && !initialTabApplied) {
        const targetIndex = newRoutes.findIndex(route => route.key === initialSubTab);
        if (targetIndex !== -1) {
          setMemberTabIndex(targetIndex);
          setInitialTabApplied(true);
        }
      } else if (!initialTabApplied) {
        // 🎯 [KIM FIX v2] 기본 탭: '전체 회원' (인덱스 0) - Race condition 방지
        setMemberTabIndex(0);
        setInitialTabApplied(true);
      }
    }
  }, [isAdmin, joinRequests.length, initialSubTab, initialTabApplied, t]);

  useEffect(() => {
    if (!clubId) return;

    const unsubscribeRequests = clubService.subscribeToJoinRequests(
      clubId,
      (requests: JoinRequest[]) => {
        console.log('🔍 [ClubMembersScreen] joinRequests updated:', requests.length);
        setJoinRequests(requests);
      }
    );

    const unsubscribeMembers = clubService.subscribeToClubMembers(
      clubId,
      (members: ClubMember[]) => {
        setClubMembers(members);
      }
    );

    return () => {
      unsubscribeRequests?.();
      unsubscribeMembers?.();
    };
  }, [clubId]);

  const handleApproveRequest = useCallback(
    async (requestId: string) => {
      try {
        // 🕵️ [Operation Interrogation] Validate requestId before calling Cloud Function
        if (!requestId || typeof requestId !== 'string' || requestId.trim() === '') {
          console.error('❌ [Operation Interrogation] Invalid requestId for approval:', requestId);
          Alert.alert(t('alert.title.error'), t('club.joinRequest.invalidRequest'));
          return;
        }

        console.log(
          '🏰 [Operation Citadel] UI: Approving join request with validated ID:',
          requestId
        );
        const result = await clubService.approveJoinRequest(requestId);
        console.log('✅ [Operation Citadel] UI: Join request approved successfully:', result);

        // Show success message
        Alert.alert(t('club.joinRequest.approvedTitle'), t('club.joinRequest.approvedMessage'));
      } catch (error) {
        console.error('❌ [Operation Citadel] UI: Error approving request:', error);

        // Extract meaningful error message for user
        let errorMessage: string;
        if ((error as Error).message?.includes('not found')) {
          errorMessage = t('club.joinRequest.notFound');
        } else if ((error as Error).message?.includes('unauthenticated')) {
          errorMessage = t('club.joinRequest.authRequired');
        } else {
          errorMessage = t('club.joinRequest.approveFailed');
        }

        Alert.alert(t('alert.title.error'), errorMessage);
      }
    },
    [t]
  );

  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      try {
        // 🕵️ [Operation Interrogation] Validate requestId before calling Cloud Function
        if (!requestId || typeof requestId !== 'string' || requestId.trim() === '') {
          console.error('❌ [Operation Interrogation] Invalid requestId for rejection:', requestId);
          Alert.alert(t('alert.title.error'), t('club.joinRequest.invalidRequest'));
          return;
        }

        console.log(
          '🏰 [Operation Citadel] UI: Rejecting join request with validated ID:',
          requestId
        );
        const result = await clubService.rejectJoinRequest(requestId);
        console.log('✅ [Operation Citadel] UI: Join request rejected successfully:', result);

        // Show success message
        Alert.alert(t('club.joinRequest.rejectedTitle'), t('club.joinRequest.rejectedMessage'));
      } catch (error) {
        console.error('❌ [Operation Citadel] UI: Error rejecting request:', error);

        // Extract meaningful error message for user
        let errorMessage: string;
        if ((error as Error).message?.includes('not found')) {
          errorMessage = t('club.joinRequest.notFound');
        } else if ((error as Error).message?.includes('unauthenticated')) {
          errorMessage = t('club.joinRequest.authRequired');
        } else {
          errorMessage = t('club.joinRequest.rejectFailed');
        }

        Alert.alert(t('alert.title.error'), errorMessage);
      }
    },
    [t]
  );

  const handleMemberAction = useCallback(async () => {
    if (!selectedMember || isProcessing) return; // 🔒 더블 클릭 방지

    setIsProcessing(true); // 🔒 처리 시작
    try {
      switch (dialogType) {
        case 'promote':
          await clubService.updateMemberRole(selectedMember.id, 'manager');
          Alert.alert(t('common.success'), t('club.clubMembers.alerts.promoteSuccess'));
          break;
        case 'demote':
          await clubService.updateMemberRole(selectedMember.id, 'member');
          Alert.alert(t('common.success'), t('club.clubMembers.alerts.demoteSuccess'));
          break;
        case 'remove':
          await clubService.removeMember(
            clubId,
            selectedMember.userId,
            removalReason || t('club.clubMembers.removalReason.defaultReason')
          );
          Alert.alert(t('common.success'), t('club.clubMembers.alerts.removeSuccess'));
          break;
      }

      // 성공 시에만 다이얼로그 닫기
      setDialogVisible(false);
      setRemovalReason('');
      setSelectedMember(null);
    } catch (error) {
      console.error('❌ [ClubMembersScreen] Error handling member action:', error);

      // 사용자 친화적인 에러 메시지 추출
      const errorMessage = (error as Error).message?.includes('not found')
        ? t('club.clubMembers.alerts.memberNotFound')
        : (error as Error).message?.includes('permission-denied')
          ? t('club.clubMembers.alerts.permissionDenied')
          : (error as Error).message?.includes('cannot remove yourself')
            ? t('club.clubMembers.alerts.cannotRemoveSelf')
            : (error as Error).message?.includes('cannot remove the club owner')
              ? t('club.clubMembers.alerts.cannotRemoveOwner')
              : (error as Error).message || t('club.clubMembers.alerts.actionError');

      Alert.alert(t('alert.title.error'), errorMessage);
      // 에러 발생 시에는 다이얼로그를 닫지 않음 (재시도 가능하도록)
    } finally {
      setIsProcessing(false); // 🔒 처리 완료
    }
  }, [clubId, selectedMember, dialogType, removalReason, isProcessing, t]);

  const ApplicationTab = () => (
    <ScrollView
      style={[styles.tabContent, { backgroundColor: themeColors.colors.background }]}
      contentContainerStyle={styles.tabContentContainer}
    >
      {joinRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant='bodyLarge' style={{ color: themeColors.colors.onSurfaceVariant }}>
            {t('club.clubMembers.emptyStates.noRequests.description')}
          </Text>
        </View>
      ) : (
        joinRequests.map(request => (
          <View
            key={request.id}
            style={[styles.applicationCard, { backgroundColor: themeColors.colors.surface }]}
          >
            {/* 상단: 프로필 정보 (터치 가능) */}
            <TouchableOpacity
              style={styles.applicationHeader}
              onPress={() => {
                if (request.userId) {
                  navigation.navigate('UserProfile', {
                    userId: request.userId,
                    nickname: request.displayName,
                  });
                }
              }}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              {request.profile?.photoURL ? (
                <Avatar.Image size={44} source={{ uri: request.profile.photoURL }} />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: themeColors.colors.primaryContainer },
                  ]}
                >
                  <Text
                    style={[styles.avatarText, { color: themeColors.colors.onPrimaryContainer }]}
                  >
                    {request.displayName?.[0] || 'U'}
                  </Text>
                </View>
              )}

              {/* 이름 + 스킬레벨 + 날짜 */}
              <View style={styles.tileContent}>
                <View style={styles.nameRow}>
                  <Text style={[styles.memberName, { color: themeColors.colors.onSurface }]}>
                    {request.displayName}
                  </Text>
                  {(() => {
                    // 🎯 [KIM FIX v19] Use actual LPR values (1-10 scale)
                    const ltrValue = request.singlesLtr || request.doublesLtr || request.mixedLtr;
                    return ltrValue ? (
                      <View
                        style={[
                          styles.skillBadge,
                          { backgroundColor: themeColors.colors.primaryContainer },
                        ]}
                      >
                        <Text
                          style={[
                            styles.skillBadgeText,
                            { color: themeColors.colors.onPrimaryContainer },
                          ]}
                        >
                          LPR {Math.round(ltrValue)}
                        </Text>
                      </View>
                    ) : null;
                  })()}
                </View>
                <View style={styles.memberMetaRow}>
                  <Text
                    style={[styles.joinDateText, { color: themeColors.colors.onSurfaceVariant }]}
                  >
                    {request.requestedAt ? new Date(request.requestedAt).toLocaleDateString() : '-'}
                  </Text>
                </View>
              </View>

              {/* 프로필 보기 힌트 */}
              <Text style={[styles.profileHintText, { color: themeColors.colors.primary }]}>
                {t('club.clubMembers.profileHint')}
              </Text>
            </TouchableOpacity>

            {/* 신청 메시지 */}
            {request.message && (
              <Text
                style={[styles.applicationMessage, { color: themeColors.colors.onSurfaceVariant }]}
                numberOfLines={2}
              >
                &quot;{request.message}&quot;
              </Text>
            )}

            {/* 하단: 승인/거절 버튼 */}
            <View style={styles.applicationActions}>
              <TouchableOpacity
                style={[styles.approveBtn, { backgroundColor: themeColors.colors.primary }]}
                onPress={() => handleApproveRequest(request.id)}
              >
                <Text style={styles.approveBtnText}>{t('club.clubMembers.actions.approve')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rejectBtn,
                  {
                    backgroundColor: 'transparent',
                    borderColor: themeColors.colors.outline,
                  },
                ]}
                onPress={() => handleRejectRequest(request.id)}
              >
                <Text style={[styles.rejectBtnText, { color: themeColors.colors.onSurface }]}>
                  {t('club.clubMembers.actions.reject')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  // 🎯 [KIM FIX] 역할에 따른 배지 스타일
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
      case 'owner':
        return {
          backgroundColor: isDark ? 'rgba(255, 107, 53, 0.2)' : '#FFF3E0',
          textColor: isDark ? '#FF8A50' : '#E65100',
          label: t('club.clubMembers.roles.admin'),
        };
      case 'manager':
        return {
          backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9',
          textColor: isDark ? '#81C784' : '#2E7D32',
          label: t('club.clubMembers.roles.manager'),
        };
      default:
        return {
          backgroundColor: isDark ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD',
          textColor: isDark ? '#64B5F6' : '#1976D2',
          label: t('club.clubMembers.roles.member'),
        };
    }
  };

  const AllMembersTab = () => (
    <ScrollView
      style={[styles.tabContent, { backgroundColor: themeColors.colors.background }]}
      contentContainerStyle={styles.tabContentContainer}
    >
      {clubMembers.map(member => {
        const roleStyle = getRoleBadgeStyle(member.role);
        return (
          <TouchableOpacity
            key={member.id}
            style={[styles.memberCard, { backgroundColor: themeColors.colors.surface }]}
            onPress={() => {
              if (member.userId) {
                navigation.navigate('UserProfile', {
                  userId: member.userId,
                  nickname: member.userName || member.displayName,
                });
              }
            }}
            activeOpacity={0.7}
          >
            {/* Avatar - Left */}
            {member.userAvatar ? (
              <Avatar.Image size={44} source={{ uri: member.userAvatar }} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: themeColors.colors.primaryContainer },
                ]}
              >
                <Text style={[styles.avatarText, { color: themeColors.colors.onPrimaryContainer }]}>
                  {(member.userName?.[0] || member.displayName?.[0] || 'U').toUpperCase()}
                </Text>
              </View>
            )}

            {/* Content - Center */}
            <View style={styles.tileContent}>
              <View style={styles.nameRow}>
                <Text style={[styles.memberName, { color: themeColors.colors.onSurface }]}>
                  {member.userName || member.displayName}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: roleStyle.backgroundColor }]}>
                  <Text style={[styles.roleBadgeText, { color: roleStyle.textColor }]}>
                    {roleStyle.label}
                  </Text>
                </View>
              </View>
              <View style={styles.memberMetaRow}>
                <Ionicons
                  name='calendar-outline'
                  size={12}
                  color={themeColors.colors.onSurfaceVariant}
                />
                <Text style={[styles.joinDateText, { color: themeColors.colors.onSurfaceVariant }]}>
                  {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                </Text>
              </View>
            </View>

            {/* Meatball Menu or Chevron - Right */}
            {isAdmin ? (
              <Menu
                visible={menuVisible && selectedMember?.id === member.id}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon='dots-vertical'
                    size={20}
                    onPress={() => {
                      setSelectedMember(member);
                      setMenuVisible(true);
                    }}
                    iconColor={themeColors.colors.onSurfaceVariant}
                    style={styles.meatballIcon}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setDialogType('promote');
                    setMenuVisible(false);
                    setDialogVisible(true);
                  }}
                  title={t('club.clubMembers.actions.promoteToManager')}
                  leadingIcon='arrow-up'
                  disabled={member.role === 'admin' || member.role === 'manager'}
                />
                <Menu.Item
                  onPress={() => {
                    setDialogType('demote');
                    setMenuVisible(false);
                    setDialogVisible(true);
                  }}
                  title={t('club.clubMembers.actions.demoteToMember')}
                  leadingIcon='arrow-down'
                  disabled={member.role === 'admin' || member.role === 'member'}
                />
                <Menu.Item
                  onPress={() => {
                    setDialogType('remove');
                    setMenuVisible(false);
                    setDialogVisible(true);
                  }}
                  title={t('club.clubMembers.actions.removeFromClub')}
                  leadingIcon='account-remove'
                  disabled={member.role === 'admin'}
                />
              </Menu>
            ) : (
              <Ionicons
                name='chevron-forward'
                size={20}
                color={themeColors.colors.onSurfaceVariant}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const RolesTab = () => <RoleManagementContainer clubId={clubId} userRole={userRole} />;

  const memberRenderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'applications':
        return <ApplicationTab />;
      case 'all_members':
        return <AllMembersTab />;
      case 'roles':
        return <RolesTab />;
      default:
        return <AllMembersTab />;
    }
  };

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index: memberTabIndex, routes: memberRoutes }}
        renderScene={memberRenderScene}
        onIndexChange={setMemberTabIndex}
        initialLayout={{ width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={styles.subTabIndicator}
            style={styles.subTabBar}
            activeColor={theme.colors.primary}
            inactiveColor='#666'
            scrollEnabled={false}
          />
        )}
      />

      {/* Member Action Modal - View/Card 구조로 한글 IME 지원 */}
      {dialogVisible && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          ]}
        >
          <SafeAreaView style={styles.modalContainer}>
            <Card style={styles.actionModalCard}>
              <Card.Content>
                <Text variant='titleLarge' style={styles.modalTitle}>
                  {dialogType === 'promote' && t('club.clubMembers.modal.promoteTitle')}
                  {dialogType === 'demote' && t('club.clubMembers.modal.demoteTitle')}
                  {dialogType === 'remove' && t('club.clubMembers.modal.removeTitle')}
                </Text>
                <Text variant='bodyMedium' style={styles.modalDescription}>
                  {dialogType === 'promote' &&
                    t('club.clubMembers.modal.promoteMessage', {
                      userName: selectedMember?.displayName,
                    })}
                  {dialogType === 'demote' &&
                    t('club.clubMembers.modal.demoteMessage', {
                      userName: selectedMember?.displayName,
                    })}
                  {dialogType === 'remove' &&
                    t('club.clubMembers.modal.removeMessage', {
                      userName: selectedMember?.displayName,
                    })}
                </Text>
                {dialogType === 'remove' && (
                  <TextInput
                    ref={textInputRef}
                    mode='outlined'
                    label={t('club.clubMembers.removalReason.label')}
                    value={removalReason}
                    onChangeText={setRemovalReason}
                    multiline
                    numberOfLines={3}
                    style={styles.reasonInput}
                    placeholder={t('club.clubMembers.removalReason.placeholder')}
                  />
                )}
              </Card.Content>
              <Card.Actions style={styles.modalActions}>
                <Button onPress={() => setDialogVisible(false)} disabled={isProcessing}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onPress={handleMemberAction}
                  mode='contained'
                  disabled={isProcessing}
                  loading={isProcessing}
                  buttonColor={dialogType === 'remove' ? '#d32f2f' : undefined}
                >
                  {t('common.confirm')}
                </Button>
              </Card.Actions>
            </Card>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 16,
    gap: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  // 🎯 [KIM FIX] 가입 신청 카드 스타일 (탐색/이벤트 스타일과 통일)
  applicationCard: {
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicationMessage: {
    marginTop: 10,
    marginLeft: 56,
    fontSize: 13,
    fontStyle: 'italic',
  },
  applicationActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  rejectBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  skillBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  profileHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionModalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  modalDescription: {
    marginBottom: 16,
  },
  modalActions: {
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  reasonInput: {
    marginTop: 8,
  },
  subTabIndicator: {
    backgroundColor: '#2196f3',
    height: 3,
  },
  subTabBar: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  subTabLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
  // 🎯 [KIM FIX] 탐색/이벤트 스타일과 통일된 멤버 카드
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 1,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  tileContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontWeight: '600',
    fontSize: 15,
    marginRight: 8,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  joinDateText: {
    fontSize: 12,
    marginLeft: 2,
  },
  meatballIcon: {
    margin: 0,
  },
  // 🎯 [KIM FIX] 탭 레이블 컨테이너 및 배지 스타일
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: '#FF3B30',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ClubMembersScreen;
