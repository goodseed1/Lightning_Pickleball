const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Duluth, GA coordinates - 심사관을 위한 고정 위치
const DULUTH_GA = {
  latitude: 34.0023,
  longitude: -84.1449,
  lat: 34.0023,
  lng: -84.1449,
  city: 'Duluth',
  state: 'GA',
  country: 'United States',
  address: 'Duluth, GA, USA',
};

// Apple 심사용 계정들
const TEST_EMAILS = [
  'test1@g.com', // James Davis
  'test3@g.com', // Eva White
  'test8@g.com', // Grace Johnson
];

async function updateAllTestUsers() {
  console.log('🍎 Apple 심사용 계정 위치 업데이트 시작...\n');

  for (const email of TEST_EMAILS) {
    await updateUserByEmail(email);
  }
}

async function updateUserByEmail(email) {
  console.log(`🔍 Searching for: ${email}`);

  const usersRef = db.collection('users');
  let snapshot = await usersRef.where('email', '==', email).get();

  if (snapshot.empty) {
    // Try profile.email
    snapshot = await usersRef.where('profile.email', '==', email).get();
  }

  if (snapshot.empty) {
    console.log(`   ❌ User not found: ${email}\n`);
    return;
  }

  for (const doc of snapshot.docs) {
    const userData = doc.data();
    const displayName = userData.displayName || userData.profile?.displayName || 'Unknown';

    await db.collection('users').doc(doc.id).update({
      'profile.location': DULUTH_GA,
      location: DULUTH_GA,
    });

    console.log(`   ✅ ${displayName} (${doc.id})`);
    console.log(`   📍 Location set to: Duluth, GA (34.0023, -84.1449)\n`);
  }
}

updateAllTestUsers()
  .then(() => {
    console.log('🎉 모든 Apple 심사용 계정 업데이트 완료!');
    console.log('👀 심사관들이 로그인하면 Duluth, GA 기준으로 콘텐츠가 표시됩니다.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
