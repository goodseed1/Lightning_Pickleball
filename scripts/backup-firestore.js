/**
 * Firestore 전체 백업 스크립트
 *
 * 사용법: node scripts/backup-firestore.js
 *
 * 번역 전에 반드시 실행하여 백업을 생성하세요.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin 초기화
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

// 백업할 컬렉션 목록
const COLLECTIONS_TO_BACKUP = [
  'tennis_clubs',
  'club_posts',
  'club_chats',
  'events',
  'tournaments',
  'regular_leagues',
  'users',
  'meetups',
  'matches',
  'notifications',
  'feedback',
];

/**
 * 단일 컬렉션 백업
 */
async function backupCollection(collectionName) {
  console.log(`  📦 ${collectionName} 백업 중...`);

  const snapshot = await db.collection(collectionName).get();
  const documents = [];

  snapshot.forEach(doc => {
    documents.push({
      id: doc.id,
      data: doc.data(),
    });
  });

  console.log(`     ✅ ${documents.length}개 문서 백업 완료`);
  return documents;
}

/**
 * 서브컬렉션 백업 (club_chats 등)
 */
async function backupSubcollection(parentCollection, parentDocId, subcollectionName) {
  const snapshot = await db
    .collection(parentCollection)
    .doc(parentDocId)
    .collection(subcollectionName)
    .get();

  const documents = [];
  snapshot.forEach(doc => {
    documents.push({
      id: doc.id,
      data: doc.data(),
    });
  });

  return documents;
}

/**
 * 클럽 채팅 백업 (서브컬렉션)
 */
async function backupClubChats() {
  console.log(`  📦 club_chats (서브컬렉션) 백업 중...`);

  const clubsSnapshot = await db.collection('tennis_clubs').get();
  const allChats = [];

  for (const clubDoc of clubsSnapshot.docs) {
    const chatsSnapshot = await db
      .collection('tennis_clubs')
      .doc(clubDoc.id)
      .collection('chats')
      .get();

    if (chatsSnapshot.size > 0) {
      const chats = [];
      chatsSnapshot.forEach(chatDoc => {
        chats.push({
          id: chatDoc.id,
          data: chatDoc.data(),
        });
      });

      allChats.push({
        clubId: clubDoc.id,
        chats: chats,
      });
    }
  }

  const totalChats = allChats.reduce((sum, club) => sum + club.chats.length, 0);
  console.log(`     ✅ ${allChats.length}개 클럽에서 ${totalChats}개 채팅 백업 완료`);
  return allChats;
}

/**
 * 전체 백업 실행
 */
async function runBackup() {
  console.log('\n🚀 Firestore 백업 시작...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    collections: {},
  };

  // 일반 컬렉션 백업
  for (const collectionName of COLLECTIONS_TO_BACKUP) {
    try {
      backupData.collections[collectionName] = await backupCollection(collectionName);
    } catch (error) {
      console.log(`     ⚠️ ${collectionName} 백업 실패: ${error.message}`);
      backupData.collections[collectionName] = [];
    }
  }

  // 클럽 채팅 서브컬렉션 백업
  try {
    backupData.collections['club_chats_subcollection'] = await backupClubChats();
  } catch (error) {
    console.log(`     ⚠️ club_chats 서브컬렉션 백업 실패: ${error.message}`);
    backupData.collections['club_chats_subcollection'] = [];
  }

  // 백업 파일 저장
  const backupDir = path.join(__dirname, '..', 'backups');
  const backupFile = path.join(backupDir, `firestore-backup-${timestamp}.json`);

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

  // 통계 출력
  console.log('\n📊 백업 통계:');
  let totalDocuments = 0;
  for (const [name, docs] of Object.entries(backupData.collections)) {
    if (name === 'club_chats_subcollection') {
      const chatCount = docs.reduce((sum, club) => sum + club.chats.length, 0);
      console.log(`   ${name}: ${chatCount}개`);
      totalDocuments += chatCount;
    } else {
      console.log(`   ${name}: ${docs.length}개`);
      totalDocuments += docs.length;
    }
  }

  console.log(`\n📁 백업 파일: ${backupFile}`);
  console.log(`📈 총 문서 수: ${totalDocuments}개`);
  console.log('\n✅ 백업 완료!\n');

  return backupFile;
}

// 실행
runBackup()
  .then(backupFile => {
    console.log(`💡 복원하려면: node scripts/restore-firestore-backup.js --file=${backupFile}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 백업 실패:', error);
    process.exit(1);
  });
