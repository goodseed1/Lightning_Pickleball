#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all keys where ru === en
function findUntranslatedKeys(en, ru, path = '') {
  const untranslated = [];

  for (const key in en) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof en[key] === 'object' && !Array.isArray(en[key])) {
      untranslated.push(...findUntranslatedKeys(en[key], ru[key] || {}, currentPath));
    } else {
      if (en[key] === ru[key]) {
        untranslated.push({ path: currentPath, value: en[key] });
      }
    }
  }

  return untranslated;
}

// Main execution
const enPath = path.join(__dirname, '../src/locales/en.json');
const ruPath = path.join(__dirname, '../src/locales/ru.json');

console.log('📖 Reading translation files...');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

console.log('🔍 Finding untranslated keys...');
const untranslated = findUntranslatedKeys(en, ru);

console.log(`\n📊 Found ${untranslated.length} untranslated keys\n`);

// Export to JSON for easy processing
const outputPath = path.join(__dirname, 'untranslated-keys.json');
fs.writeFileSync(outputPath, JSON.stringify(untranslated, null, 2), 'utf8');

console.log(`✅ Exported to: ${outputPath}\n`);

// Group by section and show counts
const bySections = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!bySections[section]) {
    bySections[section] = [];
  }
  bySections[section].push(item);
});

const sortedSections = Object.entries(bySections).sort((a, b) => b[1].length - a[1].length);

console.log('📋 ALL SECTIONS:\n');
sortedSections.forEach(([section, items], index) => {
  console.log(`${index + 1}. ${section}: ${items.length} keys`);
});

console.log(`\n📊 Total sections: ${sortedSections.length}`);
console.log(`📊 Total keys: ${untranslated.length}\n`);
