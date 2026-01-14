#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

function findUntranslated(enObj, esObj, prefix = '') {
  const untranslated = [];
  for (const key in enObj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      untranslated.push(...findUntranslated(enObj[key], esObj[key] || {}, currentPath));
    } else {
      if (!esObj[key] || esObj[key] === enObj[key]) {
        untranslated.push({ path: currentPath, en: enObj[key] });
      }
    }
  }
  return untranslated;
}

const untranslated = findUntranslated(en, es);
const bySection = {};

untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!bySection[section]) bySection[section] = [];
  bySection[section].push(item);
});

const sorted = Object.entries(bySection).sort((a, b) => b[1].length - a[1].length);

console.log('REMAINING SECTIONS (Top 15):\n');
sorted.slice(0, 15).forEach(([section, items]) => {
  console.log(`${section}: ${items.length} keys`);
  items.forEach(item => {
    const subPath = item.path.substring(section.length + 1);
    console.log(`  ${subPath}: "${item.en}"`);
  });
  console.log();
});

console.log(`\nTotal remaining: ${untranslated.length} keys across ${sorted.length} sections`);
