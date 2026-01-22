import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard, // 🎯 [KIM FIX] For keyboard event listening
} from 'react-native';
import {
  Card,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Button,
  Avatar,
  Chip,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Divider,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  List,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  FAB,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Dialog,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Portal,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Menu,
  useTheme,
  MD3Theme,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// TabView removed - replaced with simple state-based tabs to fix Korean IME

import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useChatNotification } from '../../contexts/ChatNotificationContext';
import { RootStackParamList } from '../../navigation/AppNavigator';
import clubService from '../../services/clubService';

type ClubChatScreenRouteProp = RouteProp<RootStackParamList, 'ClubChat'>;

interface ChatMessage {
  id: string;
  clubId: string;
  senderId: string;
  senderName: string;
  senderRole: 'member' | 'admin' | 'owner' | 'manager' | string;
  senderPhotoURL?: string; // Profile photo URL
  message: string;
  timestamp: Date | { seconds: number; nanoseconds: number };
  createdAt?: Date | { seconds: number; nanoseconds: number };
  type: 'text' | 'announcement' | 'system' | 'notification';
  isImportant?: boolean;
  isDeleted?: boolean;
  replyTo?: string;
  readBy?: string[]; // Array of user IDs who have read this message
}

const ClubChatScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ClubChatScreenRouteProp>();
  const { currentUser: user } = useAuth();
  const { t } = useLanguage();
  const paperTheme = useTheme();
  const { showNotification } = useChatNotification();
  const isFocused = useIsFocused();
  const { clubId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userRole, setUserRole] = useState<string>('member'); // 🔧 Store actual role for messages
  // 🔧 Cache member info (role + profile image) for accurate display
  const [memberInfo, setMemberInfo] = useState<
    Map<string, { role: string; profileImage?: string }>
  >(new Map());

  const flatListRef = useRef<FlatList>(null);

  // 🎯 [KIM FIX] Scroll to end when keyboard appears
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  // Memoize styles to prevent re-creation on every render (CRITICAL for TextInput focus stability)
  const styles = useMemo(() => createStyles(paperTheme), [paperTheme]);

  useEffect(() => {
    let unsubscribeFn: (() => void) | undefined;

    loadClubChatData()
      .then(unsub => {
        unsubscribeFn = unsub;
      })
      .catch(error => {
        console.error('Error loading club chat data:', error);
      });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    if (!user) return 0;

    const count = messages.filter(
      msg =>
        msg.type === 'text' && // Only count text messages
        msg.senderId !== user.uid && // Not sent by current user
        (!msg.readBy || !msg.readBy.includes(user.uid)) // User hasn't read it
    ).length;

    return count;
  }, [messages, user]);

  // Log unread count for debugging
  useEffect(() => {
    console.log(`[ClubChatScreen] Unread count: ${unreadCount}`);
  }, [unreadCount]);

  // Mark messages as read when user views the chat
  useEffect(() => {
    if (messages.length === 0 || !user) {
      return;
    }

    // Find unread messages (messages where current user is NOT in readBy array)
    const unreadMessages = messages.filter(
      msg =>
        msg.senderId !== user.uid && // Not sent by current user
        (!msg.readBy || !msg.readBy.includes(user.uid)) // User hasn't read it yet
    );

    if (unreadMessages.length > 0) {
      const unreadMessageIds = unreadMessages.map(msg => msg.id);

      console.log(`[ClubChatScreen] Marking ${unreadMessageIds.length} messages as read`);

      // Mark as read after a small delay (to ensure user actually saw them)
      const timeoutId = setTimeout(() => {
        clubService.markMessagesAsRead(unreadMessageIds, user.uid).catch((error: Error) => {
          console.error('[ClubChatScreen] Error marking messages as read:', error);
        });
      }, 1000); // 1 second delay

      return () => clearTimeout(timeoutId);
    }
  }, [messages, user]);

  const loadClubChatData = async (): Promise<(() => void) | undefined> => {
    try {
      setIsLoading(true);

      // 🚀 [PERF] Load user role quickly (single query)
      if (user?.uid) {
        clubService.getUserRoleInClub(clubId, user.uid).then(memberRole => {
          setUserRole(memberRole || 'member');
        });
      }

      // 🚀 [PERF] Load member info in BACKGROUND (don't block message loading)
      // This fixes role/photo display but doesn't delay showing messages
      clubService
        .getClubMembers(clubId, 'active')
        .then(members => {
          const infoMap = new Map<string, { role: string; profileImage?: string }>();
          members.forEach((member: { userId: string; role: string; profileImage?: string }) => {
            infoMap.set(member.userId, {
              role: member.role,
              profileImage: member.profileImage,
            });
          });
          setMemberInfo(infoMap);
        })
        .catch(err => console.error('Error loading member info:', err));

      const handleNewMessage = (notification: {
        id: string;
        type: 'direct' | 'club' | 'event';
        chatId: string;
        senderId: string;
        senderName: string;
        message: string;
        timestamp: Date;
      }) => {
        // Only show notification if screen is NOT focused
        if (!isFocused) {
          showNotification(notification);
        }
      };

      // Subscribe to real-time club chat messages
      const unsubscribe = clubService.subscribeToClubChat(
        clubId,
        (messages: ChatMessage[]) => {
          console.log('📨 [ClubChat] Received messages:', messages.length);

          // Filter out announcements - only show regular chat messages
          const chatMessages = messages.filter(m => m.type !== 'announcement');
          setMessages(chatMessages);
          setIsLoading(false);
        },
        user?.uid || '',
        handleNewMessage
      );

      // Return unsubscribe function
      return unsubscribe as () => void;
    } catch (error) {
      console.error('Error loading club chat data:', error);
      Alert.alert(t('clubChat.loadError'), t('clubChat.loadErrorMessage'), [
        { text: t('common.ok') },
      ]);
      setIsLoading(false);
    }
  };

  const handleMessageChange = useCallback((text: string) => {
    setNewMessage(text);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) {
      return;
    }

    try {
      setSending(true);

      const messageData = {
        senderId: user.uid,
        senderName: user.displayName || t('clubChat.defaultSenderName'),
        senderPhotoURL: user.photoURL || null,
        senderRole: userRole, // 🔧 Use actual role from club membership
        message: newMessage.trim(),
        type: 'text' as const,
      };

      // Save to Firestore (real-time subscription will update UI)
      await clubService.saveClubChatMessage(clubId, messageData);
      setNewMessage('');

      // Scroll to bottom after message is sent
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(t('common.error'), t('clubChat.sendError'));
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: Date | { seconds: number; nanoseconds: number }) => {
    // Handle Firestore Timestamp
    let date: Date;
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date();
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return date.toLocaleDateString(t('common.locale'));
    } else if (hours > 0) {
      return t('clubChat.timeHoursAgo', { hours });
    } else if (minutes > 0) {
      return t('clubChat.timeMinutesAgo', { minutes });
    } else {
      return t('clubChat.timeJustNow');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#ff9800';
      case 'admin':
        return '#f44336';
      case 'member':
        return '#2196f3';
      default:
        return '#666';
    }
  };

  // Valid roles - anything else will default to 'member'
  const VALID_ROLES = ['owner', 'admin', 'manager', 'member'];

  const normalizeRole = (role: unknown): string => {
    // Strictly validate role - must be a string and in valid roles list
    if (typeof role === 'string' && VALID_ROLES.includes(role)) {
      return role;
    }
    return 'member'; // Default to member for any invalid value
  };

  const getRoleLabel = (role: unknown) => {
    const normalizedRole = normalizeRole(role);
    switch (normalizedRole) {
      case 'owner':
      case 'admin':
        return t('clubChat.roleAdmin');
      case 'manager':
        return t('clubChat.roleStaff');
      case 'member':
      default:
        return t('clubChat.roleMember');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderId === user?.uid;
    const isSystemMessage = item.type === 'system';
    const isAnnouncement = item.type === 'announcement';
    // 🔧 Get member info from cache (fixes old messages with wrong senderRole + adds profile photos)
    const cachedInfo = memberInfo.get(item.senderId);
    const actualRole = cachedInfo?.role || item.senderRole;
    const actualPhotoURL = item.senderPhotoURL || cachedInfo?.profileImage;
    const roleLabel = getRoleLabel(actualRole);

    // 📖 [READ RECEIPT] 내가 보낸 마지막 메시지인지 확인
    const myMessages = messages.filter(m => m.senderId === user?.uid && m.type === 'text');
    const isMyLastMessage =
      isMyMessage && myMessages.length > 0 && item.id === myMessages[myMessages.length - 1]?.id;

    // 📖 [READ RECEIPT] 읽은 사람 수 / 총 멤버 수
    const readCount = item.readBy?.length || 0;
    const totalMembers = memberInfo.size || 1; // 최소 1명 (자신)

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.message}</Text>
        </View>
      );
    }

    if (isAnnouncement) {
      return (
        <Card style={[styles.announcementCard, item.isImportant && styles.importantAnnouncement]}>
          <Card.Content>
            <View style={styles.announcementHeader}>
              <View style={styles.announcementInfo}>
                <Ionicons
                  name={item.isImportant ? 'megaphone' : 'information-circle'}
                  size={20}
                  color={item.isImportant ? '#ff9800' : '#2196f3'}
                />
                <Text style={styles.announcementLabel}>{t('clubChat.announcement')}</Text>
                {item.isImportant && (
                  <Chip compact style={styles.importantChip}>
                    {t('clubChat.important')}
                  </Chip>
                )}
              </View>
              <Text style={styles.announcementTime}>{formatMessageTime(item.timestamp)}</Text>
            </View>
            <Text style={styles.announcementText}>{item.message}</Text>
            <View style={styles.announcementFooter}>
              <Text style={styles.announcementAuthor}>
                {item.senderName} · {roleLabel}
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isMyMessage && (
          <View style={styles.senderInfo}>
            {actualPhotoURL ? (
              <Avatar.Image
                size={32}
                source={{ uri: actualPhotoURL }}
                style={styles.senderAvatar}
              />
            ) : (
              <Avatar.Text
                size={32}
                label={item.senderName?.charAt(0) || '?'}
                style={[styles.senderAvatar, { backgroundColor: getRoleColor(actualRole) }]}
              />
            )}
            <View style={styles.senderDetails}>
              <Text style={styles.senderName}>{item.senderName}</Text>
              <Surface style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </Surface>
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {item.message}
          </Text>
        </View>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>{formatMessageTime(item.timestamp)}</Text>
          {/* 📖 [READ RECEIPT] 내 마지막 메시지에만 읽음 수 표시 */}
          {isMyLastMessage && (
            <Text style={styles.readReceipt}>
              {readCount}/{totalMembers}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={paperTheme.colors.primary} />
          <Text style={styles.loadingText}>{t('clubChat.loadingChat')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Surface style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name='chevron-back' size={24} color={paperTheme.colors.onSurface} />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('club.chat')}</Text>
        </View>

        {/* Right header button - menu */}
        <TouchableOpacity style={styles.menuButton} onPress={() => {}}>
          <Ionicons name='ellipsis-vertical' size={24} color={paperTheme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </Surface>

      {/* Chat Content - 🎯 [KIM FIX] KeyboardAvoidingView wraps BOTH FlatList and input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={handleMessageChange}
              placeholder={t('clubChat.inputPlaceholder')}
              placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              multiline
              maxLength={500}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size='small' color='white' />
              ) : (
                <Ionicons name='send' size={20} color='white' />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      {/* 🎯 [KIM FIX] KeyboardAvoidingView now properly wraps FlatList + Input */}
    </SafeAreaView>
  );
};

// Create dynamic styles based on theme
const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 8,
      elevation: 2,
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      padding: 8,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    menuButton: {
      padding: 8,
    },
    // Sub-tab styles
    subTabContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 20,
      padding: 4,
      marginHorizontal: 8,
    },
    subTab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    subTabActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    subTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    subTabTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      position: 'relative',
    },
    tabButtonActive: {
      // No additional styles needed, indicator handles it
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    tabButtonTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.colors.primary,
    },
    chatContainer: {
      flex: 1,
    },
    messagesList: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
    },
    messageContainer: {
      marginBottom: 16,
      maxWidth: '85%',
    },
    myMessageContainer: {
      alignSelf: 'flex-end',
      alignItems: 'flex-end',
    },
    otherMessageContainer: {
      alignSelf: 'flex-start',
      alignItems: 'flex-start',
    },
    senderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    senderAvatar: {
      width: 32,
      height: 32,
    },
    senderDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    senderName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    roleChip: {
      height: 20,
      backgroundColor: theme.colors.surfaceVariant,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceVariant,
    },
    roleBadgeText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    messageBubble: {
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxWidth: '100%',
    },
    myMessageBubble: {
      backgroundColor: theme.colors.primary,
    },
    otherMessageBubble: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
    },
    myMessageText: {
      color: theme.colors.onPrimary,
    },
    otherMessageText: {
      color: theme.colors.onSurface,
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      marginHorizontal: 8,
      gap: 6,
    },
    messageTime: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
    },
    // 📖 [READ RECEIPT] 읽음 수 표시 스타일
    readReceipt: {
      fontSize: 10,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    systemMessageContainer: {
      alignItems: 'center',
      marginVertical: 8,
    },
    systemMessageText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      textAlign: 'center',
    },
    announcementCard: {
      marginBottom: 16,
      backgroundColor: theme.dark ? '#3E2723' : '#fff8e1',
    },
    importantAnnouncement: {
      backgroundColor: theme.dark ? '#4E342E' : '#ffebee',
      borderLeftWidth: 4,
      borderLeftColor: '#ff9800',
    },
    announcementHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    announcementInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    announcementLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.onSurfaceVariant,
    },
    importantChip: {
      backgroundColor: '#ff9800',
      height: 20,
    },
    announcementTime: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
    },
    announcementText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      lineHeight: 22,
      marginBottom: 8,
    },
    announcementFooter: {
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    announcementAuthor: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    announcementsContainer: {
      flex: 1,
    },
    announcementsList: {
      flex: 1,
    },
    announcementsContent: {
      padding: 16,
    },
    inputContainer: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      zIndex: 1001, // Above chatbot FAB (z-index 1000)
      elevation: 10, // Android shadow/priority
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 12,
      maxHeight: 100,
      fontSize: 16,
      backgroundColor: theme.colors.surfaceVariant,
      color: theme.colors.onSurface,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.outline,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
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

export default ClubChatScreen;
