const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function clearClubChat() {
  const clubId = 'WsetxkWODywjt0BBcqrs'; // Lightning Pickleball Club

  console.log('🧹 Lightning Pickleball Club 대화방 메시지 삭제\n');
  console.log('='.repeat(60));

  // 1. clubChat 컬렉션에서 해당 클럽 메시지 삭제
  console.log('\n🔍 clubChat 컬렉션 검색 중...\n');

  const clubChats = await db.collection('clubChat').where('clubId', '==', clubId).get();

  console.log('📁 발견된 메시지: ' + clubChats.size + '개');

  let deleted = 0;
  for (const doc of clubChats.docs) {
    const data = doc.data();
    console.log(
      '🗑️ 삭제: ' +
        (data.senderName || 'Unknown') +
        ' - ' +
        (data.message?.substring(0, 30) || '(내용 없음)') +
        '...'
    );
    await doc.ref.delete();
    deleted++;
  }

  // 2. club_chats 컬렉션 확인 (서브컬렉션 형태일 수 있음)
  console.log('\n🔍 club_chats/' + clubId + '/messages 검색 중...\n');

  try {
    const clubChatsMessages = await db
      .collection('club_chats')
      .doc(clubId)
      .collection('messages')
      .get();

    if (!clubChatsMessages.empty) {
      console.log('📁 club_chats/messages 발견: ' + clubChatsMessages.size + '개');

      for (const doc of clubChatsMessages.docs) {
        await doc.ref.delete();
        deleted++;
      }
      console.log('✅ club_chats/messages 삭제 완료');
    } else {
      console.log('ℹ️ club_chats/messages 비어있음');
    }
  } catch (e) {
    console.log('ℹ️ club_chats 컬렉션 없음 또는 접근 불가');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 결과 요약:');
  console.log('   🗑️ 총 삭제된 메시지: ' + deleted + '개');
  console.log('\n✅ 완료!');
}

clearClubChat()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
