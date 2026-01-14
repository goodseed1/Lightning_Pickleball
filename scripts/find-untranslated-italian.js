const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const itPath = path.join(__dirname, '../src/locales/it.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const it = JSON.parse(fs.readFileSync(itPath, 'utf8'));

function findUntranslated(enObj, itObj, currentPath = '') {
  const untranslated = {};

  for (const key in enObj) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      const nested = findUntranslated(enObj[key], itObj[key] || {}, fullPath);
      if (Object.keys(nested).length > 0) {
        untranslated[key] = nested;
      }
    } else if (itObj[key] === enObj[key]) {
      // Found untranslated key
      untranslated[key] = enObj[key];
    }
  }

  return untranslated;
}

const untranslated = findUntranslated(en, it);

// Count by section
const sectionCounts = {};
for (const section in untranslated) {
  const count = JSON.stringify(untranslated[section]).split('":').length - 1;
  sectionCounts[section] = count;
}

console.log('Untranslated keys by section:');
const sorted = Object.entries(sectionCounts).sort((a, b) => b[1] - a[1]);
sorted.forEach(([section, count]) => {
  console.log(`  ${section}: ${count}`);
});

console.log(`\nTotal sections: ${sorted.length}`);
console.log(`Total untranslated keys: ${sorted.reduce((sum, [, count]) => sum + count, 0)}`);

// Save untranslated structure to file for easier processing
fs.writeFileSync(
  path.join(__dirname, 'untranslated-italian.json'),
  JSON.stringify(untranslated, null, 2)
);

console.log('\nUntranslated structure saved to scripts/untranslated-italian.json');
