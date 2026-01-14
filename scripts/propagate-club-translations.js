#!/usr/bin/env node
/**
 * Propagate all club-related translations from en.json to other locales
 * Includes: clubDetail, clubHallOfFame, clubList, scheduleMeetup, createClub
 */

const fs = require('fs');
const path = require('path');

// Locale files directory
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Source locale (English)
const enPath = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Extract the sections to propagate
const clubDetail = enData.clubDetail;
const clubHallOfFame = enData.clubHallOfFame;
const clubList = enData.clubList;
const scheduleMeetup = enData.scheduleMeetup;
const createClub = enData.createClub;

if (!clubDetail || !clubHallOfFame) {
  console.error('❌ Error: clubDetail or clubHallOfFame sections not found in en.json');
  process.exit(1);
}

if (!clubList || !scheduleMeetup) {
  console.error('❌ Error: clubList or scheduleMeetup sections not found in en.json');
  process.exit(1);
}

if (!createClub) {
  console.error('❌ Error: createClub section not found in en.json');
  process.exit(1);
}

// Target locales (all except ko and en)
const targetLocales = ['de', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

console.log('🚀 Starting club translation propagation...\n');

targetLocales.forEach(locale => {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    // Read the locale file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Add or update all club sections
    data.clubDetail = clubDetail;
    data.clubHallOfFame = clubHallOfFame;
    data.clubList = clubList;
    data.scheduleMeetup = scheduleMeetup;
    data.createClub = createClub;

    // Write back with formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Updated ${locale}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${locale}.json:`, error.message);
  }
});

console.log('\n✨ Club translation propagation complete!');
