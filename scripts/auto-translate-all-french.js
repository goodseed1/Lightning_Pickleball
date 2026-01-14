#!/usr/bin/env node

/**
 * AUTO-TRANSLATE ALL French keys
 * Reads untranslated-french-keys.json and applies natural French translations
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const frPath = path.join(localesDir, 'fr.json');
const untranslatedPath = path.join(__dirname, 'untranslated-french-keys.json');

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const untranslated = JSON.parse(fs.readFileSync(untranslatedPath, 'utf8'));

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

// Translation dictionary - English to French
const translations = {
  // Common words
  Clubs: 'Clubs',
  Public: 'Public',
  Logo: 'Logo',
  Social: 'Social',
  Brunch: 'Brunch',
  miles: 'miles',
  km: 'km',
  mi: 'mi',
  Expert: 'Expert',
  Rec: 'Rec',
  Important: 'Important',
  Club: 'Club',
  Info: 'Info',
  Participants: 'Participants',
  Services: 'Services',
  Total: 'Total',
  mile: 'mile',

  // Actions
  Enable: 'Activer',
  'Create Tournament': 'Créer un Tournoi',
  'Open Registration': 'Ouvrir les Inscriptions',
  'Assign Seeds': 'Assigner les Têtes de Série',
  'Complete Assignment': "Terminer l'Attribution",
  'Crown Winner': 'Couronner le Vainqueur',
  'View Attachment': 'Voir la Pièce Jointe',
  'Process Payment': 'Traiter le Paiement',
  'Mark as Paid': 'Marquer comme Payé',
  Generate: 'Générer',
  Assign: 'Assigner',
  Activate: 'Activer',

  // Status
  Approved: 'Approuvé',
  Granted: 'Accordé',
  Denied: 'Refusé',
  'Not determined': 'Non déterminé',
  'Checking...': 'Vérification...',
  'Follow System': 'Suivre le Système',
  'Partner Pending': 'Partenaire en Attente',
  'Partner Declined': 'Partenaire a Refusé',
  Waitlisted: "Sur Liste d'Attente",
  Confirmed: 'Confirmé',
  Normal: 'Normal',
  Participation: 'Participation',

  // Event Types
  Match: 'Match',
  Practice: 'Entraînement',
  Lightning: 'Match',
  Meetup: 'Rencontre',
  Casual: 'Décontracté',
  Ranked: 'Classé',
  General: 'Général',

  // Labels
  Host: 'Hôte',
  Friendly: 'Amical',
  Full: 'Complet',
  'Set Location': 'Définir le Lieu',
  'Apply as Team': 'Candidater en Équipe',
  'Apply Solo': 'Candidater Seul',
  'Registration Closed': 'Inscriptions Fermées',
  'Host Team Wins': "L'Équipe Hôte Gagne",
  'Guest Team Wins': "L'Équipe Invitée Gagne",

  // Requirements
  "This is a men's match": 'Ceci est un match masculin',
  "This is a women's match": 'Ceci est un match féminin',

  // Descriptions
  Description: 'Description',
  Auto: 'Auto',
  'Any Level': 'Tous Niveaux',
  'Level not set': 'Niveau non défini',
  'Rally/Practice': 'Échange/Entraînement',
  'All levels welcome': 'Tous les niveaux sont les bienvenus',

  // Skill levels
  'Beginner - New to tennis or learning basic strokes':
    'Débutant - Nouveau au tennis ou apprentissage des coups de base',
  'Elementary - Can hit basic strokes, understands doubles basics':
    'Élémentaire - Peut frapper des coups de base, comprend les bases du double',
  'Intermediate - Consistent strokes, strategic play':
    'Intermédiaire - Coups cohérents, jeu stratégique',
  'Advanced - Tournament experience, advanced skills':
    'Avancé - Expérience de tournoi, compétences avancées',

  // Languages
  한국어: '한국어',
  中文: '中文',
  日本語: '日本語',
  Español: 'Español',
  Français: 'Français',

  // Errors and alerts
  'Failed to Load Data': 'Échec du chargement des données',
  'Reminder Sent': 'Rappel envoyé',
  'Enable Auto Invoice': 'Activer la Facturation Automatique',
  Added: 'Ajouté',
  'Upload Complete': 'Téléchargement terminé',
  'Settings Saved': 'Paramètres enregistrés',
  'Reminders Sent': 'Rappels envoyés',
  'Settings Updated': 'Paramètres mis à jour',

  // Payment types
  'Join Fee': "Frais d'Adhésion",
  'Late Fee': 'Frais de Retard',
  'Payment Method': 'Méthode de Paiement',
  'Transaction ID (Optional)': 'ID de Transaction (Optionnel)',
  'Notes (Optional)': 'Notes (Optionnel)',
  Type: 'Type',
  Amount: 'Montant',
  Method: 'Méthode',
  Requested: 'Demandé',
  Notes: 'Notes',
  'Payment Proof': 'Preuve de Paiement',

  // Match formats
  '1 Set': '1 Set',
  'Single set match': 'Match en un set',
  '3 Sets': '3 Sets',
  'Best of 2 sets': 'Meilleur de 2 sets',
  '5 Sets': '5 Sets',
  'Best of 3 sets': 'Meilleur de 3 sets',
  'Short Sets': 'Sets Courts',
  'Match Format': 'Format de Match',
  'Seeding Method': 'Méthode de Tête de Série',
  'Create Tournament': 'Créer un Tournoi',

  // Seeding methods
  Manual: 'Manuel',
  'Admin assigns seeds manually': "L'admin attribue les têtes de série manuellement",
  Random: 'Aléatoire',
  'Fair random seeding (skill-independent)':
    'Têtes de série aléatoires équitables (indépendantes du niveau)',
  'Club Ranking': 'Classement du Club',
  'Seeds based on club ranking and win rate':
    'Têtes de série basées sur le classement du club et le taux de victoire',
  'Personal Rating': 'Classement Personnel',
  'Seeds based on ELO rating and skill level':
    'Têtes de série basées sur le classement ELO et le niveau de compétence',

  // Event descriptions
  'Male 2v2 match': 'Match masculin 2v2',
  'Female 2v2 match': 'Match féminin 2v2',
  'Mixed gender 2v2 match': 'Match mixte 2v2',

  // Weather
  'Weather Forecast': 'Prévisions Météo',
  'Chance of rain': 'Risque de pluie',
  Wind: 'Vent',
  'Weather Not Available': 'Météo Non Disponible',
  'Perfect conditions': 'Conditions parfaites',
  Playable: 'Jouable',
  'Wind affects play': 'Le vent affecte le jeu',
  'Difficult to play': 'Difficile à jouer',

  // RSVP
  RSVP: 'RSVP',
  Attend: 'Présent',
  Maybe: 'Peut-être',

  // Chat
  'Meetup Chat': 'Chat de la Rencontre',
  'Be the first to leave a message!': 'Soyez le premier à laisser un message !',
  'Type a message...': 'Tapez un message...',
  'Failed to send message': "Échec de l'envoi du message",

  // Badges
  'My Badges': 'Mes Badges',
  badges: 'badges',
  'Play matches and achieve milestones to earn badges!':
    'Jouez des matchs et atteignez des jalons pour gagner des badges !',
  'Earned: ': 'Obtenu : ',
  'Category: ': 'Catégorie : ',

  // Badge names
  'First Victory': 'Première Victoire',
  'You won your first match! 🎾': 'Vous avez gagné votre premier match ! 🎾',
  'First Club Member': 'Premier Membre du Club',
  'You joined your first tennis club! 🏟️': 'Vous avez rejoint votre premier club de tennis ! 🏟️',
  '5 Win Streak': 'Série de 5 Victoires',
  'You won 5 matches in a row!': "Vous avez gagné 5 matchs d'affilée !",
  'Social Butterfly': 'Papillon Social',
  'You became friends with 10+ players!': 'Vous êtes devenu ami avec plus de 10 joueurs !',
  'Tournament Champion': 'Champion de Tournoi',
  'You won a tournament!': 'Vous avez gagné un tournoi !',
  'League Master': 'Maître de Ligue',
  'You finished 1st in a league!': 'Vous avez terminé 1er dans une ligue !',
  'League Champion': 'Champion de Ligue',
  'You won a league! 👑': 'Vous avez gagné une ligue ! 👑',
  'Perfect Season': 'Saison Parfaite',
  'You finished a season undefeated!': 'Vous avez terminé une saison invaincu !',

  // Tournament
  Champion: 'Champion',
  'Runner-up': 'Finaliste',
  'Semi-finalist': 'Demi-finaliste',
  Challenger: 'Challenger',
  'My Profile': 'Mon Profil',
  Date: 'Date',
  'N/A': 'N/D',

  // Tabs
  Standings: 'Classement',
  Management: 'Gestion',
  'Unpaid Members': 'Membres Impayés',

  // Player labels
  'Player 1': 'Joueur 1',
  'Player 2': 'Joueur 2',
  Participant: 'Participant',
  Spectator: 'Spectateur',
  Helper: 'Assistant',

  // Numbers and counts (empty in French context)
  '': '',

  // Common phrases
  participants: 'participants',
  Format: 'Format',
};

// Auto-translate function
function autoTranslate(obj) {
  if (typeof obj === 'string') {
    // Direct translation
    if (translations[obj]) {
      return translations[obj];
    }

    // Handle template strings with {{}}
    if (obj.includes('{{')) {
      return obj
        .replace(
          /Level mismatch \(Your LTR: {{userNtrp}}, Allowed: {{minNtrp}}~{{maxNtrp}}\)/,
          'Niveau incompatible (Votre LTR : {{userNtrp}}, Autorisé : {{minNtrp}}~{{maxNtrp}})'
        )
        .replace(/Gender Mismatch/, 'Incompatibilité de Genre')
        .replace(
          /Apply: LTR {{minNtrp}} - {{maxNtrp}}/,
          'Candidater : LTR {{minNtrp}} - {{maxNtrp}}'
        )
        .replace(/Level: {{level}}/, 'Niveau : {{level}}')
        .replace(/{{count}} solo/, '{{count}} solo')
        .replace(/{{count}} solo applicants/, '{{count}} candidats solo')
        .replace(/{{current}}\/{{max}}/, '{{current}}/{{max}}')
        .replace(/{{count}} waiting/, '{{count}} en attente')
        .replace(
          /{{month}}\/{{day}}\/{{year}} {{hours}}:{{minutes}}/,
          '{{day}}/{{month}}/{{year}} {{hours}}:{{minutes}}'
        )
        .replace(/{{email}}/, '{{email}}')
        .replace(/{{tournament}}/, '{{tournament}}')
        .replace(/{{partner}}/, '{{partner}}')
        .replace(/{{error}}/, '{{error}}')
        .replace(
          /{{count}} participant\(s\) added successfully\./,
          '{{count}} participant(s) ajouté(s) avec succès.'
        )
        .replace(
          /{{success}} participant\(s\) added, {{failed}} failed\./,
          '{{success}} participant(s) ajouté(s), {{failed}} échoué(s).'
        )
        .replace(/Host LTR: {{level}} \({{gameType}}\)/, 'LTR Hôte : {{level}} ({{gameType}})')
        .replace(
          /Partner LTR: {{level}} \({{gameType}}\)/,
          'LTR Partenaire : {{level}} ({{gameType}})'
        )
        .replace(/Combined LTR: {{level}}/, 'LTR Combiné : {{level}}')
        .replace(/Host LTR: {{level}} \({{type}}\)/, 'LTR Hôte : {{level}} ({{type}})')
        .replace(/Partner LTR: {{level}} \({{type}}\)/, 'LTR Partenaire : {{level}} ({{type}})')
        .replace(/{{sender}}/, '{{sender}}')
        .replace(/{{eventTitle}}/, '{{eventTitle}}')
        .replace(/{{link}}/, '{{link}}')
        .replace(/{{type}}/, '{{type}}')
        .replace(/{{clubName}}/, '{{clubName}}')
        .replace(/{{city}}/, '{{city}}')
        .replace(/{{distance}}/, '{{distance}}')
        .replace(/{{team}}/, '{{team}}')
        .replace(/{{league}}/, '{{league}}')
        .replace(/{{title}}/, '{{title}}')
        .replace(/{{max}}/, '{{max}}')
        .replace(/{{points}}/, '{{points}}')
        .replace(/{position}/, '{position}')
        .replace(/{{name}}/, '{{name}}')
        .replace(/{{numbers}}/, '{{numbers}}');
    }

    // Multi-word translation patterns
    if (obj.includes('Are you sure')) {
      return obj.replace(
        /Are you sure you want to delete "{{title}}" regular meeting\?\n\nDeletion will stop automatically generated events\./,
        'Êtes-vous sûr de vouloir supprimer la réunion régulière "{{title}}" ?\n\nLa suppression arrêtera la création automatique d\'événements.'
      );
    }

    if (obj.includes('When you add')) {
      return obj.replace(
        /When you add a regular meeting, events will be\nautomatically created every week/,
        'Lorsque vous ajoutez une réunion régulière, des événements seront\nautomatiquement créés chaque semaine'
      );
    }

    if (obj.includes('The passwords')) {
      return obj.replace(
        /The passwords you entered do not match\.\nPlease check again\./,
        'Les mots de passe saisis ne correspondent pas.\nVeuillez vérifier à nouveau.'
      );
    }

    if (obj.includes('This email is already registered')) {
      return obj.replace(
        /This email is already registered\.\nTry logging in instead\./,
        'Cet e-mail est déjà enregistré.\nEssayez de vous connecter à la place.'
      );
    }

    if (obj.includes('Email or password is incorrect')) {
      return obj.replace(
        /Email or password is incorrect\.\n\n💡 If you forgot your password, tap "Forgot Password\?"/,
        'L\'e-mail ou le mot de passe est incorrect.\n\n💡 Si vous avez oublié votre mot de passe, appuyez sur "Mot de passe oublié ?"'
      );
    }

    if (obj.includes('No account found')) {
      return obj.replace(
        /No account found with this email\.\n\nWould you like to sign up\?/,
        'Aucun compte trouvé avec cet e-mail.\n\nVoulez-vous vous inscrire ?'
      );
    }

    if (obj.includes('Login is temporarily restricted')) {
      return obj.replace(
        /Login is temporarily restricted for security\.\n\n☕ Please take a break and try again later\./,
        'La connexion est temporairement restreinte pour des raisons de sécurité.\n\n☕ Veuillez prendre une pause et réessayer plus tard.'
      );
    }

    if (obj.includes('Email is not verified')) {
      return obj.replace(
        /Email is not verified yet\.\nPlease check your email\./,
        "L'e-mail n'est pas encore vérifié.\nVeuillez vérifier votre e-mail."
      );
    }

    // If no translation found, return original
    return obj;
  }

  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const result = {};
    for (const key in obj) {
      result[key] = autoTranslate(obj[key]);
    }
    return result;
  }

  return obj;
}

console.log('🤖 Auto-translating ALL French keys...');

const translated = autoTranslate(untranslated);
const updatedFr = deepMerge(fr, translated);

fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2), 'utf8');

console.log('✅ Auto-translation complete!');
console.log('📊 All untranslated keys processed');
console.log('\n🔍 Run find-untranslated-french.js again to verify remaining keys');
