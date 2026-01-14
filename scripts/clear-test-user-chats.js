const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function clearChatHistory() {
  const testEmails = ['test1@g.com', 'test8@g.com', 'test9@g.com'];

  console.log('🧹 Lightning Coach 채팅 기록 삭제 시작\n');
  console.log('='.repeat(60));

  for (const email of testEmails) {
    // 사용자 찾기
    const usersQuery = await db.collection('users').where('email', '==', email).get();

    if (usersQuery.empty) {
      console.log('❌ ' + email + ' - 사용자를 찾을 수 없음');
      continue;
    }

    const userDoc = usersQuery.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    const userName = userData.displayName || userData.name || '(이름 없음)';

    console.log('\n👤 ' + userName + ' (' + email + ')');
    console.log('   User ID: ' + userId);

    let totalDeleted = 0;

    // user_feedback 삭제 (Lightning Coach 피드백/채팅)
    const userFeedback = await db.collection('user_feedback').where('userId', '==', userId).get();

    if (!userFeedback.empty) {
      for (const doc of userFeedback.docs) {
        const data = doc.data();
        console.log(
          '   📝 삭제 중: ' + (data.title || data.type || 'feedback') + ' (ID: ' + doc.id + ')'
        );
        await doc.ref.delete();
        totalDeleted++;
      }
      console.log('   ✅ user_feedback: ' + userFeedback.size + '개 삭제');
    }

    // chatbot_logs 삭제 (AI 채팅 로그)
    const chatbotLogs = await db.collection('chatbot_logs').where('userId', '==', userId).get();

    if (!chatbotLogs.empty) {
      for (const doc of chatbotLogs.docs) {
        await doc.ref.delete();
        totalDeleted++;
      }
      console.log('   ✅ chatbot_logs: ' + chatbotLogs.size + '개 삭제');
    }

    if (totalDeleted === 0) {
      console.log('   ℹ️ 삭제할 채팅 기록 없음');
    } else {
      console.log('   🗑️ 총 ' + totalDeleted + '개 삭제 완료');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ 모든 채팅 기록 삭제 완료!');
}

clearChatHistory()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
