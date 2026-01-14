const fs = require('fs');

const untranslated = JSON.parse(fs.readFileSync('untranslated-ru.json', 'utf8'));

// Show samples from each major section
const sections = ['services', 'leagueDetail', 'duesManagement', 'emailLogin', 'createEvent'];

sections.forEach(section => {
  if (untranslated[section]) {
    console.log(`\n=== ${section} ===`);
    console.log(JSON.stringify(untranslated[section], null, 2).substring(0, 600));
    console.log('...\n');
  }
});
