const fs = require('fs');
const path = require('path');

// Read files
const dePath = path.join(__dirname, '../src/locales/de.json');
const enPath = path.join(__dirname, '../src/locales/en.json');

const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Function to find all keys where de === en (incomplete translations)
function findIncompleteTranslations(deObj, enObj, prefix = '') {
  const incomplete = [];

  for (const key in enObj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      // Recursive check for nested objects
      if (deObj[key] && typeof deObj[key] === 'object') {
        incomplete.push(...findIncompleteTranslations(deObj[key], enObj[key], currentPath));
      }
    } else if (typeof enObj[key] === 'string') {
      // Check if German translation exists and is different from English
      if (!deObj[key] || deObj[key] === enObj[key]) {
        incomplete.push({
          path: currentPath,
          en: enObj[key],
          de: deObj[key] || enObj[key],
        });
      }
    }
  }

  return incomplete;
}

// Find incomplete translations
const incompleteTranslations = findIncompleteTranslations(de, en);

console.log(`Found ${incompleteTranslations.length} incomplete German translations:\n`);

// Group by section
const grouped = {};
incompleteTranslations.forEach(item => {
  const section = item.path.split('.')[0];
  if (!grouped[section]) {
    grouped[section] = [];
  }
  grouped[section].push(item);
});

// Display grouped results
Object.keys(grouped)
  .sort()
  .forEach(section => {
    console.log(`\n=== ${section.toUpperCase()} (${grouped[section].length} keys) ===`);
    grouped[section].forEach(item => {
      console.log(`  ${item.path}`);
      console.log(`    EN: "${item.en}"`);
      console.log(`    DE: "${item.de}"`);
    });
  });

console.log(`\n\nTOTAL: ${incompleteTranslations.length} incomplete translations`);
