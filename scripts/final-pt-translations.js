const fs = require('fs');

// Final Brazilian Portuguese translations
const translations = {
  services: {
    activity: {
      tennisUserFallback: 'UsuárioTênis{{id}}',
    },
  },
  duesManagement: {
    report: {
      totalColumn: 'Total',
    },
    countSuffix: '',
  },
  clubLeaguesTournaments: {
    memberPreLeagueStatus: {
      peopleUnit: '',
      status: 'Status',
    },
  },
  leagueDetail: {
    applyingToLeague: 'Inscrevendo na liga...',
    user: 'Usuário',
    validation: {
      mensOnly: 'Este evento é apenas para homens',
      womensOnly: 'Este evento é apenas para mulheres',
      doublesNeedPartner: 'Duplas requerem um parceiro',
      mixedDoublesRequirement: 'Duplas mistas requerem parceiros de gêneros diferentes',
      genderRestriction: 'Restrição de gênero não atendida',
    },
    eventTypes: {
      mens_singles: 'Simples Masculino',
      womens_singles: 'Simples Feminino',
      mens_doubles: 'Duplas Masculinas',
      womens_doubles: 'Duplas Femininas',
      mixed_doubles: 'Duplas Mistas',
    },
  },
  clubTournamentManagement: {
    seedAssignment: {
      teamTitle: 'Atribuir Cabeças de Chave da Equipe',
      prompt: 'Arraste para atribuir classificação',
      duplicateTitle: 'Classificação Duplicada',
      duplicateMessage: 'Cada cabeça de chave deve ser única',
      errorTitle: 'Erro de Atribuição',
      errorMessage: 'Falha ao atribuir cabeças de chave. Tente novamente.',
      incompleteTitle: 'Atribuição Incompleta',
      incompleteMessage: 'Por favor, atribua cabeças de chave a todos os participantes',
      completeTitle: 'Atribuição Concluída',
      completeMessage: 'Cabeças de chave foram atribuídas com sucesso!',
      validationTitle: 'Erro de Validação',
      validationMessage: 'Por favor, corrija os seguintes erros:\n{{errors}}',
      resetConfirmTitle: 'Redefinir Classificação',
      resetConfirmMessage: 'Tem certeza de que deseja redefinir todas as cabeças de chave?',
      reset: 'Redefinir',
      confirmSave: 'Salvar Classificação?',
      confirmSaveMessage: 'Tem certeza de que deseja salvar esta atribuição de cabeças de chave?',
      autoAssignConfirm: 'Atribuir Automaticamente?',
      autoAssignMessage: 'Atribuir automaticamente cabeças de chave com base na classificação?',
      autoAssignSuccess: 'Cabeças de chave atribuídas automaticamente',
      autoAssignError: 'Erro na atribuição automática',
    },
    participantManagement: {
      title: 'Gerenciar Participantes',
      addParticipant: 'Adicionar Participante',
      removeParticipant: 'Remover Participante',
      confirmRemove: 'Remover {{name}} do torneio?',
      removeSuccess: 'Participante removido com sucesso',
      removeError: 'Erro ao remover participante',
      approveRegistration: 'Aprovar Inscrição',
      rejectRegistration: 'Rejeitar Inscrição',
      registrationApproved: 'Inscrição aprovada',
      registrationRejected: 'Inscrição rejeitada',
      viewDetails: 'Ver Detalhes',
      contactParticipant: 'Contatar Participante',
    },
    roundManagement: {
      title: 'Gerenciar Rodadas',
      generateNextRound: 'Gerar Próxima Rodada',
      confirmGenerate: 'Gerar rodada {{round}}?',
      generateSuccess: 'Rodada {{round}} gerada com sucesso',
      generateError: 'Erro ao gerar rodada',
      deleteRound: 'Excluir Rodada',
      confirmDelete: 'Excluir rodada {{round}}? Esta ação não pode ser desfeita.',
      deleteSuccess: 'Rodada excluída com sucesso',
      deleteError: 'Erro ao excluir rodada',
      roundLocked: 'Rodada bloqueada',
      unlockRound: 'Desbloquear Rodada',
    },
    scoreManagement: {
      title: 'Gerenciar Placares',
      enterScores: 'Inserir Placares',
      confirmScores: 'Confirmar Placares',
      editScores: 'Editar Placares',
      deleteScores: 'Excluir Placares',
      scoreFormat: 'Formato do Placar',
      setScores: 'Sets',
      gameScores: 'Games',
      tiebreakScores: 'Tiebreak',
      saveScores: 'Salvar Placares',
      scoresUpdated: 'Placares atualizados',
      scoresError: 'Erro ao atualizar placares',
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

console.log('✅ Final Portuguese translations applied!');
console.log('\n📊 Additional translations:');
console.log('  - leagueDetail.validation: Gender and doubles validations');
console.log('  - leagueDetail.eventTypes: All event type labels');
console.log('  - clubTournamentManagement.seedAssignment: Complete seed assignment flow');
console.log('  - clubTournamentManagement: Participant, round, and score management');
console.log('\n🎯 Total: ~50 additional keys translated!');
