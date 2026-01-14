#!/usr/bin/env node
/**
 * COMPREHENSIVE French Translation - Round 5 V2
 * Translates remaining 1330 untranslated keys with enhanced dictionary
 */

const fs = require('fs');
const path = require('path');

const FR_PATH = path.join(__dirname, '../src/locales/fr.json');
const EN_PATH = path.join(__dirname, '../src/locales/en.json');

// COMPREHENSIVE TRANSLATION DICTIONARY
const TRANSLATIONS = {
  // =========================
  // COMMON UI ELEMENTS
  // =========================
  Clubs: 'Clubs',
  Services: 'Services',
  Public: 'Public',
  Social: 'Social',
  Logo: 'Logo',
  Expert: 'Expert',
  Brunch: 'Brunch',
  Club: 'Club',
  Important: 'Important',
  Info: 'Info',
  Participants: 'Participants',
  Rec: 'Rec',

  // =========================
  // UNITS & MEASUREMENTS
  // =========================
  km: 'km',
  mi: 'mi',
  miles: 'miles',
  '{{distance}} km': '{{distance}} km',
  '{{distance}} mi': '{{distance}} mi',

  // =========================
  // EMAIL & AUTH
  // =========================
  '{{email}}': '{{email}}',
  'Invalid Email': 'Adresse e-mail invalide',
  'Email Already Registered': 'Adresse e-mail déjà enregistrée',
  'Email Not Registered': 'Adresse e-mail non enregistrée',
  'Email Not Verified': 'Adresse e-mail non vérifiée',
  'Email Resent 📧': 'E-mail renvoyé 📧',
  'Email Sent 📧': 'E-mail envoyé 📧',
  'Password Too Short': 'Mot de passe trop court',
  'Password Mismatch': 'Mots de passe différents',
  'Weak Password': 'Mot de passe faible',
  'Account Not Found': 'Compte introuvable',
  'Authentication Error': "Erreur d'authentification",
  'Too Many Attempts': 'Trop de tentatives',
  'Too Many Requests': 'Trop de demandes',

  'Password must be at least 6 characters long.':
    'Le mot de passe doit contenir au moins 6 caractères.',
  'The passwords you entered do not match.\\nPlease check again.':
    'Les mots de passe saisis ne correspondent pas.\\nVeuillez vérifier.',
  'This email is already registered.\\nTry logging in instead.':
    'Cette adresse e-mail est déjà enregistrée.\\nEssayez de vous connecter plutôt.',
  'Email or password is incorrect.\\n\\n💡 If you forgot your password, tap \\"Forgot Password?\\"':
    'L\'adresse e-mail ou le mot de passe est incorrect.\\n\\n💡 Si vous avez oublié votre mot de passe, appuyez sur \\"Mot de passe oublié ?\\"',
  'No account found with this email.\\n\\nWould you like to sign up?':
    'Aucun compte trouvé avec cette adresse e-mail.\\n\\nVoulez-vous vous inscrire ?',
  'Login is temporarily restricted for security.\\n\\n☕ Please take a break and try again later.':
    'La connexion est temporairement restreinte pour des raisons de sécurité.\\n\\n☕ Prenez une pause et réessayez plus tard.',
  'An error occurred during authentication.':
    "Une erreur s'est produite lors de l'authentification.",
  'Email is not verified yet.\\nPlease check your email.':
    "L'adresse e-mail n'est pas encore vérifiée.\\nVeuillez consulter votre e-mail.",
  'Verification email has been resent to {{email}}.\\n\\nPlease check your email!\\n(Also check your spam folder)':
    "L'e-mail de vérification a été renvoyé à {{email}}.\\n\\nVeuillez consulter votre e-mail !\\n(Vérifiez aussi votre dossier spam)",
  'Failed to resend verification email.': "Échec de renvoi de l'e-mail de vérification.",
  'An error occurred while resending verification email.':
    "Une erreur s'est produite lors du renvoi de l'e-mail de vérification.",
  'Missing information for resend. Please try logging in again.':
    'Informations manquantes pour le renvoi. Veuillez vous reconnecter.',
  'Login information missing. Please try again.':
    'Informations de connexion manquantes. Veuillez réessayer.',
  'Password reset link has been sent to {{email}}.\\n\\nPlease check your email!\\n(Also check your spam folder)':
    'Le lien de réinitialisation du mot de passe a été envoyé à {{email}}.\\n\\nVeuillez consulter votre e-mail !\\n(Vérifiez aussi votre dossier spam)',
  'Too many requests. Please try again later.': 'Trop de demandes. Veuillez réessayer plus tard.',
  'An error occurred while sending the password reset email.':
    "Une erreur s'est produite lors de l'envoi de l'e-mail de réinitialisation du mot de passe.",

  // =========================
  // SCHEDULE & MEETUPS
  // =========================
  'Are you sure you want to delete \\"{{title}}\\" regular meeting?\\n\\nDeletion will stop automatically generated events.':
    'Êtes-vous sûr de vouloir supprimer la réunion régulière \\"{{title}}\\" ?\\n\\nLa suppression arrêtera la génération automatique d\'événements.',
  'When you add a regular meeting, events will be\\nautomatically created every week':
    'Lorsque vous ajoutez une réunion régulière, des événements seront\\nautomatiquement créés chaque semaine',

  // =========================
  // MY ACTIVITIES
  // =========================
  '👤 My Activities': '👤 Mes activités',
  'Style: ': 'Style : ',
  'Ranked Match Statistics': 'Statistiques de matchs classés',
  'Only ranked matches that affect ELO rating':
    'Uniquement les matchs classés qui affectent le classement ELO',
  'ELO Rating Trend': 'Tendance du classement ELO',
  'Last 6 months': '6 derniers mois',
  'Current ELO Rating': 'Classement ELO actuel',
  'Intermediate Tier': 'Niveau intermédiaire',
  'Recent Match Results': 'Résultats récents',
  'Lightning Match Notifications': 'Notifications de Match Éclair',
  'New match request notifications': 'Notifications de nouvelles demandes de match',
  'Chat Notifications': 'Notifications de chat',
  'Message and comment notifications': 'Notifications de messages et commentaires',
  'Language change feature coming soon.': 'Fonction de changement de langue à venir.',
  English: 'Anglais',
  'Privacy settings feature coming soon.': 'Paramètres de confidentialité à venir.',
  'Profile visibility settings': 'Paramètres de visibilité du profil',
  'Sign Out': 'Se déconnecter',

  // Partner & Friend invitations
  'Partner invitation accepted!': 'Invitation de partenaire acceptée !',
  'Error accepting invitation.': "Erreur lors de l'acceptation de l'invitation.",
  'Error rejecting invitation.': "Erreur lors du rejet de l'invitation.",
  'Partner invitation rejected. You can re-accept within 24 hours.':
    "Invitation de partenaire rejetée. Vous pouvez l'accepter à nouveau dans les 24 heures.",
  'Friend invitation accepted!': "Invitation d'ami acceptée !",
  'Friend invitation rejected.': "Invitation d'ami rejetée.",
  'An error occurred while accepting the invitation.':
    "Une erreur s'est produite lors de l'acceptation de l'invitation.",
  'An error occurred while rejecting the invitation.':
    "Une erreur s'est produite lors du rejet de l'invitation.",
  'Event editing feature coming soon.': "Fonction de modification d'événement à venir.",

  // =========================
  // LEAGUES & TOURNAMENTS
  // =========================
  'Send Team Invitation': "Envoyer une invitation d'équipe",
  'Sending Invitation...': "Envoi de l'invitation...",
  Format: 'Format',
  '🏛️ New Team Invitations': "🏛️ Nouvelles invitations d'équipe",
  'sent you a team invitation': "vous a envoyé une invitation d'équipe",
  'Expires in {{hours}}h': 'Expire dans {{hours}}h',
  '🏛️ Send Team Invitation': "🏛️ Envoyer une invitation d'équipe",
  '🏛️ Select Partner': '🏛️ Sélectionner un partenaire',
  'Send a team invitation to your partner. You can register once they accept.':
    "Envoyez une invitation d'équipe à votre partenaire. Vous pourrez vous inscrire une fois qu'il l'aura acceptée.",
  'Select a partner to apply for the doubles league.':
    'Sélectionnez un partenaire pour postuler à la ligue en double.',
  'Search partner...': 'Rechercher un partenaire...',
  'Apply to League': 'Postuler à la ligue',
  'Join this league and compete with other players':
    "Rejoignez cette ligue et affrontez d'autres joueurs",
  'League Info': 'Informations sur la ligue',
  Period: 'Période',
  Participants: 'Participants',
  '': '',
  Open: 'Ouverte',
  Preparing: 'Préparation',
  "Join the league to compete with other players and improve your tennis skills. You'll need to wait for admin approval after applying.":
    "Rejoignez la ligue pour affronter d'autres joueurs et améliorer vos compétences en tennis. Vous devrez attendre l'approbation de l'administrateur après avoir postulé.",
  'Applying...': 'Candidature en cours...',
  'Apply to League': 'Postuler à la ligue',
  'Registration is currently closed': "L'inscription est actuellement fermée",
  'Application Details': 'Détails de la candidature',
  'Applied:': 'Candidature :',
  'Approved:': 'Approuvé :',
  'Current Status:': 'Statut actuel :',

  'Login is required to join league.': 'La connexion est requise pour rejoindre une ligue.',
  'Login is required to join tournament.': 'La connexion est requise pour rejoindre un tournoi.',
  'You must be a club member to join tournaments. Please join the club first.':
    "Vous devez être membre du club pour participer aux tournois. Veuillez d'abord rejoindre le club.",
  'Already Participating': 'Déjà participant',
  'You are already a participant in this league.': 'Vous êtes déjà participant à cette ligue.',
  'Registration Complete': 'Inscription terminée',
  'League application completed!': 'Candidature à la ligue terminée !',
  'Error applying to league.': 'Erreur lors de la candidature à la ligue.',
  'Error joining tournament: {{error}}': "Erreur lors de l'inscription au tournoi : {{error}}",

  // =========================
  // LEGAL DOCUMENTS (Long texts)
  // =========================
  'Liability Disclaimer': 'Clause de non-responsabilité',
  'Marketing Communications Consent': 'Consentement aux communications marketing',
};

