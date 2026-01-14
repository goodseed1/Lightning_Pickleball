#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, 'fr-untranslated-report.json');
const untranslated = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Dictionary from previous script
const knownTranslations = {
  Clubs: 'Clubs',
  Logo: 'Logo',
  Public: 'Publique',
  Social: 'Social',
  Brunch: 'Brunch',
  miles: 'miles',
  km: 'km',
  mi: 'mi',
  Expert: 'Expert',
  Rec: 'Rec',
  mile: 'mile',
  Total: 'Total',
  Important: 'Important',
  Club: 'Club',
  Info: 'Info',
  Participants: 'Participants',
  Services: 'Services',
  Format: 'Format',
  '': '',
  // ... (all others from MEGA-FRENCH-DICT.js)
};

// Find what's missing
const missing = untranslated.filter(item => !knownTranslations.hasOwnProperty(item.en));

console.log(`\n📊 Missing translations: ${missing.length}\n`);

// Group by category
const byCategory = {};
missing.forEach(item => {
  const category = item.path.split('.')[0];
  if (!byCategory[category]) byCategory[category] = [];
  byCategory[category].push(item);
});

// Show top categories with samples
console.log('TOP CATEGORIES WITH SAMPLES:\n');
Object.entries(byCategory)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 5)
  .forEach(([category, items]) => {
    console.log(`\n${category} (${items.length} keys):`);
    items.slice(0, 5).forEach((item, idx) => {
      console.log(`  ${idx + 1}. "${item.en}"`);
    });
  });

// Save full list
fs.writeFileSync(
  path.join(__dirname, 'fr-missing-translations.json'),
  JSON.stringify(missing, null, 2)
);

console.log(
  `\n\n✅ Saved ${missing.length} missing translations to fr-missing-translations.json\n`
);
