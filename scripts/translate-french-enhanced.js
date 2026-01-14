#!/usr/bin/env node

/**
 * Enhanced French Translation Script with Context-Aware Logic
 * Translates remaining untranslated keys in fr.json with pickleball-specific vocabulary
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const FR_PATH = path.join(__dirname, '../src/locales/fr.json');

// Load JSON files
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));

// Pickleball-specific translation logic
function translatePickleballText(text) {
  if (!text || typeof text !== 'string') return text;

  // Common sentence patterns
  const patterns = [
    [/^Are you sure you want to (.+)\?$/i, 'Êtes-vous sûr de vouloir $1 ?'],
    [/^Do you want to (.+)\?$/i, 'Voulez-vous $1 ?'],
    [/^Would you like to (.+)\?$/i, 'Souhaitez-vous $1 ?'],
    [/^Please (.+)$/i, 'Veuillez $1'],
    [/^You need to (.+)$/i, 'Vous devez $1'],
    [/^Unable to (.+)$/i, 'Impossible de $1'],
    [/^Failed to (.+)$/i, 'Échec de $1'],
    [/^Successfully (.+)$/i, '$1 avec succès'],
    [/^No (.+) found$/i, 'Aucun(e) $1 trouvé(e)'],
    [/^Enter (.+)$/i, 'Saisir $1'],
    [/^Select (.+)$/i, 'Sélectionner $1'],
    [/^Choose (.+)$/i, 'Choisir $1'],
    [/^Add (.+)$/i, 'Ajouter $1'],
    [/^Remove (.+)$/i, 'Retirer $1'],
    [/^Delete (.+)$/i, 'Supprimer $1'],
    [/^Edit (.+)$/i, 'Modifier $1'],
    [/^Update (.+)$/i, 'Mettre à jour $1'],
    [/^View (.+)$/i, 'Voir $1'],
    [/^Show (.+)$/i, 'Afficher $1'],
    [/^Hide (.+)$/i, 'Masquer $1'],
    [/^Search (.+)$/i, 'Rechercher $1'],
    [/^Filter (.+)$/i, 'Filtrer $1'],
    [/^Sort by (.+)$/i, 'Trier par $1'],
    [/^Loading (.+)\.\.\.$/i, 'Chargement de $1...'],
    [/^Saving (.+)\.\.\.$/i, 'Enregistrement de $1...'],
    [/^Total (.+)$/i, 'Total $1'],
    [/^All (.+)$/i, 'Tous les $1'],
    [/^My (.+)$/i, 'Mes $1'],
    [/^Your (.+)$/i, 'Votre $1'],
    [/^New (.+)$/i, 'Nouveau $1'],
    [/^Create (.+)$/i, 'Créer $1'],
    [/^Manage (.+)$/i, 'Gérer $1'],
    [/^(.+) Details$/i, 'Détails de $1'],
    [/^(.+) Information$/i, 'Informations de $1'],
    [/^(.+) Settings$/i, 'Paramètres de $1'],
    [/^(.+) Status$/i, 'Statut de $1'],
    [/^(.+) History$/i, 'Historique de $1'],
    [/^(.+) List$/i, 'Liste de $1'],
    [/^(.+) Required$/i, '$1 requis(e)'],
    [/^(.+) Optional$/i, '$1 optionnel(le)'],
    [/^(.+) is required$/i, '$1 est requis(e)'],
  ];

  for (const [pattern, replacement] of patterns) {
    if (pattern.test(text)) {
      return text.replace(pattern, replacement);
    }
  }

  // Number patterns
  if (/^\d+$/.test(text)) return text; // Keep numbers as-is
  if (/^\d+\s+days?$/i.test(text)) return text.replace(/(\d+)\s+days?/i, '$1 jour$1');
  if (/^\d+\s+hours?$/i.test(text)) return text.replace(/(\d+)\s+hours?/i, '$1 heure$1');
  if (/^\d+\s+minutes?$/i.test(text)) return text.replace(/(\d+)\s+minutes?/i, '$1 minute$1');
  if (/^\d+\s+weeks?$/i.test(text)) return text.replace(/(\d+)\s+weeks?/i, '$1 semaine$1');
  if (/^\d+\s+months?$/i.test(text)) return text.replace(/(\d+)\s+months?/i, '$1 mois');
  if (/^\d+\s+years?$/i.test(text)) return text.replace(/(\d+)\s+years?/i, '$1 an$1');

  return null; // No pattern matched
}

// Comprehensive word/phrase dictionary
const dictionary = {
  // Actions - Base verbs
  accept: 'accepter',
  accepted: 'accepté',
  accepting: 'acceptation',
  add: 'ajouter',
  added: 'ajouté',
  adding: 'ajout',
  adjust: 'ajuster',
  adjusted: 'ajusté',
  adjusting: 'ajustement',
  allow: 'autoriser',
  allowed: 'autorisé',
  apply: 'appliquer',
  applied: 'appliqué',
  approve: 'approuver',
  approved: 'approuvé',
  archive: 'archiver',
  archived: 'archivé',
  assign: 'attribuer',
  assigned: 'attribué',
  attach: 'joindre',
  attached: 'joint',
  block: 'bloquer',
  blocked: 'bloqué',
  book: 'réserver',
  booked: 'réservé',
  booking: 'réservation',
  cancel: 'annuler',
  cancelled: 'annulé',
  change: 'changer',
  changed: 'changé',
  check: 'vérifier',
  checked: 'vérifié',
  choose: 'choisir',
  clear: 'effacer',
  cleared: 'effacé',
  close: 'fermer',
  closed: 'fermé',
  complete: 'terminer',
  completed: 'terminé',
  confirm: 'confirmer',
  confirmed: 'confirmé',
  connect: 'connecter',
  connected: 'connecté',
  continue: 'continuer',
  copy: 'copier',
  copied: 'copié',
  create: 'créer',
  created: 'créé',
  creating: 'création',
  decline: 'refuser',
  declined: 'refusé',
  delete: 'supprimer',
  deleted: 'supprimé',
  deleting: 'suppression',
  disable: 'désactiver',
  disabled: 'désactivé',
  download: 'télécharger',
  downloaded: 'téléchargé',
  edit: 'modifier',
  edited: 'modifié',
  editing: 'modification',
  enable: 'activer',
  enabled: 'activé',
  end: 'terminer',
  ended: 'terminé',
  enter: 'saisir',
  entered: 'saisi',
  export: 'exporter',
  exported: 'exporté',
  fail: 'échouer',
  failed: 'échoué',
  fetch: 'récupérer',
  fetching: 'récupération',
  filter: 'filtrer',
  filtered: 'filtré',
  find: 'trouver',
  finish: 'terminer',
  finished: 'terminé',
  follow: 'suivre',
  followed: 'suivi',
  forward: 'transférer',
  generate: 'générer',
  generated: 'généré',
  hide: 'masquer',
  hidden: 'masqué',
  import: 'importer',
  imported: 'importé',
  include: 'inclure',
  included: 'inclus',
  invite: 'inviter',
  invited: 'invité',
  join: 'rejoindre',
  joined: 'rejoint',
  leave: 'quitter',
  left: 'quitté',
  load: 'charger',
  loaded: 'chargé',
  loading: 'chargement',
  login: 'connexion',
  logout: 'déconnexion',
  manage: 'gérer',
  managing: 'gestion',
  modify: 'modifier',
  modified: 'modifié',
  move: 'déplacer',
  moved: 'déplacé',
  open: 'ouvrir',
  opened: 'ouvert',
  paid: 'payé',
  paste: 'coller',
  pay: 'payer',
  paying: 'paiement',
  payment: 'paiement',
  pending: 'en attente',
  postpone: 'reporter',
  postponed: 'reporté',
  print: 'imprimer',
  printed: 'imprimé',
  process: 'traiter',
  processed: 'traité',
  processing: 'traitement',
  publish: 'publier',
  published: 'publié',
  receive: 'recevoir',
  received: 'reçu',
  record: 'enregistrer',
  recorded: 'enregistré',
  refresh: 'actualiser',
  refreshed: 'actualisé',
  register: 'inscrire',
  registered: 'inscrit',
  registration: 'inscription',
  reject: 'rejeter',
  rejected: 'rejeté',
  rejecting: 'rejet',
  release: 'libérer',
  released: 'libéré',
  remove: 'retirer',
  removed: 'retiré',
  removing: 'retrait',
  rename: 'renommer',
  renamed: 'renommé',
  renew: 'renouveler',
  renewed: 'renouvelé',
  renewal: 'renouvellement',
  reply: 'répondre',
  report: 'signaler',
  reported: 'signalé',
  request: 'demander',
  requested: 'demandé',
  require: 'exiger',
  required: 'requis',
  reschedule: 'reprogrammer',
  rescheduled: 'reprogrammé',
  reset: 'réinitialiser',
  resolve: 'résoudre',
  resolved: 'résolu',
  restore: 'restaurer',
  restored: 'restauré',
  resume: 'reprendre',
  resumed: 'repris',
  retire: 'abandonner',
  retired: 'abandonné',
  return: 'retourner',
  returned: 'retourné',
  review: 'examiner',
  reviewed: 'examiné',
  save: 'enregistrer',
  saved: 'enregistré',
  saving: 'enregistrement',
  scan: 'scanner',
  scanned: 'scanné',
  schedule: 'planifier',
  scheduled: 'planifié',
  search: 'rechercher',
  searching: 'recherche',
  seed: 'classer',
  seeded: 'classé',
  seeding: 'classement',
  select: 'sélectionner',
  selected: 'sélectionné',
  selecting: 'sélection',
  send: 'envoyer',
  sending: 'envoi',
  sent: 'envoyé',
  set: 'définir',
  setup: 'configuration',
  share: 'partager',
  shared: 'partagé',
  sharing: 'partage',
  show: 'afficher',
  shown: 'affiché',
  sign: 'signer',
  signed: 'signé',
  sort: 'trier',
  sorted: 'trié',
  start: 'démarrer',
  started: 'démarré',
  starting: 'démarrage',
  stop: 'arrêter',
  stopped: 'arrêté',
  submit: 'soumettre',
  submitted: 'soumis',
  subscribe: "s'abonner",
  subscribed: 'abonné',
  subscription: 'abonnement',
  success: 'succès',
  successful: 'réussi',
  suspend: 'suspendre',
  suspended: 'suspendu',
  suspension: 'suspension',
  sync: 'synchroniser',
  synced: 'synchronisé',
  syncing: 'synchronisation',
  toggle: 'basculer',
  transfer: 'transférer',
  transferred: 'transféré',
  unblock: 'débloquer',
  unblocked: 'débloqué',
  undo: 'annuler',
  unfollow: 'ne plus suivre',
  unfollowed: 'non suivi',
  unlock: 'déverrouiller',
  unlocked: 'déverrouillé',
  unpaid: 'non payé',
  unregister: 'désinscrire',
  unregistered: 'non inscrit',
  unsubscribe: 'se désabonner',
  unsubscribed: 'désabonné',
  update: 'mettre à jour',
  updated: 'mis à jour',
  updating: 'mise à jour',
  upgrade: 'mettre à niveau',
  upgraded: 'mis à niveau',
  upload: 'téléverser',
  uploaded: 'téléversé',
  uploading: 'téléversement',
  verify: 'vérifier',
  verified: 'vérifié',
  view: 'voir',
  viewed: 'vu',
  viewing: 'affichage',
  wait: 'attendre',
  waiting: 'en attente',
  warn: 'avertir',
  warning: 'avertissement',
  withdraw: 'retirer',
  withdrawn: 'retiré',
  withdrawal: 'retrait',

  // Pickleball terms
  match: 'match',
  matches: 'matchs',
  game: 'jeu',
  games: 'jeux',
  set: 'set',
  sets: 'sets',
  point: 'point',
  points: 'points',
  score: 'score',
  scores: 'scores',
  win: 'victoire',
  wins: 'victoires',
  winner: 'gagnant',
  winners: 'gagnants',
  loss: 'défaite',
  losses: 'défaites',
  loser: 'perdant',
  draw: 'match nul',
  tie: 'égalité',
  tiebreak: 'jeu décisif',
  deuce: 'égalité',
  advantage: 'avantage',
  serve: 'service',
  serves: 'services',
  return: 'retour',
  ace: 'ace',
  aces: 'aces',
  fault: 'faute',
  faults: 'fautes',
  'double fault': 'double faute',
  'double faults': 'doubles fautes',
  'unforced error': 'faute directe',
  'unforced errors': 'fautes directes',
  'break point': 'balle de break',
  'break points': 'balles de break',
  'match point': 'balle de match',
  'match points': 'balles de match',
  'set point': 'balle de set',
  'set points': 'balles de set',
  'game point': 'balle de jeu',
  love: 'zéro',
  singles: 'simple',
  doubles: 'double',
  'mixed doubles': 'double mixte',
  partner: 'partenaire',
  partners: 'partenaires',
  opponent: 'adversaire',
  opponents: 'adversaires',
  team: 'équipe',
  teams: 'équipes',
  player: 'joueur',
  players: 'joueurs',
  coach: 'entraîneur',
  coaches: 'entraîneurs',
  rating: 'niveau',
  ratings: 'niveaux',
  ranking: 'classement',
  rankings: 'classements',
  rank: 'rang',
  level: 'niveau',
  skill: 'compétence',
  skills: 'compétences',
  beginner: 'débutant',
  intermediate: 'intermédiaire',
  advanced: 'avancé',
  expert: 'expert',
  professional: 'professionnel',
  pro: 'pro',

  // Tournament/League terms
  tournament: 'tournoi',
  tournaments: 'tournois',
  league: 'ligue',
  leagues: 'ligues',
  season: 'saison',
  seasons: 'saisons',
  round: 'tour',
  rounds: 'tours',
  bpaddle: 'grille',
  draw: 'tableau',
  seed: 'tête de série',
  seeded: 'tête de série',
  unseeded: 'non classé',
  'wild card': 'wild card',
  qualifier: 'qualificatif',
  qualifiers: 'qualificatifs',
  qualifying: 'qualification',
  qualified: 'qualifié',
  qualification: 'qualification',
  'main draw': 'tableau principal',
  consolation: 'consolation',
  playoff: 'série éliminatoire',
  playoffs: 'séries éliminatoires',
  semifinal: 'demi-finale',
  semifinals: 'demi-finales',
  final: 'finale',
  finals: 'finales',
  championship: 'championnat',
  champion: 'champion',
  champions: 'champions',
  'runner-up': 'finaliste',
  'third place': 'troisième place',
  elimination: 'élimination',
  'single elimination': 'élimination simple',
  'double elimination': 'élimination double',
  'round robin': 'round robin',
  ladder: 'échelle',
  pool: 'poule',
  pools: 'poules',
  group: 'groupe',
  groups: 'groupes',
  division: 'division',
  divisions: 'divisions',
  standings: 'classement',
  leaderboard: 'tableau des leaders',

  // Club/Membership
  club: 'club',
  clubs: 'clubs',
  member: 'membre',
  members: 'membres',
  membership: 'adhésion',
  memberships: 'adhésions',
  owner: 'propriétaire',
  admin: 'administrateur',
  admins: 'administrateurs',
  administrator: 'administrateur',
  captain: 'capitaine',
  coordinator: 'coordinateur',
  director: 'directeur',
  organizer: 'organisateur',
  manager: 'gestionnaire',
  staff: 'personnel',
  volunteer: 'bénévole',
  volunteers: 'bénévoles',
  guest: 'invité',
  guests: 'invités',

  // Financial
  dues: 'cotisations',
  fee: 'frais',
  fees: 'frais',
  payment: 'paiement',
  payments: 'paiements',
  paid: 'payé',
  unpaid: 'non payé',
  overdue: 'en retard',
  due: 'dû',
  balance: 'solde',
  amount: 'montant',
  total: 'total',
  subtotal: 'sous-total',
  price: 'prix',
  cost: 'coût',
  charge: 'frais',
  refund: 'remboursement',
  refunds: 'remboursements',
  credit: 'crédit',
  debit: 'débit',
  invoice: 'facture',
  invoices: 'factures',
  receipt: 'reçu',
  receipts: 'reçus',
  transaction: 'transaction',
  transactions: 'transactions',
  billing: 'facturation',
  discount: 'réduction',
  discounts: 'réductions',
  coupon: 'coupon',
  coupons: 'coupons',
  promo: 'promo',
  'promo code': 'code promo',
  tax: 'taxe',
  taxes: 'taxes',

  // Facility/Location
  court: 'court',
  courts: 'courts',
  venue: 'lieu',
  venues: 'lieux',
  location: 'lieu',
  locations: 'lieux',
  address: 'adresse',
  facility: 'installation',
  facilities: 'installations',
  indoor: 'intérieur',
  outdoor: 'extérieur',
  surface: 'surface',
  'hard court': 'court dur',
  'clay court': 'court en terre battue',
  'grass court': 'court en gazon',
  lighting: 'éclairage',
  lights: 'lumières',
  'locker room': 'vestiaire',
  'locker rooms': 'vestiaires',
  restroom: 'toilettes',
  restrooms: 'toilettes',
  parking: 'parking',
  clubhouse: 'pavillon',

  // Time/Date
  date: 'date',
  time: 'heure',
  duration: 'durée',
  start: 'début',
  end: 'fin',
  'start date': 'date de début',
  'end date': 'date de fin',
  'start time': 'heure de début',
  'end time': 'heure de fin',
  today: "aujourd'hui",
  tomorrow: 'demain',
  yesterday: 'hier',
  week: 'semaine',
  weeks: 'semaines',
  month: 'mois',
  months: 'mois',
  year: 'année',
  years: 'années',
  day: 'jour',
  days: 'jours',
  hour: 'heure',
  hours: 'heures',
  minute: 'minute',
  minutes: 'minutes',
  second: 'seconde',
  seconds: 'secondes',
  morning: 'matin',
  afternoon: 'après-midi',
  evening: 'soir',
  night: 'nuit',
  weekday: 'jour de semaine',
  weekend: 'week-end',
  daily: 'quotidien',
  weekly: 'hebdomadaire',
  monthly: 'mensuel',
  yearly: 'annuel',
  annual: 'annuel',

  // Status/State
  status: 'statut',
  state: 'état',
  active: 'actif',
  inactive: 'inactif',
  enabled: 'activé',
  disabled: 'désactivé',
  available: 'disponible',
  unavailable: 'non disponible',
  occupied: 'occupé',
  vacant: 'vacant',
  open: 'ouvert',
  closed: 'fermé',
  online: 'en ligne',
  offline: 'hors ligne',
  live: 'en direct',
  upcoming: 'à venir',
  past: 'passé',
  current: 'actuel',
  previous: 'précédent',
  next: 'suivant',
  new: 'nouveau',
  old: 'ancien',
  draft: 'brouillon',
  published: 'publié',
  archived: 'archivé',
  deleted: 'supprimé',
  banned: 'interdit',
  blocked: 'bloqué',
  suspended: 'suspendu',
  expired: 'expiré',
  valid: 'valide',
  invalid: 'invalide',

  // Common UI
  yes: 'oui',
  no: 'non',
  ok: 'OK',
  okay: 'OK',
  done: 'terminé',
  finish: 'terminer',
  next: 'suivant',
  previous: 'précédent',
  back: 'retour',
  forward: 'suivant',
  continue: 'continuer',
  skip: 'passer',
  cancel: 'annuler',
  close: 'fermer',
  exit: 'quitter',
  confirm: 'confirmer',
  submit: 'soumettre',
  apply: 'appliquer',
  reset: 'réinitialiser',
  clear: 'effacer',
  undo: 'annuler',
  redo: 'rétablir',
  refresh: 'actualiser',
  reload: 'recharger',
  retry: 'réessayer',
  'try again': 'réessayer',
  home: 'accueil',
  menu: 'menu',
  more: 'plus',
  less: 'moins',
  'show more': 'afficher plus',
  'show less': 'afficher moins',
  'load more': 'charger plus',
  'see all': 'voir tout',
  'see more': 'voir plus',
  expand: 'développer',
  collapse: 'réduire',
  all: 'tous',
  none: 'aucun',
  any: "n'importe quel",
  other: 'autre',
  others: 'autres',

  // Messages/Communication
  message: 'message',
  messages: 'messages',
  chat: 'discussion',
  chats: 'discussions',
  conversation: 'conversation',
  conversations: 'conversations',
  comment: 'commentaire',
  comments: 'commentaires',
  reply: 'répondre',
  replies: 'réponses',
  notification: 'notification',
  notifications: 'notifications',
  alert: 'alerte',
  alerts: 'alertes',
  reminder: 'rappel',
  reminders: 'rappels',
  announcement: 'annonce',
  announcements: 'annonces',
  news: 'actualités',
  update: 'mise à jour',
  updates: 'mises à jour',
  email: 'email',
  emails: 'emails',
  subject: 'sujet',
  body: 'corps',
  attachment: 'pièce jointe',
  attachments: 'pièces jointes',

  // User/Profile
  user: 'utilisateur',
  users: 'utilisateurs',
  profile: 'profil',
  profiles: 'profils',
  account: 'compte',
  accounts: 'comptes',
  name: 'nom',
  username: "nom d'utilisateur",
  nickname: 'surnom',
  'display name': "nom d'affichage",
  'first name': 'prénom',
  'last name': 'nom',
  'full name': 'nom complet',
  email: 'email',
  phone: 'téléphone',
  mobile: 'mobile',
  password: 'mot de passe',
  bio: 'biographie',
  about: 'à propos',
  description: 'description',
  age: 'âge',
  birthday: 'anniversaire',
  gender: 'sexe',
  male: 'homme',
  female: 'femme',
  avatar: 'avatar',
  photo: 'photo',
  picture: 'image',
  image: 'image',
  privacy: 'confidentialité',
  security: 'sécurité',
  settings: 'paramètres',
  preferences: 'préférences',
  language: 'langue',
  languages: 'langues',

  // General
  information: 'informations',
  info: 'info',
  details: 'détails',
  summary: 'résumé',
  overview: 'aperçu',
  description: 'description',
  title: 'titre',
  subtitle: 'sous-titre',
  label: 'libellé',
  name: 'nom',
  type: 'type',
  types: 'types',
  category: 'catégorie',
  categories: 'catégories',
  tag: 'étiquette',
  tags: 'étiquettes',
  note: 'note',
  notes: 'notes',
  comment: 'commentaire',
  comments: 'commentaires',
  feedback: 'commentaires',
  review: 'examen',
  reviews: 'examens',
  rating: 'évaluation',
  ratings: 'évaluations',
  statistics: 'statistiques',
  stats: 'stats',
  report: 'rapport',
  reports: 'rapports',
  history: 'historique',
  activity: 'activité',
  activities: 'activités',
  event: 'événement',
  events: 'événements',
  action: 'action',
  actions: 'actions',
  option: 'option',
  options: 'options',
  choice: 'choix',
  choices: 'choix',
  item: 'élément',
  items: 'éléments',
  list: 'liste',
  lists: 'listes',
  file: 'fichier',
  files: 'fichiers',
  document: 'document',
  documents: 'documents',
  link: 'lien',
  links: 'liens',
  url: 'URL',
  website: 'site web',
  page: 'page',
  pages: 'pages',
  section: 'section',
  sections: 'sections',
  version: 'version',
  build: 'build',
  error: 'erreur',
  errors: 'erreurs',
  warning: 'avertissement',
  warnings: 'avertissements',
  success: 'succès',
  failure: 'échec',
  result: 'résultat',
  results: 'résultats',
  total: 'total',
  count: 'compte',
  number: 'numéro',
  amount: 'montant',
  quantity: 'quantité',
  value: 'valeur',
  percent: 'pourcent',
  percentage: 'pourcentage',
  minimum: 'minimum',
  maximum: 'maximum',
  limit: 'limite',
  range: 'plage',
  from: 'de',
  to: 'à',
  between: 'entre',
  and: 'et',
  or: 'ou',
  not: 'pas',
  with: 'avec',
  without: 'sans',
  for: 'pour',
  by: 'par',
  in: 'dans',
  on: 'sur',
  at: 'à',
  of: 'de',
  the: 'le/la',
  a: 'un/une',
  an: 'un/une',
  this: 'ce/cette',
  that: 'ce/cette',
  these: 'ces',
  those: 'ces',
  is: 'est',
  are: 'sont',
  was: 'était',
  were: 'étaient',
  has: 'a',
  have: 'avoir',
  had: 'avait',
  will: 'va',
  would: 'voudrait',
  can: 'peut',
  could: 'pourrait',
  should: 'devrait',
  must: 'doit',
  may: 'peut',
  might: 'pourrait',

  // Specific phrases
  'coming soon': 'bientôt disponible',
  'under construction': 'en construction',
  'not available': 'non disponible',
  'not found': 'non trouvé',
  'no results': 'aucun résultat',
  'no data': 'aucune donnée',
  empty: 'vide',
  'please wait': 'veuillez patienter',
  loading: 'chargement',
  processing: 'traitement',
  sending: 'envoi',
  saving: 'enregistrement',
  deleting: 'suppression',
  updating: 'mise à jour',
  searching: 'recherche',
  connecting: 'connexion',
  uploading: 'téléversement',
  downloading: 'téléchargement',
  'good standing': 'en règle',
  'out of order': 'hors service',
  'under maintenance': 'en maintenance',
  'temporarily unavailable': 'temporairement indisponible',
  'access denied': 'accès refusé',
  'permission denied': 'permission refusée',
  unauthorized: 'non autorisé',
  forbidden: 'interdit',
  'invalid input': 'saisie invalide',
  'required field': 'champ obligatoire',
  'optional field': 'champ optionnel',
  'terms of service': "conditions d'utilisation",
  'privacy policy': 'politique de confidentialité',
  'cookie policy': 'politique des cookies',
  'all rights reserved': 'tous droits réservés',
};

// Smart translation function
function smartTranslate(text, enText) {
  if (!text || typeof text !== 'string') return text;
  if (!enText || typeof enText !== 'string') return text;

  // Already translated
  if (text !== enText) return text;

  // Try pattern-based translation
  const patternResult = translatePickleballText(enText);
  if (patternResult) {
    // Recursively translate the replaced parts
    return patternResult;
  }

  // Try exact dictionary match (case-insensitive)
  const lowerText = enText.toLowerCase().trim();
  if (dictionary[lowerText]) {
    // Preserve original capitalization pattern
    const translation = dictionary[lowerText];
    if (enText === enText.toUpperCase()) {
      return translation.toUpperCase();
    }
    if (enText[0] === enText[0].toUpperCase()) {
      return translation.charAt(0).toUpperCase() + translation.slice(1);
    }
    return translation;
  }

  // Try to break down compound phrases
  const words = enText.split(' ');
  if (words.length > 1) {
    const translated = words.map(word => {
      const lower = word.toLowerCase().replace(/[.,!?:;]$/, '');
      return dictionary[lower] || word;
    });

    // Only use if at least one word was translated
    const translatedCount = translated.filter(
      (w, i) => w.toLowerCase() !== words[i].toLowerCase().replace(/[.,!?:;]$/, '')
    ).length;

    if (translatedCount > 0) {
      return translated.join(' ');
    }
  }

  // Return original if no translation found
  return text;
}

function translateObject(obj, enObj, path = '') {
  const result = {};
  let translatedCount = 0;
  const translations = [];

  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    const enValue = enObj?.[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const translated = translateObject(value, enValue || {}, currentPath);
      result[key] = translated.obj;
      translatedCount += translated.count;
      translations.push(...translated.translations);
    } else if (typeof value === 'string' && typeof enValue === 'string') {
      const translated = smartTranslate(value, enValue);
      result[key] = translated;

      if (translated !== value) {
        translatedCount++;
        const entry = `✓ ${currentPath}: "${enValue}" → "${translated}"`;
        translations.push(entry);
        if (translatedCount <= 100) {
          // Only log first 100
          console.log(entry);
        }
      }
    } else {
      result[key] = value;
    }
  }

  return { obj: result, count: translatedCount, translations };
}

function countUntranslated(obj, enObj) {
  let count = 0;
  const untranslated = [];

  for (const key in obj) {
    const value = obj[key];
    const enValue = enObj?.[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const result = countUntranslated(value, enValue || {});
      count += result.count;
      untranslated.push(...result.untranslated);
    } else if (typeof value === 'string' && value === enValue) {
      count++;
      untranslated.push(value);
    }
  }

  return { count, untranslated };
}

console.log('🚀 Starting enhanced French translation with context-aware logic...\n');
console.log(`📖 Dictionary size: ${Object.keys(dictionary).length} entries\n`);

const result = translateObject(fr, en);
const translatedFr = result.obj;
const translatedCount = result.count;

// Write back to file
fs.writeFileSync(FR_PATH, JSON.stringify(translatedFr, null, 2), 'utf8');

console.log(`\n\n${'='.repeat(70)}`);
console.log(`✅ Translation complete!`);
console.log(`${'='.repeat(70)}`);
console.log(`📊 Total translations applied: ${translatedCount.toLocaleString()} keys`);
console.log(`💾 Updated: ${FR_PATH}`);
console.log(`${'='.repeat(70)}\n`);

// Count remaining
const remainingResult = countUntranslated(translatedFr, en);
const remaining = remainingResult.count;

console.log(`📋 Remaining untranslated: ${remaining.toLocaleString()} keys`);

if (remaining > 0) {
  console.log(`\n⚠️  Some keys still need manual translation or enhanced dictionary.`);

  // Sample of untranslated
  const sample = remainingResult.untranslated.slice(0, 20);
  console.log(`\n📝 Sample of remaining untranslated texts:`);
  sample.forEach((text, i) => {
    if (text.length < 100) {
      console.log(`   ${i + 1}. "${text}"`);
    }
  });

  if (remaining > 20) {
    console.log(`   ... and ${remaining - 20} more`);
  }
} else {
  console.log(`\n🎉 All keys have been translated!`);
}

console.log(`\n${'='.repeat(70)}\n`);
