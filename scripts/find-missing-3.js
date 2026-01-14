const de = require('../src/locales/de.json');
const en = require('../src/locales/en.json');

const sections = [
  'clubLeaguesTournaments',
  'createEvent',
  'recordScore',
  'aiMatching',
  'duesManagement',
];

const missing = [];

function findMissing(obj, enObj, path = '', sectionName = '') {
  for (const key in enObj) {
    const currentPath = path ? path + '.' + key : key;
    const fullPath = sectionName ? sectionName + '.' + currentPath : currentPath;
    const deValue = obj[key];
    const enValue = enObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      findMissing(deValue || {}, enValue, currentPath, sectionName);
    } else if (typeof enValue === 'string') {
      if (!deValue || deValue === '') {
        missing.push({
          path: fullPath,
          en: enValue,
        });
      }
    }
  }
}

sections.forEach(section => {
  findMissing(de[section] || {}, en[section] || {}, '', section);
});

console.log('=== MISSING TRANSLATIONS ===\n');

if (missing.length === 0) {
  console.log('✅ No missing translations found!');
} else {
  missing.forEach((item, index) => {
    console.log('[' + (index + 1) + '] ' + item.path);
    console.log('    EN: "' + item.en + '"');
    console.log('');
  });

  console.log('Total missing: ' + missing.length);
}
