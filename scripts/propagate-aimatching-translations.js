#!/usr/bin/env node
/**
 * Propagate aiMatching translations from en.json to other locales
 */

const fs = require('fs');
const path = require('path');

// Locale files directory
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Source locale (English)
const enPath = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Extract the section to propagate
const aiMatching = enData.aiMatching;

if (!aiMatching) {
  console.error('❌ Error: aiMatching section not found in en.json');
  process.exit(1);
}

// Target locales (all except ko and en)
const targetLocales = ['de', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

console.log('🚀 Starting aiMatching translation propagation...\n');

targetLocales.forEach(locale => {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    // Read the locale file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Add or update the section
    data.aiMatching = aiMatching;

    // Write back with formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Updated ${locale}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${locale}.json:`, error.message);
  }
});

console.log('\n✨ aiMatching translation propagation complete!');
