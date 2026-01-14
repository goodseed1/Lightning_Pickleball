const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Batch 3: Larger remaining sections
const translations = {
  // AI Matching (remaining)
  aiMatching: {
    candidate: {
      strengths: {
        mental: 'Fortaleza Mental',
      },
    },
    bottomBar: {
      selectedName: 'A {{name}}',
      selectedAction: '¿Te gustaría enviar una solicitud de partido?',
      requestButton: 'Enviar Solicitud',
    },
  },

  // Club (remaining)
  club: {
    clubMembers: {
      tabs: {
        members: 'Miembros',
        requests: 'Solicitudes',
        banned: 'Bloqueados',
      },
      roles: {
        owner: 'Dueño',
        admin: 'Administrador',
        manager: 'Gerente',
        member: 'Miembro',
      },
    },
  },

  // Club Leagues & Tournaments (big section)
  clubLeaguesTournaments: {
    // Tournament related
    tournament: {
      title: 'Torneo',
      createTitle: 'Crear Torneo',
      editTitle: 'Editar Torneo',
      deleteTitle: 'Eliminar Torneo',
      participants: 'Participantes',
      matches: 'Partidos',
      bpaddle: 'Bpaddle',
      results: 'Resultados',
      winner: 'Ganador',
      runnerUp: 'Subcampeón',
      seed: 'Cabeza de Serie',
      round: 'Ronda',
      match: 'Partido',
      bye: 'Pase',
      quarterfinal: 'Cuartos de Final',
      semifinal: 'Semifinal',
      final: 'Final',
      thirdPlace: 'Tercer Lugar',
    },
    // League related
    league: {
      title: 'Liga',
      createTitle: 'Crear Liga',
      editTitle: 'Editar Liga',
      deleteTitle: 'Eliminar Liga',
      standings: 'Clasificación',
      schedule: 'Calendario',
      participants: 'Participantes',
      matches: 'Partidos',
      results: 'Resultados',
      season: 'Temporada',
      week: 'Semana',
      matchday: 'Jornada',
      points: 'Puntos',
      wins: 'Victorias',
      losses: 'Derrotas',
      draws: 'Empates',
      played: 'Jugados',
      goalsFor: 'A Favor',
      goalsAgainst: 'En Contra',
      goalDifference: 'Diferencia',
    },
    // Match related
    match: {
      score: 'Puntuación',
      submitScore: 'Enviar Puntuación',
      editScore: 'Editar Puntuación',
      winner: 'Ganador',
      loser: 'Perdedor',
      draw: 'Empate',
      forfeit: 'Abandono',
      noShow: 'No Se Presentó',
      pending: 'Pendiente',
      completed: 'Completado',
      scheduled: 'Programado',
      vs: 'vs',
      set: 'Set',
      game: 'Juego',
      tiebreak: 'Tiebreak',
    },
    // Registration
    registration: {
      open: 'Inscripción Abierta',
      closed: 'Inscripción Cerrada',
      deadline: 'Fecha límite: {{date}}',
      spotsLeft: '{{count}} lugares restantes',
      full: 'Lleno',
      register: 'Inscribirse',
      unregister: 'Cancelar Inscripción',
      withdraw: 'Retirarse',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      fee: 'Cuota: {{amount}}',
      paid: 'Pagado',
      unpaid: 'Impago',
    },
    // Participant management
    participant: {
      approve: 'Aprobar',
      reject: 'Rechazar',
      remove: 'Eliminar',
      seed: 'Asignar Cabeza de Serie',
      unseed: 'Quitar Cabeza de Serie',
      promote: 'Promover',
      demote: 'Degradar',
    },
    // Alerts
    alerts: {
      registerSuccess: 'Inscripción exitosa',
      registerError: 'Error al inscribirse',
      unregisterSuccess: 'Inscripción cancelada',
      unregisterError: 'Error al cancelar inscripción',
      scoreSubmitted: 'Puntuación enviada',
      scoreError: 'Error al enviar puntuación',
      confirmDelete: '¿Estás seguro de que quieres eliminar?',
      confirmWithdraw: '¿Estás seguro de que quieres retirarte?',
    },
    // Empty states
    empty: {
      noTournaments: 'No hay torneos',
      noLeagues: 'No hay ligas',
      noMatches: 'No hay partidos',
      noParticipants: 'No hay participantes',
      noResults: 'No hay resultados',
      createFirst: 'Sé el primero en crear uno',
    },
    // Filters
    filters: {
      all: 'Todos',
      upcoming: 'Próximos',
      ongoing: 'En Curso',
      completed: 'Completados',
      singles: 'Singles',
      doubles: 'Dobles',
      mixed: 'Mixtos',
    },
  },

  // Create Event (remaining - big section)
  createEvent: {
    // Singles/Doubles specific
    singles: {
      title: 'Partido de Singles',
      description: 'Partido individual uno contra uno',
    },
    doubles: {
      title: 'Partido de Dobles',
      description: 'Partido de parejas dos contra dos',
      partner: 'Compañero',
      selectPartner: 'Seleccionar Compañero',
      invitePartner: 'Invitar Compañero',
      partnerPending: 'Esperando confirmación del compañero',
      partnerConfirmed: 'Compañero confirmado',
      partnerDeclined: 'Compañero rechazó',
    },
    // Match type
    matchType: {
      title: 'Tipo de Partido',
      ranked: 'Clasificatorio',
      rankedDescription: 'Afecta tu ranking LPR',
      friendly: 'Amistoso',
      friendlyDescription: 'Sin afectar ranking',
      practice: 'Práctica',
      practiceDescription: 'Sesión de práctica informal',
    },
    // Skill level filter
    skillFilter: {
      title: 'Filtro de Nivel',
      minLevel: 'Nivel Mínimo',
      maxLevel: 'Nivel Máximo',
      noRestriction: 'Sin Restricción',
      yourLevel: 'Tu Nivel: {{level}}',
    },
    // Court selection
    court: {
      title: 'Seleccionar Cancha',
      search: 'Buscar cancha...',
      recent: 'Recientes',
      nearby: 'Cercanas',
      favorites: 'Favoritas',
      noResults: 'No se encontraron canchas',
      addNew: 'Agregar Nueva Cancha',
    },
    // Date/Time
    schedule: {
      title: 'Fecha y Hora',
      date: 'Fecha',
      time: 'Hora',
      duration: 'Duración',
      selectDate: 'Seleccionar Fecha',
      selectTime: 'Seleccionar Hora',
      hours: 'horas',
      minutes: 'minutos',
    },
    // Participants
    participants: {
      title: 'Participantes',
      max: 'Máximo',
      min: 'Mínimo',
      auto: 'Auto',
      autoDescription: 'Se establece según tipo de juego',
    },
    // Message
    message: {
      title: 'Mensaje',
      label: 'Mensaje para Participantes',
      placeholder: 'Escribe un mensaje para los participantes...',
      optional: '(Opcional)',
    },
    // Validation errors
    errors: {
      titleRequired: 'El título es requerido',
      locationRequired: 'La ubicación es requerida',
      dateRequired: 'La fecha es requerida',
      timeRequired: 'La hora es requerida',
      partnerRequired: 'El compañero es requerido para dobles',
      invalidDate: 'Fecha inválida',
      pastDate: 'No se puede seleccionar fecha pasada',
      createFailed: 'Error al crear evento',
      updateFailed: 'Error al actualizar evento',
    },
    // Success messages
    success: {
      created: '¡Evento creado exitosamente!',
      updated: '¡Evento actualizado exitosamente!',
      deleted: 'Evento eliminado',
    },
  },

  // Create Meetup (remaining)
  createMeetup: {
    header: {
      create: 'Crear Encuentro',
      edit: 'Editar Encuentro',
    },
    title: {
      label: 'Título',
      placeholder: 'ej., Práctica de Sábado',
    },
    description: {
      label: 'Descripción',
      placeholder: 'Describe el encuentro...',
      optional: '(Opcional)',
    },
    datetime: {
      date: 'Fecha',
      time: 'Hora',
      duration: 'Duración',
      hours: 'horas',
    },
    location: {
      title: 'Ubicación',
      clubCourt: 'Cancha del Club',
      externalCourt: 'Cancha Externa',
      courtName: 'Nombre de la Cancha',
      courtAddress: 'Dirección',
      searchPlaceholder: 'Buscar cancha...',
    },
    courts: {
      title: 'Detalles de Cancha',
      count: 'Número de Canchas',
      surface: 'Superficie',
    },
    participants: {
      title: 'Participantes',
      max: 'Máximo',
      waitlist: 'Lista de Espera',
      autoApprove: 'Aprobación Automática',
    },
    recurring: {
      title: 'Recurrencia',
      enabled: 'Evento Recurrente',
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
    },
    buttons: {
      create: 'Crear Encuentro',
      update: 'Actualizar',
      cancel: 'Cancelar',
      save: 'Guardar',
    },
    validation: {
      titleRequired: 'El título es requerido',
      dateRequired: 'La fecha es requerida',
      timeRequired: 'La hora es requerida',
      locationRequired: 'La ubicación es requerida',
    },
  },

  // Dues Management (big section - 154 keys)
  duesManagement: {
    // Header
    header: {
      title: 'Gestión de Cuotas',
      subtitle: 'Administra las cuotas del club',
    },
    // Settings tab
    settings: {
      title: 'Configuración',
      subtitle: 'Configura la política de cuotas',
      duesType: 'Tipo de Cuota',
      types: {
        monthly: 'Mensual',
        quarterly: 'Trimestral',
        annual: 'Anual',
        perMeeting: 'Por Reunión',
        none: 'Sin Cuota',
      },
      amount: 'Monto',
      amountPlaceholder: 'Ingresa el monto',
      currency: 'Moneda',
      dueDate: 'Día de Vencimiento',
      dueDateHelper: 'Día del mes (1-31)',
      gracePeriod: 'Período de Gracia',
      gracePeriodHelper: 'Días después del vencimiento',
      lateFee: 'Cargo por Mora',
      lateFeeHelper: 'Cargo adicional después del período de gracia',
      autoReminders: 'Recordatorios Automáticos',
      reminderDays: 'Días antes del vencimiento',
      paymentMethods: 'Métodos de Pago',
      paymentInstructions: 'Instrucciones de Pago',
      paymentInstructionsPlaceholder: 'Ingresa instrucciones para los miembros',
      save: 'Guardar Configuración',
      saving: 'Guardando...',
      saved: '¡Configuración guardada!',
      saveError: 'Error al guardar configuración',
    },
    // Status tab
    status: {
      title: 'Estado de Pagos',
      subtitle: 'Ver estado de pagos de miembros',
      all: 'Todos',
      paid: 'Pagados',
      unpaid: 'Impagos',
      overdue: 'Vencidos',
      exempt: 'Exentos',
      search: 'Buscar miembro...',
      noResults: 'No se encontraron miembros',
      member: 'Miembro',
      dueDate: 'Vencimiento',
      amount: 'Monto',
      status: 'Estado',
      lastPayment: 'Último Pago',
      actions: 'Acciones',
    },
    // Member row
    member: {
      markPaid: 'Marcar Pagado',
      markUnpaid: 'Marcar Impago',
      markExempt: 'Marcar Exento',
      sendReminder: 'Enviar Recordatorio',
      viewHistory: 'Ver Historial',
      daysOverdue: '{{days}} días vencido',
      paidOn: 'Pagado el {{date}}',
      dueOn: 'Vence el {{date}}',
    },
    // Overdue tab
    overdue: {
      title: 'Miembros Vencidos',
      subtitle: 'Miembros con pagos vencidos',
      noOverdue: 'No hay pagos vencidos',
      allCurrent: '¡Todos los miembros están al día!',
      sendAllReminders: 'Enviar Recordatorios a Todos',
      remindersSent: 'Recordatorios enviados',
      totalOverdue: 'Total Vencido',
      membersOverdue: 'Miembros Vencidos',
    },
    // Report tab
    report: {
      title: 'Reporte',
      subtitle: 'Resumen de recaudación',
      period: 'Período',
      thisMonth: 'Este Mes',
      lastMonth: 'Mes Pasado',
      thisQuarter: 'Este Trimestre',
      thisYear: 'Este Año',
      allTime: 'Todo el Tiempo',
      custom: 'Personalizado',
      totalCollected: 'Total Recaudado',
      totalPending: 'Total Pendiente',
      totalOverdue: 'Total Vencido',
      collectionRate: 'Tasa de Recaudación',
      membersPaid: 'Miembros Pagados',
      membersUnpaid: 'Miembros Impagos',
      membersOverdue: 'Miembros Vencidos',
      export: 'Exportar',
      exportCSV: 'Exportar CSV',
      exportPDF: 'Exportar PDF',
    },
    // Payment recording
    payment: {
      recordTitle: 'Registrar Pago',
      date: 'Fecha de Pago',
      amount: 'Monto',
      method: 'Método',
      methods: {
        cash: 'Efectivo',
        check: 'Cheque',
        transfer: 'Transferencia',
        card: 'Tarjeta',
        venmo: 'Venmo',
        zelle: 'Zelle',
        paypal: 'PayPal',
        other: 'Otro',
      },
      note: 'Nota',
      notePlaceholder: 'Nota opcional',
      record: 'Registrar',
      cancel: 'Cancelar',
      recorded: '¡Pago registrado!',
      recordError: 'Error al registrar pago',
    },
    // History
    history: {
      title: 'Historial de Pagos',
      noHistory: 'Sin historial',
      date: 'Fecha',
      amount: 'Monto',
      method: 'Método',
      recordedBy: 'Registrado por',
      note: 'Nota',
    },
    // Alerts
    alerts: {
      confirmMarkPaid: '¿Marcar como pagado?',
      confirmMarkUnpaid: '¿Marcar como impago?',
      confirmMarkExempt: '¿Marcar como exento?',
      confirmSendReminder: '¿Enviar recordatorio a este miembro?',
      confirmSendAllReminders: '¿Enviar recordatorios a todos los miembros vencidos?',
      success: 'Éxito',
      error: 'Error',
      reminderSent: 'Recordatorio enviado',
      remindersSent: 'Recordatorios enviados a {{count}} miembros',
      statusUpdated: 'Estado actualizado',
      updateError: 'Error al actualizar',
    },
    // Empty states
    empty: {
      noMembers: 'No hay miembros',
      noDuesPolicy: 'No hay política de cuotas configurada',
      setUpDues: 'Configura las cuotas en la pestaña de Configuración',
    },
  },

  // Email Login (remaining)
  emailLogin: {
    title: 'Iniciar Sesión con Correo',
    subtitle: 'Ingresa tu correo y contraseña',
    fields: {
      email: 'Correo Electrónico',
      emailPlaceholder: 'tu@correo.com',
      password: 'Contraseña',
      passwordPlaceholder: 'Tu contraseña',
      confirmPassword: 'Confirmar Contraseña',
      confirmPlaceholder: 'Confirma tu contraseña',
    },
    buttons: {
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      forgotPassword: '¿Olvidaste tu contraseña?',
      resetPassword: 'Restablecer Contraseña',
      sendReset: 'Enviar Enlace',
      backToLogin: 'Volver a Inicio',
      resendVerification: 'Reenviar Verificación',
      logging: 'Iniciando...',
      registering: 'Registrando...',
    },
    toggle: {
      hasAccount: '¿Ya tienes cuenta?',
      noAccount: '¿No tienes cuenta?',
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
    },
    verification: {
      title: 'Verificar Correo',
      message: 'Te enviamos un enlace de verificación a {{email}}',
      checkInbox: 'Por favor revisa tu bandeja de entrada',
      checkSpam: 'También revisa la carpeta de spam',
      resend: 'Reenviar correo',
      resent: '¡Correo reenviado!',
    },
    errors: {
      emailRequired: 'El correo es requerido',
      emailInvalid: 'Correo inválido',
      passwordRequired: 'La contraseña es requerida',
      passwordShort: 'La contraseña debe tener al menos 6 caracteres',
      passwordMismatch: 'Las contraseñas no coinciden',
      loginFailed: 'Error al iniciar sesión',
      signupFailed: 'Error al registrarse',
      userNotFound: 'Usuario no encontrado',
      wrongPassword: 'Contraseña incorrecta',
      emailInUse: 'Este correo ya está en uso',
      weakPassword: 'Contraseña muy débil',
      tooManyAttempts: 'Demasiados intentos. Intenta más tarde',
      networkError: 'Error de conexión',
      unknown: 'Error desconocido',
    },
    success: {
      loggedIn: '¡Sesión iniciada!',
      registered: '¡Registro exitoso!',
      resetSent: 'Enlace de restablecimiento enviado',
      verificationSent: 'Correo de verificación enviado',
    },
  },

  // League Detail (remaining)
  leagueDetail: {
    header: {
      title: 'Detalle de Liga',
      edit: 'Editar',
      delete: 'Eliminar',
      share: 'Compartir',
    },
    info: {
      organizer: 'Organizador',
      dates: 'Fechas',
      participants: 'Participantes',
      format: 'Formato',
      entryFee: 'Cuota',
      status: 'Estado',
    },
    tabs: {
      overview: 'General',
      standings: 'Clasificación',
      matches: 'Partidos',
      participants: 'Participantes',
      rules: 'Reglas',
      management: 'Gestión',
    },
    overview: {
      description: 'Descripción',
      schedule: 'Calendario',
      prizes: 'Premios',
      rules: 'Reglas',
    },
    standings: {
      rank: 'Pos',
      player: 'Jugador',
      team: 'Equipo',
      played: 'PJ',
      won: 'G',
      lost: 'P',
      drawn: 'E',
      points: 'Pts',
      setsWon: 'Sets+',
      setsLost: 'Sets-',
      gamesWon: 'Juegos+',
      gamesLost: 'Juegos-',
      noStandings: 'Aún no hay clasificación',
      generateStandings: 'Las clasificaciones aparecerán cuando comience la liga',
    },
    matches: {
      upcoming: 'Próximos',
      inProgress: 'En Curso',
      completed: 'Completados',
      round: 'Ronda {{number}}',
      noMatches: 'No hay partidos',
      generateMatches: 'Los partidos aparecerán cuando se genere el calendario',
      submitResult: 'Enviar Resultado',
      viewResult: 'Ver Resultado',
      reschedule: 'Reprogramar',
    },
    participants: {
      approved: 'Aprobados',
      pending: 'Pendientes',
      rejected: 'Rechazados',
      waitlist: 'Lista de Espera',
      approve: 'Aprobar',
      reject: 'Rechazar',
      remove: 'Eliminar',
      noParticipants: 'No hay participantes',
      maxReached: 'Máximo alcanzado',
    },
    management: {
      title: 'Gestión',
      openRegistration: 'Abrir Inscripción',
      closeRegistration: 'Cerrar Inscripción',
      generateSchedule: 'Generar Calendario',
      regenerateSchedule: 'Regenerar Calendario',
      startLeague: 'Iniciar Liga',
      pauseLeague: 'Pausar Liga',
      endLeague: 'Finalizar Liga',
      cancelLeague: 'Cancelar Liga',
      deleteLeague: 'Eliminar Liga',
      exportData: 'Exportar Datos',
    },
    alerts: {
      confirmStart: '¿Iniciar la liga?',
      confirmEnd: '¿Finalizar la liga?',
      confirmCancel: '¿Cancelar la liga?',
      confirmDelete: '¿Eliminar la liga? Esta acción no se puede deshacer.',
      leagueStarted: '¡Liga iniciada!',
      leagueEnded: '¡Liga finalizada!',
      leagueCancelled: 'Liga cancelada',
      leagueDeleted: 'Liga eliminada',
    },
  },

  // Matches (remaining)
  matches: {
    header: {
      title: 'Partidos',
      create: 'Crear',
      filter: 'Filtrar',
      search: 'Buscar',
    },
    tabs: {
      all: 'Todos',
      upcoming: 'Próximos',
      requests: 'Solicitudes',
      completed: 'Completados',
    },
    card: {
      vs: 'vs',
      at: 'en',
      level: 'Nivel',
      type: 'Tipo',
      status: 'Estado',
      score: 'Puntuación',
      pending: 'Pendiente',
      accepted: 'Aceptado',
      declined: 'Rechazado',
      completed: 'Completado',
      cancelled: 'Cancelado',
    },
    empty: {
      noMatches: 'No hay partidos',
      noUpcoming: 'No hay partidos próximos',
      noRequests: 'No hay solicitudes de partido',
      noCompleted: 'No hay partidos completados',
      findPlayer: 'Buscar Jugador',
      createMatch: 'Crear Partido',
    },
    filters: {
      type: 'Tipo',
      level: 'Nivel',
      date: 'Fecha',
      status: 'Estado',
      clear: 'Limpiar Filtros',
    },
    notifications: {
      newRequest: 'Nueva solicitud de partido',
      requestAccepted: 'Solicitud aceptada',
      requestDeclined: 'Solicitud rechazada',
      matchReminder: 'Recordatorio de partido',
      scoreSubmitted: 'Puntuación enviada',
    },
  },

  // Meetup Detail (remaining)
  meetupDetail: {
    header: {
      title: 'Detalle del Encuentro',
      edit: 'Editar',
      share: 'Compartir',
    },
    info: {
      host: 'Organizador',
      date: 'Fecha',
      time: 'Hora',
      duration: 'Duración',
      location: 'Ubicación',
      courts: 'Canchas',
      participants: 'Participantes',
    },
    actions: {
      join: 'Unirse',
      leave: 'Salir',
      cancel: 'Cancelar',
      directions: 'Cómo Llegar',
      chat: 'Chat',
      share: 'Compartir',
    },
    participants: {
      title: 'Participantes',
      count: '{{count}}/{{max}}',
      host: 'Organizador',
      confirmed: 'Confirmados',
      pending: 'Pendientes',
      waitlist: 'Lista de Espera',
      empty: 'Sé el primero en unirte',
    },
    weather: {
      title: 'Clima',
      loading: 'Cargando...',
      unavailable: 'No disponible',
    },
    alerts: {
      joinConfirm: '¿Unirse a este encuentro?',
      leaveConfirm: '¿Salir de este encuentro?',
      cancelConfirm: '¿Cancelar este encuentro?',
      joined: '¡Te has unido!',
      left: 'Has salido del encuentro',
      cancelled: 'Encuentro cancelado',
    },
  },

  // Create Club (remaining)
  createClub: {
    header: {
      create: 'Crear Club',
      edit: 'Editar Club',
    },
    steps: {
      basic: 'Información Básica',
      location: 'Ubicación',
      settings: 'Configuración',
      review: 'Revisar',
    },
    basic: {
      name: 'Nombre del Club',
      namePlaceholder: 'ej., Club de Tenis Duluth',
      intro: 'Descripción',
      introPlaceholder: 'Describe tu club...',
      clubType: 'Tipo de Club',
      types: {
        competitive: 'Competitivo',
        casual: 'Casual',
        social: 'Social',
        mixed: 'Mixto',
      },
    },
    location: {
      address: 'Dirección',
      searchPlaceholder: 'Buscar dirección...',
      courtCount: 'Número de Canchas',
      surface: 'Superficie',
      facilities: 'Instalaciones',
    },
    settings: {
      membership: 'Membresía',
      dues: 'Cuotas',
      duesType: 'Tipo de Cuota',
      duesAmount: 'Monto',
      meetingDay: 'Día de Reunión',
      meetingTime: 'Hora de Reunión',
      rules: 'Reglas del Club',
      rulesPlaceholder: 'Ingresa las reglas del club...',
    },
    review: {
      title: 'Revisar y Crear',
      clubInfo: 'Información del Club',
      locationInfo: 'Ubicación',
      settingsInfo: 'Configuración',
      create: 'Crear Club',
      creating: 'Creando...',
    },
    validation: {
      nameRequired: 'El nombre es requerido',
      nameShort: 'El nombre es muy corto',
      introRequired: 'La descripción es requerida',
      introShort: 'La descripción es muy corta',
      addressRequired: 'La dirección es requerida',
    },
    success: {
      title: '¡Club Creado!',
      message: 'Tu club ha sido creado exitosamente.',
      viewClub: 'Ver Club',
    },
  },

  // Create Club Tournament (remaining)
  createClubTournament: {
    steps: {
      type: 'Tipo',
      info: 'Información',
      settings: 'Configuración',
      participants: 'Participantes',
      review: 'Revisar',
    },
    info: {
      name: 'Nombre del Torneo',
      namePlaceholder: 'ej., Torneo de Primavera 2025',
      description: 'Descripción',
      descriptionPlaceholder: 'Describe el torneo...',
    },
    dates: {
      registration: 'Fecha Límite de Inscripción',
      start: 'Fecha de Inicio',
      end: 'Fecha de Fin',
    },
    settings: {
      format: 'Formato',
      matchFormat: 'Formato de Partido',
      seeding: 'Método de Siembra',
      entryFee: 'Cuota de Inscripción',
      maxParticipants: 'Máximo de Participantes',
    },
    participants: {
      preselect: 'Preseleccionar Participantes',
      selectAll: 'Seleccionar Todos',
      deselectAll: 'Deseleccionar Todos',
      selected: '{{count}} seleccionados',
    },
    review: {
      title: 'Revisar Torneo',
      create: 'Crear Torneo',
      creating: 'Creando...',
    },
    success: {
      title: '¡Torneo Creado!',
      message: 'El torneo ha sido creado exitosamente.',
      viewTournament: 'Ver Torneo',
    },
  },

  // Leagues (remaining)
  leagues: {
    list: {
      title: 'Ligas',
      create: 'Crear Liga',
      empty: 'No hay ligas',
      search: 'Buscar ligas...',
    },
    filters: {
      all: 'Todas',
      open: 'Inscripción Abierta',
      inProgress: 'En Curso',
      completed: 'Completadas',
      myLeagues: 'Mis Ligas',
    },
    card: {
      organizer: 'Organizador',
      dates: '{{start}} - {{end}}',
      participants: '{{count}}/{{max}}',
      status: 'Estado',
      register: 'Inscribirse',
      view: 'Ver',
    },
    create: {
      title: 'Crear Liga',
      name: 'Nombre',
      description: 'Descripción',
      format: 'Formato',
      dates: 'Fechas',
      participants: 'Participantes',
      fees: 'Cuotas',
      rules: 'Reglas',
      create: 'Crear',
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

console.log('🇪🇸 Fixing Spanish translations (Batch 3 - Large sections)...\n');

// Merge translations
deepMerge(esContent, translations);

// Write back
fs.writeFileSync(esPath, JSON.stringify(esContent, null, 2) + '\n', 'utf8');

console.log('✅ Updated es.json with batch 3 translations');
console.log('\n🎉 Spanish translations batch 3 complete!');
