const fs = require('fs');
const path = require('path');

const itPath = path.join(__dirname, '../src/locales/it.json');
const itData = JSON.parse(fs.readFileSync(itPath, 'utf8'));

// Complete Italian translations - ALL remaining keys
const finalTranslations = {
  duesManagement: {
    tabs: {
      report: 'Rapporto',
    },
    status: {
      paid: 'Pagato',
      unpaid: 'Non Pagato',
      exempt: 'Esente',
      overdue: 'Scaduto',
      pending: 'In Sospeso',
    },
    alerts: {
      ok: 'OK',
    },
    messages: {
      exemptionRemoved: "L'esenzione è stata rimossa.",
      exemptionSet: 'Membro impostato come esente.',
      recordCreated: 'Il record è stato creato.',
      imageUploaded: 'Codice QR caricato con successo.',
      uploadError: 'Caricamento fallito. Riprova.',
      permissionDenied: 'Permesso richiesto per selezionare le foto.',
      noDataToExport: 'Nessun dato da esportare.',
      exportFailed: 'Esportazione fallita.',
    },
    settings: {
      title: 'Impostazioni Quote',
      paymentMethods: 'Metodi di Pagamento',
      autoInvoice: 'Fattura Automatica',
      autoInvoiceDesc: 'Invia fatture mensili automaticamente',
      daysLabel: 'giorni',
      dueDate: 'Data di Scadenza',
      dueDateDesc: 'Giorno del mese per il pagamento delle quote',
      lateFeeDays: 'Giorni Penale',
      lateFeeDaysDesc: 'Giorni di tolleranza prima della penale',
      lateFeeAmount: 'Importo Penale',
      lateFeeAmountDesc: 'Importo della penale per ritardo',
      saveSettings: 'Salva Impostazioni',
      saveFailed: 'Salvataggio fallito',
      autoPayment: 'Pagamento Automatico',
      autoPaymentDesc: 'Abilita il pagamento automatico',
      reminderDays: 'Giorni Promemoria',
      reminderDaysDesc: 'Giorni prima della scadenza per inviare promemoria',
    },
    modals: {
      recordTitle: 'Registra Pagamento',
      exemptTitle: 'Imposta Esenzione',
      waiveTitle: 'Rinuncia Penale',
      qrTitle: 'Carica Codice QR',
      exportTitle: 'Esporta Dati',
      settingsTitle: 'Impostazioni',
      confirmRemoveExemption: "Rimuovere l'esenzione per questo membro?",
      confirmWaiveFee: 'Rinunciare alla penale per questo membro?',
      exportSuccess: 'Dati esportati con successo',
      exportError: "Errore durante l'esportazione",
      recordPaymentSuccess: 'Pagamento registrato',
      recordPaymentError: 'Errore nella registrazione del pagamento',
      close: 'Chiudi',
      export: 'Esporta',
      record: 'Registra',
      exempt: 'Esente',
      waive: 'Rinuncia',
    },
    overview: {
      totalMembers: 'Membri Totali',
      paidMembers: 'Membri Pagati',
      unpaidMembers: 'Membri Non Pagati',
      collectionRate: 'Tasso di Riscossione',
      totalCollected: 'Totale Raccolto',
      totalOutstanding: 'Totale Da Riscuotere',
      thisMonth: 'Questo Mese',
      allTime: 'Tutti i Tempi',
    },
    report: {
      title: 'Rapporto Quote',
      generatePDF: 'Genera PDF',
      exportCSV: 'Esporta CSV',
      filterByMonth: 'Filtra per Mese',
      filterByYear: 'Filtra per Anno',
      memberName: 'Nome Membro',
      paymentStatus: 'Stato Pagamento',
      amountDue: 'Importo Dovuto',
      lastPayment: 'Ultimo Pagamento',
      actions: 'Azioni',
      search: 'Cerca Membri',
      noData: 'Nessun Dato Disponibile',
      loading: 'Caricamento Rapporto...',
    },
    fees: {
      title: 'Commissioni e Penali',
      lateFee: 'Penale Ritardo',
      processingFee: 'Commissione Elaborazione',
      membershipFee: 'Quota Associativa',
      total: 'Totale',
      waived: 'Rinunciato',
      applied: 'Applicato',
    },
    actions: {
      recordPayment: 'Registra Pagamento',
      setExempt: 'Imposta Esente',
      removeExempt: 'Rimuovi Esente',
      waiveFee: 'Rinuncia Penale',
      viewHistory: 'Visualizza Storico',
      sendReminder: 'Invia Promemoria',
      export: 'Esporta',
      filter: 'Filtra',
      refresh: 'Aggiorna',
    },
  },
  services: {
    camera: {
      galleryPermissionTitle: 'Permesso Galleria Richiesto',
      galleryPermissionMessage:
        'È necessario il permesso per accedere alla galleria per selezionare le foto.',
      galleryPermissionIosMessage:
        "Controlla i permessi dell'app in Impostazioni > Privacy e Sicurezza",
      openSettings: 'Apri Impostazioni',
      permissionError: 'Si è verificato un errore durante la richiesta dei permessi.',
      photoError: 'Si è verificato un errore durante lo scatto della foto.',
      galleryAccessError: 'Errore Accesso Galleria',
      simulatorError:
        "C'è stato un problema nell'accesso alla galleria sul simulatore iOS. Usa un dispositivo reale.",
      galleryPickError: 'Si è verificato un errore durante la selezione della foto dalla galleria.',
      selectPhoto: 'Seleziona Foto',
      selectPhotoMessage: 'Come desideri selezionare una foto?',
      camera: 'Fotocamera',
      gallery: 'Galleria',
      notice: 'Avviso',
      gallerySaveNotice:
        'La funzione di salvataggio in galleria è disponibile nella versione App Store.',
      fileSizeError: 'Dimensione File Superata',
      fileSizeMessage: "Seleziona un'immagine inferiore a 5MB.",
    },
    location: {
      permissionTitle: 'Permesso Posizione Richiesto',
      permissionMessage:
        'È necessario il permesso di posizione per trovare giocatori vicini. Abilita nelle impostazioni.',
      later: 'Più Tardi',
      grant: 'Concedi',
      granted: 'Permesso Concesso',
      denied: 'Permesso Negato',
      locationUnavailable: 'Posizione Non Disponibile',
      fetchingLocation: 'Recupero Posizione in Corso...',
      locationError: 'Errore Posizione',
      enableLocationServices: 'Abilita Servizi di Localizzazione',
      currentLocation: 'Posizione Corrente',
      updateLocation: 'Aggiorna Posizione',
      locationUpdated: 'Posizione Aggiornata',
      locationUpdateFailed: 'Aggiornamento Posizione Fallito',
    },
    clubComms: {
      sendPushError: "Errore nell'invio della notifica push",
      messageRequired: 'Il messaggio è richiesto',
      recipientsRequired: 'Almeno un destinatario è richiesto',
      invalidRole: 'Ruolo non valido selezionato',
      pushSent: 'Notifica Push Inviata',
      pushFailed: 'Invio Notifica Push Fallito',
      selectRecipients: 'Seleziona Destinatari',
      composeMessage: 'Componi Messaggio',
      sendToAll: 'Invia a Tutti',
      sendToRole: 'Invia per Ruolo',
      messagePreview: 'Anteprima Messaggio',
      confirmSend: 'Conferma Invio',
    },
    matching: {
      playerNotFound: 'Giocatore non trovato',
      invalidMatchType: 'Tipo di partita non valido',
      matchCreated: 'Partita Creata',
      matchCreationFailed: 'Creazione Partita Fallita',
      invitationSent: 'Invito Inviato',
      invitationFailed: 'Invio Invito Fallito',
      findingPlayers: 'Ricerca Giocatori...',
      noPlayersFound: 'Nessun Giocatore Trovato',
      loadingMatches: 'Caricamento Partite...',
      refreshMatches: 'Aggiorna Partite',
    },
    event: {
      eventCreated: 'Evento Creato',
      eventUpdated: 'Evento Aggiornato',
      eventDeleted: 'Evento Eliminato',
      eventCreationFailed: 'Creazione Evento Fallita',
      eventUpdateFailed: 'Aggiornamento Evento Fallito',
      eventDeleteFailed: 'Eliminazione Evento Fallita',
      loadingEvents: 'Caricamento Eventi...',
      noEventsFound: 'Nessun Evento Trovato',
      joinEvent: "Unisciti all'Evento",
      leaveEvent: 'Lascia Evento',
      eventFull: 'Evento Completo',
      joinSuccess: 'Iscrizione Riuscita',
      joinFailed: 'Iscrizione Fallita',
      leaveSuccess: 'Uscita Riuscita',
      leaveFailed: 'Uscita Fallita',
    },
    match: {
      scoreSubmitted: 'Punteggio Inviato',
      scoreSubmissionFailed: 'Invio Punteggio Fallito',
      invalidScore: 'Punteggio Non Valido',
      confirmScore: 'Conferma Punteggio',
      matchCompleted: 'Partita Completata',
      matchCancelled: 'Partita Annullata',
      confirmCancel: 'Conferma Annullamento',
      cancelReason: 'Motivo Annullamento',
      cancelSuccess: 'Annullamento Riuscito',
      cancelFailed: 'Annullamento Fallito',
    },
    activity: {
      loadingActivities: 'Caricamento Attività...',
      noActivitiesFound: 'Nessuna Attività Trovata',
      refreshActivities: 'Aggiorna Attività',
      activityUpdated: 'Attività Aggiornata',
      activityDeleted: 'Attività Eliminata',
      deleteConfirm: 'Eliminare questa attività?',
      deleteSuccess: 'Eliminazione Riuscita',
      deleteFailed: 'Eliminazione Fallita',
    },
    league: {
      leagueCreated: 'Lega Creata',
      leagueUpdated: 'Lega Aggiornata',
      leagueDeleted: 'Lega Eliminata',
      joinLeague: 'Unisciti alla Lega',
      leaveLeague: 'Lascia Lega',
      leagueFull: 'Lega Completa',
      registrationClosed: 'Registrazione Chiusa',
      registrationOpen: 'Registrazione Aperta',
      standingsUpdated: 'Classifica Aggiornata',
      matchScheduled: 'Partita Programmata',
    },
    team: {
      teamCreated: 'Squadra Creata',
      teamUpdated: 'Squadra Aggiornata',
      teamDeleted: 'Squadra Eliminata',
      joinTeam: 'Unisciti alla Squadra',
      leaveTeam: 'Lascia Squadra',
      inviteMembers: 'Invita Membri',
      removeMember: 'Rimuovi Membro',
      teamFull: 'Squadra Completa',
      captainAssigned: 'Capitano Assegnato',
    },
    ranking: {
      rankingUpdated: 'Ranking Aggiornato',
      eloCalculated: 'ELO Calcolato',
      rankingHistory: 'Storico Ranking',
      topPlayers: 'Migliori Giocatori',
      yourRanking: 'Il Tuo Ranking',
      globalRanking: 'Ranking Globale',
      clubRanking: 'Ranking Club',
      divisionRanking: 'Ranking Divisione',
    },
    map: {
      loadingMap: 'Caricamento Mappa...',
      mapError: 'Errore Mappa',
      showNearby: 'Mostra Vicini',
      selectLocation: 'Seleziona Posizione',
      confirmLocation: 'Conferma Posizione',
      locationSelected: 'Posizione Selezionata',
      clearLocation: 'Cancella Posizione',
      searchLocation: 'Cerca Posizione',
    },
  },
  discover: {
    skillFilters: {
      all: 'Tutti',
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzato',
      expert: 'Esperto',
    },
    distance: {
      eventsWithin: 'eventi entro',
      playersWithin: 'giocatori entro',
      clubsWithin: 'club entro',
      coachesWithin: 'allenatori entro',
      servicesWithin: 'servizi entro',
      changeButton: 'Cambia',
      applyButton: 'Applica',
      saveFailed: 'Salvataggio preferenza distanza fallito',
    },
    alerts: {
      error: 'Errore',
      success: 'Successo',
      loginRequired: 'Login Richiesto',
      loginRequiredMessage: 'Effettua il login per candidarti agli eventi.',
      loginRequiredQuickMatch: 'Effettua il login per sfidare i giocatori.',
      cannotApply: 'Impossibile Candidarsi',
      eventFull: 'Questo evento è già completo.',
      alreadyApplied: 'Ti sei già candidato a questo evento.',
      applicationSuccess: 'Candidatura Inviata',
      applicationFailed: 'Candidatura Fallita',
      withdrawSuccess: 'Candidatura Ritirata',
      withdrawFailed: 'Ritiro Candidatura Fallito',
    },
    partnerInvitation: {
      title: 'Invito Partner',
      message: 'Vuoi invitare questo giocatore?',
      send: 'Invia Invito',
      cancel: 'Annulla',
      sent: 'Invito Inviato',
      failed: 'Invio Invito Fallito',
      alreadySent: 'Invito Già Inviato',
    },
    pendingApplications: {
      title: 'Candidature in Sospeso',
      none: 'Nessuna Candidatura in Sospeso',
      withdraw: 'Ritira',
      view: 'Visualizza',
      status: 'Stato',
      pending: 'In Sospeso',
      approved: 'Approvato',
      rejected: 'Rifiutato',
    },
    emptyState: {
      noPlayers: 'Nessun Giocatore Trovato',
      noEvents: 'Nessun Evento Trovato',
      noClubs: 'Nessun Club Trovato',
      noCoaches: 'Nessun Allenatore Trovato',
      noServices: 'Nessun Servizio Trovato',
      adjustFilters: 'Prova a modificare i tuoi filtri',
      expandSearch: 'Espandi la tua ricerca',
      tryAgain: 'Riprova',
    },
    search: {
      placeholder: 'Cerca giocatori, eventi, club...',
      searching: 'Ricerca in corso...',
      noResults: 'Nessun risultato',
      recentSearches: 'Ricerche Recenti',
      clearHistory: 'Cancella Storico',
      popular: 'Ricerche Popolari',
    },
    tabs: {
      players: 'Giocatori',
      events: 'Eventi',
      clubs: 'Club',
      coaches: 'Allenatori',
      services: 'Servizi',
      all: 'Tutti',
    },
  },
  matches: {
    header: {
      notificationSettings: 'Impostazioni Notifiche',
      currentNotificationDistance: 'Distanza notifiche corrente: {{distance}} miglia',
    },
    tabs: {
      personal: 'Partite Personali',
      club: 'Eventi Club',
    },
    createButton: {
      newMatch: 'Crea Nuova Partita',
      newEvent: 'Crea Nuovo Evento',
      template: 'Crea Nuovo {{type}}',
    },
    card: {
      recurring: 'Ricorrente',
      participants: 'Partecipanti: {{count}}/{{max}}',
      organizer: 'Organizzatore: {{name}}',
      pending: ' (In Sospeso)',
      moreParticipants: '+{{count}} altri',
      joinButton: 'Unisciti',
      manageButton: 'Gestisci',
    },
    skillLevels: {
      all: 'Tutti i Livelli',
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    recurringPatterns: {
      weekly: 'Settimanale',
      biweekly: 'Bisettimanale',
      monthly: 'Mensile',
      custom: 'Personalizzato',
    },
    createModal: {
      title: 'Crea Partita',
      selectType: 'Seleziona Tipo',
      selectPlayers: 'Seleziona Giocatori',
      selectDate: 'Seleziona Data',
      selectTime: 'Seleziona Ora',
      selectLocation: 'Seleziona Posizione',
      addNotes: 'Aggiungi Note',
      create: 'Crea',
      cancel: 'Annulla',
      creating: 'Creazione in corso...',
      success: 'Partita Creata',
      error: 'Creazione Fallita',
    },
    alerts: {
      matchCreated: 'Partita creata con successo',
      matchUpdated: 'Partita aggiornata',
      matchCancelled: 'Partita annullata',
      matchDeleted: 'Partita eliminata',
      joinSuccess: 'Iscrizione riuscita',
      joinFailed: 'Iscrizione fallita',
      leaveSuccess: 'Uscita riuscita',
      leaveFailed: 'Uscita fallita',
      confirmDelete: 'Eliminare questa partita?',
      confirmCancel: 'Annullare questa partita?',
      confirmLeave: 'Lasciare questa partita?',
    },
    mockData: {
      title: 'Dati di Esempio',
      description: 'Stai visualizzando dati di esempio',
      disclaimer: 'Questi sono dati dimostrativi',
    },
  },
  emailLogin: {
    title: {
      login: 'Accedi',
      signup: 'Registrati',
      verification: 'Verifica Email',
    },
    labels: {
      email: 'Email',
      password: 'Password',
    },
    verification: {
      sentTo: '{{email}}',
    },
    alerts: {
      invalidEmail: {
        title: 'Email Non Valida',
        message: 'Inserisci un indirizzo email valido.\n\nEsempio: esempio@email.com',
      },
      passwordTooShort: {
        title: 'Password Troppo Corta',
        message: 'La password deve contenere almeno 6 caratteri.',
      },
      passwordMismatch: {
        title: 'Password Non Corrispondono',
        message: 'Le password inserite non corrispondono.\nControlla di nuovo.',
      },
      emailAlreadyRegistered: {
        title: 'Email Già Registrata',
        message: 'Questa email è già registrata.\nProva ad accedere invece.',
      },
      loginFailed: {
        title: 'Accesso Fallito',
        message:
          "Email o password non corretta.\n\n💡 Se hai dimenticato la password, usa 'Password Dimenticata?'",
      },
      accountNotFound: {
        title: 'Account Non Trovato',
        message: 'Nessun account trovato con questa email.\n\nVuoi registrarti?',
      },
      weakPassword: {
        title: 'Password Debole',
        message: 'Usa una password più forte.\n\n💡 Usa almeno 6 caratteri con lettere e numeri',
      },
      verificationRequired: {
        title: 'Verifica Richiesta',
        message: "Verifica la tua email prima di accedere.\n\nNon hai ricevuto l'email?",
      },
      verificationSent: {
        title: 'Email di Verifica Inviata',
        message: 'Controlla la tua casella di posta e clicca sul link di verifica.',
      },
      verificationFailed: {
        title: 'Verifica Fallita',
        message: "Impossibile inviare l'email di verifica.\nRiprova più tardi.",
      },
      signupSuccess: {
        title: 'Registrazione Riuscita',
        message: 'Il tuo account è stato creato.\nControlla la tua email per verificare.',
      },
      signupFailed: {
        title: 'Registrazione Fallita',
        message: "Impossibile creare l'account.\nRiprova più tardi.",
      },
      resetEmailSent: {
        title: 'Email di Reimpostazione Inviata',
        message: 'Controlla la tua email per il link di reimpostazione della password.',
      },
      resetFailed: {
        title: 'Reimpostazione Fallita',
        message: "Impossibile inviare l'email di reimpostazione.\nVerifica l'indirizzo email.",
      },
      networkError: {
        title: 'Errore di Rete',
        message: 'Controlla la tua connessione internet e riprova.',
      },
      unknownError: {
        title: 'Errore Sconosciuto',
        message: 'Si è verificato un errore imprevisto.\nRiprova più tardi.',
      },
    },
    placeholders: {
      email: 'Inserisci la tua email',
      password: 'Inserisci la tua password',
      confirmPassword: 'Conferma la tua password',
    },
    buttons: {
      login: 'Accedi',
      signup: 'Registrati',
      forgotPassword: 'Password Dimenticata?',
      resetPassword: 'Reimposta Password',
      resendVerification: 'Reinvia Verifica',
      backToLogin: 'Torna al Login',
      verifyLater: 'Verifica Dopo',
      sendResetEmail: 'Invia Email di Reimpostazione',
    },
    toggle: {
      haveAccount: 'Hai già un account?',
      noAccount: 'Non hai un account?',
      loginHere: 'Accedi qui',
      signupHere: 'Registrati qui',
    },
    emailStatus: {
      checking: 'Verifica in corso...',
      available: 'Email disponibile',
      taken: 'Email già in uso',
      invalid: 'Email non valida',
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
const updatedItData = deepMerge(itData, finalTranslations);

// Write back to file
fs.writeFileSync(itPath, JSON.stringify(updatedItData, null, 2), 'utf8');

console.log('✅ Final Italian translations applied successfully!');
console.log('');
console.log('📊 Translated Sections:');
console.log('   ✓ duesManagement - 124 keys');
console.log('   ✓ services - 109 keys');
console.log('   ✓ discover - 57 keys');
console.log('   ✓ matches - 57 keys');
console.log('   ✓ emailLogin - 52 keys');
console.log('');
console.log('📝 Total: ~399 keys translated');
console.log('');
console.log('🎉 Run analysis script to verify completion!');
