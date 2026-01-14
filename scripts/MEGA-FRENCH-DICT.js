#!/usr/bin/env node

/**
 * MEGA FRENCH DICTIONARY - COMPREHENSIVE TRANSLATIONS
 * Extended dictionary for ALL 863 untranslated keys
 */

const fs = require('fs');
const path = require('path');

// Load files
const reportPath = path.join(__dirname, 'fr-untranslated-report.json');
const frPath = path.join(__dirname, '../src/locales/fr.json');

const untranslated = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const currentFr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

console.log(`\n🔥 MEGA FRENCH TRANSLATION WITH COMPREHENSIVE DICTIONARY`);
console.log(`📊 Total untranslated keys: ${untranslated.length}\n`);

// MEGA TRANSLATION DICTIONARY (Extended)
const translations = {
  // Already done (from previous script)
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
  Public: 'Publique',
  Participants: 'Participants',
  Important: 'Important',
  '': '',
  '{{email}}': '{{email}}',
  '{{distance}} km': '{{distance}} km',
  '{{distance}} mi': '{{distance}} mi',
  '{{city}}': '{{city}}',
  Granted: 'Accordée',
  Denied: 'Refusée',
  'Not determined': 'Non déterminée',
  'Checking...': 'Vérification...',
  'Can find nearby clubs and matches': 'Peut trouver des clubs et des matchs à proximité',
  'Checking permission status': "Vérification du statut d'autorisation",
  'Location Permission Granted': 'Autorisation de localisation accordée',
  'Location permission is already granted. You can find nearby clubs and matches.':
    "L'autorisation de localisation est déjà accordée. Vous pouvez trouver des clubs et des matchs à proximité.",
  'Location Permission': 'Autorisation de localisation',
  'Location permission is needed to find nearby clubs and matches. Please enable it in Settings.':
    "L'autorisation de localisation est nécessaire pour trouver des clubs et des matchs à proximité. Veuillez l'activer dans les Paramètres.",
  'An error occurred while checking location permission.':
    "Une erreur s'est produite lors de la vérification de l'autorisation de localisation.",
  'Checking location permission...': "Vérification de l'autorisation de localisation...",
  'Location permission is needed to get your current location.':
    "L'autorisation de localisation est nécessaire pour obtenir votre position actuelle.",
  'Getting current location...': 'Obtention de la position actuelle...',
  'Saving location...': 'Enregistrement de la localisation...',
  'Getting address information...': "Obtention des informations d'adresse...",
  'Location updated: {{city}}': 'Localisation mise à jour : {{city}}',
  'Location saved (no address information)':
    "Localisation enregistrée (aucune information d'adresse)",
  'An error occurred while updating location.':
    "Une erreur s'est produite lors de la mise à jour de la localisation.",

  // NEW ADDITIONS - Common UI patterns
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

  // Loading states
  'Loading...': 'Chargement...',
  'Processing...': 'Traitement...',
  'Saving...': 'Enregistrement...',
  'Deleting...': 'Suppression...',
  'Uploading...': 'Téléchargement...',
  'Downloading...': 'Téléchargement...',

  // Status
  Active: 'Actif',
  Inactive: 'Inactif',
  Pending: 'En attente',
  Completed: 'Terminé',
  Cancelled: 'Annulé',
  Failed: 'Échoué',
  Success: 'Succès',

  // Common nouns
  Name: 'Nom',
  Description: 'Description',
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

  // Match/Event related
  Match: 'Match',
  Tournament: 'Tournoi',
  League: 'Ligue',
  Event: 'Événement',
  Training: 'Entraînement',
  Practice: 'Entraînement',
  Game: 'Jeu',
  Set: 'Set',
  Score: 'Score',
  Winner: 'Gagnant',
  Loser: 'Perdant',
  Draw: 'Match nul',

  // Player types
  Singles: 'Simple',
  Doubles: 'Double',
  Mixed: 'Mixte',
  Partner: 'Partenaire',
  Opponent: 'Adversaire',
  Player: 'Joueur',
  Team: 'Équipe',

  // Court/Location
  Court: 'Court',
  Indoor: 'Intérieur',
  Outdoor: 'Extérieur',
  Surface: 'Surface',
  Hard: 'Dur',
  Clay: 'Terre battue',
  Grass: 'Gazon',

  // Skill levels
  Beginner: 'Débutant',
  Intermediate: 'Intermédiaire',
  Advanced: 'Avancé',
  Professional: 'Professionnel',
  Pro: 'Pro',

  // Time related
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

  // Actions
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

  // Notifications
  Notification: 'Notification',
  Notifications: 'Notifications',
  Alert: 'Alerte',
  Message: 'Message',
  Messages: 'Messages',
  Chat: 'Chat',
  Email: 'Email',
  SMS: 'SMS',
  Push: 'Push',

  // Errors
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

  // Success messages
  Success: 'Succès',
  'Saved successfully': 'Enregistré avec succès',
  'Updated successfully': 'Mis à jour avec succès',
  'Deleted successfully': 'Supprimé avec succès',
  'Created successfully': 'Créé avec succès',
  'Sent successfully': 'Envoyé avec succès',

  // Pagination
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

  // Filters
  All: 'Tous',
  None: 'Aucun',
  Any: "N'importe lequel",
  Clear: 'Effacer',
  'Clear all': 'Tout effacer',
  Apply: 'Appliquer',
  'Reset filters': 'Réinitialiser les filtres',

  // User/Profile
  Profile: 'Profil',
  Account: 'Compte',
  User: 'Utilisateur',
  Username: "Nom d'utilisateur",
  Email: 'Email',
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

  // Club/Organization
  Club: 'Club',
  Organization: 'Organisation',
  Group: 'Groupe',
  Team: 'Équipe',
  Member: 'Membre',
  Members: 'Membres',
  Admin: 'Administrateur',
  Owner: 'Propriétaire',
  Coach: 'Entraîneur',
  Manager: 'Gestionnaire',
  Guest: 'Invité',

  // Payment/Financial
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

  // Stats/Analytics
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
  Total: 'Total',
  Percentage: 'Pourcentage',
  Rate: 'Taux',

  // Misc
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
  Auto: 'Automatique',
  On: 'Activé',
  Off: 'Désactivé',
  Enable: 'Activer',
  Disable: 'Désactiver',
  Default: 'Par défaut',
  Custom: 'Personnalisé',
};

// Build translations object
function buildTranslations(entries) {
  const result = {};
  let translatedCount = 0;
  let keptAsIsCount = 0;
  let missingCount = 0;

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
    if (translations.hasOwnProperty(en)) {
      current[lastKey] = translations[en];
      if (translations[en] === en) {
        keptAsIsCount++;
      } else {
        translatedCount++;
      }
    } else {
      current[lastKey] = en; // Keep English for now
      missingCount++;
    }
  });

  console.log(`✅ Translated: ${translatedCount}`);
  console.log(`📋 Kept as-is: ${keptAsIsCount}`);
  console.log(`❌ Missing: ${missingCount}`);
  console.log(`🔍 Total: ${translatedCount + keptAsIsCount + missingCount}\n`);

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
const newTranslations = buildTranslations(untranslated);
const updatedFr = deepMerge(currentFr, newTranslations);

// Write
fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('💾 Saved to src/locales/fr.json');
console.log('🎉 MEGA DICTIONARY APPLIED!\n');
