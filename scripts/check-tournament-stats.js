/**
 * 🔍 Tournament Statistics Data Checker
 *
 * This script checks the actual Firestore data for tournament statistics
 * to identify data inconsistencies and field mapping issues.
 *
 * Usage:
 *   node scripts/check-tournament-stats.js <userId>
 *
 * Example:
 *   node scripts/check-tournament-stats.js ABC123
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

/**
 * Format field value for display
 */
function formatValue(value) {
  if (value === null || value === undefined) {
    return '❌ null/undefined';
  }
  if (typeof value === 'number') {
    return `✅ ${value}`;
  }
  if (typeof value === 'object' && value.toDate) {
    return `📅 ${value.toDate().toISOString()}`;
  }
  return `✅ ${JSON.stringify(value)}`;
}

/**
 * Validate tournament stats consistency
 */
function validateStats(stats) {
  const issues = [];

  // Check if wins + losses = totalMatches
  if (
    stats.tournamentWins !== undefined &&
    stats.tournamentLosses !== undefined &&
    stats.totalMatches !== undefined
  ) {
    const calculatedTotal = (stats.tournamentWins || 0) + (stats.tournamentLosses || 0);
    if (calculatedTotal !== stats.totalMatches) {
      issues.push(
        `⚠️  tournamentWins (${stats.tournamentWins}) + tournamentLosses (${stats.tournamentLosses}) = ${calculatedTotal} ≠ totalMatches (${stats.totalMatches})`
      );
    } else {
      issues.push(
        `✅ Total matches calculation is correct: ${stats.tournamentWins} + ${stats.tournamentLosses} = ${stats.totalMatches}`
      );
    }
  }

  // Check if wins field exists and compare with tournamentWins
  if (stats.wins !== undefined && stats.tournamentWins !== undefined) {
    if (stats.wins === stats.tournamentWins) {
      issues.push(
        `⚠️  'wins' (${stats.wins}) and 'tournamentWins' (${stats.tournamentWins}) have the SAME value - possible field confusion!`
      );
    } else {
      issues.push(
        `ℹ️  'wins' (${stats.wins}) ≠ 'tournamentWins' (${stats.tournamentWins}) - fields have different meanings`
      );
    }
  }

  // Check if participations field exists and compare with totalMatches
  if (stats.participations !== undefined && stats.totalMatches !== undefined) {
    if (stats.participations === stats.totalMatches) {
      issues.push(
        `⚠️  'participations' (${stats.participations}) and 'totalMatches' (${stats.totalMatches}) have the SAME value - possible field confusion!`
      );
    } else {
      issues.push(
        `ℹ️  'participations' (${stats.participations}) ≠ 'totalMatches' (${stats.totalMatches}) - fields have different meanings`
      );
    }
  }

  // Check for missing critical fields
  const criticalFields = [
    'tournamentWins',
    'tournamentLosses',
    'totalMatches',
    'wins',
    'runnerUps',
    'semiFinals',
    'participations',
    'bestFinish',
  ];
  criticalFields.forEach(field => {
    if (stats[field] === null || stats[field] === undefined) {
      issues.push(`❌ Missing field: '${field}'`);
    }
  });

  return issues;
}

/**
 * Check tournament stats for a specific user
 */
