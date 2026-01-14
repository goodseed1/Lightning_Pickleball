import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Avatar,
  Button,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useLocation } from '../../contexts/LocationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { theme } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { AnimatedFAB } from '../../components/common/AnimatedFAB';

// 🎯 [KIM FIX] ClubListScreen navigation type - using RootStackParamList for cross-stack navigation
type ClubListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Club {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  skillLevel: 'all' | 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
  distance: number;
  meetingSchedule: string[];
  clubType: 'casual' | 'competitive' | 'social';
  location: {
    city: string;
    district: string;
  };
  joinFee?: number;
  monthlyFee?: number;
}

export default function ClubListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'nearby' | 'joined'>('all');

  const navigation = useNavigation<ClubListScreenNavigationProp>();
  const { location, getCurrentLocation } = useLocation();
  const { t } = useLanguage();

  const loadClubs = useCallback(async () => {
    try {
      // 위치 정보 업데이트
      if (!location) {
        await getCurrentLocation();
      }

      // Mock data - 실제 구현에서는 API 호출
      const mockClubs: Club[] = [
        {
          id: '1',
          name: '서울 중앙 피클볼 클럽',
          description: '다양한 레벨의 회원들과 함께하는 활발한 피클볼 클럽입니다.',
          memberCount: 45,
          maxMembers: 60,
          skillLevel: 'all',
          isActive: true,
          distance: 1.5,
          meetingSchedule: ['토요일 오후', '일요일 오전'],
          clubType: 'casual',
          location: {
            city: '서울',
            district: '강남구',
          },
          joinFee: 50000,
          monthlyFee: 20000,
        },
        {
          id: '2',
          name: '한강 피클볼 동호회',
          description: '한강공원에서 정기 모임을 갖는 친목 중심의 클럽입니다.',
          memberCount: 32,
          maxMembers: 40,
          skillLevel: 'beginner',
          isActive: true,
          distance: 3.2,
          meetingSchedule: ['일요일 오후'],
          clubType: 'social',
          location: {
            city: '서울',
            district: '영등포구',
          },
        },
        {
          id: '3',
          name: '프로 피클볼 아카데미',
          description: '경쟁적인 환경에서 실력 향상을 목표로 하는 클럽입니다.',
          memberCount: 28,
          maxMembers: 35,
          skillLevel: 'advanced',
          isActive: true,
          distance: 5.8,
          meetingSchedule: ['화요일 저녁', '목요일 저녁', '토요일 오전'],
          clubType: 'competitive',
          location: {
            city: '서울',
            district: '서초구',
          },
          joinFee: 100000,
          monthlyFee: 50000,
        },
        {
          id: '4',
          name: '올림픽공원 피클볼 모임',
          description: '올림픽공원에서 즐기는 캐주얼한 피클볼 모임입니다.',
          memberCount: 18,
          maxMembers: 25,
          skillLevel: 'intermediate',
          isActive: true,
          distance: 2.1,
          meetingSchedule: ['수요일 저녁', '주말'],
          clubType: 'casual',
          location: {
            city: '서울',
            district: '송파구',
          },
          monthlyFee: 15000,
        },
      ];

      setClubs(mockClubs);
    } catch (error) {
      console.error('Error loading clubs:', error);
    }
  }, [location, getCurrentLocation]);

  const filterClubs = useCallback(() => {
    let filtered = clubs;

    // 텍스트 검색
    if (searchQuery) {
      filtered = filtered.filter(
        club =>
          club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          club.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 필터 적용
    if (filter === 'nearby') {
      filtered = filtered.filter(club => club.distance <= 5);
    } else if (filter === 'joined') {
      // 실제로는 사용자가 가입한 클럽만 필터링
      filtered = filtered.filter(club => club.id === '1'); // Mock
    }

    // 거리순 정렬
    filtered = filtered.sort((a, b) => a.distance - b.distance);

    setFilteredClubs(filtered);
  }, [clubs, searchQuery, filter]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  useEffect(() => {
    filterClubs();
  }, [filterClubs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubs();
    setRefreshing(false);
  };

  const getSkillLevelText = (level: string): string => {
    switch (level) {
      case 'beginner':
        return t('clubList.skillLevel.beginner');
      case 'intermediate':
        return t('clubList.skillLevel.intermediate');
      case 'advanced':
        return t('clubList.skillLevel.advanced');
      default:
        return t('clubList.skillLevel.all');
    }
  };

  const getSkillLevelColor = (level: string): string => {
    switch (level) {
      case 'beginner':
        return theme.colors.success;
      case 'intermediate':
        return theme.colors.primary;
      case 'advanced':
        return theme.colors.error;
      default:
        return theme.colors.onSurface;
    }
  };

  const getClubTypeText = (type: string): string => {
    switch (type) {
      case 'casual':
        return t('clubList.clubType.casual');
      case 'competitive':
        return t('clubList.clubType.competitive');
      case 'social':
        return t('clubList.clubType.social');
      default:
        return type;
    }
  };

  const renderClubCard = ({ item: club }: { item: Club }) => (
    <Card
      style={styles.clubCard}
      /* eslint-disable @typescript-eslint/no-explicit-any */
      onPress={() => navigation.navigate('ClubDetail' as any, { clubId: club.id })}
      /* eslint-enable @typescript-eslint/no-explicit-any */
    >
      <Card.Content>
        <View style={styles.clubHeader}>
          <View style={styles.clubInfo}>
            <Avatar.Icon
              size={48}
              icon='pickleballball'
              style={[styles.clubAvatar, { backgroundColor: getSkillLevelColor(club.skillLevel) }]}
            />
            <View style={styles.clubDetails}>
              <Title style={styles.clubName}>{club.name}</Title>
              <View style={styles.clubMeta}>
                <Ionicons name='people' size={14} color={theme.colors.onSurface} />
                <Paragraph style={styles.memberCount}>
                  {club.memberCount}/{club.maxMembers}
                  {t('clubList.peopleCount')}
                </Paragraph>
                <Paragraph style={styles.distance}>• {club.distance}km</Paragraph>
              </View>
            </View>
          </View>

          <View style={styles.clubBadges}>
            <Chip
              compact
              style={[
                styles.skillChip,
                { backgroundColor: getSkillLevelColor(club.skillLevel) + '20' },
              ]}
              textStyle={{
                color: getSkillLevelColor(club.skillLevel),
                fontSize: 10,
              }}
            >
              {getSkillLevelText(club.skillLevel)}
            </Chip>
          </View>
        </View>

        <Paragraph style={styles.clubDescription} numberOfLines={2}>
          {club.description}
        </Paragraph>

        <View style={styles.clubAttributes}>
          <View style={styles.attributeRow}>
            <Ionicons name='location' size={14} color={theme.colors.primary} />
            <Paragraph style={styles.attributeText}>
              {club.location.city} {club.location.district}
            </Paragraph>
          </View>

          <View style={styles.attributeRow}>
            <Ionicons name='time' size={14} color={theme.colors.primary} />
            <Paragraph style={styles.attributeText}>{club.meetingSchedule.join(', ')}</Paragraph>
          </View>

          <View style={styles.attributeRow}>
            <Ionicons name='trophy' size={14} color={theme.colors.primary} />
            <Paragraph style={styles.attributeText}>{getClubTypeText(club.clubType)}</Paragraph>
          </View>
        </View>

        {(club.joinFee || club.monthlyFee) && (
          <View style={styles.feeInfo}>
            {club.joinFee && (
              <Chip compact style={styles.feeChip}>
                {t('clubList.fees.joinFee')} ${club.joinFee.toLocaleString()}
              </Chip>
            )}
            {club.monthlyFee && (
              <Chip compact style={styles.feeChip}>
                {t('clubList.fees.monthlyFee')} ${club.monthlyFee.toLocaleString()}
              </Chip>
            )}
          </View>
        )}

        <View style={styles.clubActions}>
          <Button
            mode='outlined'
            compact
            onPress={() => {
              /* 즐겨찾기 */
            }}
          >
            {t('clubList.actions.favorite')}
          </Button>
          <Button
            mode='contained'
            compact
            /* eslint-disable @typescript-eslint/no-explicit-any */
            onPress={() => navigation.navigate('ClubDetail' as any, { clubId: club.id })}
            /* eslint-enable @typescript-eslint/no-explicit-any */
          >
            {t('clubList.actions.viewDetails')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name='people-outline' size={64} color={theme.colors.onSurface} />
      <Title style={styles.emptyTitle}>
        {filter === 'joined'
          ? t('clubList.emptyState.noJoinedClubs')
          : searchQuery
            ? t('clubList.emptyState.noSearchResults')
            : t('clubList.emptyState.noNearbyClubs')}
      </Title>
      <Paragraph style={styles.emptyText}>
        {filter === 'joined'
          ? t('clubList.emptyState.joinNewClub')
          : searchQuery
            ? t('clubList.emptyState.tryDifferentSearch')
            : t('clubList.emptyState.createNewClub')}
      </Paragraph>
      {filter !== 'joined' && (
        <Button
          mode='contained'
          /* eslint-disable @typescript-eslint/no-explicit-any */
          onPress={() => navigation.navigate('CreateClub' as any)}
          /* eslint-enable @typescript-eslint/no-explicit-any */
          style={styles.createButton}
        >
          {t('clubList.actions.createClub')}
        </Button>
      )}
    </View>
  );

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const createFAB = (
    <AnimatedFAB
      {...({ style: styles.fab, icon: 'plus', label: t('clubList.actions.createClub') } as any)}
      onPress={() => navigation.navigate('CreateClub' as any)}
    />
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder={t('clubList.searchPlaceholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <SegmentedButtons
          value={filter}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onValueChange={value => setFilter(value as any)}
          buttons={[
            { value: 'all', label: t('clubList.filters.all') },
            { value: 'nearby', label: t('clubList.filters.nearby') },
            { value: 'joined', label: t('clubList.filters.joined') },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList
        data={filteredClubs}
        keyExtractor={item => item.id}
        renderItem={renderClubCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {createFAB}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBar: {
    marginBottom: theme.spacing.md,
  },
  segmentedButtons: {
    // 세그먼트 버튼 스타일
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  clubCard: {
    marginBottom: theme.spacing.md,
  },
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  clubInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  clubAvatar: {
    marginRight: theme.spacing.md,
  },
  clubDetails: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    marginBottom: 4,
  },
  clubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  distance: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  clubBadges: {
    alignItems: 'flex-end',
  },
  skillChip: {
    height: 24,
  },
  clubDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
    opacity: 0.8,
  },
  clubAttributes: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  attributeText: {
    fontSize: 12,
    opacity: 0.7,
  },
  feeInfo: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  feeChip: {
    backgroundColor: theme.colors.warning + '20',
  },
  clubActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: theme.spacing.lg,
  },
  createButton: {
    marginTop: theme.spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
