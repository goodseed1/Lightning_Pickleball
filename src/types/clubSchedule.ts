/**
 * Club Schedule Type Definitions
 * Lightning Pickleball Club Regular Meeting Schedules
 */

import { Timestamp as FirebaseTimestamp } from 'firebase/firestore';

// ============ MAIN CLUB SCHEDULE INTERFACE ============

export interface ClubSchedule {
  id: string; // Firestore document ID
  clubId: string; // Club that owns this schedule

  // Schedule Information
  title: string; // Schedule title (e.g., "Weekly Practice", "Saturday Morning Pickleball")
  description?: string; // Detailed description of the regular meeting
  scheduleType: ScheduleType; // Type of recurring schedule

  // Timing Information
  dayOfWeek: DayOfWeek; // Day of the week (0-6, Sunday-Saturday)
  time: string; // Time in 24-hour format (HH:MM, e.g., "19:00")
  duration: number; // Duration in minutes (e.g., 120 for 2 hours)
  timezone: string; // Timezone identifier (e.g., "America/New_York")

  // Location Information
  location: ScheduleLocation; // Where the meeting happens

  // Participation Details
  participationInfo: ParticipationInfo;

  // Recurrence Rules
  recurrence: RecurrenceRule;

  // Status and Metadata
  isActive: boolean; // Whether this schedule is currently active
  createdBy: string; // User ID who created this schedule
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;

  // Optional Features
  reminders?: ReminderSettings; // Notification settings
  exceptions?: ScheduleException[]; // Dates when schedule doesn't apply
  specialInstructions?: string; // Any special notes for participants
}

// ============ SCHEDULE TYPES ============

export type ScheduleType =
  | 'practice' // Regular practice session
  | 'social' // Social pickleball meetup
  | 'league_match' // League match day
  | 'clinic' // Training clinic
  | 'tournament' // Regular tournament
  | 'meeting' // Club meeting (non-playing)
  | 'mixed_doubles' // Mixed doubles session
  | 'beginner_friendly' // Beginner-focused session
  | 'advanced_only' // Advanced players only
  | 'custom'; // Custom event type

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

/**
 * Get day of week label using translation function
 * @param dayOfWeek - Day of week number (0-6)
 * @param t - Translation function from i18n
 * @returns Translated day of week label
 *
 * Usage:
 * const label = getDayOfWeekLabel(0, t); // "Sunday" or "일요일"
 */
export const getDayOfWeekLabel = (dayOfWeek: DayOfWeek, t: (key: string) => string): string => {
  return t(`types.clubSchedule.daysOfWeek.${dayOfWeek}`);
};

// ============ LOCATION INTERFACE ============

export interface ScheduleLocation {
  name: string; // Location name (e.g., "Central Park Pickleball Courts")
  address: string; // Full address
  courtIds?: string[]; // Specific court IDs if applicable
  coordinates?: {
    // GPS coordinates for map display
    latitude: number;
    longitude: number;
  };
  instructions?: string; // How to find the courts, parking info, etc.
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
}

// ============ PARTICIPATION INTERFACE ============

export interface ParticipationInfo {
  minParticipants?: number; // Minimum participants needed
  maxParticipants?: number; // Maximum participants allowed
  skillLevelRequired?: string; // Required skill level (e.g., "3.5+")
  skillLevelRange?: {
    // Acceptable skill range
    min: string;
    max: string;
  };
  registrationRequired: boolean; // Whether advance registration is needed
  registrationDeadline?: number; // Hours before event to register
  memberOnly: boolean; // Whether only club members can join
  guestAllowed: boolean; // Whether members can bring guests
  maxGuestsPerMember?: number; // Maximum guests each member can bring
  fee?: ScheduleFee; // Any fees associated
}

export interface ScheduleFee {
  amount: number; // Fee amount
  currency: string; // Currency code (e.g., "USD", "KRW")
  type: 'per_session' | 'monthly' | 'included'; // Fee structure
  description?: string; // What the fee covers
  paymentMethods?: string[]; // Accepted payment methods
}

