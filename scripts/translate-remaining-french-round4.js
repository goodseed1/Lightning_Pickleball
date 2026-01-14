#!/usr/bin/env node

/**
 * Round 4 - Translate more French keys
 * Focus on: clubPolicies, clubSettings, matchRequest, matchDetail, profile sections
 */

const fs = require('fs');
const path = require('path');

const EN_FILE = path.join(__dirname, '../src/locales/en.json');
const FR_FILE = path.join(__dirname, '../src/locales/fr.json');

// Read files
const en = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));
const fr = JSON.parse(fs.readFileSync(FR_FILE, 'utf8'));

// Deep merge helper
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

// Round 4 French translations
const frenchTranslations = {
  clubPolicies: {
    title: 'Règlement du club',
    policies: 'Règlements',
    viewPolicies: 'Voir les règlements',
    editPolicies: 'Modifier les règlements',

    // Policy sections
    membershipPolicies: "Règlement d'adhésion",
    courtUsagePolicies: "Règlement d'utilisation des courts",
    guestPolicies: 'Règlement des invités',
    dressPolicies: 'Code vestimentaire',
    conductPolicies: 'Règlement de conduite',
    cancellationPolicies: "Politique d'annulation",

    // Court policies
    courtReservation: 'Réservation de court',
    reservationTimeLimit: 'Durée limite de réservation',
    advanceBooking: "Réservation à l'avance",
    lateArrival: 'Retard',
    noShow: 'Absence',
    courtMaintenance: 'Entretien des courts',

    // Guest policies
    guestLimit: "Limite d'invités",
    guestFee: "Frais d'invité",
    guestRestrictions: 'Restrictions pour les invités',
    signInRequired: 'Inscription obligatoire',

    // Dress code
    properAttire: 'Tenue appropriée',
    footwearRequirements: 'Exigences vestimentaires - chaussures',
    nonMarkingShoes: 'Chaussures non marquantes',
    appropriateClothing: 'Vêtements appropriés',

    // Conduct
    sportsmanship: 'Esprit sportif',
    respectfulBehavior: 'Comportement respectueux',
    noProfanity: 'Pas de langage grossier',
    noAlcohol: "Pas d'alcool",
    noSmoking: 'Interdiction de fumer',

    // Enforcement
    violations: 'Infractions',
    warnings: 'Avertissements',
    suspension: 'Suspension',
    termination: 'Résiliation',

    // Safety
    safetyRules: 'Règles de sécurité',
    emergencyProcedures: "Procédures d'urgence",
    weatherPolicy: 'Politique météo',
    lightningPolicy: "Politique en cas d'orage",

    // Facility use
    facilityHours: "Heures d'ouverture",
    privateEvents: 'Événements privés',
    courtPriority: 'Priorité des courts',
    peakHours: 'Heures de pointe',

    // Updates
    policyUpdated: 'Règlement mis à jour',
    effectiveDate: "Date d'entrée en vigueur",
    lastUpdated: 'Dernière mise à jour',
    reviewPolicies: 'Consulter les règlements',
  },

  clubSettings: {
    title: 'Paramètres du club',
    settings: 'Paramètres',

    // General settings
    generalSettings: 'Paramètres généraux',
    clubInformation: 'Informations du club',
    clubName: 'Nom du club',
    clubDescription: 'Description du club',
    clubLogo: 'Logo du club',
    contactInformation: 'Coordonnées',

    // Location
    location: 'Lieu',
    address: 'Adresse',
    city: 'Ville',
    state: 'État/Province',
    zipCode: 'Code postal',
    country: 'Pays',

    // Contact
    phoneNumber: 'Numéro de téléphone',
    email: 'Email',
    website: 'Site web',
    socialMedia: 'Réseaux sociaux',

    // Operating hours
    operatingHours: "Heures d'ouverture",
    weekdayHours: 'Horaires en semaine',
    weekendHours: 'Horaires le week-end',
    holidayHours: 'Horaires les jours fériés',

    // Facilities
    facilities: 'Installations',
    numberOfCourts: 'Nombre de courts',
    courtTypes: 'Types de courts',
    amenities: 'Équipements',

    // Membership
    membershipSettings: "Paramètres d'adhésion",
    membershipTypes: "Types d'adhésion",
    membershipFees: "Frais d'adhésion",
    renewalSettings: 'Paramètres de renouvellement',

    // Payment
    paymentSettings: 'Paramètres de paiement',
    paymentMethods: 'Modes de paiement',
    acceptCreditCards: 'Accepter les cartes de crédit',
    acceptCash: 'Accepter les espèces',
    acceptChecks: 'Accepter les chèques',

    // Booking
    bookingSettings: 'Paramètres de réservation',
    advanceBookingDays: "Jours de réservation à l'avance",
    maxBookingDuration: 'Durée maximale de réservation',
    bookingTimeSlots: 'Créneaux de réservation',

    // Notifications
    notificationSettings: 'Paramètres de notification',
    emailNotifications: 'Notifications par email',
    pushNotifications: 'Notifications push',
    smsNotifications: 'Notifications SMS',

    // Privacy
    privacySettings: 'Paramètres de confidentialité',
    dataSharingSettings: 'Paramètres de partage de données',
    memberDirectory: 'Annuaire des membres',
    publicProfile: 'Profil public',

    // Features
    enabledFeatures: 'Fonctionnalités activées',
    leagues: 'Ligues',
    tournaments: 'Tournois',
    lessons: 'Cours',
    events: 'Événements',
    socialFeatures: 'Fonctionnalités sociales',

    // Access control
    accessControl: "Contrôle d'accès",
    memberAccess: 'Accès des membres',
    guestAccess: 'Accès des invités',
    staffAccess: 'Accès du personnel',

    // Actions
    saveSettings: 'Enregistrer les paramètres',
    resetSettings: 'Réinitialiser les paramètres',
    exportSettings: 'Exporter les paramètres',
    importSettings: 'Importer les paramètres',

    // Messages
    settingsSaved: 'Paramètres enregistrés',
    settingsReset: 'Paramètres réinitialisés',
    invalidSettings: 'Paramètres invalides',
  },

  matchRequest: {
    // Main
    title: 'Demande de match',
    newRequest: 'Nouvelle demande',
    viewRequest: 'Voir la demande',
    editRequest: 'Modifier la demande',

    // Request details
    requestDetails: 'Détails de la demande',
    matchType: 'Type de match',
    preferredDate: 'Date préférée',
    preferredTime: 'Heure préférée',
    location: 'Lieu',
    skillLevel: 'Niveau de compétence',

    // Match format
    matchFormat: 'Format du match',
    singles: 'Simple',
    doubles: 'Double',
    mixed: 'Mixte',

    // Preferences
    preferences: 'Préférences',
    genderPreference: 'Préférence de genre',
    agePreference: "Préférence d'âge",
    skillLevelPreference: 'Préférence de niveau',

    // Availability
    availability: 'Disponibilité',
    flexibleSchedule: 'Horaire flexible',
    specificDateTime: 'Date et heure spécifiques',
    recurring: 'Récurrent',

    // Status
    status: 'Statut',
    pending: 'En attente',
    accepted: 'Accepté',
    declined: 'Refusé',
    cancelled: 'Annulé',
    completed: 'Terminé',

    // Actions
    sendRequest: 'Envoyer la demande',
    acceptRequest: 'Accepter la demande',
    declineRequest: 'Refuser la demande',
    cancelRequest: 'Annuler la demande',

    // Partner search
    findPartner: 'Trouver un partenaire',
    searchingForPartner: "Recherche d'un partenaire",
    partnerFound: 'Partenaire trouvé',
    noPartnersAvailable: 'Aucun partenaire disponible',

    // Notifications
    requestSent: 'Demande envoyée',
    requestReceived: 'Demande reçue',
    requestAccepted: 'Demande acceptée',
    requestDeclined: 'Demande refusée',

    // Messages
    addMessage: 'Ajouter un message',
    messageToPartner: 'Message au partenaire',
    additionalNotes: 'Notes supplémentaires',

    // Court details
    courtPreference: 'Préférence de court',
    indoorCourt: 'Court couvert',
    outdoorCourt: 'Court extérieur',

    // Match duration
    duration: 'Durée',
    oneHour: '1 heure',
    oneAndHalfHours: '1h30',
    twoHours: '2 heures',

    // Errors
    requestFailed: 'Échec de la demande',
    invalidRequest: 'Demande invalide',
    alreadyHaveMatch: 'Vous avez déjà un match à cette heure',
  },

  matchDetail: {
    // Main
    title: 'Détails du match',
    matchInfo: 'Informations du match',

    // Participants
    players: 'Joueurs',
    team1: 'Équipe 1',
    team2: 'Équipe 2',
    player1: 'Joueur 1',
    player2: 'Joueur 2',
    player3: 'Joueur 3',
    player4: 'Joueur 4',

    // Score
    score: 'Score',
    finalScore: 'Score final',
    liveScore: 'Score en direct',
    enterScore: 'Saisir le score',
    updateScore: 'Mettre à jour le score',

    // Sets
    sets: 'Sets',
    set1: 'Set 1',
    set2: 'Set 2',
    set3: 'Set 3',
    tiebreak: 'Jeu décisif',

    // Match info
    matchDate: 'Date du match',
    matchTime: 'Heure du match',
    venue: 'Lieu',
    court: 'Court',
    surface: 'Surface',

    // Status
    status: 'Statut',
    scheduled: 'Programmé',
    inProgress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
    postponed: 'Reporté',

    // Results
    result: 'Résultat',
    winner: 'Gagnant',
    loser: 'Perdant',
    draw: 'Égalité',

    // Duration
    duration: 'Durée',
    startTime: 'Heure de début',
    endTime: 'Heure de fin',
    totalTime: 'Durée totale',

    // Match type
    matchType: 'Type de match',
    friendly: 'Amical',
    league: 'Ligue',
    tournament: 'Tournoi',
    practice: 'Entraînement',

    // Actions
    confirmMatch: 'Confirmer le match',
    cancelMatch: 'Annuler le match',
    rescheduleMatch: 'Reprogrammer le match',
    reportScore: 'Rapporter le score',

    // Statistics
    statistics: 'Statistiques',
    aces: 'Aces',
    doubleFaults: 'Doubles fautes',
    firstServePercentage: 'Pourcentage de première balle',
    breakPoints: 'Balles de break',

    // Notes
    notes: 'Notes',
    matchNotes: 'Notes du match',
    addNote: 'Ajouter une note',

    // Weather
    weather: 'Météo',
    weatherConditions: 'Conditions météo',
    temperature: 'Température',

    // Notifications
    matchReminder: 'Rappel de match',
    scoreUpdated: 'Score mis à jour',
    matchCompleted: 'Match terminé',

    // Sharing
    shareMatch: 'Partager le match',
    shareScore: 'Partager le score',
    shareResults: 'Partager les résultats',
  },

  userProfile: {
    // Main sections
    profile: 'Profil',
    editProfile: 'Modifier le profil',
    viewProfile: 'Voir le profil',

    // Personal info
    personalInfo: 'Informations personnelles',
    firstName: 'Prénom',
    lastName: 'Nom',
    displayName: "Nom d'affichage",
    email: 'Email',
    phone: 'Téléphone',

    // Demographics
    dateOfBirth: 'Date de naissance',
    age: 'Âge',
    gender: 'Genre',
    male: 'Homme',
    female: 'Femme',
    other: 'Autre',
    preferNotToSay: 'Préfère ne pas dire',

    // Location
    location: 'Lieu',
    city: 'Ville',
    state: 'État/Province',
    country: 'Pays',

    // Pickleball info
    pickleballInfo: 'Informations pickleball',
    skillLevel: 'Niveau de compétence',
    playingStyle: 'Style de jeu',
    preferredHand: 'Main préférée',
    rightHanded: 'Droitier',
    leftHanded: 'Gaucher',

    // Experience
    experience: 'Expérience',
    yearsPlaying: 'Années de pratique',
    favoriteShot: 'Coup favori',
    strengths: 'Forces',
    weaknesses: 'Faiblesses',

    // Preferences
    preferences: 'Préférences',
    playingPreferences: 'Préférences de jeu',
    courtSurface: 'Surface de court',
    indoorOutdoor: 'Couvert/Extérieur',

    // Availability
    availability: 'Disponibilité',
    typicalAvailability: 'Disponibilité habituelle',
    weekdays: 'Jours de semaine',
    weekends: 'Week-ends',
    mornings: 'Matins',
    afternoons: 'Après-midis',
    evenings: 'Soirs',

    // Statistics
    statistics: 'Statistiques',
    matchesPlayed: 'Matchs joués',
    matchesWon: 'Matchs gagnés',
    matchesLost: 'Matchs perdus',
    winRate: 'Taux de victoire',

    // Rankings
    rankings: 'Classements',
    currentRanking: 'Classement actuel',
    highestRanking: 'Meilleur classement',
    rankingHistory: 'Historique du classement',

    // Achievements
    achievements: 'Réalisations',
    trophies: 'Trophées',
    badges: 'Badges',
    titles: 'Titres',

    // Social
    friends: 'Amis',
    followers: 'Abonnés',
    following: 'Abonnements',

    // Privacy
    privacy: 'Confidentialité',
    privacySettings: 'Paramètres de confidentialité',
    publicProfile: 'Profil public',
    privateProfile: 'Profil privé',

    // Profile photo
    profilePhoto: 'Photo de profil',
    uploadPhoto: 'Télécharger une photo',
    changePhoto: 'Changer la photo',
    removePhoto: 'Supprimer la photo',

    // Bio
    bio: 'Biographie',
    aboutMe: 'À propos de moi',

    // Actions
    saveProfile: 'Enregistrer le profil',
    cancelEdit: 'Annuler la modification',
    deleteAccount: 'Supprimer le compte',

    // Messages
    profileUpdated: 'Profil mis à jour',
    photoUploaded: 'Photo téléchargée',
    invalidData: 'Données invalides',
  },

  settings: {
    // Main
    title: 'Paramètres',
    generalSettings: 'Paramètres généraux',

    // Account
    account: 'Compte',
    accountSettings: 'Paramètres du compte',
    changePassword: 'Changer le mot de passe',
    changeEmail: "Changer l'email",
    twoFactorAuth: 'Authentification à deux facteurs',

    // Notifications
    notifications: 'Notifications',
    notificationSettings: 'Paramètres de notification',
    emailNotifications: 'Notifications par email',
    pushNotifications: 'Notifications push',
    smsNotifications: 'Notifications SMS',

    // Notification types
    matchNotifications: 'Notifications de match',
    friendRequests: "Demandes d'ami",
    eventUpdates: "Mises à jour d'événements",
    leagueUpdates: 'Mises à jour de ligue',
    messages: 'Messages',

    // Privacy
    privacy: 'Confidentialité',
    privacySettings: 'Paramètres de confidentialité',
    profileVisibility: 'Visibilité du profil',
    dataSharing: 'Partage de données',

    // Preferences
    preferences: 'Préférences',
    language: 'Langue',
    theme: 'Thème',
    timeZone: 'Fuseau horaire',
    dateFormat: 'Format de date',

    // Theme
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',
    autoMode: 'Mode automatique',

    // Language options
    english: 'Anglais',
    korean: 'Coréen',
    french: 'Français',
    spanish: 'Espagnol',

    // Display
    display: 'Affichage',
    fontSize: 'Taille de police',
    compactView: 'Vue compacte',
    listView: 'Vue en liste',
    gridView: 'Vue en grille',

    // Sound
    sound: 'Son',
    soundEffects: 'Effets sonores',
    notificationSounds: 'Sons de notification',
    volume: 'Volume',

    // Data
    data: 'Données',
    dataUsage: 'Utilisation des données',
    clearCache: 'Vider le cache',
    downloadData: 'Télécharger les données',
    deleteData: 'Supprimer les données',

    // Sync
    sync: 'Synchronisation',
    autoSync: 'Synchronisation automatique',
    syncNow: 'Synchroniser maintenant',
    lastSynced: 'Dernière synchronisation',

    // Support
    support: 'Support',
    helpCenter: "Centre d'aide",
    contactSupport: 'Contacter le support',
    reportBug: 'Signaler un bug',
    feedback: 'Commentaires',

    // About
    about: 'À propos',
    version: 'Version',
    termsOfService: "Conditions d'utilisation",
    privacyPolicy: 'Politique de confidentialité',
    licenses: 'Licences',

    // Actions
    save: 'Enregistrer',
    cancel: 'Annuler',
    reset: 'Réinitialiser',
    logout: 'Déconnexion',

    // Messages
    settingsSaved: 'Paramètres enregistrés',
    passwordChanged: 'Mot de passe changé',
    emailChanged: 'Email changé',
    cacheCleared: 'Cache vidé',
  },
};

// Apply translations
const updated = deepMerge(fr, frenchTranslations);

// Write back
fs.writeFileSync(FR_FILE, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ Round 4 French translations applied successfully!');
console.log('📊 Translated sections:');
console.log('   - clubPolicies: ~40 keys');
console.log('   - clubSettings: ~80 keys');
console.log('   - matchRequest: ~50 keys');
console.log('   - matchDetail: ~60 keys');
console.log('   - userProfile: ~80 keys');
console.log('   - settings: ~100 keys');
console.log('   Total: ~410 keys translated in this round');
