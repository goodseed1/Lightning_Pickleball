#!/usr/bin/env node
/**
 * Complete ALL French Translations
 * Target: 1950+ untranslated keys
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const FR_PATH = path.join(__dirname, '../src/locales/fr.json');

function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function findUntranslated(en, fr, path = '') {
  const untranslated = [];
  for (const key in en) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof en[key] === 'object' && !Array.isArray(en[key])) {
      untranslated.push(...findUntranslated(en[key], fr[key] || {}, currentPath));
    } else if (fr[key] === en[key] || !fr[key]) {
      untranslated.push({ path: currentPath, en: en[key], fr: fr[key] });
    }
  }
  return untranslated;
}

// ========================================
// COMPREHENSIVE FRENCH TRANSLATIONS
// ========================================

const frenchTranslations = {
  // ========================================
  // SERVICES (158 keys)
  // ========================================
  services: {
    matchService: {
      createMatch: 'Créer un match',
      findPartner: 'Trouver un partenaire',
      quickMatch: 'Match rapide',
      scheduledMatch: 'Match planifié',
      cancelMatch: 'Annuler le match',
      confirmMatch: 'Confirmer le match',
      declineMatch: 'Refuser le match',
      rescheduleMatch: 'Reprogrammer le match',
      matchDetails: 'Détails du match',
      matchHistory: 'Historique des matchs',
      upcomingMatches: 'Matchs à venir',
      pastMatches: 'Matchs passés',
      activeMatches: 'Matchs actifs',
      completedMatches: 'Matchs terminés',
      cancelledMatches: 'Matchs annulés',
      pendingMatches: 'Matchs en attente',
      invitePlayer: 'Inviter un joueur',
      acceptInvitation: "Accepter l'invitation",
      declineInvitation: "Refuser l'invitation",
      sendInvitation: 'Envoyer une invitation',
      withdrawInvitation: "Retirer l'invitation",
      noMatchesFound: 'Aucun match trouvé',
      loadingMatches: 'Chargement des matchs...',
      matchCreated: 'Match créé avec succès',
      matchUpdated: 'Match mis à jour',
      matchCancelled: 'Match annulé',
      matchConfirmed: 'Match confirmé',
      error: {
        createFailed: 'Échec de création du match',
        updateFailed: 'Échec de mise à jour',
        cancelFailed: "Échec d'annulation",
        notFound: 'Match non trouvé',
        unauthorized: 'Non autorisé',
        alreadyBooked: 'Déjà réservé',
        invalidDate: 'Date invalide',
        invalidTime: 'Heure invalide',
      },
    },

    rankingService: {
      calculateRanking: 'Calculer le classement',
      updateRanking: 'Mettre à jour le classement',
      rankingHistory: 'Historique du classement',
      currentRanking: 'Classement actuel',
      globalRanking: 'Classement mondial',
      localRanking: 'Classement local',
      clubRanking: 'Classement du club',
      leagueRanking: 'Classement de la ligue',
      skillRating: 'Évaluation de compétence',
      eloRating: 'Classement ELO',
      ltrRating: 'Classement LTR',
      winRate: 'Taux de victoire',
      totalMatches: 'Total de matchs',
      recentForm: 'Forme récente',
      rankingPoints: 'Points de classement',
      tierLevel: 'Niveau de rang',
      divisionLevel: 'Niveau de division',
      promotionZone: 'Zone de promotion',
      relegationZone: 'Zone de relégation',
      error: {
        calculationFailed: 'Échec du calcul',
        updateFailed: 'Échec de mise à jour',
        insufficientData: 'Données insuffisantes',
        invalidRating: 'Évaluation invalide',
      },
    },

    clubService: {
      createClub: 'Créer un club',
      joinClub: 'Rejoindre le club',
      leaveClub: 'Quitter le club',
      manageClub: 'Gérer le club',
      clubMembers: 'Membres du club',
      clubEvents: 'Événements du club',
      clubSettings: 'Paramètres du club',
      clubPolicy: 'Politique du club',
      clubRules: 'Règles du club',
      clubFees: 'Frais du club',
      clubDues: 'Cotisations du club',
      membershipStatus: "Statut d'adhésion",
      pendingApproval: "En attente d'approbation",
      approveRequest: 'Approuver la demande',
      rejectRequest: 'Rejeter la demande',
      inviteMember: 'Inviter un membre',
      removeMember: 'Retirer un membre',
      assignRole: 'Attribuer un rôle',
      transferOwnership: 'Transférer la propriété',
      dissolveClub: 'Dissoudre le club',
      error: {
        createFailed: 'Échec de création du club',
        joinFailed: "Échec d'adhésion",
        leaveFailed: 'Échec de sortie',
        notMember: 'Pas membre',
        alreadyMember: 'Déjà membre',
        unauthorized: 'Non autorisé',
        clubFull: 'Club complet',
        clubNotFound: 'Club non trouvé',
      },
    },

    notificationService: {
      sendNotification: 'Envoyer une notification',
      pushNotification: 'Notification push',
      emailNotification: 'Notification par e-mail',
      smsNotification: 'Notification SMS',
      inAppNotification: "Notification dans l'app",
      notificationSettings: 'Paramètres de notification',
      enableNotifications: 'Activer les notifications',
      disableNotifications: 'Désactiver les notifications',
      muteNotifications: 'Désactiver le son',
      unmuteNotifications: 'Activer le son',
      markAsRead: 'Marquer comme lu',
      markAllAsRead: 'Tout marquer comme lu',
      deleteNotification: 'Supprimer la notification',
      clearAll: 'Tout effacer',
      notificationTypes: {
        matchInvite: 'Invitation au match',
        matchConfirm: 'Confirmation de match',
        matchReminder: 'Rappel de match',
        clubInvite: 'Invitation au club',
        eventReminder: "Rappel d'événement",
        message: 'Message',
        announcement: 'Annonce',
        systemUpdate: 'Mise à jour système',
      },
      error: {
        sendFailed: "Échec d'envoi",
        permissionDenied: 'Permission refusée',
        deviceNotRegistered: 'Appareil non enregistré',
      },
    },

    userService: {
      updateProfile: 'Mettre à jour le profil',
      uploadPhoto: 'Télécharger une photo',
      changePassword: 'Changer le mot de passe',
      changeEmail: "Changer l'e-mail",
      deleteAccount: 'Supprimer le compte',
      deactivateAccount: 'Désactiver le compte',
      reactivateAccount: 'Réactiver le compte',
      verifyEmail: "Vérifier l'e-mail",
      verifyPhone: 'Vérifier le téléphone',
      updatePreferences: 'Mettre à jour les préférences',
      updatePrivacy: 'Mettre à jour la confidentialité',
      blockUser: "Bloquer l'utilisateur",
      unblockUser: "Débloquer l'utilisateur",
      reportUser: "Signaler l'utilisateur",
      error: {
        updateFailed: 'Échec de mise à jour',
        uploadFailed: 'Échec de téléchargement',
        invalidEmail: 'E-mail invalide',
        invalidPhone: 'Téléphone invalide',
        weakPassword: 'Mot de passe faible',
        emailTaken: 'E-mail déjà utilisé',
        phoneTaken: 'Téléphone déjà utilisé',
      },
    },

    paymentService: {
      processPayment: 'Traiter le paiement',
      refundPayment: 'Rembourser le paiement',
      cancelPayment: 'Annuler le paiement',
      paymentHistory: 'Historique des paiements',
      paymentMethods: 'Modes de paiement',
      addPaymentMethod: 'Ajouter un mode de paiement',
      removePaymentMethod: 'Retirer le mode de paiement',
      defaultPaymentMethod: 'Mode de paiement par défaut',
      paymentStatus: {
        pending: 'En attente',
        processing: 'En cours',
        completed: 'Terminé',
        failed: 'Échoué',
        cancelled: 'Annulé',
        refunded: 'Remboursé',
      },
      error: {
        paymentFailed: 'Échec du paiement',
        refundFailed: 'Échec du remboursement',
        insufficientFunds: 'Fonds insuffisants',
        cardDeclined: 'Carte refusée',
        invalidCard: 'Carte invalide',
        expiredCard: 'Carte expirée',
      },
    },
  },

  // ========================================
  // LEAGUE DETAIL (147 keys)
  // ========================================
  leagueDetail: {
    title: 'Détails de la ligue',
    overview: "Vue d'ensemble",
    standings: 'Classement',
    schedule: 'Calendrier',
    matches: 'Matchs',
    players: 'Joueurs',
    rules: 'Règles',
    statistics: 'Statistiques',
    settings: 'Paramètres',

    // League Information
    leagueInfo: {
      name: 'Nom de la ligue',
      description: 'Description',
      type: 'Type de ligue',
      format: 'Format',
      level: 'Niveau',
      season: 'Saison',
      division: 'Division',
      conference: 'Conférence',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      registrationOpen: 'Inscriptions ouvertes',
      registrationClose: 'Inscriptions fermées',
      registrationDeadline: "Date limite d'inscription",
      maxParticipants: 'Participants maximum',
      currentParticipants: 'Participants actuels',
      minParticipants: 'Participants minimum',
      waitlistAvailable: "Liste d'attente disponible",
      entryFee: "Frais d'entrée",
      prizeMoney: 'Prix en argent',
      sponsors: 'Sponsors',
      organizer: 'Organisateur',
      contactInfo: 'Coordonnées',
    },

    // League Types
    types: {
      singles: 'Simple',
      doubles: 'Double',
      mixed: 'Mixte',
      team: 'Équipe',
      individual: 'Individuel',
      roundRobin: 'Round-robin',
      knockout: 'Élimination directe',
      ladder: 'Échelle',
      pyramid: 'Pyramide',
      swiss: 'Système suisse',
    },

    // Standings Table
    standings: {
      rank: 'Rang',
      player: 'Joueur',
      team: 'Équipe',
      played: 'Joués',
      won: 'Gagnés',
      lost: 'Perdus',
      tied: 'Nuls',
      points: 'Points',
      setsWon: 'Sets gagnés',
      setsLost: 'Sets perdus',
      setsDiff: 'Diff. de sets',
      gamesWon: 'Jeux gagnés',
      gamesLost: 'Jeux perdus',
      gamesDiff: 'Diff. de jeux',
      winRate: 'Taux de victoire',
      form: 'Forme',
      streak: 'Série',
      lastFive: 'Cinq derniers',
      homeRecord: 'Bilan domicile',
      awayRecord: 'Bilan extérieur',
      vsTopTen: 'Contre top 10',
      headToHead: 'Face-à-face',
    },

    // Schedule
    schedule: {
      upcoming: 'À venir',
      today: "Aujourd'hui",
      thisWeek: 'Cette semaine',
      thisMonth: 'Ce mois',
      allMatches: 'Tous les matchs',
      byRound: 'Par tour',
      byDate: 'Par date',
      byVenue: 'Par lieu',
      round: 'Tour',
      week: 'Semaine',
      matchday: 'Jour de match',
      postponed: 'Reporté',
      rescheduled: 'Reprogrammé',
      cancelled: 'Annulé',
      walkover: 'Forfait',
      noShow: 'Absence',
      courtAssignment: 'Attribution de court',
      timeSlot: 'Créneau horaire',
    },

    // Players/Teams
    participants: {
      all: 'Tous',
      active: 'Actifs',
      inactive: 'Inactifs',
      qualified: 'Qualifiés',
      eliminated: 'Éliminés',
      retired: 'Retirés',
      suspended: 'Suspendus',
      roster: 'Liste',
      lineup: 'Composition',
      substitutes: 'Remplaçants',
      captain: 'Capitaine',
      coachInfo: 'Info entraîneur',
      playerStats: 'Stats joueur',
      teamStats: 'Stats équipe',
    },

    // Actions
    actions: {
      join: 'Rejoindre',
      leave: 'Quitter',
      register: "S'inscrire",
      withdraw: 'Se retirer',
      joinWaitlist: "Rejoindre la liste d'attente",
      leaveWaitlist: "Quitter la liste d'attente",
      viewSchedule: 'Voir le calendrier',
      viewStandings: 'Voir le classement',
      viewRules: 'Voir les règles',
      viewStats: 'Voir les stats',
      reportScore: 'Signaler le score',
      confirmScore: 'Confirmer le score',
      disputeScore: 'Contester le score',
      shareLeague: 'Partager la ligue',
      inviteFriend: 'Inviter un ami',
      exportSchedule: 'Exporter le calendrier',
      printSchedule: 'Imprimer le calendrier',
      downloadRules: 'Télécharger les règles',
    },

    // Messages
    messages: {
      joinSuccess: 'Inscription réussie à la ligue',
      joinFailed: "Échec d'inscription",
      leaveSuccess: 'Vous avez quitté la ligue',
      leaveFailed: 'Échec de sortie',
      leagueFull: "Ligue complète - rejoignez la liste d'attente",
      registrationClosed: 'Les inscriptions sont fermées',
      registrationOpen: 'Les inscriptions sont ouvertes',
      waitlistJoined: "Ajouté à la liste d'attente",
      scoreReported: 'Score signalé avec succès',
      scoreConfirmed: 'Score confirmé',
      scoreDisputed: 'Score contesté - examen en cours',
      invalidScore: 'Score invalide',
      unauthorized: 'Non autorisé',
      notRegistered: 'Non inscrit à cette ligue',
      alreadyRegistered: 'Déjà inscrit',
    },

    // Statistics
    stats: {
      overview: "Vue d'ensemble",
      leaderboard: 'Classement',
      records: 'Records',
      achievements: 'Réalisations',
      totalMatches: 'Total de matchs',
      completedMatches: 'Matchs terminés',
      upcomingMatches: 'Matchs à venir',
      averageScore: 'Score moyen',
      highestScore: 'Score le plus élevé',
      lowestScore: 'Score le plus bas',
      longestMatch: 'Match le plus long',
      shortestMatch: 'Match le plus court',
      mostWins: 'Plus de victoires',
      mostLosses: 'Plus de défaites',
      winningStreak: 'Série de victoires',
      losingStreak: 'Série de défaites',
      comebackWins: 'Victoires en retournement',
      dominantWins: 'Victoires dominantes',
    },
  },

  // ========================================
  // DUES MANAGEMENT (107 keys)
  // ========================================
  duesManagement: {
    title: 'Gestion des cotisations',
    overview: "Vue d'ensemble",
    members: 'Membres',
    payments: 'Paiements',
    history: 'Historique',
    settings: 'Paramètres',
    reports: 'Rapports',

    // Dues Types
    types: {
      monthly: 'Mensuel',
      quarterly: 'Trimestriel',
      semiAnnual: 'Semestriel',
      annual: 'Annuel',
      oneTime: 'Unique',
      custom: 'Personnalisé',
      recurring: 'Récurrent',
      variable: 'Variable',
    },

    // Status
    status: {
      current: 'À jour',
      paid: 'Payé',
      pending: 'En attente',
      overdue: 'En retard',
      partial: 'Partiel',
      cancelled: 'Annulé',
      refunded: 'Remboursé',
      waived: 'Dispensé',
      deferred: 'Différé',
    },

    // Actions
    actions: {
      pay: 'Payer',
      record: 'Enregistrer',
      refund: 'Rembourser',
      cancel: 'Annuler',
      waive: 'Dispenser',
      defer: 'Différer',
      remind: 'Rappeler',
      autoRemind: 'Rappel automatique',
      export: 'Exporter',
      import: 'Importer',
      print: 'Imprimer',
      download: 'Télécharger',
      sendReceipt: 'Envoyer le reçu',
      viewReceipt: 'Voir le reçu',
      editDues: 'Modifier les cotisations',
      deleteDues: 'Supprimer les cotisations',
      bulkUpdate: 'Mise à jour groupée',
      bulkRemind: 'Rappel groupé',
    },

    // Fields
    amount: 'Montant',
    baseAmount: 'Montant de base',
    discount: 'Remise',
    penalty: 'Pénalité',
    lateFee: 'Frais de retard',
    totalAmount: 'Montant total',
    amountPaid: 'Montant payé',
    amountDue: 'Montant dû',
    balance: 'Solde',
    dueDate: "Date d'échéance",
    paidDate: 'Date de paiement',
    paymentMethod: 'Mode de paiement',
    paymentReference: 'Référence de paiement',
    transactionId: 'ID de transaction',
    description: 'Description',
    notes: 'Notes',
    category: 'Catégorie',
    period: 'Période',
    billingCycle: 'Cycle de facturation',
    nextDueDate: 'Prochaine échéance',
    autoRenew: 'Renouvellement auto',

    // Payment Methods
    paymentMethods: {
      cash: 'Espèces',
      check: 'Chèque',
      card: 'Carte',
      creditCard: 'Carte de crédit',
      debitCard: 'Carte de débit',
      bankTransfer: 'Virement bancaire',
      paypal: 'PayPal',
      venmo: 'Venmo',
      stripe: 'Stripe',
      other: 'Autre',
    },

    // Messages
    messages: {
      paymentSuccess: 'Paiement effectué avec succès',
      paymentFailed: 'Échec du paiement',
      paymentRecorded: 'Paiement enregistré',
      reminderSent: 'Rappel envoyé avec succès',
      bulkReminderSent: 'Rappels groupés envoyés',
      duesCreated: 'Cotisations créées',
      duesUpdated: 'Cotisations mises à jour',
      duesDeleted: 'Cotisations supprimées',
      refundProcessed: 'Remboursement traité',
      duesWaived: 'Cotisations dispensées',
      duesDeferred: 'Cotisations différées',
      exportComplete: 'Exportation terminée',
      importComplete: 'Importation terminée',
      receiptSent: 'Reçu envoyé',
      confirmDelete: 'Confirmer la suppression?',
      confirmWaive: 'Confirmer la dispense?',
      confirmRefund: 'Confirmer le remboursement?',
    },

    // Filters
    filters: {
      all: 'Tous',
      paid: 'Payés',
      unpaid: 'Non payés',
      overdue: 'En retard',
      partial: 'Partiels',
      today: "Aujourd'hui",
      thisWeek: 'Cette semaine',
      thisMonth: 'Ce mois',
      thisQuarter: 'Ce trimestre',
      thisYear: 'Cette année',
      lastMonth: 'Mois dernier',
      lastQuarter: 'Trimestre dernier',
      lastYear: 'Année dernière',
      custom: 'Personnalisé',
    },

    // Statistics
    stats: {
      totalDues: 'Total des cotisations',
      totalCollected: 'Total collecté',
      totalPending: 'Total en attente',
      totalOverdue: 'Total en retard',
      collectionRate: 'Taux de collecte',
      averagePayment: 'Paiement moyen',
      totalMembers: 'Total de membres',
      activeMembers: 'Membres actifs',
      delinquentMembers: 'Membres en retard',
      paymentTrend: 'Tendance de paiement',
      monthlyRevenue: 'Revenu mensuel',
      projectedRevenue: 'Revenu projeté',
    },

    // Reports
    reports: {
      summary: 'Résumé',
      detailed: 'Détaillé',
      byMember: 'Par membre',
      byPeriod: 'Par période',
      byStatus: 'Par statut',
      aging: 'Âge de la dette',
      forecast: 'Prévision',
      comparison: 'Comparaison',
    },
  },

  // ========================================
  // CREATE EVENT (78 keys)
  // ========================================
  createEvent: {
    title: 'Créer un événement',
    editTitle: "Modifier l'événement",
    stepBasicInfo: 'Informations de base',
    stepDateTime: 'Date et heure',
    stepLocation: 'Lieu',
    stepParticipants: 'Participants',
    stepAdvanced: 'Avancé',

    // Event Types
    types: {
      match: 'Match',
      tournament: 'Tournoi',
      league: 'Ligue',
      practice: 'Entraînement',
      clinic: 'Clinique',
      workshop: 'Atelier',
      social: 'Social',
      meeting: 'Réunion',
      fundraiser: 'Collecte de fonds',
      charity: 'Charité',
      exhibition: 'Exhibition',
      other: 'Autre',
    },

    // Form Fields
    eventName: "Nom de l'événement",
    eventType: "Type d'événement",
    description: 'Description',
    shortDescription: 'Description courte',
    fullDescription: 'Description complète',
    location: 'Lieu',
    venue: 'Salle',
    address: 'Adresse',
    city: 'Ville',
    state: 'État',
    zipCode: 'Code postal',
    country: 'Pays',
    date: 'Date',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    time: 'Heure',
    startTime: 'Heure de début',
    endTime: 'Heure de fin',
    duration: 'Durée',
    timezone: 'Fuseau horaire',
    repeatEvent: "Répéter l'événement",
    repeatFrequency: 'Fréquence de répétition',
    repeatUntil: "Répéter jusqu'au",

    // Participants
    maxParticipants: 'Participants maximum',
    minParticipants: 'Participants minimum',
    currentParticipants: 'Participants actuels',
    waitlistEnabled: "Liste d'attente activée",
    waitlistSize: "Taille de la liste d'attente",
    registrationDeadline: "Date limite d'inscription",
    earlyBirdDeadline: 'Date limite early bird',
    lateRegistration: 'Inscription tardive',

    // Advanced Settings
    isPublic: 'Public',
    isPrivate: 'Privé',
    requiresApproval: 'Nécessite une approbation',
    allowGuests: 'Autoriser les invités',
    guestLimit: "Limite d'invités",
    ageRestriction: "Restriction d'âge",
    skillLevel: 'Niveau de compétence',
    cost: 'Coût',
    free: 'Gratuit',
    costPerPerson: 'Coût par personne',
    memberCost: 'Coût membre',
    nonMemberCost: 'Coût non-membre',
    earlyBirdCost: 'Coût early bird',
    refundPolicy: 'Politique de remboursement',
    cancellationPolicy: "Politique d'annulation",
    equipment: 'Équipement',
    equipmentProvided: 'Équipement fourni',
    equipmentRequired: 'Équipement requis',
    dresscode: 'Code vestimentaire',
    parking: 'Stationnement',
    accessibility: 'Accessibilité',
    contactPerson: 'Personne de contact',
    contactEmail: 'E-mail de contact',
    contactPhone: 'Téléphone de contact',

    // Placeholders
    placeholders: {
      eventName: "Entrez le nom de l'événement",
      description: 'Décrivez votre événement...',
      location: 'Entrez le lieu',
      address: 'Adresse complète',
      maxParticipants: 'Nombre de participants',
      cost: 'Coût par personne (optionnel)',
      contactEmail: 'email@example.com',
      contactPhone: '+1 (555) 123-4567',
    },

    // Validation
    validation: {
      nameRequired: 'Le nom est requis',
      nameTooShort: 'Le nom est trop court',
      nameTooLong: 'Le nom est trop long',
      typeRequired: 'Le type est requis',
      descriptionRequired: 'La description est requise',
      locationRequired: 'Le lieu est requis',
      dateRequired: 'La date est requise',
      timeRequired: "L'heure est requise",
      invalidDate: 'Date invalide',
      pastDate: 'La date ne peut pas être dans le passé',
      invalidTime: 'Heure invalide',
      endBeforeStart: 'La fin doit être après le début',
      maxParticipantsInvalid: 'Le nombre maximum doit être supérieur à 0',
      minGreaterThanMax: 'Le minimum ne peut pas dépasser le maximum',
      invalidCost: 'Coût invalide',
      invalidEmail: 'E-mail invalide',
      invalidPhone: 'Téléphone invalide',
      waitlistSizeInvalid: "Taille de liste d'attente invalide",
      ageRestrictionInvalid: "Restriction d'âge invalide",
    },

    // Actions
    create: "Créer l'événement",
    update: "Mettre à jour l'événement",
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: "Supprimer l'événement",
    duplicate: "Dupliquer l'événement",
    preview: 'Aperçu',
    publish: 'Publier',
    unpublish: 'Dépublier',
    saveAsDraft: 'Enregistrer comme brouillon',

    // Messages
    messages: {
      createSuccess: 'Événement créé avec succès',
      createFailed: "Échec de création de l'événement",
      updateSuccess: 'Événement mis à jour avec succès',
      updateFailed: 'Échec de mise à jour',
      deleteSuccess: 'Événement supprimé avec succès',
      deleteFailed: 'Échec de suppression',
      publishSuccess: 'Événement publié',
      unpublishSuccess: 'Événement dépublié',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet événement?',
      confirmCancel:
        'Êtes-vous sûr de vouloir annuler? Les modifications non enregistrées seront perdues.',
      unsavedChanges: 'Vous avez des modifications non enregistrées',
      duplicateSuccess: 'Événement dupliqué avec succès',
    },
  },

  // ========================================
  // TYPES (64 keys)
  // ========================================
  types: {
    // User Types
    user: {
      player: 'Joueur',
      coach: 'Entraîneur',
      admin: 'Administrateur',
      moderator: 'Modérateur',
      member: 'Membre',
      guest: 'Invité',
      owner: 'Propriétaire',
      organizer: 'Organisateur',
      volunteer: 'Bénévole',
      sponsor: 'Sponsor',
    },

    // Match Types
    match: {
      singles: 'Simple',
      doubles: 'Double',
      mixed: 'Mixte',
      practice: 'Entraînement',
      casual: 'Décontracté',
      competitive: 'Compétitif',
      friendly: 'Amical',
      ranked: 'Classé',
      unranked: 'Non classé',
      exhibition: 'Exhibition',
    },

    // Tournament Types
    tournament: {
      singleElimination: 'Élimination directe',
      doubleElimination: 'Double élimination',
      roundRobin: 'Round-robin',
      swiss: 'Système suisse',
      ladder: 'Échelle',
      pyramid: 'Pyramide',
      knockout: 'Knockout',
      groupStage: 'Phase de groupes',
      playoffs: 'Éliminatoires',
      championship: 'Championnat',
    },

    // Skill Levels
    skillLevel: {
      beginner: 'Débutant',
      novice: 'Novice',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      expert: 'Expert',
      professional: 'Professionnel',
      worldClass: 'Classe mondiale',
      recreational: 'Récréatif',
      competitive: 'Compétitif',
      elite: 'Élite',
    },

    // Court Types
    court: {
      hard: 'Dur',
      clay: 'Terre battue',
      grass: 'Gazon',
      carpet: 'Moquette',
      indoor: 'Intérieur',
      outdoor: 'Extérieur',
      synthetic: 'Synthétique',
      concrete: 'Béton',
      acrylic: 'Acrylique',
      cushioned: 'Amorti',
    },

    // Payment Types
    payment: {
      cash: 'Espèces',
      card: 'Carte',
      creditCard: 'Carte de crédit',
      debitCard: 'Carte de débit',
      transfer: 'Virement',
      bankTransfer: 'Virement bancaire',
      paypal: 'PayPal',
      venmo: 'Venmo',
      stripe: 'Stripe',
      free: 'Gratuit',
      check: 'Chèque',
      other: 'Autre',
    },

    // Event Status
    eventStatus: {
      draft: 'Brouillon',
      published: 'Publié',
      cancelled: 'Annulé',
      postponed: 'Reporté',
      completed: 'Terminé',
      ongoing: 'En cours',
      upcoming: 'À venir',
      past: 'Passé',
    },
  },
};

// Main execution
console.log('🔍 Analyzing translation files...\n');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));

const beforeCount = findUntranslated(en, fr).length;
console.log(`📊 Before: ${beforeCount} untranslated keys\n`);

console.log('🚀 Applying French translations...\n');

const updated = deepMerge(fr, frenchTranslations);
fs.writeFileSync(FR_PATH, JSON.stringify(updated, null, 2), 'utf8');

const afterCount = findUntranslated(en, updated).length;
const translated = beforeCount - afterCount;

console.log('✅ Translation complete!');
console.log(`   Translated: ${translated} keys`);
console.log(`   Remaining: ${afterCount} keys`);
console.log(`   Progress: ${((translated / beforeCount) * 100).toFixed(1)}%\n`);

if (afterCount > 0) {
  const afterUntranslated = findUntranslated(en, updated);
  const afterSections = {};
  afterUntranslated.forEach(item => {
    const section = item.path.split('.')[0];
    if (!afterSections[section]) afterSections[section] = [];
    afterSections[section].push(item);
  });

  console.log('🔄 Top 10 remaining sections:');
  Object.entries(afterSections)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .forEach(([section, items]) => {
      console.log(`   ${section}: ${items.length} keys`);
    });
}

console.log('\n✨ Done!\n');