// ============ RECURRENCE RULES ============

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // Every N weeks/months
  startDate: FirebaseTimestamp; // When the schedule starts
  endDate?: FirebaseTimestamp; // When the schedule ends (optional)
  count?: number; // Total number of occurrences

  // Advanced recurrence options
  weekOfMonth?: WeekOfMonth; // For monthly: "first", "second", etc.
  monthlyType?: 'dayOfMonth' | 'dayOfWeek'; // Monthly recurrence type
  excludeDates?: FirebaseTimestamp[]; // Specific dates to exclude
  includeDates?: FirebaseTimestamp[]; // Additional dates to include
}

export type RecurrenceFrequency =
  | 'weekly' // Every week
  | 'biweekly' // Every two weeks
  | 'monthly' // Every month
  | 'custom'; // Custom pattern

export type WeekOfMonth = 'first' | 'second' | 'third' | 'fourth' | 'last';

// ============ SCHEDULE EXCEPTIONS ============

export interface ScheduleException {
  date: FirebaseTimestamp; // Date of exception
  reason: string; // Why the regular schedule doesn't apply
  type: 'cancelled' | 'rescheduled' | 'location_change' | 'special';
  alternativeDetails?: {
    // If rescheduled or location changed
    time?: string;
    location?: ScheduleLocation;
    notes?: string;
  };
  notificationSent: boolean; // Whether members were notified
}

// ============ REMINDER SETTINGS ============

export interface ReminderSettings {
  enabled: boolean;
  reminderTimes: ReminderTime[]; // Multiple reminders possible
  reminderMethods: ReminderMethod[];
}

export interface ReminderTime {
  amount: number; // Number of units
  unit: 'minutes' | 'hours' | 'days'; // Time unit
  beforeEvent: boolean; // true = before, false = after
}

export type ReminderMethod = 'push' | 'email' | 'sms';

// ============ GENERATED EVENTS ============

export interface GeneratedEvent {
  id: string;
  scheduleId: string; // Parent schedule ID
  clubId: string;
  eventDate: FirebaseTimestamp; // Actual date of this instance
  status: EventStatus;

  // Inherited from schedule but can be overridden
  title: string;
  location: ScheduleLocation;
  time: string;
  duration: number;

  // Instance-specific data
  registeredParticipants: string[]; // User IDs
  waitlist: string[];
  attendance?: AttendanceRecord[];
  notes?: string; // Notes for this specific instance

  // Modifications
  isModified: boolean; // If this instance differs from schedule
  modifications?: EventModification;
}

export type EventStatus =
  | 'scheduled' // Future event
  | 'in_progress' // Currently happening
  | 'completed' // Past event
  | 'cancelled' // Cancelled
  | 'postponed'; // Postponed to another date

export interface EventModification {
  modifiedFields: string[]; // Which fields were changed
  modifiedBy: string; // User who made changes
  modifiedAt: FirebaseTimestamp;
  reason?: string; // Why it was modified
  originalValues?: Partial<GeneratedEvent>; // Original values
}

export interface AttendanceRecord {
  userId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: FirebaseTimestamp;
  notes?: string;
}

// ============ SCHEDULE QUERY INTERFACES ============

export interface ScheduleQuery {
  clubId?: string;
  isActive?: boolean;
  scheduleTypes?: ScheduleType[];
  daysOfWeek?: DayOfWeek[];
  skillLevel?: string;
  location?: string;
  hasAvailableSpots?: boolean;
}

export interface ScheduleConflictCheck {
  clubId: string;
  dayOfWeek: DayOfWeek;
  time: string;
  duration: number;
  excludeScheduleId?: string; // Exclude when updating
}

// ============ UI DISPLAY INTERFACES ============

export interface ScheduleDisplayData {
  schedule: ClubSchedule;
  nextOccurrence: Date; // Next scheduled date
  isToday: boolean;
  isThisWeek: boolean;
  spotsAvailable?: number; // For limited participation
  userRegistrationStatus?: 'registered' | 'waitlisted' | 'not_registered';
  canRegister: boolean;
  conflictsWith?: string[]; // Other schedule IDs that conflict
}

