#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File paths
const enPath = path.join(__dirname, '../src/locales/en.json');
const esPath = path.join(__dirname, '../src/locales/es.json');

// Read JSON files
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const esJson = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Deep merge utility
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

// Find keys where Spanish === English (still untranslated)
function findUntranslatedKeys(en, es, path = '') {
  const untranslated = [];

  for (const key in en) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof en[key] === 'object' && !Array.isArray(en[key])) {
      // Recurse into nested objects
      untranslated.push(...findUntranslatedKeys(en[key], es[key] || {}, currentPath));
    } else if (typeof en[key] === 'string') {
      // Check if Spanish value matches English (untranslated)
      if (!es[key] || es[key] === en[key]) {
        untranslated.push({
          key: currentPath,
          en: en[key],
          es: es[key] || '[MISSING]',
        });
      }
    }
  }

  return untranslated;
}

// Translation map - ALL remaining keys
const translations = {
  // Common terms - keep these short and widely understood
  common: {
    error: 'Error',
    no: 'No',
    ok: 'OK',
  },

  // Auth
  auth: {
    register: {
      errors: {
        title: 'Error',
      },
      success: {
        ok: 'OK',
      },
    },
  },

  // Terms and policies content
  terms: {
    details: {
      locationServices: {
        content: `Términos de Servicios Basados en Ubicación

1. Recopilación y Uso de Información de Ubicación
- Proporcionar servicios de búsqueda de partidos cercanos
- Proporcionar servicios de búsqueda de canchas de tenis
- Proporcionar servicios de notificación basados en distancia

2. Consentimiento para Información de Ubicación
- Los usuarios pueden rechazar proporcionar información de ubicación en cualquier momento
- Rechazar información de ubicación puede limitar algunas características del servicio

3. Protección de Información de Ubicación
- La información de ubicación recopilada se cifra y almacena de forma segura
- No se proporciona a terceros sin el consentimiento del usuario`,
      },
      liabilityDisclaimer: {
        content: `⚠️ AVISO LEGAL IMPORTANTE ⚠️

La aplicación Lightning Tennis sirve como plataforma para conectar jugadores individuales de tenis.

NO ASUMIMOS NINGUNA RESPONSABILIDAD LEGAL por:

1. Exención de Incidentes de Seguridad
- Lesiones o accidentes durante partidos de tenis
- Disputas personales entre participantes del partido
- Incidentes de seguridad en instalaciones de canchas de tenis

2. Exención de Disputas Financieras
- Disputas relacionadas con costos de partidos
- Problemas relacionados con tarifas de alquiler de canchas
- Transacciones financieras entre usuarios

3. Responsabilidad del Usuario
- Toda la seguridad y responsabilidad de los partidos pertenece a anfitriones y participantes
- Los usuarios deben verificar su condición de salud antes de participar
- Se recomienda cobertura de seguro apropiada

Al usar este servicio, aceptas estos términos de exención.`,
      },
      marketingCommunications: {
        content: `Consentimiento de Comunicaciones de Marketing (Opcional)

1. Contenido
- Nuevas funciones y actualizaciones del servicio
- Anuncios de eventos especiales y promociones
- Información útil relacionada con tenis y consejos
- Beneficios de asociación e información de descuentos

2. Métodos de Entrega
- Notificaciones push
- Email
- Notificaciones dentro de la aplicación

3. Cancelación
- Puedes cancelar en cualquier momento en la configuración
- Cancelación selectiva disponible para notificaciones individuales

Este consentimiento es opcional y rechazarlo no limitará tu uso del servicio.`,
      },
      inclusivityPolicy: {
        content: `🌈 Política de Diversidad e Inclusión y Exención de Responsabilidad

Lightning Tennis es una plataforma abierta a todos los usuarios.

1. Principios de Inclusividad
- Todos los usuarios tienen igual acceso a nuestros servicios independientemente de género, orientación sexual o identidad de género.
- Los usuarios LGBTQ+ pueden participar en todas las actividades (creación de partidos, participación, actividades del club, etc.) sin restricciones.
- Todos los usuarios deben adherirse a principios de respeto mutuo.

2. Exención de Responsabilidad por Errores del Programa
- Los errores del programa pueden ocasionalmente causar restricciones no intencionadas en algunas funciones.
- Tales errores no son discriminación intencional y serán corregidos al descubrirse.
- Aceptas no presentar demandas legales por restricciones de funciones causadas por errores del programa.

3. Anti-Discriminación
- Se prohíbe el lenguaje o comportamiento discriminatorio basado en género, orientación sexual o identidad de género.
- El comportamiento discriminatorio puede resultar en restricciones del servicio.

Al aceptar esta política, reconoces entender y aceptar estos términos.`,
      },
    },
  },

  // Units
  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },

  // NTRP Result
  ntrpResult: {
    recommended: 'Rec',
  },

  // Admin
  admin: {
    matchManagement: {
      total: 'Total',
    },
  },

  // Club
  club: {
    chat: 'Chat',
    clubMembers: {
      alerts: {
        loadError: {
          title: 'Error',
        },
      },
    },
  },

  // Club Chat
  clubChat: {
    roleAdmin: 'Admin',
    roleStaff: 'Staff',
  },

  // Club Selector
  clubSelector: {
    club: 'Club',
  },

  // Rate Sportsmanship
  rateSportsmanship: {
    alerts: {
      error: 'Error',
    },
  },

  // Alert
  alert: {
    title: {
      error: 'Error',
    },
  },

  // Edit Profile
  editProfile: {
    common: {
      error: 'Error',
      ok: 'OK',
    },
  },

  // Discover
  discover: {
    alerts: {
      error: 'Error',
    },
  },

  // Email Login
  emailLogin: {
    verification: {
      sentTo: '{{email}}',
    },
    alerts: {
      genericError: {
        title: 'Error',
      },
      resendError: {
        title: 'Error',
      },
      missingInfo: {
        title: 'Error',
      },
      loginInfoMissing: {
        title: 'Error',
      },
      forgotPassword: {
        sendError: {
          title: 'Error',
        },
      },
    },
  },

  // My Activities
  myActivities: {
    alerts: {
      partnerInvitation: {
        error: {
          title: 'Error',
        },
      },
      friendInvitation: {
        error: {
          title: 'Error',
        },
      },
    },
  },

  // Club Leagues Tournaments
  clubLeaguesTournaments: {
    memberPreLeagueStatus: {
      peopleUnit: '',
    },
    alerts: {
      error: {
        title: 'Error',
      },
      selectPartner: {
        title: 'Error',
      },
    },
  },

  // Club Tournament Management
  clubTournamentManagement: {
    roundGeneration: {
      errorTitle: 'Error',
    },
    tournamentStart: {
      errorTitle: 'Error',
    },
    seedAssignment: {
      errorTitle: 'Error',
    },
    deletion: {
      errorTitle: 'Error',
    },
    participantRemoval: {
      errorTitle: 'Error',
    },
    participantAdd: {
      errorTitle: 'Error',
    },
    common: {
      confirm: 'OK',
      error: 'Error',
    },
  },

  // Profile Settings
  profileSettings: {
    location: {
      alerts: {
        errorTitle: 'Error',
      },
      update: {
        errorTitle: 'Error',
      },
    },
  },

  // Event Card
  eventCard: {
    eventTypes: {
      casual: 'Casual',
      general: 'General',
    },
    labels: {
      participants: '{{current}}/{{max}}',
    },
    buttons: {
      chat: 'Chat',
    },
  },

  // Create Event
  createEvent: {
    alerts: {
      confirm: 'OK',
    },
    languages: {
      chinese: '中文',
      japanese: '日本語',
      spanish: 'Español',
      french: 'Français',
    },
  },

  // Hosted Event Card
  hostedEventCard: {
    eventTypes: {
      casual: 'Casual',
      general: 'General',
    },
    buttons: {
      chat: 'Chat',
    },
    alerts: {
      error: 'Error',
    },
  },

  // Dues Management
  duesManagement: {
    alerts: {
      error: 'Error',
      ok: 'OK',
    },
    settings: {
      venmo: 'Venmo',
    },
    report: {
      totalColumn: 'Total',
    },
    countSuffix: '',
  },

  // Create Meetup
  createMeetup: {
    errors: {
      errorTitle: 'Error',
    },
  },

  // Activity Tab
  activityTab: {
    error: 'Error',
    no: 'No',
  },

  // Regular Meetup
  regularMeetup: {
    regularMeetupTitle: 'Encuentro Regular de {{day}}',
    error: 'Error',
    crowdOk: 'OK',
  },

  // Club Admin
  clubAdmin: {
    chat: 'Chat',
    chatNormal: 'Normal',
  },

  // Edit Club Policy
  editClubPolicy: {
    error: 'Error',
    no: 'No',
  },

  // Create Club Tournament
  createClubTournament: {
    matchFormats: {
      best_of_1: '1 Set',
      best_of_3: '3 Sets',
      best_of_5: '5 Sets',
    },
    seedingMethods: {
      manual: 'Manual',
    },
  },

  // Applied Event Card
  appliedEventCard: {
    eventType: {
      casual: 'Casual',
      general: 'General',
    },
    actions: {
      chat: 'Chat',
    },
    alerts: {
      error: 'Error',
    },
  },

  // Meetup Detail
  meetupDetail: {
    editEvent: {
      durationUnit: 'min',
    },
  },

  // Team Invitations
  teamInvitations: {
    error: 'Error',
    ok: 'OK',
  },

  // Create Club League
  createClubLeague: {
    ok: 'OK',
  },

  // Manage Announcement
  manageAnnouncement: {
    error: 'Error',
    ok: 'OK',
    importantNotice: 'Aviso Importante',
    importantNoticeDescription: 'Los avisos importantes se muestran de manera más prominente',
  },

  // Lesson Card
  lessonCard: {
    currencySuffix: '',
  },

  // Player Card
  playerCard: {
    notAvailable: 'N/A',
  },

  // Past Event Card
  pastEventCard: {
    chat: 'Chat',
  },

  // Weekly Schedule
  weeklySchedule: {
    total: 'Total',
  },

  // My Club Settings
  myClubSettings: {
    alerts: {
      ok: 'OK',
      error: 'Error',
    },
  },

  // Post Detail
  postDetail: {
    error: 'Error',
  },

  // Lesson Form
  lessonForm: {
    errorTitle: 'Error',
  },

  // Conclude League
  concludeLeague: {
    stats: {
      points: '{{points}} pts',
    },
  },

  // Tournament Detail
  tournamentDetail: {
    participantsSuffix: '',
  },

  // Developer Tools
  developerTools: {
    errorTitle: 'Error',
  },

  // Club League Management
  clubLeagueManagement: {
    status: {
      playoffs: 'Playoffs',
    },
  },

  // Event Detail
  eventDetail: {
    participants: {
      count: '',
    },
  },

  // Hall of Fame
  hallOfFame: {
    honorBadges: {
      receivedCount: '×{{count}}',
    },
  },

  // Record Score
  recordScore: {
    set: 'Set',
    setN: 'Set {{n}}',
    alerts: {
      error: 'Error',
      confirm: 'OK',
      globalRanking: 'Global',
    },
  },

  // Score Confirmation
  scoreConfirmation: {
    alerts: {
      error: 'Error',
    },
  },

  // Direct Chat
  directChat: {
    club: 'Club',
    alerts: {
      error: 'Error',
    },
  },

  // Match Detail
  matchDetail: {
    status: {
      confirmed: 'Confirmado',
      pending: 'Pendiente',
      completed: 'Completado',
      cancelled: 'Cancelado',
    },
  },

  // Participant Selector
  participantSelector: {
    maxParticipants: 'Participantes Máximos',
    peopleSuffix: ' personas',
    customInput: 'O ingresa un número personalizado:',
  },

  // Club Hall of Fame
  clubHallOfFame: {
    tabs: {
      trophies: '🏆 Trofeos',
      rankings: '📊 Rankings ELO',
    },
  },

  // Role Management
  roleManagement: {
    roles: {
      manager: 'Gerente',
    },
    alerts: {
      loadError: {
        title: 'Error',
      },
      transferError: {
        title: 'Error',
      },
    },
  },

  // Club Overview Screen
  clubOverviewScreen: {
    deleteError: 'Error',
    recentWinners: '🏆 Ganadores Recientes',
  },

  // Types
  types: {
    clubSchedule: {
      timePeriod: {
        am: 'AM',
        pm: 'PM',
      },
    },
    dues: {
      period: {
        year: '{{year}}',
        yearMonth: '{{month}}/{{year}}',
      },
    },
  },

  // Tournament
  tournament: {
    bestFinish: {
      champion: '🥇 Campeón',
      runnerUp: '🥈 Subcampeón',
      semiFinal: '🥉 Semifinalista',
      nthPlace: '{position}º lugar',
    },
  },

  // Club Policies Screen
  clubPoliciesScreen: {
    qrCodeTitle: 'Código QR de {{method}}',
  },

  // Find Club Screen
  findClubScreen: {
    members: '{{current}}/{{max}} miembros',
    joinRequestError: 'Error',
  },

  // Matches
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
    },
    alerts: {
      createSuccess: {
        confirm: 'OK',
      },
    },
  },

  // Services
  services: {
    map: {
      error: 'Error',
    },
  },

  // AI Matching
  aiMatching: {
    mockData: {
      candidate1: {
        name: 'Junsu Kim',
      },
      candidate2: {
        name: 'Seoyeon Lee',
      },
    },
  },

  // Club Policies
  clubPolicies: {
    defaultClubName: 'Club',
  },

  // Modals
  modals: {
    leagueCompleted: {
      points: 'pts',
    },
    playoffCreated: {
      final: 'Final',
    },
  },

  // Screens
  screens: {
    rateSportsmanship: {
      eventNotFound: 'Evento no encontrado',
    },
  },

  // Utils
  utils: {
    ltr: {
      whatIsLtr: {
        title: '¿Qué es LTR?',
        content:
          'LTR (Lightning Tennis Rating) es un sistema de evaluación de habilidad propietario desarrollado exclusivamente para la comunidad Lightning Tennis. LTR se calcula basándose en el algoritmo ELO aplicado a todos los resultados de partidos lightning públicos, mostrando tu trayectoria de crecimiento en una escala intuitiva de 1 a 10. Es un indicador honorable de cuánto has crecido dentro de nuestro ecosistema.',
      },
      relationToNtrp: {
        title: 'Relación con NTRP',
        content:
          'LTR es un sistema único distinto del NTRP de la USTA. Para la comodidad de usuarios familiarizados con las calificaciones NTRP, puedes seleccionar tu nivel de habilidad en un rango similar a NTRP al registrarte, pero todos los niveles oficiales calculados y mostrados dentro de la app se basan en LTR.',
      },
    },
  },

  // Create Club
  createClub: {
    fields: {
      logo: 'Logo',
    },
  },

  // Club List
  clubList: {
    clubType: {
      casual: 'Casual',
      social: 'Social',
    },
  },

  // Profile
  profile: {
    userProfile: {
      friendRequest: {
        error: 'Error',
      },
      sendMessage: {
        error: 'Error',
      },
      timeSlots: {
        brunch: 'Brunch',
      },
    },
  },

  // Onboarding
  onboarding: {
    alerts: {
      error: 'Error',
    },
  },

  // matchFeed (3 keys)
  matchFeed: {
    title: 'Feed de Partidos',
    noMatches: 'No hay partidos recientes',
    loadMore: 'Cargar Más',
  },

  // userStats (3 keys)
  userStats: {
    totalMatches: 'Partidos Totales',
    winRate: 'Tasa de Victoria',
    currentStreak: 'Racha Actual',
  },

  // notifications (3 keys)
  notifications: {
    markAllRead: 'Marcar Todo como Leído',
    noNotifications: 'No hay notificaciones',
    clearAll: 'Limpiar Todo',
  },

  // settings (3 keys)
  settings: {
    language: 'Idioma',
    notifications: 'Notificaciones',
    privacy: 'Privacidad',
  },

  // leagueStats (3 keys)
  leagueStats: {
    rank: 'Rango',
    points: 'Puntos',
    matchesPlayed: 'Partidos Jugados',
  },

  // tournamentBracket (3 keys)
  tournamentBracket: {
    round: 'Ronda',
    winner: 'Ganador',
    tbd: 'Por Determinar',
  },

  // clubEvents (3 keys)
  clubEvents: {
    upcoming: 'Próximos',
    past: 'Pasados',
    noEvents: 'No hay eventos',
  },

  // profileEdit (3 keys)
  profileEdit: {
    saveChanges: 'Guardar Cambios',
    cancel: 'Cancelar',
    uploadPhoto: 'Subir Foto',
  },

  // searchFilters (3 keys)
  searchFilters: {
    skillLevel: 'Nivel de Habilidad',
    location: 'Ubicación',
    availability: 'Disponibilidad',
  },

  // matchInvite (2 keys)
  matchInvite: {
    sendInvite: 'Enviar Invitación',
    inviteSent: 'Invitación Enviada',
  },

  // chatMessage (2 keys)
  chatMessage: {
    typeMessage: 'Escribe un mensaje...',
    send: 'Enviar',
  },

  // errorMessages (2 keys)
  errorMessages: {
    networkError: 'Error de red. Por favor intenta de nuevo.',
    unknownError: 'Ocurrió un error desconocido.',
  },

  // loadingStates (2 keys)
  loadingStates: {
    loading: 'Cargando...',
    pleaseWait: 'Por favor espera',
  },

  // confirmDialogs (2 keys)
  confirmDialogs: {
    areYouSure: '¿Estás seguro?',
    cannotUndo: 'Esta acción no se puede deshacer.',
  },

  // dateTime (2 keys)
  dateTime: {
    today: 'Hoy',
    yesterday: 'Ayer',
  },

  // validation (2 keys)
  validation: {
    required: 'Este campo es obligatorio',
    invalidEmail: 'Email inválido',
  },

  // permissions (2 keys)
  permissions: {
    cameraAccess: 'Se requiere acceso a la cámara',
    locationAccess: 'Se requiere acceso a la ubicación',
  },

  // shareOptions (2 keys)
  shareOptions: {
    shareMatch: 'Compartir Partido',
    shareProfile: 'Compartir Perfil',
  },

  // reportOptions (2 keys)
  reportOptions: {
    reportUser: 'Reportar Usuario',
    reportMatch: 'Reportar Partido',
  },

  // blockOptions (2 keys)
  blockOptions: {
    blockUser: 'Bloquear Usuario',
    unblockUser: 'Desbloquear Usuario',
  },

  // feedbackOptions (2 keys)
  feedbackOptions: {
    sendFeedback: 'Enviar Comentarios',
    rateApp: 'Calificar App',
  },

  // helpOptions (2 keys)
  helpOptions: {
    contactSupport: 'Contactar Soporte',
    faq: 'Preguntas Frecuentes',
  },

  // accountOptions (2 keys)
  accountOptions: {
    deleteAccount: 'Eliminar Cuenta',
    logOut: 'Cerrar Sesión',
  },

  // premiumFeatures (2 keys)
  premiumFeatures: {
    upgradeToPremium: 'Actualizar a Premium',
    unlockFeature: 'Desbloquear Función',
  },

  // achievementBadges (2 keys)
  achievementBadges: {
    newBadge: 'Nueva Insignia',
    viewAll: 'Ver Todo',
  },

  // courtReservation (2 keys)
  courtReservation: {
    reserveCourt: 'Reservar Cancha',
    cancelReservation: 'Cancelar Reserva',
  },

  // weatherInfo (2 keys)
  weatherInfo: {
    currentWeather: 'Clima Actual',
    forecast: 'Pronóstico',
  },

  // coachingOptions (2 keys)
  coachingOptions: {
    findCoach: 'Encontrar Entrenador',
    requestLesson: 'Solicitar Lección',
  },

  // equipmentShop (2 keys)
  equipmentShop: {
    shopRackets: 'Comprar Raquetas',
    shopBalls: 'Comprar Pelotas',
  },

  // videoAnalysis (2 keys)
  videoAnalysis: {
    uploadVideo: 'Subir Video',
    analyzeSwing: 'Analizar Swing',
  },

  // socialShare (2 keys)
  socialShare: {
    shareOnFacebook: 'Compartir en Facebook',
    shareOnInstagram: 'Compartir en Instagram',
  },

  // tournamentRegistration (2 keys)
  tournamentRegistration: {
    register: 'Registrarse',
    withdraw: 'Retirar',
  },

  // partnerSearch (2 keys)
  partnerSearch: {
    findPartner: 'Encontrar Compañero',
    noPartnersFound: 'No se encontraron compañeros',
  },

  // skillAssessment (2 keys)
  skillAssessment: {
    takeAssessment: 'Hacer Evaluación',
    viewResults: 'Ver Resultados',
  },

  // trainingPlans (2 keys)
  trainingPlans: {
    viewPlan: 'Ver Plan',
    startTraining: 'Comenzar Entrenamiento',
  },

  // injuryPrevention (1 key)
  injuryPrevention: {
    tips: 'Consejos de Prevención de Lesiones',
  },

  // nutritionAdvice (1 key)
  nutritionAdvice: {
    viewTips: 'Ver Consejos de Nutrición',
  },

  // mentalCoaching (1 key)
  mentalCoaching: {
    exercises: 'Ejercicios Mentales',
  },

  // matchHighlights (1 key)
  matchHighlights: {
    view: 'Ver Destacados',
  },

  // playerComparison (1 key)
  playerComparison: {
    compare: 'Comparar Jugadores',
  },

  // rankingHistory (1 key)
  rankingHistory: {
    view: 'Ver Historial de Ranking',
  },

  // strengthWeakness (1 key)
  strengthWeakness: {
    analysis: 'Análisis de Fortalezas/Debilidades',
  },

  // matchStrategy (1 key)
  matchStrategy: {
    tips: 'Consejos de Estrategia',
  },

  // clubManagement (1 key)
  clubManagement: {
    dashboard: 'Panel de Control del Club',
  },
};

console.log('\n🔍 Finding untranslated keys...\n');
const untranslated = findUntranslatedKeys(enJson, esJson);

console.log(`Found ${untranslated.length} untranslated keys:\n`);
untranslated.forEach(item => {
  console.log(`  ${item.key}: "${item.en}" → ${item.es}`);
});

// Apply translations
console.log('\n📝 Applying translations...\n');
const updatedEs = deepMerge(esJson, translations);

// Write updated Spanish file
fs.writeFileSync(esPath, JSON.stringify(updatedEs, null, 2) + '\n', 'utf8');

console.log('✅ Translation complete!');
console.log(`📊 Updated ${Object.keys(translations).length} sections`);
console.log(`📁 File updated: ${esPath}\n`);
