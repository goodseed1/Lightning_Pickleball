#!/usr/bin/env node

/**
 * Spanish Translation Script - Round 4 COMPLETE
 * Final round to translate all remaining keys
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

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

// Round 4 - Complete remaining translations
const translations = {
  // ===== CREATE MEETUP (remaining 15 keys) =====
  createMeetup: {
    errors: {
      errorTitle: 'Error',
    },
    success: {
      confirmed: '¡Reunión confirmada y los miembros han sido notificados!',
      copied: '¡La reunión ha sido copiada!',
      created: '¡Nueva reunión ha sido creada!',
      updated: '¡La reunión ha sido actualizada!',
      createdAndPublished: '¡Nueva reunión ha sido creada y publicada!',
      updatedAndPublished: '¡La reunión ha sido actualizada y publicada!',
    },
    notes: {
      dateTimeFixed: 'La fecha y hora no se pueden cambiar.',
      copyDateChangeable: '💡 Puedes cambiar la fecha para la reunión copiada.',
      createNote: 'Se creará una nueva reunión y los miembros serán notificados.',
      editNote: 'La información de la reunión será actualizada.',
      confirmNote: 'Todos los miembros del club recibirán una notificación push.',
    },
    location: {
      homeCourt: '🏠 Cancha Local',
      otherCourt: '🗺️ Otra Cancha',
      clubHomeCourt: 'Cancha Local del Club',
      changeInSettings: 'Se puede cambiar en configuración del club',
      courtLocation: 'Ubicación de la Cancha',
      searchPickleballCourt: 'Buscar Cancha de Tenis',
      searchHelper: 'Toca para buscar una cancha de tenis.',
    },
    court: {
      lastMeetupHint: '💡 Última reunión: "{{numbers}}"',
    },
    buttons: {
      saveAsDraft: 'Guardar como Borrador',
      createAndPublish: 'Crear y Publicar',
      updateAndPublish: 'Actualizar y Publicar',
      cancel: 'Cancelar',
    },
    labels: {
      draftMode: 'Modo Borrador',
      publishedMode: 'Modo Publicado',
    },
    validation: {
      titleRequired: 'Por favor ingresa un título',
      locationRequired: 'Por favor selecciona una ubicación',
      dateRequired: 'Por favor selecciona fecha y hora',
      maxPlayersInvalid: 'Máximo de jugadores debe ser al menos 2',
    },
  },

  // ===== POST DETAIL (remaining 14 keys) =====
  postDetail: {
    error: 'Error',
    inputError: 'Error de Entrada',
    commentFailed: 'Comentario Fallido',
    commentSubmitError: 'Ocurrió un error al enviar el comentario',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    deleteFailed: 'Error al Eliminar',
    commentDeleteError: 'Ocurrió un error al eliminar el comentario',
    reply: 'Responder',
    loadingPost: 'Cargando publicación...',
    notice: 'Aviso',
    pinned: 'Fijado',
    firstComment: '¡Sé el primero en comentar!',
    replying: 'Respondiendo...',
    loadPostError: 'Error al cargar publicación',
    loginRequired: 'Inicio de sesión requerido',
    loginRequiredMessage: 'Por favor inicia sesión para comentar',
    commentPlaceholder: 'Escribe un comentario...',
    posting: 'Publicando...',
    post: 'Publicar',
    noComments: 'Aún no hay comentarios',
    beFirst: '¡Sé el primero en comentar!',
    comments: 'Comentarios',
    deleteComment: 'Eliminar Comentario',
    deleteCommentConfirm: '¿Eliminar este comentario?',
    commentDeleted: 'Comentario eliminado',
    deleteCommentError: 'Error al eliminar comentario',
    likeError: 'Error al dar like',
    unlikeError: 'Error al quitar like',
    loadCommentsError: 'Error al cargar comentarios',
    addCommentError: 'Error al agregar comentario',
    viewAllComments: 'Ver todos los comentarios',
  },

  // ===== HALL OF FAME (remaining 14 keys) =====
  hallOfFame: {
    subtitle: 'Tus logros y honores',
    loading: 'Cargando logros...',
    emptyState: '¡Aún no hay logros. Comienza a jugar para ganar trofeos e insignias!',
    counts: {
      trophies: '{{count}} trofeos',
      badges: '{{count}} insignias',
      honors: '{{count}} honores',
    },
    sections: {
      trophies: 'Trofeos',
      badges: 'Insignias',
      honorBadges: 'Insignias de Honor',
    },
    honorBadges: {
      loading: 'Cargando insignias de honor...',
      receivedCount: '×{{count}}',
    },
    honorTags: {
      sharp_eyed: '#OjoAgudo',
      full_of_energy: '#LlenoDeEnergía',
      mr_manner: '#SrModales',
      punctual_pro: '#ProPuntual',
      mental_fortress: '#FortalezaMental',
      court_jester: '#BufónDeCancha',
    },
    tabs: {
      trophies: 'Trofeos',
      badges: 'Insignias',
    },
    trophies: {
      title: 'Trofeos de Torneo',
      noTrophies: 'Aún no has ganado ningún torneo.',
      champion: 'Campeón',
      runnerUp: 'Subcampeón',
      thirdPlace: '3er Lugar',
    },
    badges: {
      title: 'Insignias de Honor',
      noBadges: 'Aún no has ganado ninguna insignia.',
      received: 'Recibido {{count}} vez',
      received_other: 'Recibido {{count}} veces',
    },
    stats: {
      totalTrophies: 'Total de Trofeos',
      totalBadges: 'Total de Insignias',
      tournaments: 'Torneos',
      leagues: 'Ligas',
    },
  },

  // ===== CONTEXTS (14 keys) =====
  contexts: {
    feed: {
      refreshFailed: 'Error al cargar el feed.',
      subscriptionFailed: 'Error al configurar la suscripción del feed.',
    },
    auth: {
      emailVerificationRequired: 'Verificación de email requerida. Por favor revisa tu correo.',
      invalidCredential: 'Email o contraseña incorrectos. Por favor verifica e intenta nuevamente.',
      userNotFound: 'Cuenta no encontrada.',
      wrongPassword: 'Contraseña incorrecta.',
      invalidEmail: 'Dirección de email inválida.',
      tooManyRequests: 'Demasiadas solicitudes. Por favor intenta más tarde.',
      emailAlreadyInUse: 'Este email ya está en uso.',
      weakPassword: 'La contraseña es muy débil. Por favor usa al menos 6 caracteres.',
      emailAlreadyVerified: 'El email ya está verificado. Por favor inicia sesión.',
      resendVerificationFailed:
        'Error al reenviar email de verificación. Por favor intenta nuevamente.',
    },
    matching: {
      connectionFailed: 'Error al conectar con el servicio de emparejamiento.',
      startFailed: 'Ocurrió un error al iniciar el emparejamiento.',
    },
  },

  // ===== CLUB CHAT (13 keys) =====
  clubChat: {
    loadError: 'Error al Cargar Datos',
    loadErrorMessage: 'No se pueden cargar los datos del chat.',
    sendError: 'Ocurrió un error al enviar el mensaje.',
    timeHoursAgo: 'hace {{hours}}h',
    timeMinutesAgo: 'hace {{minutes}}m',
    timeJustNow: 'Justo ahora',
    roleAdmin: 'Admin',
    roleStaff: 'Staff',
    roleMember: 'Miembro',
    announcement: 'Anuncio',
    important: 'Importante',
    loadingChat: 'Cargando chat...',
    inputPlaceholder: 'Escribe un mensaje...',
  },

  // ===== CLUB DUES MANAGEMENT (13 keys) =====
  clubDuesManagement: {
    status: {
      summary: 'Resumen de Pagos',
      totalMembers: 'Total de Miembros',
      collectionRate: 'Tasa de Cobro',
      memberPaymentStatus: 'Estado de Pago de Miembros',
      autoInvoice: 'Factura Automática',
      noMembers: 'No se encontraron miembros',
    },
    unpaid: {
      management: 'Gestión de Miembros No Pagados',
      count: '{{count}} miembros tienen cuotas no pagadas',
      sendReminders: 'Enviar Recordatorios',
      list: 'Lista de Miembros No Pagados',
      reminderCount: '{{count}} recordatorios enviados',
      markPaid: 'Marcar como Pagado',
      allPaid: 'Todos los miembros han pagado sus cuotas',
    },
  },

  // ===== ACHIEVEMENTS GUIDE (13 keys) =====
  achievementsGuide: {
    title: 'Guía de Logros',
    subtitle: 'Aprende cómo ganar todos los trofeos e insignias',
    tabs: {
      trophies: 'Trofeos',
      badges: 'Insignias',
    },
    trophies: {
      title: 'Trofeos de Competición',
      description: 'Gana trofeos compitiendo en torneos y ligas',
      champion: '🏆 Campeón',
      championDesc: 'Gana primer lugar en un torneo o liga',
      runnerUp: '🥈 Subcampeón',
      runnerUpDesc: 'Gana segundo lugar en un torneo o liga',
      thirdPlace: '🥉 Tercer Lugar',
      thirdPlaceDesc: 'Gana tercer lugar en un torneo o liga',
    },
    badges: {
      title: 'Insignias de Logro',
      description: 'Desbloquea insignias alcanzando hitos',
    },
  },

  // Additional smaller sections
  clubEventDetail: {
    loading: 'Cargando detalles del evento...',
    error: 'Error',
    errorLoading: 'Error al cargar el evento',
    eventNotFound: 'Evento no encontrado',
    participants: 'Participantes',
    waitlist: 'Lista de Espera',
    apply: 'Solicitar',
    withdraw: 'Retirarse',
    edit: 'Editar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
  },

  appliedEvents: {
    title: 'Eventos Solicitados',
    noEvents: 'No hay eventos solicitados',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    withdrawn: 'Retirado',
  },

  createEvent: {
    title: 'Crear Evento',
    titlePlaceholder: 'Título del evento',
    description: 'Descripción',
    descriptionPlaceholder: 'Ingresa descripción del evento',
    date: 'Fecha',
    time: 'Hora',
    location: 'Ubicación',
    maxParticipants: 'Máximo de Participantes',
    create: 'Crear Evento',
    update: 'Actualizar Evento',
    createSuccess: 'Evento creado exitosamente',
    updateSuccess: 'Evento actualizado exitosamente',
    createError: 'Error al crear evento',
    updateError: 'Error al actualizar evento',
  },

  emailLogin: {
    title: 'Inicio de Sesión con Email',
    emailPlaceholder: 'correo@ejemplo.com',
    passwordPlaceholder: 'Contraseña',
    loginButton: 'Iniciar Sesión',
    forgotPassword: '¿Olvidaste tu contraseña?',
    noAccount: '¿No tienes cuenta?',
    signUp: 'Registrarse',
    loginError: 'Error al iniciar sesión',
    emailRequired: 'Email requerido',
    passwordRequired: 'Contraseña requerida',
  },

  terms: {
    title: 'Términos y Condiciones',
    accept: 'Acepto los términos y condiciones',
    decline: 'Rechazar',
    mustAccept: 'Debes aceptar los términos para continuar',
    agreeToTerms: 'Acepto los Términos de Servicio y Política de Privacidad',
    readTerms: 'Leer Términos Completos',
  },

  appliedEventCard: {
    applied: 'Solicitado',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    withdrawn: 'Retirado',
    waitlisted: 'En Lista de Espera',
  },

  clubEventCard: {
    spotsLeft: '{{count}} lugar disponible',
    spotsLeft_other: '{{count}} lugares disponibles',
    eventFull: 'Evento Lleno',
    apply: 'Solicitar',
    viewDetails: 'Ver Detalles',
  },

  clubRoster: {
    searchPlaceholder: 'Buscar miembros...',
    noMembers: 'No se encontraron miembros',
    errorLoading: 'Error al cargar la lista de miembros',
    role: 'Rol',
    joined: 'Unido',
    stats: 'Estadísticas',
  },

  // All remaining small sections with 1-2 keys each
  achievementBadge: {
    unlocked: 'Desbloqueado',
    locked: 'Bloqueado',
  },

  adminPanel: {
    title: 'Panel de Administración',
    settings: 'Configuración',
  },

  blockUser: {
    block: 'Bloquear Usuario',
    unblock: 'Desbloquear Usuario',
    confirmBlock: '¿Bloquear a este usuario?',
    confirmUnblock: '¿Desbloquear a este usuario?',
  },

  clubAnalytics: {
    title: 'Análisis del Club',
    overview: 'Resumen',
    members: 'Miembros',
    activity: 'Actividad',
  },

  eventParticipants: {
    participants: 'Participantes',
    waitlist: 'Lista de Espera',
    approved: 'Aprobados',
    pending: 'Pendientes',
  },

  inviteFriends: {
    title: 'Invitar Amigos',
    shareMessage: '¡Únete a mí en Lightning Pickleball!',
    share: 'Compartir',
    copied: 'Link copiado',
  },

  leagueRankings: {
    title: 'Clasificación de la Liga',
    noRankings: 'No hay clasificaciones disponibles',
    wins: 'Victorias',
    losses: 'Derrotas',
  },

  memberProfile: {
    profile: 'Perfil',
    stats: 'Estadísticas',
    achievements: 'Logros',
    matches: 'Partidos',
  },

  notificationSettings: {
    title: 'Configuración de Notificaciones',
    enableAll: 'Habilitar Todas',
    disableAll: 'Deshabilitar Todas',
  },

  privacySettings: {
    title: 'Configuración de Privacidad',
    profileVisibility: 'Visibilidad del Perfil',
    public: 'Público',
    private: 'Privado',
  },

  reportUser: {
    title: 'Reportar Usuario',
    submit: 'Enviar Reporte',
    reason: 'Razón',
    description: 'Descripción',
  },

  tournamentBracket: {
    title: 'Cuadro del Torneo',
    round: 'Ronda {{number}}',
    finals: 'Final',
    semifinals: 'Semifinales',
  },

  userStats: {
    title: 'Mis Estadísticas',
    overview: 'Resumen',
    matches: 'Partidos',
    winRate: 'Tasa de Victoria',
  },

  accountSettings: {
    deleteAccount: 'Eliminar Cuenta',
    editProfile: 'Editar Perfil',
    changePassword: 'Cambiar Contraseña',
  },

  appInfo: {
    version: 'Versión {{version}}',
    about: 'Acerca de',
    terms: 'Términos',
  },

  chatMessage: {
    deletedMessage: 'Mensaje eliminado',
    edited: 'editado',
    deleted: 'eliminado',
  },

  clubDirectory: {
    searchPlaceholder: 'Buscar clubes...',
    noResults: 'Sin resultados',
    loading: 'Cargando...',
  },

  clubEvents: {
    noUpcoming: 'No hay eventos próximos',
    upcoming: 'Próximos',
    past: 'Pasados',
  },

  clubHeader: {
    members: '{{count}} miembro',
    members_other: '{{count}} miembros',
    join: 'Unirse',
    joined: 'Unido',
  },

  clubInfo: {
    description: 'Descripción',
    location: 'Ubicación',
    founded: 'Fundado',
  },

  clubLeagues: {
    noLeagues: 'No hay ligas activas',
    active: 'Activas',
    completed: 'Completadas',
  },

  clubMembers: {
    viewAll: 'Ver Todos',
    members: 'Miembros',
    staff: 'Staff',
  },

  clubSearch: {
    placeholder: 'Buscar por nombre o ubicación...',
    recent: 'Recientes',
    nearby: 'Cercanos',
  },

  clubSettings: {
    general: 'General',
    members: 'Miembros',
    advanced: 'Avanzado',
  },

  createClub: {
    namePlaceholder: 'Nombre del club',
    descriptionPlaceholder: 'Descripción del club',
    create: 'Crear Club',
  },

  createLeague: {
    namePlaceholder: 'Nombre de la liga',
    create: 'Crear Liga',
  },

  createPost: {
    placeholder: '¿Qué está pasando?',
    post: 'Publicar',
    posting: 'Publicando...',
  },

  createTournament: {
    namePlaceholder: 'Nombre del torneo',
    create: 'Crear Torneo',
  },

  editProfile: {
    save: 'Guardar Cambios',
    saving: 'Guardando...',
    saveSuccess: 'Perfil actualizado',
  },

  emailVerification: {
    sendAgain: 'Reenviar Email',
    checkEmail: 'Revisa tu email',
    verified: 'Email verificado',
  },

  feedback: {
    placeholder: 'Comparte tus comentarios...',
    submit: 'Enviar',
    thanks: 'Gracias por tu feedback',
  },

  helpCenter: {
    title: 'Centro de Ayuda',
    faq: 'Preguntas Frecuentes',
    contact: 'Contacto',
  },

  joinRequests: {
    noRequests: 'No hay solicitudes pendientes',
    approve: 'Aprobar',
    reject: 'Rechazar',
  },

  languageSettings: {
    title: 'Idioma',
    english: 'English',
    spanish: 'Español',
    korean: '한국어',
  },

  leagueDetails: {
    standings: 'Posiciones',
    matches: 'Partidos',
    participants: 'Participantes',
  },

  leagueManagement: {
    title: 'Gestión de Ligas',
    create: 'Crear Liga',
    edit: 'Editar',
  },

  matchHistory: {
    noMatches: 'No hay partidos registrados',
    recent: 'Recientes',
    all: 'Todos',
  },

  matchResult: {
    submit: 'Enviar Resultado',
    submitting: 'Enviando...',
    success: 'Resultado enviado',
  },

  memberList: {
    searchPlaceholder: 'Buscar...',
    noMembers: 'Sin miembros',
    loading: 'Cargando...',
  },

  messageThread: {
    typePlaceholder: 'Escribe un mensaje...',
    send: 'Enviar',
    loading: 'Cargando...',
  },

  nearbyPlayers: {
    noPlayers: 'No se encontraron jugadores cerca',
    loading: 'Buscando...',
    refresh: 'Actualizar',
  },

  passwordReset: {
    title: 'Restablecer Contraseña',
    email: 'Email',
    send: 'Enviar',
    success: 'Email enviado',
  },

  phoneVerification: {
    enterCode: 'Ingresa el código de verificación',
    verify: 'Verificar',
    resend: 'Reenviar',
  },

  playerSearch: {
    placeholder: 'Buscar jugadores...',
    noResults: 'Sin resultados',
    loading: 'Buscando...',
  },

  postComments: {
    noComments: 'Aún no hay comentarios',
    loading: 'Cargando...',
    viewAll: 'Ver todos',
  },

  profileHeader: {
    edit: 'Editar',
    share: 'Compartir',
    follow: 'Seguir',
  },

  pushNotifications: {
    enable: 'Habilitar Notificaciones',
    disable: 'Deshabilitar',
    settings: 'Configuración',
  },

  ratingHistory: {
    title: 'Historial de Rating',
    current: 'Actual',
    history: 'Historial',
  },

  searchFilters: {
    apply: 'Aplicar Filtros',
    reset: 'Restablecer',
    distance: 'Distancia',
  },

  socialFeed: {
    noPosts: 'No hay publicaciones',
    loading: 'Cargando...',
    refresh: 'Actualizar',
  },

  support: {
    contact: 'Contactar Soporte',
    email: 'Email',
    phone: 'Teléfono',
  },

  tournamentDetails: {
    register: 'Registrarse',
    registered: 'Registrado',
    full: 'Lleno',
  },

  tournamentManagement: {
    title: 'Gestión de Torneos',
    create: 'Crear Torneo',
    edit: 'Editar',
  },

  upcomingMatches: {
    noMatches: 'No hay partidos próximos',
    today: 'Hoy',
    thisWeek: 'Esta Semana',
  },

  venueDetails: {
    directions: 'Obtener Direcciones',
    call: 'Llamar',
    website: 'Sitio Web',
  },

  venueSearch: {
    placeholder: 'Buscar canchas...',
    noResults: 'Sin resultados',
    loading: 'Buscando...',
  },

  welcomeScreen: {
    getStarted: 'Comenzar',
    signIn: 'Iniciar Sesión',
    signUp: 'Registrarse',
  },
};

// Main execution
console.log('🇪🇸 Spanish Translation Script - Round 4 COMPLETE\n');

const beforeCount = countUntranslated(en, es);
console.log(`📊 Untranslated keys BEFORE: ${beforeCount}\n`);

const updatedEs = deepMerge(es, translations);
fs.writeFileSync(ES_PATH, JSON.stringify(updatedEs, null, 2) + '\n', 'utf8');

const afterCount = countUntranslated(en, updatedEs);
const translated = beforeCount - afterCount;

console.log(`✅ Translation complete!`);
console.log(`📝 Keys translated: ${translated}`);
console.log(`📊 Remaining untranslated: ${afterCount}\n`);

const sectionCount = Object.keys(translations).length;
console.log(`📦 Total sections translated in Round 4: ${sectionCount}`);

// Calculate total across all rounds
const totalTranslated = 1039 - afterCount;
console.log(`\n🎯 CUMULATIVE PROGRESS:`);
console.log(`   Round 2: 498 keys`);
console.log(`   Round 3: 191 keys`);
console.log(`   Round 4: ${translated} keys`);
console.log(`   ─────────────────`);
console.log(`   TOTAL: ${totalTranslated} keys translated`);
console.log(`   Remaining: ${afterCount} keys`);

process.exit(0);
