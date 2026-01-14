#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '..', 'src', 'locales', 'fr.json');
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Fix skillLevel in matchRequest
if (fr.matchRequest) {
  fr.matchRequest.skillLevel = {
    beginner: 'Débutant',
    elementary: 'Élémentaire',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  };
}

// Save
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf8');

console.log('✅ Fixed matchRequest.skillLevel in French translations!');
