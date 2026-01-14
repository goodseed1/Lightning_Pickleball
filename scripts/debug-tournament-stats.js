/**
 * 🔍 Debug Tournament Stats
 *
 * Won 사용자의 토너먼트 통계 데이터를 Firestore에서 읽어서 출력합니다.
 * 문제 진단을 위한 스크립트입니다.
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function debugTournamentStats() {
  try {
    console.log('🔍 ============================================');
    console.log('🔍 DEBUG: Tournament Stats Analysis');
    console.log('🔍 ============================================\n');

    // Won 사용자 ID
    const wonUserId = 'vOaPJNjbrfhGJtjBhTnlsAD5HEv2'; // Won's user ID (test33@t.com)

    console.log(`📋 Analyzing user: ${wonUserId}\n`);

    // 1. Get user's club memberships
    const membershipsRef = db.collection('users').doc(wonUserId).collection('clubMemberships');
    const membershipsSnapshot = await membershipsRef.get();

    console.log(`📊 Found ${membershipsSnapshot.docs.length} club memberships\n`);

    for (const membershipDoc of membershipsSnapshot.docs) {
      const clubId = membershipDoc.id;
      const membershipData = membershipDoc.data();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🏢 Club ID: ${clubId}`);
      console.log(`🏢 Club Name: ${membershipData.clubName || 'Unknown'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // 2. Check clubStats
      const clubStats = membershipData.clubStats || {};
      console.log('📊 clubStats:', JSON.stringify(clubStats, null, 2));
      console.log('');

      // 3. Check tournamentStats
      const tournamentStats = clubStats.tournamentStats || {};
      console.log('🏆 tournamentStats:', JSON.stringify(tournamentStats, null, 2));
      console.log('');

      // 4. Check if there are alternative field names
      console.log('🔍 Checking alternative field names:');
      console.log('  - runnerUp:', tournamentStats.runnerUp);
      console.log('  - runnerUps:', tournamentStats.runnerUps);
      console.log('  - runnerups:', tournamentStats.runnerups);
      console.log('  - semiFinal:', tournamentStats.semiFinal);
      console.log('  - semiFinals:', tournamentStats.semiFinals);
      console.log('  - semifinals:', tournamentStats.semifinals);
      console.log('  - bestFinish:', tournamentStats.bestFinish);
      console.log('  - best_finish:', tournamentStats.best_finish);
      console.log('  - championships:', tournamentStats.championships);
      console.log('  - wins:', tournamentStats.wins);
      console.log('  - tournamentWins:', tournamentStats.tournamentWins);
      console.log('');

      // 5. Check club document for member list
      const clubDocRef = db.collection('tennis_clubs').doc(clubId);
      const clubDoc = await clubDocRef.get();
      if (clubDoc.exists) {
        const clubData = clubDoc.data();
        console.log('🏢 Club Document Fields:');
        console.log('  - members:', clubData.members?.length || 0, 'items');
        console.log('  - memberIds:', clubData.memberIds?.length || 0, 'items');
        console.log('  - memberList:', clubData.memberList?.length || 0, 'items');
        console.log('  - All keys:', Object.keys(clubData));
        console.log('');

        // Print actual member arrays
        if (clubData.members && clubData.members.length > 0) {
          console.log('  📋 members array:', clubData.members);
        }
        if (clubData.memberIds && clubData.memberIds.length > 0) {
          console.log('  📋 memberIds array:', clubData.memberIds);
        }
        if (clubData.memberList && clubData.memberList.length > 0) {
          console.log('  📋 memberList array:', clubData.memberList);
        }
      } else {
        console.log('❌ Club document not found!');
      }

      console.log('\n');
    }

    console.log('🔍 ============================================');
    console.log('🔍 END OF ANALYSIS');
    console.log('🔍 ============================================\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the debug script
debugTournamentStats()
  .then(() => {
    console.log('✅ Debug complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
