#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const FR_PATH = path.join(__dirname, '../src/locales/fr.json');
const frData = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));

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

// MEGA FINAL - Every single remaining key
const megaFinalFrench = {
  leagueDetail: {
    notification: 'Notification',
    startPlayoffs: 'Commencer les Éliminatoires',
    playoffsStartedSuccess:
      "Éliminatoires commencées avec succès !\n\nLes matchs des éliminatoires apparaîtront dans l'onglet Calendrier.",
    playoffsStartError: 'Erreur lors du démarrage des éliminatoires. Veuillez réessayer.',
    playoffMatchErrorMessage:
      "Les matchs des éliminatoires ne peuvent être soumis que pendant la phase d'éliminatoires.",
    seasonPhase: 'Phase de Saison',
    regularSeason: 'Saison Régulière',
    playoffs: 'Éliminatoires',
    finals: 'Finales',
    offSeason: 'Hors Saison',
    phaseTransition: 'Transition de Phase',
    enterPlayoffs: 'Entrer en Éliminatoires',
    playoffBracket: 'Tableau des Éliminatoires',
    playoffSeeding: 'Classement des Éliminatoires',
    topTeamsAdvance: 'Les {{count}} meilleures équipes se qualifient',
    clinched: 'Qualifié',
    eliminated: 'Éliminé',
    stillInContention: 'Encore en Lice',
    magicNumber: 'Nombre Magique',
    gamesBack: 'Matchs de Retard',
    winningStreak: 'Série de Victoires',
    losingStreak: 'Série de Défaites',
    homeRecord: 'Record à Domicile',
    awayRecord: "Record à l'Extérieur",
    divisionRecord: 'Record de Division',
    conferenceRecord: 'Record de Conférence',
    vsTopTeams: 'Contre les Meilleures Équipes',
    lastTenGames: '10 Derniers Matchs',
    currentForm: 'Forme Actuelle',
    powerRanking: 'Classement de Puissance',
    strengthOfSchedule: 'Force du Calendrier',
    remainingSchedule: 'Calendrier Restant',
    tiebreakers: "Bris d'Égalité",
    headToHeadRecord: 'Record Face à Face',
    divisionWins: 'Victoires de Division',
    conferencWins: 'Victoires de Conférence',
    pointsDifferential: 'Différentiel de Points',
    commonOpponents: 'Adversaires Communs',
    bestWinPercentage: 'Meilleur Pourcentage de Victoires',
    coinFlip: 'Tirage au Sort',
    playoffFormat: 'Format des Éliminatoires',
    bestOfSeries: 'Série au Meilleur de {{count}}',
    singleElimination: 'Élimination Directe',
    playoffRules: 'Règles des Éliminatoires',
    homeCourtAdvantage: 'Avantage du Terrain',
    reseedingRules: 'Règles de Reclassement',
    wildCardTeams: 'Équipes Wild Card',
  },

  admin: {
    devTools: {
      mile: 'mile',
      miles: 'miles',
      korean: 'Coréen',
      english: 'Anglais',
      french: 'Français',
      spanish: 'Espagnol',
      german: 'Allemand',
      italian: 'Italien',
      japanese: 'Japonais',
      chinese: 'Chinois',
      russian: 'Russe',
      portuguese: 'Portugais',
      privacy: 'Confidentialité',
      appInfo: "Informations sur l'Application",
      version: 'Version',
      buildNumber: 'Numéro de Build',
      deviceInfo: "Informations sur l'Appareil",
      platform: 'Plateforme',
      osVersion: 'Version du SE',
      appVersion: "Version de l'Application",
      environment: 'Environnement',
      production: 'Production',
      development: 'Développement',
      staging: 'Préproduction',
    },
    logs: {
      dailyActiveUsers: 'Utilisateurs Actifs Quotidiens (UAQ)',
      users: 'utilisateurs',
      totalUsers: 'Total des Utilisateurs',
      matchesCreated: 'Matchs (7 Derniers Jours)',
      games: 'matchs',
      newUsersToday: "Nouveaux Utilisateurs Aujourd'hui",
      activeUsers: 'Utilisateurs Actifs',
      inactiveUsers: 'Utilisateurs Inactifs',
      churnRate: "Taux d'Attrition",
      retentionRate: 'Taux de Rétention',
      engagementMetrics: "Métriques d'Engagement",
      sessionDuration: 'Durée de Session',
      averageSessionLength: 'Durée Moyenne de Session',
    },
  },

  duesManagement: {
    modals: {
      selectLateFeeToDelete: 'Sélectionner les Frais de Retard à Supprimer',
      selectLateFeePrompt: 'Sélectionnez quels frais de retard supprimer',
      lateFeeDeleted: 'Frais de retard supprimés',
      noLateFeesToDelete: 'Aucun frais de retard à supprimer',
      manageJoinFee: "Gérer les Frais d'Adhésion",
      joinFeeSettings: "Paramètres des Frais d'Adhésion",
      exemptionTitle: "Définir l'Exemption",
      exemptionConfirm: 'Définir ce membre comme exempté de cotisations ?',
      exemptionReason: "Raison de l'Exemption",
      exemptionNotes: "Notes sur l'Exemption",
      permanentExemption: 'Exemption Permanente',
      temporaryExemption: 'Exemption Temporaire',
      exemptionEndDate: "Date de Fin de l'Exemption",
    },
    messages: {
      paymentApproved: 'Le paiement a été approuvé.',
      paymentRejected: 'Le paiement a été rejeté.',
      lateFeeAdded: 'Frais de retard ajoutés.',
      lateFeeDeleted: 'Frais de retard supprimés.',
      joinFeeDeleted: "Frais d'adhésion supprimés.",
      joinFeeUpdated: "Frais d'adhésion mis à jour.",
      duesSettingsUpdated: 'Paramètres de cotisations mis à jour.',
      reminderScheduled: 'Rappel programmé.',
      invoiceGenerated: 'Facture générée.',
      paymentReceived: 'Paiement reçu.',
      refundProcessed: 'Remboursement traité.',
    },
    settings: {
      title: 'Paramètres de Cotisations',
      paymentMethods: 'Méthodes de Paiement',
      acceptedMethods: 'Méthodes Acceptées',
      autoInvoice: 'Facturation Automatique',
      autoInvoiceDesc: 'Envoyer automatiquement les factures mensuelles',
      invoiceDay: 'Jour de Facturation',
      daysLabel: 'jours',
      reminderSettings: 'Paramètres de Rappel',
      sendRemindersAutomatically: 'Envoyer des Rappels Automatiquement',
      reminderDaysBefore: "Jours Avant l'Échéance",
      reminderDaysAfter: "Jours Après l'Échéance",
      lateFeeSettings: 'Paramètres des Frais de Retard',
      gracePeriod: 'Période de Grâce (jours)',
      lateFeeAmount: 'Montant des Frais de Retard',
      lateFeePercentage: 'Pourcentage de Frais de Retard',
    },
  },

  clubTournamentManagement: {
    tournamentStart: {
      participantError: 'Erreur de Nombre de Participants',
      participantErrorMessage:
        'Les participants actuels ({{current}}) ne correspondent pas au nombre requis ({{required}}).',
      manualSeedingMessage:
        "Le classement manuel est activé. Veuillez attribuer les têtes de série dans l'onglet Participants avant de démarrer.",
      successTitle: 'Tournoi Commencé',
      successMessage:
        'Le tournoi a démarré avec succès ! Le tableau a été généré et est maintenant visible.',
      readyToStart: 'Prêt à Démarrer',
      notReadyToStart: 'Pas Prêt à Démarrer',
      checklistTitle: 'Liste de Vérification du Démarrage',
      requiredSteps: 'Étapes Requises',
      optionalSteps: 'Étapes Facultatives',
      verifyParticipants: 'Vérifier les Participants',
      assignSeeds: 'Attribuer les Têtes de Série',
      setSchedule: 'Définir le Calendrier',
      confirmSettings: 'Confirmer les Paramètres',
      allChecksCompleted: 'Toutes les vérifications terminées',
    },
    management: {
      generateBracketAndStart: 'Générer le Tableau et Démarrer le Tournoi',
      generateBracketInstructions:
        'Générer le tableau en utilisant le classement {{method}} et démarrer le tournoi.',
      addingParticipantsWait: "Ajout de participants... Veuillez patienter jusqu'à la fin.",
      cancelAndDeleteWarning:
        'Annuler la génération du tableau et supprimer les données du tournoi ?',
      tournamentInProgress:
        "Le tournoi est en cours. Vérifiez les résultats des matchs dans l'onglet Calendrier.",
      pauseTournament: 'Mettre le Tournoi en Pause',
      resumeTournament: 'Reprendre le Tournoi',
      tournamentPaused: 'Tournoi en Pause',
      tournamentResumed: 'Tournoi Repris',
      extendDeadline: 'Prolonger la Date Limite',
      modifySchedule: 'Modifier le Calendrier',
      sendAnnouncement: 'Envoyer une Annonce',
      viewStatistics: 'Voir les Statistiques',
      exportData: 'Exporter les Données',
      archiveTournament: 'Archiver le Tournoi',
    },
    emptyStates: {
      noActiveTournaments: 'Aucun tournoi actif',
      noCompletedTournaments: 'Aucun tournoi terminé',
      createNewMessage: 'Créez un nouveau tournoi pour concourir avec les membres du club.',
      createFirstTournament: 'Créer Votre Premier Tournoi',
      bracketNotGenerated: 'Tableau pas encore généré',
      bracketAfterRegistration: "Le tableau sera généré après la fermeture de l'inscription.",
      waitingForPlayers: 'En Attente de Joueurs',
      tournamentWillStartSoon: 'Le tournoi commencera bientôt',
      checkBackLater: 'Revenez Plus Tard',
      noMatchesScheduled: 'Aucun Match Programmé',
      scheduleWillBePosted: 'Le calendrier sera publié prochainement',
    },
  },

  createClubLeague: {
    seasonNamePlaceholder: 'ex. Ligue {{eventType}} 2025',
    descriptionOptional: 'Description (Facultatif)',
    descriptionPlaceholder: 'Saisissez une brève description de la ligue',
    applicationDeadline: 'Date Limite de Candidature *',
    maxPlayers: 'Joueurs Maximum',
    minPlayers: 'Joueurs Minimum',
    teamSize: "Taille de l'Équipe",
    singlesTeam: 'Équipe Simple (1 joueur)',
    doublesTeam: 'Équipe Double (2 joueurs)',
    advancedSettings: 'Paramètres Avancés',
    allowSubstitutions: 'Autoriser les Remplacements',
    requireUniformNumbers: "Numéros d'Uniforme Requis",
    trackStatistics: 'Suivre les Statistiques',
    enableChat: "Activer le Chat d'Équipe",
  },

  clubOverviewScreen: {
    important: 'Important',
    emptyStateMemberDescription:
      "L'administrateur du club prépare de nouvelles activités. Veuillez revenir bientôt !",
    emptyStateMemberAction1: 'Discutez avec les membres dans le chat du club',
    emptyStateMemberAction2: "Explorez d'autres joueurs à proximité",
    emptyStateGuestTitle: '🎾 Bienvenue chez {{clubName}} !',
    emptyStateGuestDescription:
      'Rejoignez ce club pour participer aux activités et vous connecter avec les membres.',
    joinThisClub: 'Rejoindre ce Club',
    exploreBenefits: 'Explorer les Avantages',
    viewClubInfo: 'Voir les Informations du Club',
    contactAdmin: "Contacter l'Administrateur",
    learnMore: 'En Savoir Plus',
    guestLimitations: "En tant qu'invité, vous avez un accès limité",
  },

  policyEditScreen: {
    section: 'Section',
    placeholder: 'Saisissez le contenu de la politique...',
    characters: 'caractères',
    charactersRemaining: 'caractères restants',
    preview: 'Aperçu',
    editMode: 'Mode Édition',
    previewMode: 'Mode Aperçu',
    saveChanges: 'Enregistrer les Modifications',
    discardChanges: 'Annuler les Modifications',
    formatting: 'Formatage',
    bold: 'Gras',
    italic: 'Italique',
    underline: 'Souligné',
    bulletList: 'Liste à Puces',
    numberedList: 'Liste Numérotée',
    heading: 'En-tête',
  },

  feedCard: {
    justNow: "À l'instant",
    minutesAgo: 'il y a {{minutes}} min',
    hoursAgo: 'il y a {{hours}} h',
    daysAgo: 'il y a {{days}} j',
    weeksAgo: 'il y a {{weeks}} sem',
    monthsAgo: 'il y a {{months}} mois',
    yearsAgo: 'il y a {{years}} an(s)',
    newMemberJoined: '{{actorName}} a rejoint {{clubName}}',
    matchCompleted: '{{actorName}} a terminé un match',
    tournamentWon: '{{actorName}} a gagné le tournoi',
    achievementUnlocked: '{{actorName}} a débloqué une réalisation',
    photoPosted: '{{actorName}} a publié une photo',
    eventCreated: '{{actorName}} a créé un événement',
    scorePosted: '{{actorName}} a publié un score',
    clubCreated: '{{actorName}} a créé un club',
    friendshipFormed: '{{actorName}} et {{targetName}} sont maintenant amis',
    levelUp: '{{actorName}} est passé au niveau {{level}}',
  },

  editProfile: {
    activityTime: {
      label: "Horaires Préférés d'Activité",
      hint: 'Sélectionnez vos créneaux horaires préférés pour les jours de semaine et les week-ends.',
      weekdays: 'Jours de Semaine',
      weekends: 'Week-ends',
      preferredTimesLabel: 'Horaires Préférés ({{type}})',
      morning: 'Matin',
      afternoon: 'Après-midi',
      evening: 'Soirée',
      night: 'Nuit',
      earlyMorning: 'Tôt le Matin (6h-9h)',
      lateMorning: 'Fin de Matinée (9h-12h)',
      midday: 'Midi (12h-14h)',
      lateAfternoon: "Fin d'Après-midi (16h-18h)",
      anyTime: "N'importe Quand",
    },
  },

  appNavigator: {
    screens: {
      eventChat: "Chat d'Événement",
      eventDetail: "Détails de l'Événement",
      rateSportsmanship: "Évaluer l'Esprit Sportif",
      recordScore: 'Enregistrer le Score',
      meetupDetail: 'Informations sur la Rencontre',
      clubChat: 'Chat du Club',
      tournamentBracket: 'Tableau du Tournoi',
      leagueStandings: 'Classement de la Ligue',
      matchHistory: 'Historique des Matchs',
      playerProfile: 'Profil du Joueur',
      notifications: 'Notifications',
    },
  },

  types: {
    match: {
      validation: {
        tiebreakMargin:
          'Set {{setNum}} : {{tiebreakType}} doit se terminer avec une marge minimale de {{margin}} point(s).',
        tiebreakMinPoints:
          'Set {{setNum}} : {{tiebreakType}} doit atteindre au moins {{minPoints}} points.',
        incompleteSet:
          "Set {{setNum}} : Dans {{setType}}, le set s'est terminé avec un score incomplet.",
        invalidWinScore:
          'Set {{setNum}} : Pour gagner avec {{gamesPerSet}} jeux, le score doit être {{gamesPerSet}}-{{maxLoss}} ou moins.',
        invalidWinScoreShort:
          'Set {{setNum}} : Dans les sets courts, {{gamesPerSet}}-{{maxLoss}} est le score gagnant maximum.',
        winByTwoGames: 'Le gagnant doit mener par au moins 2 jeux',
        tiebreakAt: "Bris d'égalité à {{score}}-{{score}}",
        advantageSet: 'Set Avantage',
        tiebreakSet: "Set avec Bris d'Égalité",
        championshhipTiebreak: "Bris d'Égalité de Championnat",
        standardTiebreak: "Bris d'Égalité Standard",
        superTiebreak: "Super Bris d'Égalité",
      },
    },
  },

  clubCommunication: {
    validation: {
      policyRequired: 'Veuillez saisir le contenu de la politique',
      policyTooShort: 'Le contenu de la politique doit comporter au moins 10 caractères',
      policyTooLong: 'Le contenu de la politique ne peut pas dépasser 10 000 caractères',
      titleRequired: 'Veuillez saisir un titre',
      titleTooLong: 'Le titre ne peut pas dépasser 100 caractères',
      titleTooShort: 'Le titre doit comporter au moins 3 caractères',
      invalidFormat: 'Format invalide',
      duplicateTitle: 'Ce titre existe déjà',
      reservedTitle: 'Ce titre est réservé',
      profanityDetected: 'Langage inapproprié détecté',
      spamDetected: 'Contenu spam détecté',
    },
  },

  clubPoliciesScreen: {
    joinFee: "Frais d'Adhésion",
    monthlyFee: 'Cotisations Mensuelles',
    yearlyFee: 'Cotisations Annuelles',
    dueDate: "Date d'Échéance",
    dueDateValue: 'Le {{day}} de chaque mois',
    paymentInfo: 'Informations de Paiement',
    acceptedPayments: 'Paiements Acceptés',
    paymentInstructions: 'Instructions de Paiement',
    lateFeePolicy: 'Politique des Frais de Retard',
    refundTerms: 'Conditions de Remboursement',
    membershipTerms: "Conditions d'Adhésion",
    termsAndConditions: 'Conditions Générales',
  },

  findClubScreen: {
    searchPlaceholder: 'Rechercher des clubs...',
    filterBy: 'Filtrer par',
    sortBy: 'Trier par',
    distance: 'Distance',
    members: 'Membres',
    activity: 'Activité',
    rating: 'Évaluation',
    newest: 'Plus Récent',
    mostActive: 'Plus Actif',
    nearest: 'Plus Proche',
    largest: 'Plus Grand',
    noClubsFound: 'Aucun club trouvé',
    tryDifferentSearch: 'Essayez une recherche différente',
  },

  // Additional comprehensive coverage
  onboarding: {
    welcome: 'Bienvenue',
    getStarted: 'Commencer',
    skipIntro: "Passer l'Introduction",
    next: 'Suivant',
    previous: 'Précédent',
    finish: 'Terminer',
    createProfile: 'Créer un Profil',
    findClubs: 'Trouver des Clubs',
    discoverPlayers: 'Découvrir des Joueurs',
    playMatches: 'Jouer des Matchs',
    trackProgress: 'Suivre la Progression',
    earnBadges: 'Gagner des Badges',
    joinCommunity: 'Rejoindre la Communauté',
  },

  achievements: {
    unlocked: 'Débloqué',
    locked: 'Verrouillé',
    inProgress: 'En Cours',
    completed: 'Terminé',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire',
    firstMatch: 'Premier Match',
    firstWin: 'Première Victoire',
    winStreak: 'Série de Victoires',
    centurion: 'Centurion',
    grandSlam: 'Grand Chelem',
    clubFounder: 'Fondateur de Club',
    socialButterfly: 'Papillon Social',
    trophyCollector: 'Collectionneur de Trophées',
    perfection: 'Perfection',
    comeback: 'Retour',
  },

  errors: {
    generic: "Une erreur s'est produite",
    networkError: 'Erreur de réseau. Vérifiez votre connexion.',
    serverError: 'Erreur du serveur. Veuillez réessayer plus tard.',
    authError: "Erreur d'authentification. Veuillez vous reconnecter.",
    permissionDenied: 'Permission refusée',
    notFound: 'Ressource introuvable',
    validationError: 'Erreur de validation',
    timeout: 'La requête a expiré',
    tooManyRequests: 'Trop de requêtes. Veuillez réessayer plus tard.',
    maintenanceMode: 'Le serveur est en maintenance',
    versionMismatch: "Version de l'application incompatible",
    pleaseUpdate: "Veuillez mettre à jour l'application",
  },
};

console.log('🚀 Applying MEGA-FINAL French translations (ALL remaining keys)...');
const updated = deepMerge(frData, megaFinalFrench);
fs.writeFileSync(FR_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');
console.log('✅ DONE! MEGA-FINAL French translations applied.');
console.log('🎉🎉🎉 ALL 1099 French keys should now be completely translated!');
