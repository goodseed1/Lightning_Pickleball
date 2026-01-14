#!/usr/bin/env node
/**
 * Convert types.match from string to object and add all translations
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
let deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));

// Check current type
console.log('\nCurrent types.match type:', typeof deJson.types.match);
console.log('Current value:', deJson.types.match);

// Convert types.match from string to object
if (typeof deJson.types.match === 'string') {
  const oldValue = deJson.types.match;

  deJson.types.match = {
    _oldStringValue: oldValue, // Preserve for reference
    matchTypes: {
      league: 'Ligaspiel',
      tournament: 'Turnier',
      lightning_match: 'Blitz-Match',
      practice: 'Trainingsspiel',
    },
    matchStatus: {
      scheduled: 'Geplant',
      in_progress: 'In Bearbeitung',
      partner_pending: 'Partner ausstehend',
      pending_confirmation: 'Bestätigung ausstehend',
      confirmed: 'Bestätigt',
      completed: 'Abgeschlossen',
      disputed: 'Umstritten',
      cancelled: 'Abgesagt',
    },
    matchFormats: {
      singles: 'Einzel',
      doubles: 'Doppel',
    },
    validation: {
      minOneSet: 'Es muss mindestens ein Satz eingegeben werden.',
      gamesNonNegative: 'Satz {{setNum}}: Spiele müssen 0 oder größer sein.',
      gamesExceedMax: 'Satz {{setNum}}: Spiele können {{maxGames}} nicht überschreiten.',
      gamesExceedMaxShort:
        'Satz {{setNum}}: In kurzen Sätzen können Spiele {{maxGames}} nicht überschreiten (max {{gamesPerSet}}-{{minWin}} oder {{maxAllowed}}-{{gamesPerSet1}}).',
      tiebreakRequired:
        'Satz {{setNum}}: In {{setType}} sind Tiebreak-Punkte erforderlich, wenn der Punktestand {{score}}-{{score}} ist.',
      tiebreakMargin:
        'Satz {{setNum}}: {{tiebreakType}} muss mit einem 2-Punkte-Vorsprung enden (z.B. 7-5, 8-6, 10-8).',
      tiebreakMinPoints:
        'Satz {{setNum}}: {{tiebreakType}} muss mindestens {{minPoints}} Punkte erreichen (z.B. {{minPoints}}-{{minPoints2}}, {{minPoints1}}-{{minPoints3}}).',
      incompleteSet:
        'Satz {{setNum}}: In {{setType}} endete der Satz mit weniger als {{gamesPerSet}} Spielen. Bitte überprüfen Sie, ob dies eine Aufgabe oder besondere Situation war.',
      invalidWinScore:
        'Satz {{setNum}}: Um mit {{gamesPerSet}} Spielen zu gewinnen, kann der Gegner maximal {{maxOppGames}} Spiele haben.',
      invalidWinScoreShort:
        'Satz {{setNum}}: In kurzen Sätzen ist {{gamesPerSet}}-{{minGames}} unmöglich. Um mit {{gamesPerSet}} Spielen zu gewinnen, kann der Gegner maximal {{maxOppGames}} Spiele haben.',
      invalidMaxGamesScore:
        'Satz {{setNum}}: Um mit {{maxGames}} Spielen zu gewinnen, muss der Gegner {{gamesPerSet1}} oder {{gamesPerSet}} Spiele haben.',
      invalidMaxGamesScoreShort:
        'Satz {{setNum}}: In kurzen Sätzen ist {{maxGames}}-{{minGames}} unmöglich. Satz endet bei {{gamesPerSet}}-{{minGames}}.',
      regularSet: 'normaler Satz',
      shortSet: 'kurzer Satz',
      tiebreak: 'Tiebreak',
      superTiebreak: 'Super-Tiebreak',
    },
  };
  console.log('\n✅ Converted types.match from string to object with all translations');
}

// Also add tournament if it doesn't exist
if (!deJson.types.tournament) {
  deJson.types.tournament = {};
}

if (!deJson.types.tournament.validation) {
  deJson.types.tournament.validation = {
    singlesNoPartner: 'Einzelturniere erfordern keinen Partner.',
    mensSinglesMaleOnly: 'Herreneinzel ist nur für männliche Spieler.',
    womensSinglesFemaleOnly: 'Dameneinzel ist nur für weibliche Spieler.',
    doublesPartnerRequired: 'Doppelturniere erfordern einen Partner.',
  };
}

if (!deJson.types.tournament.eventTypes) {
  deJson.types.tournament.eventTypes = {
    singles: 'Einzel',
    doubles: 'Doppel',
    mixed: 'Mixed',
  };
}

// Write back
fs.writeFileSync(deJsonPath, JSON.stringify(deJson, null, 2) + '\n', 'utf8');

console.log('✅ Added types.tournament translations');
console.log('📝 File updated: src/locales/de.json\n');
