const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '../src/locales/fr.json');
const enPath = path.join(__dirname, '../src/locales/en.json');

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Helper to find where fr === en
function findMatches(frObj, enObj, path = '') {
  const matches = [];
  for (const key in frObj) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof frObj[key] === 'object' && frObj[key] !== null && !Array.isArray(frObj[key])) {
      matches.push(...findMatches(frObj[key], enObj[key] || {}, currentPath));
    } else if (frObj[key] === enObj[key] && typeof frObj[key] === 'string') {
      matches.push({ path: currentPath, value: frObj[key] });
    }
  }
  return matches;
}

// Check specific sections
const sections = ['clubDuesManagement', 'performanceDashboard', 'discover', 'hostedEventCard'];
sections.forEach(section => {
  console.log(`\n=== ${section} ===`);
  const matches = findMatches(fr[section] || {}, en[section] || {}, section);
  console.log(`Found ${matches.length} untranslated strings`);
  matches.forEach(m => console.log(`  - ${m.path}: "${m.value}"`));
});

// Output JSON for easy processing
console.log('\n\n=== JSON OUTPUT ===');
const allMatches = {};
sections.forEach(section => {
  allMatches[section] = findMatches(fr[section] || {}, en[section] || {}, section);
});
console.log(JSON.stringify(allMatches, null, 2));
