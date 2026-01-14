// scripts/get-users-web.js
// Script to fetch all user data from Firestore using Web SDK

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getAllUsers() {
  try {
    console.log('🔥 Fetching all users from Firestore...\n');

    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);

    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }

    console.log(`✅ Found ${usersSnapshot.size} users:\n`);
    console.log('='.repeat(100));

    const usersList = [];

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const userInfo = {
        uid: doc.id,
        email: userData.email || 'N/A',
        displayName: userData.displayName || userData.profile?.nickname || 'N/A',
        skillLevel: userData.profile?.skillLevel || 'N/A',
        location: userData.profile?.location || 'N/A',
        matchesPlayed: userData.stats?.matchesPlayed || 0,
        eloRating: userData.stats?.eloRating || 0,
        createdAt:
          userData.createdAt?.toDate?.()?.toISOString() ||
          (userData.createdAt?.seconds
            ? new Date(userData.createdAt.seconds * 1000).toISOString()
            : 'N/A'),
      };

      usersList.push(userInfo);

      console.log(`\n👤 User #${usersList.length}`);
      console.log(`   UID: ${userInfo.uid}`);
      console.log(`   Name: ${userInfo.displayName}`);
      console.log(`   Email: ${userInfo.email}`);
      console.log(`   Skill Level: ${userInfo.skillLevel}`);
      console.log(`   Location: ${userInfo.location}`);
      console.log(`   Matches Played: ${userInfo.matchesPlayed}`);
      console.log(`   ELO Rating: ${userInfo.eloRating}`);
      console.log(`   Created: ${userInfo.createdAt}`);
      console.log('-'.repeat(100));
    });

    console.log('\n\n📊 Summary:');
    console.log('='.repeat(100));
    console.log(`Total Users: ${usersList.length}\n`);

    // Print as a formatted table
    console.log('\n📋 User List (Name & Email):');
    console.log('='.repeat(100));
    usersList.forEach((user, index) => {
      console.log(
        `${(index + 1).toString().padStart(3)}. ${user.displayName.padEnd(30)} | ${user.email}`
      );
    });
    console.log('='.repeat(100));

    // Export to JSON file
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'users-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(usersList, null, 2));
    console.log(`\n💾 User data exported to: ${outputPath}\n`);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  Permission denied. Check Firestore security rules.');
    }
  }
}

getAllUsers()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
