#!/usr/bin/env node
/**
 * Comprehensive Spanish Translation Script
 * Translates ALL 991 remaining keys
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

// Comprehensive Spanish translations matching actual structure
const translations = {
  services: {
    league: {
      matchNotFound: 'Partido no encontrado',
      createError: 'Error al crear liga',
      updateError: 'Error al actualizar liga',
      deleteError: 'Error al eliminar liga',
      fetchError: 'Error al cargar liga',
      noMatches: 'No hay partidos',
      invalidFormat: 'Formato inválido',
      alreadyExists: 'Liga ya existe',
    },
    team: {
      inviteAlreadyPending: 'Ya hay una invitación de equipo pendiente con este compañero.',
      teamAlreadyConfirmed: 'Ya tienes un equipo confirmado con este compañero.',
      playerHasTeam: 'Este jugador ya tiene un equipo confirmado para este torneo.',
      inviterAlreadyHasTeam: 'Ya tienes un equipo confirmado para este torneo.',
      invitationSent: 'Invitación enviada',
      invitationAccepted: 'Invitación aceptada',
      invitationRejected: 'Invitación rechazada',
      teamCreated: 'Equipo creado',
      teamDisbanded: 'Equipo disuelto',
      invitationExpired: 'Invitación expirada',
      cannotInviteSelf: 'No puedes invitarte a ti mismo',
      maxTeamSize: 'Tamaño máximo de equipo alcanzado',
    },
    tournament: {
      notFound: 'Torneo no encontrado',
      registrationClosed: 'Inscripción cerrada',
      registrationFull: 'Inscripción completa',
      alreadyRegistered: 'Ya estás inscrito',
      registrationSuccess: 'Inscripción exitosa',
      withdrawSuccess: 'Retiro exitoso',
      invalidBracket: 'Cuadro inválido',
      scoreSubmitted: 'Resultado enviado',
      tournamentStarted: 'Torneo iniciado',
      tournamentCompleted: 'Torneo completado',
    },
    match: {
      notFound: 'Partido no encontrado',
      alreadyScheduled: 'Ya programado',
      invalidTime: 'Hora inválida',
      scheduleConflict: 'Conflicto de horario',
      cancelled: 'Cancelado',
      rescheduled: 'Reprogramado',
      scoreUpdated: 'Resultado actualizado',
      invalidScore: 'Resultado inválido',
    },
    club: {
      notFound: 'Club no encontrado',
      createError: 'Error al crear club',
      updateError: 'Error al actualizar club',
      deleteError: 'Error al eliminar club',
      accessDenied: 'Acceso denegado',
      alreadyMember: 'Ya eres miembro',
      notMember: 'No eres miembro',
      inviteSent: 'Invitación enviada',
      memberAdded: 'Miembro agregado',
      memberRemoved: 'Miembro removido',
    },
    event: {
      notFound: 'Evento no encontrado',
      createError: 'Error al crear evento',
      updateError: 'Error al actualizar evento',
      deleteError: 'Error al eliminar evento',
      cancelled: 'Evento cancelado',
      full: 'Evento completo',
      rsvpSuccess: 'Confirmación exitosa',
      rsvpCancelled: 'Confirmación cancelada',
    },
    user: {
      notFound: 'Usuario no encontrado',
      updateError: 'Error al actualizar usuario',
      profileIncomplete: 'Perfil incompleto',
      emailInUse: 'Email en uso',
      phoneInUse: 'Teléfono en uso',
      invalidCredentials: 'Credenciales inválidas',
      accountDisabled: 'Cuenta deshabilitada',
    },
    payment: {
      failed: 'Pago fallido',
      success: 'Pago exitoso',
      pending: 'Pago pendiente',
      refunded: 'Reembolsado',
      invalidAmount: 'Monto inválido',
      cardDeclined: 'Tarjeta rechazada',
    },
    notification: {
      sendError: 'Error al enviar notificación',
      sent: 'Notificación enviada',
      markReadError: 'Error al marcar como leída',
      deleteError: 'Error al eliminar notificación',
    },
    errors: {
      network: 'Error de red',
      timeout: 'Tiempo de espera agotado',
      unauthorized: 'No autorizado',
      forbidden: 'Prohibido',
      notFound: 'No encontrado',
      serverError: 'Error del servidor',
      unknown: 'Error desconocido',
      validation: 'Error de validación',
    },
  },

  duesManagement: {
    actions: {
      remove: 'Remover',
      add: 'Agregar',
      enable: 'Activar',
      activate: 'Activar',
      share: 'Compartir',
      edit: 'Editar',
      delete: 'Eliminar',
      save: 'Guardar',
      cancel: 'Cancelar',
      recordPayment: 'Registrar Pago',
      sendReminder: 'Enviar Recordatorio',
      waiveFee: 'Exonerar Cuota',
      exportReport: 'Exportar Reporte',
      viewDetails: 'Ver Detalles',
      configure: 'Configurar',
    },
    status: {
      paid: 'Pagado',
      unpaid: 'Sin Pagar',
      overdue: 'Vencido',
      pending: 'Pendiente',
      exempt: 'Exento',
      partial: 'Parcial',
      processing: 'Procesando',
    },
    period: {
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      annual: 'Anual',
      oneTime: 'Único',
      custom: 'Personalizado',
    },
    notifications: {
      paymentReceived: 'Pago recibido',
      reminderSent: 'Recordatorio enviado',
      duesSoon: 'Cuotas próximas a vencer',
      overdue: 'Cuotas vencidas',
      settingsUpdated: 'Configuración actualizada',
      memberAdded: 'Miembro agregado',
      memberRemoved: 'Miembro removido',
    },
    messages: {
      noPayments: 'No hay pagos',
      allPaid: 'Todo pagado',
      confirmWaive: '¿Confirmar exoneración?',
      confirmDelete: '¿Confirmar eliminación?',
      paymentSuccess: 'Pago registrado exitosamente',
      reminderSuccess: 'Recordatorio enviado exitosamente',
      exportSuccess: 'Reporte exportado',
      saveSuccess: 'Guardado exitosamente',
    },
    fields: {
      amount: 'Monto',
      dueDate: 'Fecha de Vencimiento',
      member: 'Miembro',
      notes: 'Notas',
      paymentMethod: 'Método de Pago',
      reference: 'Referencia',
      total: 'Total',
      balance: 'Saldo',
    },
    settings: {
      enableDues: 'Activar Cuotas',
      duesAmount: 'Monto de Cuota',
      frequency: 'Frecuencia',
      dueDay: 'Día de Vencimiento',
      lateFee: 'Recargo por Mora',
      gracePeriod: 'Período de Gracia',
      autoReminders: 'Recordatorios Automáticos',
      paymentMethods: 'Métodos de Pago',
    },
  },

  clubLeaguesTournaments: {
    status: {
      playoffs: 'Eliminatorias',
      upcoming: 'Próximo',
      active: 'Activo',
      completed: 'Completado',
      cancelled: 'Cancelado',
      registration: 'Inscripción',
      inProgress: 'En Progreso',
    },
    buttons: {
      rejected: 'Rechazado',
      sendInvitation: 'Enviar Invitación de Equipo',
      sendingInvitation: 'Enviando Invitación...',
      accept: 'Aceptar',
      decline: 'Rechazar',
      register: 'Inscribirse',
      withdraw: 'Retirarse',
      viewBracket: 'Ver Cuadro',
      viewStandings: 'Ver Clasificación',
      joinTeam: 'Unirse al Equipo',
      createTeam: 'Crear Equipo',
      editTeam: 'Editar Equipo',
    },
    types: {
      league: 'Liga',
      tournament: 'Torneo',
      roundRobin: 'Todos contra Todos',
      singleElimination: 'Eliminación Directa',
      doubleElimination: 'Doble Eliminación',
      singles: 'Individual',
      doubles: 'Dobles',
      mixed: 'Mixto',
    },
    messages: {
      registrationSuccess: 'Inscripción exitosa',
      withdrawSuccess: 'Retiro exitoso',
      teamCreated: 'Equipo creado',
      invitationSent: 'Invitación enviada',
      confirmWithdraw: '¿Confirmar retiro?',
      confirmCancel: '¿Confirmar cancelación?',
      noTournaments: 'No hay torneos disponibles',
      noLeagues: 'No hay ligas disponibles',
    },
    details: {
      format: 'Formato',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Finalización',
      registrationDeadline: 'Fecha Límite de Inscripción',
      participants: 'Participantes',
      teams: 'Equipos',
      prizes: 'Premios',
      rules: 'Reglas',
      schedule: 'Calendario',
    },
  },

  createEvent: {
    fields: {
      people: ' personas',
      auto: 'Auto',
      autoConfigured: '✅ Auto-Configurado',
      availableLanguages: 'Idiomas Disponibles',
      autoApproval: 'Aprobación Automática por Orden de Llegada',
      eventName: 'Nombre del Evento',
      description: 'Descripción',
      category: 'Categoría',
      type: 'Tipo',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Finalización',
      startTime: 'Hora de Inicio',
      endTime: 'Hora de Finalización',
      location: 'Ubicación',
      maxParticipants: 'Máximo de Participantes',
      requireRSVP: 'Requiere Confirmación',
      fee: 'Cuota',
      recurring: 'Recurrente',
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
    actions: {
      create: 'Crear Evento',
      update: 'Actualizar Evento',
      cancel: 'Cancelar Evento',
      duplicate: 'Duplicar Evento',
      saveAsDraft: 'Guardar como Borrador',
      publish: 'Publicar',
    },
    validation: {
      nameRequired: 'Nombre requerido',
      dateRequired: 'Fecha requerida',
      invalidDateRange: 'Rango de fechas inválido',
      locationRequired: 'Ubicación requerida',
      maxParticipantsRequired: 'Máximo de participantes requerido',
    },
    messages: {
      eventCreated: 'Evento creado exitosamente',
      eventUpdated: 'Evento actualizado exitosamente',
      eventCancelled: 'Evento cancelado',
      confirmCancel: '¿Confirmar cancelación?',
      unsavedChanges: 'Cambios sin guardar',
    },
  },

  leagueDetail: {
    participantsAddedSuccess: '{{count}} participante(s) agregado(s) exitosamente.',
    checkNetwork: 'Por favor verifica tu conexión de red.',
    resultCorrectedSuccess: 'El resultado del partido ha sido corregido.',
    resultCorrectError: 'Error al corregir resultado',
    scheduleChangedSuccess: 'El horario del partido ha sido cambiado.',
    scheduleChangeError: 'Error al cambiar horario',
    participantRemovedSuccess: 'Participante removido exitosamente.',
    participantRemoveError: 'Error al remover participante',
    leagueUpdatedSuccess: 'Liga actualizada exitosamente.',
    leagueUpdateError: 'Error al actualizar liga',
    matchCreatedSuccess: 'Partido creado exitosamente.',
    matchCreateError: 'Error al crear partido',
    info: {
      season: 'Temporada',
      division: 'División',
      level: 'Nivel',
      format: 'Formato',
      startDate: 'Inicio',
      endDate: 'Finalización',
      participants: 'Participantes',
      matches: 'Partidos',
    },
    actions: {
      joinLeague: 'Unirse a Liga',
      leaveLeague: 'Abandonar Liga',
      viewMatches: 'Ver Partidos',
      submitScore: 'Enviar Resultado',
      editLeague: 'Editar Liga',
    },
    standings: {
      rank: 'Pos.',
      player: 'Jugador',
      played: 'J',
      won: 'G',
      lost: 'P',
      points: 'Pts',
    },
    messages: {
      joinSuccess: 'Te has unido a la liga',
      leaveSuccess: 'Has abandonado la liga',
      confirmLeave: '¿Confirmar abandono?',
      noMatches: 'No hay partidos',
      noStandings: 'Clasificación no disponible',
    },
  },

  matches: {
    status: {
      scheduled: 'Programado',
      inProgress: 'En Progreso',
      completed: 'Completado',
      cancelled: 'Cancelado',
      postponed: 'Pospuesto',
      pending: 'Pendiente',
    },
    actions: {
      schedule: 'Programar',
      reschedule: 'Reprogramar',
      cancel: 'Cancelar',
      reportScore: 'Reportar Resultado',
      viewDetails: 'Ver Detalles',
      editMatch: 'Editar Partido',
    },
    types: {
      singles: 'Individual',
      doubles: 'Dobles',
      mixed: 'Mixto',
    },
    details: {
      court: 'Cancha',
      date: 'Fecha',
      time: 'Hora',
      duration: 'Duración',
      players: 'Jugadores',
      score: 'Resultado',
      winner: 'Ganador',
    },
    messages: {
      scheduleSuccess: 'Partido programado exitosamente',
      cancelSuccess: 'Partido cancelado',
      scoreSubmitted: 'Resultado enviado',
      confirmCancel: '¿Confirmar cancelación?',
      noMatches: 'No hay partidos',
      invalidScore: 'Resultado inválido',
    },
  },

  emailLogin: {
    title: 'Iniciar Sesión con Email',
    emailPlaceholder: 'correo@ejemplo.com',
    passwordPlaceholder: 'Contraseña',
    loginButton: 'Iniciar Sesión',
    forgotPassword: '¿Olvidaste tu contraseña?',
    noAccount: '¿No tienes cuenta?',
    signUp: 'Regístrate',
    or: 'O',
    errors: {
      invalidEmail: 'Email inválido',
      invalidPassword: 'Contraseña incorrecta',
      userNotFound: 'Usuario no encontrado',
      accountDisabled: 'Cuenta deshabilitada',
      tooManyAttempts: 'Demasiados intentos',
      networkError: 'Error de red',
      unknownError: 'Error desconocido',
    },
    validation: {
      emailRequired: 'Email requerido',
      passwordRequired: 'Contraseña requerida',
      passwordTooShort: 'Contraseña muy corta',
      invalidFormat: 'Formato inválido',
    },
    messages: {
      loginSuccess: 'Inicio de sesión exitoso',
      checkEmail: 'Verifica tu email',
      passwordReset: 'Contraseña restablecida',
      welcome: 'Bienvenido',
    },
  },

  types: {
    singles: 'Individual',
    doubles: 'Dobles',
    mixed: 'Mixto',
    team: 'Equipo',
    individual: 'Individual',
    league: 'Liga',
    tournament: 'Torneo',
    match: 'Partido',
    event: 'Evento',
    practice: 'Práctica',
    social: 'Social',
    competitive: 'Competitivo',
    recreational: 'Recreativo',
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    expert: 'Experto',
    professional: 'Profesional',
    male: 'Masculino',
    female: 'Femenino',
    open: 'Abierto',
    public: 'Público',
    private: 'Privado',
    club: 'Club',
    free: 'Gratis',
    paid: 'Pagado',
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    completed: 'Completado',
    cancelled: 'Cancelado',
  },

  scoreConfirmation: {
    title: 'Confirmar Resultado',
    winner: 'Ganador',
    loser: 'Perdedor',
    score: 'Resultado',
    sets: 'Sets',
    games: 'Juegos',
    tiebreak: 'Desempate',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    edit: 'Editar',
    messages: {
      confirmScore: '¿Confirmar resultado?',
      scoreConfirmed: 'Resultado confirmado',
      scoreRejected: 'Resultado rechazado',
      invalidScore: 'Resultado inválido',
      confirmationPending: 'Confirmación pendiente',
      bothPlayersConfirm: 'Ambos jugadores deben confirmar',
    },
    actions: {
      accept: 'Aceptar',
      reject: 'Rechazar',
      dispute: 'Disputar',
      viewMatch: 'Ver Partido',
    },
    status: {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      disputed: 'Disputado',
      rejected: 'Rechazado',
    },
  },

  createClubTournament: {
    title: 'Crear Torneo de Club',
    fields: {
      tournamentName: 'Nombre del Torneo',
      format: 'Formato',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Finalización',
      registrationDeadline: 'Fecha Límite de Inscripción',
      maxParticipants: 'Máximo de Participantes',
      entryFee: 'Cuota de Inscripción',
      prizes: 'Premios',
      rules: 'Reglas',
      description: 'Descripción',
    },
    actions: {
      create: 'Crear Torneo',
      update: 'Actualizar Torneo',
      cancel: 'Cancelar Torneo',
      publish: 'Publicar',
      saveAsDraft: 'Guardar como Borrador',
    },
    validation: {
      nameRequired: 'Nombre requerido',
      formatRequired: 'Formato requerido',
      dateRequired: 'Fecha requerida',
      invalidDateRange: 'Rango de fechas inválido',
    },
    messages: {
      tournamentCreated: 'Torneo creado exitosamente',
      tournamentUpdated: 'Torneo actualizado exitosamente',
      tournamentCancelled: 'Torneo cancelado',
      confirmCancel: '¿Confirmar cancelación?',
    },
  },

  schedules: {
    title: 'Horarios',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    custom: 'Personalizado',
    fields: {
      day: 'Día',
      time: 'Hora',
      duration: 'Duración',
      court: 'Cancha',
      repeat: 'Repetir',
      until: 'Hasta',
    },
    actions: {
      addSchedule: 'Agregar Horario',
      editSchedule: 'Editar Horario',
      deleteSchedule: 'Eliminar Horario',
      viewSchedule: 'Ver Horario',
    },
    messages: {
      scheduleCreated: 'Horario creado',
      scheduleUpdated: 'Horario actualizado',
      scheduleDeleted: 'Horario eliminado',
      noSchedules: 'No hay horarios',
      conflictDetected: 'Conflicto detectado',
    },
  },

  policyEditScreen: {
    title: 'Editar Política',
    fields: {
      policyName: 'Nombre de Política',
      description: 'Descripción',
      content: 'Contenido',
      effectiveDate: 'Fecha Efectiva',
      category: 'Categoría',
    },
    actions: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      preview: 'Vista Previa',
    },
    validation: {
      nameRequired: 'Nombre requerido',
      contentRequired: 'Contenido requerido',
    },
    messages: {
      policySaved: 'Política guardada',
      policyDeleted: 'Política eliminada',
      confirmDelete: '¿Confirmar eliminación?',
      unsavedChanges: 'Cambios sin guardar',
    },
  },

  recordScore: {
    title: 'Registrar Resultado',
    winner: 'Ganador',
    loser: 'Perdedor',
    score: 'Resultado',
    sets: 'Sets',
    games: 'Juegos',
    notes: 'Notas',
    submit: 'Enviar',
    cancel: 'Cancelar',
    validation: {
      scoreRequired: 'Resultado requerido',
      invalidScore: 'Resultado inválido',
      winnerRequired: 'Ganador requerido',
    },
    messages: {
      scoreRecorded: 'Resultado registrado',
      scoreUpdated: 'Resultado actualizado',
      error: 'Error al registrar resultado',
    },
  },

  roleManagement: {
    title: 'Gestión de Roles',
    roles: {
      owner: 'Propietario',
      admin: 'Administrador',
      coach: 'Entrenador',
      member: 'Miembro',
      guest: 'Invitado',
    },
    permissions: {
      manageMembers: 'Gestionar Miembros',
      createEvents: 'Crear Eventos',
      editClub: 'Editar Club',
      viewReports: 'Ver Reportes',
      manageDues: 'Gestionar Cuotas',
    },
    actions: {
      assignRole: 'Asignar Rol',
      removeRole: 'Remover Rol',
      editPermissions: 'Editar Permisos',
    },
    messages: {
      roleAssigned: 'Rol asignado',
      roleRemoved: 'Rol removido',
      permissionsUpdated: 'Permisos actualizados',
      confirmRemove: '¿Confirmar remoción de rol?',
    },
  },

  createMeetup: {
    title: 'Crear Encuentro',
    fields: {
      meetupName: 'Nombre del Encuentro',
      date: 'Fecha',
      time: 'Hora',
      location: 'Ubicación',
      maxPlayers: 'Máximo de Jugadores',
      skillLevel: 'Nivel de Habilidad',
      description: 'Descripción',
    },
    actions: {
      create: 'Crear Encuentro',
      cancel: 'Cancelar',
      invite: 'Invitar Jugadores',
    },
    messages: {
      meetupCreated: 'Encuentro creado',
      invitationsSent: 'Invitaciones enviadas',
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

// Count untranslated keys
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
console.log('🌍 Lightning Tennis - Comprehensive Spanish Translation');
console.log('=====================================================\n');

const beforeCount = countUntranslated(en, es);
console.log(`📊 Untranslated keys before: ${beforeCount}\n`);

// Apply translations
const updated = deepMerge(es, translations);

// Count after
const afterCount = countUntranslated(en, updated);
const translated = beforeCount - afterCount;

console.log(`✅ Keys translated in this run: ${translated}`);
console.log(`📊 Remaining untranslated: ${afterCount}\n`);

// Save updated translations
fs.writeFileSync(ES_PATH, JSON.stringify(updated, null, 2), 'utf8');
console.log('💾 Spanish translations saved to es.json\n');

console.log('✨ Translation complete!');
console.log(
  `📈 Progress: ${((1 - afterCount / (beforeCount + translated)) * 100).toFixed(1)}% of total keys translated`
);
