#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ZH_PATH = path.join(__dirname, '../src/locales/zh.json');

function findUntranslated(en, zh, path = '') {
  const untranslated = [];

  for (const key in en) {
    const currentPath = path ? `${path}.${key}` : key;
    const enValue = en[key];
    const zhValue = zh[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      untranslated.push(...findUntranslated(enValue, zhValue || {}, currentPath));
    } else if (zhValue === enValue || zhValue === undefined) {
      untranslated.push({ path: currentPath, en: enValue });
    }
  }

  return untranslated;
}

const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const zhData = JSON.parse(fs.readFileSync(ZH_PATH, 'utf8'));

const untranslated = findUntranslated(enData, zhData);

console.log(`\n📊 Total untranslated keys: ${untranslated.length}\n`);

// Group by top-level section
const sections = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  sections[section] = (sections[section] || 0) + 1;
});

console.log('Top 15 sections needing translation:\n');
Object.entries(sections)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([section, count], idx) => {
    console.log(`${idx + 1}. ${section}: ${count} keys`);
  });

// Show sample keys for top sections
console.log('\n--- Sample keys from top 3 sections ---\n');
const topSections = Object.entries(sections)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3);

topSections.forEach(([section]) => {
  console.log(`\n${section}:`);
  untranslated
    .filter(item => item.path.startsWith(section + '.'))
    .slice(0, 10)
    .forEach(item => {
      console.log(`  ${item.path}: "${item.en}"`);
    });
});
