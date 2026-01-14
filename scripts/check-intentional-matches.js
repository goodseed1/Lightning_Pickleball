const it = require('../src/locales/it.json');
const en = require('../src/locales/en.json');

// Keys that SHOULD match English (universal terms)
const intentionalMatches = [
  'OK',
  'Email',
  'Password',
  'Logo',
  'Chat',
  'Online',
  'Admin',
  'Staff',
  'Manager',
  'Venmo',
  'Set',
  'Feed',
  'Post',
  'Partner',
  'Home',
  'Privacy',
  'AM',
  'PM',
  '한국어',
  'English',
  '中文',
  '日本語',
  'Español',
  'Français',
];

function findUntranslated(obj, enObj, path = '') {
  const results = [];

  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      results.push(...findUntranslated(obj[key], enObj[key] || {}, currentPath));
    } else if (typeof obj[key] === 'string' && obj[key] === enObj[key]) {
      // Check if this is an intentional match
      const isIntentional = intentionalMatches.some(term => obj[key].includes(term));
      if (!isIntentional && !obj[key].includes('{{')) {
        results.push({ path: currentPath, value: obj[key] });
      }
    }
  }

  return results;
}

const untranslated = findUntranslated(it, en);
console.log(`Found ${untranslated.length} keys that need real translation:`);
untranslated.forEach(item => {
  console.log(`${item.path}: "${item.value}"`);
});
