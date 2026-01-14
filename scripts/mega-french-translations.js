#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// MEGA Translation Dictionary - 500+ translations
const MEGA_TRANSLATIONS = {
  // Already applied (keep for reference)
  'Choose Your Theme': 'Choisissez votre thème',
  'Select your preferred visual theme': 'Sélectionnez votre thème visuel préféré',
  Continue: 'Continuer',
  Back: 'Retour',

  // Sportsmanship (16 keys)
  'selected {{selectedCount}} out of {{totalPlayers}}':
    '{{selectedCount}} sur {{totalPlayers}} sélectionné(s)',
  'Fair Play': 'Fair-play',
  'Please select Fair Play rating for each player':
    'Veuillez évaluer le fair-play de chaque joueur',
  'Great sportsmanship and respectful behavior':
    'Excellent esprit sportif et comportement respectueux',
  'Good sportsmanship': 'Bon esprit sportif',
  'Adequate sportsmanship': 'Esprit sportif acceptable',
  'Room for improvement': 'Peut être amélioré',
  'Please rate all players': 'Veuillez évaluer tous les joueurs',
  'Please select all players': 'Veuillez sélectionner tous les joueurs',
  'Rate Selected ({{count}})': 'Évaluer ({{count}})',
  'Rate All ({{count}})': 'Tout évaluer ({{count}})',
  'Confirm Ratings': 'Confirmer les évaluations',
  'Thank you for your feedback': 'Merci pour votre retour',
  'Sportsmanship ratings have been submitted.': 'Les évaluations du fair-play ont été envoyées.',
  'Failed to submit ratings': "Échec de l'envoi des évaluations",
  'Rating Complete': 'Évaluation terminée',

  // Edit Profile (32 keys)
  'Profile Setup': 'Configuration du profil',
  'Create Your Profile': 'Créez votre profil',
  'Edit Profile': 'Modifier le profil',
  'Profile Photo': 'Photo de profil',
  'Display Name': "Nom d'affichage",
  Bio: 'Biographie',
  'Tell us about yourself': 'Parlez-nous de vous',
  'Phone Number': 'Numéro de téléphone',
  Gender: 'Genre',
  Male: 'Homme',
  Female: 'Femme',
  Other: 'Autre',
  'Prefer not to say': 'Préfère ne pas dire',
  'Birth Year': 'Année de naissance',
  'Dominant Hand': 'Main dominante',
  Right: 'Droite',
  Left: 'Gauche',
  Ambidextrous: 'Ambidextre',
  'Playing Style': 'Style de jeu',
  Aggressive: 'Agressif',
  Defensive: 'Défensif',
  'All-Court': 'Complet',
  Baseline: 'Fond de court',
  'Serve and Volley': 'Service-volée',
  'Favorite Shot': 'Coup favori',
  Forehand: 'Coup droit',
  Backhand: 'Revers',
  Serve: 'Service',
  Volley: 'Volée',
  Overhead: 'Smash',
  'Drop Shot': 'Amorti',
  'Years Playing': 'Années de pratique',
  'Select year': "Sélectionner l'année",
  'less than 1 year': "moins d'1 an",
  year: 'an',
  years: 'ans',

  // Email Login (4 keys)
  'Sign In': 'Se connecter',
  'Sign Up': "S'inscrire",
  Password: 'Mot de passe',
  'Confirm Password': 'Confirmer le mot de passe',
  'Forgot Password?': 'Mot de passe oublié ?',
  'Remember Me': 'Se souvenir de moi',

  // Club Leagues & Tournaments (13 keys)
  'Leagues & Tournaments': 'Ligues et tournois',
  'Create League': 'Créer une ligue',
  'Create Tournament': 'Créer un tournoi',
  'Active Leagues': 'Ligues actives',
  'Active Tournaments': 'Tournois actifs',
  'Past Events': 'Événements passés',
  'Start Date': 'Date de début',
  'End Date': 'Date de fin',
  Format: 'Format',
  'Single Elimination': 'Élimination simple',
  'Double Elimination': 'Double élimination',
  'Round Robin': 'Round robin',
  'Max Participants': 'Participants maximum',

  // Club Tournament Management (45 keys - high priority)
  'Tournament Management': 'Gestion du tournoi',
  'Tournament Details': 'Détails du tournoi',
  'Tournament Name': 'Nom du tournoi',
  'Tournament Type': 'Type de tournoi',
  Singles: 'Simple',
  Doubles: 'Double',
  'Mixed Doubles': 'Double mixte',
  'Entry Fee': "Frais d'inscription",
  'Prize Pool': 'Cagnotte',
  'Registration Deadline': "Date limite d'inscription",
  'Tournament Status': 'Statut du tournoi',
  Draft: 'Brouillon',
  'Registration Open': 'Inscriptions ouvertes',
  'Registration Closed': 'Inscriptions fermées',
  'In Progress': 'En cours',
  Completed: 'Terminé',
  Cancelled: 'Annulé',
  'Participants List': 'Liste des participants',
  Registered: 'Inscrits',
  Waitlist: "Liste d'attente",
  Seeds: 'Têtes de série',
  Draw: 'Tirage au sort',
  'Generate Draw': 'Générer le tirage',
  'Bpaddle View': 'Vue du tableau',
  Matches: 'Matchs',
  'Match Schedule': 'Calendrier des matchs',
  'Court Assignment': 'Attribution des courts',
  'Live Scores': 'Scores en direct',
  'Update Score': 'Mettre à jour le score',
  'Declare Winner': 'Déclarer le vainqueur',
  Walkover: 'Forfait',
  'Set Score': 'Score du set',
  'Game Score': 'Score du jeu',
  Tiebreak: 'Jeu décisif',
  'Best of 3': 'Meilleur des 3',
  'Best of 5': 'Meilleur des 5',
  'Next Round': 'Tour suivant',
  'Previous Round': 'Tour précédent',
  Championship: 'Championnat',
  Champion: 'Champion',
  'Runner-up': 'Finaliste',
  '3rd Place': '3ème place',
  Consolation: 'Consolation',
  Bye: 'Exempt',
  Seeded: 'Tête de série',
  'Seed #': 'Série n°',
  Withdraw: 'Retirer',
  Replacement: 'Remplacement',
  Refund: 'Remboursement',

  // Profile Settings (10 keys)
  'Account Settings': 'Paramètres du compte',
  Notifications: 'Notifications',
  Privacy: 'Confidentialité',
  Language: 'Langue',
  Theme: 'Thème',
  Units: 'Unités',
  Metric: 'Métrique',
  Imperial: 'Impérial',
  'Delete Account': 'Supprimer le compte',
  'Sign Out': 'Déconnexion',

  // Event Card (5 keys)
  'Event Full': 'Événement complet',
  'Spots Left': 'Places restantes',
  'Free Event': 'Événement gratuit',
  'Members Only': 'Membres uniquement',
  RSVP: 'Confirmer',

  // Create Event (12 keys)
  'Create Event': 'Créer un événement',
  'Event Title': "Titre de l'événement",
  'Event Type': "Type d'événement",
  Social: 'Social',
  Competition: 'Compétition',
  Practice: 'Entraînement',
  Clinic: 'Clinique',
  'Event Description': "Description de l'événement",
  'Event Date': "Date de l'événement",
  'Event Time': "Heure de l'événement",
  'Event Location': "Lieu de l'événement",
  'Max Attendees': 'Participants maximum',
  'Require Approval': 'Approbation requise',

  // Hosted Event Card (11 keys)
  "You're Hosting": 'Vous organisez',
  'Edit Event': "Modifier l'événement",
  'Cancel Event': "Annuler l'événement",
  Attendees: 'Participants',
  Confirmed: 'Confirmés',
  Pending: 'En attente',
  Declined: 'Refusés',
  'Manage Attendees': 'Gérer les participants',
  Approve: 'Approuver',
  Reject: 'Rejeter',
  'Send Message to All': 'Envoyer un message à tous',

  // Dues Management (23 keys)
  'Dues Management': 'Gestion des cotisations',
  'Membership Dues': 'Cotisations de membre',
  'Dues Amount': 'Montant de la cotisation',
  'Billing Cycle': 'Cycle de facturation',
  Monthly: 'Mensuel',
  Quarterly: 'Trimestriel',
  Annually: 'Annuel',
  'One-time': 'Unique',
  'Due Date': "Date d'échéance",
  'Payment Status': 'Statut de paiement',
  Paid: 'Payé',
  Unpaid: 'Non payé',
  Overdue: 'En retard',
  Partial: 'Partiel',
  'Payment History': 'Historique des paiements',
  Invoice: 'Facture',
  Receipt: 'Reçu',
  'Send Reminder': 'Envoyer un rappel',
  'Mark as Paid': 'Marquer comme payé',
  'Amount Paid': 'Montant payé',
  'Payment Method': 'Méthode de paiement',
  Cash: 'Espèces',
  Check: 'Chèque',
  'Credit Card': 'Carte de crédit',
  'Bank Transfer': 'Virement bancaire',

  // Create Meetup (7 keys)
  'Create Meetup': 'Créer une rencontre',
  'Meetup Title': 'Titre de la rencontre',
  Recurring: 'Récurrent',
  'One Time': 'Unique',
  Frequency: 'Fréquence',
  Weekly: 'Hebdomadaire',
  'Bi-weekly': 'Bimensuel',

  // Edit Club Policy (9 keys)
  'Club Policies': 'Règlement du club',
  'Add Policy': 'Ajouter un règlement',
  'Policy Title': 'Titre du règlement',
  'Policy Content': 'Contenu du règlement',
  'Policy Type': 'Type de règlement',
  General: 'Général',
  Safety: 'Sécurité',
  Conduct: 'Conduite',
  Equipment: 'Équipement',

  // Manage League Participants (13 keys)
  'Participant Management': 'Gestion des participants',
  'Add Participant': 'Ajouter un participant',
  'Remove Participant': 'Retirer un participant',
  'Participant Name': 'Nom du participant',
  'Participant Level': 'Niveau du participant',
  'Participation Status': 'Statut de participation',
  Approved: 'Approuvé',
  Rejected: 'Rejeté',
  Waiting: 'En attente',
  'Seed Number': 'Numéro de série',
  Group: 'Groupe',
  Division: 'Division',
  Ranking: 'Classement',

  // Performance Dashboard (43 keys - critical)
  Performance: 'Performance',
  'Match Stats': 'Statistiques de match',
  'Overall Record': 'Bilan général',
  Wins: 'Victoires',
  Losses: 'Défaites',
  'Win Percentage': 'Pourcentage de victoires',
  'Games Won': 'Jeux gagnés',
  'Games Lost': 'Jeux perdus',
  'Sets Won': 'Sets gagnés',
  'Sets Lost': 'Sets perdus',
  Aces: 'Aces',
  'Double Faults': 'Doubles fautes',
  'First Serve %': '% Premier service',
  'Break Points Converted': 'Balles de break converties',
  'Return Game %': '% Retour de service',
  'Net Points Won': 'Points au filet gagnés',
  'Baseline Points Won': 'Points en fond de court gagnés',
  'Forehand Winners': 'Coups droits gagnants',
  'Backhand Winners': 'Revers gagnants',
  'Unforced Errors': 'Fautes directes',
  'Longest Rally': 'Échange le plus long',
  'Average Rally Length': 'Longueur moyenne des échanges',
  'Time on Court': 'Temps sur le court',
  'Longest Match': 'Match le plus long',
  'Shortest Match': 'Match le plus court',
  'Indoor Record': 'Bilan en salle',
  'Outdoor Record': 'Bilan en extérieur',
  'Clay Court': 'Terre battue',
  'Hard Court': 'Dur',
  'Grass Court': 'Gazon',
  'Recent Opponents': 'Adversaires récents',
  'Most Played': 'Plus joué contre',
  'Toughest Opponent': 'Adversaire le plus difficile',
  'Head-to-Head Records': 'Bilans face-à-face',
  'Monthly Progress': 'Progression mensuelle',
  'Yearly Progress': 'Progression annuelle',
  'Season Stats': 'Statistiques de la saison',
  'Career Stats': 'Statistiques en carrière',
  'Improvement Areas': 'Points à améliorer',
  Strengths: 'Points forts',
  Weaknesses: 'Points faibles',
  'Training Recommendations': "Recommandations d'entraînement",
  'Compare with': 'Comparer avec',

  // AI Matching (12 keys)
  'AI Recommendations': 'Recommandations IA',
  'Match Score': 'Score de compatibilité',
  'Skill Match': 'Compatibilité de niveau',
  'Location Match': 'Proximité',
  'Availability Match': 'Disponibilités',
  'Style Compatibility': 'Compatibilité de style',
  Recommended: 'Recommandé',
  'Highly Recommended': 'Fortement recommandé',
  'Perfect Match': 'Partenaire idéal',
  'Good Match': 'Bon partenaire',
  'Find Partners': 'Trouver des partenaires',
  'Partner Preferences': 'Préférences de partenaire',

  // Club Policies (28 keys)
  'Policy Details': 'Détails du règlement',
  'Last Updated': 'Dernière mise à jour',
  'Effective Date': "Date d'entrée en vigueur",
  Version: 'Version',
  'Acknowledgment Required': 'Accusé de réception requis',
  'I Agree': "J'accepte",
  'I Disagree': 'Je refuse',
  'View History': "Voir l'historique",
  'Policy Sections': 'Sections du règlement',
  Introduction: 'Introduction',
  'Membership Rules': "Règles d'adhésion",
  'Court Reservation': 'Réservation de court',
  'Guest Policy': 'Politique des invités',
  'Dress Code': 'Code vestimentaire',
  'Behavior Guidelines': 'Directives de comportement',
  'Disciplinary Actions': 'Actions disciplinaires',
  'Fee Structure': 'Structure des frais',
  'Cancellation Policy': "Politique d'annulation",
  'Refund Policy': 'Politique de remboursement',
  'Liability Waiver': 'Décharge de responsabilité',
  'Emergency Procedures': "Procédures d'urgence",
  'Contact Information': 'Coordonnées',
  Amendments: 'Modifications',
  Appendix: 'Annexe',
  References: 'Références',
  Glossary: 'Glossaire',
  FAQs: 'FAQ',

  // Find Club (24 keys)
  'Browse Clubs': 'Parcourir les clubs',
  'Search Results': 'Résultats de recherche',
  'No clubs found': 'Aucun club trouvé',
  'Try adjusting your filters': "Essayez d'ajuster vos filtres",
  'Club Details': 'Détails du club',
  'Club Members': 'Membres du club',
  'Club Events': 'Événements du club',
  'Club Facilities': 'Installations du club',
  'Number of Courts': 'Nombre de courts',
  'Court Type': 'Type de court',
  'Indoor Courts': 'Courts couverts',
  'Outdoor Courts': 'Courts extérieurs',
  Lighting: 'Éclairage',
  Parking: 'Parking',
  'Locker Rooms': 'Vestiaires',
  'Pro Shop': 'Boutique',
  Restaurant: 'Restaurant',
  'Join Club': 'Rejoindre le club',
  'Request Membership': "Demander l'adhésion",
  'Contact Club': 'Contacter le club',
  'Get Directions': "Obtenir l'itinéraire",
  'Club Hours': 'Horaires du club',
  'Membership Options': "Options d'adhésion",
  'Trial Available': 'Essai disponible',

  // Modals (18 keys)
  Confirmation: 'Confirmation',
  'Are you sure you want to continue?': 'Êtes-vous sûr de vouloir continuer ?',
  'This cannot be undone': 'Ceci ne peut pas être annulé',
  Proceed: 'Continuer',
  'Go Back': 'Retour',
  'Discard Changes': 'Annuler les modifications',
  'You have unsaved changes': 'Vous avez des modifications non enregistrées',
  Discard: 'Annuler',
  'Keep Editing': 'Continuer la modification',
  'Success!': 'Succès !',
  'Error!': 'Erreur !',
  'Warning!': 'Attention !',
  Information: 'Information',
  'Please wait...': 'Veuillez patienter...',
  'Processing...': 'Traitement en cours...',
  'Almost done...': 'Presque terminé...',
  'Done!': 'Terminé !',
  'Try Again': 'Réessayer',

  // Services (2 keys)
  'Book Now': 'Réserver maintenant',
  'Service Details': 'Détails du service',

  // Utils (4 keys)
  Copy: 'Copier',
  Copied: 'Copié',
  Share: 'Partager',
  Download: 'Télécharger',

  // Feed Card (3 keys)
  Like: "J'aime",
  Comment: 'Commenter',
  Share: 'Partager',
};

// Translate recursively
function translateRecursive(frObj, enObj) {
  const result = {};

  for (const key in enObj) {
    const enValue = enObj[key];
    const frValue = frObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      result[key] = translateRecursive(frValue || {}, enValue);
    } else {
      // Translate string values
      if (frValue === undefined || frValue === enValue) {
        result[key] = MEGA_TRANSLATIONS[enValue] || enValue;
      } else {
        result[key] = frValue;
      }
    }
  }

  return result;
}

console.log('🚀 Applying MEGA French translations...\n');
console.log(`📊 Translation dictionary: ${Object.keys(MEGA_TRANSLATIONS).length} entries\n`);

const translatedFr = translateRecursive(fr, en);

fs.writeFileSync(frPath, JSON.stringify(translatedFr, null, 2) + '\n', 'utf8');

console.log('✅ MEGA translation complete!\n');
console.log(`📁 Updated: ${frPath}\n`);
