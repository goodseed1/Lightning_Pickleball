#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const zhPath = path.join(__dirname, '../src/locales/zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

function findUntranslatedKeys(enObj, zhObj, path = '') {
  let untranslated = [];

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      if (zhObj[key] && typeof zhObj[key] === 'object') {
        untranslated = untranslated.concat(
          findUntranslatedKeys(enObj[key], zhObj[key], currentPath)
        );
      }
    } else {
      // Check if the value is the same (untranslated)
      if (zhObj[key] === enObj[key]) {
        untranslated.push({ path: currentPath, value: enObj[key] });
      }
    }
  }

  return untranslated;
}

const untranslated = findUntranslatedKeys(en, zh);

// Group by top-level key
const grouped = {};
untranslated.forEach(item => {
  const topKey = item.path.split('.')[0];
  if (!grouped[topKey]) grouped[topKey] = [];
  grouped[topKey].push(item);
});

// Sort by count
const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

console.log('=== Top 20 Sections with Untranslated Keys ===\n');
sorted.slice(0, 20).forEach(([key, items]) => {
  console.log(`${key}: ${items.length} keys`);
});

console.log(`\n=== Total: ${untranslated.length} untranslated keys ===\n`);

// Show sample keys from top sections
console.log('=== Sample Keys from Top 5 Sections ===\n');
sorted.slice(0, 5).forEach(([section, items]) => {
  console.log(`\n${section} (showing first 10):`);
  items.slice(0, 10).forEach(item => {
    const shortPath = item.path.replace(`${section}.`, '');
    console.log(`  ${shortPath}: "${item.value}"`);
  });
});
