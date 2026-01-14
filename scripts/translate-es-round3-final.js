#!/usr/bin/env node

/**
 * Spanish Translation Script - Round 3 FINAL
 * Complete all remaining translations
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

// Round 3 - Final translations
const translations = {
  // ===== CREATE CLUB LEAGUE (35 keys) =====
  createClubLeague: {
    headerTitle: 'Crear Nueva Liga',
    headerSubtitle: 'Inicia una liga con los miembros de tu club',
    matchTypeQuestion: '¿Qué tipo de partidos presentará esta liga?',
    mensSingles: 'Individuales Masculinos',
    mensSinglesDescription: 'Partidos 1v1 masculinos',
    womensSingles: 'Individuales Femeninos',
    womensSinglesDescription: 'Partidos 1v1 femeninos',
    mensDoubles: 'Dobles Masculinos',
    mensDoublesDescription: 'Partidos 2v2 masculinos',
    womensDoubles: 'Dobles Femeninos',
    womensDoublesDescription: 'Partidos 2v2 femeninos',
    mixedDoubles: 'Dobles Mixtos',
    mixedDoublesDescription: 'Partidos 2v2 mixtos',
    selectedInfo: 'Seleccionado',
    doublesNote: '(Dobles - Se requieren compañeros)',
    singlesNote: '(Individuales)',
    leagueInformation: 'Información de la Liga',
    seasonName: 'Nombre de Temporada *',
    seasonNamePlaceholder: 'ej., Liga {{eventType}} 2025',
    descriptionOptional: 'Descripción (Opcional)',
    descriptionPlaceholder: 'Ingresa una breve descripción de la liga',
    applicationDeadline: 'Fecha Límite de Solicitud *',
    startDate: 'Fecha de Inicio *',
    endDate: 'Fecha de Fin *',
    entryFee: 'Cuota de Inscripción',
    maxPlayers: 'Máximo de Jugadores',
    maxPlayersError:
      'El máximo de participantes debe ser al menos {{min}} (mínimo requerido para iniciar)',
    cancel: 'Cancelar',
    createLeague: 'Crear Liga',
    nameRequired: 'Por favor ingresa un nombre de temporada',
    deadlineBeforeStart: 'La fecha límite de solicitud debe ser en o antes de la fecha de inicio',
    endAfterStart: 'La fecha de fin debe ser en o después de la fecha de inicio',
    createSuccess: 'Liga creada exitosamente',
    createError: 'Error al crear liga',
    ok: 'OK',
  },

  // ===== HOSTED EVENT CARD (32 keys) =====
  hostedEventCard: {
    eventTypes: {
      match: 'Partido',
      practice: 'Práctica',
      tournament: 'Torneo',
      lightning: 'Partido',
      meetup: 'Reunión',
      casual: 'Casual',
      ranked: 'Clasificado',
      general: 'General',
    },
    buttons: {
      chat: 'Chat',
    },
    alerts: {
      error: 'Error',
    },
    weather: {
      conditions: {
        Clear: 'Despejado',
        Sunny: 'Soleado',
        'Partly Cloudy': 'Parcialmente Nublado',
        'Mostly Cloudy': 'Mayormente Nublado',
        Cloudy: 'Nublado',
        Overcast: 'Cubierto',
        Fog: 'Niebla',
        'Light Rain': 'Lluvia Ligera',
        Rain: 'Lluvia',
        'Heavy Rain': 'Lluvia Fuerte',
        Drizzle: 'Llovizna',
        Showers: 'Chubascos',
        Thunderstorm: 'Tormenta',
        Snow: 'Nieve',
        'Light Snow': 'Nevada Ligera',
        'Heavy Snow': 'Nevada Fuerte',
        Sleet: 'Aguanieve',
        Hail: 'Granizo',
        Windy: 'Ventoso',
        Humid: 'Húmedo',
        Hot: 'Caluroso',
        Cold: 'Frío',
      },
    },
  },

  // ===== CLUB POLICIES (29 keys) =====
  clubPolicies: {
    loading: 'Cargando información del club...',
    days: {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
    },
    sections: {
      introduction: 'Introducción del Club',
      facilities: 'Instalaciones',
      rules: 'Reglas del Club',
      meetings: 'Horarios de Reunión Regulares',
      fees: 'Información de Cuotas',
    },
    recurring: 'Recurrente',
    fees: {
      joinFee: 'Cuota de Inscripción',
      monthlyFee: 'Cuota Mensual',
      yearlyFee: 'Cuota Anual',
      dueDate: 'Fecha de Vencimiento',
      dueDateValue: '{{day}} de cada mes',
      lateFee: 'Cargo por Mora',
      paymentMethods: 'Métodos de Pago',
      qrHint: 'Toca un método de pago con ícono QR para ver el código QR',
    },
    buttons: {
      checkDues: 'Verificar y Pagar Mis Cuotas',
      membersOnly: 'Función Solo para Miembros',
    },
    empty: {
      title: 'No Hay Información Disponible',
      description:
        'Las reglas del club, horarios de reunión e información de cuotas aún no han sido configurados.',
    },
    qrModal: {
      title: 'Código QR de {{method}}',
      close: 'Cerrar',
    },
    defaultClubName: 'Club',
  },

  // ===== ALERT (24 keys) =====
  alert: {
    title: {
      error: 'Error',
    },
    tournamentBracket: {
      errorLoadingData: 'Error al cargar datos del torneo',
      matchNotFound: 'Partido no encontrado',
      matchResult: 'Resultado del Partido',
      info: 'Información',
      onlyParticipantsCanEnterScore:
        'Solo los participantes del partido o administradores del torneo pueden ingresar marcadores',
      matchInfo: 'Info del Partido',
      scoreSubmitted: 'Marcador Enviado',
      scoreSubmittedSuccess: 'El resultado del partido ha sido enviado exitosamente.',
      errorSubmittingScore: 'Error al enviar marcador del partido.',
      loadingBracket: 'Cargando cuadro...',
      tournamentNotFound: 'Torneo no encontrado',
      bracketNotGenerated: 'Cuadro aún no generado',
      bracketWillBeGenerated: 'El cuadro se generará después de cerrar la inscripción',
      generatingBracket: 'Generando Cuadro',
      inProgress: 'En Progreso',
      completed: 'Completado',
      participants: 'Participantes',
      matches: 'Partidos',
      participantsTab: 'Participantes',
      standings: 'Clasificación',
      tournamentParticipants: 'Participantes del Torneo',
      seed: 'Cabeza de Serie',
      noParticipants: 'Aún no hay participantes',
    },
  },

  // ===== FIND CLUB (24 keys) =====
  findClub: {
    title: 'Buscar Club',
    searching: 'Buscando clubes...',
    searchPlaceholder: 'Buscar por nombre de club, ubicación...',
    searchResults: "Resultados de búsqueda para '{{query}}': {{count}}",
    totalClubs: 'Total de clubes: {{count}}',
    joinRequest: 'Solicitud de Unión al Club',
    joinConfirm: '¿Te gustaría solicitar unirte a {{clubName}}?',
    joinButton: 'Solicitar',
    joinSuccess:
      'Solicitud de unión enviada. Por favor espera la aprobación del administrador del club.',
    labels: {
      public: 'Público',
      memberCount: '{{current}}/{{max}} miembros',
    },
    status: {
      join: 'Solicitar Unirse',
      joined: 'Unido',
      pending: 'Pendiente de Aprobación',
      declined: 'Solicitud Rechazada',
    },
    errors: {
      loadFailed: 'Error al cargar la lista de clubes.',
      loginRequired: 'Inicio de sesión requerido.',
      alreadyMember: 'Ya eres miembro de este club.',
      alreadyRequested: 'Ya has solicitado unirte.',
      joinFailed: 'Ocurrió un error al solicitar unirse.',
    },
    empty: {
      noResults: 'Sin resultados de búsqueda',
      noClubs: 'No hay clubes públicos disponibles',
      tryDifferent: 'Intenta un término de búsqueda diferente',
      createNew: 'Crear un nuevo club',
    },
  },

  // ===== MODALS (23 keys) =====
  modals: {
    tournamentCompleted: {
      title: '¡Victoria del Torneo!',
      winner: 'Ganador',
      runnerUp: 'Subcampeón',
      close: 'Cerrar',
      viewFeed: 'Ver Feed del Club',
    },
    leagueCompleted: {
      title: '¡Liga Completada!',
      winner: 'Ganador',
      runnerUp: 'Subcampeón',
      points: 'pts',
      close: 'Cerrar',
      viewFeed: 'Ver Feed del Club',
    },
    playoffCreated: {
      title: '¡Playoff Creado!',
      close: 'Cerrar',
      viewMatches: 'Ver Partidos de Playoff',
      playoffType: 'Formato de Playoff',
      final: 'Final',
      semifinals: 'Semifinales + Final',
      qualifiedPlayers: '🎉 Jugadores Clasificados',
    },
    publicMatchScore: {
      noApprovedParticipants:
        'No hay participantes aprobados. Por favor aprueba participantes antes de enviar marcador.',
      submitSuccess: 'El resultado del partido ha sido guardado.',
      submitSuccessFriendly:
        'El resultado del partido ha sido guardado.\n\n⚠️ Este fue un partido amistoso y no afectará ELO/tasa de victoria.',
      submitError: 'Error al enviar marcador.',
    },
    chatUI: {
      inputPlaceholder: 'Escribe un mensaje...',
    },
  },

  // ===== RATE SPORTSMANSHIP (22 keys) =====
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
    honorTags: {
      sharpEyed: '#OjoAgudo',
      fullOfEnergy: '#LlenoDeEnergía',
      mrManner: '#SrModales',
      punctualPro: '#ProPuntual',
      mentalFortress: '#FortalezaMental',
      courtJester: '#BufónDeCancha',
    },
    alerts: {
      error: 'Error',
      noParticipants: 'No hay participantes para calificar',
      alreadyRated: 'Ya has calificado a este participante',
      selectAtLeastOne: 'Por favor selecciona al menos una etiqueta',
      ratingSuccess: 'Calificación enviada exitosamente',
      ratingError: 'Error al enviar calificación',
      notParticipant: 'No eres participante de este evento',
      eventNotFound: 'Evento no encontrado',
      loginRequired: 'Inicio de sesión requerido',
    },
  },

  // ===== POST DETAIL (20 keys) =====
  postDetail: {
    error: 'Error',
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

  // ===== CREATE MEETUP (18 keys) =====
  createMeetup: {
    errors: {
      errorTitle: 'Error',
    },
    success: {
      copied: '¡La reunión ha sido copiada!',
      created: '¡Nueva reunión ha sido creada!',
      updated: '¡La reunión ha sido actualizada!',
      createdAndPublished: '¡Nueva reunión ha sido creada y publicada!',
      updatedAndPublished: '¡La reunión ha sido actualizada y publicada!',
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

  // Continuing with remaining smaller sections...
  // ===== HALL OF FAME (17 keys) =====
  hallOfFame: {
    subtitle: 'Tus logros y honores',
    loading: 'Cargando logros...',
    emptyState: '¡Aún no hay logros. Comienza a jugar para ganar trofeos e insignias!',
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

  // ===== BADGE GALLERY (14+ keys) =====
  badgeGallery: {
    badges: {
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
};

// Main execution
console.log('🇪🇸 Spanish Translation Script - Round 3 FINAL\n');

const beforeCount = countUntranslated(en, es);
console.log(`📊 Untranslated keys BEFORE: ${beforeCount}\n`);

const updatedEs = deepMerge(es, translations);
fs.writeFileSync(ES_PATH, JSON.stringify(updatedEs, null, 2) + '\n', 'utf8');

const afterCount = countUntranslated(en, updatedEs);
const translated = beforeCount - afterCount;

console.log(`✅ Translation complete!`);
console.log(`📝 Keys translated: ${translated}`);
console.log(`📊 Remaining untranslated: ${afterCount}\n`);

console.log(`📦 Sections translated in Round 3: ${Object.keys(translations).length}`);

process.exit(0);
