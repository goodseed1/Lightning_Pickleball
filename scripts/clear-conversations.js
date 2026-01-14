const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function clearConversations() {
  const testEmails = ['test1@g.com', 'test3@g.com', 'test8@g.com', 'test9@g.com'];

  console.log('🧹 대화 목록 (Conversations) 삭제 시작\n');
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
      console.log('👤 ' + userMap[userDoc.id] + ' (' + email + ')');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 conversations 컬렉션 검색 중...\n');

  // conversations 컬렉션에서 테스트 사용자가 참여한 대화 찾기
  const conversations = await db.collection('conversations').get();
  console.log('📁 총 conversations: ' + conversations.size + '개\n');

  let deleted = 0;

  for (const doc of conversations.docs) {
    const data = doc.data();
    const participants = data.participants || [];

    // participants 배열에 테스트 사용자가 포함되어 있는지 확인
    const hasTestUser = participants.some(p => userIds.includes(p));

    if (hasTestUser) {
      const participantNames = participants
        .map(p => userMap[p] || p.substring(0, 8) + '...')
        .join(' ↔ ');
      console.log('🗑️ 삭제: ' + participantNames + ' (ID: ' + doc.id + ')');
      await doc.ref.delete();
      deleted++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 결과 요약:');
  console.log('   🗑️ 삭제된 대화 목록: ' + deleted + '개');
  console.log('\n✅ 완료!');
}

clearConversations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
