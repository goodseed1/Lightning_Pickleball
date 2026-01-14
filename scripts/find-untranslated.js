const en = require('../src/locales/en.json');
const fr = require('../src/locales/fr.json');

function findUntranslated(enObj, frObj, path = '') {
  const untranslated = [];

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      untranslated.push(...findUntranslated(enObj[key], frObj[key] || {}, currentPath));
    } else if (enObj[key] === frObj[key]) {
      untranslated.push({ path: currentPath, value: enObj[key] });
    }
  }

  return untranslated;
}

const untranslated = findUntranslated(en, fr);

// Group by section
const sections = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!sections[section]) sections[section] = [];
  sections[section].push(item);
});

console.log('=== UNTRANSLATED KEYS BY SECTION ===\n');
Object.entries(sections).forEach(([section, items]) => {
  console.log(`${section}: ${items.length} keys`);
  items.forEach(item => {
    console.log(`  ${item.path}: "${item.value}"`);
  });
  console.log();
});

console.log(`TOTAL: ${untranslated.length} keys`);
