const de = require('../src/locales/de.json');
const en = require('../src/locales/en.json');

const sections = [
  'clubLeaguesTournaments',
  'createEvent',
  'recordScore',
  'aiMatching',
  'duesManagement',
];

// Suspicious English words that should not appear in German text
const suspiciousWords = [
  'after',
  'will',
  'be',
  'automatically',
  'updated',
  'the',
  'please',
  'select',
  'if',
  'there',
  'was',
  'which',
  'did',
  'not',
  'who',
  'showed',
  'up',
  'to',
  'configure',
  'following',
  'set',
  'these',
  'want',
  'enable',
  'have',
  'been',
  'found',
  'failed',
  'try',
  'again',
  'cannot',
  'open',
  'send',
  'manually',
  'from',
  'host',
  'and',
  'information',
  'about',
  'can',
  'any',
  'time',
  'recorded',
  'officially',
  'level',
  'is',
  'sum',
  'tolerance',
  'invitations',
  'app',
  'download',
  'link',
  'friends',
  'without',
  'installed',
  'for',
  'this',
  'type',
  'of',
  'record',
  'would',
  'like',
  'create',
  'member',
  'delete',
  'on',
  'each',
  'month',
  'date',
  'you',
  'must',
  'first',
  'your',
  'participation',
  'confirmed',
  'start',
  'soon',
  'application',
  'rejected',
  'compete',
  'with',
  'other',
  'players',
  'improve',
  'skills',
  'need',
  'wait',
  'admin',
  'approval',
  'applying',
  'team',
  'invitation',
  'sent',
  'completed',
  'when',
  'accepts',
];

let totalMixed = 0;
const mixedEntries = [];

function checkMixed(obj, enObj, path = '', sectionName = '') {
  for (const key in enObj) {
    const currentPath = path ? path + '.' + key : key;
    const fullPath = sectionName ? sectionName + '.' + currentPath : currentPath;
    const deValue = obj[key];
    const enValue = enObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      checkMixed(deValue || {}, enValue, currentPath, sectionName);
    } else if (typeof enValue === 'string' && typeof deValue === 'string') {
      // Skip if values are identical and short (likely proper nouns or universal terms)
      if (deValue === enValue && enValue.length < 20) {
        continue;
      }

      // Check for suspicious English words
      const lowerDeValue = deValue.toLowerCase();
      const foundWords = [];

      suspiciousWords.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'i');
        if (regex.test(deValue)) {
          foundWords.push(word);
        }
      });

      if (foundWords.length > 0) {
        totalMixed++;
        mixedEntries.push({
          path: fullPath,
          de: deValue,
          en: enValue,
          words: foundWords,
        });
      }
    }
  }
}

sections.forEach(section => {
  console.log('\n=== Checking ' + section + ' ===');
  const startCount = totalMixed;
  checkMixed(de[section] || {}, en[section] || {}, '', section);
  const sectionCount = totalMixed - startCount;

  if (sectionCount === 0) {
    console.log('✅ No mixed English/German text found');
  } else {
    console.log('⚠️  Found ' + sectionCount + ' entries with mixed text');
  }
});

console.log('\n\n=== DETAILED MIXED TEXT REPORT ===\n');

if (mixedEntries.length === 0) {
  console.log('🎉 PERFECT! No mixed English/German text found!');
  console.log('All sections are 100% properly translated!');
} else {
  mixedEntries.forEach((entry, index) => {
    console.log('[' + (index + 1) + '] ' + entry.path);
    console.log('    DE: ' + entry.de);
    console.log('    EN: ' + entry.en);
    console.log('    Suspicious words: ' + entry.words.join(', '));
    console.log('');
  });

  console.log('⚠️  Total entries with mixed text: ' + totalMixed);
}
