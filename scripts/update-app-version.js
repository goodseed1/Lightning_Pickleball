/**
 * Update App Version in Firestore
 *
 * Firestore의 app_config/version 문서에서 latest_version을 업데이트합니다.
 * 이 값이 앱의 현재 버전보다 높으면 사용자에게 업데이트 알림이 표시됩니다.
 *
 * 사용법: node scripts/update-app-version.js 2.0.16
 */

const admin = require('firebase-admin');
const path = require('path');

// Service account 초기화
const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'lightning-pickleball-community',
  });
} catch (error) {
  console.error('❌ service-account-key.json 파일을 찾을 수 없습니다.');
  console.error('   Firebase Console에서 다운로드하세요.');
  process.exit(1);
}

const db = admin.firestore();

async function updateAppVersion(newVersion) {
  if (!newVersion) {
    console.error('❌ 버전을 입력해주세요.');
    console.log('사용법: node scripts/update-app-version.js 2.0.16');
    process.exit(1);
  }

  // 버전 형식 검증 (x.x.x)
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('❌ 잘못된 버전 형식입니다. 예: 2.0.16');
    process.exit(1);
  }

  console.log(`\n🎾 Lightning Pickleball 앱 버전 업데이트`);
  console.log(`================================================`);

  try {
    const versionRef = db.collection('app_config').doc('version');
    const versionDoc = await versionRef.get();

    let currentConfig = {};
    if (versionDoc.exists) {
      currentConfig = versionDoc.data();
      console.log(`\n📱 현재 설정:`);
      console.log(`   - latest_version: ${currentConfig.latest_version || 'N/A'}`);
      console.log(`   - minimum_version: ${currentConfig.minimum_version || 'N/A'}`);
    } else {
      console.log(`\n⚠️ app_config/version 문서가 없습니다. 새로 생성합니다.`);
    }

    // 업데이트
    await versionRef.set(
      {
        ...currentConfig,
        latest_version: newVersion,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`\n✅ 업데이트 완료!`);
    console.log(`   - latest_version: ${newVersion}`);
    console.log(`\n📱 이제 앱에서 업데이트 알림이 표시됩니다!`);
    console.log(`================================================\n`);
  } catch (error) {
    console.error('❌ Firestore 업데이트 실패:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// 실행
const newVersion = process.argv[2];
updateAppVersion(newVersion);
