const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const ru = JSON.parse(fs.readFileSync('src/locales/ru.json', 'utf8'));

function findUntranslated(enObj, ruObj, currentPath = '') {
  const result = [];
  for (const key in enObj) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    const enValue = enObj[key];
    const ruValue = ruObj[key];
    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      result.push(...findUntranslated(enValue, ruValue || {}, fullPath));
    } else if (typeof enValue === 'string' && (!ruValue || ruValue === enValue)) {
      result.push({ path: fullPath, en: enValue });
    }
  }
  return result;
}

const untranslated = findUntranslated(en, ru);
console.log('Sample untranslated keys (every 100th):\n');
const samples = untranslated.filter((_, i) => i % 100 === 0).slice(0, 20);
samples.forEach(item => {
  console.log(`${item.path}: "${item.en}"`);
});
