const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkJamesWilsonClubs() {
  console.log('🔍 Looking for James Wilson (test9@g.com)...\n');

  // Find James Wilson user
  const usersSnapshot = await db.collection('users').where('email', '==', 'test9@g.com').get();

  if (usersSnapshot.empty) {
    // Try searching by displayName
    const usersByName = await db
      .collection('users')
      .where('displayName', '==', 'James Wilson')
      .get();

    if (usersByName.empty) {
      console.log('❌ James Wilson not found by email or name');

      // Search all users
      console.log('\n📋 All users:');
      const allUsers = await db.collection('users').get();
      allUsers.forEach(doc => {
        const data = doc.data();
        console.log(
          `  - ${data.displayName || data.name || '(no name)'} (${data.email || 'no email'})`
        );
      });
    } else {
      usersByName.forEach(doc => {
        console.log('Found by name:', JSON.stringify(doc.data(), null, 2));
      });
    }
  } else {
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`✅ Found James Wilson!`);
      console.log(`   User ID: ${doc.id}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Display Name: ${userData.displayName || userData.name}`);

      // Print all fields to find club-related ones
      console.log('\n📋 All user fields:');
      Object.keys(userData)
        .sort()
        .forEach(key => {
          const value = userData[key];
          if (typeof value === 'object' && value !== null) {
            console.log(`   ${key}: ${JSON.stringify(value)}`);
          } else {
            console.log(`   ${key}: ${value}`);
          }
        });
    });
  }

  // Also search for any club that references this user
  console.log('\n\n🔍 Checking for club references in collectionGroup "members"...');
  try {
    const membersSnapshot = await db.collectionGroup('members').get();
    console.log(`Total members across all clubs: ${membersSnapshot.size}`);

    membersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.ref.path}: ${data.displayName || data.userId || '(no name)'}`);
    });
  } catch (e) {
    console.log('  (collectionGroup query failed - might need index)');
  }

  process.exit(0);
}

checkJamesWilsonClubs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
