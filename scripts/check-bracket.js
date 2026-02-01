/**
 * Debug script to check tournament bpaddle structure in Firestore
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkBracket() {
  const tournamentId = 'lWfpYmba4WCMRLddUHGu';

  try {
    console.log(`\n🔍 Checking tournament: ${tournamentId}\n`);

    // Get tournament document
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    const tournamentSnap = await tournamentRef.get();

    if (!tournamentSnap.exists) {
      console.error('❌ Tournament not found!');
      process.exit(1);
    }

    const tournament = tournamentSnap.data();

    console.log('📊 Tournament Status:', tournament.status);
    console.log('📊 Participants Count:', tournament.participants?.length || 0);
    console.log('📊 Bracket Rounds:', tournament.bpaddle?.length || 0);

    // Check bpaddle structure
    if (tournament.bpaddle && tournament.bpaddle.length > 0) {
      console.log('\n📋 BRACKET STRUCTURE:\n');

      tournament.bpaddle.forEach((round, index) => {
        console.log(`\n🏆 ${round.roundName} (Round ${round.roundNumber})`);
        console.log(`   Matches: ${round.matches.length}`);

        round.matches.forEach((match, matchIndex) => {
          console.log(`\n   Match ${matchIndex + 1} (${match.id}):`);
          console.log(
            `   - Player 1: ${match.player1?.playerName || 'TBD'} (seed: ${match.player1?.seed || 'N/A'}, status: ${match.player1?.status || 'N/A'})`
          );
          console.log(
            `   - Player 2: ${match.player2?.playerName || 'TBD'} (seed: ${match.player2?.seed || 'N/A'}, status: ${match.player2?.status || 'N/A'})`
          );
          console.log(`   - Status: ${match.status}`);
          console.log(`   - Winner: ${match.winnerId || 'TBD'}`);
          console.log(`   - Next Match ID: ${match.nextMatchId || 'NONE (Final)'}`);
          console.log(`   - Next Match Position: ${match.nextMatchPosition || 'N/A'}`);
          console.log(`   - Is BYE: ${match.isBye || false}`);
        });
      });
    }

    // Check matches subcollection
    console.log('\n\n📁 MATCHES SUBCOLLECTION:\n');
    const matchesSnap = await tournamentRef.collection('matches').get();

    console.log(`Total matches in subcollection: ${matchesSnap.size}`);

    matchesSnap.forEach(doc => {
      const match = doc.data();
      console.log(`\n🎯 ${doc.id}:`);
      console.log(`   - Round: ${match.roundNumber}, Match #: ${match.matchNumber}`);
      console.log(`   - Player 1: ${match.player1?.playerName || 'TBD'}`);
      console.log(`   - Player 2: ${match.player2?.playerName || 'TBD'}`);
      console.log(`   - Winner: ${match.winnerId || 'TBD'}`);
      console.log(`   - Next Match ID: ${match.nextMatchId || 'NONE'}`);
      console.log(`   - Next Match Position: ${match.nextMatchPosition || 'N/A'}`);
    });

    console.log('\n✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBracket();
