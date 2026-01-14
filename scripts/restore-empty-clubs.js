const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Restore the 3 deleted clubs with their original data
const CLUBS_TO_RESTORE = [
  {
    id: '8h6PLuDkhVsvkpIWtacn',
    data: {
      name: '',
      memberCount: 0,
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-12-25T12:16:35Z')),
    },
  },
  {
    id: 'Vi6CyxkHpULMZ7v2ArLv',
    data: {
      name: '',
      memberCount: 0,
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-12-25T03:43:20Z')),
    },
  },
  {
    id: 'WsetxkWODywjt0BBcqrs',
    data: {
      name: '',
      memberCount: 0,
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-12-15T11:58:50Z')),
    },
  },
];

async function restoreClubs() {
  console.log('🔄 Restoring deleted clubs...\n');

  for (const club of CLUBS_TO_RESTORE) {
    try {
      await db.collection('pickleball_clubs').doc(club.id).set(club.data);
      console.log(`✅ Restored: ${club.id}`);
    } catch (error) {
      console.error(`❌ Error restoring ${club.id}:`, error.message);
    }
  }

  console.log('\n🎉 Rollback complete!');

  // Verify
  console.log('\n📋 Current clubs:');
  const clubs = await db.collection('pickleball_clubs').get();
  clubs.forEach(doc => {
    const data = doc.data();
    console.log(`   - "${data.name || '(empty)'}" (ID: ${doc.id})`);
  });

  process.exit(0);
}

restoreClubs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
