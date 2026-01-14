#!/usr/bin/env node

/**
 * Spanish Translation Script - Comprehensive Round 2
 * Translates ALL untranslated keys in es.json
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

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

// Count function
function countUntranslated(enObj, esObj) {
  let count = 0;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], esObj[key] || {});
    } else {
      if (!esObj[key] || esObj[key] === enObj[key]) {
        count++;
      }
    }
  }
  return count;
}

// Comprehensive Spanish translations - ALL SECTIONS
const translations = {
  // ===== ADMIN SECTION (94 keys) =====
  admin: {
    logs: {
      title: 'Registros del Sistema',
      critical: 'Crítico',
      warning: 'Advertencia',
      healthy: 'Saludable',
      systemStatus: 'Estado del Sistema',
      lastChecked: 'Última Verificación',
      activeUsers: 'Usuarios Activos\n(24h)',
      newMatches: 'Nuevos Partidos\n(24h)',
      errors: 'Registros de Errores',
      categories: 'Categorías de Registro',
      functionLogs: 'Registros de Cloud Functions',
      functionLogsDesc: 'Ver en la Consola de Firebase',
      openConsole: 'Abrir Consola de Firebase',
      openConsoleDesc: '¿Deseas ver los registros de Cloud Functions en la Consola de Firebase?',
      authLogs: 'Registros de Autenticación',
      authLogsDesc: 'Eventos de inicio de sesión, registro y cierre de sesión',
      errorLogs: 'Registros de Errores',
      errorLogsDesc: 'Errores de la aplicación y API',
      performanceLogs: 'Monitoreo de Rendimiento',
      performanceLogsDesc: 'Métricas de rendimiento de la aplicación',
      recentActivity: 'Actividad Reciente',
      systemNormal: 'El sistema está funcionando normalmente',
      statsUpdated: 'Las estadísticas diarias se actualizan automáticamente',
      userActivity: 'Actividad de Usuarios',
      newSignup: 'Nuevo Registro',
      dailyActiveUsers: 'Usuarios Activos Diarios (DAU)',
      users: 'usuarios',
      totalUsers: 'Total de Usuarios',
      matchesCreated: 'Partidos (Últimos 7 Días)',
      games: 'partidos',
      loadError: 'Error al cargar registros',
      entries: 'entradas',
      noLogs: 'No hay registros para mostrar',
      justNow: 'Justo ahora',
      minutesAgo: ' minutos atrás',
      hoursAgo: ' horas atrás',
      daysAgo: ' días atrás',
    },
    devTools: {
      loading: 'Cargando...',
      tennisStats: '📊 Estadísticas de Tenis',
      matchesPlayed: 'Partidos Jugados',
      wins: 'Victorias',
      winRate: 'Tasa de Victoria',
      currentStreak: 'Racha Actual',
      eloRating: 'Clasificación ELO',
      badges: '🏆 Insignias Ganadas',
      notificationSettings: '🔔 Configuración de Notificaciones',
      requestPermissions: 'Solicitar Permisos de Notificación',
      permissionGranted: 'Notificaciones Habilitadas',
      permissionGrantedMessage: 'Ahora puedes recibir notificaciones push.',
      permissionRequired: 'Permiso Requerido',
      permissionRequiredMessage: 'Por favor permite las notificaciones en Configuración.',
      matchNotifications: 'Notificaciones de Partidos Personales',
      matchNotificationsDesc: 'Recibe notificaciones de nuevos partidos relámpago',
      clubEventNotifications: 'Notificaciones de Eventos del Club',
      clubEventNotificationsDesc: 'Recibe notificaciones de reuniones del club',
      notificationDistance: 'Rango de Distancia de Notificación',
      milesAway: 'millas de distancia',
      mile: 'milla',
      miles: 'millas',
      quietHours: 'Horas Silenciosas',
      setTime: 'Establecer Hora',
      appSettings: '⚙️ Configuración de la Aplicación',
      languageSettings: 'Configuración de Idioma',
      korean: 'Coreano',
      privacy: 'Privacidad',
      help: 'Ayuda',
      appInfo: 'Info de la App',
      logout: 'Cerrar Sesión',
      logoutConfirm: '¿Estás seguro de que quieres cerrar sesión?',
      developerTools: '🔧 Herramientas de Desarrollador',
      resetLeagueStats: '🔄 Restablecer Estadísticas de Liga',
      resetting: 'Restableciendo...',
      warningDevOnly: '⚠️ Solo para Desarrolladores - ¡Ejecutar Una Vez!',
      resetLeagueTitle: 'Restablecer Estadísticas de Liga',
      resetLeagueMessage:
        '¿Restablecer todas las estadísticas de liga de miembros a 0?\n\n⚠️ Esta acción no se puede deshacer.\n✅ Las estadísticas de torneo se conservarán.',
      resetCompleteTitle: 'Restablecimiento Completo',
      resetCompleteMessage: '{{count}} estadísticas de membresía han sido restablecidas.',
      resetFailedTitle: 'Error en Restablecimiento',
      resetFailedMessage: 'Ocurrió un error al restablecer las estadísticas de liga.\n\n{{error}}',
    },
    matchManagement: {
      title: 'Gestión de Partidos',
      events: 'Eventos',
      tournaments: 'Torneos',
      leagues: 'Ligas',
      total: 'Total',
      completed: 'Completado',
      inProgress: 'En Progreso',
      scheduled: 'Programado',
      cancelled: 'Cancelado',
      pending: 'Pendiente',
      today: 'Hoy',
      daysAgo: ' días atrás',
      searchPlaceholder: 'Buscar por nombre del jugador...',
      noResults: 'No se encontraron resultados',
      noMatches: 'No hay partidos registrados',
    },
  },

  // ===== CLUB TOURNAMENT MANAGEMENT (83 keys) =====
  clubTournamentManagement: {
    participants: {
      label: 'Participantes',
      overview: 'Resumen de Participantes',
      current: 'Participantes Actuales',
      max: 'Máximo de Participantes',
      list: 'Lista de Participantes',
      count: ' participantes',
      player1: 'Jugador 1',
      player2: 'Jugador 2',
    },
    buttons: {
      closeRegistration: 'Cerrar Inscripción',
      addParticipantManually: 'Agregar Participante Manualmente',
      generateBracket: 'Generando Cuadro...',
    },
    roundGeneration: {
      errorTitle: 'Error',
      currentRoundLabel: 'Ronda Actual: {{round}}',
      generating: 'Generando...',
      roundComplete: 'Ronda {{round}} Completada',
      generateNextRound: 'Generar Ronda {{round}}',
    },
    tournamentStart: {
      manualSeedingMessage:
        'El sembrado manual está habilitado. Por favor asigna los cabezas de serie en la pestaña Participantes, luego presiona "Generar Cuadro e Iniciar".',
      registrationClosedMessage: '¡Inscripción cerrada y cuadro generado. El torneo ha comenzado!',
      bracketGeneratedMessage: '¡Cuadro generado. El torneo ha comenzado!',
      waitForParticipantAddition:
        'Por favor espera hasta que se complete la adición de participantes.',
      bracketGenerationError: 'Ocurrió un error al generar el cuadro del torneo.',
      roundCheckError: 'Error al verificar la posibilidad de generación de ronda.',
      errorTitle: 'Error',
    },
    seedAssignment: {
      errorTitle: 'Error',
      errorAssigning: 'Ocurrió un error al asignar cabeza de serie',
      errorRemoving: 'Ocurrió un error al eliminar cabeza de serie',
      seedRangeError: 'El número de cabeza de serie debe estar entre 1 y {{max}}',
      completeMessageWithBracket:
        'Todos los participantes han sido asignados cabezas de serie.\nAhora puedes generar el cuadro del torneo.',
    },
    deletion: {
      confirmMessageInProgress:
        'Eliminar este torneo borrará todos los registros de partidos. ¿Continuar?',
      confirmMessageSimple: '¿Estás seguro de que quieres eliminar este torneo?',
      errorTitle: 'Error',
    },
    participantRemoval: {
      errorTitle: 'Error',
      confirmMessageTeam: '¿Eliminar al Equipo {{name}} del torneo?',
      successMessageTeam: 'El Equipo {{name}} ha sido eliminado exitosamente.',
      errorMessageWithDetails: 'Error al eliminar participante: {{error}}',
      unknownError: 'Ocurrió un error desconocido.',
    },
    participantAdd: {
      errorTitle: 'Error',
      successMessageWithNames: '{{count}} participante(s) agregado(s).\n{{names}}',
      errorMessageWithDetails: 'Error al agregar participante: {{error}}',
      allFailedMessage: 'Todas las adiciones de participantes fallaron.\n{{details}}',
      partialSuccessMessageWithDetails:
        'Éxito: {{successCount}}\n{{successNames}}\n\nFallo: {{failedCount}}\n{{failedDetails}}',
    },
    matchResult: {
      successMessage: 'El resultado del partido ha sido enviado exitosamente.',
      errorMessage: 'Error al enviar el marcador del partido.',
    },
    management: {
      status: 'Estado del Torneo',
      statusTitle: 'Estado del Torneo',
      tournamentManagement: 'Gestión del Torneo',
      openRegistrationDescription: 'Permitir que los miembros del club se registren para el torneo',
      deleteDescription: 'Eliminar permanentemente el torneo. Esta acción no se puede deshacer.',
      registrationFullMessage: 'La inscripción está llena. Ahora puedes cerrar la inscripción.',
      closeRegistrationDescription:
        'Cerrar la inscripción y preparar la generación del cuadro del torneo',
      deleteAllParticipantsWarning:
        'Eliminar todos los datos de participantes. Esta acción no se puede deshacer.',
      evenParticipantsRequired:
        'Los dobles requieren un número par de participantes (actual: {{count}})',
      assignSeedsManually: 'Asignar cabezas de serie manualmente en la pestaña Participantes',
      generateBracketAndStart: 'Generar Cuadro e Iniciar Torneo',
      generateBracketInstructions: 'Generar cuadro usando sembrado {{method}} e iniciar el torneo',
      addingParticipantsWait: 'Agregando participantes... Por favor espera hasta que se complete.',
      cancelAndDeleteWarning:
        'Cancelar generación del cuadro y eliminar torneo. Esta acción no se puede deshacer.',
      tournamentInProgress:
        'El torneo está en progreso. Verifica los resultados de los partidos en la pestaña Partidos.',
      minimumTeamsRequired:
        'Se requieren al menos 2 equipos para comenzar (actual: {{count}} equipos)',
      minimumParticipantsRequired:
        'Se requieren al menos 2 participantes para comenzar (actual: {{count}})',
      evenParticipantsNeeded: 'Los dobles requieren participantes pares (actual: {{count}})',
      manualSeedingInstructions:
        'Generar cuadro usando cabezas de serie asignados e iniciar el torneo',
      autoSeedingInstructions: 'Generar cuadro del torneo e iniciar la competición',
      resetTournamentWarning:
        'Eliminar todos los partidos y restablecer torneo. Esta acción no se puede deshacer.',
      tournamentCompleted: 'El torneo ha sido completado.',
    },
    common: {
      confirm: 'OK',
      error: 'Error',
    },
    formats: {
      singleElimination: 'Eliminación Simple',
      doubleElimination: 'Eliminación Doble',
      roundRobin: 'Todos contra Todos',
    },
    emptyStates: {
      noActiveTournaments: 'No hay torneos activos',
      noCompletedTournaments: 'No hay torneos completados',
      createNewMessage: 'Crea un nuevo torneo para competir con miembros del club',
      bracketNotGenerated: 'Cuadro aún no generado',
      bracketAfterRegistration: 'El cuadro se generará después de cerrar la inscripción',
      clickMatchesForDetails: 'Haz clic en los partidos para ver detalles',
      cannotLoadTeamInfo: 'No se puede cargar información del equipo',
      participantsCannotFormTeams:
        'Los participantes no pueden formar equipos. Por favor verifica la información de compañeros para cada participante.',
      openRegistrationMessage: 'Abre la inscripción para aceptar participantes',
      noParticipants: 'Aún no hay participantes',
      goToManagementTab: 'Ve a la pestaña Gestión y haz clic en "Abrir Inscripción"',
      waitForRegistrations: 'Espera a que los miembros del club se registren para el torneo',
    },
    labels: {
      participantCount: 'Participantes: {{current}}/{{max}}',
    },
  },

  // ===== LEAGUE DETAIL (67 keys) =====
  leagueDetail: {
    thirdPlace: '3er',
    fourthPlace: '4to',
    emptyStates: {
      noMatches: 'Aún no hay partidos',
      noStandings: 'No hay clasificación disponible',
      noStandingsDescription: 'La clasificación aparecerá cuando se jueguen los partidos.',
      noParticipants: 'Aún no hay participantes',
      noParticipantsDescription: 'Las solicitudes aparecerán aquí en tiempo real',
    },
    loading: {
      league: 'Cargando información de la liga...',
      generatingBracket: 'Generando cuadro...',
      generatingBracketSubtitle: 'La liga comenzará pronto',
    },
    errors: {
      leagueNotFound: 'Liga no encontrada',
    },
    standings: {
      matches: 'Partidos',
      wins: 'Victorias',
      losses: 'Derrotas',
      playoffTitle: 'Clasificación de Playoffs',
      thirdPlace: '3er Lugar',
      fourthPlace: '4to Lugar',
    },
    adminDashboard: {
      title: 'Panel de Administración',
      description: 'Gestiona participantes y configuraciones antes de que comience la liga',
      participantsTitle: 'Estado de Participantes',
      participantsTeamTitle: 'Estado de Equipos',
      approved: 'Aprobados',
      pending: 'Pendientes',
      maxParticipants: 'Máximo de Participantes',
      maxTeams: 'Máximo de Equipos',
      fillRate: 'Tasa de Llenado',
      matchProgress: 'Progreso de Partidos',
      fullCapacityNotice: 'Solicitudes completas, listo para cerrar inscripción.',
      addParticipantButton: 'Agregar Participante Directamente',
      participantListTitle: 'Lista de Participantes',
      approvedTeam: 'Equipo Aprobado',
    },
    leagueManagement: {
      title: 'Gestión de Liga',
      generateBracketButton: 'Generar Cuadro e Iniciar Liga',
      deleteBracketButton: 'Eliminar Cuadro',
      deleteBracketTitle: 'Eliminar Cuadro',
      deleteBracketDescription:
        'Eliminar todos los partidos y restablecer liga. Esta acción no se puede deshacer.',
      dangerZoneTitle: 'Zona de Peligro',
      deleteLeagueButton: 'Eliminar Liga',
      minParticipantsDoubles:
        'La liga de dobles requiere un mínimo de 2 equipos (4 jugadores). Actual: {{count}} jugadores',
      minParticipantsSingles:
        'La liga requiere un mínimo de 2 participantes para comenzar. Actual: {{count}} participantes',
    },
    playoffs: {
      inProgress: 'Playoffs en Progreso',
      format: 'Formato:',
      winner: 'Ganador: ',
      tapHint: 'Toca para ver el cuadro',
      seasonComplete: '¡Temporada Regular Completa!',
      seasonCompleteDescription:
        'Todos los partidos están terminados. Inicia los playoffs para determinar el campeón final.',
      startButton: 'Iniciar Playoffs',
      bracketToggle: 'Cuadro de Playoffs',
      standingsToggle: 'Clasificación',
    },
    matchApproval: {
      pendingTitle: 'Pendientes de Aprobación ({{count}} partidos)',
      pendingDescription: 'Aprobar todos los resultados de partidos enviados de una vez.',
      approveAllButton: 'Aprobar Todos los Resultados',
    },
    roundRobin: {
      inProgress: 'Todos contra Todos en Progreso',
      description:
        'Todos los participantes deben jugar entre sí una vez antes de que puedan comenzar los playoffs.',
    },
    dialogs: {
      rescheduleTitle: 'Reprogramar Partido',
      walkoverTitle: 'Procesar Walkover',
      walkoverQuestion: '¿Qué jugador debe ser marcado como walkover?',
      bulkApprovalTitle: 'Aprobar Resultados de Partidos en Lote',
      bulkApprovalMessage: '¿Aprobar todos los {{count}} resultados de partidos pendientes?',
      bulkApprovalWarning:
        'Los resultados aprobados se reflejarán en la clasificación y no se pueden deshacer.',
      approveAll: 'Aprobar Todos',
      deleteBracketTitle: '⚠️ Eliminar Cuadro',
      deleteBracketConfirm:
        '¿Eliminar todos los partidos en {{leagueName}}?\n\nEsta acción no se puede deshacer y la liga se restablecerá al estado de solicitud.',
      generateBracketConfirm:
        '¿Generar cuadro para {{leagueName}}?\n\nEsta acción no se puede deshacer y la liga comenzará.',
      startPlayoffsConfirm:
        'Todos los partidos de temporada regular están completos.\n\n¿Iniciar playoffs para {{leagueName}}?',
      deleteLeagueTitle: '⚠️ Eliminar Liga',
      deleteLeagueConfirm:
        '¿Estás seguro de que quieres eliminar "{{leagueName}}"?\n\nEsta acción no se puede deshacer y todos los datos de partidos e información de participantes se eliminarán.',
    },
  },

  // ===== DISCOVER (49 keys) =====
  discover: {
    skillFilters: {
      all: 'Todos',
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
    },
    alerts: {
      error: 'Error',
      success: 'Éxito',
      loginRequired: 'Inicio de Sesión Requerido',
      loginRequiredMessage: 'Por favor inicia sesión para solicitar eventos.',
      loginRequiredQuickMatch: 'Por favor inicia sesión para desafiar jugadores.',
      cannotApply: 'No se Puede Solicitar',
      eventFull: 'Este evento ya está lleno.',
      canceled: 'Cancelado',
      cancelSuccess: 'Solicitud cancelada exitosamente.',
      cancelFailed: 'Error al cancelar la solicitud.',
      deleteFailed: 'Error al eliminar.',
      deleted: 'Eliminado',
      lessonDeleted: 'La lección ha sido eliminada.',
      serviceDeleted: 'La publicación ha sido eliminada.',
      lessonCreated: 'La lección ha sido creada.',
      lessonUpdated: 'La lección ha sido actualizada.',
      serviceCreated: 'La publicación ha sido creada.',
      serviceUpdated: 'La publicación ha sido actualizada.',
      chatError: 'No se puede abrir la sala de chat.',
      chatAccessDenied: 'Aviso de Sala de Chat',
      chatAccessDeniedMessage:
        'No tienes permiso para acceder a esta sala de chat. Por favor solicita el evento y sé aprobado primero.',
      applicationError: 'Ocurrió un error al solicitar.',
      quickMatch: {
        title: '⚡ Partido Rápido',
        cannotChallenge: 'No se Puede Desafiar',
        sameGenderOnly: 'Solo puedes desafiar jugadores del mismo género.',
        ntrpOutOfRange: 'LTR {{ntrp}} está fuera de tu rango de desafío. (máx +1.0)',
        challengeMessage:
          '¿Desafiar a {{name}} a un partido?\n\nUbicación y hora se discutirán por chat después de la aceptación.',
        cancel: 'Cancelar',
        challenge: 'Desafiar',
        success: '¡Desafío Enviado!',
        rankedMatch: 'Una vez aceptado, discute ubicación y hora por chat.',
        friendlyMatch:
          'Este será un partido amistoso (no se registran estadísticas debido al historial de partidos reciente).\n\nUna vez aceptado, discute ubicación y hora por chat.',
        error: 'Error al crear partido rápido',
      },
      teamApplication: {
        submitted: 'Solicitud Enviada',
        submittedMessage:
          'Invitación de compañero enviada a {{name}}. Una vez aceptada, tu solicitud será enviada al anfitrión.',
        error: 'Ocurrió un error al enviar la solicitud de equipo: {{error}}',
      },
      soloApplication: {
        title: '¡Solicitud Individual Enviada!',
        message: 'Revisa "Eventos Solicitados" para encontrar un compañero.',
        messageWithNotification:
          'Revisa "Eventos Solicitados" para encontrar un compañero.\nSe notificó a {{count}} otro(s) solicitante(s) individual(es).',
        error: 'Ocurrió un error: {{error}}',
      },
    },
    partnerInvitation: {
      banner: 'Tienes {{count}} invitación(es) de compañero',
      bannerSingle: 'Tienes 1 invitación de compañero',
    },
    pendingApplications: {
      banner: 'Tienes {{count}} solicitud(es) pendiente(s). Toca para revisar.',
      bannerSingle: 'Tienes 1 solicitud pendiente. Toca para revisar.',
    },
  },

  // ===== EDIT PROFILE (48 keys) =====
  editProfile: {
    title: 'Editar Perfil',
    photoHint: 'Toca para cambiar foto',
    nickname: {
      label: 'Apodo *',
      placeholder: 'Ingresa tu apodo',
      available: '¡Apodo disponible!',
      checking: 'Verificando',
      checkingMessage: 'Verificando disponibilidad del apodo. Por favor espera.',
      unavailable: 'Apodo No Disponible',
      unavailableMessage: 'Este apodo no está disponible. Por favor elige otro.',
    },
    gender: {
      label: 'Género',
      male: 'Masculino',
      female: 'Femenino',
      notSpecified: 'No especificado',
      hint: '💡 El género se establece durante la incorporación y no se puede cambiar.',
    },
    skillLevel: {
      label: 'Nivel de Habilidad NTRP',
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
      hint: 'Después de tu primer partido, tu nivel de habilidad se calculará automáticamente según los resultados de tus partidos.',
    },
    playingStyle: {
      label: 'Estilo de Juego',
      aggressive: 'Agresivo',
      defensive: 'Defensivo',
      allCourt: 'Todo Cancha',
      baseline: 'Línea de Fondo',
      netPlayer: 'Jugador de Red',
    },
    travelDistance: {
      label: 'Distancia Máxima de Viaje ({{unit}})',
    },
    languages: {
      label: 'Idiomas',
      select: 'Seleccionar Idiomas',
    },
    goals: {
      label: 'Objetivos',
      placeholder: 'Ingresa tus objetivos de tenis...',
    },
    activityTime: {
      label: 'Horarios Preferidos de Actividad',
      hint: 'Selecciona tus franjas horarias preferidas para días de semana y fines de semana.',
      weekdays: 'Días de Semana',
      weekends: 'Fines de Semana',
      preferredTimesLabel: 'Horarios Preferidos ({{type}})',
      earlyMorning: 'Mañana Temprano (6-9am)',
      morning: 'Mañana (9am-12pm)',
      lunch: 'Almuerzo (12-2pm)',
      afternoon: 'Tarde (2-6pm)',
      evening: 'Noche (6-9pm)',
      night: 'Nocturno (9pm-12am)',
    },
    languageModal: {
      cancel: 'Cancelar',
      done: 'Listo',
    },
    errors: {
      imageUploadError: 'Error al subir imagen.',
      imageSelectError: 'No se pudo seleccionar imagen.',
    },
    common: {
      error: 'Error',
      ok: 'OK',
    },
  },

  // ===== DUES MANAGEMENT (47 keys) =====
  duesManagement: {
    title: 'Gestión de Cuotas',
    setupRequired: 'Configuración de cuotas requerida',
    setupMessage:
      'Configura las cuotas mensuales del club para comenzar a realizar seguimiento de pagos.',
    configureButton: 'Configurar Cuotas',
    monthlyAmount: 'Monto Mensual',
    dueDate: 'Fecha de Vencimiento',
    eachMonth: 'de cada mes',
    currentMonth: 'Mes Actual',
    allMembers: 'Todos los Miembros',
    paidMembers: 'Miembros Pagados',
    unpaidMembers: 'Miembros No Pagados',
    viewAllMembers: 'Ver Todos los Miembros',
    paymentHistory: 'Historial de Pagos',
    markAsPaid: 'Marcar como Pagado',
    markAsUnpaid: 'Marcar como No Pagado',
    confirmMarkPaid: '¿Marcar como pagado?',
    confirmMarkUnpaid: '¿Marcar como no pagado?',
    paymentMarkedPaid: 'Pago marcado como pagado',
    paymentMarkedUnpaid: 'Pago marcado como no pagado',
    errorMarkingPayment: 'Error al actualizar el estado del pago',
    actions: {
      change: 'Cambiar',
    },
    alerts: {
      error: 'Error',
      ok: 'OK',
    },
    settings: {
      venmo: 'Venmo',
    },
    modals: {
      qrCodeHelper: 'Los miembros pueden usar este código QR para realizar pagos.',
      noQrCodeYet: 'Aún no se ha establecido ningún código QR.',
    },
    overview: {
      title: 'Resumen',
      totalMembers: 'Total de Miembros',
      totalOwed: 'Total Adeudado',
      totalPaid: 'Total Pagado',
      collectionRate: 'Tasa de Cobro',
      pendingApproval: 'Pendiente de Aprobación',
      memberDuesStatus: 'Estado de Cuotas de Miembros',
      autoInvoiceLabel: 'Factura Automática',
      noRecordsYet: 'Aún no hay registros de cuotas',
      clickAutoInvoice:
        'Haz clic en "Factura Automática" arriba para enviar automáticamente facturas mensuales a todos los miembros.',
    },
    overdue: {
      membersWithOverdue: 'Miembros con Cuotas Vencidas',
      amountDue: 'Monto Adeudado',
      sendReminder: 'Enviar Recordatorio',
    },
    report: {
      loading: 'Cargando reporte...',
      noData: 'Sin Datos',
      noRecordsFound: 'No se encontraron registros de pago para {{year}}.',
      monthlyTotal: 'Total Mensual',
      totalColumn: 'Total',
      reportFileName: 'Reporte de Cuotas',
    },
    paymentForm: {
      transactionId: 'ID de Transacción (Opcional)',
      notes: 'Notas (Opcional)',
    },
    paymentDetails: {
      member: 'Miembro',
      type: 'Tipo',
      amount: 'Monto',
      method: 'Método',
      requested: 'Solicitado',
      notes: 'Notas',
      paymentProof: 'Comprobante de Pago',
    },
    types: {
      quarterly: 'Trimestral',
      custom: 'Personalizado',
      adminAdded: 'Agregado manualmente por admin',
    },
    inputs: {
      joinFeeDollar: 'Cuota de Inscripción ($)',
      monthlyFeeDollar: 'Cuota Mensual ($)',
      quarterlyFeeDollar: 'Cuota Trimestral ($)',
      yearlyFeeDollar: 'Cuota Anual ($)',
      dueDateLabel: 'Fecha de Vencimiento (1-31)',
      gracePeriodLabel: 'Período de Gracia (días)',
      lateFeeDollar: 'Cargo por Mora ($)',
      paymentMethodName: 'Nombre del Método de Pago',
      addPaymentPlaceholder: 'ej. PayPal, KakaoPay',
    },
    countSuffix: '',
  },

  // ===== TYPES (46 keys) =====
  types: {
    match: {
      matchTypes: {
        league: 'Partido de Liga',
        tournament: 'Torneo',
        lightning_match: 'Partido Relámpago',
        practice: 'Partido de Práctica',
      },
      matchStatus: {
        scheduled: 'Programado',
        in_progress: 'En Progreso',
        partner_pending: 'Compañero Pendiente',
        pending_confirmation: 'Pendiente de Confirmación',
        confirmed: 'Confirmado',
        completed: 'Completado',
        disputed: 'Disputado',
        cancelled: 'Cancelado',
      },
      matchFormats: {
        singles: 'Individuales',
        doubles: 'Dobles',
      },
      validation: {
        minOneSet: 'Se debe ingresar al menos un set.',
        gamesNonNegative: 'Set {{setNum}}: Los juegos deben ser 0 o mayores.',
        gamesExceedMax: 'Set {{setNum}}: Los juegos no pueden exceder {{maxGames}}.',
        gamesExceedMaxShort:
          'Set {{setNum}}: En sets cortos, los juegos no pueden exceder {{maxGames}} (máx {{gamesPerSet}}-{{minWin}} o {{maxAllowed}}-{{gamesPerSet1}}).',
        tiebreakRequired:
          'Set {{setNum}}: En {{setType}}, se requieren puntos de tie-break cuando el marcador es {{score}}-{{score}}.',
        tiebreakMargin:
          'Set {{setNum}}: {{tiebreakType}} debe terminar con un margen de 2 puntos (ej., 7-5, 8-6, 10-8).',
        tiebreakMinPoints:
          'Set {{setNum}}: {{tiebreakType}} debe alcanzar al menos {{minPoints}} puntos (ej., {{minPoints}}-{{minPoints2}}, {{minPoints1}}-{{minPoints3}}).',
        incompleteSet:
          'Set {{setNum}}: En {{setType}}, el set terminó con menos de {{gamesPerSet}} juegos. Por favor verifica si esto fue un retiro o situación especial.',
        invalidWinScore:
          'Set {{setNum}}: Para ganar con {{gamesPerSet}} juegos, el oponente puede tener máximo {{maxOppGames}} juegos.',
        invalidWinScoreShort:
          'Set {{setNum}}: En sets cortos, {{gamesPerSet}}-{{minGames}} es imposible. Para ganar con {{gamesPerSet}} juegos, el oponente puede tener máximo {{maxOppGames}} juegos.',
        invalidMaxGamesScore:
          'Set {{setNum}}: Para ganar con {{maxGames}} juegos, el oponente debe tener {{gamesPerSet1}} o {{gamesPerSet}} juegos.',
        invalidMaxGamesScoreShort:
          'Set {{setNum}}: En sets cortos, {{maxGames}}-{{minGames}} es imposible. El set termina en {{gamesPerSet}}-{{minGames}}.',
        regularSet: 'set regular',
        shortSet: 'set corto',
        tiebreak: 'tie-break',
        superTiebreak: 'super tie-break',
      },
    },
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
    tournament: {
      validation: {
        singlesNoPartner: 'Los torneos de individuales no requieren compañero.',
        mensSinglesMaleOnly: 'Los individuales masculinos son solo para jugadores masculinos.',
        womensSinglesFemaleOnly: 'Los individuales femeninos son solo para jugadoras femeninas.',
        doublesPartnerRequired: 'Los torneos de dobles requieren un compañero.',
        mensDoublesMaleOnly: 'Los dobles masculinos son solo para jugadores masculinos.',
        womensDoublesFemaleOnly: 'Los dobles femeninos son solo para jugadoras femeninas.',
        mixedDoublesRequirement:
          'Los dobles mixtos requieren un jugador masculino y una jugadora femenina.',
      },
      eventTypes: {
        mens_singles: 'Individuales Masculinos',
        womens_singles: 'Individuales Femeninos',
        mens_doubles: 'Dobles Masculinos',
        womens_doubles: 'Dobles Femeninos',
        mixed_doubles: 'Dobles Mixtos',
      },
    },
  },

  // ===== PROFILE SETTINGS (44 keys) =====
  profileSettings: {
    location: {
      permission: {
        granted: 'Otorgado',
        denied: 'Denegado',
        undetermined: 'No determinado',
        checking: 'Verificando...',
        grantedDescription: 'Puede encontrar clubes y partidos cercanos',
        deniedDescription: 'Por favor habilita el permiso de ubicación en Configuración',
        undeterminedDescription: 'Por favor establece el permiso de ubicación',
        checkingDescription: 'Verificando estado del permiso',
      },
      alerts: {
        permissionGrantedTitle: 'Permiso de Ubicación Otorgado',
        permissionGrantedMessage:
          'El permiso de ubicación ya está otorgado. Puedes encontrar clubes y partidos cercanos.',
        permissionTitle: 'Permiso de Ubicación',
        permissionMessage:
          'Se necesita el permiso de ubicación para encontrar clubes y partidos cercanos. Por favor habilítalo en Configuración.',
        errorTitle: 'Error',
        errorMessage: 'Ocurrió un error al verificar el permiso de ubicación.',
        openSettings: 'Abrir Configuración',
      },
      update: {
        checkingPermission: 'Verificando permiso de ubicación...',
        permissionRequiredTitle: 'Permiso de Ubicación Requerido',
        permissionRequiredMessage:
          'Se necesita el permiso de ubicación para obtener tu ubicación actual.',
        gettingLocation: 'Obteniendo ubicación actual...',
        savingLocation: 'Guardando ubicación...',
        gettingAddress: 'Obteniendo información de dirección...',
        successTitle: 'Éxito',
        successMessage: 'Ubicación actualizada: {{city}}',
        partialSuccessTitle: 'Éxito Parcial',
        partialSuccessMessage: 'Ubicación guardada (sin información de dirección)',
        errorTitle: 'Error',
        errorMessage: 'Ocurrió un error al actualizar la ubicación.',
      },
    },
    privacy: {
      title: 'Configuración de Privacidad',
      message: 'Navegar a configuración de privacidad.',
      comingSoonTitle: 'Próximamente',
      comingSoonMessage: 'Función de configuración de privacidad próximamente.',
    },
    deleteAccount: {
      title: 'Eliminar Cuenta',
      warningMessage:
        '¿Estás seguro de que quieres eliminar tu cuenta?\n\nEsta acción no se puede deshacer. Todos tus datos (perfil, historial de partidos, membresías de club, amigos) se eliminarán permanentemente.',
      confirmNicknameTitle: 'Confirmar Apodo',
      confirmNicknameMessage:
        'Para proceder con la eliminación de cuenta, escribe tu apodo "{{nickname}}".',
      finalConfirmationTitle: 'Confirmación Final',
      finalConfirmationMessage:
        'Estás a punto de eliminar permanentemente la cuenta "{{nickname}}".\n\nEsta acción no se puede deshacer.',
      deleteButton: 'Eliminar Cuenta',
      nicknameRequiredTitle: 'Apodo Requerido',
      nicknameRequiredMessage:
        'Por favor ingresa tu apodo para proceder con la eliminación de cuenta.',
      completeTitle: 'Completado',
      completeMessage: 'Tu cuenta ha sido eliminada.',
      noticeTitle: 'Aviso',
      noticeMessage: 'Hubo un problema al eliminar tu cuenta. Por favor intenta nuevamente.',
    },
  },

  // ===== PERFORMANCE DASHBOARD (43 keys) =====
  performanceDashboard: {
    loading: 'Analizando rendimiento...',
    periods: {
      weekly: 'Semanal',
      monthly: 'Mensual',
      yearly: 'Anual',
    },
    stats: {
      winRate: 'Tasa de Victoria',
      matchQuality: 'Calidad del Partido',
      playingFrequency: 'Frecuencia de Juego',
      totalMatches: 'Partidos Totales',
      averageSatisfaction: 'Satisfacción Promedio',
      matchesPerWeek: 'Partidos por Semana',
      periodRecord: 'Récord de {{period}}',
      winsLosses: '{{wins}}V {{losses}}D',
    },
    charts: {
      skillProgress: {
        title: 'Progreso del Nivel de Habilidad',
        subtitle: 'Basado en los últimos 10 partidos',
      },
      winRateTrend: {
        title: 'Tendencia de Tasa de Victoria',
        subtitle: 'Cambios semanales en tasa de victoria',
      },
      matchFrequency: {
        title: 'Frecuencia de Partidos por Día',
        subtitle: 'Partidos promedio',
      },
      timePerformance: {
        title: 'Distribución de Partidos por Hora',
        subtitle: 'Horarios de juego preferidos',
      },
    },
    timeSlots: {
      morning: 'Mañana',
      afternoon: 'Tarde',
      evening: 'Noche',
    },
    weekLabels: {
      week1: 'Semana 1',
      week2: 'Semana 2',
      week3: 'Semana 3',
      week4: 'Semana 4',
    },
    dayLabels: {
      mon: 'Lun',
      tue: 'Mar',
      wed: 'Mié',
      thu: 'Jue',
      fri: 'Vie',
      sat: 'Sáb',
      sun: 'Dom',
    },
    insights: {
      title: 'Perspectivas de Rendimiento',
      recommendations: 'Recomendaciones:',
    },
    monthlyReport: {
      title: 'Reporte Mensual',
      highlights: 'Aspectos Destacados del Mes',
      improvements: 'Áreas de Mejora',
      nextMonthGoals: 'Objetivos para el Próximo Mes',
    },
    detailedAnalysis: {
      title: 'Análisis Detallado',
      description: 'Consulta historial de partidos y análisis más detallados',
      viewDetails: 'Ver Detalles',
    },
  },
};

// Main execution
console.log('🇪🇸 Spanish Translation Script - Comprehensive Round 2\n');

const beforeCount = countUntranslated(en, es);
console.log(`📊 Untranslated keys BEFORE: ${beforeCount}\n`);

// Apply translations
const updatedEs = deepMerge(es, translations);

// Write updated Spanish file
fs.writeFileSync(ES_PATH, JSON.stringify(updatedEs, null, 2) + '\n', 'utf8');

const afterCount = countUntranslated(en, updatedEs);
const translated = beforeCount - afterCount;

console.log(`✅ Translation complete!`);
console.log(`📝 Keys translated: ${translated}`);
console.log(`📊 Remaining untranslated: ${afterCount}\n`);

// Show sections
const sectionNames = Object.keys(translations);
console.log(`📦 Sections translated: ${sectionNames.length}`);
sectionNames.slice(0, 10).forEach(name => {
  console.log(`   • ${name}`);
});
if (sectionNames.length > 10) {
  console.log(`   ... and ${sectionNames.length - 10} more`);
}

process.exit(0);
