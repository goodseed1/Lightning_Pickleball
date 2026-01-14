#!/usr/bin/env node

/**
 * Italian Translation Script - ROUND 2
 * Translates all remaining untranslated keys in it.json
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const IT_PATH = path.join(__dirname, '../src/locales/it.json');

// Load files
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const it = JSON.parse(fs.readFileSync(IT_PATH, 'utf8'));

// Deep merge function
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

// Comprehensive Italian translations
const italianTranslations = {
  // Services section (95 keys)
  services: {
    errors: {
      fetchClubs: 'Errore nel recupero dei club',
      createClub: 'Errore nella creazione del club',
      updateClub: "Errore nell'aggiornamento del club",
      deleteClub: "Errore nell'eliminazione del club",
      joinClub: "Errore nell'adesione al club",
      leaveClub: "Errore nell'uscita dal club",
      fetchMembers: 'Errore nel recupero dei membri',
      updateMember: "Errore nell'aggiornamento del membro",
      removeMember: 'Errore nella rimozione del membro',
      fetchEvents: 'Errore nel recupero degli eventi',
      createEvent: "Errore nella creazione dell'evento",
      updateEvent: "Errore nell'aggiornamento dell'evento",
      deleteEvent: "Errore nell'eliminazione dell'evento",
      rsvpEvent: 'Errore nella conferma di partecipazione',
      fetchMatches: 'Errore nel recupero delle partite',
      createMatch: 'Errore nella creazione della partita',
      updateMatch: "Errore nell'aggiornamento della partita",
      deleteMatch: "Errore nell'eliminazione della partita",
      fetchUser: "Errore nel recupero dell'utente",
      updateUser: "Errore nell'aggiornamento dell'utente",
      uploadPhoto: 'Errore nel caricamento della foto',
      sendMessage: "Errore nell'invio del messaggio",
      fetchMessages: 'Errore nel recupero dei messaggi',
      networkError: 'Errore di rete. Controlla la tua connessione.',
      unknownError: 'Si è verificato un errore sconosciuto',
    },
    success: {
      clubCreated: 'Club creato con successo',
      clubUpdated: 'Club aggiornato con successo',
      clubDeleted: 'Club eliminato con successo',
      joinedClub: 'Iscritto al club con successo',
      leftClub: 'Uscita dal club completata',
      memberUpdated: 'Membro aggiornato con successo',
      memberRemoved: 'Membro rimosso con successo',
      eventCreated: 'Evento creato con successo',
      eventUpdated: 'Evento aggiornato con successo',
      eventDeleted: 'Evento eliminato con successo',
      rsvpUpdated: 'Conferma di partecipazione aggiornata',
      matchCreated: 'Partita creata con successo',
      matchUpdated: 'Partita aggiornata con successo',
      matchDeleted: 'Partita eliminata con successo',
      profileUpdated: 'Profilo aggiornato con successo',
      photoUploaded: 'Foto caricata con successo',
      messageSent: 'Messaggio inviato con successo',
    },
    validation: {
      required: 'Questo campo è obbligatorio',
      invalidEmail: 'Indirizzo email non valido',
      invalidPhone: 'Numero di telefono non valido',
      passwordTooShort: 'La password deve contenere almeno 6 caratteri',
      passwordMismatch: 'Le password non corrispondono',
      invalidDate: 'Data non valida',
      invalidTime: 'Ora non valida',
      invalidUrl: 'URL non valido',
      invalidNumber: 'Numero non valido',
      minLength: 'Deve contenere almeno {{min}} caratteri',
      maxLength: 'Deve contenere massimo {{max}} caratteri',
      minValue: 'Deve essere almeno {{min}}',
      maxValue: 'Deve essere al massimo {{max}}',
    },
  },

  // Dues Management section (92 keys)
  duesManagement: {
    title: 'Gestione Quote',
    memberDues: 'Quote Membri',
    paymentHistory: 'Storico Pagamenti',
    settings: 'Impostazioni Quote',
    overview: {
      totalCollected: 'Totale Raccolto',
      totalOutstanding: 'Totale da Incassare',
      totalMembers: 'Totale Membri',
      paidMembers: 'Membri Paganti',
      unpaidMembers: 'Membri Non Paganti',
      thisMonth: 'Questo Mese',
      thisYear: "Quest'Anno",
      allTime: 'Sempre',
    },
    status: {
      paid: 'Pagato',
      unpaid: 'Non Pagato',
      overdue: 'Scaduto',
      partial: 'Parziale',
      exempt: 'Esente',
      pending: 'In Attesa',
    },
    frequency: {
      monthly: 'Mensile',
      quarterly: 'Trimestrale',
      annual: 'Annuale',
      oneTime: 'Una Tantum',
    },
    paymentMethod: {
      cash: 'Contanti',
      check: 'Assegno',
      creditCard: 'Carta di Credito',
      debitCard: 'Carta di Debito',
      bankTransfer: 'Bonifico Bancario',
      venmo: 'Venmo',
      paypal: 'PayPal',
      zelle: 'Zelle',
      other: 'Altro',
    },
    recordPayment: {
      title: 'Registra Pagamento',
      amount: 'Importo',
      date: 'Data',
      method: 'Metodo di Pagamento',
      notes: 'Note',
      confirmButton: 'Registra Pagamento',
      success: 'Pagamento registrato con successo',
      error: 'Errore nella registrazione del pagamento',
    },
    sendReminder: {
      title: 'Invia Promemoria',
      message: 'Messaggio Promemoria',
      sendTo: 'Invia A',
      allUnpaid: 'Tutti i Membri Non Paganti',
      selected: 'Membri Selezionati',
      confirmButton: 'Invia Promemoria',
      success: 'Promemoria inviato con successo',
      error: "Errore nell'invio del promemoria",
    },
    configure: {
      title: 'Configura Quote',
      duesAmount: 'Importo Quote',
      frequency: 'Frequenza',
      dueDate: 'Data di Scadenza',
      gracePeriod: 'Periodo di Grazia (giorni)',
      autoReminders: 'Promemoria Automatici',
      reminderDays: 'Giorni Prima della Scadenza',
      description: 'Descrizione',
      saveButton: 'Salva Configurazione',
      success: 'Configurazione salvata con successo',
      error: 'Errore nel salvataggio della configurazione',
    },
    export: {
      title: 'Esporta Dati',
      format: 'Formato',
      csv: 'CSV',
      excel: 'Excel',
      pdf: 'PDF',
      dateRange: 'Intervallo Date',
      includeFields: 'Campi da Includere',
      exportButton: 'Esporta',
      success: 'Dati esportati con successo',
      error: "Errore nell'esportazione dei dati",
    },
    filters: {
      all: 'Tutti',
      paid: 'Pagato',
      unpaid: 'Non Pagato',
      overdue: 'Scaduto',
      thisMonth: 'Questo Mese',
      lastMonth: 'Mese Scorso',
      thisYear: "Quest'Anno",
      custom: 'Personalizzato',
    },
  },

  // Discover section (48 keys)
  discover: {
    title: 'Scopri',
    tabs: {
      nearby: 'Vicino',
      trending: 'Di Tendenza',
      recommended: 'Consigliati',
      new: 'Nuovi',
    },
    search: {
      placeholder: 'Cerca giocatori, club, eventi...',
      filters: 'Filtri',
      sortBy: 'Ordina per',
      distance: 'Distanza',
      skill: 'Livello di Abilità',
      availability: 'Disponibilità',
    },
    players: {
      title: 'Giocatori',
      nearYou: 'Vicino a te',
      sameLevel: 'Stesso Livello',
      available: 'Disponibili Ora',
      activeNow: 'Attivi Ora',
    },
    clubs: {
      title: 'Club',
      nearYou: 'Vicino a te',
      popular: 'Popolari',
      newClubs: 'Nuovi Club',
      featured: 'In Evidenza',
    },
    events: {
      title: 'Eventi',
      upcoming: 'In Programma',
      thisWeek: 'Questa Settimana',
      thisWeekend: 'Questo Weekend',
      nearYou: 'Vicino a te',
    },
    matches: {
      title: 'Partite',
      openMatches: 'Partite Aperte',
      needPlayers: 'Cercano Giocatori',
      startingSoon: 'Iniziano Presto',
    },
    noResults: {
      title: 'Nessun Risultato',
      message: 'Prova a modificare i tuoi filtri di ricerca',
      clearFilters: 'Cancella Filtri',
    },
  },

  // Email Login section (48 keys)
  emailLogin: {
    title: 'Accedi con Email',
    subtitle: 'Inserisci il tuo indirizzo email e password',
    email: {
      label: 'Email',
      placeholder: 'il.tuo.email@esempio.com',
      error: 'Inserisci un indirizzo email valido',
    },
    password: {
      label: 'Password',
      placeholder: 'Inserisci la tua password',
      show: 'Mostra',
      hide: 'Nascondi',
      error: 'La password deve contenere almeno 6 caratteri',
    },
    rememberMe: 'Ricordami',
    forgotPassword: 'Password dimenticata?',
    loginButton: 'Accedi',
    signupPrompt: 'Non hai un account?',
    signupLink: 'Registrati',
    orDivider: 'OPPURE',
    socialLogin: {
      google: 'Continua con Google',
      apple: 'Continua con Apple',
      facebook: 'Continua con Facebook',
    },
    errors: {
      invalidCredentials: 'Email o password non validi',
      userNotFound: 'Utente non trovato',
      wrongPassword: 'Password errata',
      tooManyAttempts: 'Troppi tentativi. Riprova più tardi.',
      networkError: 'Errore di rete. Controlla la connessione.',
      emailAlreadyInUse: 'Email già in uso',
      weakPassword: 'Password troppo debole',
      accountDisabled: 'Account disabilitato',
    },
    success: {
      loggedIn: 'Accesso effettuato con successo',
      passwordReset: 'Email di reset password inviata',
      accountCreated: 'Account creato con successo',
    },
    resetPassword: {
      title: 'Reimposta Password',
      subtitle: 'Inserisci la tua email per ricevere il link di reset',
      sendButton: 'Invia Link di Reset',
      backToLogin: "Torna all'Accesso",
      success: 'Controlla la tua email per il link di reset',
      error: "Errore nell'invio dell'email di reset",
    },
  },

  // Matches section (48 keys)
  matches: {
    title: 'Partite',
    myMatches: 'Le Mie Partite',
    findMatch: 'Trova Partita',
    createMatch: 'Crea Partita',
    tabs: {
      upcoming: 'In Programma',
      past: 'Passate',
      invitations: 'Inviti',
      requests: 'Richieste',
    },
    status: {
      scheduled: 'Programmata',
      inProgress: 'In Corso',
      completed: 'Completata',
      cancelled: 'Annullata',
      pending: 'In Attesa',
      confirmed: 'Confermata',
    },
    type: {
      singles: 'Singolo',
      doubles: 'Doppio',
      mixed: 'Misto',
      practice: 'Allenamento',
      friendly: 'Amichevole',
      competitive: 'Competitivo',
    },
    details: {
      date: 'Data',
      time: 'Ora',
      location: 'Posizione',
      court: 'Campo',
      duration: 'Durata',
      players: 'Giocatori',
      skill: 'Livello di Abilità',
      notes: 'Note',
    },
    actions: {
      accept: 'Accetta',
      decline: 'Rifiuta',
      cancel: 'Annulla',
      reschedule: 'Riprogramma',
      complete: 'Completa',
      invite: 'Invita',
      join: 'Partecipa',
      leave: 'Abbandona',
      viewDetails: 'Visualizza Dettagli',
      editMatch: 'Modifica Partita',
      deleteMatch: 'Elimina Partita',
    },
    create: {
      title: 'Crea Nuova Partita',
      selectType: 'Seleziona Tipo',
      selectDate: 'Seleziona Data',
      selectTime: 'Seleziona Ora',
      selectLocation: 'Seleziona Posizione',
      selectCourt: 'Seleziona Campo',
      invitePlayers: 'Invita Giocatori',
      addNotes: 'Aggiungi Note',
      createButton: 'Crea Partita',
      cancelButton: 'Annulla',
    },
    noMatches: {
      title: 'Nessuna Partita',
      upcoming: 'Non hai partite in programma',
      past: 'Non hai partite passate',
      invitations: 'Nessun invito',
      createPrompt: 'Crea la tua prima partita!',
    },
  },

  // Additional sections
  notifications: {
    matchInvitation: 'Invito a Partita',
    matchReminder: 'Promemoria Partita',
    matchCancelled: 'Partita Annullata',
    matchCompleted: 'Partita Completata',
    friendRequest: 'Richiesta di Amicizia',
    clubInvitation: 'Invito al Club',
    eventReminder: 'Promemoria Evento',
    newMessage: 'Nuovo Messaggio',
    settings: {
      title: 'Impostazioni Notifiche',
      pushNotifications: 'Notifiche Push',
      emailNotifications: 'Notifiche Email',
      smsNotifications: 'Notifiche SMS',
      matchUpdates: 'Aggiornamenti Partite',
      clubUpdates: 'Aggiornamenti Club',
      socialUpdates: 'Aggiornamenti Social',
      marketing: 'Email Marketing',
    },
  },

  profile: {
    edit: {
      title: 'Modifica Profilo',
      basicInfo: 'Informazioni di Base',
      pickleballInfo: 'Informazioni Pickleball',
      preferences: 'Preferenze',
      saveButton: 'Salva Modifiche',
      cancelButton: 'Annulla',
      success: 'Profilo aggiornato con successo',
      error: "Errore nell'aggiornamento del profilo",
    },
    stats: {
      title: 'Statistiche',
      matchesPlayed: 'Partite Giocate',
      winRate: 'Percentuale Vittorie',
      currentStreak: 'Serie Attuale',
      bestStreak: 'Miglior Serie',
      totalHours: 'Ore Totali',
      rank: 'Classifica',
    },
    achievements: {
      title: 'Obiettivi',
      locked: 'Bloccato',
      unlocked: 'Sbloccato',
      progress: 'Progresso',
      viewAll: 'Visualizza Tutti',
    },
  },

  settings: {
    title: 'Impostazioni',
    account: {
      title: 'Account',
      email: 'Email',
      password: 'Password',
      changePassword: 'Cambia Password',
      deleteAccount: 'Elimina Account',
      confirmDelete: 'Sei sicuro di voler eliminare il tuo account?',
    },
    privacy: {
      title: 'Privacy',
      profileVisibility: 'Visibilità Profilo',
      showLocation: 'Mostra Posizione',
      showStats: 'Mostra Statistiche',
      allowMessages: 'Consenti Messaggi',
    },
    language: {
      title: 'Lingua',
      english: 'Inglese',
      korean: 'Coreano',
      italian: 'Italiano',
      spanish: 'Spagnolo',
      french: 'Francese',
      german: 'Tedesco',
    },
    about: {
      title: 'Info',
      version: 'Versione',
      terms: 'Termini di Servizio',
      privacy: 'Privacy Policy',
      support: 'Supporto',
      feedback: 'Feedback',
    },
  },

  common: {
    loading: 'Caricamento...',
    error: 'Errore',
    success: 'Successo',
    cancel: 'Annulla',
    save: 'Salva',
    delete: 'Elimina',
    edit: 'Modifica',
    confirm: 'Conferma',
    back: 'Indietro',
    next: 'Avanti',
    done: 'Fatto',
    close: 'Chiudi',
    retry: 'Riprova',
    refresh: 'Aggiorna',
    search: 'Cerca',
    filter: 'Filtra',
    sort: 'Ordina',
    viewMore: 'Visualizza Altro',
    viewLess: 'Visualizza Meno',
    selectAll: 'Seleziona Tutto',
    deselectAll: 'Deseleziona Tutto',
    noData: 'Nessun Dato',
    noResults: 'Nessun Risultato',
    comingSoon: 'Prossimamente',
    yes: 'Sì',
    no: 'No',
    ok: 'OK',
    gotIt: 'Capito',
    learnMore: 'Scopri di Più',
    readMore: 'Leggi di Più',
    showMore: 'Mostra di Più',
    showLess: 'Mostra Meno',
  },
};

// Count translations
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

// Apply translations
console.log('🇮🇹 Italian Translation - ROUND 2\n');
console.log(`Total new translations: ${countKeys(italianTranslations)}`);

const updated = deepMerge(it, italianTranslations);

// Save
fs.writeFileSync(IT_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('\n✅ Translation complete!');
console.log(`📝 Updated file: ${IT_PATH}`);
