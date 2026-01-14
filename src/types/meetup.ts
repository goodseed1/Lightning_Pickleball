/**
 * TypeScript type definitions for Regular Meetup system
 * Defines data structures for meetups, participants, and related entities
 */

import { Timestamp } from 'firebase/firestore';

// Meetup status enumeration
export type MeetupStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// Participant RSVP status
export type ParticipantStatus = 'attending' | 'declining' | 'maybe';

// Location type for meetups
export type LocationType = 'home' | 'external';

// Location data structure
export interface MeetupLocation {
  type: LocationType;
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string; // Google Places ID for external locations
}

// Court details for the meetup
export interface CourtDetails {
  availableCourts: number;
  courtNumbers?: string; // Optional notes like "3, 4, 5"
}

// Individual participant data
export interface MeetupParticipant {
  status: ParticipantStatus;
  rsvpTime: Timestamp;
  userId: string;
  displayName?: string;
  profileImage?: string;
}

// Participants map (userId -> participant data)
export interface MeetupParticipants {
  [userId: string]: MeetupParticipant;
}

// Weather data structure
export interface WeatherData {
  temperature: number;
  temperatureF?: number; // Fahrenheit temperature (optional, from weatherService)
  condition: string;
  icon: string;
  chanceOfRain: number;
  description: string;
  lastUpdated: Timestamp | Date;
  humidity?: number;
  windSpeed?: number; // m/s
  windSpeedMph?: number; // mph
  source?: string;
}

// Main meetup interface
export interface Meetup {
  id: string;
  clubId: string;
  status: MeetupStatus;
  dateTime: Timestamp;
  location: MeetupLocation;
  courtDetails: CourtDetails;
  participants: MeetupParticipants;

  // Admin confirmation data
  confirmedBy?: string;
  confirmedAt?: Timestamp;

  // Weather information
  weather?: WeatherData;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Additional metadata
  title?: string;
  description?: string;
  maxParticipants?: number; // Optional limit
  isRecurring?: boolean;
}

// Chat message structure for meetup-specific chat
export interface MeetupChatMessage {
  id: string;
  meetupId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: Timestamp;

  // Message metadata
  isSystemMessage?: boolean;
  edited?: boolean;
  editedAt?: Timestamp;
}

// Meetup summary for list views
export interface MeetupSummary {
  id: string;
  clubId: string;
  status: MeetupStatus;
  dateTime: Timestamp;
  location: {
    name: string;
    type: LocationType;
  };
  participantCount: number;
  courtCount: number;
  weather?: {
    icon: string;
    temperature: number;
  };
}

// Admin confirmation data structure
export interface MeetupConfirmationData {
  meetupId: string;
  location: MeetupLocation;
  courtDetails: CourtDetails;
  confirmedBy: string;
  confirmedAt: Timestamp;
  notificationsSent?: boolean;
}

// RSVP update data
export interface RSVPUpdateData {
  userId: string;
  meetupId: string;
  status: ParticipantStatus;
  timestamp: Timestamp;
}

// Meetup statistics for dashboard
export interface MeetupStats {
  totalAttending: number;
  totalDeclined: number;
  totalMaybe: number;
  courtUtilization: number; // Percentage of court capacity
  statusKey: 'courtsAvailable' | 'perfectMatch' | 'waitingCount'; // i18n key for status message
  waitingCount?: number; // Number of people waiting (only when statusKey is 'waitingCount')
  statusColor: 'green' | 'blue' | 'orange' | 'red';
}

// Form data for creating/editing meetups
export interface CreateMeetupData {
  clubId: string;
  dateTime: Date;
  location?: MeetupLocation;
  courtDetails?: CourtDetails;
  title?: string;
  description?: string;
  isRecurring?: boolean;
}

// Weather API response structure
export interface WeatherAPIResponse {
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    precip_mm: number;
    humidity: number;
    wind_kph: number;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          text: string;
          icon: string;
        };
        daily_chance_of_rain: number;
      };
      hour: Array<{
        time: string;
        temp_c: number;
        condition: {
          text: string;
          icon: string;
        };
        chance_of_rain: number;
      }>;
    }>;
  };
}

// Export utility type for Firestore document conversion
export type MeetupFirestoreData = Omit<Meetup, 'id'>;

export default Meetup;
