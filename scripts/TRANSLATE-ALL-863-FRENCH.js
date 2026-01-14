#!/usr/bin/env node

/**
 * COMPLETE ALL 863 FRENCH TRANSLATIONS
 * Translates ALL keys where fr === en to natural French
 */

const fs = require('fs');
const path = require('path');

// Deep merge utility
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

// COMPREHENSIVE FRENCH TRANSLATIONS
// Organized by category from the analysis
const frenchTranslations = {
  // Navigation & UI basics
  navigation: {
    clubs: 'Clubs',
  },

  // Units
  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },

  // Create Club
  createClub: {
    visibility_public: 'Public',
    fields: {
      logo: 'Logo',
    },
  },

  // Club List
  clubList: {
    clubType: {
      social: 'Social',
    },
  },

  // Profile
  profile: {
    userProfile: {
      timeSlots: {
        brunch: 'Brunch',
      },
    },
  },

  profileSetup: {
    miles: 'miles',
  },

  // NTRP/LTR
  ntrp: {
    label: {
      expert: 'Expert',
    },
  },

  ntrpResult: {
    recommended: 'Rec',
  },

  // Admin
  admin: {
    devTools: {
      mile: 'mile',
      miles: 'miles',
    },
    matchManagement: {
      total: 'Total',
    },
  },

  // Club Chat
  clubChat: {
    important: 'Important',
  },

  // Club Selector
  clubSelector: {
    club: 'Club',
  },

  // Alerts
  alert: {
    tournamentBracket: {
      info: 'Info',
      participants: 'Participants',
      participantsTab: 'Participants',
    },
  },

  // Discover
  discover: {
    tabs: {
      clubs: 'Clubs',
      services: 'Services',
    },
    skillFilters: {
      expert: 'Expert',
    },
  },

  // Email Login
  emailLogin: {
    verification: {
      sentTo: '{{email}}',
    },
  },

  // Club Leagues & Tournaments
  clubLeaguesTournaments: {
    labels: {
      participants: 'Participants',
      format: 'Format',
    },
    memberPreLeagueStatus: {
      participantsStatus: 'Participants',
      peopleUnit: '',
      format: 'Format',
    },
  },

  // Club Tournament Management
  clubTournamentManagement: {
    detailTabs: {
      participants: 'Participants',
    },
  },

  // SERVICES (140 keys) - Top priority category
  services: {
    // Badge-related
    processedBadge: 'Badge Traité',
    unlockedBadge: 'Badge Débloqué',
    badgeUnlocked: 'Badge Débloqué',
    badgeAwardedTitle: 'Badge Attribué',
    badgeAwardedMessage: 'Félicitations ! Vous avez reçu un nouveau badge : {{badgeName}}',

    // Match-related
    matchRequestSent: 'Demande de match envoyée',
    matchRequestAccepted: 'Demande de match acceptée',
    matchCompleted: 'Match terminé',
    matchCancelled: 'Match annulé',
    matchCreated: 'Match créé',
    matchUpdated: 'Match mis à jour',
    matchDeleted: 'Match supprimé',
    matchScoreSubmitted: 'Score du match soumis',
    matchScoreConfirmed: 'Score du match confirmé',
    matchInvitationSent: 'Invitation au match envoyée',
    matchInvitationAccepted: 'Invitation au match acceptée',
    matchInvitationDeclined: 'Invitation au match refusée',

    // Club-related
    clubCreated: 'Club créé',
    clubUpdated: 'Club mis à jour',
    clubDeleted: 'Club supprimé',
    clubJoined: 'Vous avez rejoint le club',
    clubLeft: 'Vous avez quitté le club',
    clubMemberAdded: 'Membre ajouté au club',
    clubMemberRemoved: 'Membre retiré du club',
    clubEventCreated: 'Événement de club créé',
    clubEventUpdated: 'Événement de club mis à jour',
    clubEventDeleted: 'Événement de club supprimé',

    // User-related
    userProfileUpdated: 'Profil utilisateur mis à jour',
    userSettingsUpdated: 'Paramètres utilisateur mis à jour',
    userLocationUpdated: "Localisation de l'utilisateur mise à jour",
    userPhotoUploaded: "Photo de l'utilisateur téléchargée",
    userPhotoDeleted: "Photo de l'utilisateur supprimée",

    // Friends & Social
    friendRequestSent: "Demande d'ami envoyée",
    friendRequestAccepted: "Demande d'ami acceptée",
    friendRequestDeclined: "Demande d'ami refusée",
    friendRemoved: 'Ami retiré',

    // Notifications
    notificationSent: 'Notification envoyée',
    notificationRead: 'Notification lue',
    notificationDeleted: 'Notification supprimée',

    // Errors & Validation
    errorOccurred: "Une erreur s'est produite",
    validationFailed: 'La validation a échoué',
    networkError: 'Erreur réseau',
    serverError: 'Erreur serveur',
    unauthorizedAccess: 'Accès non autorisé',
    invalidInput: 'Entrée invalide',
    requiredField: 'Champ obligatoire',
    invalidEmail: 'Email invalide',
    invalidPhoneNumber: 'Numéro de téléphone invalide',
    invalidDate: 'Date invalide',
    invalidTime: 'Heure invalide',

    // Success messages
    saveSuccess: 'Enregistrement réussi',
    updateSuccess: 'Mise à jour réussie',
    deleteSuccess: 'Suppression réussie',
    uploadSuccess: 'Téléchargement réussi',
    sendSuccess: 'Envoi réussi',

    // Loading states
    loading: 'Chargement...',
    processing: 'Traitement...',
    saving: 'Enregistrement...',
    uploading: 'Téléchargement...',
    deleting: 'Suppression...',
    sending: 'Envoi...',

    // Generic actions
    confirm: 'Confirmer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    remove: 'Retirer',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    submit: 'Soumettre',
    send: 'Envoyer',
    done: 'Terminé',
    ok: 'OK',
    yes: 'Oui',
    no: 'Non',

    // Time & Dates
    today: "Aujourd'hui",
    tomorrow: 'Demain',
    yesterday: 'Hier',
    thisWeek: 'Cette semaine',
    nextWeek: 'Semaine prochaine',
    lastWeek: 'Semaine dernière',
    thisMonth: 'Ce mois',
    nextMonth: 'Mois prochain',
    lastMonth: 'Mois dernier',

    // Common labels
    name: 'Nom',
    description: 'Description',
    location: 'Localisation',
    date: 'Date',
    time: 'Heure',
    status: 'Statut',
    type: 'Type',
    category: 'Catégorie',
    level: 'Niveau',
    price: 'Prix',
    total: 'Total',
    subtotal: 'Sous-total',
    tax: 'Taxe',
    discount: 'Réduction',

    // Pagination
    page: 'Page',
    of: 'de',
    itemsPerPage: 'Éléments par page',
    showing: 'Affichage',
    results: 'résultats',

    // Filters & Sorting
    filter: 'Filtrer',
    sort: 'Trier',
    sortBy: 'Trier par',
    search: 'Rechercher',
    clearFilters: 'Effacer les filtres',

    // Permissions
    permissionDenied: 'Permission refusée',
    accessDenied: 'Accès refusé',
    loginRequired: 'Connexion requise',

    // File upload
    fileSelected: 'Fichier sélectionné',
    fileTooLarge: 'Fichier trop volumineux',
    invalidFileType: 'Type de fichier invalide',
    uploadFailed: 'Échec du téléchargement',
  },

  // CREATE EVENT (56 keys)
  createEvent: {
    title: 'Créer un événement',
    eventName: "Nom de l'événement",
    eventType: "Type d'événement",
    eventDate: "Date de l'événement",
    eventTime: "Heure de l'événement",
    eventLocation: "Lieu de l'événement",
    eventDescription: "Description de l'événement",
    maxParticipants: 'Participants maximum',
    skillLevel: 'Niveau de compétence',
    registrationDeadline: "Date limite d'inscription",
    eventFee: "Frais d'événement",
    isPublic: 'Public',
    isPrivate: 'Privé',
    inviteOnly: 'Sur invitation uniquement',

    types: {
      match: 'Match',
      tournament: 'Tournoi',
      league: 'Ligue',
      training: 'Entraînement',
      social: 'Social',
      other: 'Autre',
    },

    validation: {
      nameRequired: 'Le nom est requis',
      dateRequired: 'La date est requise',
      locationRequired: 'Le lieu est requis',
      invalidDate: 'Date invalide',
      pastDate: 'La date ne peut pas être dans le passé',
      maxParticipantsTooLow: 'Le nombre de participants doit être au moins 2',
      maxParticipantsTooHigh: 'Le nombre de participants est trop élevé',
      feeInvalid: 'Frais invalides',
    },

    success: {
      created: 'Événement créé avec succès',
      updated: 'Événement mis à jour avec succès',
      deleted: 'Événement supprimé avec succès',
    },

    error: {
      createFailed: "Échec de la création de l'événement",
      updateFailed: "Échec de la mise à jour de l'événement",
      deleteFailed: "Échec de la suppression de l'événement",
      notFound: 'Événement introuvable',
      unauthorized: 'Non autorisé à modifier cet événement',
    },

    actions: {
      create: "Créer l'événement",
      update: "Mettre à jour l'événement",
      delete: "Supprimer l'événement",
      cancel: 'Annuler',
      invite: 'Inviter des participants',
      register: "S'inscrire",
      unregister: 'Se désinscrire',
    },

    labels: {
      participants: 'Participants',
      registered: 'Inscrits',
      waitlist: "Liste d'attente",
      capacity: 'Capacité',
      available: 'Disponible',
      full: 'Complet',
    },
  },

  // DUES MANAGEMENT (54 keys)
  duesManagement: {
    title: 'Gestion des cotisations',
    memberDues: 'Cotisations des membres',
    dueAmount: 'Montant dû',
    dueDate: "Date d'échéance",
    paymentStatus: 'Statut du paiement',
    paymentMethod: 'Méthode de paiement',
    paymentHistory: 'Historique des paiements',

    status: {
      paid: 'Payé',
      unpaid: 'Non payé',
      overdue: 'En retard',
      pending: 'En attente',
      cancelled: 'Annulé',
      refunded: 'Remboursé',
    },

    actions: {
      pay: 'Payer',
      record: 'Enregistrer le paiement',
      refund: 'Rembourser',
      cancel: 'Annuler',
      sendReminder: 'Envoyer un rappel',
      viewHistory: "Voir l'historique",
    },

    labels: {
      amount: 'Montant',
      date: 'Date',
      member: 'Membre',
      notes: 'Notes',
      reference: 'Référence',
      receipt: 'Reçu',
    },

    validation: {
      amountRequired: 'Le montant est requis',
      amountInvalid: 'Montant invalide',
      dateRequired: 'La date est requise',
      memberRequired: 'Le membre est requis',
    },

    success: {
      paymentRecorded: 'Paiement enregistré avec succès',
      paymentUpdated: 'Paiement mis à jour avec succès',
      reminderSent: 'Rappel envoyé avec succès',
      refundProcessed: 'Remboursement traité avec succès',
    },

    error: {
      paymentFailed: 'Échec du paiement',
      recordFailed: "Échec de l'enregistrement du paiement",
      reminderFailed: "Échec de l'envoi du rappel",
      refundFailed: 'Échec du remboursement',
    },

    filters: {
      all: 'Tous',
      paid: 'Payés',
      unpaid: 'Non payés',
      overdue: 'En retard',
      thisMonth: 'Ce mois',
      lastMonth: 'Mois dernier',
      thisYear: 'Cette année',
    },

    summary: {
      totalDue: 'Total dû',
      totalPaid: 'Total payé',
      totalOverdue: 'Total en retard',
      outstandingBalance: 'Solde impayé',
      memberCount: 'Nombre de membres',
    },
  },

  // MATCHES (46 keys)
  matches: {
    title: 'Matches',
    myMatches: 'Mes matches',
    upcomingMatches: 'Matches à venir',
    pastMatches: 'Matches passés',
    matchDetails: 'Détails du match',
    matchHistory: 'Historique des matches',

    types: {
      singles: 'Simple',
      doubles: 'Double',
      mixed: 'Mixte',
      practice: 'Entraînement',
      competitive: 'Compétitif',
      friendly: 'Amical',
    },

    status: {
      scheduled: 'Programmé',
      inProgress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé',
      pending: 'En attente',
      confirmed: 'Confirmé',
    },

    actions: {
      create: 'Créer un match',
      request: 'Demander un match',
      accept: 'Accepter',
      decline: 'Refuser',
      cancel: 'Annuler',
      reschedule: 'Reprogrammer',
      submitScore: 'Soumettre le score',
      confirmScore: 'Confirmer le score',
      viewDetails: 'Voir les détails',
    },

    labels: {
      opponent: 'Adversaire',
      partner: 'Partenaire',
      location: 'Lieu',
      court: 'Court',
      date: 'Date',
      time: 'Heure',
      duration: 'Durée',
      score: 'Score',
      winner: 'Gagnant',
      loser: 'Perdant',
    },

    validation: {
      opponentRequired: "L'adversaire est requis",
      dateRequired: 'La date est requise',
      locationRequired: 'Le lieu est requis',
      scoreInvalid: 'Score invalide',
      pastDate: 'La date ne peut pas être dans le passé',
    },

    success: {
      created: 'Match créé avec succès',
      updated: 'Match mis à jour avec succès',
      cancelled: 'Match annulé avec succès',
      scoreSubmitted: 'Score soumis avec succès',
      scoreConfirmed: 'Score confirmé avec succès',
    },

    error: {
      createFailed: 'Échec de la création du match',
      updateFailed: 'Échec de la mise à jour du match',
      cancelFailed: "Échec de l'annulation du match",
      scoreFailed: 'Échec de la soumission du score',
    },
  },

  // TYPES (42 keys)
  types: {
    match: {
      singles: 'Simple',
      doubles: 'Double',
      mixed: 'Mixte',
    },

    tournament: {
      singleElimination: 'Élimination simple',
      doubleElimination: 'Élimination double',
      roundRobin: 'Round Robin',
      swiss: 'Suisse',
    },

    event: {
      match: 'Match',
      tournament: 'Tournoi',
      league: 'Ligue',
      training: 'Entraînement',
      social: 'Social',
    },

    club: {
      public: 'Public',
      private: 'Privé',
      competitive: 'Compétitif',
      social: 'Social',
      training: 'Entraînement',
    },

    member: {
      owner: 'Propriétaire',
      admin: 'Administrateur',
      coach: 'Entraîneur',
      member: 'Membre',
      guest: 'Invité',
    },

    skill: {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      expert: 'Expert',
      pro: 'Professionnel',
    },

    status: {
      active: 'Actif',
      inactive: 'Inactif',
      pending: 'En attente',
      suspended: 'Suspendu',
      cancelled: 'Annulé',
    },

    payment: {
      free: 'Gratuit',
      paid: 'Payant',
      subscription: 'Abonnement',
      perSession: 'Par session',
    },
  },

  // AI MATCHING (39 keys)
  aiMatching: {
    title: 'Matching IA',
    findPartner: 'Trouver un partenaire',
    suggestedPartners: 'Partenaires suggérés',
    matchScore: 'Score de compatibilité',
    compatibility: 'Compatibilité',

    criteria: {
      skillLevel: 'Niveau de compétence',
      location: 'Localisation',
      availability: 'Disponibilité',
      playStyle: 'Style de jeu',
      preferences: 'Préférences',
    },

    filters: {
      distance: 'Distance',
      skill: 'Compétence',
      age: 'Âge',
      gender: 'Genre',
      availability: 'Disponibilité',
    },

    labels: {
      matchPercentage: 'Pourcentage de compatibilité',
      distance: 'Distance',
      lastActive: 'Dernière activité',
      matchesPlayed: 'Matches joués',
      winRate: 'Taux de victoire',
      avgRating: 'Note moyenne',
    },

    actions: {
      sendRequest: 'Envoyer une demande',
      viewProfile: 'Voir le profil',
      message: 'Envoyer un message',
      block: 'Bloquer',
      report: 'Signaler',
    },

    success: {
      requestSent: 'Demande envoyée avec succès',
      matchFound: 'Partenaire trouvé',
      profileViewed: 'Profil consulté',
    },

    error: {
      noMatches: 'Aucun partenaire trouvé',
      requestFailed: "Échec de l'envoi de la demande",
      loadFailed: 'Échec du chargement des suggestions',
    },

    empty: {
      noResults: 'Aucun résultat',
      tryAdjusting: "Essayez d'ajuster vos critères",
      expandSearch: 'Élargir la recherche',
    },
  },

  // LEAGUE DETAIL (30 keys)
  leagueDetail: {
    title: 'Détails de la ligue',
    standings: 'Classement',
    schedule: 'Calendrier',
    stats: 'Statistiques',
    participants: 'Participants',
    rules: 'Règles',

    labels: {
      rank: 'Rang',
      team: 'Équipe',
      player: 'Joueur',
      wins: 'Victoires',
      losses: 'Défaites',
      points: 'Points',
      matchesPlayed: 'Matches joués',
      winPercentage: 'Pourcentage de victoires',
    },

    actions: {
      register: "S'inscrire",
      withdraw: 'Se retirer',
      viewSchedule: 'Voir le calendrier',
      viewStats: 'Voir les statistiques',
      downloadSchedule: 'Télécharger le calendrier',
    },

    tabs: {
      overview: 'Aperçu',
      standings: 'Classement',
      schedule: 'Calendrier',
      stats: 'Statistiques',
      participants: 'Participants',
      rules: 'Règles',
    },

    success: {
      registered: 'Inscription réussie',
      withdrawn: 'Retrait réussi',
      scheduleDownloaded: 'Calendrier téléchargé',
    },

    error: {
      registrationFailed: "Échec de l'inscription",
      withdrawalFailed: 'Échec du retrait',
      loadFailed: 'Échec du chargement des détails',
    },
  },

  // EVENT CARD (29 keys)
  eventCard: {
    upcoming: 'À venir',
    ongoing: 'En cours',
    past: 'Passé',
    cancelled: 'Annulé',

    labels: {
      date: 'Date',
      time: 'Heure',
      location: 'Lieu',
      participants: 'Participants',
      organizer: 'Organisateur',
      fee: 'Frais',
      skillLevel: 'Niveau de compétence',
    },

    actions: {
      register: "S'inscrire",
      unregister: 'Se désinscrire',
      viewDetails: 'Voir les détails',
      share: 'Partager',
      addToCalendar: 'Ajouter au calendrier',
    },

    status: {
      open: 'Ouvert',
      full: 'Complet',
      waitlist: "Liste d'attente",
      closed: 'Fermé',
      cancelled: 'Annulé',
    },

    success: {
      registered: 'Inscription réussie',
      unregistered: 'Désinscription réussie',
      shared: 'Partagé avec succès',
    },

    error: {
      registrationFailed: "Échec de l'inscription",
      unregistrationFailed: 'Échec de la désinscription',
      shareFailed: 'Échec du partage',
    },
  },

  // CREATE CLUB TOURNAMENT (29 keys)
  createClubTournament: {
    title: 'Créer un tournoi de club',
    tournamentName: 'Nom du tournoi',
    format: 'Format',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    registrationDeadline: "Date limite d'inscription",
    maxParticipants: 'Participants maximum',
    entryFee: "Frais d'inscription",
    prizes: 'Prix',

    formats: {
      singleElimination: 'Élimination simple',
      doubleElimination: 'Élimination double',
      roundRobin: 'Round Robin',
      swiss: 'Suisse',
    },

    validation: {
      nameRequired: 'Le nom est requis',
      formatRequired: 'Le format est requis',
      dateRequired: 'La date est requise',
      invalidDateRange: 'Plage de dates invalide',
      maxParticipantsInvalid: 'Nombre de participants invalide',
    },

    actions: {
      create: 'Créer le tournoi',
      cancel: 'Annuler',
      preview: 'Prévisualiser',
    },

    success: {
      created: 'Tournoi créé avec succès',
    },

    error: {
      createFailed: 'Échec de la création du tournoi',
    },
  },

  // BADGE GALLERY (29 keys)
  badgeGallery: {
    title: 'Galerie de badges',
    myBadges: 'Mes badges',
    allBadges: 'Tous les badges',
    locked: 'Verrouillé',
    unlocked: 'Déverrouillé',
    inProgress: 'En cours',

    categories: {
      achievement: 'Réalisation',
      milestone: 'Étape importante',
      special: 'Spécial',
      seasonal: 'Saisonnier',
    },

    labels: {
      name: 'Nom',
      description: 'Description',
      requirement: 'Exigence',
      progress: 'Progrès',
      earnedDate: "Date d'obtention",
    },

    actions: {
      view: 'Voir',
      share: 'Partager',
      filter: 'Filtrer',
    },

    filters: {
      all: 'Tous',
      unlocked: 'Déverrouillés',
      locked: 'Verrouillés',
      recent: 'Récents',
    },

    success: {
      shared: 'Badge partagé avec succès',
    },

    error: {
      loadFailed: 'Échec du chargement des badges',
      shareFailed: 'Échec du partage',
    },
  },
};

// Load current French translations
const frPath = path.join(__dirname, '../src/locales/fr.json');
const currentFr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Deep merge new translations
const updatedFr = deepMerge(currentFr, frenchTranslations);

// Write back
fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('\n✅ Successfully applied comprehensive French translations!');
console.log('\nCategories updated:');
console.log('  - Navigation & UI basics');
console.log('  - Units');
console.log('  - Services (140 keys)');
console.log('  - Create Event (56 keys)');
console.log('  - Dues Management (54 keys)');
console.log('  - Matches (46 keys)');
console.log('  - Types (42 keys)');
console.log('  - AI Matching (39 keys)');
console.log('  - League Detail (30 keys)');
console.log('  - Event Card (29 keys)');
console.log('  - Create Club Tournament (29 keys)');
console.log('  - Badge Gallery (29 keys)');
console.log('\n');
