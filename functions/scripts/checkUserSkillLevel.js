/**
 * 회장 사용자의 skillLevel 데이터 구조 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('/Volumes/DevSSD/development/Projects/lightning-tennis-react/lightning-tennis-simple/service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkUserSkillLevel() {
  console.log('🔍 회장 사용자 skillLevel 구조 확인...\n');

  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const nickname = data.profile?.nickname || data.displayName;

    if (nickname === '회장') {
      console.log('=== 회장 사용자 데이터 ===');
      console.log('ID:', doc.id);
      console.log('\n📊 profile.skillLevel:');
      console.log(JSON.stringify(data.profile?.skillLevel, null, 2));
      console.log('\n📊 skillLevel (root level):');
      console.log(JSON.stringify(data.skillLevel, null, 2));
      console.log('\n📊 전체 profile 객체:');
      console.log(JSON.stringify(data.profile, null, 2));
      break;
    }
  }

  process.exit(0);
}

checkUserSkillLevel();
