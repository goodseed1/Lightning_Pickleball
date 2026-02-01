import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

// Supported languages type (10 languages)
export type SupportedLanguage = 'en' | 'ko' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'pt' | 'it' | 'ru';

// Language configuration interface
export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

// Supported languages configuration (10 languages)
// eslint-disable-next-line react-refresh/only-export-components
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    rtl: false,
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    rtl: false,
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    rtl: false,
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    rtl: false,
  },
];

// Translation strings interface
export interface TranslationStrings {
  // Common
  common: {
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    loading: string;
    error: string;
    success: string;
    yes: string;
    no: string;
    ok: string;
    next: string;
    previous: string;
    skip: string;
    finish: string;
    continue: string;
    required: string;
  };

  // Language Selection
  languageSelection: {
    title: string;
    subtitle: string;
    selectLanguage: string;
    continueButton: string;
  };

  // Authentication
  auth: {
    login: string;
    logout: string;
    signup: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    loginWithGoogle: string;
    loginWithApple: string;
    loginWithFacebook: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
  };

  // Profile Setup
  profileSetup: {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    nickname: string;
    gender: string;
    male: string;
    female: string;
    other: string;
    preferNotToSay: string;
    skillLevel: string;
    beginnerLevel: string;
    intermediateLevel: string;
    advancedLevel: string;
    expertLevel: string;
    communicationLanguages: string;
    activityRegions: string;
    zipCode: string;
    maxTravelDistance: string;
    miles: string;
    notificationDistance: string;
    completeProfile: string;
  };

  // Terms and Conditions
  terms: {
    title: string;
    serviceTerms: string;
    privacyPolicy: string;
    locationServices: string;
    liabilityDisclaimer: string;
    marketingCommunications: string;
    agreeToTerms: string;
    readAndAgree: string;
    required: string;
    optional: string;
  };

  // Navigation
  navigation: {
    home: string;
    discover: string;
    matches: string;
    profile: string;
    clubs: string;
    friends: string;
    settings: string;
    feed: string;
    create: string;
    myClubs: string;
    myProfile: string;
  };

  // Home Screen
  home: {
    welcomeTitle: string;
    subtitle: string;
    createNewMatch: string;
    activeMatches: string;
    todayStats: string;
    onlinePlayers: string;
    myMatches: string;
  };

  // Matches Screen
  matches: {
    title: string;
    personalMatches: string;
    clubEvents: string;
    createMatch: string;
    createEvent: string;
    matchType: string;
    personalMatch: string;
    clubEvent: string;
    location: string;
    dateTime: string;
    maxParticipants: string;
    skillLevel: string;
    description: string;
    allLevels: string;
    recurring: string;
    weekly: string;
    biweekly: string;
    monthly: string;
    joinMatch: string;
    participants: string;
    hostedBy: string;
    manage: string;
    // New translations for HomeScreen
    weekendPickleballMatch: string;
    eveningSinglesGame: string;
    todayAfternoon3: string;
    tomorrowEvening6: string;
    tomorrowAfternoon2: string;
    intermediate3040: string;
    beginner2030: string;
    createLightningMatch: string;
    createNewMatchQuestion: string;
    newPickleballMatch: string;
    nearbyPickleballCourt: string;
    me: string;
    matchCreatedSuccessfully: string;
    joinMatchQuestion: string;
    join: string;
    joinComplete: string;
    joinedSuccessfully: string;
    singles: string;
    doubles: string;
    players: string;
    host: string;
  };

  // Profile Screen
  profile: {
    title: string;
    statistics: string;
    matches: string;
    wins: string;
    losses: string;
    winRate: string;
    currentStreak: string;
    eloRating: string;
    badges: string;
    notificationSettings: string;
    personalMatchNotifications: string;
    clubEventNotifications: string;
    notificationRange: string;
    quietHours: string;
    appSettings: string;
    languageSettings: string;
    privacy: string;
    help: string;
    appInfo: string;
  };

