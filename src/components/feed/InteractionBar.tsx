import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';

interface InteractionBarProps {
  feedId: string;
  liked?: boolean;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  onLike: (feedId: string) => void;
  onComment: (feedId: string) => void;
  onShare: (feedId: string) => void;
}

const InteractionBar: React.FC<InteractionBarProps> = ({
  feedId,
  liked = false,
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
  onLike,
  onComment,
  onShare,
}) => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors as unknown as Record<string, string>);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.actionButton} onPress={() => onLike(feedId)}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={18}
          color={liked ? themeColors.colors.likeActive : themeColors.colors.onSurfaceVariant}
        />
        {likeCount > 0 && (
          <Text style={[styles.countText, liked && styles.likedText]}>{likeCount}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => onComment(feedId)}>
        <Ionicons name='chatbubble-outline' size={18} color={themeColors.colors.onSurfaceVariant} />
        {commentCount > 0 && <Text style={styles.countText}>{commentCount}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => onShare(feedId)}>
        <Ionicons name='share-outline' size={18} color={themeColors.colors.onSurfaceVariant} />
        {shareCount > 0 && <Text style={styles.countText}>{shareCount}</Text>}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 24,
    },
    countText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginLeft: 4,
      fontWeight: '500',
    },
    likedText: {
      color: colors.likeActive,
    },
  });

export default InteractionBar;
