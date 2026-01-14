import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Avatar,
  Chip,
  ActivityIndicator,
  Menu,
  Divider,
  IconButton,
  Button,
} from 'react-native-paper';
import { TabView, TabBar } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { useClub } from '../../contexts/ClubContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { theme } from '../../theme';
import clubService from '../../services/clubService';

interface ClubMember {
  id: string;
  userId: string;
  userName: string;
  profileImage?: string;
  // 🎯 [KIM FIX] Add userAvatar field (provided by clubService.subscribeToClubMembers)
  userAvatar?: string;
  skillLevel?: number;
  role: 'owner' | 'admin' | 'member';
  status: string;
  joinedAt: Date;
  lastActive?: Date;
  eventsAttended: number;
}

interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  profileImage?: string;
  // 🎯 [KIM FIX] Add profile field (provided by clubService.subscribeToJoinRequests)
  profile?: {
    nickname?: string;
    photoURL?: string;
  };
  status: 'pending' | 'approved' | 'declined';
  requestedAt: Date;
  message?: string;
}

interface MenuState {
  visible: boolean;
  memberId: string | null;
}

export default function ClubMembersScreen() {
  const route = useRoute();
  const { currentUser } = useAuth();
  const { clubMembers, isLoadingMembers, selectClub } = useClub();
  const { t } = useLanguage();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { clubId } = (route.params as any) || {};
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [menuState, setMenuState] = useState<MenuState>({ visible: false, memberId: null });
  const [tabIndex, setTabIndex] = useState(0);
  const routes = [
    { key: 'members', title: t('club.clubMembers.tabs.currentMembers') },
    { key: 'requests', title: t('club.clubMembers.tabs.joinRequests') },
  ];
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);

  // loadMembers function removed - now using ClubContext's real-time data

  const loadJoinRequests = useCallback(async () => {
    try {
      const requests = await clubService.getClubJoinRequests(clubId);
      setJoinRequests(requests);
    } catch (error) {
      console.error('Error loading join requests:', error);
      Alert.alert(
        t('club.clubMembers.alerts.loadError.title'),
        t('club.clubMembers.alerts.loadError.message')
      );
    }
  }, [clubId, t]);

  useEffect(() => {
    // Select the club to trigger ClubContext's real-time listeners
    if (clubId) {
      selectClub(clubId);
    }
    loadJoinRequests();
  }, [clubId, selectClub, loadJoinRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Members are automatically updated via ClubContext's real-time listener
    await loadJoinRequests();
    setRefreshing(false);
  };

  const getRoleText = (role: string): string => {
    switch (role) {
      case 'owner':
        return t('club.clubMembers.roles.owner');
      case 'admin':
        return t('club.clubMembers.roles.admin');
      case 'member':
        return t('club.clubMembers.roles.member');
      default:
        return t('club.clubMembers.roles.member');
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'owner':
        return '#9c27b0';
      case 'admin':
        return '#f44336';
      case 'member':
        return '#4caf50';
      default:
        return '#4caf50';
    }
  };

  const canManageMember = (targetMember: ClubMember): boolean => {
    // 소유자는 관리할 수 없음
    if (targetMember.role === 'owner') return false;

    // 자기 자신은 관리할 수 없음
    if (targetMember.userId === currentUser?.uid) return false;

    return true;
  };

  const showMemberMenu = (member: ClubMember) => {
    if (!canManageMember(member)) return;

    const options = [];

    // 역할 변경 옵션
    if (member.role === 'member') {
      options.push(t('club.clubMembers.actions.promote'));
    } else if (member.role === 'admin') {
      options.push(t('club.clubMembers.actions.demote'));
    }

    // 추방 옵션
    options.push(t('club.clubMembers.actions.remove'));
    options.push(t('club.clubMembers.actions.cancel'));

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: options.length - 2,
          cancelButtonIndex: options.length - 1,
          title: `${member.userName} ${t('club.clubMembers.actions.manage')}`,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            // 역할 변경
            handleRoleChange(member);
          } else if (buttonIndex === options.length - 2) {
            // 추방
            handleRemoveMember(member);
          }
        }
      );
    } else {
      setMenuState({ visible: true, memberId: member.id });
    }
  };

  const handleRoleChange = (member: ClubMember) => {
    const newRole = member.role === 'member' ? 'admin' : 'member';
    const newRoleText =
      newRole === 'admin' ? t('club.clubMembers.roles.admin') : t('club.clubMembers.roles.member');

    Alert.alert(
      t('club.clubMembers.alerts.roleChange.title'),
      t('club.clubMembers.alerts.roleChange.message', {
        userName: member.userName,
        role: newRoleText,
      }),
      [
        { text: t('club.clubMembers.actions.cancel'), style: 'cancel' },
        {
          text: t('club.clubMembers.alerts.roleChange.confirm'),
          onPress: async () => {
            try {
              const membershipId = `${clubId}_${member.userId}`;
              await clubService.updateMemberRole(membershipId, newRole);
              Alert.alert(
                t('common.success'),
                t('club.clubMembers.alerts.roleChange.success', {
                  userName: member.userName,
                  role: newRoleText,
                })
              );
              // Members are automatically updated via ClubContext's real-time listener
            } catch (error) {
              console.error('Error updating member role:', error);
              Alert.alert(t('common.error'), t('club.clubMembers.alerts.roleChange.error'));
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member: ClubMember) => {
    Alert.alert(
      t('club.clubMembers.alerts.removeMember.title'),
      t('club.clubMembers.alerts.removeMember.message', { userName: member.userName }),
      [
        { text: t('club.clubMembers.actions.cancel'), style: 'cancel' },
        {
          text: t('club.clubMembers.alerts.removeMember.action'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clubService.removeMember(clubId, member.userId);
              Alert.alert(
                t('common.success'),
                t('club.clubMembers.alerts.removeMember.success', { userName: member.userName })
              );
              // Members are automatically updated via ClubContext's real-time listener
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert(t('common.error'), t('club.clubMembers.alerts.removeMember.error'));
            }
          },
        },
      ]
    );
  };

  const handleApproveRequest = async (request: JoinRequest) => {
    Alert.alert(
      t('club.clubMembers.alerts.approveRequest.title'),
      t('club.clubMembers.alerts.approveRequest.message', { userName: request.userName }),
      [
        { text: t('club.clubMembers.actions.cancel'), style: 'cancel' },
        {
          text: t('club.clubMembers.actions.approve'),
          onPress: async () => {
            try {
              setRequestActionLoading(request.id);
              // 🏰 [Operation Citadel] Use correct single-parameter signature
              await clubService.approveJoinRequest(request.id);
              Alert.alert(
                t('common.success'),
                t('club.clubMembers.alerts.approveRequest.success', { userName: request.userName })
              );
              loadJoinRequests();
              // Members are automatically updated via ClubContext's real-time listener
            } catch (error) {
              console.error('Error approving join request:', error);
              Alert.alert(t('common.error'), t('club.clubMembers.alerts.approveRequest.error'));
            } finally {
              setRequestActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleDeclineRequest = async (request: JoinRequest) => {
    Alert.alert(
      t('club.clubMembers.alerts.declineRequest.title'),
      t('club.clubMembers.alerts.declineRequest.message', { userName: request.userName }),
      [
        { text: t('club.clubMembers.actions.cancel'), style: 'cancel' },
        {
          text: t('club.clubMembers.actions.reject'),
          style: 'destructive',
          onPress: async () => {
            try {
              // 🕵️ [Operation Interrogation] Verify we have valid request ID
              if (!request.id) {
                console.error('❌ [Operation Interrogation] Missing request.id:', request);
                Alert.alert(
                  t('common.error'),
                  t('club.clubMembers.alerts.declineRequest.invalidData')
                );
                return;
              }

              setRequestActionLoading(request.id);
              console.log(
                '🕵️ [Operation Interrogation] Rejecting request with correct ID:',
                request.id
              );

              // 🏰 [Operation Citadel] Use correct requestId parameter (not userId!)
              await clubService.rejectJoinRequest(request.id);

              Alert.alert(
                t('common.success'),
                t('club.clubMembers.alerts.declineRequest.success', { userName: request.userName })
              );
              loadJoinRequests();
            } catch (error) {
              console.error('❌ [Operation Interrogation] Error rejecting join request:', error);
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : t('club.clubMembers.alerts.declineRequest.error');
              Alert.alert(t('common.error'), errorMessage);
            } finally {
              setRequestActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderJoinRequestItem = ({ item: request }: { item: JoinRequest }) => (
    <Card style={styles.memberCard}>
      <View style={styles.memberRow}>
        {/* 🎯 [KIM FIX] 프로필 이미지 - Avatar.Image 조건부 렌더링 */}
        {request.profile?.photoURL ? (
          <Avatar.Image
            size={48}
            source={{ uri: request.profile.photoURL }}
            style={styles.avatar}
          />
        ) : (
          <Avatar.Text
            size={48}
            label={request.userName.charAt(0)}
            style={[styles.avatar, { backgroundColor: '#ff9800' }]}
          />
        )}

        {/* 신청자 정보 */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{request.userName}</Text>
          <View style={styles.memberMeta}>
            <Chip
              compact
              style={[styles.roleChip, { backgroundColor: '#ff9800' + '20' }]}
              textStyle={[styles.roleText, { color: '#ff9800' }]}
            >
              {t('club.clubMembers.status.pending')}
            </Chip>
            <Text style={styles.joinDate}>
              {t('club.clubMembers.dateFormats.requestedAt', {
                date: request.requestedAt.toLocaleDateString(t('common.locale')),
              })}
            </Text>
          </View>
          {request.message && (
            <Text style={styles.requestMessage} numberOfLines={2}>
              "{request.message}"
            </Text>
          )}
        </View>

        {/* 승인/거절 버튼 */}
        <View style={styles.requestActions}>
          <Button
            mode='contained'
            compact
            onPress={() => handleApproveRequest(request)}
            disabled={requestActionLoading === request.id}
            loading={requestActionLoading === request.id}
            style={styles.approveButton}
            labelStyle={styles.actionButtonLabel}
          >
            {t('club.clubMembers.actions.approve')}
          </Button>
          <Button
            mode='outlined'
            compact
            onPress={() => handleDeclineRequest(request)}
            disabled={requestActionLoading === request.id}
            style={styles.declineButton}
            labelStyle={styles.actionButtonLabel}
            textColor='#f44336'
          >
            {t('club.clubMembers.actions.reject')}
          </Button>
        </View>
      </View>
    </Card>
  );

  const renderMemberItem = ({ item: member }: { item: ClubMember }) => (
    <Card style={styles.memberCard}>
      <View style={styles.memberRow}>
        {/* 🎯 [KIM FIX] 프로필 이미지 - Avatar.Image 조건부 렌더링 */}
        {member.userAvatar ? (
          <Avatar.Image size={48} source={{ uri: member.userAvatar }} style={styles.avatar} />
        ) : (
          <Avatar.Text
            size={48}
            label={member.userName.charAt(0)}
            style={[styles.avatar, { backgroundColor: getRoleColor(member.role) }]}
          />
        )}

        {/* 멤버 정보 */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.userName}</Text>
          <View style={styles.memberMeta}>
            <Chip
              compact
              style={[styles.roleChip, { backgroundColor: getRoleColor(member.role) + '20' }]}
              textStyle={[styles.roleText, { color: getRoleColor(member.role) }]}
            >
              {getRoleText(member.role)}
            </Chip>
            <Text style={styles.joinDate}>
              {t('club.clubMembers.dateFormats.joinedAt', {
                date: member.joinedAt.toLocaleDateString(t('common.locale')),
              })}
            </Text>
          </View>
        </View>

        {/* 관리 메뉴 */}
        {canManageMember(member) && (
          <View style={styles.menuContainer}>
            {Platform.OS === 'android' ? (
              <Menu
                visible={menuState.visible && menuState.memberId === member.id}
                onDismiss={() => setMenuState({ visible: false, memberId: null })}
                anchor={
                  <IconButton
                    icon='dots-vertical'
                    size={20}
                    onPress={() => setMenuState({ visible: true, memberId: member.id })}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuState({ visible: false, memberId: null });
                    handleRoleChange(member);
                  }}
                  title={
                    member.role === 'member'
                      ? t('club.clubMembers.actions.promote')
                      : t('club.clubMembers.actions.demote')
                  }
                />
                <Divider />
                <Menu.Item
                  onPress={() => {
                    setMenuState({ visible: false, memberId: null });
                    handleRemoveMember(member);
                  }}
                  title={t('club.clubMembers.actions.remove')}
                  titleStyle={{ color: '#f44336' }}
                />
              </Menu>
            ) : (
              <TouchableOpacity style={styles.menuButton} onPress={() => showMemberMenu(member)}>
                <Ionicons name='ellipsis-vertical' size={20} color='#666' />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Card>
  );

  if (isLoadingMembers) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Title style={styles.title}>{t('club.clubMembers.title')}</Title>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('club.clubMembers.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const MembersRoute = () => {
    const members = clubMembers || [];
    return (
      <FlatList
        /* eslint-disable @typescript-eslint/no-explicit-any */
        data={members as any[]}
        /* eslint-enable @typescript-eslint/no-explicit-any */
        renderItem={renderMemberItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name='people-outline' size={64} color='#ccc' />
            <Text style={styles.emptyTitle}>
              {t('club.clubMembers.emptyStates.noMembers.title')}
            </Text>
            <Text style={styles.emptyDescription}>
              {t('club.clubMembers.emptyStates.noMembers.description')}
            </Text>
          </View>
        }
      />
    );
  };

  const RequestsRoute = () => (
    <FlatList
      data={joinRequests}
      renderItem={renderJoinRequestItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name='person-add-outline' size={64} color='#ccc' />
          <Text style={styles.emptyTitle}>
            {t('club.clubMembers.emptyStates.noRequests.title')}
          </Text>
          <Text style={styles.emptyDescription}>
            {t('club.clubMembers.emptyStates.noRequests.description')}
          </Text>
        </View>
      }
    />
  );

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'members':
        return <MembersRoute />;
      case 'requests':
        return <RequestsRoute />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>{t('club.clubMembers.title')}</Title>
        <View style={styles.headerStats}>
          <Text style={styles.memberCount}>
            {t('club.clubMembers.memberCount', { count: clubMembers?.length || 0 })}
          </Text>
          {joinRequests.length > 0 && (
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>
                {t('club.clubMembers.requestCount', { count: joinRequests.length })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        /* eslint-disable @typescript-eslint/no-explicit-any */
        renderTabBar={(props: any) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: theme.colors.primary }}
            style={styles.tabBar}
            labelStyle={styles.tabLabel}
            activeColor={theme.colors.primary}
            inactiveColor='#666'
          />
        )}
        /* eslint-enable @typescript-eslint/no-explicit-any */
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  memberCount: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  memberCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleChip: {
    height: 24,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinDate: {
    fontSize: 12,
    color: '#666',
  },
  menuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestBadge: {
    backgroundColor: '#ff9800',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  requestBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  requestMessage: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  requestActions: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
  },
  approveButton: {
    backgroundColor: '#4caf50',
    minWidth: 60,
  },
  declineButton: {
    borderColor: '#f44336',
    minWidth: 60,
  },
  actionButtonLabel: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
