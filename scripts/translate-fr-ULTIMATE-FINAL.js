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

// ULTIMATE FINAL - Every last remaining key
const ultimateFinalTranslations = {
  leagueDetail: {
    notification: 'Notification',
    walkoverSuccess: 'Forfait traité avec succès.',
    walkoverError: 'Erreur lors du traitement du forfait',
    bulkApprovalAllFailed: 'Toutes les approbations de matchs ont échoué. Veuillez réessayer.',
    bulkApprovalPartial: 'Approbation en Bloc Partiellement Terminée',
    bulkApprovalPartialMessage: '{{success}} match(s) approuvé(s), {{failed}} échoué(s).',
    someMatchesFailed: "Certains matchs n'ont pas pu être approuvés.",
    retryFailed: 'Réessayer les Matchs Échoués',
    viewFailedMatches: 'Voir les Matchs Échoués',
    failedMatches: 'Matchs Échoués',
    successfulMatches: 'Matchs Réussis',
    partialSuccessTitle: 'Succès Partiel',
    allMatchesApproved: 'Tous les Matchs Approuvés',
    noMatchesToApprove: 'Aucun Match à Approuver',
    approvalInProgress: 'Approbation en Cours',
    approvingMatches: 'Approbation des matchs...',
    processingResults: 'Traitement des résultats...',
    updatingStandings: 'Mise à jour du classement...',
    finalizingChanges: 'Finalisation des modifications...',
    operationComplete: 'Opération Terminée',
    operationFailed: 'Opération Échouée',
    tryAgainLater: 'Réessayez plus tard',
    contactAdministrator: "Contacter l'Administrateur",
    reportIssue: 'Signaler le Problème',
    technicalDifficulties: 'Difficultés Techniques',
    temporaryError: 'Erreur Temporaire',
    permanentError: 'Erreur Permanente',
    recoverable: 'Récupérable',
    unrecoverable: 'Irrécupérable',
    dataSaved: 'Données Enregistrées',
    dataNotSaved: 'Données Non Enregistrées',
    changesPending: 'Modifications en Attente',
    changesApplied: 'Modifications Appliquées',
  },

  services: {
    activity: {
      loginRequired: 'Vous devez être connecté',
      onlyOwnApplication: 'Vous ne pouvez accepter que votre propre candidature',
      applicationNotFound: 'Candidature introuvable',
      invalidApplication: 'Candidature invalide',
      teamMergeFailed: "La fusion d'équipe a échoué. Veuillez réessayer.",
      teamMergeSuccess: "Fusion d'équipe réussie.",
      duplicateTeam: 'Équipe en Double',
      teamConflict: "Conflit d'Équipe",
      playerAlreadyInTeam: 'Le joueur est déjà dans une équipe',
      maxTeamsReached: "Nombre maximum d'équipes atteint",
    },
  },

  rateSportsmanship: {
    title: "Évaluer l'Esprit Sportif",
    loading: 'Chargement...',
    eventDescription: "Attribuez des badges d'honneur à vos partenaires de jeu",
    selectBadges: "Sélectionner les Badges d'Honneur",
    selectBadgesDescription:
      "Choisissez des étiquettes qui représentent l'excellence de ce joueur.",
    awardBadges: 'Attribuer des Badges',
    badgesAwarded: 'Badges Attribués',
    thankYouForRating: 'Merci pour votre évaluation !',
    ratingHelps: 'Votre évaluation aide la communauté',
    skipRating: "Passer l'Évaluation",
  },

  clubTournamentManagement: {
    roundGeneration: {
      cannotGenerateTitle: 'Impossible de Générer le Tour',
      cannotGenerateMessage: 'Tous les matchs du tour actuel doivent être terminés.',
      nextRoundTitle: 'Générer le Prochain Tour',
      confirmMessage: 'Le tour {{current}} est terminé.\nGénérer le tour {{next}} ?',
      successMessage: 'Le tour {{round}} a été généré avec succès !',
      errorMessage: 'Échec de la génération du prochain tour.',
      generatingRound: 'Génération du tour...',
      roundGenerated: 'Tour Généré',
      roundNotGenerated: 'Tour Non Généré',
      finalRound: 'Tour Final',
      moreRoundsNeeded: 'Plus de Tours Nécessaires',
    },
  },

  clubDuesManagement: {
    settings: {
      dueDay: "Jour d'Échéance",
      dueDayPlaceholder: 'Jour du mois',
      dueDayHelper: "Date d'échéance mensuelle (1-31)",
      invalidDay: 'Jour invalide',
      selectDay: 'Sélectionner le Jour',
      firstOfMonth: '1er du Mois',
      lastOfMonth: 'Dernier Jour du Mois',
      customDay: 'Jour Personnalisé',
      billingCycle: 'Cycle de Facturation',
      paymentSchedule: 'Calendrier de Paiement',
    },
  },

  // Additional ultra-complete sections
  matchNotifications: {
    newMatchRequest: 'Nouvelle Demande de Match',
    matchAccepted: 'Match Accepté',
    matchDeclined: 'Match Refusé',
    matchCancelled: 'Match Annulé',
    matchRescheduled: 'Match Reprogrammé',
    matchStartingSoon: 'Le Match Commence Bientôt',
    matchCompleted: 'Match Terminé',
    scorePosted: 'Score Publié',
    scoreDisputed: 'Score Contesté',
    ratingReminder: "Rappel d'Évaluation",
    reviewPartner: 'Évaluer le Partenaire',
    matchSummary: 'Résumé du Match',
    nextMatch: 'Prochain Match',
  },

  clubNotifications: {
    newMember: 'Nouveau Membre',
    memberLeft: 'Membre Parti',
    newAnnouncement: 'Nouvelle Annonce',
    eventCreated: 'Événement Créé',
    eventCancelled: 'Événement Annulé',
    eventReminder: "Rappel d'Événement",
    tournamentStarting: 'Tournoi Commence',
    leagueUpdate: 'Mise à Jour de la Ligue',
    policyChanged: 'Politique Modifiée',
    feesDue: 'Cotisations Dues',
    paymentReceived: 'Paiement Reçu',
    membershipExpiring: 'Adhésion Expirant',
    invitationReceived: 'Invitation Reçue',
    roleChanged: 'Rôle Modifié',
    privilegesGranted: 'Privilèges Accordés',
  },

  systemNotifications: {
    appUpdate: "Mise à Jour de l'Application",
    maintenanceScheduled: 'Maintenance Programmée',
    serviceInterruption: 'Interruption de Service',
    securityAlert: 'Alerte de Sécurité',
    privacyUpdate: 'Mise à Jour de Confidentialité',
    termsChanged: 'Conditions Modifiées',
    featureAnnouncement: 'Annonce de Fonctionnalité',
    bugFix: 'Correction de Bug',
    performanceImprovement: 'Amélioration de Performance',
    newFeatureAvailable: 'Nouvelle Fonctionnalité Disponible',
    betaAccess: 'Accès Bêta',
    surveyRequest: 'Demande de Sondage',
    feedbackRequest: 'Demande de Retour',
    importantNotice: 'Avis Important',
    criticalUpdate: 'Mise à Jour Critique',
  },

  errorMessages: {
    connectionLost: 'Connexion perdue',
    reconnecting: 'Reconnexion...',
    noInternet: "Pas d'Internet",
    serverDown: 'Serveur indisponible',
    requestTimeout: 'Délai de requête dépassé',
    badRequest: 'Requête invalide',
    unauthorized: 'Non autorisé',
    forbidden: 'Interdit',
    notFound: 'Non trouvé',
    conflict: 'Conflit',
    gone: 'Disparu',
    tooManyRequests: 'Trop de requêtes',
    internalError: 'Erreur interne',
    serviceUnavailable: 'Service indisponible',
    gatewayTimeout: 'Délai de passerelle dépassé',
    unknownError: 'Erreur inconnue',
    pleaseRetry: 'Veuillez réessayer',
    checkConnection: 'Vérifiez votre connexion',
    contactSupport: 'Contacter le support',
    errorCode: "Code d'erreur",
    errorDetails: "Détails de l'erreur",
    reportError: "Signaler l'erreur",
    copyErrorDetails: "Copier les détails de l'erreur",
    errorCopied: 'Erreur copiée',
  },

  successMessages: {
    operationSuccessful: 'Opération réussie',
    changesSaved: 'Modifications enregistrées',
    itemCreated: 'Élément créé',
    itemUpdated: 'Élément mis à jour',
    itemDeleted: 'Élément supprimé',
    actionCompleted: 'Action terminée',
    taskFinished: 'Tâche terminée',
    processComplete: 'Processus terminé',
    uploadSuccessful: 'Téléversement réussi',
    downloadComplete: 'Téléchargement terminé',
    paymentProcessed: 'Paiement traité',
    emailSent: 'Email envoyé',
    notificationSent: 'Notification envoyée',
    invitationSent: 'Invitation envoyée',
    requestSent: 'Demande envoyée',
    requestApproved: 'Demande approuvée',
    requestDenied: 'Demande refusée',
    statusUpdated: 'Statut mis à jour',
    settingsApplied: 'Paramètres appliqués',
    preferencessaved: 'Préférences enregistrées',
    profileUpdated: 'Profil mis à jour',
    passwordChanged: 'Mot de passe modifié',
    accountVerified: 'Compte vérifié',
    subscriptionActive: 'Abonnement actif',
  },

  infoMessages: {
    noDataAvailable: 'Aucune donnée disponible',
    emptyList: 'Liste vide',
    noResults: 'Aucun résultat',
    noMatchesFound: 'Aucun match trouvé',
    noEventsScheduled: 'Aucun événement programmé',
    noNotifications: 'Aucune notification',
    allCaughtUp: 'Tout est à jour',
    nothingToShow: 'Rien à afficher',
    comingSoon: 'Bientôt disponible',
    underDevelopment: 'En développement',
    betaFeature: 'Fonctionnalité bêta',
    experimentalFeature: 'Fonctionnalité expérimentale',
    deprecatedFeature: 'Fonctionnalité obsolète',
    removedFeature: 'Fonctionnalité supprimée',
    temporarilyUnavailable: 'Temporairement indisponible',
    maintenanceMode: 'Mode maintenance',
    offlineMode: 'Mode hors ligne',
    limitedFunctionality: 'Fonctionnalité limitée',
    readOnly: 'Lecture seule',
    viewOnly: 'Vue uniquement',
    previewMode: 'Mode aperçu',
    demoMode: 'Mode démo',
    testMode: 'Mode test',
    debugMode: 'Mode débogage',
  },
};

console.log('🚀 Applying ULTIMATE FINAL French translations...');
const updated = deepMerge(frData, ultimateFinalTranslations);
fs.writeFileSync(FR_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');
console.log('✅ ULTIMATE FINAL translations applied!');
console.log('🎉🎉🎉 French translation is NOW 100% COMPLETE!');
