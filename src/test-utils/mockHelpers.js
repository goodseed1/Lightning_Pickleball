/**
 * Common Mock Helpers for Unit Tests
 * Provides standardized mock setup for all test files
 *
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 * Following START.md Golden Rules for consistent testing
 */

// Re-export all Firebase mock functions
export {
  // Firestore functions
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,

  // Query functions
  query,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,

  // Real-time functions
  onSnapshot,

  // Batch and transaction
  runTransaction,
  writeBatch,

  // Field values
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,

  // Utilities
  GeoPoint,
  Timestamp,

  // Test utilities
  __setMockDocumentData,
  __setMockQueryResults,
  __resetMocks,
} from '../../__mocks__/firebase/firestore';

// Standard mock setup for tests
export const setupStandardMocks = () => {
  // Reset all mocks
  jest.clearAllMocks();

  // Silence console during tests
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
};

// Mock Firebase config
export const mockFirebaseConfig = {
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
};

// Mock auth functions
export const mockAuthFunctions = {
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: mockFirebaseConfig.auth.currentUser })
  ),
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: mockFirebaseConfig.auth.currentUser })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(mockFirebaseConfig.auth.currentUser);
    return jest.fn(); // Unsubscribe function
  }),
};

// Common test data
export const mockTestData = {
  user: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    skillLevel: 'intermediate',
    ltrLevel: '4.0',
    location: 'Seoul, Korea',
    preferredLanguage: 'ko',
  },

  event: {
    id: 'event-123',
    title: 'Weekend Tennis Match',
    type: 'match',
    hostId: 'test-user-id',
    hostName: 'Test User',
    scheduledTime: new Date('2025-01-15T10:00:00'),
    location: {
      address: 'Central Park Courts',
      coordinates: { lat: 40.7829, lng: -73.9654 },
    },
    maxParticipants: 4,
    participants: [],
    status: 'upcoming',
  },

  club: {
    id: 'club-123',
    name: 'Seoul Tennis Club',
    description: 'Friendly tennis club in Seoul',
    memberCount: 25,
    adminId: 'admin-user-id',
    isPublic: true,
    createdAt: new Date('2024-01-01'),
  },

  feedItem: {
    id: 'feed-123',
    type: 'activity',
    userId: 'test-user-id',
    userName: 'Test User',
    content: 'Just joined a new match!',
    timestamp: new Date(),
    likes: [],
    comments: [],
  },
};

// Helper to create mock document snapshot
export const createMockDocSnapshot = (data, exists = true) => ({
  id: data?.id || 'mock-doc-id',
  exists: () => exists,
  data: () => (exists ? data : undefined),
  get: field => (exists && data ? data[field] : undefined),
});

// Helper to create mock query snapshot
export const createMockQuerySnapshot = (docs = [], empty = false) => ({
  empty,
  size: docs.length,
  docs: docs.map(doc => createMockDocSnapshot(doc)),
  forEach: callback => {
    docs.forEach((doc, index) => callback(createMockDocSnapshot(doc), index));
  },
});

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to setup Firebase Functions mock
export const setupFirebaseFunctionsMock = () => {
  jest.mock('firebase/functions', () => ({
    httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { success: true } }))),
    getFunctions: jest.fn(),
  }));
};

// Export mock references for backward compatibility
// These are now properly imported from the main firestore mock above

// Default export for convenience
export default {
  setupStandardMocks,
  mockFirebaseConfig,
  mockAuthFunctions,
  mockTestData,
  createMockDocSnapshot,
  createMockQuerySnapshot,
  waitForAsync,
  setupFirebaseFunctionsMock,
};
