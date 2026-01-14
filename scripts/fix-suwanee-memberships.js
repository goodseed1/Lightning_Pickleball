/**
 * Fix Suwanee Weekend Warriors Memberships
 * - Add admin membership if missing
 * - Verify all memberships are correct
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const CLUB_ID = 'dRxu8Xnwmfoj0zzyQjVu';

async function fixMemberships() {
  console.log('🔧 Fixing memberships for Suwanee Weekend Warriors...\n');

  // 1. Get club data to find admin
  const clubDoc = await db.collection('tennis_clubs').doc(CLUB_ID).get();
  const clubData = clubDoc.data();
  const adminId = clubData.adminId || clubData.ownerId || clubData.createdBy;

  console.log('👤 Club Admin ID:', adminId);

  // Get admin user info
  if (adminId) {
    const adminUser = await db.collection('users').doc(adminId).get();
    if (adminUser.exists) {
      const adminData = adminUser.data();
      console.log('👤 Admin Name:', adminData.displayName || adminData.name || 'Unknown');
    }
  }

  // 2. Check if admin already has membership
  const membershipsRef = db.collection('club_memberships');
  const adminMembership = await membershipsRef
    .where('clubId', '==', CLUB_ID)
    .where('userId', '==', adminId)
    .get();

  if (adminMembership.empty) {
    console.log('\n⚠️  Admin membership NOT found! Creating...');

    // Create admin membership
    const now = admin.firestore.FieldValue.serverTimestamp();
    await membershipsRef.add({
      clubId: CLUB_ID,
      userId: adminId,
      role: 'admin',
      status: 'active',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    console.log('✅ Admin membership created!');
  } else {
    console.log('\n✅ Admin membership already exists');
    // Update role to admin if not already
    const doc = adminMembership.docs[0];
    if (doc.data().role !== 'admin') {
      await doc.ref.update({ role: 'admin' });
      console.log('✅ Updated admin role');
    }
  }

  // 3. Verify final count
  const finalSnapshot = await membershipsRef.where('clubId', '==', CLUB_ID).get();
  console.log('\n📊 Final membership count:', finalSnapshot.size);

  // 4. Update club memberCount to match
  await clubDoc.ref.update({
    memberCount: finalSnapshot.size,
    'statistics.totalMembers': finalSnapshot.size,
    'statistics.activeMembers': finalSnapshot.size,
  });

  console.log('✅ Updated club memberCount to:', finalSnapshot.size);

  // 5. List all members
  console.log('\n--- All Members ---');
  for (const doc of finalSnapshot.docs) {
    const data = doc.data();
    const userDoc = await db.collection('users').doc(data.userId).get();
    const userName = userDoc.exists
      ? userDoc.data().displayName || userDoc.data().name || 'Unknown'
      : 'Unknown';
    console.log(`  ${data.role?.toUpperCase().padEnd(6)} | ${userName}`);
  }
}

fixMemberships()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
