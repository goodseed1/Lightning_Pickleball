/**
 * Browser console script to add test match result
 * Copy and paste this into browser console while the app is running
 */

// Test configuration
const TEST_CONFIG = {
  eventId: 'PG4ZjAIqZlVclqmbLzXG', // 번매6 event ID from logs
  hostUserId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2', // Host user ID
  participantUserId: 'Vr5z2suh9TZl3eQZfukPhLW6Ont1', // Participant user ID
  score: '6-2, 6-2', // Test score
};

// Function to add test result using Firebase SDK in browser
async function addTestMatchResult() {
  try {
    console.log('🧪 Adding test match result via browser Firebase SDK...');

    // Access Firebase from the global scope (should be available in React Native app)
    const { db } = await import('./src/firebase/config');
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');

    console.log('📄 Configuration:', TEST_CONFIG);

    const eventRef = doc(db, 'events', TEST_CONFIG.eventId);

    const updateData = {
      result: {
        winnerId: TEST_CONFIG.hostUserId,
        loserId: TEST_CONFIG.participantUserId,
        score: TEST_CONFIG.score,
        recordedAt: serverTimestamp(),
        recordedBy: TEST_CONFIG.hostUserId,
      },
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(eventRef, updateData);

    console.log('✅ Test match result added successfully!');
    console.log('📊 Expected Results:');
    console.log(`   Host view: 승리 ${TEST_CONFIG.score} (green)`);
    console.log(`   Participant view: 패배 ${TEST_CONFIG.score} (red)`);
    console.log('');
    console.log('🔍 Testing Steps:');
    console.log('1. Navigate to MyProfile screen');
    console.log('2. Check Applied Activities tab (should show participant view with 패배)');
    console.log('3. Switch to different user account if possible to see host view');
    console.log('4. Verify both show identical score with opposite win/loss indicators');

  } catch (error) {
    console.error('❌ Error adding test match result:', error);
    console.log('💡 Try manually adding to Firebase Console instead');
  }
}

// Alternative: Manual Firebase Console instructions
function showManualInstructions() {
  console.log(`
🔧 MANUAL FIREBASE CONSOLE METHOD:

1. Open Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database
4. Navigate to 'events' collection
5. Find document: ${TEST_CONFIG.eventId}
6. Edit the document and add these fields:

   result: {
     "winnerId": "${TEST_CONFIG.hostUserId}",
     "loserId": "${TEST_CONFIG.participantUserId}",
     "score": "${TEST_CONFIG.score}",
     "recordedAt": [current timestamp],
     "recordedBy": "${TEST_CONFIG.hostUserId}"
   }

   status: "completed"
   completedAt: [current timestamp]

7. Save the document
8. Return to the app and refresh/navigate to MyProfile

📱 EXPECTED BEHAVIOR:
- Host sees: 승리 6-2, 6-2 (green background)
- Participant sees: 패배 6-2, 6-2 (red background)
- Both display identical score information
  `);
}

// Expose functions to global scope
window.addTestMatchResult = addTestMatchResult;
window.showManualInstructions = showManualInstructions;

console.log('🧪 Test functions loaded!');
console.log('Run: addTestMatchResult() - to add test result via Firebase SDK');
console.log('Run: showManualInstructions() - to get manual Firebase Console steps');

// Auto-run manual instructions
showManualInstructions();