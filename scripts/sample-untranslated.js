const fs = require('fs');

function find(en, ru, prefix = '', results = []) {
  for (const key in en) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof en[key] === 'object' && !Array.isArray(en[key]) && en[key] !== null) {
      find(en[key], ru[key] || {}, fullKey, results);
    } else if (typeof en[key] === 'string' && (!ru[key] || ru[key] === en[key])) {
      results.push(en[key]);
    }
  }
  return results;
}

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const ru = JSON.parse(fs.readFileSync('src/locales/ru.json', 'utf8'));

const untranslated = find(en, ru);
const samples = [...new Set(untranslated)].slice(0, 100);

console.log(`Total untranslated: ${untranslated.length}`);
console.log(`Unique strings: ${new Set(untranslated).size}\n`);
console.log('Sample of 100 unique untranslated strings:\n');
samples.forEach((s, i) => console.log(`${i + 1}. ${s}`));
