#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const frPath = path.join(__dirname, '../src/locales/fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Comprehensive French translations for Round 2
const frTranslations = {
  services: {
    // Match Services
    matchId: 'ID du match',
    matchData: 'Données du match',
    matchType: 'Type de match',
    matchStatus: 'Statut du match',
    matchResult: 'Résultat du match',
    matchDate: 'Date du match',
    matchTime: 'Heure du match',
    matchLocation: 'Lieu du match',
    matchDuration: 'Durée du match',
    matchScore: 'Score du match',
    matchNotes: 'Notes du match',
    createMatch: 'Créer un match',
    updateMatch: 'Mettre à jour le match',
    deleteMatch: 'Supprimer le match',
    cancelMatch: 'Annuler le match',
    confirmMatch: 'Confirmer le match',
    rescheduleMatch: 'Reprogrammer le match',

    // User Services
    userId: 'ID utilisateur',
    userData: 'Données utilisateur',
    userProfile: 'Profil utilisateur',
    userSettings: 'Paramètres utilisateur',
    userPreferences: 'Préférences utilisateur',
    userStats: 'Statistiques utilisateur',
    userRating: 'Classement utilisateur',
    userLevel: 'Niveau utilisateur',
    updateProfile: 'Mettre à jour le profil',
    updateSettings: 'Mettre à jour les paramètres',

    // Club Services
    clubId: 'ID du club',
    clubData: 'Données du club',
    clubName: 'Nom du club',
    clubDescription: 'Description du club',
    clubMembers: 'Membres du club',
    clubEvents: 'Événements du club',
    clubStats: 'Statistiques du club',
    joinClub: 'Rejoindre le club',
    leaveClub: 'Quitter le club',
    manageClub: 'Gérer le club',

    // Notification Services
    notificationId: 'ID de notification',
    notificationData: 'Données de notification',
    notificationType: 'Type de notification',
    notificationTitle: 'Titre de la notification',
    notificationBody: 'Corps de la notification',
    notificationTime: 'Heure de la notification',
    sendNotification: 'Envoyer une notification',
    markAsRead: 'Marquer comme lu',
    markAllAsRead: 'Tout marquer comme lu',
    clearNotifications: 'Effacer les notifications',

    // Payment Services
    paymentId: 'ID de paiement',
    paymentData: 'Données de paiement',
    paymentMethod: 'Méthode de paiement',
    paymentAmount: 'Montant du paiement',
    paymentStatus: 'Statut du paiement',
    paymentHistory: 'Historique des paiements',
    processPayment: 'Traiter le paiement',
    refundPayment: 'Rembourser le paiement',

    // Analytics Services
    analyticsData: 'Données analytiques',
    trackEvent: "Suivre l'événement",
    logError: "Enregistrer l'erreur",
    reportIssue: 'Signaler un problème',

    // Storage Services
    uploadFile: 'Télécharger le fichier',
    downloadFile: 'Télécharger le fichier',
    deleteFile: 'Supprimer le fichier',

    // Cache Services
    cacheData: 'Données en cache',
    clearCache: 'Vider le cache',
    refreshCache: 'Actualiser le cache',

    // Validation
    validationError: 'Erreur de validation',
    requiredField: 'Champ obligatoire',
    invalidFormat: 'Format invalide',
    invalidEmail: 'Email invalide',
    invalidPhone: 'Téléphone invalide',
    invalidDate: 'Date invalide',

    // API
    apiError: 'Erreur API',
    networkError: 'Erreur réseau',
    serverError: 'Erreur serveur',
    timeout: "Délai d'attente dépassé",
    unauthorized: 'Non autorisé',
    forbidden: 'Interdit',
    notFound: 'Non trouvé',

    // Success Messages
    saveSuccess: 'Enregistré avec succès',
    updateSuccess: 'Mis à jour avec succès',
    deleteSuccess: 'Supprimé avec succès',
    createSuccess: 'Créé avec succès',
    uploadSuccess: 'Téléchargé avec succès',

    // Loading States
    loading: 'Chargement...',
    saving: 'Enregistrement...',
    updating: 'Mise à jour...',
    deleting: 'Suppression...',
    processing: 'Traitement...',
    uploading: 'Téléchargement...',
    downloading: 'Téléchargement...',

    // Firebase specific
    firestoreError: 'Erreur Firestore',
    authError: "Erreur d'authentification",
    storageError: 'Erreur de stockage',
    functionsError: 'Erreur de fonctions',

    // Sync
    syncInProgress: 'Synchronisation en cours',
    syncComplete: 'Synchronisation terminée',
    syncFailed: 'Échec de la synchronisation',
    lastSync: 'Dernière synchronisation',

    // Permissions
    permissionDenied: 'Permission refusée',
    permissionRequired: 'Permission requise',
    grantPermission: 'Accorder la permission',

    // Connection
    connectionLost: 'Connexion perdue',
    connectionRestored: 'Connexion rétablie',
    offline: 'Hors ligne',
    online: 'En ligne',

    // Retry
    retry: 'Réessayer',
    retrying: 'Nouvelle tentative...',
    maxRetriesReached: 'Nombre maximum de tentatives atteint',

    // Queue
    queuedForSync: "En file d'attente pour synchronisation",
    syncQueue: 'File de synchronisation',
    clearQueue: 'Vider la file',

    // Export/Import
    exportData: 'Exporter les données',
    importData: 'Importer les données',
    exportSuccess: 'Exportation réussie',
    importSuccess: 'Importation réussie',

    // Backup
    backupData: 'Sauvegarder les données',
    restoreData: 'Restaurer les données',
    backupSuccess: 'Sauvegarde réussie',
    restoreSuccess: 'Restauration réussie',
  },

  duesManagement: {
    // Headers
    title: 'Gestion des cotisations',
    subtitle: 'Gérez les cotisations des membres du club',

    // Tabs
    overview: 'Aperçu',
    members: 'Membres',
    payments: 'Paiements',
    settings: 'Paramètres',
    reports: 'Rapports',

    // Overview
    totalMembers: 'Total des membres',
    activeMembers: 'Membres actifs',
    paidMembers: 'Membres payés',
    unpaidMembers: 'Membres impayés',
    overdueMembers: 'Membres en retard',
    totalRevenue: 'Revenu total',
    expectedRevenue: 'Revenu prévu',
    collectionRate: 'Taux de collecte',

    // Member Status
    status: 'Statut',
    paid: 'Payé',
    unpaid: 'Impayé',
    overdue: 'En retard',
    partial: 'Partiel',
    exempt: 'Exempté',
    pending: 'En attente',

    // Payment Info
    dueAmount: 'Montant dû',
    paidAmount: 'Montant payé',
    remainingAmount: 'Montant restant',
    paymentDate: 'Date de paiement',
    dueDate: "Date d'échéance",
    lastPayment: 'Dernier paiement',
    nextDueDate: 'Prochaine échéance',

    // Actions
    recordPayment: 'Enregistrer le paiement',
    sendReminder: 'Envoyer un rappel',
    waiveFee: 'Dispenser de frais',
    adjustDues: 'Ajuster les cotisations',
    viewHistory: "Voir l'historique",
    exportList: 'Exporter la liste',

    // Payment Form
    memberName: 'Nom du membre',
    amount: 'Montant',
    paymentMethod: 'Méthode de paiement',
    cash: 'Espèces',
    card: 'Carte',
    transfer: 'Virement',
    check: 'Chèque',
    other: 'Autre',
    receiptNumber: 'Numéro de reçu',
    notes: 'Notes',

    // Dues Settings
    duesSettings: 'Paramètres des cotisations',
    monthlyDues: 'Cotisation mensuelle',
    annualDues: 'Cotisation annuelle',
    joiningFee: "Frais d'adhésion",
    lateFee: 'Frais de retard',
    gracePeriod: 'Période de grâce',
    autoReminders: 'Rappels automatiques',
    reminderFrequency: 'Fréquence des rappels',

    // Reminders
    reminderSent: 'Rappel envoyé',
    sendReminderTo: 'Envoyer un rappel à',
    reminderTemplate: 'Modèle de rappel',
    reminderSubject: 'Sujet du rappel',
    reminderMessage: 'Message du rappel',

    // Reports
    monthlyReport: 'Rapport mensuel',
    yearlyReport: 'Rapport annuel',
    paymentReport: 'Rapport des paiements',
    outstandingReport: 'Rapport des impayés',
    downloadReport: 'Télécharger le rapport',
    generateReport: 'Générer le rapport',

    // Filters
    filterByStatus: 'Filtrer par statut',
    filterByDate: 'Filtrer par date',
    filterByAmount: 'Filtrer par montant',
    showAll: 'Tout afficher',
    showPaid: 'Afficher payés',
    showUnpaid: 'Afficher impayés',
    showOverdue: 'Afficher en retard',

    // Search
    searchMembers: 'Rechercher des membres',
    searchByName: 'Rechercher par nom',
    searchById: 'Rechercher par ID',

    // Bulk Actions
    bulkActions: 'Actions groupées',
    selectAll: 'Tout sélectionner',
    deselectAll: 'Tout désélectionner',
    sendBulkReminders: 'Envoyer des rappels groupés',
    exportSelected: 'Exporter la sélection',

    // Messages
    paymentRecorded: 'Paiement enregistré avec succès',
    reminderSentSuccess: 'Rappel envoyé avec succès',
    settingsUpdated: 'Paramètres mis à jour avec succès',
    feeWaived: 'Frais dispensés avec succès',
    duesAdjusted: 'Cotisations ajustées avec succès',

    // Errors
    errorRecordingPayment: "Erreur lors de l'enregistrement du paiement",
    errorSendingReminder: "Erreur lors de l'envoi du rappel",
    errorUpdatingSettings: 'Erreur lors de la mise à jour des paramètres',
    invalidAmount: 'Montant invalide',
    memberNotFound: 'Membre non trouvé',

    // Confirmation
    confirmRecordPayment: "Confirmer l'enregistrement du paiement?",
    confirmWaiveFee: 'Confirmer la dispense de frais?',
    confirmSendReminder: "Confirmer l'envoi du rappel?",

    // Stats
    collectionStats: 'Statistiques de collecte',
    paymentTrends: 'Tendances de paiement',
    membershipGrowth: "Croissance de l'adhésion",
    revenueProjection: 'Projection des revenus',
  },

  leagueDetail: {
    // Headers
    leagueInfo: 'Informations sur la ligue',
    leagueDetails: 'Détails de la ligue',
    leagueName: 'Nom de la ligue',
    leagueDescription: 'Description de la ligue',

    // Tabs
    standings: 'Classement',
    schedule: 'Calendrier',
    participants: 'Participants',
    rules: 'Règles',
    results: 'Résultats',

    // Standings
    rank: 'Rang',
    player: 'Joueur',
    wins: 'Victoires',
    losses: 'Défaites',
    winRate: 'Taux de victoire',
    points: 'Points',
    matchesPlayed: 'Matchs joués',

    // Schedule
    upcomingMatches: 'Matchs à venir',
    pastMatches: 'Matchs passés',
    noMatchesScheduled: 'Aucun match programmé',
    scheduleMatch: 'Programmer un match',
    round: 'Tour',
    week: 'Semaine',

    // Match Details
    versus: 'contre',
    time: 'Heure',
    location: 'Lieu',
    court: 'Court',
    referee: 'Arbitre',

    // Participants
    totalParticipants: 'Total des participants',
    activeParticipants: 'Participants actifs',
    registrationOpen: 'Inscription ouverte',
    registrationClosed: 'Inscription fermée',
    waitlist: "Liste d'attente",

    // Registration
    register: "S'inscrire",
    unregister: 'Se désinscrire',
    registrationDeadline: "Date limite d'inscription",
    registrationFee: "Frais d'inscription",
    spotsAvailable: 'Places disponibles',
    spotsRemaining: 'Places restantes',

    // Rules
    leagueRules: 'Règles de la ligue',
    scoringSystem: 'Système de score',
    matchFormat: 'Format de match',
    tiebreakRules: 'Règles de jeu décisif',
    playoffFormat: 'Format des éliminatoires',

    // Results
    latestResults: 'Derniers résultats',
    submitResult: 'Soumettre le résultat',
    confirmResult: 'Confirmer le résultat',
    disputeResult: 'Contester le résultat',

    // Season
    currentSeason: 'Saison en cours',
    previousSeasons: 'Saisons précédentes',
    seasonStart: 'Début de saison',
    seasonEnd: 'Fin de saison',

    // Format
    singleElimination: 'Élimination simple',
    doubleElimination: 'Élimination double',
    roundRobin: 'Round-robin',
    swiss: 'Système suisse',

    // Actions
    joinLeague: 'Rejoindre la ligue',
    leaveLeague: 'Quitter la ligue',
    invitePlayers: 'Inviter des joueurs',
    viewStats: 'Voir les statistiques',
    downloadSchedule: 'Télécharger le calendrier',

    // Status
    active: 'Active',
    inactive: 'Inactive',
    upcoming: 'À venir',
    completed: 'Terminée',
    cancelled: 'Annulée',

    // Messages
    registrationSuccess: 'Inscription réussie',
    unregistrationSuccess: 'Désinscription réussie',
    resultSubmitted: 'Résultat soumis',
    leagueFull: 'Ligue complète',
    registrationRequired: 'Inscription requise',

    // Errors
    errorLoadingLeague: 'Erreur lors du chargement de la ligue',
    errorRegistering: "Erreur lors de l'inscription",
    errorSubmittingResult: 'Erreur lors de la soumission du résultat',
  },

  createEvent: {
    // Headers
    title: 'Créer un événement',
    editEvent: "Modifier l'événement",
    eventDetails: "Détails de l'événement",

    // Basic Info
    eventName: "Nom de l'événement",
    eventType: "Type d'événement",
    eventDescription: "Description de l'événement",

    // Event Types
    tournament: 'Tournoi',
    league: 'Ligue',
    training: 'Entraînement',
    social: 'Social',
    clinic: 'Clinic',
    workshop: 'Atelier',

    // Date & Time
    startDate: 'Date de début',
    endDate: 'Date de fin',
    startTime: 'Heure de début',
    endTime: 'Heure de fin',
    duration: 'Durée',
    recurring: 'Récurrent',

    // Location
    venue: 'Lieu',
    address: 'Adresse',
    courtNumber: 'Numéro de court',
    facilityName: "Nom de l'installation",

    // Participants
    maxParticipants: 'Participants maximum',
    minParticipants: 'Participants minimum',
    currentParticipants: 'Participants actuels',
    allowWaitlist: "Autoriser liste d'attente",

    // Registration
    registrationRequired: 'Inscription requise',
    registrationDeadline: "Date limite d'inscription",
    earlyBirdDeadline: 'Date limite tarif réduit',
    lateRegistration: 'Inscription tardive',

    // Pricing
    price: 'Prix',
    memberPrice: 'Prix membre',
    nonMemberPrice: 'Prix non-membre',
    earlyBirdPrice: 'Prix tarif réduit',
    lateRegistrationFee: "Frais d'inscription tardive",
    free: 'Gratuit',

    // Requirements
    skillLevel: 'Niveau requis',
    ageRestriction: "Restriction d'âge",
    equipmentRequired: 'Équipement requis',
    prerequisites: 'Prérequis',

    // Settings
    visibility: 'Visibilité',
    public: 'Public',
    private: 'Privé',
    membersOnly: 'Membres seulement',
    inviteOnly: 'Sur invitation seulement',

    // Notifications
    sendNotifications: 'Envoyer des notifications',
    notifyOnRegistration: "Notifier lors de l'inscription",
    reminderNotifications: 'Notifications de rappel',

    // Additional Options
    attachments: 'Pièces jointes',
    addPhoto: 'Ajouter une photo',
    addDocument: 'Ajouter un document',
    externalLink: 'Lien externe',

    // Actions
    createEvent: "Créer l'événement",
    updateEvent: "Mettre à jour l'événement",
    cancelEvent: "Annuler l'événement",
    duplicateEvent: "Dupliquer l'événement",
    previewEvent: "Aperçu de l'événement",

    // Validation
    nameRequired: 'Nom requis',
    dateRequired: 'Date requise',
    locationRequired: 'Lieu requis',
    invalidDateRange: 'Plage de dates invalide',
    maxParticipantsExceeded: 'Nombre maximum de participants dépassé',

    // Messages
    eventCreated: 'Événement créé avec succès',
    eventUpdated: 'Événement mis à jour avec succès',
    eventCancelled: 'Événement annulé avec succès',

    // Errors
    errorCreatingEvent: "Erreur lors de la création de l'événement",
    errorUpdatingEvent: "Erreur lors de la mise à jour de l'événement",
    errorLoadingEvent: "Erreur lors du chargement de l'événement",
  },

  clubLeaguesTournaments: {
    // Headers
    title: 'Ligues et tournois',
    leagues: 'Ligues',
    tournaments: 'Tournois',
    both: 'Les deux',

    // Tabs
    active: 'Actif',
    upcoming: 'À venir',
    past: 'Passé',
    myEvents: 'Mes événements',

    // Filters
    filterByType: 'Filtrer par type',
    filterByLevel: 'Filtrer par niveau',
    filterByDate: 'Filtrer par date',
    sortBy: 'Trier par',

    // Sort Options
    newest: 'Plus récent',
    oldest: 'Plus ancien',
    mostPopular: 'Plus populaire',
    endingSoon: 'Se termine bientôt',
    startingSoon: 'Commence bientôt',

    // League Info
    leagueFormat: 'Format de ligue',
    seasonLength: 'Durée de la saison',
    playoffDate: 'Date des éliminatoires',
    registrationPeriod: "Période d'inscription",

    // Tournament Info
    tournamentFormat: 'Format de tournoi',
    drawSize: 'Taille du tableau',
    rounds: 'Tours',
    finals: 'Finale',
    semifinals: 'Demi-finales',
    quarterfinals: 'Quarts de finale',

    // Status
    enrollmentOpen: 'Inscription ouverte',
    enrollmentClosed: 'Inscription fermée',
    inProgress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',

    // Actions
    viewDetails: 'Voir les détails',
    register: "S'inscrire",
    withdraw: 'Se retirer',
    viewStandings: 'Voir le classement',
    viewBpaddle: 'Voir le tableau',

    // Registration
    spotsLeft: 'Places restantes',
    waitlistAvailable: "Liste d'attente disponible",
    fullEvent: 'Événement complet',

    // Prizes
    prizes: 'Prix',
    firstPlace: 'Première place',
    secondPlace: 'Deuxième place',
    thirdPlace: 'Troisième place',

    // Requirements
    eligibility: 'Éligibilité',
    membershipRequired: 'Adhésion requise',
    minRating: 'Classement minimum',
    maxRating: 'Classement maximum',

    // Messages
    registrationConfirmed: 'Inscription confirmée',
    addedToWaitlist: "Ajouté à la liste d'attente",
    withdrawalConfirmed: 'Retrait confirmé',

    // Create
    createLeague: 'Créer une ligue',
    createTournament: 'Créer un tournoi',

    // Empty States
    noActiveEvents: 'Aucun événement actif',
    noUpcomingEvents: 'Aucun événement à venir',
    noPastEvents: 'Aucun événement passé',
    noRegistrations: 'Aucune inscription',
  },
};

