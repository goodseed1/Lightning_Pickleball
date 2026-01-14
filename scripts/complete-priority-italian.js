#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Deep merge utility
function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Remaining Italian translations for priority sections
const italianTranslations = {
  badgeGallery: {
    badges: {
      winning_streak_3: {
        name: 'Serie Vincente',
        description: 'Vinci 3 partite di fila',
      },
      winning_streak_5: {
        name: 'In Fiamme',
        description: 'Vinci 5 partite di fila',
      },
      winning_streak_10: {
        name: 'Inarrestabile',
        description: 'Vinci 10 partite di fila',
      },
      match_milestone_10: {
        name: 'Primi Passi',
        description: 'Gioca 10 partite',
      },
    },
  },
  createMeetup: {
    success: {
      copied: "L'incontro è stato copiato!",
      updated: "L'incontro è stato aggiornato!",
      confirmed: 'Incontro confermato e membri notificati!',
    },
    notes: {
      copyDateChangeable: "💡 Puoi cambiare la data dell'incontro copiato.",
      editNote: "Le informazioni dell'incontro verranno aggiornate.",
    },
    court: {
      courtNumbersPlaceholder: 'es., 3, 4, 5',
    },
    externalCourt: {
      name: 'Nome Campo',
      namePlaceholder: 'es., Park Pickleball Club',
      address: 'Indirizzo',
      addressPlaceholder: 'es., 123 Via Principale',
    },
    cost: {
      costPerCourt: 'Costo per Campo',
    },
  },
};

const itPath = path.join(__dirname, '..', 'src', 'locales', 'it.json');
const currentIt = JSON.parse(fs.readFileSync(itPath, 'utf8'));

const updatedIt = deepMerge(currentIt, italianTranslations);

fs.writeFileSync(itPath, JSON.stringify(updatedIt, null, 2) + '\n', 'utf8');

console.log('✅ Remaining priority Italian translations applied!');
console.log('\nCompleted:');
console.log('  • badgeGallery: 4 badge translations');
console.log('  • createMeetup: 10 additional translations');
console.log('\nTotal: 14 translations applied');
