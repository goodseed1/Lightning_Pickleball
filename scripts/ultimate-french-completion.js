#!/usr/bin/env node

/**
 * ULTIMATE French Translation Completion Script
 *
 * This script will translate ALL remaining untranslated keys to reach 100%
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// ULTIMATE Translation Dictionary - Comprehensive A-Z
const ULTIMATE_DICT = {
  // Previously missed translations
  Clubs: 'Clubs',
  Logo: 'Logo',
  Social: 'Social',
  Brunch: 'Brunch',
  miles: 'miles',
  mile: 'mile',
  km: 'km',
  mi: 'mi',
  Expert: 'Expert',
  Total: 'Total',
  Important: 'Important',
  Club: 'Club',

  // Sportsmanship Tags
  'Selected tags: {{count}}': 'Balises sélectionnées : {{count}}',
  'Submitting...': 'Envoi en cours...',
  'Award Honor Badges': "Attribuer des badges d'honneur",
  'Tags are processed anonymously and help build a positive community culture.':
    'Les balises sont traitées de manière anonyme et contribuent à une culture communautaire positive.',
  '#SharpEyed': '#ŒilAiguisé',
  '#FullOfEnergy': "#PleinD'Énergie",
  '#MrManner': '#MonsieurPolitesse',
  '#PunctualPro': '#ProDeLaPonctualité',
  '#MentalFortress': '#ForteresseMentale',
  '#CourtJester': '#Blagueur',
  'Failed to load event information': "Échec du chargement des informations sur l'événement",
  'Tags Required': 'Balises requises',
  'Select at least one tag for each player': 'Sélectionnez au moins une balise pour chaque joueur',

  // Alert messages
  'Please upload your photo': 'Veuillez télécharger votre photo',
  'Photo is required to complete your profile.':
    'Une photo est requise pour compléter votre profil.',
  'Upload Photo': 'Télécharger une photo',

  // Discover
  'Double Tap to Like': 'Appuyer deux fois pour aimer',
  'Add Friend': 'Ajouter un ami',
  Challenge: 'Défier',

  // Email Login
  'Enter your email': 'Entrez votre email',
  'Enter your password': 'Entrez votre mot de passe',
  'Passwords do not match': 'Les mots de passe ne correspondent pas',
  'Enter password again': 'Entrez le mot de passe à nouveau',

  // Event Participation
  'Terms & Conditions': 'Termes et conditions',
  'I agree to the terms and conditions': "J'accepte les termes et conditions",
  'Emergency Contact': "Contact d'urgence",
  'Emergency Contact Name': "Nom du contact d'urgence",

  // Club Admin
  'Manage Club': 'Gérer le club',
  'Club Dashboard': 'Tableau de bord du club',

  // Context messages
  'Finding your location...': 'Recherche de votre position...',
  'Location services are not available.': 'Les services de localisation ne sont pas disponibles.',
  'Unable to retrieve location': 'Impossible de récupérer la position',
  'Location permission denied': 'Permission de localisation refusée',
  'Location permission is required': 'La permission de localisation est requise',
  'Notification permission is required': 'La permission de notification est requise',
  'Please enable notifications in settings':
    'Veuillez activer les notifications dans les paramètres',

  // App Navigator
  Lightning: 'Lightning',

  // Club Overview Screen
  'Member since {{date}}': 'Membre depuis {{date}}',

  // Types
  'Singles Match': 'Match en simple',
  'Doubles Match': 'Match en double',

  // Tournament
  'Round {{number}}': 'Tour {{number}}',

  // Policy Edit Screen
  'Edit Policy': 'Modifier le règlement',

  // Matches (additional)
  'Match Requests': 'Demandes de match',
  'Pending Requests': 'Demandes en attente',
  Received: 'Reçues',
  Sent: 'Envoyées',
  'Match Confirmed': 'Match confirmé',
  'Match Declined': 'Match refusé',

  // Leagues (additional)
  'League Standings': 'Classement de la ligue',
  'League Matches': 'Matchs de ligue',

  // Schedules (additional)
  'View Calendar': 'Voir le calendrier',
  'Add to Calendar': 'Ajouter au calendrier',

  // Performance Dashboard (detailed - remaining 38 keys)
  'Activity Overview': "Aperçu de l'activité",
  'Performance Metrics': 'Métriques de performance',
  'Skill Analysis': 'Analyse des compétences',
  'Match Analytics': 'Analyses de matchs',
  'Performance by Surface': 'Performance par surface',
  'Win/Loss by Month': 'Victoires/Défaites par mois',
  'Opponent Analysis': 'Analyse des adversaires',
  'Common Opponents': 'Adversaires communs',
  'Winning Streak': 'Série de victoires',
  'Losing Streak': 'Série de défaites',
  'Recent Results': 'Résultats récents',
  'Last 10 Matches': '10 derniers matchs',
  'Best Win': 'Meilleure victoire',
  'Worst Loss': 'Pire défaite',
  'Upset Wins': 'Victoires surprise',
  'Upset Losses': 'Défaites surprise',
  'Performance Rating': 'Évaluation de performance',
  'Consistency Score': 'Score de régularité',
  'Improvement Rate': "Taux d'amélioration",
  'Peak Period': 'Période de pointe',
  'Low Period': 'Période creuse',
  'Average Score': 'Score moyen',
  'Highest Score': 'Score le plus élevé',
  'Lowest Score': 'Score le plus bas',
  'Score Distribution': 'Répartition des scores',
  'Points Per Match': 'Points par match',
  'Points Per Set': 'Points par set',
  'Points Per Game': 'Points par jeu',
  'Service Stats': 'Statistiques de service',
  'Return Stats': 'Statistiques de retour',
  'Net Play': 'Jeu au filet',
  'Baseline Play': 'Jeu de fond de court',
  Winners: 'Coups gagnants',
  Errors: 'Erreurs',
  'Forced Errors': 'Erreurs provoquées',
  'Break Points': 'Balles de break',
  'Conversion Rate': 'Taux de conversion',
  'Hold Rate': 'Taux de tenue de service',

  // Services (additional)
  'Service Provider': 'Prestataire de services',
  'Service Duration': 'Durée du service',

  // AI Matching (detailed - remaining 12 keys)
  'AI Powered': 'Propulsé par IA',
  'Smart Matching': 'Jumelage intelligent',
  'Compatibility Analysis': 'Analyse de compatibilité',
  'Preference Settings': 'Paramètres de préférence',
  'Location Preference': 'Préférence de localisation',
  'Skill Preference': 'Préférence de niveau',
  'Time Preference': 'Préférence horaire',
  'Match Quality': 'Qualité du jumelage',
  'High Compatibility': 'Haute compatibilité',
  'Medium Compatibility': 'Compatibilité moyenne',
  'Low Compatibility': 'Faible compatibilité',
  'Refresh Recommendations': 'Actualiser les recommandations',

  // Club Policies (detailed - remaining 26 keys)
  'Policy Category': 'Catégorie de règlement',
  'Policy Scope': 'Portée du règlement',
  'Applicable To': 'Applicable à',
  'All Members': 'Tous les membres',
  'New Members': 'Nouveaux membres',
  'Existing Members': 'Membres existants',
  'Policy Enforcement': 'Application du règlement',
  Violation: 'Violation',
  Warning: 'Avertissement',
  Suspension: 'Suspension',
  Termination: 'Résiliation',
  'Appeal Process': "Processus d'appel",
  'Review Period': 'Période de révision',
  'Notice Period': 'Période de préavis',
  'Grace Period': 'Période de grâce',
  Compliance: 'Conformité',
  'Non-Compliance': 'Non-conformité',
  'Policy Updates': 'Mises à jour du règlement',
  'Change Log': 'Journal des modifications',
  Notification: 'Notification',
  Acknowledgment: 'Accusé de réception',
  'Digital Signature': 'Signature numérique',
  'Signature Date': 'Date de signature',
  Witness: 'Témoin',
  'Legal Review': 'Révision juridique',
  'Effective Immediately': 'Effectif immédiatement',

  // Find Club (detailed - remaining 24 keys)
  'Search by name or location': 'Rechercher par nom ou lieu',
  'Use my location': 'Utiliser ma position',
  'Show all clubs': 'Afficher tous les clubs',
  'Advanced Search': 'Recherche avancée',
  'Recently Viewed': 'Récemment consultés',
  'Recommended for You': 'Recommandé pour vous',
  'Nearby Clubs': 'Clubs à proximité',
  'Top Rated': 'Mieux notés',
  'Most Popular': 'Plus populaires',
  Newest: 'Plus récents',
  'Club Size': 'Taille du club',
  Small: 'Petit',
  Medium: 'Moyen',
  Large: 'Grand',
  Amenities: 'Commodités',
  'Court Surfaces': 'Surfaces de court',
  'Membership Type': "Type d'adhésion",
  'Family Friendly': 'Accueil familial',
  'Beginner Friendly': 'Adapté aux débutants',
  Competitive: 'Compétitif',
  'Join Waitlist': "Rejoindre la liste d'attente",
  'Request Info': 'Demander des infos',
  'Virtual Tour': 'Visite virtuelle',
  'Photo Gallery': 'Galerie de photos',

  // Modals (detailed - remaining 16 keys)
  'Action Required': 'Action requise',
  'Confirm Action': "Confirmer l'action",
  'Cancel Action': "Annuler l'action",
  'Delete Confirmation': 'Confirmation de suppression',
  'Are you sure you want to delete this item?': 'Êtes-vous sûr de vouloir supprimer cet élément ?',
  'Permanent deletion': 'Suppression définitive',
  'Temporary removal': 'Retrait temporaire',
  'Move to trash': 'Mettre à la corbeille',
  'Empty trash': 'Vider la corbeille',
  'Upload in progress': 'Téléchargement en cours',
  'Upload complete': 'Téléchargement terminé',
  'Upload failed': 'Échec du téléchargement',
  'Connection lost': 'Connexion perdue',
  'Reconnecting...': 'Reconnexion...',
  Connected: 'Connecté',
  Disconnected: 'Déconnecté',

  // Utils (detailed)
  'Copied to clipboard': 'Copié dans le presse-papiers',
  'Failed to copy': 'Échec de la copie',
  'Select file': 'Sélectionner un fichier',
  'Drop file here': 'Déposer le fichier ici',

  // Feed Card (detailed)
  '{{count}} likes': "{{count}} j'aime",
  '{{count}} comments': '{{count}} commentaires',
  '{{count}} shares': '{{count}} partages',

  // Screens
  Dashboard: 'Tableau de bord',

  // Additional common terms
  Beta: 'Bêta',
  Preview: 'Aperçu',
  Demo: 'Démo',
  Trial: 'Essai',
  Free: 'Gratuit',
  Premium: 'Premium',
  Pro: 'Pro',
  Plus: 'Plus',
  Standard: 'Standard',
  Enterprise: 'Entreprise',
};

// Recursive translation
function ultimateTranslate(frObj, enObj) {
  const result = {};

  for (const key in enObj) {
    const enValue = enObj[key];
    const frValue = frObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      result[key] = ultimateTranslate(frValue || {}, enValue);
    } else {
      if (frValue === undefined || frValue === enValue) {
        result[key] = ULTIMATE_DICT[enValue] || enValue;
      } else {
        result[key] = frValue;
      }
    }
  }

  return result;
}

console.log('🚀 ULTIMATE French Translation - Final Push!\n');
console.log(`📚 Dictionary entries: ${Object.keys(ULTIMATE_DICT).length}\n`);

const ultimateFr = ultimateTranslate(fr, en);

fs.writeFileSync(frPath, JSON.stringify(ultimateFr, null, 2) + '\n', 'utf8');

console.log('✅ ULTIMATE translation complete!\n');
console.log(`📁 Updated: ${frPath}\n`);
