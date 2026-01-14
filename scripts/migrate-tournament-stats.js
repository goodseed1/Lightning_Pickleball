/**
 * 🔄 Tournament Statistics Migration Script
 *
 * Migrates legacy tournament stats field names to new, unambiguous names:
 * - 'wins' → 'championships' (tournament 1st place finishes)
 * - 'tournamentWins' → 'matchWins' (match wins in tournaments)
 * - 'tournamentLosses' → 'matchLosses' (match losses in tournaments)
 * - 'participations' → 'tournamentsPlayed' (tournaments entered)
 *
 * Also recalculates bestFinish based on trophy data.
 *
 * Usage:
 *   node scripts/migrate-tournament-stats.js [--dry-run] [--user-id=<userId>]
 *
 * Options:
 *   --dry-run       Show what would be changed without actually updating
 *   --user-id=...   Migrate only specific user (for testing)
 *
 * Examples:
 *   node scripts/migrate-tournament-stats.js --dry-run
 *   node scripts/migrate-tournament-stats.js --user-id=ABC123 --dry-run
 *   node scripts/migrate-tournament-stats.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Parse command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const targetUserId = userIdArg ? userIdArg.split('=')[1] : null;

/**
 * Get best finish from user's trophies
 */
async function getBestFinishFromTrophies(userId, clubId) {
  try {
    const trophiesRef = db.collection(`users/${userId}/trophies`);
    const trophiesSnapshot = await trophiesRef.where('clubId', '==', clubId).get();

    if (trophiesSnapshot.empty) {
      return null; // No trophies for this club
    }

    let bestPosition = 999;

    trophiesSnapshot.forEach(doc => {
      const trophy = doc.data();
      if (trophy.position && trophy.position < bestPosition) {
        bestPosition = trophy.position;
      }
    });

    return bestPosition === 999 ? null : bestPosition;
  } catch (error) {
    console.error(`   ⚠️  Error fetching trophies for user ${userId}:`, error.message);
    return null;
  }
}

/**
 * Migrate tournament stats for a single user
 */
