const fs = require('fs');
const path = require('path');

const itPath = path.join(__dirname, '../src/locales/it.json');
const itData = JSON.parse(fs.readFileSync(itPath, 'utf8'));

// Part 3: Terms & AI Matching
const translations = {
  terms: {
    details: {
      serviceTerms: {
        title: 'Termini di Servizio',
        content: `Termini di Servizio di Lightning Pickleball

Ultima modifica: 1 gennaio 2025

1. Accettazione dei Termini
Accedendo e utilizzando Lightning Pickleball, accetti di essere vincolato da questi Termini di Servizio.

2. Utilizzo del Servizio
- Devi avere almeno 13 anni per utilizzare questo servizio
- Sei responsabile del mantenimento della riservatezza del tuo account
- Accetti di non utilizzare il servizio per scopi illegali

3. Privacy
La tua privacy è importante per noi. Consulta la nostra Privacy Policy per informazioni su come raccogliamo e utilizziamo i tuoi dati.

4. Modifiche al Servizio
Ci riserviamo il diritto di modificare o interrompere il servizio in qualsiasi momento.

5. Limitazione di Responsabilità
Lightning Pickleball è fornito "così com'è" senza garanzie di alcun tipo.

6. Contattaci
Per domande su questi termini, contattaci all'indirizzo support@lightningpickleball.com`,
      },
      privacyPolicy: {
        title: 'Privacy Policy',
        content: `Privacy Policy di Lightning Pickleball

Ultima modifica: 1 gennaio 2025

1. Informazioni che Raccogliamo
- Informazioni account (email, nome, profilo)
- Dati posizione (per trovare giocatori nelle vicinanze)
- Dati utilizzo (statistiche partite, attività app)

2. Come Utilizziamo le Tue Informazioni
- Per fornire e migliorare i nostri servizi
- Per metterti in contatto con altri giocatori
- Per inviare notifiche sul servizio

3. Condivisione dei Dati
Non vendiamo i tuoi dati personali. Condividiamo solo informazioni necessarie per:
- Mettere in contatto i giocatori per le partite
- Gestire eventi e tornei
- Fornire funzionalità dell'app

4. Sicurezza dei Dati
Implementiamo misure di sicurezza standard del settore per proteggere i tuoi dati.

5. I Tuoi Diritti
Hai il diritto di:
- Accedere ai tuoi dati
- Correggere informazioni imprecise
- Eliminare il tuo account

6. Contattaci
Per domande sulla privacy, contattaci all'indirizzo privacy@lightningpickleball.com`,
      },
    },
  },
  aiMatching: {
    title: 'Abbinamento AI',
    subtitle: "Trova i partner perfetti con l'intelligenza artificiale",
    findPartners: 'Trova Partner',
    searching: 'Ricerca partner compatibili...',
    noMatches: 'Nessuna corrispondenza trovata',
    tryAgain: 'Riprova',
    filters: {
      skillLevel: 'Livello Abilità',
      distance: 'Distanza',
      availability: 'Disponibilità',
      playStyle: 'Stile di Gioco',
    },
    compatibility: {
      excellent: 'Eccellente',
      good: 'Buono',
      fair: 'Discreto',
      poor: 'Scarso',
    },
    matchScore: 'Punteggio Compatibilità: {{score}}%',
    invite: 'Invita a Giocare',
    viewProfile: 'Visualizza Profilo',
    reasons: {
      similarSkill: 'Livello di abilità simile',
      nearbyLocation: 'Posizione vicina',
      matchingSchedule: 'Orari compatibili',
      complementaryStyle: 'Stile di gioco complementare',
    },
    preferences: {
      title: 'Preferenze di Abbinamento',
      maxDistance: 'Distanza Massima',
      preferredDays: 'Giorni Preferiti',
      preferredTimes: 'Orari Preferiti',
      skillRange: 'Intervallo Abilità',
      save: 'Salva Preferenze',
      saved: 'Preferenze Salvate',
    },
    suggestions: {
      title: 'Partner Suggeriti',
      based_on: 'Basato su {{criteria}}',
      your_history: 'il tuo storico',
      your_preferences: 'le tue preferenze',
      playing_style: 'il tuo stile di gioco',
    },
    errors: {
      searchFailed: 'Ricerca fallita. Riprova.',
      noPreferences: 'Imposta le tue preferenze prima di cercare.',
      locationRequired: 'Posizione richiesta per la ricerca.',
    },
    emptyState: {
      title: 'Nessun Partner Trovato',
      description:
        'Prova ad ampliare i tuoi criteri di ricerca o controlla più tardi per nuove corrispondenze.',
      adjustFilters: 'Modifica Filtri',
    },
    stats: {
      matchesFound: '{{count}} corrispondenze trovate',
      averageCompatibility: 'Compatibilità media: {{score}}%',
      topMatch: 'Miglior corrispondenza',
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

console.log('✅ Italian translations Part 3 applied successfully!');
console.log('📦 Sections: terms, aiMatching');
