const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/locales/en.json'), 'utf8'));
const de = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/locales/de.json'), 'utf8'));

// Find all keys where de === en (needs translation)
const needsTranslation = {};
let count = 0;

function findUntranslated(enObj, deObj, keyPath = '') {
  for (const key in enObj) {
    const newPath = keyPath ? `${keyPath}.${key}` : key;
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      findUntranslated(enObj[key], deObj[key] || {}, newPath);
    } else if (enObj[key] === deObj[key]) {
      needsTranslation[newPath] = enObj[key];
      count++;
    }
  }
}

findUntranslated(en, de);

console.log('Total keys needing translation:', count);
console.log('\nTop sections:');
const sections = {};
for (const key in needsTranslation) {
  const section = key.split('.')[0];
  sections[section] = (sections[section] || 0) + 1;
}
Object.entries(sections)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([section, count]) => console.log(`  ${section}: ${count} keys`));

// Save to temporary file
fs.writeFileSync(
  path.join(__dirname, '../temp-untranslated-keys.json'),
  JSON.stringify(needsTranslation, null, 2)
);

console.log('\nSaved untranslated keys to temp-untranslated-keys.json');
