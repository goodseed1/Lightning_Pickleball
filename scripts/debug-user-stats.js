// scripts/debug-user-stats.js
// Debug user stats and club memberships

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function debugUserStats(userId) {
  try {
    console.log('🔍 [VISION] Debugging user data for:', userId);
    console.log('='.repeat(100));

    // 1. Check user document
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('❌ User document does not exist!');
      return;
    }

    const userData = userDoc.data();
    console.log('\n📄 User Document:');
    console.log('  Email:', userData.email);
    console.log('  DisplayName:', userData.displayName);
    console.log('  Stats:', JSON.stringify(userData.stats || {}, null, 2));

    // 2. Check profile/stats subcollection
    const profileStatsDoc = await db
      .collection('users')
      .doc(userId)
      .collection('profile')
      .doc('stats')
      .get();
    console.log('\n📊 Profile Stats Document:');
    if (profileStatsDoc.exists) {
      console.log('  ✅ EXISTS');
      console.log('  Data:', JSON.stringify(profileStatsDoc.data(), null, 2));
    } else {
      console.log('  ❌ DOES NOT EXIST');
    }

    // 3. Check clubMemberships subcollection
    const clubMembershipsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('clubMemberships')
      .get();
    console.log('\n🏆 Club Memberships:');
    console.log('  Count:', clubMembershipsSnapshot.size);

    if (clubMembershipsSnapshot.empty) {
      console.log('  ❌ NO CLUB MEMBERSHIPS FOUND');
    } else {
      clubMembershipsSnapshot.forEach(doc => {
        console.log(`\n  📋 Club ID: ${doc.id}`);
        console.log('     Data:', JSON.stringify(doc.data(), null, 2));
      });
    }

    // 4. Find tournaments where this user participated
    const tournamentsSnapshot = await db
      .collection('tournaments')
      .where('participants', 'array-contains-any', [{ playerId: userId }, { userId: userId }])
      .get();

    console.log('\n🏆 Tournaments (by participants array):');
    console.log('  Count:', tournamentsSnapshot.size);

    // Alternative: search all tournaments
    const allTournamentsSnapshot = await db.collection('tournaments').get();
    console.log('\n🏆 Searching all tournaments...');

    const userTournaments = [];
    for (const tournamentDoc of allTournamentsSnapshot.docs) {
      const tournamentData = tournamentDoc.data();
      const participants = tournamentData.participants || [];

      const isParticipant = participants.some(p => p.playerId === userId || p.userId === userId);

      if (isParticipant) {
        userTournaments.push({
          id: tournamentDoc.id,
          name: tournamentData.tournamentName,
          clubId: tournamentData.clubId,
          status: tournamentData.status,
          champion: tournamentData.champion,
        });
      }
    }

    console.log('\n  Found', userTournaments.length, 'tournaments:');
    userTournaments.forEach(t => {
      console.log(`    - ${t.name} (${t.status})`);
      console.log(`      Club ID: ${t.clubId || 'N/A'}`);
      console.log(`      Champion: ${JSON.stringify(t.champion || {})}`);
    });

    console.log('\n' + '='.repeat(100));
    console.log('✅ Debug complete!\n');
  } catch (error) {
    console.error('❌ Error debugging user stats:', error);
  } finally {
    process.exit(0);
  }
}

// Run with user ID from command line or default to 영희
const userId = process.argv[2] || 'Kc68DnOlARgm8dxuwuAg29H29kl2';
debugUserStats(userId);
