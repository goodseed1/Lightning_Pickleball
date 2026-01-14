/**
 * 🚨 Initialize Feedback Script
 * 초기 피드백 테스트 데이터를 생성하는 스크립트
 *
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/initializeFeedback.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function initializeFeedback() {
  console.log('🚨 Initializing user feedback test data...\n');

  try {
    // Sample feedback data
    const sampleFeedbacks = [
      {
        userId: 'test-user-001',
        userEmail: 'tester1@example.com',
        userName: 'Test User 1',
        type: 'bug',
        title: '앱이 가끔 멈춰요',
        description: '경기 기록을 저장할 때 앱이 잠시 멈추는 현상이 있습니다.',
        status: 'new',
        priority: 'high',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      {
        userId: 'test-user-002',
        userEmail: 'tester2@example.com',
        userName: 'Test User 2',
        type: 'feature',
        title: '다크 모드 추가 요청',
        description: '야간에 앱을 사용할 때 눈이 피로해요. 다크 모드가 있으면 좋겠습니다.',
        status: 'in_progress',
        priority: 'medium',
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        ),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      {
        userId: 'test-user-003',
        userEmail: 'tester3@example.com',
        userName: 'Test User 3',
        type: 'praise',
        title: '앱 정말 좋아요!',
        description: '피클볼 경기 관리하기 너무 편해요. 친구들한테도 추천했어요!',
        status: 'resolved',
        priority: 'low',
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        ),
        updatedAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        ),
        resolvedAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        ),
        adminNotes: '감사합니다! 앞으로도 좋은 서비스 제공하겠습니다.',
      },
      {
        userId: 'test-user-004',
        userEmail: 'tester4@example.com',
        userName: 'Test User 4',
        type: 'complaint',
        title: '푸시 알림이 너무 많아요',
        description: '매일 알림이 와서 조금 귀찮아요. 알림 설정을 더 세분화해주세요.',
        status: 'new',
        priority: 'medium',
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        ),
        updatedAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        ),
      },
      {
        userId: 'test-user-005',
        userEmail: 'tester5@example.com',
        userName: 'Test User 5',
        type: 'other',
        title: '클럽 가입 문의',
        description: '특정 클럽에 가입하고 싶은데 어떻게 해야 하나요?',
        status: 'resolved',
        priority: 'low',
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ),
        updatedAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        ),
        resolvedAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        ),
        adminNotes: '클럽 탭에서 검색 후 가입 버튼을 눌러주세요.',
      },
    ];

    // Check if user_feedback collection already has data
    const existingFeedback = await db.collection('user_feedback').limit(1).get();
    if (!existingFeedback.empty) {
      console.log('⚠️ user_feedback collection already has data.');
      console.log('   Existing documents:', (await db.collection('user_feedback').get()).size);
      console.log('   Skipping initialization to avoid duplicates.\n');
      console.log('💡 To reset, manually delete documents from Firestore Console.');
      process.exit(0);
    }

    // Write sample feedbacks
    console.log('💾 Writing sample feedback documents...\n');

    const batch = db.batch();
    for (const feedback of sampleFeedbacks) {
      const docRef = db.collection('user_feedback').doc();
      batch.set(docRef, feedback);
      console.log(`   ✅ Added: ${feedback.title} (${feedback.type}, ${feedback.status})`);
    }

    await batch.commit();
    console.log(
      '\n🎉 Successfully created',
      sampleFeedbacks.length,
      'sample feedback documents!\n'
    );

    // Summary
    console.log('═'.repeat(50));
    console.log('📊 Feedback Summary:');
    console.log(`   🆕 New: ${sampleFeedbacks.filter(f => f.status === 'new').length}`);
    console.log(
      `   🔄 In Progress: ${sampleFeedbacks.filter(f => f.status === 'in_progress').length}`
    );
    console.log(`   ✅ Resolved: ${sampleFeedbacks.filter(f => f.status === 'resolved').length}`);
    console.log('═'.repeat(50));
    console.log('\n✨ You can now view feedback in the Admin Dashboard!');
  } catch (error) {
    console.error('❌ Error initializing feedback:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
initializeFeedback();
