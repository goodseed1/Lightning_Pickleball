const fs = require('fs');
const path = require('path');

// Read locale files
const enPath = path.join(__dirname, '..', 'src', 'locales', 'en.json');
const ruPath = path.join(__dirname, '..', 'src', 'locales', 'ru.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// Find untranslated keys
function findUntranslated(enObj, ruObj, prefix = '') {
  const untranslated = {};

  for (const key in enObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      // Recursively check nested objects
      const nestedUntranslated = findUntranslated(enObj[key], ruObj[key] || {}, fullKey);
      if (Object.keys(nestedUntranslated).length > 0) {
        if (!untranslated[key]) {
          untranslated[key] = {};
        }
        Object.assign(untranslated[key], nestedUntranslated);
      }
    } else {
      // Check if key exists and is different
      if (!ruObj[key] || ruObj[key] === enObj[key]) {
        untranslated[key] = enObj[key];
      }
    }
  }

  return untranslated;
}

const untranslated = findUntranslated(en, ru);

// Write to JSON file
const outputPath = path.join(__dirname, 'untranslated-ru-keys.json');
fs.writeFileSync(outputPath, JSON.stringify(untranslated, null, 2) + '\n', 'utf8');

console.log('✅ Exported untranslated keys to untranslated-ru-keys.json');
console.log(
  `📊 Total keys to translate: ${JSON.stringify(untranslated).match(/":/g)?.length || 0}`
);
