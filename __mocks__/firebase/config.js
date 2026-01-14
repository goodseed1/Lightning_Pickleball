// Mock Firebase Config
const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      onSnapshot: jest.fn(),
    })),
    get: jest.fn(),
    add: jest.fn(),
    where: jest.fn(() => mockQuery),
    orderBy: jest.fn(() => mockQuery),
    limit: jest.fn(() => mockQuery),
  })),
  runTransaction: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(),
  })),
};

const mockQuery = {
  get: jest.fn(),
  where: jest.fn(() => mockQuery),
  orderBy: jest.fn(() => mockQuery),
  limit: jest.fn(() => mockQuery),
  onSnapshot: jest.fn(),
};

const mockAuth = {
  currentUser: { uid: 'mock-user-id', email: 'test@example.com' },
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve()),
};

const mockFunctions = {
  region: 'us-central1',
  timeout: 60,
  name: 'mock-functions-app',
};
const mockStorage = {};

// Export mocked Firebase services
export const db = mockFirestore;
export const auth = mockAuth;
export const functions = mockFunctions;
export const storage = mockStorage;

export default {};
