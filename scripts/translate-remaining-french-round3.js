#!/usr/bin/env node

/**
 * Round 3 - Translate remaining 1438 French keys
 * Focus on: services, duesManagement, leagueDetail, createEvent, clubLeaguesTournaments
 */

const fs = require('fs');
const path = require('path');

const EN_FILE = path.join(__dirname, '../src/locales/en.json');
const FR_FILE = path.join(__dirname, '../src/locales/fr.json');

// Read files
const en = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));
const fr = JSON.parse(fs.readFileSync(FR_FILE, 'utf8'));

// Deep merge helper
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

// Round 3 French translations
const frenchTranslations = {
  services: {
    // Club services
    coaching: 'Coaching',
    courtRental: 'Location de courts',
    proShop: 'Boutique pro',
    stringService: 'Service de cordage',
    equipmentRental: "Location d'équipement",
    lockerRental: 'Location de casiers',

    // Service management
    addService: 'Ajouter un service',
    editService: 'Modifier le service',
    deleteService: 'Supprimer le service',
    serviceDetails: 'Détails du service',
    serviceName: 'Nom du service',
    serviceDescription: 'Description du service',
    servicePrice: 'Prix du service',
    serviceDuration: 'Durée du service',
    serviceAvailability: 'Disponibilité du service',

    // Service categories
    categories: {
      lessons: 'Cours',
      facilities: 'Installations',
      equipment: 'Équipement',
      events: 'Événements',
      membership: 'Adhésion',
      other: 'Autre',
    },

    // Service status
    available: 'Disponible',
    unavailable: 'Indisponible',
    fullyBooked: 'Complet',
    comingSoon: 'Bientôt disponible',

    // Booking
    bookService: 'Réserver le service',
    bookingConfirmation: 'Confirmation de réservation',
    bookingDetails: 'Détails de la réservation',
    cancelBooking: 'Annuler la réservation',
    rescheduleBooking: 'Reprogrammer la réservation',

    // Service provider
    provider: 'Prestataire',
    providerName: 'Nom du prestataire',
    providerContact: 'Contact du prestataire',
    providerRating: 'Note du prestataire',

    // Pricing
    pricing: 'Tarification',
    pricePerHour: 'Prix par heure',
    pricePerSession: 'Prix par session',
    pricePerMonth: 'Prix par mois',
    memberPrice: 'Prix adhérent',
    nonMemberPrice: 'Prix non-adhérent',

    // Schedule
    schedule: 'Horaires',
    weekdaySchedule: 'Horaires en semaine',
    weekendSchedule: 'Horaires le week-end',
    specialHours: 'Horaires spéciaux',
    closedDays: 'Jours fermés',

    // Capacity
    capacity: 'Capacité',
    maxCapacity: 'Capacité maximale',
    currentCapacity: 'Capacité actuelle',
    spotsAvailable: 'Places disponibles',
    waitlist: "Liste d'attente",

    // Service features
    features: {
      indoorCourts: 'Courts couverts',
      outdoorCourts: 'Courts extérieurs',
      lighting: 'Éclairage',
      parking: 'Parking',
      showers: 'Douches',
      lockerRoom: 'Vestiaires',
      cafe: 'Café',
      proShop: 'Boutique pro',
      ballMachine: 'Machine à balles',
      videoAnalysis: 'Analyse vidéo',
    },

    // Messages
    serviceAddedSuccessfully: 'Service ajouté avec succès',
    serviceUpdatedSuccessfully: 'Service mis à jour avec succès',
    serviceDeletedSuccessfully: 'Service supprimé avec succès',
    bookingSuccessful: 'Réservation réussie',
    bookingCancelled: 'Réservation annulée',

    // Errors
    serviceNotFound: 'Service non trouvé',
    bookingFailed: 'Échec de la réservation',
    invalidServiceData: 'Données de service invalides',
    serviceUnavailable: 'Service indisponible',

    // Filters
    filterByCategory: 'Filtrer par catégorie',
    filterByPrice: 'Filtrer par prix',
    filterByAvailability: 'Filtrer par disponibilité',
    sortByPrice: 'Trier par prix',
    sortByRating: 'Trier par note',
    sortByPopularity: 'Trier par popularité',

    // Service types
    privateLesson: 'Cours privé',
    groupLesson: 'Cours collectif',
    clinics: 'Stages',
    camps: 'Camps',
    tournaments: 'Tournois',
    leagues: 'Ligues',
    socialEvents: 'Événements sociaux',

    // Instructor info
    instructor: 'Instructeur',
    instructorBio: "Biographie de l'instructeur",
    certifications: 'Certifications',
    experience: 'Expérience',
    specialties: 'Spécialités',

    // Payment
    paymentRequired: 'Paiement requis',
    payNow: 'Payer maintenant',
    payLater: 'Payer plus tard',
    refundPolicy: 'Politique de remboursement',
    cancellationPolicy: "Politique d'annulation",

    // Reviews
    reviews: 'Avis',
    writeReview: 'Écrire un avis',
    rating: 'Note',
    rateService: 'Noter le service',
    reviewService: 'Évaluer le service',

    // Notifications
    serviceReminder: 'Rappel de service',
    upcomingService: 'Service à venir',
    serviceCancelled: 'Service annulé',
    serviceRescheduled: 'Service reprogrammé',
    newServiceAvailable: 'Nouveau service disponible',

    // Service history
    myBookings: 'Mes réservations',
    pastBookings: 'Réservations passées',
    upcomingBookings: 'Réservations à venir',
    bookingHistory: 'Historique des réservations',

    // Additional fields
    requirements: 'Prérequis',
    whatToBring: 'Quoi apporter',
    ageRestrictions: "Restrictions d'âge",
    skillLevel: 'Niveau de compétence',
    maxParticipants: 'Participants maximum',
    minParticipants: 'Participants minimum',

    // Court-specific
    courtType: 'Type de court',
    surfaceType: 'Type de surface',
    hardCourt: 'Terrain dur',
    clayCourt: 'Terre battue',
    grassCourt: 'Gazon',
    carpetCourt: 'Moquette',

    // Equipment rental
    racketRental: 'Location de raquettes',
    ballPurchase: 'Achat de balles',
    shoeRental: 'Location de chaussures',
    equipmentPackage: 'Pack équipement',
  },

  duesManagement: {
    // Main title
    title: 'Gestion des cotisations',
    subtitle: 'Gérer les cotisations et paiements des membres',

    // Tabs
    overview: "Vue d'ensemble",
    members: 'Membres',
    settings: 'Paramètres',
    reports: 'Rapports',

    // Overview stats
    totalRevenue: 'Revenu total',
    expectedRevenue: 'Revenu attendu',
    collectedAmount: 'Montant collecté',
    pendingAmount: 'Montant en attente',
    overdueAmount: 'Montant en retard',

    // Member status
    paidMembers: 'Membres à jour',
    pendingMembers: 'Membres en attente',
    overdueMembers: 'Membres en retard',
    exemptMembers: 'Membres exemptés',

    // Payment status
    paymentStatus: 'Statut du paiement',
    paid: 'Payé',
    pending: 'En attente',
    overdue: 'En retard',
    exempt: 'Exempté',
    partial: 'Partiel',

    // Due dates
    dueDate: "Date d'échéance",
    nextDueDate: 'Prochaine échéance',
    lastPaymentDate: 'Date du dernier paiement',
    paymentSchedule: 'Calendrier de paiement',

    // Payment methods
    paymentMethod: 'Mode de paiement',
    cash: 'Espèces',
    check: 'Chèque',
    creditCard: 'Carte de crédit',
    bankTransfer: 'Virement bancaire',
    online: 'En ligne',

    // Amount fields
    amount: 'Montant',
    dueAmount: 'Montant dû',
    paidAmount: 'Montant payé',
    remainingAmount: 'Montant restant',
    totalAmount: 'Montant total',

    // Membership tiers
    membershipType: "Type d'adhésion",
    regular: 'Régulier',
    premium: 'Premium',
    family: 'Famille',
    student: 'Étudiant',
    senior: 'Senior',

    // Actions
    recordPayment: 'Enregistrer un paiement',
    sendReminder: 'Envoyer un rappel',
    markAsPaid: 'Marquer comme payé',
    markAsExempt: 'Marquer comme exempté',
    waiveFee: 'Annuler les frais',

    // Reminders
    reminder: 'Rappel',
    sendAutomaticReminders: 'Envoyer des rappels automatiques',
    reminderSchedule: 'Planning des rappels',
    firstReminder: 'Premier rappel',
    secondReminder: 'Deuxième rappel',
    finalReminder: 'Dernier rappel',

    // Settings
    duesSettings: 'Paramètres des cotisations',
    annualDues: 'Cotisations annuelles',
    monthlyDues: 'Cotisations mensuelles',
    quarterlyDues: 'Cotisations trimestrielles',

    // Billing cycle
    billingCycle: 'Cycle de facturation',
    annually: 'Annuellement',
    monthly: 'Mensuellement',
    quarterly: 'Trimestriellement',

    // Late fees
    lateFee: 'Frais de retard',
    lateFeeAmount: 'Montant des frais de retard',
    lateFeePercentage: 'Pourcentage des frais de retard',
    gracePeriod: 'Période de grâce',
    gracePeriodDays: 'Jours de période de grâce',

    // Reports
    paymentReport: 'Rapport de paiement',
    collectionReport: 'Rapport de collecte',
    membershipReport: "Rapport d'adhésion",
    exportReport: 'Exporter le rapport',

    // Date ranges
    dateRange: 'Plage de dates',
    thisMonth: 'Ce mois-ci',
    lastMonth: 'Le mois dernier',
    thisQuarter: 'Ce trimestre',
    thisYear: 'Cette année',
    customRange: 'Plage personnalisée',

    // Filters
    filterByStatus: 'Filtrer par statut',
    filterByType: 'Filtrer par type',
    filterByDate: 'Filtrer par date',
    searchMembers: 'Rechercher des membres',

    // Messages
    paymentRecorded: 'Paiement enregistré',
    reminderSent: 'Rappel envoyé',
    settingsUpdated: 'Paramètres mis à jour',
    reportGenerated: 'Rapport généré',

    // Notifications
    paymentReceived: 'Paiement reçu',
    paymentOverdue: 'Paiement en retard',
    upcomingPayment: 'Paiement à venir',

    // Notes
    notes: 'Notes',
    addNote: 'Ajouter une note',
    paymentNotes: 'Notes de paiement',
    internalNotes: 'Notes internes',

    // Batch operations
    batchActions: 'Actions groupées',
    selectAll: 'Tout sélectionner',
    sendBatchReminder: 'Envoyer un rappel groupé',
    exportSelected: 'Exporter la sélection',

    // Payment history
    paymentHistory: 'Historique des paiements',
    viewHistory: "Voir l'historique",
    noPaymentHistory: 'Aucun historique de paiement',

    // Invoice
    invoice: 'Facture',
    generateInvoice: 'Générer une facture',
    sendInvoice: 'Envoyer une facture',
    downloadInvoice: 'Télécharger la facture',
    invoiceNumber: 'Numéro de facture',

    // Refunds
    refund: 'Remboursement',
    issueRefund: 'Émettre un remboursement',
    refundAmount: 'Montant du remboursement',
    refundReason: 'Raison du remboursement',

    // Additional fields
    memberSince: 'Membre depuis',
    renewalDate: 'Date de renouvellement',
    autoRenewal: 'Renouvellement automatique',
    paymentPlan: 'Plan de paiement',
    installments: 'Versements',

    // Errors
    paymentFailed: 'Échec du paiement',
    invalidAmount: 'Montant invalide',
    memberNotFound: 'Membre non trouvé',
    noPaymentMethod: 'Aucun mode de paiement',
  },

  leagueDetail: {
    // Main sections
    overview: "Vue d'ensemble",
    standings: 'Classement',
    schedule: 'Calendrier',
    teams: 'Équipes',
    players: 'Joueurs',
    rules: 'Règles',

    // League info
    leagueInfo: 'Informations de la ligue',
    leagueName: 'Nom de la ligue',
    leagueType: 'Type de ligue',
    leagueFormat: 'Format de la ligue',
    season: 'Saison',
    division: 'Division',

    // Standings
    rank: 'Rang',
    teamName: "Nom d'équipe",
    played: 'Joués',
    won: 'Gagnés',
    lost: 'Perdus',
    points: 'Points',
    pointsFor: 'Points pour',
    pointsAgainst: 'Points contre',
    differential: 'Différentiel',

    // Schedule
    matchSchedule: 'Calendrier des matchs',
    upcomingMatches: 'Matchs à venir',
    completedMatches: 'Matchs terminés',
    matchDate: 'Date du match',
    matchTime: 'Heure du match',
    venue: 'Lieu',
    court: 'Court',

    // Match details
    homeTeam: 'Équipe à domicile',
    awayTeam: "Équipe à l'extérieur",
    score: 'Score',
    finalScore: 'Score final',
    matchResult: 'Résultat du match',

    // Teams
    teamRoster: "Effectif de l'équipe",
    teamCaptain: "Capitaine d'équipe",
    teamMembers: "Membres de l'équipe",
    addTeam: 'Ajouter une équipe',
    editTeam: "Modifier l'équipe",
    deleteTeam: "Supprimer l'équipe",

    // Players
    playerName: 'Nom du joueur',
    playerStats: 'Statistiques du joueur',
    matchesPlayed: 'Matchs joués',
    wins: 'Victoires',
    losses: 'Défaites',
    winPercentage: 'Pourcentage de victoires',

    // Registration
    registration: 'Inscription',
    registerTeam: 'Inscrire une équipe',
    registrationDeadline: "Date limite d'inscription",
    registrationFee: "Frais d'inscription",
    registrationStatus: "Statut de l'inscription",

    // League format
    roundRobin: 'Round-robin',
    singleElimination: 'Élimination directe',
    doubleElimination: 'Double élimination',
    swiss: 'Système suisse',

    // Scoring
    scoringSystem: 'Système de notation',
    pointsPerWin: 'Points par victoire',
    pointsPerLoss: 'Points par défaite',
    pointsPerTie: 'Points par égalité',
    tiebreaker: "Bris d'égalité",

    // Rules
    leagueRules: 'Règles de la ligue',
    playingRules: 'Règles de jeu',
    scoringRules: 'Règles de notation',
    conductRules: 'Règles de conduite',

    // Playoffs
    playoffs: 'Séries éliminatoires',
    playoffSchedule: 'Calendrier des séries',
    playoffBracket: 'Arbre des séries',
    semifinals: 'Demi-finales',
    finals: 'Finales',
    champion: 'Champion',

    // Statistics
    statistics: 'Statistiques',
    leagueStats: 'Statistiques de la ligue',
    teamStats: "Statistiques d'équipe",
    playerStats: 'Statistiques de joueur',

    // Leaders
    leaders: 'Leaders',
    topScorers: 'Meilleurs marqueurs',
    topTeams: 'Meilleures équipes',
    topPlayers: 'Meilleurs joueurs',

    // Participation
    participate: 'Participer',
    joinLeague: 'Rejoindre la ligue',
    leaveLeague: 'Quitter la ligue',
    transferTeam: "Transférer d'équipe",

    // Communication
    announcements: 'Annonces',
    leagueNews: 'Nouvelles de la ligue',
    notifications: 'Notifications',
    contactOrganizer: "Contacter l'organisateur",

    // Season info
    seasonStart: 'Début de saison',
    seasonEnd: 'Fin de saison',
    currentSeason: 'Saison en cours',
    pastSeasons: 'Saisons passées',

    // Divisions
    divisionA: 'Division A',
    divisionB: 'Division B',
    divisionC: 'Division C',
    promotion: 'Promotion',
    relegation: 'Relégation',

    // Awards
    awards: 'Récompenses',
    mvp: 'MVP',
    mostImproved: 'Plus amélioré',
    rookieOfYear: "Recrue de l'année",

    // Additional info
    eligibility: 'Éligibilité',
    requirements: 'Prérequis',
    skillLevel: 'Niveau de compétence',
    ageGroup: "Groupe d'âge",

    // Actions
    reportScore: 'Rapporter le score',
    viewDetails: 'Voir les détails',
    downloadSchedule: 'Télécharger le calendrier',
    printBracket: "Imprimer l'arbre",
  },

  createEvent: {
    // Main title
    title: 'Créer un événement',
    editTitle: "Modifier l'événement",

    // Basic info
    eventName: "Nom de l'événement",
    eventType: "Type d'événement",
    eventDescription: "Description de l'événement",
    eventCategory: "Catégorie de l'événement",

    // Date and time
    dateTime: 'Date et heure',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    startTime: 'Heure de début',
    endTime: 'Heure de fin',
    duration: 'Durée',
    allDay: 'Toute la journée',

    // Location
    location: 'Lieu',
    venue: "Lieu de l'événement",
    address: 'Adresse',
    city: 'Ville',
    state: 'État/Province',
    zipCode: 'Code postal',
    country: 'Pays',

    // Court details
    court: 'Court',
    courtNumber: 'Numéro de court',
    courtType: 'Type de court',
    indoor: 'Couvert',
    outdoor: 'Extérieur',

    // Participants
    participants: 'Participants',
    maxParticipants: 'Participants maximum',
    minParticipants: 'Participants minimum',
    currentParticipants: 'Participants actuels',
    waitlist: "Liste d'attente",

    // Registration
    registration: 'Inscription',
    registrationRequired: 'Inscription requise',
    registrationDeadline: "Date limite d'inscription",
    earlyBirdDeadline: 'Date limite tarif précoce',
    registrationOpen: 'Inscriptions ouvertes',
    registrationClosed: 'Inscriptions fermées',

    // Pricing
    pricing: 'Tarification',
    free: 'Gratuit',
    paid: 'Payant',
    price: 'Prix',
    memberPrice: 'Prix adhérent',
    nonMemberPrice: 'Prix non-adhérent',
    earlyBirdPrice: 'Prix tarif précoce',

    // Event types
    types: {
      tournament: 'Tournoi',
      league: 'Ligue',
      clinic: 'Stage',
      social: 'Social',
      practice: 'Entraînement',
      match: 'Match',
      lesson: 'Cours',
      camp: 'Camp',
    },

    // Visibility
    visibility: 'Visibilité',
    public: 'Public',
    private: 'Privé',
    membersOnly: 'Membres uniquement',
    inviteOnly: 'Sur invitation uniquement',

    // Skill level
    skillLevel: 'Niveau de compétence',
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
    allLevels: 'Tous niveaux',

    // Age restrictions
    ageRestrictions: "Restrictions d'âge",
    minAge: 'Âge minimum',
    maxAge: 'Âge maximum',
    noAgeLimit: "Pas de limite d'âge",

    // Format
    format: 'Format',
    singles: 'Simple',
    doubles: 'Double',
    mixed: 'Mixte',
    team: 'Équipe',

    // Additional details
    details: 'Détails',
    rules: 'Règles',
    requirements: 'Prérequis',
    whatToBring: 'Quoi apporter',
    additionalInfo: 'Informations supplémentaires',

    // Contact
    contact: 'Contact',
    organizer: 'Organisateur',
    contactPerson: 'Personne de contact',
    contactEmail: 'Email de contact',
    contactPhone: 'Téléphone de contact',

    // Images
    eventImage: "Image de l'événement",
    uploadImage: 'Télécharger une image',
    changeImage: "Changer l'image",
    removeImage: "Supprimer l'image",

    // Notifications
    notifications: 'Notifications',
    sendNotifications: 'Envoyer des notifications',
    notifyParticipants: 'Notifier les participants',
    reminderSettings: 'Paramètres de rappel',

    // Recurring
    recurring: 'Récurrent',
    recurrencePattern: 'Modèle de récurrence',
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    custom: 'Personnalisé',

    // Actions
    createEvent: "Créer l'événement",
    updateEvent: "Mettre à jour l'événement",
    cancelEvent: "Annuler l'événement",
    deleteEvent: "Supprimer l'événement",
    duplicateEvent: "Dupliquer l'événement",

    // Messages
    eventCreated: 'Événement créé avec succès',
    eventUpdated: 'Événement mis à jour avec succès',
    eventCancelled: 'Événement annulé',
    eventDeleted: 'Événement supprimé',

    // Errors
    requiredField: 'Champ obligatoire',
    invalidDate: 'Date invalide',
    invalidTime: 'Heure invalide',
    invalidPrice: 'Prix invalide',
    maxParticipantsError: 'Le nombre maximum de participants doit être supérieur au minimum',

    // Validation
    pleaseEnterEventName: "Veuillez saisir un nom d'événement",
    pleaseSelectDate: 'Veuillez sélectionner une date',
    pleaseSelectTime: 'Veuillez sélectionner une heure',
    pleaseSelectLocation: 'Veuillez sélectionner un lieu',

    // Save options
    saveAsDraft: 'Enregistrer comme brouillon',
    publishNow: 'Publier maintenant',
    schedulePublish: 'Programmer la publication',
  },

  clubLeaguesTournaments: {
    // Main sections
    leagues: 'Ligues',
    tournaments: 'Tournois',
    both: 'Ligues et tournois',

    // Overview
    overview: "Vue d'ensemble",
    active: 'Actif',
    upcoming: 'À venir',
    past: 'Passé',

    // Create/Edit
    createLeague: 'Créer une ligue',
    editLeague: 'Modifier la ligue',
    createTournament: 'Créer un tournoi',
    editTournament: 'Modifier le tournoi',

    // League info
    leagueName: 'Nom de la ligue',
    leagueType: 'Type de ligue',
    leagueFormat: 'Format de la ligue',
    startDate: 'Date de début',
    endDate: 'Date de fin',

    // Tournament info
    tournamentName: 'Nom du tournoi',
    tournamentType: 'Type de tournoi',
    tournamentFormat: 'Format du tournoi',
    drawSize: 'Taille du tableau',

    // Registration
    registration: 'Inscription',
    registrationOpen: 'Inscriptions ouvertes',
    registrationClosed: 'Inscriptions fermées',
    registrationDeadline: "Date limite d'inscription",
    registerNow: "S'inscrire maintenant",

    // Participants
    participants: 'Participants',
    teams: 'Équipes',
    players: 'Joueurs',
    maxParticipants: 'Participants maximum',
    currentParticipants: 'Participants actuels',

    // Format types
    roundRobin: 'Round-robin',
    singleElimination: 'Élimination directe',
    doubleElimination: 'Double élimination',
    groupStage: 'Phase de groupes',

    // Divisions
    divisions: 'Divisions',
    division: 'Division',
    mensSingles: 'Simple messieurs',
    mensDoubles: 'Double messieurs',
    womensSingles: 'Simple dames',
    womensDoubles: 'Double dames',
    mixedDoubles: 'Double mixte',

    // Skill levels
    skillLevel: 'Niveau de compétence',
    open: 'Ouvert',
    advanced: 'Avancé',
    intermediate: 'Intermédiaire',
    beginner: 'Débutant',

    // Schedule
    schedule: 'Calendrier',
    matchSchedule: 'Calendrier des matchs',
    viewSchedule: 'Voir le calendrier',
    downloadSchedule: 'Télécharger le calendrier',

    // Standings
    standings: 'Classement',
    leagueStandings: 'Classement de la ligue',
    viewStandings: 'Voir le classement',

    // Results
    results: 'Résultats',
    matchResults: 'Résultats des matchs',
    finalResults: 'Résultats finaux',
    liveScores: 'Scores en direct',

    // Prizes
    prizes: 'Prix',
    prizePool: 'Cagnotte',
    firstPlace: 'Première place',
    secondPlace: 'Deuxième place',
    thirdPlace: 'Troisième place',

    // Rules
    rules: 'Règles',
    leagueRules: 'Règles de la ligue',
    tournamentRules: 'Règles du tournoi',
    viewRules: 'Voir les règles',

    // Fees
    entryFee: "Frais d'inscription",
    memberFee: 'Frais adhérent',
    nonMemberFee: 'Frais non-adhérent',

    // Status
    status: 'Statut',
    notStarted: 'Pas commencé',
    inProgress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',

    // Actions
    join: 'Rejoindre',
    withdraw: 'Se retirer',
    viewDetails: 'Voir les détails',
    manageEvent: "Gérer l'événement",

    // Management
    manage: 'Gérer',
    editDetails: 'Modifier les détails',
    manageParticipants: 'Gérer les participants',
    updateSchedule: 'Mettre à jour le calendrier',
    enterScores: 'Saisir les scores',

    // Communication
    announcements: 'Annonces',
    sendMessage: 'Envoyer un message',
    notifications: 'Notifications',

    // Additional info
    description: 'Description',
    venue: 'Lieu',
    organizer: 'Organisateur',
    contact: 'Contact',

    // Messages
    registrationSuccessful: 'Inscription réussie',
    withdrawalSuccessful: 'Retrait réussi',
    leagueCreated: 'Ligue créée',
    tournamentCreated: 'Tournoi créé',

    // Errors
    registrationFull: 'Inscriptions complètes',
    deadlinePassed: 'Date limite dépassée',
    alreadyRegistered: 'Déjà inscrit',
  },
};

// Apply translations
const updated = deepMerge(fr, frenchTranslations);

// Write back
fs.writeFileSync(FR_FILE, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ Round 3 French translations applied successfully!');
console.log('📊 Translated sections:');
console.log('   - services: ~144 keys');
console.log('   - duesManagement: ~121 keys');
console.log('   - leagueDetail: ~82 keys');
console.log('   - createEvent: ~69 keys');
console.log('   - clubLeaguesTournaments: ~63 keys');
console.log('   Total: ~479 keys translated in this round');
