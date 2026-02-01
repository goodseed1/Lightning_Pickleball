const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Batch 4: Remaining large sections
const translations = {
  // Services (158 keys)
  services: {
    // Auth service
    auth: {
      loginSuccess: 'Sesión iniciada exitosamente',
      loginFailed: 'Error al iniciar sesión',
      logoutSuccess: 'Sesión cerrada',
      signupSuccess: 'Registro exitoso',
      signupFailed: 'Error al registrarse',
      passwordResetSent: 'Enlace de restablecimiento enviado',
      passwordResetFailed: 'Error al restablecer contraseña',
      emailVerified: 'Correo verificado',
      emailNotVerified: 'Correo no verificado',
      tokenExpired: 'Sesión expirada',
      unauthorized: 'No autorizado',
    },
    // Club service
    club: {
      createSuccess: 'Club creado exitosamente',
      createFailed: 'Error al crear club',
      updateSuccess: 'Club actualizado',
      updateFailed: 'Error al actualizar club',
      deleteSuccess: 'Club eliminado',
      deleteFailed: 'Error al eliminar club',
      joinSuccess: 'Solicitud enviada',
      joinFailed: 'Error al solicitar membresía',
      leaveSuccess: 'Has salido del club',
      leaveFailed: 'Error al salir del club',
      memberApproved: 'Miembro aprobado',
      memberRejected: 'Miembro rechazado',
      memberRemoved: 'Miembro eliminado',
      roleUpdated: 'Rol actualizado',
    },
    // Match service
    match: {
      createSuccess: 'Partido creado',
      createFailed: 'Error al crear partido',
      updateSuccess: 'Partido actualizado',
      updateFailed: 'Error al actualizar partido',
      deleteSuccess: 'Partido eliminado',
      deleteFailed: 'Error al eliminar partido',
      requestSent: 'Solicitud enviada',
      requestFailed: 'Error al enviar solicitud',
      requestAccepted: 'Solicitud aceptada',
      requestDeclined: 'Solicitud rechazada',
      scoreSubmitted: 'Puntuación enviada',
      scoreFailed: 'Error al enviar puntuación',
    },
    // Event service
    event: {
      createSuccess: 'Evento creado',
      createFailed: 'Error al crear evento',
      updateSuccess: 'Evento actualizado',
      updateFailed: 'Error al actualizar evento',
      deleteSuccess: 'Evento eliminado',
      deleteFailed: 'Error al eliminar evento',
      joinSuccess: 'Te has unido al evento',
      joinFailed: 'Error al unirse al evento',
      leaveSuccess: 'Has salido del evento',
      leaveFailed: 'Error al salir del evento',
    },
    // Meetup service
    meetup: {
      createSuccess: 'Encuentro creado',
      createFailed: 'Error al crear encuentro',
      updateSuccess: 'Encuentro actualizado',
      updateFailed: 'Error al actualizar encuentro',
      deleteSuccess: 'Encuentro eliminado',
      deleteFailed: 'Error al eliminar encuentro',
      joinSuccess: 'Te has unido',
      joinFailed: 'Error al unirse',
      leaveSuccess: 'Has salido',
      leaveFailed: 'Error al salir',
    },
    // League service
    league: {
      createSuccess: 'Liga creada',
      createFailed: 'Error al crear liga',
      updateSuccess: 'Liga actualizada',
      updateFailed: 'Error al actualizar liga',
      deleteSuccess: 'Liga eliminada',
      deleteFailed: 'Error al eliminar liga',
      applySuccess: 'Aplicación enviada',
      applyFailed: 'Error al aplicar',
      withdrawSuccess: 'Te has retirado',
      withdrawFailed: 'Error al retirarse',
      bpaddleGenerated: 'Bracket generado',
      bpaddleFailed: 'Error al generar bpaddle',
    },
    // Tournament service
    tournament: {
      createSuccess: 'Torneo creado',
      createFailed: 'Error al crear torneo',
      updateSuccess: 'Torneo actualizado',
      updateFailed: 'Error al actualizar torneo',
      deleteSuccess: 'Torneo eliminado',
      deleteFailed: 'Error al eliminar torneo',
      registerSuccess: 'Inscripción exitosa',
      registerFailed: 'Error al inscribirse',
      withdrawSuccess: 'Te has retirado',
      withdrawFailed: 'Error al retirarse',
    },
    // Notification service
    notification: {
      sent: 'Notificación enviada',
      failed: 'Error al enviar notificación',
      enabled: 'Notificaciones habilitadas',
      disabled: 'Notificaciones deshabilitadas',
      permissionDenied: 'Permiso de notificaciones denegado',
    },
    // Location service
    location: {
      permissionDenied: 'Permiso de ubicación denegado',
      unavailable: 'Ubicación no disponible',
      timeout: 'Tiempo agotado al obtener ubicación',
      error: 'Error de ubicación',
    },
    // Storage service
    storage: {
      uploadSuccess: 'Archivo subido',
      uploadFailed: 'Error al subir archivo',
      downloadFailed: 'Error al descargar archivo',
      deleteFailed: 'Error al eliminar archivo',
    },
    // Common service errors
    errors: {
      networkError: 'Error de conexión',
      serverError: 'Error del servidor',
      timeout: 'Tiempo agotado',
      unauthorized: 'No autorizado',
      forbidden: 'Acceso denegado',
      notFound: 'No encontrado',
      conflict: 'Conflicto',
      validation: 'Error de validación',
      unknown: 'Error desconocido',
      retry: 'Por favor intenta de nuevo',
    },
  },

  // Types (75 keys)
  types: {
    // Match types
    match: {
      singles: 'Singles',
      doubles: 'Dobles',
      mixed: 'Mixtos',
      practice: 'Práctica',
      ranked: 'Clasificatorio',
      friendly: 'Amistoso',
    },
    // Event types
    event: {
      match: 'Partido',
      meetup: 'Encuentro',
      tournament: 'Torneo',
      league: 'Liga',
      practice: 'Práctica',
      social: 'Social',
      training: 'Entrenamiento',
    },
    // Club types
    club: {
      competitive: 'Competitivo',
      casual: 'Casual',
      social: 'Social',
      mixed: 'Mixto',
      private: 'Privado',
      public: 'Público',
    },
    // Member roles
    role: {
      owner: 'Dueño',
      admin: 'Administrador',
      manager: 'Gerente',
      member: 'Miembro',
      guest: 'Invitado',
    },
    // Status types
    status: {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      active: 'Activo',
      inactive: 'Inactivo',
      cancelled: 'Cancelado',
      completed: 'Completado',
      inProgress: 'En Progreso',
      upcoming: 'Próximo',
      expired: 'Expirado',
    },
    // Gender types
    gender: {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Otro',
      mixed: 'Mixto',
      any: 'Cualquiera',
    },
    // Surface types
    surface: {
      hard: 'Dura',
      clay: 'Arcilla',
      grass: 'Césped',
      indoor: 'Cubierta',
      synthetic: 'Sintética',
    },
    // Skill levels
    skill: {
      beginner: 'Principiante',
      elementary: 'Elemental',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
      professional: 'Profesional',
    },
    // Days of week
    days: {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
    },
    // Time periods
    time: {
      morning: 'Mañana',
      afternoon: 'Tarde',
      evening: 'Noche',
      allDay: 'Todo el Día',
    },
  },

  // Profile Settings (55 keys)
  profileSettings: {
    title: 'Configuración del Perfil',
    sections: {
      account: 'Cuenta',
      profile: 'Perfil',
      notifications: 'Notificaciones',
      privacy: 'Privacidad',
      preferences: 'Preferencias',
    },
    account: {
      email: 'Correo Electrónico',
      password: 'Contraseña',
      changePassword: 'Cambiar Contraseña',
      deleteAccount: 'Eliminar Cuenta',
      logout: 'Cerrar Sesión',
    },
    profile: {
      displayName: 'Nombre',
      nickname: 'Apodo',
      bio: 'Biografía',
      location: 'Ubicación',
      gender: 'Género',
      birthDate: 'Fecha de Nacimiento',
      skillLevel: 'Nivel de Habilidad',
      playStyle: 'Estilo de Juego',
      availability: 'Disponibilidad',
      photo: 'Foto de Perfil',
      changePhoto: 'Cambiar Foto',
    },
    notifications: {
      push: 'Notificaciones Push',
      email: 'Notificaciones por Correo',
      matchRequests: 'Solicitudes de Partido',
      clubUpdates: 'Actualizaciones del Club',
      eventReminders: 'Recordatorios de Eventos',
      chatMessages: 'Mensajes de Chat',
      marketingEmails: 'Correos de Marketing',
    },
    privacy: {
      profileVisibility: 'Visibilidad del Perfil',
      showLocation: 'Mostrar Ubicación',
      showSkillLevel: 'Mostrar Nivel',
      showStats: 'Mostrar Estadísticas',
      allowMessages: 'Permitir Mensajes',
      allowMatchRequests: 'Permitir Solicitudes',
    },
    preferences: {
      language: 'Idioma',
      theme: 'Tema',
      distanceUnit: 'Unidad de Distancia',
      dateFormat: 'Formato de Fecha',
      timeFormat: 'Formato de Hora',
    },
    buttons: {
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      done: 'Hecho',
    },
    alerts: {
      saved: 'Cambios guardados',
      saveFailed: 'Error al guardar',
      confirmLogout: '¿Cerrar sesión?',
      confirmDelete: '¿Eliminar cuenta? Esta acción no se puede deshacer.',
    },
  },

  // Schedule Meetup (36 keys)
  scheduleMeetup: {
    title: 'Programar Encuentro',
    header: {
      create: 'Nuevo Encuentro',
      edit: 'Editar Encuentro',
    },
    fields: {
      title: 'Título',
      titlePlaceholder: 'ej., Práctica de Sábado',
      date: 'Fecha',
      time: 'Hora de Inicio',
      endTime: 'Hora de Fin',
      duration: 'Duración',
      location: 'Ubicación',
      courts: 'Número de Canchas',
      maxParticipants: 'Máximo de Participantes',
      description: 'Descripción',
      descriptionPlaceholder: 'Describe el encuentro...',
    },
    options: {
      recurring: 'Recurrente',
      autoApprove: 'Aprobación Automática',
      waitlist: 'Lista de Espera',
      notifications: 'Enviar Notificaciones',
    },
    recurring: {
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
    },
    buttons: {
      create: 'Crear Encuentro',
      update: 'Actualizar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
    },
    validation: {
      titleRequired: 'Título requerido',
      dateRequired: 'Fecha requerida',
      timeRequired: 'Hora requerida',
      locationRequired: 'Ubicación requerida',
    },
    success: {
      created: '¡Encuentro creado!',
      updated: '¡Encuentro actualizado!',
      deleted: 'Encuentro eliminado',
    },
    errors: {
      createFailed: 'Error al crear',
      updateFailed: 'Error al actualizar',
      deleteFailed: 'Error al eliminar',
    },
  },

  // Score Confirmation (30 keys)
  scoreConfirmation: {
    title: 'Confirmar Puntuación',
    header: 'Resultado del Partido',
    opponent: 'Oponente',
    date: 'Fecha',
    location: 'Ubicación',
    score: {
      title: 'Puntuación',
      set: 'Set {{number}}',
      tiebreak: 'Tiebreak',
      final: 'Resultado Final',
    },
    winner: {
      title: '¿Quién ganó?',
      you: 'Yo gané',
      opponent: 'Oponente ganó',
      draw: 'Empate',
    },
    sets: {
      title: 'Puntuación por Sets',
      addSet: 'Agregar Set',
      removeSet: 'Quitar Set',
    },
    buttons: {
      confirm: 'Confirmar',
      edit: 'Editar',
      cancel: 'Cancelar',
      submit: 'Enviar',
    },
    alerts: {
      confirmSubmit: '¿Enviar esta puntuación?',
      submitted: '¡Puntuación enviada!',
      submitFailed: 'Error al enviar puntuación',
      waitingOpponent: 'Esperando confirmación del oponente',
      confirmed: '¡Puntuación confirmada!',
      disputed: 'Puntuación disputada',
    },
    status: {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      disputed: 'Disputado',
    },
  },

  // Schedules (27 keys)
  schedules: {
    title: 'Horarios',
    tabs: {
      all: 'Todos',
      today: 'Hoy',
      week: 'Esta Semana',
      month: 'Este Mes',
    },
    filters: {
      type: 'Tipo',
      club: 'Club',
      date: 'Fecha',
      clear: 'Limpiar',
    },
    empty: {
      noSchedules: 'No hay horarios',
      noToday: 'Nada programado para hoy',
      noWeek: 'Nada programado esta semana',
      noMonth: 'Nada programado este mes',
    },
    card: {
      time: 'Hora',
      location: 'Ubicación',
      participants: 'Participantes',
      type: 'Tipo',
      club: 'Club',
    },
    actions: {
      view: 'Ver',
      edit: 'Editar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
    },
    recurring: {
      daily: 'Diario',
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
    },
  },

  // Policy Edit Screen (24 keys)
  policyEditScreen: {
    title: 'Editar Política',
    header: {
      create: 'Nueva Política',
      edit: 'Editar Política',
    },
    fields: {
      title: 'Título',
      titlePlaceholder: 'Título de la política',
      content: 'Contenido',
      contentPlaceholder: 'Ingresa el contenido de la política...',
      category: 'Categoría',
    },
    categories: {
      general: 'General',
      membership: 'Membresía',
      conduct: 'Conducta',
      fees: 'Cuotas',
      attendance: 'Asistencia',
      other: 'Otro',
    },
    buttons: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      preview: 'Vista Previa',
    },
    alerts: {
      saved: 'Política guardada',
      saveFailed: 'Error al guardar',
      deleted: 'Política eliminada',
      confirmDelete: '¿Eliminar esta política?',
    },
    validation: {
      titleRequired: 'Título requerido',
      contentRequired: 'Contenido requerido',
    },
  },

  // Role Management (21 keys)
  roleManagement: {
    title: 'Gestión de Roles',
    roles: {
      owner: 'Dueño',
      admin: 'Administrador',
      manager: 'Gerente',
      member: 'Miembro',
    },
    permissions: {
      title: 'Permisos',
      manageMembers: 'Gestionar Miembros',
      manageEvents: 'Gestionar Eventos',
      manageSettings: 'Gestionar Configuración',
      manageDues: 'Gestionar Cuotas',
      viewReports: 'Ver Reportes',
      sendAnnouncements: 'Enviar Anuncios',
    },
    actions: {
      promote: 'Promover',
      demote: 'Degradar',
      changeRole: 'Cambiar Rol',
    },
    alerts: {
      roleChanged: 'Rol actualizado',
      changeFailed: 'Error al cambiar rol',
      confirmChange: '¿Cambiar rol de {{name}} a {{role}}?',
    },
  },

  // Record Score (21 keys)
  recordScore: {
    title: 'Registrar Puntuación',
    match: {
      opponent: 'Oponente',
      date: 'Fecha',
      type: 'Tipo',
    },
    score: {
      title: 'Puntuación',
      set: 'Set {{number}}',
      addSet: 'Agregar Set',
      removeSet: 'Quitar Set',
      tiebreak: 'Tiebreak',
    },
    winner: {
      title: 'Resultado',
      iWon: 'Gané',
      theyWon: 'Perdí',
      tie: 'Empate',
    },
    buttons: {
      submit: 'Enviar',
      cancel: 'Cancelar',
      clear: 'Limpiar',
    },
    alerts: {
      submitted: '¡Puntuación registrada!',
      submitFailed: 'Error al registrar',
      confirmSubmit: '¿Enviar esta puntuación?',
    },
  },

  // My Activities (2 keys)
  myActivities: {
    title: 'Mis Actividades',
    empty: 'No hay actividades',
  },

  // My Club Settings (1 key)
  myClubSettings: {
    error: 'Error',
  },

  // My Profile (1 key)
  myProfile: {
    title: 'Mi Perfil',
  },

  // NTRP Result (1 key)
  ntrpResult: {
    title: 'Resultado LPR',
  },

  // NTRP Selector (6 keys)
  ntrpSelector: {
    title: 'Seleccionar Nivel LPR',
    levels: {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
    },
    description: 'Selecciona tu nivel de habilidad',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
  },

  // Onboarding (remaining)
  onboarding: {
    error: 'Error',
  },

  // Club Dues Management (remaining)
  clubDuesManagement: {
    status: {
      all: 'Todos',
      paid: 'Pagados',
      unpaid: 'Impagos',
      overdue: 'Vencidos',
      filter: 'Filtrar',
    },
    unpaid: {
      sendAllReminders: 'Enviar Todos los Recordatorios',
    },
  },

  // Additional smaller sections
  activityTab: {
    error: 'Error',
  },

  alert: {
    title: {
      error: 'Error',
    },
  },

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

  auth: {
    register: {
      errors: {
        title: 'Error',
      },
    },
  },

  clubAdmin: {
    chat: 'Chat',
    chatNormal: 'Normal',
  },

  clubLeagueManagement: {
    status: {
      playoffs: 'Playoffs',
    },
  },

  clubList: {
    clubType: {
      casual: 'Casual',
      social: 'Social',
    },
  },

  clubOverviewScreen: {
    deleteError: 'Error',
  },

  clubSelector: {
    club: 'Club',
  },

  clubTournamentManagement: {
    roundGeneration: { errorTitle: 'Error' },
    tournamentStart: { errorTitle: 'Error' },
    seedAssignment: { errorTitle: 'Error' },
    deletion: { errorTitle: 'Error' },
    participantRemoval: { errorTitle: 'Error' },
    participantAdd: { errorTitle: 'Error' },
    common: { error: 'Error' },
  },

  common: {
    error: 'Error',
  },

  developerTools: {
    errorTitle: 'Error',
  },

  directChat: {
    club: 'Club',
    alerts: {
      error: 'Error',
    },
  },

  editClubPolicy: {
    error: 'Error',
  },

  findClubScreen: {
    joinRequestError: 'Error',
  },

  hostedEventCard: {
    buttons: {
      chat: 'Chat',
    },
    alerts: {
      error: 'Error',
    },
  },

  lessonForm: {
    errorTitle: 'Error',
  },

  manageAnnouncement: {
    saving: 'Guardando...',
    titlePlaceholder: 'Título del anuncio',
    contentPlaceholder: 'Contenido del anuncio',
    saveButton: 'Guardar',
  },

  matchRequest: {
    buttons: {
      sendRequest: 'Enviar Solicitud',
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

console.log('🇪🇸 Fixing Spanish translations (Batch 4 - Large sections)...\n');

// Merge translations
deepMerge(esContent, translations);

// Write back
fs.writeFileSync(esPath, JSON.stringify(esContent, null, 2) + '\n', 'utf8');

console.log('✅ Updated es.json with batch 4 translations');
console.log('\n🎉 Spanish translations batch 4 complete!');
