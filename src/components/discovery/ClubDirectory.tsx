/**
 * Club Directory Component
 * Browse and search pickleball clubs with advanced filtering
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import discoveryService from '../../services/discoveryService';

interface ClubDirectoryProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClubPress?: (clubId: string, clubData: any) => void;
  maxItems?: number;
  showSearch?: boolean;
}

const ClubDirectory: React.FC<ClubDirectoryProps> = ({
  onClubPress,
  maxItems = 20,
  showSearch = true,
}) => {
  const { t } = useLanguage();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clubs, setClubs] = useState<any[]>([]);
  const [, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    skillLevel: '',
    language: '',
    hasOpenSpots: false,
    sortBy: 'members',
  });

  const loadClubs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (searchQuery.trim()) {
        // Advanced search with filters
        result = await discoveryService.searchClubsAdvanced({
          query: searchQuery,
          skillLevel: selectedFilters.skillLevel || undefined,
          languages: selectedFilters.language ? [selectedFilters.language] : undefined,
          hasOpenSpots: selectedFilters.hasOpenSpots,
          sortBy: selectedFilters.sortBy,
        });
        setClubs((result as { clubs: unknown[] }).clubs.slice(0, maxItems));
      } else {
        // Get featured or nearby clubs
        const featuredClubs = await discoveryService.getFeaturedClubs(maxItems);
        setClubs(featuredClubs);
      }
    } catch (error) {
      console.error('Failed to load clubs:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedFilters, maxItems]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadClubs();
    } catch {
      Alert.alert(t('common.error'), t('errors.failedToRefresh'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() || Object.values(selectedFilters).some(v => v)) {
      loadClubs();
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFilters({
      skillLevel: '',
      language: '',
      hasOpenSpots: false,
      sortBy: 'members',
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderClubItem = (club: any, index: number) => {
    const memberCount = club.stats?.totalMembers || 0;
    const isActive = club.status === 'active';
    const hasOpenSpots = !club.settings?.maxMembers || memberCount < club.settings.maxMembers;
    const languages = club.languages || [];
    const tags = club.tags || [];

    return (
      <TouchableOpacity
        key={`${club.id}-${index}`}
        style={[styles.clubItem, !isActive && styles.inactiveClub]}
        onPress={() => onClubPress?.(club.id, club)}
      >
        <View style={styles.clubHeader}>
          <View style={styles.clubImageContainer}>
            {club.logo ? (
              <Image source={{ uri: club.logo }} style={styles.clubLogo} />
            ) : (
              <View style={styles.clubLogoPlaceholder}>
                <Ionicons name='people' size={32} color='#666' />
              </View>
            )}

            {club.featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name='star' size={12} color='white' />
              </View>
            )}
          </View>

          <View style={styles.clubInfo}>
            <Text style={styles.clubName} numberOfLines={2}>
              {club.name}
            </Text>
            <Text style={styles.clubDescription} numberOfLines={2}>
              {club.description || t('clubs.noDescription')}
            </Text>

            <View style={styles.clubStats}>
              <View style={styles.statItem}>
                <Ionicons name='people' size={16} color='#666' />
                <Text style={styles.statText}>
                  {memberCount} {t('clubs.members')}
                </Text>
              </View>

              {club.distance !== undefined && (
                <View style={styles.statItem}>
                  <Ionicons name='location' size={16} color='#666' />
                  <Text style={styles.statText}>{club.distance}km</Text>
                </View>
              )}

              {hasOpenSpots && (
                <View style={[styles.statItem, styles.openSpotsIndicator]}>
                  <Ionicons name='checkmark-circle' size={16} color='#4CAF50' />
                  <Text style={[styles.statText, { color: '#4CAF50' }]}>
                    {t('clubs.openSpots')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {(languages.length > 0 || tags.length > 0) && (
          <View style={styles.clubTags}>
            {languages.slice(0, 2).map((lang: string, idx: number) => (
              <View key={`lang-${idx}`} style={[styles.tag, styles.languageTag]}>
                <Text style={styles.tagText}>{lang}</Text>
              </View>
            ))}

            {tags.slice(0, 3).map((tag: string, idx: number) => (
              <View key={`tag-${idx}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {club.recommendationReason && (
          <View style={styles.recommendationBadge}>
            <Ionicons name='bulb' size={14} color='#FF9800' />
            <Text style={styles.recommendationText}>{club.recommendationReason}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (error && !clubs.length) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle' size={48} color='#F44336' />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadClubs}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name='search' size={20} color='#666' />
            <TextInput
              style={styles.searchInput}
              placeholder={t('clubs.searchClubs')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType='search'
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name='close-circle' size={20} color='#666' />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilters.hasOpenSpots && styles.activeFilter]}
                onPress={() =>
                  setSelectedFilters(prev => ({
                    ...prev,
                    hasOpenSpots: !prev.hasOpenSpots,
                  }))
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilters.hasOpenSpots && styles.activeFilterText,
                  ]}
                >
                  {t('clubs.hasOpenSpots')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>{t('clubs.skillLevel')}</Text>
                <Ionicons name='chevron-down' size={16} color='#666' />
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>{t('common.language')}</Text>
                <Ionicons name='chevron-down' size={16} color='#666' />
              </TouchableOpacity>

              {(searchQuery || Object.values(selectedFilters).some(v => v)) && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>{t('common.clear')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.clubsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor='#2196F3' />
        }
        showsVerticalScrollIndicator={false}
      >
        {clubs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='people' size={64} color='#ccc' />
            <Text style={styles.emptyTitle}>
              {searchQuery ? t('clubs.noSearchResults') : t('clubs.noClubsFound')}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? t('clubs.tryDifferentSearch') : t('clubs.checkBackLater')}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {clubs.length} {t('clubs.clubsFound')}
              </Text>
            </View>
            {clubs.map((club, index) => renderClubItem(club, index))}
          </>
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
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  filterRow: {
    height: 40,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  activeFilterText: {
    color: 'white',
  },
  clearFiltersButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearFiltersText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clubsList: {
    flex: 1,
  },
  clubItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inactiveClub: {
    opacity: 0.7,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clubImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  clubLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  clubLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF9800',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  clubDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  clubStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  openSpotsIndicator: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  clubTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  languageTag: {
    backgroundColor: '#e3f2fd',
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  recommendationText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
    paddingHorizontal: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ClubDirectory;
