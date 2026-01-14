/**
 * 🔧 Fix "Unknown User" in Feed Items
 *
 * This script finds feed items with actorName = "Unknown User"
 * and updates them with the actual user name from the users collection.
 *
 * Usage: GOOGLE_APPLICATION_CREDENTIALS="../service-account-key.json" node scripts/fixUnknownUserFeed.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function fixUnknownUserFeed() {
  console.log('🔍 Finding feed items with "Unknown User"...\n');

  try {
    // Find all feed items with actorName = "Unknown User"
    const feedSnapshot = await db.collection('feed').where('actorName', '==', 'Unknown User').get();

    if (feedSnapshot.empty) {
      console.log('✅ No feed items with "Unknown User" found!');
      return;
    }

    console.log(`📋 Found ${feedSnapshot.size} feed items to fix\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const feedDoc of feedSnapshot.docs) {
      const feedData = feedDoc.data();
      const actorId = feedData.actorId;

      if (!actorId) {
        console.log(`⚠️ Feed ${feedDoc.id} has no actorId, skipping...`);
        errorCount++;
        continue;
      }

      // Get user name from users collection
      try {
        const userDoc = await db.collection('users').doc(actorId).get();

        if (!userDoc.exists) {
          console.log(`⚠️ User ${actorId} not found for feed ${feedDoc.id}`);
          errorCount++;
          continue;
        }

        const userData = userDoc.data();
        const actualName = userData.displayName || userData.nickname || userData.name || 'Unknown';

        if (actualName === 'Unknown') {
          console.log(`⚠️ User ${actorId} has no name fields, skipping feed ${feedDoc.id}`);
          errorCount++;
          continue;
        }

        // Update the feed item
        await feedDoc.ref.update({
          actorName: actualName,
        });

        console.log(`✅ Fixed feed ${feedDoc.id}: "Unknown User" → "${actualName}"`);
        fixedCount++;
      } catch (userError) {
        console.error(`❌ Error fetching user ${actorId}:`, userError.message);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log(`✅ Fixed: ${fixedCount} feed items`);
    console.log(`⚠️ Errors: ${errorCount} feed items`);
    console.log('========================================');
  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  }
}

// Run the script
fixUnknownUserFeed()
  .then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
