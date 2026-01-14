/**
 * 🎾 NTRP → LTR Firestore 마이그레이션 스크립트
 *
 * 이 스크립트는 기존 NTRP 필드를 LTR 필드로 마이그레이션합니다.
 * - users: ntrpLevel → ltrLevel
 * - lightning_matches/events: minNtrp/maxNtrp → minLtr/maxLtr
 * - partner_invitations: inviterNtrp/combinedNtrp → inviterLtr/combinedLtr
 *
 * @author Kim (AI Architect)
 * @date 2024-12-30
 *
 * 사용법:
 *   node scripts/migrate-ntrp-to-ltr.js [--dry-run]
 *
 * --dry-run: 실제 변경 없이 마이그레이션 대상만 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🎯 NTRP (1.0-5.5) → LTR (1-10) 변환 함수
function convertNtrpToLtr(ntrp) {
  if (ntrp === undefined || ntrp === null) return null;

  // 문자열이면 숫자로 변환
  const numericNtrp = typeof ntrp === 'string' ? parseFloat(ntrp) : ntrp;

  if (isNaN(numericNtrp)) return 5; // 기본값

  // NTRP → LTR 매핑 테이블
  if (numericNtrp <= 1.0) return 1;
  if (numericNtrp <= 1.5) return 2;
  if (numericNtrp <= 2.0) return 3;
  if (numericNtrp <= 2.5) return 4;
  if (numericNtrp <= 3.0) return 5;
  if (numericNtrp <= 3.5) return 6;
  if (numericNtrp <= 4.0) return 7;
  if (numericNtrp <= 4.5) return 8;
  if (numericNtrp <= 5.0) return 9;
  return 10; // 5.5+
}

// 🎯 사용자 마이그레이션
async function migrateUsers(isDryRun) {
  console.log('\n📊 [USERS] 사용자 마이그레이션 시작...');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let migrated = 0;
  let skipped = 0;
  const batchSize = 500;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // ntrpLevel → ltrLevel
    if (data.ntrpLevel !== undefined && data.ltrLevel === undefined) {
      updates.ltrLevel = convertNtrpToLtr(data.ntrpLevel);
      needsUpdate = true;
    }

    // skillLevel.ntrp → skillLevel.ltr
    if (data.skillLevel?.ntrp !== undefined && data.skillLevel?.ltr === undefined) {
      updates['skillLevel.ltr'] = convertNtrpToLtr(data.skillLevel.ntrp);
      needsUpdate = true;
    }

    // profile.ntrpLevel → profile.ltrLevel
    if (data.profile?.ntrpLevel !== undefined && data.profile?.ltrLevel === undefined) {
      updates['profile.ltrLevel'] = convertNtrpToLtr(data.profile.ntrpLevel);
      needsUpdate = true;
    }

    if (needsUpdate) {
      if (isDryRun) {
        console.log(`  [DRY-RUN] User ${doc.id}: ${JSON.stringify(updates)}`);
      } else {
        batch.update(doc.ref, updates);
        batchCount++;

        if (batchCount >= batchSize) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
          console.log(`  ✅ Committed batch, ${migrated + batchCount} users migrated so far`);
        }
      }
      migrated++;
    } else {
      skipped++;
    }
  }

  // 남은 배치 커밋
  if (!isDryRun && batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ [USERS] 마이그레이션 완료: ${migrated}개 수정, ${skipped}개 스킵`);
  return { migrated, skipped };
}

// 🎯 매치/이벤트 마이그레이션
async function migrateMatches(isDryRun) {
  console.log('\n🎾 [MATCHES] 매치 마이그레이션 시작...');

  // lightning_matches와 events 컬렉션 모두 처리
  const collections = ['lightning_matches', 'events'];
  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const collectionName of collections) {
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.get();

    let migrated = 0;
    let skipped = 0;
    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates = {};
      let needsUpdate = false;

      // minNtrp → minLtr
      if (data.minNtrp !== undefined && data.minLtr === undefined) {
        updates.minLtr = convertNtrpToLtr(data.minNtrp);
        needsUpdate = true;
      }

      // maxNtrp → maxLtr
      if (data.maxNtrp !== undefined && data.maxLtr === undefined) {
        updates.maxLtr = convertNtrpToLtr(data.maxNtrp);
        needsUpdate = true;
      }

      // hostNtrp → hostLtr
      if (data.hostNtrp !== undefined && data.hostLtr === undefined) {
        updates.hostLtr = convertNtrpToLtr(data.hostNtrp);
        needsUpdate = true;
      }

      // partnerNtrp → partnerLtr
      if (data.partnerNtrp !== undefined && data.partnerLtr === undefined) {
        updates.partnerLtr = convertNtrpToLtr(data.partnerNtrp);
        needsUpdate = true;
      }

      // hostNtrpLevel → hostLtrLevel
      if (data.hostNtrpLevel !== undefined && data.hostLtrLevel === undefined) {
        updates.hostLtrLevel = convertNtrpToLtr(data.hostNtrpLevel);
        needsUpdate = true;
      }

      // ntrpLevel (string) → ltrLevel
      if (data.ntrpLevel !== undefined && data.ltrLevel === undefined) {
        updates.ltrLevel = convertNtrpToLtr(data.ntrpLevel);
        needsUpdate = true;
      }

      if (needsUpdate) {
        if (isDryRun) {
          console.log(`  [DRY-RUN] ${collectionName}/${doc.id}: ${JSON.stringify(updates)}`);
        } else {
          batch.update(doc.ref, updates);
          batchCount++;

          if (batchCount >= batchSize) {
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
        migrated++;
      } else {
        skipped++;
      }
    }

    // 남은 배치 커밋
    if (!isDryRun && batchCount > 0) {
      await batch.commit();
    }

    console.log(`  ✅ [${collectionName}] ${migrated}개 수정, ${skipped}개 스킵`);
    totalMigrated += migrated;
    totalSkipped += skipped;
  }

  console.log(`✅ [MATCHES] 마이그레이션 완료: ${totalMigrated}개 수정, ${totalSkipped}개 스킵`);
  return { migrated: totalMigrated, skipped: totalSkipped };
}

// 🎯 파트너 초대장 마이그레이션
async function migratePartnerInvitations(isDryRun) {
  console.log('\n📨 [INVITATIONS] 파트너 초대장 마이그레이션 시작...');

  const invitationsRef = db.collection('partner_invitations');
  const snapshot = await invitationsRef.get();

  let migrated = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchCount = 0;
  const batchSize = 500;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // inviterNtrp → inviterLtr
    if (data.inviterNtrp !== undefined && data.inviterLtr === undefined) {
      updates.inviterLtr = convertNtrpToLtr(data.inviterNtrp);
      needsUpdate = true;
    }

    // combinedNtrp → combinedLtr
    if (data.combinedNtrp !== undefined && data.combinedLtr === undefined) {
      updates.combinedLtr = convertNtrpToLtr(data.combinedNtrp / 2) * 2; // 합산값이므로 /2 변환 후 *2
      needsUpdate = true;
    }

    if (needsUpdate) {
      if (isDryRun) {
        console.log(`  [DRY-RUN] partner_invitations/${doc.id}: ${JSON.stringify(updates)}`);
      } else {
        batch.update(doc.ref, updates);
        batchCount++;

        if (batchCount >= batchSize) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
      migrated++;
    } else {
      skipped++;
    }
  }

  // 남은 배치 커밋
  if (!isDryRun && batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ [INVITATIONS] 마이그레이션 완료: ${migrated}개 수정, ${skipped}개 스킵`);
  return { migrated, skipped };
}

// 🎯 클럽 이벤트 마이그레이션
async function migrateClubEvents(isDryRun) {
  console.log('\n🏟️ [CLUB_EVENTS] 클럽 이벤트 마이그레이션 시작...');

  const eventsRef = db.collection('club_events');
  const snapshot = await eventsRef.get();

  let migrated = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // minNtrp → minLtr
    if (data.minNtrp !== undefined && data.minLtr === undefined) {
      updates.minLtr = convertNtrpToLtr(data.minNtrp);
      needsUpdate = true;
    }

    // maxNtrp → maxLtr
    if (data.maxNtrp !== undefined && data.maxLtr === undefined) {
      updates.maxLtr = convertNtrpToLtr(data.maxNtrp);
      needsUpdate = true;
    }

    if (needsUpdate) {
      if (isDryRun) {
        console.log(`  [DRY-RUN] club_events/${doc.id}: ${JSON.stringify(updates)}`);
      } else {
        batch.update(doc.ref, updates);
        batchCount++;
      }
      migrated++;
    } else {
      skipped++;
    }
  }

  // 남은 배치 커밋
  if (!isDryRun && batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ [CLUB_EVENTS] 마이그레이션 완료: ${migrated}개 수정, ${skipped}개 스킵`);
  return { migrated, skipped };
}

// 🚀 메인 실행
async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎾 Lightning Tennis: NTRP → LTR Firestore 마이그레이션');
  console.log('═══════════════════════════════════════════════════════════');

  if (isDryRun) {
    console.log('⚠️  DRY-RUN 모드: 실제 변경 없이 마이그레이션 대상만 확인합니다.');
  } else {
    console.log('🔥 LIVE 모드: 실제 Firestore 데이터를 수정합니다!');
    console.log('⚠️  5초 후 시작합니다... (Ctrl+C로 취소)');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\n시작 시간:', new Date().toISOString());

  try {
    const results = {
      users: await migrateUsers(isDryRun),
      matches: await migrateMatches(isDryRun),
      invitations: await migratePartnerInvitations(isDryRun),
      clubEvents: await migrateClubEvents(isDryRun),
    };

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 마이그레이션 결과 요약');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Users:       ${results.users.migrated}개 수정, ${results.users.skipped}개 스킵`);
    console.log(
      `  Matches:     ${results.matches.migrated}개 수정, ${results.matches.skipped}개 스킵`
    );
    console.log(
      `  Invitations: ${results.invitations.migrated}개 수정, ${results.invitations.skipped}개 스킵`
    );
    console.log(
      `  Club Events: ${results.clubEvents.migrated}개 수정, ${results.clubEvents.skipped}개 스킵`
    );
    console.log('═══════════════════════════════════════════════════════════');

    const totalMigrated =
      results.users.migrated +
      results.matches.migrated +
      results.invitations.migrated +
      results.clubEvents.migrated;

    if (isDryRun) {
      console.log(`\n✅ DRY-RUN 완료: 총 ${totalMigrated}개 문서가 마이그레이션 대상입니다.`);
      console.log('   실제 마이그레이션을 실행하려면 --dry-run 플래그 없이 실행하세요.');
    } else {
      console.log(`\n🎉 마이그레이션 완료: 총 ${totalMigrated}개 문서가 업데이트되었습니다!`);
    }
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }

  console.log('\n완료 시간:', new Date().toISOString());
  process.exit(0);
}

main();
