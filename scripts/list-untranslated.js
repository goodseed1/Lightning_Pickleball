#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const ptPath = path.join(__dirname, '../src/locales/pt.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

function findUntranslated(enObj, ptObj, prefix = '') {
  const results = [];

  for (const key in enObj) {
    const path = prefix ? `${prefix}.${key}` : key;
    const enValue = enObj[key];
    const ptValue = ptObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      results.push(...findUntranslated(enValue, ptValue || {}, path));
    } else if (ptValue === enValue || ptValue === undefined) {
      results.push({ path, en: enValue });
    }
  }

  return results;
}

const untranslated = findUntranslated(en, pt);

// Group by section
const bySection = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!bySection[section]) {
    bySection[section] = [];
  }
  bySection[section].push(item);
});

console.log('\nUNTRANSLATED KEYS BY SECTION:\n');

Object.entries(bySection)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10)
  .forEach(([section, items]) => {
    console.log(`\n${section} (${items.length} keys):`);
    items.slice(0, 10).forEach(item => {
      console.log(`  ${item.path}: "${item.en}"`);
    });
    if (items.length > 10) {
      console.log(`  ... and ${items.length - 10} more`);
    }
  });

console.log(`\nTotal: ${untranslated.length} untranslated keys\n`);
