#!/usr/bin/env node

/**
 * Italian Translation Script - FINAL ROUND
 * Complete all remaining translations
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const IT_PATH = path.join(__dirname, '../src/locales/it.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const it = JSON.parse(fs.readFileSync(IT_PATH, 'utf8'));

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

const italianTranslations = {
  // Complete remaining services translations
  services: {
    match: {
      created: 'Partita creata',
      updated: 'Partita aggiornata',
      deleted: 'Partita eliminata',
      joined: 'Partecipazione alla partita confermata',
      left: 'Hai lasciato la partita',
      cancelled: 'Partita annullata',
      completed: 'Partita completata',
      scored: 'Punteggio registrato',
    },
    club: {
      created: 'Club creato',
      updated: 'Club aggiornato',
      joined: 'Iscritto al club',
      left: 'Hai lasciato il club',
      memberAdded: 'Membro aggiunto',
      memberRemoved: 'Membro rimosso',
      roleUpdated: 'Ruolo aggiornato',
    },
    event: {
      created: 'Evento creato',
      updated: 'Evento aggiornato',
      deleted: 'Evento eliminato',
      registered: "Registrazione all'evento confermata",
      unregistered: 'Registrazione annullata',
      reminded: 'Promemoria inviato',
    },
    notification: {
      sent: 'Notifica inviata',
      delivered: 'Notifica consegnata',
      read: 'Notifica letta',
      cleared: 'Notifiche cancellate',
    },
    payment: {
      processed: 'Pagamento elaborato',
      failed: 'Pagamento fallito',
      refunded: 'Pagamento rimborsato',
      pending: 'Pagamento in attesa',
    },
  },

  // Discover section completions
  discover: {
    filters: {
      title: 'Filtri',
      apply: 'Applica Filtri',
      clear: 'Cancella Filtri',
      distance: {
        title: 'Distanza',
        any: 'Qualsiasi',
        near: 'Vicino (< 5 km)',
        medium: 'Medio (< 25 km)',
        far: 'Lontano (< 50 km)',
      },
      skill: {
        title: 'Livello di Abilità',
        any: 'Qualsiasi',
        beginner: 'Principiante',
        intermediate: 'Intermedio',
        advanced: 'Avanzato',
        professional: 'Professionista',
      },
      availability: {
        title: 'Disponibilità',
        any: 'Qualsiasi',
        now: 'Ora',
        today: 'Oggi',
        thisWeek: 'Questa Settimana',
        flexible: 'Flessibile',
      },
    },
    sorting: {
      relevance: 'Rilevanza',
      distance: 'Distanza',
      rating: 'Valutazione',
      newest: 'Più Recenti',
      popular: 'Popolari',
      name: 'Nome',
    },
  },

  // Email Login completions
  emailLogin: {
    signup: {
      title: 'Crea Account',
      subtitle: 'Unisciti alla comunità di pickleball',
      name: 'Nome Completo',
      createAccount: 'Crea Account',
      loginPrompt: 'Hai già un account?',
      loginLink: 'Accedi',
      termsAgreement: 'Accetto i Termini di Servizio e la Privacy Policy',
    },
    verification: {
      title: 'Verifica Email',
      subtitle: 'Ti abbiamo inviato un codice di verifica',
      code: 'Codice di Verifica',
      verify: 'Verifica',
      resend: 'Invia di nuovo',
      resent: 'Codice inviato di nuovo',
      error: 'Codice non valido',
    },
  },

  // Matches section completions
  matches: {
    filters: {
      title: 'Filtra Partite',
      type: 'Tipo',
      date: 'Data',
      location: 'Posizione',
      skill: 'Livello di Abilità',
      apply: 'Applica',
      clear: 'Cancella',
    },
    invitations: {
      received: 'Ricevuti',
      sent: 'Inviati',
      accept: 'Accetta Invito',
      decline: 'Rifiuta Invito',
      withdraw: 'Ritira Invito',
      expired: 'Scaduto',
      accepted: 'Accettato',
      declined: 'Rifiutato',
    },
  },

  // DuesManagement completions
  duesManagement: {
    transactions: {
      title: 'Transazioni',
      id: 'ID Transazione',
      type: 'Tipo',
      amount: 'Importo',
      date: 'Data',
      status: 'Stato',
      receipt: 'Ricevuta',
      download: 'Scarica Ricevuta',
      viewAll: 'Visualizza Tutte',
    },
    reports: {
      title: 'Report',
      generate: 'Genera Report',
      monthly: 'Mensile',
      quarterly: 'Trimestrale',
      annual: 'Annuale',
      custom: 'Personalizzato',
      summary: 'Riepilogo',
      detailed: 'Dettagliato',
      export: 'Esporta Report',
    },
    members: {
      filter: 'Filtra Membri',
      search: 'Cerca Membri',
      bulkAction: 'Azione di Gruppo',
      selectAll: 'Seleziona Tutti',
      sendReminders: 'Invia Promemoria',
      markPaid: 'Segna come Pagato',
      exempt: 'Esenta da Quote',
    },
  },

  // Additional utility translations
  dateTime: {
    today: 'Oggi',
    tomorrow: 'Domani',
    yesterday: 'Ieri',
    thisWeek: 'Questa Settimana',
    nextWeek: 'Prossima Settimana',
    lastWeek: 'Settimana Scorsa',
    thisMonth: 'Questo Mese',
    nextMonth: 'Prossimo Mese',
    lastMonth: 'Mese Scorso',
    thisYear: "Quest'Anno",
    now: 'Adesso',
    soon: 'Presto',
    later: 'Più Tardi',
  },

  validation: {
    required: 'Campo obbligatorio',
    invalidEmail: 'Email non valida',
    invalidPhone: 'Telefono non valido',
    invalidUrl: 'URL non valido',
    invalidDate: 'Data non valida',
    minLength: 'Minimo {{min}} caratteri',
    maxLength: 'Massimo {{max}} caratteri',
    minValue: 'Valore minimo {{min}}',
    maxValue: 'Valore massimo {{max}}',
    mustMatch: 'I campi devono corrispondere',
    passwordStrength:
      'La password deve contenere lettere maiuscole, minuscole, numeri e caratteri speciali',
  },

  errors: {
    networkError: 'Errore di rete',
    serverError: 'Errore del server',
    unauthorized: 'Non autorizzato',
    forbidden: 'Accesso negato',
    notFound: 'Non trovato',
    timeout: 'Timeout richiesta',
    unknown: 'Errore sconosciuto',
    tryAgain: 'Riprova',
    contactSupport: 'Contatta il supporto',
  },

  actions: {
    create: 'Crea',
    read: 'Leggi',
    update: 'Aggiorna',
    delete: 'Elimina',
    view: 'Visualizza',
    edit: 'Modifica',
    save: 'Salva',
    cancel: 'Annulla',
    confirm: 'Conferma',
    close: 'Chiudi',
    open: 'Apri',
    submit: 'Invia',
    send: 'Invia',
    receive: 'Ricevi',
    accept: 'Accetta',
    decline: 'Rifiuta',
    approve: 'Approva',
    reject: 'Rifiuta',
    share: 'Condividi',
    export: 'Esporta',
    import: 'Importa',
    download: 'Scarica',
    upload: 'Carica',
    search: 'Cerca',
    filter: 'Filtra',
    sort: 'Ordina',
    refresh: 'Aggiorna',
    reload: 'Ricarica',
    retry: 'Riprova',
    undo: 'Annulla',
    redo: 'Ripeti',
    copy: 'Copia',
    paste: 'Incolla',
    cut: 'Taglia',
    select: 'Seleziona',
    deselect: 'Deseleziona',
    toggle: 'Cambia',
    expand: 'Espandi',
    collapse: 'Comprimi',
    maximize: 'Massimizza',
    minimize: 'Minimizza',
    fullscreen: 'Schermo Intero',
    exit: 'Esci',
    logout: 'Disconnetti',
    login: 'Accedi',
    signup: 'Registrati',
    register: 'Registrati',
    subscribe: 'Iscriviti',
    unsubscribe: 'Disiscriviti',
    follow: 'Segui',
    unfollow: 'Non Seguire',
    block: 'Blocca',
    unblock: 'Sblocca',
    report: 'Segnala',
    mute: 'Silenzia',
    unmute: 'Riattiva Audio',
    archive: 'Archivia',
    unarchive: 'Disarchivia',
    pin: 'Fissa',
    unpin: 'Sblocca',
    favorite: 'Preferito',
    unfavorite: 'Rimuovi dai Preferiti',
    like: 'Mi Piace',
    unlike: 'Non Mi Piace Più',
    comment: 'Commenta',
    reply: 'Rispondi',
    forward: 'Inoltra',
    invite: 'Invita',
    join: 'Partecipa',
    leave: 'Abbandona',
    start: 'Inizia',
    stop: 'Ferma',
    pause: 'Pausa',
    resume: 'Riprendi',
    skip: 'Salta',
    next: 'Avanti',
    previous: 'Indietro',
    finish: 'Termina',
    complete: 'Completa',
  },

  status: {
    active: 'Attivo',
    inactive: 'Inattivo',
    pending: 'In Attesa',
    approved: 'Approvato',
    rejected: 'Rifiutato',
    cancelled: 'Annullato',
    completed: 'Completato',
    inProgress: 'In Corso',
    scheduled: 'Programmato',
    draft: 'Bozza',
    published: 'Pubblicato',
    archived: 'Archiviato',
    deleted: 'Eliminato',
    suspended: 'Sospeso',
    expired: 'Scaduto',
    upcoming: 'In Arrivo',
    past: 'Passato',
    current: 'Attuale',
    online: 'Online',
    offline: 'Offline',
    available: 'Disponibile',
    unavailable: 'Non Disponibile',
    busy: 'Occupato',
    away: 'Assente',
  },

  units: {
    km: 'km',
    m: 'm',
    mi: 'mi',
    ft: 'ft',
    kg: 'kg',
    lb: 'lb',
    celsius: '°C',
    fahrenheit: '°F',
    seconds: 'secondi',
    minutes: 'minuti',
    hours: 'ore',
    days: 'giorni',
    weeks: 'settimane',
    months: 'mesi',
    years: 'anni',
  },
};

function countKeys(obj, prefix = '') {
  let count = 0;
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countKeys(obj[key], fullKey);
    } else {
      count++;
    }
  }
  return count;
}

console.log('🇮🇹 Italian Translation - FINAL ROUND\n');
console.log(`Total new translations: ${countKeys(italianTranslations)}`);

const updated = deepMerge(it, italianTranslations);

fs.writeFileSync(IT_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('\n✅ Translation complete!');
console.log(`📝 Updated file: ${IT_PATH}`);
console.log('\n🎉 Italian translation project completed!');
