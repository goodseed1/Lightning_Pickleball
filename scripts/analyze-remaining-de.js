const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const de = JSON.parse(fs.readFileSync('src/locales/de.json', 'utf8'));

// Find remaining untranslated by section
const untranslatedBySect = {};

function findUntranslated(enObj, deObj, section = 'root') {
  for (const key in enObj) {
    const enValue = enObj[key];
    const deValue = deObj ? deObj[key] : undefined;

    if (enValue && typeof enValue === 'object' && !Array.isArray(enValue)) {
      findUntranslated(enValue, deValue || {}, key);
    } else if (typeof enValue === 'string') {
      if (!deValue || deValue === enValue) {
        if (!untranslatedBySect[section]) untranslatedBySect[section] = [];
        untranslatedBySect[section].push({ key, value: enValue });
      }
    }
  }
}

findUntranslated(en, de);

// Show top sections
const sorted = Object.entries(untranslatedBySect)
  .map(([section, items]) => ({ section, count: items.length }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 15);

console.log('Top 15 sections with untranslated keys:\n');
sorted.forEach(({ section, count }) => {
  console.log(`${section.padEnd(40)} ${count} keys`);
});

// Sample some untranslated keys
console.log(`\n\nSample untranslated keys from top section (${sorted[0].section}):`);
untranslatedBySect[sorted[0].section].slice(0, 10).forEach(({ key, value }) => {
  console.log(`  ${key}: "${value}"`);
});
