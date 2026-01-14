/**
 * Script to add test match result to Firebase for testing score synchronization
 * Run with: node scripts/add-test-result.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
try {
  // Try to use service account key (if available)
  const serviceAccountPath = path.join(__dirname, '../service-account-key.json');
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin initialized with service account');
} catch (error) {
  // Fallback to default credentials (if running in Firebase environment)
  try {
    admin.initializeApp();
    console.log('✅ Firebase Admin initialized with default credentials');
  } catch (fallbackError) {
    console.error('❌ Failed to initialize Firebase Admin:', fallbackError);
    console.log('💡 Please ensure you have proper Firebase credentials configured');
    process.exit(1);
  }
}

const db = admin.firestore();

// Test configuration based on console logs
const TEST_CONFIG = {
  eventId: 'PG4ZjAIqZlVclqmbLzXG', // 번매6 event
  hostUserId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2', // Host
  participantUserId: 'Vr5z2suh9TZl3eQZfukPhLW6Ont1', // Participant
  score: '6-2, 6-2', // Test score
};

async function addTestMatchResult() {
  try {
    console.log('🧪 Adding test match result...');
    console.log('Configuration:', TEST_CONFIG);

    const eventRef = db.collection('events').doc(TEST_CONFIG.eventId);

    // Check if event exists
    const eventDoc = await eventRef.get();
    if (!eventDoc.exists) {
      throw new Error(`Event ${TEST_CONFIG.eventId} not found`);
    }

    console.log('📄 Event found:', eventDoc.data().title);

    // Add match result
    const updateData = {
      result: {
        winnerId: TEST_CONFIG.hostUserId,
        loserId: TEST_CONFIG.participantUserId,
        score: TEST_CONFIG.score,
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        recordedBy: TEST_CONFIG.hostUserId,
      },
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await eventRef.update(updateData);

    console.log('✅ Test match result added successfully!');
    console.log('📊 Expected Results:');
    console.log(`   Host (${TEST_CONFIG.hostUserId}): 승리 ${TEST_CONFIG.score}`);
    console.log(`   Participant (${TEST_CONFIG.participantUserId}): 패배 ${TEST_CONFIG.score}`);
    console.log('');
    console.log('🔍 Next Steps:');
    console.log('1. Refresh the app');
    console.log('2. Check MyProfile -> Applied Activities (participant view)');
    console.log('3. Check MyProfile -> Hosted Activities (host view)');
    console.log('4. Verify both show the same score with appropriate win/loss indicators');

  } catch (error) {
    console.error('❌ Error adding test match result:', error);
  } finally {
    // Clean up
    admin.app().delete();
  }
}

// Alternative function to add different test scenarios
async function addTestScenario(scenarioName) {
  const scenarios = {
    'host-wins': {
      winnerId: TEST_CONFIG.hostUserId,
      loserId: TEST_CONFIG.participantUserId,
      score: '6-2, 6-4',
    },
    'participant-wins': {
      winnerId: TEST_CONFIG.participantUserId,
      loserId: TEST_CONFIG.hostUserId,
      score: '6-3, 7-5',
    },
    'close-match': {
      winnerId: TEST_CONFIG.hostUserId,
      loserId: TEST_CONFIG.participantUserId,
      score: '7-6, 6-7, 6-4',
    },
  };

  const scenario = scenarios[scenarioName];
  if (!scenario) {
    console.error('❌ Unknown scenario:', scenarioName);
    console.log('Available scenarios:', Object.keys(scenarios));
    return;
  }

  try {
    const eventRef = db.collection('events').doc(TEST_CONFIG.eventId);

    const updateData = {
      result: {
        ...scenario,
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        recordedBy: scenario.winnerId,
      },
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await eventRef.update(updateData);
    console.log(`✅ Test scenario '${scenarioName}' added successfully!`);

  } catch (error) {
    console.error('❌ Error adding test scenario:', error);
  } finally {
    admin.app().delete();
  }
}

// Run the script
const scenario = process.argv[2];
if (scenario) {
  addTestScenario(scenario);
} else {
  addTestMatchResult();
}