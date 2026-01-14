#!/usr/bin/env node

/**
 * Script final pour les dernières traductions françaises nécessaires
 * Focus sur les VRAIES traductions manquantes (pas les termes universels)
 */

const fs = require('fs');
const path = require('path');

const FR_PATH = path.join(__dirname, '../src/locales/fr.json');
const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));

// Dernières traductions françaises nécessaires
// (Excluant les termes universels comme "Match", "Description", noms propres, etc.)
const finalTranslations = {
  // Champs vides qui doivent rester vides (unités de mesure spécifiques à la langue)
  clubLeaguesTournaments: {
    memberPreLeagueStatus: {
      peopleUnit: ' personnes', // Espace + "personnes" en français
    },
  },

  duesManagement: {
    countSuffix: '', // Pas de suffixe en français
  },

  tournamentDetail: {
    participantsSuffix: ' participants', // Espace + "participants"
  },

  eventDetail: {
    participants: {
      count: ' participants', // Espace + "participants"
    },
  },

  lessonCard: {
    currencySuffix: ' $', // Espace + symbole monétaire
  },

  // Termes qui DOIVENT être traduits (pas universels)
  duesManagement: {
    overview: {
      totalOwed: 'Total dû',
      totalPaid: 'Total payé',
    },
  },
};

// Deep merge function
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

console.log('🇫🇷 Application des dernières traductions françaises spécifiques...\n');

const updatedFr = deepMerge(fr, finalTranslations);

fs.writeFileSync(FR_PATH, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('✅ Traductions françaises finales appliquées !\n');
console.log('📝 Note: Les termes suivants restent identiques car ce sont:');
console.log('  - Termes universels: "Match", "Description", "Expert"');
console.log('  - Noms propres: "Junsu Kim", "Seoyeon Lee"');
console.log('  - Marques: "Venmo"');
console.log('  - Nombres/Codes: "2.0-3.0", "5.0+"');
console.log('  - Symboles/Langues: "한국어", "中文", "Français"\n');
