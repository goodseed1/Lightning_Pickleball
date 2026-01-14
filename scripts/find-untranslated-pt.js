const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const pt = JSON.parse(fs.readFileSync('src/locales/pt.json', 'utf8'));

function findUntranslated(enObj, ptObj, path = '') {
  let count = 0;
  const keys = [];

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      const result = findUntranslated(enObj[key], ptObj[key] || {}, currentPath);
      count += result.count;
      keys.push(...result.keys);
    } else if (enObj[key] === ptObj[key]) {
      count++;
      keys.push(currentPath);
    }
  }

  return { count, keys };
}

// Check top sections
const topSections = [
  'services',
  'duesManagement',
  'clubLeaguesTournaments',
  'leagueDetail',
  'clubTournamentManagement',
];

console.log('=== UNTRANSLATED KEYS BY SECTION ===\n');

for (const section of topSections) {
  if (en[section] && pt[section]) {
    const result = findUntranslated(en[section], pt[section], section);
    console.log(`${section}: ${result.count} untranslated keys`);

    // Show first 10 keys
    if (result.keys.length > 0) {
      console.log('Sample keys:');
      result.keys.slice(0, 10).forEach(key => {
        console.log(`  - ${key}`);
      });
    }
    console.log('---\n');
  }
}

// Total count
const totalResult = findUntranslated(en, pt);
console.log(`\n=== TOTAL UNTRANSLATED: ${totalResult.count} keys ===`);
