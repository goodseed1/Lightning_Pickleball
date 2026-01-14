/**
 * Direct database fix script for tournament U41SWba8ClKDtWmprkfY
 * Run with: node fixDatabase.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (will use default credentials from environment)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function fixTournamentWinnerData() {
  const tournamentId = 'U41SWba8ClKDtWmprkfY';
  console.log(`🔧 [DIRECT FIX] Fixing tournament ${tournamentId}`);

  try {
    // Get all matches for the tournament
    const tournamentRef = db.doc(`leagues/${tournamentId}`);
    const matchesSnapshot = await tournamentRef.collection('matches').get();

    if (matchesSnapshot.empty) {
      console.log('⚠️ No matches found in tournament');
      return;
    }

    const allMatches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`📊 Found ${allMatches.length} matches in tournament`);

    // Find completed matches without winner data
    const brokenMatches = allMatches.filter(
      m => m.status === 'completed' && !m.winner && m.score && m.score.winner
    );

    console.log(`⚠️ Found ${brokenMatches.length} completed matches without winner data`);

    if (brokenMatches.length === 0) {
      console.log('✅ No broken matches found - all completed matches have winner data');
      return;
    }

    const batch = db.batch();
    for (const match of brokenMatches) {
      console.log(`\\n🔧 Fixing match: ${match.id}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Score winner: ${match.score?.winner || 'null'}`);
      console.log(
        `   Player 1: ${match.player1?.playerName || 'null'} (${match.player1?.playerId || 'null'})`
      );
      console.log(
        `   Player 2: ${match.player2?.playerName || 'null'} (${match.player2?.playerId || 'null'})`
      );

      let winner = null;
      if (match.score.winner === 'player1' && match.player1) {
        winner = match.player1;
      } else if (match.score.winner === 'player2' && match.player2) {
        winner = match.player2;
      }

      if (winner) {
        console.log(`✅ Setting winner: ${winner.playerName} (${winner.playerId})`);

        const matchRef = tournamentRef.collection('matches').doc(match.id);
        batch.update(matchRef, {
          winner: winner,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        console.log(`❌ Could not determine winner from score data`);
      }
    }

    console.log(`\\n💾 Committing batch update for ${brokenMatches.length} matches...`);
    await batch.commit();

    console.log(
      `✅ [DIRECT FIX] Successfully fixed ${brokenMatches.length} matches with missing winner data`
    );
    console.log(`🎯 Round 1 winners should now advance to Round 2 automatically`);

    // List the fixed matches
    console.log(`\\n📋 Fixed matches:`);
    brokenMatches.forEach(match => {
      const winnerName =
        match.score.winner === 'player1' ? match.player1?.playerName : match.player2?.playerName;
      console.log(`   - ${match.id}: Winner set to ${winnerName}`);
    });
  } catch (error) {
    console.error('❌ [DIRECT FIX] Failed to fix tournament:', error);
    throw error;
  } finally {
    // Close the connection
    await admin.app().delete();
    console.log('\\n🔌 Firebase connection closed');
  }
}

// Run the fix
fixTournamentWinnerData()
  .then(() => {
    console.log('✅ Database fix completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  });
