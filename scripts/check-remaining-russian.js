const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const ru = JSON.parse(fs.readFileSync('src/locales/ru.json', 'utf8'));

function findUntranslated(enObj, ruObj, path = '') {
  let untranslated = {};

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      if (typeof ruObj[key] === 'object' && ruObj[key] !== null) {
        const nested = findUntranslated(enObj[key], ruObj[key], currentPath);
        if (Object.keys(nested).length > 0) {
          if (!untranslated[key]) untranslated[key] = {};
          untranslated[key] = nested;
        }
      } else {
        untranslated[key] = enObj[key];
      }
    } else {
      if (ruObj[key] === enObj[key] || ruObj[key] === undefined) {
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

const untranslated = findUntranslated(en, ru);
fs.writeFileSync('untranslated-ru.json', JSON.stringify(untranslated, null, 2));

const sections = {};
for (const key in untranslated) {
  sections[key] = countKeys(untranslated[key]);
}

const sorted = Object.entries(sections).sort((a, b) => b[1] - a[1]);

console.log('Remaining untranslated keys by section:\n');
sorted.slice(0, 20).forEach(([section, count]) => {
  console.log(`  ${section}: ${count} keys`);
});

const total = sorted.reduce((sum, [, count]) => sum + count, 0);
console.log(`\nTotal remaining: ${total} keys`);
console.log(`Progress: ${(((1664 - total) / 1664) * 100).toFixed(1)}% complete`);
