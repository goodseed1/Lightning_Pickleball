/**
 * 📝 Content Management Screen
 * 콘텐츠 관리 - 이벤트, 클럽, 게시물 관리
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert } from 'react-native';
import {
  Appbar,
  Card,
  Title,
  Text,
  List,
  ActivityIndicator,
  useTheme,
  Chip,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AdminStackParamList } from '../../navigation/AppNavigator';
import { collection, getDocs, query, getCountFromServer, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface ContentStats {
  totalClubs: number;
  totalEvents: number;
  totalTournaments: number;
  totalLeagues: number;
  recentClubs: { id: string; name: string; memberCount: number }[];
}

type NavigationProp = NativeStackNavigationProp<AdminStackParamList>;

const ContentManagementScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContentStats>({
    totalClubs: 0,
    totalEvents: 0,
    totalTournaments: 0,
    totalLeagues: 0,
    recentClubs: [],
  });

  useEffect(() => {
    loadContentStats();
  }, []);

  const loadContentStats = async () => {
    try {
      // Get clubs count and recent clubs
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
            name: data.name || data.profile?.name || t('common.unknown'),
            memberCount,
          };
        })
      );

      // Get events count
      const eventsSnapshot = await getDocs(collection(db, 'events'));

      // 🎯 [KIM FIX] Get tournaments and leagues count instead of unused 'matches' collection
      const tournamentsSnapshot = await getDocs(collection(db, 'tournaments'));
      const leaguesSnapshot = await getDocs(collection(db, 'leagues'));

      setStats({
        totalClubs: clubsSnapshot.size,
        totalEvents: eventsSnapshot.size,
        totalTournaments: tournamentsSnapshot.size,
        totalLeagues: leaguesSnapshot.size,
        recentClubs: clubsData.slice(0, 5),
      });
    } catch (error) {
      console.error('[ContentManagement] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (title: string, value: number, icon: string, color: string) => (
    <Card
      style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
    >
      <Card.Content style={styles.statContent}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
        <View style={styles.statText}>
          <Title style={[styles.statValue, { color }]}>{value.toLocaleString()}</Title>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>{title}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('admin.content.title', '콘텐츠 관리')} />
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
        <Appbar.Content title={t('admin.content.title', '콘텐츠 관리')} />
        <Appbar.Action icon='refresh' onPress={loadContentStats} />
      </Appbar.Header>

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Stats Overview - 🎯 [KIM FIX] Show tournaments & leagues instead of unused 'matches' */}
        <View style={styles.statsGrid}>
          {renderStatCard(t('admin.content.clubs', '클럽'), stats.totalClubs, '🎾', '#4caf50')}
          {renderStatCard(t('admin.content.events', '이벤트'), stats.totalEvents, '📅', '#2196f3')}
          {renderStatCard(
            t('admin.content.tournaments', '토너먼트'),
            stats.totalTournaments,
            '🏆',
            '#ff9800'
          )}
          {renderStatCard(t('admin.content.leagues', '리그'), stats.totalLeagues, '🏅', '#9c27b0')}
        </View>

        {/* Content Management Sections */}
        <Card
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}
        >
          <List.Section>
            <List.Subheader>{t('admin.content.management', '콘텐츠 관리 메뉴')}</List.Subheader>

            <List.Item
              title={t('admin.content.clubManagement', '클럽 관리')}
              description={t('admin.content.clubDesc', '클럽 생성, 수정, 삭제')}
              left={props => <List.Icon {...props} icon='account-group' color='#4caf50' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={() => navigation.navigate('ClubManagement')}
            />

            <List.Item
              title={t('admin.content.eventManagement', '이벤트 관리')}
              description={t('admin.content.eventDesc', '이벤트 생성, 수정, 삭제')}
              left={props => <List.Icon {...props} icon='calendar' color='#2196f3' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={() => navigation.navigate('EventManagement')}
            />

            <List.Item
              title={t('admin.content.matchManagement', '경기 관리')}
              description={t('admin.content.matchDesc', '경기 기록 조회 및 관리')}
              left={props => <List.Icon {...props} icon='pickleball' color='#ff9800' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={() => navigation.navigate('MatchManagement')}
            />
          </List.Section>
        </Card>

        {/* Recent Clubs */}
        <Card
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}
        >
          <Card.Content>
            <Title style={{ marginBottom: 12 }}>
              {t('admin.content.recentClubs', '최근 클럽')}
            </Title>
            {stats.recentClubs.length === 0 ? (
              <Text style={{ color: colors.onSurfaceVariant }}>
                {t('admin.content.noClubs', '등록된 클럽이 없습니다')}
              </Text>
            ) : (
              stats.recentClubs.map(club => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.clubItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    Alert.alert(
                      club.name,
                      t(
                        'admin.content.clubDetailComingSoon',
                        '클럽 상세 정보 기능이 곧 추가될 예정입니다.'
                      ),
                      [{ text: t('common.ok', '확인') }]
                    );
                  }}
                >
                  <Text style={{ color: colors.onSurface, flex: 1 }}>{club.name}</Text>
                  <Chip compact style={styles.memberChip}>
                    {club.memberCount} {t('admin.content.members', '명')}
                  </Chip>
                </TouchableOpacity>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '31%',
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statText: {
    alignItems: 'center',
    marginTop: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  clubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  memberChip: {
    height: 28,
    paddingHorizontal: 4,
  },
  bottomPadding: {
    height: 32,
  },
});

export default ContentManagementScreen;
