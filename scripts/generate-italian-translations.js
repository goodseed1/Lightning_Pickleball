const fs = require('fs');
const path = require('path');

const itPath = path.join(__dirname, '../src/locales/it.json');
const enPath = path.join(__dirname, '../src/locales/en.json');

const it = JSON.parse(fs.readFileSync(itPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Extract all untranslated keys with their English values
function extractUntranslated(itObj, enObj, path = []) {
  const untranslated = [];

  for (const key in itObj) {
    const currentPath = [...path, key];

    if (typeof itObj[key] === 'object' && itObj[key] !== null) {
      untranslated.push(...extractUntranslated(itObj[key], enObj[key] || {}, currentPath));
    } else if (typeof itObj[key] === 'string' && typeof enObj[key] === 'string') {
      if (itObj[key] === enObj[key]) {
        untranslated.push({
          path: currentPath.join('.'),
          en: enObj[key],
          section: currentPath[0],
        });
      }
    }
  }

  return untranslated;
}

const untranslated = extractUntranslated(it, en);

// Group by section
const bySection = {};
untranslated.forEach(item => {
  if (!bySection[item.section]) {
    bySection[item.section] = [];
  }
  bySection[item.section].push(item);
});

// Sort sections by count
const sections = Object.keys(bySection).sort((a, b) => bySection[b].length - bySection[a].length);

// Output format for easy copy-paste
console.log('='.repeat(80));
console.log('ITALIAN TRANSLATION QUEUE');
console.log('Total keys to translate:', untranslated.length);
console.log('='.repeat(80));
console.log('\n');

sections.forEach((section, idx) => {
  const keys = bySection[section];
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${idx + 1}. ${section.toUpperCase()} (${keys.length} keys)`);
  console.log('='.repeat(80));

  keys.forEach(item => {
    console.log(`\n${item.path}:`);
    console.log(`  EN: "${item.en}"`);
    console.log(`  IT: ""`);
  });
});

// Also save to file for reference
const outputPath = path.join(__dirname, 'italian-translations-needed.txt');
fs.writeFileSync(outputPath, JSON.stringify(bySection, null, 2));
console.log(`\n\nFull data saved to: ${outputPath}`);
