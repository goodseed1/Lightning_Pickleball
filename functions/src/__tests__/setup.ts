/**
 * 🏹 [HAWKEYE] Jest Test Setup
 * Firebase Functions Test Environment Configuration
 *
 * This file runs before all tests to set up the Firebase testing environment.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK for testing
// Use test project ID to prevent accidentally affecting production data
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-lightning-pickleball',
  });
}

// Set Firestore to use emulator for testing
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8083';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Disable network requests during tests
process.env.FUNCTIONS_EMULATOR = 'true';

console.log('🏹 [HAWKEYE] Firebase Test Environment initialized');
console.log(`  - Project ID: test-lightning-pickleball`);
console.log(`  - Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
console.log(`  - Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

// Global test timeout (increased for E2E integration tests)
// E2E tests involve multiple Cloud Function calls and Firestore operations
jest.setTimeout(120000); // 2 minutes

// Mock console methods to reduce noise during tests
// (Comment out if you need to see logs during development)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };
