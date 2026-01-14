const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyBbk9vWMEy5l5k5WZ5l5l5l5l5l5l5l5l5',
  authDomain: 'lightning-pickleball.firebaseapp.com',
  projectId: 'lightning-pickleball-simple',
  storageBucket: 'lightning-pickleball-simple.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testRead() {
  try {
    const eventRef = doc(db, 'events', 'HyvhFAczPxPJqTzUqCov');
    const eventSnap = await getDoc(eventRef);

    if (eventSnap.exists()) {
      const data = eventSnap.data();
      console.log('🔍 RAW DATA from Firestore:');
      console.log('- currentParticipants:', data.currentParticipants);
      console.log('- typeof currentParticipants:', typeof data.currentParticipants);
      console.log('- "currentParticipants" in data:', 'currentParticipants' in data);
      console.log('- All keys:', Object.keys(data).sort());
    } else {
      console.log('❌ Document not found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRead();
