import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Card, Title, Searchbar, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { theme } from '../../theme';
import clubService from '../../services/clubService';

interface PublicClub {
  id: string;
  name: string;
  description: string;
  location: string;
  logoUrl?: string;
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  tags: string[];
  establishedDate?: Date;
  userStatus?: 'none' | 'member' | 'pending' | 'declined';
}

export default function FindClubScreen() {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<PublicClub[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<PublicClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinRequestLoading, setJoinRequestLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPublicClubs();
  }, []);

  useEffect(() => {
    filterClubs();
  }, [searchQuery, clubs]);

  const loadPublicClubs = async () => {
    try {
      setLoading(true);
      const publicClubs = await clubService.searchPublicClubs('');

      // 사용자의 가입 상태 확인
      if (currentUser?.uid) {
        const clubsWithStatus = await Promise.all(
          publicClubs.map(async club => {
            const userStatus = await clubService.getUserClubStatus(club.id, currentUser.uid);
            return { ...club, userStatus };
          })
        );
        setClubs(clubsWithStatus);
      } else {
        setClubs(publicClubs);
      }
    } catch (error) {
      console.error('Error loading public clubs:', error);
      Alert.alert(t('common.error'), t('findClub.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const filterClubs = () => {
    if (!searchQuery.trim()) {
      setFilteredClubs(clubs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clubs.filter(
      club =>
        club.name.toLowerCase().includes(query) ||
        club.location.toLowerCase().includes(query) ||
        club.description.toLowerCase().includes(query) ||
        club.tags.some(tag => tag.toLowerCase().includes(query))
    );

    setFilteredClubs(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPublicClubs();
    setRefreshing(false);
  };

  const handleJoinRequest = async (club: PublicClub) => {
    if (!currentUser?.uid) {
      Alert.alert(t('common.notice'), t('findClub.errors.loginRequired'));
      return;
    }

    if (club.userStatus === 'member') {
      Alert.alert(t('common.notice'), t('findClub.errors.alreadyMember'));
      return;
    }

    if (club.userStatus === 'pending') {
      Alert.alert(t('common.notice'), t('findClub.errors.alreadyRequested'));
      return;
    }

    Alert.alert(t('findClub.joinRequest'), t('findClub.joinConfirm', { clubName: club.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('findClub.joinButton'),
        onPress: async () => {
          try {
            setJoinRequestLoading(club.id);
            await clubService.requestToJoinClub(club.id, currentUser.uid);

            // 로컬 상태 업데이트
            setClubs(prevClubs =>
              prevClubs.map(c => (c.id === club.id ? { ...c, userStatus: 'pending' } : c))
            );

            Alert.alert(t('common.success'), t('findClub.joinSuccess'));
          } catch (error) {
            console.error('Error requesting to join club:', error);
            Alert.alert(t('common.error'), t('findClub.errors.joinFailed'));
          } finally {
            setJoinRequestLoading(null);
          }
        },
      },
    ]);
  };

  const getStatusButtonProps = (club: PublicClub) => {
    switch (club.userStatus) {
      case 'member':
        return {
          title: t('findClub.status.joined'),
          disabled: true,
          mode: 'outlined' as const,
          buttonColor: '#4caf50',
          textColor: '#4caf50',
        };
      case 'pending':
        return {
          title: t('findClub.status.pending'),
          disabled: true,
          mode: 'outlined' as const,
          buttonColor: '#ff9800',
          textColor: '#ff9800',
        };
      case 'declined':
        return {
          title: t('findClub.status.declined'),
          disabled: true,
          mode: 'outlined' as const,
          buttonColor: '#f44336',
          textColor: '#f44336',
        };
      default:
        return {
          title: t('findClub.status.join'),
          disabled: false,
          mode: 'contained' as const,
          buttonColor: theme.colors.primary,
          textColor: '#fff',
        };
    }
  };

  const renderClubItem = ({ item: club }: { item: PublicClub }) => {
    const statusProps = getStatusButtonProps(club);

    return (
      <Card style={styles.clubCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ClubDetail', { clubId: club.id })}
          activeOpacity={0.7}
        >
          <View style={styles.clubCardContent}>
            {/* Club Logo/Image */}
            <View style={styles.clubLogoContainer}>
              {club.logoUrl ? (
                <Image source={{ uri: club.logoUrl }} style={styles.clubLogo} />
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
                  {club.name}
                </Text>
                {club.isPublic && (
                  <Chip compact style={styles.publicChip} textStyle={styles.publicChipText}>
                    {t('findClub.labels.public')}
                  </Chip>
                )}
              </View>

              {club.description && (
                <Text style={styles.clubDescription} numberOfLines={2}>
                  {club.description}
                </Text>
              )}

              <View style={styles.clubMetaContainer}>
                <View style={styles.clubMetaRow}>
                  <Ionicons name='location-outline' size={14} color='#666' />
                  <Text style={styles.clubMetaText}>{club.location}</Text>
                </View>
                <View style={styles.clubMetaRow}>
                  <Ionicons name='people-outline' size={14} color='#666' />
                  <Text style={styles.clubMetaText}>
                    {t('findClub.labels.memberCount', {
                      current: club.memberCount,
                      max: club.maxMembers,
                    })}
                  </Text>
                </View>
              </View>

              {/* Tags */}
              {club.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {club.tags.slice(0, 3).map((tag, index) => (
                    <Chip key={index} compact style={styles.tagChip} textStyle={styles.tagText}>
                      {tag}
                    </Chip>
                  ))}
                  {club.tags.length > 3 && (
                    <Text style={styles.moreTagsText}>+{club.tags.length - 3}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <Button
            mode={statusProps.mode}
            onPress={() => handleJoinRequest(club)}
            disabled={statusProps.disabled || joinRequestLoading === club.id}
            loading={joinRequestLoading === club.id}
            style={[styles.actionButton, { borderColor: statusProps.buttonColor }]}
            buttonColor={statusProps.mode === 'contained' ? statusProps.buttonColor : 'transparent'}
            textColor={statusProps.textColor}
            compact
          >
            {statusProps.title}
          </Button>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Title style={styles.title}>{t('findClub.title')}</Title>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('findClub.searching')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>{t('findClub.title')}</Title>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('findClub.searchPlaceholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {searchQuery
            ? t('findClub.searchResults', { query: searchQuery, count: filteredClubs.length })
            : t('findClub.totalClubs', { count: clubs.length })}
        </Text>
      </View>

      {/* Club List */}
      <FlatList
        data={filteredClubs}
        renderItem={renderClubItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name='search-outline' size={64} color='#ccc' />
            <Text style={styles.emptyTitle}>
              {searchQuery ? t('findClub.empty.noResults') : t('findClub.empty.noClubs')}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? t('findClub.empty.tryDifferent') : t('findClub.empty.createNew')}
            </Text>
          </View>
        }
      />
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
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    fontSize: 16,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
  clubCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  publicChip: {
    backgroundColor: '#4caf50',
    height: 24,
  },
  publicChipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
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
    marginBottom: 8,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  tagChip: {
    backgroundColor: '#e3f2fd',
    height: 20,
  },
  tagText: {
    fontSize: 10,
    color: '#1976d2',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#999',
    marginLeft: 4,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  actionButton: {
    minWidth: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
  },
});
