#!/usr/bin/env node
/**
 * Add all types.* German translations
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
let deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));

// Ensure types exists
if (!deJson.types) deJson.types = {};

// types.match
if (!deJson.types.match) deJson.types.match = {};

deJson.types.match.matchTypes = {
  league: 'Ligaspiel',
  tournament: 'Turnier',
  lightning_match: 'Blitz-Match',
  practice: 'Trainingsspiel',
};

deJson.types.match.matchStatus = {
  scheduled: 'Geplant',
  in_progress: 'In Bearbeitung',
  partner_pending: 'Partner ausstehend',
  pending_confirmation: 'Bestätigung ausstehend',
  confirmed: 'Bestätigt',
  completed: 'Abgeschlossen',
  disputed: 'Umstritten',
  cancelled: 'Abgesagt',
};

deJson.types.match.matchFormats = {
  singles: 'Einzel',
  doubles: 'Doppel',
};

deJson.types.match.validation = {
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
};

// types.tournament
if (!deJson.types.tournament) deJson.types.tournament = {};

deJson.types.tournament.validation = {
  singlesNoPartner: 'Einzelturniere erfordern keinen Partner.',
  mensSinglesMaleOnly: 'Herreneinzel ist nur für männliche Spieler.',
  womensSinglesFemaleOnly: 'Dameneinzel ist nur für weibliche Spieler.',
  doublesPartnerRequired: 'Doppelturniere erfordern einen Partner.',
};

deJson.types.tournament.eventTypes = {
  singles: 'Einzel',
  doubles: 'Doppel',
  mixed: 'Mixed',
};

// Write back
fs.writeFileSync(deJsonPath, JSON.stringify(deJson, null, 2) + '\n', 'utf8');

console.log('\n✅ Added all types.* German translations');
console.log('   - types.match.matchTypes (4 keys)');
console.log('   - types.match.matchStatus (8 keys)');
console.log('   - types.match.matchFormats (2 keys)');
console.log('   - types.match.validation (14 keys)');
console.log('   - types.tournament.validation (4 keys)');
console.log('   - types.tournament.eventTypes (3 keys)');
console.log('📝 File updated: src/locales/de.json\n');
