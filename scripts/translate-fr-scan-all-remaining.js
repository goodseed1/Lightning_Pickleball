#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const FR_PATH = path.join(__dirname, '../src/locales/fr.json');
const EN_PATH = path.join(__dirname, '../src/locales/en.json');

const frData = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));
const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

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

// Comprehensive translation dictionary for common patterns
const translationDict = {
  // Common words
  mile: 'mile',
  miles: 'miles',
  kilometer: 'kilomètre',
  kilometers: 'kilomètres',
  notification: 'Notification',
  Notification: 'Notification',
  success: 'succès',
  error: 'erreur',
  loading: 'chargement',
  save: 'Enregistrer',
  cancel: 'Annuler',
  delete: 'Supprimer',
  edit: 'Modifier',
  confirm: 'Confirmer',
  yes: 'Oui',
  no: 'Non',
  ok: 'OK',
  close: 'Fermer',
  back: 'Retour',
  next: 'Suivant',
  previous: 'Précédent',
  submit: 'Soumettre',
  continue: 'Continuer',
  finish: 'Terminer',
  start: 'Démarrer',
  stop: 'Arrêter',
  pause: 'Pause',
  resume: 'Reprendre',
  retry: 'Réessayer',
  refresh: 'Actualiser',
  search: 'Rechercher',
  filter: 'Filtrer',
  sort: 'Trier',
  view: 'Voir',
  add: 'Ajouter',
  remove: 'Retirer',
  update: 'Mettre à Jour',
  upload: 'Téléverser',
  download: 'Télécharger',
  share: 'Partager',
  send: 'Envoyer',
  receive: 'Recevoir',
  open: 'Ouvrir',
  show: 'Afficher',
  hide: 'Masquer',
  enable: 'Activer',
  disable: 'Désactiver',
  required: 'requis',
  optional: 'facultatif',
  available: 'disponible',
  unavailable: 'indisponible',
  active: 'actif',
  inactive: 'inactif',
  pending: 'en attente',
  approved: 'approuvé',
  rejected: 'rejeté',
  completed: 'terminé',
  cancelled: 'annulé',
  failed: 'échoué',
  invalid: 'invalide',
  valid: 'valide',
  expired: 'expiré',
  new: 'nouveau',
  old: 'ancien',
  current: 'actuel',
  previous: 'précédent',
  total: 'total',
  count: 'nombre',
  amount: 'montant',
  price: 'prix',
  cost: 'coût',
  fee: 'frais',
  payment: 'paiement',
  paid: 'payé',
  unpaid: 'impayé',
  due: 'dû',
  overdue: 'en retard',
  balance: 'solde',
  description: 'Description',
  title: 'Titre',
  name: 'Nom',
  date: 'Date',
  time: 'Heure',
  location: 'Lieu',
  address: 'Adresse',
  email: 'Email',
  phone: 'Téléphone',
  message: 'Message',
  note: 'Note',
  comment: 'Commentaire',
  review: 'Avis',
  rating: 'Évaluation',
  feedback: 'Retour',
  status: 'Statut',
  type: 'Type',
  category: 'Catégorie',
  tag: 'Étiquette',
  label: 'Label',
  value: 'Valeur',
  result: 'Résultat',
  score: 'Score',
  rank: 'Rang',
  level: 'Niveau',
  points: 'Points',
  match: 'Match',
  game: 'Jeu',
  set: 'Set',
  tournament: 'Tournoi',
  league: 'Ligue',
  event: 'Événement',
  club: 'Club',
  team: 'Équipe',
  player: 'Joueur',
  member: 'Membre',
  user: 'Utilisateur',
  profile: 'Profil',
  account: 'Compte',
  settings: 'Paramètres',
  privacy: 'Confidentialité',
  security: 'Sécurité',
  help: 'Aide',
  support: 'Support',
  about: 'À Propos',
  terms: 'Conditions',
  policy: 'Politique',
  rules: 'Règles',
  guidelines: 'Directives',
  info: 'Info',
  details: 'Détails',
  overview: 'Aperçu',
  summary: 'Résumé',
  report: 'Rapport',
  statistics: 'Statistiques',
  analytics: 'Analytiques',
  metrics: 'Métriques',
  data: 'Données',
  chart: 'Graphique',
  graph: 'Graphique',
  table: 'Tableau',
  list: 'Liste',
  item: 'Élément',
  option: 'Option',
  choice: 'Choix',
  selection: 'Sélection',
  preference: 'Préférence',
  configuration: 'Configuration',
  customize: 'Personnaliser',
  default: 'Par Défaut',
  custom: 'Personnalisé',
  auto: 'Auto',
  manual: 'Manuel',
  automatic: 'Automatique',
  Public: 'Public',
  Private: 'Privé',
  public: 'public',
  private: 'privé',
  All: 'Tous',
  all: 'tous',
  None: 'Aucun',
  none: 'aucun',
  Other: 'Autre',
  other: 'autre',
  More: 'Plus',
  more: 'plus',
  Less: 'Moins',
  less: 'moins',
  Home: 'Accueil',
  Dashboard: 'Tableau de Bord',
  Inbox: 'Boîte de Réception',
  Notifications: 'Notifications',
  Messages: 'Messages',
  Chat: 'Chat',
  Friends: 'Amis',
  Social: 'Social',
  Community: 'Communauté',
  Explore: 'Explorer',
  Discover: 'Découvrir',
  Browse: 'Parcourir',
  Calendar: 'Calendrier',
  Schedule: 'Calendrier',
  History: 'Historique',
  Archive: 'Archive',
  Favorites: 'Favoris',
  Bookmarks: 'Signets',
  Saved: 'Enregistrés',
  Draft: 'Brouillon',
  Drafts: 'Brouillons',
  Trash: 'Corbeille',
  Deleted: 'Supprimés',
  Spam: 'Spam',
  Blocked: 'Bloqués',
  Reported: 'Signalés',
  Flagged: 'Marqués',
  Important: 'Important',
  Urgent: 'Urgent',
  Warning: 'Avertissement',
  Info: 'Info',
  Tip: 'Astuce',
  Note: 'Note',
  Announcement: 'Annonce',
  Alert: 'Alerte',
  Reminder: 'Rappel',
  Update: 'Mise à Jour',
  Upgrade: 'Mise à Niveau',
  Version: 'Version',
  Beta: 'Bêta',
  New: 'Nouveau',
  Featured: 'En Vedette',
  Popular: 'Populaire',
  Trending: 'Tendances',
  Recommended: 'Recommandé',
  Top: 'Top',
  Best: 'Meilleur',
  Latest: 'Derniers',
  Recent: 'Récents',
  Today: "Aujourd'hui",
  Yesterday: 'Hier',
  Tomorrow: 'Demain',
  Week: 'Semaine',
  Month: 'Mois',
  Year: 'Année',
  Day: 'Jour',
  Hour: 'Heure',
  Minute: 'Minute',
  Second: 'Seconde',
  Morning: 'Matin',
  Afternoon: 'Après-midi',
  Evening: 'Soirée',
  Night: 'Nuit',
  Monday: 'Lundi',
  Tuesday: 'Mardi',
  Wednesday: 'Mercredi',
  Thursday: 'Jeudi',
  Friday: 'Vendredi',
  Saturday: 'Samedi',
  Sunday: 'Dimanche',
  January: 'Janvier',
  February: 'Février',
  March: 'Mars',
  April: 'Avril',
  May: 'Mai',
  June: 'Juin',
  July: 'Juillet',
  August: 'Août',
  September: 'Septembre',
  October: 'Octobre',
  November: 'Novembre',
  December: 'Décembre',
};

