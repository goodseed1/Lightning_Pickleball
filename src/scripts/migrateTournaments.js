/**
 * Tournament Data Migration Script
 * 작전명: "도시 분리" - tournaments 데이터를 별도 컬렉션으로 이전
 *
 * 이 스크립트는:
 * 1. leagues 컬렉션에서 type='tournament' 문서들을 찾음
 * 2. 새로운 tournaments 컬렉션으로 복사
 * 3. 원본 위치에서 안전하게 삭제
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '../.env' });

// Firebase Admin 초기화 (프로젝트 ID 명시적 설정)
if (!admin.apps.length) {
  try {
    // 첫 번째 시도: Application Default Credentials
    admin.initializeApp({
      projectId: 'lightning-pickleball-community',
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.log('⚠️ [Auth] Application Default Credentials 실패, Firebase CLI 토큰 시도...');
    // 두 번째 시도: Firebase 프로젝트 설정만으로 초기화 (Firebase CLI 로그인 사용)
    admin.initializeApp({
      projectId: 'lightning-pickleball-community',
    });
  }
}

const db = admin.firestore();

async function migrateTournamentData() {
  try {
    console.log('🚀 [Migration] 토너먼트 데이터 마이그레이션 시작...');

    // 1. leagues에서 tournament 타입 문서들 조회
    console.log('📋 [Step 1] tournament 타입 문서 조회 중...');
    const tournamentSnapshot = await db
      .collection('leagues')
      .where('type', '==', 'tournament')
      .get();

    if (tournamentSnapshot.empty) {
      console.log('✅ [Migration] 이전할 토너먼트 데이터가 없습니다.');
      return;
    }

    console.log(`📊 [Found] ${tournamentSnapshot.size}개의 토너먼트 문서를 발견했습니다.`);

    // 2. 배치 작업으로 안전하게 이전
    console.log('🔄 [Step 2] 새로운 tournaments 컬렉션으로 복사 중...');
    const batchSize = 500; // Firestore 배치 제한
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;

    const documentsToMigrate = [];

    tournamentSnapshot.forEach(doc => {
      const data = doc.data();
      documentsToMigrate.push({
        id: doc.id,
        data: data,
        originalRef: doc.ref,
      });

      // 새로운 tournaments 컬렉션에 복사
      const newTournamentRef = db.collection('tournaments').doc(doc.id);
      currentBatch.set(newTournamentRef, data);
      operationCount++;

      // 배치 크기 확인
      if (operationCount === batchSize) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        operationCount = 0;
      }
    });

    // 남은 작업이 있으면 마지막 배치에 추가
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // 모든 배치 실행 (복사)
    console.log(`💾 [Copying] ${batches.length}개 배치로 데이터를 복사합니다...`);
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`✅ [Batch ${i + 1}/${batches.length}] 복사 완료`);
    }

    // 3. 복사 검증
    console.log('🔍 [Step 3] 복사된 데이터 검증 중...');
    const verificationSnapshot = await db.collection('tournaments').get();

    if (verificationSnapshot.size !== tournamentSnapshot.size) {
      throw new Error(
        `복사 검증 실패: 원본 ${tournamentSnapshot.size}개, 복사본 ${verificationSnapshot.size}개`
      );
    }

    console.log(`✅ [Verification] ${verificationSnapshot.size}개 문서 복사 검증 완료`);

    // 4. 원본에서 안전하게 삭제
    console.log('🗑️ [Step 4] 원본 위치에서 삭제 중...');
    const deleteBatches = [];
    let deleteBatch = db.batch();
    let deleteCount = 0;

    documentsToMigrate.forEach(doc => {
      deleteBatch.delete(doc.originalRef);
      deleteCount++;

      if (deleteCount === batchSize) {
        deleteBatches.push(deleteBatch);
        deleteBatch = db.batch();
        deleteCount = 0;
      }
    });

    if (deleteCount > 0) {
      deleteBatches.push(deleteBatch);
    }

    // 삭제 배치 실행
    console.log(`🗑️ [Deleting] ${deleteBatches.length}개 배치로 원본을 삭제합니다...`);
    for (let i = 0; i < deleteBatches.length; i++) {
      await deleteBatches[i].commit();
      console.log(`✅ [Delete Batch ${i + 1}/${deleteBatches.length}] 삭제 완료`);
    }

    // 5. 최종 검증
    console.log('🏁 [Step 5] 최종 검증 중...');
    const remainingTournaments = await db
      .collection('leagues')
      .where('type', '==', 'tournament')
      .get();

    if (!remainingTournaments.empty) {
      throw new Error(
        `마이그레이션 실패: 아직 ${remainingTournaments.size}개의 토너먼트가 남아있습니다.`
      );
    }

    const finalTournamentCount = await db.collection('tournaments').get();

    console.log('🎉 [SUCCESS] 토너먼트 데이터 마이그레이션 완료!');
    console.log(
      `📊 [Summary] ${finalTournamentCount.size}개의 토너먼트가 새로운 컬렉션으로 이전되었습니다.`
    );
    console.log('✨ [Next] 이제 Firebase 콘솔에서 leagues → leagues로 이름을 변경하세요.');
  } catch (error) {
    console.error('❌ [ERROR] 마이그레이션 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateTournamentData()
    .then(() => {
      console.log('🎯 [Migration] 작전 완료! 프로세스를 종료합니다.');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 [FATAL] 마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateTournamentData };
