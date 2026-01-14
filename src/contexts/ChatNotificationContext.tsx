import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { Snackbar, useTheme, Text } from 'react-native-paper';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import clubService from '../services/clubService';
import activityService from '../services/activityService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Type definitions for service responses
interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  participantPhotos?: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Date | { toDate: () => Date } | null;
  lastMessageSenderId: string;
  unreadCount?: { [key: string]: number };
}

interface ClubMembership {
  clubId: string;
  role: string;
  joinedAt: Date;
}

interface ChatNotification {
  id: string;
  type: 'direct' | 'club' | 'event';
  chatId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

interface ChatNotificationContextType {
  showNotification: (notification: ChatNotification) => void;
  hideNotification: () => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useChatNotification = () => {
  const context = useContext(ChatNotificationContext);
  if (!context) {
    throw new Error('useChatNotification must be used within ChatNotificationProvider');
  }
  return context;
};

interface ChatNotificationProviderProps {
  children: ReactNode;
}

export const ChatNotificationProvider: React.FC<ChatNotificationProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<ChatNotification | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const paperTheme = useTheme();
  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Get current route name to determine focus
  const currentRouteName = useNavigationState(state => {
    if (!state) return undefined;
    const route = state.routes[state.index];
    return route.name;
  });

  console.log('✅ [ChatNotificationContext] Navigation available');

  const showNotification = useCallback((notification: ChatNotification) => {
    console.log('🔔 [ChatNotificationContext] showNotification called!');
    console.log('   - notification:', notification);

    setCurrentNotification(notification);
    setVisible(true);

    console.log('✅ [ChatNotificationContext] Toast should be visible now!');
  }, []);

  const hideNotification = useCallback(() => {
    setVisible(false);
    setCurrentNotification(null);
  }, []);

  // 🔔 Global Subscriptions - Subscribe to all chats when user logs in
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('⚠️ [ChatNotificationContext] No user logged in - skipping subscriptions');
      return;
    }

    console.log(
      '🔔 [ChatNotificationContext] Setting up global subscriptions for user:',
      currentUser.uid
    );

