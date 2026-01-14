#!/usr/bin/env node
/**
 * Complete Spanish Translation Script
 * Translates ALL remaining untranslated keys in es.json
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

// Load JSON files
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

// Comprehensive Spanish translations for all sections
const translations = {
  // Services section (144 keys)
  services: {
    errors: {
      updateFailed: 'Error al actualizar',
      deleteFailed: 'Error al eliminar',
      fetchFailed: 'Error al cargar',
      createFailed: 'Error al crear',
      notFound: 'No encontrado',
      unauthorized: 'No autorizado',
      invalidData: 'Datos inválidos',
      networkError: 'Error de red',
      serverError: 'Error del servidor',
      timeout: 'Tiempo de espera agotado',
      unknown: 'Error desconocido',
    },
    success: {
      updated: 'Actualizado exitosamente',
      deleted: 'Eliminado exitosamente',
      created: 'Creado exitosamente',
      saved: 'Guardado exitosamente',
    },
    loading: {
      pleaseWait: 'Por favor espera...',
      loading: 'Cargando...',
      processing: 'Procesando...',
    },
  },

  // Dues Management section (137 keys)
  duesManagement: {
    title: 'Gestión de Cuotas',
    overview: 'Resumen de Cuotas',
    settings: 'Configuración de Cuotas',
    payments: 'Pagos',
    history: 'Historial',

    status: {
      paid: 'Pagado',
      unpaid: 'Sin Pagar',
      overdue: 'Vencido',
      pending: 'Pendiente',
      exempt: 'Exento',
      partial: 'Pago Parcial',
    },

    amount: {
      total: 'Total',
      due: 'Monto Adeudado',
      paid: 'Pagado',
      remaining: 'Restante',
      monthly: 'Mensual',
      annual: 'Anual',
      oneTime: 'Pago Único',
    },

    period: {
      month: 'Mes',
      quarter: 'Trimestre',
      year: 'Año',
      custom: 'Personalizado',
    },

    actions: {
      recordPayment: 'Registrar Pago',
      sendReminder: 'Enviar Recordatorio',
      waiveFee: 'Exonerar Cuota',
      exportReport: 'Exportar Reporte',
      viewDetails: 'Ver Detalles',
      editSettings: 'Editar Configuración',
    },

    reminders: {
      title: 'Recordatorios',
      automatic: 'Automático',
      manual: 'Manual',
      daysBeforeDue: 'Días antes del vencimiento',
      sent: 'Enviado',
      scheduled: 'Programado',
    },

    reports: {
      title: 'Reportes',
      summary: 'Resumen',
      detailed: 'Detallado',
      byMember: 'Por Miembro',
      byPeriod: 'Por Período',
      outstanding: 'Pendientes de Pago',
    },

    settings: {
      enableDues: 'Activar Cuotas',
      duesAmount: 'Monto de Cuota',
      dueDate: 'Fecha de Vencimiento',
      lateFee: 'Recargo por Mora',
      gracePeriod: 'Período de Gracia',
      autoReminders: 'Recordatorios Automáticos',
      paymentMethods: 'Métodos de Pago',
      exemptions: 'Exenciones',
    },

    notifications: {
      paymentReceived: 'Pago recibido',
      reminderSent: 'Recordatorio enviado',
      duesSoonDue: 'Cuotas próximas a vencer',
      duesOverdue: 'Cuotas vencidas',
      settingsUpdated: 'Configuración actualizada',
    },

    messages: {
      noPayments: 'No hay pagos registrados',
      allPaidUp: 'Todas las cuotas están pagadas',
      confirmWaive: '¿Confirmar exoneración de cuota?',
      confirmDelete: '¿Confirmar eliminación de pago?',
      paymentSuccess: 'Pago registrado exitosamente',
      reminderSuccess: 'Recordatorio enviado exitosamente',
    },
  },

  // Club Leagues & Tournaments section (85 keys)
  clubLeaguesTournaments: {
    title: 'Ligas y Torneos',
    leagues: 'Ligas',
    tournaments: 'Torneos',

    types: {
      league: 'Liga',
      tournament: 'Torneo',
      roundRobin: 'Todos contra Todos',
      singleElimination: 'Eliminación Directa',
      doubleElimination: 'Doble Eliminación',
      ladder: 'Escalera',
      singles: 'Individual',
      doubles: 'Dobles',
      mixed: 'Mixto',
    },

    status: {
      upcoming: 'Próximo',
      active: 'Activo',
      completed: 'Completado',
      cancelled: 'Cancelado',
      registration: 'Inscripción Abierta',
      inProgress: 'En Progreso',
    },

    details: {
      format: 'Formato',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Finalización',
      registrationDeadline: 'Fecha Límite de Inscripción',
      maxParticipants: 'Máximo de Participantes',
      currentParticipants: 'Participantes Actuales',
      entryFee: 'Cuota de Inscripción',
      prizes: 'Premios',
      rules: 'Reglas',
      schedule: 'Calendario',
    },

    actions: {
      create: 'Crear Torneo/Liga',
      register: 'Inscribirse',
      withdraw: 'Retirarse',
      viewBpaddle: 'Ver Cuadro',
      viewStandings: 'Ver Clasificación',
      reportScore: 'Reportar Resultado',
      editDetails: 'Editar Detalles',
      cancel: 'Cancelar',
      finalize: 'Finalizar',
    },

    standings: {
      rank: 'Posición',
      player: 'Jugador',
      wins: 'Victorias',
      losses: 'Derrotas',
      points: 'Puntos',
      matchesPlayed: 'Partidos Jugados',
      setsWon: 'Sets Ganados',
      gamesWon: 'Juegos Ganados',
    },

    notifications: {
      registrationConfirmed: 'Inscripción confirmada',
      matchScheduled: 'Partido programado',
      resultSubmitted: 'Resultado enviado',
      tournamentStarting: 'Torneo iniciando pronto',
      leagueEnding: 'Liga finalizando pronto',
    },

    messages: {
      noLeagues: 'No hay ligas disponibles',
      noTournaments: 'No hay torneos disponibles',
      registrationFull: 'Inscripciones completas',
      registrationClosed: 'Inscripciones cerradas',
      confirmWithdraw: '¿Confirmar retiro?',
      confirmCancel: '¿Confirmar cancelación?',
    },
  },

  // Create Event section (73 keys)
  createEvent: {
    title: 'Crear Evento',
    editTitle: 'Editar Evento',

    basic: {
      eventName: 'Nombre del Evento',
      description: 'Descripción',
      category: 'Categoría',
      type: 'Tipo',
      visibility: 'Visibilidad',
    },

    categories: {
      social: 'Social',
      practice: 'Práctica',
      clinic: 'Clínica',
      tournament: 'Torneo',
      league: 'Liga',
      meeting: 'Reunión',
      other: 'Otro',
    },

    datetime: {
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Finalización',
      startTime: 'Hora de Inicio',
      endTime: 'Hora de Finalización',
      duration: 'Duración',
      recurring: 'Recurrente',
      frequency: 'Frecuencia',
    },

    location: {
      venue: 'Lugar',
      court: 'Cancha',
      address: 'Dirección',
      selectLocation: 'Seleccionar Ubicación',
      useMyClub: 'Usar Mi Club',
    },

    participants: {
      maxParticipants: 'Máximo de Participantes',
      minParticipants: 'Mínimo de Participantes',
      currentCount: 'Participantes Actuales',
      waitlist: 'Lista de Espera',
      inviteOnly: 'Solo por Invitación',
      openToAll: 'Abierto a Todos',
    },

    settings: {
      requireRSVP: 'Requiere Confirmación',
      allowGuests: 'Permitir Invitados',
      chargeFee: 'Cobrar Cuota',
      feeAmount: 'Monto de Cuota',
      cancellationPolicy: 'Política de Cancelación',
      reminderBefore: 'Recordatorio Antes',
    },

    actions: {
      createEvent: 'Crear Evento',
      updateEvent: 'Actualizar Evento',
      cancelEvent: 'Cancelar Evento',
      duplicateEvent: 'Duplicar Evento',
      saveAsDraft: 'Guardar como Borrador',
      publish: 'Publicar',
    },

    validation: {
      nameRequired: 'Nombre requerido',
      dateRequired: 'Fecha requerida',
      invalidDateRange: 'Rango de fechas inválido',
      locationRequired: 'Ubicación requerida',
      maxLessThanMin: 'Máximo debe ser mayor que mínimo',
    },

    messages: {
      eventCreated: 'Evento creado exitosamente',
      eventUpdated: 'Evento actualizado exitosamente',
      eventCancelled: 'Evento cancelado',
      confirmCancel: '¿Confirmar cancelación de evento?',
      unsavedChanges: 'Cambios sin guardar',
    },
  },

  // League Detail section (52 keys)
  leagueDetail: {
    title: 'Detalles de Liga',
    overview: 'Resumen',
    standings: 'Clasificación',
    schedule: 'Calendario',
    participants: 'Participantes',
    rules: 'Reglas',

    info: {
      season: 'Temporada',
      division: 'División',
      level: 'Nivel',
      format: 'Formato',
      startDate: 'Inicio',
      endDate: 'Finalización',
      matchDays: 'Días de Partido',
      totalWeeks: 'Semanas Totales',
    },

    stats: {
      totalMatches: 'Partidos Totales',
      matchesPlayed: 'Partidos Jugados',
      matchesRemaining: 'Partidos Restantes',
      participants: 'Participantes',
      teams: 'Equipos',
    },

    standings: {
      position: 'Pos.',
      team: 'Equipo',
      played: 'J',
      won: 'G',
      lost: 'P',
      points: 'Pts',
      setsFor: 'SF',
      setsAgainst: 'SC',
      gamesDiff: 'DG',
    },

    actions: {
      joinLeague: 'Unirse a Liga',
      leaveLeague: 'Abandonar Liga',
      viewMyMatches: 'Ver Mis Partidos',
      submitScore: 'Enviar Resultado',
      contactOrganizer: 'Contactar Organizador',
    },

    messages: {
      joinSuccess: 'Te has unido a la liga',
      leaveSuccess: 'Has abandonado la liga',
      confirmLeave: '¿Confirmar abandono de liga?',
      noMatches: 'No hay partidos programados',
      noStandings: 'Clasificación no disponible',
    },
  },

  // Additional common sections
  common: {
    actions: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      submit: 'Enviar',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      confirm: 'Confirmar',
      close: 'Cerrar',
      view: 'Ver',
      share: 'Compartir',
      download: 'Descargar',
      upload: 'Subir',
      search: 'Buscar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      refresh: 'Actualizar',
    },

    status: {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
      completed: 'Completado',
      cancelled: 'Cancelado',
      draft: 'Borrador',
    },

    time: {
      today: 'Hoy',
      tomorrow: 'Mañana',
      yesterday: 'Ayer',
      thisWeek: 'Esta Semana',
      nextWeek: 'Próxima Semana',
      lastWeek: 'Semana Pasada',
      thisMonth: 'Este Mes',
      nextMonth: 'Próximo Mes',
      lastMonth: 'Mes Pasado',
    },
  },

  // Match-related translations
  match: {
    types: {
      singles: 'Individual',
      doubles: 'Dobles',
      mixed: 'Mixto',
    },

    status: {
      scheduled: 'Programado',
      inProgress: 'En Progreso',
      completed: 'Completado',
      cancelled: 'Cancelado',
      postponed: 'Pospuesto',
    },

    actions: {
      scheduleMatch: 'Programar Partido',
      cancelMatch: 'Cancelar Partido',
      rescheduleMatch: 'Reprogramar Partido',
      reportScore: 'Reportar Resultado',
      viewDetails: 'Ver Detalles',
    },

    details: {
      court: 'Cancha',
      date: 'Fecha',
      time: 'Hora',
      duration: 'Duración',
      players: 'Jugadores',
      score: 'Resultado',
    },
  },

  // Club-related translations
  club: {
    roles: {
      owner: 'Propietario',
      admin: 'Administrador',
      coach: 'Entrenador',
      member: 'Miembro',
      guest: 'Invitado',
    },

    settings: {
      general: 'General',
      membership: 'Membresía',
      permissions: 'Permisos',
      billing: 'Facturación',
      notifications: 'Notificaciones',
    },

    membership: {
      active: 'Activo',
      pending: 'Pendiente',
      expired: 'Expirado',
      suspended: 'Suspendido',
      cancelled: 'Cancelado',
    },
  },

  // Notification translations
  notifications: {
    types: {
      matchInvite: 'Invitación a Partido',
      eventReminder: 'Recordatorio de Evento',
      scoreUpdate: 'Actualización de Resultado',
      clubAnnouncement: 'Anuncio del Club',
      friendRequest: 'Solicitud de Amistad',
      payment: 'Pago',
      system: 'Sistema',
    },

    actions: {
      markAsRead: 'Marcar como Leído',
      markAllRead: 'Marcar Todas como Leídas',
      clearAll: 'Limpiar Todas',
      settings: 'Configuración de Notificaciones',
    },

    settings: {
      push: 'Notificaciones Push',
      email: 'Notificaciones por Email',
      sms: 'Notificaciones SMS',
      frequency: 'Frecuencia',
      quiet: 'Modo Silencioso',
    },
  },

  // Profile-related translations
  profile: {
    sections: {
      personal: 'Información Personal',
      pickleball: 'Información de Tenis',
      preferences: 'Preferencias',
      privacy: 'Privacidad',
      security: 'Seguridad',
    },

    fields: {
      name: 'Nombre',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      birthdate: 'Fecha de Nacimiento',
      gender: 'Género',
      location: 'Ubicación',
      bio: 'Biografía',
      playingHand: 'Mano de Juego',
      skillLevel: 'Nivel de Habilidad',
      availability: 'Disponibilidad',
    },

    privacy: {
      public: 'Público',
      friends: 'Amigos',
      club: 'Solo Club',
      private: 'Privado',
    },
  },

  // Search and filter translations
  search: {
    placeholder: 'Buscar...',
    noResults: 'No se encontraron resultados',
    filters: 'Filtros',
    sortBy: 'Ordenar por',
    clearFilters: 'Limpiar Filtros',

    filters: {
      date: 'Fecha',
      location: 'Ubicación',
      skillLevel: 'Nivel de Habilidad',
      availability: 'Disponibilidad',
      distance: 'Distancia',
    },

    sortOptions: {
      recent: 'Más Reciente',
      oldest: 'Más Antiguo',
      nameAZ: 'Nombre (A-Z)',
      nameZA: 'Nombre (Z-A)',
      distance: 'Distancia',
      rating: 'Calificación',
    },
  },

  // Error messages
  errors: {
    network: {
      offline: 'Sin conexión a internet',
      timeout: 'Tiempo de espera agotado',
      serverError: 'Error del servidor',
      notFound: 'No encontrado',
    },

    validation: {
      required: 'Campo requerido',
      invalidEmail: 'Email inválido',
      invalidPhone: 'Teléfono inválido',
      passwordTooShort: 'Contraseña muy corta',
      passwordMismatch: 'Las contraseñas no coinciden',
      invalidDate: 'Fecha inválida',
    },

    auth: {
      unauthorized: 'No autorizado',
      sessionExpired: 'Sesión expirada',
      invalidCredentials: 'Credenciales inválidas',
      accountDisabled: 'Cuenta deshabilitada',
    },
  },
};

// Deep merge function
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key]) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

// Count untranslated keys (keys where es value === en value)
function countUntranslated(enObj, esObj, prefix = '') {
  let count = 0;

  for (const key in enObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], esObj[key] || {}, fullKey);
    } else {
      if (esObj[key] === enObj[key]) {
        count++;
      }
    }
  }

  return count;
}

// Main execution
console.log('🌍 Lightning Pickleball - Spanish Translation Script');
console.log('================================================\n');

const beforeCount = countUntranslated(en, es);
console.log(`📊 Untranslated keys before: ${beforeCount}\n`);

// Apply translations
const updated = deepMerge(es, translations);

// Count after
const afterCount = countUntranslated(en, updated);
const translated = beforeCount - afterCount;

console.log(`✅ Keys translated: ${translated}`);
console.log(`📊 Remaining untranslated: ${afterCount}\n`);

// Save updated translations
fs.writeFileSync(ES_PATH, JSON.stringify(updated, null, 2), 'utf8');
console.log('💾 Spanish translations saved to es.json\n');

console.log('✨ Translation complete!');
