/**
 * Club Schedule Service
 * Manages recurring club meeting schedules and event generation
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';

import { db } from '../firebase/config';
import {
  ClubSchedule,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ScheduleType,
  DayOfWeek,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ScheduleLocation,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParticipationInfo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RecurrenceRule,
  GeneratedEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  EventStatus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ScheduleQuery,
  ScheduleConflictCheck,
  ScheduleDisplayData,
  WeeklyScheduleView,
  DailySchedule,
  getNextOccurrence,
  hasScheduleConflict,
} from '../types/clubSchedule';

/**
 * Service class for managing club recurring schedules
 */
export class ClubScheduleService {
  private readonly SCHEDULES_COLLECTION = 'clubSchedules';
  private readonly GENERATED_EVENTS_COLLECTION = 'generatedEvents';

  constructor() {
    console.log('📅 ClubScheduleService initialized');
  }

  // ============ SCHEDULE CRUD OPERATIONS ============

  /**
   * Create a new recurring schedule for a club
   * @param schedule - Schedule data (without ID)
   * @returns Promise<string> - Created schedule ID
   */
  async createSchedule(schedule: Omit<ClubSchedule, 'id'>): Promise<string> {
    try {
      // Check for conflicts
      const hasConflict = await this.checkScheduleConflict({
        clubId: schedule.clubId,
        dayOfWeek: schedule.dayOfWeek,
        time: schedule.time,
        duration: schedule.duration,
      });

      if (hasConflict) {
        throw new Error('Schedule conflicts with existing club schedule');
      }

      const now = serverTimestamp();
      const scheduleData = {
        ...schedule,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      };

      const docRef = await addDoc(collection(db, this.SCHEDULES_COLLECTION), scheduleData);
      console.log(`✅ Club schedule created: ${docRef.id}`);

      // Generate initial events for the next 4 weeks
      await this.generateEventsForSchedule(docRef.id, 4);

      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating club schedule:', error);
      throw error;
    }
  }

