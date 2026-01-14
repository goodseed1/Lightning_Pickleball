import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card, Title, Avatar, Chip, Divider } from 'react-native-paper';

import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import clubCommsService from '../../services/clubCommsService';
import { ClubPost, PostComment, validateComment, getTimeAgo } from '../../types/clubCommunication';

const PostDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { t: translate } = useTranslation();
  const { currentUser } = useAuth();

  // Get params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { postId, clubId } = route.params as any;

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<ClubPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    // 실시간 리스너 설정
    const unsubscribePost = clubCommsService.listenToPost(postId, updatedPost => {
      setPost(updatedPost);
      setLoading(false);
    });

    const unsubscribeComments = clubCommsService.listenToPostComments(postId, updatedComments => {
      setComments(updatedComments);
    });

    return () => {
      unsubscribePost();
      unsubscribeComments();
    };
  }, [postId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postData, commentsData] = await Promise.all([
        clubCommsService.getPost(postId),
        clubCommsService.getPostComments(postId),
      ]);

      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading post data:', error);
      Alert.alert(t('postDetail.error'), t('postDetail.loadPostError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser?.uid) {
      Alert.alert(t('postDetail.error'), t('postDetail.loginRequired'));
      return;
    }

    // 유효성 검사
    const validation = validateComment(commentText);
    if (!validation.isValid) {
      Alert.alert(t('postDetail.inputError'), validation.errors.join('\n'));
      return;
    }

    try {
      setSubmittingComment(true);

      await clubCommsService.addComment(
        {
          postId,
          clubId,
          content: commentText.trim(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parentCommentId: replyingTo as any,
        },
        currentUser.uid,
        currentUser.displayName || translate('common.unknownUser'),
        currentUser.photoURL
      );

      setCommentText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert(t('postDetail.commentFailed'), t('postDetail.commentSubmitError'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(t('postDetail.deleteComment'), t('postDetail.deleteCommentConfirm'), [
      {
        text: t('postDetail.cancel'),
        style: 'cancel',
      },
      {
        text: t('postDetail.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await clubCommsService.deleteComment(commentId, currentUser.uid as any);
          } catch (error) {
            console.error('Error deleting comment:', error);
            Alert.alert(t('postDetail.deleteFailed'), t('postDetail.commentDeleteError'));
          }
        },
      },
    ]);
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo(commentId);
    setCommentText(`@${authorName} `);
  };

  const renderComment = (comment: PostComment, isReply: boolean = false) => {
    const isMyComment = comment.authorId === currentUser?.uid;

    return (
      <View key={comment.id} style={[styles.commentItem, isReply && styles.replyItem]}>
        <Avatar.Text
          size={isReply ? 32 : 40}
          label={comment.authorName.charAt(0)}
          style={styles.commentAvatar}
        />

        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>{comment.authorName}</Text>
            <Text style={styles.commentTime}>{getTimeAgo(comment.createdAt)}</Text>
            {isMyComment && (
              <TouchableOpacity
                onPress={() => handleDeleteComment(comment.id)}
                style={styles.deleteButton}
              >
                <Ionicons name='trash-outline' size={16} color='#f44336' />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.commentText}>{comment.content}</Text>

          {!isReply && (
            <TouchableOpacity
              onPress={() => handleReply(comment.id, comment.authorName)}
              style={styles.replyButton}
            >
              <Text style={styles.replyButtonText}>{t('postDetail.reply')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>{t('postDetail.loadingPost')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color='#333' />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('postDetail.post')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Post */}
          <Card style={styles.postCard}>
            <Card.Content>
              <View style={styles.postHeader}>
                <View style={styles.postTitleContainer}>
                  <Title style={styles.postTitle}>
                    {post.isAnnouncement && '📢 '}
                    {post.isPinned && '📌 '}
                    {post.title}
                  </Title>
                  {(post.isAnnouncement || post.isPinned) && (
                    <View style={styles.postBadges}>
                      {post.isAnnouncement && (
                        <Chip compact style={styles.announcementBadge}>
                          {t('postDetail.notice')}
                        </Chip>
                      )}
                      {post.isPinned && (
                        <Chip compact style={styles.pinnedBadge}>
                          {t('postDetail.pinned')}
                        </Chip>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.postMeta}>
                <Avatar.Text
                  size={32}
                  label={post.authorName.charAt(0)}
                  style={styles.authorAvatar}
                />
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  <Text style={styles.postDate}>
                    {post.createdAt.toDate().toLocaleDateString('ko-KR')} ·
                    {post.createdAt.toDate().toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <Text style={styles.postContent}>{post.content}</Text>
            </Card.Content>
          </Card>

          {/* Comments Section */}
          <Card style={styles.commentsCard}>
            <Card.Content>
              <View style={styles.commentsHeader}>
                <Title style={styles.commentsTitle}>{t('postDetail.comments')}</Title>
                <Chip compact style={styles.commentCountChip}>
                  {post.commentCount}
                </Chip>
              </View>

              {comments.length > 0 ? (
                <View style={styles.commentsList}>
                  {comments.map(comment => (
                    <View key={comment.id}>
                      {renderComment(comment)}
                      {comment.replies && comment.replies.length > 0 && (
                        <View style={styles.repliesContainer}>
                          {comment.replies.map(reply => renderComment(reply, true))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyComments}>
                  <Ionicons name='chatbubble-outline' size={48} color='#ddd' />
                  <Text style={styles.emptyCommentsText}>{t('postDetail.firstComment')}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          {replyingTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>{t('postDetail.replying')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setReplyingTo(null);
                  setCommentText('');
                }}
              >
                <Ionicons name='close' size={20} color='#666' />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder={t('postDetail.commentPlaceholder')}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!commentText.trim() || submittingComment) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size={20} color='#fff' />
              ) : (
                <Ionicons name='send' size={20} color={!commentText.trim() ? '#ccc' : '#fff'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  postCard: {
    marginBottom: 16,
  },
  postHeader: {
    marginBottom: 16,
  },
  postTitleContainer: {
    gap: 12,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 28,
  },
  postBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  announcementBadge: {
    backgroundColor: '#ff9800',
  },
  pinnedBadge: {
    backgroundColor: '#4caf50',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  authorAvatar: {
    backgroundColor: '#1976d2',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginBottom: 16,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  commentsCard: {
    marginBottom: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  commentCountChip: {
    backgroundColor: '#e3f2fd',
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
  },
  replyItem: {
    marginLeft: 32,
  },
  commentAvatar: {
    backgroundColor: '#1976d2',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
  },
  replyButton: {
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 12,
    gap: 12,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCommentsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  commentInputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  replyIndicatorText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    backgroundColor: '#fafafa',
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default PostDetailScreen;
