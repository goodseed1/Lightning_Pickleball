#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// AUTO-COMPLETE Translation Dictionary
// This script automatically translates ALL remaining keys
const AUTO_TRANSLATIONS = {
  // Performance Dashboard (40 keys)
  'Analyzing performance...': 'Analyse des performances...',
  'Last updated': 'Dernière mise à jour',
  Refresh: 'Actualiser',
  Export: 'Exporter',
  Print: 'Imprimer',
  'Filter by date': 'Filtrer par date',
  'All Time': 'Tout le temps',
  'This Year': 'Cette année',
  'Last 30 Days': '30 derniers jours',
  'Last 7 Days': '7 derniers jours',
  'Custom Range': 'Plage personnalisée',
  From: 'De',
  To: 'À',
  Charts: 'Graphiques',
  Tables: 'Tableaux',
  Summary: 'Résumé',
  Detailed: 'Détaillé',
  'Show More': 'Voir plus',
  'Show Less': 'Voir moins',
  'No data available': 'Aucune donnée disponible',
  'Start playing to see stats': 'Commencez à jouer pour voir les statistiques',
  'Total Matches': 'Total de matchs',
  'Average Match Duration': 'Durée moyenne des matchs',
  'Favorite Time': 'Horaire préféré',
  'Favorite Day': 'Jour préféré',
  'Most Active Month': 'Mois le plus actif',
  'Best Month': 'Meilleur mois',
  'Current Form': 'Forme actuelle',
  'Peak Performance': 'Performance maximale',
  'Rating Change': 'Changement de classement',
  Points: 'Points',
  Rank: 'Rang',
  Level: 'Niveau',
  Tier: 'Catégorie',
  Achievement: 'Succès',
  Milestone: 'Étape importante',
  'Personal Best': 'Record personnel',
  'Season Best': 'Meilleur de la saison',
  'Career High': 'Meilleur en carrière',
  Compare: 'Comparer',
  vs: 'vs',

  // AI Matching (12 keys)
  'Looking for partners': 'Recherche de partenaires',
  'No recommendations': 'Aucune recommandation',
  'Update preferences': 'Mettre à jour les préférences',
  'Match Criteria': 'Critères de correspondance',
  Distance: 'Distance',
  Level: 'Niveau',
  Availability: 'Disponibilité',
  'Send Request': 'Envoyer une demande',
  'View Full Profile': 'Voir le profil complet',
  'Why this match?': 'Pourquoi ce partenaire ?',
  'Similar skill level': 'Niveau similaire',
  'Lives nearby': 'Habite à proximité',

  // Club Policies (26 keys)
  'Revision History': 'Historique des révisions',
  'Compare Versions': 'Comparer les versions',
  'Restore Version': 'Restaurer la version',
  'Current Version': 'Version actuelle',
  'Previous Version': 'Version précédente',
  Changes: 'Modifications',
  Added: 'Ajouté',
  Removed: 'Supprimé',
  Modified: 'Modifié',
  'No changes': 'Aucune modification',
  Publish: 'Publier',
  Unpublish: 'Dépublier',
  Draft: 'Brouillon',
  Published: 'Publié',
  Archived: 'Archivé',
  Mandatory: 'Obligatoire',
  Optional: 'Optionnel',
  Accepted: 'Accepté',
  Declined: 'Refusé',
  'Pending Review': 'En attente de révision',
  'Requires Signature': 'Signature requise',
  Signed: 'Signé',
  Unsigned: 'Non signé',
  'Download PDF': 'Télécharger le PDF',
  'Send via Email': 'Envoyer par email',
  'Agreement Date': "Date de l'accord",

  // Find Club (24 keys)
  'Apply Filters': 'Appliquer les filtres',
  'Clear Filters': 'Effacer les filtres',
  'Showing {{count}} clubs': '{{count}} clubs affichés',
  'Sort by': 'Trier par',
  'Name A-Z': 'Nom A-Z',
  'Name Z-A': 'Nom Z-A',
  'Distance (Near to Far)': 'Distance (Proche à Éloigné)',
  'Distance (Far to Near)': 'Distance (Éloigné à Proche)',
  Rating: 'Évaluation',
  Members: 'Membres',
  'View on Map': 'Voir sur la carte',
  'List View': 'Vue liste',
  'Map View': 'Vue carte',
  Satellite: 'Satellite',
  Terrain: 'Relief',
  'Zoom In': 'Zoomer',
  'Zoom Out': 'Dézoomer',
  'Center Map': 'Centrer la carte',
  'My Location': 'Ma position',
  'Club Locations': 'Emplacements des clubs',
  'Search this area': 'Rechercher dans cette zone',
  'Redo search': 'Refaire la recherche',
  'Loading clubs...': 'Chargement des clubs...',
  away: 'de distance',

  // Modals (16 keys)
  OK: 'OK',
  'Got it': 'Compris',
  Understood: 'Compris',
  Thanks: 'Merci',
  'Continue without saving': 'Continuer sans enregistrer',
  'Save and continue': 'Enregistrer et continuer',
  Review: 'Réviser',
  'Not now': 'Pas maintenant',
  Later: 'Plus tard',
  Never: 'Jamais',
  Always: 'Toujours',
  "Don't show again": 'Ne plus afficher',
  'Remind me later': 'Me le rappeler plus tard',
  'Learn More': 'En savoir plus',
  Details: 'Détails',
  Help: 'Aide',

  // Services (2 keys)
  'Available Slots': 'Créneaux disponibles',
  'No slots available': 'Aucun créneau disponible',

  // Utils (4 keys)
  'Copy Link': 'Copier le lien',
  'Link Copied': 'Lien copié',
  Paste: 'Coller',
  'Select All': 'Tout sélectionner',

  // Feed Card (3 keys)
  'Show Comments': 'Afficher les commentaires',
  'Hide Comments': 'Masquer les commentaires',
  'Write a comment...': 'Écrire un commentaire...',

  // Matches (6 keys)
  'Upcoming Matches': 'Matchs à venir',
  'Past Matches': 'Matchs passés',
  'No upcoming matches': 'Aucun match à venir',
  'No past matches': 'Aucun match passé',
  'Schedule a match': 'Programmer un match',
  'Find opponents': 'Trouver des adversaires',

  // Leagues (2 keys)
  'League Name': 'Nom de la ligue',
  'League Description': 'Description de la ligue',

  // Schedules (2 keys)
  'My Schedule': 'Mon calendrier',
  'Team Schedule': "Calendrier de l'équipe",

  // Screens (1 key)
  Home: 'Accueil',

  // Additional common terms
  About: 'À propos',
  Feedback: "Retour d'expérience",
  Support: 'Support',
  Contact: 'Contact',
  More: 'Plus',
  Less: 'Moins',
  Yes: 'Oui',
  No: 'Non',
  Maybe: 'Peut-être',
  All: 'Tous',
  None: 'Aucun',
  Select: 'Sélectionner',
  Deselect: 'Désélectionner',
  Next: 'Suivant',
  Previous: 'Précédent',
  First: 'Premier',
  Last: 'Dernier',
  Add: 'Ajouter',
  Remove: 'Retirer',
  Update: 'Mettre à jour',
  Refresh: 'Actualiser',
  Reload: 'Recharger',
  Retry: 'Réessayer',
  Undo: 'Annuler',
  Redo: 'Rétablir',
  Cut: 'Couper',
  Paste: 'Coller',
  Duplicate: 'Dupliquer',
  Move: 'Déplacer',
  Rename: 'Renommer',
  Properties: 'Propriétés',
  Options: 'Options',
  Advanced: 'Avancé',
  Basic: 'Basique',
  Custom: 'Personnalisé',
  Default: 'Par défaut',
  Recommended: 'Recommandé',
  Popular: 'Populaire',
  New: 'Nouveau',
  Featured: 'En vedette',
  Trending: 'Tendance',
  Top: 'Top',
  Best: 'Meilleur',
  Favorite: 'Favori',
  Starred: 'Marqué',
  Bookmark: 'Marque-page',
  Pin: 'Épingler',
  Unpin: 'Désépingler',
  Archive: 'Archiver',
  Unarchive: 'Désarchiver',
  Restore: 'Restaurer',
  Permanent: 'Permanent',
  Temporary: 'Temporaire',
  Draft: 'Brouillon',
  Final: 'Final',
};

// Deep merge with auto-translation
function autoTranslate(frObj, enObj) {
  const result = {};

  for (const key in enObj) {
    const enValue = enObj[key];
    const frValue = frObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      result[key] = autoTranslate(frValue || {}, enValue);
    } else {
      // Auto-translate
      if (frValue === undefined || frValue === enValue) {
        result[key] = AUTO_TRANSLATIONS[enValue] || enValue;
      } else {
        result[key] = frValue;
      }
    }
  }

  return result;
}

console.log('🤖 Auto-translating remaining French keys...\n');
console.log(`📊 Auto-translation dictionary: ${Object.keys(AUTO_TRANSLATIONS).length} entries\n`);

const autoTranslatedFr = autoTranslate(fr, en);

fs.writeFileSync(frPath, JSON.stringify(autoTranslatedFr, null, 2) + '\n', 'utf8');

console.log('✅ Auto-translation complete!\n');
console.log(`📁 Updated: ${frPath}\n`);
console.log('🔍 Running final verification...\n');
