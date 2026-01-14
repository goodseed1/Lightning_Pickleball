/**
 * 🔧 Initialize Stats Script
 * 초기 통계 데이터를 생성하는 스크립트
 *
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/initializeStats.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function initializeStats() {
  console.log('📊 Initializing user statistics...\n');

  try {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Time reference points
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('⏰ Time references:');
    console.log(`   Now: ${now.toISOString()}`);
    console.log(`   1 day ago: ${oneDayAgo.toISOString()}`);
    console.log(`   7 days ago: ${sevenDaysAgo.toISOString()}`);
    console.log(`   30 days ago: ${thirtyDaysAgo.toISOString()}\n`);

    // Get all users
    console.log('👥 Fetching all users...');
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    console.log(`   Total users: ${totalUsers}\n`);

    let dau = 0;
    let wau = 0;
    let mau = 0;

    // Calculate DAU, WAU, MAU
    console.log('📈 Calculating active users...');
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const lastActiveAt = userData.lastActiveAt;

      if (lastActiveAt) {
        const lastActiveDate = lastActiveAt.toDate();

        if (lastActiveDate >= oneDayAgo) {
          dau++;
        }
        if (lastActiveDate >= sevenDaysAgo) {
          wau++;
        }
        if (lastActiveDate >= thirtyDaysAgo) {
          mau++;
        }
      }
    });

    console.log(`   DAU (Daily Active Users): ${dau}`);
    console.log(`   WAU (Weekly Active Users): ${wau}`);
    console.log(`   MAU (Monthly Active Users): ${mau}\n`);

    const calculatedAt = admin.firestore.Timestamp.now();

    // 1. Write to daily_stats collection (history)
    console.log('💾 Writing to daily_stats collection...');
    await db.collection('daily_stats').doc(dateKey).set({
      date: dateKey,
      totalUsers,
      dau,
      wau,
      mau,
      calculatedAt,
    });
    console.log(`   ✅ Created daily_stats/${dateKey}\n`);

    // 2. Write to _internal/appStats (real-time dashboard)
    console.log('💾 Writing to _internal/appStats...');
    await db.collection('_internal').doc('appStats').set({
      totalUsers,
      dau,
      wau,
      mau,
      lastCalculatedAt: calculatedAt,
      lastDateKey: dateKey,
    });
    console.log('   ✅ Created _internal/appStats\n');

    // Summary
    console.log('🎉 Statistics initialized successfully!');
    console.log('═'.repeat(50));
    console.log(`📊 Summary for ${dateKey}:`);
    console.log(`   👥 Total Users: ${totalUsers}`);
    console.log(`   📊 DAU: ${dau}`);
    console.log(`   📈 WAU: ${wau}`);
    console.log(`   📉 MAU: ${mau}`);
    console.log('═'.repeat(50));
    console.log('\n✨ You can now view the stats in the Admin Dashboard!');
  } catch (error) {
    console.error('❌ Error initializing stats:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
initializeStats();
