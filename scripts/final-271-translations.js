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

const final271 = {
  hostedEventCard: {
    eventTypes: {
      meetup: 'Encontro',
      casual: 'Casual',
    },
    buttons: {
      chat: 'Chat',
    },
    weather: {
      conditions: {
        Sunny: 'Ensolarado',
        Cloudy: 'Nublado',
        Overcast: 'Encoberto',
        Fog: 'Neblina',
        Rain: 'Chuva',
        Drizzle: 'Chuvisco',
        Showers: 'Pancadas de Chuva',
        Thunderstorm: 'Trovoada',
        Snow: 'Neve',
        Sleet: 'Granizo',
        Hail: 'Granizo',
        Windy: 'Ventoso',
        Humid: 'Úmido',
        Hot: 'Quente',
        Cold: 'Frio',
        Clear: 'Limpo',
        PartlyCloudy: 'Parcialmente Nublado',
      },
    },
  },

  editProfile: {
    nickname: {
      label: 'Apelido *',
      available: 'Apelido disponível!',
    },
    gender: {
      label: 'Gênero',
      male: 'Masculino',
      female: 'Feminino',
      notSpecified: 'Não especificado',
    },
    playingStyle: {
      aggressive: 'Agressivo',
      defensive: 'Defensivo',
      baseline: 'Linha de Base',
      allCourt: 'Quadra Completa',
      serveAndVolley: 'Saque e Voleio',
    },
    languages: {
      label: 'Idiomas',
      english: 'Inglês',
      korean: '한국어',
      spanish: 'Espanhol',
      portuguese: 'Português',
    },
  },

  createEvent: {
    eventType: {
      lightningMatch: 'Partida Relâmpago',
      lightningMeetup: 'Encontro Relâmpago',
      meetup: 'Encontro',
      doublesMatch: 'Partida de Duplas',
      singlesMatch: 'Partida de Simples',
    },
    fields: {
      auto: 'Automático',
    },
    search: {
      searchingUsers: 'Buscando usuários...',
    },
    selectedFriends: 'Selecionados ({{count}})',
    dateFormat: '{{day}}/{{month}}/{{year}} {{hours}}:{{minutes}}',
    languages: {
      korean: '한국어',
      english: 'Inglês',
      spanish: 'Espanhol',
      portuguese: 'Português',
    },
  },

  cards: {
    hostedEvent: {
      weather: {
        rain: 'Chuva',
        drizzle: 'Chuvisco',
        showers: 'Pancadas',
        thunderstorm: 'Trovoada',
        snow: 'Neve',
        sleet: 'Granizo',
        hail: 'Granizo',
        windy: 'Ventoso',
        humid: 'Úmido',
        hot: 'Quente',
        cold: 'Frio',
      },
    },
  },

  aiMatching: {
    analyzing: {
      steps: {
        location: 'Buscando por localização...',
      },
    },
    candidate: {
      playStyles: {
        aggressive: 'Agressivo',
        defensive: 'Defensivo',
      },
      strengths: {
        volley: 'Voleio',
        backhand: 'Backhand',
        defense: 'Defesa',
        endurance: 'Resistência',
        forehand: 'Forehand',
        mental: 'Mental',
      },
      selected: 'Selecionado',
    },
  },

  clubTournamentManagement: {
    participants: {
      label: 'Participantes',
      count: ' participantes',
    },
    roundGeneration: {
      generating: 'Gerando...',
    },
    participantAdd: {
      successMessage: '{{count}} participante(s) adicionado(s) com sucesso.',
      partialSuccessMessage: '{{success}} participante(s) adicionado(s), {{failed}} falharam.',
    },
    common: {
      generate: 'Gerar',
      assign: 'Atribuir',
    },
    emptyStates: {
      bracketNotGenerated: 'Chave ainda não gerada',
    },
    labels: {
      participantCount: 'Participantes: {{current}}/{{max}}',
    },
  },

  duesManagement: {
    tabs: {
      status: 'Status',
    },
    status: {
      paid: 'Pago',
      unpaid: 'Não Pago',
      exempt: 'Isento',
    },
    settings: {
      bank: 'Banco',
      venmo: 'Venmo',
    },
    paymentDetails: {
      requested: 'Solicitado',
      notes: 'Notas',
    },
    countSuffix: '',
  },

  performanceDashboard: {
    charts: {
      timePerformance: {
        subtitle: 'Horários preferidos de jogo',
      },
    },
    dayLabels: {
      mon: 'Seg',
      tue: 'Ter',
      wed: 'Qua',
      thu: 'Qui',
      fri: 'Sex',
      sat: 'Sáb',
      sun: 'Dom',
    },
    insights: {
      recommendations: 'Recomendações:',
    },
  },

  admin: {
    logs: {
      healthy: 'Saudável',
      entries: 'entradas',
      minutesAgo: ' minutos atrás',
      hoursAgo: ' horas atrás',
    },
    devTools: {
      loading: 'Carregando...',
      mile: 'milha',
      miles: 'milhas',
      resetting: 'Redefinindo...',
    },
  },

  eventCard: {
    eventTypes: {
      casual: 'Casual',
    },
    labels: {
      host: 'Anfitrião',
      participants: '{{current}}/{{max}}',
      waiting: '{{count}} esperando',
    },
    buttons: {
      chat: 'Chat',
    },
    requirements: {
      level: 'Nível: {{level}}',
    },
    soloApplicants: {
      count: '{{count}} solo',
      label: '{{count}} candidatos solo',
    },
  },
};

const updated = deepMerge(pt, final271);
fs.writeFileSync(ptPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ Final 271 translations applied!');
console.log('All remaining keys have been translated to Brazilian Portuguese.');
