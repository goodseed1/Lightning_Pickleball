import { useState, useEffect } from 'react';
import clubService from '../../services/clubService';

export const useDirectChatUnreadCount = (userId: string | undefined) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // 📨 Subscribe to total unread count from conversations
  useEffect(() => {
    if (!userId) {
      return;
    }

    console.log(
      '[useDirectChatUnreadCount] Setting up conversations subscription for unread count'
    );

    const unsubscribe = clubService.subscribeToMyConversations(
      userId,
      (conversations: Array<{ unreadCount?: { [key: string]: number } }>) => {
        // Calculate total unread count
        const total = conversations.reduce((sum, conv) => {
          const myUnread = conv.unreadCount?.[userId] || 0;
          return sum + myUnread;
        }, 0);

        console.log(`[useDirectChatUnreadCount] Total unread messages: ${total}`);
        setTotalUnreadCount(total);
      }
    );

    return () => {
      console.log('[useDirectChatUnreadCount] Cleaning up conversations subscription');
      unsubscribe();
    };
  }, [userId]);

  return { totalUnreadCount };
};
