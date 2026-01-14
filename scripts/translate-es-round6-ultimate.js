#!/usr/bin/env node

/**
 * Spanish Translation Script - Round 6 ULTIMATE FINAL
 * Complete ALL remaining 195 keys
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

// ULTIMATE FINAL translations - ALL remaining keys
const translations = {
  // ===== CLUB TOURNAMENT MANAGEMENT (8 keys) =====
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

  // ===== EMAIL LOGIN (6 keys) =====
  emailLogin: {
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
  },

  // ===== CREATE CLUB TOURNAMENT (6 keys) =====
  createClubTournament: {
    matchFormats: {
      best_of_1: '1 Set',
      best_of_3: '3 Sets',
      best_of_5: '5 Sets',
    },
    seedingMethods: {
      manual: 'Manual',
    },
    errors: {
      maxPlayersInvalid:
        'El máximo de participantes debe ser al menos {min} (mínimo requerido para iniciar)',
    },
    success: {
      created: 'Torneo creado exitosamente',
    },
  },

  // ===== MEETUP DETAIL (6 keys) =====
  meetupDetail: {
    participants: {
      title: 'Participantes',
    },
    chat: {
      title: 'Chat de Reunión',
      emptyMessage: '¡Sé el primero en dejar un mensaje!',
      placeholder: 'Escribe un mensaje...',
      sendError: 'Error al enviar mensaje',
    },
    editEvent: {
      durationUnit: 'min',
    },
  },

  // ===== USER ACTIVITY (6 keys) =====
  userActivity: {
    editEventTitle: 'Editar Evento',
    editEventMessage: '¿Te gustaría editar este evento?',
    cancel: 'Cancelar',
    edit: 'Editar',
    comingSoonTitle: 'Próximamente',
    comingSoonMessage:
      'Función de edición de eventos próximamente. Se integrará con CreateEventFormScreen para cargar datos existentes para edición.',
  },

  // ===== RANKING PRIVACY (6 keys) =====
  rankingPrivacy: {
    visibility: {
      public: {
        label: 'Público',
        description:
          'Los no miembros pueden acceder a todas las pestañas del club excepto Liga/Torneo. Solicitudes de unión permitidas.',
      },
      membersOnly: {
        label: 'Solo Miembros',
        description:
          'Los no miembros no pueden ver la pestaña Miembros (Liga/Torneo excluidos). Solicitudes de unión permitidas.',
      },
      private: {
        label: 'Privado',
        description:
          'Oculto de Explorar/Lista de clubes. Sin solicitudes de unión. Solo por invitación.',
      },
    },
  },

  // ===== MATCHES (6 keys) =====
  matches: {
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    createModal: {
      maxParticipants: {
        placeholder: '4',
      },
    },
    alerts: {
      createSuccess: {
        confirm: 'OK',
      },
    },
  },

  // ===== EVENT CARD (5 keys) =====
  eventCard: {
    eventTypes: {
      casual: 'Casual',
      general: 'General',
    },
    labels: {
      participants: '{{current}}/{{max}}',
    },
    buttons: {
      chat: 'Chat',
    },
    soloApplicants: {
      count: '{{count}} individual',
    },
  },

  // ===== CREATE EVENT (5 remaining keys) =====
  createEvent: {
    alerts: {
      confirm: 'OK',
    },
    languages: {
      chinese: '中文',
      japanese: '日本語',
      spanish: 'Español',
      french: 'Français',
    },
  },

  // ===== DUES MANAGEMENT (5 remaining keys) =====
  duesManagement: {
    alerts: {
      error: 'Error',
      ok: 'OK',
    },
    settings: {
      venmo: 'Venmo',
    },
    report: {
      totalColumn: 'Total',
    },
    countSuffix: '',
  },

  // ===== TOURNAMENT DETAIL (5 keys) =====
  tournamentDetail: {
    participantsSuffix: '',
    bestFinish: {
      champion: '🥇 Campeón',
      runnerUp: '🥈 Subcampeón',
      semiFinal: '🥉 Semifinalista',
      nthPlace: '{position}° lugar',
    },
  },

  // ===== RECORD SCORE (5 keys) =====
  recordScore: {
    set: 'Set',
    setN: 'Set {{n}}',
    alerts: {
      error: 'Error',
      confirm: 'OK',
      globalRanking: 'Global',
    },
  },

  // ===== MATCH REQUEST (5 keys) =====
  matchRequest: {
    schedule: {
      oneHour: '1 hora',
      twoHours: '2 horas',
      threeHours: '3 horas',
    },
    court: {
      perHour: '/hora',
    },
    sendButton: 'Enviar Solicitud de Partido',
  },

  // ===== CLUB COMMUNICATION (5 keys) =====
  clubCommunication: {
    timeAgo: {
      minutesAgo: 'hace {count} minutos',
      hoursAgo: 'hace {count} horas',
      daysAgo: 'hace {count} días',
      monthsAgo: 'hace {count} meses',
      yearsAgo: 'hace {count} años',
    },
  },

  // ===== UNITS (4 keys) =====
  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },

  // ALL remaining small sections (4 keys or less each)
  clubFeed: {
    header: {
      title: 'Feed del Club',
      emptyMessage: 'Aún no hay publicaciones',
    },
  },

  createPost: {
    placeholder: '¿Qué está pasando?',
    post: 'Publicar',
    posting: 'Publicando...',
  },

  friendList: {
    title: 'Amigos',
    noFriends: 'Aún no hay amigos',
    search: 'Buscar',
  },

  leagueSchedule: {
    title: 'Calendario',
    noMatches: 'Sin partidos programados',
  },

  matchDetailScreen: {
    loading: 'Cargando...',
    error: 'Error al cargar',
    details: 'Detalles del Partido',
  },

  partnerInvitation: {
    title: 'Invitación de Compañero',
    accept: 'Aceptar',
    decline: 'Rechazar',
  },

  quickMatch: {
    title: 'Partido Rápido',
    challenge: 'Desafiar',
    finding: 'Buscando oponente...',
  },

  scoreInput: {
    player1: 'Jugador 1',
    player2: 'Jugador 2',
    submit: 'Enviar',
  },

  trophyCase: {
    title: 'Vitrina de Trofeos',
    noTrophies: 'Aún no hay trofeos',
  },

  verification: {
    title: 'Verificación',
    code: 'Código',
    verify: 'Verificar',
  },

  weather: {
    temperature: 'Temperatura',
    conditions: 'Condiciones',
    forecast: 'Pronóstico',
  },

  notifications: {
    new: 'Nuevo',
    read: 'Leído',
    markAllRead: 'Marcar todo como leído',
  },

  search: {
    placeholder: 'Buscar...',
    noResults: 'Sin resultados',
    recent: 'Recientes',
  },

  filters: {
    all: 'Todos',
    active: 'Activos',
    completed: 'Completados',
  },

  messages: {
    new: 'Nuevo mensaje',
    noMessages: 'Sin mensajes',
    typing: 'escribiendo...',
  },

  calendar: {
    today: 'Hoy',
    week: 'Semana',
    month: 'Mes',
  },

  stats: {
    total: 'Total',
    average: 'Promedio',
    best: 'Mejor',
  },

  loading: {
    default: 'Cargando...',
    please_wait: 'Por favor espera...',
  },

  errors: {
    network: 'Error de red',
    unknown: 'Error desconocido',
    tryAgain: 'Intenta nuevamente',
  },

  buttons: {
    submit: 'Enviar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
    confirm: 'Confirmar',
    back: 'Atrás',
    next: 'Siguiente',
    done: 'Listo',
  },

  time: {
    justNow: 'Justo ahora',
    minute: 'minuto',
    minutes: 'minutos',
    hour: 'hora',
    hours: 'horas',
    day: 'día',
    days: 'días',
    week: 'semana',
    weeks: 'semanas',
    month: 'mes',
    months: 'meses',
    year: 'año',
    years: 'años',
  },

  status: {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    completed: 'Completado',
    cancelled: 'Cancelado',
  },

  actions: {
    view: 'Ver',
    edit: 'Editar',
    delete: 'Eliminar',
    share: 'Compartir',
    copy: 'Copiar',
    download: 'Descargar',
    upload: 'Subir',
  },

  validation: {
    required: 'Campo requerido',
    invalid: 'Valor inválido',
    tooShort: 'Muy corto',
    tooLong: 'Muy largo',
    emailInvalid: 'Email inválido',
    passwordWeak: 'Contraseña débil',
  },

  empty: {
    noData: 'Sin datos',
    noResults: 'Sin resultados',
    noItems: 'Sin elementos',
  },
};

// Main execution
console.log('🇪🇸 Spanish Translation Script - Round 6 ULTIMATE FINAL\n');

const beforeCount = countUntranslated(en, es);
console.log(`📊 Untranslated keys BEFORE: ${beforeCount}\n`);

const updatedEs = deepMerge(es, translations);
fs.writeFileSync(ES_PATH, JSON.stringify(updatedEs, null, 2) + '\n', 'utf8');

const afterCount = countUntranslated(en, updatedEs);
const translated = beforeCount - afterCount;

console.log(`✅ Translation complete!`);
console.log(`📝 Keys translated in Round 6: ${translated}`);
console.log(`📊 Remaining untranslated: ${afterCount}\n`);

// Calculate total across all rounds
const totalTranslated = 1039 - afterCount;
console.log(`\n🎯 ULTIMATE TRANSLATION REPORT:`);
console.log(`   ═══════════════════════════════════`);
console.log(`   Round 2: 498 keys`);
console.log(`   Round 3: 191 keys`);
console.log(`   Round 4: 81 keys`);
console.log(`   Round 5: 74 keys`);
console.log(`   Round 6: ${translated} keys`);
console.log(`   ───────────────────────────────────`);
console.log(`   TOTAL: ${totalTranslated} keys translated ✨`);
console.log(`   Remaining: ${afterCount} keys`);
console.log(`   Completion: ${((totalTranslated / 1039) * 100).toFixed(1)}%`);
console.log(`   ═══════════════════════════════════\n`);

if (afterCount === 0) {
  console.log(`   🎉🎉🎉 100% COMPLETE! ALL KEYS TRANSLATED! 🎉🎉🎉\n`);
} else if (afterCount < 20) {
  console.log(`   ⚡ Almost there! Only ${afterCount} keys left!\n`);
} else if (afterCount < 100) {
  console.log(`   📝 Great progress! ${afterCount} keys remaining.\n`);
} else {
  console.log(`   📝 Good progress! ${afterCount} keys remaining.\n`);
}

process.exit(0);
