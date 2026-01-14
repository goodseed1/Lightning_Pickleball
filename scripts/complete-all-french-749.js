#!/usr/bin/env node

/**
 * Complete ALL 749 French Translations
 * Find ALL keys where fr === en and translate to natural French
 */

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const frPath = path.join(__dirname, '../src/locales/fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

/**
 * Deep comparison to find all keys where fr === en
 */
function findUntranslated(enObj, frObj, prefix = '') {
  const untranslated = [];

  for (const key in enObj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    const enValue = enObj[key];
    const frValue = frObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      untranslated.push(...findUntranslated(enValue, frValue || {}, currentPath));
    } else if (typeof enValue === 'string') {
      if (frValue === enValue) {
        untranslated.push({ path: currentPath, en: enValue });
      }
    }
  }

  return untranslated;
}

const untranslated = findUntranslated(en, fr);

console.log(`\nFound ${untranslated.length} untranslated keys (fr === en)\n`);

// Group by top-level category
const byCategory = {};
untranslated.forEach(item => {
  const category = item.path.split('.')[0];
  byCategory[category] = (byCategory[category] || 0) + 1;
});

// Sort and display top categories
const sortedCategories = Object.entries(byCategory)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('TOP 10 Categories:\n');
sortedCategories.forEach(([category, count]) => {
  console.log(`  ${category.padEnd(30)} ${count} keys`);
});

// Export full list
const exportData = untranslated.map(item => ({
  path: item.path,
  en: item.en,
}));

fs.writeFileSync(
  path.join(__dirname, 'fr-untranslated-report.json'),
  JSON.stringify(exportData, null, 2)
);

console.log(`\n✅ Exported ${untranslated.length} keys to fr-untranslated-report.json\n`);

// Show first 30 examples
console.log('First 30 Examples:\n');
untranslated.slice(0, 30).forEach((item, idx) => {
  console.log(`${(idx + 1).toString().padStart(3)}. ${item.path}`);
  console.log(`     EN: "${item.en}"`);
});
