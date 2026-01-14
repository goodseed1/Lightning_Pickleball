const fs = require('fs');
const untranslated = JSON.parse(fs.readFileSync('temp-untranslated-keys.json', 'utf8'));

console.log('Total remaining:', Object.keys(untranslated).length);
console.log('\n=== ALL REMAINING KEYS ===\n');

// Group by section
const sections = {};
for (const key in untranslated) {
  const section = key.split('.')[0];
  if (!sections[section]) sections[section] = [];
  sections[section].push({ key, value: untranslated[key] });
}

// Show all sections
Object.entries(sections)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([section, items]) => {
    console.log(`\n=== ${section} (${items.length}) ===`);
    items.forEach(item => {
      console.log(`${item.key}: ${item.value}`);
    });
  });
