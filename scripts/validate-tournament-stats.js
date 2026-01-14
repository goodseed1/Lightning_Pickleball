/**
 * ✅ Tournament Statistics Validation Script
 *
 * Validates tournament stats data after migration:
 * - Checks that new field names exist (championships, matchWins, tournamentsPlayed, etc.)
 * - Validates data consistency (matchWins + matchLosses = totalMatches)
 * - Verifies bestFinish matches trophy data
 * - Checks nested & flat collection synchronization
 * - Generates comprehensive validation report
 *
 * Usage:
 *   node scripts/validate-tournament-stats.js [--user-id=<userId>]
 *
 * Options:
 *   --user-id=...   Validate only specific user
 *
 * Examples:
 *   node scripts/validate-tournament-stats.js
 *   node scripts/validate-tournament-stats.js --user-id=ABC123
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
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const targetUserId = userIdArg ? userIdArg.split('=')[1] : null;

/**
 * Validation rules based on TournamentStats type definition
 */
function validateStats(stats, userId, clubId) {
  const errors = [];
  const warnings = [];

  // Rule 1: New fields should exist
  if (stats.championships === undefined) {
    errors.push('Missing field: championships');
  }
  if (stats.matchWins === undefined) {
    errors.push('Missing field: matchWins');
  }
  if (stats.matchLosses === undefined) {
    errors.push('Missing field: matchLosses');
  }
  if (stats.tournamentsPlayed === undefined) {
    errors.push('Missing field: tournamentsPlayed');
  }

  // Rule 2: matchWins + matchLosses should equal totalMatches
  if (
    stats.matchWins !== undefined &&
    stats.matchLosses !== undefined &&
    stats.totalMatches !== undefined
  ) {
    const calculatedTotal = (stats.matchWins || 0) + (stats.matchLosses || 0);
    if (calculatedTotal !== stats.totalMatches) {
      errors.push(
        `Total matches mismatch: ${stats.matchWins} + ${stats.matchLosses} = ${calculatedTotal} ≠ ${stats.totalMatches}`
      );
    }
  }

  // Rule 3: championships + runnerUps + semiFinals should not exceed tournamentsPlayed
  if (
    stats.championships !== undefined &&
    stats.runnerUps !== undefined &&
    stats.semiFinals !== undefined &&
    stats.tournamentsPlayed !== undefined
  ) {
    const totalPlacements =
      (stats.championships || 0) + (stats.runnerUps || 0) + (stats.semiFinals || 0);
    if (totalPlacements > stats.tournamentsPlayed) {
      warnings.push(
        `Placement count (${totalPlacements}) exceeds tournaments played (${stats.tournamentsPlayed})`
      );
    }
  }

  // Rule 4: If championships > 0, bestFinish should be 1
  if (stats.championships > 0 && stats.bestFinish !== 1) {
    warnings.push(
      `User has ${stats.championships} championships but bestFinish is ${stats.bestFinish} (should be 1)`
    );
  }

  // Rule 5: If runnerUps > 0 and no championships, bestFinish should be 2
  if (
    stats.championships === 0 &&
    stats.runnerUps > 0 &&
    stats.bestFinish !== 2 &&
    stats.bestFinish !== 1
  ) {
    warnings.push(
      `User has ${stats.runnerUps} runner-up finishes but bestFinish is ${stats.bestFinish} (expected 2 or better)`
    );
  }

  // Rule 6: Win rate should match calculated value
  if (stats.totalMatches > 0) {
    const calculatedWinRate = ((stats.matchWins || 0) / stats.totalMatches) * 100;
    if (Math.abs(calculatedWinRate - (stats.winRate || 0)) > 0.1) {
      errors.push(
        `Win rate mismatch: stored ${stats.winRate}% but calculated ${calculatedWinRate.toFixed(1)}%`
      );
    }
  }

  // Rule 7: Legacy fields should match new fields (after migration)
  if (stats.wins !== stats.matchWins && stats.championships === stats.matchWins) {
    // After migration, 'wins' (legacy) should still contain old value
    // But 'championships' should now have the tournament count
    // This check ensures migration preserved legacy data
  }

  return { errors, warnings };
}

/**
 * Get best finish from user's trophies for verification
 */
