const fs = require('fs');
const path = require('path');

const itPath = path.join(__dirname, '../src/locales/it.json');
const itData = JSON.parse(fs.readFileSync(itPath, 'utf8'));

// Part 4: Club Tournament Management
const translations = {
  clubTournamentManagement: {
    title: 'Gestione Tornei',
    createTournament: 'Crea Torneo',
    editTournament: 'Modifica Torneo',
    deleteTournament: 'Elimina Torneo',
    viewBracket: 'Visualizza Tabellone',
    registerPlayers: 'Registra Giocatori',
    startTournament: 'Avvia Torneo',
    endTournament: 'Termina Torneo',
    tournamentName: 'Nome Torneo',
    tournamentType: 'Tipo Torneo',
    maxParticipants: 'Massimo Partecipanti',
    registrationDeadline: 'Scadenza Registrazione',
    startDate: 'Data Inizio',
    endDate: 'Data Fine',
    status: {
      draft: 'Bozza',
      open: 'Aperto',
      inProgress: 'In Corso',
      completed: 'Completato',
      cancelled: 'Annullato',
    },
    types: {
      singleElimination: 'Eliminazione Diretta',
      doubleElimination: 'Doppia Eliminazione',
      roundRobin: "Girone All'Italiana",
      swiss: 'Sistema Svizzero',
    },
    bpaddle: {
      round: 'Turno {{number}}',
      finals: 'Finali',
      semiFinals: 'Semifinali',
      quarterFinals: 'Quarti di Finale',
      winner: 'Vincitore',
      tbd: 'Da Determinare',
      bye: 'Riposo',
    },
    actions: {
      register: 'Iscriviti',
      unregister: 'Annulla Iscrizione',
      submitScore: 'Invia Punteggio',
      viewDetails: 'Visualizza Dettagli',
      downloadBracket: 'Scarica Tabellone',
    },
    alerts: {
      createSuccess: 'Torneo creato con successo',
      updateSuccess: 'Torneo aggiornato con successo',
      deleteSuccess: 'Torneo eliminato con successo',
      registerSuccess: 'Iscrizione al torneo riuscita',
      unregisterSuccess: 'Cancellazione iscrizione riuscita',
      tournamentFull: 'Il torneo è pieno',
      registrationClosed: 'Le iscrizioni sono chiuse',
      invalidScore: 'Punteggio non valido',
      scoreSubmitted: 'Punteggio inviato con successo',
    },
    emptyState: {
      noTournaments: 'Nessun torneo disponibile',
      createFirst: 'Crea il tuo primo torneo',
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

console.log('✅ Italian translations Part 4 applied successfully!');
console.log('📦 Sections: clubTournamentManagement');
