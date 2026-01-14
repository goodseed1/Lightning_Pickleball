const de = require('../src/locales/de.json');
const en = require('../src/locales/en.json');

const sections = [
  'clubLeaguesTournaments',
  'createEvent',
  'recordScore',
  'aiMatching',
  'duesManagement',
];

sections.forEach(section => {
  console.log('\n=== ' + section + ' ===');
  const deSection = de[section] || {};
  const enSection = en[section] || {};

  Object.keys(enSection).forEach(key => {
    if (deSection[key] === enSection[key] || !deSection[key]) {
      console.log(key + ': ' + JSON.stringify(enSection[key]));
    }
  });
});
