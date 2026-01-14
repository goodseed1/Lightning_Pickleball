/**
 * Firestore profile.displayName & profile.nickname 동기화 스크립트
 *
 * 목적: root displayName (이미 영어로 변환됨)을 profile.displayName과 profile.nickname에 복사
 *
 * 사용법:
 *   node scripts/sync-profile-displayname.js --dry-run    # 미리보기 (변경 없음)
 *   node scripts/sync-profile-displayname.js              # 실제 실행
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin 초기화
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

// 명령줄 인자 파싱
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

/**
 * 한글 포함 여부 확인
 */
function containsKorean(text) {
  if (!text || typeof text !== 'string') return false;
  return /[\uAC00-\uD7AF]/.test(text);
}

async function main() {
  console.log('\n🔄 Profile displayName/nickname 동기화 시작\n');
  console.log(`   모드: ${DRY_RUN ? '🔍 DRY RUN (미리보기)' : '⚡ 실제 실행'}`);
  console.log('');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let syncedCount = 0;
  let skippedCount = 0;
  let alreadySyncedCount = 0;

  const batch = db.batch();
  let batchCount = 0;
  const MAX_BATCH_SIZE = 450;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const rootDisplayName = data.displayName;
    const profileDisplayName = data.profile?.displayName;
    const profileNickname = data.profile?.nickname;

    // root displayName이 없거나 한국어이면 스킵
    if (!rootDisplayName) {
      console.log(`   ⏭️ ${doc.id}: root displayName 없음 - 스킵`);
      skippedCount++;
      continue;
    }

    if (containsKorean(rootDisplayName)) {
      console.log(`   ⏭️ ${doc.id}: root displayName이 한국어 (${rootDisplayName}) - 스킵`);
      skippedCount++;
      continue;
    }

    // 이미 동기화되어 있으면 스킵
    if (profileDisplayName === rootDisplayName && profileNickname === rootDisplayName) {
      alreadySyncedCount++;
      continue;
    }

    // 동기화 필요
    const updates = {
      'profile.displayName': rootDisplayName,
      'profile.nickname': rootDisplayName,
    };

    if (DRY_RUN) {
      console.log(`   📝 ${doc.id}:`);
      console.log(`      root.displayName: "${rootDisplayName}"`);
      console.log(
        `      profile.displayName: "${profileDisplayName || '없음'}" → "${rootDisplayName}"`
      );
      console.log(`      profile.nickname: "${profileNickname || '없음'}" → "${rootDisplayName}"`);
    } else {
      batch.update(doc.ref, updates);
      batchCount++;

      if (batchCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        console.log(`   💾 ${batchCount}개 문서 저장 완료`);
        batchCount = 0;
      }
    }

    syncedCount++;
  }

  // 남은 배치 커밋
  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`   💾 ${batchCount}개 문서 저장 완료`);
  }

  // 결과 출력
  console.log('\n' + '='.repeat(50));
  console.log('📊 동기화 결과:');
  console.log(`   ✅ 동기화됨: ${syncedCount}개`);
  console.log(`   ⏭️ 스킵됨: ${skippedCount}개`);
  console.log(`   ✨ 이미 동기화됨: ${alreadySyncedCount}개`);
  console.log(`   📦 총 사용자: ${snapshot.docs.length}명`);

  if (DRY_RUN) {
    console.log('\n💡 실제 실행하려면:');
    console.log('   node scripts/sync-profile-displayname.js');
  }

  console.log('\n✅ 완료!\n');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
