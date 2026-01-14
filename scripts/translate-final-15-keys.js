#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File paths
const esPath = path.join(__dirname, '../src/locales/es.json');

// Read JSON file
const esJson = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Deep merge utility
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

// Final 15 translations
const translations = {
  common: {
    no: 'No', // Intentionally keep as "No" (same in Spanish)
  },

  activityTab: {
    no: 'No', // Intentionally keep as "No"
  },

  editClubPolicy: {
    no: 'No', // Intentionally keep as "No"
  },

  emailLogin: {
    title: {
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      verification: 'Verificación de Email',
    },
  },

  aiMatching: {
    mockData: {
      candidate1: {
        name: 'Junsu Kim', // Keep proper name as-is
      },
      candidate2: {
        name: 'Seoyeon Lee', // Keep proper name as-is
      },
    },
  },

  clubLeaguesTournaments: {
    memberPreLeagueStatus: {
      peopleUnit: ' personas', // Spanish suffix for count
    },
  },

  duesManagement: {
    countSuffix: ' personas', // Spanish suffix for member count
  },

  eventDetail: {
    participants: {
      count: ' participantes', // Spanish suffix for participant count
    },
  },

  lessonCard: {
    currencySuffix: '', // Keep empty (currency symbol goes before amount in Spanish)
  },

  meetupDetail: {
    editEvent: {
      durationUnit: 'min', // Abbreviation, keep as-is
    },
  },

  modals: {
    leagueCompleted: {
      points: 'pts', // Standard abbreviation
    },
  },

  tournamentDetail: {
    participantsSuffix: ' participantes', // Spanish suffix
  },
};

// Apply translations
console.log('\n📝 Applying final 15 translations...\n');
const updatedEs = deepMerge(esJson, translations);

// Write updated Spanish file
fs.writeFileSync(esPath, JSON.stringify(updatedEs, null, 2) + '\n', 'utf8');

console.log('✅ Final translations complete!');
console.log('📊 Updated keys:');
console.log('  - emailLogin.title: 3 keys');
console.log('  - Suffix fields: 4 keys');
console.log('  - Mock data names: 2 keys (kept as-is)');
console.log('  - "No" fields: 3 keys (same in Spanish)');
console.log('  - Other: 3 keys');
console.log(`\n📁 File updated: ${esPath}\n`);
