/**
 * Test script to add match result data to Firebase for testing
 * This will help verify that both host and applicant views display match results correctly
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config (same as in the app)
const firebaseConfig = {
  // Add your Firebase config here - you can copy from the app
  // For security, I'll leave this empty - you'll need to fill it in
};

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
        winnerId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2', // Host ID
        loserId: 'Vr5z2suh9TZl3eQZfukPhLW6Ont1',  // Participant ID
        score: '6-2, 6-2',
        recordedAt: serverTimestamp(),
        recordedBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      },
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(eventRef, updateData);
    console.log('🎉 Match result added successfully!');
    console.log('📊 Result data:', updateData);

  } catch (error) {
    console.error('❌ Error adding match result:', error);
  }
}

// Run the test
addTestMatchResult();