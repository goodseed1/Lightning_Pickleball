const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function clearDirectChats() {
  const testEmails = ['test1@g.com', 'test3@g.com', 'test8@g.com', 'test9@g.com'];

  console.log('🧹 개인 대화방 (Direct Chat) 삭제 시작\n');
  console.log('='.repeat(60));

  // 먼저 사용자 ID들을 수집
  const userIds = [];
  const userMap = {};

  for (const email of testEmails) {
    const usersQuery = await db.collection('users').where('email', '==', email).get();

    if (!usersQuery.empty) {
      const userDoc = usersQuery.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();
      const userName = userData.displayName || userData.name || '(이름 없음)';

      userIds.push(userId);
      userMap[userId] = { name: userName, email: email };
      console.log('👤 ' + userName + ' (' + email + ') - ID: ' + userId);
    } else {
      console.log('❌ ' + email + ' - 사용자를 찾을 수 없음');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 directChat 컬렉션에서 대화 검색 중...\n');

  let totalDeleted = 0;

  // directChat 컬렉션의 모든 문서 검색
  const directChats = await db.collection('directChat').get();

  console.log('📁 directChat 총 문서 수: ' + directChats.size + '개\n');

  for (const doc of directChats.docs) {
    const data = doc.data();
    const senderId = data.senderId;
    const receiverId = data.receiverId;

    // 발신자 또는 수신자가 테스트 사용자인 경우 삭제
    if (userIds.includes(senderId) || userIds.includes(receiverId)) {
      const senderName =
        userMap[senderId]?.name || data.senderName || senderId?.substring(0, 8) + '...';
      const receiverName =
        userMap[receiverId]?.name || data.receiverName || receiverId?.substring(0, 8) + '...';

      console.log('🗑️ 삭제: ' + senderName + ' → ' + receiverName + ' (ID: ' + doc.id + ')');
      await doc.ref.delete();
      totalDeleted++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 결과 요약:');
  console.log('   🗑️ directChat 삭제: ' + totalDeleted + '개');
  console.log('\n✅ 완료!');
}

clearDirectChats()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
