/**
 * 🔄 Run Match History Migration
 *
 * One-time script to migrate existing match_history data
 * to separated global_match_history and club_match_history collections
 */

const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'lightning-pickleball-community',
});

const functions = admin.functions();

async function runMigration() {
  console.log('🔄 Starting migration...\n');

  try {
    // Call the migration Cloud Function
    const result = await functions.httpsCallable('migrateMatchHistory').call({
      secretKey: 'migrate-match-history-2025',
    });

    console.log('✅ Migration completed!\n');
    console.log('📊 Migration Statistics:');
    console.log(JSON.stringify(result.data.stats, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
