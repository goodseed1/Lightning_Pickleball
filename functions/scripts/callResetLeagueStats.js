/**
 * Script to call resetLeagueStats Cloud Function
 *
 * This script directly calls the deployed Cloud Function using Admin SDK
 * to reset corrupted league statistics.
 *
 * Usage:
 *   node scripts/callResetLeagueStats.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with default credentials
// This will use the Firebase CLI credentials automatically
admin.initializeApp({
  projectId: 'lightning-pickleball-community',
});

const db = admin.firestore();

async function resetLeagueStats() {
  console.log('🔄 Starting league stats reset process...\n');

  const batch = db.batch();
  let updateCount = 0;

  try {
    // Get all club memberships using collectionGroup
    const membershipsSnapshot = await db.collectionGroup('clubMemberships').get();

    console.log(`📊 Found ${membershipsSnapshot.size} memberships to process\n`);

    membershipsSnapshot.forEach(doc => {
      const data = doc.data();

      // Only update if there are league stats to reset
      if (
        data.clubStats &&
        (data.clubStats.matchesPlayed > 0 || data.clubStats.wins > 0 || data.clubStats.losses > 0)
      ) {
        console.log(`📝 Resetting stats for membership: ${doc.id}`);
        console.log(
          `   Before: MP=${data.clubStats.matchesPlayed} W=${data.clubStats.wins} L=${data.clubStats.losses}`
        );

        batch.update(doc.ref, {
          'clubStats.matchesPlayed': 0,
          'clubStats.wins': 0,
          'clubStats.losses': 0,
          'clubStats.draws': 0,
        });

        updateCount++;
      }
    });

    // Commit the batch
    await batch.commit();

    console.log(`\n✅ Successfully reset ${updateCount} memberships`);
    console.log(`📊 Total memberships checked: ${membershipsSnapshot.size}`);
    console.log(`📊 Memberships updated: ${updateCount}`);
    console.log(`📊 Memberships unchanged: ${membershipsSnapshot.size - updateCount}`);

    return {
      success: true,
      message: `Successfully reset league stats for ${updateCount} memberships`,
      updatedCount: updateCount,
      totalChecked: membershipsSnapshot.size,
    };
  } catch (error) {
    console.error('❌ Error resetting league stats:', error);
    throw error;
  }
}

// Execute the function
resetLeagueStats()
  .then(result => {
    console.log('\n🎉 Reset complete!');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Reset failed!');
    console.error(error);
    process.exit(1);
  });