// Deep merge function
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Count untranslated keys
function countUntranslated(enObj, frObj, path = '') {
  let count = 0;

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (isObject(enObj[key])) {
      count += countUntranslated(enObj[key], frObj[key] || {}, currentPath);
    } else {
      // Check if French translation exists and is different from English
      if (!frObj[key] || frObj[key] === enObj[key]) {
        count++;
      }
    }
  }

  return count;
}

// Count keys in object
function countKeys(obj) {
  let count = 0;

  for (const key in obj) {
    if (isObject(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }

  return count;
}

console.log('🔄 Starting French translation - Round 2...\n');

// Count before
const beforeCount = countUntranslated(en, fr);
console.log(`📊 Untranslated keys before: ${beforeCount}`);

// Apply translations
const updatedFr = deepMerge(fr, frTranslations);

// Count after
const afterCount = countUntranslated(en, updatedFr);
const translatedCount = beforeCount - afterCount;
const newKeysCount = countKeys(frTranslations);

console.log(`✅ New translations added: ${newKeysCount}`);
console.log(`📊 Untranslated keys after: ${afterCount}`);
console.log(`📈 Keys translated this round: ${translatedCount}\n`);

// Save updated French translations
fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2), 'utf8');

console.log('✨ French translation file updated successfully!');
console.log(`📁 File: ${frPath}\n`);

// Show breakdown by section
console.log('📋 Translations added by section:');
console.log(`   - services: ${countKeys(frTranslations.services)} keys`);
console.log(`   - duesManagement: ${countKeys(frTranslations.duesManagement)} keys`);
console.log(`   - leagueDetail: ${countKeys(frTranslations.leagueDetail)} keys`);
console.log(`   - createEvent: ${countKeys(frTranslations.createEvent)} keys`);
console.log(
  `   - clubLeaguesTournaments: ${countKeys(frTranslations.clubLeaguesTournaments)} keys`
);
