/**
 * Jong 사용자 이메일 찾기 스크립트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function findUser(searchName) {
  console.log(`🔍 "${searchName}" 사용자 검색 중...\n`);

  const allUsers = await db.collection('users').get();
  let found = false;

  allUsers.forEach(doc => {
    const data = doc.data();
    const name = (data.displayName || data.profile?.displayName || '').toLowerCase();
    const search = searchName.toLowerCase();

    if (name.includes(search) || search.split(' ').every(part => name.includes(part))) {
      found = true;
      console.log('='.repeat(50));
      console.log('✅ Found!');
      console.log('User ID:', doc.id);
      console.log('Email:', data.email);
      console.log('Display Name:', data.displayName || data.profile?.displayName);
      console.log('='.repeat(50));
    }
  });

  if (!found) {
    console.log(`❌ "${searchName}" 사용자를 찾을 수 없습니다.`);
  }

  process.exit(0);
}

const searchName = process.argv[2] || 'James Smith';

findUser(searchName).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
