#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const frPath = path.join(__dirname, '../src/locales/fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Comprehensive French translations mapped to actual keys
const translations = {
  leagueDetail: {
    leagueDeleted: 'Ligue supprimée',
    leagueDeletedByAdmin:
      'Cette ligue a été supprimée par un autre administrateur. Vous allez être redirigé.',
    unknownUser: 'Utilisateur inconnu',
    errorLoadingLeague: 'Échec du chargement des informations de la ligue',
    notification: 'Notification',
    leagueNotFound: 'Ligue non trouvée',
    errorDeletingLeague: 'Erreur lors de la suppression de la ligue',
    confirmDelete: 'Confirmer la suppression',
    confirmDeleteMessage: 'Êtes-vous sûr de vouloir supprimer cette ligue ?',
    deletingLeague: 'Suppression de la ligue...',
    leagueDeletedSuccess: 'Ligue supprimée avec succès',
    standings: 'Classement',
    schedule: 'Calendrier',
    participants: 'Participants',
    rules: 'Règles',
    results: 'Résultats',
    rank: 'Rang',
    player: 'Joueur',
    wins: 'Victoires',
    losses: 'Défaites',
    winRate: 'Taux de victoire',
    points: 'Points',
    matchesPlayed: 'Matchs joués',
    upcomingMatches: 'Matchs à venir',
    pastMatches: 'Matchs passés',
    noMatchesScheduled: 'Aucun match programmé',
    scheduleMatch: 'Programmer un match',
    round: 'Tour',
    week: 'Semaine',
    versus: 'contre',
    time: 'Heure',
    location: 'Lieu',
    court: 'Court',
    referee: 'Arbitre',
    totalParticipants: 'Total des participants',
    activeParticipants: 'Participants actifs',
    registrationOpen: 'Inscription ouverte',
    registrationClosed: 'Inscription fermée',
    waitlist: "Liste d'attente",
    register: "S'inscrire",
    unregister: 'Se désinscrire',
    registrationDeadline: "Date limite d'inscription",
    registrationFee: "Frais d'inscription",
    spotsAvailable: 'Places disponibles',
    spotsRemaining: 'Places restantes',
    leagueRules: 'Règles de la ligue',
    scoringSystem: 'Système de score',
    matchFormat: 'Format de match',
    tiebreakRules: 'Règles de jeu décisif',
    playoffFormat: 'Format des éliminatoires',
    latestResults: 'Derniers résultats',
    submitResult: 'Soumettre le résultat',
    confirmResult: 'Confirmer le résultat',
    disputeResult: 'Contester le résultat',
    currentSeason: 'Saison en cours',
    previousSeasons: 'Saisons précédentes',
    seasonStart: 'Début de saison',
    seasonEnd: 'Fin de saison',
    singleElimination: 'Élimination simple',
    doubleElimination: 'Élimination double',
    roundRobin: 'Round-robin',
    swiss: 'Système suisse',
    joinLeague: 'Rejoindre la ligue',
    leaveLeague: 'Quitter la ligue',
    invitePlayers: 'Inviter des joueurs',
    viewStats: 'Voir les statistiques',
    downloadSchedule: 'Télécharger le calendrier',
    active: 'Active',
    inactive: 'Inactive',
    upcoming: 'À venir',
    completed: 'Terminée',
    cancelled: 'Annulée',
    registrationSuccess: 'Inscription réussie',
    unregistrationSuccess: 'Désinscription réussie',
    resultSubmitted: 'Résultat soumis',
    leagueFull: 'Ligue complète',
    registrationRequired: 'Inscription requise',
    errorRegistering: "Erreur lors de l'inscription",
    errorSubmittingResult: 'Erreur lors de la soumission du résultat',
  },

  admin: {
    devTools: {
      loading: 'Chargement...',
      tennisStats: '📊 Statistiques de tennis',
      matchesPlayed: 'Matchs joués',
      wins: 'Victoires',
      winRate: 'Taux de victoire',
      currentRating: 'Classement actuel',
      peakRating: 'Meilleur classement',
      recentMatches: 'Matchs récents',
      playerStats: 'Statistiques du joueur',
      performance: 'Performance',
      trends: 'Tendances',
      noData: 'Aucune donnée disponible',
      refreshData: 'Actualiser les données',
      exportData: 'Exporter les données',
      dataExported: 'Données exportées avec succès',
      errorLoadingData: 'Erreur lors du chargement des données',
      tryAgain: 'Réessayer',
      close: 'Fermer',
      save: 'Enregistrer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      remove: 'Retirer',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      settings: 'Paramètres',
      help: 'Aide',
      about: 'À propos',
      version: 'Version',
      changelog: 'Journal des modifications',
      documentation: 'Documentation',
      support: 'Support',
      feedback: "Retour d'information",
      reportBug: 'Signaler un bug',
      requestFeature: 'Demander une fonctionnalité',
    },

    logs: {
      title: 'Journaux système',
      critical: 'Critique',
      warning: 'Avertissement',
      healthy: 'Sain',
      systemStatus: 'État du système',
      errorLogs: "Journaux d'erreur",
      activityLogs: "Journaux d'activité",
      securityLogs: 'Journaux de sécurité',
      auditLogs: "Journaux d'audit",
      viewAll: 'Tout voir',
      clearLogs: 'Effacer les journaux',
      downloadLogs: 'Télécharger les journaux',
      filterByLevel: 'Filtrer par niveau',
      filterByDate: 'Filtrer par date',
      searchLogs: 'Rechercher dans les journaux',
      noLogsFound: 'Aucun journal trouvé',
      refreshLogs: 'Actualiser les journaux',
      autoRefresh: 'Actualisation automatique',
      logDetails: 'Détails du journal',
      timestamp: 'Horodatage',
      level: 'Niveau',
      message: 'Message',
      source: 'Source',
      user: 'Utilisateur',
      action: 'Action',
      result: 'Résultat',
      duration: 'Durée',
      ipAddress: 'Adresse IP',
      userAgent: 'Agent utilisateur',
      stackTrace: 'Trace de pile',
      errorCode: "Code d'erreur",
      errorMessage: "Message d'erreur",
      info: 'Info',
      debug: 'Débogage',
      error: 'Erreur',
      fatal: 'Fatal',
    },
  },

  editClubPolicy: {
    error: 'Erreur',
    loadError: 'Échec du chargement des données du club',
    loginRequired: 'Connexion requise',
    saved: 'Enregistré',
    savedMessage: 'Informations du club mises à jour.',
    saveError: "Erreur lors de l'enregistrement",
    saving: 'Enregistrement...',
    title: 'Modifier la politique du club',
    policyTitle: 'Titre de la politique',
    policyContent: 'Contenu de la politique',
    policyType: 'Type de politique',
    general: 'Général',
    rules: 'Règles',
    conduct: 'Conduite',
    safety: 'Sécurité',
    membership: 'Adhésion',
    fees: 'Frais',
    effectiveDate: "Date d'entrée en vigueur",
    lastModified: 'Dernière modification',
    modifiedBy: 'Modifié par',
    preview: 'Aperçu',
    publish: 'Publier',
    draft: 'Brouillon',
    status: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    archived: 'Archivé',
    delete: 'Supprimer',
    confirmDelete: 'Confirmer la suppression',
    confirmDeleteMessage: 'Êtes-vous sûr de vouloir supprimer cette politique ?',
    cancel: 'Annuler',
    save: 'Enregistrer',
    update: 'Mettre à jour',
    create: 'Créer',
    edit: 'Modifier',
    view: 'Voir',
    back: 'Retour',
    close: 'Fermer',
  },

  createClubLeague: {
    headerTitle: 'Créer une nouvelle ligue',
    headerSubtitle: 'Démarrer une ligue avec les membres de votre club',
    matchTypeQuestion: 'Quel type de matchs cette ligue comportera-t-elle ?',
    mensSingles: 'Simple messieurs',
    mensSinglesDescription: 'Matchs 1v1 messieurs',
    womensSingles: 'Simple dames',
    womensSinglesDescription: 'Matchs 1v1 dames',
    mensDoubles: 'Double messieurs',
    mensDoublesDescription: 'Matchs 2v2 messieurs',
    womensDoubles: 'Double dames',
    womensDoublesDescription: 'Matchs 2v2 dames',
    mixedDoubles: 'Double mixte',
    mixedDoublesDescription: 'Matchs 2v2 mixtes',
    leagueName: 'Nom de la ligue',
    leagueDescription: 'Description de la ligue',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    maxParticipants: 'Participants maximum',
    minParticipants: 'Participants minimum',
    registrationDeadline: "Date limite d'inscription",
    leagueFormat: 'Format de ligue',
    scoringSystem: 'Système de score',
    skillLevel: 'Niveau de compétence',
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
    all: 'Tous',
    fees: 'Frais',
    memberFee: 'Frais pour membres',
    nonMemberFee: 'Frais pour non-membres',
    free: 'Gratuit',
    createLeague: 'Créer la ligue',
    cancel: 'Annuler',
    back: 'Retour',
    next: 'Suivant',
    finish: 'Terminer',
  },

  duesManagement: {
    modals: {
      manageDues: 'Gérer les cotisations',
      removePaymentMethod: 'Retirer le mode de paiement',
      removePaymentMethodConfirm: 'Retirer ce mode de paiement ?',
      deleteQrCode: 'Supprimer le code QR',
      approvePayment: 'Approuver le paiement',
      rejectPayment: 'Rejeter le paiement',
      confirmApproval: "Confirmer l'approbation",
      confirmRejection: 'Confirmer le rejet',
      paymentApproved: 'Paiement approuvé',
      paymentRejected: 'Paiement rejeté',
      enterReason: 'Entrer la raison',
      reasonRequired: 'Raison requise',
      processingPayment: 'Traitement du paiement...',
      paymentProcessed: 'Paiement traité',
      errorProcessingPayment: 'Erreur lors du traitement du paiement',
      close: 'Fermer',
      confirm: 'Confirmer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      view: 'Voir',
      add: 'Ajouter',
      remove: 'Retirer',
      update: 'Mettre à jour',
      approve: 'Approuver',
      reject: 'Rejeter',
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      paid: 'Payé',
      unpaid: 'Impayé',
      overdue: 'En retard',
      partial: 'Partiel',
    },

    messages: {
      autoInvoiceFailed: 'Échec de la mise à jour du paramètre de facturation automatique.',
      missingSettings:
        'Pour activer la facturation automatique, veuillez configurer les paramètres suivants.',
      autoInvoiceConfirm: 'Les factures seront automatiquement envoyées le {{day}} de chaque mois.',
      settingsSaved: 'Les paramètres de cotisation ont été mis à jour avec succès.',
      loadError: 'Échec du chargement des données de gestion des cotisations. Veuillez réessayer.',
      saveError: "Erreur lors de l'enregistrement",
      updateSuccess: 'Mise à jour réussie',
      deleteSuccess: 'Suppression réussie',
      approvalSuccess: 'Approbation réussie',
      rejectionSuccess: 'Rejet réussi',
      paymentRecorded: 'Paiement enregistré avec succès',
      reminderSent: 'Rappel envoyé avec succès',
      noPaymentsFound: 'Aucun paiement trouvé',
      noDuesSettings: 'Aucun paramètre de cotisation configuré',
      invalidAmount: 'Montant invalide',
      amountRequired: 'Montant requis',
      dateRequired: 'Date requise',
      memberRequired: 'Membre requis',
      methodRequired: 'Mode de paiement requis',
      notesOptional: 'Notes (optionnel)',
      receiptGenerated: 'Reçu généré',
      emailSent: 'Email envoyé',
      smsSent: 'SMS envoyé',
    },
  },

  clubOverviewScreen: {
    loadingClubInfo: 'Chargement des informations du club...',
    loadingAnnouncements: 'Chargement des annonces...',
    important: 'Important',
    noDateInfo: 'Aucune information de date',
    bracketGeneration: 'Génération de bracket',
    errorLoadingClub: 'Erreur lors du chargement du club',
    noAnnouncements: 'Aucune annonce',
    noUpcomingEvents: 'Aucun événement à venir',
    viewAll: 'Tout voir',
    viewDetails: 'Voir les détails',
    readMore: 'Lire plus',
    readLess: 'Lire moins',
    announcements: 'Annonces',
    events: 'Événements',
    members: 'Membres',
    stats: 'Statistiques',
    about: 'À propos',
    contact: 'Contact',
    address: 'Adresse',
    phone: 'Téléphone',
    email: 'Email',
    website: 'Site web',
    socialMedia: 'Médias sociaux',
    facilities: 'Installations',
    courts: 'Courts',
    amenities: 'Équipements',
    hours: "Heures d'ouverture",
    membershipInfo: "Informations sur l'adhésion",
    joinClub: 'Rejoindre le club',
    leaveClub: 'Quitter le club',
    memberSince: 'Membre depuis',
    totalMembers: 'Total des membres',
    activeMembers: 'Membres actifs',
  },

  schedules: {
    form: {
      title: 'Titre du calendrier *',
      titlePlaceholder: 'ex. Pratique du mercredi soir',
      description: 'Description',
      descriptionPlaceholder: 'Entrez une description détaillée du calendrier',
      scheduleType: 'Type de calendrier',
      recurring: 'Récurrent',
      oneTime: 'Unique',
      frequency: 'Fréquence',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      dayOfWeek: 'Jour de la semaine',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      startTime: 'Heure de début',
      endTime: 'Heure de fin',
      location: 'Lieu',
      locationPlaceholder: 'Entrez le lieu',
      courtNumber: 'Numéro de court',
      maxParticipants: 'Participants maximum',
      visibility: 'Visibilité',
      public: 'Public',
      private: 'Privé',
      membersOnly: 'Membres seulement',
      notes: 'Notes',
      notesPlaceholder: 'Notes supplémentaires',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
    },
  },

  manageAnnouncement: {
    title: "Gérer l'annonce",
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    ok: 'OK',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    create: 'Créer',
    update: 'Mettre à jour',
    announcementTitle: "Titre de l'annonce",
    announcementContent: "Contenu de l'annonce",
    priority: 'Priorité',
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse',
    normal: 'Normale',
    pinned: 'Épinglé',
    publishDate: 'Date de publication',
    expiryDate: "Date d'expiration",
    targetAudience: 'Public cible',
    allMembers: 'Tous les membres',
    specificGroups: 'Groupes spécifiques',
    attachments: 'Pièces jointes',
    preview: 'Aperçu',
    publish: 'Publier',
    unpublish: 'Dépublier',
    draft: 'Brouillon',
  },

  manageLeagueParticipants: {
    title: 'Gérer les matchs',
    loadingMatches: 'Chargement des matchs...',
    approveMatchResult: 'Approuver le résultat du match',
    confirmApproveMatch: 'Êtes-vous sûr de vouloir approuver ce résultat de match ?',
    approve: 'Approuver',
    reject: 'Rejeter',
    cancel: 'Annuler',
    matchApproved: 'Match approuvé',
    matchRejected: 'Match rejeté',
    errorApprovingMatch: "Erreur lors de l'approbation du match",
    errorRejectingMatch: 'Erreur lors du rejet du match',
    noMatches: 'Aucun match',
    viewDetails: 'Voir les détails',
    editResult: 'Modifier le résultat',
    deleteMatch: 'Supprimer le match',
    confirmDelete: 'Confirmer la suppression',
    confirmDeleteMessage: 'Êtes-vous sûr de vouloir supprimer ce match ?',
    matchDeleted: 'Match supprimé',
    errorDeletingMatch: 'Erreur lors de la suppression du match',
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    completed: 'Terminé',
    scheduled: 'Programmé',
  },

  findClubScreen: {
    title: 'Trouver des clubs',
    searchPlaceholder: 'Rechercher par nom de club, lieu...',
    searching: 'Recherche de clubs...',
    searchResults: "Résultats de recherche pour '{{query}}' : {{count}} clubs",
    totalClubs: 'Total des clubs : {{count}}',
    noResults: 'Aucun résultat trouvé',
    tryDifferentSearch: 'Essayez une recherche différente',
    nearMe: 'Près de moi',
    featured: 'En vedette',
    popular: 'Populaire',
    newest: 'Nouveau',
    filterBy: 'Filtrer par',
    location: 'Lieu',
    type: 'Type',
    amenities: 'Équipements',
    sortBy: 'Trier par',
    distance: 'Distance',
    name: 'Nom',
    members: 'Membres',
    rating: 'Note',
    viewClub: 'Voir le club',
    joinClub: 'Rejoindre le club',
    learnMore: 'En savoir plus',
    getDirections: "Obtenir l'itinéraire",
  },

  clubTournamentManagement: {
    management: {
      status: 'Statut du tournoi',
      statusTitle: 'Statut du tournoi',
      tournamentManagement: 'Gestion du tournoi',
      openRegistrationDescription: "Permettre aux membres du club de s'inscrire au tournoi",
      deleteDescription:
        'Supprimer définitivement le tournoi. Cette action ne peut pas être annulée.',
      openRegistration: "Ouvrir l'inscription",
      closeRegistration: "Fermer l'inscription",
      generateBracket: 'Générer le bracket',
      startTournament: 'Démarrer le tournoi',
      endTournament: 'Terminer le tournoi',
      cancelTournament: 'Annuler le tournoi',
      deleteTournament: 'Supprimer le tournoi',
      editTournament: 'Modifier le tournoi',
      viewParticipants: 'Voir les participants',
      viewBracket: 'Voir le bracket',
      viewResults: 'Voir les résultats',
      downloadReport: 'Télécharger le rapport',
      sendNotifications: 'Envoyer des notifications',
      registrationOpened: 'Inscription ouverte',
      registrationClosed: 'Inscription fermée',
      tournamentStarted: 'Tournoi démarré',
      tournamentEnded: 'Tournoi terminé',
      tournamentCancelled: 'Tournoi annulé',
      tournamentDeleted: 'Tournoi supprimé',
      confirmAction: "Confirmer l'action",
    },
  },

  hostedEventCard: {
    weather: {
      conditions: {
        Clear: 'Dégagé',
        Sunny: 'Ensoleillé',
        'Partly Cloudy': 'Partiellement nuageux',
        'Mostly Cloudy': 'Majoritairement nuageux',
        Cloudy: 'Nuageux',
        Overcast: 'Couvert',
        Rain: 'Pluie',
        'Light Rain': 'Pluie légère',
        'Heavy Rain': 'Pluie forte',
        Thunderstorm: 'Orage',
        Snow: 'Neige',
        Fog: 'Brouillard',
        Windy: 'Venteux',
        Hot: 'Chaud',
        Cold: 'Froid',
        Humid: 'Humide',
        Dry: 'Sec',
        Hazy: 'Brumeux',
        Mist: 'Brume',
        Drizzle: 'Bruine',
        Sleet: 'Grésil',
        Hail: 'Grêle',
      },
    },
  },

  clubLeaguesTournaments: {
    memberPreLeagueStatus: {
      statusPendingSubtitle: "En attente de l'approbation de l'administrateur de la ligue",
      statusApproved: 'Confirmé',
      statusApprovedSubtitle:
        'Votre participation à la ligue est confirmée ! Les matchs commencent bientôt.',
      statusRejectedSubtitle: 'Votre demande de participation à la ligue a été rejetée',
      statusNotApplied: 'Postuler à la ligue',
      statusPending: 'En attente',
      statusRejected: 'Rejeté',
      apply: 'Postuler',
      withdraw: 'Se retirer',
      viewDetails: 'Voir les détails',
      applicationSubmitted: 'Demande soumise',
      applicationWithdrawn: 'Demande retirée',
      errorSubmitting: 'Erreur lors de la soumission',
      errorWithdrawing: 'Erreur lors du retrait',
      confirmWithdraw: 'Confirmer le retrait',
      confirmWithdrawMessage: 'Êtes-vous sûr de vouloir retirer votre demande ?',
      reason: 'Raison',
      optionalReason: 'Raison (optionnel)',
      submit: 'Soumettre',
      cancel: 'Annuler',
      back: 'Retour',
      close: 'Fermer',
    },
  },

  cards: {
    hostedEvent: {
      weather: {
        sunny: 'Ensoleillé',
        partlycloudy: 'Partiellement nuageux',
        mostlycloudy: 'Majoritairement nuageux',
        cloudy: 'Nuageux',
        overcast: 'Couvert',
        rain: 'Pluie',
        lightrain: 'Pluie légère',
        heavyrain: 'Pluie forte',
        thunderstorm: 'Orage',
        snow: 'Neige',
        fog: 'Brouillard',
        windy: 'Venteux',
        hot: 'Chaud',
        cold: 'Froid',
        humid: 'Humide',
        dry: 'Sec',
        hazy: 'Brumeux',
        mist: 'Brume',
        drizzle: 'Bruine',
        sleet: 'Grésil',
        hail: 'Grêle',
      },
    },
  },

  createEvent: {
    fields: {
      description: 'Description',
      people: ' personnes',
      auto: 'Auto',
      autoConfigured: '✅ Configuration automatique',
      availableLanguages: 'Langues disponibles',
      selectLanguages: 'Sélectionner les langues',
      eventName: "Nom de l'événement",
      eventType: "Type d'événement",
      startDate: 'Date de début',
      endDate: 'Date de fin',
      startTime: 'Heure de début',
      endTime: 'Heure de fin',
      location: 'Lieu',
      maxParticipants: 'Participants maximum',
      registrationDeadline: "Date limite d'inscription",
      price: 'Prix',
      visibility: 'Visibilité',
      public: 'Public',
      private: 'Privé',
      membersOnly: 'Membres seulement',
      notes: 'Notes',
      attachments: 'Pièces jointes',
    },
  },

  scoreConfirmation: {
    submittedScore: 'Score soumis',
    submittedBy: 'Score soumis par {{name}}',
    submittedAt: 'Soumis le',
    winner: '🏆 {{name}} gagne',
    walkover: 'Forfait',
    retired: 'Abandon',
    pending: 'En attente',
    confirmed: 'Confirmé',
    disputed: 'Contesté',
    confirmScore: 'Confirmer le score',
    disputeScore: 'Contester le score',
    editScore: 'Modifier le score',
    deleteScore: 'Supprimer le score',
    scoreConfirmed: 'Score confirmé',
    scoreDisputed: 'Score contesté',
    scoreEdited: 'Score modifié',
    scoreDeleted: 'Score supprimé',
    errorConfirming: 'Erreur lors de la confirmation',
    errorDisputing: 'Erreur lors de la contestation',
    errorEditing: 'Erreur lors de la modification',
    errorDeleting: 'Erreur lors de la suppression',
  },

  leagues: {
    admin: {
      unknownUser: 'Utilisateur inconnu',
      applicant: 'Candidat',
      leagueOpenedTitle: '🎭 Ligue ouverte',
      leagueOpenedMessage:
        "La ligue a été ouverte avec succès ! Les membres peuvent maintenant s'inscrire.",
      leagueOpenError:
        "Une erreur s'est produite lors de l'ouverture de la ligue. Veuillez réessayer.",
      leagueClosedTitle: '🔒 Ligue fermée',
      leagueClosedMessage:
        'La ligue a été fermée avec succès. Les inscriptions ne sont plus acceptées.',
      leagueCloseError:
        "Une erreur s'est produite lors de la fermeture de la ligue. Veuillez réessayer.",
      bracketGeneratedTitle: '📊 Bracket généré',
      bracketGeneratedMessage: 'Le bracket du tournoi a été généré avec succès.',
      bracketGenerateError:
        "Une erreur s'est produite lors de la génération du bracket. Veuillez réessayer.",
      participantApproved: 'Participant approuvé',
      participantRejected: 'Participant rejeté',
      errorApprovingParticipant: "Erreur lors de l'approbation du participant",
      errorRejectingParticipant: 'Erreur lors du rejet du participant',
      confirmApproval: "Confirmer l'approbation",
      confirmRejection: 'Confirmer le rejet',
      approvalConfirmed: 'Approbation confirmée',
      rejectionConfirmed: 'Rejet confirmé',
      viewApplications: 'Voir les demandes',
      pendingApplications: 'Demandes en attente',
      approvedParticipants: 'Participants approuvés',
    },
  },

  policyEditScreen: {
    quickInsert: 'Insertion rapide',
    section: 'Section',
    rule: 'Règle',
    notice: 'Avis',
    policyContent: 'Contenu de la politique',
    title: 'Titre',
    content: 'Contenu',
    insertSection: 'Insérer une section',
    insertRule: 'Insérer une règle',
    insertNotice: 'Insérer un avis',
    sectionTitle: 'Titre de la section',
    ruleNumber: 'Numéro de règle',
    ruleText: 'Texte de la règle',
    noticeText: "Texte de l'avis",
    formatting: 'Mise en forme',
    bold: 'Gras',
    italic: 'Italique',
    underline: 'Souligné',
    bulletList: 'Liste à puces',
    numberedList: 'Liste numérotée',
    save: 'Enregistrer',
    cancel: 'Annuler',
  },
};

