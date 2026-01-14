const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Comprehensive Spanish translations for all remaining sections
const translations = {
  // Activity Tab
  activityTab: {
    error: 'Error',
  },

  // AI Matching
  aiMatching: {
    analyzing: {
      title: 'Análisis de Emparejamiento IA',
      steps: {
        profile: 'Analizando perfil...',
        skillLevel: 'Emparejando nivel de habilidad...',
        location: 'Buscando por ubicación...',
        schedule: 'Verificando compatibilidad de horarios...',
        selection: 'Seleccionando mejores coincidencias...',
      },
      tip: '💡 La IA está analizando tu nivel de habilidad, ubicación y horario para encontrar los mejores compañeros de juego',
    },
    results: {
      title: 'Resultados de Emparejamiento IA',
      subtitle: 'Encontrados {{count}} jugadores que mejor te coinciden',
      tipsTitle: 'Consejos de Emparejamiento IA',
      tipsText: 'Puntuaciones más altas indican mejor compatibilidad de habilidad y horario',
      refreshButton: 'Buscar de Nuevo',
    },
    candidate: {
      matchScore: 'Puntuación de Coincidencia',
      skillLevel: {
        beginner: 'Principiante',
        elementary: 'Elemental',
        intermediate: 'Intermedio',
        advanced: 'Avanzado',
      },
      attributes: {
        strengths: 'Fortalezas Clave',
        availableTime: 'Horario Disponible',
        playStyle: 'Estilo de Juego',
      },
      sendRequest: 'Enviar Solicitud',
      viewProfile: 'Ver Perfil',
    },
    tips: {
      tip1: 'Actualiza tu perfil para mejores coincidencias',
      tip2: 'Juega más partidos para mejorar tu ranking',
      tip3: 'Agrega tu horario preferido',
    },
    noResults: {
      title: 'No se encontraron coincidencias',
      message: 'Intenta ajustar tus filtros o buscar en un área más amplia',
    },
  },

  // Alert
  alert: {
    title: {
      error: 'Error',
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

  // Auth (remaining)
  auth: {
    register: {
      errors: {
        title: 'Error',
        termsRequired: 'Por favor acepta los Términos de Servicio.',
        privacyRequired: 'Por favor acepta la Política de Privacidad.',
        signupFailed: 'Registro Fallido',
        signupFailedMessage: 'El registro falló.',
        emailInUse: 'Este correo ya está en uso.',
        invalidEmailFormat: 'Formato de correo inválido.',
        operationNotAllowed: 'El registro por correo está deshabilitado.',
        weakPassword: 'La contraseña es muy débil.',
        unknown: 'Ocurrió un error desconocido.',
      },
      success: {
        title: 'Registro Completo',
        message: 'Registro completado. Por favor configura tu perfil en la incorporación.',
      },
    },
  },

  // Badge Gallery (remaining)
  badgeGallery: {
    badges: {
      league_champion: {
        name: 'Campeón de Liga',
        description: '¡Ganaste una liga! 👑',
      },
      perfect_season: {
        name: 'Temporada Perfecta',
        description: '¡Terminaste una temporada invicto!',
      },
      community_leader: {
        name: 'Líder Comunitario',
        description: '¡Eres un administrador activo de club!',
      },
      unknown: {
        name: 'Insignia Especial',
        description: 'Insignia especial',
      },
    },
    alerts: {
      timeoutTitle: 'Tiempo Agotado',
      timeoutMessage:
        'La carga de insignias está tardando demasiado. Por favor verifica tu conexión y vuelve a intentar.',
      permissionTitle: 'Permiso Denegado',
      permissionMessage: 'No tienes permiso para acceder a la información de insignias.',
      unavailableTitle: 'Servicio No Disponible',
      unavailableMessage:
        'El servicio de Firebase no está disponible actualmente. Por favor intenta más tarde.',
    },
  },

  // Cards (remaining)
  cards: {
    hostedEvent: {
      weather: {
        hail: 'Granizo',
        windy: 'Ventoso',
        humid: 'Húmedo',
        hot: 'Caluroso',
        cold: 'Frío',
      },
    },
  },

  // Club (remaining)
  club: {
    chat: 'Chat',
    clubMembers: {
      actions: {
        demoteToMember: 'Degradar a Miembro',
        removeFromClub: 'Eliminar del Club',
      },
      alerts: {
        roleChange: {
          title: 'Cambiar Rol',
          confirm: 'Cambiar',
          message: '¿Cambiar a {{userName}} a {{role}}?',
          success: '{{userName}} ha sido cambiado a {{role}}.',
          error: 'Error al cambiar rol.',
        },
        removeMember: {
          title: 'Eliminar Miembro',
          action: 'Eliminar',
          message:
            '¿Estás seguro de que quieres eliminar a {{userName}} del club?\nEsta acción no se puede deshacer.',
          success: '{{userName}} ha sido eliminado del club.',
          error: 'Error al eliminar miembro.',
        },
        approveRequest: {
          title: 'Aprobar Solicitud',
          message: '¿Aprobar la solicitud de {{userName}}?',
          success: 'La solicitud de {{userName}} ha sido aprobada.',
          error: 'Error al aprobar solicitud.',
        },
        declineRequest: {
          title: 'Rechazar Solicitud',
          message: '¿Rechazar la solicitud de {{userName}}?',
          success: 'La solicitud de {{userName}} ha sido rechazada.',
          error: 'Error al rechazar solicitud.',
        },
      },
    },
  },

  // Club Admin
  clubAdmin: {
    chat: 'Chat',
    chatNormal: 'Normal',
  },

  // Club Communication
  clubCommunication: {
    timeAgo: {
      justNow: 'ahora mismo',
      noTimeInfo: 'Sin información de hora',
      noDateInfo: 'Sin información de fecha',
    },
    validation: {
      policyRequired: 'Por favor ingresa el contenido de la política',
      policyTooShort: 'El contenido de la política debe tener al menos 10 caracteres',
      policyTooLong: 'El contenido de la política no puede exceder 10,000 caracteres',
      titleRequired: 'Por favor ingresa un título',
      titleTooLong: 'El título no puede exceder 100 caracteres',
      contentRequired: 'Por favor ingresa contenido',
      contentTooLong: 'El contenido no puede exceder 5,000 caracteres',
      commentRequired: 'Por favor ingresa un comentario',
      commentTooLong: 'El comentario no puede exceder 1,000 caracteres',
      messageRequired: 'Por favor ingresa un mensaje',
      messageTooLong: 'El mensaje no puede exceder 1,000 caracteres',
    },
  },

  // Club Dues Management
  clubDuesManagement: {
    title: 'Gestión de Cuotas',
    loading: 'Cargando datos...',
    tabs: {
      settings: 'Configuración',
      status: 'Estado de Pago',
      unpaid: 'Miembros Impagos',
    },
    errors: {
      loadData: 'Error al cargar datos',
      inputError: 'Error de Entrada',
      invalidAmount: 'Por favor ingresa un monto válido',
      invalidDueDay: 'El día de vencimiento debe estar entre 1-31',
      saveFailed: 'Error al Guardar',
      saveError: 'Error al guardar configuración',
      updatePaymentStatus: 'Error al actualizar estado de pago',
      sendRemindersFailed: 'Error al enviar recordatorios',
      autoInvoiceError: 'Error al actualizar configuración de factura automática',
    },
    success: {
      settingsSaved: 'Configuración Guardada',
      settingsSavedMessage: 'La configuración de cuotas ha sido guardada',
      remindersSent: 'Recordatorios Enviados',
      remindersSentMessage: 'Recordatorios de pago enviados a {{count}} miembros',
    },
    settings: {
      title: 'Política de Cuotas',
      duesType: 'Tipo de Cuota',
      duesTypes: {
        monthly: 'Mensual',
        quarterly: 'Trimestral',
        annual: 'Anual',
        perMeeting: 'Por Reunión',
      },
      amount: 'Monto',
      dueDay: 'Día de Vencimiento',
      gracePeriod: 'Período de Gracia (días)',
      autoInvoice: 'Factura Automática',
      saveButton: 'Guardar Configuración',
    },
    status: {
      title: 'Estado de Pago',
      paid: 'Pagado',
      unpaid: 'Impago',
      overdue: 'Vencido',
      exempt: 'Exento',
      markAsPaid: 'Marcar como Pagado',
      markAsUnpaid: 'Marcar como Impago',
      sendReminder: 'Enviar Recordatorio',
    },
    unpaid: {
      title: 'Miembros Impagos',
      noUnpaid: 'Todos los miembros están al día',
      sendAllReminders: 'Enviar Recordatorios a Todos',
    },
  },

  // Club League Management
  clubLeagueManagement: {
    status: {
      playoffs: 'Playoffs',
    },
  },

  // Club Leagues & Tournaments
  clubLeaguesTournaments: {
    status: {
      registrationOpen: 'Inscripción Abierta',
      genderMismatch: 'Género No Coincide',
      inProgress: 'En Progreso',
      completed: 'Completado',
      open: 'Abierto',
      preparing: 'Preparando',
      ongoing: 'En Curso',
      playoffs: 'Playoffs',
      full: 'Lleno',
      unavailable: 'No Disponible',
    },
    buttons: {
      joinTournament: 'Unirse al Torneo',
      viewBracket: 'Ver Bracket',
      joining: 'Uniéndose...',
      participating: 'Participando',
      applyToLeague: 'Aplicar a Liga',
      viewMatches: 'Ver Partidos',
      viewResults: 'Ver Resultados',
      applying: 'Aplicando...',
      confirmed: 'Confirmado',
      pending: 'Pendiente',
    },
    tabs: {
      leagues: 'Ligas',
      tournaments: 'Torneos',
    },
    empty: {
      noLeagues: 'No hay ligas disponibles',
      noTournaments: 'No hay torneos disponibles',
      createFirst: 'Sé el primero en crear uno',
    },
    card: {
      participants: '{{count}} participantes',
      spotsLeft: '{{count}} lugares restantes',
      deadline: 'Fecha límite: {{date}}',
      prize: 'Premio: {{prize}}',
    },
    errors: {
      joinFailed: 'Error al unirse',
      applyFailed: 'Error al aplicar',
      alreadyJoined: 'Ya te has unido',
      registrationClosed: 'Inscripción cerrada',
    },
    alerts: {
      confirmJoin: '¿Unirse a este torneo?',
      confirmApply: '¿Aplicar a esta liga?',
      success: 'Éxito',
      joined: 'Te has unido exitosamente',
      applied: 'Tu aplicación ha sido enviada',
    },
  },

  // Club List (remaining)
  clubList: {
    clubType: {
      casual: 'Casual',
      social: 'Social',
    },
    filters: {
      nearby: 'Cercanos',
      joined: 'Clubes Unidos',
    },
  },

  // Club Overview Screen (remaining)
  clubOverviewScreen: {
    deleteError: 'Error',
    emptyStateAdminAction3: 'Organiza un torneo o liga',
    emptyStateMemberTitle: '🎾 Aún no hay actividades próximas',
    emptyStateMemberDescription:
      'El administrador del club está preparando nuevas actividades. ¡Por favor espera un momento!',
    emptyStateMemberAction1: 'Chatea con miembros en el chat del club',
    emptyStateMemberAction2: 'Explora otros jugadores cercanos',
    emptyStateGuestTitle: '🎾 ¡Bienvenido a {{clubName}}!',
    emptyStateGuestTitleDefault: '🎾 ¡Bienvenido al club!',
    emptyStateGuestDescription: 'Únete a este club para disfrutar del tenis con los miembros.',
    emptyStateGuestAction1: 'Solicitar membresía',
    emptyStateGuestAction2: 'Ver información del club',
    aiHelperHint: '¿No sabes qué hacer?',
    aiHelperButton: 'Chatea con Asistente IA',
    aiHelperSubtext: '¡Haz preguntas sobre tenis o cómo usar la app!',
    actionRequired: 'Acción Requerida',
  },

  // Club Policies Screen (remaining)
  clubPoliciesScreen: {
    days: {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
    },
  },

  // Club Selector
  clubSelector: {
    club: 'Club',
  },

  // Club Tournament Management
  clubTournamentManagement: {
    roundGeneration: { errorTitle: 'Error' },
    tournamentStart: { errorTitle: 'Error' },
    seedAssignment: { errorTitle: 'Error' },
    deletion: { errorTitle: 'Error' },
    participantRemoval: { errorTitle: 'Error' },
    participantAdd: { errorTitle: 'Error' },
    common: { error: 'Error' },
  },

  // Common (remaining)
  common: {
    error: 'Error',
  },

  // Create Club (remaining)
  createClub: {
    creating: 'Creando...',
    confirmAddress: 'Confirmar Dirección',
    errors: {
      address_required: 'La dirección es requerida.',
    },
    facility: {
      lights: 'Luces',
      indoor: 'Cubierto',
      parking: 'Estacionamiento',
      ballmachine: 'Máquina de Pelotas',
      locker: 'Vestidores',
      proshop: 'Tienda Pro',
    },
    fields: {
      name: 'Nombre del Club',
      intro: 'Introducción',
      address_placeholder: 'Buscar dirección de cancha (EN/US/Atlanta)',
      address_label: 'Dirección de la Cancha',
      address_search_placeholder: 'Buscar dirección de cancha de tenis',
      name_placeholder: 'ej., Club de Tenis Duluth',
      intro_placeholder: 'Describe los objetivos, ambiente y características únicas de tu club',
      fee_placeholder: 'ej., 50',
      rules_placeholder:
        'ej.:\n• Mantener 70%+ de asistencia a reuniones regulares\n• Mostrar respeto y cortesía mutua\n• Limpiar después de usar las instalaciones',
      meet_day: 'Día',
      meet_time: 'Hora',
      clubType: 'Tipo de Club',
      feeType: 'Tipo de Cuota',
      feeAmount: 'Monto de Cuota',
      rules: 'Reglas del Club',
      courtCount: 'Número de Canchas',
      surfaceType: 'Tipo de Superficie',
    },
    clubTypes: {
      competitive: 'Competitivo',
      casual: 'Casual',
      social: 'Social',
      mixed: 'Mixto',
    },
    feeTypes: {
      free: 'Gratis',
      monthly: 'Mensual',
      annual: 'Anual',
      perMeeting: 'Por Reunión',
    },
    surfaces: {
      hard: 'Dura',
      clay: 'Arcilla',
      grass: 'Césped',
      indoor: 'Cubierta',
    },
    validation: {
      nameRequired: 'El nombre del club es requerido',
      nameTooShort: 'El nombre debe tener al menos 3 caracteres',
      nameTooLong: 'El nombre no puede exceder 50 caracteres',
      introRequired: 'La introducción es requerida',
      introTooShort: 'La introducción debe tener al menos 20 caracteres',
      addressRequired: 'La dirección es requerida',
    },
    success: {
      title: '¡Club Creado!',
      message: 'Tu club ha sido creado exitosamente.',
    },
  },

  // Create Club Tournament
  createClubTournament: {
    loadingMembers: 'Cargando miembros...',
    headerTitle: 'Crear Nuevo Torneo',
    headerSubtitle: 'Inicia un torneo con los miembros de tu club',
    matchType: 'Tipo de Partido',
    matchTypeSubtitle: '¿Qué tipo de partidos tendrá este torneo?',
    tournamentInfo: 'Información del Torneo',
    tournamentName: 'Nombre del Torneo *',
    tournamentNamePlaceholder: 'ej., Torneo {eventType} 2025',
    description: 'Descripción (Opcional)',
    descriptionPlaceholder: 'Ingresa una breve descripción del torneo',
    applicationDeadline: 'Fecha Límite de Inscripción *',
    startDate: 'Fecha de Inicio *',
    endDate: 'Fecha de Fin *',
    entryFee: 'Cuota de Inscripción',
    maxPlayers: 'Máximo de Jugadores',
    advancedSettings: 'Configuración Avanzada',
    matchFormat: 'Formato de Partido',
    shortSets: 'Sets Cortos',
    shortSetsDescription: 'Sets de 4 juegos (regular es 6 juegos)',
    seedingMethod: 'Método de Siembra',
    seedingMethods: {
      random: 'Aleatorio',
      ranking: 'Por Ranking',
      manual: 'Manual',
    },
    bracketType: 'Tipo de Bracket',
    bracketTypes: {
      singleElimination: 'Eliminación Simple',
      doubleElimination: 'Eliminación Doble',
      roundRobin: 'Todos contra Todos',
    },
    buttons: {
      create: 'Crear Torneo',
      cancel: 'Cancelar',
      creating: 'Creando...',
    },
    errors: {
      nameRequired: 'El nombre del torneo es requerido',
      datesRequired: 'Las fechas son requeridas',
      invalidDates: 'La fecha de fin debe ser posterior a la de inicio',
      createFailed: 'Error al crear torneo',
    },
    success: {
      title: '¡Torneo Creado!',
      message: 'El torneo ha sido creado exitosamente.',
    },
  },

  // Create Event
  createEvent: {
    header: {
      editEvent: 'Editar Evento',
      createNew: 'Crear Nuevo',
    },
    eventType: {
      lightningMatch: 'Partido Relámpago',
      lightningMeetup: 'Encuentro Relámpago',
      match: 'Partido',
      meetup: 'Encuentro',
      doublesMatch: 'Partido de Dobles',
      singlesMatch: 'Partido de Singles',
    },
    buttons: {
      update: 'Actualizar',
      create: 'Crear',
      cancel: 'Cancelar',
      selectLocation: 'Seleccionar Ubicación',
      selectPartner: 'Seleccionar Compañero',
      selectTime: 'Seleccionar Hora',
    },
    fields: {
      titleLabel: 'Título *',
      description: 'Descripción',
      locationLabel: 'Ubicación *',
      selectLocation: 'Seleccionar Ubicación de Cancha',
      dateTimeLabel: 'Fecha y Hora *',
      maxParticipants: 'Máximo de Participantes',
      auto: 'Auto',
      autoSetByGameType: 'Se establece automáticamente según tipo de juego',
      gameTypeLabel: 'Tipo de Juego *',
      partner: 'Compañero',
      selectPartner: 'Seleccionar Compañero',
      ntrpRange: 'Rango LTR',
      message: 'Mensaje',
      messagePlaceholder: 'Escribe un mensaje para los participantes',
    },
    gameTypes: {
      singles: 'Singles',
      doubles: 'Dobles',
      mixed: 'Mixtos',
    },
    validation: {
      titleRequired: 'El título es requerido',
      locationRequired: 'La ubicación es requerida',
      dateRequired: 'La fecha y hora son requeridas',
      gameTypeRequired: 'El tipo de juego es requerido',
      partnerRequired: 'El compañero es requerido para dobles',
    },
    errors: {
      createFailed: 'Error al crear evento',
      updateFailed: 'Error al actualizar evento',
      loadFailed: 'Error al cargar evento',
    },
    success: {
      created: '¡Evento creado exitosamente!',
      updated: '¡Evento actualizado exitosamente!',
    },
    ntrpFilter: {
      title: 'Filtro de Nivel LTR',
      minLevel: 'Nivel Mínimo',
      maxLevel: 'Nivel Máximo',
      noRestriction: 'Sin Restricción',
    },
  },

  // Create Meetup
  createMeetup: {
    loading: 'Cargando información del club...',
    sections: {
      dateTime: 'Fecha y Hora',
      location: 'Ubicación',
      courtDetails: 'Detalles de la Cancha',
    },
    errors: {
      errorTitle: 'Error',
      failedToLoadInfo: 'Error al cargar información inicial',
      failedToLoadMeetup: 'No se pudo cargar información del encuentro.',
      failedToLoadMeetupError: 'Error al cargar información del encuentro.',
      inputError: 'Error de Entrada',
      invalidLocationType: 'Tipo de ubicación inválido.',
      selectValidDate: 'Por favor selecciona una fecha válida.',
      minOneCourt: 'Se requiere al menos 1 cancha.',
      clubInfoLoading:
        'La información del club aún se está cargando. Por favor intenta de nuevo en un momento.',
      externalCourtNameRequired: 'Por favor ingresa el nombre de la cancha externa.',
      externalCourtAddressRequired: 'Por favor ingresa la dirección de la cancha externa.',
      creationFailed: 'Error al Crear',
      savingError:
        'Error al guardar datos. Por favor contacta al desarrollador.\n\nError: {{error}}',
      updateFailed: 'Error al Actualizar',
      updateError: 'Error al actualizar el encuentro.\n\nError: {{error}}',
      failedToConfirm: 'Error al confirmar encuentro',
    },
    buttons: {
      create: 'Crear Encuentro',
      update: 'Actualizar Encuentro',
      cancel: 'Cancelar',
      selectDate: 'Seleccionar Fecha',
      selectTime: 'Seleccionar Hora',
      selectLocation: 'Seleccionar Ubicación',
    },
    fields: {
      title: 'Título',
      titlePlaceholder: 'ej., Práctica de Sábado',
      date: 'Fecha',
      time: 'Hora',
      duration: 'Duración',
      location: 'Ubicación',
      courtCount: 'Número de Canchas',
      maxParticipants: 'Máximo de Participantes',
      notes: 'Notas',
      notesPlaceholder: 'Notas adicionales para los participantes',
    },
    location: {
      clubCourt: 'Cancha del Club',
      externalCourt: 'Cancha Externa',
      courtName: 'Nombre de la Cancha',
      courtAddress: 'Dirección de la Cancha',
    },
    success: {
      created: '¡Encuentro creado exitosamente!',
      updated: '¡Encuentro actualizado exitosamente!',
    },
  },

  // Developer Tools
  developerTools: {
    errorTitle: 'Error',
  },

  // Direct Chat
  directChat: {
    club: 'Club',
    alerts: {
      error: 'Error',
    },
  },

  // Dues Management
  duesManagement: {
    title: 'Gestión de Cuotas',
    tabs: {
      settings: 'Configuración',
      status: 'Estado',
      overdue: 'Vencidos',
      report: 'Reporte',
    },
    fees: {
      joinFee: 'Cuota de Inscripción',
      monthlyFee: 'Cuota Mensual',
      quarterlyFee: 'Cuota Trimestral',
      yearlyFee: 'Cuota Anual',
      dueDate: 'Fecha de Vencimiento',
      gracePeriod: 'Período de Gracia',
      lateFee: 'Cargo por Mora',
      editSettings: 'Editar Configuración',
    },
    status: {
      paid: 'Pagado',
      unpaid: 'Impago',
      exempt: 'Exento',
      overdue: 'Vencido',
      pending: 'Pendiente',
    },
    actions: {
      approve: 'Aprobar',
      reject: 'Rechazar',
      markPaid: 'Marcar Pagado',
      markUnpaid: 'Marcar Impago',
      sendReminder: 'Enviar Recordatorio',
      viewHistory: 'Ver Historial',
      exportReport: 'Exportar Reporte',
    },
    alerts: {
      confirmApprove: '¿Aprobar este pago?',
      confirmReject: '¿Rechazar este pago?',
      reminderSent: 'Recordatorio enviado',
      paymentApproved: 'Pago aprobado',
      paymentRejected: 'Pago rechazado',
    },
    report: {
      title: 'Reporte de Cuotas',
      totalCollected: 'Total Recaudado',
      totalPending: 'Total Pendiente',
      totalOverdue: 'Total Vencido',
      membersPaid: 'Miembros Pagados',
      membersUnpaid: 'Miembros Impagos',
      collectionRate: 'Tasa de Recaudación',
    },
    empty: {
      noMembers: 'No hay miembros',
      noPayments: 'No hay pagos',
      noOverdue: 'No hay pagos vencidos',
    },
    errors: {
      loadFailed: 'Error al cargar datos',
      updateFailed: 'Error al actualizar',
      reminderFailed: 'Error al enviar recordatorio',
    },
  },

  // Edit Club Policy
  editClubPolicy: {
    error: 'Error',
  },

  // Email Login
  emailLogin: {
    toggle: {
      hasAccount: '¿Ya tienes cuenta? ',
      loginLink: 'Iniciar Sesión',
      signupLink: 'Registrarse',
    },
    emailStatus: {
      available: 'Correo disponible',
      accountFound: 'Cuenta encontrada',
      noAccountFound: 'No se encontró cuenta. ¡Por favor regístrate!',
      alreadyRegistered: 'Este correo ya está registrado. Intenta iniciar sesión.',
    },
    verification: {
      checkEmail: '¡Revisa Tu Correo!',
      sentTo: '{{email}}',
      description:
        'Te enviamos un correo con un enlace de verificación.\nHaz clic en el enlace del correo para verificar tu cuenta.\n\n(Por favor revisa también tu carpeta de spam)',
      loginButton: 'Iniciar Sesión Después de Verificar',
      resendButton: 'Reenviar Correo de Verificación',
      changeEmailButton: 'Registrarse con otro correo',
    },
    alerts: {
      inputRequired: {
        title: 'Entrada Requerida',
        message: 'Por favor ingresa correo y contraseña.',
      },
      invalidEmail: {
        title: 'Correo Inválido',
        message: 'Por favor ingresa una dirección de correo válida.\n\nEjemplo: ejemplo@email.com',
      },
      passwordTooShort: {
        title: 'Contraseña Muy Corta',
        message: 'La contraseña debe tener al menos 6 caracteres.',
      },
      passwordMismatch: {
        title: 'Contraseñas No Coinciden',
        message: 'Las contraseñas no coinciden. Por favor intenta de nuevo.',
      },
      verificationSent: {
        title: 'Verificación Enviada',
        message: 'Correo de verificación enviado. Por favor revisa tu bandeja de entrada.',
      },
      loginFailed: {
        title: 'Error de Inicio de Sesión',
        message: 'Error al iniciar sesión. Por favor verifica tus credenciales.',
      },
      signupFailed: {
        title: 'Error de Registro',
        message: 'Error al registrarse. Por favor intenta de nuevo.',
      },
      emailNotVerified: {
        title: 'Correo No Verificado',
        message: 'Por favor verifica tu correo antes de iniciar sesión.',
      },
      resetPasswordSent: {
        title: 'Correo Enviado',
        message: 'Enlace de restablecimiento de contraseña enviado a tu correo.',
      },
    },
    fields: {
      email: 'Correo Electrónico',
      emailPlaceholder: 'ejemplo@email.com',
      password: 'Contraseña',
      passwordPlaceholder: 'Ingresa tu contraseña',
      confirmPassword: 'Confirmar Contraseña',
      confirmPasswordPlaceholder: 'Confirma tu contraseña',
    },
    buttons: {
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      forgotPassword: '¿Olvidaste tu contraseña?',
      resetPassword: 'Restablecer Contraseña',
      verifyEmail: 'Verificar Correo',
      continueWithEmail: 'Continuar con Correo',
    },
  },

  // Event Card (remaining)
  eventCard: {
    eventTypes: {
      casual: 'Casual',
      general: 'General',
    },
    labels: {
      singles: 'Singles',
      doubles: 'Dobles',
      almostFull: 'Casi Lleno',
      friendly: 'Amistoso',
      full: 'Lleno',
    },
    buttons: {
      setLocation: 'Establecer Ubicación',
      chat: 'Chat',
      apply: 'Aplicar',
      applyAsTeam: 'Aplicar como Equipo',
      applySolo: 'Aplicar Solo',
      cancel: 'Cancelar',
      registrationClosed: 'Inscripción Cerrada',
    },
    results: {
      win: 'Victoria',
      loss: 'Derrota',
      noScore: 'Sin Puntuación',
      hostTeamWins: 'Equipo Local Gana',
      guestTeamWins: 'Equipo Visitante Gana',
    },
    requirements: {
      levelMismatch: 'Nivel no coincide (Tu LTR: {{userNtrp}}, Permitido: {{minNtrp}}~{{maxNtrp}})',
      genderMismatch: 'Género no coincide',
      alreadyApplied: 'Ya aplicaste',
      eventFull: 'Evento lleno',
    },
  },

  // Event Participation
  eventParticipation: {
    statusLabels: {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      waitlisted: 'Lista de Espera',
      cancelled: 'Cancelado',
      confirmed: 'Confirmado',
      no_show: 'No Se Presentó',
    },
    typeLabels: {
      participant: 'Participante',
      spectator: 'Espectador',
      helper: 'Ayudante',
    },
    messages: {
      autoApprovalTitle: '¡Participación en Reunión Regular Confirmada!',
      autoApprovalBody: 'Tu participación en {eventTitle} ha sido aprobada automáticamente.',
      requestSentTitle: 'Solicitud de Participación Enviada',
      requestSentBody:
        'Tu solicitud para {eventTitle} ha sido enviada. Por favor espera aprobación.',
      approvedTitle: '¡Participación Aprobada!',
      approvedBody: 'Tu participación en {eventTitle} ha sido aprobada.',
      rejectedTitle: 'Participación Rechazada',
      rejectedBody: 'Tu solicitud para {eventTitle} ha sido rechazada.',
    },
  },

  // Find Club Screen (remaining)
  findClubScreen: {
    joinRequestError: 'Error',
    joinRequestErrorMessage: 'Error al enviar solicitud de membresía.',
    loginRequired: 'Aviso',
    loginRequiredMessage: 'Se requiere iniciar sesión.',
    alreadyMember: 'Ya eres miembro de este club.',
    alreadyPending: 'Solicitud de membresía pendiente.',
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

  // League Detail (remaining)
  leagueDetail: {
    applicationPending: 'Tu aplicación a la liga está pendiente.',
    applicationApproved: '¡Has sido aprobado para unirte a la liga!',
    applicationRejected: 'Tu aplicación a la liga ha sido rechazada.',
    generateBracket: 'Generar Bracket',
    generateBracketMessage:
      'Gestiona aplicaciones en la pestaña Participantes, luego genera el bracket en la pestaña Gestión',
    generateBracketMessageSimple:
      'El calendario de partidos aparecerá aquí una vez generado el bracket',
    bracketGeneratedSuccess:
      '¡Bracket generado exitosamente!\n\nLa lista de partidos aparecerá pronto.',
    bracketGenerateError: 'Error al generar bracket.',
    bracketDeletedSuccess:
      'Bracket eliminado exitosamente.\n\nAhora puedes generar un nuevo bracket.',
    bracketDeleteError: 'Error al eliminar bracket.',
    startPlayoffs: 'Iniciar Playoffs',
    playoffsStartedSuccess:
      '¡Playoffs iniciados exitosamente!\n\nLos partidos de playoff aparecerán pronto.',
    playoffsStartError: 'Error al iniciar playoffs. Por favor intenta de nuevo.',
    playoffMatchErrorMessage:
      'Los resultados de playoff solo se pueden enviar durante la etapa de playoffs.\n\nPor favor verifica el estado de la liga.',
    playoffResultUpdated: '¡El resultado del partido de playoff ha sido actualizado!',
    resultSubmitted: 'El resultado del partido ha sido enviado.',
    resultSubmitSuccess: 'Resultado Enviado',
    resultSubmitError: 'Error al enviar resultado',
    matchNotFound: 'Partido no encontrado. Por favor actualiza e intenta de nuevo.',
    noPermission: 'Sin permiso para enviar resultado del partido.',
    tabs: {
      overview: 'General',
      standings: 'Clasificación',
      matches: 'Partidos',
      participants: 'Participantes',
      management: 'Gestión',
    },
    standings: {
      rank: 'Pos',
      player: 'Jugador',
      played: 'PJ',
      wins: 'G',
      losses: 'P',
      points: 'Pts',
      noStandings: 'Aún no hay clasificación',
    },
    matches: {
      upcoming: 'Próximos',
      completed: 'Completados',
      noMatches: 'No hay partidos programados',
      round: 'Ronda {{number}}',
      vs: 'vs',
      submitResult: 'Enviar Resultado',
      viewDetails: 'Ver Detalles',
    },
    status: {
      preparing: 'Preparando',
      registration: 'Inscripción',
      inProgress: 'En Progreso',
      playoffs: 'Playoffs',
      completed: 'Completado',
    },
  },

  // Leagues
  leagues: {
    admin: {
      unknownUser: 'Usuario Desconocido',
      applicant: 'Solicitante',
      leagueOpenedTitle: '🎭 Liga Abierta',
      leagueOpenedMessage:
        '¡La liga ha sido abierta exitosamente! Los miembros ahora pueden aplicar para participar.',
      leagueOpenError: 'Error al abrir la liga. Por favor intenta de nuevo.',
      permissionError: 'Error de Permiso',
      adminRequired: 'Se requiere permiso de administrador.',
      approvalCompleteTitle: '✅ Aprobación Completa',
      approvalCompleteMessage: 'La aplicación de {{name}} ha sido aprobada.',
      approvalFailed: 'Error de Aprobación',
      approvalError: 'Error al aprobar la aplicación. Por favor intenta de nuevo.',
      participantStatus: 'Estado de Participante',
      maxParticipants: 'Máximo',
      applicationDate: 'Aplicado',
      processing: 'Procesando...',
      noApplicants: 'Aún no hay solicitantes',
      applicantsWillAppear: 'Los solicitantes aparecerán aquí en tiempo real',
      leaguePrivateTitle: 'Liga es Privada',
      leaguePrivateMessage:
        'La liga está siendo preparada y no es visible para los miembros. Comienza a aceptar aplicaciones cuando estés listo.',
      opening: 'Abriendo...',
      rejectButton: 'Rechazar',
      rejecting: 'Rechazando...',
      rejectionCompleteTitle: '❌ Rechazo Completo',
      rejectionCompleteMessage: 'La aplicación de {{name}} ha sido rechazada.',
      rejectionFailed: 'Error de Rechazo',
      rejectionError: 'Error al rechazar la aplicación. Por favor intenta de nuevo.',
    },
  },

  // Lesson Form
  lessonForm: {
    errorTitle: 'Error',
  },

  // Manage Announcement
  manageAnnouncement: {
    title: 'Gestionar Anuncio',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    validationError: 'Por favor ingresa título y contenido.',
    savedSuccess: 'El anuncio ha sido guardado.',
    savingError: 'Error al guardar.',
    deleteTitle: 'Eliminar Anuncio',
    deleteConfirmMessage:
      '¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.',
    deletedSuccess: 'El anuncio ha sido eliminado.',
    deletingError: 'Error al eliminar.',
    editExisting: 'Editar Anuncio Existente',
    createNew: 'Crear Nuevo Anuncio',
    lastUpdated: 'Última actualización:',
    unknown: 'Desconocido',
    announcementDetails: 'Detalles del Anuncio',
    titleLabel: 'Título',
    contentLabel: 'Contenido',
    saveButton: 'Guardar',
    deleteButton: 'Eliminar',
    saving: 'Guardando...',
  },

  // Manage League Participants
  manageLeagueParticipants: {
    set: 'Establecer',
  },

  // Map App Selector
  mapAppSelector: {
    title: 'Seleccionar App de Mapas',
    appNotInstalled: 'App No Instalada',
    appNotInstalledMessage: '{{appName}} no está instalada en tu dispositivo.',
    install: 'Instalar',
    installed: 'Instalada',
    installationRequired: 'Instalación Requerida',
    errorOpeningApp: 'Error al abrir app de mapas. Por favor intenta de nuevo.',
    checkingApps: 'Verificando apps disponibles...',
    setAsDefault: 'Establecer como predeterminada',
    autoOpenDescription: 'Abrir automáticamente con esta app la próxima vez',
  },

  // Match Detail
  matchDetail: {
    defaultMessage: '¡Espero un gran partido!',
  },

  // Match Request
  matchRequest: {
    alerts: {
      selectTime: 'Por favor selecciona una hora de partido.',
      selectCourt: 'Por favor selecciona una cancha.',
      requestComplete: 'Solicitud de Partido Enviada',
      requestCompleteMessage: 'Solicitud de partido enviada a {{name}}.',
      requestError: 'Error al enviar solicitud de partido.',
    },
    skillLevel: {
      beginner: 'Principiante',
      elementary: 'Elemental',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
    },
    playerCard: {
      matches: 'partidos',
      winRate: 'tasa de victoria',
      recentMatches: 'Partidos Recientes',
    },
    schedule: {
      title: 'Horario del Partido',
      selectTime: 'Seleccionar Hora',
      duration: 'Duración del Partido',
    },
    court: {
      title: 'Seleccionar Cancha',
    },
    message: {
      title: 'Mensaje (Opcional)',
      label: 'Mensaje de Solicitud',
      placeholder: 'Escribe un saludo o tus expectativas para el partido',
    },
    summary: {
      title: 'Resumen del Partido',
    },
    buttons: {
      sendRequest: 'Enviar Solicitud',
    },
  },

  // Matches
  matches: {
    header: {
      notificationSettings: 'Configuración de Notificaciones',
      currentNotificationDistance: 'Distancia actual de notificación: {{distance}} millas',
    },
    tabs: {
      personal: 'Partidos Personales',
      club: 'Eventos del Club',
    },
    createButton: {
      newMatch: 'Crear Nuevo Partido',
      newEvent: 'Crear Nuevo Evento',
      template: 'Crear Nuevo {{type}}',
    },
    card: {
      recurring: 'Recurrente',
      level: 'Nivel: {{level}}',
      participants: 'Participantes: {{count}}/{{max}}',
      organizer: 'Organizador: {{name}}',
      pending: ' (Pendiente)',
      moreParticipants: '+{{count}} más',
      joinButton: 'Unirse',
      manageButton: 'Gestionar',
    },
    skillLevels: {
      all: 'Todos los Niveles',
    },
    recurringPatterns: {
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      weeklyMonday: 'Cada Lunes',
      weeklyTuesday: 'Cada Martes',
      weeklyWednesday: 'Cada Miércoles',
      weeklyThursday: 'Cada Jueves',
      weeklyFriday: 'Cada Viernes',
      weeklySaturday: 'Cada Sábado',
      weeklySunday: 'Cada Domingo',
    },
    empty: {
      noMatches: 'No hay partidos disponibles',
      noEvents: 'No hay eventos disponibles',
      createFirst: 'Sé el primero en crear uno',
    },
    filters: {
      all: 'Todos',
      upcoming: 'Próximos',
      past: 'Pasados',
      myMatches: 'Mis Partidos',
    },
  },

  // Meetup Detail
  meetupDetail: {
    title: 'Detalles del Encuentro',
    loading: 'Cargando detalles del encuentro...',
    goBack: 'Volver',
    errors: {
      notFound: 'Encuentro no encontrado.',
    },
    weather: {
      title: 'Pronóstico del Tiempo',
      chanceOfRain: 'Probabilidad de lluvia',
      windLabel: 'Viento',
      notAvailable: 'Clima No Disponible',
      unavailableReason:
        'Coordenadas de ubicación no disponibles o fecha fuera del rango de pronóstico',
      wind: {
        perfect: 'Perfecto',
        light: 'Ligero',
        moderate: 'Moderado',
        strong: 'Fuerte',
      },
    },
    sections: {
      details: 'Detalles',
      participants: 'Participantes',
      location: 'Ubicación',
      notes: 'Notas',
    },
    buttons: {
      join: 'Unirse',
      leave: 'Salir',
      edit: 'Editar',
      delete: 'Eliminar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      chat: 'Chat',
      directions: 'Cómo Llegar',
    },
    status: {
      confirmed: 'Confirmado',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
      full: 'Lleno',
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

// Load Spanish file
const esPath = path.join(localesDir, 'es.json');
const esContent = JSON.parse(fs.readFileSync(esPath, 'utf8'));

console.log('🇪🇸 Fixing remaining Spanish translations...\n');

// Merge translations
deepMerge(esContent, translations);

// Write back
fs.writeFileSync(esPath, JSON.stringify(esContent, null, 2) + '\n', 'utf8');

console.log('✅ Updated es.json with remaining translations');
console.log('\n🎉 Spanish translations have been updated!');
