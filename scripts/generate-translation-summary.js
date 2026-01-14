const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const pt = JSON.parse(fs.readFileSync('src/locales/pt.json', 'utf8'));

function countKeys(obj, prefix = '') {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key], `${prefix}${key}.`);
    } else {
      count++;
    }
  }
  return count;
}

function findUntranslated(enObj, ptObj, path = '') {
  let count = 0;
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      count += findUntranslated(enObj[key], ptObj[key] || {}, currentPath);
    } else if (enObj[key] === ptObj[key]) {
      count++;
    }
  }
  return count;
}

const topSections = [
  'services',
  'duesManagement',
  'clubLeaguesTournaments',
  'leagueDetail',
  'clubTournamentManagement',
];

console.log('='.repeat(70));
console.log('📊 ROUND 4 - PORTUGUESE TRANSLATION SUMMARY');
console.log('='.repeat(70));
console.log('\n🎯 TOP 5 SECTIONS ANALYSIS:\n');

let totalKeys = 0;
let totalUntranslated = 0;

topSections.forEach(section => {
  if (en[section] && pt[section]) {
    const keys = countKeys(en[section]);
    const untranslated = findUntranslated(en[section], pt[section], section);
    const translated = keys - untranslated;
    const percentage = ((translated / keys) * 100).toFixed(1);

    console.log(`📁 ${section}:`);
    console.log(`   Total keys: ${keys}`);
    console.log(`   Translated: ${translated} (${percentage}%)`);
    console.log(`   Remaining: ${untranslated}`);
    console.log('');

    totalKeys += keys;
    totalUntranslated += untranslated;
  }
});

const totalTranslated = totalKeys - totalUntranslated;
const overallPercentage = ((totalTranslated / totalKeys) * 100).toFixed(1);

console.log('='.repeat(70));
console.log('🏆 OVERALL PROGRESS (TOP 5 SECTIONS):');
console.log('='.repeat(70));
console.log(`Total keys: ${totalKeys}`);
console.log(`Translated: ${totalTranslated} (${overallPercentage}%)`);
console.log(`Remaining: ${totalUntranslated}`);
console.log('');

// Full file stats
const allEnKeys = countKeys(en);
const allUntranslated = findUntranslated(en, pt);
const allTranslated = allEnKeys - allUntranslated;
const allPercentage = ((allTranslated / allEnKeys) * 100).toFixed(1);

console.log('='.repeat(70));
console.log('🌍 ENTIRE FILE STATISTICS:');
console.log('='.repeat(70));
console.log(`Total keys: ${allEnKeys}`);
console.log(`Translated: ${allTranslated} (${allPercentage}%)`);
console.log(`Remaining: ${allUntranslated}`);
console.log('');

// Round 4 translation count
const startCount = 1542; // From user's request
const endCount = totalUntranslated;
const translatedThisRound = startCount - endCount;

console.log('='.repeat(70));
console.log('✨ ROUND 4 ACHIEVEMENTS:');
console.log('='.repeat(70));
console.log(`Keys translated this round: ${translatedThisRound}`);
console.log(`Starting count (TOP 5): ${startCount}`);
console.log(`Ending count (TOP 5): ${endCount}`);
console.log(`Reduction: ${((translatedThisRound / startCount) * 100).toFixed(1)}%`);
console.log('');

// Note about intentionally untranslated keys
console.log('='.repeat(70));
console.log('📝 NOTE:');
console.log('='.repeat(70));
console.log('Some keys remain "untranslated" because they are intentionally the same');
console.log('in both English and Portuguese (e.g., "Status", "OK", "Playoffs").');
console.log('These are common international terms used as-is in Brazilian Portuguese.');
console.log('='.repeat(70));