// Deep merge function
function deepMerge(target, source) {
  const output = { ...target };

  Object.keys(source).forEach(key => {
    if (isObject(source[key]) && isObject(target[key])) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  });

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Count untranslated keys
function countUntranslated(enObj, frObj) {
  let count = 0;

  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], frObj[key] || {});
    } else {
      const enValue = enObj[key];
      const frValue = frObj[key];
      if (!frValue || frValue === enValue) {
        count++;
      }
    }
  }

  return count;
}

// Count keys in nested object
function countKeys(obj) {
  let count = 0;

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }

  return count;
}

console.log('🔄 Starting comprehensive French translation...\n');

// Count before
const beforeCount = countUntranslated(en, fr);
console.log(`📊 Untranslated keys before: ${beforeCount}`);

// Apply translations
const updatedFr = deepMerge(fr, translations);

// Count after
const afterCount = countUntranslated(en, updatedFr);
const translatedCount = beforeCount - afterCount;
const totalNewKeys = countKeys(translations);

console.log(`✅ New translation keys provided: ${totalNewKeys}`);
console.log(`📊 Untranslated keys after: ${afterCount}`);
console.log(`📈 Keys translated this round: ${translatedCount}\n`);

// Save updated French translations
fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2), 'utf8');

console.log('✨ French translation file updated successfully!');
console.log(`📁 File: ${frPath}\n`);

// Show breakdown by top sections
console.log('📋 Translations added by major section:');
Object.keys(translations).forEach(section => {
  const count = countKeys(translations[section]);
  console.log(`   - ${section}: ${count} keys`);
});