// Auto-translate function
function autoTranslate(text) {
  // Check if exact match in dictionary
  if (translationDict[text]) {
    return translationDict[text];
  }

  // Check for patterns
  if (text.endsWith('Placeholder')) {
    const base = text.replace('Placeholder', '');
    return `Saisissez ${translationDict[base.toLowerCase()] || base.toLowerCase()}...`;
  }

  if (text.endsWith('Label')) {
    const base = text.replace('Label', '');
    return translationDict[base] || base;
  }

  if (text.endsWith('Title')) {
    const base = text.replace('Title', '');
    return translationDict[base] || base;
  }

  if (text.endsWith('Message')) {
    const base = text.replace('Message', '');
    return `Message de ${translationDict[base.toLowerCase()] || base.toLowerCase()}`;
  }

  if (text.endsWith('Error')) {
    const base = text.replace('Error', '');
    return `Erreur de ${translationDict[base.toLowerCase()] || base.toLowerCase()}`;
  }

  if (text.endsWith('Success')) {
    const base = text.replace('Success', '');
    return `${translationDict[base] || base} réussi`;
  }

  // Return original if no translation found
  return text;
}

// Scan and translate all untranslated keys
function scanAndTranslate(frObj, enObj, path = '', translations = {}) {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key]) && enObj[key] !== null) {
      if (!frObj[key]) frObj[key] = {};
      scanAndTranslate(frObj[key], enObj[key], currentPath, translations);
    } else if (frObj[key] === enObj[key]) {
      // Found untranslated key - auto-translate
      const translated = autoTranslate(enObj[key]);

      // Set translation in nested object
      const pathParts = currentPath.split('.');
      let current = translations;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) current[pathParts[i]] = {};
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = translated;
    }
  }
  return translations;
}

console.log('🔍 Scanning for ALL untranslated keys...');
const autoTranslations = scanAndTranslate(frData, enData);

console.log('🚀 Applying auto-translations...');
const updated = deepMerge(frData, autoTranslations);

fs.writeFileSync(FR_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ DONE! Auto-translation complete.');
console.log('🎉 French translation is now as complete as possible!');