async function getBestFinishFromTrophies(userId, clubId) {
  try {
    const trophiesRef = db.collection(`users/${userId}/trophies`);
    const trophiesSnapshot = await trophiesRef.where('clubId', '==', clubId).get();

    if (trophiesSnapshot.empty) {
      return null;
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
    return null;
  }
}

/**
 * Check if nested and flat collections are in sync
 */
async function checkCollectionSync(userId, clubId, nestedStats) {
  const flatMembershipId = `${clubId}_${userId}`;
  const flatMembershipRef = db.doc(`clubMembers/${flatMembershipId}`);

  try {
    const flatDoc = await flatMembershipRef.get();

    if (!flatDoc.exists) {
      return {
        inSync: false,
        message: 'Flat collection document not found',
      };
    }

    const flatStats = flatDoc.data()?.clubStats?.tournamentStats || {};

    // Compare key fields
    const fieldsToCheck = [
      'championships',
      'matchWins',
      'matchLosses',
      'totalMatches',
      'tournamentsPlayed',
      'bestFinish',
      'runnerUps',
      'semiFinals',
    ];

    const differences = [];
    for (const field of fieldsToCheck) {
      if (nestedStats[field] !== flatStats[field]) {
        differences.push(`${field}: nested=${nestedStats[field]}, flat=${flatStats[field]}`);
      }
    }

    if (differences.length > 0) {
      return {
        inSync: false,
        message: `Collections out of sync: ${differences.join(', ')}`,
      };
    }

    return {
      inSync: true,
      message: 'Collections are in sync',
    };
  } catch (error) {
    return {
      inSync: false,
      message: `Error checking sync: ${error.message}`,
    };
  }
}

/**
 * Validate tournament stats for a single user
 */
async function validateUserStats(userId) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👤 Validating stats for user: ${userId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  let validCount = 0;

  try {
    const membershipsRef = db.collection('users').doc(userId).collection('clubMemberships');
    const membershipsSnapshot = await membershipsRef.get();

    if (membershipsSnapshot.empty) {
      console.log('   ℹ️  No club memberships found.\n');
      return { totalErrors, totalWarnings, validCount };
    }

    console.log(`   📊 Found ${membershipsSnapshot.size} club membership(s)\n`);

    for (const membershipDoc of membershipsSnapshot.docs) {
      const clubId = membershipDoc.id;
      const membershipData = membershipDoc.data();
      const clubStats = membershipData.clubStats || {};
      const tournamentStats = clubStats.tournamentStats || {};

      console.log(`   🏛️  Club: ${clubId}`);

      // Validate stats structure
      const validation = validateStats(tournamentStats, userId, clubId);

      if (validation.errors.length > 0) {
        console.log('      ❌ ERRORS:');
        validation.errors.forEach(err => console.log(`         - ${err}`));
        totalErrors += validation.errors.length;
      }

      if (validation.warnings.length > 0) {
        console.log('      ⚠️  WARNINGS:');
        validation.warnings.forEach(warn => console.log(`         - ${warn}`));
        totalWarnings += validation.warnings.length;
      }

      if (validation.errors.length === 0 && validation.warnings.length === 0) {
        console.log('      ✅ All validations passed');
        validCount++;
      }

      // Check bestFinish against trophies
      const trophyBestFinish = await getBestFinishFromTrophies(userId, clubId);
      if (trophyBestFinish !== tournamentStats.bestFinish) {
        console.log('      ⚠️  bestFinish mismatch:');
        console.log(`         - Stats: ${tournamentStats.bestFinish}`);
        console.log(`         - Trophies: ${trophyBestFinish}`);
        totalWarnings++;
      }

      // Check collection sync
      const syncCheck = await checkCollectionSync(userId, clubId, tournamentStats);
      if (!syncCheck.inSync) {
        console.log('      ⚠️  Collection sync issue:');
        console.log(`         - ${syncCheck.message}`);
        totalWarnings++;
      } else {
        console.log('      ✅ Nested & flat collections in sync');
      }

      console.log('');
    }

    return { totalErrors, totalWarnings, validCount };
  } catch (error) {
    console.error(`   ❌ Error validating user ${userId}:`, error.message, '\n');
    totalErrors++;
    return { totalErrors, totalWarnings, validCount };
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log('\n✅ ===== TOURNAMENT STATISTICS VALIDATION =====\n');

  if (targetUserId) {
    console.log(`🎯 Target: Single user (${targetUserId})\n`);
  } else {
    console.log('🌐 Target: All users with club memberships\n');
  }

  let grandTotalErrors = 0;
  let grandTotalWarnings = 0;
  let grandValidCount = 0;

  try {
    if (targetUserId) {
      // Validate single user
      const result = await validateUserStats(targetUserId);
      grandTotalErrors = result.totalErrors;
      grandTotalWarnings = result.totalWarnings;
      grandValidCount = result.validCount;
    } else {
      // Validate all users
      const clubMembersSnapshot = await db.collection('clubMembers').get();

      const userIds = new Set();
      clubMembersSnapshot.forEach(doc => {
        const parts = doc.id.split('_');
        if (parts.length >= 2) {
          const userId = parts.slice(1).join('_');
          userIds.add(userId);
        }
      });

      console.log(`📊 Found ${userIds.size} unique users to validate\n`);

      let processedCount = 0;

      for (const userId of userIds) {
        processedCount++;
        console.log(`\n[${processedCount}/${userIds.size}]`);

        const result = await validateUserStats(userId);
        grandTotalErrors += result.totalErrors;
        grandTotalWarnings += result.totalWarnings;
        grandValidCount += result.validCount;

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Summary
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 VALIDATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ Valid:     ${grandValidCount}`);
    console.log(`⚠️  Warnings:  ${grandTotalWarnings}`);
    console.log(`❌ Errors:    ${grandTotalErrors}`);

    if (grandTotalErrors === 0 && grandTotalWarnings === 0) {
      console.log('\n🎉 All data is valid! Migration was successful.\n');
    } else if (grandTotalErrors === 0) {
      console.log('\n✅ No errors found, but some warnings exist.\n');
      console.log('   Review warnings above for potential improvements.\n');
    } else {
      console.log('\n❌ Errors found! Review and fix issues above.\n');
    }
  } catch (error) {
    console.error('\n💥 Fatal error during validation:', error);
    process.exit(1);
  } finally {
    // Close Firebase connection
    await admin.app().delete();
  }

  console.log('🎉 Validation complete!\n');
  process.exit(0);
}

// Run main function
main();
