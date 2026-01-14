import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, Unsubscribe } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * 🔴 Hook to get total unread event chat messages across ALL relevant events
 * Used for displaying red badge on MyProfile tab (combined with Direct Chat unread)
 *
 * Data source: events/{eventId}.chatUnreadCount.{userId}
 * - Stored by: functions/src/saveChatMessage.ts
 * - Reset by: functions/src/markEventChatAsRead.ts
 *
 * 🎯 [KIM FIX v5] Time-based filtering to match Activity tabs visibility
 * - Meetup events (번개모임): Exclude if completed for more than 24 hours
 * - This aligns badge count with what's actually visible in Activity tabs
 *
 * 🎯 [KIM FIX v4] Only count events that appear in Activity tabs
 * - Events where user is host (hostId == userId)
 * - Events where user has an application (participation_applications)
 * - This fixes the issue where events in 'participants' array but without
 *   an application were being counted (e.g., 번개모임 직접 참가자 추가)
 *
 * 🎯 [KIM FIX v3] Include completed events for past activity history badges
 * - EventStatus: 'upcoming' | 'active' | 'completed' | 'cancelled' | 'partner_pending'
 * - Count unread: upcoming, active, partner_pending, completed (지난 활동 기록)
 * - Skip: cancelled (취소된 이벤트만 제외)
 */
