/**
 * League List Page Component
 * Browse and join tennis leagues
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import leagueService from '../../services/leagueService';
import { useLanguage } from '../../contexts/LanguageContext';

interface League {
  id: string;
  name: string;
  description: string;
  season: string;
  region: string;
  format: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startDate: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  endDate: any;
  registrationDeadline: unknown;
  status: string;
  totalPlayers: number;
  divisions: unknown[];
  divisionsConfig: {
    maxPlayersPerDivision: number;
  };
}

const LeagueListPage = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [_selectedRegion] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    loadLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_selectedRegion, selectedStatus]);

  const loadLeagues = async () => {
    try {
      setLoading(true);
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const fetchedLeagues = await (leagueService as any).getActiveLeagues(
        _selectedRegion === 'all' ? null : _selectedRegion
      );
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // Filter by status
      let filtered = fetchedLeagues;
      if (selectedStatus === 'registration') {
        filtered = fetchedLeagues.filter((l: League) => l.status === 'registration');
      } else if (selectedStatus === 'in_progress') {
        filtered = fetchedLeagues.filter((l: League) => l.status === 'in_progress');
      }

      setLeagues(filtered);
    } catch (error) {
      console.error('Failed to load leagues:', error);
      Alert.alert(t('alert.title.error'), t('alert.league.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeagues();
    setRefreshing(false);
  };

  const handleJoinLeague = async (league: League) => {
    Alert.alert(t('league.joinTitle'), t('league.joinConfirm', { name: league.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.join'),
        onPress: async () => {
          try {
            setJoiningId(league.id);
            /* eslint-disable @typescript-eslint/no-explicit-any */
            await (leagueService as any).registerForLeague(league.id, {} as any);
            /* eslint-enable @typescript-eslint/no-explicit-any */
            Alert.alert(t('alert.title.success'), t('alert.league.joinSuccess'));
            loadLeagues(); // Refresh list
          } catch (error: Error | unknown) {
            const errorMessage =
              error instanceof Error ? error.message : t('alert.league.joinFailed');
            Alert.alert(t('alert.title.error'), errorMessage);
          } finally {
            setJoiningId(null);
          }
        },
      },
    ]);
  };

  const handleViewLeague = (league: League) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (navigation as any).navigate('LeagueDetail', { leagueId: league.id });
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'playoffs':
        return '#FF9800';
      case 'completed':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'registration':
        return 'Open for Registration';
      case 'in_progress':
        return 'In Progress';
      case 'playoffs':
        return 'Playoffs';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const calculateSpotsLeft = (league: League) => {
    const maxSpots = league.divisionsConfig.maxPlayersPerDivision * 5; // Assume max 5 divisions
    return Math.max(0, maxSpots - league.totalPlayers);
  };

  const renderLeagueCard = (league: League) => (
    <TouchableOpacity
      key={league.id}
      style={styles.leagueCard}
      onPress={() => handleViewLeague(league)}
      activeOpacity={0.7}
    >
      <View style={styles.leagueHeader}>
        <View style={styles.leagueInfo}>
          <Text style={styles.leagueName}>{league.name}</Text>
          <Text style={styles.leagueSeason}>{league.season}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(league.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(league.status)}</Text>
        </View>
      </View>

      <Text style={styles.leagueDescription} numberOfLines={2}>
        {league.description}
      </Text>

      <View style={styles.leagueDetails}>
        <View style={styles.detailItem}>
          <Ionicons name='location' size={14} color='#666' />
          <Text style={styles.detailText}>{league.region}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name='trophy' size={14} color='#666' />
          <Text style={styles.detailText}>{league.format.replace('_', ' ')}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name='people' size={14} color='#666' />
          <Text style={styles.detailText}>{league.totalPlayers} players</Text>
        </View>
      </View>

      <View style={styles.dateSection}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Start Date</Text>
          <Text style={styles.dateValue}>{formatDate(league.startDate)}</Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Registration Deadline</Text>
          <Text style={styles.dateValue}>{formatDate(league.registrationDeadline)}</Text>
        </View>
      </View>

      {league.status === 'registration' && (
        <View style={styles.actionSection}>
          <View style={styles.spotsInfo}>
            <Text style={styles.spotsText}>{calculateSpotsLeft(league)} spots left</Text>
          </View>
          <TouchableOpacity
            style={[styles.joinButton, joiningId === league.id && styles.joinButtonDisabled]}
            onPress={() => handleJoinLeague(league)}
            disabled={joiningId === league.id}
          >
            {joiningId === league.id ? (
              <ActivityIndicator size='small' color='white' />
            ) : (
              <Text style={styles.joinButtonText}>Join League</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tennis Leagues</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            (navigation as any).navigate('CreateLeague');
            /* eslint-enable @typescript-eslint/no-explicit-any */
          }}
        >
          <Ionicons name='add-circle' size={24} color='#2196F3' />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name='search' size={20} color='#666' />
          <TextInput
            style={styles.searchInput}
            placeholder='Search leagues...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType='search'
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedStatus === 'active' && styles.activeFilterChip]}
            onPress={() => setSelectedStatus('active')}
          >
            <Text
              style={[styles.filterText, selectedStatus === 'active' && styles.activeFilterText]}
            >
              All Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedStatus === 'registration' && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedStatus('registration')}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === 'registration' && styles.activeFilterText,
              ]}
            >
              Open Registration
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedStatus === 'in_progress' && styles.activeFilterChip]}
            onPress={() => setSelectedStatus('in_progress')}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === 'in_progress' && styles.activeFilterText,
              ]}
            >
              In Progress
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* League List */}
      <ScrollView
        style={styles.leagueList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor='#2196F3' />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading leagues...</Text>
          </View>
        ) : leagues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='trophy-outline' size={64} color='#ccc' />
            <Text style={styles.emptyTitle}>No leagues found</Text>
            <Text style={styles.emptyDescription}>
              Be the first to create a league in your area!
            </Text>
          </View>
        ) : (
          leagues.map(league => renderLeagueCard(league))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  createButton: {
    padding: 4,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  filterSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  leagueList: {
    flex: 1,
  },
  leagueCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  leagueSeason: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  leagueDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  leagueDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  spotsInfo: {
    flex: 1,
  },
  spotsText: {
    fontSize: 14,
    color: '#FF5722',
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
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
    paddingHorizontal: 40,
  },
});

export default LeagueListPage;
