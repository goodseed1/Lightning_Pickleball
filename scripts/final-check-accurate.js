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
let identicalToEnglish = 0;
let emptyStrings = 0;
let trulyMissing = 0;

const missing = [];

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

      // Check if German value exists
      if (deValue === undefined || deValue === null) {
        trulyMissing++;
        missing.push({ path: fullPath, en: enValue, reason: 'UNDEFINED' });
      } else if (deValue === '') {
        // Empty string - this is OK if English is also empty
        if (enValue === '') {
          translatedKeys++;
          emptyStrings++;
        } else {
          missing.push({ path: fullPath, en: enValue, reason: 'EMPTY STRING (but EN has value)' });
        }
      } else if (deValue === enValue) {
        // Identical to English - check if it's acceptable
        const acceptable = [
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
        ];
        if (acceptable.includes(enValue)) {
          translatedKeys++;
          identicalToEnglish++;
        } else {
          missing.push({
            path: fullPath,
            en: enValue,
            reason: 'IDENTICAL TO ENGLISH (not acceptable)',
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
console.log('  FINAL GERMAN TRANSLATION COMPLETENESS REPORT');
console.log('  Sections: clubLeaguesTournaments, createEvent, recordScore,');
console.log('            aiMatching, duesManagement');
console.log('='.repeat(80));

console.log('\n📊 STATISTICS:');
console.log('-'.repeat(80));
console.log('  Total keys in target sections:               ' + totalKeys);
console.log('  Successfully translated:                     ' + translatedKeys);
console.log(
  '    - With German text:                        ' +
    (translatedKeys - identicalToEnglish - emptyStrings)
);
console.log('    - Acceptable universal terms (DE=EN):      ' + identicalToEnglish);
console.log('    - Empty strings (DE="" = EN=""):           ' + emptyStrings);
console.log('  Missing/problematic:                         ' + missing.length);
console.log('-'.repeat(80));
console.log('  Translation Completeness:                    ' + completeness + '%');
console.log('='.repeat(80));

if (missing.length === 0) {
  console.log('\n🎉 PERFECT! 100% TRANSLATION COMPLETE!');
  console.log('✨ All ' + totalKeys + ' keys are properly translated!');
  console.log('📝 ' + identicalToEnglish + ' keys use acceptable universal terms.');
  console.log('📝 ' + emptyStrings + ' keys are intentionally empty (matching English).');
} else {
  console.log('\n⚠️  Found ' + missing.length + ' issues:\n');
  missing.forEach((item, index) => {
    console.log('[' + (index + 1) + '] ' + item.path);
    console.log('    EN: "' + item.en + '"');
    console.log('    Issue: ' + item.reason);
    console.log('');
  });
}

console.log('\n' + '='.repeat(80));
