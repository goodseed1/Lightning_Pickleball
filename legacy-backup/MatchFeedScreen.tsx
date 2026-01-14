import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  ActivityIndicator,
  FAB,
  Chip,
  Avatar,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// @ts-ignore - legacy file, module paths may not resolve
import { theme } from '../theme';
// @ts-ignore - legacy file, module paths may not resolve
import { useAuth } from '../contexts/AuthContext';
// @ts-ignore - legacy file, module paths may not resolve
import { useLanguage } from '../contexts/LanguageContext';
// @ts-ignore - legacy file, module paths may not resolve
import eventService from '../services/eventService';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  type: 'rankedMatch' | 'casualMeetup';
  maxParticipants: number;
  participants: string[];
  waitingList: string[];
  status: string;
  isPublic: boolean;
  minNTRP?: number;
  maxNTRP?: number;
  isRanked: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  creatorInfo?: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export default function MatchFeedScreen() {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'rankedMatch' | 'casualMeetup'>('all');

  // Load events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const loadEvents = async () => {
    try {
      setLoading(true);
      const filters = filter === 'all' ? {} : { type: filter };
      const eventsData = await eventService.getAllEvents(filters);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('오류', '이벤트를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleJoinEvent = async (event: Event) => {
    if (!currentUser?.uid) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    if (event.participants.includes(currentUser.uid)) {
      Alert.alert('알림', '이미 참가한 이벤트입니다.');
      return;
    }

    if (event.createdBy === currentUser.uid) {
      Alert.alert('알림', '본인이 만든 이벤트입니다.');
      return;
    }

    try {
      setJoinLoading(event.id);
      const result = await eventService.joinEvent(event.id, currentUser.uid);

      if (result.status === 'joined') {
        Alert.alert('성공', '이벤트에 참가했습니다!');
      } else if (result.status === 'waitlisted') {
        Alert.alert('대기 등록', '인원이 초과되어 대기 명단에 등록되었습니다.');
      }

      // Refresh events to show updated participant list
      await loadEvents();
    } catch (error) {
      console.error('Error joining event:', error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Alert.alert('오류', (error as any).message || '참가 신청 중 오류가 발생했습니다.');
    } finally {
      setJoinLoading(null);
    }
  };

  const handleEventDetail = (event: Event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('EventDetail', { eventId: event.id });
  };

  const handleCreateMatch = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('CreateMatch');
  };

  const getEventTypeInfo = (type: string) => {
    switch (type) {
      case 'rankedMatch':
        return {
          icon: '🏆',
          label: currentLanguage === 'ko' ? '번개 매치' : 'Ranked Match',
          color: '#ff6b35',
          bgColor: '#fff3f0',
        };
      case 'casualMeetup':
        return {
          icon: '😊',
          label: currentLanguage === 'ko' ? '번개 모임' : 'Casual Meetup',
          color: '#4caf50',
          bgColor: '#f1f8e9',
        };
      default:
        return {
          icon: '🎾',
          label: 'Event',
          color: '#666',
          bgColor: '#f5f5f5',
        };
    }
  };

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow =
      date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    if (isToday) {
      return `오늘 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `내일 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const isEventFull = (event: Event) => {
    return event.participants.length >= event.maxParticipants;
  };

  const canJoinEvent = (event: Event) => {
    if (!currentUser?.uid) return false;
    if (event.createdBy === currentUser.uid) return false;
    if (event.participants.includes(currentUser.uid)) return false;
    return true;
  };

  const renderEventItem = ({ item: event }: { item: Event }) => {
    const typeInfo = getEventTypeInfo(event.type);
    const isFull = isEventFull(event);
    const canJoin = canJoinEvent(event);
    const isJoined = event.participants.includes(currentUser?.uid || '');

    return (
      <Card style={styles.eventCard}>
        <TouchableOpacity onPress={() => handleEventDetail(event)} activeOpacity={0.7}>
          <View style={styles.eventContent}>
            {/* Event Header */}
            <View style={styles.eventHeader}>
              <View style={styles.eventTypeContainer}>
                <View style={[styles.eventTypeChip, { backgroundColor: typeInfo.bgColor }]}>
                  <Text style={styles.eventTypeIcon}>{typeInfo.icon}</Text>
                  <Text style={[styles.eventTypeText, { color: typeInfo.color }]}>
                    {typeInfo.label}
                  </Text>
                </View>
                {event.isRanked && event.minNTRP && event.maxNTRP && (
                  <Chip compact style={styles.ntrpChip} textStyle={styles.ntrpText}>
                    NTRP {event.minNTRP}-{event.maxNTRP}
                  </Chip>
                )}
              </View>

              <IconButton
                icon='dots-vertical'
                size={20}
                onPress={() => {}}
                style={styles.menuButton}
              />
            </View>

            {/* Event Title */}
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>

            {/* Event Info */}
            <View style={styles.eventInfo}>
              <View style={styles.eventInfoRow}>
                <Ionicons name='time-outline' size={16} color='#666' />
                <Text style={styles.eventInfoText}>{formatDateTime(event.startTime)}</Text>
              </View>

              <View style={styles.eventInfoRow}>
                <Ionicons name='location-outline' size={16} color='#666' />
                <Text style={styles.eventInfoText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>

              <View style={styles.eventInfoRow}>
                <Ionicons name='people-outline' size={16} color='#666' />
                <Text style={[styles.eventInfoText, isFull && styles.fullParticipants]}>
                  {event.participants.length}/{event.maxParticipants}명
                  {event.waitingList.length > 0 && ` (대기 ${event.waitingList.length}명)`}
                </Text>
              </View>
            </View>

            {/* Creator Info */}
            <View style={styles.creatorInfo}>
              <Avatar.Text
                size={32}
                label={event.creatorInfo?.name?.charAt(0) || 'U'}
                style={styles.creatorAvatar}
              />
              <Text style={styles.creatorName}>{event.creatorInfo?.name || 'Unknown'}</Text>
            </View>

            {/* Description Preview */}
            {event.description && (
              <Text style={styles.eventDescription} numberOfLines={2}>
                {event.description}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.eventActions}>
          <Button
            mode='outlined'
            onPress={() => handleEventDetail(event)}
            style={styles.detailButton}
            compact
          >
            상세보기
          </Button>

          {isJoined ? (
            <Button
              mode='contained'
              disabled
              style={[styles.joinButton, styles.joinedButton]}
              compact
            >
              참가 완료
            </Button>
          ) : canJoin ? (
            <Button
              mode='contained'
              onPress={() => handleJoinEvent(event)}
              loading={joinLoading === event.id}
              disabled={joinLoading === event.id || isFull}
              style={[styles.joinButton, isFull && styles.fullButton]}
              compact
            >
              {isFull ? '인원 마감' : '참가하기'}
            </Button>
          ) : (
            <Button mode='outlined' disabled style={styles.joinButton} compact>
              {event.createdBy === currentUser?.uid ? '내 이벤트' : '참가 불가'}
            </Button>
          )}
        </View>
      </Card>
    );
  };

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterChip, filter === 'all' && styles.activeFilterChip]}
        onPress={() => setFilter('all')}
      >
        <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>전체</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterChip, filter === 'rankedMatch' && styles.activeFilterChip]}
        onPress={() => setFilter('rankedMatch')}
      >
        <Text style={[styles.filterText, filter === 'rankedMatch' && styles.activeFilterText]}>
          🏆 번개 매치
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterChip, filter === 'casualMeetup' && styles.activeFilterChip]}
        onPress={() => setFilter('casualMeetup')}
      >
        <Text style={[styles.filterText, filter === 'casualMeetup' && styles.activeFilterText]}>
          😊 번개 모임
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Title style={styles.title}>⚡ 번개 매칭</Title>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>매칭 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>⚡ 번개 매칭</Title>
        <Text style={styles.subtitle}>실시간 테니스 파트너 찾기</Text>
      </View>

      {renderFilterChips()}

      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name='calendar-outline' size={64} color='#ccc' />
            <Text style={styles.emptyTitle}>
              {filter === 'all'
                ? '등록된 매칭이 없습니다'
                : filter === 'rankedMatch'
                  ? '등록된 번개 매치가 없습니다'
                  : '등록된 번개 모임이 없습니다'}
            </Text>
            <Text style={styles.emptyDescription}>
              새로운 매칭을 만들어 테니스 파트너를 찾아보세요!
            </Text>
            <Button mode='contained' onPress={handleCreateMatch} style={styles.emptyAction}>
              첫 번째 매칭 만들기
            </Button>
          </View>
        }
      />

      <FAB icon='plus' style={styles.fab} onPress={handleCreateMatch} label='새 매칭' />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
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
  eventCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  eventTypeIcon: {
    fontSize: 14,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ntrpChip: {
    backgroundColor: '#e3f2fd',
    height: 28,
  },
  ntrpText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '600',
  },
  menuButton: {
    margin: 0,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    lineHeight: 24,
  },
  eventInfo: {
    gap: 6,
    marginBottom: 12,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventInfoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  fullParticipants: {
    color: '#f44336',
    fontWeight: '600',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  creatorAvatar: {
    backgroundColor: theme.colors.primary,
  },
  creatorName: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 18,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailButton: {
    flex: 1,
  },
  joinButton: {
    flex: 1,
  },
  joinedButton: {
    backgroundColor: '#4caf50',
  },
  fullButton: {
    backgroundColor: '#f44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
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
    lineHeight: 20,
    marginBottom: 32,
  },
  emptyAction: {
    minWidth: 200,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