  // Discover Screen
  discover: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    players: string;
    courts: string;
    nearbyPlayers: string;
    nearbyCourts: string;
    connect: string;
    book: string;
    online: string;
    offline: string;
    open: string;
    closed: string;
    // New types for DiscoverScreen translations
    intermediate35: string;
    beginner25: string;
    advanced45: string;
    aggressive: string;
    defensive: string;
    allCourt: string;
    lighting: string;
    lockerRoom: string;
    parking: string;
    proShop: string;
    cafe: string;
    shower: string;
    matches: string;
    connectWithPlayer: string;
    connectWithPlayerQuestion: string;
    sendConnectionRequest: string;
    requestComplete: string;
    connectionRequestSent: string;
    bookCourt: string;
    bookCourtQuestion: string;
    bookingComplete: string;
    courtBookingConfirmed: string;
    closedForBooking: string;
  };

  // Social
  social: {
    activityFeed: string;
    friends: string;
    requests: string;
    discover: string;
    recommended: string;
    friendRequests: string;
    noActivityYet: string;
    activityWillAppearHere: string;
    noFriendsYet: string;
    findPlayersToConnect: string;
    noFriendRequests: string;
    requestsWillAppearHere: string;
    removeFriend: string;
    removeFriendConfirm: string;
    friendRemoved: string;
    declineFriendRequest: string;
    declineRequestConfirm: string;
    friendRequestAccepted: string;
    friendsSince: string;
    sendFriendRequest: string;
    sendRequestTo: string;
    friendRequestSent: string;
    defaultFriendMessage: string;
    playerRecommendations: string;
    findCompatiblePlayers: string;
  };

  // Clubs
  clubs: {
    searchClubs: string;
    hasOpenSpots: string;
    skillLevel: string;
    members: string;
    openSpots: string;
    noDescription: string;
    noSearchResults: string;
    noClubsFound: string;
    tryDifferentSearch: string;
    checkBackLater: string;
    clubsFound: string;
  };

  // Create Club
  createClub: {
    title: string;
    basic_info: string;
    court_address: string;
    regular_meet: string;
    visibility: string;
    visibility_public: string;
    visibility_private: string;
    fees: string;
    facilities: string;
    rules: string;
    loading: string;
    address_search_title: string;
    meeting_modal_title: string;
    day_selection: string;
    meeting_time: string;
    start_time: string;
    end_time: string;
    add_meeting: string;
    cancel: string;
    add: string;
    creating: string;
    errors: {
      address_required: string;
    };
    facility: {
      lights: string;
      indoor: string;
      parking: string;
      ballmachine: string;
      locker: string;
      proshop: string;
    };
    fields: {
      name: string;
      intro: string;
      address_placeholder: string;
      address_label: string;
      address_search_placeholder: string;
      name_placeholder: string;
      intro_placeholder: string;
      fee_placeholder: string;
      rules_placeholder: string;
      meet_day: string;
      meet_time: string;
      meet_note: string;
      fee: string;
      rules: string;
      logo: string;
    };
    cta: string;
    hints: {
      public_club: string;
    };
  };

  // Time
  time: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    lessThanHour: string;
  };

  // Notifications
  notifications: {
    newMatch: string;
    matchReminder: string;
    friendRequest: string;
    clubInvitation: string;
    tournamentUpdate: string;
    permissionRequired: string;
    permissionGranted: string;
  };

  // Competitions (optional - falls back to English)
  competitions?: {
    title: string;
    leagues: string;
    tournaments: string;
    myCompetitions: string;
    myLeagues: string;
    myTournaments: string;
    activeLeagues: string;
    upcomingTournaments: string;
    joinLeague: string;
    registerTournament: string;
    createLeague: string;
    createTournament: string;
    leagueName: string;
    tournamentName: string;
    description: string;
    format: string;
    roundRobin: string;
    singleElimination: string;
    doubleElimination: string;
    swiss: string;
    drawSize: string;
    entryFee: string;
    free: string;
    prizes: string;
    champion: string;
    runnerUp: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    checkInDeadline: string;
    location: string;
    region: string;
    season: string;
    divisions: string;
    players: string;
    spotsLeft: string;
    matchFormat: string;
    bestOf: string;
    sets: string;
    tiebreak: string;
    standings: string;
    results: string;
    schedule: string;
    bpaddle: string;
    position: string;
    points: string;
    played: string;
    won: string;
    lost: string;
    drawn: string;
    setDifference: string;
    gameDifference: string;
    round: string;
    match: string;
    vs: string;
    score: string;
    winner: string;
    loser: string;
    bye: string;
    walkover: string;
    retired: string;
    inProgress: string;
    completed: string;
    cancelled: string;
    final: string;
    semifinal: string;
    quarterfinal: string;
    roundOf16: string;
    roundOf32: string;
    firstRound: string;
    enterScore: string;
    submitScore: string;
    selectWinner: string;
    matchResultType: string;
    addSet: string;
    tiebreakShort: string;
    seed: string;
    unseeded: string;
    yourResult: string;
    finalPosition: string;
  };

  // Units and Distance
  units: {
    distanceMi: string;
    distanceKm: string;
    withinMi: string;
    withinKm: string;
    distanceNA: string;
    mi: string;
    km: string;
  };

  // AI Chat
  ai: {
    emptyState: {
      title: string;
      subtitle: string;
    };
    status: {
      online: string;
      typing: string;
      thinking: string;
    };
    input: {
      placeholder: string;
    };
    messageTypes: {
      message: string;
      tip: string;
      analysis: string;
      advice: string;
    };
    quickActions: {
      title: string;
      getTips: string;
      analyzeMatch: string;
      rulesHelp: string;
      techniqueTips: string;
      strategyAdvice: string;
      equipmentHelp: string;
    };
    confidence: {
      high: string;
      medium: string;
      low: string;
    };
  };

  // Errors
  errors: {
    general: string;
    network: string;
    authentication: string;
    validation: string;
    notFound: string;
    failedToRefresh: string;
    failedToLoadFeed: string;
    failedToLoadFriends: string;
    failedToLoadRequests: string;
    failedToRemoveFriend: string;
    failedToAcceptRequest: string;
    failedToDeclineRequest: string;
  };
}

// Language Context interface
interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  isRTL: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, unknown>) => string;
  getLanguageConfig: (code: SupportedLanguage) => LanguageConfig | undefined;
  isLanguageSelected: boolean;
  isLanguageLoading: boolean; // 🔄 [LANGUAGE LOAD] True while loading from AsyncStorage
  translations: TranslationStrings;
}

