/**
 * clubChat 전체 확인 (삭제된 것 포함)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkAllChat(email) {
  console.log(`🔍 ${email} 유저의 clubChat 전체 확인 중...\n`);

  // 1. 유저 찾기
  const usersSnapshot = await db.collection('users').where('email', '==', email).get();
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
  console.log(`가입한 클럽: ${clubIds.length}개`);
  clubIds.forEach(id => console.log(`  - ${id}`));

  // 3. 모든 clubChat 메시지 확인 (isDeleted 상관없이)
  console.log('\n' + '='.repeat(70));
  console.log('📊 clubChat 전체 메시지 (삭제된 것 포함):');
  console.log('='.repeat(70));

  for (const clubId of clubIds) {
    const chatSnapshot = await db.collection('clubChat').where('clubId', '==', clubId).get();

    console.log(`\n📍 Club ${clubId}: 총 ${chatSnapshot.size}개 메시지`);

    let unreadActive = 0;
    let unreadDeleted = 0;

    chatSnapshot.forEach(doc => {
      const data = doc.data();
      const isUnread = data.senderId !== userId && (!data.readBy || !data.readBy.includes(userId));

      if (isUnread) {
        if (data.isDeleted) {
          unreadDeleted++;
        } else {
          unreadActive++;
          console.log(`  [UNREAD] ${doc.id}: type=${data.type}, sender=${data.senderId}`);
        }
      }
    });

    console.log(`  - Active unread: ${unreadActive}`);
    console.log(`  - Deleted unread: ${unreadDeleted}`);
  }

  // 4. 전체 clubChat에서 이 유저가 안 읽은 것 (클럽 무관)
  console.log('\n' + '='.repeat(70));
  console.log('📊 전체 clubChat에서 unread (모든 클럽):');
  console.log('='.repeat(70));

  const allChatSnapshot = await db.collection('clubChat').get();
  let totalUnread = 0;

  allChatSnapshot.forEach(doc => {
    const data = doc.data();
    const isUnread =
      data.type === 'text' &&
      data.senderId !== userId &&
      !data.isDeleted &&
      (!data.readBy || !data.readBy.includes(userId));

    if (isUnread && clubIds.includes(data.clubId)) {
      totalUnread++;
    }
  });

  console.log(`총 unread (가입한 클럽만): ${totalUnread}개`);

  process.exit(0);
}

const email = process.argv[2] || 'test9@g.com';
checkAllChat(email).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
