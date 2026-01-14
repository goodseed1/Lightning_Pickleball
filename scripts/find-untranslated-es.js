const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/locales/en.json'), 'utf8'));
const es = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/locales/es.json'), 'utf8'));

let count = 0;
const untranslated = {};

function findUntranslated(enObj, esObj, path = '') {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      if (esObj && esObj[key]) {
        findUntranslated(enObj[key], esObj[key], currentPath);
      }
    } else {
      if (esObj && enObj[key] === esObj[key]) {
        const parts = currentPath.split('.');
        const section = parts[0];
        const keyPath = parts.slice(1).join('.');

        if (!untranslated[section]) {
          untranslated[section] = {};
        }
        untranslated[section][keyPath] = enObj[key];
        count++;
      }
    }
  }
}

findUntranslated(en, es);

console.log('=== UNTRANSLATED KEYS BY SECTION ===\n');

Object.keys(untranslated)
  .sort()
  .forEach(section => {
    console.log(`\n${section}:`);
    Object.keys(untranslated[section]).forEach(key => {
      console.log(`  ${key}: "${untranslated[section][key]}"`);
    });
  });

console.log(`\n\nTotal untranslated: ${count}`);

// Save to JSON file for processing
fs.writeFileSync(
  path.join(__dirname, 'untranslated-es-keys.json'),
  JSON.stringify(untranslated, null, 2),
  'utf8'
);
console.log('\nSaved to: scripts/untranslated-es-keys.json');