export const useEventChatUnreadCount = (userId: string | undefined) => {
  const [totalEventChatUnread, setTotalEventChatUnread] = useState(0);

  // 🎯 [KIM FIX v4] Track event IDs where user has an application
  const applicationEventIdsRef = useRef<Set<string>>(new Set());
  // 🎯 [KIM FIX v10] Reference to mergeAndRecalculate function for calling after async fetch
  const mergeAndRecalculateRef = useRef<(() => void) | null>(null);
  // 🎯 [KIM FIX v12] Track unsubscribe functions for application event subscriptions
  const applicationEventUnsubscribesRef = useRef<Map<string, Unsubscribe>>(new Map());
  // 🎯 [KIM FIX v9] Track events fetched directly from applicationEventIds (useRef for persistence)
  const applicationEventsRef = useRef<
    Array<{
      id: string;
      hostId: string;
      applicantId: string | undefined;
      status: string | undefined;
      chatUnreadCount: Record<string, number> | undefined;
      title: string;
      type: string | undefined;
      gameType: string | undefined;
      scheduledTime: Date | undefined;
      duration: number | undefined;
    }>
  >([]);
  // 🎯 [KIM FIX v4+v5+v6] Track events data for recalculation (with time-based fields)
  const eventsDataRef = useRef<
    Array<{
      id: string;
      hostId: string;
      applicantId: string | undefined; // 🎯 [KIM FIX v6] Added for challenger support
      status: string | undefined;
      chatUnreadCount: Record<string, number> | undefined;
      title: string;
      // 🎯 [KIM FIX v5] Time-based filtering fields
      type: string | undefined;
      gameType: string | undefined;
      scheduledTime: Date | undefined;
      duration: number | undefined;
    }>
  >([]);

  useEffect(() => {
    if (!userId) {
      setTotalEventChatUnread(0);
      return;
    }

    console.log('[useEventChatUnreadCount] Setting up subscriptions for unread chat count');

    // 🎯 [KIM FIX v5] Helper to check if event is a meetup (based on type or gameType)
    const isMeetupEvent = (type: string | undefined, gameType: string | undefined): boolean => {
      // Rally is always a meetup, regardless of type field
      if (gameType === 'rally') return true;
      // Explicit meetup type
      if (type === 'meetup') return true;
      return false;
    };

    // 🎯 [KIM FIX v5] Helper to check if event has been completed for more than 24 hours
    const isCompletedFor24Hours = (
      scheduledTime: Date | undefined,
      duration: number | undefined
    ): boolean => {
      if (!scheduledTime) return false;
      const now = new Date();
      const durationMs = (duration || 120) * 60 * 1000; // Default 2 hours
      const estimatedEndTime = new Date(scheduledTime.getTime() + durationMs);
      const hoursSinceCompletion = (now.getTime() - estimatedEndTime.getTime()) / (1000 * 60 * 60);
      return hoursSinceCompletion >= 24;
    };

    // 🎯 [KIM FIX v5] Helper to check if event is visible in Activity tabs
    // This mirrors the logic in activityService.isActiveOrRecentlyCompleted
    const isVisibleInActivityTabs = (event: (typeof eventsDataRef.current)[0]): boolean => {
      const { type, gameType, scheduledTime, duration, status } = event;
      const isMeetup = isMeetupEvent(type, gameType);

      // partner_pending always visible
      if (status === 'partner_pending') return true;

      // If no scheduledTime, can't determine - include by default
      if (!scheduledTime) return true;

      const now = new Date();

      // Future events are always visible
      if (scheduledTime > now) return true;

      // Event has started - check if ongoing
      const durationMs = (duration || 120) * 60 * 1000;
      const estimatedEndTime = new Date(scheduledTime.getTime() + durationMs);
      if (now <= estimatedEndTime) return true;

      // 🎯 [KIM FIX v5.1] Different handling for meetups vs matches
      // - Meetups: NOT visible after 24h (no score recording, not in 지난 활동)
      // - Matches: ALWAYS visible (shown in 지난 활동 기록 for score entry)
      if (isMeetup) {
        const completed24h = isCompletedFor24Hours(scheduledTime, duration);
        return !completed24h; // Meetups: hide after 24h
      }

      // Matches: always visible in Activity tabs (지난 활동 기록)
      return true;
    };

    // 🎯 [KIM FIX v4+v5] Function to recalculate total based on current data
    const recalculateTotal = () => {
      let total = 0;
      const countableStatuses = ['upcoming', 'active', 'partner_pending', 'completed'];
      const applicationEventIds = applicationEventIdsRef.current;
      const eventsData = eventsDataRef.current;

      console.log(
        `[useEventChatUnreadCount] 🔄 Recalculating with ${eventsData.length} events and ${applicationEventIds.size} applications`
      );

      eventsData.forEach(event => {
        const { id, hostId, applicantId, status, chatUnreadCount, title, type, gameType } = event;
        const isHost = hostId === userId;
        const isApplicant = applicantId === userId;
        const hasApplication = applicationEventIds.has(id);

        // 🎯 [KIM FIX v6] Only count if user is host, applicant, OR has an application
        // This ensures we only count events visible in Activity tabs
        if (!isHost && !isApplicant && !hasApplication) {
          console.log(
            `[useEventChatUnreadCount] 🚫 Skipping event "${title}" - not host, not applicant, and no application`
          );
          return;
        }

        // Filter by status - only skip cancelled events
        if (!status || !countableStatuses.includes(status)) {
          console.log(`[useEventChatUnreadCount] ⏭️ Skipping event "${title}" - status: ${status}`);
          return;
        }

        // 🎯 [KIM FIX v5] Time-based visibility check (matches Activity tabs logic)
        if (!isVisibleInActivityTabs(event)) {
          console.log(
            `[useEventChatUnreadCount] ⏰ Skipping event "${title}" - completed 24h+ ago (type: ${type}, gameType: ${gameType})`
          );
          return;
        }

        // 🔍 [DEBUG] Log chatUnreadCount details
        console.log(
          `[useEventChatUnreadCount] 📊 Event "${title}" chatUnreadCount:`,
          JSON.stringify(chatUnreadCount),
          `userId: ${userId}`
        );

        if (chatUnreadCount && typeof chatUnreadCount[userId] === 'number') {
          total += chatUnreadCount[userId];
          console.log(
            `[useEventChatUnreadCount] ✅ Event "${title}" (${status}, host: ${isHost}, applicant: ${isApplicant}, app: ${hasApplication}): ${chatUnreadCount[userId]} unread`
          );
        } else {
          console.log(
            `[useEventChatUnreadCount] ⚠️ Event "${title}" - no unread count for user (chatUnreadCount exists: ${!!chatUnreadCount})`
          );
        }
      });

      console.log(`[useEventChatUnreadCount] Total unread event chat messages: ${total}`);
      setTotalEventChatUnread(total);
    };

    // 🎯 [KIM FIX v4] Subscribe to applications to know which events user has applied to
    // Query 1: Applications where user is applicant
    const applicantQuery = query(
      collection(db, 'participation_applications'),
      where('applicantId', '==', userId)
    );

    // Query 2: Applications where user is partner
    const partnerQuery = query(
      collection(db, 'participation_applications'),
      where('partnerId', '==', userId)
    );

    // Track application data from both queries
    let applicantEventIds = new Set<string>();
    let partnerEventIds = new Set<string>();

    // 🎯 [KIM FIX v12] Subscribe to events by ID from applicationEventIds (REAL-TIME!)
    // Changed from getDoc to onSnapshot for real-time badge updates
    const subscribeToApplicationEvents = (eventIds: Set<string>) => {
      const currentUnsubscribes = applicationEventUnsubscribesRef.current;
      const currentEventIds = new Set(currentUnsubscribes.keys());

      // Find events to unsubscribe (no longer in the set)
      currentEventIds.forEach(existingId => {
        if (!eventIds.has(existingId)) {
          const unsub = currentUnsubscribes.get(existingId);
          if (unsub) {
            console.log(`[useEventChatUnreadCount] 🔌 Unsubscribing from event ${existingId}`);
            unsub();
            currentUnsubscribes.delete(existingId);
          }
          // Remove from applicationEventsRef
          applicationEventsRef.current = applicationEventsRef.current.filter(
            e => e.id !== existingId
          );
        }
      });

      if (eventIds.size === 0) {
        applicationEventsRef.current = [];
        console.log('[useEventChatUnreadCount] 📦 No application IDs to subscribe');
        // Trigger recalculate since we may have removed events
        if (mergeAndRecalculateRef.current) {
          mergeAndRecalculateRef.current();
        }
        return;
      }

      console.log(
        `[useEventChatUnreadCount] 📦 Setting up real-time subscriptions for ${eventIds.size} events:`,
        Array.from(eventIds)
      );

      // Subscribe to new events (not already subscribed)
      eventIds.forEach(eventId => {
        if (currentUnsubscribes.has(eventId)) {
          // Already subscribed to this event
          return;
        }

        const unsubscribe = onSnapshot(
          doc(db, 'events', eventId),
          docSnapshot => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              let scheduledTime: Date | undefined;
              if (data.scheduledTime) {
                if (typeof data.scheduledTime.toDate === 'function') {
                  scheduledTime = data.scheduledTime.toDate();
                } else if (data.scheduledTime instanceof Date) {
                  scheduledTime = data.scheduledTime;
                } else if (typeof data.scheduledTime === 'string') {
                  scheduledTime = new Date(data.scheduledTime);
                }
              }

              const eventData = {
                id: docSnapshot.id,
                hostId: data.hostId as string,
                applicantId: data.applicantId as string | undefined,
                status: data.status as string | undefined,
                chatUnreadCount: data.chatUnreadCount as Record<string, number> | undefined,
                title: data.title as string,
                type: data.type as string | undefined,
                gameType: data.gameType as string | undefined,
                scheduledTime,
                duration: data.duration as number | undefined,
              };

              // Update or add to applicationEventsRef
              const existingIndex = applicationEventsRef.current.findIndex(e => e.id === eventId);
              if (existingIndex >= 0) {
                applicationEventsRef.current[existingIndex] = eventData;
              } else {
                applicationEventsRef.current.push(eventData);
              }

              console.log(
                `[useEventChatUnreadCount] 📦 Real-time update for "${data.title}" (${eventId})`,
                `chatUnreadCount:`,
                JSON.stringify(data.chatUnreadCount)
              );

              // 🎯 [KIM FIX v12] Trigger merge immediately on each update for real-time badges!
              if (mergeAndRecalculateRef.current) {
                mergeAndRecalculateRef.current();
              }
            } else {
              console.log(`[useEventChatUnreadCount] ⚠️ Event ${eventId} not found`);
              // Remove from applicationEventsRef if it doesn't exist
              applicationEventsRef.current = applicationEventsRef.current.filter(
                e => e.id !== eventId
              );
              if (mergeAndRecalculateRef.current) {
                mergeAndRecalculateRef.current();
              }
            }
          },
          error => {
            console.error(
              `[useEventChatUnreadCount] Error subscribing to event ${eventId}:`,
              error
            );
          }
        );

        currentUnsubscribes.set(eventId, unsubscribe);
      });

      console.log(
        `[useEventChatUnreadCount] 📦 Active subscriptions: ${currentUnsubscribes.size} events`
      );
    };

    const updateApplicationEventIds = () => {
      const newIds = new Set([...applicantEventIds, ...partnerEventIds]);
      applicationEventIdsRef.current = newIds;
      console.log(
        `[useEventChatUnreadCount] 📋 Application event IDs updated: ${applicationEventIdsRef.current.size} events`
      );

      // 🎯 [KIM FIX v12] Subscribe to events in real-time instead of one-time fetch
      // This enables real-time badge updates when chatUnreadCount changes
      subscribeToApplicationEvents(newIds);
    };

    // Subscribe to applicant applications
    const unsubscribeApplicant = onSnapshot(
      applicantQuery,
      snapshot => {
        applicantEventIds = new Set(snapshot.docs.map(doc => doc.data().eventId as string));
        console.log(
          `[useEventChatUnreadCount] 📥 Applicant applications: ${applicantEventIds.size} events`
        );
        updateApplicationEventIds();
      },
      error => {
        console.error('[useEventChatUnreadCount] Error fetching applicant applications:', error);
      }
    );

    // Subscribe to partner applications
    const unsubscribePartner = onSnapshot(
      partnerQuery,
      snapshot => {
        partnerEventIds = new Set(snapshot.docs.map(doc => doc.data().eventId as string));
        console.log(
          `[useEventChatUnreadCount] 📥 Partner applications: ${partnerEventIds.size} events`
        );
        updateApplicationEventIds();
      },
      error => {
        console.error('[useEventChatUnreadCount] Error fetching partner applications:', error);
      }
    );

    // 🎯 [KIM FIX v7+v8] Split into 3 separate queries + direct fetch from applicationEventIds
    // This ensures we get events even if applicantId field doesn't match

    // Helper to parse event data from snapshot
    const parseEventData = (docSnap: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnap.data();
      let scheduledTime: Date | undefined;
      if (data.scheduledTime) {
        if (typeof (data.scheduledTime as { toDate?: () => Date }).toDate === 'function') {
          scheduledTime = (data.scheduledTime as { toDate: () => Date }).toDate();
        } else if (data.scheduledTime instanceof Date) {
          scheduledTime = data.scheduledTime;
        } else if (typeof data.scheduledTime === 'string') {
          scheduledTime = new Date(data.scheduledTime);
        }
      }
      return {
        id: docSnap.id,
        hostId: data.hostId as string,
        applicantId: data.applicantId as string | undefined,
        status: data.status as string | undefined,
        chatUnreadCount: data.chatUnreadCount as Record<string, number> | undefined,
        title: data.title as string,
        type: data.type as string | undefined,
        gameType: data.gameType as string | undefined,
        scheduledTime,
        duration: data.duration as number | undefined,
      };
    };

    // Track events from 3 separate queries
    let hostEvents: typeof applicationEventsRef.current = [];
    let applicantIdEvents: typeof applicationEventsRef.current = [];
    let participantEvents: typeof applicationEventsRef.current = [];

    const mergeAndRecalculate = () => {
      // 🎯 [KIM FIX v9] Merge all events including applicationEventsRef (direct fetch)
      const allEventsMap = new Map<string, (typeof applicationEventsRef.current)[0]>();

      // Add events from queries
      hostEvents.forEach(e => allEventsMap.set(e.id, e));
      applicantIdEvents.forEach(e => allEventsMap.set(e.id, e));
      participantEvents.forEach(e => allEventsMap.set(e.id, e));

      // 🎯 [KIM FIX v9] Add events from applicationEventsRef (direct fetch via useRef)
      // This ensures we include events where user has an application but isn't in any query
      applicationEventsRef.current.forEach(e => allEventsMap.set(e.id, e));

      eventsDataRef.current = Array.from(allEventsMap.values());

      console.log(
        `[useEventChatUnreadCount] 🔍 Merged events: ${eventsDataRef.current.length} total ` +
          `(host: ${hostEvents.length}, applicantId: ${applicantIdEvents.length}, participant: ${participantEvents.length}, fromApps: ${applicationEventsRef.current.length})`
      );

      recalculateTotal();
    };

    // 🎯 [KIM FIX v10] Store reference so fetchApplicationEvents can trigger recalculation
    mergeAndRecalculateRef.current = mergeAndRecalculate;

    // Query 1: Events where user is host
    const hostQuery = query(collection(db, 'events'), where('hostId', '==', userId));

    const unsubscribeHost = onSnapshot(
      hostQuery,
      snapshot => {
        hostEvents = snapshot.docs.map(parseEventData);
        console.log(`[useEventChatUnreadCount] 🏠 Host events: ${hostEvents.length}`);
        mergeAndRecalculate();
      },
      error => {
        console.error('[useEventChatUnreadCount] Error fetching host events:', error);
      }
    );

    // Query 2: Events where user is applicant (challenger)
    const applicantIdQuery = query(collection(db, 'events'), where('applicantId', '==', userId));

    const unsubscribeApplicantEvents = onSnapshot(
      applicantIdQuery,
      snapshot => {
        applicantIdEvents = snapshot.docs.map(parseEventData);
        console.log(`[useEventChatUnreadCount] 🎯 ApplicantId events: ${applicantIdEvents.length}`);
        mergeAndRecalculate();
      },
      error => {
        console.error('[useEventChatUnreadCount] Error fetching applicant events:', error);
      }
    );

    // Query 3: Events where user is in participants array
    const participantsQuery = query(
      collection(db, 'events'),
      where('participants', 'array-contains', userId)
    );

    const unsubscribeParticipants = onSnapshot(
      participantsQuery,
      snapshot => {
        participantEvents = snapshot.docs.map(parseEventData);
        console.log(`[useEventChatUnreadCount] 👥 Participant events: ${participantEvents.length}`);
        mergeAndRecalculate();
      },
      error => {
        console.error('[useEventChatUnreadCount] Error fetching participant events:', error);
      }
    );

    // 🎯 [KIM FIX v12] Capture ref value for cleanup (ESLint react-hooks/exhaustive-deps)
    const applicationEventUnsubscribes = applicationEventUnsubscribesRef.current;

    return () => {
      console.log('[useEventChatUnreadCount] Cleaning up subscriptions');
      unsubscribeApplicant();
      unsubscribePartner();
      unsubscribeHost();
      unsubscribeApplicantEvents();
      unsubscribeParticipants();
      // 🎯 [KIM FIX v12] Clean up application event subscriptions
      applicationEventUnsubscribes.forEach((unsub, eventId) => {
        console.log(`[useEventChatUnreadCount] 🔌 Cleanup: Unsubscribing from event ${eventId}`);
        unsub();
      });
      applicationEventUnsubscribes.clear();
    };
  }, [userId]);

  return { totalEventChatUnread };
};
