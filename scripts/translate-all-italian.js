#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const IT_PATH = path.join(__dirname, '../src/locales/it.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const it = JSON.parse(fs.readFileSync(IT_PATH, 'utf8'));

// Deep merge utility
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

// Comprehensive Italian translations matching actual structure
const translations = {
  services: {
    league: {
      matchNotFound: 'Partita non trovata',
      leagueNotFound: 'Lega non trovata',
      invalidMatchData: 'Dati partita non validi',
      noPermission: 'Non hai il permesso di modificare questa lega',
    },
    team: {
      inviteAlreadyPending: 'Un invito di squadra è già in sospeso con questo partner.',
      teamAlreadyConfirmed: 'Hai già una squadra confermata con questo partner.',
      playerHasTeam: 'Questo giocatore ha già una squadra confermata per questo torneo.',
      inviterAlreadyHasTeam: 'Hai già una squadra confermata per questo torneo.',
      teamInvitationSent: 'Invito di squadra inviato con successo',
      teamInvitationAccepted: 'Invito di squadra accettato',
      teamInvitationRejected: 'Invito di squadra rifiutato',
      teamDisbanded: 'Squadra sciolta',
      partnerNotFound: 'Partner non trovato',
      invalidTeamData: 'Dati squadra non validi',
      noTeamFound: 'Nessuna squadra trovata',
    },
    ranking: {
      rankingUpdated: 'Classifica aggiornata con successo',
      invalidRankingData: 'Dati classifica non validi',
      rankingNotFound: 'Classifica non trovata',
    },
    map: {
      locationNotFound: 'Posizione non trovata',
      invalidLocation: 'Posizione non valida',
      noNearbyFacilities: 'Nessuna struttura nelle vicinanze',
    },
    clubComms: {
      messageSent: 'Messaggio inviato con successo',
      messageDeleted: 'Messaggio eliminato',
      invalidMessage: 'Messaggio non valido',
      noPermission: 'Non hai il permesso di inviare messaggi in questo club',
    },
  },

  duesManagement: {
    tabs: {
      report: 'Report',
      overview: 'Panoramica',
      members: 'Membri',
      history: 'Storico',
    },
    status: {
      paid: 'Pagato',
      unpaid: 'Non Pagato',
      exempt: 'Esente',
      overdue: 'Scaduto',
      pending: 'In Attesa',
      partial: 'Parziale',
    },
    fees: {
      monthly: 'Mensile',
      quarterly: 'Trimestrale',
      annual: 'Annuale',
      oneTime: 'Una Tantum',
      membership: 'Iscrizione',
      event: 'Evento',
      facility: 'Struttura',
    },
    actions: {
      pay: 'Paga',
      waive: 'Cancella',
      exempt: 'Esenta',
      remind: 'Ricorda',
      export: 'Esporta',
      print: 'Stampa',
      download: 'Scarica',
    },
    messages: {
      paymentSuccess: 'Pagamento effettuato con successo',
      paymentFailed: 'Pagamento fallito',
      reminderSent: 'Promemoria inviato',
      feeWaived: 'Quota cancellata',
      memberExempted: 'Membro esentato',
      noPaymentMethod: 'Nessun metodo di pagamento configurato',
      insufficientFunds: 'Fondi insufficienti',
    },
    labels: {
      dueDate: 'Data Scadenza',
      amount: 'Importo',
      balance: 'Saldo',
      paid: 'Pagato',
      outstanding: 'Da Pagare',
      total: 'Totale',
      member: 'Membro',
      description: 'Descrizione',
      category: 'Categoria',
      paymentMethod: 'Metodo di Pagamento',
    },
  },

  leagueDetail: {
    leagueDeleted: 'Lega Eliminata',
    leagueDeletedByAdmin:
      'Questa lega è stata eliminata da un altro amministratore. Crea una nuova lega se necessario.',
    unknownUser: 'Utente Sconosciuto',
    unknownPlayer: 'Sconosciuto',
    errorLoadingLeague: 'Impossibile caricare le informazioni della lega',
    leagueNotFound: 'Lega non trovata',
    noPermission: 'Non hai il permesso di visualizzare questa lega',
    tabs: {
      overview: 'Panoramica',
      standings: 'Classifiche',
      schedule: 'Calendario',
      participants: 'Partecipanti',
      rules: 'Regole',
      prizes: 'Premi',
    },
    status: {
      upcoming: 'In Arrivo',
      active: 'Attiva',
      completed: 'Completata',
      cancelled: 'Annullata',
    },
    standings: {
      rank: 'Pos',
      player: 'Giocatore',
      matches: 'Partite',
      wins: 'V',
      losses: 'S',
      winRate: '% Vitt',
      points: 'Punti',
    },
    actions: {
      join: 'Iscriviti',
      leave: 'Abbandona',
      edit: 'Modifica',
      delete: 'Elimina',
      share: 'Condividi',
      export: 'Esporta',
    },
    messages: {
      joinedSuccessfully: 'Iscritto alla lega con successo',
      leftSuccessfully: 'Hai abbandonato la lega',
      registrationClosed: 'Le iscrizioni sono chiuse',
      leagueFull: 'La lega è al completo',
      alreadyRegistered: 'Sei già iscritto a questa lega',
    },
  },

  clubLeaguesTournaments: {
    buttons: {
      rejected: 'Rifiutato',
      sendInvitation: 'Invia Invito Squadra',
      sendingInvitation: 'Invio Invito...',
      accept: 'Accetta',
      reject: 'Rifiuta',
      register: 'Iscriviti',
      withdraw: 'Ritirati',
      viewDetails: 'Vedi Dettagli',
      edit: 'Modifica',
      delete: 'Elimina',
    },
    status: {
      registrationOpen: 'Iscrizioni Aperte',
      registrationClosed: 'Iscrizioni Chiuse',
      inProgress: 'In Corso',
      completed: 'Completato',
      cancelled: 'Annullato',
      upcoming: 'In Arrivo',
    },
    tabs: {
      leagues: 'Leghe',
      tournaments: 'Tornei',
      active: 'Attivi',
      upcoming: 'In Arrivo',
      completed: 'Completati',
    },
    filters: {
      all: 'Tutti',
      registered: 'Iscritti',
      notRegistered: 'Non Iscritti',
      bySkillLevel: 'Per Livello',
      byDate: 'Per Data',
    },
    messages: {
      invitationSent: 'Invito inviato con successo',
      invitationAccepted: 'Invito accettato',
      invitationRejected: 'Invito rifiutato',
      registrationSuccess: 'Iscrizione completata con successo',
      withdrawalSuccess: 'Ritiro effettuato con successo',
      noEventsFound: 'Nessun evento trovato',
    },
  },

  clubTournamentManagement: {
    loading: 'Caricamento tornei...',
    tabs: {
      active: 'Attivi',
      completed: 'Completati',
      all: 'Tutti',
    },
    detailTabs: {
      matches: 'Partite',
      participants: 'Partecipanti',
      bpaddle: 'Tabellone',
      standings: 'Classifiche',
      prizes: 'Premi',
      settings: 'Impostazioni',
    },
    actions: {
      create: 'Crea Torneo',
      edit: 'Modifica',
      delete: 'Elimina',
      start: 'Inizia',
      end: 'Termina',
      cancel: 'Annulla',
      generateBpaddle: 'Genera Tabellone',
      updateStandings: 'Aggiorna Classifiche',
    },
    format: {
      singleElimination: 'Eliminazione Diretta',
      doubleElimination: 'Doppia Eliminazione',
      roundRobin: "Girone all'Italiana",
      mixed: 'Misto',
    },
    participant: {
      checkIn: 'Check-in',
      noShow: 'Assente',
      approved: 'Approvato',
      pending: 'In Attesa',
      rejected: 'Rifiutato',
    },
    match: {
      scheduled: 'Programmata',
      live: 'In Corso',
      completed: 'Completata',
      cancelled: 'Annullata',
      walkover: 'Walkover',
      defaultWin: 'Vittoria per Default',
    },
    messages: {
      tournamentCreated: 'Torneo creato con successo',
      tournamentUpdated: 'Torneo aggiornato',
      tournamentDeleted: 'Torneo eliminato',
      bpaddleGenerated: 'Tabellone generato',
      scoreUpdated: 'Punteggio aggiornato',
      participantCheckedIn: 'Partecipante registrato',
      noParticipants: 'Nessun partecipante',
      tournamentFull: 'Torneo al completo',
    },
  },
};

