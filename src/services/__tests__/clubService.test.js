/**
 * Integration Tests for ClubService
 *
 * Tests the core business logic of clubService by mocking Firebase dependencies
 * while testing the actual service implementation.
 */

// Firebase/Firestore now uses centralized mock from __mocks__/firebase/firestore.js

// AuthService now uses centralized mock from __mocks__/services/authService.js
const authServiceMock = require('../../../__mocks__/services/authService.js');

// Access centralized Firestore mock
const firestoreMock = require('../../../__mocks__/firebase/firestore.js');

// Mock other services to prevent import issues
jest.mock('../offlineStorageService', () => ({
  default: {
    saveClubData: jest.fn(),
    getClubData: jest.fn(),
  },
}));

jest.mock('../pushNotificationService', () => ({
  default: {
    sendNotification: jest.fn(),
  },
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(),
}));

// Mock Firebase config to provide auth object
jest.mock('../../firebase/config', () => ({
  db: {},
  functions: {},
  auth: {
    currentUser: { uid: 'test-user-123', email: 'test@example.com' },
  },
}));

describe.skip('ClubService Integration Tests', () => {
  let clubService;

  beforeAll(async () => {
    // Import the service after all mocks are set up
    const module = await import('../clubService.js');
    clubService = module.default; // It's already an instance, not a class
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset mock return values
    firestoreMock.serverTimestamp.mockReturnValue('mock-timestamp');
    authServiceMock._mockGetCurrentUser.mockReturnValue({ uid: 'test-user-123' });
    firestoreMock.collection.mockReturnValue('mock-collection-ref');
    firestoreMock.doc.mockReturnValue('mock-doc-ref');
  });

  describe.skip('requestToJoinClub', () => {
    it('should create join request when user is authenticated', async () => {
      // Arrange
      const clubId = 'club123';
      const userId = 'user123';
      const mockRequestId = 'request123';

      authServiceMock._mockGetCurrentUser.mockReturnValue({ uid: userId });
      firestoreMock.addDoc.mockResolvedValue({ id: mockRequestId });

      // Act
      const result = await clubService.requestToJoinClub(clubId, userId);

      // Assert
      expect(result).toBe(mockRequestId);
      expect(firestoreMock.collection).toHaveBeenCalledWith('mock-db', 'club_join_requests');
      expect(firestoreMock.addDoc).toHaveBeenCalledWith('mock-collection-ref', {
        clubId,
        userId,
        status: 'pending',
        requestedAt: 'mock-timestamp',
        message: '',
      });
    });

    it('should reject when user is not authenticated properly', async () => {
      // Arrange
      const clubId = 'club123';
      const userId = 'user123';

      authServiceMock._mockGetCurrentUser.mockReturnValue({ uid: 'different-user' });

      // Act & Assert
      await expect(clubService.requestToJoinClub(clubId, userId)).rejects.toThrow(
        'User must be authenticated'
      );
    });

    it('should throw error when Firebase fails', async () => {
      // Arrange
      const clubId = 'club123';
      const userId = 'user123';

      authServiceMock._mockGetCurrentUser.mockReturnValue({ uid: userId });
      firestoreMock.addDoc.mockRejectedValue(new Error('Firebase connection failed'));

      // Act & Assert
      await expect(clubService.requestToJoinClub(clubId, userId)).rejects.toThrow(
        '클럽 가입 신청에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.'
      );
      expect(firestoreMock.addDoc).toHaveBeenCalled(); // Attempted Firebase first
    });

    it('should throw error when auth service unavailable', async () => {
      // Arrange
      const clubId = 'club123';
      const userId = 'user123';

      authServiceMock._mockGetCurrentUser.mockImplementation(() => {
        throw new Error('Auth service unavailable');
      });

      // Act & Assert
      await expect(clubService.requestToJoinClub(clubId, userId)).rejects.toThrow(
        '클럽 가입 신청 중 오류가 발생했습니다: User must be authenticated'
      );
    });
  });

  describe.skip('approveJoinRequest', () => {
    it('should approve join request and create membership in transaction', async () => {
      // Arrange
      const requestId = 'request123';
      const mockRequestData = {
        clubId: 'club123',
        userId: 'user123',
        userName: 'John Doe',
        status: 'pending',
      };

      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockRequestData,
        }),
        update: jest.fn(),
        set: jest.fn(),
      };

      firestoreMock.runTransaction.mockImplementation(async (db, callback) => {
        await callback(mockTransaction);
        return true;
      });

      // Mock post-transaction getDoc calls for request, club, and user
      firestoreMock.getDoc.mockImplementation(() => ({
        exists: () => true,
        data: () => ({
          ...mockRequestData,
          profile: { name: 'Test Club' },
          displayName: 'John Doe',
        }),
      }));

      // Act
      const result = await clubService.approveJoinRequest(requestId);

      // Assert
      expect(result).toBe(true);
      expect(firestoreMock.runTransaction).toHaveBeenCalledWith('mock-db', expect.any(Function));
      expect(mockTransaction.get).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalled();
    });

    it('should handle non-existent join request', async () => {
      // Arrange
      const requestId = 'nonexistent-request';

      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => false,
        }),
        update: jest.fn(),
        set: jest.fn(),
      };

      firestoreMock.runTransaction.mockImplementation(async (db, callback) => {
        try {
          await callback(mockTransaction);
        } catch (error) {
          throw error;
        }
      });

      // Act & Assert
      await expect(clubService.approveJoinRequest(requestId)).rejects.toThrow(
        '가입 신청 승인 중 오류가 발생했습니다: 가입 신청 승인에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.'
      );
    });

    it('should throw error when Firebase transaction fails', async () => {
      // Arrange
      const requestId = 'request123';

      firestoreMock.runTransaction.mockRejectedValue(new Error('Transaction failed'));

      // Act & Assert
      await expect(clubService.approveJoinRequest(requestId)).rejects.toThrow(
        '가입 신청 승인에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.'
      );
      expect(firestoreMock.runTransaction).toHaveBeenCalled();
    });
  });

  describe.skip('createClub', () => {
    it('should create club with valid authenticated user', async () => {
      // Arrange
      const clubData = {
        name: 'Test Pickleball Club',
        description: 'A great pickleball club',
        location: 'Seoul, Korea',
      };
      const mockClubId = 'club123';
      const mockUserId = 'user123';

      const mockUser = {
        uid: mockUserId,
        getIdToken: jest.fn().mockResolvedValue('valid-token'),
      };

      authServiceMock._mockGetCurrentUser.mockReturnValue(mockUser);
      firestoreMock.addDoc.mockResolvedValue({ id: mockClubId });

      // Act
      const result = await clubService.createClub(clubData);

      // Assert
      expect(result).toBe(mockClubId);
      expect(mockUser.getIdToken).toHaveBeenCalledWith(true); // Force refresh
      expect(firestoreMock.addDoc).toHaveBeenCalledWith(
        'mock-collection-ref',
        expect.objectContaining({
          ...clubData,
          ownerId: mockUserId,
          createdAt: 'mock-timestamp',
        })
      );
    });

    it('should reject when user is not authenticated', async () => {
      // Arrange
      const clubData = { name: 'Test Club' };

      authServiceMock._mockGetCurrentUser.mockReturnValue(null);

      // Act & Assert
      await expect(clubService.createClub(clubData)).rejects.toThrow(
        '클럽 생성 중 오류가 발생했습니다.'
      );
    });

    it('should retry authentication on token expiration', async () => {
      // Arrange
      const clubData = { name: 'Test Club' };
      const mockUserId = 'user123';
      const mockClubId = 'club123';

      const mockUser = {
        uid: mockUserId,
        getIdToken: jest
          .fn()
          .mockRejectedValueOnce({ code: 'auth/user-token-expired' })
          .mockResolvedValueOnce('refreshed-token'), // Success on retry
      };

      authServiceMock._mockGetCurrentUser.mockReturnValue(mockUser);
      firestoreMock.addDoc.mockResolvedValue({ id: mockClubId });

      // Act
      const result = await clubService.createClub(clubData);

      // Assert
      expect(result).toBe(mockClubId);
      expect(mockUser.getIdToken).toHaveBeenCalledTimes(2); // Retry logic
    });

    it('should fail after maximum auth retry attempts', async () => {
      // Arrange
      const clubData = { name: 'Test Club' };

      const mockUser = {
        uid: 'user123',
        getIdToken: jest.fn().mockRejectedValue({ code: 'auth/user-token-expired' }),
      };

      authServiceMock._mockGetCurrentUser.mockReturnValue(mockUser);

      // Act & Assert
      await expect(clubService.createClub(clubData)).rejects.toThrow(
        '클럽 생성 중 오류가 발생했습니다.'
      );

      expect(mockUser.getIdToken).toHaveBeenCalledTimes(3); // Max attempts
    });
  });

  describe.skip('Error Handling & Resilience', () => {
    it('should provide user-friendly error messages', async () => {
      // Arrange
      const clubId = 'club123';
      const userId = 'user123';

      authServiceMock._mockGetCurrentUser.mockImplementation(() => {
        throw new Error('Internal auth error');
      });

      // Act & Assert
      await expect(clubService.requestToJoinClub(clubId, userId)).rejects.toThrow(
        '클럽 가입 신청 중 오류가 발생했습니다: Internal auth error'
      );
    });

    it('should throw error on network failures in join requests', async () => {
      // Arrange
      const clubId = 'club123';
      const userId = 'user123';

      authServiceMock._mockGetCurrentUser.mockReturnValue({ uid: userId });
      firestoreMock.addDoc.mockRejectedValue(new Error('Network timeout'));

      // Act & Assert
      await expect(clubService.requestToJoinClub(clubId, userId)).rejects.toThrow(
        '클럽 가입 신청에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.'
      );
    });
  });
});
