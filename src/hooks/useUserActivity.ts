import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ActivityService from '../services/activityService';
import { EventWithParticipation } from '../types/activity';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase/config';

interface UseUserActivityOptions {
  newEventId?: string; // 🚀 [PERFORMANCE] For instant display after event creation
}

interface UseUserActivityReturn {
  appliedEvents: EventWithParticipation[];
  hostedEvents: EventWithParticipation[];
  pastEvents: EventWithParticipation[];
  loading: boolean;
  refreshActivity: () => Promise<void>;
  editEvent: (eventId: string, eventData: EventWithParticipation) => void;
}

export const useUserActivity = (options: UseUserActivityOptions = {}): UseUserActivityReturn => {
  const { newEventId } = options;
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  // Activity data states
  const [appliedEvents, setAppliedEvents] = useState<EventWithParticipation[]>([]);
  const [hostedEvents, setHostedEvents] = useState<EventWithParticipation[]>([]);
  const [pastEvents, setPastEvents] = useState<EventWithParticipation[]>([]);
  const [loading, setLoading] = useState(false);

  // Real-time subscription references (using useRef to avoid closure issues)
  const subscriptionsRef = useRef<{
    appliedEvents?: () => void;
    hostedEvents?: () => void;
  }>({});

  // 🎯 [KIM FIX v13] Real-time subscriptions for chatUnreadCount updates
  const appliedEventUnsubscribesRef = useRef<Map<string, Unsubscribe>>(new Map());
  const pastEventUnsubscribesRef = useRef<Map<string, Unsubscribe>>(new Map());

  // 🎯 [KIM FIX v13] Subscribe to real-time chatUnreadCount updates for applied events
  const subscribeToAppliedEventChatUpdates = useCallback((events: EventWithParticipation[]) => {
    if (!db) return;

    const currentUnsubscribes = appliedEventUnsubscribesRef.current;
    const currentEventIds = new Set(events.map(e => e.id));
    const existingEventIds = new Set(currentUnsubscribes.keys());

    // Unsubscribe from events no longer in the list
    existingEventIds.forEach(eventId => {
      if (!currentEventIds.has(eventId)) {
        const unsub = currentUnsubscribes.get(eventId);
        if (unsub) {
          console.log(`[useUserActivity] 🔌 Unsubscribing from applied event ${eventId}`);
          unsub();
          currentUnsubscribes.delete(eventId);
        }
      }
    });

    // Subscribe to new events
    events.forEach(event => {
      if (currentUnsubscribes.has(event.id)) {
        return; // Already subscribed
      }

      const unsubscribe = onSnapshot(
        doc(db, 'events', event.id),
        docSnapshot => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const newChatUnreadCount = data.chatUnreadCount as Record<string, number> | undefined;

            // Update chatUnreadCount in appliedEvents state
            setAppliedEvents(prev =>
              prev.map(e =>
                e.id === event.id ? { ...e, chatUnreadCount: newChatUnreadCount || {} } : e
              )
            );

            console.log(
              `[useUserActivity] 📦 Real-time chatUnreadCount update for applied event "${data.title}"`,
              newChatUnreadCount
            );
          }
        },
        error => {
          console.error(`[useUserActivity] Error subscribing to applied event ${event.id}:`, error);
        }
      );

      currentUnsubscribes.set(event.id, unsubscribe);
    });

    console.log(
      `[useUserActivity] 📦 Active applied event subscriptions: ${currentUnsubscribes.size}`
    );
  }, []);

  // 🎯 [KIM FIX v13] Subscribe to real-time chatUnreadCount updates for past events
  const subscribeToPastEventChatUpdates = useCallback((events: EventWithParticipation[]) => {
    if (!db) return;

    const currentUnsubscribes = pastEventUnsubscribesRef.current;
    const currentEventIds = new Set(events.map(e => e.id));
    const existingEventIds = new Set(currentUnsubscribes.keys());

    // Unsubscribe from events no longer in the list
    existingEventIds.forEach(eventId => {
      if (!currentEventIds.has(eventId)) {
        const unsub = currentUnsubscribes.get(eventId);
        if (unsub) {
          console.log(`[useUserActivity] 🔌 Unsubscribing from past event ${eventId}`);
          unsub();
          currentUnsubscribes.delete(eventId);
        }
      }
    });

    // Subscribe to new events
    events.forEach(event => {
      if (currentUnsubscribes.has(event.id)) {
        return; // Already subscribed
      }

      const unsubscribe = onSnapshot(
        doc(db, 'events', event.id),
        docSnapshot => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const newChatUnreadCount = data.chatUnreadCount as Record<string, number> | undefined;

            // Update chatUnreadCount in pastEvents state
            setPastEvents(prev =>
              prev.map(e =>
                e.id === event.id ? { ...e, chatUnreadCount: newChatUnreadCount || {} } : e
              )
            );

            console.log(
              `[useUserActivity] 📦 Real-time chatUnreadCount update for past event "${data.title}"`,
              newChatUnreadCount
            );
          }
        },
        error => {
          console.error(`[useUserActivity] Error subscribing to past event ${event.id}:`, error);
        }
      );

      currentUnsubscribes.set(event.id, unsubscribe);
    });

    console.log(
      `[useUserActivity] 📦 Active past event subscriptions: ${currentUnsubscribes.size}`
    );
  }, []);

  // Load past events (non-real-time data)
  const loadPastEvents = async () => {
    if (!currentUser?.uid) return;

    try {
      const pastEventsData = await ActivityService.getPastEvents(currentUser.uid);
      console.log('📜 Past events loaded:', pastEventsData.length);
      setPastEvents(pastEventsData);
      // 🎯 [KIM FIX v13] Subscribe to real-time chatUnreadCount updates
      subscribeToPastEventChatUpdates(pastEventsData);
    } catch (error) {
      console.error('❌ Error loading past events:', error);
    }
  };

  // Setup real-time subscriptions for all activity data
  const setupRealTimeSubscriptions = () => {
    if (!currentUser?.uid) return;

    console.log('🔄 Setting up unified real-time subscriptions for user:', currentUser.uid);
    setLoading(true);

    // Cleanup existing subscriptions
    cleanupSubscriptions();

    // ✅ Applied Events - persistent real-time subscription (both initial load and updates)
    const appliedEventsUnsubscribe = ActivityService.subscribeToAppliedEvents(
      currentUser.uid,
      events => {
        setAppliedEvents(events);
        setLoading(false); // Loading complete when first data arrives
        // 🎯 [KIM FIX v13] Subscribe to real-time chatUnreadCount updates
        subscribeToAppliedEventChatUpdates(events);
      }
    );

    // ✅ Hosted Events - persistent real-time subscription (both initial load and updates)
    const hostedEventsUnsubscribe = ActivityService.subscribeToHostedEvents(
      currentUser.uid,
      events => {
        setHostedEvents(events);
      }
      // No third parameter needed - defaults to { status: 'upcoming' }
    );

    // Store subscription references in ref (avoids closure issues)
    subscriptionsRef.current = {
      appliedEvents: appliedEventsUnsubscribe,
      hostedEvents: hostedEventsUnsubscribe,
    };

    // Load past events (non-real-time)
    loadPastEvents();
  };

  // Cleanup subscriptions (using ref.current for immediate access)
  const cleanupSubscriptions = () => {
    if (subscriptionsRef.current.appliedEvents) {
      subscriptionsRef.current.appliedEvents();
    }
    if (subscriptionsRef.current.hostedEvents) {
      subscriptionsRef.current.hostedEvents();
    }
    subscriptionsRef.current = {};

    // 🎯 [KIM FIX v13] Cleanup chat unread count subscriptions
    appliedEventUnsubscribesRef.current.forEach((unsub, eventId) => {
      console.log(`[useUserActivity] 🔌 Cleanup: Unsubscribing from applied event ${eventId}`);
      unsub();
    });
    appliedEventUnsubscribesRef.current.clear();

    pastEventUnsubscribesRef.current.forEach((unsub, eventId) => {
      console.log(`[useUserActivity] 🔌 Cleanup: Unsubscribing from past event ${eventId}`);
      unsub();
    });
    pastEventUnsubscribesRef.current.clear();
  };

  // Manual refresh functionality
  const refreshActivity = async () => {
    // Simply restart the real-time subscriptions to get fresh data
    setupRealTimeSubscriptions();
  };

  // Event editing handler
  const editEvent = () => {
    Alert.alert(t('userActivity.editEventTitle'), t('userActivity.editEventMessage'), [
      {
        text: t('userActivity.cancel'),
        style: 'cancel',
      },
      {
        text: t('userActivity.edit'),
        onPress: () => {
          // TODO: Navigate to CreateEventFormScreen with existing event data
          Alert.alert(t('userActivity.comingSoonTitle'), t('userActivity.comingSoonMessage'));
        },
      },
    ]);
  };

  // Initialize real-time subscriptions when user is available
  useEffect(() => {
    if (currentUser) {
      console.log(
        '🔍 useUserActivity: Setting up real-time subscriptions for user:',
        currentUser.uid
      );

      // Setup unified real-time subscriptions for both initial load and ongoing updates
      setupRealTimeSubscriptions();
    } else {
      // Clear data when user is not available
      setAppliedEvents([]);
      setHostedEvents([]);
      setPastEvents([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 useUserActivity unmounting, cleaning up subscriptions');
      cleanupSubscriptions();
    };
  }, []);

  // 🚀 [PERFORMANCE] Instant display for newly created event
  useEffect(() => {
    if (!newEventId || !currentUser?.uid) return;

    const loadNewEventImmediately = async () => {
      console.log('🚀 [INSTANT_DISPLAY] Loading new event immediately:', newEventId);
      try {
        const event = await ActivityService.getEventById(newEventId);
        if (event) {
          // Convert LightningEvent to EventWithParticipation with empty applications
          const eventWithParticipation: EventWithParticipation = {
            ...event,
            pendingApplications: [],
            approvedApplications: [],
            applications: [],
            currentParticipants: 1, // Host
          };

          // Add to hostedEvents if not already present
          setHostedEvents(prev => {
            const exists = prev.some(e => e.id === newEventId);
            if (exists) {
              console.log('🚀 [INSTANT_DISPLAY] Event already in list, skipping');
              return prev;
            }
            console.log('🚀 [INSTANT_DISPLAY] Adding event to hostedEvents');
            return [eventWithParticipation, ...prev];
          });
        }
      } catch (error) {
        console.error('❌ [INSTANT_DISPLAY] Error loading new event:', error);
      }
    };

    loadNewEventImmediately();
  }, [newEventId, currentUser?.uid]);

  return {
    appliedEvents,
    hostedEvents,
    pastEvents,
    loading,
    refreshActivity,
    editEvent,
  };
};

export default useUserActivity;
