#!/usr/bin/env node
/**
 * Script to propagate badgeGallery translations from en.json to all other locales
 * Uses English values as placeholders for languages other than Korean
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const TARGET_LOCALES = ['de', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

// Read the English translation as source
const enPath = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Extract badgeGallery section
const badgeGallerySection = enData.badgeGallery;

if (!badgeGallerySection) {
  console.error('❌ Error: badgeGallery section not found in en.json');
  process.exit(1);
}

console.log('🔄 Propagating badgeGallery translations to other locales...\n');

// Propagate to each locale
TARGET_LOCALES.forEach(locale => {
  const localePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    // Read existing locale file
    const localeData = JSON.parse(fs.readFileSync(localePath, 'utf8'));

    // Add badgeGallery section (or replace if exists)
    localeData.badgeGallery = badgeGallerySection;

    // Write back to file with proper formatting
    fs.writeFileSync(localePath, JSON.stringify(localeData, null, 2) + '\n', 'utf8');

    console.log(`✅ ${locale}.json - badgeGallery section added/updated`);
  } catch (error) {
    console.error(`❌ Error processing ${locale}.json:`, error.message);
  }
});

console.log('\n✅ All translations propagated successfully!');
console.log(
  '📝 Note: English values are used as placeholders. Update with proper translations as needed.\n'
);
