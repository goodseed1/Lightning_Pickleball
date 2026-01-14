const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const de = JSON.parse(fs.readFileSync('src/locales/de.json', 'utf8'));

// Find all untranslated keys with their English values
function findUntranslated(enObj, deObj, path = '') {
  const results = [];
  for (const key in enObj) {
    const p = path ? path + '.' + key : key;
    const enVal = enObj[key];
    const deVal = deObj ? deObj[key] : undefined;
    if (typeof enVal === 'object' && enVal !== null) {
      results.push(...findUntranslated(enVal, deVal, p));
    } else if (typeof enVal === 'string' && enVal === deVal && enVal.length > 2) {
      results.push({ path: p, en: enVal });
    }
  }
  return results;
}

const untranslated = findUntranslated(en, de);

// Group by top-level section
const grouped = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!grouped[section]) grouped[section] = [];
  grouped[section].push(item);
});

// Show first section's keys
const firstSection = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length)[0];
console.log(`\n=== ${firstSection} (${grouped[firstSection].length} untranslated keys) ===\n`);
grouped[firstSection].slice(0, 30).forEach(item => {
  console.log(`${item.path} = "${item.en}"`);
});

console.log(`\n... and ${grouped[firstSection].length - 30} more keys in ${firstSection}`);
console.log(`\nTotal sections with untranslated keys: ${Object.keys(grouped).length}`);
console.log(`Total untranslated keys: ${untranslated.length}`);
