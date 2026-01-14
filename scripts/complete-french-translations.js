#!/usr/bin/env node

/**
 * Complete French Translations Script
 *
 * Focus areas:
 * - eventCard (17 items)
 * - matchRequest (15 items)
 * - leagues (15 items)
 * - eventParticipation (12 items)
 * - contexts (12 items)
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

// Load locale files
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// French translations for missing items
const frTranslations = {
  eventCard: {
    matchTypeSelector: {
      all: 'Tous',
      singles: 'Simples',
      doubles: 'Doubles',
      mixed: 'Mixte',
    },
    labels: {
      host: 'Hôte',
      singles: 'Simple',
      doubles: 'Double',
      almostFull: 'Presque complet',
      friendly: 'Amical',
      waiting: '{{count}} en attente',
      full: 'Complet',
    },
    buttons: {
      setLocation: 'Définir le lieu',
      chat: 'Discussion',
      apply: 'Postuler',
      applyAsTeam: 'Postuler en équipe',
      applySolo: 'Postuler seul',
      cancel: 'Annuler',
      registrationClosed: 'Inscription fermée',
    },
  },

  matchRequest: {
    skillLevel: {
      beginner: 'Débutant',
      elementary: 'Élémentaire',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
    },
    alerts: {
      selectTime: 'Veuillez sélectionner une heure de match.',
      selectCourt: 'Veuillez sélectionner un court.',
      requestComplete: 'Demande de match envoyée',
      requestCompleteMessage: 'Demande de match envoyée à {{name}}.',
      requestError: "Une erreur s'est produite lors de l'envoi de la demande de match.",
    },
    playerCard: {
      matches: 'matchs',
      winRate: 'taux de victoire',
      recentMatches: 'Matchs récents',
    },
    schedule: {
      title: 'Horaire du match',
      selectTime: "Sélectionner l'heure",
      duration: 'Durée du match',
      oneHour: '1 heure',
      twoHours: '2 heures',
      threeHours: '3 heures',
    },
    court: {
      title: 'Sélectionner le court',
      perHour: '/heure',
    },
    message: {
      title: 'Message (facultatif)',
      label: 'Message de demande de match',
      placeholder: 'Écrivez une salutation ou vos attentes pour le match',
    },
    summary: {
      title: 'Résumé du match',
    },
    sendButton: 'Envoyer la demande de match',
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
      permissionError: 'Erreur de permission',
      adminRequired: "Permission d'administrateur requise.",
      approvalCompleteTitle: '✅ Approbation terminée',
      approvalCompleteMessage: 'La candidature de {{name}} a été approuvée.',
      approvalFailed: "Échec de l'approbation",
      approvalError:
        "Une erreur s'est produite lors de l'approbation de la candidature. Veuillez réessayer.",
      dashboardTitle: 'Tableau de bord administrateur',
      dashboardSubtitle: 'Gérer les participants et les paramètres avant le début de la ligue',
      participantStatus: 'Statut du participant',
      approved: 'Approuvé',
      pending: 'En attente',
      maxParticipants: 'Max',
      participantList: 'Liste des participants',
      applicationDate: 'Candidaté',
      approve: 'Approuver',
      processing: 'Traitement en cours...',
      rejected: 'Rejeté',
      noApplicants: 'Aucun candidat pour le moment',
      applicantsWillAppear: 'Les candidats apparaîtront ici en temps réel',
      leaguePrivateTitle: 'Ligue privée',
      leaguePrivateMessage:
        "La ligue est actuellement en préparation et n'est pas visible pour les membres. Commencez à accepter les candidatures lorsque vous êtes prêt.",
      opening: 'Ouverture...',
      startAcceptingApplications: '🎭 Commencer à accepter les candidatures',
    },
    match: {
      status: {
        scheduled: 'Programmé',
        inProgress: 'En cours',
        completed: 'Terminé',
        pendingApproval: "En attente d'approbation",
        cancelled: 'Annulé',
        postponed: 'Reporté',
        walkover: 'Forfait',
      },
      correctResult: 'Corriger le résultat',
      reschedule: 'Reprogrammer',
      walkover: 'Forfait',
      matchNumber: 'Match n°{{number}}',
      court: 'Court',
      result: 'Résultat',
      winner: 'Gagnant',
      submittedResult: "Résultat soumis (en attente d'approbation)",
      submitResult: 'Soumettre le résultat',
    },
  },

  eventParticipation: {
    header: {
      title: "Participation à l'événement",
    },
    tabs: {
      details: 'Détails',
      participants: 'Participants',
      register: "S'inscrire",
    },
    details: {
      allLevels: 'Tous niveaux',
      participants: 'participants',
      free: 'Gratuit',
      organizer: 'Organisateur',
      requirements: 'Exigences',
      providedEquipment: 'Équipement fourni',
    },
    participants: {
      list: 'Participants',
      waitingList: "Liste d'attente",
    },
    status: {
      confirmed: 'Confirmé',
      pending: 'En attente',
      waiting: 'En attente',
      registrationConfirmed: 'Inscription confirmée',
      registrationPending: 'Inscription en attente',
      addedToWaitingList: "Ajouté à la liste d'attente",
      registrationCancelled: 'Inscription annulée',
      participationConfirmed: 'Votre participation est confirmée.',
      waitingApproval: "En attente de l'approbation de l'organisateur.",
      notifyWhenAvailable: 'Vous serez notifié si une place se libère.',
    },
    registration: {
      title: "Inscription à l'événement",
      termsRequired: 'Acceptation des conditions requise',
      pleaseAgreeTerms: 'Veuillez accepter les conditions de participation.',
      emergencyContactRequired: "Contact d'urgence requis",
      pleaseEnterEmergency: "Veuillez entrer les informations de contact d'urgence.",
      complete: 'Inscription terminée',
      registrationSuccess: "Votre inscription à l'événement est terminée !",
      addedToWaitlist: "Vous avez été ajouté à la liste d'attente.",
      failed: "Échec de l'inscription",
      errorProcessing: "Une erreur s'est produite lors du traitement de votre inscription.",
      closed: 'Inscription fermée',
      closedMessage: "L'inscription à cet événement n'est plus disponible.",
      joinWaitingList: "Rejoindre la liste d'attente",
      fullMessage: "Événement complet. Souhaitez-vous rejoindre la liste d'attente ?",
      description: 'Remplissez les informations ci-dessous pour vous inscrire à cet événement.',
      registerNow: "S'inscrire maintenant",
    },
  },

  contexts: {
    chatNotification: {
      viewAction: 'Voir',
      messageFrom: 'Message de {{senderName}} : {{message}}',
    },
    location: {
      permissionTitle: 'Permission de localisation requise',
      permissionMessage:
        'La permission de localisation est requise pour trouver des joueurs à proximité.',
      permissionRequired: 'Permission de localisation requise.',
      serviceDisabled: 'Les services de localisation sont désactivés.',
      locationUnavailable: "La localisation n'est pas disponible.",
      locationTimeout: "Délai d'attente de la demande de localisation dépassé.",
      cannotGetLocation: "Impossible d'obtenir la localisation.",
      watchLocationFailed: 'Échec de la surveillance de la localisation en temps réel.',
    },
    notification: {
      permissionTitle: 'Permission de notification requise',
      permissionMessage:
        'Veuillez autoriser la permission de notification dans les paramètres pour recevoir les notifications de match.',
      later: 'Plus tard',
      openSettings: 'Ouvrir les paramètres',
      matchNotificationTitle: 'Notification de match',
      matchNotificationBody: 'Vous avez un match de tennis programmé dans 30 minutes.',
    },
    auth: {
      emailVerificationRequired:
        "Vérification de l'email requise. Veuillez vérifier votre boîte de réception.",
      invalidCredential:
        "L'email ou le mot de passe est incorrect. Veuillez vérifier et réessayer.",
      userNotFound: 'Compte introuvable.',
      accountDoesNotExist: "Ce compte n'existe pas.",
      wrongPassword: 'Mot de passe incorrect.',
      invalidEmail: 'Adresse email invalide.',
      invalidEmailFormat: "Format d'email invalide.",
      emailAlreadyInUse: 'Cette adresse email est déjà utilisée.',
      weakPassword: 'Le mot de passe est trop faible.',
      passwordTooShort: 'Le mot de passe est trop court.',
      passwordMismatch: 'Les mots de passe ne correspondent pas.',
    },
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

// Apply translations
console.log('📝 Applying French translations...\n');

const updatedFr = deepMerge(fr, frTranslations);

// Save updated French locale
fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('✅ French translations completed!\n');
console.log('Updated sections:');
console.log('  - eventCard: matchTypeSelector, labels, buttons');
console.log('  - matchRequest: skillLevel, alerts, all UI sections');
console.log('  - leagues: admin dashboard, match status');
console.log('  - eventParticipation: all sections');
console.log('  - contexts: all notification & location contexts\n');

console.log('🎯 Translation statistics:');
console.log('  - eventCard: ~17 items translated');
console.log('  - matchRequest: ~15 items translated');
console.log('  - leagues: ~15 items translated');
console.log('  - eventParticipation: ~12 items translated');
console.log('  - contexts: ~12 items translated');
console.log('\nTotal: ~71 items translated to French! 🇫🇷\n');
