const fs = require('fs');
const path = require('path');

// Read locale files
const enPath = path.join(__dirname, '../src/locales/en.json');
const jaPath = path.join(__dirname, '../src/locales/ja.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

// Collect all untranslated keys
function findUntranslated(enObj, jaObj, path = '', results = []) {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    const enValue = enObj[key];
    const jaValue = jaObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      findUntranslated(enValue, jaValue || {}, currentPath, results);
    } else if (jaValue === enValue || jaValue === undefined) {
      // Either same value or missing - needs translation
      results.push({
        path: currentPath,
        enValue: enValue,
        section: path.split('.')[0],
      });
    }
  }
  return results;
}

const untranslated = findUntranslated(en, ja);

console.log(`\n🔍 Total untranslated keys: ${untranslated.length}\n`);

// Group by section
const bySectionMap = {};
untranslated.forEach(item => {
  const section = item.section || 'root';
  if (!bySectionMap[section]) {
    bySectionMap[section] = [];
  }
  bySectionMap[section].push(item);
});

// Show top sections needing translation
const sections = Object.keys(bySectionMap)
  .map(section => ({
    name: section,
    count: bySectionMap[section].length,
  }))
  .sort((a, b) => b.count - a.count);

console.log('📊 Top sections needing translation:\n');
sections.slice(0, 15).forEach((section, idx) => {
  console.log(`${idx + 1}. ${section.name}: ${section.count} keys`);
});

console.log('\n📋 Sample untranslated keys:\n');
untranslated.slice(0, 30).forEach(item => {
  console.log(`   ${item.path}: "${item.enValue}"`);
});

// Write detailed report
const reportPath = path.join(__dirname, 'untranslated-keys-report.json');
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      total: untranslated.length,
      sections: sections,
      keys: untranslated,
    },
    null,
    2
  ),
  'utf8'
);

console.log(`\n✅ Detailed report saved to: ${reportPath}\n`);
