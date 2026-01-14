const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const jaPath = path.join(__dirname, '../src/locales/ja.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

function findUntranslated(enObj, jaObj, pathStr = '', results = []) {
  for (const key in enObj) {
    const currentPath = pathStr ? `${pathStr}.${key}` : key;
    const enValue = enObj[key];
    const jaValue = jaObj?.[key];
    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      findUntranslated(enValue, jaValue || {}, currentPath, results);
    } else if (jaValue === enValue || jaValue === undefined) {
      results.push({ path: currentPath, enValue: enValue, section: pathStr.split('.')[0] });
    }
  }
  return results;
}

const untranslated = findUntranslated(en, ja);
console.log('Total remaining:', untranslated.length);
console.log('\nNext 100 keys to translate:\n');
untranslated.slice(50, 150).forEach((k, i) => {
  console.log(`${i + 51}. ${k.path} = "${k.enValue}"`);
});
