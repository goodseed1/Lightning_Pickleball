import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * 🔴🟡 Hook to get total unread club chat messages AND notifications across all clubs
 * Used for displaying red/yellow badges on MyClubs tab and individual club cards
 *
 * Returns:
 * - totalUnreadCount: Total unread chat messages across all clubs (for red tab badge)
 * - clubUnreadCounts: Per-club unread chat counts (for individual red club card badges)
 * - totalNotificationCount: Total unread notifications across all clubs (for yellow tab badge)
 * - clubNotificationCounts: Per-club notification counts (for individual yellow club card badges)
 */
export const useClubChatUnreadCount = (userId: string | undefined) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [clubUnreadCounts, setClubUnreadCounts] = useState<Record<string, number>>({});
  // 🟡 NEW: Notification counts for yellow badges
  const [totalNotificationCount, setTotalNotificationCount] = useState(0);
  const [clubNotificationCounts, setClubNotificationCounts] = useState<Record<string, number>>({});
  const [clubIds, setClubIds] = useState<string[]>([]);

  // 1️⃣ First, subscribe to user's club memberships to get club IDs
  useEffect(() => {
    if (!userId) {
      setClubIds([]);
      return;
    }

    console.log('[useClubChatUnreadCount] Setting up club memberships subscription');

    // 🔧 FIX: Use 'userId' field (not 'memberId') - matches clubService.js query pattern
    const membershipsQuery = query(
      collection(db, 'clubMembers'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      membershipsQuery,
      snapshot => {
        const ids = snapshot.docs.map(doc => doc.data().clubId as string);
        console.log(`[useClubChatUnreadCount] User is member of ${ids.length} clubs`);
        setClubIds(ids);
      },
      error => {
        console.error('[useClubChatUnreadCount] Error fetching memberships:', error);
      }
    );

    return () => {
      console.log('[useClubChatUnreadCount] Cleaning up memberships subscription');
      unsubscribe();
    };
  }, [userId]);

  // 2️⃣ Then, subscribe to unread messages for all clubs
  useEffect(() => {
    if (!userId || clubIds.length === 0) {
      setTotalUnreadCount(0);
      return;
    }

    console.log(
      `[useClubChatUnreadCount] Setting up chat subscriptions for ${clubIds.length} clubs`
    );

    const unsubscribes: (() => void)[] = [];
    const unreadCounts: Record<string, number> = {};

    // Subscribe to each club's chat messages
    clubIds.forEach(clubId => {
      const chatQuery = query(
        collection(db, 'clubChat'),
        where('clubId', '==', clubId),
        where('isDeleted', '==', false)
      );

      const unsubscribe = onSnapshot(
        chatQuery,
        snapshot => {
          // Count unread messages (not sent by me, not read by me)
          const unread = snapshot.docs.filter(doc => {
            const data = doc.data();
            return (
              data.type === 'text' &&
              data.senderId !== userId &&
              (!data.readBy || !data.readBy.includes(userId))
            );
          }).length;

          unreadCounts[clubId] = unread;

          // Calculate total across all clubs
          const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
          console.log(`[useClubChatUnreadCount] Club ${clubId}: ${unread} unread, Total: ${total}`);
          setTotalUnreadCount(total);

          // Also update per-club counts for individual badge display
          setClubUnreadCounts({ ...unreadCounts });
        },
        error => {
          console.error(`[useClubChatUnreadCount] Error for club ${clubId}:`, error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      console.log('[useClubChatUnreadCount] Cleaning up all chat subscriptions');
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userId, clubIds]);

  // 3️⃣ 🟡 Subscribe to notifications for all clubs (yellow badge)
  useEffect(() => {
    if (!userId || clubIds.length === 0) {
      setTotalNotificationCount(0);
      setClubNotificationCounts({});
      return;
    }

    console.log(
      `[useClubChatUnreadCount] 🟡 Setting up notifications subscriptions for ${clubIds.length} clubs`
    );

    const unsubscribes: (() => void)[] = [];
    const notifCounts: Record<string, number> = {};

    // Subscribe to each club's notifications
    clubIds.forEach(clubId => {
      const notifQuery = query(
        collection(db, 'notifications'),
        where('clubId', '==', clubId),
        where('recipientId', '==', userId),
        where('status', '==', 'unread')
      );

      const unsubscribe = onSnapshot(
        notifQuery,
        snapshot => {
          notifCounts[clubId] = snapshot.docs.length;

          // Calculate total across all clubs
          const total = Object.values(notifCounts).reduce((sum, count) => sum + count, 0);
          console.log(
            `[useClubChatUnreadCount] 🟡 Club ${clubId}: ${snapshot.docs.length} unread notifications, Total: ${total}`
          );
          setTotalNotificationCount(total);
          setClubNotificationCounts({ ...notifCounts });
        },
        error => {
          console.error(`[useClubChatUnreadCount] 🟡 Notification error for club ${clubId}:`, error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      console.log('[useClubChatUnreadCount] 🟡 Cleaning up all notification subscriptions');
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userId, clubIds]);

  return { totalUnreadCount, clubUnreadCounts, totalNotificationCount, clubNotificationCounts };
};
