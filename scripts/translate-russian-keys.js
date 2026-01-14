/**
 * Find and translate remaining Russian keys that match English
 */
const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const ruPath = path.join(__dirname, '../src/locales/ru.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));

function findUntranslatedKeys(enObj, ruObj, prefix = '') {
  const untranslated = {};

  for (const key in enObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      const nested = findUntranslatedKeys(enObj[key], ruObj[key] || {}, fullKey);
      if (Object.keys(nested).length > 0) {
        untranslated[key] = nested;
      }
    } else {
      // Check if Russian translation is missing or same as English
      if (!ruObj[key] || ruObj[key] === enObj[key]) {
        untranslated[key] = enObj[key];
      }
    }
  }

  return untranslated;
}

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

const untranslated = findUntranslatedKeys(en, ru);

// Count by top-level section
console.log('\n=== Untranslated Keys by Section ===\n');
const sections = [];
for (const section in untranslated) {
  const count = countKeys(untranslated[section]);
  sections.push({ section, count });
}

sections.sort((a, b) => b.count - a.count);
sections.forEach(({ section, count }) => {
  console.log(`${section}: ${count} keys`);
});

console.log(`\nTotal untranslated: ${countKeys(untranslated)} keys`);

// Save to file for review
fs.writeFileSync(
  path.join(__dirname, 'untranslated-russian.json'),
  JSON.stringify(untranslated, null, 2)
);

console.log('\nSaved to: scripts/untranslated-russian.json');
