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
  emailLogin: {
    title: {
      login: 'Accedi',
      signup: 'Registrati',
      verification: 'Verifica Email',
    },
    labels: {
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Conferma Password',
    },
    placeholders: {
      email: 'Inserisci la tua email',
      password: 'Inserisci la tua password',
      confirmPassword: 'Conferma la tua password',
    },
    buttons: {
      loginAfterVerification: 'Accedi Dopo Verifica',
      resendVerification: 'Rinvia Email di Verifica',
      changeEmail: 'Registrati con email diversa',
      tryAgain: 'Riprova',
      goToLogin: 'Vai al Login',
      goToSignup: 'Registrati',
      cancel: 'Annulla',
    },
    toggle: {
      loginLink: 'Accedi',
      signupLink: 'Registrati',
    },
    emailStatus: {
      available: 'Email disponibile',
      accountFound: 'Account trovato',
      noAccountFound: 'Nessun account trovato. Registrati!',
      alreadyRegistered: 'Questa email è già registrata. Prova ad accedere.',
    },
    verification: {
      checkEmail: 'Controlla la Tua Email!',
      sentTo: '{{email}}',
      description:
        "Ti abbiamo inviato un'email con un link di verifica.\nClicca sul link nell'email per verificare il tuo account.\n\n(Controlla anche la cartella spam)",
      loginButton: 'Accedi Dopo Verifica',
      resendButton: 'Rinvia Email di Verifica',
      changeEmailButton: 'Registrati con email diversa',
    },
    alerts: {
      inputRequired: {
        title: 'Input Richiesto',
        message: 'Inserisci email e password.',
      },
    },
  },

  club: {
    chat: 'Chat',
    clubMembers: {
      title: 'Gestione Membri',
      tabs: {
        currentMembers: 'Membri Attuali',
        joinRequests: 'Richieste Iscrizione',
        allMembers: 'Tutti i Membri',
        roleManagement: 'Gestione Ruoli',
        applications: 'Candidature ({{count}})',
      },
      roles: {
        owner: 'Proprietario',
        admin: 'Amministratore',
        member: 'Membro',
        manager: 'Manager',
      },
      status: {
        pending: 'In Attesa',
      },
      actions: {
        promote: 'Promuovi ad Amministratore',
        demote: 'Retrocedi a Membro',
        remove: 'Rimuovi dal Club',
        cancel: 'Annulla',
        approve: 'Approva',
        reject: 'Rifiuta',
        manage: 'Gestisci',
        promoteToManager: 'Promuovi a Manager',
        demoteToMember: 'Retrocedi a Membro',
        removeFromClub: 'Rimuovi dal Club',
      },
      alerts: {
        roleChange: {
          title: 'Cambia Ruolo',
          confirm: 'Cambia',
          message: 'Cambiare {{userName}} a {{role}}?',
          success: '{{userName}} è stato cambiato a {{role}}.',
          error: 'Impossibile cambiare ruolo.',
        },
        removeMember: {
          title: 'Rimuovi Membro',
          action: 'Rimuovi',
          message:
            'Sei sicuro di voler rimuovere {{userName}} dal club?\nQuesta azione non può essere annullata.',
        },
      },
    },
  },

  types: {
    match: {
      matchStatus: {
        completed: 'Completata',
        disputed: 'Contestata',
        cancelled: 'Annullata',
      },
      matchFormats: {
        singles: 'Singolo',
        doubles: 'Doppio',
      },
      validation: {
        minOneSet: 'Deve essere inserito almeno un set.',
        gamesNonNegative: 'Set {{setNum}}: I game devono essere 0 o maggiori.',
        gamesExceedMax: 'Set {{setNum}}: I game non possono superare {{maxGames}}.',
        gamesExceedMaxShort:
          'Set {{setNum}}: Nei set corti, i game non possono superare {{maxGames}} (max {{gamesPerSet}}-{{minWin}} o {{maxAllowed}}-{{gamesPerSet1}}).',
        tiebreakRequired:
          'Set {{setNum}}: In {{setType}}, i punti tiebreak sono richiesti quando il punteggio è {{score}}-{{score}}.',
        tiebreakMargin:
          'Set {{setNum}}: {{tiebreakType}} deve terminare con margine di 2 punti (es. 7-5, 8-6, 10-8).',
        tiebreakMinPoints:
          'Set {{setNum}}: {{tiebreakType}} deve raggiungere almeno {{minPoints}} punti (es. {{minPoints}}-{{minPoints2}}, {{minPoints1}}-{{minPoints3}}).',
        incompleteSet:
          'Set {{setNum}}: In {{setType}}, il set è terminato con meno di {{gamesPerSet}} game. Verifica se si tratta di ritiro o situazione speciale.',
        invalidWinScore:
          "Set {{setNum}}: Per vincere con {{gamesPerSet}} game, l'avversario può avere massimo {{maxOppGames}} game.",
        invalidWinScoreShort:
          "Set {{setNum}}: Nei set corti, {{gamesPerSet}}-{{minGames}} è impossibile. Per vincere con {{gamesPerSet}} game, l'avversario può avere massimo {{maxOppGames}} game.",
        invalidMaxGamesScore:
          "Set {{setNum}}: Per vincere con {{maxGames}} game, l'avversario deve avere {{gamesPerSet1}} o {{gamesPerSet}} game.",
        invalidMaxGamesScoreShort:
          'Set {{setNum}}: Nei set corti, {{maxGames}}-{{minGames}} è impossibile. Il set termina a {{gamesPerSet}}-{{minGames}}.',
        regularSet: 'set regolare',
        shortSet: 'set corto',
        tiebreak: 'tiebreak',
        superTiebreak: 'super tiebreak',
      },
    },
    clubSchedule: {
      daysOfWeek: {
        0: 'Domenica',
        1: 'Lunedì',
        2: 'Martedì',
        3: 'Mercoledì',
        4: 'Giovedì',
        5: 'Venerdì',
        6: 'Sabato',
      },
      scheduleTypes: {
        practice: 'Sessione Allenamento',
        social: 'Tennis Sociale',
      },
    },
  },

  createClub: {
    basic_info: 'Info Base',
    court_address: 'Indirizzo Campo',
    regular_meet: 'Incontri Ricorrenti',
    visibility: 'Visibilità',
    visibility_public: 'Pubblico',
    visibility_private: 'Privato',
    fees: 'Quote',
    facilities: 'Strutture',
    rules: 'Regole Club',
    loading: 'Caricamento informazioni club...',
    address_search_title: 'Cerca Indirizzo Campo da Tennis',
    meeting_modal_title: 'Aggiungi Orario Incontro Regolare',
    day_selection: 'Selezione Giorno',
    meeting_time: 'Orario Incontro',
    start_time: 'Orario Inizio',
    end_time: 'Orario Fine',
    add_meeting: 'Aggiungi Orario Incontro',
    cancel: 'Annulla',
    add: 'Aggiungi',
    confirmAddress: 'Conferma Indirizzo',
    errors: {
      address_required: "L'indirizzo è richiesto.",
    },
    facility: {
      lights: 'Illuminazione',
      indoor: 'Indoor',
      parking: 'Parcheggio',
      ballmachine: 'Macchina Palline',
      locker: 'Spogliatoio',
      proshop: 'Pro Shop',
    },
    fields: {
      name: 'Nome Club',
      intro: 'Introduzione',
      address_placeholder: 'Cerca indirizzo campo (EN/US/Atlanta bias)',
    },
  },

  myActivities: {
    header: {
      title: '👤 Le Mie Attività',
    },
    loading: 'Caricamento dati...',
    tabs: {
      profile: 'Profilo',
      stats: 'Statistiche',
      events: 'I Miei Eventi',
      friends: 'Amici',
      settings: 'Impostazioni',
    },
    profile: {
      style: 'Stile: ',
      editProfile: 'Modifica Profilo',
      myStats: 'Le Mie Statistiche',
      wins: 'Vittorie',
      losses: 'Sconfitte',
      winRate: '% Vittorie',
      earnedBadges: 'Badge Ottenuti',
      goals: 'Obiettivi',
    },
    stats: {
      rankedMatchStats: 'Statistiche Partite Classificate',
      onlyRankedMatches: 'Solo partite classificate che influenzano il rating ELO',
      eloRatingTrend: 'Tendenza Rating ELO',
      lastSixMonths: 'Ultimi 6 mesi',
      currentEloRating: 'Rating ELO Attuale',
      intermediateTier: 'Livello Intermedio',
      matches: 'Partite',
      wins: 'Vittorie',
      losses: 'Sconfitte',
      winRate: '% Vittorie',
      recentMatchResults: 'Risultati Partite Recenti',
      noRankedMatches: 'Nessuna partita classificata ancora',
    },
    settings: {
      notificationSettings: 'Impostazioni Notifiche',
      lightningMatchNotifications: 'Notifiche Partite Lampo',
      newMatchRequestNotifications: 'Notifiche nuove richieste partita',
    },
  },
};

// Apply translations
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

console.log('\n=== FINAL BATCH TRANSLATION RESULTS ===\n');
console.log(
  `emailLogin: ${countAll(en.emailLogin, it.emailLogin)} → ${countAll(en.emailLogin, updatedIt.emailLogin)}`
);
console.log(`club: ${countAll(en.club, it.club)} → ${countAll(en.club, updatedIt.club)}`);
console.log(`types: ${countAll(en.types, it.types)} → ${countAll(en.types, updatedIt.types)}`);
console.log(
  `createClub: ${countAll(en.createClub, it.createClub)} → ${countAll(en.createClub, updatedIt.createClub)}`
);
console.log(
  `myActivities: ${countAll(en.myActivities, it.myActivities)} → ${countAll(en.myActivities, updatedIt.myActivities)}`
);

const before = countAll(en, it);
const after = countAll(en, updatedIt);
console.log(`\nTOTAL: ${before} → ${after} (${before - after} translated)`);

console.log('\n✅ Final batch translation complete!');