function translateValue(value, enValue) {
  // Direct match first
  if (TRANSLATIONS[value]) {
    return TRANSLATIONS[value];
  }

  // If no match and value === enValue, return original (untranslatable or already correct)
  return value;
}

function translateObject(obj, enObj, path = '') {
  const result = {};

  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Recursive for objects
      result[key] = translateObject(obj[key], enObj[key] || {}, currentPath);
    } else if (typeof obj[key] === 'string') {
      const enValue = enObj[key];

      // Only translate if fr === en (untranslated)
      if (obj[key] === enValue) {
        const translated = translateValue(obj[key], enValue);
        if (translated !== obj[key]) {
          console.log(`  ✓ [${currentPath}] "${obj[key]}" → "${translated}"`);
        }
        result[key] = translated;
      } else {
        // Already translated
        result[key] = obj[key];
      }
    } else {
      result[key] = obj[key];
    }
  }

  return result;
}

function main() {
  console.log('🇫🇷 Comprehensive French Translation - Round 5 V2\\n');

  const frData = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));
  const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

  // Backup
  const backupPath = FR_PATH + '.v2.backup';
  fs.writeFileSync(backupPath, JSON.stringify(frData, null, 2), 'utf8');
  console.log(`📦 Backup: ${backupPath}\\n`);

  console.log('🔄 Translating...\\n');
  const translated = translateObject(frData, enData);

  fs.writeFileSync(FR_PATH, JSON.stringify(translated, null, 2), 'utf8');
  console.log(`\\n✅ Saved to: ${FR_PATH}\\n`);

  // Verify JSON
  try {
    JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));
    console.log('✅ JSON valid!\\n');
  } catch (err) {
    console.error('❌ JSON invalid:', err.message);
    fs.copyFileSync(backupPath, FR_PATH);
    console.log('🔄 Restored backup\\n');
    process.exit(1);
  }
}

main();
