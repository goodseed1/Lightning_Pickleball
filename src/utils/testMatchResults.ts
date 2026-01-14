/**
 * Utility functions for testing match result display
 * These functions help add test data to verify both host and applicant views show match results correctly
 */

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Add test match result to 번매12 event for testing
 * This will make both host and applicant views display the match result
 */
export async function addTestMatchResultTo번매12() {
  try {
    console.log('🎯 [TEST] Adding test match result to 번매12...');

    // Event: 번매12 (ID: DruVwr7O6lrgd3kHjU4R)
    // Host: zw9zD7oNhSXsQuhBVEsGrUSbknY2
    // Participant: Vr5z2suh9TZl3eQZfukPhLW6Ont1
    const eventRef = doc(db, 'events', 'DruVwr7O6lrgd3kHjU4R');

    const updateData = {
      status: 'completed',
      result: {
        winnerId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2', // Host wins
        loserId: 'Vr5z2suh9TZl3eQZfukPhLW6Ont1',  // Participant loses
        score: '6-2, 6-2',
        recordedAt: serverTimestamp(),
        recordedBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      },
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(eventRef, updateData);

    console.log('🎉 [TEST] Match result added successfully!');
    console.log('📊 [TEST] Result data:', {
      eventId: 'DruVwr7O6lrgd3kHjU4R',
      winner: 'Host (zw9zD7oNhSXsQuhBVEsGrUSbknY2)',
      loser: 'Participant (Vr5z2suh9TZl3eQZfukPhLW6Ont1)',
      score: '6-2, 6-2',
      status: 'completed'
    });

    return true;
  } catch (error) {
    console.error('❌ [TEST] Error adding match result:', error);
    return false;
  }
}

/**
 * Add test match result where participant wins
 */
export async function addTestMatchResultParticipantWins() {
  try {
    console.log('🎯 [TEST] Adding participant win result to 번매11...');

    // Event: 번매11 (ID: 843848hFJE4P8Rv1pav7)
    // Host: zw9zD7oNhSXsQuhBVEsGrUSbknY2
    // Participant: Vr5z2suh9TZl3eQZfukPhLW6Ont1
    const eventRef = doc(db, 'events', '843848hFJE4P8Rv1pav7');

    const updateData = {
      status: 'completed',
      result: {
        winnerId: 'Vr5z2suh9TZl3eQZfukPhLW6Ont1', // Participant wins
        loserId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',  // Host loses
        score: '7-6(5), 6-4',
        recordedAt: serverTimestamp(),
        recordedBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      },
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(eventRef, updateData);

    console.log('🎉 [TEST] Participant win result added successfully!');
    console.log('📊 [TEST] Result data:', {
      eventId: '843848hFJE4P8Rv1pav7',
      winner: 'Participant (Vr5z2suh9TZl3eQZfukPhLW6Ont1)',
      loser: 'Host (zw9zD7oNhSXsQuhBVEsGrUSbknY2)',
      score: '7-6(5), 6-4',
      status: 'completed'
    });

    return true;
  } catch (error) {
    console.error('❌ [TEST] Error adding participant win result:', error);
    return false;
  }
}

/**
 * Call this function from console to test match result display
 * Example: In Metro console or browser console, call:
 * require('./src/utils/testMatchResults').addTestMatchResultTo번매12()
 */
export async function runTestMatchResults() {
  console.log('🧪 [TEST] Starting match result tests...');

  // Test 1: Host wins
  const test1 = await addTestMatchResultTo번매12();

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Participant wins
  const test2 = await addTestMatchResultParticipantWins();

  console.log('🧪 [TEST] Test results:', {
    hostWinTest: test1 ? 'PASS' : 'FAIL',
    participantWinTest: test2 ? 'PASS' : 'FAIL'
  });

  console.log('🎯 [TEST] Check the Activity tab to see match results in both host and applicant views!');

  return { test1, test2 };
}

// Make functions available globally for testing
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).testMatchResults = {
    addTestMatchResultTo번매12,
    addTestMatchResultParticipantWins,
    runTestMatchResults
  };

  console.log('🧪 [DEV] Test functions available globally:');
  console.log('  - global.testMatchResults.addTestMatchResultTo번매12()');
  console.log('  - global.testMatchResults.addTestMatchResultParticipantWins()');
  console.log('  - global.testMatchResults.runTestMatchResults()');
}