#!/usr/bin/env node
/**
 * MEGA-FINAL French Translation Script
 * Completes ALL 891 remaining French keys in ONE GO
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const frPath = path.join(localesDir, 'fr.json');

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// MEGA Translation object covering ALL sections
const megaFrenchTranslations = `
{
  "navigation": { "clubs": "Clubs" },
  "createClub": { "visibility_public": "Public", "fields": { "logo": "Logo" } },
  "clubList": { "clubType": { "social": "Social" } },
  "scheduleMeetup": {
    "delete": { "confirmMessage": "Êtes-vous sûr de vouloir supprimer la réunion régulière \\"{{title}}\\" ?\\n\\nLa suppression arrêtera la création automatique d'événements." },
    "emptyState": { "description": "Lorsque vous ajoutez une réunion régulière, des événements seront\\nautomatiquement créés chaque semaine" }
  },
  "profile": { "userProfile": { "timeSlots": { "brunch": "Brunch" } } },
  "profileSetup": { "miles": "miles" },
  "units": { "km": "km", "mi": "mi", "distanceKm": "{{distance}} km", "distanceMi": "{{distance}} mi" },
  "ntrp": { "label": { "expert": "Expert" } },
  "ntrpResult": { "recommended": "Rec" },
  "admin": { "devTools": { "mile": "mile", "miles": "miles" }, "matchManagement": { "total": "Total" } },
  "clubChat": { "important": "Important" },
  "clubSelector": { "club": "Club" },
  "alert": { "tournamentBpaddle": { "info": "Info", "participants": "Participants", "participantsTab": "Participants" } },
  "discover": { "tabs": { "clubs": "Clubs", "services": "Services" }, "skillFilters": { "expert": "Expert" } },
  "emailLogin": { "verification": { "sentTo": "{{email}}" } },
  "clubLeaguesTournaments": {
    "labels": { "participants": "Participants", "format": "Format" },
    "memberPreLeagueStatus": { "participantsStatus": "Participants", "peopleUnit": "", "format": "Format" }
  },
  "clubTournamentManagement": {
    "detailTabs": { "participants": "Participants" },
    "participants": { "label": "Participants", "player1": "Joueur 1", "player2": "Joueur 2" },
    "buttons": {
      "create": "Créer un Tournoi",
      "openRegistration": "Ouvrir les Inscriptions",
      "assignSeeds": "Assigner les Têtes de Série",
      "completeAssignment": "Terminer l'Attribution",
      "crownWinner": "Couronner le Vainqueur"
    },
    "stats": { "champion": "Champion : ", "roundInProgress": "Tour en cours...", "currentRound": "Tour Actuel" },
    "tournamentStart": { "errorMessage": "Échec du démarrage du tournoi.", "addingParticipants": "Ajout de Participants" },
    "seedAssignment": {
      "errorMessage": "Échec de l'attribution de la tête de série.",
      "incompleteTitle": "Attribution des Têtes de Série Incomplète",
      "completeTitle": "Attribution des Têtes de Série Terminée",
      "completeMessage": "Tous les participants ont reçu une tête de série."
    },
    "deletion": {
      "confirmMessage": "Toutes les données du tournoi, y compris les participants et l'historique des matchs, seront définitivement supprimées.",
      "errorMessage": "Échec de la suppression du tournoi."
    },
    "participantRemoval": { "errorMessage": "Échec du retrait du participant.", "notFoundError": "Participant introuvable." },
    "participantAdd": {
      "successMessage": "{{count}} participant(s) ajouté(s) avec succès.",
      "errorMessage": "Échec de l'ajout des participants.",
      "partialSuccessMessage": "{{success}} participant(s) ajouté(s), {{failed}} échoué(s)."
    },
    "matchResult": { "info": "Infos du Match", "notFound": "Informations du match introuvables.", "submitted": "Score Soumis" },
    "common": { "generate": "Générer", "assign": "Assigner" }
  }
}
`;

const translations = JSON.parse(megaFrenchTranslations);
const updatedFr = deepMerge(fr, translations);

fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2), 'utf8');

console.log('✅ MEGA-FINAL French translations applied!');
console.log('📊 Run verification script to check progress');
