const de = require('../src/locales/de.json');
const en = require('../src/locales/en.json');

const sections = [
  'clubLeaguesTournaments',
  'createEvent',
  'recordScore',
  'aiMatching',
  'duesManagement',
];

let totalKeys = 0;
let translatedKeys = 0;
let identicalAcceptable = 0;
let emptyStrings = 0;
const missing = [];

// Terms that are acceptable to be identical in DE and EN
const acceptableIdentical = [
  'Status',
  'Format',
  'Partner',
  'OK',
  'Mixed',
  'Bank',
  'Venmo',
  'Tiebreak',
  'Walkover',
  'Volley',
  'Mental',
  'Global',
  'Playoffs',
  'Match',
  'Lightning Match',
  'Lightning Meetup',
  // Language names (should be in their native language)
  '한국어',
  'English',
  '中文',
  '日本語',
  'Español',
  'Français',
  // Tiebreak with placeholder
  'Tiebreak ({{placeholder}})',
  // Names (proper nouns)
  'Junsu Kim',
  'Seoyeon Lee',
  'Minjae Park',
];

function checkKeys(obj, enObj, path = '', sectionName = '') {
  for (const key in enObj) {
    const currentPath = path ? path + '.' + key : key;
    const fullPath = sectionName ? sectionName + '.' + currentPath : currentPath;
    const deValue = obj && obj[key];
    const enValue = enObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      checkKeys(deValue || {}, enValue, currentPath, sectionName);
    } else if (typeof enValue === 'string') {
      totalKeys++;

      if (deValue === undefined || deValue === null) {
        missing.push({ path: fullPath, en: enValue, de: 'UNDEFINED' });
      } else if (deValue === '' && enValue === '') {
        translatedKeys++;
        emptyStrings++;
      } else if (deValue === '' && enValue !== '') {
        missing.push({ path: fullPath, en: enValue, de: 'EMPTY' });
      } else if (deValue === enValue) {
        if (acceptableIdentical.includes(enValue)) {
          translatedKeys++;
          identicalAcceptable++;
        } else {
          missing.push({
            path: fullPath,
            en: enValue,
            de: deValue,
            reason: 'Not in acceptable list',
          });
        }
      } else {
        translatedKeys++;
      }
    }
  }
}

sections.forEach(section => {
  checkKeys(de[section] || {}, en[section] || {}, '', section);
});

const completeness = totalKeys > 0 ? ((translatedKeys / totalKeys) * 100).toFixed(1) : 0;

console.log('='.repeat(80));
console.log('  🇩🇪 GERMAN TRANSLATION COMPLETENESS REPORT - FINAL');
console.log('  Target Sections: clubLeaguesTournaments, createEvent, recordScore,');
console.log('                   aiMatching, duesManagement');
console.log('='.repeat(80));

console.log('\n📊 DETAILED STATISTICS:');
console.log('-'.repeat(80));
console.log('  Total translation keys:                      ' + totalKeys);
console.log('  Successfully translated:                     ' + translatedKeys);
console.log(
  '    • Fully translated to German:              ' +
    (translatedKeys - identicalAcceptable - emptyStrings)
);
console.log('    • Universal terms (DE=EN acceptable):      ' + identicalAcceptable);
console.log('    • Empty strings (DE="" = EN=""):           ' + emptyStrings);
console.log('  Missing or problematic:                      ' + missing.length);
console.log('-'.repeat(80));
console.log('  COMPLETION RATE:                             ' + completeness + '%');
console.log('='.repeat(80));

if (missing.length === 0) {
  console.log('\n🎉🎊 CONGRATULATIONS! 100% TRANSLATION COMPLETE! 🎊🎉');
  console.log('\n✨ All ' + totalKeys + ' keys in the target sections are properly translated!');
  console.log('\n📝 Translation breakdown:');
  console.log(
    '   • ' +
      (translatedKeys - identicalAcceptable - emptyStrings) +
      ' keys fully translated to German'
  );
  console.log(
    '   • ' + identicalAcceptable + ' universal terms (Tiebreak, Status, language names, etc.)'
  );
  console.log('   • ' + emptyStrings + ' intentionally empty strings');
  console.log('\n🏆 EXCELLENT WORK! The German localization is production-ready!');
} else {
  console.log('\n⚠️  Found ' + missing.length + ' issue(s) that need attention:\n');
  missing.forEach((item, index) => {
    console.log('[' + (index + 1) + '] ' + item.path);
    console.log('    EN: "' + item.en + '"');
    console.log('    DE: "' + (item.de || 'MISSING') + '"');
    if (item.reason) console.log('    Reason: ' + item.reason);
    console.log('');
  });
  console.log('📊 Progress: ' + completeness + '% complete');
}

console.log('\n' + '='.repeat(80));