// Apply translations
console.log('Applying comprehensive Italian translations...\n');

const updatedIt = deepMerge(it, translations);

// Count improvements
function countUntranslated(enObj, itObj) {
  let count = 0;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], itObj[key] || {});
    } else {
      if (!itObj[key] || itObj[key] === enObj[key]) {
        count++;
      }
    }
  }
  return count;
}

const beforeServices = countUntranslated(en.services, it.services);
const afterServices = countUntranslated(en.services, updatedIt.services);

const beforeDues = countUntranslated(en.duesManagement, it.duesManagement);
const afterDues = countUntranslated(en.duesManagement, updatedIt.duesManagement);

const beforeLeague = countUntranslated(en.leagueDetail, it.leagueDetail);
const afterLeague = countUntranslated(en.leagueDetail, updatedIt.leagueDetail);

const beforeClubLeagues = countUntranslated(en.clubLeaguesTournaments, it.clubLeaguesTournaments);
const afterClubLeagues = countUntranslated(
  en.clubLeaguesTournaments,
  updatedIt.clubLeaguesTournaments
);

const beforeClubTournament = countUntranslated(
  en.clubTournamentManagement,
  it.clubTournamentManagement
);
const afterClubTournament = countUntranslated(
  en.clubTournamentManagement,
  updatedIt.clubTournamentManagement
);

console.log('Translation Results:');
console.log(
  `services: ${beforeServices} → ${afterServices} (${beforeServices - afterServices} translated)`
);
console.log(`duesManagement: ${beforeDues} → ${afterDues} (${beforeDues - afterDues} translated)`);
console.log(
  `leagueDetail: ${beforeLeague} → ${afterLeague} (${beforeLeague - afterLeague} translated)`
);
console.log(
  `clubLeaguesTournaments: ${beforeClubLeagues} → ${afterClubLeagues} (${beforeClubLeagues - afterClubLeagues} translated)`
);
console.log(
  `clubTournamentManagement: ${beforeClubTournament} → ${afterClubTournament} (${beforeClubTournament - afterClubTournament} translated)`
);

const totalTranslated =
  beforeServices -
  afterServices +
  (beforeDues - afterDues) +
  (beforeLeague - afterLeague) +
  (beforeClubLeagues - afterClubLeagues) +
  (beforeClubTournament - afterClubTournament);

console.log(`\nTotal translated in this batch: ${totalTranslated} keys`);

// Save
fs.writeFileSync(IT_PATH, JSON.stringify(updatedIt, null, 2), 'utf8');
console.log('\n✅ Translations saved to it.json');
