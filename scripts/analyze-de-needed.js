#!/usr/bin/env node
/**
 * Analyze which keys actually need translation vs which should stay in English
 */

const fs = require('fs');
const path = require('path');

const tempPath = path.join(__dirname, '../temp-untranslated-keys.json');
const untranslated = JSON.parse(fs.readFileSync(tempPath, 'utf8'));

// Categories
const shouldStay = []; // International terms that should stay in English
const needsTranslation = []; // Terms that should be translated to German

// International/universal terms that are acceptable in German UI
const universalTerms = [
  'OK',
  'Chat',
  'Manager',
  'Online',
  'Feed',
  'Details',
  'Info',
  'Status',
  'Logo',
  'Bank',
  'Venmo',
  'Wind',
  'Team',
  'Champion',
  'Playoffs',
  'Format',
  'Mixed',
  'Walkover',
  'Tiebreak',
  'Global',
  'Lightning Coach',
  'Partner',
  'Match',
  'Volley',
  'Mental',
  'Brunch',
  'Administrator',
];

// Language names should stay in their own language
const languageNames = ['한국어', 'English', '中文', '日本語', 'Español', 'Français'];

// Names should not be translated
const names = ['Junsu Kim', 'Seoyeon Lee', 'Minjae Park', 'TennisUser'];

// Numbers and units
const numbersAndUnits = ['km', 'mi', '4', '2.0-3.0', '3.0-4.0', '4.0-5.0', '5.0+'];

for (const [key, value] of Object.entries(untranslated)) {
  let shouldKeep = false;

  // Check if it's a universal term
  if (universalTerms.some(term => value.includes(term) && value.length < 20)) {
    shouldStay.push({ key, value, reason: 'Universal term' });
    shouldKeep = true;
  }

  // Check if it's a language name
  if (languageNames.some(lang => value.includes(lang))) {
    shouldStay.push({ key, value, reason: 'Language name' });
    shouldKeep = true;
  }

  // Check if it's a name
  if (names.some(name => value.includes(name))) {
    shouldStay.push({ key, value, reason: 'Person name' });
    shouldKeep = true;
  }

  // Check if it's numbers/units
  if (numbersAndUnits.some(num => value === num || value.includes('{{') || value.includes('🥇'))) {
    shouldStay.push({ key, value, reason: 'Number/Unit/Template' });
    shouldKeep = true;
  }

  if (!shouldKeep) {
    needsTranslation.push({ key, value });
  }
}

console.log('\n📊 ANALYSIS RESULTS:\n');
console.log(`✅ Terms that can stay in English: ${shouldStay.length}`);
console.log(`⚠️  Terms that need German translation: ${needsTranslation.length}\n`);

if (needsTranslation.length > 0) {
  console.log('⚠️  NEEDS TRANSLATION:\n');
  needsTranslation.forEach((item, i) => {
    console.log(`${i + 1}. ${item.key}`);
    console.log(`   EN: "${item.value}"\n`);
  });
}

console.log(`\n✅ ACCEPTABLE AS-IS (${shouldStay.length} terms):\n`);
shouldStay.slice(0, 20).forEach(item => {
  console.log(`  ${item.key}: "${item.value}" (${item.reason})`);
});

if (shouldStay.length > 20) {
  console.log(`  ... and ${shouldStay.length - 20} more\n`);
}

console.log(`\n🎯 SUMMARY:`);
console.log(`   Total untranslated: ${Object.keys(untranslated).length}`);
console.log(
  `   Acceptable as-is: ${shouldStay.length} (${((shouldStay.length / Object.keys(untranslated).length) * 100).toFixed(1)}%)`
);
console.log(`   Actually need translation: ${needsTranslation.length}\n`);
