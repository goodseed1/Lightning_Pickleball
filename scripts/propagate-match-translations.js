#!/usr/bin/env node
/**
 * Propagate matchRequest and matchDetail translations from en.json to other locales
 */

const fs = require('fs');
const path = require('path');

// Locale files directory
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Source locale (English)
const enPath = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Extract the sections to propagate
const matchRequest = enData.matchRequest;
const matchDetailDefaultMessage = enData.matchDetail?.defaultMessage;

if (!matchRequest) {
  console.error('❌ Error: matchRequest section not found in en.json');
  process.exit(1);
}

if (!matchDetailDefaultMessage) {
  console.error('❌ Error: matchDetail.defaultMessage not found in en.json');
  process.exit(1);
}

// Target locales (all except ko and en)
const targetLocales = ['de', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

console.log('🚀 Starting match translation propagation...\n');

targetLocales.forEach(locale => {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    // Read the locale file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Add or update the matchRequest section
    data.matchRequest = matchRequest;

    // Add defaultMessage to matchDetail if it exists
    if (data.matchDetail) {
      data.matchDetail.defaultMessage = matchDetailDefaultMessage;
    } else {
      data.matchDetail = { defaultMessage: matchDetailDefaultMessage };
    }

    // Write back with formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Updated ${locale}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${locale}.json:`, error.message);
  }
});

console.log('\n✨ Match translation propagation complete!');
