/**
 * 🔥 DATA UNIFICATION WAR - Legacy Location Migration Script
 *
 * This script enforces SINGLE SOURCE OF TRUTH for location data.
 * It moves all legacy root-level 'location' fields to 'profile.location'
 * and removes the old fields to eliminate data structure chaos.
 *
 * CRITICAL: This is a ONE-TIME operation that cannot be undone!
 */

// For Firebase Admin SDK (Node.js environment)
const admin = require('firebase-admin');

// Initialize Firebase Admin for emulator
// FIRESTORE_EMULATOR_HOST environment variable will be set by npm script
admin.initializeApp({
  projectId: 'lightning-tennis-community'
});

console.log('🔥 Firebase Admin initialized for emulator connection');

const db = admin.firestore();

/**
 * Main migration function - THE DATA UNIFICATION WAR
 */
async function migrateLocationData() {
  console.log('\n🚀 === DATA UNIFICATION WAR BEGINS ===');
  console.log('🎯 Mission: Eliminate dual location data structures');
  console.log('📍 Target: Move all root-level "location" to "profile.location"');
  console.log('💥 Outcome: SINGLE SOURCE OF TRUTH\n');

  let totalUsers = 0;
  let migratedUsers = 0;
  let skippedUsers = 0;
  let errorUsers = 0;

  try {
    // Get all users from Firestore
    console.log('📊 Scanning all users in database...');
    const usersSnapshot = await db.collection('users').get();
    totalUsers = usersSnapshot.docs.length;

    console.log(`📋 Found ${totalUsers} users to analyze\n`);

    // Process each user document
    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();

      try {
        // Check if user has legacy root-level location data
        if (userData.location && typeof userData.location === 'object') {
          console.log(`🔧 [${userId}] Migrating legacy location data...`);

          // Prepare the update - move to profile.location and delete old field
          const updates = {
            'profile.location': userData.location,
            'location': admin.firestore.FieldValue.delete()
          };

          // Ensure profile object exists
          if (!userData.profile) {
            updates.profile = { location: userData.location };
            delete updates['profile.location'];
          }

          // Perform the migration
          await doc.ref.update(updates);

          console.log(`✅ [${userId}] Migration successful`);
          console.log(`   📍 Old: users/${userId}/location`);
          console.log(`   📍 New: users/${userId}/profile.location`);

          migratedUsers++;

        } else if (userData.profile?.location) {
          // User already has correct data structure
          console.log(`✨ [${userId}] Already using correct profile.location structure`);
          skippedUsers++;

        } else {
          // User has no location data
          console.log(`⚪ [${userId}] No location data found`);
          skippedUsers++;
        }

      } catch (userError) {
        console.error(`❌ [${userId}] Migration failed:`, userError.message);
        errorUsers++;
      }
    }

  } catch (error) {
    console.error('💥 CRITICAL ERROR during migration:', error);
    process.exit(1);
  }

  // Migration summary
  console.log('\n🏁 === DATA UNIFICATION WAR COMPLETE ===');
  console.log(`📊 Total users processed: ${totalUsers}`);
  console.log(`✅ Successfully migrated: ${migratedUsers}`);
  console.log(`⚪ Already correct/no data: ${skippedUsers}`);
  console.log(`❌ Errors: ${errorUsers}`);

  if (migratedUsers > 0) {
    console.log('\n🎉 VICTORY! Location data structure has been unified!');
    console.log('📍 All location data now lives at: users/{uid}/profile.location');
    console.log('💥 Legacy root-level location fields have been eliminated');
    console.log('🛡️ SINGLE SOURCE OF TRUTH achieved');
  } else {
    console.log('\n✨ No migration needed - all data already in correct format');
  }
}

/**
 * Safety check function
 */
async function validateMigration() {
  console.log('\n🔍 === POST-MIGRATION VALIDATION ===');

  const usersSnapshot = await db.collection('users').get();
  let validUsers = 0;
  let invalidUsers = 0;

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();

    // Check if user still has root-level location (should be none)
    if (userData.location && typeof userData.location === 'object') {
      console.log(`❌ [${doc.id}] Still has legacy location field!`);
      invalidUsers++;
    } else {
      validUsers++;
    }
  }

  console.log(`✅ Users with clean structure: ${validUsers}`);
  console.log(`❌ Users with legacy fields: ${invalidUsers}`);

  if (invalidUsers === 0) {
    console.log('🎉 VALIDATION PASSED - All users have clean data structure!');
  } else {
    console.log('⚠️ VALIDATION FAILED - Some users still have legacy fields');
  }
}

/**
 * Execute migration
 */
async function executeMigration() {
  try {
    await migrateLocationData();
    await validateMigration();
    console.log('\n🏆 DATA UNIFICATION WAR: MISSION ACCOMPLISHED');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    // Close Firebase connection
    await admin.app().delete();
  }
}

// Run if called directly
if (require.main === module) {
  executeMigration();
}

module.exports = { migrateLocationData, validateMigration };