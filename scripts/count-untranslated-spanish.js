#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File paths
const enPath = path.join(__dirname, '../src/locales/en.json');
const esPath = path.join(__dirname, '../src/locales/es.json');

// Read JSON files
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const esJson = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Find keys where Spanish === English (still untranslated)
function findUntranslatedKeys(en, es, path = '') {
  const untranslated = [];

  for (const key in en) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof en[key] === 'object' && !Array.isArray(en[key])) {
      // Recurse into nested objects
      untranslated.push(...findUntranslatedKeys(en[key], es[key] || {}, currentPath));
    } else if (typeof en[key] === 'string') {
      // Check if Spanish value matches English (untranslated)
      if (!es[key] || es[key] === en[key]) {
        untranslated.push({
          key: currentPath,
          en: en[key],
          es: es[key] || '[MISSING]',
        });
      }
    }
  }

  return untranslated;
}

const untranslated = findUntranslatedKeys(enJson, esJson);

// Group by category (top-level key)
const byCategory = {};
untranslated.forEach(item => {
  const category = item.key.split('.')[0];
  if (!byCategory[category]) {
    byCategory[category] = [];
  }
  byCategory[category].push(item);
});

console.log('\n📊 SPANISH TRANSLATION STATUS REPORT\n');
console.log('='.repeat(60));

// Intentionally untranslated (universal terms)
const intentional = untranslated.filter(
  item =>
    [
      'Error',
      'OK',
      'Chat',
      'Admin',
      'Staff',
      'Club',
      'Total',
      'Normal',
      'Casual',
      'Social',
      'General',
      'Manual',
      'Logo',
      'Brunch',
      'Venmo',
      'N/A',
      'Playoffs',
      'Final',
      'Set',
      'Global',
      'AM',
      'PM',
      'Rec',
      'km',
      'mi',
    ].includes(item.en) ||
    item.en.match(/^[\d\.\-\+]+$/) || // Numbers like "2.0-3.0", "4"
    item.en.match(/^{{.*}}$/) || // Template variables like "{{email}}"
    item.en.includes('{{') || // Strings with variables
    item.en.match(/^[中日]/) || // Chinese/Japanese characters
    item.en === 'Español' ||
    item.en === 'Français' || // Language names
    item.en.includes('×') ||
    item.en.includes('🏆') ||
    item.en.includes('📊') || // Symbols/emojis
    item.en.match(/^[\d]+ Set/) // "1 Set", "3 Sets", etc.
);

const needsTranslation = untranslated.filter(item => !intentional.includes(item));

console.log(`Total untranslated keys: ${untranslated.length}`);
console.log(`  - Intentionally left in English: ${intentional.length}`);
console.log(`  - Actually need translation: ${needsTranslation.length}`);
console.log('\n' + '='.repeat(60));

if (needsTranslation.length > 0) {
  console.log('\n🚨 KEYS THAT NEED TRANSLATION:\n');

  const byCategory = {};
  needsTranslation.forEach(item => {
    const category = item.key.split('.')[0];
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(item);
  });

  Object.keys(byCategory)
    .sort()
    .forEach(category => {
      console.log(`\n${category} (${byCategory[category].length} keys):`);
      byCategory[category].forEach(item => {
        console.log(`  ${item.key}: "${item.en}"`);
      });
    });
} else {
  console.log('\n✅ ALL KEYS TRANSLATED! (excluding intentional English terms)\n');
}

console.log('\n' + '='.repeat(60));
console.log('\nIntentionally untranslated universal terms:');
console.log(
  intentional
    .slice(0, 10)
    .map(i => `"${i.en}"`)
    .join(', ') + (intentional.length > 10 ? `, ... (${intentional.length - 10} more)` : '')
);
console.log('\n');
