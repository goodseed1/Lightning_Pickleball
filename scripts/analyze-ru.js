#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const RU_PATH = path.join(__dirname, '../src/locales/ru.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const ru = JSON.parse(fs.readFileSync(RU_PATH, 'utf8'));

// Find untranslated keys
function findUntranslated(enObj, ruObj, currentPath = '') {
  let untranslated = [];

  for (const key in enObj) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      untranslated.push(...findUntranslated(enObj[key], ruObj[key] || {}, fullPath));
    } else {
      if (ruObj[key] === enObj[key]) {
        untranslated.push(fullPath);
      }
    }
  }

  return untranslated;
}

const untranslated = findUntranslated(en, ru);

// Group by top-level section
const sections = {};
untranslated.forEach(keyPath => {
  const topLevel = keyPath.split('.')[0];
  sections[topLevel] = (sections[topLevel] || 0) + 1;
});

console.log('Top sections needing translation:');
Object.entries(sections)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([section, count]) => {
    console.log(`  ${section}: ${count} keys`);
  });

console.log(`\nTotal untranslated: ${untranslated.length}`);

// Show examples
console.log('\nExample paths from top sections:');
const topSections = Object.keys(sections)
  .sort((a, b) => sections[b] - sections[a])
  .slice(0, 5);
topSections.forEach(section => {
  const examples = untranslated.filter(p => p.startsWith(section + '.')).slice(0, 8);
  console.log(`\n${section}:`);
  examples.forEach(ex => {
    const value = ex.split('.').reduce((obj, key) => obj[key], en);
    console.log(`  ${ex}: "${value}"`);
  });
});
