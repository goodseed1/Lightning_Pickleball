/**
 * Debug Tournament State - Check and fix missing winner data
 *
 * This script checks the database state of the tournament and fixes
 * the missing winner field that's preventing advancement.
 */

const admin = require('firebase-admin');

// Initialize if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

async function debugTournamentState(tournamentId) {
  console.log(`🔍 [DEBUG] Checking tournament state for: ${tournamentId}`);

  const db = admin.firestore();

  try {
    // Get all matches for the tournament
    const tournamentRef = db.doc(`leagues/${tournamentId}`);
    const matchesSnapshot = await tournamentRef.collection('matches').get();

    const allMatches = [];
    matchesSnapshot.docs.forEach(doc => {
      allMatches.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`📊 Found ${allMatches.length} matches in tournament`);

    // Check each match state
    allMatches.forEach((match, index) => {
      console.log(`\n--- Match ${index + 1}: ${match.id} ---`);
      console.log(`Round: ${match.roundNumber}`);
      console.log(`Status: ${match.status}`);
      console.log(
        `Player 1: ${match.player1?.playerName || 'NULL'} (${match.player1?.playerId || 'N/A'})`
      );
      console.log(
        `Player 2: ${match.player2?.playerName || 'NULL'} (${match.player2?.playerId || 'N/A'})`
      );
      console.log(
        `Winner: ${match.winner ? `${match.winner.playerName} (${match.winner.playerId})` : 'NULL'}`
      );
      console.log(
        `Next Match: ${match.nextMatch ? `${match.nextMatch.matchId} [${match.nextMatch.position}]` : 'NULL'}`
      );

      if (match.score) {
        console.log(`Score: ${match.score.finalScore || 'No final score'}`);
        console.log(`Score Winner: ${match.score.winner || 'No score winner'}`);
      }
    });

    // Look for completed matches without winners
    const completedMatchesWithoutWinners = allMatches.filter(
      m => m.status === 'completed' && !m.winner
    );

    if (completedMatchesWithoutWinners.length > 0) {
      console.log(
        `\n⚠️ Found ${completedMatchesWithoutWinners.length} completed matches without winner data:`
      );

      for (const match of completedMatchesWithoutWinners) {
        console.log(`\n🔧 Fixing match: ${match.id}`);

        // Determine winner from score data
        let winner = null;
        if (match.score && match.score.winner) {
          if (match.score.winner === 'player1' && match.player1) {
            winner = match.player1;
          } else if (match.score.winner === 'player2' && match.player2) {
            winner = match.player2;
          }
        }

        if (winner) {
          console.log(`✅ Setting winner: ${winner.playerName} (${winner.playerId})`);

          // Update the match with winner data
          const matchRef = tournamentRef.collection('matches').doc(match.id);
          await matchRef.update({
            winner: winner,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`✅ Winner updated successfully`);
        } else {
          console.log(`❌ Could not determine winner from score data`);
        }
      }
    } else {
      console.log(`\n✅ All completed matches have winner data`);
    }

    return {
      success: true,
      totalMatches: allMatches.length,
      fixedMatches: completedMatchesWithoutWinners.length,
    };
  } catch (error) {
    console.error('❌ [DEBUG] Failed to check tournament state:', error);
    throw error;
  }
}

// Manual execution function
exports.debugTournamentStateManual = async (req, res) => {
  const tournamentId = 'U41SWba8ClKDtWmprkfY';

  try {
    const result = await debugTournamentState(tournamentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export for other uses
exports.debugTournamentState = debugTournamentState;