export interface WeeklyScheduleView {
  clubId: string;
  weekStartDate: Date;
  schedules: DailySchedule[];
  totalEvents: number;
  userRegisteredCount: number;
}

export interface DailySchedule {
  date: Date;
  dayOfWeek: DayOfWeek;
  events: ScheduleDisplayData[];
  isToday: boolean;
  hasConflicts: boolean;
}

// ============ CONSTANTS ============

/**
 * Get schedule type label using translation function
 * @param scheduleType - Schedule type key
 * @param t - Translation function from i18n
 * @returns Translated schedule type label
 *
 * Usage:
 * const label = getScheduleTypeLabel('practice', t);
 */
export const getScheduleTypeLabel = (
  scheduleType: ScheduleType,
  t: (key: string) => string
): string => {
  return t(`types.clubSchedule.scheduleTypes.${scheduleType}`);
};

/**
 * Get recurrence frequency label using translation function
 * @param frequency - Recurrence frequency key
 * @param t - Translation function from i18n
 * @returns Translated recurrence label
 *
 * Usage:
 * const label = getRecurrenceLabel('weekly', t);
 */
export const getRecurrenceLabel = (
  frequency: RecurrenceFrequency,
  t: (key: string) => string
): string => {
  return t(`types.clubSchedule.recurrence.${frequency}`);
};

// ============ HELPER FUNCTIONS ============

export const getNextOccurrence = (schedule: ClubSchedule, fromDate: Date = new Date()): Date => {
  const { dayOfWeek, time } = schedule;
  const [hours, minutes] = time.split(':').map(Number);

  const next = new Date(fromDate);
  const currentDay = next.getDay();
  const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7;

  next.setDate(next.getDate() + daysUntilNext);
  next.setHours(hours, minutes, 0, 0);

  // If the calculated time is in the past and it's the same day, add 7 days
  if (next <= fromDate && daysUntilNext === 0) {
    next.setDate(next.getDate() + 7);
  }

  return next;
};

export const formatScheduleTime = (
  time: string,
  duration: number,
  locale: string = 'en', // Supports all languages, defaults to 'en'
  t?: (key: string) => string
): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const endHours = Math.floor((hours * 60 + minutes + duration) / 60);
  const endMinutes = (hours * 60 + minutes + duration) % 60;

  const formatTime = (h: number, m: number) => {
    if (locale === 'ko') {
      const periodKey =
        h >= 12 ? 'types.clubSchedule.timePeriod.pm' : 'types.clubSchedule.timePeriod.am';
      const period = t ? t(periodKey) : h >= 12 ? '오후' : '오전';
      const displayHour = h > 12 ? h - 12 : h || 12;
      return `${period} ${displayHour}:${m.toString().padStart(2, '0')}`;
    } else {
      const periodKey =
        h >= 12 ? 'types.clubSchedule.timePeriod.pm' : 'types.clubSchedule.timePeriod.am';
      const period = t ? t(periodKey) : h >= 12 ? 'PM' : 'AM';
      const displayHour = h > 12 ? h - 12 : h || 12;
      return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
    }
  };

  return `${formatTime(hours, minutes)} - ${formatTime(endHours, endMinutes)}`;
};

// ============ VALIDATION HELPERS ============

export const validateScheduleTime = (time: string): boolean => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

export const hasScheduleConflict = (schedule1: ClubSchedule, schedule2: ClubSchedule): boolean => {
  if (schedule1.dayOfWeek !== schedule2.dayOfWeek) return false;

  const [h1, m1] = schedule1.time.split(':').map(Number);
  const [h2, m2] = schedule2.time.split(':').map(Number);

  const start1 = h1 * 60 + m1;
  const end1 = start1 + schedule1.duration;
  const start2 = h2 * 60 + m2;
  const end2 = start2 + schedule2.duration;

  return !(end1 <= start2 || end2 <= start1);
};
