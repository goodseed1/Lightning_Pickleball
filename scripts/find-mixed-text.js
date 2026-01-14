const de = require('../src/locales/de.json');
const en = require('../src/locales/en.json');

const sections = [
  'clubLeaguesTournaments',
  'createEvent',
  'recordScore',
  'aiMatching',
  'duesManagement',
];

function findMixedText(obj, enObj, path = '') {
  const issues = [];

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    const deValue = obj[key];
    const enValue = enObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      issues.push(...findMixedText(deValue || {}, enValue, currentPath));
    } else if (typeof enValue === 'string') {
      // Check if German value is missing, empty, or identical to English
      if (!deValue || deValue === '' || deValue === enValue) {
        issues.push({ path: currentPath, en: enValue, de: deValue || '(missing)' });
      }
      // Check for mixed English words in German text
      else if (typeof deValue === 'string' && deValue !== enValue) {
        const suspectWords = [
          'the',
          'after',
          'if',
          'there',
          'was',
          'which',
          'did',
          'not',
          'who',
          'showed',
          'up',
          'please',
          'will',
          'be',
          'automatically',
          'updated',
        ];
        const hasSuspectWords = suspectWords.some(word => {
          const regex = new RegExp('\\b' + word + '\\b', 'i');
          return regex.test(deValue);
        });
        if (hasSuspectWords) {
          issues.push({ path: currentPath, en: enValue, de: deValue, type: 'mixed' });
        }
      }
    }
  }

  return issues;
}

sections.forEach(section => {
  console.log('\n=== ' + section + ' ===');
  const issues = findMixedText(de[section] || {}, en[section] || {}, section);

  if (issues.length === 0) {
    console.log('✓ All keys properly translated');
  } else {
    issues.forEach(issue => {
      if (issue.type === 'mixed') {
        console.log(`[MIXED] ${issue.path}:`);
      } else {
        console.log(`[MISSING] ${issue.path}:`);
      }
      console.log(`  EN: ${issue.en}`);
      console.log(`  DE: ${issue.de}`);
    });
  }
});
