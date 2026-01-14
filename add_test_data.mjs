/**
 * Simple script to add test match result data to Firebase
 * Run with: node add_test_data.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Firebase config - using environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔥 Firebase Config Check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
});

if (!firebaseConfig.projectId) {
  console.error('❌ Firebase configuration missing. Please check environment variables.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTestMatchResult() {
  try {
    console.log('🎯 Adding test match result to 번매12...');

    // Update event DruVwr7O6lrgd3kHjU4R (번매12) with match result
    const eventRef = doc(db, 'events', 'DruVwr7O6lrgd3kHjU4R');

    const updateData = {
      status: 'completed',
      result: {
        winnerId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2', // Host ID (winner)
        loserId: 'Vr5z2suh9TZl3eQZfukPhLW6Ont1',  // Participant ID (loser)
        score: '6-2, 6-2',
        recordedAt: new Date(),
        recordedBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      },
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    await updateDoc(eventRef, updateData);
    console.log('🎉 Match result added successfully!');
    console.log('📊 Result data:', updateData);

    // Add another test result where participant wins
    console.log('🎯 Adding participant win result to 번매11...');
    const eventRef2 = doc(db, 'events', '843848hFJE4P8Rv1pav7');

    const updateData2 = {
      status: 'completed',
      result: {
        winnerId: 'Vr5z2suh9TZl3eQZfukPhLW6Ont1', // Participant ID (winner)
        loserId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',  // Host ID (loser)
        score: '7-6(5), 6-4',
        recordedAt: new Date(),
        recordedBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      },
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    await updateDoc(eventRef2, updateData2);
    console.log('🎉 Participant win result added successfully!');
    console.log('📊 Result data:', updateData2);

    console.log('✅ Test match results added! Check the app Activity tab to see the results.');

  } catch (error) {
    console.error('❌ Error adding match result:', error);
  }
}

// Run the test
addTestMatchResult();