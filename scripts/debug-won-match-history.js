/**
 * 🔍 Debug Won's Match History
 *
 * Checks where Won's match data is actually stored in Firestore
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

async function debugWonMatchHistory() {
  try {
    const wonUserId = 'vOaPJNjbrfhGJtjBhTnlsAD5HEv2'; // Won's user ID

    console.log('🔍 ============================================');
    console.log("🔍 Debugging Won's Match History");
    console.log('🔍 ============================================\n');

    // 1. Check match_history subcollection
    console.log('📂 Checking users/{userId}/match_history...\n');
    const matchHistoryRef = db.collection('users').doc(wonUserId).collection('match_history');
    const matchHistorySnap = await matchHistoryRef.orderBy('date', 'desc').limit(10).get();

    console.log(`   Found ${matchHistorySnap.docs.length} documents\n`);

    if (matchHistorySnap.docs.length > 0) {
      matchHistorySnap.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. Document ID: ${doc.id}`);
        console.log(`      Date: ${data.date}`);
        console.log(`      Result: ${data.result}`);
        console.log(`      Old ELO: ${data.oldElo}`);
        console.log(`      New ELO: ${data.newElo}`);
        console.log(`      ELO Change: ${data.eloChange}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No match_history documents found!\n');
    }

    // 2. Check matches collection (where actual match data might be)
    console.log('📂 Checking matches collection (all completed matches)...\n');

    const matchesSnap = await db
      .collection('matches')
      .where('status', '==', 'completed')
      .limit(200)
      .get();

    const wonMatches = matchesSnap.docs.filter(doc => {
      const data = doc.data();
      return data.player1?.playerId === wonUserId || data.player2?.playerId === wonUserId;
    });

    console.log(`   Found ${wonMatches.length} completed matches for Won\n`);

    if (wonMatches.length > 0) {
      wonMatches.slice(0, 5).forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. Match ID: ${doc.id}`);
        console.log(`      Date: ${data.date}`);
        console.log(`      Player1: ${data.player1?.playerName} (${data.player1?.playerId})`);
        console.log(`      Player2: ${data.player2?.playerName} (${data.player2?.playerId})`);
        console.log(`      Score: ${data.score}`);
        console.log(`      Winner: ${data.winner}`);
        console.log(`      Has ELO data?:`, data.eloChange !== undefined);
        console.log('');
      });
    }

    // 3. Check Won's user document for ELO rating
    console.log("📂 Checking Won's user document...\n");
    const userDoc = await db.collection('users').doc(wonUserId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('   Current ELO Rating:', userData.unifiedEloRating);
      console.log('   Match Stats:');
      console.log('     - Matches Played:', userData.stats?.matchesPlayed);
      console.log('     - Wins:', userData.stats?.wins);
      console.log('     - Losses:', userData.stats?.losses);
      console.log('');
    }

    // 4. Check Won's club membership for tournament matches
    console.log("📂 Checking Won's club memberships (tournament matches)...\n");
    const membershipRef = db
      .collection('users')
      .doc(wonUserId)
      .collection('clubMemberships')
      .doc('0PD3UpnBw5JPJOaSM2H8'); // 원이 클럽

    const membershipDoc = await membershipRef.get();
    if (membershipDoc.exists) {
      const membershipData = membershipDoc.data();
      console.log('   Tournament Stats:');
      console.log('     - Total Matches:', membershipData.clubStats?.tournamentStats?.totalMatches);
      console.log('     - Wins:', membershipData.clubStats?.tournamentStats?.tournamentWins);
      console.log('     - Losses:', membershipData.clubStats?.tournamentStats?.tournamentLosses);
      console.log('');
    }

    console.log('🔍 ============================================');
    console.log('🔍 END OF ANALYSIS');
    console.log('🔍 ============================================\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run
debugWonMatchHistory()
  .then(() => {
    console.log('✅ Debug complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
