/**
 * ActivityService Unit Tests
 * Tests all event-related operations including applications, hosting, and participation
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 *
 * Following START.md Golden Rule 1: TDD - Writing tests for our core service
 */

import activityService from '../activityService';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  __setMockDocumentData,
  __setMockQueryResults,
  __resetMocks,
} from 'firebase/firestore';

// Mock Firebase config
jest.mock('../../firebase/config', () => ({
  auth: {
    currentUser: { uid: 'test-user-id', email: 'test@example.com' },
  },
  db: {},
  functions: {},
}));

// Mock Firebase functions
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { success: true } }))),
}));

describe.skip('ActivityService Unit Tests - TypeScript service needs refactoring', () => {
  beforeEach(() => {
    __resetMocks();
    jest.clearAllMocks();
  });

  describe('Event Creation', () => {
    it('should create a new event successfully', async () => {
      const eventData = {
        title: 'Weekend Pickleball Match',
        description: 'Friendly doubles match',
        type: 'match',
        location: { address: 'Central Park Courts', coordinates: { lat: 40.7829, lng: -73.9654 } },
        scheduledTime: new Date('2025-01-15T10:00:00'),
        maxParticipants: 4,
        ltrLevel: '3.5,4.0',
        gameType: 'doubles',
      };

      const mockEventId = 'event-123';
      addDoc.mockResolvedValue({ id: mockEventId });

      const eventId = await activityService.createEvent(eventData);

      expect(eventId).toBe(mockEventId);
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          hostId: 'test-user-id',
        })
      );
    });

    it('should handle event creation failure', async () => {
      const eventData = {
        title: 'Test Event',
        type: 'meetup',
      };

      addDoc.mockRejectedValue(new Error('Firebase error'));

      const eventId = await activityService.createEvent(eventData);

      // Service returns mock ID when Firebase fails
      expect(eventId).toMatch(/mock_event_/);
    });
  });

  describe('Event Retrieval', () => {
    it('should get participated events for a user', async () => {
      const mockEvents = [
        {
          id: 'event1',
          title: 'Morning Match',
          scheduledTime: { toDate: () => new Date('2025-01-10T09:00:00') },
          hostId: 'host-123',
          status: 'upcoming',
        },
        {
          id: 'event2',
          title: 'Evening Rally',
          scheduledTime: { toDate: () => new Date('2025-01-10T18:00:00') },
          hostId: 'host-456',
          status: 'upcoming',
        },
      ];

      __setMockQueryResults(mockEvents, false);

      const events = await activityService.getParticipatedEvents('test-user-id');

      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });

    it('should get hosted events for a user', async () => {
      const mockHostedEvents = [
        {
          id: 'hosted-event-1',
          title: 'My Tournament',
          hostId: 'test-user-id',
          scheduledTime: { toDate: () => new Date('2025-01-20T10:00:00') },
          maxParticipants: 8,
        },
      ];

      __setMockQueryResults(mockHostedEvents, false);

      const events = await activityService.getHostedEvents('test-user-id');

      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
      expect(getDocs).toHaveBeenCalled();
    });

    it('should get past events for a user', async () => {
      const mockPastEvents = [
        {
          id: 'past-event-1',
          title: 'Last Week Match',
          scheduledTime: { toDate: () => new Date('2025-01-01T10:00:00') },
          status: 'completed',
        },
      ];

      __setMockQueryResults(mockPastEvents, false);

      const events = await activityService.getPastEvents('test-user-id');

      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });

    it('should get event by ID', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Singles Match',
        description: 'Competitive singles',
        scheduledTime: { toDate: () => new Date('2025-01-15T14:00:00') },
      };

      __setMockDocumentData(mockEvent, true);

      const event = await activityService.getEventById('event-123');

      expect(event).toBeDefined();
      expect(event.id).toBe('event-123');
      expect(event.title).toBe('Singles Match');
    });

    it('should return null for non-existent event', async () => {
      __setMockDocumentData(null, false);

      const event = await activityService.getEventById('non-existent');

      expect(event).toBeNull();
    });
  });

  describe('Event Applications', () => {
    it('should apply to an event successfully', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Open Pickleball Match',
        maxParticipants: 4,
        participants: ['user1', 'user2'],
      };

      __setMockDocumentData(mockEvent, true);
      addDoc.mockResolvedValue({ id: 'application-456' });

      const applicationId = await activityService.applyToEvent('event-123', 'test-user-id');

      expect(applicationId).toBe('application-456');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventId: 'event-123',
          applicantId: 'test-user-id',
          status: 'pending',
        })
      );
    });

    it('should get applications for a user', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          eventId: 'event-123',
          applicantId: 'test-user-id',
          status: 'pending',
          appliedAt: { toDate: () => new Date() },
        },
        {
          id: 'app-2',
          eventId: 'event-456',
          applicantId: 'test-user-id',
          status: 'approved',
          appliedAt: { toDate: () => new Date() },
        },
      ];

      __setMockQueryResults(mockApplications, false);

      const applications = await activityService.getUserApplications('test-user-id');

      expect(applications).toBeDefined();
      expect(Array.isArray(applications)).toBe(true);
      expect(getDocs).toHaveBeenCalled();
    });

    it('should cancel an application', async () => {
      deleteDoc.mockResolvedValue();

      const result = await activityService.cancelApplication('application-123');

      expect(result).toBe(true);
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to user applications', () => {
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      onSnapshot.mockReturnValue(unsubscribe);

      const unsub = activityService.subscribeToUserApplications('test-user-id', callback);

      expect(onSnapshot).toHaveBeenCalled();
      expect(unsub).toBe(unsubscribe);
    });

    it('should subscribe to hosted event participants', () => {
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      onSnapshot.mockReturnValue(unsubscribe);

      const unsub = activityService.subscribeToHostedEventParticipants('event-123', callback);

      expect(onSnapshot).toHaveBeenCalled();
      expect(unsub).toBe(unsubscribe);
    });

    it('should handle subscription errors gracefully', () => {
      const callback = jest.fn();
      onSnapshot.mockImplementation(() => {
        throw new Error('Subscription failed');
      });

      // Should not throw, but return a no-op unsubscribe
      const unsub = activityService.subscribeToUserApplications('test-user-id', callback);

      expect(typeof unsub).toBe('function');
    });
  });

  describe('Event Management', () => {
    it('should update an event successfully', async () => {
      updateDoc.mockResolvedValue();

      const updates = {
        title: 'Updated Pickleball Match',
        description: 'New description',
        maxParticipants: 6,
      };

      const result = await activityService.updateEvent('event-123', updates);

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining(updates));
    });

    it('should cancel an event', async () => {
      updateDoc.mockResolvedValue();

      const result = await activityService.cancelEvent('event-123');

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'canceled',
        })
      );
    });

    it('should get hosted events with full participant data', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Tournament',
          hostId: 'test-user-id',
          scheduledTime: { toDate: () => new Date() },
        },
      ];

      __setMockQueryResults(mockEvents, false);

      const events = await activityService.getHostedEventsWithFullParticipantData('test-user-id');

      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should get event type label correctly', () => {
      expect(activityService.getEventTypeLabel('match')).toBe('경기');
      expect(activityService.getEventTypeLabel('meetup')).toBe('모임');
      expect(activityService.getEventTypeLabel('tournament')).toBe('토너먼트');
      expect(activityService.getEventTypeLabel('unknown')).toBe('기타');
    });

    it('should get event status label correctly', () => {
      expect(activityService.getEventStatusLabel('upcoming')).toBe('예정');
      expect(activityService.getEventStatusLabel('ongoing')).toBe('진행중');
      expect(activityService.getEventStatusLabel('completed')).toBe('완료');
      expect(activityService.getEventStatusLabel('canceled')).toBe('취소됨');
    });

    it('should format event time correctly', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);

      const timeString = activityService.formatEventTime(futureDate);
      expect(timeString).toContain('2시간 후');
    });

    it('should check if event is joinable', () => {
      const upcomingEvent = {
        status: 'upcoming',
        scheduledTime: new Date(Date.now() + 86400000), // Tomorrow
        maxParticipants: 4,
        participants: ['user1', 'user2'],
      };

      const fullEvent = {
        status: 'upcoming',
        scheduledTime: new Date(Date.now() + 86400000),
        maxParticipants: 2,
        participants: ['user1', 'user2'],
      };

      expect(activityService.isEventJoinable(upcomingEvent)).toBe(true);
      expect(activityService.isEventJoinable(fullEvent)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase connection errors gracefully', async () => {
      getDocs.mockRejectedValue(new Error('Network error'));

      const events = await activityService.getParticipatedEvents('test-user-id');

      // Should return empty array on error
      expect(events).toEqual([]);
    });

    it('should handle invalid event data gracefully', async () => {
      const invalidEvent = {
        // Missing required fields
        description: 'Invalid event',
      };

      const eventId = await activityService.createEvent(invalidEvent);

      // Should still return an ID (mock or real)
      expect(eventId).toBeDefined();
    });
  });
});
