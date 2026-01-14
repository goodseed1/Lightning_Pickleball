# MyClubs Review Bundle

Generated: Wed Aug 20 22:46:38 EDT 2025

This bundle contains MyClubs screen, related components, contexts, and i18n for debugging the RN <Text> error.

---

## src/screens/MyClubsScreen.tsx

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import clubService from '../services/clubService';
import AdminNotificationCard, {
  AdminNotification,
} from '../components/admin/AdminNotificationCard';

interface UserClub {
  id: string;
  clubId: string;
  clubName: string;
  role: 'admin' | 'manager' | 'member';
  status: 'pending' | 'active' | 'inactive';
  joinedAt: Date;
  memberCount?: number;
  clubDescription?: string;
  clubLocation?: string;
  clubLogo?: string;
  clubMaxMembers?: number;
  clubTags?: string[];
  clubContactInfo?: any;
  clubIsPublic?: boolean;
  clubEstablishedDate?: Date;
  pendingApplications?: number; // 가입 신청 개수
}

const MyClubsScreen = () => {
  const { currentLanguage } = useLanguage();
  const { currentUser: user, loading: authLoading } = useAuth();
  const navigation = useNavigation();

  const [userClubs, setUserClubs] = useState<UserClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    console.log('MyClubsScreen useEffect - user:', user);
    console.log('MyClubsScreen useEffect - authLoading:', authLoading);

    if (authLoading) {
      // 인증 로딩 중이면 대기
      console.log('Auth still loading, waiting...');
      return;
    }

    if (user?.uid) {
      console.log('User found with uid:', user.uid);
      loadUserClubs();
    } else if (user === null) {
      // 사용자가 로그인하지 않은 경우
      console.log('No user logged in, showing empty state');
      setUserClubs([]);
      setLoading(false);
    }
  }, [user, authLoading]);

  // 화면이 포커스될 때마다 클럽 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 MyClubsScreen focused - refreshing club list');
      if (user?.uid && !authLoading) {
        loadUserClubs(true); // 포커스 시 강제 새로고침으로 최신 데이터 보장
      }
    }, [user?.uid, authLoading])
  );

  const loadUserClubs = async (forceRefresh = false) => {
    if (!user?.uid) {
      console.log('No user UID found, showing empty state');
      setUserClubs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading clubs for user:', user.uid, forceRefresh ? '(force refresh)' : '');

      // 강제 새로고침 시 캐시 무시
      if (forceRefresh) {
        clubService.clearMembershipCache(user.uid);
      }

      // clubService에서 사용자의 클럽 멤버십 정보 가져오기
      console.log('🔍 Attempting to load clubs for user:', user.uid);
      console.log('🔍 User object:', user);

      const clubs = await clubService.getUserClubMemberships(user.uid);
      console.log('📋 Loaded clubs from service:', clubs);
      console.log('📋 Number of clubs found:', clubs.length);

      // 관리자 권한이 있는 클럽들의 가입 신청 개수 조회
      const clubsWithApplications = await Promise.all(
        clubs.map(async club => {
          // 관리자나 매니저 권한이 있는 경우만 가입 신청 개수 조회
          if (club.role === 'admin' || club.role === 'manager') {
            try {
              const applications = await clubService.getClubJoinRequests(club.clubId, 'pending');
              return {
                ...club,
                pendingApplications: applications.length,
              };
            } catch (error) {
              console.warn(`Failed to load applications for club ${club.clubId}:`, error);
              return {
                ...club,
                pendingApplications: 0,
              };
            }
          }
          return club;
        })
      );

      // 데이터가 없으면 mock 데이터 사용
      if (clubsWithApplications.length === 0) {
        console.warn('⚠️ No real clubs found for user, using mock data');
        console.log('🔍 This could be due to:');
        console.log('  - User has not created or joined any clubs yet');
        console.log('  - Firebase connection issues');
        console.log('  - Authentication problems');
        console.log('  - Database permission issues');

        // 실제 클럽 생성 여부 확인을 위한 추가 체크
        try {
          console.log('🔍 Attempting to check tennis_clubs collection for user-created clubs...');
          const userCreatedClubs = await clubService.checkUserCreatedClubs(user.uid);
          console.log('🔍 User created clubs check result:', userCreatedClubs);
        } catch (checkError) {
          console.error('❌ Failed to check user created clubs:', checkError);
        }
        // Use language-appropriate mock data
        const mockClubs =
          currentLanguage === 'ko'
            ? [
                {
                  id: 'mock-membership-1',
                  clubId: 'mock-club-1',
                  clubName: '[샘플] 애틀랜타 둘루스 테니스 클럽',
                  clubDescription:
                    '주중 저녁·주말 오전 정기 랠리/매치가 있는 한인 테니스 동호회입니다.',
                  clubLocation: '조지아주 둘루스 (Duluth, GA)',
                  role: 'admin',
                  status: 'active',
                  joinedAt: new Date('2024-01-15'),
                  memberCount: 120,
                  clubTags: ['테니스', '동호회'],
                  clubContactInfo: null,
                  clubIsPublic: true,
                  clubMaxMembers: 200,
                  clubEstablishedDate: new Date('2023-01-01'),
                  pendingApplications: 3, // Mock 가입 신청 3건
                },
                {
                  id: 'mock-membership-2',
                  clubId: 'mock-club-2',
                  clubName: '[샘플] 스와니 한인 테니스 클럽',
                  clubDescription: '스와니·슈거힐·버퍼드 인근 한인 테니스 모임입니다!',
                  clubLocation: '조지아주 스와니 (Suwanee, GA)',
                  role: 'member',
                  status: 'active',
                  joinedAt: new Date('2024-02-01'),
                  memberCount: 85,
                  clubTags: ['테니스', '한인'],
                  clubContactInfo: null,
                  clubIsPublic: true,
                  clubMaxMembers: 150,
                  clubEstablishedDate: new Date('2023-06-01'),
                  pendingApplications: 0, // Member 역할은 가입 신청 조회 불가
                },
              ]
            : [
                {
                  id: 'mock-membership-1',
                  clubId: 'mock-club-1',
                  clubName: '[Sample] Atlanta Duluth Tennis Club',
                  clubDescription:
                    'Weekly evening rallies and weekend morning matches for Korean-American tennis community.',
                  clubLocation: 'Duluth, GA',
                  role: 'admin',
                  status: 'active',
                  joinedAt: new Date('2024-01-15'),
                  memberCount: 120,
                  clubTags: ['Tennis', 'Community'],
                  clubContactInfo: null,
                  clubIsPublic: true,
                  clubMaxMembers: 200,
                  clubEstablishedDate: new Date('2023-01-01'),
                  pendingApplications: 3, // Mock pending applications
                },
                {
                  id: 'mock-membership-2',
                  clubId: 'mock-club-2',
                  clubName: '[Sample] Suwanee Korean Tennis Club',
                  clubDescription:
                    'Tennis group for Suwanee, Sugar Hill, and Buford area Korean community!',
                  clubLocation: 'Suwanee, GA',
                  role: 'member',
                  status: 'active',
                  joinedAt: new Date('2024-02-01'),
                  memberCount: 85,
                  clubTags: ['Tennis', 'Korean'],
                  clubContactInfo: null,
                  clubIsPublic: true,
                  clubMaxMembers: 150,
                  clubEstablishedDate: new Date('2023-06-01'),
                  pendingApplications: 0, // Member role cannot see applications
                },
              ];
        setUserClubs(mockClubs);
        setAdminNotifications(generateAdminNotifications(mockClubs));
      } else {
        setUserClubs(clubsWithApplications);
        setAdminNotifications(generateAdminNotifications(clubsWithApplications));
      }
    } catch (error) {
      console.error('❌ Error loading user clubs:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      // Firebase 연결 문제나 권한 문제 시 mock 데이터로 fallback
      console.warn('⚠️ Using mock data as fallback due to error');
      console.log('🔍 Error type analysis:');
      if (error.message?.includes('permission') || error.code?.includes('permission')) {
        console.log('  - Firebase permission denied');
      } else if (error.message?.includes('network') || error.code?.includes('network')) {
        console.log('  - Network connection issue');
      } else if (error.message?.includes('auth') || error.code?.includes('auth')) {
        console.log('  - Authentication issue');
      } else {
        console.log('  - Unknown error type');
      }
      // Use language-appropriate mock data for error fallback
      const fallbackMockClubs =
        currentLanguage === 'ko'
          ? [
              {
                id: 'mock-membership-1',
                clubId: 'mock-club-1',
                clubName: '[샘플] 애틀랜타 둘루스 테니스 클럽',
                clubDescription:
                  '주중 저녁·주말 오전 정기 랠리/매치가 있는 한인 테니스 동호회입니다.',
                clubLocation: '조지아주 둘루스 (Duluth, GA)',
                role: 'admin',
                status: 'active',
                joinedAt: new Date('2024-01-15'),
                memberCount: 120,
                clubTags: ['한인', '테니스'],
                clubContactInfo: null,
                clubIsPublic: true,
                clubMaxMembers: 200,
                clubEstablishedDate: new Date('2023-06-01'),
              },
            ]
          : [
              {
                id: 'mock-membership-1',
                clubId: 'mock-club-1',
                clubName: '[Sample] Atlanta Duluth Tennis Club',
                clubDescription:
                  'Weekly evening rallies and weekend morning matches for Korean-American tennis community.',
                clubLocation: 'Duluth, GA',
                role: 'admin',
                status: 'active',
                joinedAt: new Date('2024-01-15'),
                memberCount: 120,
                clubTags: ['Korean', 'Tennis'],
                clubContactInfo: null,
                clubIsPublic: true,
                clubMaxMembers: 200,
                clubEstablishedDate: new Date('2023-06-01'),
                pendingApplications: 3, // Fallback mock applications
              },
            ];
      setUserClubs(fallbackMockClubs);
      setAdminNotifications(generateAdminNotifications(fallbackMockClubs));
    } finally {
      setLoading(false);
    }
  };

  // 관리자 알림 생성 함수
  const generateAdminNotifications = (clubs: UserClub[]): AdminNotification[] => {
    const notifications: AdminNotification[] = [];

    clubs.forEach(club => {
      if (
        (club.role === 'admin' || club.role === 'manager') &&
        club.pendingApplications &&
        club.pendingApplications > 0
      ) {
        notifications.push({
          id: `club_applications_${club.clubId}`,
          type: 'club_applications',
          clubId: club.clubId,
          clubName: club.clubName,
          count: club.pendingApplications,
          priority:
            club.pendingApplications > 5 ? 'high' : club.pendingApplications > 2 ? 'medium' : 'low',
          title: '새로운 가입 신청',
          description: `${club.pendingApplications}건의 클럽 가입 신청이 대기 중입니다.`,
          actionRequired: true,
          createdAt: new Date(),
          data: {
            targetTab: 1, // 멤버 탭으로 이동
          },
        });
      }
    });

    return notifications;
  };

  // 알림 카드 클릭 핸들러
  const handleNotificationPress = (notification: AdminNotification) => {
    navigation.navigate('ClubDetail', {
      clubId: notification.clubId,
      userRole: 'admin',
      initialTab: notification.data?.targetTab || 1,
    });
  };

  // 알림 해제 핸들러
  const handleNotificationDismiss = (notificationId: string) => {
    setAdminNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserClubs(true); // 강제 새로고침으로 캐시 무시
    setRefreshing(false);
  };

  const handleClubPress = (club: UserClub) => {
    // 가입 신청이 있는 관리자/매니저의 경우 멤버 탭으로 이동
    if (
      (club.role === 'admin' || club.role === 'manager') &&
      club.pendingApplications &&
      club.pendingApplications > 0
    ) {
      navigation.navigate('ClubDetail', {
        clubId: club.clubId,
        userRole: club.role,
        initialTab: 1, // 멤버 탭 (0: 홈, 1: 멤버, 2: 이벤트, 3: 리그, 4: 정책, 5: 게시판, 6: 채팅)
      });
    } else {
      navigation.navigate('ClubDetail', {
        clubId: club.clubId,
        userRole: club.role,
      });
    }
  };

  const handleDiscoverClubs = () => {
    navigation.navigate('MainTabs', { screen: 'Discover' });
  };

  const handleCreateClub = () => {
    navigation.navigate('CreateClub');
  };

  const handleFindClubs = () => {
    navigation.navigate('FindClub');
  };

  const getRoleText = (role: string) => {
    if (currentLanguage === 'ko') {
      switch (role) {
        case 'admin':
          return '관리자';
        case 'manager':
          return '매니저';
        case 'member':
          return '멤버';
        default:
          return '멤버';
      }
    } else {
      switch (role) {
        case 'admin':
          return 'Admin';
        case 'manager':
          return 'Manager';
        case 'member':
          return 'Member';
        default:
          return 'Member';
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#f44336';
      case 'manager':
        return '#ff9800';
      default:
        return '#4caf50';
    }
  };

  const renderClubItem = ({ item: club }: { item: UserClub }) => (
    <TouchableOpacity
      style={styles.clubCard}
      onPress={() => handleClubPress(club)}
      activeOpacity={0.7}
    >
      <View style={styles.clubCardContent}>
        {/* Club Logo/Image */}
        <View style={styles.clubLogoContainer}>
          {club.clubLogo ? (
            <Image source={{ uri: club.clubLogo }} style={styles.clubLogo} />
          ) : (
            <View style={styles.clubLogoPlaceholder}>
              <Ionicons name='basketball' size={28} color='#fff' />
            </View>
          )}
        </View>

        {/* Club Info */}
        <View style={styles.clubInfoContainer}>
          <View style={styles.clubHeader}>
            <Text style={styles.clubName} numberOfLines={1}>
              {club.clubName}
            </Text>
            <View style={styles.clubBadges}>
              <View style={[styles.roleChip, { backgroundColor: getRoleColor(club.role) }]}>
                <Text style={styles.roleText}>{getRoleText(club.role)}</Text>
              </View>
              {/* 가입 신청 알림 뱃지 */}
              {(club.role === 'admin' || club.role === 'manager') &&
                club.pendingApplications &&
                club.pendingApplications > 0 && (
                  <View style={styles.applicationBadge}>
                    <Ionicons name='person-add' size={12} color='#fff' />
                    <Text style={styles.applicationBadgeText}>{club.pendingApplications}</Text>
                  </View>
                )}
            </View>
          </View>

          {club.clubDescription && (
            <Text style={styles.clubDescription} numberOfLines={2}>
              {club.clubDescription}
            </Text>
          )}

          <View style={styles.clubMetaContainer}>
            <View style={styles.clubMetaRow}>
              <Ionicons name='location-outline' size={14} color='#666' />
              <Text style={styles.clubMetaText}>{club.clubLocation || 'Unknown'}</Text>
            </View>
            <View style={styles.clubMetaRow}>
              <Ionicons name='people-outline' size={14} color='#666' />
              <Text style={styles.clubMetaText}>
                {`${club.memberCount || 0}${club.clubMaxMembers ? `/${club.clubMaxMembers}` : ''}${currentLanguage === 'ko' ? ' 명' : ''}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name='chevron-forward' size={20} color='#999' style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🏟️ {currentLanguage === 'ko' ? '내 클럽' : 'My Clubs'}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>
            {authLoading
              ? currentLanguage === 'ko'
                ? '로그인 정보 확인 중...'
                : 'Checking login...'
              : currentLanguage === 'ko'
                ? '클럽 정보를 불러오는 중...'
                : 'Loading clubs...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏟️ {currentLanguage === 'ko' ? '내 클럽' : 'My Clubs'}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleFindClubs}>
            <Ionicons name='search' size={24} color='#1976d2' />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleCreateClub}>
            <Ionicons name='add' size={24} color='#1976d2' />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {userClubs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎾</Text>
            <Text style={styles.emptyTitle}>
              {currentLanguage === 'ko' ? '가입한 클럽이 없습니다' : 'No clubs joined yet'}
            </Text>
            <Text style={styles.emptyDescription}>
              {currentLanguage === 'ko'
                ? '발견 탭에서 클럽을 찾아 가입해보거나\n새로운 클럽을 만들어보세요'
                : 'Find clubs to join in the Discover tab\nor create your own club'}
            </Text>

            <View style={styles.emptyActions}>
              <TouchableOpacity style={styles.discoverButton} onPress={handleDiscoverClubs}>
                <Text style={styles.discoverButtonText}>
                  {currentLanguage === 'ko' ? '클럽 찾아보기' : 'Find Clubs'}
                </Text>
                <Ionicons name='search' size={20} color='#1976d2' />
              </TouchableOpacity>

              <TouchableOpacity style={styles.createClubButton} onPress={handleCreateClub}>
                <Text style={styles.createClubButtonText}>
                  {currentLanguage === 'ko' ? '클럽 만들기' : 'Create Club'}
                </Text>
                <Ionicons name='add' size={20} color='#fff' />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* 관리자 알림 카드들 */}
            {adminNotifications.length > 0 && (
              <View style={styles.notificationsSection}>
                {adminNotifications.map(notification => (
                  <AdminNotificationCard
                    key={notification.id}
                    notification={notification}
                    onPress={() => handleNotificationPress(notification)}
                    onDismiss={() => handleNotificationDismiss(notification.id)}
                  />
                ))}
              </View>
            )}

            <FlatList
              data={userClubs}
              renderItem={renderClubItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.clubsList}
              scrollEnabled={false}
            />

            {/* Create New Club 버튼 */}
            <TouchableOpacity style={styles.createNewClubCard} onPress={handleCreateClub}>
              <View style={styles.createNewClubContent}>
                <View style={styles.createIconContainer}>
                  <Ionicons name='add-circle' size={32} color='#1976d2' />
                </View>
                <View style={styles.createInfoContainer}>
                  <Text style={styles.createTitle}>
                    {currentLanguage === 'ko' ? '새 클럽 만들기' : 'Create New Club'}
                  </Text>
                  <Text style={styles.createDescription}>
                    {currentLanguage === 'ko'
                      ? '나만의 테니스 클럽을 시작해보세요'
                      : 'Start your own tennis club'}
                  </Text>
                </View>
                <Ionicons name='chevron-forward' size={20} color='#1976d2' />
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
    marginBottom: 30,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  discoverButtonText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '600',
    marginRight: 8,
  },
  createClubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createClubButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  clubsList: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  clubCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  clubCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  clubLogoContainer: {
    marginRight: 12,
  },
  clubLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  clubLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubInfoContainer: {
    flex: 1,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  clubDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  clubMetaContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  clubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 8,
  },
  createNewClubCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1976d2',
    borderStyle: 'dashed',
  },
  createNewClubContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  createIconContainer: {
    marginRight: 12,
  },
  createInfoContainer: {
    flex: 1,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  createDescription: {
    fontSize: 14,
    color: '#666',
  },
  // 클럽 카드 뱃지 관련 스타일
  clubBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applicationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  applicationBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  // 알림 섹션 스타일
  notificationsSection: {
    marginBottom: 16,
  },
});

// Export the full functional component
export default MyClubsScreen;
```

---

## src/navigation/AppNavigator.tsx

```tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import FeedScreen from '../screens/FeedScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import CreateScreen from '../screens/CreateScreen';
import MyClubsScreen from '../screens/MyClubsScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ClubDetailScreen from '../screens/clubs/ClubDetailScreen';
import EventChatScreen from '../screens/EventChatScreen';
import EditEventScreen from '../screens/EditEventScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import RateSportsmanshipScreen from '../screens/RateSportsmanshipScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import FloatingChatButton from '../components/FloatingChatButton';
import CreationNavigator from './CreationNavigator';
import AuthNavigator from './AuthNavigator';
import OnboardingContainer from '../screens/auth/OnboardingContainer';
import { useLanguage } from '../contexts/LanguageContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CreateClubScreen from '../screens/clubs/CreateClubScreen';
import LocationSearchScreen from '../screens/LocationSearchScreen';
import ClubAdminScreen from '../screens/clubs/ClubAdminScreen';
import DuesManagementScreen from '../screens/clubs/DuesManagementScreen';
import EventParticipationScreen from '../screens/clubs/EventParticipationScreen';
import ClubLeagueManagementScreen from '../screens/clubs/ClubLeagueManagementScreen';
import ClubMemberManagementScreen from '../screens/clubs/ClubMemberManagementScreen';
import ClubChatScreen from '../screens/clubs/ClubChatScreen';
import PostDetailScreen from '../screens/clubs/PostDetailScreen';
import CreatePostScreen from '../screens/clubs/CreatePostScreen';
import PolicyEditScreen from '../screens/clubs/PolicyEditScreen';

// Type definition for all navigation screens
export type RootStackParamList = {
  MainTabs: undefined | { screen: keyof MainTabParamList };
  Auth: undefined;
  Onboarding: undefined;
  CreateFlow: undefined;
  Feed: undefined;
  Discover: undefined;
  Create: undefined;
  MyClubs: undefined;
  MyProfile: undefined;
  ClubDetail: { clubId: string; fallbackClub?: any };
  CreateClub: { clubId?: string; mode?: 'create' | 'edit' | string; selectedLocation?: any };
  LocationSearch: { returnScreen?: string; clubId?: string; [key: string]: any };
  ClubAdmin: { clubId: string; clubName: string };
  ClubLeagueManagement: { clubId: string };
  ClubTournamentManagement: { clubId: string };
  ClubScheduleSettings: { clubId: string };
  ClubMemberManagement: { clubId: string; tab?: string };
  ClubEventManagement: { clubId: string };
  EventParticipation: { eventId: string; clubId: string };
  ClubChat: { clubId: string };
  ClubDuesManagement: { clubId: string; clubName: string };
  PostDetail: { postId: string; clubId: string };
  CreatePost: { clubId: string };
  PolicyEdit: { clubId: string; clubName: string };
  EditProfileScreen: undefined;
  EventChat: { eventId: string; eventTitle?: string };
  EditEvent: { eventId: string };
  EventDetail: { eventId: string };
  UserProfile: { userId: string; nickname?: string };
  RateSportsmanship: { eventId: string; eventType?: string };
  Chatbot: { pageContext?: string } | undefined;
};

const ClubTournamentManagementScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
      🥇 Tournament Management
    </Text>
    <Text style={{ fontSize: 16, color: '#666' }}>Organize and manage tournaments</Text>
  </View>
);

const ClubScheduleSettingsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>📅 Schedule Settings</Text>
    <Text style={{ fontSize: 16, color: '#666' }}>Configure regular meeting schedules</Text>
  </View>
);

const ClubEventManagementScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>⚡ Event Management</Text>
    <Text style={{ fontSize: 16, color: '#666' }}>Create and manage club events</Text>
  </View>
);

// Actual DuesManagementScreen is imported above

// Simple theme and auth mock
const theme = {
  colors: {
    primary: '#1976d2',
  },
};

// Import the real useAuth hook
import { useAuth } from '../contexts/AuthContext';

// OnboardingScreen wrapper to provide navigation context
const OnboardingScreen = () => {
  const { markOnboardingComplete } = useAuth();
  const navigation = useNavigation();

  const handleOnboardingComplete = (userData: any) => {
    console.log('🚀 AppNavigator: handleOnboardingComplete called');
    console.log('📋 AppNavigator: Received user data:', userData);

    // Extract profile data from userData to pass to markOnboardingComplete
    const profileData = userData.profile || userData;
    const mappedProfileData = {
      displayName: profileData.nickname || userData.nickname,
      skillLevel: profileData.skillLevel || userData.skillLevel,
      playingStyle: Array.isArray(profileData.preferredPlayingStyle)
        ? profileData.preferredPlayingStyle.join(',')
        : profileData.playingStyle || 'all-court',
      maxTravelDistance: profileData.maxTravelDistance || userData.maxTravelDistance || 15,
      activityRegions: profileData.activityRegions || userData.activityRegions || ['Atlanta Metro'],
      languages: profileData.communicationLanguages || userData.languages || ['English'],
      goals: profileData.goals || userData.goals || null,
      location: profileData.location ||
        userData.location || {
          lat: 33.749,
          lng: -84.388,
          address: 'Atlanta, GA',
        },
    };

    console.log('🏁 AppNavigator: Calling markOnboardingComplete() with profile data...');
    console.log('📊 Mapped profile data:', mappedProfileData);
    markOnboardingComplete(mappedProfileData);
    console.log('✅ AppNavigator: markOnboardingComplete() called successfully');
  };

  return <OnboardingContainer navigation={navigation} onComplete={handleOnboardingComplete} />;
};

// Custom Create Tab Button Component
const CreateTabButton = (props: any) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Extract children and other props
  const { children, ...restProps } = props;

  return (
    <TouchableOpacity
      {...restProps}
      onPress={() => navigation.navigate('CreateFlow')}
      activeOpacity={0.8}
    >
      {React.isValidElement(children) ? children : <Text>{children}</Text>}
    </TouchableOpacity>
  );
};

// Remove the placeholder LoginScreen since we have AuthNavigator

export type MainTabParamList = {
  Feed: undefined;
  Discover: undefined;
  Create: undefined;
  MyClubs: undefined;
  MyProfile:
    | {
        initialTab?: 'information' | 'stats' | 'activity' | 'friends' | 'settings';
        initialActivityTab?: 'applied' | 'hosted' | 'past';
      }
    | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 메인 탭 네비게이터
function MainTabNavigator() {
  const { t, currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [currentRoute, setCurrentRoute] = React.useState('Feed');

  // Ensure t function returns valid strings
  const safeT = (key: string) => {
    try {
      const result = t(key);
      if (typeof result === 'string' && result.trim() !== '') {
        return result;
      }
      return key; // Fallback to key if t returns undefined/null/empty
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return key;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name) {
              case 'Feed':
                iconName = focused ? 'newspaper' : 'newspaper-outline';
                break;
              case 'Discover':
                iconName = focused ? 'search' : 'search-outline';
                break;
              case 'Create':
                iconName = 'add-circle';
                break;
              case 'MyClubs':
                iconName = focused ? 'people' : 'people-outline';
                break;
              case 'MyProfile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'circle-outline';
            }

            // Create 탭은 더 큰 아이콘
            const iconSize = route.name === 'Create' ? size + 16 : size;
            const iconColor = route.name === 'Create' ? '#1976d2' : color;

            return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            paddingBottom: Platform.OS === 'android' ? Math.max(35, insets.bottom + 10) : 25, // 안드로이드에서 시스템 네비게이션 바 고려
            paddingTop: 8,
            height: Platform.OS === 'android' ? Math.max(95, 85 + insets.bottom) : 85, // 동적 높이 조정
          },
          headerShown: false,
        })}
        screenListeners={({ navigation, route }) => ({
          state: e => {
            // Update current route for FloatingChatButton
            const state = navigation.getState();
            const currentRouteName = state.routes[state.index].name;
            setCurrentRoute(currentRouteName);
          },
        })}
      >
        <Tab.Screen
          name='Feed'
          component={FeedScreen}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color, fontSize: 12 }}>{safeT('navigation.feed')}</Text>
            ),
          }}
        />
        <Tab.Screen
          name='Discover'
          component={DiscoverScreen}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color, fontSize: 12 }}>{safeT('navigation.discover')}</Text>
            ),
          }}
        />
        <Tab.Screen
          name='Create'
          component={CreateScreen}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color, fontSize: 12 }}>{safeT('navigation.create')}</Text>
            ),
            tabBarButton: props => <CreateTabButton {...props} />,
          }}
        />
        <Tab.Screen
          name='MyClubs'
          component={MyClubsScreen}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color, fontSize: 12 }}>{safeT('navigation.myClubs')}</Text>
            ),
            unmountOnBlur: true, // Force unmount when tab is not active
          }}
        />
        <Tab.Screen
          name='MyProfile'
          component={MyProfileScreen}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color, fontSize: 12 }}>{safeT('navigation.myProfile')}</Text>
            ),
          }}
        />
      </Tab.Navigator>

      {/* Global Floating Chat Button */}
      <FloatingChatButton currentRoute={currentRoute} />
    </View>
  );
}

// 메인 앱 네비게이터
export default function AppNavigator() {
  const {
    currentUser: user,
    loading: isLoading,
    isProfileLoaded,
    isOnboardingComplete,
  } = useAuth();

  // Debug logging for navigation state
  console.log('🧭 AppNavigator: Navigation state check');
  console.log('   - isLoading:', isLoading);
  console.log('   - isProfileLoaded:', isProfileLoaded);
  console.log('   - currentUser:', user ? `${user.email} (${user.uid})` : 'null');
  console.log('   - user.displayName:', user?.displayName);
  console.log('   - isOnboardingComplete:', isOnboardingComplete);
  console.log(
    '   - Navigation decision:',
    !user
      ? 'Auth'
      : !isProfileLoaded
        ? 'ProfileLoading'
        : !isOnboardingComplete
          ? 'Onboarding'
          : 'MainTabs'
  );

  // 🔄 로딩 상태들을 처리
  if (isLoading) {
    console.log('🧭 AppNavigator: Showing auth loading state');
    return null; // 또는 로딩 스크린
  }

  // ✅ 핵심: 사용자가 있지만 프로필이 아직 로딩 중이면 로딩 스피너 표시
  if (user && !isProfileLoaded) {
    console.log(
      '🧭 AppNavigator: User exists but profile still loading - showing profile loading spinner'
    );
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <ActivityIndicator size='large' color='#1976d2' />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>프로필을 불러오는 중...</Text>
        <Text style={{ marginTop: 8, fontSize: 14, color: '#999' }}>Loading profile data...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!user ? (
        // 비로그인 사용자 - 인증 플로우
        <Stack.Screen name='Auth' component={AuthNavigator} options={{ headerShown: false }} />
      ) : !isOnboardingComplete ? (
        // 로그인했지만 온보딩 미완료 - 온보딩 플로우
        <Stack.Screen
          name='Onboarding'
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        // 로그인 및 온보딩 완료 - 메인 앱
        <>
          <Stack.Screen
            name='MainTabs'
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name='CreateFlow'
            component={CreationNavigator}
            options={{
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name='ClubDetail'
            component={ClubDetailScreen}
            options={{
              title: '클럽 정보',
              headerShown: false, // Let ClubDetailScreen handle its own header
            }}
          />
          <Stack.Screen
            name='ClubAdmin'
            component={ClubAdminScreen}
            options={{
              title: '관리자 대시보드',
              headerShown: false,
            }}
          />
          <Stack.Screen name='CreateClub' component={CreateClubScreen} />
          <Stack.Screen
            name='LocationSearch'
            component={LocationSearchScreen}
            options={{
              title: '위치 검색',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='ClubLeagueManagement'
            component={ClubLeagueManagementScreen}
            options={{
              title: '리그 관리',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='ClubTournamentManagement'
            component={ClubTournamentManagementScreen}
            options={{
              title: '토너먼트 관리',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='ClubScheduleSettings'
            component={ClubScheduleSettingsScreen}
            options={{
              title: '정기 모임 설정',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='ClubMemberManagement'
            component={ClubMemberManagementScreen}
            options={{
              title: '멤버 관리',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='ClubEventManagement'
            component={ClubEventManagementScreen}
            options={{
              title: '이벤트 관리',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='ClubChat'
            component={ClubChatScreen}
            options={{
              title: '클럽 채팅',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='ClubDuesManagement'
            component={DuesManagementScreen}
            options={{
              title: '회비 관리',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='EventParticipation'
            component={EventParticipationScreen}
            options={{
              title: '이벤트 참가',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='PostDetail'
            component={PostDetailScreen}
            options={{
              title: '게시글',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='CreatePost'
            component={CreatePostScreen}
            options={{
              title: '게시글 작성',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='PolicyEdit'
            component={PolicyEditScreen}
            options={{
              title: '정책 편집',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='EditProfileScreen'
            component={EditProfileScreen}
            options={{
              title: '프로필 수정',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='EventChat'
            component={EventChatScreen}
            options={{
              title: '이벤트 채팅',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='EditEvent'
            component={EditEventScreen}
            options={{
              title: '이벤트 수정',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='EventDetail'
            component={EventDetailScreen}
            options={{
              title: '이벤트 상세',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='UserProfile'
            component={UserProfileScreen}
            options={{
              title: '사용자 프로필',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='RateSportsmanship'
            component={RateSportsmanshipScreen}
            options={{
              title: '스포츠맨십 평가',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='Chatbot'
            component={ChatbotScreen}
            options={{
              title: 'AI 도움말',
              headerShown: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
```

---

## src/i18n/index.ts

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ntrpEn from './ntrp.en.json';
import ntrpKo from './ntrp.ko.json';

// Robust localization module detection
let ExpoLocalization: any = null;
let RNLocalize: any = null;

try {
  // Try Expo Localization first (for Expo projects)
  ExpoLocalization = require('expo-localization');
} catch (e) {
  try {
    // Fallback to react-native-localize (for bare React Native)
    RNLocalize = require('react-native-localize');
  } catch (e2) {
    console.warn('No localization module found, using fallback');
  }
}

export const resources = {
  en: {
    translation: {
      common: {
        submit: 'Submit',
        required: 'Required',
      },
      createClub: {
        // 큰 페이지 타이틀은 화면에서 제거되지만, 앱바 타이틀 등에서 사용할 수 있음
        title: 'Create Club',
        basic_info: 'Basic Info',
        court_address: 'Court Address',
        regular_meet: 'Recurring Meetups',
        visibility: 'Visibility',
        visibility_public: 'Public',
        visibility_private: 'Private',
        fees: 'Fees',
        facilities: 'Facilities',
        rules: 'Club Rules',
        loading: 'Loading club information...',
        address_search_title: 'Search Tennis Court Address',
        meeting_modal_title: 'Add Regular Meeting Time',
        day_selection: 'Day Selection',
        meeting_time: 'Meeting Time',
        start_time: 'Start Time',
        end_time: 'End Time',
        add_meeting: 'Add Meeting Time',
        cancel: 'Cancel',
        add: 'Add',
        creating: 'Creating...',
        errors: {
          address_required: 'Address is required.',
        },
        facility: {
          lights: 'Lights',
          indoor: 'Indoor',
          parking: 'Parking',
          ballmachine: 'Ball Machine',
          locker: 'Locker Room',
          proshop: 'Pro Shop',
        },
        fields: {
          name: 'Club Name',
          intro: 'Introduction',
          address_placeholder: 'Search court address (EN/US/Atlanta bias)',
          address_label: 'Tennis Court Address',
          address_search_placeholder: 'Search for tennis court address',
          name_placeholder: 'e.g., Duluth Korean Tennis Club',
          intro_placeholder: "Describe your club's goals, atmosphere, and unique features",
          fee_placeholder: 'e.g., 50',
          rules_placeholder:
            'e.g.:\n• Maintain 70%+ attendance for regular meetings\n• Show mutual respect and courtesy\n• Clean up after using facilities',
          meet_day: 'Day',
          meet_time: 'Time',
          meet_note: 'Note',
          fee: 'Membership Fee',
          rules: 'Rules / Etiquette',
          logo: 'Logo',
        },
        cta: 'Create Club',
        hints: {
          public_club: 'Public clubs allow other users to search and apply for membership.',
        },
      },
      ntrp: (ntrpEn as any).ntrp,
    },
  },
  ko: {
    translation: {
      common: {
        submit: '제출',
        required: '필수',
      },
      createClub: {
        title: '클럽 만들기',
        basic_info: '기본 정보',
        court_address: '코트 주소',
        regular_meet: '정기 모임',
        visibility: '공개 설정',
        visibility_public: '공개',
        visibility_private: '비공개',
        fees: '비용 정보',
        facilities: '시설 정보',
        rules: '클럽 규칙',
        loading: '클럽 정보를 불러오는 중...',
        address_search_title: '테니스 코트 주소 검색',
        meeting_modal_title: '정기 모임 시간 추가',
        day_selection: '요일 선택',
        meeting_time: '모임 시간',
        start_time: '시작 시간',
        end_time: '종료 시간',
        add_meeting: '정기 모임 시간 추가',
        cancel: '취소',
        add: '추가',
        creating: '만드는 중…',
        errors: {
          address_required: '주소가 필요합니다',
        },
        facility: {
          lights: '야간 조명',
          indoor: '실내 코트',
          parking: '주차장',
          ballmachine: '볼머신',
          locker: '락커룸',
          proshop: '프로샵',
        },
        fields: {
          name: '클럽 이름',
          intro: '소개',
          address_placeholder: '코트 주소 검색 (영어/미국/애틀랜타 우선)',
          address_label: '테니스 코트 주소',
          address_search_placeholder: '테니스 코트 주소를 검색하세요',
          name_placeholder: '예: 둘루스 한인 테니스 클럽',
          intro_placeholder:
            '아틀란타 메트로 한인 테니스 클럽의 목표, 분위기, 특징 등을 소개해주세요',
          fee_placeholder: '예: 50',
          rules_placeholder:
            '예:\n• 정기 모임 참석률 70% 이상 유지\n• 상호 예의와 배려\n• 시설 이용 후 정리정돈',
          meet_day: '요일',
          meet_time: '시간',
          meet_note: '비고',
          fee: '회비',
          rules: '규칙 / 에티켓',
          logo: '로고',
        },
        cta: '클럽 만들기',
        hints: {
          public_club: '공개 클럽은 다른 사용자가 검색하고 가입 신청할 수 있습니다.',
        },
      },
      ntrp: (ntrpKo as any).ntrp,
    },
  },
};

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lng: string) => void) => {
    try {
      // Try Expo Localization first
      if (ExpoLocalization && typeof ExpoLocalization.getLocales === 'function') {
        const locales = ExpoLocalization.getLocales();
        if (locales && locales.length > 0 && locales[0].languageCode) {
          const lang = locales[0].languageCode;
          callback(['ko', 'kr'].includes(lang) ? 'ko' : 'en');
          return;
        }
      }

      // Fallback to react-native-localize
      if (RNLocalize && typeof RNLocalize.getLocales === 'function') {
        const locales = RNLocalize.getLocales();
        if (locales && locales.length > 0 && locales[0].languageCode) {
          const lang = locales[0].languageCode;
          callback(['ko', 'kr'].includes(lang) ? 'ko' : 'en');
          return;
        }
      }
    } catch (e) {
      console.warn('Language detection error:', e);
    }

    // Ultimate fallback to English
    callback('en');
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

---

## App.tsx

```tsx
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import './src/i18n';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme as PaperDefaultTheme } from 'react-native-paper';
import { MD3LightTheme as DefaultTheme, MD3DarkTheme as DarkTheme } from 'react-native-paper';
import { configureFonts } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavDefaultTheme } from '@react-navigation/native';

import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { AIChatProvider } from './src/contexts/AIChatContext';
import { LocationProvider } from './src/contexts/LocationContext';
import AppNavigator from './src/navigation/AppNavigator';
import knowledgeBaseService from './src/services/knowledgeBaseService';

// 통합된 라이트 테마 (시스템 모드 무시)
const customPaperTheme = {
  ...PaperDefaultTheme,
  dark: false,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: '#1976d2',
    secondary: '#ff9800',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#1F2937',
    onSurface: '#1F2937',
    onSurfaceVariant: '#6B7280',
    outline: '#D1D5DB',
    surfaceVariant: '#F3F4F6',
    error: '#DC2626',
    warning: '#F59E0B',
    success: '#10B981',
  },
  fonts: configureFonts({
    isV3: true,
    config: {
      bodyLarge: { fontFamily: 'System', fontWeight: '400', fontSize: 16 },
      bodyMedium: { fontFamily: 'System', fontWeight: '400', fontSize: 14 },
      labelLarge: { fontFamily: 'System', fontWeight: '600', fontSize: 14 },
      titleLarge: { fontFamily: 'System', fontWeight: '700', fontSize: 20 },
    },
  }),
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

const customNavTheme = {
  ...NavDefaultTheme,
  dark: false,
  colors: {
    ...NavDefaultTheme.colors,
    primary: '#1976d2',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1F2937',
    border: '#E5E7EB',
  },
};

export default function App() {
  // Initialize knowledge base on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize knowledge base for both languages
        await knowledgeBaseService.initializeBothLanguages();
      } catch (error) {
        console.warn('Failed to initialize knowledge base:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <PaperProvider theme={customPaperTheme}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <LocationProvider>
              <AIChatProvider>
                <NavigationContainer theme={customNavTheme}>
                  <AppNavigator />
                  <StatusBar style='auto' />
                </NavigationContainer>
              </AIChatProvider>
            </LocationProvider>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
```

---

## src/contexts/LanguageContext.tsx

```tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supported languages type
export type SupportedLanguage = 'en' | 'ko';

// Language configuration interface
export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

// Supported languages configuration
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
  },
];

// Translation strings interface
export interface TranslationStrings {
  // Common
  common: {
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    loading: string;
    error: string;
    success: string;
    yes: string;
    no: string;
    ok: string;
    next: string;
    previous: string;
    skip: string;
    finish: string;
    continue: string;
    required: string;
  };

  // Language Selection
  languageSelection: {
    title: string;
    subtitle: string;
    selectLanguage: string;
    continueButton: string;
  };

  // Authentication
  auth: {
    login: string;
    logout: string;
    signup: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    loginWithGoogle: string;
    loginWithApple: string;
    loginWithFacebook: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
  };

  // Profile Setup
  profileSetup: {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    nickname: string;
    gender: string;
    male: string;
    female: string;
    other: string;
    preferNotToSay: string;
    skillLevel: string;
    beginnerLevel: string;
    intermediateLevel: string;
    advancedLevel: string;
    expertLevel: string;
    communicationLanguages: string;
    activityRegions: string;
    zipCode: string;
    maxTravelDistance: string;
    miles: string;
    notificationDistance: string;
    completeProfile: string;
  };

  // Terms and Conditions
  terms: {
    title: string;
    serviceTerms: string;
    privacyPolicy: string;
    locationServices: string;
    liabilityDisclaimer: string;
    marketingCommunications: string;
    agreeToTerms: string;
    readAndAgree: string;
    required: string;
    optional: string;
  };

  // Navigation
  navigation: {
    home: string;
    discover: string;
    matches: string;
    profile: string;
    clubs: string;
    friends: string;
    settings: string;
    feed: string;
    create: string;
    myClubs: string;
    myProfile: string;
  };

  // Home Screen
  home: {
    welcomeTitle: string;
    subtitle: string;
    createNewMatch: string;
    activeMatches: string;
    todayStats: string;
    onlinePlayers: string;
    myMatches: string;
  };

  // Matches Screen
  matches: {
    title: string;
    personalMatches: string;
    clubEvents: string;
    createMatch: string;
    createEvent: string;
    matchType: string;
    personalMatch: string;
    clubEvent: string;
    location: string;
    dateTime: string;
    maxParticipants: string;
    skillLevel: string;
    description: string;
    allLevels: string;
    recurring: string;
    weekly: string;
    biweekly: string;
    monthly: string;
    joinMatch: string;
    participants: string;
    hostedBy: string;
    manage: string;
    // New translations for HomeScreen
    weekendTennisMatch: string;
    eveningSinglesGame: string;
    todayAfternoon3: string;
    tomorrowEvening6: string;
    tomorrowAfternoon2: string;
    intermediate3040: string;
    beginner2030: string;
    createLightningMatch: string;
    createNewMatchQuestion: string;
    newTennisMatch: string;
    nearbyTennisCourt: string;
    me: string;
    matchCreatedSuccessfully: string;
    joinMatchQuestion: string;
    join: string;
    joinComplete: string;
    joinedSuccessfully: string;
    singles: string;
    doubles: string;
    players: string;
    host: string;
  };

  // Profile Screen
  profile: {
    title: string;
    statistics: string;
    matches: string;
    wins: string;
    losses: string;
    winRate: string;
    currentStreak: string;
    eloRating: string;
    badges: string;
    notificationSettings: string;
    personalMatchNotifications: string;
    clubEventNotifications: string;
    notificationRange: string;
    quietHours: string;
    appSettings: string;
    languageSettings: string;
    privacy: string;
    help: string;
    appInfo: string;
  };

  // Discover Screen
  discover: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    players: string;
    courts: string;
    nearbyPlayers: string;
    nearbyCourts: string;
    connect: string;
    book: string;
    online: string;
    offline: string;
    open: string;
    closed: string;
    // New types for DiscoverScreen translations
    intermediate35: string;
    beginner25: string;
    advanced45: string;
    aggressive: string;
    defensive: string;
    allCourt: string;
    lighting: string;
    lockerRoom: string;
    parking: string;
    proShop: string;
    cafe: string;
    shower: string;
    matches: string;
    connectWithPlayer: string;
    connectWithPlayerQuestion: string;
    sendConnectionRequest: string;
    requestComplete: string;
    connectionRequestSent: string;
    bookCourt: string;
    bookCourtQuestion: string;
    bookingComplete: string;
    courtBookingConfirmed: string;
    closedForBooking: string;
  };

  // Social
  social: {
    activityFeed: string;
    friends: string;
    requests: string;
    discover: string;
    recommended: string;
    friendRequests: string;
    noActivityYet: string;
    activityWillAppearHere: string;
    noFriendsYet: string;
    findPlayersToConnect: string;
    noFriendRequests: string;
    requestsWillAppearHere: string;
    removeFriend: string;
    removeFriendConfirm: string;
    friendRemoved: string;
    declineFriendRequest: string;
    declineRequestConfirm: string;
    friendRequestAccepted: string;
    friendsSince: string;
    sendFriendRequest: string;
    sendRequestTo: string;
    friendRequestSent: string;
    defaultFriendMessage: string;
    playerRecommendations: string;
    findCompatiblePlayers: string;
  };

  // Clubs
  clubs: {
    searchClubs: string;
    hasOpenSpots: string;
    skillLevel: string;
    members: string;
    openSpots: string;
    noDescription: string;
    noSearchResults: string;
    noClubsFound: string;
    tryDifferentSearch: string;
    checkBackLater: string;
    clubsFound: string;
  };

  // Create Club
  createClub: {
    title: string;
    basic_info: string;
    court_address: string;
    regular_meet: string;
    visibility: string;
    visibility_public: string;
    visibility_private: string;
    fees: string;
    facilities: string;
    rules: string;
    loading: string;
    address_search_title: string;
    meeting_modal_title: string;
    day_selection: string;
    meeting_time: string;
    start_time: string;
    end_time: string;
    add_meeting: string;
    cancel: string;
    add: string;
    creating: string;
    errors: {
      address_required: string;
    };
    facility: {
      lights: string;
      indoor: string;
      parking: string;
      ballmachine: string;
      locker: string;
      proshop: string;
    };
    fields: {
      name: string;
      intro: string;
      address_placeholder: string;
      address_label: string;
      address_search_placeholder: string;
      name_placeholder: string;
      intro_placeholder: string;
      fee_placeholder: string;
      rules_placeholder: string;
      meet_day: string;
      meet_time: string;
      meet_note: string;
      fee: string;
      rules: string;
      logo: string;
    };
    cta: string;
    hints: {
      public_club: string;
    };
  };

  // Time
  time: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    lessThanHour: string;
  };

  // Notifications
  notifications: {
    newMatch: string;
    matchReminder: string;
    friendRequest: string;
    clubInvitation: string;
    tournamentUpdate: string;
    permissionRequired: string;
    permissionGranted: string;
  };

  // AI Chat
  ai: {
    emptyState: {
      title: string;
      subtitle: string;
    };
    status: {
      online: string;
      typing: string;
      thinking: string;
    };
    input: {
      placeholder: string;
    };
    messageTypes: {
      message: string;
      tip: string;
      analysis: string;
      advice: string;
    };
    quickActions: {
      title: string;
      getTips: string;
      analyzeMatch: string;
      rulesHelp: string;
      techniqueTips: string;
      strategyAdvice: string;
      equipmentHelp: string;
    };
    confidence: {
      high: string;
      medium: string;
      low: string;
    };
  };

  // Errors
  errors: {
    general: string;
    network: string;
    authentication: string;
    validation: string;
    notFound: string;
    failedToRefresh: string;
    failedToLoadFeed: string;
    failedToLoadFriends: string;
    failedToLoadRequests: string;
    failedToRemoveFriend: string;
    failedToAcceptRequest: string;
    failedToDeclineRequest: string;
  };
}

// Language Context interface
interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  isRTL: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string) => string;
  getLanguageConfig: (code: SupportedLanguage) => LanguageConfig | undefined;
  isLanguageSelected: boolean;
  translations: TranslationStrings;
}

// Default translations
const defaultTranslations: Record<SupportedLanguage, TranslationStrings> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      next: 'Next',
      previous: 'Previous',
      skip: 'Skip',
      finish: 'Finish',
      continue: 'Continue',
      required: 'Required',
    },
    languageSelection: {
      title: 'Choose Your Language',
      subtitle: 'Select your preferred language for the app',
      selectLanguage: 'Select Language',
      continueButton: 'Continue',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      loginWithGoogle: 'Login with Google',
      loginWithApple: 'Login with Apple',
      loginWithFacebook: 'Login with Facebook',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
    },
    profileSetup: {
      title: 'Profile Setup',
      step1: 'Step 1: Basic Info',
      step2: 'Step 2: Tennis Details',
      step3: 'Step 3: Location',
      step4: 'Step 4: Preferences',
      nickname: 'Nickname',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      preferNotToSay: 'Prefer not to say',
      skillLevel: 'NTRP Skill Level',
      beginnerLevel: 'Beginner (1.0-2.5)',
      intermediateLevel: 'Intermediate (3.0-3.5)',
      advancedLevel: 'Advanced (4.0-4.5)',
      expertLevel: 'Expert (5.0+)',
      communicationLanguages: 'Languages I Speak',
      activityRegions: 'Activity Areas',
      zipCode: 'Zip Code (우편번호)',
      maxTravelDistance: 'Max Travel Distance',
      miles: 'miles',
      notificationDistance: 'Notification Range',
      completeProfile: 'Complete Profile',
    },
    terms: {
      title: 'Terms & Conditions',
      serviceTerms: 'Service Terms of Use',
      privacyPolicy: 'Privacy Policy',
      locationServices: 'Location Services',
      liabilityDisclaimer: 'Liability Disclaimer',
      marketingCommunications: 'Marketing Communications',
      agreeToTerms: 'I agree to the Terms & Conditions',
      readAndAgree: 'I have read and agree',
      required: 'Required',
      optional: 'Optional',
    },
    navigation: {
      home: 'Home',
      discover: 'Discover',
      matches: 'Matches',
      profile: 'Profile',
      clubs: 'Clubs',
      friends: 'Friends',
      settings: 'Settings',
      feed: 'Feed',
      create: 'Create',
      myClubs: 'My Clubs',
      myProfile: 'My Profile',
    },
    home: {
      welcomeTitle: '⚡️ Lightning Tennis',
      subtitle: 'Find tennis partners instantly!',
      createNewMatch: 'Create New Lightning Match',
      activeMatches: 'Active Matches',
      todayStats: "Today's Stats",
      onlinePlayers: 'Online Players',
      myMatches: 'My Matches',
    },
    matches: {
      title: '🎾 Matches & Events',
      personalMatches: 'Personal Matches',
      clubEvents: 'Club Events',
      createMatch: 'Create New Match',
      createEvent: 'Create New Event',
      matchType: 'Match Type',
      personalMatch: 'Personal Match',
      clubEvent: 'Club Event',
      location: 'Location',
      dateTime: 'Date & Time',
      maxParticipants: 'Max Participants',
      skillLevel: 'Skill Level',
      description: 'Description',
      allLevels: 'All Levels',
      recurring: 'Recurring',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      joinMatch: 'Join Match',
      participants: 'participants',
      hostedBy: 'Hosted by',
      manage: 'Manage',
      // New translations for HomeScreen
      weekendTennisMatch: 'Weekend Tennis Match',
      eveningSinglesGame: 'Evening Singles Game',
      todayAfternoon3: 'Today 3:00 PM',
      tomorrowEvening6: 'Tomorrow 6:00 PM',
      tomorrowAfternoon2: 'Tomorrow 2:00 PM',
      intermediate3040: 'Intermediate (3.0-4.0)',
      beginner2030: 'Beginner (2.0-3.0)',
      createLightningMatch: 'Create Lightning Match',
      createNewMatchQuestion: 'Would you like to create a new tennis match?',
      newTennisMatch: 'New Tennis Match',
      nearbyTennisCourt: 'Nearby Tennis Court',
      me: 'Me',
      matchCreatedSuccessfully: 'Lightning Match has been created successfully!',
      joinMatchQuestion: 'Would you like to join this Lightning Match?',
      join: 'Join',
      joinComplete: 'Join Complete!',
      joinedSuccessfully: 'You have successfully joined the match!',
      singles: 'Singles',
      doubles: 'Doubles',
      players: 'players',
      host: 'Host',
    },
    profile: {
      title: 'Profile',
      statistics: 'Tennis Statistics',
      matches: 'Matches',
      wins: 'Wins',
      losses: 'Losses',
      winRate: 'Win Rate',
      currentStreak: 'Current Streak',
      eloRating: 'ELO Rating',
      badges: 'Badges',
      notificationSettings: 'Notification Settings',
      personalMatchNotifications: 'Personal Match Notifications',
      clubEventNotifications: 'Club Event Notifications',
      notificationRange: 'Notification Range',
      quietHours: 'Quiet Hours',
      appSettings: 'App Settings',
      languageSettings: 'Language Settings',
      privacy: 'Privacy',
      help: 'Help',
      appInfo: 'App Info',
    },
    discover: {
      title: '🎾 Discover',
      subtitle: 'Find Players & Courts',
      searchPlaceholder: 'Search by name, location, skill level...',
      players: 'Players',
      courts: 'Courts',
      nearbyPlayers: 'Nearby Players',
      nearbyCourts: 'Nearby Courts',
      connect: 'Connect',
      book: 'Book',
      online: 'Online',
      offline: 'Offline',
      open: 'Open',
      closed: 'Closed',
      // New translations for DiscoverScreen
      intermediate35: 'Intermediate (3.5)',
      beginner25: 'Beginner (2.5)',
      advanced45: 'Advanced (4.5)',
      aggressive: 'Aggressive Play',
      defensive: 'Defensive Play',
      allCourt: 'All-Court',
      lighting: 'Lighting',
      lockerRoom: 'Locker Room',
      parking: 'Parking',
      proShop: 'Pro Shop',
      cafe: 'Cafe',
      shower: 'Shower',
      matches: 'matches',
      connectWithPlayer: 'Connect with Player',
      connectWithPlayerQuestion: 'Would you like to send a connection request to {name}?',
      sendConnectionRequest: 'Send Request',
      requestComplete: 'Request Complete!',
      connectionRequestSent: 'Connection request sent to {name}.',
      bookCourt: 'Book Court',
      bookCourtQuestion: 'Would you like to book {name}?',
      bookingComplete: 'Booking Complete!',
      courtBookingConfirmed: '{name} has been successfully booked.',
      closedForBooking: 'Closed',
    },
    social: {
      activityFeed: 'Activity Feed',
      friends: 'Friends',
      requests: 'Requests',
      discover: 'Discover',
      recommended: 'Recommended',
      friendRequests: 'Friend Requests',
      noActivityYet: 'No activity yet',
      activityWillAppearHere: 'Friend activities and club updates will appear here',
      noFriendsYet: 'No friends yet',
      findPlayersToConnect: 'Find players to connect and build your tennis network',
      noFriendRequests: 'No friend requests',
      requestsWillAppearHere: 'Friend requests will appear here when you receive them',
      removeFriend: 'Remove Friend',
      removeFriendConfirm: 'Are you sure you want to remove {{name}} from your friends?',
      friendRemoved: 'Friend removed successfully',
      declineFriendRequest: 'Decline Friend Request',
      declineRequestConfirm: 'Are you sure you want to decline the friend request from {{name}}?',
      friendRequestAccepted: 'Friend request from {{name}} accepted!',
      friendsSince: 'Friends since',
      sendFriendRequest: 'Send Friend Request',
      sendRequestTo: 'Send friend request to {{name}}?',
      friendRequestSent: 'Friend request sent successfully',
      defaultFriendMessage: "Hi! I'd like to connect and play tennis together.",
      playerRecommendations: 'Player Recommendations',
      findCompatiblePlayers: 'Find compatible players near you',
    },

    clubs: {
      searchClubs: 'Search clubs...',
      hasOpenSpots: 'Has open spots',
      skillLevel: 'Skill level',
      members: 'members',
      openSpots: 'Open spots',
      noDescription: 'No description available',
      noSearchResults: 'No clubs found',
      noClubsFound: 'No clubs found',
      tryDifferentSearch: 'Try adjusting your search criteria',
      checkBackLater: 'Check back later for new clubs',
      clubsFound: 'clubs found',
    },

    createClub: {
      title: 'Create Club',
      basic_info: 'Basic Info',
      court_address: 'Court Address',
      regular_meet: 'Recurring Meetups',
      visibility: 'Visibility',
      visibility_public: 'Public',
      visibility_private: 'Private',
      fees: 'Fees',
      facilities: 'Facilities',
      rules: 'Club Rules',
      loading: 'Loading club information...',
      address_search_title: 'Search Tennis Court Address',
      meeting_modal_title: 'Add Regular Meeting Time',
      day_selection: 'Day Selection',
      meeting_time: 'Meeting Time',
      start_time: 'Start Time',
      end_time: 'End Time',
      add_meeting: 'Add Meeting Time',
      cancel: 'Cancel',
      add: 'Add',
      creating: 'Creating...',
      errors: {
        address_required: 'Address is required.',
      },
      facility: {
        lights: 'Lights',
        indoor: 'Indoor',
        parking: 'Parking',
        ballmachine: 'Ball Machine',
        locker: 'Locker Room',
        proshop: 'Pro Shop',
      },
      fields: {
        name: 'Club Name',
        intro: 'Introduction',
        address_placeholder: 'Search court address (EN/US/Atlanta bias)',
        address_label: 'Tennis Court Address',
        address_search_placeholder: 'Search for tennis court address',
        name_placeholder: 'e.g., Duluth Korean Tennis Club',
        intro_placeholder: "Describe your club's goals, atmosphere, and unique features",
        fee_placeholder: 'e.g., 50',
        rules_placeholder:
          'e.g.:\n• Maintain 70%+ attendance for regular meetings\n• Show mutual respect and courtesy\n• Clean up after using facilities',
        meet_day: 'Day',
        meet_time: 'Time',
        meet_note: 'Note',
        fee: 'Membership Fee',
        rules: 'Rules / Etiquette',
        logo: 'Logo',
      },
      cta: 'Create Club',
      hints: {
        public_club: 'Public clubs allow other users to search and apply for membership.',
      },
    },

    time: {
      justNow: 'Just now',
      minutesAgo: '{{count}}m ago',
      hoursAgo: '{{count}}h ago',
      daysAgo: '{{count}}d ago',
      lessThanHour: '< 1h ago',
    },

    notifications: {
      newMatch: 'New Match Available',
      matchReminder: 'Match Reminder',
      friendRequest: 'Friend Request',
      clubInvitation: 'Club Invitation',
      tournamentUpdate: 'Tournament Update',
      permissionRequired: 'Notification Permission Required',
      permissionGranted: 'Notifications Enabled',
    },

    errors: {
      general: 'An error occurred',
      network: 'Network error. Please check your connection.',
      authentication: 'Authentication failed',
      validation: 'Please check your input',
      notFound: 'Resource not found',
      failedToRefresh: 'Failed to refresh data',
      failedToLoadFeed: 'Failed to load activity feed',
      failedToLoadFriends: 'Failed to load friends list',
      failedToLoadRequests: 'Failed to load friend requests',
      failedToRemoveFriend: 'Failed to remove friend',
      failedToAcceptRequest: 'Failed to accept friend request',
      failedToDeclineRequest: 'Failed to decline friend request',
    },
    ai: {
      emptyState: {
        title: 'Welcome to Lightning Tennis AI!',
        subtitle:
          'Ask me anything about tennis - rules, techniques, strategy, or equipment recommendations.',
      },
      status: {
        online: 'Online',
        typing: 'Typing...',
        thinking: 'Thinking...',
      },
      input: {
        placeholder: 'Ask about tennis rules, techniques, or strategy...',
      },
      messageTypes: {
        message: 'Tennis Chat',
        tip: 'Tennis Tips',
        analysis: 'Match Analysis',
        advice: 'Personal Advice',
      },
      quickActions: {
        title: 'Quick Actions',
        getTips: 'Get Tips',
        analyzeMatch: 'Analyze Match',
        rulesHelp: 'Rules Help',
        techniqueTips: 'Technique Tips',
        strategyAdvice: 'Strategy Advice',
        equipmentHelp: 'Equipment Help',
      },
      confidence: {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
    },
  },
  ko: {
    common: {
      save: '저장',
      cancel: '취소',
      confirm: '확인',
      delete: '삭제',
      edit: '편집',
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
      yes: '예',
      no: '아니오',
      ok: '확인',
      next: '다음',
      previous: '이전',
      skip: '건너뛰기',
      finish: '완료',
      continue: '계속하기',
      required: '필수',
    },
    languageSelection: {
      title: '언어를 선택해주세요',
      subtitle: '앱에서 사용할 언어를 선택하세요',
      selectLanguage: '언어 선택',
      continueButton: '계속하기',
    },
    auth: {
      login: '로그인',
      logout: '로그아웃',
      signup: '회원가입',
      email: '이메일',
      password: '비밀번호',
      confirmPassword: '비밀번호 확인',
      forgotPassword: '비밀번호를 잊으셨나요?',
      loginWithGoogle: 'Google로 로그인',
      loginWithApple: 'Apple로 로그인',
      loginWithFacebook: 'Facebook으로 로그인',
      createAccount: '계정 만들기',
      alreadyHaveAccount: '이미 계정이 있으신가요?',
      dontHaveAccount: '계정이 없으신가요?',
    },
    profileSetup: {
      title: '프로필 설정',
      step1: '1단계: 기본 정보',
      step2: '2단계: 테니스 정보',
      step3: '3단계: 위치 정보',
      step4: '4단계: 설정',
      nickname: '닉네임',
      gender: '성별',
      male: '남성',
      female: '여성',
      other: '기타',
      preferNotToSay: '응답하지 않음',
      skillLevel: 'NTRP 실력 레벨',
      beginnerLevel: '초급 (1.0-2.5)',
      intermediateLevel: '중급 (3.0-3.5)',
      advancedLevel: '고급 (4.0-4.5)',
      expertLevel: '전문가 (5.0+)',
      communicationLanguages: '구사 가능한 언어',
      activityRegions: '활동 지역',
      zipCode: '우편번호',
      maxTravelDistance: '최대 이동 거리',
      miles: '마일',
      notificationDistance: '알림 범위',
      completeProfile: '프로필 완성',
    },
    terms: {
      title: '이용 약관',
      serviceTerms: '서비스 이용 약관',
      privacyPolicy: '개인정보 처리방침',
      locationServices: '위치 서비스',
      liabilityDisclaimer: '면책 조항',
      marketingCommunications: '마케팅 정보 수신',
      agreeToTerms: '이용 약관에 동의합니다',
      readAndAgree: '읽고 동의합니다',
      required: '필수',
      optional: '선택',
    },
    navigation: {
      home: '홈',
      discover: '탐색',
      matches: '매칭',
      profile: '프로필',
      clubs: '클럽',
      friends: '친구',
      settings: '설정',
      feed: '피드',
      create: '생성',
      myClubs: '내 클럽',
      myProfile: '내 프로필',
    },
    home: {
      welcomeTitle: '⚡️ Lightning Tennis',
      subtitle: '즉시 참여 가능한 번개 테니스 찾기',
      createNewMatch: '새 Lightning Match 생성',
      activeMatches: '근처 활성 매치',
      todayStats: '오늘의 통계',
      onlinePlayers: '온라인 플레이어',
      myMatches: '내 매치',
    },
    matches: {
      title: '🎾 매치 & 이벤트',
      personalMatches: '개인 매치',
      clubEvents: '클럽 이벤트',
      createMatch: '새 매치 만들기',
      createEvent: '새 이벤트 만들기',
      matchType: '매치 타입',
      personalMatch: '개인 매치',
      clubEvent: '클럽 이벤트',
      location: '장소',
      dateTime: '날짜 & 시간',
      maxParticipants: '최대 참가자 수',
      skillLevel: '실력 레벨',
      description: '설명',
      allLevels: '모든 레벨',
      recurring: '정기 모임',
      weekly: '매주',
      biweekly: '격주',
      monthly: '매월',
      joinMatch: '참가하기',
      participants: '명',
      hostedBy: '주최',
      manage: '관리',
      // Korean translations for HomeScreen
      weekendTennisMatch: '주말 테니스 매치',
      eveningSinglesGame: '저녁 단식 게임',
      todayAfternoon3: '오늘 오후 3:00',
      tomorrowEvening6: '내일 오후 6:00',
      tomorrowAfternoon2: '내일 오후 2:00',
      intermediate3040: '중급 (3.0-4.0)',
      beginner2030: '초급 (2.0-3.0)',
      createLightningMatch: 'Lightning Match 생성',
      createNewMatchQuestion: '새로운 테니스 매치를 생성하시겠습니까?',
      newTennisMatch: '새 테니스 매치',
      nearbyTennisCourt: '가까운 테니스 코트',
      me: '나',
      matchCreatedSuccessfully: 'Lightning Match가 생성되었습니다!',
      joinMatchQuestion: '이 Lightning Match에 참가하시겠습니까?',
      join: '참가',
      joinComplete: '참가 완료!',
      joinedSuccessfully: '매치에 성공적으로 참가했습니다!',
      singles: '단식',
      doubles: '복식',
      players: '명',
      host: '호스트',
    },
    profile: {
      title: '프로필',
      statistics: '테니스 통계',
      matches: '경기 수',
      wins: '승리',
      losses: '패배',
      winRate: '승률',
      currentStreak: '연승',
      eloRating: 'ELO 레이팅',
      badges: '획득 배지',
      notificationSettings: '알림 설정',
      personalMatchNotifications: '개인 매치 알림',
      clubEventNotifications: '클럽 이벤트 알림',
      notificationRange: '알림 받을 거리 범위',
      quietHours: '방해 금지 시간',
      appSettings: '앱 설정',
      languageSettings: '언어 설정',
      privacy: '개인정보 보호',
      help: '도움말',
      appInfo: '앱 정보',
    },
    discover: {
      title: '🎾 Discover',
      subtitle: '플레이어 & 코트 찾기',
      searchPlaceholder: '이름, 지역, 스킬 레벨로 검색...',
      players: '플레이어',
      courts: '코트',
      nearbyPlayers: '근처 플레이어',
      nearbyCourts: '근처 테니스 코트',
      connect: '연결하기',
      book: '예약하기',
      online: '온라인',
      offline: '오프라인',
      open: '영업중',
      closed: '휴무',
      // New translations for DiscoverScreen
      intermediate35: '중급 (3.5)',
      beginner25: '초급 (2.5)',
      advanced45: '고급 (4.5)',
      aggressive: '공격적 플레이',
      defensive: '수비적 플레이',
      allCourt: '올라운드',
      lighting: '조명',
      lockerRoom: '라커룸',
      parking: '주차장',
      proShop: '프로샵',
      cafe: '카페',
      shower: '샤워실',
      matches: '경기',
      connectWithPlayer: '플레이어 연결',
      connectWithPlayerQuestion: '{name}님에게 연결 요청을 보내시겠습니까?',
      sendConnectionRequest: '연결 요청',
      requestComplete: '요청 완료!',
      connectionRequestSent: '{name}님에게 연결 요청을 보냈습니다.',
      bookCourt: '코트 예약',
      bookCourtQuestion: '{name}을 예약하시겠습니까?',
      bookingComplete: '예약 완료!',
      courtBookingConfirmed: '{name} 예약이 완료되었습니다.',
      closedForBooking: '휴무중',
    },
    social: {
      activityFeed: '활동 피드',
      friends: '친구',
      requests: '요청',
      discover: '발견',
      recommended: '추천',
      friendRequests: '친구 요청',
      noActivityYet: '아직 활동이 없습니다',
      activityWillAppearHere: '친구 활동과 클럽 소식이 여기에 표시됩니다',
      noFriendsYet: '아직 친구가 없습니다',
      findPlayersToConnect: '플레이어를 찾아 연결하고 테니스 네트워크를 구축하세요',
      noFriendRequests: '친구 요청이 없습니다',
      requestsWillAppearHere: '받은 친구 요청이 여기에 표시됩니다',
      removeFriend: '친구 삭제',
      removeFriendConfirm: '정말로 {{name}}님을 친구에서 삭제하시겠습니까?',
      friendRemoved: '친구가 삭제되었습니다',
      declineFriendRequest: '친구 요청 거절',
      declineRequestConfirm: '정말로 {{name}}님의 친구 요청을 거절하시겠습니까?',
      friendRequestAccepted: '{{name}}님의 친구 요청을 수락했습니다!',
      friendsSince: '친구된 날짜',
      sendFriendRequest: '친구 요청 보내기',
      sendRequestTo: '{{name}}님에게 친구 요청을 보내시겠습니까?',
      friendRequestSent: '친구 요청을 보냈습니다',
      defaultFriendMessage: '안녕하세요! 함께 테니스를 치며 친구가 되었으면 좋겠습니다.',
      playerRecommendations: '플레이어 추천',
      findCompatiblePlayers: '근처의 호환되는 플레이어 찾기',
    },

    clubs: {
      searchClubs: '클럽 검색...',
      hasOpenSpots: '자리 있음',
      skillLevel: '실력 레벨',
      members: '멤버',
      openSpots: '자리 있음',
      noDescription: '설명이 없습니다',
      noSearchResults: '클럽을 찾을 수 없습니다',
      noClubsFound: '클럽을 찾을 수 없습니다',
      tryDifferentSearch: '다른 검색 조건을 시도해보세요',
      checkBackLater: '나중에 새 클럽을 확인하세요',
      clubsFound: '개 클럽 발견',
    },

    createClub: {
      title: '클럽 만들기',
      basic_info: '기본 정보',
      court_address: '코트 주소',
      regular_meet: '정기 모임',
      visibility: '공개 설정',
      visibility_public: '공개',
      visibility_private: '비공개',
      fees: '비용 정보',
      facilities: '시설 정보',
      rules: '클럽 규칙',
      loading: '클럽 정보를 불러오는 중...',
      address_search_title: '테니스 코트 주소 검색',
      meeting_modal_title: '정기 모임 시간 추가',
      day_selection: '요일 선택',
      meeting_time: '모임 시간',
      start_time: '시작 시간',
      end_time: '종료 시간',
      add_meeting: '정기 모임 시간 추가',
      cancel: '취소',
      add: '추가',
      creating: '만드는 중…',
      errors: {
        address_required: '주소가 필요합니다',
      },
      facility: {
        lights: '야간 조명',
        indoor: '실내 코트',
        parking: '주차장',
        ballmachine: '볼머신',
        locker: '락커룸',
        proshop: '프로샵',
      },
      fields: {
        name: '클럽 이름',
        intro: '소개',
        address_placeholder: '코트 주소 검색 (영어/미국/애틀랜타 우선)',
        address_label: '테니스 코트 주소',
        address_search_placeholder: '테니스 코트 주소를 검색하세요',
        name_placeholder: '예: 둘루스 한인 테니스 클럽',
        intro_placeholder:
          '아틀란타 메트로 한인 테니스 클럽의 목표, 분위기, 특징 등을 소개해주세요',
        fee_placeholder: '예: 50',
        rules_placeholder:
          '예:\n• 정기 모임 참석률 70% 이상 유지\n• 상호 예의와 배려\n• 시설 이용 후 정리정돈',
        meet_day: '요일',
        meet_time: '시간',
        meet_note: '비고',
        fee: '회비',
        rules: '규칙 / 에티켓',
        logo: '로고',
      },
      cta: '클럽 만들기',
      hints: {
        public_club: '공개 클럽은 다른 사용자가 검색하고 가입 신청할 수 있습니다.',
      },
    },

    time: {
      justNow: '방금 전',
      minutesAgo: '{{count}}분 전',
      hoursAgo: '{{count}}시간 전',
      daysAgo: '{{count}}일 전',
      lessThanHour: '1시간 이내',
    },

    notifications: {
      newMatch: '새로운 매치',
      matchReminder: '매치 알림',
      friendRequest: '친구 요청',
      clubInvitation: '클럽 초대',
      tournamentUpdate: '토너먼트 업데이트',
      permissionRequired: '알림 권한이 필요합니다',
      permissionGranted: '알림이 활성화되었습니다',
    },

    competitions: {
      title: '대회',
      leagues: '리그',
      tournaments: '토너먼트',
      myCompetitions: '내 대회',
      myLeagues: '내 리그',
      myTournaments: '내 토너먼트',
      activeLeagues: '진행중인 리그',
      upcomingTournaments: '예정된 토너먼트',
      joinLeague: '리그 참가',
      registerTournament: '등록',
      createLeague: '리그 생성',
      createTournament: '토너먼트 생성',
      leagueName: '리그 이름',
      tournamentName: '토너먼트 이름',
      description: '설명',
      format: '형식',
      roundRobin: '리그전',
      singleElimination: '단일 토너먼트',
      doubleElimination: '더블 토너먼트',
      swiss: '스위스 시스템',
      drawSize: '참가자 수',
      entryFee: '참가비',
      free: '무료',
      prizes: '상품',
      champion: '우승자',
      runnerUp: '준우승자',
      startDate: '시작일',
      endDate: '종료일',
      registrationDeadline: '등록 마감일',
      checkInDeadline: '체크인 마감일',
      location: '장소',
      region: '지역',
      season: '시즌',
      divisions: '부문',
      players: '명',
      spotsLeft: '자리 남음',
      matchFormat: '매치 형식',
      bestOf: '최대',
      sets: '세트',
      tiebreak: '타이브레이크',
      standings: '순위표',
      results: '결과',
      schedule: '일정',
      bracket: '대진표',
      position: '순위',
      points: '점수',
      played: '경기수',
      won: '승',
      lost: '패',
      drawn: '무',
      setDifference: '세트 득실',
      gameDifference: '게임 득실',
      round: '라운드',
      match: '매치',
      vs: 'vs',
      score: '스코어',
      winner: '승자',
      loser: '패자',
      bye: '부전승',
      walkover: '기권승',
      retired: '기권',
      inProgress: '진행중',
      completed: '완료',
      cancelled: '취소',
      final: '결승',
      semifinal: '준결승',
      quarterfinal: '8강',
      roundOf16: '16강',
      roundOf32: '32강',
      firstRound: '1라운드',
      enterScore: '스코어 입력',
      submitScore: '스코어 제출',
      selectWinner: '승자 선택',
      matchResultType: '매치 결과 유형',
      addSet: '세트 추가',
      tiebreakShort: '타이',
      seed: '시드',
      unseeded: '비시드',
      yourResult: '나의 결과',
      finalPosition: '최종 순위',
    },

    errors: {
      general: '오류가 발생했습니다',
      network: '네트워크 오류입니다. 연결을 확인해주세요.',
      authentication: '인증에 실패했습니다',
      validation: '입력을 확인해주세요',
      notFound: '리소스를 찾을 수 없습니다',
      failedToRefresh: '데이터 새로고침에 실패했습니다',
      failedToLoadFeed: '활동 피드 로드에 실패했습니다',
      failedToLoadFriends: '친구 목록 로드에 실패했습니다',
      failedToLoadRequests: '친구 요청 로드에 실패했습니다',
      failedToRemoveFriend: '친구 삭제에 실패했습니다',
      failedToAcceptRequest: '친구 요청 수락에 실패했습니다',
      failedToDeclineRequest: '친구 요청 거절에 실패했습니다',
    },
    ai: {
      emptyState: {
        title: 'Lightning Tennis AI에 오신 것을 환영합니다!',
        subtitle: '테니스에 관한 모든 것을 물어보세요 - 규칙, 기술, 전략, 장비 추천 등.',
      },
      status: {
        online: '온라인',
        typing: '입력 중...',
        thinking: '생각 중...',
      },
      input: {
        placeholder: '테니스 규칙, 기술, 전략에 대해 질문하세요...',
      },
      messageTypes: {
        message: '테니스 채팅',
        tip: '테니스 팁',
        analysis: '경기 분석',
        advice: '개인 조언',
      },
      quickActions: {
        title: '빠른 액션',
        getTips: '팁 받기',
        analyzeMatch: '경기 분석',
        rulesHelp: '규칙 도움말',
        techniqueTips: '기술 팁',
        strategyAdvice: '전략 조언',
        equipmentHelp: '장비 도움말',
      },
      confidence: {
        high: '높음',
        medium: '보통',
        low: '낮음',
      },
    },
  },
};

const LANGUAGE_STORAGE_KEY = '@lightning_tennis_language';

// Create Language Context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true); // Start as initialized to avoid rendering issues

  // Initialize language from storage on app start
  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ko')) {
        setCurrentLanguage(savedLanguage);
        setIsLanguageSelected(true);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const setLanguage = async (lang: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setCurrentLanguage(lang);
      setIsLanguageSelected(true);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const getLanguageConfig = (code: SupportedLanguage): LanguageConfig | undefined => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  };

  const isRTL = getLanguageConfig(currentLanguage)?.rtl || false;

  // Translation function
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = defaultTranslations[currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = defaultTranslations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if no translation found
          }
        }
        break;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    isRTL,
    setLanguage,
    t,
    getLanguageConfig,
    isLanguageSelected,
    translations: defaultTranslations[currentLanguage],
  };

  // Always provide context value, even during initialization

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

// Custom hook to use Language Context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper function to get available languages
export const getAvailableLanguages = (): LanguageConfig[] => {
  return SUPPORTED_LANGUAGES;
};

// Helper function to detect system language
export const getSystemLanguage = (): SupportedLanguage => {
  // This would typically use device locale detection
  // For now, we'll default to English
  return 'en';
};

export default LanguageProvider;
```

---

## src/contexts/AuthContext.tsx

```tsx
/**
 * Auth Context for Lightning Tennis
 * Manages user authentication state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Firebase imports from central config
import { auth, db } from '../firebase/config';

const isFirebaseAvailable = true;
console.log('🔥 AuthContext: Firebase Auth and Firestore loaded successfully');

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  skillLevel: string; // NTRP 등급 (예: '3.0-3.5', '4.0-4.5', etc.) - 통합된 실력 레벨
  ntrpLevel: string; // NTRP 레벨 (skillLevel과 동일한 값, 호환성을 위해 별도 필드)
  playingStyle: string;
  maxTravelDistance: number; // 최대 이동 거리 (마일)
  location: {
    lat: number;
    lng: number;
    address?: string;
  } | null;
  activityRegions: string[];
  languages: string[];
  recentMatches: any[];
  goals: string | null;
  isOnboardingComplete?: boolean; // Firestore에 저장된 온보딩 완료 상태
}

interface AuthResult {
  success: boolean;
  error?: string;
  code?: string; // Firebase 에러 코드
  user?: User;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isProfileLoaded: boolean; // 새로운 상태: Firestore 프로필 로딩 완료 여부
  isOnboardingComplete: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  markOnboardingComplete: (profileData?: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false); // 새로운 상태
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Load user profile from Firestore
  const loadUserProfile = async (firebaseUser: any) => {
    if (!isFirebaseAvailable || !db) {
      console.warn('⚠️ Firebase not available, skipping profile load');
      return;
    }

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ User profile loaded from Firestore:', userData);

        // Handle nested profile data structure
        const profileData = userData.profile || userData; // Support both nested and flat structure

        // Legacy data migration: convert old ntrpLevel to new skillLevel format
        let unifiedSkillLevel = profileData.skillLevel || userData.skillLevel;
        if (!unifiedSkillLevel && (profileData.ntrpLevel || userData.ntrpLevel)) {
          // Migrate old ntrpLevel to new skillLevel format
          const oldNtrpLevel = profileData.ntrpLevel || userData.ntrpLevel;
          unifiedSkillLevel = oldNtrpLevel; // Use NTRP value as the unified skill level
        }
        if (!unifiedSkillLevel) {
          unifiedSkillLevel = '3.0-3.5'; // Default NTRP level
        }

        // Smart onboarding completion detection
        // If user has a nickname (displayName) and basic profile data, consider onboarding complete
        const hasNickname = !!(
          profileData.nickname ||
          profileData.displayName ||
          userData.displayName
        );
        const hasBasicProfile = !!(
          profileData.skillLevel ||
          userData.skillLevel ||
          profileData.activityRegions ||
          userData.activityRegions
        );
        const smartOnboardingComplete =
          userData.isOnboardingComplete || (hasNickname && hasBasicProfile);

        console.log('🔍 Smart onboarding detection:');
        console.log('   - hasNickname:', hasNickname);
        console.log('   - hasBasicProfile:', hasBasicProfile);
        console.log('   - stored isOnboardingComplete:', userData.isOnboardingComplete);
        console.log('   - smartOnboardingComplete:', smartOnboardingComplete);

        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName:
            profileData.nickname ||
            profileData.displayName ||
            userData.displayName ||
            firebaseUser.displayName,
          photoURL: profileData.photoURL || userData.photoURL || firebaseUser.photoURL,
          skillLevel: unifiedSkillLevel, // Unified NTRP skill level
          ntrpLevel: unifiedSkillLevel, // 호환성을 위해 skillLevel과 동일한 값 설정
          playingStyle: profileData.playingStyle || userData.playingStyle || 'all-court',
          maxTravelDistance: profileData.maxTravelDistance || userData.maxTravelDistance || 15,
          location: profileData.location ||
            userData.location || { lat: 33.749, lng: -84.388, address: 'Atlanta, GA' },
          activityRegions: profileData.activityRegions ||
            userData.activityRegions || ['Atlanta Metro'],
          languages: profileData.languages || userData.languages || ['English'],
          recentMatches: profileData.recentMatches || userData.recentMatches || [],
          goals: profileData.goals || userData.goals || null,
          isOnboardingComplete: smartOnboardingComplete,
        };

        setCurrentUser(user);
        setIsOnboardingComplete(smartOnboardingComplete);
        setIsProfileLoaded(true); // ✅ 프로필 로딩 완료!
        console.log(
          `🏁 Final onboarding status: ${smartOnboardingComplete ? 'Complete' : 'Incomplete'}`
        );
        console.log(`✅ Profile loaded successfully - isProfileLoaded set to true`);
      } else {
        console.log('📄 No user profile found in Firestore, creating basic profile...');
        // Create basic user profile
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          skillLevel: '3.0-3.5', // Default NTRP level
          ntrpLevel: '3.0-3.5', // 호환성을 위해 skillLevel과 동일한 값 설정
          playingStyle: 'all-court',
          maxTravelDistance: 15,
          location: { lat: 33.749, lng: -84.388, address: 'Atlanta, GA' },
          activityRegions: ['Atlanta Metro'],
          languages: ['English'],
          recentMatches: [],
          goals: null,
          isOnboardingComplete: false,
        };

        setCurrentUser(newUser);
        setIsOnboardingComplete(false);
        setIsProfileLoaded(true); // ✅ 새 사용자도 프로필 로딩 완료로 간주
        console.log('🏁 New user - onboarding required');
        console.log('✅ New user profile created - isProfileLoaded set to true');
      }
    } catch (error) {
      console.error('❌ Error loading user profile from Firestore:', error);
      throw error;
    }
  };

  // Initialize and check for existing Firebase user session
  useEffect(() => {
    if (isFirebaseAvailable && auth) {
      // Check for existing Firebase user session
      const unsubscribe = auth.onAuthStateChanged(async firebaseUser => {
        console.log('🔥 AuthContext: onAuthStateChanged triggered');
        console.log(
          '   - firebaseUser:',
          firebaseUser ? `${firebaseUser.email} (${firebaseUser.uid})` : 'null'
        );

        if (firebaseUser) {
          console.log('🔥 AuthContext: Firebase user found, loading profile...');
          // Keep loading true while fetching Firestore data
          setLoading(true);
          setIsProfileLoaded(false); // 🔄 프로필 로딩 시작

          try {
            await loadUserProfile(firebaseUser);
            console.log('✅ Profile loaded successfully - setting loading to false');
          } catch (error) {
            console.error('❌ Error loading user profile:', error);
            // Fallback to basic user data WITHOUT using firebaseUser.displayName
            // This prevents email-based fallbacks like "goodseed1"
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: null, // Don't use firebaseUser.displayName to prevent email fallback
              photoURL: firebaseUser.photoURL,
              skillLevel: '3.0-3.5', // Default NTRP level
              ntrpLevel: '3.0-3.5', // 호환성을 위해 skillLevel과 동일한 값 설정
              playingStyle: 'all-court',
              maxTravelDistance: 15,
              location: { lat: 33.749, lng: -84.388, address: 'Atlanta, GA' },
              activityRegions: ['Atlanta Metro'],
              languages: ['English'],
              recentMatches: [],
              goals: null,
              isOnboardingComplete: false,
            });
            setIsOnboardingComplete(false);
            setIsProfileLoaded(true); // ❌ 에러 발생해도 프로필 로딩 완료로 간주
            console.log(
              '⚠️ Fallback user created without displayName to prevent email-based names'
            );
          } finally {
            // Only set loading to false after Firestore operation completes
            setLoading(false);
          }
        } else {
          console.log('🔥 AuthContext: No Firebase user - authentication required');
          console.log('   - Previous currentUser:', currentUser ? `${currentUser.email}` : 'null');
          // Clear user state when no Firebase user
          setCurrentUser(null);
          setIsOnboardingComplete(false);
          setIsProfileLoaded(false); // 🚮 로그아웃 시 프로필 로딩 상태 초기화
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } else {
      // Mock mode - no user logged in
      setTimeout(() => {
        setCurrentUser(null);
        setIsOnboardingComplete(false);
        setIsProfileLoaded(false); // Mock 모드에서도 초기화
        setLoading(false);
        console.log('🔥 AuthContext: Mock mode - authentication flow required');
      }, 1000);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock sign in
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentUser({
        uid: 'demo-user-123',
        email,
        displayName: 'Demo User',
        photoURL: null,
        skillLevel: '3.0-3.5', // 데모 사용자의 NTRP 등급
        playingStyle: 'all-court',
        maxTravelDistance: 15, // 기본 15마일
        location: {
          lat: 33.749,
          lng: -84.388,
          address: 'Atlanta, GA',
        },
        activityRegions: ['Atlanta Metro', 'North Georgia'],
        languages: ['English', '한국어'],
        recentMatches: [],
        goals: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (isFirebaseAvailable && auth) {
        // Use Firebase Auth
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Immediately load user profile to avoid race conditions with onAuthStateChanged
        console.log('✅ Firebase email sign in successful - loading profile immediately');
        try {
          await loadUserProfile(firebaseUser);
          console.log('✅ User profile loaded successfully after sign in');
        } catch (error) {
          console.error('❌ Error loading profile after sign in:', error);
        }

        return { success: true, user: null }; // User state is already set by loadUserProfile
      } else {
        // Mock authentication
        console.log('⚠️ Using mock email authentication');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const user: User = {
          uid: `mock-${Date.now()}`,
          email,
          displayName: 'Mock User',
          photoURL: null,
          skillLevel: '3.0-3.5', // Default NTRP level
          playingStyle: 'all-court',
          maxTravelDistance: 15,
          location: {
            lat: 33.749,
            lng: -84.388,
            address: 'Atlanta, GA',
          },
          activityRegions: ['Atlanta Metro', 'North Georgia'],
          languages: ['English', '한국어'],
          recentMatches: [],
          goals: null,
        };

        setCurrentUser(user);
        return { success: true, user };
      }
    } catch (error: any) {
      console.error('❌ Email sign in failed:', error);

      // Firebase 에러 코드별 사용자 친화적 메시지 처리
      let userFriendlyMessage = 'Sign in failed';

      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-credential':
            userFriendlyMessage = '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.';
            break;
          case 'auth/user-not-found':
            userFriendlyMessage = '계정을 찾을 수 없습니다.';
            break;
          case 'auth/wrong-password':
            userFriendlyMessage = '비밀번호가 올바르지 않습니다.';
            break;
          case 'auth/invalid-email':
            userFriendlyMessage = '유효하지 않은 이메일입니다.';
            break;
          case 'auth/too-many-requests':
            userFriendlyMessage = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.';
            break;
          default:
            userFriendlyMessage = error.message || 'Sign in failed';
        }
      }

      return {
        success: false,
        error: userFriendlyMessage,
        code: error.code, // 에러 코드도 함께 전달
      };
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (isFirebaseAvailable && auth) {
        // Use Firebase Auth with detailed error logging
        console.log('🔍 Attempting Firebase createUserWithEmailAndPassword...');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Auth instance:`, auth);

        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Don't create user object here - let onAuthStateChanged handle profile loading
        console.log(
          '✅ Firebase email sign up successful - profile will be loaded by onAuthStateChanged'
        );
        return { success: true, user: null }; // User will be set by onAuthStateChanged
      } else {
        // Mock authentication
        console.log('⚠️ Using mock email sign up');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const user: User = {
          uid: `mock-${Date.now()}`,
          email,
          displayName: 'New Mock User',
          photoURL: null,
          skillLevel: '1.0-2.5', // Beginner NTRP level
          playingStyle: 'all-court',
          maxTravelDistance: 15,
          location: {
            lat: 33.749,
            lng: -84.388,
            address: 'Atlanta, GA',
          },
          activityRegions: ['Atlanta Metro'],
          languages: ['English'],
          recentMatches: [],
          goals: null,
        };

        setCurrentUser(user);
        return { success: true, user };
      }
    } catch (error: any) {
      console.error('❌ Email sign up failed:', error);
      console.error('🔍 Error details:');
      console.error(`   - Error code: ${error.code}`);
      console.error(`   - Error message: ${error.message}`);
      console.error(`   - Auth domain: ${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
      console.error(`   - Project ID: ${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}`);

      // Firebase 에러 코드별 사용자 친화적 메시지 처리
      let userFriendlyMessage = 'Sign up failed';

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            userFriendlyMessage = '이미 사용 중인 이메일입니다.';
            break;
          case 'auth/weak-password':
            userFriendlyMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
            break;
          case 'auth/invalid-email':
            userFriendlyMessage = '유효하지 않은 이메일입니다.';
            break;
          case 'auth/api-key-not-valid':
            userFriendlyMessage =
              'API key configuration error. Please check Firebase Console settings.';
            break;
          case 'auth/invalid-api-key':
            userFriendlyMessage = 'Invalid API key. Please verify Firebase configuration.';
            break;
          case 'auth/app-not-authorized':
            userFriendlyMessage = 'App not authorized. Please check Bundle ID in Firebase Console.';
            break;
          default:
            userFriendlyMessage = error.message || 'Sign up failed';
        }
      }

      return {
        success: false,
        error: userFriendlyMessage,
        code: error.code, // 에러 코드도 함께 전달
      };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) {
      throw new Error('No current user to update');
    }

    try {
      // Update local state immediately for responsive UI
      const updatedUser = { ...currentUser, ...updates };

      // ✅ skillLevel과 ntrpLevel 동기화 (둘 중 하나가 변경되면 둘 다 같은 값으로 설정)
      if (updates.skillLevel && !updates.ntrpLevel) {
        updatedUser.ntrpLevel = updates.skillLevel;
      } else if (updates.ntrpLevel && !updates.skillLevel) {
        updatedUser.skillLevel = updates.ntrpLevel;
      }

      setCurrentUser(updatedUser);

      // Save to Firestore with nested profile structure
      if (isFirebaseAvailable && db) {
        const { doc, setDoc } = await import('firebase/firestore');
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Create nested profile structure for Firestore
        const firestoreData = {
          uid: updatedUser.uid,
          email: updatedUser.email,
          profile: {
            nickname: updatedUser.displayName,
            photoURL: updatedUser.photoURL,
            skillLevel: updatedUser.skillLevel, // Unified NTRP skill level (e.g., '3.0-3.5')
            playingStyle: updatedUser.playingStyle,
            maxTravelDistance: updatedUser.maxTravelDistance,
            location: updatedUser.location,
            activityRegions: updatedUser.activityRegions,
            languages: updatedUser.languages,
            recentMatches: updatedUser.recentMatches,
            goals: updatedUser.goals,
          },
          updatedAt: new Date(),
        };

        await setDoc(userDocRef, firestoreData, { merge: true });
        console.log('✅ Profile successfully updated in Firestore');
        console.log('📊 Updated profile data:', firestoreData.profile);
      } else {
        console.warn('⚠️ Firebase not available, profile updated locally only');
      }
    } catch (error) {
      console.error('❌ Error updating user profile:', error);

      // Revert local state on Firestore error
      setCurrentUser(currentUser);

      // Re-throw error so EditProfileScreen can handle it
      throw new Error('Failed to update profile. Please try again.');
    }
  };

  const markOnboardingComplete = async (profileData?: Partial<User>) => {
    setIsOnboardingComplete(true);
    console.log('✅ AuthContext: Onboarding marked as complete');

    // Save onboarding completion to Firestore
    if (isFirebaseAvailable && db && currentUser) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Merge profile data from onboarding with current user data
        const mergedUserData = profileData ? { ...currentUser, ...profileData } : currentUser;

        // Create nested profile structure for Firestore
        const firestoreData = {
          isOnboardingComplete: true,
          onboardingCompletedAt: new Date(),
          uid: mergedUserData.uid,
          email: mergedUserData.email,
          // Top-level user data for easier access
          displayName: mergedUserData.displayName, // Store displayName at top level too
          profile: {
            nickname: mergedUserData.displayName, // Store nickname in nested profile
            displayName: mergedUserData.displayName, // Also store in profile for redundancy
            photoURL: mergedUserData.photoURL,
            skillLevel: mergedUserData.skillLevel, // Unified NTRP skill level (e.g., '3.0-3.5')
            playingStyle: mergedUserData.playingStyle,
            maxTravelDistance: mergedUserData.maxTravelDistance,
            location: mergedUserData.location,
            activityRegions: mergedUserData.activityRegions,
            languages: mergedUserData.languages,
            recentMatches: mergedUserData.recentMatches,
            goals: mergedUserData.goals,
          },
          updatedAt: new Date(),
        };

        await setDoc(userDocRef, firestoreData, { merge: true });

        // Update local user state with merged data
        const finalUser = {
          ...mergedUserData,
          isOnboardingComplete: true,
        };

        console.log('🔍 Final user data being set in AuthContext:');
        console.log('   - displayName:', finalUser.displayName);
        console.log('   - skillLevel:', finalUser.skillLevel);
        console.log('   - activityRegions:', finalUser.activityRegions);

        setCurrentUser(finalUser);
        setIsProfileLoaded(true); // ✅ 온보딩 완료 시 프로필 로딩도 완료

        console.log('💾 Complete onboarding data saved to Firestore with nested profile structure');
        console.log('📊 Saved profile data:', firestoreData.profile);
        console.log('✅ Onboarding complete - isProfileLoaded set to true');
      } catch (error) {
        console.error('❌ Error saving onboarding completion to Firestore:', error);
        // 에러가 발생해도 로컬 상태는 유지
      }
    } else {
      console.warn('⚠️ Firebase not available, onboarding completion only saved locally');
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    isProfileLoaded, // ✅ 새로운 상태 노출
    isOnboardingComplete,
    signIn,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserProfile,
    markOnboardingComplete,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

---

## src/contexts/LocationContext.tsx

```tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationContextType {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<UserLocation | null>;
  watchLocation: () => void;
  stopWatchingLocation: () => void;
  isLocationEnabled: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    // 앱 시작 시 저장된 위치 정보 로드
    loadCachedLocation();

    // 위치 권한 상태 확인
    checkLocationPermission();
  }, []);

  const loadCachedLocation = async () => {
    try {
      const cachedLocation = await AsyncStorage.getItem('userLocation');
      if (cachedLocation) {
        const parsedLocation = JSON.parse(cachedLocation);
        // 24시간 이내의 위치 정보만 사용
        if (Date.now() - parsedLocation.timestamp < 24 * 60 * 60 * 1000) {
          setLocation(parsedLocation);
        }
      }
    } catch (error) {
      console.error('Error loading cached location:', error);
    }
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setIsLocationEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
      setIsLocationEnabled(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const isGranted = status === 'granted';
      setIsLocationEnabled(isGranted);

      if (!isGranted) {
        Alert.alert('위치 권한 필요', 'nearby 플레이어를 찾기 위해 위치 권한이 필요합니다.', [
          { text: '확인' },
        ]);
      }

      return isGranted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setIsLocationEnabled(false);
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<UserLocation | null> => {
    if (!isLocationEnabled) {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError('위치 권한이 필요합니다.');
        return null;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 15000,
        maximumAge: 60000,
      });

      const newLocation: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: Date.now(),
      };

      setLocation(newLocation);
      setIsLoading(false);

      // 위치 정보 캐싱
      try {
        await AsyncStorage.setItem('userLocation', JSON.stringify(newLocation));
      } catch (error) {
        console.error('Error caching location:', error);
      }

      return newLocation;
    } catch (error) {
      setIsLoading(false);
      let errorMessage = '위치를 가져올 수 없습니다.';

      if (error.code === 'E_LOCATION_SERVICES_DISABLED') {
        errorMessage = '위치 서비스가 비활성화되었습니다.';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = '위치를 찾을 수 없습니다.';
      } else if (error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = '위치 요청이 시간 초과되었습니다.';
      }

      setError(errorMessage);
      console.error('Location error:', error);
      return null;
    }
  };

  const watchLocation = async () => {
    if (!isLocationEnabled || watchId !== null) return;

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000,
          distanceInterval: 100,
        },
        async position => {
          const newLocation: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 0,
            timestamp: Date.now(),
          };

          setLocation(newLocation);

          // 위치 정보 캐싱
          try {
            await AsyncStorage.setItem('userLocation', JSON.stringify(newLocation));
          } catch (error) {
            console.error('Error caching location:', error);
          }
        }
      );

      setWatchId(subscription as any);
    } catch (error) {
      console.error('Location watch error:', error);
      setError('실시간 위치 추적에 실패했습니다.');
    }
  };

  const stopWatchingLocation = () => {
    if (watchId !== null) {
      if (typeof watchId === 'object' && 'remove' in watchId) {
        (watchId as any).remove();
      }
      setWatchId(null);
    }
  };

  // 컴포넌트 언마운트 시 위치 추적 정리
  useEffect(() => {
    return () => {
      stopWatchingLocation();
    };
  }, [watchId]);

  const value: LocationContextType = {
    location,
    isLoading,
    error,
    requestLocationPermission,
    getCurrentLocation,
    watchLocation,
    stopWatchingLocation,
    isLocationEnabled,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
```

---

## .env

```
# Firebase Configuration
# Values copied from Firebase Console > Project Settings > Your apps > Lightning Tennis Web App

# Firebase Web App Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=<REDACTED>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=lightning-tennis-community.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=lightning-tennis-community
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=lightning-tennis-community.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=815594051044
EXPO_PUBLIC_FIREBASE_APP_ID=1:815594051044:ios:2e908e86def2cf1495e3f1
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ZLDPSTT45J

# Development Settings
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false

# Google Gemini AI Configuration
# Get API key from Google AI Studio (https://makersuite.google.com)
EXPO_PUBLIC_GEMINI_API_KEY=<REDACTED>

# Google Places API Configuration
# Platform-specific API keys for Google Places Autocomplete
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_ANDROID=<REDACTED>
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_IOS=<REDACTED>

# Instructions:
# 1. Go to Firebase Console (https://console.firebase.google.com)
# 2. Select your project: lightning-tennis-community
# 3. Go to Project Settings (gear icon)
# 4. Scroll down to "Your apps" section
# 5. Click on your web app or create a new web app
# 6. Copy the firebaseConfig values and replace the values above
#
# Example:
# EXPO_PUBLIC_FIREBASE_API_KEY=<REDACTED>
# EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=lightning-tennis-community.firebaseapp.com
# EXPO_PUBLIC_FIREBASE_PROJECT_ID=lightning-tennis-community
# EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=lightning-tennis-community.appspot.com
# EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
# EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789
```

---

## .env.template

```
# Lightning Tennis Firebase Configuration
# IMPORTANT: Copy this to .env and replace ALL placeholder values with your actual Firebase config
# Get these values from Firebase Console > Project Settings > General tab > Your apps section

# ================================================================
# FIREBASE WEB APP CONFIGURATION (REQUIRED)
# ================================================================
# Complete API key (usually starts with 'AIza' and is ~40 characters long)
EXPO_PUBLIC_FIREBASE_API_KEY=<REDACTED>

# Auth domain (your_project_id.firebaseapp.com)
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=lightning-tennis-community.firebaseapp.com

# Project ID (exactly as shown in Firebase Console)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=lightning-tennis-community

# Storage bucket (your_project_id.appspot.com)
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=lightning-tennis-community.appspot.com

# Messaging Sender ID (numeric, usually 12 digits)
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012

# App ID (format: 1:number:web:hash or 1:number:android:hash)
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789

# Measurement ID (optional, for Google Analytics, format: G-XXXXXXXXXX)
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ================================================================
# DEVELOPMENT SETTINGS
# ================================================================
# Set to 'true' to use Firebase emulators for local development
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false

# ================================================================
# OTHER API KEYS
# ================================================================
# Google Gemini AI API Key (optional, for AI features)
EXPO_PUBLIC_GEMINI_API_KEY=<REDACTED>

# ================================================================
# INSTRUCTIONS:
# 1. Go to Firebase Console: https://console.firebase.google.com
# 2. Select your project: "lightning-tennis-community"
# 3. Click the gear icon (⚙️) > "Project settings"
# 4. Scroll down to "Your apps" section
# 5. If you don't have a web app, click "Add app" > Web (</>)
# 6. Copy each value from the firebaseConfig object
# 7. Replace ALL placeholder values above with your actual values
# 8. Save this file as .env (remove .template extension)
# 9. Restart your Expo development server: npx expo start --clear
# ================================================================
```

---

## .env.example

```
# Firebase Configuration
# Copy this file to .env and fill in your Firebase project values
# Get these values from Firebase Console > Project Settings > General tab

# Firebase Web App Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=<REDACTED>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# Development Settings
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false

# Instructions:
# 1. Go to Firebase Console (https://console.firebase.google.com)
# 2. Select your project (or create a new one)
# 3. Go to Project Settings (gear icon)
# 4. Scroll down to "Your apps" section
# 5. Click on your web app or create a new web app
# 6. Copy the config values and paste them above
# 7. Rename this file from .env.example to .env
# 8. Add .env to your .gitignore file to keep secrets safe

# Firebase Emulator Settings (for local development)
# Set to 'true' if you want to use Firebase emulators locally
# Make sure to run: firebase emulators:start
# EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
```
