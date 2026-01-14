const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Batch 2: More Spanish translations
const translations = {
  // AI Matching (remaining)
  aiMatching: {
    candidate: {
      playStyles: {
        aggressive: 'Agresivo',
        defensive: 'Defensivo',
        allRound: 'Completo',
      },
      strengths: {
        serve: 'Saque',
        volley: 'Volea',
        strategic: 'Juego Estratégico',
        backhand: 'Revés',
        defense: 'Defensa',
        endurance: 'Resistencia',
        forehand: 'Derecha',
        netPlay: 'Juego en Red',
        mental: 'Mental',
      },
      availability: {
        morning: 'Mañana (6-12)',
        afternoon: 'Tarde (12-18)',
        evening: 'Noche (18-22)',
        weekend: 'Fin de semana',
      },
      selected: 'Seleccionado',
    },
    mockData: {
      candidate1: {
        name: 'Junsu Kim',
        bio: 'Jugador apasionado mejorando continuamente.',
      },
      candidate2: {
        name: 'Seoyeon Lee',
        bio: 'Jugadora experimentada con excelente técnica.',
      },
      candidate3: {
        name: 'Minho Park',
        bio: 'Jugador competitivo que ama los torneos.',
      },
    },
  },

  // Club (remaining)
  club: {
    clubMembers: {
      alerts: {
        declineRequest: {
          invalidData: 'Datos de solicitud inválidos.',
        },
        loadError: {
          title: 'Error',
          message: 'Error al cargar solicitudes de ingreso.',
        },
        promoteSuccess: 'Promovido exitosamente a gerente.',
        demoteSuccess: 'Degradado exitosamente a miembro.',
        removeSuccess: 'El miembro ha sido eliminado.',
        actionError: 'Error al realizar la acción.',
        memberNotFound: 'Miembro no encontrado. Puede haber sido eliminado.',
        permissionDenied: 'Permiso denegado. Solo los administradores pueden realizar esta acción.',
        cannotRemoveSelf: 'No puedes eliminarte a ti mismo.',
        cannotRemoveOwner: 'No se puede eliminar al dueño del club.',
      },
      loading: 'Cargando miembros...',
      dateFormats: {
        joinedAt: 'Se unió {{date}}',
        requestedAt: 'Solicitó {{date}}',
      },
      emptyStates: {
        noMembers: {
          title: 'Sin Miembros',
          description: 'Aún no hay miembros en este club.',
        },
        noRequests: {
          title: 'Sin Solicitudes',
          description: 'No hay nuevas solicitudes de ingreso',
        },
      },
      profileHint: 'Ver Perfil →',
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
      actions: {
        promoteToManager: 'Promover a Gerente',
        promoteToAdmin: 'Promover a Administrador',
        ban: 'Bloquear',
        unban: 'Desbloquear',
      },
    },
  },

  // Club Dues Management (remaining)
  clubDuesManagement: {
    settings: {
      monthly: 'Mensual',
      yearly: 'Anual',
      amountPlaceholder: 'Ingresa monto',
      dueDayPlaceholder: 'Día del mes',
      dueDayHelper: 'Fecha de vencimiento mensual (1-31)',
      gracePeriodPlaceholder: 'Días',
      paymentInstructions: 'Instrucciones de Pago',
      paymentInstructionsPlaceholder: 'Instrucciones mostradas a los miembros',
      paymentMethods: 'Métodos de Pago',
      addMethod: 'Agregar',
      saveSettings: 'Guardar Configuración',
    },
    status: {
      all: 'Todos',
      filter: 'Filtrar',
      search: 'Buscar miembros...',
      noResults: 'No se encontraron miembros',
      totalMembers: 'Total de Miembros',
      paidMembers: 'Miembros Pagados',
      unpaidMembers: 'Miembros Impagos',
      collectionRate: 'Tasa de Recaudación',
    },
    unpaid: {
      sendReminders: 'Enviar Recordatorios',
      remindersSent: 'Recordatorios enviados a {{count}} miembros',
      daysOverdue: '{{days}} días vencido',
      noUnpaidMembers: 'Todos los miembros están al día',
    },
    history: {
      title: 'Historial de Pagos',
      date: 'Fecha',
      amount: 'Monto',
      method: 'Método',
      status: 'Estado',
      noHistory: 'Sin historial de pagos',
    },
  },

  // Club Leagues & Tournaments (remaining)
  clubLeaguesTournaments: {
    tournament: {
      bpaddle: 'Bpaddle',
      round: 'Ronda',
      quarterfinal: 'Cuartos de Final',
      semifinal: 'Semifinal',
      final: 'Final',
      winner: 'Ganador',
      seed: 'Cabeza de Serie',
      bye: 'Pase',
    },
    league: {
      season: 'Temporada',
      week: 'Semana',
      matchday: 'Jornada',
      standings: 'Clasificación',
      schedule: 'Calendario',
      results: 'Resultados',
    },
    registration: {
      open: 'Inscripción Abierta',
      closed: 'Inscripción Cerrada',
      deadline: 'Fecha límite: {{date}}',
      fee: 'Cuota: {{amount}}',
      spotsAvailable: '{{count}} lugares disponibles',
      register: 'Inscribirse',
      unregister: 'Cancelar Inscripción',
      alreadyRegistered: 'Ya estás inscrito',
    },
  },

  // Create Club Tournament (remaining)
  createClubTournament: {
    validation: {
      nameRequired: 'El nombre del torneo es requerido',
      nameTooShort: 'El nombre debe tener al menos 3 caracteres',
      nameTooLong: 'El nombre no puede exceder 100 caracteres',
      startDateRequired: 'La fecha de inicio es requerida',
      endDateRequired: 'La fecha de fin es requerida',
      invalidDateRange: 'La fecha de fin debe ser posterior a la de inicio',
      deadlineRequired: 'La fecha límite de inscripción es requerida',
      deadlineAfterStart: 'La fecha límite debe ser anterior a la de inicio',
    },
    matchTypes: {
      singles: 'Singles',
      doubles: 'Dobles',
      mixed: 'Mixtos',
    },
    formats: {
      singleElimination: 'Eliminación Simple',
      doubleElimination: 'Eliminación Doble',
      roundRobin: 'Todos contra Todos',
      swiss: 'Sistema Suizo',
    },
    prize: {
      title: 'Información del Premio',
      firstPlace: 'Primer Lugar',
      secondPlace: 'Segundo Lugar',
      thirdPlace: 'Tercer Lugar',
      placeholder: 'ej., Trofeo, $100, etc.',
    },
  },

  // Create Event (remaining)
  createEvent: {
    partner: {
      title: 'Seleccionar Compañero',
      search: 'Buscar jugador...',
      noResults: 'No se encontraron jugadores',
      selected: 'Compañero Seleccionado',
      invitation: 'Se enviará una invitación a tu compañero',
    },
    location: {
      title: 'Seleccionar Ubicación',
      search: 'Buscar cancha...',
      recent: 'Canchas Recientes',
      nearby: 'Canchas Cercanas',
      favorites: 'Favoritas',
      noResults: 'No se encontraron canchas',
    },
    datetime: {
      date: 'Fecha',
      time: 'Hora',
      duration: 'Duración',
      hours: 'horas',
      minutes: 'minutos',
    },
    confirmation: {
      title: 'Confirmar Evento',
      review: 'Revisa los detalles de tu evento',
      create: 'Crear Evento',
      update: 'Actualizar Evento',
    },
    alerts: {
      partnerRequired: 'Por favor selecciona un compañero para dobles',
      locationRequired: 'Por favor selecciona una ubicación',
      dateRequired: 'Por favor selecciona una fecha',
      timeRequired: 'Por favor selecciona una hora',
      success: '¡Evento creado exitosamente!',
      updateSuccess: '¡Evento actualizado exitosamente!',
      error: 'Error al crear evento',
      updateError: 'Error al actualizar evento',
    },
  },

  // Create Meetup (remaining)
  createMeetup: {
    courtDetails: {
      courtCount: 'Número de Canchas',
      courtCountHelper: 'Cuántas canchas se usarán',
      surfaceType: 'Tipo de Superficie',
      surfaces: {
        hard: 'Dura',
        clay: 'Arcilla',
        grass: 'Césped',
        indoor: 'Cubierta',
      },
    },
    recurring: {
      title: 'Evento Recurrente',
      enabled: 'Hacer recurrente',
      pattern: 'Patrón de Repetición',
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      until: 'Hasta',
      noEndDate: 'Sin fecha de fin',
    },
    participants: {
      maxParticipants: 'Máximo de Participantes',
      minParticipants: 'Mínimo de Participantes',
      waitlist: 'Habilitar Lista de Espera',
      autoApprove: 'Aprobación Automática',
    },
    success: {
      title: '¡Encuentro Creado!',
      message: 'Tu encuentro ha sido creado exitosamente.',
      viewMeetup: 'Ver Encuentro',
    },
  },

  // Direct Chat
  directChat: {
    title: 'Chat Directo',
    placeholder: 'Escribe un mensaje...',
    send: 'Enviar',
    noMessages: 'No hay mensajes aún',
    startConversation: 'Inicia la conversación',
    typing: 'escribiendo...',
    online: 'En línea',
    offline: 'Desconectado',
    lastSeen: 'Visto {{time}}',
  },

  // Dues Management (remaining)
  duesManagement: {
    settings: {
      title: 'Configuración de Cuotas',
      duesType: 'Tipo de Cuota',
      amount: 'Monto',
      currency: 'Moneda',
      dueDate: 'Fecha de Vencimiento',
      gracePeriod: 'Período de Gracia',
      lateFee: 'Cargo por Mora',
      autoReminder: 'Recordatorios Automáticos',
      reminderDays: 'Días antes del vencimiento',
    },
    member: {
      name: 'Nombre',
      email: 'Correo',
      status: 'Estado',
      lastPayment: 'Último Pago',
      nextDue: 'Próximo Vencimiento',
      balance: 'Saldo',
    },
    payment: {
      markAsPaid: 'Marcar como Pagado',
      markAsUnpaid: 'Marcar como Impago',
      recordPayment: 'Registrar Pago',
      paymentDate: 'Fecha de Pago',
      paymentMethod: 'Método de Pago',
      paymentNote: 'Nota',
      methods: {
        cash: 'Efectivo',
        check: 'Cheque',
        transfer: 'Transferencia',
        card: 'Tarjeta',
        venmo: 'Venmo',
        zelle: 'Zelle',
        other: 'Otro',
      },
    },
    export: {
      title: 'Exportar Datos',
      csv: 'Exportar CSV',
      pdf: 'Exportar PDF',
      dateRange: 'Rango de Fechas',
      allTime: 'Todo el Tiempo',
      thisMonth: 'Este Mes',
      thisQuarter: 'Este Trimestre',
      thisYear: 'Este Año',
      custom: 'Personalizado',
    },
  },

  // Email Login (remaining)
  emailLogin: {
    errors: {
      userNotFound: 'No se encontró usuario con este correo.',
      wrongPassword: 'Contraseña incorrecta.',
      tooManyRequests: 'Demasiados intentos. Por favor intenta más tarde.',
      networkError: 'Error de red. Por favor verifica tu conexión.',
      unknownError: 'Ocurrió un error desconocido.',
      emailAlreadyInUse: 'Este correo ya está en uso.',
      weakPassword: 'La contraseña es muy débil. Usa al menos 6 caracteres.',
      invalidCredential: 'Credenciales inválidas.',
    },
    passwordReset: {
      title: 'Restablecer Contraseña',
      description: 'Ingresa tu correo para recibir un enlace de restablecimiento.',
      email: 'Correo Electrónico',
      submit: 'Enviar Enlace',
      success: 'Enlace de restablecimiento enviado a tu correo.',
      backToLogin: 'Volver a Inicio de Sesión',
    },
  },

  // Event Card (remaining)
  eventCard: {
    weather: {
      clear: 'Despejado',
      cloudy: 'Nublado',
      rain: 'Lluvia',
      snow: 'Nieve',
      windy: 'Ventoso',
      hot: 'Caluroso',
      cold: 'Frío',
    },
    time: {
      today: 'Hoy',
      tomorrow: 'Mañana',
      thisWeek: 'Esta Semana',
      nextWeek: 'Próxima Semana',
    },
    actions: {
      viewDetails: 'Ver Detalles',
      join: 'Unirse',
      leave: 'Salir',
      edit: 'Editar',
      delete: 'Eliminar',
      share: 'Compartir',
      cancel: 'Cancelar',
    },
  },

  // Find Club Screen (remaining)
  findClubScreen: {
    search: {
      placeholder: 'Buscar clubes...',
      noResults: 'No se encontraron clubes',
      tryDifferent: 'Intenta con diferentes palabras clave',
    },
    filters: {
      all: 'Todos',
      nearby: 'Cercanos',
      popular: 'Populares',
      newest: 'Más Nuevos',
      distance: 'Distancia',
      memberCount: 'Cantidad de Miembros',
    },
    card: {
      members: '{{count}} miembros',
      distance: '{{distance}} mi',
      level: 'Nivel: {{level}}',
      joinButton: 'Unirse',
      viewButton: 'Ver',
      pendingButton: 'Pendiente',
    },
  },

  // Hosted Event Card (remaining)
  hostedEventCard: {
    status: {
      upcoming: 'Próximo',
      ongoing: 'En Curso',
      completed: 'Completado',
      cancelled: 'Cancelado',
    },
    participants: {
      count: '{{count}} participantes',
      full: 'Lleno',
      spotsLeft: '{{count}} lugares restantes',
    },
    actions: {
      manage: 'Gestionar',
      edit: 'Editar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      duplicate: 'Duplicar',
    },
  },

  // League Detail (remaining)
  leagueDetail: {
    management: {
      title: 'Gestión de Liga',
      generateBpaddle: 'Generar Bpaddle',
      regenerateBpaddle: 'Regenerar Bpaddle',
      deleteBpaddle: 'Eliminar Bpaddle',
      startLeague: 'Iniciar Liga',
      endLeague: 'Finalizar Liga',
      cancelLeague: 'Cancelar Liga',
      exportResults: 'Exportar Resultados',
    },
    participants: {
      title: 'Participantes',
      approved: 'Aprobados',
      pending: 'Pendientes',
      rejected: 'Rechazados',
      approve: 'Aprobar',
      reject: 'Rechazar',
      remove: 'Eliminar',
      noParticipants: 'Aún no hay participantes',
    },
    schedule: {
      title: 'Calendario',
      round: 'Ronda {{number}}',
      matchday: 'Jornada {{number}}',
      noSchedule: 'Aún no hay calendario',
      generateSchedule: 'Generar Calendario',
    },
    results: {
      title: 'Resultados',
      submitResult: 'Enviar Resultado',
      editResult: 'Editar Resultado',
      winner: 'Ganador',
      score: 'Puntuación',
      noResults: 'Aún no hay resultados',
    },
  },

  // Leagues (remaining)
  leagues: {
    list: {
      title: 'Ligas',
      empty: 'No hay ligas disponibles',
      create: 'Crear Liga',
    },
    filters: {
      all: 'Todas',
      open: 'Abiertas',
      inProgress: 'En Curso',
      completed: 'Completadas',
      myLeagues: 'Mis Ligas',
    },
    card: {
      participants: '{{count}}/{{max}} participantes',
      deadline: 'Fecha límite: {{date}}',
      status: 'Estado: {{status}}',
      apply: 'Aplicar',
      view: 'Ver',
    },
    create: {
      title: 'Crear Liga',
      name: 'Nombre de la Liga',
      description: 'Descripción',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      maxParticipants: 'Máximo de Participantes',
      entryFee: 'Cuota de Inscripción',
      format: 'Formato',
    },
  },

  // Map App Selector (remaining)
  mapAppSelector: {
    apps: {
      appleMaps: 'Apple Maps',
      googleMaps: 'Google Maps',
      waze: 'Waze',
      kakaoMap: 'Kakao Map',
      naverMap: 'Naver Map',
    },
  },

  // Match Detail (remaining)
  matchDetail: {
    title: 'Detalles del Partido',
    opponent: 'Oponente',
    date: 'Fecha',
    time: 'Hora',
    location: 'Ubicación',
    level: 'Nivel',
    type: 'Tipo',
    status: 'Estado',
    message: 'Mensaje',
    score: 'Puntuación',
    actions: {
      accept: 'Aceptar',
      decline: 'Rechazar',
      cancel: 'Cancelar',
      reschedule: 'Reprogramar',
      submitScore: 'Enviar Puntuación',
      chat: 'Chat',
    },
    statuses: {
      pending: 'Pendiente',
      accepted: 'Aceptado',
      declined: 'Rechazado',
      cancelled: 'Cancelado',
      completed: 'Completado',
      noShow: 'No Se Presentó',
    },
  },

  // Match Request (remaining)
  matchRequest: {
    title: 'Solicitud de Partido',
    subtitle: 'Envía una solicitud de partido',
    sending: 'Enviando...',
    success: {
      title: '¡Solicitud Enviada!',
      message: 'Tu solicitud de partido ha sido enviada.',
    },
    error: {
      title: 'Error',
      message: 'Error al enviar solicitud de partido.',
    },
  },

  // Matches (remaining)
  matches: {
    types: {
      singles: 'Singles',
      doubles: 'Dobles',
      mixed: 'Mixtos',
      practice: 'Práctica',
      tournament: 'Torneo',
      league: 'Liga',
    },
    status: {
      upcoming: 'Próximos',
      completed: 'Completados',
      cancelled: 'Cancelados',
      noShow: 'No Se Presentó',
    },
    actions: {
      find: 'Buscar Partido',
      create: 'Crear Partido',
      filter: 'Filtrar',
      refresh: 'Actualizar',
    },
    notifications: {
      newMatch: 'Nuevo partido disponible',
      matchAccepted: 'Tu partido ha sido aceptado',
      matchDeclined: 'Tu partido ha sido rechazado',
      matchCancelled: 'El partido ha sido cancelado',
      scoreSubmitted: 'La puntuación ha sido enviada',
    },
  },

  // Meetup Detail (remaining)
  meetupDetail: {
    participants: {
      title: 'Participantes',
      count: '{{count}} participantes',
      confirmed: 'Confirmados',
      pending: 'Pendientes',
      waitlist: 'Lista de Espera',
      host: 'Organizador',
      coHost: 'Co-organizador',
    },
    actions: {
      join: 'Unirse',
      leave: 'Salir',
      edit: 'Editar',
      cancel: 'Cancelar',
      share: 'Compartir',
      directions: 'Cómo Llegar',
      chat: 'Chat del Encuentro',
    },
    confirmation: {
      joinTitle: '¿Unirse al Encuentro?',
      joinMessage: '¿Quieres unirte a este encuentro?',
      leaveTitle: '¿Salir del Encuentro?',
      leaveMessage: '¿Estás seguro de que quieres salir de este encuentro?',
      cancelTitle: '¿Cancelar Encuentro?',
      cancelMessage: 'Esto notificará a todos los participantes.',
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

console.log('🇪🇸 Fixing Spanish translations (Batch 2)...\n');

// Merge translations
deepMerge(esContent, translations);

// Write back
fs.writeFileSync(esPath, JSON.stringify(esContent, null, 2) + '\n', 'utf8');

console.log('✅ Updated es.json with batch 2 translations');
console.log('\n🎉 Spanish translations batch 2 complete!');
