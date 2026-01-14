/**
 * SocialService Unit Tests
 * Tests friend system, player discovery, activity feed, and social interactions
 */

import socialService from '../socialService.ts';
import {
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  runTransaction,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  collection,
  serverTimestamp,
  __setMockDocumentData,
  __setMockQueryResults,
  __resetMocks,
} from '../../../__mocks__/firebase/firestore.js';
import { _mockCallable, __resetFunctionsMocks } from 'firebase/functions';

// Mock Firebase config
jest.mock('../../firebase/config', () => ({
  db: 'mock-db',
}));

// AuthService is now centrally mocked in __mocks__/services/authService.js
const authService = require('../authService');

// Mock current user data
const mockCurrentUser = {
  uid: 'current-user-123',
  displayName: 'Current User',
  photoURL: 'current-user-photo.jpg',
};

// Mock Social Validators
jest.mock('../../validators/socialValidators', () => ({
  validateFriendArray: jest.fn(data => data),
  validateFriendRequestArray: jest.fn(data => data),
  safeParseFriend: jest.fn(() => ({ success: true })),
  safeParseFriendRequest: jest.fn(() => ({ success: true })),
}));

describe.skip('SocialService Unit Tests - TypeScript service needs refactoring', () => {
  beforeEach(() => {
    __resetMocks();
    __resetFunctionsMocks();
    authService._setMockUser(mockCurrentUser);
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  describe('Friend Request System', () => {
    describe('sendFriendRequest', () => {
      const mockTargetUser = {
        displayName: 'Target User',
        photoURL: 'target-user-photo.jpg',
      };

      beforeEach(() => {
        __setMockDocumentData(mockTargetUser, true);
        addDoc.mockResolvedValue({ id: 'request-123' });
        jest.spyOn(socialService, 'getFriendshipStatus').mockResolvedValue({ status: 'none' });
        jest.spyOn(socialService, 'createNotification').mockResolvedValue();
      });

      it('should send friend request successfully', async () => {
        const result = await socialService.sendFriendRequest('target-user-456', "Let's play!");

        expect(socialService.getFriendshipStatus).toHaveBeenCalledWith('target-user-456');
        expect(getDoc).toHaveBeenCalled();
        expect(addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            senderId: 'current-user-123',
            receiverId: 'target-user-456',
            message: "Let's play!",
            status: 'pending',
            senderInfo: expect.objectContaining({
              displayName: 'Current User',
            }),
            receiverInfo: expect.objectContaining({
              displayName: 'Target User',
            }),
          })
        );
        expect(socialService.createNotification).toHaveBeenCalledWith(
          'target-user-456',
          expect.objectContaining({
            type: 'friend_request',
            title: 'New Friend Request',
          })
        );
        expect(result).toBe('request-123');
      });

      it('should prevent sending request to self', async () => {
        await expect(
          socialService.sendFriendRequest('current-user-123', 'Test message')
        ).rejects.toThrow('Cannot send friend request to yourself');
      });

      it('should prevent duplicate friend requests', async () => {
        jest.spyOn(socialService, 'getFriendshipStatus').mockResolvedValue({ status: 'friends' });

        await expect(
          socialService.sendFriendRequest('target-user-456', 'Test message')
        ).rejects.toThrow('Friendship already exists with status: friends');
      });

      it('should handle target user not found', async () => {
        jest.spyOn(socialService, 'getFriendshipStatus').mockResolvedValue({ status: 'none' });
        getDoc.mockResolvedValue({ exists: () => false });

        await expect(
          socialService.sendFriendRequest('nonexistent-user', 'Test message')
        ).rejects.toThrow('Target user not found');
      });

      it('should handle unauthenticated user', async () => {
        authService._setLoggedOut();

        await expect(
          socialService.sendFriendRequest('target-user-456', 'Test message')
        ).rejects.toThrow('User must be authenticated');
      });

      it('should send request with empty message', async () => {
        await socialService.sendFriendRequest('target-user-456');

        expect(addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            message: '',
          })
        );
      });
    });

    describe('acceptFriendRequest', () => {
      const mockRequestData = {
        senderId: 'sender-123',
        receiverId: 'current-user-123',
        status: 'pending',
        senderInfo: { displayName: 'Sender User' },
        receiverInfo: { displayName: 'Current User' },
      };

      beforeEach(() => {
        runTransaction.mockImplementation(async (db, callback) => {
          const mockTransaction = {
            get: jest.fn().mockResolvedValue({
              exists: () => true,
              data: () => mockRequestData,
            }),
            set: jest.fn(),
            update: jest.fn(),
          };
          await callback(mockTransaction);
        });
      });

      it('should accept friend request successfully', async () => {
        await socialService.acceptFriendRequest('request-123');

        expect(runTransaction).toHaveBeenCalled();
      });

      it('should reject acceptance by wrong user', async () => {
        const wrongReceiverData = { ...mockRequestData, receiverId: 'other-user-456' };

        runTransaction.mockImplementation(async (db, callback) => {
          const mockTransaction = {
            get: jest.fn().mockResolvedValue({
              exists: () => true,
              data: () => wrongReceiverData,
            }),
            set: jest.fn(),
            update: jest.fn(),
          };
          await callback(mockTransaction);
        });

        await expect(socialService.acceptFriendRequest('request-123')).rejects.toThrow(
          'Not authorized to accept this request'
        );
      });

      it('should reject already processed request', async () => {
        const acceptedRequestData = { ...mockRequestData, status: 'accepted' };

        runTransaction.mockImplementation(async (db, callback) => {
          const mockTransaction = {
            get: jest.fn().mockResolvedValue({
              exists: () => true,
              data: () => acceptedRequestData,
            }),
            set: jest.fn(),
            update: jest.fn(),
          };
          await callback(mockTransaction);
        });

        await expect(socialService.acceptFriendRequest('request-123')).rejects.toThrow(
          'Request already accepted'
        );
      });

      it('should handle non-existent request', async () => {
        runTransaction.mockImplementation(async (db, callback) => {
          const mockTransaction = {
            get: jest.fn().mockResolvedValue({ exists: () => false }),
            set: jest.fn(),
            update: jest.fn(),
          };
          await callback(mockTransaction);
        });

        await expect(socialService.acceptFriendRequest('nonexistent-request')).rejects.toThrow(
          'Friend request not found'
        );
      });
    });

    describe('declineFriendRequest', () => {
      const mockRequestData = {
        receiverId: 'current-user-123',
        status: 'pending',
      };

      beforeEach(() => {
        getDoc.mockResolvedValue({
          exists: () => true,
          data: () => mockRequestData,
        });
        updateDoc.mockResolvedValue();
      });

      it('should decline friend request successfully', async () => {
        await socialService.declineFriendRequest('request-123');

        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            status: 'declined',
            respondedAt: serverTimestamp(),
          })
        );
      });

      it('should reject decline by wrong user', async () => {
        const wrongReceiverData = { ...mockRequestData, receiverId: 'other-user-456' };
        getDoc.mockResolvedValue({
          exists: () => true,
          data: () => wrongReceiverData,
        });

        await expect(socialService.declineFriendRequest('request-123')).rejects.toThrow(
          'Not authorized to decline this request'
        );
      });

      it('should handle non-existent request', async () => {
        getDoc.mockResolvedValue({ exists: () => false });

        await expect(socialService.declineFriendRequest('nonexistent-request')).rejects.toThrow(
          'Friend request not found'
        );
      });
    });

    describe('removeFriend', () => {
      beforeEach(() => {
        runTransaction.mockImplementation(async (db, callback) => {
          const mockTransaction = {
            get: jest
              .fn()
              .mockResolvedValueOnce({ exists: () => true }) // friendship1 exists
              .mockResolvedValueOnce({ exists: () => false }), // friendship2 doesn't exist
            delete: jest.fn(),
            update: jest.fn(),
          };
          await callback(mockTransaction);
        });
      });

      it('should remove friend successfully', async () => {
        await socialService.removeFriend('friend-user-456');

        expect(runTransaction).toHaveBeenCalled();
      });

      it('should handle friendship not found', async () => {
        runTransaction.mockImplementation(async (db, callback) => {
          const mockTransaction = {
            get: jest
              .fn()
              .mockResolvedValueOnce({ exists: () => false })
              .mockResolvedValueOnce({ exists: () => false }),
            delete: jest.fn(),
            update: jest.fn(),
          };
          await callback(mockTransaction);
        });

        await expect(socialService.removeFriend('nonexistent-friend')).rejects.toThrow(
          'Friendship not found'
        );
      });
    });
  });

  describe('Friend Queries', () => {
    describe('getFriends', () => {
      const mockFriendsData = [
        {
          user1Id: 'current-user-123',
          user2Id: 'friend-1',
          user1Info: { displayName: 'Current User' },
          user2Info: { displayName: 'Friend One' },
          status: 'active',
          createdAt: new Date(),
        },
        {
          user1Id: 'friend-2',
          user2Id: 'current-user-123',
          user1Info: { displayName: 'Friend Two' },
          user2Info: { displayName: 'Current User' },
          status: 'active',
          createdAt: new Date(),
        },
      ];

      beforeEach(() => {
        getDocs
          .mockResolvedValueOnce({
            docs: [{ id: 'friendship-1', data: () => mockFriendsData[0] }],
          })
          .mockResolvedValueOnce({
            docs: [{ id: 'friendship-2', data: () => mockFriendsData[1] }],
          });
      });

      it('should get friends list successfully', async () => {
        const result = await socialService.getFriends();

        expect(query).toHaveBeenCalled();
        expect(where).toHaveBeenCalledWith('user1Id', '==', 'current-user-123');
        expect(where).toHaveBeenCalledWith('user2Id', '==', 'current-user-123');
        expect(where).toHaveBeenCalledWith('status', '==', 'active');

        expect(result).toHaveLength(2);
        expect(result[0].userId).toBe('friend-1');
        expect(result[1].userId).toBe('friend-2');
      });

      it('should return empty array for unauthenticated user', async () => {
        authService._setLoggedOut();

        const result = await socialService.getFriends();

        expect(result).toEqual([]);
      });

      it('should handle validation errors gracefully', async () => {
        const {
          validateFriendArray,
          safeParseFriend,
        } = require('../../validators/socialValidators');
        validateFriendArray.mockImplementation(() => {
          throw new Error('Validation failed');
        });
        safeParseFriend.mockReturnValue({ success: true });

        const result = await socialService.getFriends();

        expect(result).toBeDefined();
        expect(console.warn).toHaveBeenCalledWith(
          '⚠️ Friend data validation failed:',
          expect.any(Error)
        );
      });
    });

    describe('getIncomingFriendRequests', () => {
      const mockRequests = [
        {
          id: 'request-1',
          senderId: 'sender-1',
          receiverId: 'current-user-123',
          status: 'pending',
          message: "Let's be friends!",
        },
        {
          id: 'request-2',
          senderId: 'sender-2',
          receiverId: 'current-user-123',
          status: 'pending',
          message: 'Want to play tennis?',
        },
      ];

      beforeEach(() => {
        getDocs.mockResolvedValue({
          docs: mockRequests.map(request => ({
            id: request.id,
            data: () => request,
          })),
        });
      });

      it('should get incoming friend requests successfully', async () => {
        const result = await socialService.getIncomingFriendRequests();

        expect(where).toHaveBeenCalledWith('receiverId', '==', 'current-user-123');
        expect(where).toHaveBeenCalledWith('status', '==', 'pending');
        expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');

        expect(result).toHaveLength(2);
        expect(result[0].senderId).toBe('sender-1');
        expect(result[1].senderId).toBe('sender-2');
      });

      it('should return empty array for unauthenticated user', async () => {
        authService._setLoggedOut();

        const result = await socialService.getIncomingFriendRequests();

        expect(result).toEqual([]);
      });

      it('should handle validation errors gracefully', async () => {
        const {
          validateFriendRequestArray,
          safeParseFriendRequest,
        } = require('../../validators/socialValidators');
        validateFriendRequestArray.mockImplementation(() => {
          throw new Error('Request validation failed');
        });
        safeParseFriendRequest.mockReturnValue({ success: true });

        const result = await socialService.getIncomingFriendRequests();

        expect(result).toBeDefined();
        expect(console.warn).toHaveBeenCalledWith(
          '⚠️ Friend request data validation failed:',
          expect.any(Error)
        );
      });
    });

    describe('getFriendshipStatus', () => {
      it('should return self status for same user', async () => {
        const result = await socialService.getFriendshipStatus('current-user-123');

        expect(result).toEqual({ status: 'self' });
      });

      it('should return none status for unauthenticated user', async () => {
        authService._setLoggedOut();

        const result = await socialService.getFriendshipStatus('other-user-456');

        expect(result).toEqual({ status: 'none' });
      });

      it('should return friends status when friendship exists', async () => {
        const mockFriendshipData = {
          status: 'active',
          createdAt: new Date('2024-01-01'),
        };

        getDoc
          .mockResolvedValueOnce({ exists: () => true, data: () => mockFriendshipData })
          .mockResolvedValueOnce({ exists: () => false });

        const result = await socialService.getFriendshipStatus('friend-user-456');

        expect(result.status).toBe('friends');
        expect(result.since).toEqual(mockFriendshipData.createdAt);
      });

      it('should return request_sent when outgoing request exists', async () => {
        getDoc
          .mockResolvedValueOnce({ exists: () => false })
          .mockResolvedValueOnce({ exists: () => false });

        getDocs
          .mockResolvedValueOnce({ empty: false, docs: [{ id: 'request-123' }] })
          .mockResolvedValueOnce({ empty: true });

        const result = await socialService.getFriendshipStatus('target-user-456');

        expect(result.status).toBe('request_sent');
        expect(result.requestId).toBe('request-123');
      });

      it('should return request_received when incoming request exists', async () => {
        getDoc
          .mockResolvedValueOnce({ exists: () => false })
          .mockResolvedValueOnce({ exists: () => false });

        getDocs
          .mockResolvedValueOnce({ empty: true })
          .mockResolvedValueOnce({ empty: false, docs: [{ id: 'incoming-request-456' }] });

        const result = await socialService.getFriendshipStatus('sender-user-789');

        expect(result.status).toBe('request_received');
        expect(result.requestId).toBe('incoming-request-456');
      });

      it('should return none when no relationship exists', async () => {
        getDoc
          .mockResolvedValueOnce({ exists: () => false })
          .mockResolvedValueOnce({ exists: () => false });

        getDocs.mockResolvedValueOnce({ empty: true }).mockResolvedValueOnce({ empty: true });

        const result = await socialService.getFriendshipStatus('stranger-user-999');

        expect(result).toEqual({ status: 'none' });
      });

      it('should return error status when operation fails', async () => {
        getDoc.mockRejectedValue(new Error('Database error'));

        const result = await socialService.getFriendshipStatus('some-user-123');

        expect(result).toEqual({ status: 'error' });
        expect(console.error).toHaveBeenCalledWith(
          '❌ Failed to get friendship status:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Player Discovery', () => {
    describe('getPlayerRecommendations', () => {
      const mockRecommendations = [
        {
          userId: 'rec-user-1',
          displayName: 'Recommended Player 1',
          skillLevel: 'intermediate',
          matchScore: 85,
        },
        {
          userId: 'rec-user-2',
          displayName: 'Recommended Player 2',
          skillLevel: 'advanced',
          matchScore: 78,
        },
      ];

      beforeEach(() => {
        const mockCallableFunction = jest.fn().mockResolvedValue({
          data: {
            success: true,
            recommendations: mockRecommendations,
          },
        });
        httpsCallable.mockReturnValue(mockCallableFunction);
      });

      it('should get player recommendations successfully', async () => {
        const options = {
          maxDistance: 25,
          skillLevelRange: ['intermediate', 'advanced'],
          preferredLanguages: ['en', 'ko'],
        };

        const result = await socialService.getPlayerRecommendations(options);

        expect(_mockCallable).toHaveBeenCalledWith({
          maxDistance: 25,
          skillLevelRange: ['intermediate', 'advanced'],
          preferredLanguages: ['en', 'ko'],
        });
        expect(result).toEqual(mockRecommendations);
      });

      it('should use default options when none provided', async () => {
        await socialService.getPlayerRecommendations();

        expect(_mockCallable).toHaveBeenCalledWith({
          maxDistance: 50,
          skillLevelRange: undefined,
          preferredLanguages: undefined,
        });
      });

      it('should handle failed recommendations from server', async () => {
        const mockCallableFunction = jest.fn().mockResolvedValue({
          data: { success: false },
        });
        httpsCallable.mockReturnValue(mockCallableFunction);

        await expect(socialService.getPlayerRecommendations()).rejects.toThrow(
          'Failed to get recommendations from server'
        );
      });

      it('should handle unauthenticated user', async () => {
        authService._setLoggedOut();

        await expect(socialService.getPlayerRecommendations()).rejects.toThrow(
          'User must be authenticated'
        );
      });

      it('should handle cloud function errors', async () => {
        const mockCallableFunction = jest.fn().mockRejectedValue(new Error('Cloud function error'));
        httpsCallable.mockReturnValue(mockCallableFunction);

        await expect(socialService.getPlayerRecommendations()).rejects.toThrow(
          'Cloud function error'
        );

        expect(console.error).toHaveBeenCalledWith(
          '❌ Failed to get player recommendations:',
          expect.any(Error)
        );
      });
    });

    describe('searchPlayers', () => {
      const mockPlayers = [
        {
          id: 'player-1',
          isOnboardingComplete: true,
          profile: {
            skillLevel: 'intermediate',
            preferredLanguage: 'en',
          },
          displayName: 'Player One',
        },
        {
          id: 'player-2',
          isOnboardingComplete: true,
          profile: {
            skillLevel: 'advanced',
            preferredLanguage: 'ko',
          },
          displayName: 'Player Two',
        },
      ];

      beforeEach(() => {
        getDocs.mockResolvedValue({
          docs: mockPlayers.map(player => ({
            id: player.id,
            data: () => player,
          })),
        });
      });

      it('should search players with no filters', async () => {
        const result = await socialService.searchPlayers();

        expect(where).toHaveBeenCalledWith('isOnboardingComplete', '==', true);
        expect(limit).toHaveBeenCalledWith(20);
        expect(result).toHaveLength(2);
        expect(result[0].userId).toBe('player-1');
        expect(result[1].userId).toBe('player-2');
      });

      it('should search players with skill level filter', async () => {
        await socialService.searchPlayers({ skillLevel: 'intermediate' });

        expect(where).toHaveBeenCalledWith('profile.skillLevel', '==', 'intermediate');
      });

      it('should search players with language filter', async () => {
        await socialService.searchPlayers({ preferredLanguage: 'ko' });

        expect(where).toHaveBeenCalledWith('profile.preferredLanguage', '==', 'ko');
      });

      it('should search players with activity region filter', async () => {
        await socialService.searchPlayers({ activityRegion: 'Atlanta' });

        expect(where).toHaveBeenCalledWith('profile.activityRegions', 'array-contains', 'Atlanta');
      });

      it('should exclude current user from results', async () => {
        const playersIncludingSelf = [
          ...mockPlayers,
          {
            id: 'current-user-123',
            isOnboardingComplete: true,
            displayName: 'Current User',
          },
        ];

        getDocs.mockResolvedValue({
          docs: playersIncludingSelf.map(player => ({
            id: player.id,
            data: () => player,
          })),
        });

        const result = await socialService.searchPlayers();

        expect(result).toHaveLength(2);
        expect(result.every(player => player.userId !== 'current-user-123')).toBe(true);
      });

      it('should handle unauthenticated user', async () => {
        authService._setLoggedOut();

        await expect(socialService.searchPlayers()).rejects.toThrow('User must be authenticated');
      });

      it('should handle search errors', async () => {
        getDocs.mockRejectedValue(new Error('Search failed'));

        await expect(socialService.searchPlayers()).rejects.toThrow('Search failed');

        expect(console.error).toHaveBeenCalledWith(
          '❌ Failed to search players:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Activity Feed', () => {
    describe('getActivityFeed', () => {
      const mockFeedItems = [
        {
          id: 'activity-1',
          type: 'match_completed',
          title: 'Match Completed',
          timestamp: new Date('2024-01-15'),
        },
        {
          id: 'activity-2',
          type: 'friend_joined',
          title: 'Friend Joined',
          timestamp: new Date('2024-01-14'),
        },
      ];

      beforeEach(() => {
        getDocs.mockResolvedValue({
          docs: mockFeedItems.map(item => ({
            id: item.id,
            data: () => item,
          })),
        });
      });

      it('should get activity feed successfully', async () => {
        const result = await socialService.getActivityFeed(10);

        expect(collection).toHaveBeenCalledWith(
          'mock-db',
          'activityFeed',
          'current-user-123',
          'items'
        );
        expect(orderBy).toHaveBeenCalledWith('timestamp', 'desc');
        expect(limit).toHaveBeenCalledWith(10);
        expect(result).toEqual(mockFeedItems);
      });

      it('should use default limit when none provided', async () => {
        await socialService.getActivityFeed();

        expect(limit).toHaveBeenCalledWith(20);
      });

      it('should return empty array for unauthenticated user', async () => {
        authService._setLoggedOut();

        const result = await socialService.getActivityFeed();

        expect(result).toEqual([]);
      });

      it('should handle activity feed errors', async () => {
        getDocs.mockRejectedValue(new Error('Activity feed error'));

        await expect(socialService.getActivityFeed()).rejects.toThrow('Activity feed error');

        expect(console.error).toHaveBeenCalledWith(
          '❌ Failed to get activity feed:',
          expect.any(Error)
        );
      });
    });

    describe('createFriendActivity', () => {
      const mockFriends = [{ userId: 'friend-1' }, { userId: 'friend-2' }];

      const activityData = {
        type: 'match_completed',
        title: 'Just finished a great match!',
        description: 'Beat my opponent 6-4, 6-2',
        metadata: { score: '6-4, 6-2' },
      };

      beforeEach(() => {
        jest.spyOn(socialService, 'getFriends').mockResolvedValue(mockFriends);
        _mockCallable.mockResolvedValue({
          data: { success: true },
        });
      });

      it('should create activity for friends successfully', async () => {
        await socialService.createFriendActivity(activityData);

        expect(_mockCallable).toHaveBeenCalledWith({
          type: 'match_completed',
          targetUserIds: ['friend-1', 'friend-2'],
          title: 'Just finished a great match!',
          description: 'Beat my opponent 6-4, 6-2',
          metadata: { score: '6-4, 6-2' },
        });
      });

      it('should handle no friends case', async () => {
        jest.spyOn(socialService, 'getFriends').mockResolvedValue([]);

        await socialService.createFriendActivity(activityData);

        expect(console.log).toHaveBeenCalledWith('No friends to notify');
      });

      it('should handle unauthenticated user', async () => {
        authService._setLoggedOut();

        await expect(socialService.createFriendActivity(activityData)).rejects.toThrow(
          'User must be authenticated'
        );
      });

      it('should handle activity creation errors', async () => {
        _mockCallable.mockRejectedValue(new Error('Activity creation failed'));

        await expect(socialService.createFriendActivity(activityData)).rejects.toThrow(
          'Activity creation failed'
        );

        expect(console.error).toHaveBeenCalledWith(
          '❌ Failed to create friend activity:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Utility Functions', () => {
    describe('createNotification', () => {
      beforeEach(() => {
        addDoc.mockResolvedValue({ id: 'notification-123' });
      });

      it('should create notification successfully', async () => {
        const notificationData = {
          type: 'friend_request',
          title: 'New Friend Request',
          message: 'Someone wants to be your friend',
        };

        await socialService.createNotification('target-user-456', notificationData);

        expect(collection).toHaveBeenCalledWith(
          'mock-db',
          'users',
          'target-user-456',
          'notifications'
        );
        expect(addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            ...notificationData,
            read: false,
            createdAt: serverTimestamp(),
          })
        );
      });

      it('should handle notification creation errors gracefully', async () => {
        addDoc.mockRejectedValue(new Error('Notification failed'));

        await socialService.createNotification('target-user-456', {
          type: 'test',
          title: 'Test',
        });

        expect(console.error).toHaveBeenCalledWith(
          '❌ Failed to create notification:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Real-time Subscriptions', () => {
    const mockUnsubscribe = jest.fn();

    beforeEach(() => {
      onSnapshot.mockReturnValue(mockUnsubscribe);
    });

    describe('subscribeFriendRequests', () => {
      it('should set up friend requests subscription', () => {
        const mockCallback = jest.fn();

        const unsubscribe = socialService.subscribeFriendRequests(mockCallback);

        expect(onSnapshot).toHaveBeenCalled();
        expect(where).toHaveBeenCalledWith('receiverId', '==', 'current-user-123');
        expect(where).toHaveBeenCalledWith('status', '==', 'pending');
        expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
        expect(unsubscribe).toBe(mockUnsubscribe);
      });

      it('should handle subscription callback', () => {
        const mockCallback = jest.fn();
        const mockSnapshot = {
          docs: [
            { id: 'request-1', data: () => ({ senderId: 'sender-1' }) },
            { id: 'request-2', data: () => ({ senderId: 'sender-2' }) },
          ],
        };

        onSnapshot.mockImplementation((query, callback) => {
          callback(mockSnapshot);
          return mockUnsubscribe;
        });

        socialService.subscribeFriendRequests(mockCallback);

        expect(mockCallback).toHaveBeenCalledWith([
          { id: 'request-1', senderId: 'sender-1' },
          { id: 'request-2', senderId: 'sender-2' },
        ]);
      });

      it('should return empty callback for unauthenticated user', () => {
        authService._setLoggedOut();

        const mockCallback = jest.fn();
        const unsubscribe = socialService.subscribeFriendRequests(mockCallback);

        expect(mockCallback).toHaveBeenCalledWith([]);
        expect(typeof unsubscribe).toBe('function');
      });
    });

    describe('subscribeActivityFeed', () => {
      it('should set up activity feed subscription', () => {
        const mockCallback = jest.fn();

        const unsubscribe = socialService.subscribeActivityFeed(mockCallback);

        expect(collection).toHaveBeenCalledWith(
          'mock-db',
          'activityFeed',
          'current-user-123',
          'items'
        );
        expect(orderBy).toHaveBeenCalledWith('timestamp', 'desc');
        expect(limit).toHaveBeenCalledWith(50);
        expect(unsubscribe).toBe(mockUnsubscribe);
      });

      it('should handle activity feed subscription callback', () => {
        const mockCallback = jest.fn();
        const mockSnapshot = {
          docs: [
            { id: 'activity-1', data: () => ({ type: 'match' }) },
            { id: 'activity-2', data: () => ({ type: 'friend' }) },
          ],
        };

        onSnapshot.mockImplementation((query, callback) => {
          callback(mockSnapshot);
          return mockUnsubscribe;
        });

        socialService.subscribeActivityFeed(mockCallback);

        expect(mockCallback).toHaveBeenCalledWith([
          { id: 'activity-1', type: 'match' },
          { id: 'activity-2', type: 'friend' },
        ]);
      });

      it('should return empty callback for unauthenticated user', () => {
        authService._setLoggedOut();

        const mockCallback = jest.fn();
        const unsubscribe = socialService.subscribeActivityFeed(mockCallback);

        expect(mockCallback).toHaveBeenCalledWith([]);
        expect(typeof unsubscribe).toBe('function');
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle concurrent friend operations', async () => {
      jest.spyOn(socialService, 'getFriendshipStatus').mockResolvedValue({ status: 'none' });
      __setMockDocumentData({ displayName: 'Target User' }, true);
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'Target User' }),
      });
      addDoc.mockResolvedValue({ id: 'request-id' });
      jest.spyOn(socialService, 'createNotification').mockResolvedValue();

      const operations = [
        socialService.sendFriendRequest('user-1', 'Message 1'),
        socialService.sendFriendRequest('user-2', 'Message 2'),
        socialService.getFriends(),
        socialService.getIncomingFriendRequests(),
      ];

      __setMockQueryResults([], true);
      getDocs.mockResolvedValue({ docs: [] });

      const results = await Promise.allSettled(operations);

      expect(results.every(result => result.status === 'fulfilled')).toBe(true);
    });

    it('should handle malformed friend data', async () => {
      const malformedFriends = [
        { userId: 'friend-1', userInfo: null },
        { userId: null, userInfo: { displayName: 'Test' } },
        { friendshipId: 'friendship-1' }, // Missing userId and userInfo
      ];

      getDocs.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({
        docs: malformedFriends.map((friend, index) => ({
          id: `doc-${index}`,
          data: () => ({ user2Id: friend.userId, user2Info: friend.userInfo }),
        })),
      });

      const { validateFriendArray, safeParseFriend } = require('../../validators/socialValidators');
      validateFriendArray.mockImplementation(() => {
        throw new Error('Validation failed');
      });
      safeParseFriend
        .mockReturnValueOnce({ success: false })
        .mockReturnValueOnce({ success: false })
        .mockReturnValueOnce({ success: true });

      const result = await socialService.getFriends();

      expect(result).toHaveLength(1); // Only one valid friend after filtering
    });

    it('should handle network timeouts gracefully', async () => {
      _mockCallable.mockImplementation(
        () =>
          new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 100))
      );

      await expect(socialService.getPlayerRecommendations()).rejects.toThrow('Network timeout');
    });

    it('should handle database transaction failures', async () => {
      runTransaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(socialService.acceptFriendRequest('request-123')).rejects.toThrow(
        'Transaction failed'
      );
    });

    it('should handle expired friend requests gracefully', async () => {
      const expiredDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      jest.spyOn(socialService, 'getFriendshipStatus').mockResolvedValue({ status: 'none' });
      __setMockDocumentData({ displayName: 'Target User' }, true);
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'Target User' }),
      });
      addDoc.mockResolvedValue({ id: 'request-123' });
      jest.spyOn(socialService, 'createNotification').mockResolvedValue();

      await socialService.sendFriendRequest('target-user-456', 'Test message');

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          expiresAt: expect.any(Date),
        })
      );
    });
  });
});
