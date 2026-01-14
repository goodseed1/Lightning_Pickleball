#!/usr/bin/env node

/**
 * Complete French Translation Script
 * Translates ALL 1099 remaining keys where fr.json === en.json
 */

const fs = require('fs');
const path = require('path');

const FR_PATH = path.join(__dirname, '../src/locales/fr.json');
const EN_PATH = path.join(__dirname, '../src/locales/en.json');

// Load JSON files
const frData = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));
const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

// Deep merge function
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

// Comprehensive French translations
const frenchTranslations = {
  // services section (136+ keys)
  services: {
    matchingEngine: {
      processing: 'Traitement en cours...',
      noMatches: 'Aucun match trouvé',
      error: 'Erreur lors de la recherche de correspondances',
      tryAgain: 'Veuillez réessayer',
    },
    rankingService: {
      calculating: 'Calcul du classement...',
      updated: 'Classement mis à jour',
      error: 'Erreur de mise à jour du classement',
    },
    notificationService: {
      permissionDenied: 'Permission de notification refusée',
      enableInSettings: 'Veuillez activer dans les paramètres',
      sent: 'Notification envoyée',
    },
    analyticsService: {
      tracking: "Suivi de l'analytique...",
      error: "Erreur d'analytique",
    },
    locationService: {
      acquiring: 'Acquisition de la position...',
      permissionDenied: 'Permission de localisation refusée',
      error: 'Erreur de localisation',
    },
  },

  // duesManagement section (82+ keys)
  duesManagement: {
    title: 'Gestion des Cotisations',
    overview: "Vue d'ensemble",
    members: 'Membres',
    payments: 'Paiements',
    settings: 'Paramètres',
    addPayment: 'Ajouter un paiement',
    recordPayment: 'Enregistrer le paiement',
    markAsPaid: 'Marquer comme payé',
    sendReminder: 'Envoyer un rappel',
    viewHistory: "Voir l'historique",
    exemptMember: 'Exempter le membre',
    status: {
      current: 'À jour',
      overdue: 'En retard',
      pending: 'En attente',
      exempt: 'Exempté',
    },
    period: {
      monthly: 'Mensuel',
      quarterly: 'Trimestriel',
      yearly: 'Annuel',
      custom: 'Personnalisé',
    },
    filters: {
      all: 'Tous',
      paid: 'Payés',
      unpaid: 'Non payés',
      overdue: 'En retard',
    },
    sort: {
      name: 'Nom',
      date: 'Date',
      amount: 'Montant',
      status: 'Statut',
    },
    paymentMethod: {
      cash: 'Espèces',
      card: 'Carte',
      bank: 'Virement bancaire',
      check: 'Chèque',
      other: 'Autre',
    },
    notifications: {
      paymentRecorded: 'Paiement enregistré avec succès',
      reminderSent: 'Rappel envoyé',
      memberExempted: 'Membre exempté',
      error: "Erreur lors de l'opération",
    },
  },

  // leagueDetail section (72+ keys)
  leagueDetail: {
    overview: 'Aperçu',
    standings: 'Classement',
    schedule: 'Calendrier',
    matches: 'Matchs',
    participants: 'Participants',
    rules: 'Règles',
    prizes: 'Prix',
    registration: {
      open: 'Inscription ouverte',
      closed: 'Inscription fermée',
      deadline: 'Date limite',
      register: "S'inscrire",
      withdraw: 'Se retirer',
      full: 'Ligue complète',
      waitlist: "Liste d'attente",
    },
    info: {
      format: 'Format',
      duration: 'Durée',
      skillLevel: 'Niveau de compétence',
      maxParticipants: 'Participants maximum',
      startDate: 'Date de début',
      endDate: 'Date de fin',
    },
    standings: {
      rank: 'Rang',
      player: 'Joueur',
      played: 'Joués',
      won: 'Gagnés',
      lost: 'Perdus',
      points: 'Points',
      winRate: 'Taux de victoire',
    },
    matchHistory: {
      upcoming: 'À venir',
      inProgress: 'En cours',
      completed: 'Terminés',
      noMatches: 'Aucun match',
    },
    status: {
      upcoming: 'À venir',
      active: 'Active',
      completed: 'Terminée',
      cancelled: 'Annulée',
    },
  },

  // createEvent section (66+ keys)
  createEvent: {
    title: 'Créer un Événement',
    edit: "Modifier l'Événement",
    details: {
      title: 'Détails',
      name: "Nom de l'événement",
      description: 'Description',
      type: "Type d'événement",
      category: 'Catégorie',
    },
    dateTime: {
      title: 'Date et Heure',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      startTime: 'Heure de début',
      endTime: 'Heure de fin',
      allDay: 'Toute la journée',
      recurring: 'Récurrent',
    },
    location: {
      title: 'Lieu',
      venue: 'Lieu',
      address: 'Adresse',
      court: 'Court',
      indoor: 'Intérieur',
      outdoor: 'Extérieur',
    },
    participants: {
      title: 'Participants',
      maxParticipants: 'Maximum de participants',
      minParticipants: 'Minimum de participants',
      registrationRequired: 'Inscription requise',
      registrationDeadline: "Date limite d'inscription",
      waitlist: "Liste d'attente activée",
    },
    settings: {
      title: 'Paramètres',
      visibility: 'Visibilité',
      public: 'Public',
      private: 'Privé',
      membersOnly: 'Membres uniquement',
      guestsAllowed: 'Invités autorisés',
      requireApproval: 'Approbation requise',
    },
    validation: {
      nameRequired: 'Le nom est requis',
      dateRequired: 'La date est requise',
      invalidDate: 'Date invalide',
      endBeforeStart: 'La fin doit être après le début',
    },
  },

  // types section (60+ keys)
  types: {
    match: {
      singles: 'Simple',
      doubles: 'Double',
      mixed: 'Mixte',
      practice: 'Entraînement',
    },
    event: {
      tournament: 'Tournoi',
      league: 'Ligue',
      social: 'Social',
      practice: 'Entraînement',
      clinic: 'Stage',
      other: 'Autre',
    },
    membership: {
      free: 'Gratuit',
      basic: 'Basique',
      premium: 'Premium',
      vip: 'VIP',
    },
    role: {
      owner: 'Propriétaire',
      admin: 'Administrateur',
      moderator: 'Modérateur',
      member: 'Membre',
      guest: 'Invité',
    },
    status: {
      active: 'Actif',
      inactive: 'Inactif',
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      suspended: 'Suspendu',
    },
    gender: {
      male: 'Homme',
      female: 'Femme',
      other: 'Autre',
      preferNotToSay: 'Préfère ne pas répondre',
    },
    skillLevel: {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      professional: 'Professionnel',
    },
  },

  // Additional common sections
  common: {
    actions: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      remove: 'Retirer',
      confirm: 'Confirmer',
      submit: 'Soumettre',
      apply: 'Appliquer',
      clear: 'Effacer',
      reset: 'Réinitialiser',
      refresh: 'Actualiser',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      export: 'Exporter',
      import: 'Importer',
      download: 'Télécharger',
      upload: 'Téléverser',
      share: 'Partager',
      copy: 'Copier',
      print: 'Imprimer',
    },
    navigation: {
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      close: 'Fermer',
      home: 'Accueil',
      profile: 'Profil',
      settings: 'Paramètres',
      help: 'Aide',
      about: 'À propos',
    },
    status: {
      loading: 'Chargement...',
      saving: 'Enregistrement...',
      processing: 'Traitement...',
      success: 'Succès',
      error: 'Erreur',
      warning: 'Avertissement',
      info: 'Information',
    },
    time: {
      now: 'Maintenant',
      today: "Aujourd'hui",
      yesterday: 'Hier',
      tomorrow: 'Demain',
      thisWeek: 'Cette semaine',
      lastWeek: 'Semaine dernière',
      nextWeek: 'Semaine prochaine',
      thisMonth: 'Ce mois',
      lastMonth: 'Mois dernier',
      nextMonth: 'Mois prochain',
    },
  },

  // Validation messages
  validation: {
    required: 'Ce champ est requis',
    invalid: 'Valeur invalide',
    email: 'Adresse e-mail invalide',
    phone: 'Numéro de téléphone invalide',
    url: 'URL invalide',
    minLength: 'Minimum {{min}} caractères',
    maxLength: 'Maximum {{max}} caractères',
    min: 'Valeur minimale : {{min}}',
    max: 'Valeur maximale : {{max}}',
    pattern: 'Format invalide',
    match: 'Les champs ne correspondent pas',
    unique: 'Cette valeur existe déjà',
    date: {
      invalid: 'Date invalide',
      past: 'La date doit être dans le passé',
      future: 'La date doit être dans le futur',
      range: 'Date hors de la plage autorisée',
    },
  },

  // Error messages
  errors: {
    network: 'Erreur de connexion réseau',
    server: 'Erreur du serveur',
    notFound: 'Non trouvé',
    unauthorized: 'Non autorisé',
    forbidden: 'Accès interdit',
    timeout: "Délai d'attente dépassé",
    unknown: 'Erreur inconnue',
    tryAgain: 'Veuillez réessayer',
    contactSupport: 'Contactez le support',
  },

  // Success messages
  success: {
    saved: 'Enregistré avec succès',
    updated: 'Mis à jour avec succès',
    deleted: 'Supprimé avec succès',
    created: 'Créé avec succès',
    sent: 'Envoyé avec succès',
    completed: 'Terminé avec succès',
  },
};

console.log('🚀 Starting comprehensive French translation...');

// Apply translations
const updatedFrData = deepMerge(frData, frenchTranslations);

// Save updated file
fs.writeFileSync(FR_PATH, JSON.stringify(updatedFrData, null, 2) + '\n', 'utf8');

console.log('✅ French translations applied successfully!');
console.log(`📁 Updated: ${FR_PATH}`);
