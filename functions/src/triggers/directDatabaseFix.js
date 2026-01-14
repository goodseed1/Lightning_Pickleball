/**
 * Direct Database Fix for Tournament U41SWba8ClKDtWmprkfY
 * Fixes missing winner data for completed matches
 */

const admin = require('firebase-admin');

// Initialize if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

async function directDatabaseFix() {
  const tournamentId = 'U41SWba8ClKDtWmprkfY';
  console.log(`🔧 [DIRECT FIX] Fixing tournament ${tournamentId}`);

  const db = admin.firestore();
  const tournamentRef = db.doc(`leagues/${tournamentId}`);

  try {
    // Get all matches for the tournament
    const matchesSnapshot = await tournamentRef.collection('matches').get();
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

    const batch = db.batch();
    for (const match of brokenMatches) {
      console.log(`🔧 Fixing match: ${match.id}`);
      console.log(`   Score winner: ${match.score.winner}`);
      console.log(`   Player 1: ${match.player1?.playerName} (${match.player1?.playerId})`);
      console.log(`   Player 2: ${match.player2?.playerName} (${match.player2?.playerId})`);

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
      }
    }

    if (brokenMatches.length > 0) {
      await batch.commit();
      console.log(`✅ [DIRECT FIX] Fixed ${brokenMatches.length} matches with missing winner data`);
    } else {
      console.log(`✅ [DIRECT FIX] No broken matches found`);
    }

    return {
      success: true,
      message: `Fixed ${brokenMatches.length} matches with missing winner data`,
      fixedMatches: brokenMatches.map(m => m.id),
    };
  } catch (error) {
    console.error('❌ [DIRECT FIX] Failed to fix tournament:', error);
    throw error;
  }
}

// Manual execution function
exports.directDatabaseFixManual = async (req, res) => {
  try {
    const result = await directDatabaseFix();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export for other uses
exports.directDatabaseFix = directDatabaseFix;
