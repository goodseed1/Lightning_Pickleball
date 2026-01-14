// Mock Firebase Admin - All mocks need to be inline for proper hoisting
jest.mock('firebase-admin', () => {
  // Define mock components inline
  const mockBatch = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    commit: jest.fn().mockResolvedValue(undefined),
  };

  const mockDocRef = {
    id: 'mockDocId',
    get: jest.fn(),
    update: jest.fn(),
  };

  const mockCollectionRef = {
    doc: jest.fn(() => mockDocRef),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };

  const mockDb = {
    collection: jest.fn(() => mockCollectionRef),
    batch: jest.fn(() => mockBatch),
  };

  const mockMessaging = {
    send: jest.fn().mockResolvedValue('mock-message-id'),
    sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
  };

  // Create firestore function with FieldValue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firestoreFn: any = jest.fn(() => mockDb);
  firestoreFn.FieldValue = {
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
    arrayUnion: jest.fn(value => ({ arrayUnion: value })),
    arrayRemove: jest.fn(value => ({ arrayRemove: value })),
    increment: jest.fn(value => ({ increment: value })),
  };

  // Return the complete mock structure
  return {
    apps: [],
    initializeApp: jest.fn(),
    firestore: firestoreFn,
    messaging: jest.fn(() => mockMessaging),
  };
});

// Get references to mock objects for test manipulation
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');
const mockDb = admin.firestore();
const mockCollectionRef = mockDb.collection();
const mockDocRef = mockCollectionRef.doc();
const mockBatch = mockDb.batch();

