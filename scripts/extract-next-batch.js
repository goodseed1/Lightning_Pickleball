#!/usr/bin/env node

const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const it = JSON.parse(fs.readFileSync('src/locales/it.json', 'utf8'));

function extract(enObj, itObj, path = '', results = {}) {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      extract(enObj[key], itObj[key] || {}, currentPath, results);
    } else {
      if (!itObj[key] || itObj[key] === enObj[key]) {
        results[currentPath] = enObj[key];
      }
    }
  }

  return results;
}

const sections = ['emailLogin', 'club', 'types', 'createClub', 'myActivities'];

sections.forEach(section => {
  if (en[section] && it[section]) {
    const untranslated = extract(en[section], it[section], section);
    const keys = Object.keys(untranslated).slice(0, 30);

    console.log(`\n===== ${section} =====`);
    keys.forEach(key => {
      console.log(`"${key}": "${untranslated[key]}",`);
    });
  }
});
