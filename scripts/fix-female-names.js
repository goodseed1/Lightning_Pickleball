/**
 * 🔧 Fix Female Names Script
 *
 * 성별이 female인데 남자 이름으로 되어 있는 사용자들의 이름을 여자 이름으로 변경
 *
 * Usage:
 *   node scripts/fix-female-names.js --dry-run    # 미리보기
 *   node scripts/fix-female-names.js              # 실제 실행
 */

const admin = require('firebase-admin');
const path = require('path');

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

// Male first names (영어)
const MALE_FIRST_NAMES = [
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
  'gerald',
];

// Female first names (영어)
const FEMALE_FIRST_NAMES = [
  'emma',
  'olivia',
  'sophia',
  'isabella',
  'mia',
  'charlotte',
  'amelia',
  'harper',
  'evelyn',
  'abigail',
  'emily',
  'elizabeth',
  'sofia',
  'avery',
  'ella',
  'scarlett',
  'grace',
  'lily',
  'chloe',
  'victoria',
  'aria',
  'madison',
  'layla',
  'penelope',
  'riley',
  'zoey',
  'nora',
  'lily',
  'eleanor',
  'hannah',
  'lillian',
  'addison',
  'aubrey',
  'ellie',
  'stella',
  'natalie',
  'zoe',
  'leah',
  'hazel',
  'violet',
  'aurora',
  'savannah',
  'audrey',
  'brooklyn',
  'bella',
  'claire',
  'skylar',
  'lucy',
  'paisley',
  'everly',
  'anna',
  'caroline',
  'genesis',
  'aaliyah',
  'kennedy',
  'kinsley',
  'allison',
  'maya',
  'sarah',
  'madelyn',
  'adeline',
  'alexa',
  'ariana',
  'elena',
  'gabriella',
  'naomi',
  'alice',
  'sadie',
  'hailey',
  'eva',
  'emilia',
  'autumn',
  'quinn',
  'nevaeh',
  'ivy',
  'sophie',
  'jessica',
  'ashley',
  'jennifer',
  'amanda',
  'samantha',
  'katherine',
  'christine',
  'rachel',
  'heather',
  'julie',
  'michelle',
  'nicole',
  'stephanie',
  'rebecca',
  'kelly',
  'lauren',
  'megan',
  'andrea',
  'natasha',
];

// Last names (성) - 동일하게 사용
const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Davis',
  'Miller',
  'Wilson',
  'Moore',
  'Taylor',
  'Anderson',
  'Thomas',
  'Jackson',
  'White',
  'Harris',
  'Martin',
  'Thompson',
  'Garcia',
  'Martinez',
  'Robinson',
  'Clark',
  'Rodriguez',
  'Lewis',
  'Lee',
  'Walker',
  'Hall',
  'Allen',
  'Young',
  'King',
  'Wright',
  'Scott',
  'Green',
  'Baker',
  'Adams',
  'Nelson',
  'Hill',
  'Ramirez',
  'Campbell',
  'Mitchell',
  'Roberts',
];

/**
 * Check if name is a male name
 */
function isMaleName(displayName) {
  if (!displayName) return false;
  const firstName = displayName.split(/[\s\-]/)[0].toLowerCase();
  return MALE_FIRST_NAMES.includes(firstName);
}

/**
 * Generate a random female name
 */
function generateFemaleName() {
  const firstName = FEMALE_FIRST_NAMES[Math.floor(Math.random() * FEMALE_FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  // Capitalize first letter
  const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  return `${capitalizedFirstName} ${lastName}`;
}

/**
 * Main function
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    🔧 Fix Female Names (Male → Female Name Conversion)     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Get all users
  const usersSnapshot = await db.collection('users').get();
  console.log(`📋 Total users: ${usersSnapshot.size}\n`);

  const stats = {
    total: 0,
    femaleWithMaleName: [],
    updated: 0,
    skipped: 0,
  };

  // Find females with male names
  for (const doc of usersSnapshot.docs) {
    const userId = doc.id;
    const userData = doc.data();
    stats.total++;

    const gender = userData.gender || userData.profile?.gender;
    const displayName = userData.displayName || userData.profile?.nickname;

    // Check if female with male name
    if (gender?.toLowerCase() === 'female' && isMaleName(displayName)) {
      const newName = generateFemaleName();
      stats.femaleWithMaleName.push({
        userId,
        oldName: displayName,
        newName,
        gender,
      });
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`🔍 Found ${stats.femaleWithMaleName.length} females with male names:\n`);

  // Process each user
  for (const user of stats.femaleWithMaleName) {
    console.log(`   👩 ${user.oldName} → ${user.newName}`);

    if (!isDryRun) {
      await db.collection('users').doc(user.userId).update({
        displayName: user.newName,
        'profile.nickname': user.newName,
      });
      stats.updated++;
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Summary\n');
  console.log(`   Total users:           ${stats.total}`);
  console.log(`   Females with male name: ${stats.femaleWithMaleName.length}`);

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN - No changes were made. Remove --dry-run to apply.');
  } else {
    console.log(`   Updated:               ${stats.updated}`);
  }

  console.log('\n✨ Complete!\n');
}

// Run
main().catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
