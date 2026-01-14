const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function analyzeDirectChats() {
  const testEmails = ['test1@g.com', 'test3@g.com', 'test8@g.com', 'test9@g.com'];

  console.log('🔍 Direct Chat 데이터 구조 분석\n');
  console.log('='.repeat(60));

  // 사용자 ID 수집
  const userIds = [];
  const userMap = {};

  for (const email of testEmails) {
    const usersQuery = await db.collection('users').where('email', '==', email).get();

    if (!usersQuery.empty) {
      const userDoc = usersQuery.docs[0];
      userIds.push(userDoc.id);
      userMap[userDoc.id] = usersQuery.docs[0].data().displayName || email;
    }
  }

  console.log('👥 테스트 사용자 IDs:', userIds);
  console.log('\n' + '='.repeat(60));

  // directChat 샘플 데이터 확인
  const directChats = await db.collection('directChat').limit(5).get();

  console.log('\n📁 directChat 샘플 (처음 5개):');
  directChats.forEach(doc => {
    const data = doc.data();
    console.log('\n📝 ID:', doc.id);
    console.log('   필드들:', Object.keys(data).join(', '));
    if (data.participants) console.log('   participants:', data.participants);
    if (data.senderId) console.log('   senderId:', data.senderId);
    if (data.receiverId) console.log('   receiverId:', data.receiverId);
    if (data.user1) console.log('   user1:', data.user1);
    if (data.user2) console.log('   user2:', data.user2);
    if (data.members) console.log('   members:', data.members);
  });

  // 테스트 사용자 관련 대화 찾기
  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 테스트 사용자 관련 대화 검색:\n');

  let foundCount = 0;
  const allChats = await db.collection('directChat').get();

  for (const doc of allChats.docs) {
    const data = doc.data();
    const allValues = JSON.stringify(data);

    // 사용자 ID가 어딘가에 포함되어 있는지 확인
    for (const userId of userIds) {
      if (allValues.includes(userId)) {
        console.log('✅ 발견! ID:', doc.id);
        console.log('   데이터:', JSON.stringify(data).substring(0, 200) + '...');
        foundCount++;
        break;
      }
    }
  }

  console.log('\n📊 총 발견된 대화:', foundCount + '개');
}

analyzeDirectChats()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
