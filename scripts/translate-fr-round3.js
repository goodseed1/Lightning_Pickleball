#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const frPath = path.join(__dirname, '../src/locales/fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Round 3 - Continuing with remaining high-priority sections
const translations = {
  leagueDetail: {
    notification: 'Notification',
    selectParticipants: 'Veuillez sélectionner les participants.',
    participantsAddedSuccess: '{{count}} participant(s) ajouté(s) avec succès.',
    participantsAddError:
      "Erreur lors de l'ajout des participants. Veuillez vérifier la connexion.",
    partialSuccess: 'Succès partiel',
    addParticipants: 'Ajouter des participants',
    removeParticipants: 'Retirer des participants',
    participantsList: 'Liste des participants',
    searchParticipants: 'Rechercher des participants',
    noParticipantsYet: 'Aucun participant pour le moment',
    inviteParticipants: 'Inviter des participants',
    participantCount: '{{count}} participants',
    maxReached: 'Maximum atteint',
    spotsLeft: '{{count}} places restantes',
    fullLeague: 'Ligue complète',
    waitingList: "Liste d'attente",
    addToWaitlist: "Ajouter à la liste d'attente",
    removeFromWaitlist: "Retirer de la liste d'attente",
    promoteFromWaitlist: "Promouvoir de la liste d'attente",
    participantRemoved: 'Participant retiré',
    participantAdded: 'Participant ajouté',
    errorRemovingParticipant: 'Erreur lors du retrait du participant',
    errorAddingParticipant: "Erreur lors de l'ajout du participant",
    confirmRemoveParticipant: 'Confirmer le retrait du participant',
    confirmRemoveMessage: 'Êtes-vous sûr de vouloir retirer ce participant ?',
    participantDetails: 'Détails du participant',
    participantStats: 'Statistiques du participant',
    participantHistory: 'Historique du participant',
    sendMessage: 'Envoyer un message',
    viewProfile: 'Voir le profil',
    blockParticipant: 'Bloquer le participant',
    unblockParticipant: 'Débloquer le participant',
    reportParticipant: 'Signaler le participant',
    participantBlocked: 'Participant bloqué',
    participantUnblocked: 'Participant débloqué',
    participantReported: 'Participant signalé',
    errorBlockingParticipant: 'Erreur lors du blocage du participant',
    errorUnblockingParticipant: 'Erreur lors du déblocage du participant',
    errorReportingParticipant: 'Erreur lors du signalement du participant',
    minParticipantsRequired: 'Minimum de {{count}} participants requis',
    registrationFull: 'Inscription complète',
    registrationAvailable: 'Inscription disponible',
    earlyBirdDiscount: 'Réduction pour inscription anticipée',
    regularPrice: 'Prix régulier',
    memberDiscount: 'Réduction membre',
    nonMemberPrice: 'Prix non-membre',
    paymentRequired: 'Paiement requis',
    paymentOptional: 'Paiement optionnel',
    freeEntry: 'Entrée gratuite',
    paidEntry: 'Entrée payante',
    refundPolicy: 'Politique de remboursement',
    cancellationPolicy: "Politique d'annulation",
    withdrawalDeadline: 'Date limite de retrait',
    withdrawalFee: 'Frais de retrait',
    noRefund: 'Aucun remboursement',
    partialRefund: 'Remboursement partiel',
    fullRefund: 'Remboursement complet',
    refundRequested: 'Remboursement demandé',
    refundProcessing: 'Remboursement en cours',
    refundCompleted: 'Remboursement terminé',
    refundRejected: 'Remboursement rejeté',
    requestRefund: 'Demander un remboursement',
    processRefund: 'Traiter le remboursement',
    approveRefund: 'Approuver le remboursement',
    rejectRefund: 'Rejeter le remboursement',
    refundReason: 'Raison du remboursement',
    refundAmount: 'Montant du remboursement',
    refundMethod: 'Méthode de remboursement',
    refundTo: 'Remboursement vers',
    processingTime: 'Délai de traitement',
    businessDays: '{{count}} jours ouvrables',
  },

  admin: {
    devTools: {
      currentStreak: 'Série actuelle',
      eloRating: 'Classement ELO',
      badges: '🏆 Badges gagnés',
      notificationSettings: '🔔 Paramètres de notification',
      requestPermissions: 'Demander les permissions de notification',
      pushNotifications: 'Notifications push',
      emailNotifications: 'Notifications par email',
      smsNotifications: 'Notifications par SMS',
      inAppNotifications: "Notifications dans l'application",
      matchReminders: 'Rappels de match',
      leagueUpdates: 'Mises à jour de la ligue',
      tournamentAlerts: 'Alertes de tournoi',
      socialUpdates: 'Mises à jour sociales',
      systemNotifications: 'Notifications système',
      marketingEmails: 'Emails marketing',
      newsletter: 'Newsletter',
      promotions: 'Promotions',
      enableAll: 'Tout activer',
      disableAll: 'Tout désactiver',
      notificationFrequency: 'Fréquence des notifications',
      immediate: 'Immédiat',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      never: 'Jamais',
      quietHours: 'Heures de silence',
      doNotDisturb: 'Ne pas déranger',
      from: 'De',
      to: 'À',
      timezone: 'Fuseau horaire',
      notificationSound: 'Son de notification',
      vibration: 'Vibration',
      ledLight: 'Lumière LED',
      badgeCount: 'Compteur de badge',
      preview: 'Aperçu',
      testNotification: 'Tester la notification',
      resetToDefaults: 'Réinitialiser aux valeurs par défaut',
    },

    logs: {
      lastChecked: 'Dernière vérification',
      activeUsers: 'Utilisateurs actifs\n(24h)',
      newMatches: 'Nouveaux matchs\n(24h)',
      errors: "Journaux d'erreur",
      categories: 'Catégories de journaux',
      authentication: 'Authentification',
      database: 'Base de données',
      api: 'API',
      frontend: 'Frontend',
      backend: 'Backend',
      payment: 'Paiement',
      notification: 'Notification',
      storage: 'Stockage',
      analytics: 'Analytique',
      performance: 'Performance',
      security: 'Sécurité',
      userActivity: 'Activité utilisateur',
      systemEvents: 'Événements système',
      errorRate: "Taux d'erreur",
      responseTime: 'Temps de réponse',
      uptime: 'Temps de fonctionnement',
      downtime: "Temps d'arrêt",
      latency: 'Latence',
      throughput: 'Débit',
      requestsPerSecond: 'Requêtes par seconde',
      averageResponseTime: 'Temps de réponse moyen',
      peakLoad: 'Charge maximale',
      currentLoad: 'Charge actuelle',
      cpuUsage: 'Utilisation CPU',
      memoryUsage: 'Utilisation mémoire',
      diskUsage: 'Utilisation disque',
      networkTraffic: 'Trafic réseau',
      bandwidth: 'Bande passante',
    },
  },

  editClubPolicy: {
    ok: 'OK',
    saveFailed: "Échec de l'enregistrement",
    errorOccurred: "Une erreur s'est produite.",
    unsavedChanges: 'Modifications non enregistrées',
    unsavedChangesMessage:
      'Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter ?',
    discardChanges: 'Abandonner les modifications',
    saveAndExit: 'Enregistrer et quitter',
    continueEditing: "Continuer l'édition",
    autosave: 'Enregistrement automatique',
    lastSaved: 'Dernière sauvegarde',
    savingDraft: 'Enregistrement du brouillon...',
    draftSaved: 'Brouillon enregistré',
    publishingPolicy: 'Publication de la politique...',
    policyPublished: 'Politique publiée',
    unpublishingPolicy: 'Dépublication de la politique...',
    policyUnpublished: 'Politique dépubliée',
    archivingPolicy: 'Archivage de la politique...',
    policyArchived: 'Politique archivée',
    restoringPolicy: 'Restauration de la politique...',
    policyRestored: 'Politique restaurée',
    duplicatingPolicy: 'Duplication de la politique...',
    policyDuplicated: 'Politique dupliquée',
    deletingPolicy: 'Suppression de la politique...',
    policyDeleted: 'Politique supprimée',
    exportingPolicy: 'Exportation de la politique...',
    policyExported: 'Politique exportée',
    importingPolicy: 'Importation de la politique...',
    policyImported: 'Politique importée',
    versionHistory: 'Historique des versions',
    restoreVersion: 'Restaurer la version',
    compareVersions: 'Comparer les versions',
    currentVersion: 'Version actuelle',
    previousVersion: 'Version précédente',
    versionRestored: 'Version restaurée',
  },

  clubOverviewScreen: {
    important: 'Important',
    playoffsInProgress: 'Éliminatoires en cours',
    clubNotifications: 'Notifications du club',
    viewAllNotifications: 'Voir toutes les notifications ({{count}})',
    teamInviteTitle: "Invitation d'équipe",
    teamInviteMessage: 'Vous avez été invité à rejoindre {{teamName}}',
    acceptInvite: "Accepter l'invitation",
    declineInvite: "Refuser l'invitation",
    inviteAccepted: 'Invitation acceptée',
    inviteDeclined: 'Invitation refusée',
    errorAcceptingInvite: "Erreur lors de l'acceptation de l'invitation",
    errorDecliningInvite: "Erreur lors du refus de l'invitation",
    upcomingMatches: 'Matchs à venir',
    recentResults: 'Résultats récents',
    leaderboard: 'Classement',
    clubStats: 'Statistiques du club',
    memberCount: '{{count}} membres',
    activeMembers: '{{count}} membres actifs',
    eventCount: '{{count}} événements',
    upcomingEvents: '{{count}} événements à venir',
    todaysMatches: "Matchs d'aujourd'hui",
    thisWeeksMatches: 'Matchs de cette semaine',
    noMatchesToday: "Aucun match aujourd'hui",
    noMatchesThisWeek: 'Aucun match cette semaine',
    viewSchedule: 'Voir le calendrier',
    createMatch: 'Créer un match',
    createEvent: 'Créer un événement',
    inviteFriends: 'Inviter des amis',
    shareClub: 'Partager le club',
    clubCode: 'Code du club',
    copyCode: 'Copier le code',
    codeCopied: 'Code copié',
  },

  duesManagement: {
    modals: {
      approvePaymentConfirm: 'Approuver ce paiement ?',
      rejectPaymentConfirm: 'Rejeter ce paiement ?',
      addLateFee: 'Ajouter des frais de retard',
      manageLateFeesTitle: 'Gérer les frais de retard',
      manageLateFeesMessage: 'Total des frais de retard : ${{amount}}',
      waiveLateFees: 'Dispenser des frais de retard',
      lateFeeWaived: 'Frais de retard dispensés',
      lateFeeAdded: 'Frais de retard ajoutés',
      errorAddingLateFee: "Erreur lors de l'ajout des frais de retard",
      errorWaivingLateFee: 'Erreur lors de la dispense des frais de retard',
      lateFeeAmount: 'Montant des frais de retard',
      lateFeeReason: 'Raison des frais de retard',
      lateFeeDate: 'Date des frais de retard',
      automaticLateFees: 'Frais de retard automatiques',
      manualLateFees: 'Frais de retard manuels',
      lateFeePolicy: 'Politique de frais de retard',
      gracePeriodDays: 'Jours de période de grâce',
      lateFeePercentage: 'Pourcentage de frais de retard',
      lateFeeFixedAmount: 'Montant fixe de frais de retard',
      maxLateFee: 'Frais de retard maximum',
      compoundLateFees: 'Frais de retard composés',
      oneTimeLateFee: 'Frais de retard unique',
      recurringLateFees: 'Frais de retard récurrents',
      lateFeeFrequency: 'Fréquence des frais de retard',
      applyLateFee: 'Appliquer les frais de retard',
      removeLateFee: 'Retirer les frais de retard',
      lateFeeHistory: 'Historique des frais de retard',
      totalLateFees: 'Total des frais de retard',
      outstandingLateFees: 'Frais de retard impayés',
      paidLateFees: 'Frais de retard payés',
    },
  },

  manageAnnouncement: {
    ok: 'OK',
    validationError: 'Veuillez entrer à la fois le titre et le contenu.',
    savedSuccess: "L'annonce a été enregistrée.",
    savingError: "Une erreur s'est produite lors de l'enregistrement.",
    deleteTitle: "Supprimer l'annonce",
    deleteMessage: 'Êtes-vous sûr de vouloir supprimer cette annonce ?',
    deleteConfirm: 'Supprimer',
    deleteCancel: 'Annuler',
    deleteSuccess: 'Annonce supprimée avec succès',
    deleteError: "Erreur lors de la suppression de l'annonce",
    publishTitle: "Publier l'annonce",
    publishMessage: 'Êtes-vous sûr de vouloir publier cette annonce ?',
    publishConfirm: 'Publier',
    publishSuccess: 'Annonce publiée avec succès',
    publishError: "Erreur lors de la publication de l'annonce",
    unpublishTitle: "Dépublier l'annonce",
    unpublishMessage: 'Êtes-vous sûr de vouloir dépublier cette annonce ?',
    unpublishConfirm: 'Dépublier',
    unpublishSuccess: 'Annonce dépubliée avec succès',
    unpublishError: "Erreur lors de la dépublication de l'annonce",
    scheduleTitle: "Programmer l'annonce",
    scheduleMessage: "Choisir la date et l'heure de publication",
    scheduleConfirm: 'Programmer',
    scheduleSuccess: 'Annonce programmée avec succès',
    scheduleError: "Erreur lors de la programmation de l'annonce",
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

console.log('🔄 Starting French translation - Round 3...\n');

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
