const fs = require('fs');
const path = require('path');

const itPath = path.join(__dirname, '../src/locales/it.json');
const itData = JSON.parse(fs.readFileSync(itPath, 'utf8'));

// Part 1: Common, Auth, CreateClub, ClubList, ScheduleMeetup
const translations = {
  common: {
    no: 'No',
    ok: 'OK',
  },
  auth: {
    email: 'Email',
    password: 'Password',
    register: {
      termsComingSoon: 'Prossimamente',
      termsComingSoonMessage: 'I Termini di Servizio saranno disponibili a breve.',
      privacyComingSoon: 'Prossimamente',
      privacyComingSoonMessage: 'La Privacy Policy sarà disponibile a breve.',
      errors: {
        title: 'Errore',
        nameRequired: 'Inserisci il tuo nome.',
        nameMinLength: 'Il nome deve contenere almeno 2 caratteri.',
        emailRequired: 'Inserisci la tua email.',
        emailInvalid: 'Inserisci un formato email valido.',
        passwordRequired: 'Inserisci la tua password.',
        passwordMinLength: 'La password deve contenere almeno 8 caratteri.',
        passwordComplexity: 'La password deve includere maiuscole, minuscole e numeri.',
        passwordMismatch: 'Le password non corrispondono.',
        termsRequired: 'Accetta i Termini di Servizio.',
        privacyRequired: 'Accetta la Privacy Policy.',
        signupFailed: 'Registrazione Fallita',
        signupFailedMessage: 'Registrazione fallita.',
        emailInUse: 'Questa email è già in uso.',
        invalidEmailFormat: 'Formato email non valido.',
        operationNotAllowed: 'La registrazione email è disabilitata.',
        weakPassword: 'La password è troppo debole.',
        unknown: 'Si è verificato un errore sconosciuto.',
      },
      success: {
        title: 'Registrazione Completata',
        message: "Registrazione completata. Configura il tuo profilo attraverso l'onboarding.",
        ok: 'OK',
      },
    },
  },
  createClub: {
    facility: {
      indoor: 'Al Coperto',
      proshop: 'Pro Shop',
    },
    fields: {
      address_label: 'Indirizzo Campo da Pickleball',
      address_search_placeholder: 'Cerca indirizzo campo da pickleball',
      name_placeholder: 'es., Circolo Pickleball Duluth Coreano',
      intro_placeholder:
        "Descrivi gli obiettivi, l'atmosfera e le caratteristiche uniche del tuo club",
      fee_placeholder: 'es., 50',
      rules_placeholder: `es.:
• Mantenere presenza del 70%+ agli incontri regolari
• Mostrare rispetto e cortesia reciproca
• Pulire dopo l'uso delle strutture`,
      meet_day: 'Giorno',
      meet_time: 'Ora',
      meet_note: 'Nota',
      fee: 'Quota Associativa',
      rules: 'Regole / Etichetta',
      logo: 'Logo',
    },
    cta: 'Crea Club',
    editTitle: 'Impostazioni Club',
    hints: {
      public_club:
        'I club pubblici permettono ad altri utenti di cercare e candidarsi come membri.',
    },
    validation: {
      nameRequired: 'Inserisci un nome per il club',
      nameMin: 'Il nome del club deve contenere almeno 2 caratteri',
      nameMax: 'Il nome del club non può superare i 30 caratteri',
      nameValid: 'Ottimo nome! ✅',
      descRequired: 'Scrivi una descrizione del club',
      descMin:
        'La descrizione deve contenere almeno 10 caratteri (attualmente {{count}} caratteri)',
      descMax: 'La descrizione non può superare i 200 caratteri',
      descValid: 'Ottima descrizione! ✅',
      descShort: 'Scrivi una descrizione del club più dettagliata',
      addressRequired: "Inserisci l'indirizzo del campo",
      addressValid: 'Indirizzo impostato ✅',
      meetingsRequired: 'Aggiungi almeno un orario di incontro',
      meetingsValid: '{{count}} incontro/i configurato/i ✅',
    },
    alerts: {
      limitTitle: '🏛️ Limite Creazione Club',
      limitMessage: `Ogni utente può creare un massimo di {{max}} club.

Attualmente possiedi {{current}} club.

Per creare più club, contatta l'amministratore tramite il chatbot assistente AI nella parte inferiore dell'app.`,
      saveSuccess: '✅ Salvato!',
      saveSuccessMessage: 'Le informazioni del club {{name}} sono state salvate.',
      saveFailed: 'Salvataggio Fallito',
      createSuccess: '🎉 Club Creato!',
      createSuccessMessage: 'Il club {{name}} è stato creato con successo.',
      createFailed: 'Creazione Club Fallita',
    },
  },
  clubList: {
    searchPlaceholder: 'Cerca club',
    peopleCount: ' membri',
    skillLevel: {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzato',
      all: 'Tutti i Livelli',
    },
    clubType: {
      casual: 'Informale',
      competitive: 'Competitivo',
      social: 'Sociale',
    },
    fees: {
      joinFee: 'Quota di Iscrizione',
      monthlyFee: 'Quota Mensile',
    },
    actions: {
      favorite: 'Aggiungi ai Preferiti',
      viewDetails: 'Visualizza Dettagli',
      createClub: 'Crea Club',
    },
    emptyState: {
      noJoinedClubs: 'Nessun club iscritto',
      noSearchResults: 'Nessun risultato',
      noNearbyClubs: 'Nessun club nelle vicinanze',
      joinNewClub: 'Iscriviti a un nuovo club!',
      tryDifferentSearch: 'Prova un termine di ricerca diverso',
      createNewClub: 'Crea un nuovo club!',
    },
    filters: {
      all: 'Tutti',
      nearby: 'Vicini',
      joined: 'Club Iscritti',
    },
  },
  scheduleMeetup: {
    subtitle: 'Gli eventi vengono creati automaticamente ogni settimana',
    loading: 'Caricamento incontri regolari...',
    addMeeting: 'Aggiungi Incontro',
    days: {
      sunday: 'Domenica',
      monday: 'Lunedì',
      tuesday: 'Martedì',
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: 'Sabato',
    },
    status: {
      active: 'Attivo',
    },
    form: {
      title: 'Aggiungi Nuovo Incontro Regolare',
      meetingName: 'Nome Incontro *',
      meetingNamePlaceholder: 'es., Pratica Singolare Weekend',
      location: 'Posizione *',
      locationPlaceholder: 'es., Campi da Pickleball Central Park',
      repeatDay: 'Ripeti Giorno',
      startTime: 'Ora Inizio',
      endTime: 'Ora Fine',
    },
    dayPicker: {
      title: 'Seleziona Giorno',
    },
    alert: {
      title: 'Avviso',
      success: 'Successo',
    },
    errors: {
      loadFailed: 'Impossibile caricare gli incontri regolari.',
      requiredFields: "Inserisci nome e posizione dell'incontro.",
      invalidTime: "L'ora di fine deve essere successiva all'ora di inizio.",
      createFailed: "Si è verificato un errore durante la creazione dell'incontro.",
      deleteFailed: "Si è verificato un errore durante l'eliminazione dell'incontro.",
    },
    success: {
      created: "L'incontro regolare è stato creato.",
      deleted: "L'incontro regolare è stato eliminato.",
    },
    delete: {
      title: 'Elimina Incontro Regolare',
      confirmMessage: `Sei sicuro di voler eliminare l'incontro regolare "{{title}}"?

L'eliminazione interromperà la generazione automatica degli eventi.`,
    },
    emptyState: {
      title: 'Nessun incontro regolare configurato',
      description: `Quando aggiungi un incontro regolare, gli eventi verranno
creati automaticamente ogni settimana`,
      action: 'Aggiungi il Tuo Primo Incontro Regolare',
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

// Apply translations
const updatedItData = deepMerge(itData, translations);

// Write back to file
fs.writeFileSync(itPath, JSON.stringify(updatedItData, null, 2), 'utf8');

console.log('✅ Italian translations Part 1 applied successfully!');
console.log('📦 Sections: common, auth, createClub, clubList, scheduleMeetup');
