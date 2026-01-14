const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const jaPath = path.join(__dirname, '../src/locales/ja.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

function countKeys(obj, count = 0) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count = countKeys(obj[key], count);
    } else {
      count++;
    }
  }
  return count;
}

function findUntranslated(enObj, jaObj, pathStr = '', results = []) {
  for (const key in enObj) {
    const currentPath = pathStr ? `${pathStr}.${key}` : key;
    const enValue = enObj[key];
    const jaValue = jaObj?.[key];
    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      findUntranslated(enValue, jaValue || {}, currentPath, results);
    } else if (jaValue === enValue || jaValue === undefined) {
      results.push(currentPath);
    }
  }
  return results;
}

const totalKeys = countKeys(en);
const untranslated = findUntranslated(en, ja);
const translated = totalKeys - untranslated.length;
const progress = ((translated / totalKeys) * 100).toFixed(1);

console.log('\n📊 JAPANESE TRANSLATION STATUS\n');
console.log(`Total keys: ${totalKeys}`);
console.log(`Translated: ${translated} (${progress}%)`);
console.log(`Remaining: ${untranslated.length}`);
console.log('\n✨ Great progress!\n');
