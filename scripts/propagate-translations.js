#!/usr/bin/env node
/**
 * Propagate myProfile and friends translations from en.json to other locales
 */

const fs = require('fs');
const path = require('path');

// Locale files directory
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Source locale (English)
const enPath = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Extract the sections to propagate
const myProfile = enData.myProfile;
const friends = enData.friends;

if (!myProfile || !friends) {
  console.error('❌ Error: myProfile or friends sections not found in en.json');
  process.exit(1);
}

// Target locales (all except ko and en)
const targetLocales = ['de', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

console.log('🚀 Starting translation propagation...\n');

targetLocales.forEach(locale => {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    // Read the locale file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Add or update the sections
    data.myProfile = myProfile;
    data.friends = friends;

    // Write back with formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Updated ${locale}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${locale}.json:`, error.message);
  }
});

console.log('\n✨ Translation propagation complete!');
