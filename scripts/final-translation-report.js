const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('src/locales/es.json', 'utf8'));

let total = 0;
let different = 0;
let same = 0;
let shouldChange = [];

function compare(enObj, esObj, path = '') {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      if (esObj && esObj[key]) {
        compare(enObj[key], esObj[key], currentPath);
      }
    } else {
      total++;
      if (esObj && enObj[key] === esObj[key]) {
        same++;

        // These values are legitimately the same in Spanish
        const legitimatelySame = [
          'Error',
          'Chat',
          'No',
          'Total',
          'Club',
          'Casual',
          'Social',
          'General',
          'Normal',
          'Manual',
          'Final',
          'Global',
          'Admin',
          'Set',
          'AM',
          'PM',
          'Venmo',
          'Rec',
          'Playoffs',
          'km',
          'mi',
          'min',
          'pts',
          'ptos',
          '',
          '中文',
          '日本語',
          'Español',
          'Français',
        ];

        const value = enObj[key];
        const isTemplate = value.includes('{{');
        const isNumber = /^\d/.test(value);
        const isName = /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(value);
        const isLegit = legitimatelySame.includes(value);

        if (!isTemplate && !isNumber && !isName && !isLegit) {
          shouldChange.push({ path: currentPath, value });
        }
      } else {
        different++;
      }
    }
  }
}

compare(en, es);

console.log('=== FINAL TRANSLATION STATUS ===\n');
console.log(`Total keys: ${total}`);
console.log(`Translated (different): ${different} (${((different / total) * 100).toFixed(1)}%)`);
console.log(`Same as English: ${same} (${((same / total) * 100).toFixed(1)}%)`);
console.log(`\nKeys that legitimately stay the same: ${same - shouldChange.length}`);
console.log(`Keys that COULD be changed: ${shouldChange.length}\n`);

if (shouldChange.length > 0) {
  console.log('Keys that could be different (but may be correct):');
  shouldChange.forEach(({ path, value }) => {
    console.log(`  ${path}: "${value}"`);
  });
} else {
  console.log('✅ All remaining matching keys are legitimately the same in Spanish!');
  console.log('   (international terms, abbreviations, numbers, names, templates)');
}