    // Clean up old subscriptions FIRST
    subscriptionsRef.current.forEach(unsub => {
      try {
        unsub();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    subscriptionsRef.current = [];

    // Now set up new subscriptions
    const setupSubscriptions = async () => {
      const newSubscriptions: (() => void)[] = [];

      try {
        // 1. Subscribe to direct chats
        console.log('📱 [ChatNotificationContext] Subscribing to direct chats...');
        const unsubscribeConversations = clubService.subscribeToMyConversations(
          currentUser.uid,
          (conversations: Conversation[]) => {
            console.log(
              '🔔 [ChatNotificationContext] Conversations updated:',
              conversations.length
            );

            conversations.forEach((conv: Conversation) => {
              const unsubscribeMessages = clubService.subscribeToDirectChat(
                conv.id,
                () => {
                  // Keep subscription alive
                },
                currentUser.uid,
                (notification: ChatNotification) => {
                  console.log('🔔 [ChatNotificationContext] Direct chat notification received!');
                  console.log('   - currentRouteName:', currentRouteName);

                  const shouldShowNotification = currentRouteName !== 'DirectChatRoom';

                  if (shouldShowNotification) {
                    console.log('✅ [ChatNotificationContext] Showing notification');
                    showNotification(notification);
                  } else {
                    console.log('❌ [ChatNotificationContext] Skipping notification (in chat)');
                  }
                }
              ) as () => void;

              newSubscriptions.push(unsubscribeMessages);
            });
          }
        );
        newSubscriptions.push(unsubscribeConversations);

        // 2. Subscribe to club chats
        console.log('🏢 [ChatNotificationContext] Subscribing to club chats...');
        const clubMemberships = (await clubService.getUserClubMemberships(
          currentUser.uid
        )) as ClubMembership[];

        clubMemberships.forEach((membership: ClubMembership) => {
          const unsubscribeClubChat = clubService.subscribeToClubChat(
            membership.clubId,
            () => {
              // Keep subscription alive
            },
            currentUser.uid,
            (notification: ChatNotification) => {
              console.log('🔔 [ChatNotificationContext] Club chat notification received!');

              if (currentRouteName !== 'ClubChat') {
                console.log('✅ [ChatNotificationContext] Showing club chat notification');
                showNotification(notification);
              } else {
                console.log('❌ [ChatNotificationContext] Skipping club chat notification');
              }
            }
          ) as () => void;

          newSubscriptions.push(unsubscribeClubChat);
        });

        // 3. Subscribe to event chats
        console.log('📅 [ChatNotificationContext] Subscribing to event chats...');

        // Query event_chat_rooms where user is a participant
        const chatRoomsQuery = query(
          collection(db, 'event_chat_rooms'),
          where('participants', 'array-contains', currentUser.uid)
        );

        const unsubscribeChatRooms = onSnapshot(chatRoomsQuery, snapshot => {
          console.log(
            `🔔 [ChatNotificationContext] Found ${snapshot.docs.length} event chat rooms`
          );

          snapshot.docs.forEach(chatRoomDoc => {
            const chatRoomId = chatRoomDoc.id;

            console.log(`📡 [ChatNotificationContext] Subscribing to event chat: ${chatRoomId}`);

            // Subscribe to messages in this chat room
            const unsubscribeMessages = activityService.subscribeToChatMessages(
              chatRoomId,
              () => {
                // Keep subscription alive
              },
              currentUser.uid,
              (notification: ChatNotification) => {
                console.log('🔔 [ChatNotificationContext] Event chat notification received!');
                console.log('   - currentRouteName:', currentRouteName);

                // Only show notification if NOT in EventChat screen
                if (currentRouteName !== 'EventChat') {
                  console.log('✅ [ChatNotificationContext] Showing event chat notification');
                  showNotification(notification);
                } else {
                  console.log(
                    '❌ [ChatNotificationContext] Skipping event chat notification (in chat)'
                  );
                }
              }
            ) as () => void;

            newSubscriptions.push(unsubscribeMessages);
          });
        });

        newSubscriptions.push(unsubscribeChatRooms);

        // Store all subscriptions in ref
        subscriptionsRef.current = newSubscriptions;

        console.log('✅ [ChatNotificationContext] All subscriptions set up!', {
          total: newSubscriptions.length,
          clubs: clubMemberships.length,
        });
      } catch (error) {
        // 🔇 로그아웃 시 permission-denied 에러는 예상된 동작이므로 조용히 처리
        const firebaseError = error as { code?: string };
        if (firebaseError?.code === 'permission-denied') {
          console.log('🔒 [ChatNotificationContext] Subscriptions ended (user signed out)');
        } else {
          console.error('❌ [ChatNotificationContext] Error setting up subscriptions:', error);
        }
      }
    };

    setupSubscriptions();

    return () => {
      console.log('🔔 [ChatNotificationContext] Cleaning up global subscriptions');
      subscriptionsRef.current.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      });
      subscriptionsRef.current = [];
    };
  }, [currentUser?.uid, currentRouteName, showNotification]); // ← ONLY depend on currentUser.uid, NOT on other state!

  const handlePress = useCallback(() => {
    if (!currentNotification) return;

    // Navigate based on chat type
    switch (currentNotification.type) {
      case 'direct':
        // For direct chat, we need to navigate to DirectChatRoom
        // Note: We'll need to fetch additional params from Firestore if needed
        navigation.navigate('DirectChatRoom', {
          conversationId: currentNotification.chatId,
          // These will be fetched by the screen
          otherUserId: currentNotification.senderId,
          otherUserName: currentNotification.senderName,
          otherUserPhotoURL: '',
        });
        break;
      case 'club':
        navigation.navigate('ClubChat', {
          clubId: currentNotification.chatId,
        });
        break;
      case 'event':
        navigation.navigate('EventChat', {
          eventId: currentNotification.chatId,
        });
        break;
    }

    hideNotification();
  }, [currentNotification, navigation, hideNotification]);

  const message = currentNotification
    ? t('contexts.chatNotification.messageFrom', {
        senderName: currentNotification.senderName,
        message:
          currentNotification.message.substring(0, 50) +
          (currentNotification.message.length > 50 ? '...' : ''),
      })
    : '';

  console.log('🔔 [ChatNotificationContext] Rendering - visible:', visible, 'message:', message);

  return (
    <ChatNotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hideNotification}
        duration={4000}
        action={{
          label: t('contexts.chatNotification.viewAction'),
          onPress: handlePress,
          labelStyle: {
            color: paperTheme.colors.primary,
            fontWeight: '700',
          },
        }}
        style={{
          position: 'absolute',
          top: 50,
          left: 16,
          right: 16,
          zIndex: 9999,
          elevation: 10,
          backgroundColor: '#000000',
          borderWidth: 2,
          borderColor: paperTheme.colors.primary,
          borderRadius: 8,
        }}
        wrapperStyle={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        }}
        theme={{
          colors: {
            surface: '#000000',
            onSurface: paperTheme.colors.primary,
            primary: paperTheme.colors.primary,
            inversePrimary: paperTheme.colors.primary,
          },
        }}
      >
        <Text style={{ color: paperTheme.colors.primary, fontSize: 14 }}>{message}</Text>
      </Snackbar>
    </ChatNotificationContext.Provider>
  );
};
