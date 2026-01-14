#!/usr/bin/env node

/**
 * Italian Translation Script - ROUND 3
 * Focuses on: duesManagement, services, leagueDetail, clubTournamentManagement
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
  // League Detail section (102 keys)
  leagueDetail: {
    tabs: {
      overview: 'Panoramica',
      standings: 'Classifica',
      schedule: 'Calendario',
      members: 'Membri',
      rules: 'Regole',
      settings: 'Impostazioni',
    },
    overview: {
      description: 'Descrizione',
      startDate: 'Data di Inizio',
      endDate: 'Data di Fine',
      format: 'Formato',
      skillLevel: 'Livello di Abilità',
      maxParticipants: 'Massimo Partecipanti',
      currentParticipants: 'Partecipanti Attuali',
      registrationDeadline: 'Scadenza Iscrizione',
      organizer: 'Organizzatore',
      location: 'Sede',
      entryFee: 'Quota di Iscrizione',
      prizes: 'Premi',
      sponsors: 'Sponsor',
    },
    standings: {
      title: 'Classifica Lega',
      rank: 'Pos',
      player: 'Giocatore',
      team: 'Squadra',
      played: 'G',
      won: 'V',
      lost: 'P',
      points: 'Pt',
      winRate: '% Vitt',
      streak: 'Serie',
      lastMatch: 'Ultima Partita',
      form: 'Forma',
    },
    schedule: {
      title: 'Calendario Partite',
      upcoming: 'Prossime',
      completed: 'Completate',
      round: 'Turno',
      match: 'Partita',
      date: 'Data',
      time: 'Ora',
      location: 'Sede',
      court: 'Campo',
      result: 'Risultato',
      viewDetails: 'Visualizza Dettagli',
    },
    members: {
      title: 'Membri Lega',
      captain: 'Capitano',
      coCaptain: 'Vice Capitano',
      player: 'Giocatore',
      substitute: 'Sostituto',
      status: 'Stato',
      active: 'Attivo',
      inactive: 'Inattivo',
      suspended: 'Sospeso',
      addMember: 'Aggiungi Membro',
      removeMember: 'Rimuovi Membro',
      assignRole: 'Assegna Ruolo',
    },
    registration: {
      title: 'Registrazione Lega',
      register: 'Registrati',
      withdraw: 'Ritirati',
      confirmRegistration: 'Conferma Iscrizione',
      confirmWithdrawal: 'Conferma Ritiro',
      registrationClosed: 'Iscrizioni Chiuse',
      registrationFull: 'Lega Completa',
      waitlist: "Lista d'Attesa",
      joinWaitlist: "Entra in Lista d'Attesa",
      paymentRequired: 'Pagamento Richiesto',
      payNow: 'Paga Ora',
    },
    rules: {
      title: 'Regole Lega',
      format: 'Formato',
      scoring: 'Punteggio',
      tiebreaker: 'Spareggio',
      substitutions: 'Sostituzioni',
      conduct: 'Condotta',
      penalties: 'Penalità',
      appeals: 'Ricorsi',
    },
    manage: {
      title: 'Gestisci Lega',
      edit: 'Modifica Lega',
      delete: 'Elimina Lega',
      addRound: 'Aggiungi Turno',
      generateSchedule: 'Genera Calendario',
      recordResult: 'Registra Risultato',
      sendAnnouncement: 'Invia Annuncio',
      exportData: 'Esporta Dati',
    },
  },

  // Club Tournament Management (101 keys)
  clubTournamentManagement: {
    title: 'Gestione Tornei',
    createTournament: 'Crea Torneo',
    editTournament: 'Modifica Torneo',
    deleteTournament: 'Elimina Torneo',
    tournamentList: 'Elenco Tornei',
    basic: {
      title: 'Informazioni di Base',
      name: 'Nome Torneo',
      description: 'Descrizione',
      type: 'Tipo',
      format: 'Formato',
      startDate: 'Data di Inizio',
      endDate: 'Data di Fine',
      registrationDeadline: 'Scadenza Iscrizione',
      maxParticipants: 'Massimo Partecipanti',
      minParticipants: 'Minimo Partecipanti',
      entryFee: 'Quota di Iscrizione',
      venue: 'Sede',
      courtType: 'Tipo di Campo',
    },
    types: {
      singles: 'Singolo',
      doubles: 'Doppio',
      mixed: 'Misto',
      team: 'Squadra',
    },
    formats: {
      singleElimination: 'Eliminazione Diretta',
      doubleElimination: 'Doppia Eliminazione',
      roundRobin: "Girone all'Italiana",
      swiss: 'Sistema Svizzero',
      ladder: 'Scala',
      pool: 'Gironi',
    },
    registration: {
      title: 'Iscrizione',
      open: 'Aperta',
      closed: 'Chiusa',
      full: 'Completa',
      participants: 'Partecipanti',
      waitlist: "Lista d'Attesa",
      approve: 'Approva',
      reject: 'Rifiuta',
      confirmParticipants: 'Conferma Partecipanti',
      sendInvitations: 'Invia Inviti',
      registrationStatus: 'Stato Iscrizione',
    },
    draw: {
      title: 'Tabellone',
      generate: 'Genera Tabellone',
      regenerate: 'Rigenera Tabellone',
      seed: 'Testa di Serie',
      seedPlayers: 'Giocatori Testa di Serie',
      random: 'Casuale',
      manual: 'Manuale',
      viewDraw: 'Visualizza Tabellone',
      editDraw: 'Modifica Tabellone',
      publishDraw: 'Pubblica Tabellone',
    },
    schedule: {
      title: 'Calendario',
      generateSchedule: 'Genera Calendario',
      round: 'Turno',
      match: 'Partita',
      court: 'Campo',
      time: 'Ora',
      assignCourts: 'Assegna Campi',
      assignTimes: 'Assegna Orari',
      conflicts: 'Conflitti',
      autoSchedule: 'Programmazione Automatica',
    },
    matches: {
      title: 'Partite',
      upcoming: 'Prossime',
      inProgress: 'In Corso',
      completed: 'Completate',
      recordScore: 'Registra Punteggio',
      winner: 'Vincitore',
      loser: 'Perdente',
      score: 'Punteggio',
      walkover: 'Walkover',
      defaultWin: 'Vittoria a Tavolino',
      retired: 'Ritirato',
      noShow: 'Assente',
    },
    results: {
      title: 'Risultati',
      champion: 'Campione',
      runnerUp: 'Finalista',
      thirdPlace: 'Terzo Posto',
      consolation: 'Consolazione',
      finalStandings: 'Classifica Finale',
      awards: 'Premi',
      certificates: 'Certificati',
      publishResults: 'Pubblica Risultati',
    },
    settings: {
      title: 'Impostazioni Torneo',
      visibility: 'Visibilità',
      public: 'Pubblico',
      private: 'Privato',
      membersOnly: 'Solo Membri',
      allowSpectators: 'Consenti Spettatori',
      liveScoring: 'Punteggio Live',
      notifications: 'Notifiche',
      reminders: 'Promemoria',
      advancedSettings: 'Impostazioni Avanzate',
    },
    prizes: {
      title: 'Premi',
      firstPlace: 'Primo Posto',
      secondPlace: 'Secondo Posto',
      thirdPlace: 'Terzo Posto',
      totalPrizePool: 'Montepremi Totale',
      cash: 'Contanti',
      trophy: 'Trofeo',
      medal: 'Medaglia',
      other: 'Altro',
    },
  },

  // Club Dues Management (59 keys)
  clubDuesManagement: {
    title: 'Gestione Quote Club',
    overview: {
      title: 'Panoramica',
      totalMembers: 'Totale Membri',
      paidMembers: 'Membri Paganti',
      unpaidMembers: 'Membri Non Paganti',
      totalCollected: 'Totale Raccolto',
      totalOutstanding: 'Totale da Incassare',
      collectionRate: 'Tasso di Riscossione',
    },
    configure: {
      title: 'Configura Quote',
      amount: 'Importo',
      frequency: 'Frequenza',
      monthly: 'Mensile',
      quarterly: 'Trimestrale',
      annual: 'Annuale',
      oneTime: 'Una Tantum',
      dueDate: 'Data di Scadenza',
      gracePeriod: 'Periodo di Grazia',
      lateFee: 'Penale per Ritardo',
      description: 'Descrizione',
      save: 'Salva Configurazione',
    },
    members: {
      title: 'Quote Membri',
      member: 'Membro',
      amount: 'Importo',
      status: 'Stato',
      lastPayment: 'Ultimo Pagamento',
      nextDue: 'Prossima Scadenza',
      paid: 'Pagato',
      unpaid: 'Non Pagato',
      overdue: 'Scaduto',
      exempt: 'Esente',
      recordPayment: 'Registra Pagamento',
      sendReminder: 'Invia Promemoria',
      viewHistory: 'Visualizza Storico',
    },
    payments: {
      title: 'Pagamenti',
      date: 'Data',
      member: 'Membro',
      amount: 'Importo',
      method: 'Metodo',
      reference: 'Riferimento',
      notes: 'Note',
      receipt: 'Ricevuta',
      void: 'Annulla',
      refund: 'Rimborso',
    },
    reminders: {
      title: 'Promemoria',
      sendTo: 'Invia A',
      allUnpaid: 'Tutti i Non Paganti',
      overdue: 'Solo Scaduti',
      custom: 'Personalizzato',
      template: 'Modello',
      subject: 'Oggetto',
      message: 'Messaggio',
      send: 'Invia Promemoria',
    },
  },

  // Profile Settings (55 keys)
  profileSettings: {
    title: 'Impostazioni Profilo',
    sections: {
      personal: 'Informazioni Personali',
      tennis: 'Informazioni Tennis',
      preferences: 'Preferenze',
      privacy: 'Privacy',
      notifications: 'Notifiche',
      account: 'Account',
    },
    personal: {
      displayName: 'Nome Visualizzato',
      bio: 'Biografia',
      location: 'Posizione',
      dateOfBirth: 'Data di Nascita',
      gender: 'Genere',
      phoneNumber: 'Numero di Telefono',
      email: 'Email',
      profilePhoto: 'Foto Profilo',
      changePhoto: 'Cambia Foto',
      removePhoto: 'Rimuovi Foto',
    },
    tennis: {
      skillLevel: 'Livello di Abilità',
      playingHand: 'Mano di Gioco',
      rightHanded: 'Destrorso',
      leftHanded: 'Mancino',
      preferredCourtSurface: 'Superficie Preferita',
      preferredPlayingTime: 'Orario Preferito',
      yearsPlaying: 'Anni di Gioco',
      favoriteShot: 'Colpo Preferito',
      playingStyle: 'Stile di Gioco',
    },
    preferences: {
      language: 'Lingua',
      theme: 'Tema',
      light: 'Chiaro',
      dark: 'Scuro',
      auto: 'Automatico',
      units: 'Unità',
      metric: 'Metrico',
      imperial: 'Imperiale',
      timezone: 'Fuso Orario',
      dateFormat: 'Formato Data',
      timeFormat: 'Formato Ora',
    },
    privacy: {
      profileVisibility: 'Visibilità Profilo',
      public: 'Pubblico',
      friendsOnly: 'Solo Amici',
      private: 'Privato',
      showEmail: 'Mostra Email',
      showPhone: 'Mostra Telefono',
      showLocation: 'Mostra Posizione',
      showStats: 'Mostra Statistiche',
      allowMessages: 'Consenti Messaggi',
      allowFriendRequests: 'Consenti Richieste di Amicizia',
    },
    notifications: {
      push: 'Notifiche Push',
      email: 'Notifiche Email',
      sms: 'Notifiche SMS',
      matchInvites: 'Inviti a Partite',
      matchReminders: 'Promemoria Partite',
      clubUpdates: 'Aggiornamenti Club',
      friendRequests: 'Richieste di Amicizia',
      messages: 'Messaggi',
      newsletter: 'Newsletter',
      promotions: 'Promozioni',
    },
    account: {
      changePassword: 'Cambia Password',
      currentPassword: 'Password Attuale',
      newPassword: 'Nuova Password',
      confirmPassword: 'Conferma Password',
      twoFactor: 'Autenticazione a Due Fattori',
      enable: 'Abilita',
      disable: 'Disabilita',
      linkedAccounts: 'Account Collegati',
      deactivateAccount: 'Disattiva Account',
      deleteAccount: 'Elimina Account',
    },
  },

  // Profile (52 keys)
  profile: {
    tabs: {
      overview: 'Panoramica',
      stats: 'Statistiche',
      matches: 'Partite',
      achievements: 'Obiettivi',
      friends: 'Amici',
      clubs: 'Club',
    },
    overview: {
      about: 'Info',
      joined: 'Iscritto',
      location: 'Posizione',
      skillLevel: 'Livello',
      playingStyle: 'Stile',
      availability: 'Disponibilità',
    },
    stats: {
      overall: 'Generali',
      recent: 'Recenti',
      matchesPlayed: 'Partite Giocate',
      wins: 'Vittorie',
      losses: 'Sconfitte',
      winRate: '% Vittorie',
      currentStreak: 'Serie Attuale',
      longestStreak: 'Serie più Lunga',
      totalHours: 'Ore Totali',
      averageMatchDuration: 'Durata Media Partita',
      favoriteOpponent: 'Avversario Preferito',
      bestSurface: 'Miglior Superficie',
    },
    matches: {
      upcoming: 'Prossime',
      completed: 'Completate',
      cancelled: 'Annullate',
      vs: 'vs',
      won: 'Vinto',
      lost: 'Perso',
      result: 'Risultato',
      noMatches: 'Nessuna Partita',
    },
    achievements: {
      total: 'Totale Obiettivi',
      unlocked: 'Sbloccati',
      locked: 'Bloccati',
      inProgress: 'In Corso',
      recent: 'Recenti',
      viewAll: 'Visualizza Tutti',
      categories: {
        matches: 'Partite',
        wins: 'Vittorie',
        tournaments: 'Tornei',
        social: 'Social',
        special: 'Speciali',
      },
    },
    friends: {
      total: 'Amici',
      mutual: 'Amici in Comune',
      viewAll: 'Visualizza Tutti',
      addFriend: 'Aggiungi Amico',
      removeFriend: 'Rimuovi Amico',
      pending: 'In Attesa',
      noFriends: 'Nessun Amico',
    },
    clubs: {
      member: 'Membro di',
      admin: 'Amministratore di',
      viewAll: 'Visualizza Tutti',
      joinClub: 'Entra nel Club',
      leaveClub: 'Lascia Club',
      noClubs: 'Nessun Club',
    },
    actions: {
      message: 'Messaggio',
      invite: 'Invita',
      follow: 'Segui',
      unfollow: 'Non Seguire',
      block: 'Blocca',
      unblock: 'Sblocca',
      report: 'Segnala',
      share: 'Condividi',
      edit: 'Modifica',
    },
  },

  // Additional common terms
  courtSurfaces: {
    hard: 'Cemento',
    clay: 'Terra Battuta',
    grass: 'Erba',
    carpet: 'Sintetico',
    indoor: 'Indoor',
    outdoor: 'Outdoor',
  },

  timeOfDay: {
    morning: 'Mattina',
    afternoon: 'Pomeriggio',
    evening: 'Sera',
    night: 'Notte',
    anytime: 'Qualsiasi Momento',
  },

  playingStyles: {
    aggressive: 'Aggressivo',
    defensive: 'Difensivo',
    allCourt: 'Completo',
    baseline: 'Da Fondo',
    serveAndVolley: 'Servizio e Volée',
    counterpuncher: 'Contrattacco',
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

console.log('🇮🇹 Italian Translation - ROUND 3\n');
console.log(`Total new translations: ${countKeys(italianTranslations)}`);

const updated = deepMerge(it, italianTranslations);

fs.writeFileSync(IT_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('\n✅ Translation complete!');
console.log(`📝 Updated file: ${IT_PATH}`);
