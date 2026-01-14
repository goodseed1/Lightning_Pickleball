const de = require('../src/locales/de.json');
const en = require('../src/locales/en.json');

const sections = [
  'clubLeaguesTournaments',
  'createEvent',
  'recordScore',
  'aiMatching',
  'duesManagement',
];

// Words that are acceptable to be the same in English and German
const universalWords = [
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
  'Lightning Match',
  'Lightning Meetup',
  'Match',
  '한국어',
  'English',
  '中文',
  '日本語',
  'Español',
  'Français',
  '', // Empty strings
  'Junsu Kim',
  'Seoyeon Lee',
  'Minjae Park', // Names
];

let totalIssues = 0;
let realIssues = 0;

sections.forEach(section => {
  console.log('\n=== ' + section + ' ===');
  const deSection = de[section] || {};
  const enSection = en[section] || {};

  let sectionIssues = 0;

  Object.keys(enSection).forEach(key => {
    const deVal = deSection[key];
    const enVal = enSection[key];

    if (!deVal || deVal === enVal || (typeof deVal === 'string' && deVal.trim() === '')) {
      totalIssues++;

      // Check if this is acceptable
      const isUniversal = universalWords.includes(enVal);

      if (!isUniversal) {
        console.log('[NEEDS TRANSLATION] ' + key + ': "' + enVal + '"');
        sectionIssues++;
        realIssues++;
      }
    }
  });

  if (sectionIssues === 0) {
    console.log('✅ All keys properly translated or use universal terms');
  }
});

console.log('\n\n=== SUMMARY ===');
console.log('Total keys checked: ' + totalIssues);
console.log('Real issues requiring translation: ' + realIssues);
console.log('Universal/acceptable terms: ' + (totalIssues - realIssues));

if (realIssues === 0) {
  console.log('\n🎉 100% COMPLETE! All sections properly translated!');
} else {
  console.log('\n⚠️  Still need to translate ' + realIssues + ' keys');
}
