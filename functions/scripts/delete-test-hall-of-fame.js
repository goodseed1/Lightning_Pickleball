/**
 * 🧹 DELETE TEST HALL OF FAME DATA
 *
 * This script deletes test trophies and badges from Nunim's account
 * to prepare for real trophy system testing.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json" node scripts/delete-test-hall-of-fame.js
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// 🎯 Target user: 누님
const userId = '0swKNU8wvIPgvsEogypUnsc4w1w1';

async function deleteTestHallOfFame() {
  console.log('🧹 Starting test Hall of Fame data cleanup...');
  console.log(`👤 Target user: ${userId} (누님)`);
  console.log('');

  try {
    // Delete all trophies
    console.log('🏆 Deleting trophies...');
    const trophiesRef = db.collection(`users/${userId}/trophies`);
    const trophiesSnapshot = await trophiesRef.get();

    const trophyCount = trophiesSnapshot.size;
    console.log(`   Found ${trophyCount} trophies`);

    const trophyBatch = db.batch();
    trophiesSnapshot.docs.forEach(doc => {
      console.log(`   - Deleting trophy: ${doc.id}`);
      trophyBatch.delete(doc.ref);
    });

    if (trophyCount > 0) {
      await trophyBatch.commit();
      console.log(`   ✅ Deleted ${trophyCount} trophies`);
    } else {
      console.log(`   ℹ️  No trophies to delete`);
    }
    console.log('');

    // Delete all badges
    console.log('🏅 Deleting badges...');
    const badgesRef = db.collection(`users/${userId}/badges`);
    const badgesSnapshot = await badgesRef.get();

    const badgeCount = badgesSnapshot.size;
    console.log(`   Found ${badgeCount} badges`);

    const badgeBatch = db.batch();
    badgesSnapshot.docs.forEach(doc => {
      console.log(`   - Deleting badge: ${doc.id}`);
      badgeBatch.delete(doc.ref);
    });

    if (badgeCount > 0) {
      await badgeBatch.commit();
      console.log(`   ✅ Deleted ${badgeCount} badges`);
    } else {
      console.log(`   ℹ️  No badges to delete`);
    }
    console.log('');

    // Summary
    console.log('🎉 Cleanup complete!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Trophies deleted: ${trophyCount}`);
    console.log(`   - Badges deleted: ${badgeCount}`);
    console.log('');
    console.log('✅ Hall of Fame is now clear and ready for real testing!');
    console.log('');
    console.log('📱 Next steps:');
    console.log('   1. Refresh the app (pull down on My Profile)');
    console.log('   2. Check that Hall of Fame shows empty state');
    console.log('   3. Create a new tournament');
    console.log('   4. Complete the tournament with 누님 winning');
    console.log('   5. Verify real trophy appears in Hall of Fame');
  } catch (error) {
    console.error('❌ Error deleting test data:', error);
    throw error;
  }
}

// Run the cleanup
deleteTestHallOfFame()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
