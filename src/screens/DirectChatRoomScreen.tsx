import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard, // 🎯 [KIM FIX] For keyboard event listening
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, useTheme, MD3Theme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation, useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/AppNavigator';
import clubService from '../services/clubService';
import { useAuth } from '../contexts/AuthContext';
import { useChatNotification } from '../contexts/ChatNotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import NotificationService from '../services/NotificationService';

type DirectChatRoomScreenRouteProp = RouteProp<RootStackParamList, 'DirectChatRoom'>;

interface InvitationMetadata {
  invitationId?: string;
  clubId?: string;
  clubName?: string;
  clubLogoUrl?: string;
  status?: 'pending' | 'accepted' | 'declined' | 'expired';
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  message: string;
  timestamp: Date | { toDate: () => Date };
  createdAt: Date | { toDate: () => Date };
  type: 'text' | 'system' | 'club_invitation';
  isDeleted: boolean;
  readBy: string[];
  metadata?: InvitationMetadata;
}

const DirectChatRoomScreen: React.FC = () => {
  const route = useRoute<DirectChatRoomScreenRouteProp>();
  const navigation = useNavigation();
  const { currentUser: user } = useAuth();
  const theme = useTheme();
  const { showNotification } = useChatNotification();
  const isFocused = useIsFocused();
  const { t, currentLanguage } = useLanguage();
  const { t: translate } = useTranslation();

  const { conversationId, otherUserId, otherUserName, otherUserPhotoURL } = route.params;

  // States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [joiningClub, setJoiningClub] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // 🔧 [KIM FIX] Use ref for isFocused to prevent subscription recreation
  // When isFocused changes, the callback doesn't need to be recreated - we just update the ref
  const isFocusedRef = useRef(isFocused);
  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

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

  // Generate consistent color based on user ID
  const getAvatarColor = (userId: string): string => {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#FFA07A', // Light Salmon
      '#98D8C8', // Mint
      '#F7DC6F', // Yellow
      '#BB8FCE', // Purple
      '#85C1E2', // Sky Blue
    ];

    // Generate consistent index from userId
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // 🔧 [KIM FIX] Handle new message notifications - use ref for stable callback
  // Using isFocusedRef instead of isFocused prevents subscription recreation
  const handleNewMessage = useCallback(
    (notification: {
      id: string;
      type: 'direct' | 'club' | 'event';
      chatId: string;
      senderId: string;
      senderName: string;
      message: string;
      timestamp: Date;
    }) => {
      console.log('🔔 [DirectChatRoom] handleNewMessage called!');
      console.log('   - notification:', notification);
      console.log('   - isFocused:', isFocusedRef.current);

      // Only show notification if screen is NOT focused
      if (!isFocusedRef.current) {
        console.log('✅ [DirectChatRoom] Showing notification (screen not focused)');
        showNotification(notification);
      } else {
        console.log('❌ [DirectChatRoom] Skipping notification (screen is focused)');
      }
    },
    [showNotification] // 🔧 Removed isFocused dependency - using ref instead
  );

  // 📲 Ensure push token is registered when entering chat
  useEffect(() => {
    const ensurePushToken = async () => {
      if (!user?.uid) return;

      try {
        // Check if user has push token
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data()?.pushToken) {
          console.log('✅ [DirectChatRoom] Push token already registered');
          return;
        }

        console.log('📲 [DirectChatRoom] No push token found, attempting to register...');

        // Get NotificationService and request permissions (new API returns token directly)
        const notificationService = NotificationService.getInstance();
        const { granted, token: pushToken } = await notificationService.requestPermissions();

        if (!granted) {
          console.log('⚠️ [DirectChatRoom] Notification permission denied');
          return;
        }

        if (!pushToken) {
          console.log('⚠️ [DirectChatRoom] Permission granted but no token (simulator?)');
          return;
        }

        // Save to Firestore
        await setDoc(
          userRef,
          {
            pushToken: pushToken,
            pushTokenUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        console.log('✅ [DirectChatRoom] Push token registered successfully:', pushToken);
      } catch (error) {
        console.error('❌ [DirectChatRoom] Error ensuring push token:', error);
      }
    };

    ensurePushToken();
  }, [user?.uid]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) return;

    console.log('[DirectChatRoomScreen] Setting up messages subscription:', conversationId);

    const unsubscribe = clubService.subscribeToDirectChat(
      conversationId,
      (msgs: ChatMessage[]) => {
        setMessages(msgs);
        setLoading(false);

        // Auto-mark as read after 1 second
        const unreadMessages = msgs.filter(
          msg =>
            msg.senderId !== user?.uid && (!msg.readBy || !msg.readBy.includes(user?.uid || ''))
        );

        if (unreadMessages.length > 0 && user?.uid) {
          setTimeout(() => {
            clubService.markDirectMessagesAsRead(
              unreadMessages.map(m => m.id),
              user.uid,
              conversationId
            );
          }, 1000);
        }
      },
      user?.uid || '',
      handleNewMessage
    );

    return () => {
      console.log('[DirectChatRoomScreen] Cleaning up messages subscription');
      unsubscribe();
    };
  }, [conversationId, user?.uid, handleNewMessage]);

  // Handle message change
  const handleMessageChange = useCallback((text: string) => {
    setNewMessage(text);
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageData = {
      senderId: user.uid,
      senderName: user.displayName || '',
      senderPhotoURL: user.photoURL || '',
      receiverId: otherUserId,
      receiverName: otherUserName,
      receiverPhotoURL: otherUserPhotoURL || '',
      message: newMessage.trim(),
      type: 'text' as const,
    };

    setNewMessage('');
    setSending(true);

    try {
      await clubService.saveDirectChatMessage(conversationId, messageData);

      // Scroll to bottom after message is sent
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('[DirectChatRoomScreen] Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Format message time
  const formatMessageTime = (
    timestamp: Date | { toDate: () => Date } | null | undefined
  ): string => {
    // Handle null/undefined
    if (!timestamp) {
      return '';
    }

    // Handle Firestore Timestamp object
    let date: Date;
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '';
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('directChat.time.justNow');
    if (minutes < 60) return t('directChat.time.minutesAgo', { count: minutes });
    if (hours < 24) return t('directChat.time.hoursAgo', { count: hours });
    if (days < 7) return t('directChat.time.daysAgo', { count: days });

    return date.toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle club invitation acceptance
  const handleAcceptInvitation = async (item: ChatMessage) => {
    const invitationId = item.metadata?.invitationId;
    if (!invitationId) {
      Alert.alert(t('directChat.alerts.error'), t('directChat.alerts.invitationNotFound'));
      return;
    }

    try {
      setJoiningClub(true);

      // 1. Accept the invitation (joins the club automatically)
      await clubService.acceptClubInvitation(invitationId);

      // 2. Update the chat message metadata to reflect acceptance
      await clubService.updateDirectChatMessageMetadata(conversationId, item.id, {
        status: 'accepted',
      });

      // 3. Update local state immediately to disable the button
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === item.id ? { ...msg, metadata: { ...msg.metadata, status: 'accepted' } } : msg
        )
      );

      const clubName = item.metadata?.clubName || t('directChat.club');
      const clubId = item.metadata?.clubId;
      Alert.alert(
        t('directChat.alerts.joinCompleteTitle'),
        t('directChat.alerts.joinCompleteMessage', { clubName }),
        [
          {
            text: t('directChat.goToClubHome'),
            onPress: () => {
              if (clubId) {
                navigation.navigate('ClubDetail', { clubId, clubName });
              }
            },
          },
        ]
      );

      console.log('✅ [DirectChatRoom] Successfully accepted club invitation');
    } catch (error) {
      console.error('❌ [DirectChatRoom] Error accepting invitation:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('directChat.alerts.joinError');
      Alert.alert(t('directChat.alerts.error'), errorMessage);
    } finally {
      setJoiningClub(false);
    }
  };

  // Render invitation card for club_invitation messages
  const renderInvitationCard = (item: ChatMessage, isMyMessage: boolean) => {
    const { metadata } = item;
    const isPending = metadata?.status === 'pending';
    const isAccepted = metadata?.status === 'accepted';
    const canAccept = !isMyMessage && isPending; // Only receiver can accept

    return (
      <View
        style={[
          styles.messageBubbleContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isMyMessage &&
          (item.senderPhotoURL ? (
            <Avatar.Image source={{ uri: item.senderPhotoURL }} size={32} style={styles.avatar} />
          ) : (
            <Avatar.Text
              size={32}
              label={(item.senderName || '?').charAt(0).toUpperCase()}
              style={[styles.avatar, { backgroundColor: getAvatarColor(item.senderId) }]}
            />
          ))}

        <View
          style={[
            styles.invitationCard,
            isMyMessage ? styles.myInvitationCard : styles.otherInvitationCard,
          ]}
        >
          {/* Club Name Header */}
          <View style={styles.invitationHeader}>
            <Ionicons name='pickleballball' size={20} color={theme.colors.primary} />
            <Text style={styles.invitationClubName}>
              {metadata?.clubName || t('directChat.club')}
            </Text>
          </View>

          {/* Invitation Message */}
          <Text style={[styles.invitationMessage, isMyMessage && styles.myInvitationMessage]}>
            {item.message}
          </Text>

          {/* Action Button or Status Badge */}
          {canAccept ? (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleAcceptInvitation(item)}
              disabled={joiningClub}
            >
              {joiningClub ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.joinButtonText}>{t('directChat.joinButton')}</Text>
              )}
            </TouchableOpacity>
          ) : isAccepted ? (
            <View style={styles.acceptedBadge}>
              <Ionicons name='checkmark-circle' size={18} color={theme.colors.primary} />
              <Text style={styles.acceptedText}>{t('directChat.joinComplete')}</Text>
            </View>
          ) : isMyMessage ? (
            <View style={styles.sentBadge}>
              <Ionicons name='paper-plane' size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.sentText}>{t('directChat.invitationSent')}</Text>
            </View>
          ) : null}

          {/* Timestamp */}
          <Text style={[styles.invitationTime, isMyMessage && styles.myInvitationTime]}>
            {formatMessageTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  // Render message bubble
  const renderMessageBubble = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderId === user?.uid;

    // Handle club invitation messages specially
    if (item.type === 'club_invitation') {
      return renderInvitationCard(item, isMyMessage);
    }

    // 📖 [READ RECEIPT] 내가 보낸 마지막 메시지인지 확인
    const myMessages = messages.filter(
      m => m.senderId === user?.uid && m.type !== 'club_invitation'
    );
    const isMyLastMessage =
      isMyMessage && myMessages.length > 0 && item.id === myMessages[myMessages.length - 1]?.id;

    // 📖 [READ RECEIPT] 상대방이 읽었는지 확인
    const isReadByOther = item.readBy?.includes(otherUserId) || false;

    return (
      <View
        style={[
          styles.messageBubbleContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isMyMessage &&
          (item.senderPhotoURL ? (
            <Avatar.Image source={{ uri: item.senderPhotoURL }} size={32} style={styles.avatar} />
          ) : (
            <Avatar.Text
              size={32}
              label={(item.senderName || '?').charAt(0).toUpperCase()}
              style={[styles.avatar, { backgroundColor: getAvatarColor(item.senderId) }]}
            />
          ))}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.senderName || translate('common.unknown')}</Text>
          )}
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
              {formatMessageTime(item.timestamp)}
            </Text>
            {/* 📖 [READ RECEIPT] 내 마지막 메시지에만 읽음 표시 */}
            {isMyLastMessage && (
              <Text style={[styles.readReceipt, isReadByOther && styles.readReceiptRead]}>
                {isReadByOther ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {otherUserPhotoURL ? (
            <Avatar.Image source={{ uri: otherUserPhotoURL }} size={36} />
          ) : (
            <Avatar.Text
              size={36}
              label={otherUserName.charAt(0).toUpperCase()}
              style={{ backgroundColor: getAvatarColor(otherUserId) }}
            />
          )}
          <Text style={styles.headerTitle}>{otherUserName}</Text>
        </View>

        <View style={{ width: 24 }} />
      </View>

      {/* 🎯 [KIM FIX] KeyboardAvoidingView wraps BOTH FlatList and input for proper keyboard handling */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('directChat.loading')}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageBubble}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={handleMessageChange}
            placeholder={t('directChat.inputPlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceDisabled}
            multiline
            maxLength={500}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size='small' color='white' />
            ) : (
              <Ionicons
                name='send'
                size={20}
                color={newMessage.trim() ? theme.colors.onPrimary : theme.colors.onSurfaceDisabled}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* 🎯 [KIM FIX] KeyboardAvoidingView now properly wraps FlatList + Input */}
    </SafeAreaView>
  );
};

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // 🎯 [KIM FIX] KeyboardAvoidingView container - must have flex: 1 to work properly
    keyboardAvoidingContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      padding: 8,
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    messagesList: {
      padding: 16,
    },
    messageBubbleContainer: {
      flexDirection: 'row',
      marginBottom: 16,
      maxWidth: '85%',
    },
    myMessageContainer: {
      alignSelf: 'flex-end',
      flexDirection: 'row-reverse',
    },
    otherMessageContainer: {
      alignSelf: 'flex-start',
    },
    avatar: {
      marginRight: 8,
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
      backgroundColor: theme.colors.surfaceVariant,
    },
    senderName: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
      color: theme.colors.onSurface,
    },
    myMessageText: {
      color: theme.colors.onPrimary,
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 4,
      gap: 4,
    },
    messageTime: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
    },
    myMessageTime: {
      color: 'rgba(255, 255, 255, 0.7)', // 🎯 [KIM FIX] 파란 배경에서 보이도록 흰색 계열
    },
    // 📖 [READ RECEIPT] 읽음 표시 스타일
    readReceipt: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.5)', // 미읽음: 연한 회색
      fontWeight: '600',
    },
    readReceiptRead: {
      color: 'rgba(255, 255, 255, 0.9)', // 읽음: 밝은 흰색
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
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
    // 🎾 Club Invitation Card Styles
    invitationCard: {
      borderRadius: 16,
      padding: 16,
      maxWidth: '100%',
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    myInvitationCard: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    otherInvitationCard: {
      backgroundColor: theme.colors.surface,
    },
    invitationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    invitationClubName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginLeft: 8,
    },
    invitationMessage: {
      fontSize: 14,
      color: theme.colors.onSurface,
      lineHeight: 20,
      marginBottom: 12,
    },
    myInvitationMessage: {
      color: theme.colors.onPrimaryContainer,
    },
    joinButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginBottom: 8,
    },
    joinButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    acceptedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      marginBottom: 8,
    },
    acceptedText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 6,
    },
    sentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      marginBottom: 6,
    },
    sentText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginLeft: 4,
    },
    invitationTime: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      alignSelf: 'flex-end',
    },
    myInvitationTime: {
      color: theme.colors.onPrimaryContainer,
      opacity: 0.7,
    },
  });

export default DirectChatRoomScreen;
