#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find untranslated keys with their paths
function findUntranslated(en, ru, prefix = '', results = []) {
  for (const key in en) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof en[key] === 'object' && !Array.isArray(en[key])) {
      findUntranslated(en[key], ru[key] || {}, fullKey, results);
    } else if (typeof en[key] === 'string') {
      if (!ru[key] || ru[key] === en[key]) {
        results.push({
          path: fullKey,
          en: en[key],
          ru: ru[key] || null,
        });
      }
    }
  }

  return results;
}

// Load JSON files
const enPath = path.join(__dirname, '../src/locales/en.json');
const ruPath = path.join(__dirname, '../src/locales/ru.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

const untranslated = findUntranslated(en, ru);

// Group by top-level section
const sections = {};
untranslated.forEach(item => {
  const topLevel = item.path.split('.')[0];
  if (!sections[topLevel]) {
    sections[topLevel] = [];
  }
  sections[topLevel].push(item);
});

// Sort sections by count
const sorted = Object.entries(sections).sort((a, b) => b[1].length - a[1].length);

console.log('\n📊 Top 20 sections needing translation:\n');
sorted.slice(0, 20).forEach(([section, items]) => {
  console.log(`${section}: ${items.length} keys`);
});

console.log('\n\n📝 Sample untranslated keys from top 5 sections:\n');
sorted.slice(0, 5).forEach(([section, items]) => {
  console.log(`\n${section} (${items.length} keys):`);
  items.slice(0, 10).forEach(item => {
    console.log(`  ${item.path}: "${item.en}"`);
  });
  if (items.length > 10) {
    console.log(`  ... and ${items.length - 10} more`);
  }
});

console.log(`\n\n📈 Total untranslated: ${untranslated.length} keys\n`);
