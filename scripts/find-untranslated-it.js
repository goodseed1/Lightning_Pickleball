const it = require('../src/locales/it.json');
const en = require('../src/locales/en.json');

function findUntranslated(obj, enObj, path = '') {
  const results = [];

  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      results.push(...findUntranslated(obj[key], enObj[key] || {}, currentPath));
    } else if (typeof obj[key] === 'string' && obj[key] === enObj[key]) {
      results.push({ path: currentPath, value: obj[key] });
    }
  }

  return results;
}

const untranslated = findUntranslated(it, en);
console.log(`Found ${untranslated.length} untranslated keys:\n`);
untranslated.forEach(item => {
  console.log(`${item.path}: "${item.value}"`);
});
