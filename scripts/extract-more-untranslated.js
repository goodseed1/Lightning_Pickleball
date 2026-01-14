const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const pt = JSON.parse(fs.readFileSync('src/locales/pt.json', 'utf8'));

function findUntranslatedKeys(enObj, ptObj, path = '', results = {}) {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      findUntranslatedKeys(enObj[key], ptObj[key] || {}, currentPath, results);
    } else if (enObj[key] === ptObj[key]) {
      results[currentPath] = enObj[key];
    }
  }

  return results;
}

const sections = [
  'services',
  'duesManagement',
  'clubLeaguesTournaments',
  'leagueDetail',
  'clubTournamentManagement',
];

for (const section of sections) {
  if (en[section] && pt[section]) {
    const untranslated = findUntranslatedKeys(en[section], pt[section], section);
    const keys = Object.keys(untranslated);

    console.log(`\n=== ${section} (${keys.length} keys) ===\n`);

    keys.forEach((key, index) => {
      if (index < 100) {
        // Show first 100 keys per section
        console.log(`"${key}": "${untranslated[key]}",`);
      }
    });
  }
}
