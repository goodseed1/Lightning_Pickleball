/**
 * 클럽 알림 확인 및 초기화 스크립트
 * clubs/{clubId}/notifications 에서 unread 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkAndResetClubNotifications(email) {
  console.log(`🔍 ${email} 유저의 클럽 알림 확인 중...\n`);

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

  // 2. 모든 클럽에서 notifications 확인
  console.log('\n' + '='.repeat(70));
  console.log('📊 clubs/{clubId}/notifications 확인:');
  console.log('='.repeat(70));

  const clubsSnapshot = await db.collection('clubs').get();
  const batch = db.batch();
  let totalUnread = 0;
  let updatedDocs = 0;

  for (const clubDoc of clubsSnapshot.docs) {
    const clubData = clubDoc.data();

    // notifications 서브컬렉션 확인
    const notiSnapshot = await db
      .collection('clubs')
      .doc(clubDoc.id)
      .collection('notifications')
      .get();

    if (!notiSnapshot.empty) {
      let clubUnread = 0;

      notiSnapshot.forEach(doc => {
        const data = doc.data();

        // readBy 배열에 userId가 없으면 unread
        const readBy = data.readBy || [];
        const isUnread = !readBy.includes(userId);

        // recipientIds에 userId가 있는지 확인
        const recipientIds = data.recipientIds || [];
        const isRecipient = recipientIds.includes(userId) || recipientIds.length === 0;

        if (isRecipient && isUnread) {
          clubUnread++;
          totalUnread++;

          // readBy에 userId 추가
          batch.update(doc.ref, {
            readBy: admin.firestore.FieldValue.arrayUnion(userId),
          });
          updatedDocs++;
        }
      });

      if (clubUnread > 0) {
        console.log(`\n📍 ${clubData.name}: ${clubUnread}개 unread`);
      }
    }
  }

  // 3. chat messages unread 확인
  console.log('\n' + '='.repeat(70));
  console.log('📊 clubs/{clubId}/chat 메시지 확인:');
  console.log('='.repeat(70));

  for (const clubDoc of clubsSnapshot.docs) {
    const clubData = clubDoc.data();

    // chat 서브컬렉션 확인
    const chatSnapshot = await db.collection('clubs').doc(clubDoc.id).collection('chat').get();

    if (!chatSnapshot.empty) {
      let unreadMessages = 0;

      chatSnapshot.forEach(doc => {
        const data = doc.data();
        const readBy = data.readBy || [];
        const senderId = data.senderId || data.userId;

        // 자신이 보낸 메시지가 아니고, readBy에 없으면 unread
        if (senderId !== userId && !readBy.includes(userId)) {
          unreadMessages++;

          // readBy에 userId 추가
          batch.update(doc.ref, {
            readBy: admin.firestore.FieldValue.arrayUnion(userId),
          });
          updatedDocs++;
        }
      });

      if (unreadMessages > 0) {
        console.log(`📍 ${clubData.name} 채팅: ${unreadMessages}개 unread 메시지`);
        totalUnread += unreadMessages;
      }
    }
  }

  // 4. 배치 커밋
  if (updatedDocs > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('🔧 초기화 작업...');
    console.log('='.repeat(70));

    await batch.commit();
    console.log(`\n✅ ${updatedDocs}개 문서 업데이트 완료!`);
  } else {
    console.log('\n✅ Firestore에는 unread 항목이 없습니다.');
  }

  console.log('\n' + '='.repeat(70));
  console.log('💡 결과:');
  console.log('='.repeat(70));
  console.log(`총 ${totalUnread}개 unread 항목을 읽음 처리했습니다.`);
  console.log('\n앱을 완전히 종료 후 다시 시작해 보세요!');
  console.log('그래도 안 되면 로그아웃 → 재로그인을 시도해 보세요.');

  process.exit(0);
}

const email = process.argv[2] || 'test9@g.com';
checkAndResetClubNotifications(email).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
