/**
 * Activity Service for Lightning Tennis App
 * Handles all event-related operations including applications, hosting, and participation
 *
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  onSnapshot,
  updateDoc,
  Timestamp,
  writeBatch,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Use centralized Firebase configuration
import { db, functions, auth } from '../firebase/config';

let isFirebaseAvailable = false;

try {
  // Check if Firebase services are properly initialized
  if (db && functions) {
    isFirebaseAvailable = true;
    console.log(
      '🔥 ActivityService: Firebase services loaded successfully from centralized config'
    );
  } else {
    throw new Error('Firebase services not properly initialized');
  }
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn('⚠️ ActivityService: Firebase not available, using mock mode:', message);
  isFirebaseAvailable = false;
}
import {
  LightningEvent,
  ParticipationApplication,
  EventWithParticipation,
  ParticipationStatus,
  LocationDetailsInput,
} from '../types/activity';
import { MatchScore } from '../types/match';
import { RankingUpdateData } from '../types/user';
import { safeToDate } from '../utils/dateUtils';
import { isMeetupEvent } from '../utils/dataUtils';
import rankingService from './rankingService';
import i18n from '../i18n';

class ActivityService {
  private readonly EVENTS_COLLECTION = 'events'; // 실제 사용하는 컬렉션 이름으로 변경
  private readonly APPLICATIONS_COLLECTION = 'participation_applications';
  private readonly CHAT_ROOMS_COLLECTION = 'event_chat_rooms';
  private readonly NOTIFICATIONS_COLLECTION = 'activity_notifications';

  // ==========================================
  // EVENT CREATION
  // ==========================================

  /**
   * Create a new event
   */
  async createEvent(
    eventData: Partial<LightningEvent> & { locationDetails?: LocationDetailsInput }
  ): Promise<string> {
    try {
      console.log('ActivityService: Creating new event:', eventData);
      // 🔍 [DEBUG] Specifically log autoApproval field
      console.log(
        '🔍 [DEBUG] eventData.autoApproval:',
        (eventData as { autoApproval?: boolean }).autoApproval
      );

      // Firebase 사용 가능성 확인
      if (!isFirebaseAvailable || !db) {
        console.warn('⚠️ ActivityService: Firebase not available, simulating event creation');
        return 'mock_event_' + Date.now();
      }

      // 🎯 Transform locationDetails into structured placeDetails
      let placeDetails = null;
      if (eventData.locationDetails) {
        const locationDetails: LocationDetailsInput = eventData.locationDetails;
        placeDetails = {
          place_id: locationDetails.placeId || locationDetails.place_id || '',
          formatted_address:
            locationDetails.formatted_address || locationDetails.address || eventData.location,
          coordinates: {
            lat: locationDetails.coordinates?.lat || locationDetails.lat || 0,
            lng: locationDetails.coordinates?.lng || locationDetails.lng || 0,
          },
          types: locationDetails.types || [],
          name:
            locationDetails.name ||
            locationDetails.formattedAddress?.split(',')[0] ||
            locationDetails.address ||
            'Unknown Location', // 🎯 "마스터 키": name 필드 100% 보장
          vicinity: locationDetails.vicinity || '', // 🎯 Firestore 호환성: undefined 방지
        };

        console.log('🏗️ Transformed locationDetails into placeDetails:', placeDetails);
      }

      // 🛡️ "쓰기 방어" - scheduledTime을 Firestore Timestamp로 변환
      let scheduledTimeTimestamp = null;
      if (eventData.scheduledTime) {
        if (eventData.scheduledTime instanceof Date) {
          scheduledTimeTimestamp = Timestamp.fromDate(eventData.scheduledTime);
        } else if (
          typeof eventData.scheduledTime === 'string' ||
          typeof eventData.scheduledTime === 'number'
        ) {
          scheduledTimeTimestamp = Timestamp.fromDate(new Date(eventData.scheduledTime));
        }
        console.log('🛡️ Converted scheduledTime to Firestore Timestamp:', scheduledTimeTimestamp);
      }

      // 이벤트 데이터 준비
      const newEventData = {
        ...eventData,
        scheduledTime: scheduledTimeTimestamp, // 🛡️ 항상 Firestore Timestamp로 저장
        placeDetails, // 🎯 Store rich Place object for instant coordinate access
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'upcoming',
        participants: [], // 초기에는 빈 배열
        currentParticipants: 0,
      };

      // Remove locationDetails from stored data (transformed to placeDetails)
      delete newEventData.locationDetails;

      // Firestore에 저장
      const docRef = await addDoc(collection(db, this.EVENTS_COLLECTION), newEventData);

      console.log('✅ Event created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw error;
    }
  }

  // ==========================================
  // EVENT MANAGEMENT
  // ==========================================

  /**
   * Helper function to calculate when an event was completed
   * Uses actualEndTime if available, otherwise estimates using scheduledTime + duration
   */
  private getEventCompletionTime(event: EventWithParticipation): Date {
    // If event has actual end time recorded, use it
    if (event.actualEndTime) {
      return new Date(event.actualEndTime);
    }

    // Otherwise, estimate completion time using scheduled time + duration
    const scheduledTime = new Date(event.scheduledTime);
    const estimatedDurationMinutes = event.duration || 120; // Default 120 minutes (2 hours) for tennis events
    return new Date(scheduledTime.getTime() + estimatedDurationMinutes * 60 * 1000);
  }

  /**
   * Helper function to check if an event was completed more than 24 hours ago
   */
  private isCompletedFor24Hours(event: EventWithParticipation): boolean {
    const completionTime = this.getEventCompletionTime(event);
    const now = new Date();
    const hoursSinceCompletion = (now.getTime() - completionTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceCompletion >= 24;
  }

  /**
   * Helper function to check if an event is currently active or recently completed (within 24 hours)
   * 🌤️ [KIM FIX] Meetups (번개 모임) have no score input, so they automatically move to past after 24h
   */
  private isActiveOrRecentlyCompleted(event: EventWithParticipation): boolean {
    const now = new Date();
    const scheduledTime = new Date(event.scheduledTime);

    // 🔍 DEBUG: 상세한 로그 추가
    const estimatedEndTime = this.getEventCompletionTime(event);
    const isCompletedFor24Hours = this.isCompletedFor24Hours(event);

    // 🎯 [KIM FIX] Use isMeetupEvent utility that infers type from gameType
    // This fixes the bug where events with incorrect type: "meetup" but gameType: "mens_singles"
    // were being treated as meetups instead of matches
    const isMeetup = isMeetupEvent(event);

    const debugInfo = {
      eventTitle: event.title,
      eventId: event.id,
      eventType: event.type,
      gameType: event.gameType,
      isMeetup,
      now: now.toISOString(),
      scheduledTime: scheduledTime.toISOString(),
      estimatedEndTime: estimatedEndTime.toISOString(),
      isFuture: scheduledTime > now,
      isOngoing: now <= estimatedEndTime,
      isCompletedFor24Hours,
      finalResult: false, // Will be updated below
    };

    // 🛡️ [CAPTAIN AMERICA] EXCEPTION: partner_pending events always show (action required!)
    if (event.status === 'partner_pending') {
      console.log(
        `✅ [PARTNER_PENDING] Showing partner_pending event regardless of time: ${event.id} (${event.title})`
      );
      debugInfo.finalResult = true;
      return true;
    }

    // 🎯 [KIM FIX v3] HIGHEST PRIORITY: Match with score moves to Past Activities IMMEDIATELY
    // Check matchResult FIRST, before time-based checks, so scored matches are removed instantly
    // regardless of whether the event is ongoing or in the future
    if (event.matchResult) {
      console.log(
        `🏆 [MATCH_SCORED] Event '${event.title}' has matchResult - moving to Past Activities immediately (bypassing time checks)`
      );
      debugInfo.finalResult = false;
      return false; // Move to "Past Activities" immediately when score is submitted
    }

    // Event hasn't started yet (future events)
    if (scheduledTime > now) {
      debugInfo.finalResult = true;
      return true;
    }

    // Event has started - check if it's currently ongoing
    if (now <= estimatedEndTime) {
      // Event is currently in progress
      debugInfo.finalResult = true;
      return true;
    }

    // 🌤️ [KIM FIX] For meetups: move to past after 24h from scheduledTime (no score input)
    // 🎾 [KIM FIX v8] For matches (번개매치): ALWAYS show until matchResult exists (NO 24h rule!)
    if (isMeetup) {
      // Meetup (번개모임): 24시간 지나면 자동으로 지난 활동으로 이동
      const result = !isCompletedFor24Hours;
      debugInfo.finalResult = result;
      console.log(
        `🌤️ [MEETUP] ${event.title} - isCompletedFor24Hours: ${isCompletedFor24Hours}, showing: ${result}`
      );
      return result;
    }

    // 🎾 [KIM FIX v8] Match (번개매치/기록경기): ALWAYS show until score is submitted
    // 24시간 규칙은 번개모임에만 적용! 번개매치는 점수 입력 전까지 항상 보임!
    console.log(
      `🎾 [MATCH] ${event.title} - No matchResult yet, showing until score is submitted (no 24h rule for matches)`
    );
    debugInfo.finalResult = true;
    return true;
  }

  /**
   * Get events that the user has applied to participate in
   * @param userId - User ID
   * @param options - Filter options
   * @param options.status - Filter by event status ('all' | 'upcoming' | 'completed')
   */
  async getAppliedEvents(
    userId: string,
    options: { status?: 'all' | 'upcoming' | 'completed' } = {}
  ): Promise<EventWithParticipation[]> {
    try {
      const { status = 'upcoming' } = options; // Default to upcoming events only
      console.log(`ActivityService: Getting ${status} applied events for user:`, userId);

      // Firebase 사용 가능성 확인
      if (!isFirebaseAvailable || !db) {
        console.warn('⚠️ ActivityService: Firebase not available, returning mock applied events');
        return this.getMockAppliedEvents(userId);
      }

      // Method 1: Try to get events where user is in participants array (직접 참가자 배열에서 확인)
      try {
        let participantsQuery;

        if (status === 'all') {
          participantsQuery = query(
            collection(db, this.EVENTS_COLLECTION),
            where('participants', 'array-contains', userId),
            orderBy('createdAt', 'desc')
          );
        } else {
          participantsQuery = query(
            collection(db, this.EVENTS_COLLECTION),
            where('participants', 'array-contains', userId),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
          );
        }

        const participantsSnapshot = await getDocs(participantsQuery);
        const participantEvents = participantsSnapshot.docs.map(doc => {
          const rawEventData = doc.data();

          // 🎯 Transform score field to matchResult format for EventCard compatibility
          let matchResult = rawEventData.matchResult || null;

          // If no matchResult but score exists, transform it
          if (!matchResult && rawEventData.score && rawEventData.score._winner) {
            const hostId = rawEventData.hostId;
            const isHostWinner = rawEventData.score._winner === 'player1';
            const hostResult = isHostWinner ? 'win' : 'loss';

            matchResult = {
              score: rawEventData.score,
              hostResult,
              submittedAt: safeToDate(rawEventData.scoreSubmittedAt) || new Date(),
            };

            console.log(
              `🎯 [getAppliedEvents.participants] Transformed score to matchResult for event ${doc.id}:`,
              {
                hasScore: !!rawEventData.score,
                winner: rawEventData.score._winner,
                hostId,
                hostResult,
                transformedMatchResult: matchResult,
              }
            );
          }

          return {
            id: doc.id,
            ...rawEventData,
            scheduledTime:
              safeToDate(rawEventData.scheduledTime, 'activityService.getParticipantEvents') ||
              new Date(),
            createdAt:
              safeToDate(rawEventData.createdAt, 'activityService.getParticipantEvents') ||
              new Date(),
            updatedAt:
              safeToDate(rawEventData.updatedAt, 'activityService.getParticipantEvents') ||
              new Date(),
            matchResult,
          };
        }) as EventWithParticipation[];

        console.log('Found events with user in participants array:', participantEvents.length);

        if (participantEvents.length > 0) {
          // 🎯 [KIM FIX] Filter out events where user's application was rejected
          // For partners, we need to check if they were part of a rejected team application
          const filteredEvents: EventWithParticipation[] = [];

          for (const event of participantEvents) {
            try {
              // Check if there's a rejected application for this event involving this user
              // Check as applicant
              const applicantQuery = query(
                collection(db, this.APPLICATIONS_COLLECTION),
                where('eventId', '==', event.id),
                where('applicantId', '==', userId)
              );
              const applicantSnapshot = await getDocs(applicantQuery);

              // Check as partner
              const partnerQuery = query(
                collection(db, this.APPLICATIONS_COLLECTION),
                where('eventId', '==', event.id),
                where('partnerId', '==', userId)
              );
              const partnerSnapshot = await getDocs(partnerQuery);

              // Check if any application involving this user was rejected
              let isRejected = false;

              for (const doc of applicantSnapshot.docs) {
                const status = doc.data().status;
                if (
                  status === 'rejected' ||
                  status === 'cancelled_by_host' ||
                  status === 'declined'
                ) {
                  isRejected = true;
                  console.log(
                    `⏭️ [participants] Filtering out event ${event.id} - user's application status: ${status}`
                  );
                  break;
                }
              }

              if (!isRejected) {
                for (const doc of partnerSnapshot.docs) {
                  const status = doc.data().status;
                  if (
                    status === 'rejected' ||
                    status === 'cancelled_by_host' ||
                    status === 'declined'
                  ) {
                    isRejected = true;
                    console.log(
                      `⏭️ [participants] Filtering out event ${event.id} - partner's application status: ${status}`
                    );
                    break;
                  }
                }
              }

              if (!isRejected) {
                filteredEvents.push(event);
              }
            } catch (error) {
              // If we can't check, include the event to be safe
              console.warn(`Failed to check application status for event ${event.id}:`, error);
              filteredEvents.push(event);
            }
          }

          console.log(
            `After rejection filtering: ${filteredEvents.length} events (was ${participantEvents.length})`
          );

          // For participant events, we don't have application data: unknown, so sort by scheduled time
          return filteredEvents.sort(
            (a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime()
          );
        }
      } catch (participantsError) {
        console.log(
          'Participants array query failed, trying applications method:',
          participantsError
        );
      }

      // Method 2: Fallback to applications-based method
      // 🎯 [KIM FIX v3] Query BOTH applicantId AND partnerId to include partner applications
      const applicantQuery = query(
        collection(db, this.APPLICATIONS_COLLECTION),
        where('applicantId', '==', userId),
        orderBy('appliedAt', 'desc')
      );

      const partnerApplicationsQuery = query(
        collection(db, this.APPLICATIONS_COLLECTION),
        where('partnerId', '==', userId),
        orderBy('appliedAt', 'desc')
      );

      // Run both queries and merge results
      const [applicationsSnapshot, partnerApplicationsSnapshot] = await Promise.all([
        getDocs(applicantQuery),
        getDocs(partnerApplicationsQuery),
      ]);

      // Use Map to deduplicate (in case same application appears in both)
      const applicationsMap = new Map<string, ParticipationApplication>();

      applicationsSnapshot.docs.forEach(doc => {
        applicationsMap.set(doc.id, {
          id: doc.id,
          ...doc.data(),
          appliedAt:
            safeToDate(doc.data().appliedAt, 'activityService.getAppliedEvents') || new Date(),
          processedAt: safeToDate(doc.data().processedAt, 'activityService.getAppliedEvents'),
        } as ParticipationApplication);
      });

      partnerApplicationsSnapshot.docs.forEach(doc => {
        if (!applicationsMap.has(doc.id)) {
          applicationsMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
            appliedAt:
              safeToDate(doc.data().appliedAt, 'activityService.getAppliedEvents') || new Date(),
            processedAt: safeToDate(doc.data().processedAt, 'activityService.getAppliedEvents'),
          } as ParticipationApplication);
        }
      });

      const applications = Array.from(applicationsMap.values());

      console.log(
        `🎯 [KIM FIX v3] Found ${applicationsSnapshot.docs.length} direct + ${partnerApplicationsSnapshot.docs.length} partner applications = ${applications.length} total`
      );

      // Get events for these applications
      const events: EventWithParticipation[] = [];

      for (const application of applications) {
        // ✅ Filter out cancelled/declined/rejected applications
        // 🎯 [KIM FIX] Also filter out 'rejected' status - host rejected the application
        if (
          application.status === 'cancelled_by_user' ||
          application.status === 'cancelled_by_host' ||
          application.status === 'cancelled' ||
          application.status === 'declined' ||
          application.status === 'rejected'
        ) {
          console.log(
            `⏭️ Skipping cancelled/declined/rejected application: ${application.id} (status: ${application.status})`
          );
          continue;
        }

        try {
          const eventDoc = await getDoc(doc(db, this.EVENTS_COLLECTION, application.eventId));
          if (eventDoc.exists()) {
            const rawEventData = eventDoc.data();

            // 🎯 Transform score field to matchResult format for EventCard compatibility
            let matchResult = rawEventData.matchResult || null;

            // If no matchResult but score exists, transform it
            if (!matchResult && rawEventData.score && rawEventData.score._winner) {
              const hostId = rawEventData.hostId;
              const isHostWinner = rawEventData.score._winner === 'player1';
              const hostResult = isHostWinner ? 'win' : 'loss';

              matchResult = {
                score: rawEventData.score,
                hostResult,
                submittedAt: safeToDate(rawEventData.scoreSubmittedAt) || new Date(),
              };

              console.log(
                `🎯 [getAppliedEvents] Transformed score to matchResult for event ${eventDoc.id}:`,
                {
                  hasScore: !!rawEventData.score,
                  winner: rawEventData.score._winner,
                  hostId,
                  hostResult,
                  transformedMatchResult: matchResult,
                }
              );
            }

            const eventData = {
              id: eventDoc.id,
              ...rawEventData,
              scheduledTime:
                safeToDate(
                  rawEventData.scheduledTime,
                  'activityService.getAppliedEvents.eventDoc'
                ) || new Date(),
              createdAt:
                safeToDate(rawEventData.createdAt, 'activityService.getAppliedEvents.eventDoc') ||
                new Date(),
              updatedAt:
                safeToDate(rawEventData.updatedAt, 'activityService.getAppliedEvents.eventDoc') ||
                new Date(),
              matchResult,
              myApplication: application,
              // 🎯 [KIM FIX] Include partner information from application
              partnerName: application.partnerName || undefined,
              partnerStatus: application.partnerStatus || undefined,
              partnerInvitationId: application.partnerInvitationId || undefined,
            } as unknown as EventWithParticipation;

            // 🔍 [DEBUG] Log partner information
            if (application.partnerId) {
              console.log('🎯 [getAppliedEvents] Application with partner found:', {
                applicationId: application.id,
                eventId: application.eventId,
                partnerId: application.partnerId,
                partnerName: application.partnerName,
                partnerStatus: application.partnerStatus,
                hasPartnerName: !!application.partnerName,
                eventDataPartnerName: eventData.partnerName,
              });
            }

            events.push(eventData);
          }
        } catch (error) {
          console.error('Error fetching event for application:', application.id, error);
        }
      }

      // Sort by application time (most recent applications first)
      return events.sort((a, b) => {
        const aAppliedTime = a.myApplication?.appliedAt?.getTime() || 0;
        const bAppliedTime = b.myApplication?.appliedAt?.getTime() || 0;
        return bAppliedTime - aAppliedTime;
      });
    } catch (error) {
      console.error('Error getting applied events:', error);
      // Return mock data as fallback
      return this.getMockAppliedEvents(userId);
    }
  }

  /**
   * Get events that the user is hosting
   * @param userId - User ID
   * @param options - Filter options
   * @param options.status - Filter by event status ('all' | 'upcoming' | 'completed')
   */
  async getHostedEvents(
    userId: string,
    options: { status?: 'all' | 'upcoming' | 'completed' } = {}
  ): Promise<EventWithParticipation[]> {
    try {
      const { status = 'upcoming' } = options; // Default to upcoming events only
      console.log(`ActivityService: Getting ${status} hosted events for user:`, userId);

      // Firebase 사용 가능성 확인
      if (!isFirebaseAvailable || !db) {
        console.warn('⚠️ ActivityService: Firebase not available, returning mock hosted events');
        return this.getMockHostedEvents(userId);
      }

      // Get ALL events hosted by this user (we'll filter by 24-hour logic later)
      const eventsQuery = query(
        collection(db, this.EVENTS_COLLECTION),
        where('hostId', '==', userId),
        orderBy('scheduledTime', 'desc')
      );

      const eventsSnapshot = await getDocs(eventsQuery);

      // 🔍 DEBUG: Firebase에서 실제로 조회된 원본 데이터 확인
      console.log(
        '🔍 [getHostedEvents] Raw Firebase data:',
        eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          matchResult: doc.data().matchResult,
          hasMatchResultField: 'matchResult' in doc.data(),
          allFields: Object.keys(doc.data()),
        }))
      );

      const allHostedEvents = eventsSnapshot.docs
        .map(doc => {
          const rawData = doc.data();

          // 🔍 DEBUG: Check if currentParticipants exists in rawData
          console.log('🔍 [ActivityService] rawData check:', {
            eventId: doc.id,
            title: rawData.title,
            hasCurrentParticipants: 'currentParticipants' in rawData,
            currentParticipantsValue: rawData.currentParticipants,
            currentParticipantsType: typeof rawData.currentParticipants,
            allKeys: Object.keys(rawData),
          });

          const mappedEvent = {
            id: doc.id,
            ...rawData,
            scheduledTime:
              safeToDate(rawData.scheduledTime, 'activityService.getHostedEvents') || new Date(),
            createdAt:
              safeToDate(rawData.createdAt, 'activityService.getHostedEvents') || new Date(),
            updatedAt:
              safeToDate(rawData.updatedAt, 'activityService.getHostedEvents') || new Date(),
            actualEndTime: safeToDate(rawData.actualEndTime, 'activityService.getHostedEvents'), // Include actual end time
            // 🎯 [OPERATION DUO] Explicitly map currentParticipants from Firestore
            currentParticipants: rawData.currentParticipants as number | undefined,
          } as unknown as EventWithParticipation;

          return mappedEvent;
        })
        .filter(event => {
          // ✅ Filter out cancelled events
          if (event.status === 'cancelled') {
            console.log(
              `⏭️ Skipping cancelled event: ${event.id} (title: ${event.title}, status: ${event.status})`
            );
            return false;
          }
          return true;
        });

      // Filter events to include only those that are active or recently completed (within 24 hours)
      const hostedEvents = allHostedEvents.filter(event => this.isActiveOrRecentlyCompleted(event));

      // Get applications for each hosted event
      for (const event of hostedEvents) {
        try {
          const applicationsQuery = query(
            collection(db, this.APPLICATIONS_COLLECTION),
            where('eventId', '==', event.id),
            orderBy('appliedAt', 'desc')
          );

          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applications = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            appliedAt:
              safeToDate(doc.data().appliedAt, 'activityService.getHostedEvents.applications') ||
              new Date(),
            processedAt: safeToDate(
              doc.data().processedAt,
              'activityService.getHostedEvents.applications'
            ),
          })) as ParticipationApplication[];

          event.applications = applications;
          event.approvedApplications = applications.filter(app => app.status === 'approved');
          event.pendingApplications = applications.filter(app => app.status === 'pending');

          // 💥 BUSINESS RULE: For public events, include host in participant count
          // ⚠️ DO NOT modify event.participants array - it's used for applicant management
          const isPublicEvent = !event.clubId; // Public events don't have clubId
          if (isPublicEvent) {
            // Calculate participant count without modifying the original array
            const currentParticipants = event.participants || [];
            const includeHost = !currentParticipants.some(p => p.userId === userId);
            event.computedParticipantCount = currentParticipants.length + (includeHost ? 1 : 0);
          } else {
            event.computedParticipantCount = (event.participants || []).length;
          }
        } catch (error) {
          console.error('Error fetching applications for event:', event.id, error);
          event.applications = [];
          event.approvedApplications = [];
          event.pendingApplications = [];

          // Even in error case, apply business rule for public events
          const isPublicEvent = !event.clubId;
          if (isPublicEvent) {
            const currentParticipants = event.participants || [];
            const includeHost = !currentParticipants.some(p => p.userId === userId);
            event.computedParticipantCount = currentParticipants.length + (includeHost ? 1 : 0);
          } else {
            event.computedParticipantCount = (event.participants || []).length;
          }
        }
      }

      // 🔍 [KIM DEBUG] Check for duplicate events in final array
      console.log('🔍🔍🔍 [getHostedEvents] FINAL RETURN CHECK:', {
        totalEvents: hostedEvents.length,
        eventIds: hostedEvents.map(e => e.id),
        duplicateIds: hostedEvents
          .map(e => e.id)
          .filter((id, index, arr) => arr.indexOf(id) !== index),
        events: hostedEvents.map(e => ({
          id: e.id,
          title: e.title,
          hostPartnerId: e.hostPartnerId,
          hostPartnerName: e.hostPartnerName,
        })),
      });

      return hostedEvents;
    } catch (error) {
      console.error('Error getting hosted events:', error);
      // Return mock data as fallback
      return this.getMockHostedEvents(userId);
    }
  }

  /**
   * Get past events (completed) that user participated in or hosted
   */
  async getPastEvents(userId: string): Promise<EventWithParticipation[]> {
    try {
      console.log('ActivityService: Getting past events for user:', userId);

      // Firebase 사용 가능성 확인
      if (!isFirebaseAvailable || !db) {
        console.warn('⚠️ ActivityService: Firebase not available, returning mock past events');
        return this.getMockPastEvents(userId);
      }

      const currentTime = new Date();
      const pastEvents: EventWithParticipation[] = [];

      // 🎯 [KIM FIX] Two queries to catch all past events:
      // 1. Query for events with scheduledTime < currentTime (traditional past events)
      // 2. Query for ALL hosted events to check for matchResult (completed matches)

      // Query 1: Traditional past events (scheduledTime in the past)
      const pastEventsQuery = query(
        collection(db, this.EVENTS_COLLECTION),
        where('hostId', '==', userId),
        where('scheduledTime', '<', Timestamp.fromDate(currentTime)),
        orderBy('scheduledTime', 'desc'),
        limit(50)
      );

      // Query 2: ALL hosted events (to find ones with matchResult regardless of scheduledTime)
      const allHostedQuery = query(
        collection(db, this.EVENTS_COLLECTION),
        where('hostId', '==', userId),
        orderBy('scheduledTime', 'desc'),
        limit(100)
      );

      const [pastSnapshot, allHostedSnapshot] = await Promise.all([
        getDocs(pastEventsQuery),
        getDocs(allHostedQuery),
      ]);

      // Combine results, using a Set to avoid duplicates
      const eventIdsSet = new Set<string>();
      const combinedDocs: Array<{
        id: string;
        data: () => ReturnType<(typeof pastSnapshot.docs)[0]['data']>;
      }> = [];

      // Add past events first
      pastSnapshot.docs.forEach(doc => {
        eventIdsSet.add(doc.id);
        combinedDocs.push(doc);
      });

      // Add events with matchResult that aren't already included
      allHostedSnapshot.docs.forEach(doc => {
        if (!eventIdsSet.has(doc.id)) {
          const data = doc.data();
          // Only add if it has matchResult (completed match)
          if (data.matchResult || data.result) {
            console.log(
              `🎯 [getPastEvents] Adding event with matchResult: ${data.title} (scheduledTime might be in future)`
            );
            eventIdsSet.add(doc.id);
            combinedDocs.push(doc);
          }
        }
      });

      console.log(
        `🔍 [getPastEvents] Hosted events - Past: ${pastSnapshot.docs.length}, With matchResult: ${combinedDocs.length - pastSnapshot.docs.length}, Total: ${combinedDocs.length}`
      );

      // 🎯 [KIM FIX] Fetch approvedApplications for each hosted event to get challenger team info
      const hostedEvents = await Promise.all(
        combinedDocs.map(async doc => {
          const data = doc.data();
          // 🔍 DEBUG: Log each hosted event's matchResult status
          console.log(`🔍 [getPastEvents] Hosted event: ${data.title}`, {
            id: doc.id,
            matchResult: data.matchResult,
            result: data.result,
            status: data.status,
            type: data.type,
            gameType: data.gameType,
          });

          // 🎯 [KIM FIX] Query approved applications for this event to get challenger team info
          let approvedApplications: Array<{
            applicantId: string;
            applicantName: string;
            partnerId?: string;
            partnerName?: string;
            status: string;
          }> = [];
          try {
            const appsQuery = query(
              collection(db, this.APPLICATIONS_COLLECTION),
              where('eventId', '==', doc.id),
              where('status', '==', 'approved')
            );
            const appsSnapshot = await getDocs(appsQuery);
            approvedApplications = appsSnapshot.docs.map(appDoc => {
              const appData = appDoc.data();
              return {
                applicantId: appData.applicantId,
                applicantName: appData.applicantName,
                partnerId: appData.partnerId,
                partnerName: appData.partnerName,
                status: appData.status,
              };
            });
            console.log(
              `🔍 [getPastEvents] Approved applications for ${data.title}:`,
              approvedApplications
            );
          } catch (error) {
            console.warn(
              `⚠️ [getPastEvents] Failed to fetch approved applications for ${doc.id}:`,
              error
            );
          }

          return {
            id: doc.id,
            ...data,
            scheduledTime:
              safeToDate(data.scheduledTime, 'activityService.getPastEvents.hosted') || new Date(),
            createdAt:
              safeToDate(data.createdAt, 'activityService.getPastEvents.hosted') || new Date(),
            updatedAt:
              safeToDate(data.updatedAt, 'activityService.getPastEvents.hosted') || new Date(),
            actualEndTime: safeToDate(data.actualEndTime, 'activityService.getPastEvents.hosted'),
            isHost: true,
            // 🎯 [KIM FIX] Include matchResult for filtering (Firestore may use 'result' field)
            matchResult: data.matchResult || data.result || null,
            // 🎯 [KIM FIX] Include approved applications for challenger team info
            approvedApplications,
          } as unknown as EventWithParticipation;
        })
      );

      // 🎯 [KIM FIX] Include MATCH events that are:
      // 1. Completed with matchResult (immediately after score submission), OR
      // 2. Completed for more than 24 hours (even without score)
      // Excludes meetups completely
      const pastHostedEvents = hostedEvents.filter(event => {
        const isMeetup = isMeetupEvent(event);
        const hasMatchResult = !!event.matchResult;
        const isCompletedFor24h = this.isCompletedFor24Hours(event);

        console.log(`🔍 [getPastEvents] Filter check for '${event.title}':`, {
          isMeetup,
          hasMatchResult,
          isCompletedFor24h,
          shouldInclude: !isMeetup && (hasMatchResult || isCompletedFor24h),
        });

        if (isMeetup) {
          console.log(
            `🗑️ [getPastEvents] Excluding hosted meetup from past events: ${event.title} (type: ${event.type}, gameType: ${event.gameType})`
          );
          return false;
        }
        return hasMatchResult || isCompletedFor24h;
      });
      pastEvents.push(...pastHostedEvents);

      // Get past events user participated in
      const applicationsQuery = query(
        collection(db, this.APPLICATIONS_COLLECTION),
        where('applicantId', '==', userId),
        where('status', '==', 'approved')
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);

      for (const appDoc of applicationsSnapshot.docs) {
        const application = {
          id: appDoc.id,
          ...appDoc.data(),
          appliedAt:
            safeToDate(appDoc.data().appliedAt, 'activityService.getPastEvents.applications') ||
            new Date(),
          processedAt: safeToDate(
            appDoc.data().processedAt,
            'activityService.getPastEvents.applications'
          ),
        } as ParticipationApplication;

        try {
          const eventDoc = await getDoc(doc(db, this.EVENTS_COLLECTION, application.eventId));
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            const eventTime =
              safeToDate(eventData.scheduledTime, 'activityService.getPastEvents.eventData') ||
              new Date();

            // Only include if event is completed more than 24 hours ago
            if (eventTime < currentTime) {
              const pastEvent = {
                id: eventDoc.id,
                ...eventData,
                scheduledTime: eventTime,
                createdAt:
                  safeToDate(eventData.createdAt, 'activityService.getPastEvents.eventData') ||
                  new Date(),
                updatedAt:
                  safeToDate(eventData.updatedAt, 'activityService.getPastEvents.eventData') ||
                  new Date(),
                actualEndTime: safeToDate(
                  eventData.actualEndTime,
                  'activityService.getPastEvents.eventData'
                ), // Include actual end time
                myApplication: application,
                isHost: false,
              } as unknown as EventWithParticipation;

              // 🎯 [KIM FIX] Include MATCH events that are:
              // 1. Completed with matchResult (immediately after score submission), OR
              // 2. Completed for more than 24 hours (even without score)
              // Excludes meetups completely
              const isMeetup = isMeetupEvent(pastEvent);
              const hasMatchResult = !!eventData.matchResult;
              if (isMeetup) {
                console.log(
                  `🗑️ [getPastEvents] Excluding participated meetup: ${pastEvent.title} (type: ${pastEvent.type}, gameType: ${pastEvent.gameType})`
                );
              } else if (hasMatchResult || this.isCompletedFor24Hours(pastEvent)) {
                pastEvents.push(pastEvent);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching past event:', application.eventId, error);
        }
      }

      // 🎯 [KIM FIX v8] SINGLES MATCH FIX: Search for events where user is in participants array
      // Singles matches store guests directly in the `participants` array, not in participation_applications
      // Firestore cannot query nested objects in arrays, so we query completed matches and filter client-side
      try {
        console.log(
          `🔍 [getPastEvents] Searching for singles matches where user is participant...`
        );

        // Query events with matchResult (completed matches) that user might be participant in
        const completedMatchesQuery = query(
          collection(db, this.EVENTS_COLLECTION),
          where('status', 'in', ['completed', 'active', 'open']),
          orderBy('scheduledTime', 'desc'),
          limit(100)
        );

        const completedMatchesSnapshot = await getDocs(completedMatchesQuery);
        console.log(
          `🔍 [getPastEvents] Found ${completedMatchesSnapshot.docs.length} events to check for participant`
        );

        for (const eventDoc of completedMatchesSnapshot.docs) {
          const eventData = eventDoc.data();

          // Skip if already in pastEvents
          if (pastEvents.some(e => e.id === eventDoc.id)) {
            continue;
          }

          // Check if event has participants array
          const participants = eventData.participants as
            | Array<{ playerId?: string; playerName?: string }>
            | undefined;
          if (!participants || !Array.isArray(participants)) {
            continue;
          }

          // Check if user is in participants array (as playerId or id)
          const isUserParticipant = participants.some(
            p => p.playerId === userId || (p as unknown as { id?: string }).id === userId
          );

          if (!isUserParticipant) {
            continue;
          }

          // Skip if user is the host (already handled above)
          if (eventData.hostId === userId) {
            continue;
          }

          // Check if event should be included (has matchResult or is past 24h)
          const hasMatchResult = !!eventData.matchResult;
          const eventTime =
            safeToDate(eventData.scheduledTime, 'activityService.getPastEvents.participant') ||
            new Date();
          const is24HoursPassed = eventTime < new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

          if (hasMatchResult || is24HoursPassed) {
            const isMeetup = isMeetupEvent(eventData as unknown as EventWithParticipation);
            if (!isMeetup) {
              console.log(
                `🎾 [getPastEvents] Found singles match participant: "${eventData.title}" for user ${userId}`
              );

              const participantEvent = {
                id: eventDoc.id,
                ...eventData,
                scheduledTime: eventTime,
                createdAt:
                  safeToDate(eventData.createdAt, 'activityService.getPastEvents.participant') ||
                  new Date(),
                updatedAt:
                  safeToDate(eventData.updatedAt, 'activityService.getPastEvents.participant') ||
                  new Date(),
                actualEndTime: safeToDate(
                  eventData.actualEndTime,
                  'activityService.getPastEvents.participant'
                ),
                isHost: false,
                matchResult: eventData.matchResult,
              } as unknown as EventWithParticipation;

              pastEvents.push(participantEvent);
            }
          }
        }
      } catch (error) {
        console.error('Error searching for participant events in getPastEvents:', error);
      }

      // Remove duplicates and sort
      const uniquePastEvents = pastEvents.filter(
        (event, index, self) => index === self.findIndex(e => e.id === event.id)
      );

      return uniquePastEvents.sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());
    } catch (error) {
      console.error('Error getting past events:', error);
      // Return mock data as fallback
      return this.getMockPastEvents(userId);
    }
  }

  // ==========================================
  // REAL-TIME LISTENERS
  // ==========================================

  /**
   * Subscribe to real-time updates for events the user has applied to
   * @param userId - User ID
   * @param callback - Function to call when data changes
   * @param options - Filter options
   * @returns Unsubscribe function
   */
  subscribeToAppliedEvents(
    userId: string,
    callback: (events: EventWithParticipation[]) => void,
    options: { status?: 'all' | 'upcoming' | 'completed' } = {}
  ): Unsubscribe {
    const { status = 'upcoming' } = options;
    console.log(`🔄 [subscribeToAppliedEvents] Setting up listener for ${status} events`);

    if (!isFirebaseAvailable || !db) {
      console.warn('⚠️ ActivityService: Firebase not available');
      return () => {};
    }

    // 🎯 [OPERATION DUO - FIX] Use dual query approach to get events from participation_applications
    // This fixes the issue where team application partners don't see events in their "Applied Events" list

    // Store applications from both queries
    let applicantApplications: Array<{ id: string; eventId: string; [key: string]: unknown }> = [];
    let partnerApplications: Array<{ id: string; eventId: string; [key: string]: unknown }> = [];

    // 🎯 [KIM FIX] Store rejected eventIds from PARTNER subscription for cross-filtering
    // This is collected at subscription level BEFORE filtering, so we can hide these events
    // from APPLICANT view as well (when user was rejected as a partner)
    let rejectedAsPartnerEventIds = new Set<string>();

    // Query 1: Applications where user is the applicant
    const applicantQuery = query(
      collection(db, this.APPLICATIONS_COLLECTION),
      where('applicantId', '==', userId)
    );

    // Query 2: Applications where user is the partner
    const partnerQuery = query(
      collection(db, this.APPLICATIONS_COLLECTION),
      where('partnerId', '==', userId)
    );

    // Shared function to fetch and process events from combined applications
    const fetchAndProcessEvents = async () => {
      // 🔥 [DEBUG] Critical logging to identify disappearing card issue
      console.log('🔥 [FETCH_DEBUG] fetchAndProcessEvents called with:', {
        applicantApplicationsCount: applicantApplications.length,
        partnerApplicationsCount: partnerApplications.length,
        applicantEventIds: applicantApplications.map(a => a.eventId),
        partnerEventIds: partnerApplications.map(a => a.eventId),
      });

      // 🎯 [KIM FIX] Improved deduplication - prefer active applications over rejected/cancelled
      const allApplicationsMap = new Map<
        string,
        { id: string; eventId: string; [key: string]: unknown }
      >();

      // Helper to check if status is "active" (should be shown)
      const isActiveStatus = (status: string | undefined): boolean => {
        return ['pending', 'approved', 'looking_for_partner', 'pending_partner_approval'].includes(
          status || ''
        );
      };

      // 🎯 [KIM FIX] Helper to check if status is "rejected" (should NOT be shown at all)
      const isRejectedStatus = (status: string | undefined): boolean => {
        return [
          'rejected',
          'cancelled_by_host',
          'declined',
          'cancelled',
          'cancelled_by_user',
        ].includes(status || '');
      };

      // 🎯 [KIM FIX v2] Cross-filter is NO LONGER applied to APPLICANT queries
      // The rejectedAsPartnerEventIds is still collected for logging/debugging purposes only
      // APPLICANT applications are user's own submissions - independent from partner invitations
      console.log(
        `📊 [CROSS-FILTER-DISABLED] ${rejectedAsPartnerEventIds.size} events rejected as partner (NOT filtering APPLICANT apps)`
      );

      // Helper to compare applications - prefer active over inactive, then newer over older
      const shouldReplace = (
        existingApp: { id: string; eventId: string; [key: string]: unknown } | undefined,
        newApp: { id: string; eventId: string; [key: string]: unknown }
      ): boolean => {
        if (!existingApp) return true;

        const existingStatus = existingApp.status as string | undefined;
        const newStatus = newApp.status as string | undefined;

        // Prefer active applications
        if (isActiveStatus(newStatus) && !isActiveStatus(existingStatus)) {
          console.log('🔄 [DEDUP] Preferring active app:', { newStatus, existingStatus });
          return true;
        }
        if (!isActiveStatus(newStatus) && isActiveStatus(existingStatus)) {
          return false;
        }

        // 🎯 [KIM FIX v28] Prefer applications with COMPLETE team info (partnerId AND partnerName)
        // This ensures we use the team leader's document which has full partner data,
        // rather than a partial document that may lack partnerId
        const existingHasCompleteTeamInfo = !!(existingApp.partnerId && existingApp.partnerName);
        const newHasCompleteTeamInfo = !!(newApp.partnerId && newApp.partnerName);

        if (newHasCompleteTeamInfo && !existingHasCompleteTeamInfo) {
          console.log('🔄 [DEDUP] Preferring app with complete team info:', {
            newAppId: newApp.id,
            existingAppId: existingApp.id,
          });
          return true;
        }
        if (!newHasCompleteTeamInfo && existingHasCompleteTeamInfo) {
          console.log('🔄 [DEDUP] Keeping existing app with complete team info:', {
            existingAppId: existingApp.id,
          });
          return false;
        }

        // If both have same active/inactive status, prefer newer one (by appliedAt)
        const existingTime =
          typeof existingApp.appliedAt === 'object' && existingApp.appliedAt !== null
            ? (existingApp.appliedAt as { seconds: number }).seconds || 0
            : 0;
        const newTime =
          typeof newApp.appliedAt === 'object' && newApp.appliedAt !== null
            ? (newApp.appliedAt as { seconds: number }).seconds || 0
            : 0;

        return newTime > existingTime;
      };

      // Process applicant applications with smart deduplication
      // 🎯 [KIM FIX] Skip rejected applications entirely - they should not appear in applied events list
      // 🎯 [KIM FIX v2] REMOVED cross-filter: APPLICANT applications should ALWAYS be shown
      // regardless of whether user rejected a PARTNER invitation for the same event.
      // Reason: User's own application (APPLICANT) is independent from being invited as partner.
      // Example: Jong applies to "남복" event → Later, someone invites Jong as partner → Jong rejects
      //          Jong's original application should STILL be visible!
      // 🎯 [KIM FIX v6] Also skip 'merged' status - this application was merged into another team application
      //          The user should see the TEAM application (via PARTNER query) instead
      applicantApplications.forEach(app => {
        const appStatus = app.status as string | undefined;
        if (isRejectedStatus(appStatus)) {
          console.log(
            `🚫 [APPLICANT] Skipping rejected app: ${app.eventId} (status: ${appStatus})`
          );
          return; // Skip rejected applications
        }
        // 🎯 [KIM FIX v6] Skip 'merged' applications - they were merged into team applications
        // The team application will be picked up by PARTNER query
        if (appStatus === 'merged') {
          console.log(
            `🔀 [APPLICANT] Skipping merged app: ${app.eventId} - will show via PARTNER query`
          );
          return; // Skip merged applications - team app will show via PARTNER query
        }
        // 🎯 [KIM FIX v2] Cross-filter REMOVED for APPLICANT applications
        // APPLICANT applications are user's own submissions - they should be shown
        // even if user rejected a partner invitation for the same event
        // OLD CODE (REMOVED):
        // if (rejectedAsPartnerEventIds.has(app.eventId)) { return; }
        console.log(`✅ [APPLICANT] Including app: ${app.eventId} (status: ${appStatus})`);
        const existing = allApplicationsMap.get(app.eventId);
        if (shouldReplace(existing, app)) {
          allApplicationsMap.set(app.eventId, app);
        }
      });

      // Process partner applications with smart deduplication
      // 🎯 [KIM FIX] Skip rejected applications entirely - they should not appear in applied events list
      partnerApplications.forEach(app => {
        const appStatus = app.status as string | undefined;
        if (isRejectedStatus(appStatus)) {
          console.log(`🚫 [PARTNER] Skipping rejected app: ${app.eventId} (status: ${appStatus})`);
          return; // Skip rejected applications
        }
        const existing = allApplicationsMap.get(app.eventId);
        if (shouldReplace(existing, app)) {
          allApplicationsMap.set(app.eventId, app);
        }
      });

      console.log(
        `📝 [subscribeToAppliedEvents] Total unique eventIds: ${allApplicationsMap.size}`
      );

      if (allApplicationsMap.size === 0) {
        console.log('📝 [subscribeToAppliedEvents] No applications found, returning empty array');
        callback([]);
        return;
      }

      // Fetch events for all application eventIds
      const eventIds = Array.from(allApplicationsMap.keys());
      const eventsPromises = eventIds.map(async eventId => {
        try {
          const eventDoc = await getDocs(
            query(collection(db, this.EVENTS_COLLECTION), where('__name__', '==', eventId))
          );

          if (eventDoc.empty) {
            console.warn(`⚠️ Event ${eventId} not found`);
            return null;
          }

          const rawEventData = eventDoc.docs[0].data();

          // 🎯 [KIM FIX] Fetch hostName from users collection if missing (backward compatibility)
          let hostName = rawEventData.hostName;
          if (!hostName && rawEventData.hostId) {
            console.log(
              '🔍 [subscribeToAppliedEvents] hostName missing, fetching from users:',
              rawEventData.hostId
            );
            try {
              const userRef = doc(db, 'users', rawEventData.hostId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                hostName = userSnap.data()?.displayName || 'Unknown Host';
              }
            } catch (error) {
              console.error('❌ Error fetching host name:', error);
            }
          }

          console.log('🔍 [subscribeToAppliedEvents] Event team data:', {
            eventId,
            hostName,
            hostPartnerName: rawEventData.hostPartnerName,
            hostPartnerId: rawEventData.hostPartnerId,
            gameType: rawEventData.gameType,
          });

          // Transform score field to matchResult format
          let matchResult = rawEventData.matchResult || null;

          // 🔍 [DEBUG] Log matchResult status for guest applied events
          console.log('🔍 [subscribeToAppliedEvents] matchResult check:', {
            eventId,
            title: rawEventData.title,
            hasMatchResultInFirestore: !!rawEventData.matchResult,
            matchResultValue: rawEventData.matchResult,
            hasScoreField: !!rawEventData.score,
            scoreWinner: rawEventData.score?._winner,
          });

          if (!matchResult && rawEventData.score && rawEventData.score._winner) {
            const isHostWinner = rawEventData.score._winner === 'player1';
            const hostResult = isHostWinner ? 'win' : 'loss';

            matchResult = {
              score: rawEventData.score,
              hostResult,
              submittedAt: safeToDate(rawEventData.scoreSubmittedAt) || new Date(),
            };
          }

          // 🔧 [FIX] Calculate currentParticipants will be updated after fetching applications
          // Placeholder - will be replaced with accurate count after applications query
          let computedCurrentParticipants = 1; // Start with host

          // 🎯 [KIM FIX v2] Fetch approved AND pending applications for this event
          // Host partner (철수) needs to see pending guest team applications in real-time
          // When guest partner (광수) accepts invitation, guest team status becomes 'pending'
          let approvedApplications: ParticipationApplication[] = [];
          try {
            const applicationsQuery = query(
              collection(db, 'participation_applications'),
              where('eventId', '==', eventId),
              where('status', 'in', ['approved', 'pending'])
            );
            const applicationsSnapshot = await getDocs(applicationsQuery);
            approvedApplications = applicationsSnapshot.docs.map(appDoc => ({
              id: appDoc.id,
              ...appDoc.data(),
            })) as ParticipationApplication[];

            // 🎯 [KIM FIX] Calculate currentParticipants = host(1) + approved applications
            const approvedOnly = approvedApplications.filter(app => app.status === 'approved');
            computedCurrentParticipants = 1 + approvedOnly.length;

            console.log(
              '🎯 [subscribeToAppliedEvents] Fetched applications (approved + pending):',
              {
                eventId,
                count: approvedApplications.length,
                approvedCount: approvedOnly.length,
                computedCurrentParticipants,
                applications: approvedApplications.map(app => ({
                  applicantId: app.applicantId,
                  applicantName: app.applicantName,
                  partnerId: app.partnerId,
                  partnerName: app.partnerName,
                  status: app.status,
                })),
              }
            );
          } catch (appError) {
            console.error('❌ Error fetching applications:', appError);
          }

          // 🎯 [SOLO LOBBY] Fetch count of other solo applicants if user has solo application
          let soloLobbyCount = 0;
          const myApplication = allApplicationsMap.get(eventId);
          if (myApplication?.status === 'looking_for_partner') {
            try {
              const soloApplicantsQuery = query(
                collection(db, 'participation_applications'),
                where('eventId', '==', eventId),
                where('status', '==', 'looking_for_partner')
              );
              const soloApplicantsSnapshot = await getDocs(soloApplicantsQuery);
              // Count excludes current user
              soloLobbyCount = soloApplicantsSnapshot.docs.filter(
                doc => doc.data().applicantId !== userId
              ).length;
              console.log('🎯 [SOLO LOBBY] Found other solo applicants:', {
                eventId,
                soloLobbyCount,
                totalSoloApplicants: soloApplicantsSnapshot.docs.length,
              });
            } catch (soloError) {
              console.error('❌ Error fetching solo lobby count:', soloError);
            }
          }

          return {
            id: eventDoc.docs[0].id,
            ...rawEventData,
            // 🎯 [KIM FIX] Include hostName (fetched from users collection if missing)
            hostName,
            scheduledTime:
              safeToDate(rawEventData.scheduledTime, 'activityService.subscribeToAppliedEvents') ||
              new Date(),
            createdAt:
              safeToDate(rawEventData.createdAt, 'activityService.subscribeToAppliedEvents') ||
              new Date(),
            updatedAt:
              safeToDate(rawEventData.updatedAt, 'activityService.subscribeToAppliedEvents') ||
              new Date(),
            matchResult,
            chatUnreadCount: rawEventData.chatUnreadCount || {},
            // Add application data for myApplication (used by AppliedEventsSection for counts)
            myApplication: allApplicationsMap.get(eventId),
            // 🔧 [FIX] Ensure currentParticipants is always set
            currentParticipants: computedCurrentParticipants,
            // 🎯 [KIM FIX] Include approved applications (for host partner to see opponent team)
            approvedApplications,
            // 🎯 [SOLO LOBBY] Include solo lobby count (other players waiting for partner)
            soloLobbyCount,
          } as EventWithParticipation;
        } catch (error) {
          console.error(`❌ Error fetching event ${eventId}:`, error);
          return null;
        }
      });

      const allEvents = (await Promise.all(eventsPromises)).filter(
        event => event !== null
      ) as EventWithParticipation[];

      // 🎯 [KIM FIX v4] Log all events before filtering to debug matchResult
      console.log(
        '📋 [subscribeToAppliedEvents] All events before filtering:',
        allEvents.map(e => ({
          id: e.id,
          title: e.title,
          hasMatchResult: !!e.matchResult,
          matchResult: e.matchResult,
          scheduledTime: e.scheduledTime,
        }))
      );

      // 🎯 [KIM FIX v31] Filter out events where current user is the host
      // Host should only see their events in "Hosted Events" tab, NOT in "Applied Events" tab
      const nonHostedEvents = allEvents.filter(event => {
        const isHost = event.hostId === userId;
        if (isHost) {
          console.log(
            `🚫 [HOST_FILTER] Excluding host's own event from Applied Events: ${event.id} (${event.title})`
          );
        }
        return !isHost;
      });

      // Filter by status if needed
      let filteredEvents = nonHostedEvents;

      if (status === 'upcoming') {
        // 🎯 [KIM FIX v4] Use isActiveOrRecentlyCompleted which checks matchResult FIRST
        // Events with matchResult should return false and be excluded from "Applied Events"
        // 🎯 [KIM FIX v5] EXCEPTION: Solo lobby applications should ALWAYS show regardless of time!
        // Solo lobby statuses: looking_for_partner, pending_partner_approval
        // 🎯 [KIM FIX v31] Use nonHostedEvents instead of allEvents to apply host filter!
        filteredEvents = nonHostedEvents.filter(event => {
          const myAppStatus = event.myApplication?.status;

          // 🎯 [SOLO LOBBY EXCEPTION] Always show solo lobby events - user needs to accept/reject!
          if (myAppStatus === 'looking_for_partner' || myAppStatus === 'pending_partner_approval') {
            console.log(
              `🎯 [SOLO_LOBBY] Always showing solo lobby event: ${event.id} (${event.title}) - status: ${myAppStatus}`
            );
            return true;
          }

          const shouldShow = this.isActiveOrRecentlyCompleted(event);
          if (event.matchResult && shouldShow) {
            // This shouldn't happen - if matchResult exists, isActiveOrRecentlyCompleted should return false
            console.warn('⚠️ [BUG] Event with matchResult is still showing:', {
              id: event.id,
              title: event.title,
              matchResult: event.matchResult,
              shouldShow,
            });
          }
          return shouldShow;
        });
      } else if (status === 'completed') {
        // 🎯 [KIM FIX v31] Use nonHostedEvents instead of allEvents to apply host filter!
        filteredEvents = nonHostedEvents.filter(event => !this.isActiveOrRecentlyCompleted(event));
      }

      // Sort by scheduled time
      const sortedEvents = filteredEvents.sort(
        (a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime()
      );

      console.log(`✅ [subscribeToAppliedEvents] Returning ${sortedEvents.length} events`);
      // 🔥 [DEBUG] Log the final events being returned
      console.log(
        '🔥 [FINAL_EVENTS] Events being returned:',
        sortedEvents.map(e => ({
          id: e.id,
          title: e.title,
          myApplicationStatus: e.myApplication?.status,
          myApplicationId: e.myApplication?.id,
        }))
      );
      callback(sortedEvents);
    };

    const handleError = (error: Error) => {
      console.error('❌ [subscribeToAppliedEvents] Error:', error);
    };

    // 🎯 [KIM FIX] Helper to check if status is "rejected" (for filtering at subscription level)
    const isRejectedStatusForFilter = (status: string | undefined): boolean => {
      return [
        'rejected',
        'cancelled_by_host',
        'declined',
        'cancelled',
        'cancelled_by_user',
      ].includes(status || '');
    };

    // Subscribe to applicant query
    const unsubscribeApplicant = onSnapshot(
      applicantQuery,
      async snapshot => {
        console.log(
          `📥 [subscribeToAppliedEvents/APPLICANT] Received ${snapshot.docs.length} applications`
        );
        // 🎯 [KIM FIX] Filter out rejected applications at subscription level
        applicantApplications = snapshot.docs
          .map(doc => {
            const data = doc.data();
            // 🔍 [DEBUG] Log ALL applicant applications to see status values
            console.log(
              `🔍 [APPLICANT DEBUG] eventId: ${data.eventId}, status: "${data.status}", applicantId: ${data.applicantId}, partnerId: ${data.partnerId}`
            );
            return {
              id: doc.id,
              eventId: data.eventId as string,
              status: data.status as string | undefined,
              ...data,
            };
          })
          .filter(app => {
            const appStatus = app.status;
            if (isRejectedStatusForFilter(appStatus)) {
              console.log(
                `🚫 [APPLICANT FILTER] Skipping rejected app: ${app.eventId} (status: ${appStatus})`
              );
              return false;
            }
            return true;
          });
        console.log(
          `📥 [subscribeToAppliedEvents/APPLICANT] After filter: ${applicantApplications.length} applications`
        );
        await fetchAndProcessEvents();
      },
      handleError
    );

    // Subscribe to partner query
    const unsubscribePartner = onSnapshot(
      partnerQuery,
      async snapshot => {
        console.log(
          `📥 [subscribeToAppliedEvents/PARTNER] Received ${snapshot.docs.length} applications`
        );

        // 🎯 [KIM FIX] FIRST: Collect rejected eventIds for cross-filtering BEFORE filtering
        // This is critical - we need to know which events were rejected as partner
        // so we can also hide them from the applicant view
        const newRejectedAsPartner = new Set<string>();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const applicationStatus = data.status as string | undefined;
          if (
            applicationStatus === 'rejected' ||
            applicationStatus === 'cancelled_by_host' ||
            applicationStatus === 'declined' ||
            applicationStatus === 'cancelled'
          ) {
            newRejectedAsPartner.add(data.eventId as string);
            console.log(
              `🔒 [PARTNER-SUBSCRIPTION] Collected rejected eventId for cross-filter: ${data.eventId}`
            );
          }
        });
        rejectedAsPartnerEventIds = newRejectedAsPartner;
        console.log(
          `📦 [PARTNER-SUBSCRIPTION] Cross-filter set updated: ${rejectedAsPartnerEventIds.size} rejected events`
        );

        // 🆕 [KIM FIX] Filter out applications where partner rejected or cancelled
        // When 광수 rejects 영수's invitation, 광수 shouldn't see this event in their list
        partnerApplications = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              eventId: data.eventId as string,
              partnerStatus: data.partnerStatus as string | undefined,
              ...data,
            };
          })
          .filter(app => {
            const partnerStatus = app.partnerStatus as string | undefined;
            const applicationStatus = app.status as string | undefined;

            // 🎯 [KIM FIX] Filter out rejected applications (host rejected the team application)
            // This ensures partners don't see events where the host rejected the application
            if (
              applicationStatus === 'rejected' ||
              applicationStatus === 'cancelled_by_host' ||
              applicationStatus === 'declined' ||
              applicationStatus === 'cancelled'
            ) {
              console.log(
                `⏭️ [subscribeToAppliedEvents/PARTNER] Filtering rejected app: ${app.eventId} (status: ${applicationStatus})`
              );
              return false;
            }

            // Only include if partner has accepted (or status is undefined for legacy data)
            return partnerStatus === 'accepted' || partnerStatus === undefined;
          });
        console.log(
          `📥 [subscribeToAppliedEvents/PARTNER] After filter: ${partnerApplications.length} applications`
        );
        await fetchAndProcessEvents();
      },
      handleError
    );

    // Return cleanup function
    return () => {
      unsubscribeApplicant();
      unsubscribePartner();
    };
  }

  /**
   * Subscribe to real-time updates for events the user is hosting
   * @param userId - User ID
   * @param callback - Function to call when data changes
   * @param options - Filter options
   * @returns Unsubscribe function
   */
  subscribeToHostedEvents(
    userId: string,
    callback: (events: EventWithParticipation[]) => void,
    options: { status?: 'all' | 'upcoming' | 'completed' } = {}
  ): Unsubscribe {
    const { status = 'upcoming' } = options;
    console.log(`🚨🚨🚨 [METRO RELOAD TEST] subscribeToHostedEvents called for ${status} events`);
    console.log(`🔄 [subscribeToHostedEvents] Setting up listener for ${status} events`);

    if (!isFirebaseAvailable || !db) {
      console.warn('⚠️ ActivityService: Firebase not available');
      return () => {};
    }

    // 🚀 [PERFORMANCE] Add limit to reduce initial load time
    // Only fetch recent 20 events - older ones are likely completed anyway
    const eventsQuery = query(
      collection(db, this.EVENTS_COLLECTION),
      where('hostId', '==', userId),
      orderBy('scheduledTime', 'desc'),
      limit(20)
    );

    return onSnapshot(
      eventsQuery,
      async snapshot => {
        console.log(
          `🔄 [subscribeToHostedEvents] Real-time update received: ${snapshot.docs.length} events`
        );

        const allHostedEvents = snapshot.docs.map(doc => {
          const rawData = doc.data();

          // 🔍 DEBUG: Check if currentParticipants, type, and placeDetails exists in rawData
          console.log('🔍 [subscribeToHostedEvents] rawData check:', {
            eventId: doc.id,
            title: rawData.title,
            type: rawData.type,
            gameType: rawData.gameType,
            hasCurrentParticipants: 'currentParticipants' in rawData,
            currentParticipantsValue: rawData.currentParticipants,
            // 🌤️ [KIM FIX] Debug weather-related fields
            hasPlaceDetails: 'placeDetails' in rawData,
            placeDetails: rawData.placeDetails,
            hasCoordinates: 'coordinates' in rawData,
            hasLocationDetails: 'locationDetails' in rawData,
            // 🎯 [KIM FIX] Debug matchResult for immediate movement
            hasMatchResult: 'matchResult' in rawData,
            matchResult: rawData.matchResult,
          });

          const mappedEvent = {
            id: doc.id,
            ...rawData,
            scheduledTime:
              safeToDate(rawData.scheduledTime, 'activityService.subscribeToHostedEvents') ||
              new Date(),
            createdAt:
              safeToDate(rawData.createdAt, 'activityService.subscribeToHostedEvents') ||
              new Date(),
            updatedAt:
              safeToDate(rawData.updatedAt, 'activityService.subscribeToHostedEvents') ||
              new Date(),
            actualEndTime: safeToDate(
              rawData.actualEndTime,
              'activityService.subscribeToHostedEvents'
            ),
            chatUnreadCount: rawData.chatUnreadCount || {},
            // 🎯 [OPERATION DUO] Explicitly map currentParticipants from Firestore
            currentParticipants: rawData.currentParticipants as number | undefined,
            // 🌤️ [KIM FIX] Explicitly map weather-related fields for HostedEventCard
            placeDetails: rawData.placeDetails,
            coordinates: rawData.coordinates,
            locationDetails: rawData.locationDetails,
            // 🎯 [KIM FIX] Explicitly map matchResult for immediate movement to past events
            matchResult: rawData.matchResult,
          } as unknown as EventWithParticipation;

          return mappedEvent;
        });

        // 🎯 [KIM FIX v7] Get applications FIRST for ALL events, THEN filter
        // This is critical because we need to check for pending/looking_for_partner
        // applications before applying the 24-hour rule
        console.log(`🔍 [FILTER DEBUG] Before filtering - total events: ${allHostedEvents.length}`);
        allHostedEvents.forEach(event => {
          console.log(
            `🔍 [FILTER DEBUG] Event: ${event.title} (${event.id}) - status: ${event.status}, scheduledTime: ${event.scheduledTime}`
          );
        });

        // STEP 1: Get applications for ALL events first
        const allEventsWithApplications = await Promise.all(
          allHostedEvents.map(async event => {
            try {
              const applicationsQuery = query(
                collection(db, this.APPLICATIONS_COLLECTION),
                where('eventId', '==', event.id)
              );
              const applicationsSnapshot = await getDocs(applicationsQuery);

              const applications = applicationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                appliedAt:
                  safeToDate(doc.data().appliedAt, 'activityService.subscribeToHostedEvents') ||
                  new Date(),
                processedAt: safeToDate(
                  doc.data().processedAt,
                  'activityService.subscribeToHostedEvents'
                ),
              })) as ParticipationApplication[];

              // Filter applications by status for easier access
              const pendingApplications = applications.filter(app => app.status === 'pending');
              const approvedApplications = applications.filter(app => app.status === 'approved');

              const eventWithApplications = {
                ...event,
                applications, // All applications
                pendingApplications, // Pending applications only
                approvedApplications, // Approved applications only
                // 🆕 [KIM FIX] Explicitly preserve currentParticipants (was being lost in spread)
                currentParticipants: event.currentParticipants,
              };

              // 🔍 TEMPORARY DEBUG v2 - Verify approvedApplications field mapping
              console.log('🔍🔍 [subscribeToHostedEvents V2] Event mapped:', {
                eventId: event.id,
                eventTitle: event.title,
                gameType: event.gameType,
                status: event.status,
                hasApprovedApplications: !!eventWithApplications.approvedApplications,
                approvedCount: eventWithApplications.approvedApplications?.length || 0,
                approvedApplications: eventWithApplications.approvedApplications,
                timestamp: new Date().toISOString(),
              });

              return eventWithApplications;
            } catch (error) {
              console.error(`Error fetching applications for event ${event.id}:`, error);
              return {
                ...event,
                applications: [],
                pendingApplications: [],
                approvedApplications: [],
              };
            }
          })
        );

        // STEP 2: Now filter AFTER we have applications
        // 🎯 [KIM FIX v7] Show events with pending/looking_for_partner applications regardless of 24h rule
        let filteredEvents = allEventsWithApplications;

        if (status === 'upcoming') {
          filteredEvents = allEventsWithApplications.filter(event => {
            // 🎯 EXCEPTION: Events with pending or looking_for_partner applications always show!
            // This ensures hosts can see events even if 24h has passed but there are applicants waiting
            const hasActiveApplications = event.applications?.some(
              (app: { status: string }) =>
                app.status === 'pending' ||
                app.status === 'looking_for_partner' ||
                app.status === 'pending_partner_approval'
            );

            if (hasActiveApplications) {
              console.log(
                `✅ [HOST_FILTER] Showing event "${event.title}" - has active applications (pending/looking_for_partner)`
              );
              return true;
            }

            // Otherwise, apply normal time-based filtering
            return this.isActiveOrRecentlyCompleted(event);
          });
          console.log(
            `🔍 [FILTER DEBUG] After 'upcoming' filter - remaining: ${filteredEvents.length}`
          );
        } else if (status === 'completed') {
          filteredEvents = allEventsWithApplications.filter(event => {
            // For completed: show events that are completed AND don't have active applications
            const hasActiveApplications = event.applications?.some(
              (app: { status: string }) =>
                app.status === 'pending' ||
                app.status === 'looking_for_partner' ||
                app.status === 'pending_partner_approval'
            );

            if (hasActiveApplications) {
              return false; // Still has active applications, keep in "upcoming"
            }

            return !this.isActiveOrRecentlyCompleted(event);
          });
          console.log(
            `🔍 [FILTER DEBUG] After 'completed' filter - remaining: ${filteredEvents.length}`
          );
        }

        callback(filteredEvents);
      },
      error => {
        console.error('❌ [subscribeToHostedEvents] Error:', error);
      }
    );
  }

  /**
   * Subscribe to real-time updates for the user's past events
   * @param userId - User ID
   * @param callback - Function to call when data changes
   * @returns Unsubscribe function
   */
  subscribeToPastEvents(
    userId: string,
    callback: (events: EventWithParticipation[]) => void
  ): Unsubscribe {
    console.log('🔄 [subscribeToPastEvents] Setting up listener');

    if (!isFirebaseAvailable || !db) {
      console.warn('⚠️ ActivityService: Firebase not available');
      return () => {};
    }

    const currentTime = new Date();

    // Listen to past hosted events
    // 🎯 [KIM FIX v6] Removed scheduledTime filter to include future events with matchResult
    // Events are filtered later to include:
    // 1. Past events (completed) with matchResult or 24h passed
    // 2. Future events WITH matchResult (score submitted before scheduled time)
    const hostedEventsQuery = query(
      collection(db, this.EVENTS_COLLECTION),
      where('hostId', '==', userId),
      orderBy('scheduledTime', 'desc'),
      limit(50)
    );

    return onSnapshot(
      hostedEventsQuery,
      async snapshot => {
        console.log(
          `🔄 [subscribeToPastEvents] Real-time update received: ${snapshot.docs.length} hosted events (including future events for matchResult check)`
        );

        const pastEvents: EventWithParticipation[] = [];

        // Process hosted events
        const hostedEvents = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            scheduledTime:
              safeToDate(data.scheduledTime, 'activityService.subscribeToPastEvents') || new Date(),
            createdAt:
              safeToDate(data.createdAt, 'activityService.subscribeToPastEvents') || new Date(),
            updatedAt:
              safeToDate(data.updatedAt, 'activityService.subscribeToPastEvents') || new Date(),
            actualEndTime: safeToDate(data.actualEndTime, 'activityService.subscribeToPastEvents'),
            isHost: true,
            // 🎯 [KIM FIX] Include matchResult for filtering
            matchResult: data.matchResult || data.result || null,
            // 🌤️ [KIM FIX] Explicitly map weather-related fields
            placeDetails: data.placeDetails,
            coordinates: data.coordinates,
            locationDetails: data.locationDetails,
          } as unknown as EventWithParticipation;
        });

        // 🎯 [KIM FIX] Include MATCH events that are:
        // 1. Completed with matchResult (immediately after score submission), OR
        // 2. Completed for more than 24 hours (even without score)
        // Excludes meetups completely
        const pastHostedEvents = hostedEvents.filter(event => {
          const isMeetup = isMeetupEvent(event);
          const is24HoursPassed = this.isCompletedFor24Hours(event);
          const hasMatchResult = !!event.matchResult;

          // 🎯 [KIM FIX] Include immediately if matchResult exists (score submitted)
          const willInclude = !isMeetup && (hasMatchResult || is24HoursPassed);

          console.log(`🔍 [subscribeToPastEvents] Filtering hosted event:`, {
            title: event.title,
            eventId: event.id,
            type: event.type,
            gameType: event.gameType,
            isMeetup,
            hasMatchResult,
            is24HoursPassed,
            willInclude,
          });

          if (isMeetup) {
            console.log(
              `🗑️ [subscribeToPastEvents] Excluding meetup from past events: ${event.title} (type: ${event.type}, gameType: ${event.gameType})`
            );
            return false;
          }
          return hasMatchResult || is24HoursPassed;
        });
        pastEvents.push(...pastHostedEvents);

        // Get past participated events
        // 🎯 [KIM FIX v5] Use dual query to include both applicantId AND partnerId
        // This fixes the issue where team partners don't see events in "Past Activities"
        try {
          // Query 1: Events where user is the applicant
          const applicantQuery = query(
            collection(db, this.APPLICATIONS_COLLECTION),
            where('applicantId', '==', userId),
            where('status', '==', 'approved')
          );

          // Query 2: Events where user is the partner
          const partnerQuery = query(
            collection(db, this.APPLICATIONS_COLLECTION),
            where('partnerId', '==', userId),
            where('status', '==', 'approved')
          );

          // Execute both queries in parallel
          const [applicantSnapshot, partnerSnapshot] = await Promise.all([
            getDocs(applicantQuery),
            getDocs(partnerQuery),
          ]);

          // Combine results, using Map to deduplicate by document ID
          const allApplicationsMap = new Map<string, (typeof applicantSnapshot.docs)[0]>();
          applicantSnapshot.docs.forEach(doc => allApplicationsMap.set(doc.id, doc));
          partnerSnapshot.docs.forEach(doc => allApplicationsMap.set(doc.id, doc));

          console.log(
            `📋 [subscribeToPastEvents] Found ${allApplicationsMap.size} approved applications (applicant: ${applicantSnapshot.docs.length}, partner: ${partnerSnapshot.docs.length})`
          );

          const applicationsSnapshot = { docs: Array.from(allApplicationsMap.values()) };

          for (const appDoc of applicationsSnapshot.docs) {
            const application = {
              id: appDoc.id,
              ...appDoc.data(),
              appliedAt:
                safeToDate(appDoc.data().appliedAt, 'activityService.subscribeToPastEvents') ||
                new Date(),
              processedAt: safeToDate(
                appDoc.data().processedAt,
                'activityService.subscribeToPastEvents'
              ),
            } as ParticipationApplication;

            try {
              const eventDoc = await getDoc(doc(db, this.EVENTS_COLLECTION, application.eventId));
              if (eventDoc.exists()) {
                const eventData = eventDoc.data();
                const eventTime =
                  safeToDate(eventData.scheduledTime, 'activityService.subscribeToPastEvents') ||
                  new Date();

                // 🎯 [KIM FIX v3] Check matchResult FIRST - if score is submitted, include regardless of time
                const hasMatchResult = !!eventData.matchResult;
                const isPastEvent = eventTime < currentTime;

                // Include if: (past event) OR (has matchResult - score submitted)
                if (isPastEvent || hasMatchResult) {
                  const pastEvent = {
                    id: eventDoc.id,
                    ...eventData,
                    scheduledTime: eventTime,
                    createdAt:
                      safeToDate(eventData.createdAt, 'activityService.subscribeToPastEvents') ||
                      new Date(),
                    updatedAt:
                      safeToDate(eventData.updatedAt, 'activityService.subscribeToPastEvents') ||
                      new Date(),
                    actualEndTime: safeToDate(
                      eventData.actualEndTime,
                      'activityService.subscribeToPastEvents'
                    ),
                    myApplication: application,
                    isHost: false,
                    // 🎯 [KIM FIX] Include matchResult in event object
                    matchResult: eventData.matchResult,
                  } as unknown as EventWithParticipation;

                  // 🎯 [KIM FIX] Include MATCH events that are:
                  // 1. Completed with matchResult (immediately after score submission), OR
                  // 2. Completed for more than 24 hours (even without score)
                  // Excludes meetups completely
                  const isMeetup = isMeetupEvent(pastEvent);
                  const is24HoursPassed = this.isCompletedFor24Hours(pastEvent);
                  const completionTime = this.getEventCompletionTime(pastEvent);

                  // 🎯 [KIM FIX v3] Include immediately if matchResult exists (score submitted)
                  const willInclude = !isMeetup && (hasMatchResult || is24HoursPassed);

                  console.log(`🔍 [subscribeToPastEvents] Filtering participated event:`, {
                    title: pastEvent.title,
                    eventId: pastEvent.id,
                    type: pastEvent.type,
                    gameType: pastEvent.gameType,
                    scheduledTime: pastEvent.scheduledTime,
                    actualEndTime: pastEvent.actualEndTime,
                    duration: pastEvent.duration,
                    completionTime: completionTime.toISOString(),
                    isMeetup,
                    hasMatchResult,
                    isPastEvent,
                    is24HoursPassed,
                    willInclude,
                  });

                  if (isMeetup) {
                    console.log(
                      `🗑️ [subscribeToPastEvents] Excluding participated meetup: ${pastEvent.title} (type: ${pastEvent.type}, gameType: ${pastEvent.gameType})`
                    );
                  } else if (hasMatchResult || is24HoursPassed) {
                    pastEvents.push(pastEvent);
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching past event:', application.eventId, error);
            }
          }
        } catch (error) {
          console.error('Error fetching applications:', error);
        }

        // 🎯 [KIM FIX v7] SINGLES MATCH FIX: Search for events where user is a participant
        // Singles matches store guests directly in the `participants` array, not in participation_applications
        // Firestore cannot query nested objects in arrays, so we need to:
        // 1. Query events that have matchResult (completed matches)
        // 2. Filter client-side to check if userId is in participants array
        try {
          console.log(
            `🔍 [subscribeToPastEvents] Searching for singles matches where user is participant...`
          );

          // Query events with matchResult (completed matches) that user might be participant in
          // We can't query participants array directly, so get all completed matches and filter
          const completedMatchesQuery = query(
            collection(db, this.EVENTS_COLLECTION),
            where('status', 'in', ['completed', 'active', 'open']), // Include active/open for future events with scores
            orderBy('scheduledTime', 'desc'),
            limit(100) // Reasonable limit to avoid performance issues
          );

          const completedMatchesSnapshot = await getDocs(completedMatchesQuery);
          console.log(
            `🔍 [subscribeToPastEvents] Found ${completedMatchesSnapshot.docs.length} events to check for participant`
          );

          for (const eventDoc of completedMatchesSnapshot.docs) {
            const eventData = eventDoc.data();

            // Skip if this event is already in pastEvents (from host or application queries)
            if (pastEvents.some(e => e.id === eventDoc.id)) {
              continue;
            }

            // Check if event has participants array
            const participants = eventData.participants as
              | Array<{ playerId?: string; playerName?: string }>
              | undefined;
            if (!participants || !Array.isArray(participants)) {
              continue;
            }

            // Check if user is in participants array (as playerId)
            const isUserParticipant = participants.some(
              p => p.playerId === userId || (p as unknown as { id?: string }).id === userId
            );

            if (!isUserParticipant) {
              continue;
            }

            // Skip if user is the host (already handled above)
            if (eventData.hostId === userId) {
              continue;
            }

            // Check if event should be included (has matchResult or is past 24h)
            const hasMatchResult = !!eventData.matchResult;
            const eventTime =
              safeToDate(eventData.scheduledTime, 'activityService.subscribeToPastEvents') ||
              new Date();
            const is24HoursPassed =
              eventTime < new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

            if (hasMatchResult || is24HoursPassed) {
              const isMeetup = isMeetupEvent(eventData as unknown as EventWithParticipation);
              if (!isMeetup) {
                console.log(
                  `🎾 [subscribeToPastEvents] Found singles match participant: "${eventData.title}" for user ${userId}`
                );

                const participantEvent = {
                  id: eventDoc.id,
                  ...eventData,
                  scheduledTime: eventTime,
                  createdAt:
                    safeToDate(eventData.createdAt, 'activityService.subscribeToPastEvents') ||
                    new Date(),
                  updatedAt:
                    safeToDate(eventData.updatedAt, 'activityService.subscribeToPastEvents') ||
                    new Date(),
                  actualEndTime: safeToDate(
                    eventData.actualEndTime,
                    'activityService.subscribeToPastEvents'
                  ),
                  isHost: false,
                  matchResult: eventData.matchResult,
                  placeDetails: eventData.placeDetails,
                  coordinates: eventData.coordinates,
                  locationDetails: eventData.locationDetails,
                } as unknown as EventWithParticipation;

                pastEvents.push(participantEvent);
              }
            }
          }
        } catch (error) {
          console.error('Error searching for participant events:', error);
        }

        // Remove duplicates and sort
        const uniquePastEvents = pastEvents.filter(
          (event, index, self) => index === self.findIndex(e => e.id === event.id)
        );

        const sortedEvents = uniquePastEvents.sort(
          (a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime()
        );

        callback(sortedEvents);
      },
      error => {
        console.error('❌ [subscribeToPastEvents] Error:', error);
      }
    );
  }

  // ==========================================
  // APPLICATION MANAGEMENT
  // ==========================================

  /**
   * Check if user has already applied to an event
   */
  async getUserApplicationStatus(
    eventId: string,
    userId: string
  ): Promise<{
    hasApplied: boolean;
    applicationId?: string;
    status?: ParticipationStatus;
  }> {
    try {
      console.log('ActivityService: Checking application status:', { eventId, userId });

      // Firebase 사용 가능성 확인
      if (!isFirebaseAvailable || !db) {
        console.warn('⚠️ ActivityService: Firebase not available, returning mock status');
        return { hasApplied: false };
      }

      // 사용자의 해당 이벤트 신청 상태 확인
      const applicationsQuery = query(
        collection(db, this.APPLICATIONS_COLLECTION),
        where('eventId', '==', eventId),
        where('applicantId', '==', userId),
        orderBy('appliedAt', 'desc'),
        limit(1)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);

      if (applicationsSnapshot.empty) {
        return { hasApplied: false };
      }

      const applicationDoc = applicationsSnapshot.docs[0];
      const applicationData = applicationDoc.data() as ParticipationApplication;

      return {
        hasApplied: true,
        applicationId: applicationDoc.id,
        status: applicationData.status,
      };
    } catch (error) {
      console.error('Error checking application status:', error);
      return { hasApplied: false };
    }
  }

  /**
   * Apply to participate in an event
   * @returns Object containing applicationId, autoApproved status, and status
   */
  async applyToEvent(
    eventId: string,
    applicantId: string,
    message?: string,
    applicantName?: string,
    userContext?: Record<string, unknown>
  ): Promise<{ applicationId: string; autoApproved: boolean; status: string }> {
    try {
      console.log('🛡️ Calling applyToEvent Cloud Function:', {
        eventId,
        applicantId,
        applicantName,
        message,
      });

      // Firebase 사용 가능성 확인
      if (!isFirebaseAvailable || !db) {
        console.warn('⚠️ ActivityService: Firebase not available, simulating event application');
        const mockApplicationId = 'mock_application_' + Date.now();
        console.log('✅ Mock application created:', mockApplicationId);
        return { applicationId: mockApplicationId, autoApproved: false, status: 'pending' };
      }

      // Prepare applicant name (use userContext if provided)
      let finalApplicantName = applicantName;

      if (!finalApplicantName && userContext) {
        finalApplicantName =
          (userContext.displayName as string) ||
          (userContext.nickname as string) ||
          (userContext.name as string) ||
          (userContext.firstName as string) ||
          (userContext.email ? (userContext.email as string).split('@')[0] : undefined);
      }

      const applyToEventFn = httpsCallable(functions, 'applyToEvent');
      const result = await applyToEventFn({
        eventId,
        applicantId,
        message: message || '',
        applicantName: finalApplicantName,
      });

      const data = result.data as {
        applicationId: string;
        autoApproved?: boolean;
        status?: string;
      };
      console.log('✅ Cloud Function response:', data);

      return {
        applicationId: data.applicationId,
        autoApproved: data.autoApproved ?? false,
        status: data.status ?? 'pending',
      };
    } catch (error: unknown) {
      console.error('❌ Error applying to event:', error);

      // Re-throw with user-friendly message
      const errorCode = (error as { code?: string })?.code;
      const errorMessage = (error as { message?: string })?.message || '';

      if (errorCode === 'unauthenticated') {
        throw new Error('You must be logged in to apply to events');
      } else if (errorCode === 'permission-denied') {
        throw new Error('You can only apply for yourself');
      } else if (errorCode === 'not-found') {
        throw new Error('Event not found');
      } else if (errorCode === 'already-exists') {
        throw new Error('You have already applied to this event');
      } else if (errorCode === 'failed-precondition') {
        // 🎯 [KIM FIX] Handle event full error from Cloud Function
        if (errorMessage.includes('full')) {
          throw new Error('EVENT_FULL');
        }
        throw new Error('Failed to apply to event. Please try again.');
      } else {
        throw new Error('Failed to apply to event. Please try again.');
      }
    }
  }

  /**
   * 🎯 [OPERATION DUO - PHASE 2A] Apply as team with partner invitation
   *
   * Creates a team application with partner invitation workflow:
   * - Application is hidden from host until partner accepts (status: 'pending_partner_approval')
   * - Partner receives invitation with 24-hour expiry
   * - When partner accepts, application becomes visible to host
   *
   * @param eventId - Event ID
   * @param applicantId - Applicant user ID
   * @param partnerId - Partner user ID
   * @param partnerName - Partner display name
   * @param applicantName - Applicant display name (optional)
   * @param message - Application message (optional)
   * @returns Application ID and invitation ID
   */
  async applyAsTeam(
    eventId: string,
    applicantId: string,
    partnerId: string,
    partnerName: string,
    applicantName?: string,
    message?: string
  ): Promise<{ applicationId: string; invitationId: string }> {
    try {
      console.log('🎯 Calling applyAsTeam Cloud Function:', {
        eventId,
        applicantId,
        partnerId,
        partnerName,
        applicantName,
        message,
      });

      // Firebase availability check
      if (!isFirebaseAvailable || !db) {
        console.warn('⚠️ ActivityService: Firebase not available, simulating team application');
        const mockApplicationId = 'mock_application_' + Date.now();
        const mockInvitationId = 'mock_invitation_' + Date.now();
        console.log('✅ Mock team application created:', {
          mockApplicationId,
          mockInvitationId,
        });
        return { applicationId: mockApplicationId, invitationId: mockInvitationId };
      }

      const applyAsTeamFn = httpsCallable(functions, 'applyAsTeam');
      const result = await applyAsTeamFn({
        eventId,
        applicantId,
        partnerId,
        partnerName,
        applicantName: applicantName || undefined,
        message: message || '',
      });

      const data = result.data as {
        applicationId: string;
        invitationId: string;
        expiresAt: string;
      };
      console.log('✅ applyAsTeam Cloud Function response:', data);

      return {
        applicationId: data.applicationId,
        invitationId: data.invitationId,
      };
    } catch (error: unknown) {
      console.error('❌ Error applying as team:', error);

      // Re-throw with user-friendly message
      const errorCode = (error as { code?: string })?.code;
      const errorMessage = (error as { message?: string })?.message;

      if (errorCode === 'unauthenticated') {
        throw new Error('You must be logged in to apply to events');
      } else if (errorCode === 'permission-denied') {
        throw new Error('You can only apply for yourself');
      } else if (errorCode === 'not-found') {
        throw new Error('Event not found');
      } else if (errorCode === 'already-exists') {
        throw new Error(errorMessage || 'You have already applied to this event');
      } else if (errorCode === 'invalid-argument') {
        throw new Error(errorMessage || 'Invalid application data. Please check your input.');
      } else {
        throw new Error('Failed to apply as team. Please try again.');
      }
    }
  }

  /**
   * 🎯 [OPERATION SOLO LOBBY] Apply to a doubles event as an individual (solo) player
   * Creates an application with status 'looking_for_partner' and notifies existing solo applicants
   */
  async applyAsSolo(
    eventId: string,
    applicantId: string,
    applicantName?: string,
    message?: string
  ): Promise<{ applicationId: string; notifiedCount: number }> {
    try {
      console.log('🎯 [SOLO LOBBY] Calling applyAsSolo Cloud Function:', {
        eventId,
        applicantId,
        applicantName,
        message,
      });

      // Firebase availability check
      if (!isFirebaseAvailable || !db) {
        console.warn('⚠️ ActivityService: Firebase not available, simulating solo application');
        const mockApplicationId = 'mock_solo_application_' + Date.now();
        console.log('✅ Mock solo application created:', { mockApplicationId });
        return { applicationId: mockApplicationId, notifiedCount: 0 };
      }

      const applyAsSoloFn = httpsCallable(functions, 'applyAsSolo');
      const result = await applyAsSoloFn({
        eventId,
        applicantId,
        applicantName: applicantName || undefined,
        message: message || '',
      });

      const data = result.data as {
        success: boolean;
        applicationId: string;
        notifiedCount: number;
      };
      console.log('✅ applyAsSolo Cloud Function response:', data);

      return {
        applicationId: data.applicationId,
        notifiedCount: data.notifiedCount,
      };
    } catch (error: unknown) {
      console.error('❌ Error applying as solo:', error);

      // 🎯 [KIM FIX] Re-throw with user-friendly message
      // Firebase Functions errors have code in different places
      const firebaseError = error as {
        code?: string;
        message?: string;
        details?: { code?: string; message?: string };
      };
      // Firebase error codes come as 'functions/already-exists' - need to strip prefix
      const errorCode =
        firebaseError?.code?.replace('functions/', '') || firebaseError?.details?.code;
      const errorMessage = firebaseError?.message || firebaseError?.details?.message;

      console.log('🔍 [DEBUG] Error details:', { errorCode, errorMessage });

      if (errorCode === 'unauthenticated') {
        throw new Error('You must be logged in to apply to events');
      } else if (errorCode === 'permission-denied') {
        throw new Error('You can only apply for yourself');
      } else if (errorCode === 'not-found') {
        throw new Error('Event not found');
      } else if (errorCode === 'already-exists') {
        // 🎯 [KIM FIX] Use server error message directly (now in Korean)
        throw new Error(errorMessage || 'You have already applied to this event');
      } else if (errorCode === 'invalid-argument') {
        throw new Error(errorMessage || 'Invalid application data. Please check your input.');
      } else {
        // 🎯 [KIM FIX] Show actual error message if available
        throw new Error(errorMessage || 'Failed to apply as solo. Please try again.');
      }
    }
  }

  /**
   * 🎯 [OPERATION DUO - PHASE 2A] Reinvite a different partner for a team application
   */
  async reinviteApplicationPartner(
    applicationId: string,
    oldInvitationId: string | null,
    newPartnerId: string,
    newPartnerName: string
  ): Promise<{ newInvitationId: string }> {
    try {
      console.log('🔄 Calling reinviteApplicationPartner Cloud Function:', {
        applicationId,
        oldInvitationId,
        newPartnerId,
        newPartnerName,
      });

      const reinviteFn = httpsCallable(functions, 'reinviteApplicationPartner');
      const result = await reinviteFn({
        applicationId,
        oldInvitationId,
        newPartnerId,
        newPartnerName,
      });

      const data = result.data as {
        success: boolean;
        newInvitationId: string;
      };

      console.log('✅ Cloud Function response:', data);

      if (data.success && data.newInvitationId) {
        return {
          newInvitationId: data.newInvitationId,
        };
      } else {
        throw new Error('Failed to reinvite partner');
      }
    } catch (error: unknown) {
      console.error('❌ Error reinviting partner:', error);

      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'not-found') {
        throw new Error('Application or invitation not found');
      } else if (errorCode === 'permission-denied') {
        throw new Error('You can only reinvite partners for your own applications');
      } else if (errorCode === 'failed-precondition') {
        const errorMessage = (error as { message?: string })?.message || '';
        throw new Error(errorMessage);
      } else {
        throw new Error('Failed to reinvite partner. Please try again.');
      }
    }
  }

  /**
   * Cancel an application (via Cloud Function)
   */
  async cancelApplication(applicationId: string): Promise<void> {
    try {
      console.log('🛡️ Calling cancelApplication Cloud Function:', applicationId);

      const cancelApplicationFn = httpsCallable(functions, 'cancelApplication');
      const result = await cancelApplicationFn({ applicationId });

      console.log('✅ Cloud Function response:', result.data);
    } catch (error: unknown) {
      console.error('❌ Error cancelling application:', error);

      // Re-throw with user-friendly message
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'unauthenticated') {
        throw new Error('You must be logged in to cancel application');
      } else if (errorCode === 'permission-denied') {
        throw new Error('You can only cancel your own application');
      } else if (errorCode === 'not-found') {
        throw new Error('Application not found');
      } else {
        throw new Error('Failed to cancel application. Please try again.');
      }
    }
  }

  /**
   * Approve an application (host action)
   */
  async approveApplication(applicationId: string, hostId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Update application status
      const applicationRef = doc(db, this.APPLICATIONS_COLLECTION, applicationId);
      batch.update(applicationRef, {
        status: 'approved',
        processedAt: serverTimestamp(),
        processedBy: hostId,
      });

      // Get application data for notification
      const applicationDoc = await getDoc(applicationRef);
      const applicationData = applicationDoc.data() as ParticipationApplication;

      await batch.commit();

      // 🎯 [KIM FIX] Call Cloud Function FIRST for critical processing
      // This handles: participants update, closing remaining solo applications, etc.
      // Must be called before notification to ensure solo applications are closed
      await this.callApprovalCloudFunction(
        applicationId,
        hostId,
        applicationData.eventId,
        applicationData.applicantId
      );

      // Send notification to applicant (non-critical, can fail without affecting approval)
      try {
        await this.notifyApplicant(applicationData.applicantId, 'application_approved', {
          eventTitle: 'Event', // Should get actual event title
        });
      } catch (notificationError) {
        console.warn(
          '⚠️ [APPROVE] Notification failed, but approval succeeded:',
          notificationError
        );
      }
    } catch (error) {
      console.error('Error approving application:', error);
      throw error;
    }
  }

  /**
   * 🚪 게이트키퍼 Phase 3: 일괄 승인 기능
   * Approve all pending applications for an event (admin action)
   */
  async approveAllPendingApplications(eventId: string, adminId: string): Promise<number> {
    try {
      console.log('🚪 [GATEKEEPER P3] Starting bulk approval for event:', eventId);

      // 1. 모든 대기중인 신청 조회
      const pendingQuery = query(
        collection(db, this.APPLICATIONS_COLLECTION),
        where('eventId', '==', eventId),
        where('status', '==', 'pending')
      );

      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingApplications = pendingSnapshot.docs;

      if (pendingApplications.length === 0) {
        console.log('🚪 [GATEKEEPER P3] No pending applications found');
        return 0;
      }

      console.log('🚪 [GATEKEEPER P3] Found', pendingApplications.length, 'pending applications');

      // 2. WriteBatch를 사용한 일괄 승인 처리
      const batch = writeBatch(db);

      pendingApplications.forEach(doc => {
        batch.update(doc.ref, {
          status: 'approved',
          processedAt: serverTimestamp(),
          processedBy: adminId,
          bulkApproved: true, // 일괄 승인 플래그
        });
      });

      await batch.commit();

      console.log(
        '🚪 [GATEKEEPER P3] Successfully approved',
        pendingApplications.length,
        'applications'
      );

      // 3. 승인된 신청자들에게 알림 전송 (백그라운드)
      try {
        for (const doc of pendingApplications) {
          const applicationData = doc.data();
          await this.notifyApplicant(applicationData.applicantId, 'application_approved', {
            eventTitle: 'Event', // 실제 이벤트 제목으로 교체 필요
          });
        }
      } catch (notificationError) {
        // 알림 실패는 치명적이지 않으므로 로그만 기록
        console.warn('🚪 [GATEKEEPER P3] Some notifications failed:', notificationError);
      }

      return pendingApplications.length;
    } catch (error) {
      console.error('🚪 [GATEKEEPER P3] Error in bulk approval:', error);
      throw error;
    }
  }

  /**
   * Decline an application (host action)
   */
  async declineApplication(applicationId: string, hostId: string, reason?: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.APPLICATIONS_COLLECTION, applicationId), {
        status: 'declined',
        processedAt: serverTimestamp(),
        processedBy: hostId,
        hostMessage: reason || '',
      });

      // Get application data for notification
      const applicationDoc = await getDoc(doc(db, this.APPLICATIONS_COLLECTION, applicationId));
      const applicationData = applicationDoc.data() as ParticipationApplication;

      // Send notification to applicant
      await this.notifyApplicant(applicationData.applicantId, 'application_declined', {
        eventTitle: 'Event', // Should get actual event title
      });
    } catch (error) {
      console.error('Error declining application:', error);
      throw error;
    }
  }

  // ==========================================
  // CHAT ROOM MANAGEMENT
  // ==========================================

  /**
   * Get or create chat room for an event
   */
  async getEventChatRoom(eventId: string, userId: string): Promise<string> {
    try {
      // First, verify user is legitimate participant of this event
      const isParticipant = await this.isUserEventParticipant(eventId, userId);
      if (!isParticipant) {
        console.error('❌ [getEventChatRoom] User is not authorized for this event');
        throw new Error('User is not authorized to access this event chat room');
      }

      // Check if chat room already exists
      const chatRoomsQuery = query(
        collection(db, this.CHAT_ROOMS_COLLECTION),
        where('eventId', '==', eventId)
      );

      const chatRoomsSnapshot = await getDocs(chatRoomsQuery);

      if (!chatRoomsSnapshot.empty) {
        const chatRoom = chatRoomsSnapshot.docs[0];
        const chatRoomData = chatRoom.data();
        console.log('✅ [getEventChatRoom] Found existing chat room:', chatRoom.id);

        // Add user to participants if not already included
        if (!chatRoomData.participants.includes(userId)) {
          console.log('🔄 [getEventChatRoom] Adding user to participants list');
          await updateDoc(chatRoom.ref, {
            participants: [...chatRoomData.participants, userId],
            lastActivity: serverTimestamp(),
          });
        }

        return chatRoom.id;
      }

      // Create new chat room
      console.log('🆕 [getEventChatRoom] Creating new chat room');
      const chatRoomData = {
        eventId,
        participants: [userId],
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        isActive: true,
      };

      const docRef = await addDoc(collection(db, this.CHAT_ROOMS_COLLECTION), chatRoomData);
      console.log('✅ [getEventChatRoom] Created new chat room:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ [getEventChatRoom] Error:', error);
      throw error;
    }
  }

  /**
   * Check if user is a legitimate participant of an event
   * 🎯 [KIM FIX] Now checks host partner and guest partner as well
   */
  private async isUserEventParticipant(eventId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is the event host or host partner
      const eventDoc = await getDoc(doc(db, this.EVENTS_COLLECTION, eventId));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        if (eventData.hostId === userId) {
          console.log('✅ [isUserEventParticipant] User is event host');
          return true;
        }
        // 🎯 [KIM FIX] Check if user is host's partner
        if (eventData.hostPartnerId === userId) {
          console.log('✅ [isUserEventParticipant] User is host partner');
          return true;
        }
      }

      // Check if user has an approved application as team leader (applicantId)
      const applicationQuery = query(
        collection(db, this.APPLICATIONS_COLLECTION),
        where('eventId', '==', eventId),
        where('applicantId', '==', userId),
        where('status', '==', 'approved')
      );
      const applicationSnapshot = await getDocs(applicationQuery);
      if (!applicationSnapshot.empty) {
        console.log('✅ [isUserEventParticipant] User is approved applicant');
        return true;
      }

      // 🎯 [KIM FIX] Check if user is an approved partner (partnerId in applications)
      const partnerQuery = query(
        collection(db, this.APPLICATIONS_COLLECTION),
        where('eventId', '==', eventId),
        where('partnerId', '==', userId),
        where('status', '==', 'approved')
      );
      const partnerSnapshot = await getDocs(partnerQuery);
      if (!partnerSnapshot.empty) {
        console.log('✅ [isUserEventParticipant] User is approved partner');
        return true;
      }

      console.log('❌ [isUserEventParticipant] User is not a participant');
      return false;
    } catch (error) {
      console.error('❌ [isUserEventParticipant] Error:', error);
      return false;
    }
  }

  // ==========================================
  // NOTIFICATION HELPERS
  // ==========================================

  private async notifyEventHost(eventId: string, type: string, data: unknown): Promise<void> {
    try {
      // Get event to find host
      const eventDoc = await getDoc(doc(db, this.EVENTS_COLLECTION, eventId));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        await this.createNotification(eventData.hostId, type, data);
      }
    } catch (error) {
      console.error('Error notifying event host:', error);
    }
  }

  private async notifyApplicant(applicantId: string, type: string, data: unknown): Promise<void> {
    try {
      await this.createNotification(applicantId, type, data);
    } catch (error) {
      console.error('Error notifying applicant:', error);
    }
  }

  private async createNotification(userId: string, type: string, data: unknown): Promise<void> {
    try {
      const notificationData = {
        userId,
        type,
        title: this.getNotificationTitle(type, data),
        message: this.getNotificationMessage(type, data),
        data,
        isRead: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, this.NOTIFICATIONS_COLLECTION), notificationData);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getNotificationTitle(type: string, data: unknown): string {
    switch (type) {
      case 'application_submitted':
        return i18n.t('services.activity.notifications.applicationSubmittedTitle');
      case 'application_approved':
        return i18n.t('services.activity.notifications.applicationApprovedTitle');
      case 'application_declined':
        return i18n.t('services.activity.notifications.applicationDeclinedTitle');
      case 'league_playoffs_qualified':
        return i18n.t('services.activity.notifications.playoffsQualifiedTitle');
      default:
        return i18n.t('services.activity.notifications.defaultTitle');
    }
  }

  private getNotificationMessage(type: string, data: unknown): string {
    const typedData = data as { applicantName?: string; eventTitle?: string; leagueName?: string };
    switch (type) {
      case 'application_submitted':
        return i18n.t('services.activity.notifications.applicationSubmittedMessage', {
          applicantName: typedData.applicantName,
          eventTitle: typedData.eventTitle,
        });
      case 'application_approved':
        return i18n.t('services.activity.notifications.applicationApprovedMessage', {
          eventTitle: typedData.eventTitle,
        });
      case 'application_declined':
        return i18n.t('services.activity.notifications.applicationDeclinedMessage', {
          eventTitle: typedData.eventTitle,
        });
      case 'league_playoffs_qualified': {
        const leagueName =
          typedData.leagueName || i18n.t('services.activity.notifications.defaultLeagueName');
        return i18n.t('services.activity.notifications.playoffsQualifiedMessage', {
          leagueName,
        });
      }
      default:
        return i18n.t('services.activity.notifications.defaultMessage');
    }
  }

  // ==========================================
  // EVENT MANAGEMENT ACTIONS
  // ==========================================

  /**
   * Update an existing event (host action)
   */
  async updateEvent(eventId: string, updateData: Partial<LightningEvent>): Promise<void> {
    try {
      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Cancel participant by host (approved participant removal)
   */
  async cancelParticipantByHost(applicationId: string, hostId: string): Promise<void> {
    try {
      // Call Cloud Function for participant cancellation
      await this.callCancelParticipantCloudFunction(applicationId, hostId);
    } catch (error) {
      console.error('Error cancelling participant by host:', error);
      throw error;
    }
  }

  /**
   * Cancel my participation (user cancels their own approved participation)
   */
  async cancelMyParticipation(applicationId: string, userId: string): Promise<void> {
    try {
      // Call Cloud Function for self-cancellation
      await this.callCancelMyParticipationCloudFunction(applicationId, userId);
    } catch (error) {
      console.error('Error cancelling my participation:', error);
      throw error;
    }
  }

  // ==========================================
  // CLOUD FUNCTION INTEGRATION
  // ==========================================

  private async callApprovalCloudFunction(
    applicationId: string,
    hostId: string,
    eventId: string,
    applicantId: string
  ): Promise<void> {
    try {
      console.log('🌉 [HEIMDALL] Calling approval Cloud Function:', {
        applicationId,
        hostId,
        eventId,
        applicantId,
      });

      // Call Cloud Function to update league.participants
      const approveApplicationFn = httpsCallable(functions, 'approveApplication');
      await approveApplicationFn({
        applicationId,
        hostId,
        eventId,
        applicantId,
      });

      console.log('✅ [HEIMDALL] Cloud Function executed successfully');
    } catch (error) {
      console.error('❌ [HEIMDALL] Error calling approval Cloud Function:', error);
      // Don't throw - let the approval still succeed even if Cloud Function fails
      // The main approval logic already completed in the batch above
    }
  }

  private async callCancelParticipantCloudFunction(
    applicationId: string,
    hostId: string
  ): Promise<void> {
    try {
      console.log('Calling cancelParticipantByHost Cloud Function:', { applicationId, hostId });

      // Get application data first to get event and participant IDs
      const applicationDoc = await getDoc(doc(db, this.APPLICATIONS_COLLECTION, applicationId));
      if (!applicationDoc.exists()) {
        throw new Error('Application not found');
      }

      const applicationData = applicationDoc.data();
      const cancelParticipantByHost = httpsCallable(functions, 'cancelParticipantByHost');

      const response = await cancelParticipantByHost({
        applicationId,
        hostId,
        eventId: applicationData.eventId,
        participantId: applicationData.applicantId,
      });

      console.log('cancelParticipantByHost Cloud Function response:', response.data);
    } catch (error) {
      console.error('Error calling cancelParticipantByHost Cloud Function:', error);
      throw error;
    }
  }

  private async callCancelMyParticipationCloudFunction(
    applicationId: string,
    userId: string
  ): Promise<void> {
    try {
      console.log('Calling cancelMyParticipation Cloud Function:', { applicationId, userId });

      // Get application data first to get event ID
      const applicationDoc = await getDoc(doc(db, this.APPLICATIONS_COLLECTION, applicationId));
      if (!applicationDoc.exists()) {
        throw new Error('Application not found');
      }

      const applicationData = applicationDoc.data();
      const cancelMyParticipation = httpsCallable(functions, 'cancelMyParticipation');

      const response = await cancelMyParticipation({
        applicationId,
        userId,
        eventId: applicationData.eventId,
      });

      console.log('cancelMyParticipation Cloud Function response:', response.data);
    } catch (error) {
      console.error('Error calling cancelMyParticipation Cloud Function:', error);
      throw error;
    }
  }

  /**
   * Cancel event by host (cancels the entire event and notifies all participants)
   */
  async cancelEvent(eventId: string, hostId: string, reason?: string): Promise<void> {
    try {
      console.log('🚫 Calling cancelEvent Cloud Function:', { eventId, hostId, reason });

      const cancelEventFn = httpsCallable(functions, 'cancelEvent');

      const response = await cancelEventFn({
        eventId,
        hostId,
        reason,
      });

      console.log('✅ cancelEvent Cloud Function response:', response.data);
    } catch (error) {
      console.error('❌ Error calling cancelEvent Cloud Function:', error);
      throw error;
    }
  }

  // ==========================================
  // MOCK DATA (for development and fallback)
  // ==========================================

  private getMockAppliedEvents(userId: string): EventWithParticipation[] {
    const now = new Date();
    return [
      {
        id: 'applied1',
        title: '주말 오전 단식 매치',
        description: '실력 향상을 위한 단식 연습 매치입니다',
        type: 'match',
        hostId: 'host1',
        hostName: 'Sarah Kim',
        location: 'Grant Park Tennis Courts',
        scheduledTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        duration: 90,
        maxParticipants: 2,
        gameType: 'mens_singles',
        ltrLevel: '3.0-3.5',
        languages: ['한국어', 'English'],
        autoApproval: false,
        status: 'upcoming',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        myApplication: {
          id: 'app1',
          eventId: 'applied1',
          applicantId: userId,
          applicantName: 'Current User',
          status: 'pending',
          appliedAt: new Date(),
          message: '함께 연습하고 싶습니다!',
        },
      },
      {
        id: 'applied2',
        title: '초보자 환영 랠리',
        description: '부담없이 즐기는 테니스 랠리',
        type: 'meetup',
        hostId: 'host2',
        hostName: 'David Park',
        location: 'Piedmont Park Courts',
        scheduledTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        duration: 120,
        maxParticipants: 6,
        gameType: 'rally',
        ltrLevel: '1.0-2.5',
        languages: ['한국어', 'English'],
        autoApproval: true,
        status: 'upcoming',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        myApplication: {
          id: 'app2',
          eventId: 'applied2',
          applicantId: userId,
          applicantName: 'Current User',
          status: 'approved',
          appliedAt: new Date(),
          processedAt: new Date(),
        },
      },
    ];
  }

  private getMockHostedEvents(userId: string): EventWithParticipation[] {
    const now = new Date();
    return [
      {
        id: 'hosted1',
        title: '주말 테니스 모임',
        description: '즐거운 주말 테니스 모임입니다',
        type: 'meetup',
        hostId: userId,
        hostName: 'Current User',
        location: 'Brooklyn Heights Park',
        scheduledTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        duration: 120,
        maxParticipants: 8,
        gameType: 'mixed_doubles',
        ltrLevel: 'any',
        languages: ['한국어', 'English'],
        autoApproval: false,
        status: 'upcoming',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        applications: [
          {
            id: 'hosted_app1',
            eventId: 'hosted1',
            applicantId: 'user1',
            applicantName: 'Alex Kim',
            status: 'pending',
            appliedAt: new Date(),
            message: '참여하고 싶습니다!',
          },
          {
            id: 'hosted_app2',
            eventId: 'hosted1',
            applicantId: 'user2',
            applicantName: 'Maria Lopez',
            status: 'approved',
            appliedAt: new Date(),
            processedAt: new Date(),
          },
        ],
        pendingApplications: [
          {
            id: 'hosted_app1',
            eventId: 'hosted1',
            applicantId: 'user1',
            applicantName: 'Alex Kim',
            status: 'pending',
            appliedAt: new Date(),
            message: '참여하고 싶습니다!',
          },
        ],
        approvedApplications: [
          {
            id: 'hosted_app2',
            eventId: 'hosted1',
            applicantId: 'user2',
            applicantName: 'Maria Lopez',
            status: 'approved',
            appliedAt: new Date(),
            processedAt: new Date(),
          },
        ],
      },
    ];
  }

  private getMockPastEvents(userId: string): EventWithParticipation[] {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);

    return [
      {
        id: 'past1',
        title: '지난 주 단식 매치',
        description: '완료된 단식 매치',
        type: 'match',
        hostId: 'host3',
        hostName: 'Jennifer Lee',
        location: 'Central Park Courts',
        scheduledTime: pastDate,
        duration: 90,
        maxParticipants: 2,
        gameType: 'mens_singles',
        ltrLevel: '4.0-4.5',
        languages: ['English'],
        autoApproval: false,
        status: 'completed',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        myApplication: {
          id: 'past_app1',
          eventId: 'past1',
          applicantId: userId,
          applicantName: 'Current User',
          status: 'approved',
          appliedAt: new Date(),
          processedAt: new Date(),
        },
      },
    ];
  }

  // ==========================================
  // USER NAME RESOLUTION HELPER
  // ==========================================

  /**
   * 사용자 ID로부터 실제 표시 이름을 가져오는 헬퍼 함수
   * 여러 소스에서 우선순위에 따라 이름을 조회
   */
  private async getUserDisplayName(userId: string, currentUserContext?: unknown): Promise<string> {
    try {
      const typedContext = currentUserContext as
        | {
            uid?: string;
            displayName?: string;
            nickname?: string;
            name?: string;
            firstName?: string;
          }
        | undefined;

      // 1. 현재 사용자인 경우 AuthContext에서 가져온 정보 우선 사용
      if (typedContext && typedContext.uid === userId) {
        const nameFromContext =
          typedContext.displayName ||
          typedContext.nickname ||
          typedContext.name ||
          typedContext.firstName;

        if (nameFromContext && nameFromContext !== 'Current User') {
          console.log(`✅ Using current user name from context: ${nameFromContext}`);
          return nameFromContext;
        }
      }

      // 2. Firestore에서 사용자 프로필 조회
      if (isFirebaseAvailable && db) {
        // 여러 컬렉션에서 사용자 정보 조회 시도
        let userData = null;

        // users 컬렉션에서 조회
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          userData = userDoc.data();
        }

        // profiles 컬렉션에서 조회 (백업)
        if (!userData) {
          const profileDoc = await getDoc(doc(db, 'profiles', userId));
          if (profileDoc.exists()) {
            userData = profileDoc.data();
          }
        }

        // 사용자 데이터에서 이름 추출 (nested profile 구조 지원)
        if (userData) {
          const profileData = userData.profile || userData;

          // ✅ AuthContext와 동일한 우선순위로 이름 추출 (이메일 기반 fallback 제거!)
          const extractedName =
            profileData.nickname ||
            profileData.displayName ||
            userData.displayName ||
            profileData.name ||
            profileData.firstName ||
            profileData.username;

          if (
            extractedName &&
            extractedName !== 'Current User' &&
            !extractedName.startsWith('User_') &&
            extractedName !== 'Unknown User'
          ) {
            console.log(`✅ Found user name from Firestore for ${userId}: ${extractedName}`);
            return extractedName;
          }

          console.log(`⚠️ User ${userId} has profile data but no valid displayName:`, {
            nickname: profileData.nickname,
            displayName: profileData.displayName,
            userDisplayName: userData.displayName,
            name: profileData.name,
            firstName: profileData.firstName,
          });
        }
      }

      // 3. 폴백: 친근한 이름 생성
      const fallbackName = i18n.t('services.activity.tennisUserFallback', {
        id: userId.substring(0, 4),
      });
      console.warn(`⚠️ Using fallback name for ${userId}: ${fallbackName}`);
      return fallbackName;
    } catch (error) {
      console.error(`Error getting display name for user ${userId}:`, error);
      return i18n.t('services.activity.tennisUserFallback', {
        id: userId.substring(0, 4),
      });
    }
  }

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================

  /**
   * Subscribe to real-time updates for user's applications
   */
  subscribeToUserApplications(
    userId: string,
    callback: (applications: ParticipationApplication[]) => void
  ) {
    const q = query(
      collection(db, this.APPLICATIONS_COLLECTION),
      where('applicantId', '==', userId),
      orderBy('appliedAt', 'desc')
    );

    return onSnapshot(q, snapshot => {
      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt:
          safeToDate(doc.data().appliedAt, 'activityService.subscribeToUserApplications') ||
          new Date(),
        processedAt: safeToDate(
          doc.data().processedAt,
          'activityService.subscribeToUserApplications'
        ),
      })) as ParticipationApplication[];

      callback(applications);
    });
  }

  /**
   * ✅ NEW: Get hosted events with fully-hydrated participant data (no race conditions)
   * 모든 사용자 프로필을 미리 조회해서 완전한 데이터를 반환
   * @param userId - User ID
   * @param options - Filter options
   * @param options.status - Filter by event status ('all' | 'upcoming' | 'completed')
   */
  async getHostedEventsWithFullParticipantData(
    userId: string,
    options: { status?: 'all' | 'upcoming' | 'completed' } = {}
  ): Promise<EventWithParticipation[]> {
    console.log('🚀 [getHostedEventsWithFullParticipantData] FUNCTION CALLED!', {
      userId,
      options,
    });
    if (!isFirebaseAvailable || !db) {
      console.warn('⚠️ Firebase not available for hosted events');
      return [];
    }

    try {
      const { status = 'upcoming' } = options; // Default to upcoming events only
      console.log(`🔄 Loading ${status} hosted events with full participant data...`);

      // 1. 호스트한 이벤트 목록 조회 with status filtering
      let eventsQuery;

      if (status === 'all') {
        eventsQuery = query(
          collection(db, this.EVENTS_COLLECTION),
          where('hostId', '==', userId),
          orderBy('scheduledTime', 'desc')
        );
      } else {
        eventsQuery = query(
          collection(db, this.EVENTS_COLLECTION),
          where('hostId', '==', userId),
          where('status', '==', status),
          orderBy('scheduledTime', 'desc')
        );
      }

      const eventsSnapshot = await getDocs(eventsQuery);
      console.log(`📋 Found ${eventsSnapshot.docs.length} hosted events`);

      // 🔍 DEBUG: Firebase에서 실제로 조회된 원본 데이터 확인 (getHostedEventsWithFullParticipantData)
      console.log(
        '🔍 [getHostedEventsWithFullParticipantData] Raw Firebase data:',
        eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          type: doc.data().type, // 🔍 EVENT TYPE DEBUG
          hostId: doc.data().hostId, // 🔍 HOST ID DEBUG
          createdBy: doc.data().createdBy, // 🔍 CREATOR DEBUG
          matchResult: doc.data().matchResult,
          result: doc.data().result, // 🔍 실제 점수 데이터가 저장된 필드
          hasMatchResultField: 'matchResult' in doc.data(),
          hasResultField: 'result' in doc.data(), // 🔍 실제 점수 데이터 필드 존재 여부
          allFields: Object.keys(doc.data()),
        }))
      );

      if (eventsSnapshot.empty) {
        return [];
      }

      // 2. 모든 이벤트의 신청자 목록 수집
      const allApplicationsPromises = eventsSnapshot.docs.map(async eventDoc => {
        const applicationsQuery = query(
          collection(db, this.APPLICATIONS_COLLECTION),
          where('eventId', '==', eventDoc.id),
          orderBy('appliedAt', 'desc')
        );

        const applicationsSnapshot = await getDocs(applicationsQuery);
        return {
          eventId: eventDoc.id,
          applications: applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            appliedAt:
              safeToDate(
                doc.data().appliedAt,
                'activityService.getHostedEventsWithFullParticipantData'
              ) || new Date(),
            processedAt: safeToDate(
              doc.data().processedAt,
              'activityService.getHostedEventsWithFullParticipantData'
            ),
          })),
        };
      });

      const allApplicationsData = await Promise.all(allApplicationsPromises);

      // 3. 모든 고유한 신청자 ID 수집
      const allApplicantIds = new Set<string>();
      allApplicationsData.forEach(eventApplications => {
        eventApplications.applications.forEach((app: unknown) => {
          const typedApp = app as { applicantId?: string };
          if (typedApp.applicantId) {
            allApplicantIds.add(typedApp.applicantId);
          }
        });
      });

      console.log(`👥 Found ${allApplicantIds.size} unique applicants to look up`);

      // 4. 모든 신청자의 프로필을 한 번에 조회 (Promise.all 사용)
      const userProfilesPromises = Array.from(allApplicantIds).map(async applicantId => {
        try {
          const userDoc = await getDoc(doc(db, 'users', applicantId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const profileData = userData.profile || userData;

            const displayName =
              profileData.nickname ||
              profileData.displayName ||
              userData.displayName ||
              profileData.name ||
              profileData.firstName ||
              profileData.username ||
              i18n.t('services.activity.tennisUserFallback', { id: applicantId.substring(0, 4) });

            return {
              userId: applicantId,
              displayName: displayName,
            };
          }
          return {
            userId: applicantId,
            displayName: i18n.t('services.activity.tennisUserFallback', {
              id: applicantId.substring(0, 4),
            }),
          };
        } catch (error) {
          console.error(`Error loading profile for ${applicantId}:`, error);
          return {
            userId: applicantId,
            displayName: i18n.t('services.activity.tennisUserFallback', {
              id: applicantId.substring(0, 4),
            }),
          };
        }
      });

      const userProfiles = await Promise.all(userProfilesPromises);

      // 5. userId를 키로 하는 Map 생성
      const userProfileMap = new Map(
        userProfiles.map(profile => [profile.userId, profile.displayName])
      );

      console.log(`✅ Loaded ${userProfiles.length} user profiles`);

      // 6. 완전한 데이터 조합
      const fullyHydratedEvents: EventWithParticipation[] = eventsSnapshot.docs.map(eventDoc => {
        const eventData = eventDoc.data();
        const eventApplications = allApplicationsData.find(item => item.eventId === eventDoc.id);

        // 신청자 이름을 실제 닉네임으로 교체
        const applicationsWithRealNames: ParticipationApplication[] =
          eventApplications?.applications.map((app: unknown) => {
            const typedApp = app as ParticipationApplication;
            return {
              ...typedApp,
              applicantName:
                userProfileMap.get(typedApp.applicantId || '') ||
                typedApp.applicantName ||
                i18n.t('services.activity.tennisUserFallback', {
                  id: typedApp.applicantId?.substring(0, 4) || 'XXXX',
                }),
            };
          }) || [];

        const eventWithParticipation: EventWithParticipation = {
          id: eventDoc.id,
          title: eventData.title || 'Untitled Event',
          description: eventData.description || '',
          type: eventData.type || 'meetup',
          hostId: eventData.hostId || '',
          hostName: eventData.hostName || 'Unknown Host',
          location: eventData.location || '',
          scheduledTime: safeToDate(eventData.scheduledTime) || new Date(),
          duration: eventData.duration || 120,
          maxParticipants: eventData.maxParticipants || 4,
          gameType: eventData.gameType || 'rally',
          ltrLevel: eventData.ltrLevel || 'All Levels',
          languages: eventData.languages || ['English'],
          autoApproval: eventData.autoApproval || false,
          status: eventData.status || 'active',
          isPublic: eventData.isPublic !== false,
          createdAt: safeToDate(eventData.createdAt) || new Date(),
          updatedAt: safeToDate(eventData.updatedAt) || new Date(),
          participants: eventData.participants || [],
          applications: applicationsWithRealNames,
          approvedApplications: applicationsWithRealNames.filter(app => app.status === 'approved'),
          pendingApplications: applicationsWithRealNames.filter(app => app.status === 'pending'),
          // 🏆 matchResult 필드 추가 - Firebase에서 가져온 매치 결과 데이터
          // eventService.recordMatchResult는 'result' 필드에 저장하므로 이를 matchResult로 매핑
          matchResult: (() => {
            // 🧪 Test-specific debugging for score synchronization
            const isTestEvent = eventDoc.id === 'PG4ZjAIqZlVclqmbLzXG'; // 번매6 event

            if (isTestEvent) {
              console.log('🧪 [ActivityService.getHostedEvents] Test event detected:', {
                eventId: eventDoc.id,
                eventTitle: eventData.title,
                hasResult: !!eventData.result,
                hasMatchResult: !!eventData.matchResult,
                resultData: eventData.result,
                matchResultData: eventData.matchResult,
                hostId: eventData.hostId,
              });
            }

            if (eventData.result) {
              const mappedResult = {
                winnerId: eventData.result.winnerId,
                loserId: eventData.result.loserId,
                score: eventData.result.score,
                recordedAt: eventData.result.recordedAt,
                recordedBy: eventData.result.recordedBy,
                // EventCard가 기대하는 추가 필드들
                hostResult: eventData.hostId === eventData.result.winnerId ? 'win' : 'loss',
              };

              if (isTestEvent) {
                console.log(
                  '✅ [ActivityService.getHostedEvents] Mapped result for test event:',
                  mappedResult
                );
              }

              return mappedResult;
            }

            return eventData.matchResult || null;
          })(),
        };

        return eventWithParticipation;
      });

      // 7. 최신 순으로 정렬
      fullyHydratedEvents.sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());

      console.log(
        `🎉 Successfully loaded ${fullyHydratedEvents.length} fully-hydrated hosted events`
      );
      return fullyHydratedEvents;
    } catch (error) {
      console.error('❌ Error loading hosted events with full participant data:', error);
      return [];
    }
  }

  /**
   * ✅ Update participant counts for realtime applied events with approved applications
   * Optimized with batch queries for performance
   */
  private async updateRealtimeEventsParticipantCounts(
    events: EventWithParticipation[]
  ): Promise<void> {
    try {
      if (events.length === 0) return;

      const eventIds = events.map(event => event.id);

      // Single batch query for all events (optimized like DiscoveryContext)
      const applicationsQuery = query(
        collection(db, this.APPLICATIONS_COLLECTION),
        where('eventId', 'in', eventIds.slice(0, 10)), // Firestore 'in' operator supports max 10 values
        where('status', '==', 'approved')
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);

      // Create a map of eventId -> approved count
      const approvedCountsByEvent: Record<string, number> = {};
      applicationsSnapshot.docs.forEach(doc => {
        const eventId = doc.data().eventId;
        approvedCountsByEvent[eventId] = (approvedCountsByEvent[eventId] || 0) + 1;
      });

      // If we have more than 10 events, query the remaining in batches
      if (eventIds.length > 10) {
        const remainingEventIds = eventIds.slice(10);
        const batchSize = 10;

        for (let i = 0; i < remainingEventIds.length; i += batchSize) {
          const batch = remainingEventIds.slice(i, i + batchSize);
          const batchQuery = query(
            collection(db, this.APPLICATIONS_COLLECTION),
            where('eventId', 'in', batch),
            where('status', '==', 'approved')
          );

          const batchSnapshot = await getDocs(batchQuery);
          batchSnapshot.docs.forEach(doc => {
            const eventId = doc.data().eventId;
            approvedCountsByEvent[eventId] = (approvedCountsByEvent[eventId] || 0) + 1;
          });
        }
      }

      // Update participant counts for all events
      events.forEach(event => {
        const approvedCount = approvedCountsByEvent[event.id] || 0;

        // Apply same business rule as other methods: For public events, include host
        const isPublicEvent = !event.clubId; // Public events don't have clubId

        if (isPublicEvent) {
          // Public events: approved applications + host (1)
          event.computedParticipantCount = approvedCount + 1;
        } else {
          // Club events: approved applications only (no automatic host)
          event.computedParticipantCount = approvedCount;
        }
      });
    } catch (error) {
      console.error('Error updating realtime events participant counts:', error);
    }
  }

  /**
   * Subscribe to real-time participant updates for a specific hosted event
   */
  subscribeToEventParticipants(
    eventId: string,
    callback: (participants: {
      applications: ParticipationApplication[];
      approvedApplications: ParticipationApplication[];
      pendingApplications: ParticipationApplication[];
    }) => void
  ): Unsubscribe {
    if (!isFirebaseAvailable || !db) {
      console.warn('⚠️ Firebase not available for event participants subscription');
      return () => {};
    }

    const applicationsQuery = query(
      collection(db, this.APPLICATIONS_COLLECTION),
      where('eventId', '==', eventId),
      orderBy('appliedAt', 'desc')
    );

    return onSnapshot(applicationsQuery, async snapshot => {
      try {
        const applications = (await Promise.all(
          snapshot.docs.map(async doc => {
            const appData = doc.data();
            let applicantName = appData.applicantName;

            // ✅ 수정된 로직: getUserDisplayName 헬퍼 함수 사용 (중복 코드 제거 + 이메일 fallback 제거)
            if (
              !applicantName ||
              applicantName === 'Current User' ||
              applicantName.startsWith('User_') ||
              applicantName === 'Unknown User'
            ) {
              applicantName = await this.getUserDisplayName(appData.applicantId);
            }

            return {
              id: doc.id,
              ...appData,
              applicantName,
              appliedAt: safeToDate(appData.appliedAt) || new Date(),
              processedAt: safeToDate(appData.processedAt),
            };
          })
        )) as ParticipationApplication[];

        const participants = {
          applications,
          approvedApplications: applications.filter(app => app.status === 'approved'),
          pendingApplications: applications.filter(app => app.status === 'pending'),
        };

        console.log('🔄 Real-time participants updated for event:', eventId, {
          total: applications.length,
          approved: participants.approvedApplications.length,
          pending: participants.pendingApplications.length,
        });

        callback(participants);
      } catch (error) {
        console.error('Error processing participant updates:', error);
        callback({
          applications: [],
          approvedApplications: [],
          pendingApplications: [],
        });
      }
    });
  }

  /**
   * Get a single event by ID (for editing)
   */
  async getEventById(eventId: string): Promise<LightningEvent | null> {
    try {
      if (!isFirebaseAvailable || !db) {
        console.warn('⚠️ Firebase not available, returning null');
        return null;
      }

      const eventDoc = await getDoc(doc(db, this.EVENTS_COLLECTION, eventId));

      if (!eventDoc.exists()) {
        return null;
      }

      const eventData = eventDoc.data();
      return {
        id: eventDoc.id,
        title: eventData.title || '',
        description: eventData.description || '',
        type: eventData.type || 'meetup',
        hostId: eventData.hostId || '',
        hostName: eventData.hostName || '',
        location: eventData.location || '',
        scheduledTime: safeToDate(eventData.scheduledTime) || new Date(),
        duration: eventData.duration || 120,
        maxParticipants: eventData.maxParticipants || 4,
        gameType: eventData.gameType || 'rally',
        ltrLevel: eventData.ltrLevel || 'All Levels',
        languages: eventData.languages || ['English'],
        autoApproval: eventData.autoApproval || false,
        status: eventData.status || 'active',
        isPublic: eventData.isPublic !== false,
        createdAt: safeToDate(eventData.createdAt) || new Date(),
        updatedAt: safeToDate(eventData.updatedAt) || new Date(),
        participants: eventData.participants || [],
        // 🌤️ [KIM FIX] Include weather-related fields
        placeDetails: eventData.placeDetails,
        coordinates: eventData.coordinates,
        locationDetails: eventData.locationDetails,
      } as unknown as LightningEvent;
    } catch (error) {
      console.error('Error getting event by ID:', error);
      return null;
    }
  }

  /**
   * 유틸리티: 기존 데이터베이스의 'Current User' 항목들을 실제 사용자 이름으로 업데이트
   */
  async fixCurrentUserNames(): Promise<void> {
    if (!isFirebaseAvailable || !db) {
      console.warn('⚠️ Firebase not available for fixing current user names');
      return;
    }

    try {
      // 문제가 있는 모든 애플리케이션 찾기 (Current User, User_ 시작, Unknown User)
      const problemQueries = [
        query(
          collection(db, this.APPLICATIONS_COLLECTION),
          where('applicantName', '==', 'Current User')
        ),
        query(
          collection(db, this.APPLICATIONS_COLLECTION),
          where('applicantName', '==', 'Unknown User')
        ),
      ];

      const allProblemDocs = [];

      for (const q of problemQueries) {
        const snapshot = await getDocs(q);
        allProblemDocs.push(...snapshot.docs);
      }

      // User_로 시작하는 항목들도 찾기 (별도 쿼리 필요)
      const allAppsSnapshot = await getDocs(collection(db, this.APPLICATIONS_COLLECTION));
      const userIdBasedDocs = allAppsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.applicantName && data.applicantName.startsWith('User_');
      });

      allProblemDocs.push(...userIdBasedDocs);

      // 중복 제거
      const uniqueProblemDocs = allProblemDocs.filter(
        (doc, index, self) => index === self.findIndex(d => d.id === doc.id)
      );

      console.log(`Found ${uniqueProblemDocs.length} applications with problematic names`);

      const batch = writeBatch(db);
      let updateCount = 0;

      for (const appDoc of uniqueProblemDocs) {
        const appData = appDoc.data();

        try {
          // 여러 컬렉션에서 사용자 정보 조회 시도
          let userData = null;

          // 1. 먼저 users 컬렉션에서 조회
          const userDoc = await getDoc(doc(db, 'users', appData.applicantId));
          if (userDoc.exists()) {
            userData = userDoc.data();
          }

          // 2. users 컬렉션에 없으면 profiles 컬렉션에서 조회
          if (!userData) {
            const profileDoc = await getDoc(doc(db, 'profiles', appData.applicantId));
            if (profileDoc.exists()) {
              userData = profileDoc.data();
            }
          }

          let realName;
          if (userData) {
            realName =
              userData.displayName ||
              userData.nickname ||
              userData.name ||
              userData.firstName ||
              userData.username ||
              (userData.email ? userData.email.split('@')[0] : null) ||
              i18n.t('services.activity.tennisUserFallback', {
                id: appData.applicantId.substring(0, 4),
              });

            console.log(`✅ Found user profile for ${appData.applicantId}: ${realName}`);
          } else {
            // 사용자 프로필이 없는 경우 친근한 이름 사용
            realName = i18n.t('services.activity.tennisUserFallback', {
              id: appData.applicantId.substring(0, 4),
            });
            console.warn(
              `⚠️ No profile found for ${appData.applicantId}, using fallback: ${realName}`
            );
          }

          batch.update(appDoc.ref, {
            applicantName: realName,
          });

          updateCount++;
          console.log(
            `🔄 Will update application ${appDoc.id}: "${appData.applicantName}" → "${realName}"`
          );
        } catch (userError) {
          console.error(`Error fetching user profile for ${appData.applicantId}:`, userError);

          // 에러 발생 시 기본 이름 사용
          const fallbackName = i18n.t('services.activity.tennisUserFallback', {
            id: appData.applicantId.substring(0, 4),
          });
          batch.update(appDoc.ref, {
            applicantName: fallbackName,
          });
          updateCount++;
        }
      }

      if (updateCount > 0) {
        await batch.commit();
        console.log(`🎉 Successfully updated ${updateCount} application names`);
      } else {
        console.log('📝 No applications needed updating');
      }
    } catch (error) {
      console.error('❌ Error fixing current user names:', error);
      throw error;
    }
  }

  /**
   * 🏆 Update event with match result and process ELO updates
   * Updates both the event document and triggers ELO updates for both players
   */
  async updateEventMatchResult(
    eventId: string,
    hostId: string,
    opponentId: string,
    matchScore: MatchScore,
    hostIsWinner: boolean
  ): Promise<void> {
    if (!isFirebaseAvailable) {
      console.warn('⚠️ ActivityService: Firebase not available, skipping match result update');
      return;
    }

    try {
      console.log(`🏆 Updating match result for event ${eventId}`, {
        hostId,
        opponentId,
        hostIsWinner,
        score: matchScore,
      });

      // 1. Event 문서 업데이트
      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      const matchResult = {
        score: matchScore,
        hostResult: hostIsWinner ? 'win' : 'loss',
        opponentId,
        submittedAt: new Date(),
        eloProcessed: false,
      };

      await updateDoc(eventRef, { matchResult });
      console.log(`✅ Event ${eventId} updated with match result`);

      // 2. ELO 처리
      await this.processEloUpdate(eventId, hostId, opponentId, hostIsWinner);

      console.log(`🎉 Match result processing completed for event ${eventId}`);
    } catch (error) {
      console.error('❌ Error updating match result:', error);
      throw new Error(
        `Failed to update match result: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 🎯 Private method to process ELO updates for both players
   * Handles the ranking calculations and updates user profiles
   */
  private async processEloUpdate(
    eventId: string,
    hostId: string,
    opponentId: string,
    hostIsWinner: boolean
  ): Promise<void> {
    try {
      console.log(`🎯 Processing ELO updates for event ${eventId}`);

      // 상대방의 ELO 가져오기
      const opponentDoc = await getDoc(doc(db, 'users', opponentId));
      const opponentData = opponentDoc.data();
      const opponentElo = opponentData?.profile?.unifiedStats?.unifiedEloRating || 1500;

      // 호스트 ELO 업데이트
      const hostRankingData: RankingUpdateData = {
        userId: hostId,
        context: {
          type: 'public', // Use 'public' instead of 'lightning_match'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any, // Temporary cast to avoid eventId type error
        result: hostIsWinner ? 'win' : 'loss',
        opponentElo: opponentElo,
        matchId: `${eventId}_host`,
      };

      console.log(`🔄 Updating host ELO:`, hostRankingData);
      await rankingService.processMatchResult(hostRankingData);

      // 상대방 ELO 업데이트
      const hostDoc = await getDoc(doc(db, 'users', hostId));
      const hostData = hostDoc.data();
      const hostElo = hostData?.profile?.unifiedStats?.unifiedEloRating || 1500;

      const opponentRankingData: RankingUpdateData = {
        userId: opponentId,
        context: {
          type: 'public', // Use 'public' instead of 'lightning_match'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any, // Temporary cast to avoid eventId type error
        result: hostIsWinner ? 'loss' : 'win',
        opponentElo: hostElo,
        matchId: `${eventId}_opponent`,
      };

      console.log(`🔄 Updating opponent ELO:`, opponentRankingData);
      await rankingService.processMatchResult(opponentRankingData);

      // ELO 처리 완료 플래그 업데이트
      await updateDoc(doc(db, this.EVENTS_COLLECTION, eventId), {
        'matchResult.eloProcessed': true,
      });

      console.log(`✅ ELO processing completed for event ${eventId}`);
    } catch (error) {
      console.error('❌ Error processing ELO update:', error);
      throw new Error(
        `Failed to process ELO update: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 📊 Get match result for an event
   * Returns the match result data if it exists
   */
  async getEventMatchResult(eventId: string): Promise<{
    score: MatchScore;
    hostResult: 'win' | 'loss';
    opponentId: string;
    submittedAt: Date;
    confirmedAt?: Date;
    eloProcessed: boolean;
  } | null> {
    if (!isFirebaseAvailable) {
      console.warn('⚠️ ActivityService: Firebase not available, returning null');
      return null;
    }

    try {
      const eventDoc = await getDoc(doc(db, this.EVENTS_COLLECTION, eventId));
      const eventData = eventDoc.data();
      return eventData?.matchResult || null;
    } catch (error) {
      console.error('❌ Error getting match result:', error);
      throw error;
    }
  }

  // ==========================================
  // CHAT FUNCTIONALITY
  // ==========================================

  /**
   * Save a chat message to Firebase
   */
  async saveChatMessage(
    chatRoomId: string,
    messageData: {
      id: string;
      eventId: string;
      senderId: string;
      senderName: string;
      message: string;
      timestamp: Date;
      type: 'text' | 'system' | 'notification';
    }
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      console.log('💬 [saveChatMessage] Calling Cloud Function:', {
        chatRoomId,
        eventId: messageData.eventId,
        senderId: messageData.senderId,
        isAuthenticated: !!currentUser,
      });

      if (!currentUser) {
        console.warn('⚠️ [saveChatMessage] No authenticated user');
        throw new Error('User must be logged in to send messages');
      }

      // ✅ NEW: Call Cloud Function
      const saveChatMessageFunction = httpsCallable(functions, 'saveChatMessage');
      const result = await saveChatMessageFunction({
        chatRoomId,
        eventId: messageData.eventId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        message: messageData.message,
        type: messageData.type,
      });

      console.log('✅ [saveChatMessage] Message saved via Cloud Function:', result.data);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string; details?: unknown };
      console.error('❌ [saveChatMessage] Error:', {
        code: err?.code,
        message: err?.message,
        details: err?.details,
      });

      if (err?.code === 'functions/unauthenticated') {
        console.warn('⚠️ [saveChatMessage] User not authenticated - Cloud Function requires login');
      }

      throw error;
    }
  }

  /**
   * Subscribe to real-time chat messages
   */
  subscribeToChatMessages(
    chatRoomId: string,
    callback: (
      messages: Array<{
        id: string;
        eventId: string;
        senderId: string;
        senderName: string;
        message: string;
        timestamp: Date;
        type: 'text' | 'system' | 'notification';
      }>
    ) => void,
    currentUserId?: string,
    onNewMessage?: (notification: {
      id: string;
      type: 'direct' | 'club' | 'event';
      chatId: string;
      senderId: string;
      senderName: string;
      message: string;
      timestamp: Date;
    }) => void
  ): () => void {
    console.log('🔄 Setting up real-time chat subscription for room:', chatRoomId);

    const messagesCollection = collection(
      db,
      `${this.CHAT_ROOMS_COLLECTION}/${chatRoomId}/messages`
    );
    const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));

    let isFirstLoad = true;

    const unsubscribe = onSnapshot(
      messagesQuery,
      snapshot => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            eventId: data.eventId || '',
            senderId: data.senderId || '',
            senderName: data.senderName || 'Unknown',
            message: data.message || '',
            timestamp: data.timestamp?.toDate() || new Date(),
            type: data.type || 'text',
          };
        });

        console.log('📨 Real-time chat messages update:', messages.length, 'messages');
        callback(messages);

        // Trigger notification for new messages (skip first load)
        if (!isFirstLoad && onNewMessage && currentUserId) {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const message = {
                id: change.doc.id,
                eventId: data.eventId || '',
                senderId: data.senderId || '',
                senderName: data.senderName || 'Unknown',
                message: data.message || '',
                timestamp: data.timestamp?.toDate() || new Date(),
                type: data.type || 'text',
              };

              // Only notify if message is from someone else and is a text message (not system)
              if (message.senderId !== currentUserId && message.type === 'text') {
                onNewMessage({
                  id: message.id,
                  type: 'event',
                  chatId: message.eventId,
                  senderId: message.senderId,
                  senderName: message.senderName,
                  message: message.message,
                  timestamp: message.timestamp,
                });
              }
            }
          });
        }

        isFirstLoad = false;
      },
      error => {
        console.error('❌ Error in chat messages subscription:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Load chat messages history
   */
  async loadChatMessages(
    chatRoomId: string,
    limitParam: number = 50
  ): Promise<
    Array<{
      id: string;
      eventId: string;
      senderId: string;
      senderName: string;
      message: string;
      timestamp: Date;
      type: 'text' | 'system' | 'notification';
    }>
  > {
    try {
      console.log('📚 Loading chat messages history for room:', chatRoomId);

      const messagesCollection = collection(
        db,
        `${this.CHAT_ROOMS_COLLECTION}/${chatRoomId}/messages`
      );
      const messagesQuery = query(
        messagesCollection,
        orderBy('timestamp', 'desc'),
        limit(limitParam)
      );

      const snapshot = await getDocs(messagesQuery);
      const messages = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            eventId: data.eventId || '',
            senderId: data.senderId || '',
            senderName: data.senderName || 'Unknown',
            message: data.message || '',
            timestamp: data.timestamp?.toDate() || new Date(),
            type: data.type || 'text',
          };
        })
        .reverse(); // Reverse to get chronological order

      console.log('📖 Loaded', messages.length, 'chat messages');
      return messages;
    } catch (error) {
      console.error('❌ Error loading chat messages:', error);
      return [];
    }
  }

  /**
   * Mark event chat as read (reset unreadCount to 0 for current user)
   * ✅ Uses Cloud Function to bypass Security Rules
   */
  async markEventChatAsRead(eventId: string, userId: string): Promise<void> {
    try {
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      console.log('📖 [markEventChatAsRead] Calling Cloud Function:', {
        eventId,
        userId,
        currentUserUid: currentUser?.uid,
        isAuthenticated: !!currentUser,
      });

      if (!currentUser) {
        console.warn('⚠️ [markEventChatAsRead] No authenticated user - Cloud Function will fail');
        throw new Error('User must be logged in to mark chat as read');
      }

      // ⚠️ Important: httpsCallable automatically includes the current user's Auth token
      // If you get "unauthenticated" error, make sure the user is logged in via Firebase Auth
      const markAsReadFunction = httpsCallable(functions, 'markEventChatAsRead');
      const result = await markAsReadFunction({ eventId, userId });

      console.log(
        '✅ [markEventChatAsRead] Event chat marked as read via Cloud Function:',
        result.data
      );
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string; details?: unknown };
      console.error('❌ [markEventChatAsRead] Error:', {
        code: err?.code,
        message: err?.message,
        details: err?.details,
      });

      // ⚠️ If unauthenticated error, it means Auth token is not being sent
      // This usually happens when user is not logged in or token expired
      if (err?.code === 'functions/unauthenticated') {
        console.warn(
          '⚠️ [markEventChatAsRead] User not authenticated - Cloud Function requires login'
        );
      }

      throw error;
    }
  }

  /**
   * 🎯 [OPERATION SOLO LOBBY] Merge two solo applications into a team
   * When one solo applicant proposes and another accepts, this merges them into a team
   *
   * @param proposerApplicationId - The application ID of the user who proposed the team
   * @param acceptorApplicationId - The application ID of the user who accepted the proposal
   * @returns Team application details
   */
  async mergeSoloToTeam(
    proposerApplicationId: string,
    acceptorApplicationId: string
  ): Promise<{
    success: boolean;
    teamApplicationId: string;
    eventId: string;
    proposer: { id: string; name: string };
    acceptor: { id: string; name: string };
  }> {
    try {
      console.log('🎯 [SOLO LOBBY] Calling mergeSoloToTeam Cloud Function:', {
        proposerApplicationId,
        acceptorApplicationId,
      });

      const mergeFn = httpsCallable(functions, 'mergeSoloToTeam');
      const result = await mergeFn({
        proposerApplicationId,
        acceptorApplicationId,
      });

      const data = result.data as {
        success: boolean;
        teamApplicationId: string;
        eventId: string;
        proposer: { id: string; name: string };
        acceptor: { id: string; name: string };
      };

      console.log('✅ [SOLO LOBBY] Cloud Function response:', data);

      return data;
    } catch (error: unknown) {
      console.error('❌ [SOLO LOBBY] Error merging solo to team:', error);

      const errorCode = (error as { code?: string })?.code;
      const errorMessage = (error as { message?: string })?.message;

      if (errorCode === 'unauthenticated') {
        throw new Error(i18n.t('services.activity.loginRequired'));
      } else if (errorCode === 'permission-denied') {
        throw new Error(i18n.t('services.activity.onlyOwnApplication'));
      } else if (errorCode === 'not-found') {
        throw new Error(i18n.t('services.activity.applicationNotFound'));
      } else if (errorCode === 'invalid-argument') {
        throw new Error(errorMessage || i18n.t('services.activity.invalidApplication'));
      } else {
        throw new Error(i18n.t('services.activity.teamMergeFailed'));
      }
    }
  }

  /**
   * 🎯 [FRIEND INVITE] Respond to a friend invitation
   * Calls Cloud Function to accept or reject a friend invitation
   *
   * @param eventId - The event ID to respond to
   * @param response - 'accept' or 'reject'
   */
  async respondToFriendInvite(
    eventId: string,
    response: 'accept' | 'reject'
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🎯 [FRIEND_INVITE] Calling respondToFriendInvite Cloud Function:', {
        eventId,
        response,
      });

      const respondFn = httpsCallable(functions, 'respondToFriendInvite');
      const result = await respondFn({ eventId, response });

      const data = result.data as { success: boolean; message: string };

      console.log('✅ [FRIEND_INVITE] Cloud Function response:', data);

      return data;
    } catch (error: unknown) {
      console.error('❌ [FRIEND_INVITE] Error responding to friend invite:', error);

      const errorCode = (error as { code?: string })?.code;
      const errorMessage = (error as { message?: string })?.message;

      if (errorCode === 'unauthenticated') {
        throw new Error(i18n.t('services.activity.loginRequired'));
      } else if (errorCode === 'permission-denied') {
        throw new Error(i18n.t('services.activity.onlyInvitedUser'));
      } else if (errorCode === 'not-found') {
        throw new Error(i18n.t('services.activity.eventNotFound'));
      } else if (errorCode === 'failed-precondition') {
        throw new Error(errorMessage || i18n.t('services.activity.alreadyProcessed'));
      } else {
        throw new Error(i18n.t('services.activity.inviteResponseFailed'));
      }
    }
  }

  /**
   * 🎯 [FRIEND INVITE] Subscribe to friend invitations for a user
   * Listens to events where the user is invited as a friend
   *
   * @param userId - The user ID to listen for invitations
   * @param callback - Callback function when invitations update
   * @returns Unsubscribe function
   */
  subscribeToFriendInvitations(
    userId: string,
    callback: (
      invitations: Array<{
        eventId: string;
        eventTitle: string;
        eventDate?: string;
        eventTime?: string;
        eventLocation?: string;
        hostId: string;
        hostName: string;
        gameType?: string;
        status: 'pending' | 'accepted' | 'rejected';
        invitedAt: string;
      }>
    ) => void
  ): Unsubscribe {
    if (!isFirebaseAvailable || !db) {
      console.warn('⚠️ Firebase not available for friend invitations subscription');
      return () => {};
    }

    console.log('🎯 [FRIEND_INVITE] Setting up subscription for user:', userId);

    // Query events where friendInvitations array contains this user
    // Note: Firestore array-contains doesn't support nested object queries,
    // so we need to query all invite-only events and filter client-side
    // 🎯 [FIX] Query isInviteOnly events without status filter
    // Then filter client-side for non-completed events
    const eventsQuery = query(
      collection(db, this.EVENTS_COLLECTION),
      where('isInviteOnly', '==', true)
    );

    return onSnapshot(eventsQuery, async snapshot => {
      try {
        console.log(
          '🎯 [FRIEND_INVITE] Query returned',
          snapshot.docs.length,
          'invite-only events'
        );

        const invitations: Array<{
          eventId: string;
          eventTitle: string;
          eventDate?: string;
          eventTime?: string;
          eventLocation?: string;
          hostId: string;
          hostName: string;
          hostLtr?: number; // 🎾 [KIM FIX] Host's LTR level
          gameType?: string;
          status: 'pending' | 'accepted' | 'rejected';
          invitedAt: string;
        }> = [];

        // 🎾 [KIM FIX] Cache host LTR values to avoid redundant fetches
        const hostLtrCache: Record<string, number | undefined> = {};

        for (const eventDoc of snapshot.docs) {
          const eventData = eventDoc.data();

          // 🎯 [FIX] Skip completed or cancelled events
          const eventStatus = eventData.status as string;
          if (eventStatus === 'completed' || eventStatus === 'cancelled') {
            continue;
          }

          const friendInvitations = eventData.friendInvitations as
            | Array<{ userId: string; status: string; invitedAt: string }>
            | undefined;

          if (!friendInvitations) continue;

          // Find invitation for this user
          const userInvitation = friendInvitations.find(inv => inv.userId === userId);
          if (!userInvitation) {
            console.log('🎯 [FRIEND_INVITE] User not in invitation list for event:', eventDoc.id);
            continue;
          }

          console.log('🎯 [FRIEND_INVITE] Found invitation for user in event:', {
            eventId: eventDoc.id,
            eventTitle: eventData.title,
            status: userInvitation.status,
          });

          // 🔍 DEBUG: Log date fields
          console.log('🔍 [FRIEND_INVITE] Date fields:', {
            scheduledTime: eventData.scheduledTime,
            scheduledTimeType: typeof eventData.scheduledTime,
            hasToDate: !!eventData.scheduledTime?.toDate,
            date: eventData.date,
            dateType: typeof eventData.date,
            time: eventData.time,
            timeType: typeof eventData.time,
          });

          // Format scheduled time - handle both Timestamp and string formats
          let scheduledTime: Date;
          if (eventData.scheduledTime?.toDate) {
            // Firestore Timestamp
            scheduledTime = eventData.scheduledTime.toDate();
          } else if (typeof eventData.scheduledTime === 'string') {
            // ISO string format
            scheduledTime = new Date(eventData.scheduledTime);
          } else if (typeof eventData.date === 'string') {
            // Fallback to date field
            scheduledTime = new Date(eventData.date);
          } else if (typeof eventData.time === 'string') {
            // Fallback to time field
            scheduledTime = new Date(eventData.time);
          } else {
            scheduledTime = new Date();
          }

          // 🎯 [FIX] Pass ISO string to FriendInvitationCard for proper formatting
          // FriendInvitationCard has its own formatDate/formatTime functions
          const eventDateISO = scheduledTime.toISOString();

          // 🎾 [KIM FIX] Get host LTR - check event data first, then fetch from user doc
          const hostId = eventData.hostId as string;
          let hostLtr: number | undefined;

          // Check if eventData has hostLtr field directly
          if (typeof eventData.hostLtr === 'number') {
            hostLtr = eventData.hostLtr;
          } else if (hostId) {
            // Check cache first
            if (hostId in hostLtrCache) {
              hostLtr = hostLtrCache[hostId];
            } else {
              // Fetch from user document
              try {
                const hostDoc = await getDoc(doc(db, 'users', hostId));
                if (hostDoc.exists()) {
                  const hostData = hostDoc.data();
                  // LTR is stored in skillLevel.calculated (NTRP format)
                  hostLtr = hostData?.skillLevel?.calculated as number | undefined;
                  hostLtrCache[hostId] = hostLtr;
                }
              } catch (fetchError) {
                console.warn('🎾 [FRIEND_INVITE] Failed to fetch host LTR:', fetchError);
              }
            }
          }

          invitations.push({
            eventId: eventDoc.id,
            eventTitle: eventData.title || 'Untitled Event',
            eventDate: eventDateISO,
            eventTime: eventDateISO,
            eventLocation: eventData.location || '',
            hostId: hostId || '',
            hostName: eventData.hostName || 'Unknown Host',
            hostLtr, // 🎾 [KIM FIX] Include host LTR
            gameType: eventData.gameType || '',
            status: userInvitation.status as 'pending' | 'accepted' | 'rejected',
            invitedAt: userInvitation.invitedAt || new Date().toISOString(),
          });
        }

        console.log('🎯 [FRIEND_INVITE] Found invitations:', invitations.length);
        callback(invitations);
      } catch (error) {
        console.error('❌ [FRIEND_INVITE] Error processing invitations:', error);
        callback([]);
      }
    });
  }
}

export default new ActivityService();