// Mock Firebase Functions
jest.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      public code: string;
      constructor(code: string, message: string) {
        super(message);
        this.code = code;
        this.name = 'HttpsError';
      }
    },
    onCall: jest.fn().mockImplementation(handler => handler),
  },
  firestore: {
    document: jest.fn().mockReturnThis(),
    onCreate: jest.fn().mockImplementation(handler => handler),
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Import the function under test after mocking
import { approveApplicationLogic, ApprovalRequest } from '../approveApplication';

describe('approveApplicationLogic', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset batch commit to success
    mockBatch.commit.mockResolvedValue(undefined);
  });

  describe('Permission Control', () => {
    it('should successfully process when caller is the host', async () => {
      // Arrange
      const mockData: ApprovalRequest = {
        applicationId: 'app123',
        hostId: 'host123',
        eventId: 'event123',
        applicantId: 'applicant123',
      };
      const authUid = 'host123'; // Same as hostId

      // Mock valid application document
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ eventId: 'event123', applicantId: 'applicant123' }),
      });

      // Mock valid event document
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          title: 'Tennis Match',
          location: 'Central Park',
          hostId: 'host123',
        }),
      });

      // Mock chat room query - empty so new room is created
      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] });

      // Mock host partner app query - empty for simplicity
      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] });

      // Mock all applications query - empty for simplicity
      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] });

      // Act & Assert - should not throw permission error
      const result = await approveApplicationLogic(mockData, authUid);
      expect(result.success).toBe(true);
    });

    it('should throw permission-denied error if caller is not the host', async () => {
      // Arrange
      const mockData: ApprovalRequest = {
        applicationId: 'app123',
        hostId: 'host123',
        eventId: 'event123',
        applicantId: 'applicant123',
      };
      const authUid = 'notTheHost'; // Different from hostId

      // Mock valid application document
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ eventId: 'event123', applicantId: 'applicant123' }),
      });

      // Mock valid event document (host is different from caller)
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          title: 'Tennis Match',
          hostId: 'host123',
          createdBy: 'host123',
        }),
      });

      // Act & Assert
      await expect(approveApplicationLogic(mockData, authUid)).rejects.toThrow(
        expect.objectContaining({
          message:
            'You are not the host of this event. Only the event host can approve applications.',
          code: 'permission-denied',
        })
      );
    });
  });

  describe('Document Validation', () => {
    const validMockData: ApprovalRequest = {
      applicationId: 'app123',
      hostId: 'host123',
      eventId: 'event123',
      applicantId: 'applicant123',
    };
    const validAuthUid = 'host123';

    it('should throw not-found error for non-existent application', async () => {
      // Arrange - Mock non-existent application
      mockDocRef.get.mockResolvedValueOnce({
        exists: false,
        data: () => null,
      });

      // Act & Assert
      await expect(approveApplicationLogic(validMockData, validAuthUid)).rejects.toThrow(
        expect.objectContaining({
          message: 'Application not found',
          code: 'not-found',
        })
      );
    });

    it('should throw not-found error for non-existent event', async () => {
      // Arrange
      // Mock existing application
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ eventId: 'event123', applicantId: 'applicant123' }),
      });

      // Mock non-existent event in all 4 collections (leagues, tournaments, lightning_events, events)
      mockDocRef.get.mockResolvedValueOnce({
        exists: false,
        data: () => null,
      });
      mockDocRef.get.mockResolvedValueOnce({
        exists: false,
        data: () => null,
      });
      mockDocRef.get.mockResolvedValueOnce({
        exists: false,
        data: () => null,
      });
      mockDocRef.get.mockResolvedValueOnce({
        exists: false,
        data: () => null,
      });

      // Act & Assert
      await expect(approveApplicationLogic(validMockData, validAuthUid)).rejects.toThrow(
        expect.objectContaining({
          message: 'Event not found in any collection',
          code: 'not-found',
        })
      );
    });

    it('should throw internal error for invalid application data', async () => {
      // Arrange - Mock application that exists but has no data
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => null, // Invalid data
      });

      // Act & Assert
      await expect(approveApplicationLogic(validMockData, validAuthUid)).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid application data',
          code: 'internal',
        })
      );
    });

    it('should throw internal error for invalid event data', async () => {
      // Arrange
      // Mock valid application
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ eventId: 'event123', applicantId: 'applicant123' }),
      });

      // Mock event that exists but has no data
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => null, // Invalid data
      });

      // Act & Assert
      await expect(approveApplicationLogic(validMockData, validAuthUid)).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid event data',
          code: 'internal',
        })
      );
    });
  });

  describe('Database Operations', () => {
    it('should call database operations in the correct sequence', async () => {
      // Arrange
      const mockData: ApprovalRequest = {
        applicationId: 'app123',
        hostId: 'host123',
        eventId: 'event123',
        applicantId: 'applicant123',
      };
      const authUid = 'host123';

      // Mock all required documents
      mockDocRef.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ eventId: 'event123', applicantId: 'applicant123' }),
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            title: 'Tennis Match',
            location: 'Central Park',
            hostId: 'host123',
          }),
        });

      // Mock empty chat room query
      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] });

      // Mock user profile query
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ profile: { displayName: 'Test User' } }),
      });

      // Mock host partner app query (empty)
      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] });

      // Mock all applications query (empty)
      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] });

      // Act
      const result = await approveApplicationLogic(mockData, authUid);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDb.batch).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalled(); // Application status update
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should handle database commit failure gracefully', async () => {
      // Arrange
      const mockData: ApprovalRequest = {
        applicationId: 'app123',
        hostId: 'host123',
        eventId: 'event123',
        applicantId: 'applicant123',
      };
      const authUid = 'host123';

      // Mock valid documents
      mockDocRef.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ eventId: 'event123', applicantId: 'applicant123' }),
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            title: 'Tennis Match',
            location: 'Central Park',
            hostId: 'host123',
          }),
        });

      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] });

      // Mock user profile query
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ profile: { displayName: 'Test User' } }),
      });

      // Mock host partner app query (empty)
      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] });

      // Mock all applications query (empty)
      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] });

      // Mock batch commit failure
      const databaseError = new Error('Database connection failed');
      mockBatch.commit.mockRejectedValueOnce(databaseError);

      // Act & Assert
      await expect(approveApplicationLogic(mockData, authUid)).rejects.toThrow(databaseError);
    });
  });
});
