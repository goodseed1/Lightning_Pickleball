/**
 * 🏛️ Hall of Fame Test Data Generator
 * Creates test trophies and badges for user
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../../service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createTestHallOfFameData() {
  const userId = '0swKNU8wvIPgvsEogypUnsc4w1w1'; // 누님

  console.log('🏛️ Creating test Hall of Fame data for user:', userId);

  try {
    // 🏆 Create test trophies
    const trophy1 = {
      id: `test_tournament_winner_${Date.now()}`,
      type: 'tournament_winner',
      rank: 'Winner',
      tournamentName: '🎾 Test Singles Tournament',
      clubName: 'Lightning Tennis Club',
      clubId: 'test_club_123',
      eventType: 'Singles',
      context: 'club',
      awardedAt: admin.firestore.Timestamp.now(),
      icon: {
        set: 'MaterialCommunityIcons',
        name: 'trophy',
        color: '#FFD700',
      },
      description: 'Winner in Test Singles Tournament',
    };

    const trophy2 = {
      id: `test_tournament_runnerup_${Date.now()}`,
      type: 'tournament_runnerup',
      rank: 'Runner-up',
      tournamentName: '🎾 Test Doubles Tournament',
      clubName: 'Metro Atlanta Tennis',
      clubId: 'test_club_456',
      eventType: 'Doubles',
      context: 'club',
      awardedAt: admin.firestore.Timestamp.now(),
      icon: {
        set: 'MaterialCommunityIcons',
        name: 'medal-outline',
        color: '#C0C0C0',
      },
      description: 'Runner-up in Test Doubles Tournament',
    };

    // Save trophies
    await db.doc(`users/${userId}/trophies/${trophy1.id}`).set(trophy1);
    console.log('✅ Created trophy 1:', trophy1.tournamentName);

    await db.doc(`users/${userId}/trophies/${trophy2.id}`).set(trophy2);
    console.log('✅ Created trophy 2:', trophy2.tournamentName);

    // 🏅 Create test badges
    const badge1 = {
      id: `first_tournament_win_${userId}`,
      type: 'first_tournament_win',
      name: 'First Victory',
      description: 'Won your first tournament',
      awardedAt: admin.firestore.Timestamp.now(),
      icon: {
        set: 'Ionicons',
        name: 'ribbon',
        color: '#4CAF50',
      },
    };

    const badge2 = {
      id: `tournament_legend_${userId}`,
      type: 'tournament_legend',
      name: 'Tournament Legend',
      description: 'Won 5 tournaments',
      awardedAt: admin.firestore.Timestamp.now(),
      icon: {
        set: 'FontAwesome5',
        name: 'crown',
        color: '#FFD700',
      },
    };

    const badge3 = {
      id: `doubles_master_${userId}`,
      type: 'doubles_master',
      name: 'Doubles Master',
      description: 'Excellence in doubles play',
      awardedAt: admin.firestore.Timestamp.now(),
      icon: {
        set: 'MaterialCommunityIcons',
        name: 'account-multiple',
        color: '#2196F3',
      },
    };

    // Save badges
    await db.doc(`users/${userId}/badges/${badge1.id}`).set(badge1);
    console.log('✅ Created badge 1:', badge1.name);

    await db.doc(`users/${userId}/badges/${badge2.id}`).set(badge2);
    console.log('✅ Created badge 2:', badge2.name);

    await db.doc(`users/${userId}/badges/${badge3.id}`).set(badge3);
    console.log('✅ Created badge 3:', badge3.name);

    console.log('🎉 Test Hall of Fame data created successfully!');
    console.log('📱 Open MyProfileScreen > Information tab to see the Hall of Fame section');
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    process.exit(0);
  }
}

createTestHallOfFameData();
