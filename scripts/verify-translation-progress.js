const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('src/locales/es.json', 'utf8'));

let totalKeys = 0;
let matchingKeys = 0;
let translatedKeys = 0;
let shouldTranslate = [];

function compare(enObj, esObj, path = '') {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      if (esObj && esObj[key]) {
        compare(enObj[key], esObj[key], currentPath);
      }
    } else {
      totalKeys++;
      if (esObj && enObj[key] === esObj[key]) {
        matchingKeys++;

        // Check if this SHOULD be translated
        const value = enObj[key];
        const needsTranslation =
          value !== 'Error' &&
          value !== 'Chat' &&
          value !== 'No' &&
          value !== 'Total' &&
          value !== 'Club' &&
          value !== 'Casual' &&
          value !== 'Social' &&
          value !== 'General' &&
          value !== 'Normal' &&
          value !== 'Manual' &&
          value !== 'Final' &&
          value !== 'Global' &&
          value !== 'Admin' &&
          value !== 'Set' &&
          value !== 'AM' &&
          value !== 'PM' &&
          value !== 'Venmo' &&
          value !== 'Rec' &&
          value !== 'Playoffs' &&
          value !== '' &&
          !value.includes('{{') && // Template variables
          !value.match(/^\d/) && // Numbers
          !value.includes('中文') && // Other languages
          !value.includes('日本語') &&
          !value.includes('Español') &&
          !value.includes('Français') &&
          !/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(value); // Names like "Junsu Kim"

        if (needsTranslation) {
          shouldTranslate.push({ path: currentPath, value });
        }
      } else {
        translatedKeys++;
      }
    }
  }
}

compare(en, es);

console.log('=== TRANSLATION PROGRESS ===\n');
console.log(`Total keys: ${totalKeys}`);
console.log(`Translated (different from EN): ${translatedKeys}`);
console.log(`Matching EN (same value): ${matchingKeys}`);
console.log(`Translation rate: ${((translatedKeys / totalKeys) * 100).toFixed(1)}%`);

console.log(`\n=== KEYS THAT SHOULD BE TRANSLATED (${shouldTranslate.length}) ===\n`);
shouldTranslate.forEach(({ path, value }) => {
  console.log(`  "${path}": "${value}"`);
});