// Default translations (en and ko only, other languages loaded from JSON files)
const defaultTranslations: Partial<Record<SupportedLanguage, Partial<TranslationStrings>>> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      next: 'Next',
      previous: 'Previous',
      skip: 'Skip',
      finish: 'Finish',
      continue: 'Continue',
      required: 'Required',
    },
    languageSelection: {
      title: 'Choose Your Language',
      subtitle: 'Select your preferred language for the app',
      selectLanguage: 'Select Language',
      continueButton: 'Continue',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      loginWithGoogle: 'Login with Google',
      loginWithApple: 'Login with Apple',
      loginWithFacebook: 'Login with Facebook',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
    },
    profileSetup: {
      title: 'Profile Setup',
      step1: 'Step 1: Basic Info',
      step2: 'Step 2: Pickleball Details',
      step3: 'Step 3: Location',
      step4: 'Step 4: Preferences',
      nickname: 'Nickname',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      preferNotToSay: 'Prefer not to say',
      skillLevel: 'LPR Skill Level',
      beginnerLevel: 'Beginner (1.0-2.5)',
      intermediateLevel: 'Intermediate (3.0-3.5)',
      advancedLevel: 'Advanced (4.0-4.5)',
      expertLevel: 'Expert (5.0+)',
      communicationLanguages: 'Languages I Speak',
      activityRegions: 'Activity Areas',
      zipCode: 'Zip Code (우편번호)',
      maxTravelDistance: 'Max Travel Distance',
      miles: 'miles',
      notificationDistance: 'Notification Range',
      completeProfile: 'Complete Profile',
    },
    terms: {
      title: 'Terms & Conditions',
      serviceTerms: 'Service Terms of Use',
      privacyPolicy: 'Privacy Policy',
      locationServices: 'Location Services',
      liabilityDisclaimer: 'Liability Disclaimer',
      marketingCommunications: 'Marketing Communications',
      agreeToTerms: 'I agree to the Terms & Conditions',
      readAndAgree: 'I have read and agree',
      required: 'Required',
      optional: 'Optional',
    },
    navigation: {
      home: 'Home',
      discover: 'Discover',
      matches: 'Matches',
      profile: 'Profile',
      clubs: 'Clubs',
      friends: 'Friends',
      settings: 'Settings',
      feed: 'Feed',
      create: 'Create',
      myClubs: 'My Clubs',
      myProfile: 'My Profile',
    },
    home: {
      welcomeTitle: '⚡️ Lightning Pickleball',
      subtitle: 'Find pickleball partners instantly!',
      createNewMatch: 'Create New Lightning Match',
      activeMatches: 'Active Matches',
      todayStats: "Today's Stats",
      onlinePlayers: 'Online Players',
      myMatches: 'My Matches',
    },
    matches: {
      title: '🎾 Matches & Events',
      personalMatches: 'Personal Matches',
      clubEvents: 'Club Events',
      createMatch: 'Create New Match',
      createEvent: 'Create New Event',
      matchType: 'Match Type',
      personalMatch: 'Personal Match',
      clubEvent: 'Club Event',
      location: 'Location',
      dateTime: 'Date & Time',
      maxParticipants: 'Max Participants',
      skillLevel: 'Skill Level',
      description: 'Description',
      allLevels: 'All Levels',
      recurring: 'Recurring',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      joinMatch: 'Join Match',
      participants: 'participants',
      hostedBy: 'Hosted by',
      manage: 'Manage',
      // New translations for HomeScreen
      weekendPickleballMatch: 'Weekend Pickleball Match',
      eveningSinglesGame: 'Evening Singles Game',
      todayAfternoon3: 'Today 3:00 PM',
      tomorrowEvening6: 'Tomorrow 6:00 PM',
      tomorrowAfternoon2: 'Tomorrow 2:00 PM',
      intermediate3040: 'Intermediate (3.0-4.0)',
      beginner2030: 'Beginner (2.0-3.0)',
      createLightningMatch: 'Create Lightning Match',
      createNewMatchQuestion: 'Would you like to create a new pickleball match?',
      newPickleballMatch: 'New Pickleball Match',
      nearbyPickleballCourt: 'Nearby Pickleball Court',
      me: 'Me',
      matchCreatedSuccessfully: 'Lightning Match has been created successfully!',
      joinMatchQuestion: 'Would you like to join this Lightning Match?',
      join: 'Join',
      joinComplete: 'Join Complete!',
      joinedSuccessfully: 'You have successfully joined the match!',
      singles: 'Singles',
      doubles: 'Doubles',
      players: 'players',
      host: 'Host',
    },
    profile: {
      title: 'Profile',
      statistics: 'Pickleball Statistics',
      matches: 'Matches',
      wins: 'Wins',
      losses: 'Losses',
      winRate: 'Win Rate',
      currentStreak: 'Current Streak',
      eloRating: 'ELO Rating',
      badges: 'Badges',
      notificationSettings: 'Notification Settings',
      personalMatchNotifications: 'Personal Match Notifications',
      clubEventNotifications: 'Club Event Notifications',
      notificationRange: 'Notification Range',
      quietHours: 'Quiet Hours',
      appSettings: 'App Settings',
      languageSettings: 'Language Settings',
      privacy: 'Privacy',
      help: 'Help',
      appInfo: 'App Info',
    },
    discover: {
      title: '🎾 Discover',
      subtitle: 'Find Players & Courts',
      searchPlaceholder: 'Search by name, location, skill level...',
      players: 'Players',
      courts: 'Courts',
      nearbyPlayers: 'Nearby Players',
      nearbyCourts: 'Nearby Courts',
      connect: 'Connect',
      book: 'Book',
      online: 'Online',
      offline: 'Offline',
      open: 'Open',
      closed: 'Closed',
      // New translations for DiscoverScreen
      intermediate35: 'Intermediate (3.5)',
      beginner25: 'Beginner (2.5)',
      advanced45: 'Advanced (4.5)',
      aggressive: 'Aggressive Play',
      defensive: 'Defensive Play',
      allCourt: 'All-Court',
      lighting: 'Lighting',
      lockerRoom: 'Locker Room',
      parking: 'Parking',
      proShop: 'Pro Shop',
      cafe: 'Cafe',
      shower: 'Shower',
      matches: 'matches',
      connectWithPlayer: 'Connect with Player',
      connectWithPlayerQuestion: 'Would you like to send a connection request to {name}?',
      sendConnectionRequest: 'Send Request',
      requestComplete: 'Request Complete!',
      connectionRequestSent: 'Connection request sent to {name}.',
      bookCourt: 'Book Court',
      bookCourtQuestion: 'Would you like to book {name}?',
      bookingComplete: 'Booking Complete!',
      courtBookingConfirmed: '{name} has been successfully booked.',
      closedForBooking: 'Closed',
    },
    social: {
      activityFeed: 'Activity Feed',
      friends: 'Friends',
      requests: 'Requests',
      discover: 'Discover',
      recommended: 'Recommended',
      friendRequests: 'Friend Requests',
      noActivityYet: 'No activity yet',
      activityWillAppearHere: 'Friend activities and club updates will appear here',
      noFriendsYet: 'No friends yet',
      findPlayersToConnect: 'Find players to connect and build your pickleball network',
      noFriendRequests: 'No friend requests',
      requestsWillAppearHere: 'Friend requests will appear here when you receive them',
      removeFriend: 'Remove Friend',
      removeFriendConfirm: 'Are you sure you want to remove {{name}} from your friends?',
      friendRemoved: 'Friend removed successfully',
      declineFriendRequest: 'Decline Friend Request',
      declineRequestConfirm: 'Are you sure you want to decline the friend request from {{name}}?',
      friendRequestAccepted: 'Friend request from {{name}} accepted!',
      friendsSince: 'Friends since',
      sendFriendRequest: 'Send Friend Request',
      sendRequestTo: 'Send friend request to {{name}}?',
      friendRequestSent: 'Friend request sent successfully',
      defaultFriendMessage: "Hi! I'd like to connect and play pickleball together.",
      playerRecommendations: 'Player Recommendations',
      findCompatiblePlayers: 'Find compatible players near you',
    },

    clubs: {
      searchClubs: 'Search clubs...',
      hasOpenSpots: 'Has open spots',
      skillLevel: 'Skill level',
      members: 'members',
      openSpots: 'Open spots',
      noDescription: 'No description available',
      noSearchResults: 'No clubs found',
      noClubsFound: 'No clubs found',
      tryDifferentSearch: 'Try adjusting your search criteria',
      checkBackLater: 'Check back later for new clubs',
      clubsFound: 'clubs found',
    },

    createClub: {
      title: 'Create Club',
      basic_info: 'Basic Info',
      court_address: 'Court Address',
      regular_meet: 'Recurring Meetups',
      visibility: 'Visibility',
      visibility_public: 'Public',
      visibility_private: 'Private',
      fees: 'Fees',
      facilities: 'Facilities',
      rules: 'Club Rules',
      loading: 'Loading club information...',
      address_search_title: 'Search Pickleball Court Address',
      meeting_modal_title: 'Add Regular Meeting Time',
      day_selection: 'Day Selection',
      meeting_time: 'Meeting Time',
      start_time: 'Start Time',
      end_time: 'End Time',
      add_meeting: 'Add Meeting Time',
      cancel: 'Cancel',
      add: 'Add',
      creating: 'Creating...',
      errors: {
        address_required: 'Address is required.',
      },
      facility: {
        lights: 'Lights',
        indoor: 'Indoor',
        parking: 'Parking',
        ballmachine: 'Ball Machine',
        locker: 'Locker Room',
        proshop: 'Pro Shop',
      },
      fields: {
        name: 'Club Name',
        intro: 'Introduction',
        address_placeholder: 'Search court address (EN/US/Atlanta bias)',
        address_label: 'Pickleball Court Address',
        address_search_placeholder: 'Search for pickleball court address',
        name_placeholder: 'e.g., Duluth Korean Pickleball Club',
        intro_placeholder: "Describe your club's goals, atmosphere, and unique features",
        fee_placeholder: 'e.g., 50',
        rules_placeholder:
          'e.g.:\n• Maintain 70%+ attendance for regular meetings\n• Show mutual respect and courtesy\n• Clean up after using facilities',
        meet_day: 'Day',
        meet_time: 'Time',
        meet_note: 'Note',
        fee: 'Membership Fee',
        rules: 'Rules / Etiquette',
        logo: 'Logo',
      },
      cta: 'Create Club',
      hints: {
        public_club: 'Public clubs allow other users to search and apply for membership.',
      },
    },

    time: {
      justNow: 'Just now',
      minutesAgo: '{{count}}m ago',
      hoursAgo: '{{count}}h ago',
      daysAgo: '{{count}}d ago',
      lessThanHour: '< 1h ago',
    },

    notifications: {
      newMatch: 'New Match Available',
      matchReminder: 'Match Reminder',
      friendRequest: 'Friend Request',
      clubInvitation: 'Club Invitation',
      tournamentUpdate: 'Tournament Update',
      permissionRequired: 'Notification Permission Required',
      permissionGranted: 'Notifications Enabled',
    },

    competitions: {
      title: 'Competitions',
      leagues: 'Leagues',
      tournaments: 'Tournaments',
      myCompetitions: 'My Competitions',
      myLeagues: 'My Leagues',
      myTournaments: 'My Tournaments',
      activeLeagues: 'Active Leagues',
      upcomingTournaments: 'Upcoming Tournaments',
      joinLeague: 'Join League',
      registerTournament: 'Register',
      createLeague: 'Create League',
      createTournament: 'Create Tournament',
      leagueName: 'League Name',
      tournamentName: 'Tournament Name',
      description: 'Description',
      format: 'Format',
      roundRobin: 'Round Robin',
      singleElimination: 'Single Elimination',
      doubleElimination: 'Double Elimination',
      swiss: 'Swiss System',
      drawSize: 'Draw Size',
      entryFee: 'Entry Fee',
      free: 'Free',
      prizes: 'Prizes',
      champion: 'Champion',
      runnerUp: 'Runner-up',
      startDate: 'Start Date',
      endDate: 'End Date',
      registrationDeadline: 'Registration Deadline',
      checkInDeadline: 'Check-in Deadline',
      location: 'Location',
      region: 'Region',
      season: 'Season',
      divisions: 'Divisions',
      players: 'players',
      spotsLeft: 'spots left',
      matchFormat: 'Match Format',
      bestOf: 'Best of',
      sets: 'sets',
      tiebreak: 'Tiebreak',
      standings: 'Standings',
      results: 'Results',
      schedule: 'Schedule',
      bpaddle: 'Bracket',
      position: 'Position',
      points: 'Points',
      played: 'Played',
      won: 'Won',
      lost: 'Lost',
      drawn: 'Drawn',
      setDifference: 'Set Diff',
      gameDifference: 'Game Diff',
      round: 'Round',
      match: 'Match',
      vs: 'vs',
      score: 'Score',
      winner: 'Winner',
      loser: 'Loser',
      bye: 'Bye',
      walkover: 'Walkover',
      retired: 'Retired',
      inProgress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      final: 'Final',
      semifinal: 'Semifinal',
      quarterfinal: 'Quarterfinal',
      roundOf16: 'Round of 16',
      roundOf32: 'Round of 32',
      firstRound: 'First Round',
      enterScore: 'Enter Score',
      submitScore: 'Submit Score',
      selectWinner: 'Select Winner',
      matchResultType: 'Match Result Type',
      addSet: 'Add Set',
      tiebreakShort: 'TB',
      seed: 'Seed',
      unseeded: 'Unseeded',
      yourResult: 'Your Result',
      finalPosition: 'Final Position',
    },

    errors: {
      general: 'An error occurred',
      network: 'Network error. Please check your connection.',
      authentication: 'Authentication failed',
      validation: 'Please check your input',
      notFound: 'Resource not found',
      failedToRefresh: 'Failed to refresh data',
      failedToLoadFeed: 'Failed to load activity feed',
      failedToLoadFriends: 'Failed to load friends list',
      failedToLoadRequests: 'Failed to load friend requests',
      failedToRemoveFriend: 'Failed to remove friend',
      failedToAcceptRequest: 'Failed to accept friend request',
      failedToDeclineRequest: 'Failed to decline friend request',
    },
    ai: {
      emptyState: {
        title: 'Welcome to Lightning Pickleball AI!',
        subtitle:
          'Ask me anything about pickleball - rules, techniques, strategy, or equipment recommendations.',
      },
      status: {
        online: 'Online',
        typing: 'Typing...',
        thinking: 'Thinking...',
      },
      input: {
        placeholder: 'Ask about pickleball rules, techniques, or strategy...',
      },
      messageTypes: {
        message: 'Pickleball Chat',
        tip: 'Pickleball Tips',
        analysis: 'Match Analysis',
        advice: 'Personal Advice',
      },
      quickActions: {
        title: 'Quick Actions',
        getTips: 'Get Tips',
        analyzeMatch: 'Analyze Match',
        rulesHelp: 'Rules Help',
        techniqueTips: 'Technique Tips',
        strategyAdvice: 'Strategy Advice',
        equipmentHelp: 'Equipment Help',
      },
      confidence: {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
    },
    units: {
      distanceMi: '{{distance}} mi',
      distanceKm: '{{distance}} km',
      withinMi: 'Within {{distance}} mi',
      withinKm: 'Within {{distance}}km',
      distanceNA: 'Distance N/A',
      mi: 'mi',
      km: 'km',
    },
  },
  ko: {
    common: {
      save: '저장',
      cancel: '취소',
      confirm: '확인',
      delete: '삭제',
      edit: '편집',
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
      yes: '예',
      no: '아니오',
      ok: '확인',
      next: '다음',
      previous: '이전',
      skip: '건너뛰기',
      finish: '완료',
      continue: '계속하기',
      required: '필수',
    },
    languageSelection: {
      title: '언어를 선택해주세요',
      subtitle: '앱에서 사용할 언어를 선택하세요',
      selectLanguage: '언어 선택',
      continueButton: '계속하기',
    },
    auth: {
      login: '로그인',
      logout: '로그아웃',
      signup: '회원가입',
      email: '이메일',
      password: '비밀번호',
      confirmPassword: '비밀번호 확인',
      forgotPassword: '비밀번호를 잊으셨나요?',
      loginWithGoogle: 'Google로 로그인',
      loginWithApple: 'Apple로 로그인',
      loginWithFacebook: 'Facebook으로 로그인',
      createAccount: '계정 만들기',
      alreadyHaveAccount: '이미 계정이 있으신가요?',
      dontHaveAccount: '계정이 없으신가요?',
    },
    profileSetup: {
      title: '프로필 설정',
      step1: '1단계: 기본 정보',
      step2: '2단계: 피클볼 정보',
      step3: '3단계: 위치 정보',
      step4: '4단계: 설정',
      nickname: '닉네임',
      gender: '성별',
      male: '남성',
      female: '여성',
      other: '기타',
      preferNotToSay: '응답하지 않음',
      skillLevel: 'LPR 실력 레벨',
      beginnerLevel: '초급 (1.0-2.5)',
      intermediateLevel: '중급 (3.0-3.5)',
      advancedLevel: '고급 (4.0-4.5)',
      expertLevel: '전문가 (5.0+)',
      communicationLanguages: '구사 가능한 언어',
      activityRegions: '활동 지역',
      zipCode: '우편번호',
      maxTravelDistance: '최대 이동 거리',
      miles: '마일',
      notificationDistance: '알림 범위',
      completeProfile: '프로필 완성',
    },
    terms: {
      title: '이용 약관',
      serviceTerms: '서비스 이용 약관',
      privacyPolicy: '개인정보 처리방침',
      locationServices: '위치 서비스',
      liabilityDisclaimer: '면책 조항',
      marketingCommunications: '마케팅 정보 수신',
      agreeToTerms: '이용 약관에 동의합니다',
      readAndAgree: '읽고 동의합니다',
      required: '필수',
      optional: '선택',
    },
    navigation: {
      home: '홈',
      discover: '탐색',
      matches: '매칭',
      profile: '프로필',
      clubs: '클럽',
      friends: '친구',
      settings: '설정',
      feed: '피드',
      create: '생성',
      myClubs: '내 클럽',
      myProfile: '내 프로필',
    },
    home: {
      welcomeTitle: '⚡️ Lightning Pickleball',
      subtitle: '즉시 참여 가능한 번개 피클볼 찾기',
      createNewMatch: '새 Lightning Match 생성',
      activeMatches: '근처 활성 매치',
      todayStats: '오늘의 통계',
      onlinePlayers: '온라인 플레이어',
      myMatches: '내 매치',
    },
    matches: {
      title: '🎾 매치 & 이벤트',
      personalMatches: '개인 매치',
      clubEvents: '클럽 이벤트',
      createMatch: '새 매치 만들기',
      createEvent: '새 이벤트 만들기',
      matchType: '매치 타입',
      personalMatch: '개인 매치',
      clubEvent: '클럽 이벤트',
      location: '장소',
      dateTime: '날짜 & 시간',
      maxParticipants: '최대 참가자 수',
      skillLevel: '실력 레벨',
      description: '설명',
      allLevels: '모든 레벨',
      recurring: '정기 모임',
      weekly: '매주',
      biweekly: '격주',
      monthly: '매월',
      joinMatch: '참가하기',
      participants: '명',
      hostedBy: '주최',
      manage: '관리',
      // Korean translations for HomeScreen
      weekendPickleballMatch: '주말 피클볼 매치',
      eveningSinglesGame: '저녁 단식 게임',
      todayAfternoon3: '오늘 오후 3:00',
      tomorrowEvening6: '내일 오후 6:00',
      tomorrowAfternoon2: '내일 오후 2:00',
      intermediate3040: '중급 (3.0-4.0)',
      beginner2030: '초급 (2.0-3.0)',
      createLightningMatch: 'Lightning Match 생성',
      createNewMatchQuestion: '새로운 피클볼 매치를 생성하시겠습니까?',
      newPickleballMatch: '새 피클볼 매치',
      nearbyPickleballCourt: '가까운 피클볼 코트',
      me: '나',
      matchCreatedSuccessfully: 'Lightning Match가 생성되었습니다!',
      joinMatchQuestion: '이 Lightning Match에 참가하시겠습니까?',
      join: '참가',
      joinComplete: '참가 완료!',
      joinedSuccessfully: '매치에 성공적으로 참가했습니다!',
      singles: '단식',
      doubles: '복식',
      players: '명',
      host: '호스트',
    },
    profile: {
      title: '프로필',
      statistics: '피클볼 통계',
      matches: '경기 수',
      wins: '승리',
      losses: '패배',
      winRate: '승률',
      currentStreak: '연승',
      eloRating: 'ELO 레이팅',
      badges: '획득 배지',
      notificationSettings: '알림 설정',
      personalMatchNotifications: '개인 매치 알림',
      clubEventNotifications: '클럽 이벤트 알림',
      notificationRange: '알림 받을 거리 범위',
      quietHours: '방해 금지 시간',
      appSettings: '앱 설정',
      languageSettings: '언어 설정',
      privacy: '개인정보 보호',
      help: '도움말',
      appInfo: '앱 정보',
    },
    discover: {
      title: '🎾 Discover',
      subtitle: '플레이어 & 코트 찾기',
      searchPlaceholder: '이름, 지역, 스킬 레벨로 검색...',
      players: '플레이어',
      courts: '코트',
      nearbyPlayers: '근처 플레이어',
      nearbyCourts: '근처 피클볼 코트',
      connect: '연결하기',
      book: '예약하기',
      online: '온라인',
      offline: '오프라인',
      open: '영업중',
      closed: '휴무',
      // New translations for DiscoverScreen
      intermediate35: '중급 (3.5)',
      beginner25: '초급 (2.5)',
      advanced45: '고급 (4.5)',
      aggressive: '공격적 플레이',
      defensive: '수비적 플레이',
      allCourt: '올라운드',
      lighting: '조명',
      lockerRoom: '라커룸',
      parking: '주차장',
      proShop: '프로샵',
      cafe: '카페',
      shower: '샤워실',
      matches: '경기',
      connectWithPlayer: '플레이어 연결',
      connectWithPlayerQuestion: '{name}님에게 연결 요청을 보내시겠습니까?',
      sendConnectionRequest: '연결 요청',
      requestComplete: '요청 완료!',
      connectionRequestSent: '{name}님에게 연결 요청을 보냈습니다.',
      bookCourt: '코트 예약',
      bookCourtQuestion: '{name}을 예약하시겠습니까?',
      bookingComplete: '예약 완료!',
      courtBookingConfirmed: '{name} 예약이 완료되었습니다.',
      closedForBooking: '휴무중',
    },
    social: {
      activityFeed: '활동 피드',
      friends: '친구',
      requests: '요청',
      discover: '발견',
      recommended: '추천',
      friendRequests: '친구 요청',
      noActivityYet: '아직 활동이 없습니다',
      activityWillAppearHere: '친구 활동과 클럽 소식이 여기에 표시됩니다',
      noFriendsYet: '아직 친구가 없습니다',
      findPlayersToConnect: '플레이어를 찾아 연결하고 피클볼 네트워크를 구축하세요',
      noFriendRequests: '친구 요청이 없습니다',
      requestsWillAppearHere: '받은 친구 요청이 여기에 표시됩니다',
      removeFriend: '친구 삭제',
      removeFriendConfirm: '정말로 {{name}}님을 친구에서 삭제하시겠습니까?',
      friendRemoved: '친구가 삭제되었습니다',
      declineFriendRequest: '친구 요청 거절',
      declineRequestConfirm: '정말로 {{name}}님의 친구 요청을 거절하시겠습니까?',
      friendRequestAccepted: '{{name}}님의 친구 요청을 수락했습니다!',
      friendsSince: '친구된 날짜',
      sendFriendRequest: '친구 요청 보내기',
      sendRequestTo: '{{name}}님에게 친구 요청을 보내시겠습니까?',
      friendRequestSent: '친구 요청을 보냈습니다',
      defaultFriendMessage: '안녕하세요! 함께 피클볼를 치며 친구가 되었으면 좋겠습니다.',
      playerRecommendations: '플레이어 추천',
      findCompatiblePlayers: '근처의 호환되는 플레이어 찾기',
    },

    clubs: {
      searchClubs: '클럽 검색...',
      hasOpenSpots: '자리 있음',
      skillLevel: '실력 레벨',
      members: '멤버',
      openSpots: '자리 있음',
      noDescription: '설명이 없습니다',
      noSearchResults: '클럽을 찾을 수 없습니다',
      noClubsFound: '클럽을 찾을 수 없습니다',
      tryDifferentSearch: '다른 검색 조건을 시도해보세요',
      checkBackLater: '나중에 새 클럽을 확인하세요',
      clubsFound: '개 클럽 발견',
    },

    createClub: {
      title: '클럽 만들기',
      basic_info: '기본 정보',
      court_address: '코트 주소',
      regular_meet: '정기 모임',
      visibility: '공개 설정',
      visibility_public: '공개',
      visibility_private: '비공개',
      fees: '비용 정보',
      facilities: '시설 정보',
      rules: '클럽 규칙',
      loading: '클럽 정보를 불러오는 중...',
      address_search_title: '피클볼 코트 주소 검색',
      meeting_modal_title: '정기 모임 시간 추가',
      day_selection: '요일 선택',
      meeting_time: '모임 시간',
      start_time: '시작 시간',
      end_time: '종료 시간',
      add_meeting: '정기 모임 시간 추가',
      cancel: '취소',
      add: '추가',
      creating: '만드는 중…',
      errors: {
        address_required: '주소가 필요합니다',
      },
      facility: {
        lights: '야간 조명',
        indoor: '실내 코트',
        parking: '주차장',
        ballmachine: '볼머신',
        locker: '락커룸',
        proshop: '프로샵',
      },
      fields: {
        name: '클럽 이름',
        intro: '소개',
        address_placeholder: '코트 주소 검색 (영어/미국/애틀랜타 우선)',
        address_label: '피클볼 코트 주소',
        address_search_placeholder: '피클볼 코트 주소를 검색하세요',
        name_placeholder: '예: 둘루스 한인 피클볼 클럽',
        intro_placeholder:
          '아틀란타 메트로 한인 피클볼 클럽의 목표, 분위기, 특징 등을 소개해주세요',
        fee_placeholder: '예: 50',
        rules_placeholder:
          '예:\n• 정기 모임 참석률 70% 이상 유지\n• 상호 예의와 배려\n• 시설 이용 후 정리정돈',
        meet_day: '요일',
        meet_time: '시간',
        meet_note: '비고',
        fee: '회비',
        rules: '규칙 / 에티켓',
        logo: '로고',
      },
      cta: '클럽 만들기',
      hints: {
        public_club: '공개 클럽은 다른 사용자가 검색하고 가입 신청할 수 있습니다.',
      },
    },

    time: {
      justNow: '방금 전',
      minutesAgo: '{{count}}분 전',
      hoursAgo: '{{count}}시간 전',
      daysAgo: '{{count}}일 전',
      lessThanHour: '1시간 이내',
    },

    notifications: {
      newMatch: '새로운 매치',
      matchReminder: '매치 알림',
      friendRequest: '친구 요청',
      clubInvitation: '클럽 초대',
      tournamentUpdate: '토너먼트 업데이트',
      permissionRequired: '알림 권한이 필요합니다',
      permissionGranted: '알림이 활성화되었습니다',
    },

    competitions: {
      title: '대회',
      leagues: '리그',
      tournaments: '토너먼트',
      myCompetitions: '내 대회',
      myLeagues: '내 리그',
      myTournaments: '내 토너먼트',
      activeLeagues: '진행중인 리그',
      upcomingTournaments: '예정된 토너먼트',
      joinLeague: '리그 참가',
      registerTournament: '등록',
      createLeague: '리그 생성',
      createTournament: '토너먼트 생성',
      leagueName: '리그 이름',
      tournamentName: '토너먼트 이름',
      description: '설명',
      format: '형식',
      roundRobin: '리그전',
      singleElimination: '단일 토너먼트',
      doubleElimination: '더블 토너먼트',
      swiss: '스위스 시스템',
      drawSize: '참가자 수',
      entryFee: '참가비',
      free: '무료',
      prizes: '상품',
      champion: '우승자',
      runnerUp: '준우승자',
      startDate: '시작일',
      endDate: '종료일',
      registrationDeadline: '등록 마감일',
      checkInDeadline: '체크인 마감일',
      location: '장소',
      region: '지역',
      season: '시즌',
      divisions: '부문',
      players: '명',
      spotsLeft: '자리 남음',
      matchFormat: '매치 형식',
      bestOf: '최대',
      sets: '세트',
      tiebreak: '타이브레이크',
      standings: '순위표',
      results: '결과',
      schedule: '일정',
      bpaddle: '대진표',
      position: '순위',
      points: '점수',
      played: '경기수',
      won: '승',
      lost: '패',
      drawn: '무',
      setDifference: '세트 득실',
      gameDifference: '게임 득실',
      round: '라운드',
      match: '매치',
      vs: 'vs',
      score: '스코어',
      winner: '승자',
      loser: '패자',
      bye: '부전승',
      walkover: '기권승',
      retired: '기권',
      inProgress: '진행중',
      completed: '완료',
      cancelled: '취소',
      final: '결승',
      semifinal: '준결승',
      quarterfinal: '8강',
      roundOf16: '16강',
      roundOf32: '32강',
      firstRound: '1라운드',
      enterScore: '스코어 입력',
      submitScore: '스코어 제출',
      selectWinner: '승자 선택',
      matchResultType: '매치 결과 유형',
      addSet: '세트 추가',
      tiebreakShort: '타이',
      seed: '시드',
      unseeded: '비시드',
      yourResult: '나의 결과',
      finalPosition: '최종 순위',
    },

    errors: {
      general: '오류가 발생했습니다',
      network: '네트워크 오류입니다. 연결을 확인해주세요.',
      authentication: '인증에 실패했습니다',
      validation: '입력을 확인해주세요',
      notFound: '리소스를 찾을 수 없습니다',
      failedToRefresh: '데이터 새로고침에 실패했습니다',
      failedToLoadFeed: '활동 피드 로드에 실패했습니다',
      failedToLoadFriends: '친구 목록 로드에 실패했습니다',
      failedToLoadRequests: '친구 요청 로드에 실패했습니다',
      failedToRemoveFriend: '친구 삭제에 실패했습니다',
      failedToAcceptRequest: '친구 요청 수락에 실패했습니다',
      failedToDeclineRequest: '친구 요청 거절에 실패했습니다',
    },
    ai: {
      emptyState: {
        title: 'Lightning Pickleball AI에 오신 것을 환영합니다!',
        subtitle: '피클볼에 관한 모든 것을 물어보세요 - 규칙, 기술, 전략, 장비 추천 등.',
      },
      status: {
        online: '온라인',
        typing: '입력 중...',
        thinking: '생각 중...',
      },
      input: {
        placeholder: '피클볼 규칙, 기술, 전략에 대해 질문하세요...',
      },
      messageTypes: {
        message: '피클볼 채팅',
        tip: '피클볼 팁',
        analysis: '경기 분석',
        advice: '개인 조언',
      },
      quickActions: {
        title: '빠른 액션',
        getTips: '팁 받기',
        analyzeMatch: '경기 분석',
        rulesHelp: '규칙 도움말',
        techniqueTips: '기술 팁',
        strategyAdvice: '전략 조언',
        equipmentHelp: '장비 도움말',
      },
      confidence: {
        high: '높음',
        medium: '보통',
        low: '낮음',
      },
    },
    units: {
      distanceMi: '{{distance}} 마일',
      distanceKm: '{{distance}} km',
      withinMi: '{{distance}} 마일 이내',
      withinKm: '{{distance}}km 이내',
      distanceNA: '거리 정보 없음',
      mi: '마일',
      km: 'km',
    },
  },
};

