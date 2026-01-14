/**
 * Quick test script to add match results to Firebase for testing
 * Run this in browser console or Node.js environment
 */

// Test data based on the console logs
const TEST_EVENT_ID = 'PG4ZjAIqZlVclqmbLzXG'; // 번매6 event
const HOST_USER_ID = 'zw9zD7oNhSXsQuhBVEsGrUSbknY2'; // Host
const PARTICIPANT_USER_ID = 'Vr5z2suh9TZl3eQZfukPhLW6Ont1'; // Current user (participant)

// Test match result data
const TEST_MATCH_RESULT = {
  winnerId: HOST_USER_ID, // Host wins
  loserId: PARTICIPANT_USER_ID, // Participant loses
  score: '6-2, 6-2', // Host victory score
  recordedAt: new Date(),
  recordedBy: HOST_USER_ID,
};

console.log('🧪 Test Match Result Configuration:');
console.log('Event ID:', TEST_EVENT_ID);
console.log('Host (Winner):', HOST_USER_ID);
console.log('Participant (Loser):', PARTICIPANT_USER_ID);
console.log('Score:', TEST_MATCH_RESULT.score);
console.log('Expected Host Display: 승리 6-2, 6-2');
console.log('Expected Participant Display: 패배 6-2, 6-2');

// Instructions for manual testing
console.log(`
🔧 MANUAL TESTING INSTRUCTIONS:

1. Open Firebase Console
2. Navigate to Firestore Database
3. Find the 'events' collection
4. Locate document: ${TEST_EVENT_ID}
5. Add/Update the following fields:

   result: {
     winnerId: "${HOST_USER_ID}",
     loserId: "${PARTICIPANT_USER_ID}",
     score: "${TEST_MATCH_RESULT.score}",
     recordedAt: [current timestamp],
     recordedBy: "${HOST_USER_ID}"
   }

   status: "completed"
   completedAt: [current timestamp]

6. Save the document
7. Check the app - both host and participant views should show consistent scores
8. Host should see: 승리 6-2, 6-2 (green)
9. Participant should see: 패배 6-2, 6-2 (red)

📱 TESTING FLOW:
- Log in as host (${HOST_USER_ID}) -> should see "승리 6-2, 6-2"
- Log in as participant (${PARTICIPANT_USER_ID}) -> should see "패배 6-2, 6-2"
- Both should show identical score but opposite win/loss indicators
`);

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TEST_EVENT_ID,
    HOST_USER_ID,
    PARTICIPANT_USER_ID,
    TEST_MATCH_RESULT,
  };
}