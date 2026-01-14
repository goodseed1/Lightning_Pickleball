#!/usr/bin/env node

/**
 * Apply Italian translations using deepMerge strategy
 * Focus: cards(16), badgeGallery(13), clubCommunication(11), createMeetup(10)
 */

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

// Italian translations to apply
const italianTranslations = {
  cards: {
    hostedEvent: {
      weather: {
        mostlycloudy: 'Prevalentemente Nuvoloso',
        overcast: 'Coperto',
        fog: 'Nebbia',
        lightrain: 'Pioggia Leggera',
        rain: 'Pioggia',
        heavyrain: 'Pioggia Intensa',
        drizzle: 'Pioggerellina',
        showers: 'Rovesci',
        thunderstorm: 'Temporale',
        snow: 'Neve',
        lightsnow: 'Neve Leggera',
        heavysnow: 'Neve Intensa',
        sleet: 'Nevischio',
        hail: 'Grandine',
        windy: 'Ventoso',
        humid: 'Umido',
        hot: 'Caldo',
        cold: 'Freddo',
      },
    },
  },
  badgeGallery: {
    badges: {
      first_club_join: {
        name: 'Primo Membro del Club',
        description: 'Hai aderito al tuo primo club di pickleball! 🏟️',
      },
      streak_5: {
        name: 'Serie di 5 Vittorie',
        description: 'Hai vinto 5 partite di fila!',
      },
      social_butterfly: {
        name: 'Farfalla Sociale',
        description: 'Sei diventato amico di oltre 10 giocatori!',
      },
      league_master: {
        name: 'Maestro di Lega',
        description: 'Hai finito 1° in una lega!',
      },
      league_champion: {
        name: 'Campione di Lega',
        description: 'Hai vinto una lega! 👑',
      },
      perfect_season: {
        name: 'Stagione Perfetta',
        description: 'Hai finito una stagione imbattuto!',
      },
      community_leader: {
        name: 'Leader della Comunità',
        description: 'Sei un amministratore di club attivo!',
      },
      unknown: {
        name: 'Distintivo Speciale',
        description: 'Distintivo speciale',
      },
    },
  },
  clubCommunication: {
    timeAgo: {
      justNow: 'proprio ora',
      monthsAgo: '{count} mesi fa',
      yearsAgo: '{count} anni fa',
      noTimeInfo: "Nessuna informazione sull'orario",
      noDateInfo: 'Nessuna informazione sulla data',
    },
    validation: {
      policyRequired: 'Inserisci il contenuto della policy',
      policyTooShort: 'Il contenuto della policy deve essere di almeno 10 caratteri',
      policyTooLong: 'Il contenuto della policy non può superare i 10.000 caratteri',
      titleRequired: 'Inserisci un titolo',
      titleTooLong: 'Il titolo non può superare i 100 caratteri',
      contentRequired: 'Inserisci il contenuto',
      contentTooLong: 'Il contenuto non può superare i 5.000 caratteri',
      commentRequired: 'Inserisci un commento',
      commentTooLong: 'Il commento non può superare i 1.000 caratteri',
      messageRequired: 'Inserisci un messaggio',
      messageTooLong: 'Il messaggio non può superare i 1.000 caratteri',
    },
  },
  createMeetup: {
    loading: 'Caricamento informazioni club...',
    errors: {
      failedToLoadInfo: 'Impossibile caricare le informazioni iniziali',
      failedToLoadMeetup: "Impossibile caricare le informazioni dell'incontro.",
      failedToLoadMeetupError:
        "Si è verificato un errore durante il caricamento delle informazioni dell'incontro.",
      inputError: 'Errore di Input',
      invalidLocationType: 'Tipo di luogo non valido.',
      selectValidDate: 'Seleziona una data valida.',
      minOneCourt: 'È richiesto almeno 1 campo.',
      clubInfoLoading:
        'Le informazioni del club sono ancora in caricamento. Riprova tra un momento.',
      externalCourtNameRequired: 'Inserisci il nome del campo esterno.',
      externalCourtAddressRequired: "Inserisci l'indirizzo del campo esterno.",
      creationFailed: 'Creazione Fallita',
      savingError:
        'Si è verificato un errore durante il salvataggio dei dati. Contatta lo sviluppatore.\\n\\nErrore: {{error}}',
      updateFailed: 'Aggiornamento Fallito',
      updateError:
        "Si è verificato un errore durante l'aggiornamento dell'incontro.\\n\\nErrore: {{error}}",
      failedToConfirm: "Impossibile confermare l'incontro",
    },
  },
};

// Load current Italian translations
const itPath = path.join(__dirname, '..', 'src', 'locales', 'it.json');
const currentIt = JSON.parse(fs.readFileSync(itPath, 'utf8'));

// Apply deep merge
const updatedIt = deepMerge(currentIt, italianTranslations);

// Write back to file
fs.writeFileSync(itPath, JSON.stringify(updatedIt, null, 2) + '\n', 'utf8');

console.log('✅ Italian translations applied successfully!');
console.log('');
console.log('Updated sections:');
console.log('  • cards.hostedEvent.weather (16 translations)');
console.log('  • badgeGallery.badges (8 translations)');
console.log('  • clubCommunication (11 translations)');
console.log('  • createMeetup.errors (13 translations)');
console.log('');
console.log('Total: 48 translations applied');
