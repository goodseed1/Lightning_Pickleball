/**
 * 🏹 [HAWKEYE] Test Helper Utilities
 * Common utilities for testing Cloud Functions
 *
 * Provides mock data generators, Firestore test helpers, and assertion utilities
 */

import * as admin from 'firebase-admin';
import { TournamentStatus, PickleballEventType, TournamentFormat } from '../types/tournament';

const db = admin.firestore();

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Generate mock tournament data
 */
export function createMockTournament(overrides?: Partial<Record<string, unknown>>) {
  return {
    tournamentName: 'Test Tournament',
    title: 'Test Tournament 2025',
    clubId: 'test-club-id',
    eventType: 'mens_singles' as PickleballEventType,
    format: 'single_elimination' as TournamentFormat,
    status: 'draft' as TournamentStatus,
    startDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    registrationDeadline: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    ),
    settings: {
      format: 'single_elimination' as TournamentFormat,
      matchFormat: 'best_of_3',
      seedingMethod: 'random',
      minParticipants: 4,
      maxParticipants: 16,
      allowByes: true,
      scoringFormat: {
        setsToWin: 2,
        gamesPerSet: 6,
        tiebreakAt: 6,
        noAdScoring: false,
        tiebreakPoints: 7,
      },
      matchDuration: 90,
      thirdPlaceMatch: false,
      consolationBpaddle: false,
      allowWalkovers: true,
    },
    participantCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...overrides,
  };
}

/**
 * Generate mock user data
 */
export function createMockUser(overrides?: Partial<Record<string, unknown>>) {
  return {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    profile: {
      firstName: 'Test',
      lastName: 'User',
      gender: 'male',
      skillLevel: 'intermediate',
    },
    pushToken: 'ExponentPushToken[test-token]',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...overrides,
  };
}

/**
 * Generate mock club membership data
 */
export function createMockClubMembership(overrides?: Partial<Record<string, unknown>>) {
  return {
    clubId: 'test-club-id',
    role: 'member',
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'active',
    ...overrides,
  };
}

/**
 * Generate mock club data
 */
export function createMockClub(overrides?: Partial<Record<string, unknown>>) {
  return {
    name: 'Test Pickleball Club',
    profile: {
      name: 'Test Pickleball Club',
      description: 'A test pickleball club',
    },
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...overrides,
  };
}

// ============================================================================
// Firestore Test Helpers
// ============================================================================

/**
 * Clear all data from Firestore (for test cleanup)
 * WARNING: Only use in test environment!
 */
export async function clearFirestoreData() {
  const collections = await db.listCollections();

  const deletePromises = collections.map(async collection => {
    const docs = await collection.listDocuments();
    return Promise.all(docs.map(doc => doc.delete()));
  });

  await Promise.all(deletePromises);
}

/**
 * Seed Firestore with mock data
 */
export async function seedFirestore(data: {
  clubs?: Array<Record<string, unknown>>;
  users?: Array<Record<string, unknown>>;
  tournaments?: Array<Record<string, unknown>>;
  memberships?: Array<{ userId: string; clubId: string; data: Record<string, unknown> }>;
}) {
  const batch = db.batch();

  // Seed clubs
  if (data.clubs) {
    data.clubs.forEach((club, index) => {
      const clubId = (club.id as string | undefined) || `club-${index}`;
      const clubRef = db.collection('pickleball_clubs').doc(clubId);
      batch.set(clubRef, club);
    });
  }

  // Seed users
  if (data.users) {
    data.users.forEach(user => {
      const userId = user.uid as string;
      const userRef = db.collection('users').doc(userId);
      batch.set(userRef, user);
    });
  }

  // Seed tournaments
  if (data.tournaments) {
    data.tournaments.forEach((tournament, index) => {
      const tournamentId = (tournament.id as string | undefined) || `tournament-${index}`;
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      batch.set(tournamentRef, tournament);
    });
  }

  // Seed memberships
  if (data.memberships) {
    data.memberships.forEach(({ userId, clubId, data }) => {
      const membershipRef = db.doc(`users/${userId}/clubMemberships/${clubId}`);
      batch.set(membershipRef, data);
    });
  }

  await batch.commit();
}

/**
 * Get document data from Firestore
 */
export async function getDoc(path: string): Promise<Record<string, unknown> | null> {
  const doc = await db.doc(path).get();
  return doc.exists ? (doc.data() as Record<string, unknown>) : null;
}

/**
 * Check if document exists
 */
export async function docExists(path: string): Promise<boolean> {
  const doc = await db.doc(path).get();
  return doc.exists;
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert Firestore document exists with expected data
 */
export async function assertDocExists(
  path: string,
  expectedData?: Partial<Record<string, unknown>>
) {
  const doc = await db.doc(path).get();

  if (!doc.exists) {
    throw new Error(`Expected document at ${path} to exist, but it doesn't`);
  }

  if (expectedData) {
    const actualData = doc.data();

    Object.keys(expectedData).forEach(key => {
      if (actualData![key] !== expectedData[key]) {
        throw new Error(`Expected ${key} to be ${expectedData[key]}, but got ${actualData![key]}`);
      }
    });
  }
}

/**
 * Assert Firestore document does not exist
 */
export async function assertDocNotExists(path: string) {
  const doc = await db.doc(path).get();

  if (doc.exists) {
    throw new Error(`Expected document at ${path} to not exist, but it does`);
  }
}

/**
 * Assert collection has expected document count
 */
export async function assertCollectionSize(collectionPath: string, expectedSize: number) {
  const snapshot = await db.collection(collectionPath).get();

  if (snapshot.size !== expectedSize) {
    throw new Error(
      `Expected collection ${collectionPath} to have ${expectedSize} documents, but got ${snapshot.size}`
    );
  }
}

// ============================================================================
// Cloud Function Call Helpers
// ============================================================================

/**
 * Create mock authenticated context for callable functions
 */
export function createMockContext(uid: string = 'test-user-id') {
  const now = Math.floor(Date.now() / 1000);

  return {
    auth: {
      uid,
      token: {
        uid,
        email: 'test@example.com',
        // Required DecodedIdToken fields
        aud: 'test-lightning-pickleball',
        auth_time: now - 3600,
        exp: now + 3600,
        iat: now - 3600,
        iss: `https://securetoken.google.com/test-lightning-pickleball`,
        sub: uid,
        firebase: {
          identities: {
            email: ['test@example.com'],
          },
          sign_in_provider: 'password',
        },
      },
    },
    rawRequest: {} as unknown,
  };
}

/**
 * Simulate delay (useful for testing async operations)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
