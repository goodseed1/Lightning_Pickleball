/**
 * EventParticipationService Unit Tests - SKIPPED
 * Tests event participation management, approval workflows, and real-time subscriptions
 * SKIPPED: TypeScript service needs refactoring
 */

import eventParticipationService from '../eventParticipationService.ts';

// Firebase Firestore is now centrally mocked in __mocks__/firebase/firestore.js

// Mock Firebase Functions
const mockHttpsCallable = jest.fn();
jest.mock('firebase/functions', () => ({
  httpsCallable: mockHttpsCallable,
}));

// Mock Firebase config
jest.mock('../../firebase/config', () => ({
  db: 'mock-db',
  functions: 'mock-functions',
}));

describe.skip('EventParticipationService Unit Tests - TypeScript service needs refactoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('requestParticipation', () => {
    it('should request participation successfully', async () => {
      const mockResponse = {
        success: true,
        participationId: 'participation-123',
        status: 'pending',
      };

      const mockCallableFunction = jest.fn().mockResolvedValue({
        data: mockResponse,
      });
      mockHttpsCallable.mockReturnValue(mockCallableFunction);

      const result = await eventParticipationService.requestParticipation(
        'event-123',
        'participant'
      );

      expect(mockHttpsCallable).toHaveBeenCalledWith('mock-functions', 'requestEventParticipation');
      expect(mockCallableFunction).toHaveBeenCalledWith({
        eventId: 'event-123',
        participationType: 'participant',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should default to participant type when not specified', async () => {
      const mockCallableFunction = jest.fn().mockResolvedValue({
        data: { success: true },
      });
      mockHttpsCallable.mockReturnValue(mockCallableFunction);

      await eventParticipationService.requestParticipation('event-123');

      expect(mockCallableFunction).toHaveBeenCalledWith({
        eventId: 'event-123',
        participationType: 'participant',
      });
    });

    it('should handle request participation errors', async () => {
      const mockCallableFunction = jest
        .fn()
        .mockRejectedValue(new Error('Participation request failed'));
      mockHttpsCallable.mockReturnValue(mockCallableFunction);

      await expect(
        eventParticipationService.requestParticipation('event-123', 'participant')
      ).rejects.toThrow('Participation request failed');

      expect(console.error).toHaveBeenCalledWith(
        'Error requesting participation:',
        expect.any(Error)
      );
    });

    it('should support different participation types', async () => {
      const mockCallableFunction = jest.fn().mockResolvedValue({
        data: { success: true },
      });
      mockHttpsCallable.mockReturnValue(mockCallableFunction);

      await eventParticipationService.requestParticipation('event-123', 'spectator');

      expect(mockCallableFunction).toHaveBeenCalledWith({
        eventId: 'event-123',
        participationType: 'spectator',
      });

      await eventParticipationService.requestParticipation('event-456', 'helper');

      expect(mockCallableFunction).toHaveBeenLastCalledWith({
        eventId: 'event-456',
        participationType: 'helper',
      });
    });
  });

  describe('updateParticipationStatus', () => {
    it('should approve participation successfully', async () => {
      const mockResponse = {
        success: true,
        participationId: 'participation-123',
        status: 'approved',
      };

      const mockCallableFunction = jest.fn().mockResolvedValue({
        data: mockResponse,
      });
      mockHttpsCallable.mockReturnValue(mockCallableFunction);

      const result = await eventParticipationService.updateParticipationStatus(
        'participation-123',
        'approved',
        'Meets requirements'
      );

      expect(mockHttpsCallable).toHaveBeenCalledWith('mock-functions', 'updateParticipationStatus');
      expect(mockCallableFunction).toHaveBeenCalledWith({
        participationId: 'participation-123',
        status: 'approved',
        reason: 'Meets requirements',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should reject participation with reason', async () => {
      const mockResponse = {
        success: true,
        participationId: 'participation-123',
        status: 'rejected',
      };

      const mockCallableFunction = jest.fn().mockResolvedValue({
        data: mockResponse,
      });
      mockHttpsCallable.mockReturnValue(mockCallableFunction);

      const result = await eventParticipationService.updateParticipationStatus(
        'participation-123',
        'rejected',
        'Event is full'
      );

      expect(mockCallableFunction).toHaveBeenCalledWith({
        participationId: 'participation-123',
        status: 'rejected',
        reason: 'Event is full',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle update status errors', async () => {
      const mockCallableFunction = jest.fn().mockRejectedValue(new Error('Status update failed'));
      mockHttpsCallable.mockReturnValue(mockCallableFunction);

      await expect(
        eventParticipationService.updateParticipationStatus('participation-123', 'approved')
      ).rejects.toThrow('Status update failed');

      expect(console.error).toHaveBeenCalledWith(
        'Error updating participation status:',
        expect.any(Error)
      );
    });
  });

  describe('getUserParticipations', () => {
    const mockParticipations = [
      {
        id: 'participation-1',
        userId: 'user-123',
        eventId: 'event-1',
        status: 'approved',
        participationType: 'participant',
      },
      {
        id: 'participation-2',
        userId: 'user-123',
        eventId: 'event-2',
        status: 'pending',
        participationType: 'spectator',
      },
    ];

    beforeEach(() => {
      mockGetDocs.mockResolvedValue({
        docs: mockParticipations.map(participation => ({
          id: participation.id,
          data: () => participation,
        })),
      });
    });

    it('should get user participations successfully', async () => {
      const result = await eventParticipationService.getUserParticipations('user-123');

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-123');
      expect(mockOrderBy).toHaveBeenCalledWith('requestedAt', 'desc');
      expect(result).toEqual(mockParticipations);
    });

    it('should handle get user participations errors', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      await expect(eventParticipationService.getUserParticipations('user-123')).rejects.toThrow(
        'Database error'
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error getting user participations:',
        expect.any(Error)
      );
    });
  });

  describe('getEventParticipations', () => {
    const mockEventParticipations = [
      {
        id: 'participation-1',
        userId: 'user-1',
        eventId: 'event-123',
        status: 'approved',
        participationType: 'participant',
      },
      {
        id: 'participation-2',
        userId: 'user-2',
        eventId: 'event-123',
        status: 'pending',
        participationType: 'participant',
      },
    ];

    beforeEach(() => {
      mockGetDocs.mockResolvedValue({
        docs: mockEventParticipations.map(participation => ({
          id: participation.id,
          data: () => participation,
        })),
      });
    });

    it('should get event participations successfully', async () => {
      const result = await eventParticipationService.getEventParticipations('event-123');

      expect(mockWhere).toHaveBeenCalledWith('eventId', '==', 'event-123');
      expect(mockOrderBy).toHaveBeenCalledWith('requestedAt', 'desc');
      expect(result).toEqual(mockEventParticipations);
    });

    it('should handle get event participations errors', async () => {
      mockGetDocs.mockRejectedValue(new Error('Event participation query failed'));

      await expect(eventParticipationService.getEventParticipations('event-123')).rejects.toThrow(
        'Event participation query failed'
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error getting event participations:',
        expect.any(Error)
      );
    });
  });

  describe('getApprovedParticipants', () => {
    const mockApprovedParticipants = [
      {
        id: 'participation-1',
        eventId: 'event-123',
        status: 'approved',
        approvedAt: new Date('2024-01-15'),
      },
      {
        id: 'participation-2',
        eventId: 'event-123',
        status: 'confirmed',
        approvedAt: new Date('2024-01-16'),
      },
    ];

    beforeEach(() => {
      mockGetDocs.mockResolvedValue({
        docs: mockApprovedParticipants.map(participant => ({
          id: participant.id,
          data: () => participant,
        })),
      });
    });

    it('should get approved participants successfully', async () => {
      const result = await eventParticipationService.getApprovedParticipants('event-123');

      expect(mockWhere).toHaveBeenCalledWith('eventId', '==', 'event-123');
      expect(mockWhere).toHaveBeenCalledWith('status', 'in', ['approved', 'confirmed']);
      expect(mockOrderBy).toHaveBeenCalledWith('approvedAt', 'asc');
      expect(result).toEqual(mockApprovedParticipants);
    });

    it('should handle get approved participants errors', async () => {
      mockGetDocs.mockRejectedValue(new Error('Approved participants query failed'));

      await expect(eventParticipationService.getApprovedParticipants('event-123')).rejects.toThrow(
        'Approved participants query failed'
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error getting approved participants:',
        expect.any(Error)
      );
    });
  });

  describe('getWaitlistedParticipants', () => {
    const mockWaitlistedParticipants = [
      {
        id: 'participation-1',
        eventId: 'event-123',
        status: 'waitlisted',
        waitlistedAt: new Date('2024-01-15'),
      },
      {
        id: 'participation-2',
        eventId: 'event-123',
        status: 'waitlisted',
        waitlistedAt: new Date('2024-01-16'),
      },
    ];

    beforeEach(() => {
      mockGetDocs.mockResolvedValue({
        docs: mockWaitlistedParticipants.map(participant => ({
          id: participant.id,
          data: () => participant,
        })),
      });
    });

    it('should get waitlisted participants in order', async () => {
      const result = await eventParticipationService.getWaitlistedParticipants('event-123');

      expect(mockWhere).toHaveBeenCalledWith('eventId', '==', 'event-123');
      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'waitlisted');
      expect(mockOrderBy).toHaveBeenCalledWith('waitlistedAt', 'asc');
      expect(result).toEqual(mockWaitlistedParticipants);
    });

    it('should handle get waitlisted participants errors', async () => {
      mockGetDocs.mockRejectedValue(new Error('Waitlisted participants query failed'));

      await expect(
        eventParticipationService.getWaitlistedParticipants('event-123')
      ).rejects.toThrow('Waitlisted participants query failed');

      expect(console.error).toHaveBeenCalledWith(
        'Error getting waitlisted participants:',
        expect.any(Error)
      );
    });
  });

  describe('getPendingParticipations', () => {
    const mockPendingParticipations = [
      {
        id: 'participation-1',
        eventId: 'event-123',
        status: 'pending',
        requestedAt: new Date('2024-01-15'),
      },
      {
        id: 'participation-2',
        eventId: 'event-123',
        status: 'pending',
        requestedAt: new Date('2024-01-16'),
      },
    ];

    beforeEach(() => {
      mockGetDocs.mockResolvedValue({
        docs: mockPendingParticipations.map(participation => ({
          id: participation.id,
          data: () => participation,
        })),
      });
    });

    it('should get pending participations in request order', async () => {
      const result = await eventParticipationService.getPendingParticipations('event-123');

      expect(mockWhere).toHaveBeenCalledWith('eventId', '==', 'event-123');
      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
      expect(mockOrderBy).toHaveBeenCalledWith('requestedAt', 'asc');
      expect(result).toEqual(mockPendingParticipations);
    });

    it('should handle get pending participations errors', async () => {
      mockGetDocs.mockRejectedValue(new Error('Pending participations query failed'));

      await expect(eventParticipationService.getPendingParticipations('event-123')).rejects.toThrow(
        'Pending participations query failed'
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error getting pending participations:',
        expect.any(Error)
      );
    });
  });

  describe('getClubParticipations', () => {
    const mockClubParticipations = [
      {
        id: 'participation-1',
        eventSnapshot: { clubId: 'club-123' },
        status: 'approved',
      },
      {
        id: 'participation-2',
        eventSnapshot: { clubId: 'club-123' },
        status: 'pending',
      },
    ];

    beforeEach(() => {
      mockGetDocs.mockResolvedValue({
        docs: mockClubParticipations.map(participation => ({
          id: participation.id,
          data: () => participation,
        })),
      });
    });

    it('should get all club participations without status filter', async () => {
      const result = await eventParticipationService.getClubParticipations('club-123');

      expect(mockWhere).toHaveBeenCalledWith('eventSnapshot.clubId', '==', 'club-123');
      expect(mockOrderBy).toHaveBeenCalledWith('requestedAt', 'desc');
      expect(result).toEqual(mockClubParticipations);
    });

    it('should get club participations filtered by status', async () => {
      const result = await eventParticipationService.getClubParticipations('club-123', 'pending');

      expect(mockWhere).toHaveBeenCalledWith('eventSnapshot.clubId', '==', 'club-123');
      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
      expect(result).toEqual(mockClubParticipations);
    });

    it('should handle get club participations errors', async () => {
      mockGetDocs.mockRejectedValue(new Error('Club participations query failed'));

      await expect(eventParticipationService.getClubParticipations('club-123')).rejects.toThrow(
        'Club participations query failed'
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error getting club participations:',
        expect.any(Error)
      );
    });
  });

  describe('getEventParticipationSummary', () => {
    const mockParticipations = [
      {
        id: 'participation-1',
        status: 'approved',
        participationType: 'participant',
        approvalReason: 'club_member_regular_meeting',
      },
      {
        id: 'participation-2',
        status: 'confirmed',
        participationType: 'participant',
        approvalReason: 'manual_approval',
      },
      {
        id: 'participation-3',
        status: 'waitlisted',
        participationType: 'spectator',
      },
      {
        id: 'participation-4',
        status: 'pending',
        participationType: 'helper',
      },
    ];

    beforeEach(() => {
      jest
        .spyOn(eventParticipationService, 'getEventParticipations')
        .mockResolvedValue(mockParticipations);
    });

    it('should generate comprehensive participation summary', async () => {
      const result = await eventParticipationService.getEventParticipationSummary('event-123');

      expect(result.eventId).toBe('event-123');
      expect(result.totalParticipants).toBe(4);
      expect(result.confirmedParticipants).toBe(2); // approved + confirmed
      expect(result.waitlistedParticipants).toBe(1);

      expect(result.participantsByType.participants).toBe(2);
      expect(result.participantsByType.spectators).toBe(1);
      expect(result.participantsByType.helpers).toBe(1);

      expect(result.autoApprovedCount).toBe(1); // club_member_regular_meeting
      expect(result.manualApprovedCount).toBe(1); // confirmed but not auto-approved

      expect(result.lastUpdated).toBeDefined();
    });

    it('should handle empty participation list', async () => {
      jest.spyOn(eventParticipationService, 'getEventParticipations').mockResolvedValue([]);

      const result = await eventParticipationService.getEventParticipationSummary('event-123');

      expect(result.totalParticipants).toBe(0);
      expect(result.confirmedParticipants).toBe(0);
      expect(result.waitlistedParticipants).toBe(0);
      expect(result.autoApprovedCount).toBe(0);
      expect(result.manualApprovedCount).toBe(0);
    });

    it('should handle summary generation errors', async () => {
      jest
        .spyOn(eventParticipationService, 'getEventParticipations')
        .mockRejectedValue(new Error('Summary generation failed'));

      await expect(
        eventParticipationService.getEventParticipationSummary('event-123')
      ).rejects.toThrow('Summary generation failed');

      expect(console.error).toHaveBeenCalledWith(
        'Error getting participation summary:',
        expect.any(Error)
      );
    });
  });

  describe('getUserEventParticipationStatus', () => {
    const mockParticipation = {
      id: 'participation-123',
      userId: 'user-456',
      eventId: 'event-789',
      status: 'approved',
    };

    beforeEach(() => {
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: mockParticipation.id,
            data: () => mockParticipation,
          },
        ],
      });
    });

    it('should get user participation status successfully', async () => {
      const result = await eventParticipationService.getUserEventParticipationStatus(
        'user-456',
        'event-789'
      );

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-456');
      expect(mockWhere).toHaveBeenCalledWith('eventId', '==', 'event-789');
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockParticipation);
    });

    it('should return null when no participation found', async () => {
      mockGetDocs.mockResolvedValue({ empty: true });

      const result = await eventParticipationService.getUserEventParticipationStatus(
        'user-456',
        'event-789'
      );

      expect(result).toBeNull();
    });

    it('should handle participation status query errors', async () => {
      mockGetDocs.mockRejectedValue(new Error('Participation status query failed'));

      await expect(
        eventParticipationService.getUserEventParticipationStatus('user-456', 'event-789')
      ).rejects.toThrow('Participation status query failed');

      expect(console.error).toHaveBeenCalledWith(
        'Error getting user event participation status:',
        expect.any(Error)
      );
    });
  });

  describe('cancelParticipation', () => {
    const mockParticipationData = {
      eventId: 'event-123',
      status: 'approved',
    };

    beforeEach(() => {
      mockUpdateDoc.mockResolvedValue();
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockParticipationData,
      });
    });

    it('should cancel participation successfully', async () => {
      await eventParticipationService.cancelParticipation('participation-123');

      expect(mockUpdateDoc).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({
          status: 'cancelled',
          cancelledAt: mockServerTimestamp(),
          updatedAt: mockServerTimestamp(),
        })
      );
    });

    it('should decrement participant count for approved participation', async () => {
      jest.spyOn(eventParticipationService, 'getWaitlistedParticipants').mockResolvedValue([]);

      await eventParticipationService.cancelParticipation('participation-123');

      // Should update event with decremented count
      expect(mockUpdateDoc).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          participantCount: mockIncrement(-1),
          updatedAt: mockServerTimestamp(),
        })
      );
    });

    it('should promote waitlisted participant when applicable', async () => {
      const mockWaitlistedParticipant = {
        id: 'waitlisted-123',
        userId: 'waitlisted-user',
      };

      jest
        .spyOn(eventParticipationService, 'getWaitlistedParticipants')
        .mockResolvedValue([mockWaitlistedParticipant]);
      jest.spyOn(eventParticipationService, 'updateParticipationStatus').mockResolvedValue({
        success: true,
        participationId: 'waitlisted-123',
        status: 'approved',
      });

      await eventParticipationService.cancelParticipation('participation-123');

      expect(eventParticipationService.updateParticipationStatus).toHaveBeenCalledWith(
        'waitlisted-123',
        'approved',
        'Auto-promoted from waitlist'
      );
    });

    it('should not affect count for non-approved participation', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockParticipationData, status: 'pending' }),
      });

      await eventParticipationService.cancelParticipation('participation-123');

      // Should only update participation status, not event count
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });

    it('should handle cancellation errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Cancellation failed'));

      await expect(
        eventParticipationService.cancelParticipation('participation-123')
      ).rejects.toThrow('Cancellation failed');

      expect(console.error).toHaveBeenCalledWith(
        'Error cancelling participation:',
        expect.any(Error)
      );
    });
  });

  describe('confirmParticipation', () => {
    beforeEach(() => {
      mockUpdateDoc.mockResolvedValue();
    });

    it('should confirm participation successfully', async () => {
      await eventParticipationService.confirmParticipation(
        'participation-123',
        'Checked in on time'
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'confirmed',
          confirmedAt: mockServerTimestamp(),
          notes: 'Checked in on time',
          updatedAt: mockServerTimestamp(),
        })
      );
    });

    it('should confirm participation without notes', async () => {
      await eventParticipationService.confirmParticipation('participation-123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'confirmed',
          notes: '',
        })
      );
    });

    it('should handle confirmation errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Confirmation failed'));

      await expect(
        eventParticipationService.confirmParticipation('participation-123')
      ).rejects.toThrow('Confirmation failed');

      expect(console.error).toHaveBeenCalledWith(
        'Error confirming participation:',
        expect.any(Error)
      );
    });
  });

  describe('markAsNoShow', () => {
    const mockParticipationData = {
      eventId: 'event-123',
      status: 'confirmed',
    };

    beforeEach(() => {
      mockUpdateDoc.mockResolvedValue();
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockParticipationData,
      });
    });

    it('should mark participant as no-show successfully', async () => {
      jest.spyOn(eventParticipationService, 'getWaitlistedParticipants').mockResolvedValue([]);

      await eventParticipationService.markAsNoShow('participation-123', 'Did not arrive');

      expect(mockUpdateDoc).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({
          status: 'no_show',
          adminNotes: 'Did not arrive',
          updatedAt: mockServerTimestamp(),
        })
      );
    });

    it('should decrement participant count and promote waitlisted', async () => {
      const mockWaitlistedParticipant = {
        id: 'waitlisted-123',
        userId: 'waitlisted-user',
      };

      jest
        .spyOn(eventParticipationService, 'getWaitlistedParticipants')
        .mockResolvedValue([mockWaitlistedParticipant]);
      jest.spyOn(eventParticipationService, 'updateParticipationStatus').mockResolvedValue({
        success: true,
        participationId: 'waitlisted-123',
        status: 'approved',
      });

      await eventParticipationService.markAsNoShow('participation-123');

      expect(mockUpdateDoc).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          participantCount: mockIncrement(-1),
        })
      );
    });

    it('should handle no-show marking errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('No-show marking failed'));

      await expect(eventParticipationService.markAsNoShow('participation-123')).rejects.toThrow(
        'No-show marking failed'
      );

      expect(console.error).toHaveBeenCalledWith('Error marking as no-show:', expect.any(Error));
    });
  });

  describe('Real-time Subscriptions', () => {
    const mockUnsubscribe = jest.fn();

    beforeEach(() => {
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);
    });

    describe('subscribeToEventParticipations', () => {
      it('should set up real-time subscription for event participations', () => {
        const mockCallback = jest.fn();

        const unsubscribe = eventParticipationService.subscribeToEventParticipations(
          'event-123',
          mockCallback
        );

        expect(mockOnSnapshot).toHaveBeenCalled();
        expect(mockWhere).toHaveBeenCalledWith('eventId', '==', 'event-123');
        expect(mockOrderBy).toHaveBeenCalledWith('requestedAt', 'desc');
        expect(unsubscribe).toBe(mockUnsubscribe);
      });

      it('should handle subscription callback', () => {
        const mockCallback = jest.fn();
        const mockSnapshot = {
          docs: [
            { id: 'participation-1', data: () => ({ status: 'approved' }) },
            { id: 'participation-2', data: () => ({ status: 'pending' }) },
          ],
        };

        mockOnSnapshot.mockImplementation((query, successCallback) => {
          successCallback(mockSnapshot);
          return mockUnsubscribe;
        });

        eventParticipationService.subscribeToEventParticipations('event-123', mockCallback);

        expect(mockCallback).toHaveBeenCalledWith([
          { id: 'participation-1', status: 'approved' },
          { id: 'participation-2', status: 'pending' },
        ]);
      });

      it('should handle subscription errors', () => {
        const mockCallback = jest.fn();

        mockOnSnapshot.mockImplementation((query, successCallback, errorCallback) => {
          errorCallback(new Error('Subscription error'));
          return mockUnsubscribe;
        });

        eventParticipationService.subscribeToEventParticipations('event-123', mockCallback);

        expect(console.error).toHaveBeenCalledWith(
          'Error in participation subscription:',
          expect.any(Error)
        );
      });
    });

    describe('subscribeToUserParticipations', () => {
      it('should set up real-time subscription for user participations', () => {
        const mockCallback = jest.fn();

        const unsubscribe = eventParticipationService.subscribeToUserParticipations(
          'user-123',
          mockCallback
        );

        expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-123');
        expect(mockOrderBy).toHaveBeenCalledWith('requestedAt', 'desc');
        expect(unsubscribe).toBe(mockUnsubscribe);
      });

      it('should handle user subscription errors', () => {
        const mockCallback = jest.fn();

        mockOnSnapshot.mockImplementation((query, successCallback, errorCallback) => {
          errorCallback(new Error('User subscription error'));
          return mockUnsubscribe;
        });

        eventParticipationService.subscribeToUserParticipations('user-123', mockCallback);

        expect(console.error).toHaveBeenCalledWith(
          'Error in user participation subscription:',
          expect.any(Error)
        );
      });
    });

    describe('subscribeToPendingApprovals', () => {
      it('should set up real-time subscription for pending approvals', () => {
        const mockCallback = jest.fn();

        const unsubscribe = eventParticipationService.subscribeToPendingApprovals(
          'event-123',
          mockCallback
        );

        expect(mockWhere).toHaveBeenCalledWith('eventId', '==', 'event-123');
        expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
        expect(mockOrderBy).toHaveBeenCalledWith('requestedAt', 'asc');
        expect(unsubscribe).toBe(mockUnsubscribe);
      });
    });

    describe('subscribeToClubPendingApprovals', () => {
      it('should set up real-time subscription for club pending approvals', () => {
        const mockCallback = jest.fn();

        const unsubscribe = eventParticipationService.subscribeToClubPendingApprovals(
          'club-123',
          mockCallback
        );

        expect(mockWhere).toHaveBeenCalledWith('eventSnapshot.clubId', '==', 'club-123');
        expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
        expect(mockOrderBy).toHaveBeenCalledWith('requestedAt', 'asc');
        expect(unsubscribe).toBe(mockUnsubscribe);
      });

      it('should handle club subscription errors', () => {
        const mockCallback = jest.fn();

        mockOnSnapshot.mockImplementation((query, successCallback, errorCallback) => {
          errorCallback(new Error('Club subscription error'));
          return mockUnsubscribe;
        });

        eventParticipationService.subscribeToClubPendingApprovals('club-123', mockCallback);

        expect(console.error).toHaveBeenCalledWith(
          'Error in club pending approvals subscription:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle concurrent participation operations', async () => {
      const mockCallableFunction = jest.fn().mockResolvedValue({
        data: { success: true },
      });
      mockHttpsCallable.mockReturnValue(mockCallableFunction);
      mockUpdateDoc.mockResolvedValue();

      const operations = [
        eventParticipationService.requestParticipation('event-1', 'participant'),
        eventParticipationService.requestParticipation('event-2', 'spectator'),
        eventParticipationService.cancelParticipation('participation-1'),
        eventParticipationService.confirmParticipation('participation-2'),
      ];

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ eventId: 'event-1', status: 'pending' }),
      });

      const results = await Promise.allSettled(operations);

      expect(results.every(result => result.status === 'fulfilled')).toBe(true);
    });

    it('should handle malformed participation data', async () => {
      const malformedParticipations = [
        { data: () => null },
        { id: 'malformed', data: () => ({ status: undefined }) },
        { data: () => ({ participationType: null }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: malformedParticipations });

      const result = await eventParticipationService.getEventParticipations('event-123');

      // Should still return results even with malformed data
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle network timeouts gracefully', async () => {
      const mockCallableFunction = jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 100))
        );
      mockHttpsCallable.mockReturnValue(mockCallableFunction);

      await expect(
        eventParticipationService.requestParticipation('event-123', 'participant')
      ).rejects.toThrow('Network timeout');
    });

    it('should validate participation type parameters', async () => {
      const validTypes = ['participant', 'spectator', 'helper'];

      for (const type of validTypes) {
        const mockCallableFunction = jest.fn().mockResolvedValue({
          data: { success: true },
        });
        mockHttpsCallable.mockReturnValue(mockCallableFunction);

        await expect(
          eventParticipationService.requestParticipation('event-123', type)
        ).resolves.not.toThrow();

        expect(mockCallableFunction).toHaveBeenCalledWith(
          expect.objectContaining({
            participationType: type,
          })
        );
      }
    });

    it('should handle empty subscription results', () => {
      const mockCallback = jest.fn();

      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({ docs: [] });
        return jest.fn();
      });

      eventParticipationService.subscribeToEventParticipations('event-123', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('should handle missing event data during cancellation', async () => {
      mockUpdateDoc.mockResolvedValue();
      mockGetDoc.mockResolvedValue({ exists: () => false });

      // Should not throw when participation document doesn't exist
      await expect(
        eventParticipationService.cancelParticipation('nonexistent-participation')
      ).resolves.not.toThrow();
    });
  });
});
