const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Comprehensive Spanish translations for all major sections
const esTranslations = {
  // Profile - User Profile Screen
  profile: {
    userProfile: {
      screenTitle: 'Perfil de Usuario',
      loading: 'Cargando perfil...',
      loadError: 'Error al cargar el perfil',
      notFound: 'Perfil no encontrado',
      backButton: 'Volver',
      defaultNickname: 'Jugador de Tenis',
      noLocation: 'Sin ubicación',
      joinedDate: 'Se unió el {{date}}',
      friendRequest: {
        title: 'Solicitud de Amistad',
        message: '¿Enviar solicitud de amistad a {{nickname}}?',
        cancel: 'Cancelar',
        send: 'Enviar',
        success: 'Éxito',
        successMessage: '¡Solicitud de amistad enviada!',
        notification: 'Aviso',
        cannotSend: 'No se puede enviar la solicitud.',
        error: 'Error',
        errorMessage: 'Error al enviar. Inténtalo de nuevo.',
      },
      sendMessage: {
        error: 'Error',
        loginRequired: 'Inicio de sesión requerido.',
      },
      actionButtons: {
        addFriend: 'Agregar Amigo',
        sendMessage: 'Enviar Mensaje',
      },
      rankings: {
        title: 'Rankings',
      },
      stats: {
        title: 'Estadísticas de Partidos',
        totalMatches: 'Total de Partidos',
        wins: 'Victorias',
        losses: 'Derrotas',
        winRate: 'Tasa de Victoria',
        currentStreak: '¡{{count}} Victorias Consecutivas!',
      },
      matchTypes: {
        singles: 'Individuales',
        doubles: 'Dobles',
        mixedDoubles: 'Dobles Mixtos',
      },
      playerInfo: {
        title: 'Información del Jugador',
        playingStyle: 'Estilo de Juego',
        languages: 'Idiomas',
        availability: 'Disponibilidad',
        weekdays: 'Entre Semana',
        weekends: 'Fines de Semana',
        noInfo: 'Sin información',
      },
      matchHistory: {
        title: 'Historial de Partidos Recientes',
        win: 'V',
        loss: 'D',
        score: 'Puntuación:',
      },
      timeSlots: {
        earlyMorning: 'Madrugada',
        morning: 'Mañana',
        afternoon: 'Tarde',
        evening: 'Atardecer',
        night: 'Noche',
        brunch: 'Brunch',
      },
    },
  },

  // Hall of Fame
  hallOfFame: {
    title: 'Salón de la Fama',
    trophies: 'trofeos',
    badges: 'insignias',
    trophiesTitle: 'Trofeos',
    winner: 'Ganador',
    finalist: 'Finalista',
    semifinalist: 'Semifinalista',
  },

  // Common
  common: {
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
    back: 'Volver',
    next: 'Siguiente',
    done: 'Hecho',
    loading: 'Cargando...',
    search: 'Buscar',
    filter: 'Filtrar',
    all: 'Todos',
    none: 'Ninguno',
    yes: 'Sí',
    no: 'No',
    ok: 'OK',
    retry: 'Reintentar',
    refresh: 'Actualizar',
    submit: 'Enviar',
    update: 'Actualizar',
    create: 'Crear',
    add: 'Agregar',
    remove: 'Eliminar',
    view: 'Ver',
    more: 'Más',
    less: 'Menos',
  },

  // App Navigator Screens
  appNavigator: {
    screens: {
      eventChat: 'Chat del Evento',
      editEvent: 'Editar Evento',
      eventDetail: 'Detalles del Evento',
      userProfile: 'Perfil de Usuario',
      rateSportsmanship: 'Calificar Deportividad',
      recordScore: 'Registrar Puntuación',
      meetupDetail: 'Info del Encuentro',
      leagueDetail: 'Info de la Liga',
      manageLeagueParticipants: 'Gestionar Partidos de Liga',
      createMeetup: 'Crear Nuevo Encuentro Recurrente',
      myClubSettings: 'Configuración del Club',
      concludeLeague: 'Seleccionar Ganador',
      clubMemberInvitation: 'Invitar Miembros',
      chatScreen: 'Entrenador Lightning',
      achievementsGuide: 'Guía de Logros',
    },
  },

  // Auth
  auth: {
    register: {
      title: 'Registrarse',
      subtitle: 'Únete a Lightning Tennis',
      displayName: 'Nombre',
      signingUp: 'Registrando...',
      passwordHint:
        'La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números.',
      agreeTerms: 'Acepto los Términos de Servicio (Requerido)',
      agreePrivacy: 'Acepto la Política de Privacidad (Requerido)',
      termsComingSoon: 'Próximamente',
      termsComingSoonMessage: 'Los Términos de Servicio estarán disponibles próximamente.',
      privacyComingSoon: 'Próximamente',
      privacyComingSoonMessage: 'La Política de Privacidad estará disponible próximamente.',
      errors: {
        title: 'Error',
        nameRequired: 'Por favor ingresa tu nombre.',
        nameMinLength: 'El nombre debe tener al menos 2 caracteres.',
        emailRequired: 'Por favor ingresa tu correo electrónico.',
        emailInvalid: 'Por favor ingresa un formato de correo válido.',
        passwordRequired: 'Por favor ingresa tu contraseña.',
        passwordMinLength: 'La contraseña debe tener al menos 8 caracteres.',
        passwordComplexity: 'La contraseña debe incluir mayúsculas, minúsculas y números.',
        passwordMismatch: 'Las contraseñas no coinciden.',
      },
    },
  },

  // Club
  club: {
    chat: 'Chat',
    clubMembers: {
      title: 'Gestión de Miembros',
      tabs: {
        currentMembers: 'Miembros Actuales',
        joinRequests: 'Solicitudes de Unión',
        allMembers: 'Todos los Miembros',
        roleManagement: 'Gestión de Roles',
        applications: 'Solicitudes ({{count}})',
      },
      roles: {
        owner: 'Propietario',
        admin: 'Administrador',
        member: 'Miembro',
        manager: 'Gerente',
      },
      status: {
        pending: 'Pendiente',
      },
      actions: {
        promote: 'Ascender a Admin',
        demote: 'Degradar a Miembro',
        remove: 'Eliminar del Club',
        cancel: 'Cancelar',
        approve: 'Aprobar',
        reject: 'Rechazar',
        manage: 'Gestionar',
        promoteToManager: 'Ascender a Gerente',
      },
    },
  },

  // Club Detail Screen
  clubDetailScreen: {
    loading: 'Cargando información del club...',
    notFound: 'Club No Encontrado',
    notFoundMessage: 'El club solicitado no existe o ha sido eliminado.',
    goBack: 'Volver',
    joinWaiting: 'Esperando Aprobación',
    reapply: 'Volver a Solicitar',
    joinApply: 'Solicitar Unirse',
    joinModalTitle: 'Unirse al Club',
    joinModalMessage: 'Solicitando unirse a {{name}}. Por favor deja un breve mensaje.',
    joinMessageLabel: 'Mensaje de Unión (Opcional)',
    joinMessagePlaceholder: 'Preséntate brevemente o explica por qué quieres unirte.',
    cancel: 'Cancelar',
    submit: 'Enviar',
  },

  // Club Overview Screen
  clubOverviewScreen: {
    loadingClubInfo: 'Cargando info del club...',
    loadingAnnouncements: 'Cargando anuncios...',
    important: 'Importante',
    noDateInfo: 'Sin fecha',
    bracketGeneration: 'Generación de Llaves',
    playoffsInProgress: 'Playoffs en Progreso',
    clubNotifications: 'Notificaciones del Club',
    viewAllNotifications: 'Ver Todas las Notificaciones ({{count}})',
    teamInviteTitle: 'Invitación de Equipo',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    deleteNotificationError: 'Ocurrió un error al eliminar la notificación.',
    deleteError: 'Error',
    clubActivity: 'Actividad del Club',
    winner: 'Ganador',
    runnerUp: 'Subcampeón',
    emptyStateAdminTitle: '🎾 ¿Listo para comenzar tu club?',
    emptyStateAdminDescription: 'Aún no hay actividades. ¡Disfrutemos del tenis con tus miembros!',
    emptyStateAdminAction1: 'Crea encuentros regulares e invita miembros',
    emptyStateAdminAction2: 'Invita nuevos miembros para hacer crecer tu club',
    clubAnnouncements: 'Anuncios del Club',
    activitiesInProgress: 'Actividades en Progreso',
    registrationOpen: 'Registro Abierto',
    inProgress: 'En Progreso',
    roundRobinInProgress: 'Round Robin en Progreso',
    upcomingActivities: 'Próximas Actividades',
    noAnnouncements: 'Sin anuncios',
    noActivities: 'Sin actividades',
    viewAll: 'Ver Todo',
  },

  // Club Policies Screen
  clubPoliciesScreen: {
    loading: 'Cargando información del club...',
    clubIntro: 'Introducción del Club',
    facilities: 'Instalaciones',
    clubRules: 'Reglas del Club',
    regularMeetings: 'Encuentros Regulares',
    recurring: 'Recurrente',
    costInfo: 'Información de Costos',
    joinFee: 'Cuota de Inscripción',
    monthlyFee: 'Cuota Mensual',
    yearlyFee: 'Cuota Anual',
    dueDate: 'Fecha de Vencimiento',
    dueDateValue: 'Día {{day}} de cada mes',
    lateFee: 'Recargo por Mora',
    paymentMethods: 'Métodos de Pago',
    qrHint: 'Toca los métodos de pago con ícono QR para ver el código QR',
    close: 'Cerrar',
    myDuesButton: 'Ver y Pagar Mis Cuotas',
    memberOnlyButton: 'Solo para Miembros',
    emptyTitle: 'Sin Información Disponible',
    emptyMessage:
      'Las reglas del club, horarios de encuentros regulares e información de costos aún no han sido configurados.',
  },

  // Create Club
  createClub: {
    title: 'Crear Club',
    basic_info: 'Info Básica',
    court_address: 'Dirección de la Cancha',
    regular_meet: 'Encuentros Recurrentes',
    visibility: 'Visibilidad',
    visibility_public: 'Público',
    visibility_private: 'Privado',
    fees: 'Cuotas',
    facilities: 'Instalaciones',
    rules: 'Reglas del Club',
    loading: 'Cargando información del club...',
    address_search_title: 'Buscar Dirección de Cancha de Tenis',
    meeting_modal_title: 'Agregar Horario de Encuentro Regular',
    day_selection: 'Selección de Día',
    meeting_time: 'Hora del Encuentro',
    start_time: 'Hora de Inicio',
    end_time: 'Hora de Fin',
    add_meeting: 'Agregar Horario de Encuentro',
    cancel: 'Cancelar',
    add: 'Agregar',
  },

  // Event Card
  eventCard: {
    status: {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      cancelled: 'Cancelado',
    },
    partnerStatus: {
      partnerPending: 'Socio Pendiente',
      partnerDeclined: 'Socio Rechazó',
    },
    matchType: {
      mensSingles: 'Individuales Masculinos',
      womensSingles: 'Individuales Femeninos',
      mensDoubles: 'Dobles Masculinos',
      womensDoubles: 'Dobles Femeninos',
      mixedDoubles: 'Dobles Mixtos',
    },
    eventTypes: {
      match: 'Partido',
      practice: 'Práctica',
      tournament: 'Torneo',
      lightning: 'Partido',
      meetup: 'Encuentro',
      casual: 'Casual',
      ranked: 'Clasificado',
      general: 'General',
    },
    labels: {
      host: 'Anfitrión',
    },
  },

  // Badge Gallery
  badgeGallery: {
    loading: 'Cargando insignias...',
    titleOwn: 'Mis Insignias',
    titleOther: 'Insignias Obtenidas',
    emptyOwn: 'Aún no tienes insignias',
    emptyOther: 'Aún no ha obtenido insignias',
    emptyHint: '¡Juega partidos y alcanza metas para ganar insignias!',
    modal: {
      earned: 'Obtenido: ',
      category: 'Categoría: ',
    },
    badges: {
      first_victory: {
        name: 'Primera Victoria',
        description: '¡Ganaste tu primer partido! 🎾',
      },
      first_club_join: {
        name: 'Primer Miembro de Club',
        description: '¡Te uniste a tu primer club de tenis! 🏟️',
      },
      streak_5: {
        name: 'Racha de 5 Victorias',
        description: '¡Ganaste 5 partidos seguidos!',
      },
      social_butterfly: {
        name: 'Mariposa Social',
        description: '¡Hiciste amistad con más de 10 jugadores!',
      },
      tournament_champion: {
        name: 'Campeón de Torneo',
        description: '¡Ganaste un torneo!',
      },
      league_master: {
        name: 'Maestro de Liga',
        description: '¡Terminaste 1° en una liga!',
      },
    },
  },

  // Cards
  cards: {
    hostedEvent: {
      unknown: 'Desconocido',
      doubles: 'Dobles',
      singles: 'Individuales',
      weather: {
        clear: 'Despejado',
        sunny: 'Soleado',
        partlycloudy: 'Parcialmente Nublado',
        mostlycloudy: 'Mayormente Nublado',
        cloudy: 'Nublado',
        overcast: 'Cubierto',
        fog: 'Neblina',
        lightrain: 'Lluvia Ligera',
        rain: 'Lluvia',
        heavyrain: 'Lluvia Fuerte',
        drizzle: 'Llovizna',
        showers: 'Chubascos',
        thunderstorm: 'Tormenta',
        snow: 'Nieve',
        lightsnow: 'Nieve Ligera',
        heavysnow: 'Nieve Fuerte',
        sleet: 'Aguanieve',
      },
    },
  },

  // Find Club Screen
  findClubScreen: {
    title: 'Buscar Clubes',
    searchPlaceholder: 'Buscar por nombre del club, ubicación...',
    searching: 'Buscando clubes...',
    searchResults: "Resultados de búsqueda para '{{query}}': {{count}} clubes",
    totalClubs: 'Total de clubes: {{count}}',
    public: 'Público',
    joinRequest: 'Solicitar Unión',
    joinComplete: 'Unido',
    pendingApproval: 'Aprobación Pendiente',
    joinDeclined: 'Rechazado',
    emptySearchTitle: 'Sin resultados',
    emptySearchMessage: 'Prueba con un término de búsqueda diferente',
    emptyListTitle: 'No hay clubes públicos disponibles',
    emptyListMessage: 'Crea un nuevo club',
    joinRequestTitle: 'Unirse al Club',
    joinRequestMessage: '¿Deseas solicitar unirte a {{name}}?',
    joinRequestButton: 'Solicitar',
    joinRequestSuccess: 'Éxito',
    joinRequestSuccessMessage:
      'Solicitud de unión enviada exitosamente. Por favor espera la aprobación del administrador.',
    joinRequestError: 'Error',
  },

  // Club List
  clubList: {
    searchPlaceholder: 'Buscar clubes',
    skillLevel: {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      all: 'Todos los Niveles',
    },
    clubType: {
      casual: 'Casual',
      competitive: 'Competitivo',
      social: 'Social',
    },
    fees: {
      joinFee: 'Cuota de Inscripción',
      monthlyFee: 'Cuota Mensual',
    },
    actions: {
      favorite: 'Agregar a Favoritos',
      viewDetails: 'Ver Detalles',
      createClub: 'Crear Club',
    },
    emptyState: {
      noJoinedClubs: 'No estás en ningún club',
      noSearchResults: 'Sin resultados de búsqueda',
      noNearbyClubs: 'No hay clubes cercanos',
      joinNewClub: '¡Únete a un nuevo club!',
      tryDifferentSearch: 'Prueba un término de búsqueda diferente',
      createNewClub: '¡Crea un nuevo club!',
    },
    filters: {
      all: 'Todos',
    },
  },

  // League Detail
  leagueDetail: {
    leagueDeleted: 'Liga Eliminada',
    leagueDeletedByAdmin:
      'Esta liga ha sido eliminada por otro administrador. Por favor crea una nueva si es necesario.',
    unknownUser: 'Usuario Desconocido',
    unknownPlayer: 'Desconocido',
    errorLoadingLeague: 'Error al cargar información de la liga',
    notification: 'Notificación',
    selectParticipants: 'Por favor selecciona participantes.',
    participantsAddError: 'Error al agregar participantes. Por favor revisa la consola.',
    partialSuccess: 'Éxito Parcial',
    teamsAddedSuccess: '{{count}} equipo(s) agregado(s) exitosamente.',
    teamsAddError: 'Error al agregar equipos.',
    loginRequired: 'Inicio de sesión requerido.',
    alreadyAppliedOrJoined: 'Ya solicitaste o estás participando.',
    selectPartner: 'Por favor selecciona un compañero.',
    applicationComplete: 'Solicitud Completa',
    applicationCompleteMessage:
      'Tu solicitud a la liga ha sido enviada. Por favor espera la aprobación.',
    applicationFailed: 'Solicitud Fallida',
    applicationFailedMessage: 'Error al enviar la solicitud. Por favor intenta de nuevo.',
    invitationSent: 'Invitación Enviada',
    teamApplicationFailedMessage: 'Error al enviar la solicitud de equipo.',
  },

  // Email Login
  emailLogin: {
    title: {
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      verification: 'Verificación de Correo',
    },
    labels: {
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
    },
    placeholders: {
      email: 'Ingresa tu correo',
      password: 'Ingresa tu contraseña',
      confirmPassword: 'Confirma tu contraseña',
    },
    buttons: {
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      forgotPassword: '¿Olvidaste tu Contraseña?',
      loginAfterVerification: 'Iniciar Sesión Después de Verificar',
      resendVerification: 'Reenviar Correo de Verificación',
      changeEmail: 'Registrarse con otro correo',
      tryAgain: 'Intentar de Nuevo',
      goToLogin: 'Ir a Iniciar Sesión',
      goToSignup: 'Registrarse',
      cancel: 'Cancelar',
    },
    toggle: {
      noAccount: '¿No tienes cuenta? ',
    },
  },

  // Alert
  alert: {
    title: {
      error: 'Error',
    },
  },

  // Activity Tab
  activityTab: {
    error: 'Error',
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

  // Hosted Event Card
  hostedEventCard: {
    buttons: {
      chat: 'Chat',
    },
    alerts: {
      error: 'Error',
    },
  },

  // Club Admin
  clubAdmin: {
    chat: 'Chat',
    chatNormal: 'Normal',
  },

  // Club Selector
  clubSelector: {
    club: 'Club',
  },

  // Direct Chat
  directChat: {
    club: 'Club',
    alerts: {
      error: 'Error',
    },
  },

  // Create Modal
  createModal: {
    lightningMatch: {
      subtitle: 'Partido Clasificado',
    },
    lightningMeetup: {
      subtitle: 'Encuentro Casual',
    },
  },

  // Developer Tools
  developerTools: {
    errorTitle: 'Error',
  },

  // Edit Club Policy
  editClubPolicy: {
    error: 'Error',
  },

  // Club League Management
  clubLeagueManagement: {
    status: {
      playoffs: 'Playoffs',
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
      error: 'Error',
    },
  },

  // Contexts
  contexts: {
    chatNotification: {
      viewAction: 'Ver',
      messageFrom: 'Mensaje de {{senderName}}: {{message}}',
    },
    location: {
      permissionTitle: 'Permiso de Ubicación Requerido',
      permissionMessage: 'Se requiere permiso de ubicación para encontrar jugadores cercanos.',
      permissionRequired: 'Se requiere permiso de ubicación.',
      serviceDisabled: 'Los servicios de ubicación están desactivados.',
      locationUnavailable: 'Ubicación no disponible.',
      locationTimeout: 'La solicitud de ubicación expiró.',
      cannotGetLocation: 'No se puede obtener la ubicación.',
      watchLocationFailed: 'Error al rastrear ubicación en tiempo real.',
    },
    notification: {
      permissionTitle: 'Permiso de Notificación Requerido',
      permissionMessage:
        'Por favor permite notificaciones en configuración para recibir alertas de partidos.',
      later: 'Después',
      openSettings: 'Abrir Configuración',
      matchNotificationTitle: 'Notificación de Partido',
      matchNotificationBody: 'Tienes un partido de tenis programado en 30 minutos.',
    },
  },

  // League
  league: {
    validation: {
      mensOnly: ' está disponible solo para jugadores masculinos.',
      womensOnly: ' está disponible solo para jugadoras femeninas.',
      doublesNeedPartner: 'Dobles requiere un compañero.',
      mixedDoublesRequirement:
        'Dobles mixtos requiere un jugador masculino y una jugadora femenina.',
      genderRestriction: ' está disponible solo para jugadores {gender}.',
    },
    eventTypes: {
      mens_singles: 'Individuales Masculinos',
      womens_singles: 'Individuales Femeninos',
      mens_doubles: 'Dobles Masculinos',
      womens_doubles: 'Dobles Femeninos',
      mixed_doubles: 'Dobles Mixtos',
    },
    genderLabels: {
      male: 'masculino',
      female: 'femenino',
    },
  },
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

function updateLocale(filename, translations) {
  const filePath = path.join(localesDir, filename);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  deepMerge(content, translations);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${filename}`);
}

console.log('🇪🇸 Applying comprehensive Spanish translations...\n');

updateLocale('es.json', esTranslations);

console.log('\n🎉 Spanish locale file updated with comprehensive translations!');
console.log('\nSections updated:');
console.log('  - profile.userProfile (complete)');
console.log('  - hallOfFame');
console.log('  - common');
console.log('  - appNavigator.screens');
console.log('  - auth.register');
console.log('  - club.clubMembers');
console.log('  - clubDetailScreen');
console.log('  - clubOverviewScreen');
console.log('  - clubPoliciesScreen');
console.log('  - createClub');
console.log('  - eventCard');
console.log('  - badgeGallery');
console.log('  - cards.hostedEvent');
console.log('  - findClubScreen');
console.log('  - clubList');
console.log('  - leagueDetail');
console.log('  - emailLogin');
console.log('  - contexts');
console.log('  - league');
console.log('  - And many more...');
