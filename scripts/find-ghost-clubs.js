/**
 * Find Ghost Clubs Script
 * - Check club_memberships for orphaned clubIds
 * - Check user documents for club references
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function findGhostClubs() {
  console.log('🔍 Searching for ghost clubs...\n');

  // 1. Get all valid club IDs
  const clubsSnapshot = await db.collection('tennis_clubs').get();
  const validClubIds = new Set(clubsSnapshot.docs.map(doc => doc.id));
  console.log('✅ Valid clubs:', Array.from(validClubIds));

  // 2. Check club_memberships for orphaned clubIds
  console.log('\n📋 Checking club_memberships...');
  const membershipsSnapshot = await db.collection('club_memberships').get();
  const membershipClubIds = new Set();
  membershipsSnapshot.docs.forEach(doc => {
    const clubId = doc.data().clubId;
    if (clubId) membershipClubIds.add(clubId);
  });

  const orphanedMembershipClubIds = [...membershipClubIds].filter(id => !validClubIds.has(id));
  if (orphanedMembershipClubIds.length > 0) {
    console.log('👻 GHOST CLUB IDs in club_memberships:', orphanedMembershipClubIds);
  } else {
    console.log('✅ No orphaned club IDs in memberships');
  }

  // 3. Check users collection for club references
  console.log('\n👥 Checking users for club references...');
  const usersSnapshot = await db.collection('users').limit(100).get();
  const userClubRefs = new Set();

  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.clubs) {
      Object.keys(data.clubs).forEach(clubId => userClubRefs.add(clubId));
    }
    if (data.clubId) userClubRefs.add(data.clubId);
    if (data.managedClubs) {
      data.managedClubs.forEach(clubId => userClubRefs.add(clubId));
    }
  });

  const orphanedUserClubIds = [...userClubRefs].filter(id => !validClubIds.has(id));
  if (orphanedUserClubIds.length > 0) {
    console.log('👻 GHOST CLUB IDs in users:', orphanedUserClubIds);
  } else {
    console.log('✅ No orphaned club IDs in users');
  }

  // 4. Check for any other collections that might have club data
  console.log('\n🔍 Checking club_events...');
  const eventsSnapshot = await db.collection('club_events').limit(50).get();
  const eventClubIds = new Set();
  eventsSnapshot.docs.forEach(doc => {
    const clubId = doc.data().clubId;
    if (clubId) eventClubIds.add(clubId);
  });

  const orphanedEventClubIds = [...eventClubIds].filter(id => !validClubIds.has(id));
  if (orphanedEventClubIds.length > 0) {
    console.log('👻 GHOST CLUB IDs in club_events:', orphanedEventClubIds);
  } else {
    console.log('✅ No orphaned club IDs in events');
  }

  console.log('\n========================================');
  console.log('🏁 Search complete!');
}

findGhostClubs()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
