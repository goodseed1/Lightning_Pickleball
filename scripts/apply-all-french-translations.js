#!/usr/bin/env node

/**
 * Script pour appliquer TOUTES les 212 traductions françaises manquantes
 * Utilise deepMerge pour préserver les traductions existantes
 */

const fs = require('fs');
const path = require('path');

const FR_PATH = path.join(__dirname, '../src/locales/fr.json');

// Charger le fichier français existant
const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));

// TOUTES les 212 traductions françaises organisées par section
const allFrenchTranslations = {
  // 1. leagueDetail (12 clés)
  leagueDetail: {
    notification: 'Notification',
    champion: 'Champion',
    tabs: {
      participants: 'Participants',
    },
    emptyStates: {
      noStandingsDescription: 'Les classements apparaîtront au fur et à mesure des matchs.',
    },
    standings: {
      player: 'Joueur',
      points: 'Points',
      playoffTitle: 'Classement des playoffs',
    },
    playoffs: {
      inProgress: 'Playoffs en cours',
      tapHint: 'Appuyez pour voir le tableau',
      seasonComplete: 'Saison régulière terminée !',
    },
    matchApproval: {
      pendingTitle: "En attente d'approbation ({{count}} matchs)",
    },
    roundRobin: {
      inProgress: 'Round robin en cours',
    },
  },

  // 2. clubTournamentManagement (11 clés)
  clubTournamentManagement: {
    detailTabs: {
      participants: 'Participants',
    },
    participants: {
      label: 'Participants',
    },
    roundGeneration: {
      roundComplete: 'Tour {{round}} terminé',
    },
    tournamentStart: {
      registrationClosedMessage: 'Inscriptions fermées et tableau généré. Le tournoi a commencé !',
      waitForParticipantAddition:
        "Veuillez patienter jusqu'à ce que l'ajout des participants soit terminé.",
    },
    seedAssignment: {
      seedRangeError: 'Le numéro de tête de série doit être entre 1 et {{max}}',
    },
    participantRemoval: {
      confirmMessageTeam: "Retirer l'équipe {{name}} du tournoi ?",
      successMessageTeam: "L'équipe {{name}} a été retirée avec succès.",
      unknownError: 'Erreur inconnue.',
    },
    participantAdd: {
      partialSuccessMessageWithDetails:
        'Succès : {{successCount}}\n{{successNames}}\n\nÉchec : {{failedCount}}\n{{failedDetails}}',
    },
    management: {
      tournamentCompleted: 'Le tournoi est terminé.',
    },
  },

  // 3. findClub (9 clés)
  findClub: {
    searching: 'Recherche de clubs...',
    searchPlaceholder: 'Rechercher par nom de club, localisation...',
    searchResults: "Résultats de recherche pour '{{query}}' : {{count}}",
    totalClubs: 'Total de clubs : {{count}}',
    joinButton: 'Demander',
    labels: {
      public: 'Public',
    },
    status: {
      join: 'Demander à rejoindre',
      declined: 'Demande refusée',
    },
    empty: {
      tryDifferent: 'Essayez un autre terme de recherche',
    },
  },

  // 4. modals (8 clés)
  modals: {
    tournamentCompleted: {
      title: 'Victoire au tournoi !',
      viewFeed: 'Voir le fil du club',
    },
    leagueCompleted: {
      points: 'pts',
      viewFeed: 'Voir le fil du club',
    },
    playoffCreated: {
      title: 'Playoff créé !',
      playoffType: 'Format playoff',
      semifinals: 'Demi-finales + Finale',
    },
    chatUI: {
      inputPlaceholder: 'Tapez un message...',
    },
  },

  // 5. clubLeaguesTournaments (7 clés)
  clubLeaguesTournaments: {
    status: {
      preparing: 'En préparation',
      unavailable: 'Indisponible',
    },
    labels: {
      participants: 'Participants',
      format: 'Format',
    },
    memberPreLeagueStatus: {
      participantsStatus: 'Participants',
      peopleUnit: 'personnes',
      format: 'Format',
    },
  },

  // 6. createEvent (7 clés)
  createEvent: {
    eventType: {
      match: 'Match',
    },
    fields: {
      description: 'Description',
    },
    languages: {
      korean: '한국어',
      chinese: '中文',
      japanese: '日本語',
      spanish: 'Español',
      french: 'Français',
    },
  },

  // 7. duesManagement (7 clés)
  duesManagement: {
    settings: {
      venmo: 'Venmo',
    },
    overview: {
      totalOwed: 'Total dû',
      totalPaid: 'Total payé',
    },
    report: {
      totalColumn: 'Total',
    },
    paymentDetails: {
      type: 'Type',
      notes: 'Notes',
    },
    countSuffix: '',
  },

  // 8. aiMatching (7 clés)
  aiMatching: {
    analyzing: {
      steps: {
        location: 'Recherche par localisation...',
        selection: 'Sélection des meilleurs matchs...',
      },
    },
    candidate: {
      strengths: {
        endurance: 'Endurance',
        mental: 'Mental',
      },
    },
    mockData: {
      candidate1: {
        name: 'Junsu Kim',
      },
      candidate2: {
        name: 'Seoyeon Lee',
      },
      candidate3: {
        name: 'Minjae Park',
      },
    },
  },

  // 9. editProfile (6 clés)
  editProfile: {
    photoHint: 'Appuyez pour changer la photo',
    nickname: {
      unavailableMessage: "Ce pseudo n'est pas disponible. Veuillez en choisir un autre.",
    },
    skillLevel: {
      expert: 'Expert',
    },
    languages: {
      select: 'Sélectionner les langues',
    },
    errors: {
      imageSelectError: "Impossible de sélectionner l'image.",
    },
    common: {
      ok: 'OK',
    },
  },

  // 10. achievementsGuide (6 clés)
  achievementsGuide: {
    seasonTrophies: 'Trophées de saison',
    badges: 'Badges',
    categories: {
      social: 'Réalisations sociales',
      tournaments: 'Réalisations de tournoi',
      streaks: 'Réalisations de séries',
      special: 'Réalisations spéciales',
    },
  },

  // 11. matches (6 clés)
  matches: {
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    createModal: {
      maxParticipants: {
        placeholder: '4',
      },
      description: {
        label: 'Description',
      },
    },
  },

  // 12. hostedEventCard (5 clés)
  hostedEventCard: {
    eventTypes: {
      match: 'Match',
      lightning: 'Match',
      ranked: 'Classé',
    },
    weather: {
      conditions: {
        Showers: 'Averses',
      },
    },
    participants: '{{current}}/{{max}}',
  },

  // 13. manageLeagueParticipants (5 clés)
  manageLeagueParticipants: {
    setScores: 'Définir les scores',
    set: 'Set',
    removeSet: 'Retirer le set',
    resultPreview: 'Aperçu du résultat',
    errors: {
      selectWinner: 'Veuillez sélectionner un gagnant',
    },
  },

  // 14. badgeGallery (5 clés)
  badgeGallery: {
    badges: {
      social_player: {
        description: 'A joué des matchs avec 5+ joueurs !',
      },
      winning_streak_10: {
        name: 'Inarrêtable',
      },
      match_milestone_10: {
        description: 'Jouer 10 matchs',
      },
      match_milestone_50: {
        description: 'Jouer 50 matchs',
      },
      match_milestone_100: {
        description: 'Jouer 100 matchs',
      },
    },
  },

  // 15. performanceDashboard (5 clés)
  performanceDashboard: {
    charts: {
      skillProgress: {
        title: 'Progression du niveau de compétence',
      },
      timePerformance: {
        subtitle: 'Heures de jeu préférées',
      },
    },
    insights: {
      title: 'Aperçus de performance',
      recommendations: 'Recommandations :',
    },
    monthlyReport: {
      highlights: 'Faits marquants du mois',
    },
  },

  // 16. units (4 clés)
  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },

  // 17. admin (4 clés)
  admin: {
    devTools: {
      mile: 'mile',
      miles: 'miles',
      resetLeagueMessage:
        'Réinitialiser toutes les statistiques de ligue des membres à 0 ?\n\n⚠️ Cette action ne peut pas être annulée.\n✅ Les statistiques de tournoi seront préservées.',
    },
    matchManagement: {
      total: 'Total',
    },
  },

  // 18. profileSettings (4 clés)
  profileSettings: {
    privacy: {
      title: 'Paramètres de confidentialité',
      comingSoonMessage: 'Fonctionnalité de paramètres de confidentialité à venir.',
    },
    deleteAccount: {
      nicknameRequiredMessage:
        'Veuillez entrer votre pseudo pour procéder à la suppression du compte.',
      noticeMessage:
        'Un problème est survenu lors de la suppression de votre compte. Veuillez réessayer.',
    },
  },

  // 19. eventCard (4 clés)
  eventCard: {
    eventTypes: {
      match: 'Match',
      lightning: 'Match',
    },
    labels: {
      participants: '{{current}}/{{max}}',
    },
    soloApplicants: {
      count: '{{count}} solo',
    },
  },

  // 20. eventParticipation (4 clés)
  eventParticipation: {
    tabs: {
      participants: 'Participants',
    },
    details: {
      participants: 'participants',
    },
    participants: {
      list: 'Participants',
    },
    typeLabels: {
      participant: 'Participant',
    },
  },

  // 21. tournamentDetail (4 clés)
  tournamentDetail: {
    info: 'Info',
    participants: 'Participants',
    participantsSuffix: '',
    bestFinish: {
      champion: '🥇 Champion',
    },
  },

  // 22. eventChat (4 clés)
  eventChat: {
    inputPlaceholder: 'Tapez un message...',
    errors: {
      networkError: 'Veuillez vérifier votre connexion réseau et réessayer.',
      unknownError: 'Erreur inconnue',
      userNotFound: 'Informations utilisateur introuvables.',
    },
  },

  // 23. eventDetail (4 clés)
  eventDetail: {
    participants: {
      label: 'participants',
      count: '',
    },
    sections: {
      description: 'Description',
      participants: 'Participants ({{count}})',
    },
  },

  // 24. hallOfFame (4 clés)
  hallOfFame: {
    counts: {
      badges: '{{count}} badges',
    },
    sections: {
      badges: 'Badges',
    },
    honorBadges: {
      receivedCount: '×{{count}}',
    },
    badges: 'badges',
  },

  // 25-45: Sections restantes (3 clés ou moins)
  alert: {
    tournamentBpaddle: {
      info: 'Info',
      participants: 'Participants',
      participantsTab: 'Participants',
    },
  },

  discover: {
    tabs: {
      clubs: 'Clubs',
      services: 'Services',
    },
    skillFilters: {
      expert: 'Expert',
    },
  },

  clubDuesManagement: {
    unpaid: {
      management: 'Gestion des membres impayés',
      sendReminders: 'Envoyer des rappels',
      list: 'Liste des membres impayés',
    },
  },

  meetupDetail: {
    participants: {
      title: 'Participants',
    },
    editEvent: {
      labelDescription: 'Description',
      durationUnit: 'min',
    },
  },

  recordScore: {
    set: 'Set',
    setN: 'Set {{n}}',
    alerts: {
      globalRanking: 'Global',
    },
  },

  directChat: {
    club: 'Club',
    headerTitle: 'Messages',
    tabs: {
      conversations: 'Conversations',
    },
  },

  clubPolicies: {
    sections: {
      meetings: 'Horaires de réunion réguliers',
    },
    fees: {
      qrHint: 'Appuyez sur un mode de paiement avec une icône QR pour voir le code QR',
    },
    defaultClubName: 'Club',
  },

  utils: {
    ltr: {
      whatIsLtr: {
        content:
          "LPR (Lightning Pickleball Rating) est un système propriétaire d'évaluation des compétences développé exclusivement pour la communauté Lightning Pickleball. Le LPR est calculé sur la base de l'algorithme ELO appliqué à tous les résultats de matchs éclair publics, montrant votre parcours de croissance sur une échelle intuitive de 1 à 10. C'est un indicateur honorable de votre progression au sein de notre écosystème.",
      },
      relationToNtrp: {
        title: 'Relation avec le NTRP',
        content:
          "Le LPR est un système unique distinct du NTRP de l'USTA. Pour la commodité des utilisateurs familiers avec les cotes NTRP, vous pouvez sélectionner votre niveau de compétence dans une plage similaire au NTRP lors de l'inscription, mais tous les niveaux officiels calculés et affichés dans l'application sont basés sur le LPR.",
      },
    },
  },

  rateSportsmanship: {
    alerts: {
      tagsRequiredMessage: 'Veuillez sélectionner au moins une étiquette pour chaque participant',
      badgesAwardedMessage: 'Les étiquettes de fair-play ont été attribuées avec succès. Merci !',
    },
  },

  createMeetup: {
    location: {
      searchPickleballCourt: 'Rechercher un court de pickleball',
      searchHelper: 'Appuyez pour rechercher un court de pickleball.',
    },
  },

  clubAdmin: {
    participation: 'Participation',
    chatNormal: 'Normal',
  },

  appliedEventCard: {
    eventType: {
      match: 'Match',
    },
    teams: {
      participants: 'Participants ({{count}})',
    },
  },

  createClubLeague: {
    nameRequired: 'Veuillez entrer un nom de saison',
    ok: 'OK',
  },

  serviceForm: {
    description: 'Description',
    photos: 'Photos (max {{max}})',
  },

  pastEventCard: {
    eventTypes: {
      match: 'Match',
    },
    challenger: 'Challenger',
  },

  types: {
    dues: {
      period: {
        year: '{{year}}',
        yearMonth: '{{month}}/{{year}}',
      },
    },
  },

  leagues: {
    admin: {
      maxParticipants: 'Max',
    },
    match: {
      court: 'Court',
    },
  },

  services: {
    activity: {
      notifications: {
        defaultTitle: 'Notification',
      },
    },
    leaderboard: {
      achievements: {
        skillLevel85: {
          name: 'Expert',
        },
      },
    },
  },

  navigation: {
    clubs: 'Clubs',
  },

  createClub: {
    fields: {
      logo: 'Logo',
    },
  },

  clubList: {
    clubType: {
      social: 'Social',
    },
  },

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

  ntrp: {
    label: {
      expert: 'Expert',
    },
  },

  clubChat: {
    important: 'Important',
  },

  clubSelector: {
    club: 'Club',
  },

  emailLogin: {
    verification: {
      sentTo: '{{email}}',
    },
  },

  clubScheduleSettings: {
    fields: {
      description: 'Description',
    },
  },

  lessonCard: {
    currencySuffix: '',
  },

  playerCard: {
    expert: 'Expert',
  },

  weeklySchedule: {
    total: 'Total',
  },

  lessonForm: {
    descriptionLabel: 'Description *',
  },

  concludeLeague: {
    stats: {
      points: '{{points}} pts',
    },
  },

  rankingPrivacy: {
    visibility: {
      public: {
        label: 'Public',
      },
    },
  },

  ntrpLevelDetail: {
    description: 'Description',
  },

  setLocationTimeModal: {
    date: 'Date',
  },

  ltrLevelDetail: {
    description: 'Description',
  },

  ntrpSelector: {
    levels: {
      expert: {
        label: '5.0+ (Expert)',
      },
    },
  },

  contexts: {
    auth: {
      tooManyRequests: 'Trop de demandes. Veuillez réessayer plus tard.',
    },
  },

  clubOverviewScreen: {
    important: 'Important',
  },

  tournament: {
    bestFinish: {
      champion: '🥇 Champion',
    },
  },

  policyEditScreen: {
    section: 'Section',
  },

  schedules: {
    form: {
      description: 'Description',
    },
  },

  feedCard: {
    notification: 'Notification',
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

// Appliquer les traductions
console.log('🇫🇷 Application de TOUTES les 212 traductions françaises...\n');

const updatedFr = deepMerge(fr, allFrenchTranslations);

// Sauvegarder le fichier mis à jour
fs.writeFileSync(FR_PATH, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('✅ TOUTES les traductions françaises ont été appliquées avec succès !\n');
console.log('📊 Statistiques:');
console.log('  - Total de clés traduites: 212');
console.log('  - Sections mises à jour: 45+');
console.log(
  '\nLes traductions ont été fusionnées avec deepMerge pour préserver les traductions existantes.'
);
console.log('\n🎯 Prochaine étape: Exécutez "npm run lint" pour vérifier la qualité du code.\n');
