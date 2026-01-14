#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const frPath = path.join(__dirname, '../src/locales/fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Find untranslated keys
function findUntranslated(enObj, frObj, path = '', results = {}) {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      findUntranslated(enObj[key], frObj[key] || {}, currentPath, results);
    } else {
      const enValue = enObj[key];
      const frValue = frObj[key];

      if (!frValue || frValue === enValue) {
        if (!results[path]) {
          results[path] = [];
        }
        results[path].push({
          key,
          enValue,
          frValue: frValue || '(missing)',
        });
      }
    }
  }

  return results;
}

const untranslated = findUntranslated(en, fr);

// Sort by count
const sorted = Object.entries(untranslated)
  .map(([section, keys]) => ({ section, count: keys.length, keys }))
  .sort((a, b) => b.count - a.count);

console.log('📊 TOP 20 SECTIONS NEEDING TRANSLATION:\n');

sorted.slice(0, 20).forEach(({ section, count, keys }, index) => {
  console.log(`${index + 1}. ${section || '(root)'}: ${count} keys`);

  // Show first 5 examples
  if (keys.length > 0) {
    console.log('   Examples:');
    keys.slice(0, 5).forEach(({ key, enValue }) => {
      const display = enValue.length > 50 ? enValue.substring(0, 47) + '...' : enValue;
      console.log(`     - ${key}: "${display}"`);
    });
  }
  console.log('');
});

// Total count
const totalCount = sorted.reduce((sum, { count }) => sum + count, 0);
console.log(`\n📈 TOTAL UNTRANSLATED: ${totalCount} keys\n`);

// Save detailed report
const reportPath = path.join(__dirname, 'fr-untranslated-report.json');
fs.writeFileSync(reportPath, JSON.stringify(sorted, null, 2), 'utf8');
console.log(`📄 Detailed report saved to: ${reportPath}`);
