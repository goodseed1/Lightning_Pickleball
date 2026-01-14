#!/usr/bin/env node

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

const translations = {
  services: {
    ranking: {
      userNotFound: 'Utente non trovato.',
      rankingInfoFailed: "Impossibile recuperare le informazioni di classifica dell'utente",
    },
    map: {
      error: 'Errore',
      cannotOpenApp: 'Impossibile aprire {{appName}}.',
      appNotInstalled: '{{appName}} Non Installato',
      installPrompt: "{{appName}} non è installato. Vuoi installarlo dall'App Store?",
      install: 'Installa',
    },
    clubComms: {
      permissionDenied: 'Permesso negato',
      commentNotFound: 'Commento non trovato',
    },
    matching: {
      perfectMatchTitle: 'Trovata la corrispondenza perfetta! 🎾',
      newRequestTitle: 'Nuova richiesta di partita 📨',
      perfectMatchBody: 'Hai un tasso di corrispondenza del {{score}}% con {{name}}.',
      newRequestBody: '{{senderName}} ti ha richiesto una partita di pickleball.',
    },
    event: {
      noEventsFound:
        'Nessun evento trovato corrispondente ai tuoi criteri. Prova a cercare con filtri diversi!',
      untitled: 'Senza Titolo',
      eventsFound: 'Trovate {{count}} corrispondenze!',
      searchError: 'Si è verificato un errore durante la ricerca.',
      locationTbd: 'Posizione da Definire',
      host: 'Organizzatore',
      noMatchesFound:
        'Nessuna partita trovata per i tuoi criteri. Vuoi provare con filtri diversi?',
      matchesFoundMessage: '🎾 Trovate {{count}} partite!',
      playerCount: '   👥 {{current}}/{{max}} giocatori',
    },
    match: {
      participantNotFound: 'Informazioni partecipante non trovate.',
      invalidEventType:
        'Il tipo di evento {{eventType}} deve utilizzare il formato {{expectedFormat}}.',
      onlyParticipantCanSubmit: 'Solo i partecipanti alla partita possono inviare i punteggi.',
      noPermissionToConfirm: 'Non hai il permesso di confermare questo punteggio.',
      notDisputed: 'Questa partita non è in stato contestato.',
    },
    activity: {
      loginRequired: 'Devi effettuare il login',
      onlyOwnApplication: 'Puoi accettare solo la tua candidatura',
      applicationNotFound: 'Candidatura non trovata',
      invalidApplication: 'Candidatura non valida',
      teamMergeFailed: 'Unione squadra fallita. Riprova.',
      onlyInvitedUser: 'Solo gli utenti invitati possono rispondere',
      eventNotFound: 'Evento non trovato',
      alreadyProcessed: "L'invito è già stato elaborato",
      inviteResponseFailed: "Impossibile rispondere all'invito. Riprova.",
      notifications: {
        applicationSubmittedTitle: 'Nuova Richiesta di Partecipazione',
        applicationApprovedTitle: 'Partecipazione Approvata!',
        applicationDeclinedTitle: 'Richiesta di Partecipazione Rifiutata',
        playoffsQualifiedTitle: '🏆 Qualificato ai Playoff!',
        defaultTitle: 'Notifica',
        applicationSubmittedMessage: '{{applicantName}} ha richiesto di unirsi a "{{eventTitle}}".',
        applicationApprovedMessage: 'La tua partecipazione a "{{eventTitle}}" è stata approvata!',
        applicationDeclinedMessage:
          'La tua richiesta di partecipazione a "{{eventTitle}}" è stata rifiutata.',
        playoffsQualifiedMessage:
          'Congratulazioni! Ti sei qualificato per i playoff "{{leagueName}}"!',
        defaultMessage: 'Hai un nuovo aggiornamento.',
        defaultLeagueName: 'Lega',
      },
      pickleballUserFallback: 'UtenPickleball{{id}}',
    },
    camera: {
      permissionTitle: 'Permesso Fotocamera Richiesto',
      permissionMessage: 'Il permesso della fotocamera è necessario per scattare foto del profilo.',
    },
  },

  duesManagement: {
    tabs: {
      report: 'Report',
    },
    actions: {
      delete: 'Elimina',
      remove: 'Rimuovi',
      add: 'Aggiungi',
      save: 'Salva',
      cancel: 'Annulla',
      send: 'Invia',
      enable: 'Abilita',
      activate: 'Attiva',
      close: 'Chiudi',
      share: 'Condividi',
      change: 'Modifica',
      viewAttachment: 'Visualizza Allegato',
      processPayment: 'Elabora Pagamento',
      markAsPaid: 'Segna come Pagato',
    },
    alerts: {
      error: 'Errore',
      success: 'Successo',
      confirm: 'Conferma',
      ok: 'OK',
      saved: 'Salvato',
      saveFailed: 'Salvataggio Fallito',
      loadFailed: 'Caricamento Dati Fallito',
      reminderSent: 'Promemoria Inviato',
      settingsRequired: 'Impostazioni Richieste',
      enableAutoInvoice: 'Abilita Fatturazione Automatica',
      completed: 'Completato',
      approved: 'Approvato',
      rejected: 'Rifiutato',
      deleted: 'Eliminato',
      added: 'Aggiunto',
      done: 'Fatto',
      notice: 'Avviso',
      uploadComplete: 'Caricamento Completato',
      uploadFailed: 'Caricamento Fallito',
      permissionRequired: 'Permesso Richiesto',
    },
    messages: {
      autoInvoiceFailed: "Impossibile aggiornare l'impostazione di fatturazione automatica.",
      missingSettings:
        "Per abilitare la fatturazione automatica, configura quanto segue:\n\n• {{items}}\n\nConfigura questi nella sezione 'Impostazioni Quote' sopra.",
      autoInvoiceConfirm:
        'Le fatture verranno inviate automaticamente il {{day}} di ogni mese.\n(Data di Scadenza: {{dueDate}} di ogni mese)\n\nVuoi abilitare?',
      settingsSaved: 'Le impostazioni delle quote sono state aggiornate con successo.',
      loadError: 'Impossibile caricare i dati di gestione quote. Riprova.',
      loadingData: 'Impossibile caricare i dati delle quote.',
      paymentReminderConfirm:
        'Inviare promemoria di pagamento a tutti i membri con pagamenti scaduti?',
      paymentReminderSent: 'Notifica di promemoria inviata a {{count}} membro/i.',
      memberNotFound: 'Membro non trovato.',
      paymentMarkedPaid: 'Segnato come pagato con successo.',
      paymentApproved: 'Il pagamento è stato approvato.',
      paymentRejected: 'Il pagamento è stato rifiutato.',
      lateFeeAdded: 'Penale di ritardo aggiunta.',
      lateFeeDeleted: 'Penale di ritardo eliminata.',
      joinFeeDeleted: 'Quota di iscrizione eliminata.',
    },
  },

  leagueDetail: {
    notification: 'Notifica',
    selectParticipants: 'Seleziona i partecipanti.',
    participantsAddedSuccess: '{{count}} partecipante/i aggiunto/i con successo.',
    participantsAddError: "Errore nell'aggiunta dei partecipanti. Controlla la console.",
    partialSuccess: 'Successo Parziale',
    teamsAddedSuccess: '{{count}} squadra/e aggiunta/e con successo.',
    teamsAddError: "Errore nell'aggiunta delle squadre.",
    loginRequired: 'Login richiesto.',
    alreadyAppliedOrJoined: 'Già candidato o partecipante.',
    selectPartner: 'Seleziona un partner.',
    applicationComplete: 'Candidatura Completata',
    applicationCompleteMessage:
      "La tua candidatura alla lega è stata inviata. Attendi l'approvazione.",
    applicationFailed: 'Candidatura Fallita',
    applicationFailedMessage: "Errore nell'invio della candidatura alla lega. Riprova.",
    invitationSent: 'Invito Inviato',
    teamApplicationFailedMessage: "Errore nell'invio della candidatura di squadra alla lega.",
    applicationPending: 'La candidatura alla lega è in attesa.',
    applicationApproved: 'Sei stato approvato per unirti alla lega!',
    applicationRejected: 'La tua candidatura alla lega è stata rifiutata.',
    generateBpaddle: 'Genera Tabellone',
    generateBpaddleMessage:
      'Gestisci le candidature nella scheda Partecipanti, poi genera il tabellone nella scheda Gestione',
    generateBpaddleMessageSimple:
      'Il calendario delle partite apparirà qui una volta generato il tabellone',
    bpaddleGeneratedSuccess:
      "Tabellone generato con successo!\n\nL'elenco delle partite apparirà a breve.",
    bpaddleGenerateError: 'Errore nella generazione del tabellone.',
    bpaddleDeletedSuccess:
      'Tabellone eliminato con successo.\n\nOra puoi generare un nuovo tabellone.',
    bpaddleDeleteError: "Errore nell'eliminazione del tabellone.",
    startPlayoffs: 'Inizia Playoff',
    playoffsStartedSuccess:
      'Playoff iniziati con successo!\n\nLe partite dei playoff appariranno a breve.',
    playoffsStartError: "Errore nell'avvio dei playoff. Riprova.",
    fourthPlace: '4°',
    playoffMatchErrorMessage:
      'Le partite dei playoff possono essere inviate solo durante la fase playoff.\n\nControlla lo stato della lega.',
    playoffResultUpdated: 'Il risultato della partita dei playoff è stato aggiornato!',
    resultSubmitted: 'Il risultato della partita è stato inviato.',
    resultSubmitSuccess: 'Risultato Inviato',
    resultSubmitError: "Errore nell'invio del risultato",
    matchNotFound: 'Partita non trovata. Aggiorna e riprova.',
    checkNetwork: 'Controlla la tua connessione di rete.',
    resultCorrectedSuccess: 'Il risultato della partita è stato corretto.',
    resultCorrectError: 'Errore nella correzione del risultato',
    scheduleChangedSuccess: 'Il calendario della partita è stato modificato.',
    scheduleChangeError: 'Errore nella modifica del calendario',
    walkoverSuccess: 'Walkover elaborato con successo.',
    walkoverError: "Errore nell'elaborazione del walkover",
    noPendingMatches: 'Nessuna partita in attesa di approvazione.',
    bulkApprovalSuccess: 'Approvazione di Massa Completata',
    bulkApprovalFailed: 'Approvazione di Massa Fallita',
    bulkApprovalAllFailed: 'Tutte le approvazioni delle partite sono fallite. Riprova.',
    bulkApprovalPartial: 'Approvazione di Massa Parzialmente Completata',
    bulkApprovalError: "Errore durante l'approvazione di massa.",
    leagueDeleteSuccess: 'Lega eliminata con successo.',
  },

  clubLeaguesTournaments: {
    labels: {
      status: 'Stato',
      participants: 'Partecipanti',
      format: 'Formato',
      singleElimination: 'Eliminazione Diretta',
      newTeamInvitations: '🏛️ Nuovi Inviti di Squadra',
      sentInvitation: 'ti ha inviato un invito di squadra',
      expiresIn: 'Scade tra {{hours}}h',
    },
    modals: {
      sendTeamInvitation: '🏛️ Invia Invito di Squadra',
      selectPartner: '🏛️ Seleziona Partner',
      sendInvitationInstructions:
        'Invia un invito di squadra al tuo partner. Potrai registrarti una volta che accetta.',
      selectPartnerInstructions: 'Seleziona un partner per candidarti alla lega di doppio.',
      searchPartner: 'Cerca partner...',
      loadingPartners: 'Caricamento partner...',
      noMembersFound: 'Nessun membro trovato.',
      applyToLeague: 'Candidati alla Lega',
    },
    memberPreLeagueStatus: {
      statusPending: 'In Attesa',
      statusPendingSubtitle: "In attesa dell'approvazione dell'amministratore della lega",
      statusApproved: 'Confermato',
      statusApprovedSubtitle:
        'La tua partecipazione alla lega è confermata! Le partite inizieranno presto',
      statusRejected: 'Rifiutato',
      statusRejectedSubtitle: 'La tua candidatura alla lega è stata rifiutata',
      statusNotApplied: 'Candidati alla Lega',
      statusNotAppliedSubtitle: 'Unisciti a questa lega e compete con altri giocatori',
      leagueInfo: 'Info Lega',
      period: 'Periodo',
      participantsStatus: 'Partecipanti',
      peopleUnit: '',
      format: 'Formato',
      formatTournament: 'Torneo',
      status: 'Stato',
      statusOpen: 'Aperto',
      statusPreparing: 'Preparazione',
      applySection: 'Candidati',
      applyDescription:
        "Unisciti alla lega per competere con altri giocatori e migliorare le tue abilità pickleballtiche. Dovrai attendere l'approvazione dell'amministratore dopo la candidatura.",
      applying: 'Candidatura...',
      applyButton: 'Candidati alla Lega',
      notOpenWarning: 'Le iscrizioni sono attualmente chiuse',
      applicationDetails: 'Dettagli Candidatura',
      applicationDate: 'Candidato:',
      approvalDate: 'Approvato:',
      currentStatus: 'Stato Attuale:',
    },
    alerts: {
      loginRequired: {
        title: 'Login Richiesto',
        message: 'Il login è richiesto per unirsi alla lega.',
        messageTournament: 'Il login è richiesto per unirsi al torneo.',
      },
      membershipRequired: {
        title: 'Iscrizione Richiesta',
        message: 'Devi essere membro del club per unirti ai tornei. Unisciti prima al club.',
      },
      alreadyParticipant: {
        title: 'Già Partecipante',
        message: 'Sei già un partecipante a questa lega.',
      },
      applicationComplete: {
        title: 'Registrazione Completata',
        message: 'Candidatura alla lega completata!',
      },
    },
  },

  clubTournamentManagement: {
    detailTabs: {
      management: 'Gestione',
    },
    status: {
      bpaddleGeneration: 'Generazione Tabellone',
      inProgress: 'In Corso',
      completed: 'Completato',
    },
    participants: {
      label: 'Partecipanti',
      overview: 'Panoramica Partecipanti',
      current: 'Partecipanti Attuali',
      max: 'Max Partecipanti',
      list: 'Lista Partecipanti',
      count: ' partecipanti',
      player1: 'Giocatore 1',
      player2: 'Giocatore 2',
    },
    buttons: {
      create: 'Crea Torneo',
      delete: 'Elimina Torneo',
      openRegistration: 'Apri Iscrizioni',
      assignSeeds: 'Assegna Teste di Serie',
      completeAssignment: 'Completa Assegnazione',
      crownWinner: 'Incorona Vincitore',
      closeRegistration: 'Chiudi Iscrizioni',
      addParticipantManually: 'Aggiungi Partecipante Manualmente',
      generateBpaddle: 'Generazione Tabellone...',
    },
    stats: {
      champion: 'Campione: ',
      roundInProgress: 'Turno in corso...',
      totalMatches: 'Partite Totali',
      completed: 'Completate',
      currentRound: 'Turno Attuale',
    },
    matchInfo: {
      skill: 'Abilità',
      registered: 'Registrato',
      seed: 'Testa di Serie',
    },
    roundGeneration: {
      cannotGenerateTitle: 'Impossibile Generare Turno',
      nextRoundTitle: 'Genera Prossimo Turno',
      confirmMessage: 'Il turno {{current}} è completato.\nGenerare il turno {{next}}?',
      successTitle: 'Successo',
      successMessage: 'Il turno {{round}} è stato generato con successo!',
      errorTitle: 'Errore',
      errorMessage: 'Impossibile generare il prossimo turno.',
      currentRoundLabel: 'Turno Attuale: {{round}}',
      generating: 'Generazione...',
      roundComplete: 'Turno {{round}} Completato',
      generateNextRound: 'Genera Turno {{round}}',
    },
    tournamentStart: {
      participantError: 'Errore Numero Partecipanti',
      participantErrorMessage:
        'I partecipanti attuali ({{current}}) non corrispondono al numero richiesto ({{required}}).',
      seedRequired: 'Assegnazione Teste di Serie Richiesta',
      seedRequiredMessage:
        'Assegna i numeri di testa di serie a tutti i partecipanti prima di iniziare.',
      manualSeedingMessage:
        'L\'assegnazione manuale delle teste di serie è abilitata. Assegna le teste di serie nella scheda Partecipanti, poi premi "Genera Tabellone e Inizia".',
      successTitle: 'Torneo Iniziato',
      successMessage: 'Il torneo è iniziato con successo! Il tabellone è stato generato.',
      registrationClosedMessage: 'Iscrizioni chiuse e tabellone generato. Il torneo è iniziato!',
      bpaddleGeneratedMessage: 'Tabellone generato. Il torneo è iniziato!',
      waitForParticipantAddition: "Attendi il completamento dell'aggiunta dei partecipanti.",
    },
  },

  admin: {
    logs: {
      title: 'Log di Sistema',
      critical: 'Critico',
      warning: 'Avviso',
      healthy: 'Sano',
      systemStatus: 'Stato Sistema',
      lastChecked: 'Ultimo Controllo',
      activeUsers: 'Utenti Attivi\n(24h)',
      newMatches: 'Nuove Partite\n(24h)',
      errors: 'Log Errori',
      categories: 'Categorie Log',
      functionLogs: 'Log Cloud Functions',
      functionLogsDesc: 'Visualizza nella Console Firebase',
      openConsole: 'Apri Console Firebase',
      openConsoleDesc: 'Vuoi visualizzare i log delle Cloud Functions nella Console Firebase?',
      authLogs: 'Log Autenticazione',
      authLogsDesc: 'Eventi di login, registrazione e disconnessione',
      errorLogs: 'Log Errori',
      errorLogsDesc: "Crash dell'app ed errori API",
      performanceLogs: 'Monitoraggio Prestazioni',
      performanceLogsDesc: 'Metriche prestazioni app',
      recentActivity: 'Attività Recente',
      systemNormal: 'Il sistema funziona normalmente',
      statsUpdated: 'Le statistiche giornaliere vengono aggiornate automaticamente',
      userActivity: 'Attività Utente',
      newSignup: 'Nuova Registrazione',
      dailyActiveUsers: 'Utenti Attivi Giornalieri (DAU)',
      users: 'utenti',
      totalUsers: 'Utenti Totali',
      matchesCreated: 'Partite (Ultimi 7 Giorni)',
      games: 'partite',
      loadError: 'Impossibile caricare i log',
      entries: 'voci',
      noLogs: 'Nessun log da visualizzare',
      justNow: 'Proprio ora',
      minutesAgo: ' minuti fa',
      hoursAgo: ' ore fa',
      daysAgo: ' giorni fa',
    },
    devTools: {
      loading: 'Caricamento...',
      pickleballStats: '📊 Statistiche Pickleball',
      matchesPlayed: 'Partite Giocate',
      wins: 'Vittorie',
      winRate: '% Vittorie',
      currentStreak: 'Striscia Attuale',
      eloRating: 'Rating ELO',
      badges: '🏆 Badge Ottenuti',
      notificationSettings: '🔔 Impostazioni Notifiche',
      requestPermissions: 'Richiedi Permessi Notifiche',
      permissionGranted: 'Notifiche Abilitate',
      permissionGrantedMessage: 'Ora puoi ricevere notifiche push.',
      permissionRequired: 'Permesso Richiesto',
    },
  },

  createEvent: {
    eventType: {
      lightningMatch: 'Partita Lampo',
      lightningMeetup: 'Incontro Lampo',
      meetup: 'Incontro',
      doublesMatch: 'Partita di Doppio',
      singlesMatch: 'Partita di Singolo',
    },
    fields: {
      people: ' persone',
      auto: 'Auto',
      partner: 'Partner',
      autoConfigured: '✅ Auto-Configurato',
      availableLanguages: 'Lingue Disponibili',
      autoApproval: 'Approvazione Automatica Primo Arrivato',
      participationFee: 'Quota Partecipazione (Opzionale)',
      feePlaceholder: 'es. 20',
      inviteFriends: 'Invita Amici',
      inviteAppUsers: 'Invita Utenti App',
      smsFriendInvitations: 'Inviti Amici SMS',
      sendSmsInvitations: 'Invia Inviti SMS',
      skillLevelMultiple: 'Livello Abilità NTRP * (Selezione Multipla)',
      selectSkillLevelsDesc: 'Seleziona tutti i livelli di abilità che accogli',
      matchLevelAuto: 'Livello Partita (Auto-Calcolato)',
      skillLevel: 'Livello Abilità',
      recommendedLevel: 'Livello Consigliato',
      anyLevel: 'Qualsiasi Livello',
      selectLanguages: 'Seleziona Lingue',
      levelNotSet: 'Livello non impostato',
    },
    placeholders: {
      titleMatch: 'es. Partita Serale di Singolo',
      titleMeetup: 'es. Raduno Divertente Weekend',
      description: "Inserisci informazioni aggiuntive sull'incontro...",
    },
    gameTypes: {
      mens_singles: 'Singolo Maschile',
      womens_singles: 'Singolo Femminile',
      mens_doubles: 'Doppio Maschile',
      womens_doubles: 'Doppio Femminile',
      mixed_doubles: 'Doppio Misto',
    },
    gameTypeOptions: {
      rally: 'Rally/Allenamento',
      mixedDoubles: 'Doppio Misto',
      mensDoubles: 'Doppio Maschile',
      womensDoubles: 'Doppio Femminile',
      mensSingles: 'Singolo Maschile',
      womensSingles: 'Singolo Femminile',
    },
    skillLevelOptions: {
      anyLevel: 'Qualsiasi Livello',
      anyLevelDesc: 'Tutti i livelli benvenuti',
    },
    skillDescriptions: {
      beginner: 'Principiante - Nuovo al pickleball o apprendimento colpi base',
      elementary: 'Elementare - Sa colpire colpi base, comprende basi del doppio',
      intermediate: 'Intermedio - Colpi coerenti, gioco strategico',
      advanced: 'Avanzato - Esperienza torneo, abilità avanzate',
    },
    warnings: {
      matchLevelRestriction:
        "Le partite lampo consentono solo livelli pari o superiori al livello dell'organizzatore",
    },
    autoNtrp: {
      hostLevel: 'LPR Organizzatore: {{level}} ({{gameType}})',
      partnerLevel: 'LPR Partner: {{level}} ({{gameType}})',
      combinedLevel: 'LPR Combinato: {{level}}',
      hostLevelWithType: 'LPR Organizzatore: {{level}} ({{type}})',
    },
  },

  types: {
    match: {
      matchTypes: {
        league: 'Partita di Lega',
        tournament: 'Torneo',
        lightning_match: 'Partita Lampo',
        practice: 'Partita di Allenamento',
      },
      matchStatus: {
        scheduled: 'Programmata',
        in_progress: 'In Corso',
        partner_pending: 'Partner in Attesa',
        pending_confirmation: 'In Attesa di Conferma',
        confirmed: 'Confermata',
      },
    },
  },
};

