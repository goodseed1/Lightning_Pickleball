/**
 * 🔄 Gender Migration Script
 *
 * Migrates users with 'other' or 'prefer_not_to_say' gender to 'male' or 'female'
 * based on name detection algorithm.
 *
 * ⚠️ 이미 'male' 또는 'female'로 설정된 사용자는 건너뜁니다.
 *
 * Usage:
 *   node scripts/migrate-gender.js [--dry-run] [--user-id=<userId>] [--backup]
 *
 * Options:
 *   --dry-run       Preview changes without updating database
 *   --user-id=...   Migrate only specific user (for testing)
 *   --backup        Create backup before migration
 *
 * Examples:
 *   node scripts/migrate-gender.js --dry-run
 *   node scripts/migrate-gender.js --user-id=ABC123 --dry-run
 *   node scripts/migrate-gender.js --backup
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Parse command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const doBackup = args.includes('--backup');
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const targetUserId = userIdArg ? userIdArg.split('=')[1] : null;

// ===== NAME-BASED GENDER DETECTION =====

// Korean male name endings (common suffixes)
const KOREAN_MALE_ENDINGS = [
  '준',
  '민',
  '현',
  '우',
  '석',
  '철',
  '호',
  '진',
  '훈',
  '수',
  '원',
  '혁',
  '규',
  '영',
  '성',
  '태',
  '동',
  '용',
  '근',
  '범',
  '기',
  '환',
  '섭',
  '열',
  '국',
  '일',
  '권',
  '상',
  '재',
  '길',
  '완',
  '남',
  '욱',
  '찬',
  '윤',
  '모',
  '건',
  '산',
  '한',
];

// Korean female name endings (common suffixes)
const KOREAN_FEMALE_ENDINGS = [
  '희',
  '영',
  '정',
  '미',
  '은',
  '혜',
  '지',
  '연',
  '아',
  '서',
  '윤',
  '진',
  '수',
  '현',
  '하',
  '린',
  '나',
  '빈',
  '경',
  '주',
  '선',
  '민',
  '유',
  '소',
  '시',
  '다',
  '예',
  '채',
  '원',
  '율',
  '인',
  '담',
  '슬',
  '라',
  '름',
  '솔',
  '봄',
  '별',
  '리',
  '온',
];

// English male names
const ENGLISH_MALE_NAMES = [
  'james',
  'john',
  'robert',
  'michael',
  'william',
  'david',
  'richard',
  'thomas',
  'christopher',
  'charles',
  'daniel',
  'matthew',
  'anthony',
  'steven',
  'paul',
  'andrew',
  'joshua',
  'kenneth',
  'kevin',
  'brian',
  'george',
  'timothy',
  'ronald',
  'edward',
  'jason',
  'jeffrey',
  'ryan',
  'gary',
  'nicholas',
  'eric',
  'jonathan',
  'stephen',
  'larry',
  'justin',
  'brandon',
  'benjamin',
  'samuel',
  'raymond',
  'gregory',
  'frank',
  'patrick',
  'jack',
  'dennis',
  'jerry',
  'tyler',
  'aaron',
  'adam',
  'nathan',
  'henry',
  'douglas',
  'zachary',
  'peter',
  'kyle',
  'noah',
  'steve',
  'isaac',
  'bruce',
  'albert',
  'bobby',
  'johnny',
  'bradley',
  'joe',
  'tom',
  'mike',
  'chris',
  'mark',
  'scott',
  'alex',
  'jake',
  'nick',
  'tony',
  'luke',
  'sean',
  'ian',
  'vincent',
  'ethan',
  'mason',
  'tim',
  'oscar',
  'kwangyeol',
  'bae',
  'lee',
  'kim',
  'park',
  'choi',
  'carl',
  'walter',
  'arthur',
  'fred',
  'ralph',
  'roy',
  'eugene',
  'russell',
  'louis',
  'philip',
  'harry',
  'wayne',
  'billy',
  'howard',
  'carl',
  'gerald',
];

// English female names
const ENGLISH_FEMALE_NAMES = [
  'mary',
  'patricia',
  'jennifer',
  'linda',
  'barbara',
  'elizabeth',
  'jessica',
  'sarah',
  'karen',
  'lisa',
  'nancy',
  'betty',
  'margaret',
  'ashley',
  'kimberly',
  'emily',
  'donna',
  'michelle',
  'dorothy',
  'amanda',
  'melissa',
  'deborah',
  'stephanie',
  'rebecca',
  'sharon',
  'cynthia',
  'kathleen',
  'amy',
  'angela',
  'anna',
  'brenda',
  'pamela',
  'emma',
  'nicole',
  'helen',
  'samantha',
  'katherine',
  'christine',
  'rachel',
  'carolyn',
  'janet',
  'catherine',
  'maria',
  'heather',
  'julie',
  'olivia',
  'victoria',
  'kelly',
  'lauren',
  'christina',
  'megan',
  'andrea',
  'hannah',
  'martha',
  'gloria',
  'teresa',
  'sara',
  'madison',
  'sophia',
  'grace',
  'isabella',
  'charlotte',
  'marie',
  'jenny',
  'kate',
  'sue',
  'anne',
  'claire',
  'natalie',
  'chloe',
  'zoe',
  'judy',
  'judith',
  'joyce',
  'diane',
  'alice',
  'virginia',
  'ruth',
  'frances',
  'beverly',
  'denise',
  'tammy',
  'irene',
  'jane',
  'lori',
  'cheryl',
  'mildred',
  'katie',
  'hazel',
  'amber',
  'eva',
  'debra',
];

/**
 * Detect gender from Korean name
 */
