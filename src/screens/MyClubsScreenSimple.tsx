import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import clubService from '../services/clubService';
import SafeText from '../components/common/SafeText';
import { useClubChatUnreadCount } from '../hooks/clubs/useClubChatUnreadCount';

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
  pendingApplications?: number;
}

const MyClubsScreenSimple = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const authCtx = useAuth();
  const currentUser = authCtx?.currentUser || null;

  const [userClubs, setUserClubs] = useState<UserClub[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState<Record<string, number>>({});

  // 🔴 채팅 안읽은 메시지 (빨간색 배지)
  const { clubUnreadCounts } = useClubChatUnreadCount(currentUser?.uid);

  const loadUserClubs = async () => {
    if (!currentUser?.uid) {
      // Use mock data if not logged in
      const mockClubs: UserClub[] = [
        {
          id: 'mock-1',
          clubId: 'club-1',
          clubName: 'Atlanta Pickleball Club',
          clubDescription: 'Weekly pickleball matches and practice sessions',
          clubLocation: 'Atlanta, GA',
          role: 'admin',
          status: 'active',
          joinedAt: new Date('2024-01-15'),
          memberCount: 45,
          clubMaxMembers: 100,
          pendingApplications: 3,
        },
        {
          id: 'mock-2',
          clubId: 'club-2',
          clubName: 'Duluth Pickleball Group',
          clubDescription: 'Friendly pickleball community in Duluth',
          clubLocation: 'Duluth, GA',
          role: 'member',
          status: 'active',
          joinedAt: new Date('2024-02-01'),
          memberCount: 30,
          clubMaxMembers: 50,
          pendingApplications: 0,
        },
      ];
      setUserClubs(mockClubs);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading clubs for user:', currentUser.uid);

      // Load real data from Firebase
      const clubs = await clubService.getUserClubMemberships(currentUser.uid);
      console.log('Loaded clubs:', clubs.length);

      // Convert to our UserClub format
      const formattedClubs = clubs.map(club => ({
        id: club.id,
        clubId: club.clubId,
        clubName: club.clubName || t('common.unknownClub'),
        clubDescription: club.clubDescription,
        clubLocation: club.clubLocation || t('common.unknown'),
        role: club.role || 'member',
        status: club.status || 'active',
        joinedAt: club.joinedAt || new Date(),
        memberCount: club.memberCount || 0,
        clubMaxMembers: club.clubMaxMembers,
        pendingApplications: 0,
      }));

      setUserClubs(formattedClubs);
    } catch (error) {
      console.error('Error loading clubs:', error);
      setUserClubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserClubs();
  }, [currentUser]);

  // 🟡 일반 알림 구독 (노란색 배지) - notifications 컬렉션
  useEffect(() => {
    if (!currentUser?.uid || userClubs.length === 0) {
      setNotificationCounts({});
      return;
    }

    console.log(
      '[MyClubsScreen] 🟡 Setting up notifications subscription for clubs:',
      userClubs.map(c => c.clubId)
    );

    const unsubscribes = userClubs.map(club => {
      const q = query(
        collection(db, 'notifications'),
        where('clubId', '==', club.clubId),
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'unread')
      );

      return onSnapshot(
        q,
        snapshot => {
          console.log(
            `[MyClubsScreen] 🟡 Club ${club.clubId} (${club.clubName}): ${snapshot.docs.length} unread notifications`
          );
          setNotificationCounts(prev => ({
            ...prev,
            [club.clubId]: snapshot.docs.length,
          }));
        },
        error => {
          console.error(
            `[MyClubsScreen] Error loading notifications for club ${club.clubId}:`,
            error
          );
        }
      );
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser?.uid, userClubs]);

  const handleClubPress = (club: UserClub) => {
    // @ts-expect-error ClubDetail navigation params
    navigation.navigate('ClubDetail', {
      clubId: club.clubId,
      userRole: club.role,
    });
  };

  const handleCreateClub = () => {
    // @ts-expect-error CreateClub is on a different stack
    navigation.navigate('CreateClub');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserClubs();
    setRefreshing(false);
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
        <View style={styles.clubLogoContainer}>
          <View style={styles.clubLogoPlaceholder}>
            <Ionicons name='basketball' size={28} color='#fff' />
          </View>
        </View>

        <View style={styles.clubInfoContainer}>
          <View style={styles.clubHeader}>
            <SafeText style={styles.clubName} numberOfLines={1}>
              {club.clubName}
            </SafeText>
            <View style={styles.clubBadges}>
              <View style={[styles.roleChip, { backgroundColor: getRoleColor(club.role) }]}>
                <SafeText style={styles.roleText}>{club.role}</SafeText>
              </View>

              {/* 🔴 빨간색 배지 - 채팅 안읽은 메시지 (우선 표시) */}
              {clubUnreadCounts[club.clubId] > 0 ? (
                <View style={styles.alertBadgeRed}>
                  <SafeText style={styles.alertBadgeText}>{clubUnreadCounts[club.clubId]}</SafeText>
                </View>
              ) : /* 🟡 노란색 배지 - 일반 알림 */
              notificationCounts[club.clubId] > 0 ? (
                <View style={styles.alertBadgeYellow}>
                  <SafeText style={styles.alertBadgeText}>
                    {notificationCounts[club.clubId]}
                  </SafeText>
                </View>
              ) : null}
            </View>
          </View>

          {club.clubDescription ? (
            <SafeText style={styles.clubDescription} numberOfLines={2}>
              {club.clubDescription}
            </SafeText>
          ) : null}

          <View style={styles.clubMetaContainer}>
            <View style={styles.clubMetaRow}>
              <Ionicons name='location-outline' size={14} color='#666' />
              <SafeText style={styles.clubMetaText}>{club.clubLocation || t('common.unknown')}</SafeText>
            </View>
            <View style={styles.clubMetaRow}>
              <Ionicons name='people-outline' size={14} color='#666' />
              <SafeText style={styles.clubMetaText}>
                {`${club.memberCount || 0}/${club.clubMaxMembers || 100}`}
              </SafeText>
            </View>
          </View>
        </View>

        <Ionicons name='chevron-forward' size={20} color='#999' style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <SafeText style={styles.title}>{t('myClubs.title')}</SafeText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <SafeText style={styles.loadingText}>{t('myClubs.loadingClubs')}</SafeText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SafeText style={styles.title}>{t('myClubs.title')}</SafeText>
        <View style={styles.headerButtons}>
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
            <SafeText style={styles.emptyIcon}>🎾</SafeText>
            <SafeText style={styles.emptyTitle}>No clubs joined yet</SafeText>
            <SafeText style={styles.emptyDescription}>
              Find clubs to join or create your own
            </SafeText>

            <TouchableOpacity style={styles.createClubButton} onPress={handleCreateClub}>
              <SafeText style={styles.createClubButtonText}>Create Club</SafeText>
              <Ionicons name='add' size={20} color='#fff' />
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={userClubs}
            renderItem={renderClubItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.clubsList}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    paddingHorizontal: 40,
    lineHeight: 20,
    marginBottom: 30,
  },
  createClubButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createClubButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
    marginRight: 8,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  clubLogoContainer: {
    marginRight: 12,
  },
  clubLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976d2',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  clubInfoContainer: {
    flex: 1,
  },
  clubHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600' as const,
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
    flexDirection: 'row' as const,
    gap: 16,
  },
  clubMetaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  clubMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  clubBadges: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600' as const,
  },
  alertBadgeYellow: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFC107', // 노란색 - 일반 알림
  },
  alertBadgeRed: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f44336', // 빨간색 - 채팅 안읽은 메시지
  },
  alertBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600' as const,
  },
  chevron: {
    marginLeft: 8,
  },
};

export default MyClubsScreenSimple;
