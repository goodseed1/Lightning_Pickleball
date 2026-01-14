// scripts/get-users.js
// Script to fetch all user data from Firestore

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function getAllUsers() {
  try {
    console.log('Fetching all users from Firestore...\n');

    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }

    console.log(`Found ${usersSnapshot.size} users:\n`);
    console.log('='.repeat(80));

    const usersList = [];

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const userInfo = {
        uid: doc.id,
        email: userData.email || 'N/A',
        displayName: userData.displayName || userData.profile?.nickname || 'N/A',
        createdAt: userData.createdAt?.toDate?.()?.toISOString() || 'N/A',
      };

      usersList.push(userInfo);

      console.log(`\nUID: ${userInfo.uid}`);
      console.log(`Name: ${userInfo.displayName}`);
      console.log(`Email: ${userInfo.email}`);
      console.log(`Created: ${userInfo.createdAt}`);
      console.log('-'.repeat(80));
    });

    console.log('\n\nSummary:');
    console.log('='.repeat(80));
    console.log(`Total Users: ${usersList.length}\n`);

    // Print as a table
    console.table(
      usersList.map(u => ({
        Name: u.displayName,
        Email: u.email,
        'Created At': u.createdAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    process.exit(0);
  }
}

getAllUsers();
