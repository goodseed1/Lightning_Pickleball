/**
 * Check Suwanee Weekend Warriors Memberships
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const CLUB_ID = 'dRxu8Xnwmfoj0zzyQjVu';

async function checkMemberships() {
  console.log('🔍 Checking memberships for Suwanee Weekend Warriors...\n');

  // Check club data first
  const clubDoc = await db.collection('pickleball_clubs').doc(CLUB_ID).get();
  const clubData = clubDoc.data();
  console.log('📊 Club Data:');
  console.log('  memberCount:', clubData.memberCount);
  console.log('  statistics.totalMembers:', clubData.statistics?.totalMembers);
  console.log('  statistics.activeMembers:', clubData.statistics?.activeMembers);

  // Check memberships
  const membershipsRef = db.collection('club_memberships');
  const snapshot = await membershipsRef.where('clubId', '==', CLUB_ID).get();

  console.log('\n📋 Total memberships found:', snapshot.size);
  console.log('\n--- Membership Details ---');

  let activeCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.status === 'active') activeCount++;
    console.log(
      `  ${data.role?.toUpperCase() || 'MEMBER'}: ${data.userId?.substring(0, 8)}... | status: ${data.status || 'undefined'}`
    );
  }

  console.log('\n📈 Active memberships:', activeCount);
}

checkMemberships()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
