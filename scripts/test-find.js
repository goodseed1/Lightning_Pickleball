const fs = require('fs');
const path = require('path');

const koPath = path.join(__dirname, '..', 'src', 'locales', 'ko.json');
const data = JSON.parse(fs.readFileSync(koPath, 'utf8'));

function search(obj, currentPath = '') {
  for (const key in obj) {
    if (key === 'memberPreLeagueStatus') {
      console.log('Found at:', currentPath + key);
      console.log('Value keys:', Object.keys(obj[key]));
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      search(obj[key], currentPath + key + '.');
    }
  }
}

search(data);
