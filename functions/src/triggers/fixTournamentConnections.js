/**
 * Emergency Cloud Function to add nextMatch connections to existing tournament
 * Run this manually to fix tournaments created before Server Sovereignty Recovery
 */

const admin = require('firebase-admin');

// Initialize if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

async function fixTournamentConnections(tournamentId) {
  console.log(`🔧 [FIX] Comprehensive tournament fix for ${tournamentId}`);

  const db = admin.firestore();
  const tournamentRef = db.doc(`leagues/${tournamentId}`);

  try {
    // STEP 1: Fix missing winner data for completed matches
    console.log('🔧 [STEP 1] Checking for missing winner data...');

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

    const batch1 = db.batch();
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
        batch1.update(matchRef, {
          winner: winner,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    if (brokenMatches.length > 0) {
      await batch1.commit();
      console.log(`✅ [STEP 1] Fixed ${brokenMatches.length} matches with missing winner data`);
    }

    // STEP 2: Add nextMatch connections based on tournament structure
    console.log('🔧 [STEP 2] Adding nextMatch connections...');

    const batch2 = db.batch();

    // For the current tournament U41SWba8ClKDtWmprkfY, add dynamic connections
    if (tournamentId === 'U41SWba8ClKDtWmprkfY') {
      // Round 1 → Round 2 connections (dynamic based on actual matches)
      const round1Matches = allMatches.filter(m => m.roundNumber === 1);
      const round2Matches = allMatches.filter(m => m.roundNumber === 2);

      console.log(
        `Found ${round1Matches.length} Round 1 matches and ${round2Matches.length} Round 2 matches`
      );

      round1Matches.forEach((match, index) => {
        const nextMatchIndex = Math.floor(index / 2);
        if (nextMatchIndex < round2Matches.length) {
          const nextMatch = round2Matches[nextMatchIndex];
          const position = index % 2 === 0 ? 'player1' : 'player2';

          const matchRef = db.doc(`leagues/${tournamentId}/matches/${match.id}`);
          batch2.update(matchRef, {
            nextMatch: {
              matchId: nextMatch.id,
              position: position,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`🔗 [DYNAMIC] ${match.id} → ${nextMatch.id} [${position}]`);
        }
      });
    } else {
      // Original static connections for old tournament A9a9Bw7wUGc0r87UzkTQ
      console.log('🔗 Adding Round 1 → Round 2 connections...');

      // Match 1 → Match 5 (player2)
      const match1Ref = db.doc(`leagues/${tournamentId}/matches/${tournamentId}_match_1`);
      batch2.update(match1Ref, {
        nextMatch: {
          matchId: `${tournamentId}_match_5`,
          position: 'player2',
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Match 2 → Match 6 (player2)
      const match2Ref = db.doc(`leagues/${tournamentId}/matches/${tournamentId}_match_2`);
      batch2.update(match2Ref, {
        nextMatch: {
          matchId: `${tournamentId}_match_6`,
          position: 'player2',
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Add Round 2 → Round 3 connections
      console.log('🔗 Adding Round 2 → Round 3 connections...');

      // Match 5 → Match 7 (player1)
      const match5Ref = db.doc(`leagues/${tournamentId}/matches/${tournamentId}_match_5`);
      batch2.update(match5Ref, {
        nextMatch: {
          matchId: `${tournamentId}_match_7`,
          position: 'player1',
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Match 6 → Match 7 (player2)
      const match6Ref = db.doc(`leagues/${tournamentId}/matches/${tournamentId}_match_6`);
      batch2.update(match6Ref, {
        nextMatch: {
          matchId: `${tournamentId}_match_7`,
          position: 'player2',
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch2.commit();

    console.log('✅ [STEP 2] nextMatch connections added successfully!');

    // Now manually advance Round 1 winners
    console.log('🎯 [FIX] Manually advancing Round 1 winners...');

    const advancementBatch = db.batch();

    // Move 철이 to Match 5 player2
    advancementBatch.update(match5Ref, {
      player2: {
        playerId: '5D2WUjWtF2ezPlV8OX926d4Fdyb2',
        playerName: '철이',
        seed: 3,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Move 정이 to Match 6 player2
    const match6UpdateRef = db.doc(`leagues/${tournamentId}/matches/${tournamentId}_match_6`);
    advancementBatch.update(match6UpdateRef, {
      player2: {
        playerId: 'celVeuZPpwRsDI5drwZ4U0ULJlg2',
        playerName: '정이',
        seed: 4,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await advancementBatch.commit();

    console.log('✅ [FIX] Tournament advancement completed!');
    console.log('📊 Round 2 should now show:');
    console.log('   Match 5: 숙이 vs 철이');
    console.log('   Match 6: 광이 vs 정이');

    return { success: true, message: 'Tournament fixed successfully' };
  } catch (error) {
    console.error('❌ [FIX] Failed to fix tournament:', error);
    throw error;
  }
}

// Manual execution function
exports.fixTournamentConnectionsManual = async (req, res) => {
  // Use current tournament that needs fixing
  const tournamentId = 'U41SWba8ClKDtWmprkfY';

  try {
    const result = await fixTournamentConnections(tournamentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export for other uses
exports.fixTournamentConnections = fixTournamentConnections;
