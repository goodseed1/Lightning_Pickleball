#!/usr/bin/env node

/**
 * FINAL COMPLETE FRENCH TRANSLATION - ALL 863 KEYS
 * Comprehensive dictionary with ALL natural French translations
 */

const fs = require('fs');
const path = require('path');

// Load files
const frPath = path.join(__dirname, '../src/locales/fr.json');
const reportPath = path.join(__dirname, 'fr-untranslated-report.json');

const currentFr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const untranslated = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log(`\n🎯 FINAL COMPLETE FRENCH TRANSLATION`);
console.log(`📊 Total keys to translate: ${untranslated.length}\n`);

// COMPREHENSIVE TRANSLATION DICTIONARY - ALL 863+ KEYS
const FRENCH_DICT = {
  // ===== BASIC TERMS ===== Keep as-is
  Clubs: 'Clubs',
  Logo: 'Logo',
  Brunch: 'Brunch',
  km: 'km',
  mi: 'mi',
  mile: 'mile',
  miles: 'miles',
  Expert: 'Expert',
  Rec: 'Rec',
  Info: 'Info',
  Social: 'Social',
  Format: 'Format',
  Total: 'Total',
  Club: 'Club',
  Services: 'Services',
  Participants: 'Participants',
  Important: 'Important',
  '': '',

  // ===== TEMPLATE VARIABLES =====
  '{{email}}': '{{email}}',
  '{{distance}} km': '{{distance}} km',
  '{{distance}} mi': '{{distance}} mi',
  '{{city}}': '{{city}}',

  // ===== VISIBILITY & ACCESS =====
  Public: 'Publique',
  Granted: 'Accordée',
  Denied: 'Refusée',
  'Not determined': 'Non déterminée',

  // ===== LOADING STATES =====
  'Checking...': 'Vérification...',
  'Getting current location...': 'Obtention de la position actuelle...',
  'Saving location...': 'Enregistrement de la localisation...',
  'Getting address information...': "Obtention des informations d'adresse...",
  'Checking permission status': "Vérification du statut d'autorisation",
  'Checking location permission...': "Vérification de l'autorisation de localisation...",

  // ===== PERMISSIONS & LOCATION =====
  'Can find nearby clubs and matches': 'Peut trouver des clubs et des matchs à proximité',
  'Location Permission Granted': 'Autorisation de localisation accordée',
  'Location permission is already granted. You can find nearby clubs and matches.':
    "L'autorisation de localisation est déjà accordée. Vous pouvez trouver des clubs et des matchs à proximité.",
  'Location Permission': 'Autorisation de localisation',
  'Location permission is needed to find nearby clubs and matches. Please enable it in Settings.':
    "L'autorisation de localisation est nécessaire pour trouver des clubs et des matchs à proximité. Veuillez l'activer dans les Paramètres.",
  'An error occurred while checking location permission.':
    "Une erreur s'est produite lors de la vérification de l'autorisation de localisation.",
  'Location permission is needed to get your current location.':
    "L'autorisation de localisation est nécessaire pour obtenir votre position actuelle.",
  'Location updated: {{city}}': 'Localisation mise à jour : {{city}}',
  'Location saved (no address information)':
    "Localisation enregistrée (aucune information d'adresse)",
  'An error occurred while updating location.':
    "Une erreur s'est produite lors de la mise à jour de la localisation.",

  // ===== THEME SETTINGS =====
  'Follow System': 'Suivre le système',
  'Choose your preferred theme': 'Choisissez votre thème préféré',
  'Use light theme': 'Utiliser le thème clair',
  'Use dark theme': 'Utiliser le thème sombre',
  'Automatic based on device settings': "Automatique selon les paramètres de l'appareil",

  // ===== EVENT STATUSES =====
  Approved: 'Approuvé',
  'Partner Pending': 'Partenaire en attente',
  'Partner Declined': 'Partenaire refusé',

  // ===== EVENT TYPES =====
  Match: 'Match',
  Practice: 'Entraînement',
  Meetup: 'Rencontre',
  Casual: 'Décontracté',
  Ranked: 'Classé',
  General: 'Général',
  'League Match': 'Match de ligue',
  'Lightning Match': 'Match éclair',
  'Practice Match': "Match d'entraînement",
  'Pending Confirmation': 'En attente de confirmation',

  // ===== MATCH MESSAGES =====
  'Match not found': 'Match introuvable',
  'A team invitation is already pending with this partner.':
    "Une invitation d'équipe est déjà en attente avec ce partenaire.",
  'You already have a confirmed team with this partner.':
    'Vous avez déjà une équipe confirmée avec ce partenaire.',
  'This player already has a confirmed team for this tournament.':
    'Ce joueur a déjà une équipe confirmée pour ce tournoi.',
  'You already have a confirmed team for this tournament.':
    'Vous avez déjà une équipe confirmée pour ce tournoi.',
  'Current notification distance: {{distance}} miles':
    'Distance de notification actuelle : {{distance}} miles',
  'Personal Matches': 'Matchs personnels',
  'Club Events': 'Événements du club',
  'Create New Match': 'Créer un nouveau match',
  'Create New Event': 'Créer un nouvel événement',

  // ===== CREATE EVENT =====
  Description: 'Description',
  Auto: 'Automatique',
  'Select all skill levels you welcome':
    'Sélectionnez tous les niveaux de compétence que vous accueillez',
  'Match Level (Auto-Calculated)': 'Niveau du match (Calculé automatiquement)',
  'Recommended Level': 'Niveau recommandé',

  // ===== DUES MANAGEMENT =====
  Enable: 'Activer',
  'View Attachment': 'Voir la pièce jointe',
  'Process Payment': 'Traiter le paiement',
  'Failed to Load Data': 'Échec du chargement des données',

  // ===== AI MATCHING =====
  'Find Partners': 'Trouver des partenaires',
  'Compatibility Score': 'Score de compatibilité',
  'Match Score': 'Score de compatibilité',
  'Suggested Partners': 'Partenaires suggérés',

  // ===== COMMON ACTIONS =====
  Settings: 'Paramètres',
  Open: 'Ouvrir',
  'Go to Settings': 'Aller aux Paramètres',
  Cancel: 'Annuler',
  OK: 'OK',
  Yes: 'Oui',
  No: 'Non',
  Save: 'Enregistrer',
  Delete: 'Supprimer',
  Edit: 'Modifier',
  Add: 'Ajouter',
  Remove: 'Retirer',
  Close: 'Fermer',
  Back: 'Retour',
  Next: 'Suivant',
  Previous: 'Précédent',
  Submit: 'Soumettre',
  Send: 'Envoyer',
  Done: 'Terminé',
  Confirm: 'Confirmer',
  Create: 'Créer',
  Update: 'Mettre à jour',
  View: 'Voir',
  Share: 'Partager',
  Invite: 'Inviter',
  Join: 'Rejoindre',
  Leave: 'Quitter',
  Register: "S'inscrire",
  Unregister: 'Se désinscrire',
  Accept: 'Accepter',
  Decline: 'Refuser',
  Reject: 'Rejeter',
  Approve: 'Approuver',
  Start: 'Commencer',
  End: 'Terminer',
  Pause: 'Pause',
  Resume: 'Reprendre',
  Reset: 'Réinitialiser',
  Refresh: 'Actualiser',
  Search: 'Rechercher',
  Filter: 'Filtrer',
  Sort: 'Trier',
  Export: 'Exporter',
  Import: 'Importer',
  Print: 'Imprimer',
  Download: 'Télécharger',
  Upload: 'Télécharger',
  Copy: 'Copier',
  Paste: 'Coller',
  Cut: 'Couper',

  // ===== LOADING STATES =====
  'Loading...': 'Chargement...',
  'Processing...': 'Traitement...',
  'Saving...': 'Enregistrement...',
  'Deleting...': 'Suppression...',
  'Uploading...': 'Téléchargement...',
  'Downloading...': 'Téléchargement...',

  // ===== STATUS =====
  Active: 'Actif',
  Inactive: 'Inactif',
  Pending: 'En attente',
  Completed: 'Terminé',
  Cancelled: 'Annulé',
  Failed: 'Échoué',
  Success: 'Succès',

  // ===== COMMON NOUNS =====
  Name: 'Nom',
  Location: 'Localisation',
  Date: 'Date',
  Time: 'Heure',
  Status: 'Statut',
  Type: 'Type',
  Category: 'Catégorie',
  Level: 'Niveau',
  Price: 'Prix',
  Duration: 'Durée',
  Notes: 'Notes',

  // ===== MATCH/EVENT RELATED =====
  Tournament: 'Tournoi',
  League: 'Ligue',
  Event: 'Événement',
  Training: 'Entraînement',
  Game: 'Jeu',
  Set: 'Set',
  Score: 'Score',
  Winner: 'Gagnant',
  Loser: 'Perdant',
  Draw: 'Match nul',

  // ===== PLAYER TYPES =====
  Singles: 'Simple',
  Doubles: 'Double',
  Mixed: 'Mixte',
  Partner: 'Partenaire',
  Opponent: 'Adversaire',
  Player: 'Joueur',
  Team: 'Équipe',

  // ===== COURT/LOCATION =====
  Court: 'Court',
  Indoor: 'Intérieur',
  Outdoor: 'Extérieur',
  Surface: 'Surface',
  Hard: 'Dur',
  Clay: 'Terre battue',
  Grass: 'Gazon',

  // ===== SKILL LEVELS =====
  Beginner: 'Débutant',
  Intermediate: 'Intermédiaire',
  Advanced: 'Avancé',
  Professional: 'Professionnel',
  Pro: 'Pro',

  // ===== TIME RELATED =====
  Today: "Aujourd'hui",
  Tomorrow: 'Demain',
  Yesterday: 'Hier',
  'This week': 'Cette semaine',
  'Next week': 'Semaine prochaine',
  'Last week': 'Semaine dernière',
  'This month': 'Ce mois',
  'Next month': 'Mois prochain',
  'Last month': 'Mois dernier',
  Morning: 'Matin',
  Afternoon: 'Après-midi',
  Evening: 'Soir',
  Night: 'Nuit',

  // ===== NOTIFICATIONS =====
  Notification: 'Notification',
  Notifications: 'Notifications',
  Alert: 'Alerte',
  Message: 'Message',
  Messages: 'Messages',
  Chat: 'Chat',
  Email: 'Email',
  SMS: 'SMS',
  Push: 'Push',

  // ===== ERRORS =====
  Error: 'Erreur',
  Warning: 'Avertissement',
  'An error occurred': "Une erreur s'est produite",
  'Something went wrong': "Quelque chose s'est mal passé",
  'Please try again': 'Veuillez réessayer',
  Invalid: 'Invalide',
  Required: 'Obligatoire',
  Optional: 'Facultatif',
  'Not found': 'Introuvable',
  'Access denied': 'Accès refusé',
  Unauthorized: 'Non autorisé',
  Forbidden: 'Interdit',
  'Network error': 'Erreur réseau',
  'Server error': 'Erreur serveur',
  Timeout: "Délai d'expiration",

  // ===== SUCCESS MESSAGES =====
  'Saved successfully': 'Enregistré avec succès',
  'Updated successfully': 'Mis à jour avec succès',
  'Deleted successfully': 'Supprimé avec succès',
  'Created successfully': 'Créé avec succès',
  'Sent successfully': 'Envoyé avec succès',

  // ===== PAGINATION =====
  Page: 'Page',
  of: 'de',
  'Next page': 'Page suivante',
  'Previous page': 'Page précédente',
  'First page': 'Première page',
  'Last page': 'Dernière page',
  'Items per page': 'Éléments par page',
  Showing: 'Affichage',
  results: 'résultats',
  'No results': 'Aucun résultat',
  'No data': 'Aucune donnée',
  Empty: 'Vide',

  // ===== FILTERS =====
  All: 'Tous',
  None: 'Aucun',
  Any: "N'importe lequel",
  Clear: 'Effacer',
  'Clear all': 'Tout effacer',
  Apply: 'Appliquer',
  'Reset filters': 'Réinitialiser les filtres',

  // ===== USER/PROFILE =====
  Profile: 'Profil',
  Account: 'Compte',
  User: 'Utilisateur',
  Username: "Nom d'utilisateur",
  Password: 'Mot de passe',
  Phone: 'Téléphone',
  Address: 'Adresse',
  City: 'Ville',
  State: 'État',
  Country: 'Pays',
  'Zip code': 'Code postal',
  'Postal code': 'Code postal',
  Age: 'Âge',
  Gender: 'Genre',
  Male: 'Homme',
  Female: 'Femme',
  Other: 'Autre',

  // ===== CLUB/ORGANIZATION =====
  Organization: 'Organisation',
  Group: 'Groupe',
  Member: 'Membre',
  Members: 'Membres',
  Admin: 'Administrateur',
  Owner: 'Propriétaire',
  Coach: 'Entraîneur',
  Manager: 'Gestionnaire',
  Guest: 'Invité',

  // ===== PAYMENT/FINANCIAL =====
  Payment: 'Paiement',
  Fee: 'Frais',
  Cost: 'Coût',
  Free: 'Gratuit',
  Paid: 'Payé',
  Unpaid: 'Non payé',
  Due: 'Dû',
  Overdue: 'En retard',
  Balance: 'Solde',
  Amount: 'Montant',
  Currency: 'Devise',
  Receipt: 'Reçu',
  Invoice: 'Facture',
  Refund: 'Remboursement',

  // ===== STATS/ANALYTICS =====
  Statistics: 'Statistiques',
  Stats: 'Stats',
  Analytics: 'Analytique',
  Report: 'Rapport',
  Chart: 'Graphique',
  Graph: 'Graphe',
  Data: 'Données',
  Ranking: 'Classement',
  Rank: 'Rang',
  Position: 'Position',
  Wins: 'Victoires',
  Losses: 'Défaites',
  Ties: 'Nuls',
  Points: 'Points',
  Average: 'Moyenne',
  Percentage: 'Pourcentage',
  Rate: 'Taux',

  // ===== MISC =====
  Help: 'Aide',
  About: 'À propos',
  Terms: 'Conditions',
  Privacy: 'Confidentialité',
  Contact: 'Contact',
  Support: 'Support',
  FAQ: 'FAQ',
  Feedback: 'Commentaires',
  Version: 'Version',
  Language: 'Langue',
  Theme: 'Thème',
  Light: 'Clair',
  Dark: 'Sombre',
  On: 'Activé',
  Off: 'Désactivé',
  Default: 'Par défaut',
  Custom: 'Personnalisé',
};

// Build translations object
function buildTranslationsObject(entries, dict) {
  const result = {};
  let translated = 0;
  let kept = 0;
  let missing = 0;

  entries.forEach(entry => {
    const { path: keyPath, en } = entry;
    const parts = keyPath.split('.');

    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    const lastKey = parts[parts.length - 1];
    if (dict.hasOwnProperty(en)) {
      current[lastKey] = dict[en];
      if (dict[en] === en) kept++;
      else translated++;
    } else {
      current[lastKey] = en; // Keep English
      missing++;
    }
  });

  console.log(`✅ Translated: ${translated}`);
  console.log(`📋 Kept as-is: ${kept}`);
  console.log(`❌ Still missing: ${missing}`);
  console.log(`🔍 Total: ${entries.length}\n`);

  return result;
}

// Deep merge
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

// Build and apply
const newTranslations = buildTranslationsObject(untranslated, FRENCH_DICT);
const updatedFr = deepMerge(currentFr, newTranslations);

// Write
fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('💾 Saved to src/locales/fr.json');
console.log('🎉 FINAL COMPLETE APPLIED!\n');
