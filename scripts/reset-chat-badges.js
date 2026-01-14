/**
 * 빨간 배지만 초기화 (clubChat 컬렉션)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function resetChatBadges(email) {
  console.log(`🔴 ${email} 유저의 빨간 채팅 배지 초기화 중...\n`);

  // 1. 유저 찾기
  const usersSnapshot = await db.collection('users').where('email', '==', email).get();
  if (usersSnapshot.empty) {
    console.log('❌ 유저를 찾을 수 없습니다.');
    process.exit(1);
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  console.log('✅ 유저:', userData.displayName, `(${userId})`);

  // 2. clubMembers에서 유저의 클럽 확인
  const membershipSnapshot = await db
    .collection('clubMembers')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const clubIds = membershipSnapshot.docs.map(doc => doc.data().clubId);
  console.log(`가입한 클럽: ${clubIds.length}개\n`);

  // 3. clubChat에서 unread 메시지 확인 및 초기화
  const batch = db.batch();
  let chatUpdates = 0;

  for (const clubId of clubIds) {
    const chatSnapshot = await db
      .collection('clubChat')
      .where('clubId', '==', clubId)
      .where('isDeleted', '==', false)
      .get();

    let unreadCount = 0;
    chatSnapshot.forEach(doc => {
      const data = doc.data();
      const isUnread =
        data.type === 'text' &&
        data.senderId !== userId &&
        (!data.readBy || !data.readBy.includes(userId));

      if (isUnread) {
        unreadCount++;
        batch.update(doc.ref, {
          readBy: admin.firestore.FieldValue.arrayUnion(userId),
        });
        chatUpdates++;
      }
    });

    if (unreadCount > 0) {
      console.log(`📍 Club ${clubId}: ${unreadCount}개 unread 채팅`);
    }
  }

  // 4. 배치 커밋
  if (chatUpdates > 0) {
    await batch.commit();
    console.log(`\n✅ ${chatUpdates}개 채팅 메시지 읽음 처리 완료!`);
  } else {
    console.log('\n✅ unread 채팅 메시지가 없습니다.');
  }

  console.log('\n🎉 앱을 재시작하면 빨간 배지가 사라집니다!');

  process.exit(0);
}

const email = process.argv[2] || 'test9@g.com';
resetChatBadges(email).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
