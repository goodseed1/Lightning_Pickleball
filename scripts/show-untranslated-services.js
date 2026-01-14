const fs = require('fs');
const enData = JSON.parse(fs.readFileSync('./src/locales/en.json', 'utf8'));
const zhData = JSON.parse(fs.readFileSync('./src/locales/zh.json', 'utf8'));

function findUntranslated(enObj, zhObj, path = '', results = []) {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      findUntranslated(enObj[key], zhObj[key] || {}, currentPath, results);
    } else {
      if (!zhObj[key] || zhObj[key] === enObj[key]) {
        results.push({ path: currentPath, en: enObj[key] });
      }
    }
  }
  return results;
}

const untranslated = findUntranslated(enData, zhData);
const bySection = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!bySection[section]) bySection[section] = [];
  bySection[section].push(item);
});

// Show items from top sections
['services', 'duesManagement', 'leagueDetail', 'clubTournamentManagement', 'types'].forEach(
  section => {
    console.log(`\n${section} (showing all):`);
    if (bySection[section]) {
      bySection[section].forEach(item => {
        console.log(`  ${item.path}: "${item.en}"`);
      });
    }
  }
);
