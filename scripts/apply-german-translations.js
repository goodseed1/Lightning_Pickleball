const fs = require('fs');
const path = require('path');

// Load files
const dePath = path.join(__dirname, '../src/locales/de.json');
const translationsPath = path.join(__dirname, 'german-translations.json');

const de = require(dePath);
const translations = require(translationsPath);

// Helper function to set nested property
function setNestedProperty(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

// Apply translations
let count = 0;
for (const section in translations) {
  const sectionTranslations = translations[section];

  for (const keyPath in sectionTranslations) {
    const fullPath = `${section}.${keyPath}`;
    const value = sectionTranslations[keyPath];

    setNestedProperty(de, fullPath, value);
    count++;
    console.log(`✓ ${fullPath}`);
  }
}

// Write back to file
fs.writeFileSync(dePath, JSON.stringify(de, null, 2), 'utf8');

console.log(`\n✅ Applied ${count} translations to de.json`);
