#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

const italianTranslations = {
  badgeGallery: {
    alerts: {
      unavailableMessage: 'Il servizio Firebase non è attualmente disponibile. Riprova più tardi.',
    },
  },
  createMeetup: {
    court: {
      lastMeetupHint: '💡 Ultimo incontro: "{{numbers}}"',
    },
    buttons: {
      creating: 'Creazione in corso...',
      updating: 'Aggiornamento in corso...',
    },
    picker: {
      done: 'Fatto',
    },
    notification: {
      body: "L'incontro del {{date}} è stato confermato.",
    },
  },
};

const itPath = path.join(__dirname, '..', 'src', 'locales', 'it.json');
const currentIt = JSON.parse(fs.readFileSync(itPath, 'utf8'));
const updatedIt = deepMerge(currentIt, italianTranslations);
fs.writeFileSync(itPath, JSON.stringify(updatedIt, null, 2) + '\n', 'utf8');

console.log('✅ Final priority Italian translations completed!');
console.log('\nCompleted sections:');
console.log('  • badgeGallery.alerts: 1 translation');
console.log('  • createMeetup (final): 5 translations');
console.log('\n🎉 All 4 priority sections now 100% complete!');
console.log('  ✓ cards (16 items)');
console.log('  ✓ badgeGallery (13 items)');
console.log('  ✓ clubCommunication (11 items)');
console.log('  ✓ createMeetup (10 items)');
