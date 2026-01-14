const fs = require('fs');
const path = require('path');

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

// Real Italian translations for the 18 keys that need translation
const italianTranslations = {
  common: {
    no: 'No', // "No" is the same in Italian
  },
  units: {
    km: 'km', // Universal abbreviation
    mi: 'mi', // Universal abbreviation
  },
  meetupDetail: {
    editEvent: {
      durationUnit: 'min', // Universal abbreviation
    },
  },
  activityTab: {
    no: 'No',
  },
  pastEventCard: {
    host: 'Organizzatore', // "Host" = "Organizer" in Italian
  },
  tournamentDetail: {
    hallOfFame: "Albo d'oro", // "Hall of Fame" = "Golden Roll" in Italian
  },
  clubSelector: {
    club: 'Club', // "Club" is used in Italian
  },
  appliedEvents: {
    partnerInvite: 'compagno', // "partner" = "companion/partner" in Italian
  },
  eloTrend: {
    partnerInvite: 'compagno',
  },
  recordScore: {
    walkover: 'Vittoria a tavolino', // "Walkover" = "Victory by forfeit" in Italian
  },
  directChat: {
    club: 'Club',
  },
  clubDetail: {
    tabs: {
      hallOfFame: "Albo d'oro",
    },
  },
  scoreConfirmation: {
    walkover: 'Vittoria a tavolino',
  },
  leagues: {
    match: {
      status: {
        walkover: 'Vittoria a tavolino',
      },
      walkover: 'Vittoria a tavolino',
    },
  },
  hallOfFame: {
    title: "Albo d'oro",
  },
  editClubPolicy: {
    no: 'No',
  },
};

// Read existing Italian translations
const itPath = path.join(__dirname, '../src/locales/it.json');
const existingIt = JSON.parse(fs.readFileSync(itPath, 'utf8'));

// Merge translations
const updatedIt = deepMerge(existingIt, italianTranslations);

// Write back to file
fs.writeFileSync(itPath, JSON.stringify(updatedIt, null, 2), 'utf8');

console.log('Successfully applied real Italian translations!');
console.log('Updated 18 translation keys with proper Italian equivalents');
console.log('');
console.log('Translation details:');
console.log('- "Host" -> "Organizzatore"');
console.log('- "Hall of Fame" -> "Albo d\'oro" (Golden Roll)');
console.log('- "partner" -> "compagno" (companion/partner)');
console.log('- "Walkover" -> "Vittoria a tavolino" (Victory by forfeit)');
console.log('- Universal terms (No, km, mi, min, Club) kept as is');
