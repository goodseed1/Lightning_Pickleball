/**
 * Emergency Fix: Add nextMatch connections to Round 1 matches
 *
 * This fixes the issue where Round 1 matches don't have nextMatch connections,
 * preventing the Simple Executor from moving winners to Round 2.
 */

const admin = require('firebase-admin');

// Initialize if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

async function fixRound1Connections(tournamentId) {
  console.log(
    `🔧 [FIX] Adding nextMatch connections to Round 1 matches for tournament ${tournamentId}`
  );

  const db = admin.firestore();
  const batch = db.batch();

  try {
    // Get all matches for the tournament
    const tournamentRef = db.doc(`leagues/${tournamentId}`);
    const matchesSnapshot = await tournamentRef.collection('matches').get();

    const allMatches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Separate matches by round
    const round1Matches = allMatches.filter(m => m.roundNumber === 1);
    const round2Matches = allMatches.filter(m => m.roundNumber === 2);

    console.log(
      `🔍 Found ${round1Matches.length} Round 1 matches and ${round2Matches.length} Round 2 matches`
    );

    if (round2Matches.length === 0) {
      console.log('⚠️ No Round 2 matches found - cannot create connections');
      return { success: false, message: 'No Round 2 matches to connect to' };
    }

    // Add nextMatch connections using server-side algorithm
    // Round 1 Match index → Round 2 Match Math.floor(index/2)
    round1Matches.forEach((match, index) => {
      const nextMatchIndex = Math.floor(index / 2);

      if (nextMatchIndex < round2Matches.length) {
        const nextMatch = round2Matches[nextMatchIndex];

        // Winner position: even index → player1, odd index → player2
        const position = index % 2 === 0 ? 'player1' : 'player2';

        const nextMatchConnection = {
          matchId: nextMatch.id,
          position: position,
        };

        const matchRef = tournamentRef.collection('matches').doc(match.id);
        batch.update(matchRef, {
          nextMatch: nextMatchConnection,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`🔗 [CONNECTION] ${match.id} → ${nextMatch.id} [${position}]`);
      }
    });

    await batch.commit();

    console.log('✅ [FIX] nextMatch connections added successfully to Round 1 matches!');
    console.log('🎯 Round 1 winners should now advance to Round 2 automatically');

    return { success: true, message: 'Round 1 connections fixed successfully' };
  } catch (error) {
    console.error('❌ [FIX] Failed to fix Round 1 connections:', error);
    throw error;
  }
}

// Manual execution function for the new tournament
exports.fixRound1ConnectionsManual = async (req, res) => {
  // Use the latest tournament ID that was having issues
  const tournamentId = 'U41SWba8ClKDtWmprkfY';

  try {
    const result = await fixRound1Connections(tournamentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Alternative manual execution function for any tournament ID
exports.fixRound1ConnectionsForTournament = async (req, res) => {
  const tournamentId = req.body?.tournamentId || req.query?.tournamentId;

  if (!tournamentId) {
    return res
      .status(400)
      .json({ error: 'Tournament ID is required. Provide it in body or query parameter.' });
  }

  try {
    const result = await fixRound1Connections(tournamentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fix missing winner data for completed matches
async function fixMissingWinnerData(tournamentId) {
  console.log(`🔧 [WINNER FIX] Fixing missing winner data for tournament ${tournamentId}`);

  const db = admin.firestore();
  const batch = db.batch();

  try {
    const tournamentRef = db.doc(`leagues/${tournamentId}`);
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
      console.log(`✅ [WINNER FIX] Fixed ${brokenMatches.length} matches`);
    }

    return {
      success: true,
      message: `Fixed ${brokenMatches.length} matches with missing winner data`,
      fixedMatches: brokenMatches.map(m => m.id),
    };
  } catch (error) {
    console.error('❌ [WINNER FIX] Failed to fix winner data:', error);
    throw error;
  }
}

// Manual execution for winner fix
exports.fixMissingWinnerDataManual = async (req, res) => {
  const tournamentId = 'U41SWba8ClKDtWmprkfY';

  try {
    const result = await fixMissingWinnerData(tournamentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export for other uses
exports.fixRound1Connections = fixRound1Connections;
