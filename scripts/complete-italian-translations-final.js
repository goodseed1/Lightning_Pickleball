const fs = require('fs');
const path = require('path');

// Read English and Italian files
const enPath = path.join(__dirname, '../src/locales/en.json');
const itPath = path.join(__dirname, '../src/locales/it.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const itData = JSON.parse(fs.readFileSync(itPath, 'utf8'));

// Find all missing translations (where it === en)
function findMissingTranslations(enObj, itObj, path = '') {
  const missing = {};

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      const nested = findMissingTranslations(enObj[key], itObj[key] || {}, currentPath);
      if (Object.keys(nested).length > 0) {
        missing[key] = nested;
      }
    } else if (itObj[key] === enObj[key] || itObj[key] === undefined) {
      // Translation missing or same as English
      console.log(`Missing: ${currentPath} = "${enObj[key]}"`);
      missing[key] = enObj[key];
    }
  }

  return missing;
}

console.log('🔍 Finding missing Italian translations...\n');
const missingTranslations = findMissingTranslations(enData, itData);

// Count total missing keys
function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

const totalMissing = countKeys(missingTranslations);
console.log(`\n📊 Total missing translations: ${totalMissing}`);

// Export missing translations to JSON for analysis
fs.writeFileSync(
  path.join(__dirname, 'missing-italian-translations.json'),
  JSON.stringify(missingTranslations, null, 2),
  'utf8'
);

console.log('✅ Missing translations exported to missing-italian-translations.json');
