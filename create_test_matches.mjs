/**
 * 테스트용 번개매치 생성 스크립트
 * Run with: node create_test_matches.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Load environment variables from .env file
const envFile = readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/["']/g, '');
  }
});

// Firebase config
const firebaseConfig = {
  apiKey: envVars.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔥 Firebase Config Check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
});

if (!firebaseConfig.projectId) {
  console.error('❌ Firebase configuration missing. Please check .env file.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestMatches() {
  try {
    console.log('🎯 Creating test lightning matches...');

    // Test Match 1 - Host Victory Case
    const eventData1 = {
      title: '번개매치 테스트1 (호스트 승리)',
      description: '매치 결과 표시 시스템 테스트용 - 호스트가 승리하는 케이스',
      location: '테니스 코트 A',
      eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow +2 hours
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // Tomorrow +4 hours
      type: 'lightning',
      maxParticipants: 2,
      participants: 0,
      status: 'scheduled',
      skillLevel: 'intermediate',
      hostId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      createdBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      minNTRP: 3.0,
      maxNTRP: 5.0,
    };

    const eventsRef = collection(db, 'events');
    const docRef1 = await addDoc(eventsRef, eventData1);
    console.log('✅ Test Match 1 created:', docRef1.id);

    // Wait a bit between creations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test Match 2 - Participant Victory Case
    const eventData2 = {
      title: '번개매치 테스트2 (신청자 승리)',
      description: '매치 결과 표시 시스템 테스트용 - 신청자가 승리하는 케이스',
      location: '테니스 코트 B',
      eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // Day after tomorrow +3 hours
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // Day after tomorrow +5 hours
      type: 'lightning',
      maxParticipants: 2,
      participants: 0,
      status: 'scheduled',
      skillLevel: 'advanced',
      hostId: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      createdBy: 'zw9zD7oNhSXsQuhBVEsGrUSbknY2',
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      minNTRP: 4.0,
      maxNTRP: 6.0,
    };

    const docRef2 = await addDoc(eventsRef, eventData2);
    console.log('✅ Test Match 2 created:', docRef2.id);

    console.log('🎉 All test matches created successfully!');
    console.log('📋 Summary:');
    console.log(`  - Match 1 (Host Victory): ${docRef1.id}`);
    console.log(`  - Match 2 (Participant Victory): ${docRef2.id}`);
    console.log('');
    console.log('📱 Next steps:');
    console.log('1. Check the app Discovery/Activity tabs to see the new matches');
    console.log('2. Apply to participate in these matches');
    console.log('3. Record match results using RecordScoreScreen');
    console.log('4. Verify that both host and applicant views show the same results');

    return {
      match1: { id: docRef1.id, data: eventData1 },
      match2: { id: docRef2.id, data: eventData2 }
    };

  } catch (error) {
    console.error('❌ Error creating test matches:', error);
    throw error;
  }
}

// Run the script
createTestMatches()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });