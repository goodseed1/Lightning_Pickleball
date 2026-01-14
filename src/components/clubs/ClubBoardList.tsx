/**
 * ClubBoardList - 클럽 게시판 목록 컴포넌트
 * 게시글 목록을 표시하고 게시글 상세 화면으로 이동
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme, MD3Theme, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useLanguage } from '../../contexts/LanguageContext';
import clubCommsService from '../../services/clubCommsService';
import { ClubPost, getTimeAgo } from '../../types/clubCommunication';
import { RootStackParamList } from '../../navigation/AppNavigator';

interface ClubBoardListProps {
  clubId: string;
}

const ClubBoardList: React.FC<ClubBoardListProps> = ({ clubId }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const paperTheme = useTheme();
  const styles = createStyles(paperTheme);

  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const data = await clubCommsService.getClubPosts(clubId);
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, [loadPosts]);

  const handlePostPress = useCallback(
    (post: ClubPost) => {
      navigation.navigate('PostDetail', {
        postId: post.id,
        clubId: clubId,
      });
    },
    [navigation, clubId]
  );

  const renderPostItem = useCallback(
    ({ item }: { item: ClubPost }) => (
      <TouchableOpacity style={styles.postItem} onPress={() => handlePostPress(item)}>
        <View style={styles.postHeader}>
          <View style={styles.postBadges}>
            {item.isPinned && (
              <Chip compact style={styles.pinnedChip} textStyle={styles.chipText}>
                📌 {t('club.pinned')}
              </Chip>
            )}
            {item.isAnnouncement && (
              <Chip compact style={styles.announcementChip} textStyle={styles.chipText}>
                📢 {t('club.announcement')}
              </Chip>
            )}
          </View>
        </View>

        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{item.authorName}</Text>
          <Text style={styles.postDot}>·</Text>
          <Text style={styles.postTime}>{getTimeAgo(item.createdAt)}</Text>
          <Text style={styles.postDot}>·</Text>
          <View style={styles.commentCount}>
            <Ionicons
              name='chatbubble-outline'
              size={14}
              color={paperTheme.colors.onSurfaceVariant}
            />
            <Text style={styles.commentCountText}>{item.commentCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handlePostPress, styles, t, paperTheme.colors.onSurfaceVariant]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Ionicons
          name='document-text-outline'
          size={64}
          color={paperTheme.colors.onSurfaceVariant}
        />
        <Text style={styles.emptyTitle}>{t('club.noPosts')}</Text>
        <Text style={styles.emptySubtitle}>{t('club.beFirstToPost')}</Text>
      </View>
    ),
    [styles, t, paperTheme.colors.onSurfaceVariant]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={paperTheme.colors.primary} />
        <Text style={styles.loadingText}>{t('clubBoardList.loading')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderPostItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[paperTheme.colors.primary]}
          tintColor={paperTheme.colors.primary}
        />
      }
      ListEmptyComponent={renderEmptyState}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    listContent: {
      flexGrow: 1,
      paddingVertical: 8,
    },
    postItem: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    postBadges: {
      flexDirection: 'row',
      gap: 8,
    },
    pinnedChip: {
      backgroundColor: theme.colors.primaryContainer,
      height: 28,
      paddingHorizontal: 4,
    },
    announcementChip: {
      backgroundColor: theme.dark ? '#4E342E' : '#FFF3E0',
      height: 28,
      paddingHorizontal: 4,
    },
    chipText: {
      fontSize: 12,
      color: theme.colors.onSurface,
      lineHeight: 16,
    },
    postTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      lineHeight: 22,
      marginBottom: 8,
    },
    postMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    postAuthor: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    postDot: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginHorizontal: 6,
    },
    postTime: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    commentCount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    commentCountText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.outline,
      marginHorizontal: 16,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
  });

export default ClubBoardList;
