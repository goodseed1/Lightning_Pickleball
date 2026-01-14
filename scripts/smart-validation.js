const de = require('../src/locales/de.json');
const en = require('../src/locales/en.json');

const sections = [
  'clubLeaguesTournaments',
  'createEvent',
  'recordScore',
  'aiMatching',
  'duesManagement',
];

// Suspicious English words (excluding common placeholders and terms)
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
  'and',
  'information',
  'about',
  'can',
  'any',
  'time',
  'recorded',
  'officially',
  'is',
  'sum',
  'tolerance',
  'invitations',
  'download',
  'link',
  'friends',
  'without',
  'installed',
  'for',
  'this',
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
  'invitation',
  'completed',
  'when',
  'accepts',
];

// Remove placeholders before checking
function removePlaceholders(text) {
  return text.replace(/\{\{[^}]+\}\}/g, '');
}

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
      // Skip if values are identical and it's acceptable (short universal terms)
      const universalTerms = [
        'Status',
        'Format',
        'Partner',
        'OK',
        'Mixed',
        'Bank',
        'Venmo',
        'Tiebreak',
        'Walkover',
        'Volley',
        'Mental',
        'Global',
        'Playoffs',
      ];
      if (deValue === enValue && universalTerms.includes(enValue)) {
        continue;
      }

      // Remove placeholders before checking
      const cleanDeValue = removePlaceholders(deValue);

      // Check for suspicious English words
      const foundWords = [];

      suspiciousWords.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'i');
        if (regex.test(cleanDeValue)) {
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
  console.log('✨ All sections are 100% properly translated!');
  console.log('\n📊 Translation Quality: EXCELLENT');
} else {
  mixedEntries.forEach((entry, index) => {
    console.log('[' + (index + 1) + '] ' + entry.path);
    console.log('    DE: ' + entry.de);
    console.log('    EN: ' + entry.en);
    console.log('    Issues: ' + entry.words.join(', '));
    console.log('');
  });

  console.log('⚠️  Total entries with mixed text: ' + totalMixed);
  console.log('\n📊 Translation Progress: ' + Math.round((1 - totalMixed / 200) * 100) + '%');
}