// Apply and save
const updatedIt = deepMerge(it, translations);
fs.writeFileSync(IT_PATH, JSON.stringify(updatedIt, null, 2), 'utf8');

// Count results
function countAll(enObj, itObj) {
  let count = 0;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      count += countAll(enObj[key], itObj[key] || {});
    } else {
      if (!itObj[key] || itObj[key] === enObj[key]) count++;
    }
  }
  return count;
}

console.log('\n=== MASSIVE ITALIAN TRANSLATION RESULTS ===\n');
console.log(
  `services: ${countAll(en.services, it.services)} → ${countAll(en.services, updatedIt.services)}`
);
console.log(
  `duesManagement: ${countAll(en.duesManagement, it.duesManagement)} → ${countAll(en.duesManagement, updatedIt.duesManagement)}`
);
console.log(
  `leagueDetail: ${countAll(en.leagueDetail, it.leagueDetail)} → ${countAll(en.leagueDetail, updatedIt.leagueDetail)}`
);
console.log(
  `clubLeaguesTournaments: ${countAll(en.clubLeaguesTournaments, it.clubLeaguesTournaments)} → ${countAll(en.clubLeaguesTournaments, updatedIt.clubLeaguesTournaments)}`
);
console.log(
  `clubTournamentManagement: ${countAll(en.clubTournamentManagement, it.clubTournamentManagement)} → ${countAll(en.clubTournamentManagement, updatedIt.clubTournamentManagement)}`
);
console.log(`admin: ${countAll(en.admin, it.admin)} → ${countAll(en.admin, updatedIt.admin)}`);
console.log(
  `createEvent: ${countAll(en.createEvent, it.createEvent)} → ${countAll(en.createEvent, updatedIt.createEvent)}`
);
console.log(`types: ${countAll(en.types, it.types)} → ${countAll(en.types, updatedIt.types)}`);

console.log('\n✅ Massive translation complete!');
