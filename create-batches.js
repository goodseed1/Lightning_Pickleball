const fs = require('fs');

// Generate batches
const untranslated = JSON.parse(fs.readFileSync('untranslated-keys.json', 'utf8'));

// Group by section
const sections = {};
untranslated.forEach(item => {
  const section = item.key.split('.')[0];
  if (!sections[section]) sections[section] = [];
  sections[section].push(item);
});

const topSections = [
  'admin',
  'createClubTournament',
  'myActivities',
  'aiMatching',
  'eventCard',
  'duesManagement',
  'discover',
  'createEvent',
  'hostedEventCard',
  'matches',
];

let batch1 = [];
topSections.forEach(section => {
  if (sections[section]) {
    batch1 = batch1.concat(sections[section]);
  }
});

console.log('Batch 1 (Top 10 sections): ' + batch1.length + ' keys');
console.log('Remaining: ' + (untranslated.length - batch1.length) + ' keys');

// Export batch 1
fs.writeFileSync('batch1-keys.json', JSON.stringify(batch1, null, 2));
console.log('Exported batch1-keys.json');
