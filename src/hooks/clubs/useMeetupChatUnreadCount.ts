import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * 🔴 Hook to get total unread meetup chat messages across all meetups
 * Used for displaying red badges on My Clubs tab and individual meetup cards
 *
 * Data Source: users/{userId}/unreadMeetupChats/{meetupId}
 * Updated by: Cloud Function (onMeetupChatMessageCreated)
 *
 * Returns:
 * - totalUnreadCount: Total unread chat messages across all meetups (for red tab badge)
 * - meetupUnreadCounts: Per-meetup unread chat counts (for individual red meetup card badges)
 * - clubUnreadCounts: Per-club aggregated unread counts (for club-level badges)
 * - loading: Whether the data is still loading
 */
export const useMeetupChatUnreadCount = (userId: string | undefined) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [meetupUnreadCounts, setMeetupUnreadCounts] = useState<Record<string, number>>({});
  const [clubUnreadCounts, setClubUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTotalUnreadCount(0);
      setMeetupUnreadCounts({});
      setClubUnreadCounts({});
      setLoading(false);
      return;
    }

    console.log('[useMeetupChatUnreadCount] Setting up subscription for user:', userId);

    // Subscribe to user's unreadMeetupChats subcollection
    const unreadRef = collection(db, 'users', userId, 'unreadMeetupChats');

    const unsubscribe = onSnapshot(
      unreadRef,
      snapshot => {
        const meetupCounts: Record<string, number> = {};
        const clubCounts: Record<string, number> = {};
        let total = 0;

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const meetupId = doc.id;
          const count = data.count || 0;
          const clubId = data.clubId;

          meetupCounts[meetupId] = count;
          total += count;

          // Aggregate by club
          if (clubId) {
            clubCounts[clubId] = (clubCounts[clubId] || 0) + count;
          }
        });

        console.log(
          `[useMeetupChatUnreadCount] Total: ${total}, Meetups: ${Object.keys(meetupCounts).length}`
        );

        setMeetupUnreadCounts(meetupCounts);
        setClubUnreadCounts(clubCounts);
        setTotalUnreadCount(total);
        setLoading(false);
      },
      error => {
        console.error('[useMeetupChatUnreadCount] Error:', error);
        setLoading(false);
      }
    );

    return () => {
      console.log('[useMeetupChatUnreadCount] Cleaning up subscription');
      unsubscribe();
    };
  }, [userId]);

  return {
    totalUnreadCount,
    meetupUnreadCounts,
    clubUnreadCounts,
    loading,
  };
};
