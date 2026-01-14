#!/usr/bin/env node

/**
 * Complete French Translation - Final Production Version
 * Professional French translations for Lightning Pickleball mobile app
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const FR_PATH = path.join(__dirname, '../src/locales/fr.json');

// Load files
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));

// Complete professional French translation dictionary
const FR_TRANSLATIONS = {
  // Most common untranslated phrases (from sample)
  OK: 'OK',
  'Signing up...': 'Inscription en cours...',
  Clubs: 'Clubs',
  'Basic Info': 'Informations de base',
  'Recurring Meetups': 'Rencontres régulières',
  Visibility: 'Visibilité',
  Public: 'Public',
  'Club Rules': 'Règlement du club',
  'Creating...': 'Création en cours...',
  Parking: 'Parking',
  'Ball Machine': 'Lance-balles',
  'Pro Shop': 'Boutique pro',
  Introduction: 'Présentation',
  'e.g., 50': 'ex: 50',
  Note: 'Note',
  'Rules / Etiquette': 'Règlement / Étiquette',
  Logo: 'Logo',
  'Description cannot exceed 200 characters': 'La description ne peut pas dépasser 200 caractères',
  'Great description! ✅': 'Excellente description ! ✅',
  'Sign Up': "S'inscrire",
  'Join Lightning Pickleball': 'Rejoindre Lightning Pickleball',
  Name: 'Nom',
  'Signing up...': 'Inscription en cours...',
  'Password must be at least 8 characters and include uppercase, lowercase, and numbers.':
    'Le mot de passe doit contenir au moins 8 caractères incluant majuscules, minuscules et chiffres.',
  'I agree to the Terms of Service (Required)': "J'accepte les Conditions d'utilisation (Requis)",
  'I agree to the Privacy Policy (Required)': "J'accepte la Politique de confidentialité (Requis)",
  'Coming Soon': 'Bientôt disponible',
  'Terms of Service are coming soon.': "Les Conditions d'utilisation seront bientôt disponibles.",
  'Privacy Policy is coming soon.': 'La Politique de confidentialité sera bientôt disponible.',

  // Error messages
  Error: 'Erreur',
  'Please enter your name.': 'Veuillez saisir votre nom.',
  'Name must be at least 2 characters.': 'Le nom doit contenir au moins 2 caractères.',
  'Please enter your email.': 'Veuillez saisir votre email.',
  'Please enter a valid email format.': "Veuillez saisir un format d'email valide.",
  'Please enter your password.': 'Veuillez saisir votre mot de passe.',
  'Password must be at least 8 characters.': 'Le mot de passe doit contenir au moins 8 caractères.',
  'Password must include uppercase, lowercase, and numbers.':
    'Le mot de passe doit inclure majuscules, minuscules et chiffres.',
  'Passwords do not match.': 'Les mots de passe ne correspondent pas.',
  'Please agree to the Terms of Service.': "Veuillez accepter les Conditions d'utilisation.",
  'Please agree to the Privacy Policy.': 'Veuillez accepter la Politique de confidentialité.',
  'Sign Up Failed': "Échec de l'inscription",
  'Sign up failed.': "L'inscription a échoué.",
  'This email is already in use.': 'Cet email est déjà utilisé.',
  'Invalid email format.': "Format d'email invalide.",
  'Email sign up is disabled.': "L'inscription par email est désactivée.",
  'Password is too weak.': 'Le mot de passe est trop faible.',
  'An unknown error occurred.': "Une erreur inconnue s'est produite.",

  // Success messages
  'Sign Up Complete': 'Inscription terminée',
  'Sign up completed. Please set up your profile through onboarding.':
    "Inscription terminée. Veuillez configurer votre profil via l'intégration.",

  // Club creation
  'Create Club': 'Créer un club',
  'Court Address': 'Adresse du court',
  'Loading club information...': 'Chargement des informations du club...',
  'Search Pickleball Court Address': "Rechercher l'adresse du court de pickleball",
  'Add Regular Meeting Time': 'Ajouter un horaire de rencontre régulier',
  'Day Selection': 'Sélection du jour',
  'Meeting Time': 'Horaire de rencontre',
  'Start Time': 'Heure de début',
  'End Time': 'Heure de fin',
  'Add Meeting Time': 'Ajouter un horaire',
  'Confirm Address': "Confirmer l'adresse",
  'Address is required.': "L'adresse est requise.",
  'Club Name': 'Nom du club',
  'Search court address (EN/US/Atlanta bias)': "Rechercher l'adresse du court (EN/US/Atlanta)",
  'Pickleball Court Address': 'Adresse du court de pickleball',
  'Search for pickleball court address': 'Rechercher une adresse de court de pickleball',
  'e.g., Duluth Korean Pickleball Club': 'ex: Club de Pickleball Coréen de Duluth',
  "Describe your club's goals, atmosphere, and unique features":
    "Décrivez les objectifs, l'ambiance et les caractéristiques uniques de votre club",
  'e.g.:\n• Maintain 70%+ attendance for regular meetings\n• Show mutual respect and courtesy\n• Clean up after using facilities':
    'ex:\n• Maintenir une présence de 70%+ aux rencontres régulières\n• Faire preuve de respect mutuel et de courtoisie\n• Nettoyer après utilisation des installations',
  Day: 'Jour',
  'Create Club': 'Créer le club',
  'Club Settings': 'Paramètres du club',
  'Public clubs allow other users to search and apply for membership.':
    'Les clubs publics permettent aux autres utilisateurs de rechercher et de postuler pour adhérer.',
  'Club name must be at least 2 characters': 'Le nom du club doit contenir au moins 2 caractères',
  'Club name cannot exceed 30 characters': 'Le nom du club ne peut pas dépasser 30 caractères',
  'Great name! ✅': 'Excellent nom ! ✅',
  'Description must be at least 10 characters (currently {{count}} chars)':
    'La description doit contenir au moins 10 caractères (actuellement {{count}} caractères)',
  'Please enter a club name': 'Veuillez saisir un nom de club',
  'Please write a club description': 'Veuillez rédiger une description du club',
  'Please write a more detailed club description':
    'Veuillez rédiger une description plus détaillée du club',
  'Please enter court address': "Veuillez saisir l'adresse du court",
  'Please add at least one meeting time': 'Veuillez ajouter au moins un horaire de rencontre',
  'Address set ✅': 'Adresse définie ✅',
  '🏛️ Club Creation Limit': '🏛️ Limite de création de clubs',
  'Each user can create a maximum of {{max}} clubs.\n\nYou currently own {{current}} club(s).\n\nTo create more clubs, please contact the administrator via the AI assistant chatbot at the bottom of the app.':
    "Chaque utilisateur peut créer un maximum de {{max}} clubs.\n\nVous possédez actuellement {{current}} club(s).\n\nPour créer plus de clubs, veuillez contacter l'administrateur via le chatbot assistant IA en bas de l'application.",
  '✅ Saved!': '✅ Enregistré !',
  '{{name}} club information has been saved.':
    'Les informations du club {{name}} ont été enregistrées.',
  'Save Failed': "Échec de l'enregistrement",
  '🎉 Club Created!': '🎉 Club créé !',
  '{{name}} club has been successfully created.': 'Le club {{name}} a été créé avec succès.',
  'Club Creation Failed': 'Échec de la création du club',

  // Profile
  'User Profile': 'Profil utilisateur',
  'Loading profile...': 'Chargement du profil...',
  'Failed to load profile': 'Échec du chargement du profil',
  'Profile not found': 'Profil introuvable',
  'Go Back': 'Retour',
  'Pickleball Player': 'Joueur de pickleball',
  'No location info': 'Aucune information de localisation',
  'Joined {{date}}': 'Inscrit le {{date}}',
  'Friend Request': "Demande d'ami",
  'Send friend request to {{nickname}}?': "Envoyer une demande d'ami à {{nickname}} ?",
  Send: 'Envoyer',
  Cancel: 'Annuler',
  Success: 'Succès',
  'Friend request sent!': "Demande d'ami envoyée !",
  'Cannot send friend request.': "Impossible d'envoyer la demande d'ami.",
  'Failed to send friend request. Please try again.':
    "Échec de l'envoi de la demande d'ami. Veuillez réessayer.",
  'Login required.': 'Connexion requise.',
  'Add Friend': 'Ajouter un ami',
  'Send Message': 'Envoyer un message',
  'Match Statistics': 'Statistiques de matchs',
  Rankings: 'Classements',
  Wins: 'Victoires',
  Losses: 'Défaites',
  'Win Rate': 'Taux de victoire',
  '{{count}} Win Streak!': '{{count}} victoires consécutives !',
  Singles: 'Simple',
  Doubles: 'Double',
  'Mixed Doubles': 'Double mixte',
  'Player Information': 'Informations du joueur',
  Languages: 'Langues',
  'No information': 'Aucune information',
  'Recent Match History': 'Historique récent des matchs',
  'Early Morning': 'Tôt le matin',
  Morning: 'Matin',
  Afternoon: 'Après-midi',
  Evening: 'Soir',
  Night: 'Nuit',

  // Club members
  Admin: 'Administrateur',
  Member: 'Membre',
  Pending: 'En attente',
  Approve: 'Approuver',
  Reject: 'Rejeter',
  Remove: 'Retirer',
  'Are you sure you want to remove {{userName}} from the club?\nThis action cannot be undone.':
    'Êtes-vous sûr de vouloir retirer {{userName}} du club ?\nCette action est irréversible.',
  'Member Management': 'Gestion des membres',
  'Current Members': 'Membres actuels',
  'Join Requests': "Demandes d'adhésion",
  'All Members': 'Tous les membres',
  Manager: 'Gestionnaire',
  'Promote to Admin': 'Promouvoir administrateur',
  'Demote to Member': 'Rétrograder en membre',
  'Remove from Club': 'Retirer du club',
  Manage: 'Gérer',
  'Promote to Manager': 'Promouvoir gestionnaire',
  'Demote to Member': 'Rétrograder en membre',
  'Change Role': 'Changer le rôle',
  Change: 'Changer',
  'Change {{userName}} to {{role}}?': 'Changer {{userName}} en {{role}} ?',
  '{{userName}} has been changed to {{role}}.': '{{userName}} a été changé en {{role}}.',
  'Failed to change role.': 'Échec du changement de rôle.',
  'Remove Member': 'Retirer le membre',
  '{{userName}} has been removed from the club.': '{{userName}} a été retiré du club.',
  'Failed to remove member.': 'Échec du retrait du membre.',
  'Approve Request': 'Approuver la demande',
  "Approve {{userName}}'s join request?": "Approuver la demande d'adhésion de {{userName}} ?",
  "{{userName}}'s request has been approved.": 'La demande de {{userName}} a été approuvée.',
  'Failed to approve join request.': "Échec de l'approbation de la demande d'adhésion.",
  'Decline Request': 'Refuser la demande',
  "Decline {{userName}}'s join request?": "Refuser la demande d'adhésion de {{userName}} ?",
  "{{userName}}'s request has been declined.": 'La demande de {{userName}} a été refusée.',
  'Failed to decline join request.': "Échec du refus de la demande d'adhésion.",
  'Invalid request data.': 'Données de demande invalides.',
  'Failed to load join requests.': "Échec du chargement des demandes d'adhésion.",
  'Successfully promoted to manager.': 'Promotion en gestionnaire réussie.',
  'Successfully demoted to member.': 'Rétrogradation en membre réussie.',
  'Member has been removed.': 'Le membre a été retiré.',
  'An error occurred while performing the action.':
    "Une erreur s'est produite lors de l'exécution de l'action.",
  'Member not found. They may have already been removed.':
    'Membre introuvable. Il a peut-être déjà été retiré.',
  'Permission denied. Only admins can perform this action.':
    'Permission refusée. Seuls les administrateurs peuvent effectuer cette action.',
  'You cannot remove yourself.': 'Vous ne pouvez pas vous retirer vous-même.',
  'Cannot remove the club owner.': 'Impossible de retirer le propriétaire du club.',
  'Loading members...': 'Chargement des membres...',
  'Requested {{date}}': 'Demandé le {{date}}',
  'No Members': 'Aucun membre',
  'No members have joined this club yet.': "Aucun membre n'a encore rejoint ce club.",
  'No Join Requests': "Aucune demande d'adhésion",
  'No new join requests': "Aucune nouvelle demande d'adhésion",
  'View Profile →': 'Voir le profil →',
  'Enter removal reason...': 'Saisir la raison du retrait...',
  'Removed by admin': "Retiré par l'administrateur",
  'Promote to Manager': 'Promouvoir gestionnaire',
  'Remove from Club': 'Retirer du club',
  'Promote {{userName}} to manager?': 'Promouvoir {{userName}} en gestionnaire ?',
  'Demote {{userName}} to member?': 'Rétrograder {{userName}} en membre ?',
  'Remove {{userName}} from club?': 'Retirer {{userName}} du club ?',

  // Chat
  Chat: 'Discussion',
  Staff: 'Personnel',

  // Email login
  Password: 'Mot de passe',
  'Go to Sign up': "Aller à l'inscription",
  Login: 'Connexion',
  'Confirm Password': 'Confirmer le mot de passe',
  'Enter your email': 'Saisir votre email',
  'Enter your password': 'Saisir votre mot de passe',
  'Confirm your password': 'Confirmer votre mot de passe',
  'Login After Verification': 'Connexion après vérification',
  'Sign up with different email': "S'inscrire avec un autre email",
  'Try Again': 'Réessayer',
  'Go to Login': 'Aller à la connexion',
  'Email is available': 'Email disponible',
  'Account found': 'Compte trouvé',
  'No account found. Please sign up!': 'Aucun compte trouvé. Veuillez vous inscrire !',
  'This email is already registered. Try logging in instead.':
    'Cet email est déjà enregistré. Essayez de vous connecter.',
  'Check Your Email!': 'Vérifiez vos emails !',
  'We sent you an email with a verification link.\nClick the link in the email to verify your account.\n\n(Please also check your spam folder)':
    "Nous vous avons envoyé un email avec un lien de vérification.\nCliquez sur le lien dans l'email pour vérifier votre compte.\n\n(Veuillez également vérifier votre dossier spam)",
  'Please enter both email and password.': "Veuillez saisir l'email et le mot de passe.",
  'Please enter a valid email address.\n\nExample: example@email.com':
    'Veuillez saisir une adresse email valide.\n\nExemple : exemple@email.com',
  'Please use a stronger password.\n\n💡 Use at least 6 characters with letters and numbers.':
    'Veuillez utiliser un mot de passe plus fort.\n\n💡 Utilisez au moins 6 caractères avec lettres et chiffres.',
  'Please enter your email address first to reset your password.':
    "Veuillez d'abord saisir votre adresse email pour réinitialiser votre mot de passe.",
  'Please enter a valid email address.': 'Veuillez saisir une adresse email valide.',

  // Activities
  Profile: 'Profil',
  Settings: 'Paramètres',
  Matches: 'Matchs',
  'Coming Soon': 'Bientôt disponible',
  'Are you sure you want to sign out?': 'Êtes-vous sûr de vouloir vous déconnecter ?',
  Accepted: 'Accepté',
  Rejected: 'Rejeté',

  // Leagues and Tournaments
  Playoffs: 'Séries éliminatoires',
  Accept: 'Accepter',
  Status: 'Statut',
  'Single Elimination': 'Élimination simple',
  'Please select a partner.': 'Veuillez sélectionner un partenaire.',
  'Loading...': 'Chargement...',
  Tournament: 'Tournoi',
  Apply: 'Postuler',

  // Tournament Management
  'Tournament Management': 'Gestion du tournoi',
  Active: 'Actif',
  Completed: 'Terminé',
  'In Progress': 'En cours',
  Skill: 'Compétence',
  Registered: 'Inscrit',
  Seed: 'Tête de série',
  'Please assign seed numbers to all participants before starting.':
    'Veuillez attribuer des numéros de tête de série à tous les participants avant de commencer.',
  'Please assign seeds to all {{count}} participants.':
    'Veuillez attribuer des têtes de série aux {{count}} participants.',
  Deleted: 'Supprimé',
  'Match Result': 'Résultat du match',
  Delete: 'Supprimer',

  // Event card
  Cancelled: 'Annulé',
  'Almost Full': 'Presque complet',
  Win: 'Victoire',
  Loss: 'Défaite',

  // Profile settings
  'Please enable location permission in Settings':
    "Veuillez activer l'autorisation de localisation dans les Paramètres",
  'Please set location permission': "Veuillez définir l'autorisation de localisation",
  'Light Mode': 'Mode clair',
  'Dark Mode': 'Mode sombre',
  'Please enter your nickname to proceed with account deletion.':
    'Veuillez saisir votre pseudo pour procéder à la suppression du compte.',

  // Dues Management
  'Dues Management': 'Gestion des cotisations',
  'Payment Status': 'Statut de paiement',
  'Please enter valid dues amount': 'Veuillez saisir un montant de cotisation valide',
  'Grace Period': 'Période de grâce',
  'Payment Methods': 'Modes de paiement',
  Add: 'Ajouter',
  'Display Name': "Nom d'affichage",
  Paid: 'Payé',
  Unpaid: 'Non payé',
  Overdue: 'En retard',
  Save: 'Enregistrer',
  Close: 'Fermer',
  Share: 'Partager',
  Confirm: 'Confirmer',
  Done: 'Terminé',
  'QR Code': 'Code QR',
  None: 'Aucun',
  'Are you sure you want to delete this QR code?':
    'Êtes-vous sûr de vouloir supprimer ce code QR ?',

  // Terms and policies
  'Terms of Service': "Conditions d'utilisation",
  'Privacy Policy': 'Politique de confidentialité',

  // Common UI elements that appear frequently
  Time: 'Heure',
  Date: 'Date',
  Location: 'Lieu',
  Address: 'Adresse',
  Description: 'Description',
  Rules: 'Règles',
  Details: 'Détails',
  Information: 'Informations',
  Owner: 'Propriétaire',
  Update: 'Mettre à jour',
  Updated: 'Mis à jour',
  Created: 'Créé',
  Modified: 'Modifié',
  Search: 'Rechercher',
  Filter: 'Filtrer',
  Sort: 'Trier',
  Edit: 'Modifier',
  View: 'Voir',
  Download: 'Télécharger',
  Upload: 'Téléverser',
  Copy: 'Copier',
  Paste: 'Coller',
  Cut: 'Couper',
  Print: 'Imprimer',
  Export: 'Exporter',
  Import: 'Importer',
  Help: 'Aide',
  About: 'À propos',
  Contact: 'Contact',
  Support: 'Support',
  Feedback: 'Commentaires',
  Report: 'Signaler',
  Block: 'Bloquer',
  Unblock: 'Débloquer',
  Follow: 'Suivre',
  Unfollow: 'Ne plus suivre',
  Invite: 'Inviter',
  Join: 'Rejoindre',
  Leave: 'Quitter',
  Decline: 'Refuser',
  Approve: 'Approuver',
  Select: 'Sélectionner',
  Clear: 'Effacer',
  Reset: 'Réinitialiser',
  Refresh: 'Actualiser',
  Reload: 'Recharger',
  Retry: 'Réessayer',
  Undo: 'Annuler',
  Redo: 'Rétablir',
  Submit: 'Soumettre',
  Continue: 'Continuer',
  Skip: 'Passer',
  Back: 'Retour',
  Next: 'Suivant',
  Previous: 'Précédent',
  Finish: 'Terminer',
  Yes: 'Oui',
  No: 'Non',
  All: 'Tous',
  Other: 'Autre',
  Unknown: 'Inconnu',
  New: 'Nouveau',
  Archived: 'Archivé',
  Draft: 'Brouillon',
  Published: 'Publié',
  Scheduled: 'Planifié',
  Failed: 'Échoué',
  Warning: 'Avertissement',
  Info: 'Info',
  'Please wait...': 'Veuillez patienter...',
  'Processing...': 'Traitement en cours...',
  'Saving...': 'Enregistrement...',
  'Uploading...': 'Téléversement...',
  'Downloading...': 'Téléchargement...',
  'Sending...': 'Envoi...',
  'Connecting...': 'Connexion...',
  'Updating...': 'Mise à jour...',
  'Deleting...': 'Suppression...',
  'Searching...': 'Recherche...',
  'No results found': 'Aucun résultat trouvé',
  'No data available': 'Aucune donnée disponible',
  'Not available': 'Non disponible',
  'Not found': 'Introuvable',
  Empty: 'Vide',
};

function deepMerge(target, translations, enObj, path = '') {
  for (const key in target) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = target[key];
    const enValue = enObj[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      deepMerge(value, translations, enValue || {}, currentPath);
    } else if (typeof value === 'string' && typeof enValue === 'string' && value === enValue) {
      // This key is untranslated - check if we have a translation
      if (translations[enValue]) {
        target[key] = translations[enValue];
        console.log(`✓ ${currentPath}: "${enValue}" → "${translations[enValue]}"`);
      }
    }
  }
}

console.log('🚀 Starting comprehensive French translation...\n');
console.log(`📖 Translation dictionary: ${Object.keys(FR_TRANSLATIONS).length} entries\n`);

// Apply translations
deepMerge(fr, FR_TRANSLATIONS, en);

// Write result
fs.writeFileSync(FR_PATH, JSON.stringify(fr, null, 2) + '\n', 'utf8');

console.log(`\n✅ Translation complete!`);
console.log(`💾 Updated: ${FR_PATH}\n`);

// Count remaining
function countRemaining(obj, enObj) {
  let count = 0;
  for (const key in obj) {
    const value = obj[key];
    const enValue = enObj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      count += countRemaining(value, enValue || {});
    } else if (typeof value === 'string' && value === enValue) {
      count++;
    }
  }
  return count;
}

const remaining = countRemaining(fr, en);
console.log(`📊 Remaining untranslated keys: ${remaining}`);

if (remaining > 0) {
  console.log(`\n⚠️  Note: ${remaining} keys still match English text.`);
  console.log(
    `These may be intentional (proper nouns, technical terms) or need additional translations.`
  );
}

console.log(`\n🎉 French translation update complete!\n`);
