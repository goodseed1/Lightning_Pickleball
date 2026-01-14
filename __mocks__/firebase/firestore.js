// Comprehensive, chainable Firestore mock
// This mock supports method chaining like .collection().doc().get()

// Mock data that tests can customize
let mockDocumentData = { id: 'mock-doc-id', name: 'Mock Document' };
let mockDocumentExists = true;
let mockQueryResults = [{ id: 'doc1', data: () => ({ title: 'Mock Doc 1' }) }];
let mockCollectionEmpty = false;

// Helper to create a mock document snapshot
const createMockDocSnapshot = (data = mockDocumentData, exists = mockDocumentExists) => ({
  id: data?.id || 'mock-doc-id',
  exists: () => exists,
  data: () => (exists ? data : undefined),
  get: field => (exists && data ? data[field] : undefined),
  ref: { id: data?.id || 'mock-doc-id', path: `mock-collection/${data?.id || 'mock-doc-id'}` },
});

// Helper to create a mock query snapshot
const createMockQuerySnapshot = (docs = mockQueryResults, empty = mockCollectionEmpty) => ({
  empty,
  size: docs.length,
  docs: docs.map(doc => createMockDocSnapshot(doc)),
  forEach: callback => docs.forEach((doc, index) => callback(createMockDocSnapshot(doc), index)),
});

// Mock DocumentReference
const createMockDocumentReference = (id = 'mock-doc-id') => ({
  id,
  path: `mock-collection/${id}`,
  get: jest.fn(() => Promise.resolve(createMockDocSnapshot())),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  onSnapshot: jest.fn(callback => {
    // Simulate real-time updates
    setTimeout(() => callback(createMockDocSnapshot()), 0);
    return jest.fn(); // Unsubscribe function
  }),
  collection: jest.fn(subcollectionId => createMockCollectionReference(`${id}/${subcollectionId}`)),
});

// Mock Query (base for CollectionReference)
const createMockQuery = (path = 'mock-collection') => {
  const query = {
    // Query methods that return new Query objects (for chaining)
    where: jest.fn(() => createMockQuery(path)),
    orderBy: jest.fn(() => createMockQuery(path)),
    limit: jest.fn(() => createMockQuery(path)),
    startAt: jest.fn(() => createMockQuery(path)),
    startAfter: jest.fn(() => createMockQuery(path)),
    endAt: jest.fn(() => createMockQuery(path)),
    endBefore: jest.fn(() => createMockQuery(path)),

    // Terminal methods
    get: jest.fn(() => Promise.resolve(createMockQuerySnapshot())),
    onSnapshot: jest.fn(callback => {
      // Simulate real-time updates
      setTimeout(() => callback(createMockQuerySnapshot()), 0);
      return jest.fn(); // Unsubscribe function
    }),
  };

  return query;
};

// Mock CollectionReference (extends Query)
const createMockCollectionReference = (path = 'mock-collection') => {
  const query = createMockQuery(path);

  return {
    ...query,
    id: path.split('/').pop(),
    path,
    parent: path.includes('/')
      ? createMockDocumentReference(path.split('/').slice(0, -1).join('/'))
      : null,

    // CollectionReference specific methods
    doc: jest.fn(docId => {
      const id = docId || 'auto-generated-id';
      return createMockDocumentReference(id);
    }),
    add: jest.fn(data => {
      const newDoc = createMockDocumentReference('auto-generated-id');
      return Promise.resolve(newDoc);
    }),
  };
};

// Mock WriteBatch
const createMockWriteBatch = () => ({
  set: jest.fn(function () {
    return this;
  }), // Return this for chaining
  update: jest.fn(function () {
    return this;
  }), // Return this for chaining
  delete: jest.fn(function () {
    return this;
  }), // Return this for chaining
  commit: jest.fn(() => Promise.resolve()),
});

// Mock Transaction
const createMockTransaction = () => ({
  get: jest.fn(() => Promise.resolve(createMockDocSnapshot())),
  set: jest.fn(function () {
    return this;
  }), // Return this for chaining
  update: jest.fn(function () {
    return this;
  }), // Return this for chaining
  delete: jest.fn(function () {
    return this;
  }), // Return this for chaining
});

