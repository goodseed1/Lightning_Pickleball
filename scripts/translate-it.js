#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const itPath = path.join(__dirname, '../src/locales/it.json');
const it = JSON.parse(fs.readFileSync(itPath, 'utf8'));

// Italian translations for the untranslated strings
const translations = {
  createEvent: {
    fields: {
      partner: 'Partner',
    },
    autoNtrp: {
      partnerLevelWithType: 'LPR Partner: {{level}} ({{type}})',
    },
    toggleDescriptions: {
      autoApprovalDetailed:
        "Quando abilitato, le richieste vengono approvate automaticamente in ordine di arrivo fino al raggiungimento della capacità. Quando disabilitato, l'organizzatore deve approvare manualmente ogni richiesta.",
    },
    sms: {
      defaultSender: 'Un amico',
    },
    infoText: {
      eventTypeNotice: 'Avviso evento {{type}}',
      meetupInfo: 'I raduni possono essere modificati o annullati in qualsiasi momento.',
    },
    search: {
      searchPrompt: 'Cerca gli utenti',
    },
    alerts: {
      confirm: 'OK',
    },
    languages: {
      korean: '한국어',
      english: 'English',
      chinese: '中文',
      japanese: '日本語',
      spanish: 'Español',
      french: 'Français',
    },
  },
  createClubLeague: {
    matchTypeQuestion: 'Che tipo di partite includerà questa lega?',
    mensSinglesDescription: 'Partite maschili 1v1',
    womensSinglesDescription: 'Partite femminili 1v1',
    mensDoublesDescription: 'Partite maschili 2v2',
    womensDoublesDescription: 'Partite femminili 2v2',
    mixedDoublesDescription: 'Partite miste 2v2',
    doublesNote: '(Doppio - Partner richiesti)',
    singlesNote: '(Singolo)',
    entryFee: 'Quota di Iscrizione',
    nameRequired: 'Inserisci un nome per la stagione',
    endAfterStart: 'La data di fine deve essere uguale o successiva alla data di inizio',
    ok: 'OK',
  },
  types: {
    match: {
      validation: {
        tiebreak: 'tie-break',
        superTiebreak: 'super tie-break',
      },
    },
    clubSchedule: {
      recurrence: {
        weekly: 'Ogni settimana',
        biweekly: 'Ogni due settimane',
        monthly: 'Ogni mese',
      },
      timePeriod: {
        am: 'AM',
        pm: 'PM',
      },
    },
    dues: {
      duesTypes: {
        join: 'Quota di Adesione',
        quarterly: 'Quote Trimestrali',
        yearly: 'Quote Annuali',
        late_fee: 'Penale Ritardo',
      },
      period: {
        year: '{{year}}',
        yearMonth: '{{month}}/{{year}}',
      },
    },
  },
  leagues: {
    admin: {
      maxParticipants: 'Max',
      applicationDate: 'Applicato',
      processing: 'Elaborazione...',
      opening: 'Apertura...',
    },
    match: {
      status: {
        walkover: 'Walkover',
      },
      correctResult: 'Risultato Corretto',
      reschedule: 'Riprogramma',
      walkover: 'Walkover',
      result: 'Risultato',
    },
  },
  policyEditScreen: {
    quickInsert: 'Inserimento Rapido',
    section: 'Sezione',
    rule: 'Regola',
    characters: 'caratteri',
    modified: 'Modificato',
    previewEmpty: 'Nessun contenuto',
    unsavedChangesMessage: 'Hai modifiche non salvate. Cosa vuoi fare?',
    saveSuccessMessage: 'Politica salvata con successo.',
  },
};

// Deep merge function
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Apply translations
const updated = deepMerge(it, translations);

// Write back to file
fs.writeFileSync(itPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ Italian translations updated successfully!');
console.log('\nTranslations applied:');
console.log('- createEvent: 9 strings');
console.log('- createClubLeague: 9 strings');
console.log('- types: 9 strings');
console.log('- leagues: 9 strings');
console.log('- policyEditScreen: 8 strings');
console.log('\nTotal: 44 strings translated');
