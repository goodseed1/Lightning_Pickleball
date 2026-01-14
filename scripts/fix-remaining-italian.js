#!/usr/bin/env node
/**
 * Find and fix remaining untranslated Italian keys
 */

const fs = require('fs');
const path = require('path');

const itPath = path.join(__dirname, '../src/locales/it.json');
const enPath = path.join(__dirname, '../src/locales/en.json');

const it = JSON.parse(fs.readFileSync(itPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Find exact paths that need translation
function findUntranslatedPaths(itObj, enObj, currentPath = []) {
  const untranslated = [];

  for (const key in itObj) {
    const path = [...currentPath, key];
    const itValue = itObj[key];
    const enValue = enObj[key];

    if (typeof itValue === 'object' && itValue !== null && !Array.isArray(itValue)) {
      // Recurse
      untranslated.push(...findUntranslatedPaths(itValue, enValue || {}, path));
    } else if (typeof itValue === 'string' && itValue === enValue) {
      // Found untranslated key
      untranslated.push({
        path: path.join('.'),
        en: enValue,
        section: currentPath[0] || 'root',
      });
    }
  }

  return untranslated;
}

const untranslated = findUntranslatedPaths(it, en);

// Group by section
const bySection = {};
untranslated.forEach(item => {
  if (!bySection[item.section]) {
    bySection[item.section] = [];
  }
  bySection[item.section].push(item);
});

// Print top 20 sections with examples
console.log('🔍 Remaining untranslated keys by section:\n');
const sorted = Object.entries(bySection).sort((a, b) => b[1].length - a[1].length);

sorted.slice(0, 20).forEach(([section, items], idx) => {
  console.log(`${idx + 1}. ${section} (${items.length} keys)`);
  items.slice(0, 3).forEach(item => {
    console.log(`   ${item.path}: "${item.en}"`);
  });
  if (items.length > 3) {
    console.log(`   ... and ${items.length - 3} more`);
  }
  console.log('');
});

console.log(`\nTotal: ${untranslated.length} keys still need translation`);

// Save detailed report
const reportPath = path.join(__dirname, 'remaining-italian-keys.json');
fs.writeFileSync(reportPath, JSON.stringify(bySection, null, 2));
console.log(`\nDetailed report saved to: ${reportPath}`);