function detectKoreanGender(name) {
  const koreanOnly = name.replace(/[^\uAC00-\uD7AF]/g, '');
  if (koreanOnly.length === 0) return null;

  const lastChar = koreanOnly.charAt(koreanOnly.length - 1);

  if (KOREAN_MALE_ENDINGS.includes(lastChar)) return 'male';
  if (KOREAN_FEMALE_ENDINGS.includes(lastChar)) return 'female';

  return null; // Ambiguous
}

/**
 * Detect gender from English name
 */
function detectEnglishGender(name) {
  const firstName = name.split(/[\s\-]/)[0].toLowerCase();

  if (ENGLISH_MALE_NAMES.includes(firstName)) return 'male';
  if (ENGLISH_FEMALE_NAMES.includes(firstName)) return 'female';

  return null; // Unknown
}

/**
 * Detect gender from display name
 */
function detectGenderFromName(displayName) {
  if (!displayName || displayName.trim().length === 0) return null;

  const name = displayName.trim();

  // 1. Check if Korean name (contains Hangul)
  if (/[\uAC00-\uD7AF]/.test(name)) {
    return detectKoreanGender(name);
  }

  // 2. Check English name dictionary
  return detectEnglishGender(name);
}

/**
 * Create backup of user gender data
 */
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  const backupFile = path.join(backupDir, `gender-backup-${timestamp}.json`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('\n📦 Creating backup...');

  const usersSnapshot = await db.collection('users').get();
  const backup = [];

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    backup.push({
      uid: doc.id,
      displayName: data.displayName,
      gender: data.gender,
      profileGender: data.profile?.gender,
    });
  });

  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`✅ Backup saved to: ${backupFile}`);
  console.log(`   Total users: ${backup.length}\n`);

  return backupFile;
}

/**
 * Migrate gender for a single user
 */
async function migrateUserGender(userId, userData) {
  const currentGender = userData.profile?.gender || userData.gender;
  const displayName = userData.displayName || userData.profile?.nickname || userData.nickname;

  // Skip if already valid gender (case-insensitive check)
  const normalizedGender = currentGender?.toLowerCase();
  if (normalizedGender === 'male' || normalizedGender === 'female') {
    return { status: 'skipped', reason: 'already_valid', displayName, currentGender };
  }

  // Detect gender from name
  const detectedGender = detectGenderFromName(displayName);

  if (!detectedGender) {
    return {
      status: 'manual_review',
      displayName,
      currentGender,
      reason: 'Unable to detect gender from name',
    };
  }

  // Update BOTH locations for consistency
  if (!isDryRun) {
    await db
      .collection('users')
      .doc(userId)
      .set(
        {
          gender: detectedGender,
          profile: { gender: detectedGender },
        },
        { merge: true }
      );
  }

  return {
    status: 'migrated',
    displayName,
    from: currentGender,
    to: detectedGender,
  };
}

/**
 * Main migration function
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       🔄 Gender Migration Script for Lightning Tennis      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Create backup if requested
  if (doBackup && !isDryRun) {
    await createBackup();
  }

  // Get users to process
  let usersSnapshot;
  if (targetUserId) {
    console.log(`🎯 Processing single user: ${targetUserId}\n`);
    const userDoc = await db.collection('users').doc(targetUserId).get();
    if (!userDoc.exists) {
      console.log(`❌ User ${targetUserId} not found!`);
      process.exit(1);
    }
    usersSnapshot = { docs: [userDoc] };
  } else {
    console.log('📋 Fetching all users...\n');
    usersSnapshot = await db.collection('users').get();
  }

  const stats = {
    total: 0,
    skipped: 0,
    migrated: 0,
    manualReview: [],
  };

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const doc of usersSnapshot.docs) {
    const userId = doc.id;
    const userData = doc.data();
    stats.total++;

    const result = await migrateUserGender(userId, userData);

    switch (result.status) {
      case 'skipped':
        stats.skipped++;
        console.log(`⏭️  ${result.displayName || userId}: Already ${result.currentGender}`);
        break;

      case 'migrated':
        stats.migrated++;
        console.log(
          `✅ ${result.displayName || userId}: ${result.from || 'undefined'} → ${result.to}`
        );
        break;

      case 'manual_review':
        stats.manualReview.push({
          userId,
          displayName: result.displayName,
          currentGender: result.currentGender,
          reason: result.reason,
        });
        console.log(`⚠️  ${result.displayName || userId}: MANUAL REVIEW NEEDED`);
        break;
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Migration Summary\n');
  console.log(`   Total users:     ${stats.total}`);
  console.log(`   Skipped:         ${stats.skipped} (already male/female)`);
  console.log(`   Migrated:        ${stats.migrated}`);
  console.log(`   Manual review:   ${stats.manualReview.length}`);

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN - No changes were made. Remove --dry-run to apply.');
  }

  // Save manual review cases
  if (stats.manualReview.length > 0) {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const reviewFile = path.join(backupDir, 'gender-manual-review.json');
    fs.writeFileSync(reviewFile, JSON.stringify(stats.manualReview, null, 2));
    console.log(`\n📝 Manual review cases saved to: ${reviewFile}`);
    console.log('\n   Users requiring manual review:');
    stats.manualReview.forEach(u => {
      console.log(`   - ${u.displayName || u.userId} (current: ${u.currentGender})`);
    });
  }

  console.log('\n✨ Migration complete!\n');
}

// Run
main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
