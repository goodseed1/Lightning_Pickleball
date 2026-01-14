const fs = require('fs');

// Comprehensive Portuguese (pt-BR) translations - Round 4
const translations = {
  services: {
    event: {
      matchesFoundMessage: '🎾 Encontradas {{count}} partidas!',
      playerCount: '   👥 {{current}}/{{max}} jogadores',
    },
    match: {
      participantNotFound: 'Informações do participante não encontradas.',
      invalidEventType: 'Tipo de evento {{eventType}} deve usar formato {{expectedFormat}}.',
      matchNotFound: 'Partida não encontrada.',
      onlyParticipantCanSubmit: 'Apenas participantes da partida podem enviar placares.',
      noPermissionToConfirm: 'Você não tem permissão para confirmar este placar.',
      notDisputed: 'Esta partida não está em status contestado.',
    },
    activity: {
      loginRequired: 'Você deve estar logado',
      onlyOwnApplication: 'Você só pode aceitar sua própria inscrição',
      applicationNotFound: 'Inscrição não encontrada',
      invalidApplication: 'Inscrição inválida',
      teamMergeFailed: 'Falha ao mesclar equipe. Por favor, tente novamente.',
      onlyInvitedUser: 'Apenas usuários convidados podem responder',
      eventNotFound: 'Evento não encontrado',
      alreadyProcessed: 'Convite já foi processado',
      inviteResponseFailed: 'Falha ao responder convite. Por favor, tente novamente.',
      pickleballUserFallback: 'PickleballUser{{id}}',
      notifications: {
        applicationSubmittedTitle: 'Nova Solicitação de Participação',
        applicationApprovedTitle: 'Participação Aprovada!',
        applicationDeclinedTitle: 'Solicitação de Participação Recusada',
        playoffsQualifiedTitle: '🏆 Classificado para Playoffs!',
        defaultTitle: 'Notificação',
        applicationSubmittedMessage: '{{applicantName}} solicitou participar de "{{eventTitle}}".',
        applicationApprovedMessage: 'Sua participação em "{{eventTitle}}" foi aprovada!',
        applicationDeclinedMessage:
          'Sua solicitação de participação em "{{eventTitle}}" foi recusada.',
        playoffsQualifiedMessage:
          'Parabéns! Você se classificou para os playoffs de "{{leagueName}}"!',
        defaultMessage: 'Você tem uma nova atualização de atividade.',
        defaultLeagueName: 'Liga',
      },
    },
    camera: {
      permissionTitle: 'Permissão de Câmera Necessária',
      permissionMessage: 'Permissão de câmera é necessária para tirar fotos de perfil.',
      galleryPermissionTitle: 'Permissão de Galeria Necessária',
      galleryPermissionMessage: 'Permissão de acesso à galeria é necessária para selecionar fotos.',
      galleryPermissionIosMessage:
        'Por favor, verifique as permissões do app em Ajustes > Privacidade e Segurança > Fotos.',
      openSettings: 'Abrir Ajustes',
      permissionError: 'Ocorreu um erro ao solicitar permissões.',
      photoError: 'Ocorreu um erro ao tirar foto.',
      galleryAccessError: 'Erro de Acesso à Galeria',
      simulatorError:
        'Houve um problema ao acessar a galeria no simulador iOS. Por favor, teste em um dispositivo real.',
      galleryPickError: 'Ocorreu um erro ao selecionar foto da galeria.',
      selectPhoto: 'Selecionar Foto',
      selectPhotoMessage: 'Como você gostaria de selecionar uma foto?',
      camera: 'Câmera',
      gallery: 'Galeria',
      notice: 'Aviso',
      gallerySaveNotice: 'Recurso de salvar na galeria está disponível na versão da App Store.',
      fileSizeError: 'Tamanho de Arquivo Excedido',
      fileSizeMessage: 'Por favor, selecione uma imagem com menos de 5MB.',
    },
    location: {
      permissionTitle: 'Permissão de Localização Necessária',
      permissionMessage:
        'Permissão de localização é necessária para encontrar jogadores próximos. Por favor, permita nas configurações.',
      permissionDenied: 'Permissão de Localização Negada',
      permissionDeniedMessage:
        'Por favor, habilite permissão de localização nas configurações para usar este recurso.',
      locationError: 'Erro de Localização',
      locationErrorMessage: 'Não foi possível obter sua localização. Por favor, tente novamente.',
      locationUnavailable: 'Localização Indisponível',
      locationUnavailableMessage: 'Serviços de localização não estão disponíveis no momento.',
    },
    chat: {
      sendError: 'Falha ao enviar mensagem',
      loadError: 'Falha ao carregar mensagens',
      emptyMessage: 'A mensagem não pode estar vazia',
      messageTooLong: 'Mensagem muito longa',
      messageTooLongMessage: 'Por favor, limite sua mensagem a {{maxLength}} caracteres.',
    },
    matchmaking: {
      noPlayersFound: 'Nenhum jogador encontrado',
      searchError: 'Erro ao buscar jogadores',
      requestSent: 'Solicitação enviada',
      requestCancelled: 'Solicitação cancelada',
      requestAccepted: 'Solicitação aceita',
      requestDeclined: 'Solicitação recusada',
    },
  },
  duesManagement: {
    tabs: {
      status: 'Status',
    },
    alerts: {
      ok: 'OK',
      enableAutoInvoice: 'Habilitar Fatura Automática',
      completed: 'Concluído',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      deleted: 'Excluído',
      added: 'Adicionado',
      done: 'Feito',
      notice: 'Aviso',
      uploadComplete: 'Upload Concluído',
      uploadFailed: 'Falha no Upload',
      permissionRequired: 'Permissão Necessária',
    },
    messages: {
      autoInvoiceFailed: 'Falha ao atualizar configuração de fatura automática.',
      missingSettings:
        "Para habilitar fatura automática, configure o seguinte:\n\n• {{items}}\n\nPor favor, configure na seção 'Configurações de Mensalidade' acima.",
      autoInvoiceConfirm:
        'Faturas serão enviadas automaticamente no dia {{day}} de cada mês.\n(Data de Vencimento: {{dueDate}} de cada mês)\n\nDeseja habilitar?',
      settingsSaved: 'Configurações de mensalidade foram atualizadas com sucesso.',
      loadError:
        'Falha ao carregar dados de gerenciamento de mensalidades. Por favor, tente novamente.',
      loadingData: 'Não foi possível carregar dados de mensalidade.',
      paymentReminderConfirm:
        'Enviar lembrete de pagamento para todos os membros com pagamentos atrasados?',
      paymentReminderSent: 'Notificação de lembrete foi enviada para {{count}} membro(s).',
      memberNotFound: 'Membro não encontrado.',
      paymentMarkedPaid: 'Marcado como pago com sucesso.',
      paymentApproved: 'Pagamento foi aprovado.',
      paymentRejected: 'Pagamento foi rejeitado.',
      lateFeeAdded: 'Multa por atraso foi adicionada.',
      lateFeeDeleted: 'Multa por atraso foi excluída.',
      joinFeeDeleted: 'Taxa de entrada foi excluída.',
      exemptionRemoved: 'Isenção foi removida.',
      exemptionSet: 'Membro definido como isento.',
      recordCreated: 'Registro foi criado.',
      imageUploaded: 'Código QR enviado com sucesso.',
      uploadError: 'Falha no upload. Por favor, tente novamente.',
      galleryPermission: 'Permissão de galeria necessária para carregar imagens.',
      receiptVerificationConfirm: 'Aprovar este comprovante de pagamento?',
      receiptDeleteConfirm: 'Excluir este comprovante de pagamento?',
      markPaidConfirm: 'Marcar como pago para {{month}}?',
      lateFeeConfirm: 'Adicionar multa por atraso de {{amount}}?',
      deleteLateFeeConfirm: 'Excluir multa por atraso de {{amount}}?',
      deleteJoinFeeConfirm: 'Excluir taxa de entrada de {{amount}}?',
      exemptionToggleConfirm: 'Alternar status de isenção?',
      historyDeleteConfirm: 'Excluir este registro de pagamento?',
      uploadQRCodePrompt: 'Carregar código QR de transferência bancária.',
    },
    labels: {
      filter: 'Filtrar',
      all: 'Todos',
      paid: 'Pago',
      pending: 'Pendente',
      overdue: 'Atrasado',
      exempt: 'Isento',
      duesEnabled: 'Mensalidades Habilitadas',
      monthlyDues: 'Mensalidade Mensal',
      invoiceDate: 'Data da Fatura',
      dueDate: 'Data de Vencimento',
      gracePeriod: 'Período de Carência',
      days: 'dias',
      autoInvoice: 'Fatura Automática',
      paymentMethod: 'Método de Pagamento',
      qrCode: 'Código QR',
      lateFee: 'Multa por Atraso',
      joinFee: 'Taxa de Entrada',
      exemptionNote: 'Nota de Isenção',
      paymentHistory: 'Histórico de Pagamentos',
      date: 'Data',
      amount: 'Valor',
      method: 'Método',
      status: 'Status',
      receipt: 'Comprovante',
      note: 'Nota',
      member: 'Membro',
      month: 'Mês',
      year: 'Ano',
      total: 'Total',
      balance: 'Saldo',
      lastPayment: 'Último Pagamento',
      nextDue: 'Próximo Vencimento',
    },
    buttons: {
      sendReminder: 'Enviar Lembrete',
      saveDuesSettings: 'Salvar Configurações',
      uploadQRCode: 'Carregar Código QR',
      approve: 'Aprovar',
      reject: 'Rejeitar',
      markPaid: 'Marcar como Pago',
      addLateFee: 'Adicionar Multa',
      removeLateFee: 'Remover Multa',
      removeJoinFee: 'Remover Taxa de Entrada',
      setExemption: 'Definir Isenção',
      removeExemption: 'Remover Isenção',
      addRecord: 'Adicionar Registro',
      deleteRecord: 'Excluir Registro',
      viewReceipt: 'Ver Comprovante',
      exportData: 'Exportar Dados',
    },
  },
  clubLeaguesTournaments: {
    status: {
      playoffs: 'Playoffs',
    },
    labels: {
      status: 'Status',
    },
    modals: {
      selectPartnerInstructions: 'Selecione um parceiro do clube para formar uma equipe.',
      searchPartner: 'Buscar parceiro...',
      loadingPartners: 'Carregando parceiros...',
      noMembersFound: 'Nenhum membro encontrado',
      applyToLeague: 'Inscrever-se na Liga',
      invitePartner: 'Convidar Parceiro',
      teamDetails: 'Detalhes da Equipe',
      confirmApplication: 'Confirmar Inscrição',
      cancelApplication: 'Cancelar Inscrição',
    },
    memberPreLeagueStatus: {
      statusPending: 'Pendente',
      statusPendingSubtitle: 'Aguardando aprovação do administrador',
      statusApproved: 'Aprovado',
      statusApprovedSubtitle: 'Sua inscrição foi aprovada',
      statusRejected: 'Rejeitado',
      statusRejectedSubtitle: 'Sua inscrição foi rejeitada',
      applyAsIndividual: 'Inscrever-se Individualmente',
      applyAsTeam: 'Inscrever-se como Equipe',
      waitingForPartner: 'Aguardando parceiro aceitar convite',
      partnerAccepted: 'Parceiro aceitou convite',
      partnerDeclined: 'Parceiro recusou convite',
      invitationExpired: 'Convite expirado',
    },
    registration: {
      open: 'Inscrições Abertas',
      closed: 'Inscrições Fechadas',
      full: 'Lotado',
      deadline: 'Prazo: {{date}}',
      fee: 'Taxa: {{amount}}',
      free: 'Gratuito',
      spots: '{{available}}/{{total}} vagas',
      waitlist: 'Lista de Espera',
      registerNow: 'Inscrever-se Agora',
      withdrawRegistration: 'Retirar Inscrição',
      viewDetails: 'Ver Detalhes',
    },
    matchSchedule: {
      upcoming: 'Próximas',
      today: 'Hoje',
      thisWeek: 'Esta Semana',
      later: 'Mais Tarde',
      noMatches: 'Nenhuma partida agendada',
      viewSchedule: 'Ver Programação',
      reportScore: 'Informar Placar',
    },
  },
  leagueDetail: {
    generateBpaddleMessageSimple: 'Tem certeza de que deseja gerar a chave?',
    bpaddleGeneratedSuccess: 'Chave gerada com sucesso',
    bpaddleGenerateError: 'Erro ao gerar chave',
    bpaddleDeletedSuccess: 'Chave excluída com sucesso',
    bpaddleDeleteError: 'Erro ao excluir chave',
    startPlayoffs: 'Iniciar Playoffs',
    playoffsStartedSuccess: 'Playoffs iniciados com sucesso',
    playoffsStartError: 'Erro ao iniciar playoffs',
    playoffMatchErrorMessage: 'Erro ao criar partidas de playoff',
    playoffResultUpdated: 'Resultado de playoff atualizado',
    playoffResultUpdateError: 'Erro ao atualizar resultado de playoff',
    advanceToNextRound: 'Avançar para Próxima Rodada',
    eliminationConfirm: 'Confirmar Eliminação',
    backToRegularSeason: 'Voltar para Temporada Regular',
    finalStandings: 'Classificação Final',
    playoffBpaddle: 'Chave de Playoff',
    semifinals: 'Semifinais',
    finals: 'Final',
    thirdPlace: 'Terceiro Lugar',
    champion: 'Campeão',
    runnerUp: 'Vice-campeão',
    viewPlayoffs: 'Ver Playoffs',
    editPlayoffs: 'Editar Playoffs',
    resetPlayoffs: 'Redefinir Playoffs',
    completePlayoffs: 'Concluir Playoffs',
    playoffRules: 'Regras de Playoff',
    seedingMethod: 'Método de Classificação',
    byStandings: 'Por Classificação',
    byWinPercentage: 'Por Percentual de Vitórias',
    manual: 'Manual',
    numberOfRounds: 'Número de Rodadas',
    bestOf: 'Melhor de {{games}}',
    singleElimination: 'Eliminação Simples',
    doubleElimination: 'Eliminação Dupla',
    topPlayersAdvance: 'Top {{count}} jogadores avançam',
    qualificationCriteria: 'Critérios de Classificação',
    minimumMatches: 'Mínimo de {{count}} partidas',
    winRequirement: 'Requer {{percent}}% de vitórias',
    tiebreaker: 'Critério de Desempate',
    headToHead: 'Confronto Direto',
    pointDifferential: 'Diferença de Pontos',
    totalPoints: 'Total de Pontos',
    random: 'Aleatório',
    playoffSettings: 'Configurações de Playoff',
    saveSettings: 'Salvar Configurações',
    cancelSettings: 'Cancelar',
    settingsSaved: 'Configurações salvas com sucesso',
    settingsSaveFailed: 'Falha ao salvar configurações',
    matchDetails: 'Detalhes da Partida',
    scheduledTime: 'Horário Agendado',
    court: 'Quadra',
    players: 'Jogadores',
    score: 'Placar',
    winner: 'Vencedor',
    loser: 'Perdedor',
    notStarted: 'Não Iniciado',
    inProgress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    postponed: 'Adiado',
  },
  clubTournamentManagement: {
    matchInfo: {
      skill: 'Habilidade',
      registered: 'Inscrito',
      seed: 'Cabeça de Chave',
      unseeded: 'Sem Classificação',
      rank: 'Classificação',
      points: 'Pontos',
    },
    roundGeneration: {
      cannotGenerateTitle: 'Não é Possível Gerar Rodada',
      nextRoundTitle: 'Gerar Próxima Rodada',
      confirmMessage: 'Tem certeza de que deseja gerar a rodada {{round}}?',
      successTitle: 'Rodada Gerada',
      successMessage: 'Rodada {{round}} gerada com sucesso',
      errorTitle: 'Erro ao Gerar Rodada',
      errorMessage: 'Não foi possível gerar a rodada. Por favor, tente novamente.',
      incompleteRounds: 'Complete todas as partidas da rodada {{round}} antes de gerar a próxima.',
      noParticipants: 'Nenhum participante inscrito',
      invalidFormat: 'Formato de torneio inválido',
      bpaddleLocked: 'Chave bloqueada',
    },
    seedingDialog: {
      title: 'Atribuir Cabeças de Chave',
      subtitle: 'Arraste para reordenar participantes',
      autoSeed: 'Classificação Automática',
      randomSeed: 'Classificação Aleatória',
      manualSeed: 'Classificação Manual',
      save: 'Salvar Classificação',
      cancel: 'Cancelar',
      seedBy: 'Classificar por',
      rating: 'Classificação',
      ranking: 'Ranking',
      recentPerformance: 'Desempenho Recente',
      confirmSave: 'Confirmar classificação?',
      saved: 'Classificação salva com sucesso',
      saveFailed: 'Falha ao salvar classificação',
    },
    bpaddleView: {
      round1: 'Rodada 1',
      round2: 'Rodada 2',
      quarterfinals: 'Quartas de Final',
      semifinals: 'Semifinais',
      finals: 'Final',
      thirdPlace: 'Terceiro Lugar',
      champion: 'Campeão',
      tbd: 'A Definir',
      bye: 'Isento',
      walkover: 'WO',
      forfeit: 'Desistência',
      enterScore: 'Inserir Placar',
      editScore: 'Editar Placar',
      confirmScore: 'Confirmar Placar',
      disputeScore: 'Contestar Placar',
    },
    participantList: {
      title: 'Participantes',
      registered: 'Inscritos',
      waitlist: 'Lista de Espera',
      withdrawn: 'Desistentes',
      search: 'Buscar participante...',
      filter: 'Filtrar',
      sort: 'Ordenar',
      actions: 'Ações',
      approve: 'Aprovar',
      reject: 'Rejeitar',
      remove: 'Remover',
      contact: 'Contatar',
      viewProfile: 'Ver Perfil',
      noParticipants: 'Nenhum participante',
    },
  },
};

// Deep merge function
function deepMerge(target, source) {
  const output = Object.assign({}, target);

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Read current pt.json
const pt = JSON.parse(fs.readFileSync('src/locales/pt.json', 'utf8'));

// Merge translations
const updated = deepMerge(pt, translations);

// Write updated file
fs.writeFileSync('src/locales/pt.json', JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ Comprehensive Portuguese translations updated!');
console.log('\nSections translated:');
console.log('  - services: Additional ~50+ keys');
console.log('  - duesManagement: Additional ~50+ keys');
console.log('  - clubLeaguesTournaments: Additional ~40+ keys');
console.log('  - leagueDetail: Additional ~60+ keys');
console.log('  - clubTournamentManagement: Additional ~50+ keys');
console.log('\nTotal: ~250+ additional keys translated');
