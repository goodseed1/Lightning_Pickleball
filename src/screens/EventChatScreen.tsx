/**
 * Event Chat Screen - 이벤트 전용 그룹 채팅방
 */

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
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Dimensions,
  NativeSyntheticEvent, // 🔧 [FLICKER FIX] For scroll event typing
  NativeScrollEvent,    // 🔧 [FLICKER FIX] For scroll event typing
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ActivityService from '../services/activityService';
import { useChatNotification } from '../contexts/ChatNotificationContext';
import LinkableText from '../components/common/LinkableText';
import CameraService from '../services/CameraService';
import ChatImageService from '../services/ChatImageService';

// 타입 정의
interface ChatMessage {
  id: string;
  eventId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'notification' | 'image';
  readBy?: string[]; // 📖 [READ RECEIPT] 읽은 사용자 ID 배열
  imageUrl?: string;
  storagePath?: string;
}

interface EventInfo {
  id: string;
  title: string;
  hostName: string;
  scheduledTime: Date;
  participantCount: number; // 📖 [READ RECEIPT] 참가자 수
}

type RootStackParamList = {
  EventChat: { eventId: string; eventTitle?: string };
};

type EventChatRouteProp = RouteProp<RootStackParamList, 'EventChat'>;
type EventChatNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EventChatScreen: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { paperTheme } = useTheme();
  const navigation = useNavigation<EventChatNavigationProp>();
  const route = useRoute<EventChatRouteProp>();
  const { showNotification } = useChatNotification();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets(); // 🔧 [FIX] Android navigation bar overlap

  const { eventId, eventTitle } = route.params;

  // 상태 관리
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 🔧 [FLICKER FIX] Smart scroll state - prevents flickering on new messages
  const [isNearBottom, setIsNearBottom] = useState(true);
  const prevMessageCount = useRef(0);

  // 🔧 [FLICKER FIX] Detect scroll position to enable smart auto-scroll
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsNearBottom(isCloseToBottom);
  }, []);

  // 🔧 [FLICKER FIX] Only scroll to end when NEW messages are added AND user is near bottom
  useEffect(() => {
    if (messages.length > prevMessageCount.current && isNearBottom) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, isNearBottom]);

  const initializeChatRoom = useCallback(async () => {
    // Prevent multiple initialization attempts
    if (isInitializing) {
      console.log('🔄 [initializeChatRoom] Already initializing, skipping...');
      return;
    }

    try {
      console.log('🚀 [initializeChatRoom] Starting initialization for eventId:', eventId);
      setIsInitializing(true);
      setLoading(true);

      // 이벤트 정보 로드
      console.log('📋 [initializeChatRoom] Loading event information...');
      const event = await ActivityService.getEventById(eventId);
      if (event) {
        console.log('✅ [initializeChatRoom] Event loaded:', event.title);
        // 📖 [READ RECEIPT] 참가자 수 계산 (호스트 + 참가자들)
        const participantCount = ((event as { participants?: string[] }).participants?.length || 0) + 1; // +1 for host
        setEventInfo({
          id: event.id,
          title: event.title,
          hostName: event.hostName,
          scheduledTime: event.scheduledTime,
          participantCount,
        });
      } else {
        console.warn('⚠️ [initializeChatRoom] Event not found');
      }

      // 채팅방 생성 또는 참여
      console.log('🏠 [initializeChatRoom] Getting/creating chat room...');
      const roomId = await ActivityService.getEventChatRoom(eventId, currentUser!.uid);
      console.log('✅ [initializeChatRoom] Chat room obtained:', roomId);
      setChatRoomId(roomId);

      // Clean up any existing subscription
      if (unsubscribeRef.current) {
        console.log('🧹 [initializeChatRoom] Cleaning up existing subscription');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // 실시간 메시지 구독 설정
      console.log('📡 [initializeChatRoom] Setting up real-time message subscription...');

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

      const unsubscribe = ActivityService.subscribeToChatMessages(
        roomId,
        messages => {
          console.log('💬 [initializeChatRoom] Received chat messages update:', messages.length);
          setMessages(messages);
          // 🔧 [FLICKER FIX] Removed manual scrollToEnd - handled by smart scroll useEffect
        },
        currentUser!.uid,
        handleNewMessage
      );

      unsubscribeRef.current = unsubscribe;

      // 웰컴 메시지가 없다면 추가
      console.log('👋 [initializeChatRoom] Checking for welcome message...');
      const existingMessages = await ActivityService.loadChatMessages(roomId, 10);
      if (existingMessages.length === 0) {
        console.log('📝 [initializeChatRoom] Adding welcome message...');
        const welcomeMessage = {
          id: `welcome-${Date.now()}`,
          eventId,
          senderId: 'system',
          senderName: 'System',
          message: t('eventChat.welcomeMessage'),
          timestamp: new Date(),
          type: 'system' as const,
        };

        await ActivityService.saveChatMessage(roomId, welcomeMessage);
      }

      console.log('🎉 [initializeChatRoom] Initialization completed successfully');
    } catch (error) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const err = error as any;
      console.error('❌ [initializeChatRoom] Error occurred:', err);
      console.error('❌ [initializeChatRoom] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });

      // Provide more specific error messages
      let errorMessage = '';
      if (err.message?.includes('not authorized')) {
        errorMessage = t('eventChat.errors.notAuthorized');
      } else if (err.message?.includes('Firebase')) {
        errorMessage = t('eventChat.errors.networkError');
      } else {
        errorMessage = t('eventChat.errors.loadingError', {
          error: err.message || t('eventChat.errors.unknownError'),
        });
      }

      // Determine Alert title based on error type
      const alertTitle = err.message?.includes('not authorized')
        ? t('eventChat.errors.chatRoomNotice')
        : t('common.error');
      /* eslint-enable @typescript-eslint/no-explicit-any */

      Alert.alert(alertTitle, errorMessage, [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
      setIsInitializing(false);
      console.log('🏁 [initializeChatRoom] Initialization finished');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, currentUser]);

  useEffect(() => {
    console.log('🔄 [useEffect] Running with currentUser:', !!currentUser, 'eventId:', eventId);

    if (!currentUser || !eventId) {
      console.warn('⚠️ [useEffect] Missing required data:', {
        currentUser: !!currentUser,
        eventId,
      });
      Alert.alert(t('common.error'), t('eventChat.errors.userNotFound'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
      return;
    }

    // Initialize chat room only once
    initializeChatRoom();

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 [useEffect] Cleaning up subscription on unmount');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, eventId, initializeChatRoom]);

  // Mark event chat as read when screen is focused
  useEffect(() => {
    const markAsRead = async () => {
      if (isFocused && currentUser && eventId) {
        try {
          console.log('📖 [EventChatScreen] Marking event chat as read');
          await ActivityService.markEventChatAsRead(eventId, currentUser.uid);
          console.log('✅ [EventChatScreen] Event chat marked as read');
        } catch (error) {
          console.error('❌ [EventChatScreen] Error marking event chat as read:', error);
        }
      }
    };

    markAsRead();
  }, [isFocused, currentUser, eventId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !chatRoomId) return;

    try {
      setSending(true);

      const messageData: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        message: newMessage.trim(),
        timestamp: new Date(),
        type: 'text',
      };

      // Firebase에 메시지 저장 (실시간 구독을 통해 자동으로 UI 업데이트됨)
      await ActivityService.saveChatMessage(chatRoomId, messageData);
      setNewMessage('');

      // 🔧 [FIX] 메시지 전송 후 발신자의 unreadCount를 0으로 유지
      // saveChatMessage가 다른 참여자의 count만 증가시키지만,
      // Firestore 리스너 타이밍 이슈로 인해 배지가 잠시 표시될 수 있음
      try {
        await ActivityService.markEventChatAsRead(eventId, currentUser.uid);
      } catch (markError) {
        console.warn('Failed to mark as read after sending:', markError);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(t('common.error'), t('eventChat.errors.sendError'));
    } finally {
      setSending(false);
    }
  };

  // 📷 Send image message
  const sendImage = async () => {
    if (!currentUser || !chatRoomId) return;

    try {
      const result = await CameraService.showImagePicker({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result) return;

      setUploadingImage(true);

      // Upload image to Firebase Storage (event limit: 30 images)
      const uploadResult = await ChatImageService.uploadChatImage(
        'event',
        eventId,
        result,
        currentUser.uid
      );

      if (!uploadResult.success || !uploadResult.imageUrl) {
        Alert.alert(t('common.error'), t('eventChat.errors.imageUploadError') || 'Failed to upload image');
        return;
      }

      const messageData: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        message: '📷 Photo',
        timestamp: new Date(),
        type: 'image',
        imageUrl: uploadResult.imageUrl,
        storagePath: uploadResult.storagePath,
      };

      await ActivityService.saveChatMessage(chatRoomId, messageData);

      try {
        await ActivityService.markEventChatAsRead(eventId, currentUser.uid);
      } catch (markError) {
        console.warn('Failed to mark as read after sending:', markError);
      }
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert(t('common.error'), t('eventChat.errors.imageSendError') || 'Failed to send image');
    } finally {
      setUploadingImage(false);
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString(t('common.locale'), {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatEventTime = (timestamp: Date) => {
    return timestamp.toLocaleDateString(t('common.locale'), {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderId === currentUser?.uid;
    const isSystemMessage = item.type === 'system';

    // 📖 [READ RECEIPT] 내가 보낸 마지막 메시지인지 확인
    const myMessages = messages.filter(m => m.senderId === currentUser?.uid && m.type === 'text');
    const isMyLastMessage =
      isMyMessage && myMessages.length > 0 && item.id === myMessages[myMessages.length - 1]?.id;

    // 📖 [READ RECEIPT] 읽은 사람 수 / 총 참가자 수
    const readCount = item.readBy?.length || 0;
    const totalParticipants = eventInfo?.participantCount || 1;

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.message}</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isMyMessage && <Text style={styles.senderName}>{item.senderName}</Text>}
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            item.type === 'image' && styles.imageBubble,
          ]}
        >
          {item.type === 'image' && item.imageUrl ? (
            <TouchableOpacity
              onPress={() => setSelectedImage(item.imageUrl!)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.chatImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <LinkableText
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
              ]}
              linkStyle={isMyMessage ? { color: '#90CAF9' } : { color: '#2196F3' }}
            >
              {item.message}
            </LinkableText>
          )}
        </View>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>{formatMessageTime(item.timestamp)}</Text>
          {/* 📖 [READ RECEIPT] 내 마지막 메시지에만 읽음 수 표시 */}
          {isMyLastMessage && (
            <Text style={styles.readReceipt}>
              {readCount}/{totalParticipants}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Create dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: paperTheme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: paperTheme.colors.onSurfaceVariant,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: paperTheme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: paperTheme.colors.outline,
    },
    headerInfo: {
      flex: 1,
      marginHorizontal: 12,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: paperTheme.colors.onSurface,
    },
    headerSubtitle: {
      fontSize: 12,
      color: paperTheme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    messagesList: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
    },
    messageContainer: {
      marginBottom: 16,
      maxWidth: '80%',
    },
    myMessageContainer: {
      alignSelf: 'flex-end',
      alignItems: 'flex-end',
    },
    otherMessageContainer: {
      alignSelf: 'flex-start',
      alignItems: 'flex-start',
    },
    senderName: {
      fontSize: 12,
      color: paperTheme.colors.onSurfaceVariant,
      marginBottom: 4,
      marginLeft: 8,
    },
    messageBubble: {
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxWidth: '100%',
    },
    myMessageBubble: {
      backgroundColor: paperTheme.colors.primary,
    },
    otherMessageBubble: {
      backgroundColor: paperTheme.colors.surface,
      borderWidth: 1,
      borderColor: paperTheme.colors.outline,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
    },
    myMessageText: {
      color: paperTheme.colors.onPrimary,
    },
    otherMessageText: {
      color: paperTheme.colors.onSurface,
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
      color: paperTheme.colors.onSurfaceVariant,
    },
    // 📖 [READ RECEIPT] 읽음 수 표시 스타일
    readReceipt: {
      fontSize: 10,
      color: paperTheme.colors.primary,
      fontWeight: '600',
    },
    systemMessageContainer: {
      alignItems: 'center',
      marginVertical: 8,
    },
    systemMessageText: {
      fontSize: 12,
      color: paperTheme.colors.onSurfaceVariant,
      backgroundColor: paperTheme.colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      textAlign: 'center',
    },
    inputContainer: {
      backgroundColor: paperTheme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: paperTheme.colors.outline,
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
      borderColor: paperTheme.colors.outline,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 12,
      maxHeight: 100,
      fontSize: 16,
      backgroundColor: paperTheme.colors.surfaceVariant,
      color: paperTheme.colors.onSurface,
    },
    sendButton: {
      backgroundColor: paperTheme.colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: paperTheme.colors.outline,
    },
    // 📷 Attachment Button
    attachButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    // 📷 Chat Image Styles
    imageBubble: {
      padding: 4,
      backgroundColor: 'transparent',
    },
    chatImage: {
      width: 200,
      height: 200,
      borderRadius: 12,
    },
    // 📷 Full-screen Image Viewer
    imageViewerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeImageButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      padding: 10,
    },
    fullScreenImage: {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height * 0.8,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={paperTheme.colors.primary} />
          <Text style={styles.loadingText}>{t('eventChat.loadingChatRoom')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name='arrow-back' size={24} color={paperTheme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {eventInfo?.title || eventTitle || t('eventChat.title')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {eventInfo && `${eventInfo.hostName} · ${formatEventTime(eventInfo.scheduledTime)}`}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name='information-circle-outline' size={24} color={paperTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 메시지 리스트 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        // 🔧 [FLICKER FIX] Removed onContentSizeChange, using smart scroll instead
        onScroll={handleScroll}
        scrollEventThrottle={100}
        keyboardShouldPersistTaps="handled"
      />

      {/* 메시지 입력 - 🔧 [FIX] Android navigation bar padding + keyboard scroll */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}
      >
        <View style={styles.inputRow}>
          {/* 📷 Attachment Button */}
          <TouchableOpacity
            onPress={sendImage}
            disabled={uploadingImage}
            style={styles.attachButton}
          >
            {uploadingImage ? (
              <ActivityIndicator size='small' color={paperTheme.colors.primary} />
            ) : (
              <Ionicons name='camera' size={24} color={paperTheme.colors.primary} />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={t('eventChat.inputPlaceholder')}
            placeholderTextColor={paperTheme.colors.onSurfaceVariant}
            multiline
            maxLength={500}
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
      </KeyboardAvoidingView>

      {/* 📷 Full-screen Image Viewer Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable
          style={styles.imageViewerOverlay}
          onPress={() => setSelectedImage(null)}
        >
          <TouchableOpacity
            style={styles.closeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default EventChatScreen;
