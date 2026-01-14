const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const itPath = path.join(__dirname, '../src/locales/it.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const itData = JSON.parse(fs.readFileSync(itPath, 'utf8'));

let totalKeys = 0;
let translatedKeys = 0;
let untranslatedKeys = 0;
const untranslatedSections = {};

function compareObjects(enObj, itObj, path = '') {
  Object.keys(enObj).forEach(key => {
    const currentPath = path ? `${path}.${key}` : key;
    const enValue = enObj[key];
    const itValue = itObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      compareObjects(enValue, itValue || {}, currentPath);
    } else {
      totalKeys++;
      if (itValue && itValue !== enValue) {
        translatedKeys++;
      } else {
        untranslatedKeys++;
        const section = currentPath.split('.')[0];
        if (!untranslatedSections[section]) {
          untranslatedSections[section] = [];
        }
        untranslatedSections[section].push(currentPath);
      }
    }
  });
}

compareObjects(enData, itData);

console.log('📊 Italian Translation Coverage Analysis\n');
console.log('═══════════════════════════════════════');
console.log(`Total Keys: ${totalKeys}`);
console.log(`Translated: ${translatedKeys} (${((translatedKeys / totalKeys) * 100).toFixed(1)}%)`);
console.log(
  `Untranslated: ${untranslatedKeys} (${((untranslatedKeys / totalKeys) * 100).toFixed(1)}%)`
);
console.log('═══════════════════════════════════════\n');

if (untranslatedKeys > 0) {
  console.log('🔴 Sections with Untranslated Keys:\n');

  const sortedSections = Object.entries(untranslatedSections)
    .map(([section, keys]) => ({ section, count: keys.length }))
    .sort((a, b) => b.count - a.count);

  sortedSections.forEach(({ section, count }) => {
    console.log(`  ${section}: ${count} keys`);
  });

  console.log('\n📝 Top 10 Sections Needing Translation:\n');
  sortedSections.slice(0, 10).forEach(({ section, count }) => {
    console.log(`  ${section.padEnd(30)} ${count} keys`);
    const keys = untranslatedSections[section];
    keys.slice(0, 5).forEach(key => {
      console.log(`    - ${key}`);
    });
    if (keys.length > 5) {
      console.log(`    ... and ${keys.length - 5} more`);
    }
    console.log('');
  });
} else {
  console.log('✅ All keys are translated!');
}
