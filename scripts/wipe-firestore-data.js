/**
 * 🌊 Operation "Genesis Wave" - Firestore Data Wipe Script
 * =========================================================
 *
 * 💀 WARNING: THIS SCRIPT PERMANENTLY DELETES ALL DATA FROM FIRESTORE 💀
 *
 * This is a one-time script to reset the database for production launch.
 * It recursively deletes all documents from all collections.
 *
 * Safety Features:
 * 1. Requires --force flag
 * 2. Requires GENESIS_WAVE=true environment variable
 * 3. 10-second countdown before execution
 * 4. Preserves knowledge_base and system_settings collections
 *
 * Usage:
 *   GENESIS_WAVE=true node scripts/wipe-firestore-data.js --force
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
// Uses GOOGLE_APPLICATION_CREDENTIALS environment variable or default credentials
admin.initializeApp();
const db = admin.firestore();

// ============================================
// 📋 ALL COLLECTIONS TO WIPE (from firestore.rules)
// ============================================
const COLLECTIONS_TO_WIPE = [
  // User data
  'users',

  // Match & Event data
  'lightning_matches',
  'events',
  'events_archive',
  'participation_applications',
  'participation_applications_archive',

  // Chat data
  'event_chat_rooms',
  'chat_messages',
  'clubChat',
  'directChat',
  'conversations',
  'meetup_chat',

  // Club data
  'clubs',
  'pickleball_clubs',
  'club_events',
  'clubMembers',
  'club_join_requests',
  'clubInvitations',
  'club_meetups',
  'regular_meetups',
  'meetup_participants',

  // Social data
  'friendships',
  'feed',
  'social_feed',
  'activity_notifications',
  'notifications',
  'notification_logs',
  'sportsmanship_history',

  // Tournament data
  'tournaments',
  'tournament_matches',
  'tournamentRegistrations',
  'league_participants',
  'leagues',
  'tournament_events',
  'teams',

  // Player data
  'player_stats',
  'achievements',
  'match_history',

  // Community data
  'community_groups',
  'pickleball_courts',
  'coach_lessons',
  'pickleball_services',

  // Dues data
  'club_dues_settings',
  'member_dues_records',
  'member_yearly_exemptions',
  'member_quarterly_exemptions',
  'annual_dues_reports',
];

// Collections to PRESERVE (system data)
const PRESERVED_COLLECTIONS = [
  'knowledge_base', // AI chatbot data - manually curated
  'system_settings', // System configuration
];

// ============================================
// 🔧 UTILITY FUNCTIONS
// ============================================

/**
 * Delete a collection recursively (including subcollections)
 */
async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);

  let totalDeleted = 0;
  let hasMore = true;

  while (hasMore) {
    const snapshot = await collectionRef.limit(batchSize).get();

    if (snapshot.empty) {
      hasMore = false;
      continue;
    }

    const batch = db.batch();
    const docsToDelete = snapshot.docs;

    for (const doc of docsToDelete) {
      // Check for subcollections and delete them first
      const subcollections = await doc.ref.listCollections();
      for (const subcollection of subcollections) {
        await deleteCollection(subcollection.path, batchSize);
      }

      batch.delete(doc.ref);
    }

    await batch.commit();
    totalDeleted += docsToDelete.length;

    // Log progress
    process.stdout.write(`\r  Deleted ${totalDeleted} documents from ${collectionPath}...`);

    // Continue until no more documents
    hasMore = snapshot.size === batchSize;
  }

  if (totalDeleted > 0) {
    console.log(`\r  ✅ Deleted ${totalDeleted} documents from ${collectionPath}`);
  } else {
    console.log(`  ⏭️  Collection ${collectionPath} is empty`);
  }

  return totalDeleted;
}

/**
 * Countdown timer before execution
 */
async function countdown(seconds) {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r⏰ Starting in ${i} seconds... (Press Ctrl+C to abort)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\r🚀 Starting Genesis Wave...                              ');
}

/**
 * Main execution function
 */
async function runGenesisWave() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🌊 OPERATION "GENESIS WAVE" - FIRESTORE DATA WIPE SCRIPT 🌊  ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n');
  console.log('  💀 WARNING: This will PERMANENTLY DELETE ALL DATA! 💀');
  console.log('\n');

  // ============================================
  // 🔒 SAFETY CHECK #1: --force flag
  // ============================================
  if (!process.argv.includes('--force')) {
    console.log('❌ Aborting. Missing --force flag.');
    console.log(
      '   To proceed, run: GENESIS_WAVE=true node scripts/wipe-firestore-data.js --force'
    );
    process.exit(1);
  }

  // ============================================
  // 🔒 SAFETY CHECK #2: GENESIS_WAVE environment variable
  // ============================================
  if (process.env.GENESIS_WAVE !== 'true') {
    console.log('❌ Aborting. Missing GENESIS_WAVE=true environment variable.');
    console.log(
      '   To proceed, run: GENESIS_WAVE=true node scripts/wipe-firestore-data.js --force'
    );
    process.exit(1);
  }

  // Show what will be deleted
  console.log('📋 Collections to DELETE:');
  COLLECTIONS_TO_WIPE.forEach(c => console.log(`   - ${c}`));
  console.log('\n');

  console.log('🛡️ Collections to PRESERVE:');
  PRESERVED_COLLECTIONS.forEach(c => console.log(`   - ${c}`));
  console.log('\n');

  // ============================================
  // 🔒 SAFETY CHECK #3: 10-second countdown
  // ============================================
  await countdown(10);

  // ============================================
  // 🌊 EXECUTE GENESIS WAVE
  // ============================================
  console.log('\n');
  console.log('🌊 Genesis Wave in progress...');
  console.log('─────────────────────────────────────────────────────');

  let totalCollectionsWiped = 0;
  let totalDocumentsDeleted = 0;

  for (const collectionPath of COLLECTIONS_TO_WIPE) {
    try {
      const deletedCount = await deleteCollection(collectionPath);
      if (deletedCount > 0) {
        totalCollectionsWiped++;
        totalDocumentsDeleted += deletedCount;
      }
    } catch (error) {
      console.error(`  ❌ Error wiping ${collectionPath}:`, error.message);
    }
  }

  // ============================================
  // 📊 FINAL REPORT
  // ============================================
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🎉 GENESIS WAVE COMPLETE - DATABASE RESET SUCCESSFUL 🎉     ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n');
  console.log(`  📊 Summary:`);
  console.log(`     - Collections wiped: ${totalCollectionsWiped}`);
  console.log(`     - Documents deleted: ${totalDocumentsDeleted}`);
  console.log(`     - Preserved: ${PRESERVED_COLLECTIONS.join(', ')}`);
  console.log('\n');
  console.log('  🌅 The database is now in a pristine, "Genesis" state.');
  console.log('  🚀 Ready for production launch!');
  console.log('\n');

  process.exit(0);
}

// Run the script
runGenesisWave().catch(error => {
  console.error('\n❌ Genesis Wave failed:', error);
  process.exit(1);
});