async function migrateUserStats(userId) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👤 Migrating stats for user: ${userId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    // Get all club memberships for this user
    const membershipsRef = db.collection('users').doc(userId).collection('clubMemberships');
    const membershipsSnapshot = await membershipsRef.get();

    if (membershipsSnapshot.empty) {
      console.log('   ℹ️  No club memberships found.\n');
      return { migratedCount, skippedCount, errorCount };
    }

    console.log(`   📊 Found ${membershipsSnapshot.size} club membership(s)\n`);

    for (const membershipDoc of membershipsSnapshot.docs) {
      const clubId = membershipDoc.id;
      const membershipData = membershipDoc.data();
      const clubStats = membershipData.clubStats || {};
      const tournamentStats = clubStats.tournamentStats || {};

      console.log(`   🏛️  Club: ${clubId}`);

      // Check if migration is needed
      const needsMigration =
        tournamentStats.wins !== undefined ||
        tournamentStats.participations !== undefined ||
        tournamentStats.championships === undefined;

      if (!needsMigration) {
        console.log('      ✅ Already migrated, skipping...\n');
        skippedCount++;
        continue;
      }

      console.log('      📋 Current stats:', {
        wins: tournamentStats.wins,
        runnerUps: tournamentStats.runnerUps,
        semiFinals: tournamentStats.semiFinals,
        participations: tournamentStats.participations,
        tournamentWins: tournamentStats.tournamentWins,
        tournamentLosses: tournamentStats.tournamentLosses,
        totalMatches: tournamentStats.totalMatches,
        bestFinish: tournamentStats.bestFinish,
      });

      // Prepare new stats
      const newStats = {
        // 🏆 Tournament placement statistics (NEW clear names)
        championships: tournamentStats.wins || 0, // ⚠️ Legacy: actually match wins!
        runnerUps: tournamentStats.runnerUps || 0,
        semiFinals: tournamentStats.semiFinals || 0,

        // 🎾 Match statistics (NEW clear names)
        matchWins: tournamentStats.tournamentWins || 0,
        matchLosses: tournamentStats.tournamentLosses || 0,
        totalMatches: tournamentStats.totalMatches || 0,
        winRate:
          tournamentStats.totalMatches > 0
            ? ((tournamentStats.tournamentWins || 0) / tournamentStats.totalMatches) * 100
            : 0,

        // 📊 Participation (NEW clear name)
        tournamentsPlayed: tournamentStats.participations || 0, // ⚠️ Legacy: actually total matches!

        // 🎯 bestFinish: Recalculate from trophies
        bestFinish: await getBestFinishFromTrophies(userId, clubId),

        // 📦 Keep legacy fields for backward compatibility
        wins: tournamentStats.wins || 0,
        participations: tournamentStats.participations || 0,
        tournamentWins: tournamentStats.tournamentWins || 0,
        tournamentLosses: tournamentStats.tournamentLosses || 0,
      };

      console.log('      🆕 New stats:', newStats);

      if (!isDryRun) {
        try {
          // Update nested collection (primary data source)
          await membershipDoc.ref.set(
            {
              clubStats: {
                tournamentStats: newStats,
              },
            },
            { merge: true }
          );

          // Also update flat collection if it exists
          const flatMembershipId = `${clubId}_${userId}`;
          const flatMembershipRef = db.doc(`clubMembers/${flatMembershipId}`);
          const flatMembershipDoc = await flatMembershipRef.get();

          if (flatMembershipDoc.exists) {
            await flatMembershipRef.set(
              {
                clubStats: {
                  tournamentStats: newStats,
                },
              },
              { merge: true }
            );
            console.log('      ✅ Updated both nested & flat collections\n');
          } else {
            console.log('      ✅ Updated nested collection (flat collection not found)\n');
          }

          migratedCount++;
        } catch (error) {
          console.error('      ❌ Error updating stats:', error.message, '\n');
          errorCount++;
        }
      } else {
        console.log('      🔍 DRY RUN: Would update stats (not actually updating)\n');
        migratedCount++;
      }
    }

    return { migratedCount, skippedCount, errorCount };
  } catch (error) {
    console.error(`   ❌ Error migrating user ${userId}:`, error.message, '\n');
    errorCount++;
    return { migratedCount, skippedCount, errorCount };
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('\n🔄 ===== TOURNAMENT STATISTICS MIGRATION =====\n');

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE: No actual changes will be made\n');
  } else {
    console.log('🚨 LIVE MODE: Database will be updated!\n');
  }

  if (targetUserId) {
    console.log(`🎯 Target: Single user (${targetUserId})\n`);
  } else {
    console.log('🌐 Target: All users with club memberships\n');
  }

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  try {
    if (targetUserId) {
      // Migrate single user
      const result = await migrateUserStats(targetUserId);
      totalMigrated = result.migratedCount;
      totalSkipped = result.skippedCount;
      totalErrors = result.errorCount;
    } else {
      // Migrate all users
      // Strategy: Find all unique user IDs from clubMembers flat collection
      const clubMembersSnapshot = await db.collection('clubMembers').get();

      const userIds = new Set();
      clubMembersSnapshot.forEach(doc => {
        // Document ID format: {clubId}_{userId}
        const parts = doc.id.split('_');
        if (parts.length >= 2) {
          // userId is everything after the first underscore
          const userId = parts.slice(1).join('_');
          userIds.add(userId);
        }
      });

      console.log(`📊 Found ${userIds.size} unique users to migrate\n`);

      let processedCount = 0;

      for (const userId of userIds) {
        processedCount++;
        console.log(`\n[${processedCount}/${userIds.size}]`);

        const result = await migrateUserStats(userId);
        totalMigrated += result.migratedCount;
        totalSkipped += result.skippedCount;
        totalErrors += result.errorCount;

        // Add small delay to avoid overwhelming Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Summary
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MIGRATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ Migrated:  ${totalMigrated}`);
    console.log(`⏭️  Skipped:   ${totalSkipped}`);
    console.log(`❌ Errors:    ${totalErrors}`);

    if (isDryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('   Run without --dry-run to apply changes.\n');
    } else {
      console.log('\n✅ Migration completed!\n');
    }
  } catch (error) {
    console.error('\n💥 Fatal error during migration:', error);
    process.exit(1);
  } finally {
    // Close Firebase connection
    await admin.app().delete();
  }

  console.log('🎉 Script finished!\n');
  process.exit(0);
}

// Run main function
main();
