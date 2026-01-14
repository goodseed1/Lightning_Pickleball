/**
 * Tournament List Page Component
 * Browse and join pickleball tournaments
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import tournamentService from '../../services/tournamentService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatPriceByCountry } from '../../utils/currencyUtils';

interface Tournament {
  id: string;
  name: string;
  description: string;
  location: string;
  format: string;
  drawSize: number;
  startDate: Date | string;
  registrationDeadline: Date | string;
  status: string;
  entries: unknown[];
  maxEntries: number;
  entryFee: number;
  prizes: {
    champion: string;
    runnerUp: string;
  };
  categories: string[];
  matchFormat: {
    sets: number;
    tiebreak: boolean;
  };
}

const TournamentListPage = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const userCountry = currentUser?.profile?.location?.country;
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('all');

  const loadTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        format: selectedFormat === 'all' ? null : selectedFormat,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fetchedTournaments = await (tournamentService as any).getUpcomingTournaments(filters);
      setTournaments(fetchedTournaments);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      Alert.alert(t('alert.title.error'), t('alert.tournament.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [selectedFormat]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  };

  const handleJoinTournament = async (tournament: Tournament) => {
    if (tournament.entryFee > 0) {
      Alert.alert(
        'Entry Fee Required',
        `This tournament has an entry fee of ${formatPriceByCountry(tournament.entryFee, userCountry)}. Proceed to registration?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => registerForTournament(tournament),
          },
        ]
      );
    } else {
      registerForTournament(tournament);
    }
  };

  const registerForTournament = async (tournament: Tournament) => {
    try {
      setRegisteringId(tournament.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tournamentService.registerForTournament(tournament.id, 'user-id-placeholder' as any);
      Alert.alert(t('alert.title.success'), t('alert.tournament.registerSuccess'));
      loadTournaments(); // Refresh list
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('alert.tournament.registerFailed');
      Alert.alert(t('alert.title.error'), errorMessage);
    } finally {
      setRegisteringId(null);
    }
  };

  const handleViewTournament = (tournament: Tournament) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation.navigate as any)('TournamentDetail', { tournamentId: tournament.id });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'single_elimination':
        return 'git-branch';
      case 'double_elimination':
        return 'git-network';
      case 'round_robin':
        return 'refresh';
      case 'swiss':
        return 'grid';
      default:
        return 'trophy';
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'single_elimination':
        return 'Single Elimination';
      case 'double_elimination':
        return 'Double Elimination';
      case 'round_robin':
        return 'Round Robin';
      case 'swiss':
        return 'Swiss System';
      default:
        return format;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const calculateSpotsLeft = (tournament: Tournament) => {
    return Math.max(0, tournament.maxEntries - tournament.entries.length);
  };

  const renderTournamentCard = (tournament: Tournament) => (
    <TouchableOpacity
      key={tournament.id}
      style={styles.tournamentCard}
      onPress={() => handleViewTournament(tournament)}
      activeOpacity={0.7}
    >
      <View style={styles.tournamentHeader}>
        <View style={styles.tournamentInfo}>
          <Text style={styles.tournamentName}>{tournament.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name='location' size={14} color='#666' />
            <Text style={styles.locationText}>{tournament.location}</Text>
          </View>
        </View>
        <View style={styles.formatBadge}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Ionicons name={getFormatIcon(tournament.format) as any} size={20} color='#2196F3' />
        </View>
      </View>

      <Text style={styles.tournamentDescription} numberOfLines={2}>
        {tournament.description}
      </Text>

      <View style={styles.tournamentDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Format</Text>
            <Text style={styles.detailValue}>{getFormatLabel(tournament.format)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Draw Size</Text>
            <Text style={styles.detailValue}>{tournament.drawSize} players</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Match Format</Text>
            <Text style={styles.detailValue}>Best of {tournament.matchFormat.sets}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Entry Fee</Text>
            <Text style={styles.detailValue}>
              {tournament.entryFee > 0
                ? formatPriceByCountry(tournament.entryFee, userCountry)
                : 'Free'}
            </Text>
          </View>
        </View>
      </View>

      {/* Prizes Section */}
      {(tournament.prizes.champion || tournament.prizes.runnerUp) && (
        <View style={styles.prizesSection}>
          <Text style={styles.prizesTitle}>Prizes</Text>
          <View style={styles.prizesList}>
            {tournament.prizes.champion && (
              <View style={styles.prizeItem}>
                <Ionicons name='trophy' size={16} color='#FFD700' />
                <Text style={styles.prizeText}>{tournament.prizes.champion}</Text>
              </View>
            )}
            {tournament.prizes.runnerUp && (
              <View style={styles.prizeItem}>
                <Ionicons name='medal' size={16} color='#C0C0C0' />
                <Text style={styles.prizeText}>{tournament.prizes.runnerUp}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.dateSection}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Tournament Date</Text>
          <Text style={styles.dateValue}>{formatDate(tournament.startDate)}</Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Registration Deadline</Text>
          <Text style={styles.dateValue}>{formatDate(tournament.registrationDeadline)}</Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        <View style={styles.participantsInfo}>
          <View style={styles.participantsRow}>
            <Ionicons name='people' size={16} color='#666' />
            <Text style={styles.participantsText}>
              {tournament.entries.length}/{tournament.maxEntries} players
            </Text>
          </View>
          {calculateSpotsLeft(tournament) > 0 && (
            <Text style={styles.spotsText}>{calculateSpotsLeft(tournament)} spots left</Text>
          )}
        </View>

        {tournament.status === 'registration' && calculateSpotsLeft(tournament) > 0 && (
          <TouchableOpacity
            style={[
              styles.joinButton,
              registeringId === tournament.id && styles.joinButtonDisabled,
            ]}
            onPress={() => handleJoinTournament(tournament)}
            disabled={registeringId === tournament.id}
          >
            {registeringId === tournament.id ? (
              <ActivityIndicator size='small' color='white' />
            ) : (
              <Text style={styles.joinButtonText}>Register</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pickleball Tournaments</Text>
        <TouchableOpacity
          style={styles.createButton}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => (navigation.navigate as any)('CreateTournament')}
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
            placeholder='Search tournaments...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType='search'
          />
        </View>
      </View>

      {/* Format Filters */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFormat === 'all' && styles.activeFilterChip]}
            onPress={() => setSelectedFormat('all')}
          >
            <Text style={[styles.filterText, selectedFormat === 'all' && styles.activeFilterText]}>
              All Formats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFormat === 'single_elimination' && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedFormat('single_elimination')}
          >
            <Ionicons
              name='git-branch'
              size={14}
              color={selectedFormat === 'single_elimination' ? 'white' : '#666'}
            />
            <Text
              style={[
                styles.filterText,
                selectedFormat === 'single_elimination' && styles.activeFilterText,
              ]}
            >
              Single Elim
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFormat === 'double_elimination' && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedFormat('double_elimination')}
          >
            <Ionicons
              name='git-network'
              size={14}
              color={selectedFormat === 'double_elimination' ? 'white' : '#666'}
            />
            <Text
              style={[
                styles.filterText,
                selectedFormat === 'double_elimination' && styles.activeFilterText,
              ]}
            >
              Double Elim
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFormat === 'round_robin' && styles.activeFilterChip]}
            onPress={() => setSelectedFormat('round_robin')}
          >
            <Ionicons
              name='refresh'
              size={14}
              color={selectedFormat === 'round_robin' ? 'white' : '#666'}
            />
            <Text
              style={[
                styles.filterText,
                selectedFormat === 'round_robin' && styles.activeFilterText,
              ]}
            >
              Round Robin
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tournament List */}
      <ScrollView
        style={styles.tournamentList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor='#2196F3' />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading tournaments...</Text>
          </View>
        ) : tournaments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='trophy-outline' size={64} color='#ccc' />
            <Text style={styles.emptyTitle}>No tournaments found</Text>
            <Text style={styles.emptyDescription}>
              Create a tournament to bring players together!
            </Text>
          </View>
        ) : (
          tournaments.map(tournament => renderTournamentCard(tournament))
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 4,
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  tournamentList: {
    flex: 1,
  },
  tournamentCard: {
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
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  formatBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  tournamentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  tournamentDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  prizesSection: {
    backgroundColor: '#fffbf0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  prizesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  prizesList: {
    gap: 6,
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prizeText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
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
  participantsInfo: {
    flex: 1,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  spotsText: {
    fontSize: 12,
    color: '#FF5722',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
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

export default TournamentListPage;
