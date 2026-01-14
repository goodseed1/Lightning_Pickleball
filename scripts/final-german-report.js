const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const de = JSON.parse(fs.readFileSync('src/locales/de.json', 'utf8'));

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else if (typeof obj[key] === 'string') {
      count++;
    }
  }
  return count;
}

function countUntranslated(enObj, deObj) {
  let count = 0;
  for (const key in enObj) {
    const enValue = enObj[key];
    const deValue = deObj ? deObj[key] : undefined;

    if (enValue && typeof enValue === 'object' && !Array.isArray(enValue)) {
      count += countUntranslated(enValue, deValue || {});
    } else if (typeof enValue === 'string') {
      if (!deValue || deValue === enValue) {
        count++;
      }
    }
  }
  return count;
}

const totalKeys = countKeys(en);
const untranslated = countUntranslated(en, de);
const translated = totalKeys - untranslated;
const percent = ((translated / totalKeys) * 100).toFixed(1);
const startUntranslated = 2274; // From the original task
const translatedInSession = startUntranslated - untranslated;

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║          🇩🇪 GERMAN TRANSLATION - FINAL REPORT                     ║');
console.log('╠════════════════════════════════════════════════════════════════════╣');
console.log(
  '║  📊 Total keys in en.json:        ' +
    totalKeys.toString().padStart(4) +
    ' keys                   ║'
);
console.log(
  '║  ✅ Successfully translated:      ' +
    translated.toString().padStart(4) +
    ' keys (' +
    percent +
    '%)            ║'
);
console.log(
  '║  ❌ Remaining untranslated:       ' +
    untranslated.toString().padStart(4) +
    ' keys                   ║'
);
console.log('╠════════════════════════════════════════════════════════════════════╣');
console.log('║  🚀 This session:                                                  ║');
console.log(
  '║     • Started with:              ' +
    startUntranslated.toString().padStart(4) +
    ' untranslated            ║'
);
console.log(
  '║     • Translated in session:     ' +
    translatedInSession.toString().padStart(4) +
    ' keys                   ║'
);
console.log(
  '║     • Remaining:                  ' +
    untranslated.toString().padStart(4) +
    ' keys                   ║'
);
console.log('╠════════════════════════════════════════════════════════════════════╣');
console.log('║  📈 Overall progress:             ' + percent + '%                        ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');