async function checkTournamentStats(userId) {
  try {
    console.log('\n🔍 ===== TOURNAMENT STATISTICS DATA CHECK =====\n');
    console.log(`👤 User ID: ${userId}\n`);

    // Get user's club memberships
    const membershipsRef = db.collection('users').doc(userId).collection('clubMemberships');
    const membershipsSnapshot = await membershipsRef.get();

    if (membershipsSnapshot.empty) {
      console.log('❌ No club memberships found for this user.\n');
      return;
    }

    console.log(`📊 Found ${membershipsSnapshot.size} club membership(s)\n`);

    let clubIndex = 1;
    const allStats = [];

    for (const membershipDoc of membershipsSnapshot.docs) {
      const membershipData = membershipDoc.data();
      const clubStats = membershipData.clubStats || {};
      const tournamentStats = clubStats.tournamentStats || {};

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📍 Club #${clubIndex}: ${membershipDoc.id}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // Display all tournament stats fields
      console.log('📋 TOURNAMENT STATS FIELDS:\n');

      console.log('🏆 Tournament Results:');
      console.log(`  - wins:           ${formatValue(tournamentStats.wins)}`);
      console.log(`  - runnerUps:      ${formatValue(tournamentStats.runnerUps)}`);
      console.log(`  - semiFinals:     ${formatValue(tournamentStats.semiFinals)}`);
      console.log(`  - bestFinish:     ${formatValue(tournamentStats.bestFinish)}`);

      console.log('\n🎾 Match Statistics:');
      console.log(`  - tournamentWins:    ${formatValue(tournamentStats.tournamentWins)}`);
      console.log(`  - tournamentLosses:  ${formatValue(tournamentStats.tournamentLosses)}`);
      console.log(`  - totalMatches:      ${formatValue(tournamentStats.totalMatches)}`);

      console.log('\n📊 Participation:');
      console.log(`  - participations:    ${formatValue(tournamentStats.participations)}`);

      console.log('\n📈 Calculated Values:');
      if (tournamentStats.totalMatches > 0) {
        const winRate = (
          ((tournamentStats.tournamentWins || 0) / tournamentStats.totalMatches) *
          100
        ).toFixed(1);
        console.log(`  - Win Rate:          ${winRate}%`);
      }

      // Validate data consistency
      console.log('\n🔬 DATA VALIDATION:\n');
      const validationIssues = validateStats(tournamentStats);
      validationIssues.forEach(issue => console.log(`  ${issue}`));

      // Store for aggregation
      allStats.push({
        clubId: membershipDoc.id,
        stats: tournamentStats,
        issues: validationIssues.filter(i => i.startsWith('⚠️') || i.startsWith('❌')),
      });

      clubIndex++;
    }

    // Aggregate report
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 AGGREGATE REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const totalWins = allStats.reduce((sum, s) => sum + (s.stats.tournamentWins || 0), 0);
    const totalLosses = allStats.reduce((sum, s) => sum + (s.stats.tournamentLosses || 0), 0);
    const totalMatches = allStats.reduce((sum, s) => sum + (s.stats.totalMatches || 0), 0);
    const totalChampionships = allStats.reduce((sum, s) => sum + (s.stats.wins || 0), 0);
    const totalParticipations = allStats.reduce((sum, s) => sum + (s.stats.participations || 0), 0);

    console.log(`🎾 Total Match Statistics:`);
    console.log(`  - Total Wins:     ${totalWins}`);
    console.log(`  - Total Losses:   ${totalLosses}`);
    console.log(`  - Total Matches:  ${totalMatches}`);
    console.log(`  - Win Rate:       ${((totalWins / totalMatches) * 100).toFixed(1)}%`);

    console.log(`\n🏆 Tournament Statistics:`);
    console.log(`  - Championships ('wins' field):        ${totalChampionships}`);
    console.log(`  - Participations ('participations'):   ${totalParticipations}`);

    console.log(`\n⚠️  CRITICAL ISSUES FOUND:\n`);
    const criticalIssues = allStats.flatMap(s => s.issues);
    if (criticalIssues.length === 0) {
      console.log('  ✅ No critical issues found!');
    } else {
      criticalIssues.forEach((issue, idx) => console.log(`  ${idx + 1}. ${issue}`));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Recommendations
    console.log('💡 RECOMMENDATIONS:\n');

    if (totalChampionships === totalWins && totalParticipations === totalMatches) {
      console.log('  ⚠️  FIELD CONFUSION DETECTED!');
      console.log(
        '  - The "wins" field appears to contain MATCH wins (not tournament championships)'
      );
      console.log(
        '  - The "participations" field appears to contain TOTAL MATCHES (not tournament count)'
      );
      console.log('  - Screen 2 UI labels are INCORRECT and misleading users!');
      console.log('\n  📝 Action Required:');
      console.log('  1. Rename UI labels in Screen 2:');
      console.log('     - "우승" → "총 승리" or "경기 승수"');
      console.log('     - "참가" → "총 경기" or "매치 수"');
      console.log('  2. Add proper tournament championship tracking');
      console.log('  3. Implement bestFinish auto-update logic');
    }

    console.log('\n✅ Data check complete!\n');
  } catch (error) {
    console.error('\n❌ Error checking tournament stats:', error);
    throw error;
  } finally {
    // Close Firebase connection
    await admin.app().delete();
  }
}

// Main execution
const userId = process.argv[2];

if (!userId) {
  console.error('\n❌ Error: User ID is required!\n');
  console.log('Usage: node scripts/check-tournament-stats.js <userId>\n');
  console.log('Example: node scripts/check-tournament-stats.js ABC123\n');
  process.exit(1);
}

checkTournamentStats(userId)
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
