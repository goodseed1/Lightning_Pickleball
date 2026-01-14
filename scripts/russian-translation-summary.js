/**
 * Russian Translation Summary - Round 5 Progress Report
 */
const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const ruPath = path.join(__dirname, '../src/locales/ru.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

function findUntranslatedKeys(enObj, ruObj) {
  const untranslated = {};
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      const nested = findUntranslatedKeys(enObj[key], ruObj[key] || {});
      if (Object.keys(nested).length > 0) {
        untranslated[key] = nested;
      }
    } else {
      if (!ruObj[key] || ruObj[key] === enObj[key]) {
        untranslated[key] = enObj[key];
      }
    }
  }
  return untranslated;
}

const totalEnKeys = countKeys(en);
const untranslated = findUntranslatedKeys(en, ru);
const untranslatedCount = countKeys(untranslated);
const translatedCount = totalEnKeys - untranslatedCount;
const progressPercent = ((translatedCount / totalEnKeys) * 100).toFixed(1);

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║   🇷🇺 RUSSIAN TRANSLATION PROGRESS - ROUND 5          ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

console.log('📊 OVERALL STATISTICS:');
console.log('─────────────────────────────────────────────────────────');
console.log(`Total Keys in EN:        ${totalEnKeys.toLocaleString()}`);
console.log(`✅ Translated:            ${translatedCount.toLocaleString()} (${progressPercent}%)`);
console.log(`❌ Remaining:             ${untranslatedCount.toLocaleString()}`);
console.log();

console.log('📈 ROUND 5 ACHIEVEMENTS:');
console.log('─────────────────────────────────────────────────────────');
console.log(
  'Batch 1: 307 keys (services, clubTournamentManagement, leagueDetail, duesManagement, profileSettings)'
);
console.log(
  'Batch 2: 216 keys (badgeGallery, emailLogin, clubLeaguesTournaments, createEvent, clubDuesManagement)'
);
console.log(
  'Batch 3: 181 keys (aiMatching, meetupDetail, editProfile, createMeetup, performanceDashboard)'
);
console.log('─────────────────────────────────────────────────────────');
console.log(`TOTAL ROUND 5: 704 keys translated! 🎉`);
console.log();

console.log('🎯 TOP REMAINING SECTIONS TO TRANSLATE:');
console.log('─────────────────────────────────────────────────────────');

const sections = [];
for (const section in untranslated) {
  const count = countKeys(untranslated[section]);
  sections.push({ section, count });
}

sections.sort((a, b) => b.count - a.count);
sections.slice(0, 15).forEach(({ section, count }, index) => {
  console.log(`${String(index + 1).padStart(2)}. ${section.padEnd(30)} ${count} keys`);
});

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║   🏆 EXCELLENT PROGRESS! KEEP GOING!                  ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');
