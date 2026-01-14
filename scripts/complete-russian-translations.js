#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Deep merge utility
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

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

// Group by top-level section
const bySections = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!bySections[section]) {
    bySections[section] = [];
  }
  bySections[section].push(item);
});

// Sort sections by count
const sortedSections = Object.entries(bySections)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10);

console.log('📋 TOP 10 SECTIONS:\n');
sortedSections.forEach(([section, items], index) => {
  console.log(`${index + 1}. ${section}: ${items.length} keys`);
});

console.log('\n' + '='.repeat(60));
console.log('\n📝 Sample untranslated keys:\n');

// Show samples from top sections
sortedSections.slice(0, 5).forEach(([section, items]) => {
  console.log(`\n[${section}] - ${items.length} keys:`);
  items.slice(0, 5).forEach(item => {
    console.log(`  - ${item.path}: "${item.value}"`);
  });
  if (items.length > 5) {
    console.log(`  ... and ${items.length - 5} more`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ Analysis complete! Ready for translation.');
console.log(`\n💡 Next: Create translation patches for each section\n`);
