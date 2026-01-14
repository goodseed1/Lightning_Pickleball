const fs = require('fs');
const path = require('path');

const itPath = path.join(__dirname, '../src/locales/it.json');
const itData = JSON.parse(fs.readFileSync(itPath, 'utf8'));

// Part 2: Profile sections
const translations = {
  profile: {
    loading: {
      clubs: 'Caricamento club...',
      trophies: 'Caricamento trofei...',
      matchHistory: 'Caricamento storico partite...',
    },
    settings: {
      notifications: 'Impostazioni Notifiche',
      profileSettings: 'Impostazioni Profilo',
      appSettings: 'Impostazioni App',
    },
    userProfile: {
      screenTitle: 'Profilo Utente',
      loading: 'Caricamento profilo...',
      loadError: 'Caricamento profilo fallito',
      notFound: 'Profilo non trovato',
      backButton: 'Indietro',
      defaultNickname: 'Giocatore di Pickleball',
      noLocation: 'Nessuna info posizione',
      joinedDate: 'Iscritto il {{date}}',
      friendRequest: {
        title: 'Richiesta Amicizia',
        message: 'Inviare richiesta di amicizia a {{nickname}}?',
        cancel: 'Annulla',
        send: 'Invia',
        success: 'Successo',
        successMessage: 'Richiesta di amicizia inviata!',
        notification: 'Avviso',
        cannotSend: 'Impossibile inviare richiesta di amicizia.',
        error: 'Errore',
        errorMessage: 'Invio richiesta di amicizia fallito. Riprova.',
      },
      sendMessage: {
        error: 'Errore',
        loginRequired: 'Login richiesto.',
      },
      actionButtons: {
        addFriend: 'Aggiungi Amico',
        sendMessage: 'Invia Messaggio',
      },
      rankings: {
        title: 'Classifiche',
      },
      stats: {
        title: 'Statistiche Partite',
        totalMatches: 'Partite Totali',
        wins: 'Vittorie',
        losses: 'Sconfitte',
        winRate: 'Tasso Vittoria',
        currentStreak: 'Serie di {{count}} vittorie!',
      },
      matchTypes: {
        singles: 'Singolare',
        doubles: 'Doppio',
        mixedDoubles: 'Doppio Misto',
      },
      playerInfo: {
        title: 'Informazioni Giocatore',
        playingStyle: 'Stile di Gioco',
        languages: 'Lingue',
        availability: 'Disponibilità',
        weekdays: 'Giorni Feriali',
        weekends: 'Fine Settimana',
        noInfo: 'Nessuna informazione',
      },
      matchHistory: {
        title: 'Storico Partite Recenti',
        win: 'V',
        loss: 'S',
        score: 'Punteggio:',
      },
      timeSlots: {
        earlyMorning: 'Mattino Presto',
        morning: 'Mattino',
        afternoon: 'Pomeriggio',
        evening: 'Sera',
        night: 'Notte',
        brunch: 'Brunch',
      },
    },
  },
  profileSetup: {
    nickname: 'Nickname',
  },
  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },
  roles: {
    admin: 'Amministratore',
    manager: 'Manager',
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

console.log('✅ Italian translations Part 2 applied successfully!');
console.log('📦 Sections: profile, profileSetup, units, roles');
