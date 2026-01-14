#!/usr/bin/env node

/**
 * Spanish Translation Script - Round 5 ABSOLUTE FINAL
 * Complete the last 269 keys
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

// Round 5 - Absolute Final Translation
const translations = {
  // ===== CREATE EVENT (12 keys) =====
  createEvent: {
    eventType: {
      lightningMatch: 'Partido Relámpago',
      lightningMeetup: 'Reunión Relámpago',
      match: 'Partido',
      meetup: 'Reunión',
      doublesMatch: 'Partido de Dobles',
      singlesMatch: 'Partido Individual',
    },
    fields: {
      auto: 'Automático',
    },
    alerts: {
      confirm: 'OK',
    },
    languages: {
      chinese: '中文',
      japanese: '日本語',
      spanish: 'Español',
      french: 'Français',
    },
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

  // ===== EVENT CHAT (10 keys) =====
  eventChat: {
    welcomeMessage: '¡Bienvenido a la sala de chat! Siéntete libre de discutir sobre el evento.',
    loadingChatRoom: 'Cargando sala de chat...',
    inputPlaceholder: 'Escribe un mensaje...',
    errors: {
      notAuthorized:
        'No estás autorizado para acceder a esta sala de chat. Por favor solicita el evento y sé aprobado primero.',
      networkError: 'Por favor verifica tu conexión de red e intenta nuevamente.',
      loadingError: 'Ocurrió un error al cargar la sala de chat: {{error}}',
      unknownError: 'Error desconocido',
      chatRoomNotice: 'Aviso de Sala de Chat',
      userNotFound: 'Información de usuario no encontrada.',
      sendError: 'Ocurrió un error al enviar el mensaje.',
    },
  },

  // ===== ACHIEVEMENTS GUIDE (10+ keys) =====
  achievementsGuide: {
    title: 'Guía de Logros',
    subtitle: 'Aprende cómo ganar todos los trofeos e insignias',
    seasonTrophies: 'Trofeos de Temporada',
    howToEarn: 'Cómo ganar',
    earnedOn: 'Ganado el {{date}}',
    notYetEarned: 'Aún no ganado',
    categories: {
      matches: 'Logros de Partidos',
      social: 'Logros Sociales',
      clubs: 'Logros de Club',
      tournaments: 'Logros de Torneo',
      streaks: 'Logros de Racha',
      special: 'Logros Especiales',
    },
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

  // ===== EMAIL LOGIN (9 keys) =====
  emailLogin: {
    title: {
      login: 'Inicio de Sesión',
      signup: 'Registrarse',
      verification: 'Verificación de Email',
    },
    verification: {
      sentTo: '{{email}}',
    },
    alerts: {
      genericError: {
        title: 'Error',
      },
      resendError: {
        title: 'Error',
      },
      missingInfo: {
        title: 'Error',
      },
      loginInfoMissing: {
        title: 'Error',
      },
      forgotPassword: {
        sendError: {
          title: 'Error',
        },
      },
    },
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

  // ===== ELO TREND (9 keys) =====
  eloTrend: {
    titleBase: 'Solicitado',
    pending: 'pendiente',
    approved: 'aprobado',
    soloLobby: 'lobby individual',
    partnerInvite: 'compañero',
    friendInvite: 'amigo',
    friendInvitations: '🎾 Invitaciones de Amigos',
    partnerInvitations: 'Invitaciones de Compañero',
    noApplied: 'No hay actividades solicitadas',
  },

  // ===== NTRP SELECTOR (9 keys) =====
  ntrpSelector: {
    levels: {
      beginner: {
        label: '1.0-2.5 (Principiante)',
        description: 'Apenas comenzó a jugar tenis',
      },
      intermediate: {
        label: '3.0-3.5 (Intermedio)',
        description: 'Puede hacer rallies y jugar partidos básicos',
      },
      advanced: {
        label: '4.0-4.5 (Avanzado)',
        description: 'Jugador consistente y competitivo',
      },
      expert: {
        label: '5.0+ (Experto)',
        description: 'Jugador a nivel de torneo',
      },
      any: {
        description: 'Todos los niveles de habilidad son bienvenidos',
      },
    },
  },

  // ===== CLUB TOURNAMENT MANAGEMENT (remaining 8 keys) =====
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
      confirm: 'OK',
      error: 'Error',
    },
  },

  // ===== BADGE GALLERY (8 keys) =====
  badgeGallery: {
    badges: {
      winning_streak_10: {
        name: 'Imparable',
        description: 'Gana 10 partidos seguidos',
      },
      match_milestone_10: {
        name: 'Comenzando',
        description: 'Juega 10 partidos',
      },
      match_milestone_50: {
        name: 'Jugador Dedicado',
        description: 'Juega 50 partidos',
      },
      match_milestone_100: {
        name: 'Club del Centenario',
        description: 'Juega 100 partidos',
      },
      social_player: {
        name: 'Jugador Social',
        description: '¡Jugó partidos con 5+ jugadores!',
      },
      winning_streak_3: {
        name: 'Racha Caliente',
        description: '¡Ganó 3 partidos consecutivos!',
      },
      winning_streak_5: {
        name: 'En Fuego',
        description: '¡Ganó 5 partidos consecutivos!',
      },
      early_bird: {
        name: 'Madrugador',
        description: '¡Jugó partidos antes de las 8am!',
      },
      night_owl: {
        name: 'Ave Nocturna',
        description: '¡Jugó partidos después de las 8pm!',
      },
      club_member: {
        name: 'Miembro del Club',
        description: '¡Se unió a un club de tenis!',
      },
    },
  },

  // ===== RATE SPORTSMANSHIP (7 keys) =====
  rateSportsmanship: {
    title: 'Calificar Deportividad',
    loading: 'Cargando...',
    eventDescription: 'Otorga insignias de honor a tus compañeros de juego',
    selectBadges: 'Seleccionar Insignias de Honor',
    selectBadgesDescription:
      'Elige etiquetas que representen las excelentes cualidades de este jugador',
    selectedCount: 'Etiquetas seleccionadas: {{count}}',
    submitting: 'Enviando...',
    submitButton: 'Otorgar Insignias de Honor',
    submitNote:
      'Las etiquetas se procesan anónimamente y ayudan a construir una cultura comunitaria positiva.',
    alerts: {
      error: 'Error',
      loadFailed: 'Error al cargar información del evento',
      tagsRequired: 'Etiquetas Requeridas',
      tagsRequiredMessage: 'Por favor selecciona al menos una etiqueta para cada participante',
      badgesAwarded: 'Insignias de Honor Otorgadas',
      badgesAwardedMessage:
        '¡Las etiquetas de deportividad han sido otorgadas exitosamente. Gracias!',
      submitFailed: 'Error al enviar etiquetas',
      noParticipants: 'No hay participantes para calificar',
      alreadyRated: 'Ya has calificado a este participante',
      selectAtLeastOne: 'Por favor selecciona al menos una etiqueta',
      ratingSuccess: 'Calificación enviada exitosamente',
      ratingError: 'Error al enviar calificación',
      notParticipant: 'No eres participante de este evento',
      eventNotFound: 'Evento no encontrado',
      loginRequired: 'Inicio de sesión requerido',
    },
    honorTags: {
      sharpEyed: '#OjoAgudo',
      fullOfEnergy: '#LlenoDeEnergía',
      mrManner: '#SrModales',
      punctualPro: '#ProPuntual',
      mentalFortress: '#FortalezaMental',
      courtJester: '#BufónDeCancha',
    },
  },

  // ===== CLUB LEAGUES TOURNAMENTS (7 keys) =====
  clubLeaguesTournaments: {
    memberPreLeagueStatus: {
      peopleUnit: '',
    },
    alerts: {
      error: {
        title: 'Error',
      },
      selectPartner: {
        title: 'Error',
      },
    },
    empty: {
      noLeagues: {
        title: 'No hay ligas activas',
        message: 'Te notificaremos cuando haya nuevas ligas disponibles.',
      },
      noTournaments: {
        title: 'No hay torneos disponibles',
        message: 'Te notificaremos cuando haya nuevos torneos disponibles.',
      },
    },
  },

  // ===== COMMON (6 keys) =====
  common: {
    open: 'Abrir',
    error: 'Error',
    no: 'No',
    ok: 'OK',
    unknown: 'Desconocido',
    withdrawnMember: '(Miembro Retirado)',
    yes: 'Sí',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
  },

  // ===== PROFILE (6 keys) =====
  profile: {
    settings: {
      notifications: 'Configuración de Notificaciones',
      profileSettings: 'Configuración de Perfil',
      appSettings: 'Configuración de la Aplicación',
    },
    userProfile: {
      friendRequest: {
        error: 'Error',
      },
      sendMessage: {
        error: 'Error',
      },
      timeSlots: {
        brunch: 'Brunch',
      },
    },
  },

  // ===== TERMS (6+ keys) =====
  terms: {
    title: 'Términos y Condiciones',
    accept: 'Acepto los términos y condiciones',
    decline: 'Rechazar',
    mustAccept: 'Debes aceptar los términos para continuar',
    agreeToTerms: 'Acepto los Términos de Servicio y Política de Privacidad',
    readTerms: 'Leer Términos Completos',
    details: {
      serviceTerms: {
        content: `Términos de Servicio de Lightning Pickleball

⚠️ Aviso Importante
Lightning Pickleball es una plataforma que conecta jugadores de tenis. La responsabilidad por incidentes de seguridad o disputas durante partidos reales recae en los participantes, y no asumimos responsabilidad legal por estos asuntos.

1. Uso del Servicio
- Esta aplicación es un servicio de plataforma que conecta jugadores de tenis.
- Los usuarios pueden utilizar funciones como creación de partidos, participación y actividades de club.
- Por favor mantén respeto mutuo y deportividad al usar el servicio.

2. Obligaciones del Usuario
- Debe proporcionar información precisa.
- No debe infringir los derechos de otros.
- No debe publicar contenido ilegal o inapropiado.

3. Términos del Servicio de Chatbot de IA
3.1 Limitaciones de Respuestas de IA (Descargo de Responsabilidad)
- La información relacionada con tenis proporcionada por el chatbot es generada por IA.
- La información proporcionada por IA puede ser inexacta o desactualizada.
- La compañía no garantiza la precisión, integridad o confiabilidad de la información del chatbot de IA.
- La compañía no es responsable por daños derivados de la información del chatbot de IA.

3.2 Derechos y Responsabilidades del Usuario
- Los usuarios pueden hacer preguntas al chatbot de IA libremente.
- Los usuarios deben usar las respuestas del chatbot de IA solo como referencia.
- Para decisiones importantes, se recomienda consultar con expertos.

4. Responsabilidad
- La compañía no es responsable por disputas entre usuarios.
- La compañía no garantiza la integridad del servicio.

5. Cambios en los Términos
- Estos términos pueden cambiar en cualquier momento.
- Los cambios serán notificados a través de la aplicación.

Fecha de Vigencia: 1 de enero de 2025`,
      },
      privacyPolicy: {
        content: `Política de Privacidad de Lightning Pickleball

Recopilamos y procesamos la siguiente información:
- Información de perfil (nombre, email, foto)
- Registros de partidos
- Información de ubicación
- Estadísticas de uso de la aplicación

Sus datos se utilizan para:
- Proporcionar servicios de emparejamiento
- Mejorar funciones de la aplicación
- Comunicaciones

Protegemos sus datos mediante:
- Encriptación
- Controles de acceso
- Auditorías de seguridad regulares

Fecha de Vigencia: 1 de enero de 2025`,
      },
    },
  },
};

// Main execution
console.log('🇪🇸 Spanish Translation Script - Round 5 ABSOLUTE FINAL\n');

const beforeCount = countUntranslated(en, es);
console.log(`📊 Untranslated keys BEFORE: ${beforeCount}\n`);

const updatedEs = deepMerge(es, translations);
fs.writeFileSync(ES_PATH, JSON.stringify(updatedEs, null, 2) + '\n', 'utf8');

const afterCount = countUntranslated(en, updatedEs);
const translated = beforeCount - afterCount;

console.log(`✅ Translation complete!`);
console.log(`📝 Keys translated in Round 5: ${translated}`);
console.log(`📊 Remaining untranslated: ${afterCount}\n`);

// Calculate total across all rounds
const totalTranslated = 1039 - afterCount;
console.log(`\n🎯 COMPLETE TRANSLATION REPORT:`);
console.log(`   ═════════════════════════════════`);
console.log(`   Round 2: 498 keys`);
console.log(`   Round 3: 191 keys`);
console.log(`   Round 4: 81 keys`);
console.log(`   Round 5: ${translated} keys`);
console.log(`   ─────────────────────────────────`);
console.log(`   TOTAL: ${totalTranslated} keys translated ✨`);
console.log(`   Remaining: ${afterCount} keys`);
console.log(`   Completion: ${((totalTranslated / 1039) * 100).toFixed(1)}%`);
console.log(`   ═════════════════════════════════\n`);

if (afterCount === 0) {
  console.log(`   🎉 ALL KEYS TRANSLATED! 🎉\n`);
} else if (afterCount < 50) {
  console.log(`   ⚡ Nearly complete! Only ${afterCount} keys left.\n`);
} else {
  console.log(`   📝 Good progress! ${afterCount} keys remaining.\n`);
}

process.exit(0);