const LANGUAGE_STORAGE_KEY = '@lightning_pickleball_language';

// Create Language Context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation(); // 💥 i18n 인스턴스를 가져온다
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [isLanguageLoading, setIsLanguageLoading] = useState(true); // 🔄 [LANGUAGE LOAD] Start as loading

  // 🎯 [FIX] Define initializeLanguage before useEffect
  const initializeLanguage = useCallback(async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      // Check if saved language is a valid supported language
      const isValidLanguage = SUPPORTED_LANGUAGES.some(lang => lang.code === savedLanguage);
      if (savedLanguage && isValidLanguage) {
        // Update context state
        setCurrentLanguage(savedLanguage as SupportedLanguage);
        setIsLanguageSelected(true);

        // Sync with i18next on startup
        await i18n.changeLanguage(savedLanguage);
      } else {
        await i18n.changeLanguage('en');
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    } finally {
      // 🔄 [LANGUAGE LOAD] Mark loading as complete
      setIsLanguageLoading(false);
    }
  }, [i18n]);

  // Initialize language from storage on app start
  useEffect(() => {
    initializeLanguage();
  }, [initializeLanguage]);

  const setLanguage = async (lang: SupportedLanguage) => {
    try {
      // Save to AsyncStorage (always works, even before onboarding)
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

      // 🌐 [LANGUAGE SYNC] Try to save to Firestore if user is logged in
      // Note: This may fail for new users who haven't completed onboarding yet
      // (their user document doesn't exist yet) - that's OK, we have AsyncStorage backup
      if (auth.currentUser) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            'preferences.language': lang,
          });
          console.log(`🌐 [LANGUAGE SYNC] Saved language to Firestore: ${lang}`);
        } catch (firestoreError) {
          // 🎯 [PICKLEBALL FIX] Don't fail if user document doesn't exist yet
          // This happens during onboarding before profile is created
          console.warn(`🌐 [LANGUAGE SYNC] Could not save to Firestore (user doc may not exist yet):`, firestoreError);
        }
      }

      // Update context state
      setCurrentLanguage(lang);
      setIsLanguageSelected(true);

      // Sync with i18next
      await i18n.changeLanguage(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const getLanguageConfig = (code: SupportedLanguage): LanguageConfig | undefined => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  };

  const isRTL = getLanguageConfig(currentLanguage)?.rtl || false;

  // Translation function - now delegates to i18next
  const t = (key: string, params?: Record<string, unknown>): string => {
    return i18n.t(key, params);
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    isRTL,
    setLanguage,
    t,
    getLanguageConfig,
    isLanguageSelected,
    isLanguageLoading, // 🔄 [LANGUAGE LOAD] Expose loading state
    translations: (defaultTranslations[currentLanguage] || defaultTranslations.en) as TranslationStrings,
  };

  // 🔄 [LANGUAGE LOAD] Don't render children until language is loaded from AsyncStorage
  // This prevents the "flash of English content" on app startup
  if (isLanguageLoading) {
    console.log('🌐 [LANGUAGE]: Loading saved language from AsyncStorage...');
    return <LanguageContext.Provider value={contextValue}>{null}</LanguageContext.Provider>;
  }

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

// Custom hook to use Language Context
// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return a safe default context instead of throwing
    console.warn('useLanguage must be used within a LanguageProvider');
    return {
      currentLanguage: 'en',
      isRTL: false,
      setLanguage: async () => {},
      t: (key: string, _params?: Record<string, unknown>) => key,
      getLanguageConfig: () => ({
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
        rtl: false,
      }),
      isLanguageSelected: false,
      isLanguageLoading: false, // 🔄 [LANGUAGE LOAD] Default to not loading
      translations: defaultTranslations.en as TranslationStrings,
    };
  }
  return context;
};

// Helper function to get available languages
// eslint-disable-next-line react-refresh/only-export-components
export const getAvailableLanguages = (): LanguageConfig[] => {
  return SUPPORTED_LANGUAGES;
};

// Helper function to detect system language
// eslint-disable-next-line react-refresh/only-export-components
export const getSystemLanguage = (): SupportedLanguage => {
  // This would typically use device locale detection
  // For now, we'll default to English
  return 'en';
};

export default LanguageProvider;
