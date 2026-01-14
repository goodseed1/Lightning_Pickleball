const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize with correct project
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'lightning-pickleball-community',
  });
}

const db = admin.firestore();

// ELO to LPR conversion (same as ltrUtils.ts)
function convertEloToLtr(elo) {
  if (!elo || elo < 800) return 1;
  if (elo >= 1800) return 10;
  return Math.min(10, Math.max(1, Math.floor((elo - 800) / 100) + 1));
}

async function getUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  const users = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const singlesElo = data.eloRatings?.singles?.current;
    const doublesElo = data.eloRatings?.doubles?.current;
    const mixedElo = data.eloRatings?.mixed?.current;

    users.push({
      nickname: data.profile?.nickname || data.displayName || data.name || 'N/A',
      email: data.email || 'N/A',
      gender: data.profile?.gender || data.gender || 'N/A',
      singlesLtr: singlesElo ? convertEloToLtr(singlesElo) : null,
      doublesLtr: doublesElo ? convertEloToLtr(doublesElo) : null,
      mixedLtr: mixedElo ? convertEloToLtr(mixedElo) : null,
      singlesElo: singlesElo || null,
      doublesElo: doublesElo || null,
      mixedElo: mixedElo || null,
    });
  });

  console.log('\n📊 사용자 목록 (닉네임, 이메일, 성별, 게임타입별 LPR)\n');
  console.log('='.repeat(130));
  console.log(
    '닉네임'.padEnd(14) +
      '이메일'.padEnd(32) +
      '성별'.padEnd(8) +
      'Singles'.padEnd(18) +
      'Doubles'.padEnd(18) +
      'Mixed'
  );
  console.log('='.repeat(130));

  users.forEach(u => {
    const singlesInfo = u.singlesLtr ? 'LPR ' + u.singlesLtr + ' (' + u.singlesElo + ')' : '-';
    const doublesInfo = u.doublesLtr ? 'LPR ' + u.doublesLtr + ' (' + u.doublesElo + ')' : '-';
    const mixedInfo = u.mixedLtr ? 'LPR ' + u.mixedLtr + ' (' + u.mixedElo + ')' : '-';

    console.log(
      u.nickname.substring(0, 12).padEnd(14) +
        u.email.substring(0, 30).padEnd(32) +
        u.gender.padEnd(8) +
        singlesInfo.padEnd(18) +
        doublesInfo.padEnd(18) +
        mixedInfo
    );
  });

  console.log('\n총 사용자 수:', users.length);
  process.exit(0);
}

getUsers().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
