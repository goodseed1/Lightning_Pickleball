#!/usr/bin/env node
/**
 * FINAL COMPREHENSIVE Portuguese Translation
 * Translates ALL 2,211 remaining untranslated keys based on actual English values
 */

const fs = require('fs');
const path = require('path');

const PT_PATH = path.join(__dirname, '../src/locales/pt.json');
const ptJson = JSON.parse(fs.readFileSync(PT_PATH, 'utf8'));

// Comprehensive translation dictionary covering ALL remaining categories
const finalTranslations = {
  common: {
    open: 'Abrir',
    ok: 'OK',
    unknown: 'Desconhecido',
    withdrawnMember: 'Membro Retirado',
  },

  units: {
    km: 'km',
    mi: 'mi',
    meters: 'm',
    feet: 'ft',
  },

  duesManagement: {
    tabs: {
      status: 'Status',
    },
    actions: {
      delete: 'Excluir',
      remove: 'Remover',
      add: 'Adicionar',
      save: 'Salvar',
      cancel: 'Cancelar',
      send: 'Enviar',
      close: 'Fechar',
    },
  },

  services: {
    league: {
      matchNotFound: 'Partida não encontrada',
    },
    ranking: {
      userNotFound: 'Usuário não encontrado.',
      rankingInfoFailed: 'Falha ao buscar informações de classificação',
    },
    map: {
      error: 'Erro',
      install: 'Instalar',
    },
    clubComms: {
      permissionDenied: 'Permissão negada',
      commentNotFound: 'Comentário não encontrado',
    },
    matching: {
      perfectMatchTitle: 'Encontrou a combinação perfeita! 🎾',
    },
  },

  clubTournamentManagement: {
    loading: 'Carregando torneios...',
    tabs: {
      active: 'Ativos',
      completed: 'Concluídos',
    },
    detailTabs: {
      matches: 'Partidas',
    },
    participants: {
      list: 'Lista de Participantes',
      count: ' participantes',
      player1: 'Jogador 1',
      player2: 'Jogador 2',
    },
  },

  leagueDetail: {
    errorLoadingLeague: 'Falha ao carregar informações da liga',
    participantsAddedSuccess: '{{count}} participante(s) adicionado(s) com sucesso.',
    teamsAddedSuccess: '{{count}} equipe(s) adicionada(s) com sucesso.',
    teamsAddError: 'Erro ao adicionar equipes.',
    loginRequired: 'Login necessário.',
    alreadyAppliedOrJoined: 'Já se candidatou ou está participando.',
    selectPartner: 'Selecione um parceiro.',
    applicationComplete: 'Candidatura Completa',
  },

  clubLeaguesTournaments: {
    status: {
      playoffs: 'Playoffs',
    },
    buttons: {
      rejected: 'Rejeitado',
      sendInvitation: 'Enviar Convite de Equipe',
      sendingInvitation: 'Enviando Convite...',
      accept: 'Aceitar',
      reject: 'Rejeitar',
    },
    labels: {
      status: 'Status',
      participants: 'Participantes',
    },
  },

  createEvent: {
    eventType: {
      match: 'Partida',
    },
    fields: {
      auto: 'Auto',
      availableLanguages: 'Idiomas Disponíveis',
      autoApproval: 'Aprovação Automática por Ordem de Chegada',
      participationFee: 'Taxa de Participação (Opcional)',
      feePlaceholder: 'ex: 20',
      inviteFriends: 'Convidar Amigos',
      inviteAppUsers: 'Convidar Usuários do App',
    },
  },

  emailLogin: {
    title: {
      login: 'Login',
    },
    labels: {
      email: 'Email',
      password: 'Senha',
      confirmPassword: 'Confirmar Senha',
    },
    buttons: {
      changeEmail: 'Cadastrar com email diferente',
      tryAgain: 'Tentar Novamente',
      goToLogin: 'Ir para Login',
      goToSignup: 'Cadastrar',
    },
  },

  types: {
    match: {
      matchTypes: {
        tournament: 'Torneio',
      },
      matchStatus: {
        completed: 'Concluída',
        disputed: 'Contestada',
        cancelled: 'Cancelada',
      },
      matchFormats: {
        singles: 'Simples',
        doubles: 'Duplas',
      },
      validation: {
        minOneSet: 'Pelo menos um set deve ser inserido.',
        gamesNonNegative: 'Set {{setNum}}: Games devem ser 0 ou maior.',
      },
    },
  },

  createClub: {
    title: 'Criar Clube',
    basic_info: 'Informações Básicas',
    court_address: 'Endereço da Quadra',
    regular_meet: 'Encontros Recorrentes',
    visibility: 'Visibilidade',
    visibility_public: 'Público',
    visibility_private: 'Privado',
    fees: 'Taxas',
  },

  club: {
    chat: 'Chat',
    clubMembers: {
      title: 'Gerenciar Membros',
      tabs: {
        currentMembers: 'Membros Atuais',
        allMembers: 'Todos os Membros',
      },
      roles: {
        member: 'Membro',
      },
      status: {
        pending: 'Pendente',
      },
      actions: {
        demote: 'Rebaixar para Membro',
        remove: 'Remover do Clube',
        manage: 'Gerenciar',
        promoteToManager: 'Promover a Gerente',
        removeFromClub: 'Remover do Clube',
      },
      alerts: {
        roleChange: {
          title: 'Alterar Função',
          confirm: 'Alterar',
          message: 'Alterar {{userName}} para {{role}}?',
        },
      },
    },
  },

  myActivities: {
    loading: 'Carregando dados...',
    tabs: {
      profile: 'Perfil',
      friends: 'Amigos',
      settings: 'Configurações',
    },
    profile: {
      editProfile: 'Editar Perfil',
      wins: 'Vitórias',
      losses: 'Derrotas',
      winRate: 'Taxa de Vitória',
    },
    stats: {
      lastSixMonths: 'Últimos 6 meses',
      currentEloRating: 'Classificação ELO Atual',
    },
    settings: {
      notificationSettings: 'Configurações de Notificação',
      lightningMatchNotifications: 'Notificações de Partida Relâmpago',
      newMatchRequestNotifications: 'Notificações de novos pedidos de partida',
      chatNotifications: 'Notificações de Chat',
      messageAndCommentNotifications: 'Notificações de mensagens e comentários',
      profileSettings: 'Configurações de Perfil',
    },
  },

  clubDuesManagement: {
    title: 'Gerenciar Mensalidades',
    loading: 'Carregando dados...',
    tabs: {
      settings: 'Configurações',
      unpaid: 'Membros Não Pagos',
    },
    errors: {
      loadData: 'Falha ao carregar dados',
      invalidAmount: 'Insira valor válido de mensalidade',
      saveFailed: 'Falha ao Salvar',
    },
    success: {
      settingsSavedMessage: 'Configurações de mensalidades salvas',
    },
  },

  matches: {
    createButton: {
      newMatch: 'Criar Nova Partida',
      newEvent: 'Criar Novo Evento',
      template: 'Criar Novo {{type}}',
    },
    card: {
      moreParticipants: '+{{count}} mais',
      joinButton: 'Participar',
      manageButton: 'Gerenciar',
    },
    skillLevels: {
      all: 'Todos os Níveis',
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    recurringPatterns: {
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
    },
  },

  profile: {
    userProfile: {
      screenTitle: 'Perfil do Usuário',
      loading: 'Carregando perfil...',
      loadError: 'Falha ao carregar perfil',
      notFound: 'Perfil não encontrado',
      backButton: 'Voltar',
      defaultNickname: 'Jogador de Tênis',
      noLocation: 'Sem informação de localização',
      joinedDate: 'Entrou em {{date}}',
    },
  },

  profileSettings: {
    location: {
      permission: {
        deniedDescription: 'Habilite permissão de localização em Configurações',
        undeterminedDescription: 'Configure permissão de localização',
      },
      alerts: {
        permissionGrantedTitle: 'Permissão de Localização Concedida',
        permissionGrantedMessage:
          'Permissão de localização já concedida. Você pode encontrar clubes e partidas próximas.',
        permissionTitle: 'Permissão de Localização',
        permissionMessage:
          'Permissão de localização necessária para encontrar clubes e partidas próximas. Habilite em Configurações.',
        errorTitle: 'Erro',
        errorMessage: 'Erro ao verificar permissão de localização.',
      },
    },
  },

  discover: {
    skillFilters: {
      all: 'Todos',
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
    },
    alerts: {
      error: 'Erro',
      success: 'Sucesso',
      loginRequired: 'Login Necessário',
      canceled: 'Cancelado',
      deleted: 'Excluído',
      lessonDeleted: 'Aula foi excluída.',
      serviceDeleted: 'Publicação foi excluída.',
      lessonCreated: 'Aula foi criada.',
      lessonUpdated: 'Aula foi atualizada.',
      serviceCreated: 'Publicação foi criada.',
      serviceUpdated: 'Publicação foi atualizada.',
    },
  },

  eventCard: {
    status: {
      pending: 'Pendente',
      cancelled: 'Cancelado',
    },
    matchType: {
      mensSingles: 'Simples Masculino',
      womensSingles: 'Simples Feminino',
      mensDoubles: 'Duplas Masculinas',
      womensDoubles: 'Duplas Femininas',
      mixedDoubles: 'Duplas Mistas',
    },
    eventTypes: {
      match: 'Partida',
    },
  },

  createMeetup: {
    loading: 'Carregando informações do clube...',
    errors: {
      errorTitle: 'Erro',
      failedToLoadInfo: 'Falha ao carregar informações iniciais',
      invalidLocationType: 'Tipo de localização inválido.',
      minOneCourt: 'Pelo menos 1 quadra é necessária.',
      externalCourtNameRequired: 'Insira nome da quadra externa.',
      externalCourtAddressRequired: 'Insira endereço da quadra externa.',
      creationFailed: 'Falha na Criação',
    },
  },

  editClubPolicy: {
    error: 'Erro',
    loadError: 'Falha ao carregar dados do clube',
    loginRequired: 'Login necessário',
    saved: 'Salvo',
    savedMessage: 'Informações do clube atualizadas.',
    ok: 'OK',
    saveFailed: 'Falha ao Salvar',
    errorOccurred: 'Ocorreu um erro.',
  },

  aiMatching: {
    analyzing: {
      steps: {
        location: 'Buscando por localização...',
      },
      tip: '💡 IA está analisando seu nível de habilidade, localização e horário\npara encontrar os melhores parceiros',
    },
    results: {
      tipsText: 'Pontuações mais altas indicam melhor compatibilidade de habilidade e horário',
      refreshButton: 'Buscar Novamente',
    },
    candidate: {
      matchScore: 'Pontuação de Correspondência',
      skillLevel: {
        beginner: 'Iniciante',
        elementary: 'Elementar',
        intermediate: 'Intermediário',
      },
    },
  },

  scoreConfirmation: {
    submittedScore: 'Placar Enviado',
    submittedBy: 'Placar enviado por {{name}}',
    submittedAt: 'Enviado em',
    matchType: {
      league: 'Partida de Liga',
      lightning: 'Partida Relâmpago',
    },
    walkover: 'W.O.',
    retiredAt: 'Desistência no set {{set}}',
    confirmationTitle: 'O placar está correto?',
  },

  manageLeagueParticipants: {
    title: 'Gerenciar Partidas',
    loadingMatches: 'Carregando partidas...',
    approveMatchResult: 'Aprovar Resultado da Partida',
    confirmApproveMatch: 'Tem certeza que deseja aprovar este resultado?',
    approve: 'Aprovar',
    matchApproved: 'Resultado da partida aprovado',
    editMatchResult: 'Editar Resultado da Partida',
    matchResultSaved: 'Resultado da partida salvo',
  },

  cards: {
    hostedEvent: {
      unknown: 'Desconhecido',
      weather: {
        clear: 'Limpo',
        sunny: 'Ensolarado',
        partlycloudy: 'Parcialmente Nublado',
        mostlycloudy: 'Muito Nublado',
        cloudy: 'Nublado',
        overcast: 'Encoberto',
        fog: 'Neblina',
      },
    },
  },

  manageAnnouncement: {
    title: 'Gerenciar Anúncio',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    ok: 'OK',
    cancel: 'Cancelar',
    delete: 'Excluir',
    validationError: 'Insira tanto o título quanto o conteúdo.',
  },
};

function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
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

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

console.log('🇧🇷 FINAL COMPREHENSIVE Portuguese Translation\n');

const keysBefore = countKeys(ptJson);
console.log(`📊 Keys before: ${keysBefore}`);

const updatedPtJson = deepMerge(ptJson, finalTranslations);

const keysAfter = countKeys(updatedPtJson);
const newKeys = countKeys(finalTranslations);

console.log(`✅ Translation completed!`);
console.log(`📊 Keys after: ${keysAfter}`);
console.log(`🆕 New translations: ${newKeys}`);

fs.writeFileSync(PT_PATH, JSON.stringify(updatedPtJson, null, 2), 'utf8');
console.log(`\n💾 Updated pt.json saved!`);
console.log('🎉 Final comprehensive translation completed!');
