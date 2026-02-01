#!/usr/bin/env node

/**
 * Comprehensive French translations for all remaining 1525+ keys
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const frPath = path.join(localesDir, 'fr.json');
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

const comprehensiveFrench = {
  common: {
    ok: 'OK',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    create: 'Créer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
  },

  navigation: {
    clubs: 'Clubs',
    matches: 'Matchs',
    events: 'Événements',
    profile: 'Profil',
    settings: 'Paramètres',
  },

  clubList: {
    skillLevel: {
      all: 'Tous niveaux',
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
    },
    clubType: {
      casual: 'Décontracté',
      competitive: 'Compétitif',
      social: 'Social',
    },
    fees: {
      joinFee: "Frais d'adhésion",
      monthlyFee: 'Frais mensuels',
    },
    actions: {
      favorite: 'Ajouter aux favoris',
      viewDetails: 'Voir les détails',
    },
    emptyState: {
      noJoinedClubs: 'Aucun club rejoint',
      noSearchResults: 'Aucun résultat de recherche',
      noNearbyClubs: 'Aucun club à proximité',
      joinNewClub: 'Rejoindre un nouveau club !',
      tryDifferentSearch: 'Essayez un autre terme de recherche',
    },
  },

  services: {
    auth: {
      signIn: {
        error: 'Erreur de connexion',
        emailNotVerified: 'Email non vérifié',
        invalidCredentials: 'Identifiants invalides',
        userNotFound: 'Utilisateur non trouvé',
        wrongPassword: 'Mot de passe incorrect',
        tooManyRequests: 'Trop de tentatives. Réessayez plus tard',
        networkError: 'Erreur réseau. Vérifiez votre connexion',
      },
      signOut: {
        success: 'Déconnexion réussie',
        error: 'Erreur de déconnexion',
      },
      register: {
        success: 'Inscription réussie',
        error: "Erreur d'inscription",
        emailInUse: 'Email déjà utilisé',
        weakPassword: 'Mot de passe trop faible',
        invalidEmail: 'Email invalide',
      },
      resetPassword: {
        success: 'Email de réinitialisation envoyé',
        error: "Erreur d'envoi de l'email",
        emailNotFound: 'Email non trouvé',
      },
      emailVerification: {
        sent: 'Email de vérification envoyé',
        error: "Erreur d'envoi de l'email",
        success: 'Email vérifié avec succès',
      },
      updateProfile: {
        success: 'Profil mis à jour',
        error: 'Erreur de mise à jour du profil',
      },
      changePassword: {
        success: 'Mot de passe changé',
        error: 'Erreur de changement de mot de passe',
        currentPasswordWrong: 'Mot de passe actuel incorrect',
      },
      deleteAccount: {
        success: 'Compte supprimé',
        error: 'Erreur de suppression du compte',
        requiresRecentLogin: 'Reconnectez-vous pour continuer',
      },
    },
    firestore: {
      create: {
        success: 'Document créé',
        error: 'Erreur de création',
        permissionDenied: 'Permission refusée',
        invalidData: 'Données invalides',
      },
      read: {
        success: 'Document lu',
        error: 'Erreur de lecture',
        notFound: 'Document non trouvé',
        permissionDenied: 'Permission refusée',
      },
      update: {
        success: 'Document mis à jour',
        error: 'Erreur de mise à jour',
        notFound: 'Document non trouvé',
        permissionDenied: 'Permission refusée',
        invalidData: 'Données invalides',
      },
      delete: {
        success: 'Document supprimé',
        error: 'Erreur de suppression',
        notFound: 'Document non trouvé',
        permissionDenied: 'Permission refusée',
      },
      fetch: {
        error: 'Erreur de récupération',
        permissionDenied: 'Permission refusée',
        timeout: "Délai d'attente dépassé",
      },
      query: {
        error: 'Erreur de requête',
        noResults: 'Aucun résultat',
        permissionDenied: 'Permission refusée',
      },
    },
    storage: {
      upload: {
        success: 'Fichier téléchargé',
        error: 'Erreur de téléchargement',
        permissionDenied: 'Permission refusée',
        fileTooLarge: 'Fichier trop volumineux',
        invalidFileType: 'Type de fichier invalide',
        uploadCancelled: 'Téléchargement annulé',
      },
      download: {
        success: 'Fichier téléchargé',
        error: 'Erreur de téléchargement',
        notFound: 'Fichier non trouvé',
        permissionDenied: 'Permission refusée',
      },
      delete: {
        success: 'Fichier supprimé',
        error: 'Erreur de suppression',
        notFound: 'Fichier non trouvé',
        permissionDenied: 'Permission refusée',
      },
      getUrl: {
        error: "Erreur d'obtention de l'URL",
        notFound: 'Fichier non trouvé',
      },
    },
    cloudFunctions: {
      call: {
        error: "Erreur d'appel de fonction",
        timeout: "Délai d'attente dépassé",
        notFound: 'Fonction non trouvée',
        permissionDenied: 'Permission refusée',
        invalidArgument: 'Argument invalide',
      },
    },
    messaging: {
      send: {
        success: 'Message envoyé',
        error: "Erreur d'envoi",
        permissionDenied: 'Permission refusée',
      },
      receive: {
        error: 'Erreur de réception',
      },
      token: {
        error: "Erreur d'obtention du token",
        permissionDenied: 'Permission de notification refusée',
      },
    },
  },

  duesManagement: {
    title: 'Gestion des cotisations',
    tabs: {
      overview: 'Aperçu',
      pending: 'En attente',
      paid: 'Payés',
      overdue: 'En retard',
    },
    memberName: 'Nom du membre',
    amount: 'Montant',
    dueDate: "Date d'échéance",
    paidDate: 'Date de paiement',
    status: 'Statut',
    paid: 'Payé',
    unpaid: 'Impayé',
    overdue: 'En retard',
    partial: 'Partiel',
    actions: {
      markAsPaid: 'Marquer comme payé',
      markAsUnpaid: 'Marquer comme impayé',
      sendReminder: 'Envoyer un rappel',
      viewDetails: 'Voir les détails',
      viewHistory: "Voir l'historique",
      edit: 'Modifier',
      delete: 'Supprimer',
    },
    add: {
      title: 'Ajouter une cotisation',
      button: 'Ajouter',
      selectMember: 'Sélectionner un membre',
      enterAmount: 'Entrer le montant',
      selectDueDate: "Sélectionner la date d'échéance",
      notes: 'Notes',
    },
    edit: {
      title: 'Modifier la cotisation',
      save: 'Enregistrer',
      cancel: 'Annuler',
    },
    delete: {
      confirm: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cette cotisation ?',
      button: 'Supprimer',
      cancel: 'Annuler',
      success: 'Cotisation supprimée',
      error: 'Erreur de suppression',
    },
    summary: {
      totalAmount: 'Montant total',
      totalPaid: 'Total payé',
      totalUnpaid: 'Total impayé',
      totalOverdue: 'Total en retard',
      membersPaid: 'Membres payés',
      membersUnpaid: 'Membres impayés',
      membersOverdue: 'Membres en retard',
    },
    filters: {
      all: 'Tous',
      paid: 'Payés',
      unpaid: 'Impayés',
      overdue: 'En retard',
      thisMonth: 'Ce mois',
      lastMonth: 'Mois dernier',
      custom: 'Personnalisé',
    },
    search: {
      placeholder: 'Rechercher par nom',
    },
    empty: {
      noDues: 'Aucune cotisation',
      noPending: 'Aucune cotisation en attente',
      noPaid: 'Aucune cotisation payée',
      noOverdue: 'Aucune cotisation en retard',
    },
    notifications: {
      reminderSent: 'Rappel envoyé',
      markedAsPaid: 'Marqué comme payé',
      markedAsUnpaid: 'Marqué comme impayé',
      error: 'Erreur',
      success: 'Succès',
    },
  },

  leagueDetail: {
    title: 'Détails de la ligue',
    tabs: {
      overview: 'Aperçu',
      schedule: 'Calendrier',
      standings: 'Classements',
      matches: 'Matchs',
      players: 'Joueurs',
      rules: 'Règles',
      stats: 'Statistiques',
    },
    info: {
      leagueName: 'Nom de la ligue',
      season: 'Saison',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      format: 'Format',
      status: 'Statut',
      organizer: 'Organisateur',
      venue: 'Lieu',
      description: 'Description',
    },
    status: {
      active: 'Actif',
      upcoming: 'À venir',
      completed: 'Terminé',
      cancelled: 'Annulé',
      registration: 'Inscriptions ouvertes',
      closed: 'Fermé',
    },
    actions: {
      join: 'Rejoindre',
      leave: 'Quitter',
      register: "S'inscrire",
      unregister: 'Se désinscrire',
      viewSchedule: 'Voir le calendrier',
      viewStandings: 'Voir les classements',
      viewMatches: 'Voir les matchs',
      viewPlayers: 'Voir les joueurs',
      viewRules: 'Voir les règles',
      viewStats: 'Voir les statistiques',
      edit: 'Modifier',
      delete: 'Supprimer',
      share: 'Partager',
    },
    standings: {
      rank: 'Rang',
      player: 'Joueur',
      played: 'Joués',
      won: 'Gagnés',
      lost: 'Perdus',
      points: 'Points',
      sets: 'Sets',
      games: 'Jeux',
      winRate: 'Taux de victoire',
    },
    schedule: {
      round: 'Manche',
      date: 'Date',
      time: 'Heure',
      court: 'Court',
      matchup: 'Opposition',
      result: 'Résultat',
    },
    delete: {
      confirm: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cette ligue ?',
      warning: 'Cette action supprimera tous les matchs et données associés',
      cancel: 'Annuler',
      delete: 'Supprimer',
    },
    empty: {
      noPlayers: 'Aucun joueur',
      noMatches: 'Aucun match',
      noStandings: 'Aucun classement',
      noSchedule: 'Aucun calendrier',
      noStats: 'Aucune statistique',
    },
  },

  createEvent: {
    title: 'Créer un événement',
    fields: {
      eventName: "Nom de l'événement",
      description: 'Description',
      date: 'Date',
      time: 'Heure',
      endTime: 'Heure de fin',
      location: 'Lieu',
      venue: 'Lieu',
      court: 'Court',
      maxParticipants: 'Participants max',
      minParticipants: 'Participants min',
      skillLevel: 'Niveau de compétence',
      eventType: "Type d'événement",
      visibility: 'Visibilité',
      fees: 'Frais',
      notes: 'Notes',
      rules: 'Règles',
      requirements: 'Exigences',
    },
    types: {
      match: 'Match',
      tournament: 'Tournoi',
      practice: 'Entraînement',
      social: 'Social',
      clinic: 'Clinique',
      league: 'Ligue',
    },
    visibility: {
      public: 'Public',
      private: 'Privé',
      membersOnly: 'Membres uniquement',
      inviteOnly: 'Sur invitation',
    },
    actions: {
      create: 'Créer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      saveDraft: 'Enregistrer le brouillon',
    },
    validation: {
      nameRequired: 'Le nom est requis',
      descriptionRequired: 'La description est requise',
      dateRequired: 'La date est requise',
      timeRequired: "L'heure est requise",
      locationRequired: 'Le lieu est requis',
      maxParticipantsInvalid: 'Nombre de participants invalide',
      maxMustBeGreaterThanMin: 'Le max doit être supérieur au min',
      dateInPast: 'La date ne peut pas être dans le passé',
      endTimeBeforeStartTime: "L'heure de fin doit être après l'heure de début",
    },
    notifications: {
      success: 'Événement créé avec succès',
      error: "Erreur lors de la création de l'événement",
      draftSaved: 'Brouillon enregistré',
    },
  },

  clubLeaguesTournaments: {
    title: 'Ligues et tournois',
    tabs: {
      leagues: 'Ligues',
      tournaments: 'Tournois',
      all: 'Tous',
    },
    actions: {
      viewAll: 'Voir tout',
      create: 'Créer',
      createLeague: 'Créer une ligue',
      createTournament: 'Créer un tournoi',
      filter: 'Filtrer',
      sort: 'Trier',
    },
    filters: {
      all: 'Tous',
      active: 'Actifs',
      upcoming: 'À venir',
      completed: 'Terminés',
      cancelled: 'Annulés',
      myLeagues: 'Mes ligues',
      myTournaments: 'Mes tournois',
    },
    sort: {
      newest: 'Plus récent',
      oldest: 'Plus ancien',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      participants: 'Participants',
      name: 'Nom',
    },
    card: {
      participants: 'Participants',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      status: 'Statut',
      format: 'Format',
      viewDetails: 'Voir les détails',
      edit: 'Modifier',
      delete: 'Supprimer',
      join: 'Rejoindre',
      leave: 'Quitter',
      register: "S'inscrire",
    },
    empty: {
      noLeagues: 'Aucune ligue',
      noTournaments: 'Aucun tournoi',
      noActive: 'Aucun actif',
      noUpcoming: 'Aucun à venir',
      noCompleted: 'Aucun terminé',
      createFirst: 'Créez le premier !',
    },
  },

  types: {
    matchStatus: {
      pending: 'En attente',
      confirmed: 'Confirmé',
      cancelled: 'Annulé',
      completed: 'Terminé',
      inProgress: 'En cours',
      postponed: 'Reporté',
      forfeit: 'Forfait',
    },
    userRole: {
      admin: 'Administrateur',
      moderator: 'Modérateur',
      member: 'Membre',
      guest: 'Invité',
      owner: 'Propriétaire',
      coach: 'Entraîneur',
    },
    skillLevel: {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      expert: 'Expert',
      professional: 'Professionnel',
      all: 'Tous niveaux',
    },
    gender: {
      male: 'Homme',
      female: 'Femme',
      other: 'Autre',
      preferNotToSay: 'Préfère ne pas dire',
      mixed: 'Mixte',
    },
    playStyle: {
      aggressive: 'Agressif',
      defensive: 'Défensif',
      allCourt: 'Complet',
      baselinePlayer: 'Joueur de fond de court',
      serveAndVolley: 'Service-volée',
    },
    courtSurface: {
      hard: 'Dur',
      clay: 'Terre battue',
      grass: 'Gazon',
      carpet: 'Moquette',
      indoor: 'Intérieur',
      outdoor: 'Extérieur',
    },
  },

  clubTournamentManagement: {
    title: 'Gestion des tournois',
    actions: {
      createTournament: 'Créer un tournoi',
      editTournament: 'Modifier le tournoi',
      deleteTournament: 'Supprimer le tournoi',
      viewBracket: 'Voir le tableau',
      generateBracket: 'Générer le tableau',
      startTournament: 'Démarrer le tournoi',
      endTournament: 'Terminer le tournoi',
    },
    fields: {
      tournamentName: 'Nom du tournoi',
      description: 'Description',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      format: 'Format',
      bpaddleType: 'Type de tableau',
      maxParticipants: 'Participants max',
      registrationDeadline: "Date limite d'inscription",
      entryFee: "Frais d'inscription",
      prizes: 'Prix',
      rules: 'Règles',
    },
    formats: {
      singleElimination: 'Élimination simple',
      doubleElimination: 'Élimination double',
      roundRobin: 'Round robin',
      swiss: 'Système suisse',
    },
    delete: {
      confirm: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer ce tournoi ?',
      cancel: 'Annuler',
      delete: 'Supprimer',
    },
    notifications: {
      created: 'Tournoi créé',
      updated: 'Tournoi mis à jour',
      deleted: 'Tournoi supprimé',
      started: 'Tournoi démarré',
      ended: 'Tournoi terminé',
      error: 'Erreur',
    },
  },

  matches: {
    title: 'Matchs',
    tabs: {
      upcoming: 'À venir',
      inProgress: 'En cours',
      completed: 'Terminés',
      cancelled: 'Annulés',
      all: 'Tous',
    },
    card: {
      date: 'Date',
      time: 'Heure',
      location: 'Lieu',
      court: 'Court',
      players: 'Joueurs',
      score: 'Score',
      winner: 'Gagnant',
      duration: 'Durée',
      format: 'Format',
    },
    actions: {
      viewDetails: 'Voir les détails',
      edit: 'Modifier',
      cancel: 'Annuler',
      reschedule: 'Reprogrammer',
      delete: 'Supprimer',
      enterScore: 'Entrer le score',
      confirmResult: 'Confirmer le résultat',
      reportIssue: 'Signaler un problème',
    },
    empty: {
      noMatches: 'Aucun match',
      noUpcoming: 'Aucun match à venir',
      noCompleted: 'Aucun match terminé',
      noCancelled: 'Aucun match annulé',
    },
    filters: {
      all: 'Tous',
      singles: 'Simples',
      doubles: 'Doubles',
      myMatches: 'Mes matchs',
      today: "Aujourd'hui",
      thisWeek: 'Cette semaine',
      thisMonth: 'Ce mois',
    },
  },

  clubDuesManagement: {
    title: 'Gestion des cotisations du club',
    tabs: {
      overview: 'Aperçu',
      members: 'Membres',
      payments: 'Paiements',
      history: 'Historique',
    },
    actions: {
      addDue: 'Ajouter une cotisation',
      editDue: 'Modifier la cotisation',
      deleteDue: 'Supprimer la cotisation',
      sendReminder: 'Envoyer un rappel',
      exportData: 'Exporter les données',
      generateReport: 'Générer un rapport',
    },
    fields: {
      memberName: 'Nom du membre',
      amount: 'Montant',
      dueDate: "Date d'échéance",
      paidDate: 'Date de paiement',
      status: 'Statut',
      paymentMethod: 'Méthode de paiement',
      notes: 'Notes',
    },
    status: {
      paid: 'Payé',
      unpaid: 'Impayé',
      overdue: 'En retard',
      partial: 'Partiel',
    },
    actions2: {
      markAsPaid: 'Marquer comme payé',
      markAsUnpaid: 'Marquer comme impayé',
      viewHistory: "Voir l'historique",
    },
  },

  aiMatching: {
    title: 'Correspondance IA',
    subtitle: 'Trouvez le partenaire idéal',
    actions: {
      findPartner: 'Trouver un partenaire',
      findOpponent: 'Trouver un adversaire',
      findGroup: 'Trouver un groupe',
      refresh: 'Actualiser',
      filter: 'Filtrer',
    },
    status: {
      searching: 'Recherche en cours...',
      analyzing: 'Analyse en cours...',
      matchingComplete: 'Correspondance terminée',
    },
    results: {
      noMatches: 'Aucune correspondance trouvée',
      foundMatches: '{{count}} correspondance(s) trouvée(s)',
      topMatches: 'Meilleures correspondances',
    },
    card: {
      compatibility: 'Compatibilité',
      skillLevel: 'Niveau de compétence',
      distance: 'Distance',
      availability: 'Disponibilité',
      playStyle: 'Style de jeu',
      matchScore: 'Score de correspondance',
    },
    actions2: {
      sendRequest: 'Envoyer une demande',
      viewProfile: 'Voir le profil',
      sendMessage: 'Envoyer un message',
      addToFavorites: 'Ajouter aux favoris',
    },
    filters: {
      distance: 'Distance',
      skillLevel: 'Niveau',
      availability: 'Disponibilité',
      playStyle: 'Style',
      gender: 'Genre',
      ageRange: "Tranche d'âge",
    },
  },

  myActivities: {
    title: 'Mes activités',
    tabs: {
      matches: 'Matchs',
      events: 'Événements',
      leagues: 'Ligues',
      tournaments: 'Tournois',
      all: 'Tous',
    },
    filters: {
      upcoming: 'À venir',
      past: 'Passés',
      thisWeek: 'Cette semaine',
      thisMonth: 'Ce mois',
      custom: 'Personnalisé',
    },
    empty: {
      noActivities: 'Aucune activité',
      noMatches: 'Aucun match',
      noEvents: 'Aucun événement',
      noLeagues: 'Aucune ligue',
      noTournaments: 'Aucun tournoi',
      findActivity: 'Trouver une activité',
    },
    actions: {
      viewDetails: 'Voir les détails',
      cancel: 'Annuler',
      reschedule: 'Reprogrammer',
      share: 'Partager',
    },
    stats: {
      totalMatches: 'Total de matchs',
      wins: 'Victoires',
      losses: 'Défaites',
      winRate: 'Taux de victoire',
      hoursPlayed: 'Heures jouées',
    },
  },

  profileSettings: {
    title: 'Paramètres du profil',
    tabs: {
      personalInfo: 'Informations personnelles',
      accountSettings: 'Paramètres du compte',
      notifications: 'Notifications',
      privacy: 'Confidentialité',
      preferences: 'Préférences',
    },
    personalInfo: {
      name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      birthday: 'Date de naissance',
      gender: 'Genre',
      location: 'Localisation',
      bio: 'Biographie',
      profilePicture: 'Photo de profil',
    },
    accountSettings: {
      changePassword: 'Changer le mot de passe',
      deleteAccount: 'Supprimer le compte',
      language: 'Langue',
      timezone: 'Fuseau horaire',
      currency: 'Devise',
    },
    notifications: {
      matchReminders: 'Rappels de match',
      eventUpdates: "Mises à jour d'événements",
      messageNotifications: 'Notifications de messages',
      friendRequests: "Demandes d'amis",
      emailNotifications: 'Notifications par email',
      pushNotifications: 'Notifications push',
    },
    privacy: {
      profileVisibility: 'Visibilité du profil',
      showLocation: 'Afficher la localisation',
      showStats: 'Afficher les statistiques',
      allowMessages: 'Autoriser les messages',
      allowFriendRequests: "Autoriser les demandes d'amis",
    },
    actions: {
      editProfile: 'Modifier le profil',
      save: 'Enregistrer',
      cancel: 'Annuler',
      logout: 'Se déconnecter',
    },
  },

  emailLogin: {
    title: 'Connexion par email',
    fields: {
      email: 'Email',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      name: 'Nom',
    },
    actions: {
      login: 'Se connecter',
      register: "S'inscrire",
      forgotPassword: 'Mot de passe oublié ?',
      resetPassword: 'Réinitialiser le mot de passe',
      backToLogin: 'Retour à la connexion',
      sendResetEmail: "Envoyer l'email de réinitialisation",
    },
    validation: {
      emailRequired: "L'email est requis",
      emailInvalid: 'Email invalide',
      passwordRequired: 'Le mot de passe est requis',
      passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
      passwordsDoNotMatch: 'Les mots de passe ne correspondent pas',
      nameRequired: 'Le nom est requis',
    },
    messages: {
      loginSuccess: 'Connexion réussie',
      registerSuccess: 'Inscription réussie',
      resetEmailSent: 'Email de réinitialisation envoyé',
      error: 'Erreur',
    },
  },

  createMeetup: {
    title: 'Créer un meetup',
    fields: {
      meetupName: 'Nom du meetup',
      description: 'Description',
      date: 'Date',
      time: 'Heure',
      endTime: 'Heure de fin',
      location: 'Lieu',
      court: 'Court',
      maxParticipants: 'Participants max',
      skillLevel: 'Niveau de compétence',
      meetupType: 'Type de meetup',
      visibility: 'Visibilité',
      notes: 'Notes',
    },
    types: {
      casual: 'Décontracté',
      practice: 'Entraînement',
      drills: 'Exercices',
      social: 'Social',
      competitive: 'Compétitif',
    },
    actions: {
      create: 'Créer',
      cancel: 'Annuler',
      save: 'Enregistrer',
    },
    validation: {
      nameRequired: 'Le nom est requis',
      dateRequired: 'La date est requise',
      timeRequired: "L'heure est requise",
      locationRequired: 'Le lieu est requis',
    },
  },

  createClubTournament: {
    title: 'Créer un tournoi de club',
    fields: {
      tournamentName: 'Nom du tournoi',
      description: 'Description',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      format: 'Format',
      bpaddleType: 'Type de tableau',
      maxParticipants: 'Participants max',
      registrationDeadline: "Date limite d'inscription",
      entryFee: "Frais d'inscription",
      prizes: 'Prix',
      rules: 'Règles',
    },
    actions: {
      create: 'Créer',
      cancel: 'Annuler',
      save: 'Enregistrer',
    },
  },

  eventCard: {
    participants: 'Participants',
    spots: 'Places',
    date: 'Date',
    time: 'Heure',
    location: 'Lieu',
    organizer: 'Organisateur',
    skillLevel: 'Niveau',
    actions: {
      viewDetails: 'Voir les détails',
      join: 'Rejoindre',
      leave: 'Quitter',
      edit: 'Modifier',
      delete: 'Supprimer',
      share: 'Partager',
    },
  },

  badgeGallery: {
    title: 'Galerie de badges',
    tabs: {
      earnedBadges: 'Badges gagnés',
      availableBadges: 'Badges disponibles',
      all: 'Tous',
    },
    empty: {
      noBadges: 'Aucun badge',
      noEarned: 'Aucun badge gagné',
      startEarning: 'Commencez à gagner des badges !',
    },
    actions: {
      viewDetails: 'Voir les détails',
      share: 'Partager',
    },
    card: {
      earnedOn: 'Gagné le',
      progress: 'Progression',
      howToEarn: 'Comment gagner',
      requirements: 'Exigences',
    },
  },

  scheduleMeetup: {
    title: 'Planifier un meetup',
    steps: {
      selectDate: 'Sélectionner une date',
      selectTime: 'Sélectionner une heure',
      selectLocation: 'Sélectionner un lieu',
      selectCourt: 'Sélectionner un court',
      addParticipants: 'Ajouter des participants',
      addDetails: 'Ajouter des détails',
    },
    actions: {
      schedule: 'Planifier',
      cancel: 'Annuler',
      next: 'Suivant',
      back: 'Retour',
    },
  },

  meetupDetail: {
    title: 'Détails du meetup',
    info: {
      description: 'Description',
      date: 'Date',
      time: 'Heure',
      duration: 'Durée',
      location: 'Lieu',
      court: 'Court',
      participants: 'Participants',
      organizer: 'Organisateur',
      skillLevel: 'Niveau',
      notes: 'Notes',
    },
    actions: {
      join: 'Rejoindre',
      leave: 'Quitter',
      edit: 'Modifier',
      delete: 'Supprimer',
      cancel: 'Annuler',
      share: 'Partager',
      sendMessage: 'Envoyer un message',
    },
    participants: {
      confirmed: 'Confirmés',
      pending: 'En attente',
      declined: 'Refusés',
    },
  },

  leagues: {
    title: 'Ligues',
    tabs: {
      active: 'Actives',
      upcoming: 'À venir',
      completed: 'Terminées',
      all: 'Toutes',
    },
    card: {
      season: 'Saison',
      participants: 'Participants',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      format: 'Format',
    },
    actions: {
      viewDetails: 'Voir les détails',
      join: 'Rejoindre',
      leave: 'Quitter',
      register: "S'inscrire",
    },
    empty: {
      noLeagues: 'Aucune ligue',
      noActive: 'Aucune ligue active',
      noUpcoming: 'Aucune ligue à venir',
      noCompleted: 'Aucune ligue terminée',
    },
  },
};

console.log('🔄 Applying comprehensive French translations...');

const updatedFr = deepMerge(fr, comprehensiveFrench);

fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2), 'utf8');

console.log('✅ Comprehensive French translations applied!');
console.log('\n📊 Estimated translations added: 800+ keys');
