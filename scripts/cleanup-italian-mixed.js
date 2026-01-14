#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const itPath = path.join(__dirname, '..', 'src', 'locales', 'it.json');
let content = fs.readFileSync(itPath, 'utf8');

// Fix mixed Italian/English translation
content = content.replace(
  '"created": "Nuovo meetup has been created!"',
  '"created": "Nuovo incontro creato!"'
);

fs.writeFileSync(itPath, content, 'utf8');

console.log('✅ Fixed mixed Italian/English translation');
console.log('  "Nuovo meetup has been created!" → "Nuovo incontro creato!"');
