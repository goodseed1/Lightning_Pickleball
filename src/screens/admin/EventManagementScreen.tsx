/**
 * 📅 Event Management Screen
 * 이벤트 관리 - 전체 이벤트 목록 조회 및 관리
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
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Event {
  id: string;
  title: string;
  description?: string;
  clubId?: string;
  clubName?: string;
  startDate?: Date;
  endDate?: Date;
  participantCount: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

const EventManagementScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(
        event =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.clubName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);

  const loadEvents = async () => {
    try {
      const eventsQuery = query(collection(db, 'events'), orderBy('scheduledTime', 'desc'));
      const eventsSnapshot = await getDocs(eventsQuery);

      const eventsData = eventsSnapshot.docs.map(doc => {
        const data = doc.data();
        const now = new Date();
        // Helper to safely convert Firestore Timestamp or date string to Date
        const toDate = (value: unknown): Date | undefined => {
          if (!value) return undefined;
          if (
            typeof value === 'object' &&
            'toDate' in value &&
            typeof (value as { toDate: () => Date }).toDate === 'function'
          ) {
            return (value as { toDate: () => Date }).toDate();
          }
          if (value instanceof Date) return value;
          if (typeof value === 'string' || typeof value === 'number') {
            const parsed = new Date(value);
            return isNaN(parsed.getTime()) ? undefined : parsed;
          }
          return undefined;
        };
        const startDate = toDate(data.scheduledTime) || toDate(data.startDate) || toDate(data.date);
        const endDate =
          toDate(data.endDate) ||
          (data.duration && startDate
            ? new Date(startDate.getTime() + data.duration * 60000)
            : undefined);

        let status: Event['status'] = 'upcoming';
        if (data.cancelled) {
          status = 'cancelled';
        } else if (endDate && endDate < now) {
          status = 'completed';
        } else if (startDate && startDate <= now && (!endDate || endDate >= now)) {
          status = 'ongoing';
        }

        return {
          id: doc.id,
          title: data.title || data.name || 'Unknown Event',
          description: data.description,
          clubId: data.clubId,
          clubName: data.clubName,
          startDate,
          endDate,
          participantCount: data.participants?.length || data.participantCount || 0,
          status,
        };
      });

      setEvents(eventsData);
      setFilteredEvents(eventsData);
    } catch (error) {
      console.error('[EventManagement] Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return '#2196f3';
      case 'ongoing':
        return '#4caf50';
      case 'completed':
        return '#9e9e9e';
      case 'cancelled':
        return '#f44336';
      default:
        return colors.primary;
    }
  };

  const getStatusLabel = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return t('admin.eventManagement.upcoming', '예정');
      case 'ongoing':
        return t('admin.eventManagement.ongoing', '진행중');
      case 'completed':
        return t('admin.eventManagement.completed', '완료');
      case 'cancelled':
        return t('admin.eventManagement.cancelled', '취소됨');
      default:
        return status;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatsByStatus = () => {
    const upcoming = events.filter(e => e.status === 'upcoming').length;
    const ongoing = events.filter(e => e.status === 'ongoing').length;
    const completed = events.filter(e => e.status === 'completed').length;
    return { upcoming, ongoing, completed };
  };

  const stats = getStatsByStatus();

  if (loading) {
    return (
      <>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('admin.eventManagement.title', '이벤트 관리')} />
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
        <Appbar.Content title={t('admin.eventManagement.title', '이벤트 관리')} />
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
                <Text style={{ fontSize: 28 }}>📅</Text>
                <Text style={[styles.summaryValue, { color: '#2196f3' }]}>{stats.upcoming}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                  {t('admin.eventManagement.upcoming', '예정')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={{ fontSize: 28 }}>🎯</Text>
                <Text style={[styles.summaryValue, { color: '#4caf50' }]}>{stats.ongoing}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                  {t('admin.eventManagement.ongoing', '진행중')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={{ fontSize: 28 }}>✅</Text>
                <Text style={[styles.summaryValue, { color: '#9e9e9e' }]}>{stats.completed}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                  {t('admin.eventManagement.completed', '완료')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Search */}
        <Searchbar
          placeholder={t('admin.eventManagement.searchPlaceholder', '이벤트 이름으로 검색...')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
        />

        {/* Event List */}
        <Card
          style={[
            styles.listCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Card.Content>
            {filteredEvents.length === 0 ? (
              <Text style={{ color: colors.onSurfaceVariant, textAlign: 'center', padding: 20 }}>
                {searchQuery
                  ? t('admin.eventManagement.noResults', '검색 결과가 없습니다')
                  : t('admin.eventManagement.noEvents', '등록된 이벤트가 없습니다')}
              </Text>
            ) : (
              filteredEvents.map((event, index) => (
                <View key={event.id}>
                  <TouchableOpacity
                    style={styles.eventItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      // TODO: Navigate to event detail when implemented
                      console.log('[EventManagement] Event pressed:', event.id);
                    }}
                  >
                    <View style={styles.eventInfo}>
                      <View style={styles.eventHeader}>
                        <Text style={[styles.eventTitle, { color: colors.onSurface }]}>
                          {event.title}
                        </Text>
                        <Chip
                          compact
                          style={[
                            styles.statusChip,
                            { backgroundColor: getStatusColor(event.status) },
                          ]}
                          textStyle={{ color: '#fff', fontSize: 10 }}
                        >
                          {getStatusLabel(event.status)}
                        </Chip>
                      </View>
                      {event.clubName && (
                        <Text style={[styles.eventClub, { color: colors.onSurfaceVariant }]}>
                          🎾 {event.clubName}
                        </Text>
                      )}
                      {event.startDate && (
                        <Text style={[styles.eventDate, { color: colors.onSurfaceVariant }]}>
                          📆 {formatDate(event.startDate)}
                          {event.endDate && ` ~ ${formatDate(event.endDate)}`}
                        </Text>
                      )}
                      {event.description && (
                        <Text
                          style={[styles.eventDescription, { color: colors.onSurfaceVariant }]}
                          numberOfLines={1}
                        >
                          {event.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.eventMeta}>
                      <Chip compact style={styles.participantChip}>
                        {event.participantCount} {t('admin.eventManagement.participants', '명')}
                      </Chip>
                    </View>
                  </TouchableOpacity>
                  {index < filteredEvents.length - 1 && <Divider style={styles.divider} />}
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
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 20,
  },
  eventClub: {
    fontSize: 12,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 12,
  },
  eventMeta: {
    alignItems: 'flex-end',
  },
  participantChip: {
    height: 24,
  },
  divider: {
    marginVertical: 4,
  },
  bottomPadding: {
    height: 32,
  },
});

export default EventManagementScreen;
