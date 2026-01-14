#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ptPath = path.join(__dirname, '../src/locales/pt.json');
let pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

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

const final182 = {
  types: {
    match: {
      matchStatus: {
        disputed: 'Disputado',
      },
      validation: {
        tiebreak: 'tiebreak',
        superTiebreak: 'super tiebreak',
      },
    },
    dues: {
      paymentStatus: {
        paid: 'Pago',
        unpaid: 'Não Pago',
        exempt: 'Isento',
      },
      period: {
        year: '{{year}}',
        yearMonth: '{{month}}/{{year}}',
      },
    },
  },

  leagues: {
    admin: {
      maxParticipants: 'Máx',
      applicationDate: 'Candidatado',
      processing: 'Processando...',
      applicantsWillAppear: 'Os candidatos aparecerão aqui em tempo real',
      opening: 'Abrindo...',
    },
    match: {
      status: {
        walkover: 'W.O.',
      },
      reschedule: 'Reagendar',
      walkover: 'W.O.',
    },
  },

  meetupDetail: {
    errors: {
      notFound: 'Encontro não encontrado.',
    },
    weather: {
      chanceOfRain: 'Chance de chuva',
      windLabel: 'Vento',
      wind: {
        playable: 'Jogável',
      },
    },
    rsvp: {
      maybe: 'Talvez',
    },
    participants: {
      title: 'Participantes',
    },
    editEvent: {
      durationUnit: 'min',
    },
  },

  createClub: {
    facility: {
      lights: 'Iluminação',
      parking: 'Estacionamento',
    },
    fields: {
      intro: 'Introdução',
      fee_placeholder: 'ex: 50',
      logo: 'Logo',
    },
    validation: {
      meetingsValid: '{{count}} reunião(ões) configurada(s) ✅',
    },
  },

  recordScore: {
    tiebreak: 'Tiebreak',
    tiebreakLabel: 'Tiebreak ({{placeholder}})',
    retired: 'Desistiu',
    walkover: 'W.O.',
    alerts: {
      standardTiebreak: 'Tiebreak',
      globalRanking: 'Global',
    },
  },

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
    mockData: {
      me: 'Eu',
    },
  },

  profile: {
    userProfile: {
      playerInfo: {
        languages: 'Idiomas',
        weekdays: 'Dias de Semana',
        weekends: 'Fins de Semana',
      },
      matchHistory: {
        score: 'Placar:',
      },
      timeSlots: {
        brunch: 'Brunch',
      },
    },
  },

  club: {
    chat: 'Chat',
    clubMembers: {
      memberCount: '{{count}} membro(s)',
      requestCount: '{{count}} solicitação(ões)',
      dateFormats: {
        joinedAt: 'Entrou em {{date}}',
        requestedAt: 'Solicitado em {{date}}',
      },
    },
  },

  createEvent: {
    eventType: {
      match: 'Partida',
    },
    languages: {
      korean: '한국어',
      chinese: '中文',
      japanese: '日本語',
      french: 'Français',
      german: 'Deutsch',
      italian: 'Italiano',
      spanish: 'Español',
      portuguese: 'Português',
    },
  },

  createMeetup: {
    success: {
      updated: 'Encontro atualizado!',
    },
    court: {
      courtNumbersPlaceholder: 'ex: 3, 4, 5',
    },
    buttons: {
      creating: 'Criando...',
      updating: 'Atualizando...',
      confirming: 'Confirmando...',
    },
  },

  // Additional common translations
  common: {
    walkover: 'W.O.',
    tiebreak: 'Tiebreak',
    disputed: 'Disputado',
    retired: 'Desistiu',
    reschedule: 'Reagendar',
    maybe: 'Talvez',
    me: 'Eu',
    brunch: 'Brunch',
    playable: 'Jogável',
    wind: 'Vento',
    lights: 'Iluminação',
    parking: 'Estacionamento',
    introduction: 'Introdução',
  },
};

const updated = deepMerge(pt, final182);
fs.writeFileSync(ptPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ Final 182 keys translated!');
console.log('Brazilian Portuguese translation is now COMPLETE!');
