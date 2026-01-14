/**
 * 🏆 AWARD MISSING TROPHIES
 *
 * Manually award trophies for completed tournaments that didn't get trophies
 * due to the "clubs vs tennis_clubs" bug.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS="../service-account-key.json" node scripts/award-missing-trophies.js
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { awardTournamentTrophies } = require('../lib/utils/trophyAwarder');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Tournament ID from the logs
const tournamentId = 'BWDjnuWZzXke2NP3uE3U';

async function awardMissingTrophies() {
  console.log('🏆 Starting manual trophy award process...');
  console.log(`📋 Tournament ID: ${tournamentId}`);
  console.log('');

  try {
    // Get tournament data
    const tournamentDoc = await db.doc(`tournaments/${tournamentId}`).get();

    if (!tournamentDoc.exists) {
      throw new Error(`Tournament ${tournamentId} not found`);
    }

    const tournament = tournamentDoc.data();

    console.log('📊 Tournament Data:');
    console.log(`   Name: ${tournament.tournamentName || tournament.title}`);
    console.log(`   Status: ${tournament.status}`);
    console.log(`   Club ID: ${tournament.clubId}`);
    console.log(`   Champion: ${tournament.champion?.playerName || 'N/A'}`);
    console.log(`   Runner-up: ${tournament.runnerUp?.playerName || 'N/A'}`);
    console.log('');

    // Verify tournament is completed
    if (tournament.status !== 'completed') {
      throw new Error(`Tournament status is ${tournament.status}, not completed`);
    }

    // Verify rankings exist
    if (!tournament.rankings || tournament.rankings.length === 0) {
      throw new Error('Tournament rankings not found');
    }

    console.log('📋 Rankings:');
    tournament.rankings.forEach(r => {
      console.log(`   ${r.rank}. ${r.playerName} (${r.wins}W - ${r.losses}L)`);
    });
    console.log('');

    // Get club data
    const clubDoc = await db.doc(`tennis_clubs/${tournament.clubId}`).get();

    if (!clubDoc.exists) {
      throw new Error(`Club ${tournament.clubId} not found in tennis_clubs collection`);
    }

    const clubData = clubDoc.data();
    console.log('🏛️ Club Data:');
    console.log(`   Name: ${clubData.name}`);
    console.log('');

    // Award trophies
    console.log('🏆 Awarding trophies...');
    const awardedTrophies = await awardTournamentTrophies(
      tournament.rankings,
      tournamentId,
      tournament.tournamentName || tournament.title,
      tournament.clubId,
      clubData.name,
      tournament.leagueId || tournament.clubId
    );

    console.log('');
    console.log('✅ Trophies awarded successfully!');
    console.log('');
    console.log('📊 Summary:');
    awardedTrophies.forEach(t => {
      console.log(`   ${t.rank}: ${t.userId} - Trophy ID: ${t.trophyId}`);
    });
    console.log('');
    console.log('🎉 Manual trophy award process completed!');
  } catch (error) {
    console.error('❌ Error awarding trophies:', error);
    throw error;
  }
}

// Run the script
awardMissingTrophies()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
