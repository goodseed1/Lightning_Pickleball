/**
 * 🎾 Club Management Screen
 * 클럽 관리 - 전체 클럽 목록 조회 및 관리
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, TouchableOpacity } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  ActivityIndicator,
  useTheme,
  Chip,
  Searchbar,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Club {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  location?: string;
  createdAt?: Date;
  isPublic?: boolean;
}

const ClubManagementScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClubs(clubs);
    } else {
      const filtered = clubs.filter(
        club =>
          club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          club.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClubs(filtered);
    }
  }, [searchQuery, clubs]);

  const loadClubs = async () => {
    try {
      // orderBy 제거 - name 필드가 없는 문서가 제외되는 문제 방지
      const clubsSnapshot = await getDocs(collection(db, 'pickleball_clubs'));

      // 각 클럽의 members 서브컬렉션에서 실제 회원수 카운트
      const clubsData = await Promise.all(
        clubsSnapshot.docs.map(async doc => {
          const data = doc.data();

          // clubMembers 컬렉션에서 clubId로 필터링하여 회원수 카운트
          let memberCount = data.stats?.totalMembers || data.memberCount || 0;
          try {
            const membersQuery = query(
              collection(db, 'clubMembers'),
              where('clubId', '==', doc.id)
            );
            const countSnapshot = await getCountFromServer(membersQuery);
            memberCount = countSnapshot.data().count;
          } catch {
            // 컬렉션 카운트 실패 시 기존 값 사용
          }

          return {
            id: doc.id,
            // name은 직접 필드 또는 profile.name에서 가져옴
            name: data.name || data.profile?.name || t('common.unknownClub'),
            description: data.description || data.profile?.description,
            memberCount,
            location: data.location?.address || data.location?.region || '',
            createdAt: data.createdAt?.toDate(),
            isPublic: data.settings?.isPublic !== false,
          };
        })
      );

      // 클라이언트 측 정렬
      const sortedClubs = clubsData.sort((a, b) => a.name.localeCompare(b.name));

      setClubs(sortedClubs);
      setFilteredClubs(sortedClubs);
    } catch (error) {
      console.error('[ClubManagement] Error loading clubs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClubs();
  };

  const handleClubPress = (club: Club) => {
    // Navigate to ClubDetail (in MainTabs -> Discover stack)
    // @ts-expect-error Nested navigation params typing
    navigation.navigate('MainTabs', {
      screen: 'Discover',
      params: {
        screen: 'ClubDetail',
        params: { clubId: club.id },
      },
    });
  };

  if (loading) {
    return (
      <>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('admin.clubManagement.title', '클럽 관리')} />
        </Appbar.Header>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('admin.clubManagement.title', '클럽 관리')} />
        <Appbar.Action icon='refresh' onPress={onRefresh} />
      </Appbar.Header>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Card */}
        <Card
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={{ fontSize: 28 }}>🎾</Text>
                <Text style={[styles.summaryValue, { color: '#4caf50' }]}>{clubs.length}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                  {t('admin.clubManagement.totalClubs', '전체 클럽')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={{ fontSize: 28 }}>👥</Text>
                <Text style={[styles.summaryValue, { color: '#2196f3' }]}>
                  {clubs.reduce((sum, club) => sum + club.memberCount, 0)}
                </Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                  {t('admin.clubManagement.totalMembers', '전체 회원')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Search */}
        <Searchbar
          placeholder={t('admin.clubManagement.searchPlaceholder', '클럽 이름으로 검색...')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
        />

        {/* Club List */}
        <Card
          style={[
            styles.listCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Card.Content>
            {filteredClubs.length === 0 ? (
              <Text style={{ color: colors.onSurfaceVariant, textAlign: 'center', padding: 20 }}>
                {searchQuery
                  ? t('admin.clubManagement.noResults', '검색 결과가 없습니다')
                  : t('admin.clubManagement.noClubs', '등록된 클럽이 없습니다')}
              </Text>
            ) : (
              filteredClubs.map((club, index) => (
                <View key={club.id}>
                  <TouchableOpacity
                    style={styles.clubItem}
                    activeOpacity={0.7}
                    onPress={() => handleClubPress(club)}
                  >
                    <View style={styles.clubInfo}>
                      <Text style={[styles.clubName, { color: colors.onSurface }]}>
                        {club.name}
                      </Text>
                      {club.location && (
                        <Text style={[styles.clubLocation, { color: colors.onSurfaceVariant }]}>
                          📍 {club.location}
                        </Text>
                      )}
                      {club.description && (
                        <Text
                          style={[styles.clubDescription, { color: colors.onSurfaceVariant }]}
                          numberOfLines={1}
                        >
                          {club.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.clubMeta}>
                      <Chip compact style={styles.memberChip}>
                        {club.memberCount} {t('admin.clubManagement.members', '명')}
                      </Chip>
                      {!club.isPublic && <Text style={{ fontSize: 12, marginTop: 4 }}>🔒</Text>}
                    </View>
                  </TouchableOpacity>
                  {index < filteredClubs.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  listCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  clubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  clubInfo: {
    flex: 1,
    marginRight: 12,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  clubLocation: {
    fontSize: 12,
    marginBottom: 2,
  },
  clubDescription: {
    fontSize: 12,
  },
  clubMeta: {
    alignItems: 'flex-end',
  },
  memberChip: {
    height: 28,
    paddingHorizontal: 4,
  },
  divider: {
    marginVertical: 4,
  },
  bottomPadding: {
    height: 32,
  },
});

export default ClubManagementScreen;