// Mock Firestore instance
const mockFirestore = {
  collection: jest.fn(path => createMockCollectionReference(path)),
  doc: jest.fn(path => createMockDocumentReference(path)),
  runTransaction: jest.fn(async updateFunction => {
    const transaction = createMockTransaction();
    return await updateFunction(transaction);
  }),
  writeBatch: jest.fn(() => createMockWriteBatch()),
  terminate: jest.fn(() => Promise.resolve()),
  clearPersistence: jest.fn(() => Promise.resolve()),
  enableNetwork: jest.fn(() => Promise.resolve()),
  disableNetwork: jest.fn(() => Promise.resolve()),
  waitForPendingWrites: jest.fn(() => Promise.resolve()),
};

// Firestore functions
export const getFirestore = jest.fn(() => mockFirestore);
export const collection = jest.fn((db, path) => mockFirestore.collection(path));
export const doc = jest.fn((db, path) => mockFirestore.doc(path));
export const getDocs = jest.fn(() => Promise.resolve(createMockQuerySnapshot()));
export const getDoc = jest.fn(() => Promise.resolve(createMockDocSnapshot()));
export const addDoc = jest.fn((collectionRef, data) => {
  const newDoc = createMockDocumentReference('auto-generated-id');
  return Promise.resolve(newDoc);
});
export const setDoc = jest.fn(() => Promise.resolve());
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());

// Query builders
export const query = jest.fn((collectionRef, ...constraints) => createMockQuery());
export const where = jest.fn((field, operator, value) => ({ field, operator, value }));
export const orderBy = jest.fn((field, direction = 'asc') => ({ field, direction }));
export const limit = jest.fn(limitNum => ({ limit: limitNum }));
export const startAt = jest.fn((...values) => ({ startAt: values }));
export const startAfter = jest.fn((...values) => ({ startAfter: values }));
export const endAt = jest.fn((...values) => ({ endAt: values }));
export const endBefore = jest.fn((...values) => ({ endBefore: values }));

// Real-time listeners
export const onSnapshot = jest.fn((target, callback) => {
  setTimeout(() => {
    if (typeof target.get === 'function') {
      // Document snapshot
      callback(createMockDocSnapshot());
    } else {
      // Query snapshot
      callback(createMockQuerySnapshot());
    }
  }, 0);
  return jest.fn(); // Unsubscribe function
});

// Transactions and batches
export const runTransaction = jest.fn(async (db, updateFunction) => {
  const transaction = createMockTransaction();
  return await updateFunction(transaction);
});
export const writeBatch = jest.fn(db => createMockWriteBatch());

// Field values and utilities
export const serverTimestamp = jest.fn(() => ({ _methodName: 'serverTimestamp' }));
export const arrayUnion = jest.fn((...elements) => ({ _methodName: 'arrayUnion', elements }));
export const arrayRemove = jest.fn((...elements) => ({ _methodName: 'arrayRemove', elements }));
export const increment = jest.fn(value => ({ _methodName: 'increment', value }));

// Geo and timestamp utilities
export const GeoPoint = jest.fn().mockImplementation((latitude, longitude) => ({
  latitude,
  longitude,
  isEqual: jest.fn(),
}));

export const Timestamp = {
  now: jest.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
  fromDate: jest.fn(date => ({
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
    toDate: () => date,
  })),
  fromMillis: jest.fn(milliseconds => ({
    seconds: Math.floor(milliseconds / 1000),
    nanoseconds: (milliseconds % 1000) * 1000000,
    toDate: () => new Date(milliseconds),
  })),
};

// Test utilities - exported so tests can customize mock behavior
export const __setMockDocumentData = (data, exists = true) => {
  mockDocumentData = data;
  mockDocumentExists = exists;
};

export const __setMockQueryResults = (results, empty = false) => {
  mockQueryResults = results;
  mockCollectionEmpty = empty;
};

export const __resetMocks = () => {
  mockDocumentData = { id: 'mock-doc-id', name: 'Mock Document' };
  mockDocumentExists = true;
  mockQueryResults = [{ id: 'doc1', data: () => ({ title: 'Mock Doc 1' }) }];
  mockCollectionEmpty = false;

  // Clear all jest mocks
  jest.clearAllMocks();
};

// Default export
export default {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  GeoPoint,
  Timestamp,
  __setMockDocumentData,
  __setMockQueryResults,
  __resetMocks,
};
