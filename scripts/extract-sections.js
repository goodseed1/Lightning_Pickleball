const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '../src/locales/fr.json');
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

const sections = ['clubDuesManagement', 'discover'];
sections.forEach(section => {
  console.log(`\n=== ${section} ===`);
  console.log(JSON.stringify(fr[section], null, 2));
});
