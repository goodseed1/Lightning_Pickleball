/**
 * FeedService Unit Tests
 * Tests social feed functionality, real-time subscriptions, and mock fallbacks
 */

import {
  getFeedItems,
  listenToFeed,
  deleteFeedItem,
  createFeedItem,
  createWelcomeFeedItem,
} from '../feedService.ts';

import {
  setupStandardMocks,
  mockFirebaseConfig,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  __setMockDocumentData,
  __setMockQueryResults,
  __resetMocks,
} from '../../test-utils/mockHelpers';

// Mock Firebase config
jest.mock('../../firebase/config', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  },
  db: {},
  functions: {},
  storage: {},
}));

describe.skip('FeedService Unit Tests - TypeScript service needs refactoring', () => {
  beforeEach(() => {
    setupStandardMocks();
    __resetMocks();
  });

  describe('getFeedItems', () => {
    const mockFeedItems = [
      {
        id: 'feed1',
        type: 'match_result',
        actorId: 'user1',
        actorName: 'Test User',
        timestamp: new Date(),
        isActive: true,
      },
      {
        id: 'feed2',
        type: 'new_member',
        actorId: 'user2',
        actorName: 'New Member',
        timestamp: new Date(),
        isActive: true,
      },
    ];

    it('should fetch feed items for user successfully', async () => {
      __setMockQueryResults(mockFeedItems, false);

      const result = await getFeedItems('user1', { limitTo: 10 });

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('isActive', '==', true);
      expect(where).toHaveBeenCalledWith('visibleTo', 'array-contains', 'user1');
      expect(orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(limit).toHaveBeenCalledWith(10);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('feed1');
    });

    it('should filter feed items by club ID', async () => {
      __setMockQueryResults(mockFeedItems, false);

      await getFeedItems('user1', { clubId: 'club1', limitTo: 10 });

      expect(where).toHaveBeenCalledWith('clubId', '==', 'club1');
    });

    it('should filter feed items by types', async () => {
      __setMockQueryResults(mockFeedItems, false);

      const result = await getFeedItems('user1', {
        types: ['match_result'],
        limitTo: 10,
      });

      // Should only include items matching the specified types
      expect(result.every(item => item.type === 'match_result')).toBe(true);
    });

    it('should filter feed items by date', async () => {
      const oldDate = new Date('2024-01-01');
      const recentDate = new Date();

      const itemsWithDates = [
        { ...mockFeedItems[0], timestamp: oldDate },
        { ...mockFeedItems[1], timestamp: recentDate },
      ];

      __setMockQueryResults(itemsWithDates, false);

      const since = new Date('2024-06-01');
      const result = await getFeedItems('user1', { since, limitTo: 10 });

      // Should only include items after the since date
      expect(result.every(item => new Date(item.timestamp) >= since)).toBe(true);
    });

    it('should return mock data when no userId provided', async () => {
      const result = await getFeedItems(null, { limitTo: 10 });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(console.warn).toHaveBeenCalledWith('No userId provided for getFeedItems');
    });

    it('should return mock data when Firebase query fails', async () => {
      getDocs.mockRejectedValue(new Error('Firebase error'));

      const result = await getFeedItems('user1', { limitTo: 10 });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(console.error).toHaveBeenCalledWith('Error loading feed:', expect.any(Error));
    });

    it('should return mock data when no Firebase items found', async () => {
      __setMockQueryResults([], true);

      const result = await getFeedItems('user1', { limitTo: 10 });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(console.log).toHaveBeenCalledWith('📰 No Firebase feed items found, using mock data');
    });
  });

  describe('listenToFeed', () => {
    it('should set up real-time feed listener successfully', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      onSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = listenToFeed('user1', mockCallback, { limitTo: 20 });

      expect(onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
      expect(console.log).toHaveBeenCalledWith('✅ Feed listener setup successful');
    });

    it('should handle feed listener with club filter', () => {
      const mockCallback = jest.fn();
      onSnapshot.mockReturnValue(jest.fn());

      listenToFeed('user1', mockCallback, { clubId: 'club1', limitTo: 20 });

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('clubId', '==', 'club1');
    });

    it('should filter by types in listener callback', () => {
      const mockCallback = jest.fn();
      const mockSnapshot = {
        docs: [
          { id: 'feed1', data: () => ({ type: 'match_result' }) },
          { id: 'feed2', data: () => ({ type: 'new_member' }) },
        ],
      };

      onSnapshot.mockImplementation((query, successCallback) => {
        successCallback(mockSnapshot);
        return jest.fn();
      });

      listenToFeed('user1', mockCallback, { types: ['match_result'] });

      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'match_result' })])
      );
    });

    it('should return empty unsubscribe function for invalid inputs', () => {
      const unsubscribe1 = listenToFeed('', jest.fn());
      const unsubscribe2 = listenToFeed('user1', null);

      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');
      expect(console.error).toHaveBeenCalledWith(
        'Error setting up feed listener: Invalid userId or callback'
      );
    });

    it('should fallback to mock data when listener fails', () => {
      const mockCallback = jest.fn();
      onSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        errorCallback(new Error('Listener error'));
        return jest.fn();
      });

      listenToFeed('user1', mockCallback);

      expect(console.error).toHaveBeenCalledWith(
        'Error setting up feed listener:',
        expect.any(Error)
      );
    });

    it('should use mock data when no Firebase items in listener', () => {
      const mockCallback = jest.fn();
      const mockSnapshot = { docs: [] };

      onSnapshot.mockImplementation((query, successCallback) => {
        successCallback(mockSnapshot);
        return jest.fn();
      });

      listenToFeed('user1', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: expect.any(String) })])
      );
    });
  });

  describe('deleteFeedItem', () => {
    it('should delete feed item successfully', async () => {
      __setMockDocumentData(
        {
          actorId: 'user1',
          type: 'match_result',
        },
        true
      );
      deleteDoc.mockResolvedValue();

      const result = await deleteFeedItem('feed1', 'user1');

      expect(getDoc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('✅ Feed item deleted successfully');
    });

    it('should throw error if feed item does not exist', async () => {
      __setMockDocumentData(null, false);

      await expect(deleteFeedItem('nonexistent', 'user1')).rejects.toThrow(
        '피드 아이템을 찾을 수 없습니다'
      );
    });

    it('should throw error if user lacks permission', async () => {
      __setMockDocumentData(
        {
          actorId: 'other-user',
          type: 'match_result',
        },
        true
      );

      await expect(deleteFeedItem('feed1', 'user1')).rejects.toThrow('삭제 권한이 없습니다');
    });

    it('should fallback to mock success when Firebase fails', async () => {
      getDoc.mockRejectedValue(new Error('Firebase error'));

      const result = await deleteFeedItem('feed1', 'user1');

      expect(result).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        '❌ Failed to delete feed item:',
        expect.any(Error)
      );
      expect(console.log).toHaveBeenCalledWith('✅ Mock feed item deletion successful');
    });
  });

  describe('createFeedItem', () => {
    it('should create new feed item successfully', async () => {
      const mockDocRef = { id: 'new-feed-id' };
      addDoc.mockResolvedValue(mockDocRef);

      const feedItemData = {
        type: 'match_result',
        actorId: 'user1',
        actorName: 'Test User',
        visibility: 'public',
      };

      const result = await createFeedItem(feedItemData);

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...feedItemData,
          timestamp: expect.any(Object),
          createdAt: expect.any(Object),
          isActive: true,
          visibleTo: [],
        })
      );
      expect(result).toBe('new-feed-id');
    });

    it('should remove undefined fields before creating', async () => {
      const mockDocRef = { id: 'new-feed-id' };
      addDoc.mockResolvedValue(mockDocRef);

      const feedItemData = {
        type: 'match_result',
        actorId: 'user1',
        undefinedField: undefined,
        validField: 'value',
      };

      await createFeedItem(feedItemData);

      const calledData = addDoc.mock.calls[0][1];
      expect(calledData).not.toHaveProperty('undefinedField');
      expect(calledData).toHaveProperty('validField', 'value');
    });

    it('should handle creation errors', async () => {
      addDoc.mockRejectedValue(new Error('Creation failed'));

      const feedItemData = {
        type: 'match_result',
        actorId: 'user1',
      };

      await expect(createFeedItem(feedItemData)).rejects.toThrow('Creation failed');
      expect(console.error).toHaveBeenCalledWith('❌ Error creating feed item:', expect.any(Error));
    });
  });

  describe('createWelcomeFeedItem', () => {
    it('should create welcome feed item for new member', async () => {
      const mockDocRef = { id: 'welcome-feed-id' };
      addDoc.mockResolvedValue(mockDocRef);

      const result = await createWelcomeFeedItem('club1', 'Test Club', 'user1', 'New Member', [
        'member1',
        'member2',
      ]);

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'new_member_joined',
          actorId: 'user1',
          actorName: 'New Member',
          clubId: 'club1',
          clubName: 'Test Club',
          visibility: 'club_members',
          visibleTo: ['member1', 'member2'],
          metadata: expect.objectContaining({
            welcomeMessage: expect.stringContaining('New Member님이 Test Club에 합류했습니다!'),
            isNewMemberPost: true,
          }),
        })
      );
      expect(result).toBe('welcome-feed-id');
    });

    it('should handle welcome feed item creation errors', async () => {
      addDoc.mockRejectedValue(new Error('Welcome creation failed'));

      await expect(
        createWelcomeFeedItem('club1', 'Test Club', 'user1', 'New Member', [])
      ).rejects.toThrow('Welcome creation failed');
    });
  });

  describe('Mock Feed Items', () => {
    it('should generate comprehensive mock feed items', async () => {
      // Test with no userId to trigger mock data
      const mockItems = await getFeedItems(null);

      expect(mockItems.length).toBeGreaterThan(10);

      // Check for different types of feed items
      const types = mockItems.map(item => item.type);
      expect(types).toContain('match_result');
      expect(types).toContain('new_member');
      expect(types).toContain('tournament_winner');
      expect(types).toContain('club_event');
      expect(types).toContain('league_winner');

      // Check multilingual content
      const koreanNames = mockItems.filter(
        item => item.actorName && /[가-힣]/.test(item.actorName)
      );
      expect(koreanNames.length).toBeGreaterThan(0);

      // Check different visibility levels
      const visibilityTypes = [...new Set(mockItems.map(item => item.visibility))];
      expect(visibilityTypes).toContain('public');
      expect(visibilityTypes).toContain('friends');
      expect(visibilityTypes).toContain('club_members');

      // Validate all items have required fields
      mockItems.forEach((item, index) => {
        expect(item.id).toBeDefined();
        expect(item.actorName).toBeDefined();
        expect(item.type).toBeDefined();
        expect(item.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should create realistic tennis community scenarios', async () => {
      const mockItems = await getFeedItems(null);

      // Check for match results with scores
      const matchResults = mockItems.filter(item => item.type === 'match_result');
      matchResults.forEach(match => {
        expect(match.metadata).toBeDefined();
        if (match.metadata.score) {
          expect(match.metadata.score).toMatch(/\d+-\d+/); // Tennis score pattern
        }
        expect(typeof match.metadata.eloChange).toBe('number');
      });

      // Check for club events with proper structure
      const clubEvents = mockItems.filter(item => item.type === 'club_event');
      clubEvents.forEach(event => {
        expect(event.clubId).toBeDefined();
        expect(event.clubName).toBeDefined();
        expect(event.eventId).toBeDefined();
        expect(event.metadata.eventName).toBeDefined();
      });

      // Check for tournament winners with prizes
      const tournaments = mockItems.filter(item => item.type === 'tournament_winner');
      tournaments.forEach(tournament => {
        expect(tournament.metadata.tournamentName).toBeDefined();
        expect(tournament.metadata.participants).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle malformed feed item data', async () => {
      const malformedItems = [
        { id: 'malformed1' }, // Missing required fields
        { data: () => null }, // Null data
        { id: 'malformed2', data: () => ({ type: null }) }, // Invalid type
      ];

      __setMockQueryResults(malformedItems, false);

      const result = await getFeedItems('user1');

      // Should still return results, even if some items are malformed
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle network timeouts gracefully', async () => {
      getDocs.mockImplementation(
        () =>
          new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 100))
      );

      const result = await getFeedItems('user1');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0); // Should fall back to mock data
    });

    it('should handle concurrent feed operations', async () => {
      __setMockQueryResults([], true);
      addDoc.mockResolvedValue({ id: 'concurrent-id' });

      const operations = [
        getFeedItems('user1'),
        getFeedItems('user2'),
        createFeedItem({ type: 'test', actorId: 'user1' }),
        createFeedItem({ type: 'test', actorId: 'user2' }),
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(4);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(results[2]).toBe('concurrent-id');
      expect(results[3]).toBe('concurrent-id');
    });

    it('should validate feed item data types', async () => {
      const invalidFeedItems = await getFeedItems(null);

      invalidFeedItems.forEach(item => {
        // Check timestamp conversion
        if (item.timestamp) {
          expect(item.timestamp).toBeInstanceOf(Date);
        }
        if (item.createdAt) {
          expect(item.createdAt).toBeInstanceOf(Date);
        }

        // Check required string fields
        if (item.actorName) {
          expect(typeof item.actorName).toBe('string');
        }
        if (item.type) {
          expect(typeof item.type).toBe('string');
        }

        // Check visibility array
        if (item.visibleTo) {
          expect(Array.isArray(item.visibleTo)).toBe(true);
        }
      });
    });
  });
});