  /**
   * Get a specific schedule by ID
   * @param scheduleId - Schedule ID
   * @returns Promise<ClubSchedule | null>
   */
  async getSchedule(scheduleId: string): Promise<ClubSchedule | null> {
    try {
      const docRef = doc(db, this.SCHEDULES_COLLECTION, scheduleId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as ClubSchedule;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting schedule:', error);
      throw error;
    }
  }

  /**
   * Get all schedules for a club
   * @param clubId - Club ID
   * @param activeOnly - Whether to only return active schedules
   * @returns Promise<ClubSchedule[]>
   */
  async getClubSchedules(clubId: string, activeOnly: boolean = true): Promise<ClubSchedule[]> {
    try {
      let q = query(collection(db, this.SCHEDULES_COLLECTION), where('clubId', '==', clubId));

      if (activeOnly) {
        q = query(q, where('isActive', '==', true));
      }

      q = query(q, orderBy('dayOfWeek'), orderBy('time'));

      const querySnapshot = await getDocs(q);
      const schedules: ClubSchedule[] = [];

      querySnapshot.forEach(doc => {
        schedules.push({
          id: doc.id,
          ...doc.data(),
        } as ClubSchedule);
      });

      console.log(`📅 Retrieved ${schedules.length} schedules for club ${clubId}`);
      return schedules;
    } catch (error) {
      console.error('❌ Error getting club schedules:', error);
      throw error;
    }
  }

  /**
   * Update a schedule
   * @param scheduleId - Schedule ID
   * @param updates - Partial schedule updates
   * @returns Promise<void>
   */
  async updateSchedule(scheduleId: string, updates: Partial<ClubSchedule>): Promise<void> {
    try {
      // If time/day/duration changed, check for conflicts
      if (
        updates.dayOfWeek !== undefined ||
        updates.time !== undefined ||
        updates.duration !== undefined
      ) {
        const currentSchedule = await this.getSchedule(scheduleId);
        if (!currentSchedule) throw new Error('Schedule not found');

        const hasConflict = await this.checkScheduleConflict({
          clubId: currentSchedule.clubId,
          dayOfWeek: updates.dayOfWeek ?? currentSchedule.dayOfWeek,
          time: updates.time ?? currentSchedule.time,
          duration: updates.duration ?? currentSchedule.duration,
          excludeScheduleId: scheduleId,
        });

        if (hasConflict) {
          throw new Error('Updated schedule would conflict with existing schedule');
        }
      }

      const docRef = doc(db, this.SCHEDULES_COLLECTION, scheduleId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Schedule updated: ${scheduleId}`);

      // If schedule timing changed, regenerate future events
      if (
        updates.dayOfWeek !== undefined ||
        updates.time !== undefined ||
        updates.duration !== undefined
      ) {
        await this.regenerateFutureEvents(scheduleId);
      }
    } catch (error) {
      console.error('❌ Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * Deactivate a schedule (soft delete)
   * @param scheduleId - Schedule ID
   * @returns Promise<void>
   */
  async deactivateSchedule(scheduleId: string): Promise<void> {
    try {
      await this.updateSchedule(scheduleId, { isActive: false });

      // Cancel all future generated events
      await this.cancelFutureEvents(scheduleId);

      console.log(`🗑️ Schedule deactivated: ${scheduleId}`);
    } catch (error) {
      console.error('❌ Error deactivating schedule:', error);
      throw error;
    }
  }

  // ============ EVENT GENERATION ============

  /**
   * Generate events for a schedule for the specified number of weeks
   * @param scheduleId - Schedule ID
   * @param weeksAhead - Number of weeks to generate events for
   * @returns Promise<string[]> - Generated event IDs
   */
  async generateEventsForSchedule(scheduleId: string, weeksAhead: number = 4): Promise<string[]> {
    try {
      const schedule = await this.getSchedule(scheduleId);
      if (!schedule || !schedule.isActive) {
        throw new Error('Schedule not found or inactive');
      }

      const generatedEventIds: string[] = [];
      const batch = writeBatch(db);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + weeksAhead * 7);

      let currentDate = getNextOccurrence(schedule, startDate);

      while (currentDate <= endDate) {
        // Check if event already exists for this date
        const existingEvent = await this.getGeneratedEventForDate(scheduleId, currentDate);

        if (!existingEvent) {
          const eventData: Omit<GeneratedEvent, 'id'> = {
            scheduleId: schedule.id,
            clubId: schedule.clubId,
            eventDate: Timestamp.fromDate(currentDate),
            status: 'scheduled',
            title: schedule.title,
            location: schedule.location,
            time: schedule.time,
            duration: schedule.duration,
            registeredParticipants: [],
            waitlist: [],
            isModified: false,
          };

          const eventRef = doc(collection(db, this.GENERATED_EVENTS_COLLECTION));
          batch.set(eventRef, eventData);
          generatedEventIds.push(eventRef.id);
        }

        // Move to next occurrence
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 7); // Weekly for now
      }

      await batch.commit();
      console.log(`✅ Generated ${generatedEventIds.length} events for schedule ${scheduleId}`);
      return generatedEventIds;
    } catch (error) {
      console.error('❌ Error generating events:', error);
      throw error;
    }
  }

  /**
   * Get generated event for a specific date
   * @param scheduleId - Schedule ID
   * @param date - Date to check
   * @returns Promise<GeneratedEvent | null>
   */
  async getGeneratedEventForDate(scheduleId: string, date: Date): Promise<GeneratedEvent | null> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, this.GENERATED_EVENTS_COLLECTION),
        where('scheduleId', '==', scheduleId),
        where('eventDate', '>=', Timestamp.fromDate(startOfDay)),
        where('eventDate', '<=', Timestamp.fromDate(endOfDay))
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
        } as GeneratedEvent;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting generated event:', error);
      throw error;
    }
  }

  /**
   * Regenerate future events when schedule is updated
   * @param scheduleId - Schedule ID
   * @returns Promise<void>
   */
  async regenerateFutureEvents(scheduleId: string): Promise<void> {
    try {
      // Cancel existing future events
      await this.cancelFutureEvents(scheduleId);

      // Generate new events
      await this.generateEventsForSchedule(scheduleId, 4);
    } catch (error) {
      console.error('❌ Error regenerating events:', error);
      throw error;
    }
  }

  /**
   * Cancel all future events for a schedule
   * @param scheduleId - Schedule ID
   * @returns Promise<void>
   */
  async cancelFutureEvents(scheduleId: string): Promise<void> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, this.GENERATED_EVENTS_COLLECTION),
        where('scheduleId', '==', scheduleId),
        where('eventDate', '>', now),
        where('status', '==', 'scheduled')
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach(doc => {
        batch.update(doc.ref, {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(`🗑️ Cancelled ${querySnapshot.size} future events for schedule ${scheduleId}`);
    } catch (error) {
      console.error('❌ Error cancelling future events:', error);
      throw error;
    }
  }

  // ============ SCHEDULE QUERIES ============

  /**
   * Check if a schedule conflicts with existing schedules
   * @param conflictCheck - Conflict check parameters
   * @returns Promise<boolean> - True if conflict exists
   */
  async checkScheduleConflict(conflictCheck: ScheduleConflictCheck): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.SCHEDULES_COLLECTION),
        where('clubId', '==', conflictCheck.clubId),
        where('dayOfWeek', '==', conflictCheck.dayOfWeek),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const schedule = { id: doc.id, ...doc.data() } as ClubSchedule;

        // Skip if checking against self
        if (conflictCheck.excludeScheduleId === schedule.id) continue;

        // Check time overlap
        const newSchedule = {
          dayOfWeek: conflictCheck.dayOfWeek,
          time: conflictCheck.time,
          duration: conflictCheck.duration,
        } as ClubSchedule;

        if (hasScheduleConflict(newSchedule, schedule)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking schedule conflict:', error);
      throw error;
    }
  }

  /**
   * Get weekly schedule view for a club
   * @param clubId - Club ID
   * @param weekStartDate - Start of the week
   * @param userId - Current user ID for registration status
   * @returns Promise<WeeklyScheduleView>
   */
  async getWeeklyScheduleView(
    clubId: string,
    weekStartDate: Date,
    userId?: string
  ): Promise<WeeklyScheduleView> {
    try {
      const schedules = await this.getClubSchedules(clubId, true);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);

      const dailySchedules: DailySchedule[] = [];
      let totalEvents = 0;
      let userRegisteredCount = 0;

      // Generate daily schedules for the week
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStartDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dayOfWeek = currentDate.getDay() as DayOfWeek;

        const daySchedules: ScheduleDisplayData[] = [];

        // Find schedules for this day
        for (const schedule of schedules) {
          if (schedule.dayOfWeek === dayOfWeek) {
            const event = await this.getGeneratedEventForDate(schedule.id, currentDate);

            if (event && event.status !== 'cancelled') {
              const nextOccurrence = getNextOccurrence(schedule, new Date());
              const spotsAvailable = schedule.participationInfo.maxParticipants
                ? schedule.participationInfo.maxParticipants - event.registeredParticipants.length
                : undefined;

              const displayData: ScheduleDisplayData = {
                schedule,
                nextOccurrence,
                isToday: currentDate.toDateString() === new Date().toDateString(),
                isThisWeek: true,
                spotsAvailable,
                userRegistrationStatus:
                  userId && event.registeredParticipants.includes(userId)
                    ? 'registered'
                    : userId && event.waitlist.includes(userId)
                      ? 'waitlisted'
                      : 'not_registered',
                canRegister: !schedule.participationInfo.memberOnly || true, // TODO: Check membership
              };

              daySchedules.push(displayData);
              totalEvents++;

              if (userId && event.registeredParticipants.includes(userId)) {
                userRegisteredCount++;
              }
            }
          }
        }

        dailySchedules.push({
          date: currentDate,
          dayOfWeek,
          events: daySchedules,
          isToday: currentDate.toDateString() === new Date().toDateString(),
          hasConflicts: this.checkDayConflicts(daySchedules),
        });
      }

      return {
        clubId,
        weekStartDate,
        schedules: dailySchedules,
        totalEvents,
        userRegisteredCount,
      };
    } catch (error) {
      console.error('❌ Error getting weekly schedule view:', error);
      throw error;
    }
  }

  /**
   * Check if there are conflicts in a day's schedules
   * @param daySchedules - Schedules for a single day
   * @returns boolean - True if conflicts exist
   */
  private checkDayConflicts(daySchedules: ScheduleDisplayData[]): boolean {
    for (let i = 0; i < daySchedules.length; i++) {
      for (let j = i + 1; j < daySchedules.length; j++) {
        if (hasScheduleConflict(daySchedules[i].schedule, daySchedules[j].schedule)) {
          return true;
        }
      }
    }
    return false;
  }

  // ============ REAL-TIME SUBSCRIPTIONS ============

  /**
   * Subscribe to club schedules updates
   * @param clubId - Club ID
   * @param callback - Callback function for updates
   * @returns Unsubscribe function
   */
  subscribeToClubSchedules(
    clubId: string,
    callback: (schedules: ClubSchedule[]) => void
  ): Unsubscribe {
    try {
      const q = query(
        collection(db, this.SCHEDULES_COLLECTION),
        where('clubId', '==', clubId),
        where('isActive', '==', true),
        orderBy('dayOfWeek'),
        orderBy('time')
      );

      return onSnapshot(q, querySnapshot => {
        const schedules: ClubSchedule[] = [];

        querySnapshot.forEach(doc => {
          schedules.push({
            id: doc.id,
            ...doc.data(),
          } as ClubSchedule);
        });

        callback(schedules);
      });
    } catch (error) {
      console.error('❌ Error subscribing to schedules:', error);
      throw error;
    }
  }

  /**
   * Subscribe to upcoming events for a club
   * @param clubId - Club ID
   * @param callback - Callback function for updates
   * @returns Unsubscribe function
   */
  subscribeToUpcomingEvents(
    clubId: string,
    callback: (events: GeneratedEvent[]) => void
  ): Unsubscribe {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, this.GENERATED_EVENTS_COLLECTION),
        where('clubId', '==', clubId),
        where('eventDate', '>=', now),
        where('status', 'in', ['scheduled', 'in_progress']),
        orderBy('eventDate'),
        limit(20)
      );

      return onSnapshot(q, querySnapshot => {
        const events: GeneratedEvent[] = [];

        querySnapshot.forEach(doc => {
          events.push({
            id: doc.id,
            ...doc.data(),
          } as GeneratedEvent);
        });

        callback(events);
      });
    } catch (error) {
      console.error('❌ Error subscribing to events:', error);
      throw error;
    }
  }

  // ============ EVENT REGISTRATION ============

  /**
   * Register a user for a generated event
   * @param eventId - Generated event ID
   * @param userId - User ID
   * @returns Promise<'registered' | 'waitlisted'>
   */
  async registerForEvent(eventId: string, userId: string): Promise<'registered' | 'waitlisted'> {
    try {
      return await runTransaction(db, async transaction => {
        const eventRef = doc(db, this.GENERATED_EVENTS_COLLECTION, eventId);
        const eventDoc = await transaction.get(eventRef);

        if (!eventDoc.exists()) {
          throw new Error('Event not found');
        }

        const event = eventDoc.data() as GeneratedEvent;
        const scheduleDoc = await transaction.get(
          doc(db, this.SCHEDULES_COLLECTION, event.scheduleId)
        );
        const schedule = { id: scheduleDoc.id, ...scheduleDoc.data() } as ClubSchedule;

        // Check if already registered
        if (event.registeredParticipants.includes(userId)) {
          throw new Error('Already registered for this event');
        }

        // Check if spots available
        const maxParticipants = schedule.participationInfo.maxParticipants;
        if (!maxParticipants || event.registeredParticipants.length < maxParticipants) {
          // Add to registered participants
          transaction.update(eventRef, {
            registeredParticipants: [...event.registeredParticipants, userId],
            updatedAt: serverTimestamp(),
          });
          return 'registered';
        } else {
          // Add to waitlist
          transaction.update(eventRef, {
            waitlist: [...event.waitlist, userId],
            updatedAt: serverTimestamp(),
          });
          return 'waitlisted';
        }
      });
    } catch (error) {
      console.error('❌ Error registering for event:', error);
      throw error;
    }
  }

  /**
   * Cancel registration for an event
   * @param eventId - Generated event ID
   * @param userId - User ID
   * @returns Promise<void>
   */
  async cancelEventRegistration(eventId: string, userId: string): Promise<void> {
    try {
      await runTransaction(db, async transaction => {
        const eventRef = doc(db, this.GENERATED_EVENTS_COLLECTION, eventId);
        const eventDoc = await transaction.get(eventRef);

        if (!eventDoc.exists()) {
          throw new Error('Event not found');
        }

        const event = eventDoc.data() as GeneratedEvent;

        // Remove from registered participants
        const updatedParticipants = event.registeredParticipants.filter(id => id !== userId);
        const wasRegistered = updatedParticipants.length < event.registeredParticipants.length;

        // Remove from waitlist
        const updatedWaitlist = event.waitlist.filter(id => id !== userId);

        // If user was registered and there's a waitlist, promote first person
        if (wasRegistered && updatedWaitlist.length > 0) {
          const promotedUserId = updatedWaitlist[0];
          updatedParticipants.push(promotedUserId);
          updatedWaitlist.shift();

          // TODO: Send notification to promoted user
        }

        transaction.update(eventRef, {
          registeredParticipants: updatedParticipants,
          waitlist: updatedWaitlist,
          updatedAt: serverTimestamp(),
        });
      });

      console.log(`✅ Cancelled registration for user ${userId} in event ${eventId}`);
    } catch (error) {
      console.error('❌ Error cancelling registration:', error);
      throw error;
    }
  }
}

export default new ClubScheduleService();
