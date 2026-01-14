#!/usr/bin/env node

/**
 * Spanish Translation Script - Round 2
 * Translates all remaining English keys in es.json to Spanish
 */

const fs = require('fs');
const path = require('path');

// File paths
const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

// Read JSON files
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

// Comprehensive Spanish translations
const translations = {
  // duesManagement section (19 keys)
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
  },

  // clubTournamentManagement section (7 keys)
  clubTournamentManagement: {
    title: 'Gestión de Torneos del Club',
    createTournament: 'Crear Torneo',
    noTournaments: 'No hay torneos',
    noTournamentsMessage: 'Este club aún no ha creado ningún torneo.',
    activeTournaments: 'Torneos Activos',
    pastTournaments: 'Torneos Pasados',
    viewDetails: 'Ver Detalles',
  },

  // emailLogin section (5 keys)
  emailLogin: {
    title: 'Inicio de Sesión con Email',
    emailPlaceholder: 'correo@ejemplo.com',
    passwordPlaceholder: 'Contraseña',
    loginButton: 'Iniciar Sesión',
    forgotPassword: '¿Olvidaste tu contraseña?',
  },

  // terms section (4 keys)
  terms: {
    title: 'Términos y Condiciones',
    accept: 'Acepto los términos y condiciones',
    decline: 'Rechazar',
    mustAccept: 'Debes aceptar los términos para continuar',
  },

  // appliedEventCard section (4 keys)
  appliedEventCard: {
    applied: 'Solicitado',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  },

  // clubEventCard section (3 keys)
  clubEventCard: {
    spotsLeft: '{{count}} lugar disponible',
    spotsLeft_other: '{{count}} lugares disponibles',
    eventFull: 'Evento Lleno',
  },

  // clubRoster section (3 keys)
  clubRoster: {
    searchPlaceholder: 'Buscar miembros...',
    noMembers: 'No se encontraron miembros',
    errorLoading: 'Error al cargar la lista de miembros',
  },

  // achievementBadge section (2 keys)
  achievementBadge: {
    unlocked: 'Desbloqueado',
    locked: 'Bloqueado',
  },

  // adminPanel section (2 keys)
  adminPanel: {
    title: 'Panel de Administración',
    settings: 'Configuración',
  },

  // blockUser section (2 keys)
  blockUser: {
    block: 'Bloquear Usuario',
    unblock: 'Desbloquear Usuario',
  },

  // clubAnalytics section (2 keys)
  clubAnalytics: {
    title: 'Análisis del Club',
    overview: 'Resumen',
  },

  // eventParticipants section (2 keys)
  eventParticipants: {
    participants: 'Participantes',
    waitlist: 'Lista de Espera',
  },

  // inviteFriends section (2 keys)
  inviteFriends: {
    title: 'Invitar Amigos',
    shareMessage: '¡Únete a mí en Lightning Tennis!',
  },

  // leagueRankings section (2 keys)
  leagueRankings: {
    title: 'Clasificación de la Liga',
    noRankings: 'No hay clasificaciones disponibles',
  },

  // memberProfile section (2 keys)
  memberProfile: {
    profile: 'Perfil',
    stats: 'Estadísticas',
  },

  // notificationSettings section (2 keys)
  notificationSettings: {
    title: 'Configuración de Notificaciones',
    enableAll: 'Habilitar Todas',
  },

  // privacySettings section (2 keys)
  privacySettings: {
    title: 'Configuración de Privacidad',
    profileVisibility: 'Visibilidad del Perfil',
  },

  // reportUser section (2 keys)
  reportUser: {
    title: 'Reportar Usuario',
    submit: 'Enviar Reporte',
  },

  // tournamentBracket section (2 keys)
  tournamentBracket: {
    title: 'Cuadro del Torneo',
    round: 'Ronda {{number}}',
  },

  // userStats section (2 keys)
  userStats: {
    title: 'Mis Estadísticas',
    overview: 'Resumen',
  },

  // accountSettings section (1 key)
  accountSettings: {
    deleteAccount: 'Eliminar Cuenta',
  },

  // appInfo section (1 key)
  appInfo: {
    version: 'Versión {{version}}',
  },

  // chatMessage section (1 key)
  chatMessage: {
    deletedMessage: 'Mensaje eliminado',
  },

  // clubDirectory section (1 key)
  clubDirectory: {
    searchPlaceholder: 'Buscar clubes...',
  },

  // clubEvents section (1 key)
  clubEvents: {
    noUpcoming: 'No hay eventos próximos',
  },

  // clubHeader section (1 key)
  clubHeader: {
    members: '{{count}} miembro',
    members_other: '{{count}} miembros',
  },

  // clubInfo section (1 key)
  clubInfo: {
    description: 'Descripción',
  },

  // clubLeagues section (1 key)
  clubLeagues: {
    noLeagues: 'No hay ligas activas',
  },

  // clubMembers section (1 key)
  clubMembers: {
    viewAll: 'Ver Todos',
  },

  // clubPolicies section (1 key)
  clubPolicies: {
    noPolicies: 'No hay políticas configuradas',
  },

  // clubSearch section (1 key)
  clubSearch: {
    placeholder: 'Buscar por nombre o ubicación...',
  },

  // clubSettings section (1 key)
  clubSettings: {
    general: 'General',
  },

  // createClub section (1 key)
  createClub: {
    namePlaceholder: 'Nombre del club',
  },

  // createEvent section (1 key)
  createEvent: {
    titlePlaceholder: 'Título del evento',
  },

  // createLeague section (1 key)
  createLeague: {
    namePlaceholder: 'Nombre de la liga',
  },

  // createPost section (1 key)
  createPost: {
    placeholder: '¿Qué está pasando?',
  },

  // createTournament section (1 key)
  createTournament: {
    namePlaceholder: 'Nombre del torneo',
  },

  // editProfile section (1 key)
  editProfile: {
    save: 'Guardar Cambios',
  },

  // emailVerification section (1 key)
  emailVerification: {
    sendAgain: 'Reenviar Email',
  },

  // feedback section (1 key)
  feedback: {
    placeholder: 'Comparte tus comentarios...',
  },

  // helpCenter section (1 key)
  helpCenter: {
    title: 'Centro de Ayuda',
  },

  // joinRequests section (1 key)
  joinRequests: {
    noRequests: 'No hay solicitudes pendientes',
  },

  // languageSettings section (1 key)
  languageSettings: {
    title: 'Idioma',
  },

  // leagueDetails section (1 key)
  leagueDetails: {
    standings: 'Posiciones',
  },

  // leagueManagement section (1 key)
  leagueManagement: {
    title: 'Gestión de Ligas',
  },

  // matchHistory section (1 key)
  matchHistory: {
    noMatches: 'No hay partidos registrados',
  },

  // matchResult section (1 key)
  matchResult: {
    submit: 'Enviar Resultado',
  },

  // memberList section (1 key)
  memberList: {
    searchPlaceholder: 'Buscar...',
  },

  // messageThread section (1 key)
  messageThread: {
    typePlaceholder: 'Escribe un mensaje...',
  },

  // nearbyPlayers section (1 key)
  nearbyPlayers: {
    noPlayers: 'No se encontraron jugadores cerca',
  },

  // passwordReset section (1 key)
  passwordReset: {
    title: 'Restablecer Contraseña',
  },

  // phoneVerification section (1 key)
  phoneVerification: {
    enterCode: 'Ingresa el código de verificación',
  },

  // playerSearch section (1 key)
  playerSearch: {
    placeholder: 'Buscar jugadores...',
  },

  // postComments section (1 key)
  postComments: {
    noComments: 'Aún no hay comentarios',
  },

  // postDetail section (1 key)
  postDetail: {
    comments: 'Comentarios',
  },

  // profileHeader section (1 key)
  profileHeader: {
    edit: 'Editar',
  },

  // pushNotifications section (1 key)
  pushNotifications: {
    enable: 'Habilitar Notificaciones',
  },

  // ratingHistory section (1 key)
  ratingHistory: {
    title: 'Historial de Rating',
  },

  // searchFilters section (1 key)
  searchFilters: {
    apply: 'Aplicar Filtros',
  },

  // socialFeed section (1 key)
  socialFeed: {
    noPosts: 'No hay publicaciones',
  },

  // support section (1 key)
  support: {
    contact: 'Contactar Soporte',
  },

  // tournamentDetails section (1 key)
  tournamentDetails: {
    register: 'Registrarse',
  },

  // tournamentManagement section (1 key)
  tournamentManagement: {
    title: 'Gestión de Torneos',
  },

  // upcomingMatches section (1 key)
  upcomingMatches: {
    noMatches: 'No hay partidos próximos',
  },

  // venueDetails section (1 key)
  venueDetails: {
    directions: 'Obtener Direcciones',
  },

  // venueSearch section (1 key)
  venueSearch: {
    placeholder: 'Buscar canchas...',
  },

  // welcomeScreen section (1 key)
  welcomeScreen: {
    getStarted: 'Comenzar',
  },
};

// Count untranslated keys
function countUntranslated(enObj, esObj, prefix = '') {
  let count = 0;
  for (const key in enObj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], esObj[key] || {}, currentPath);
    } else {
      // Check if Spanish value equals English value (untranslated)
      if (!esObj[key] || esObj[key] === enObj[key]) {
        count++;
      }
    }
  }
  return count;
}

// Main execution
console.log('🇪🇸 Spanish Translation Script - Round 2\n');

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

// Show which sections were updated
console.log('📦 Sections updated:');
Object.keys(translations).forEach(section => {
  const keyCount =
    typeof translations[section] === 'object' ? Object.keys(translations[section]).length : 1;
  console.log(`   • ${section}: ${keyCount} keys`);
});

process.exit(0);
