const fs = require('fs');

// Complete remaining Brazilian Portuguese translations
const translations = {
  leagueDetail: {
    genderLabels: {
      male: 'Masculino',
      female: 'Feminino',
    },
  },
  clubTournamentManagement: {
    deletion: {
      title: 'Excluir Torneio',
      confirmMessage:
        'Tem certeza de que deseja excluir este torneio? Esta ação não pode ser desfeita.',
      successTitle: 'Torneio Excluído',
      errorTitle: 'Erro ao Excluir',
      errorMessage: 'Não foi possível excluir o torneio. Por favor, tente novamente.',
      deletedByOther: 'Este torneio foi excluído por outro administrador.',
    },
    participantRemoval: {
      confirmTitle: 'Remover Participante',
      confirmMessage: 'Tem certeza de que deseja remover {{name}} do torneio?',
      successTitle: 'Participante Removido',
      successMessage: '{{name}} foi removido do torneio com sucesso.',
      errorTitle: 'Erro ao Remover',
      errorMessage: 'Não foi possível remover o participante. Por favor, tente novamente.',
    },
    bpaddleDeletion: {
      confirmTitle: 'Excluir Chave',
      confirmMessage:
        'Tem certeza de que deseja excluir a chave do torneio? Todos os resultados serão perdidos.',
      successTitle: 'Chave Excluída',
      successMessage: 'A chave do torneio foi excluída com sucesso.',
      errorTitle: 'Erro ao Excluir Chave',
      errorMessage: 'Não foi possível excluir a chave. Por favor, tente novamente.',
    },
    crownWinner: {
      confirmTitle: 'Coroar Vencedor',
      confirmMessage: 'Coroar {{winner}} como campeão do torneio?',
      successTitle: 'Campeão Coroado!',
      successMessage: 'Parabéns ao campeão {{winner}}!',
      errorTitle: 'Erro ao Coroar Vencedor',
      errorMessage: 'Não foi possível coroar o vencedor. Por favor, tente novamente.',
    },
    tournamentStatus: {
      draft: 'Rascunho',
      registration: 'Inscrições Abertas',
      ready: 'Pronto para Começar',
      inProgress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    },
    notifications: {
      registrationOpened: 'Inscrições foram abertas',
      registrationClosed: 'Inscrições foram fechadas',
      tournamentStarted: 'Torneio foi iniciado',
      roundGenerated: 'Nova rodada foi gerada',
      tournamentCompleted: 'Torneio foi concluído',
      participantAdded: 'Novo participante foi adicionado',
      participantRemoved: 'Participante foi removido',
      seedsAssigned: 'Cabeças de chave foram atribuídas',
      bpaddleGenerated: 'Chave foi gerada',
      bpaddleDeleted: 'Chave foi excluída',
      winnerCrowned: 'Campeão foi coroado',
    },
    errors: {
      loadFailed: 'Falha ao carregar dados do torneio',
      saveFailed: 'Falha ao salvar alterações',
      invalidFormat: 'Formato de torneio inválido',
      insufficientParticipants: 'Participantes insuficientes',
      duplicateSeed: 'Cabeças de chave duplicadas detectadas',
      matchNotFound: 'Partida não encontrada',
      participantNotFound: 'Participante não encontrado',
      unauthorized: 'Você não tem permissão para esta ação',
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

console.log('✅ Complete remaining Portuguese translations applied!');
console.log('\n📊 Completed translations:');
console.log('  - leagueDetail.genderLabels: Male/Female labels');
console.log('  - clubTournamentManagement.deletion: Tournament deletion flow');
console.log('  - clubTournamentManagement.participantRemoval: Participant removal');
console.log('  - clubTournamentManagement.bpaddleDeletion: Bpaddle deletion');
console.log('  - clubTournamentManagement.crownWinner: Winner coronation');
console.log('  - clubTournamentManagement.tournamentStatus: All status labels');
console.log('  - clubTournamentManagement.notifications: Tournament notifications');
console.log('  - clubTournamentManagement.errors: Error messages');
console.log('\n🎯 Total: ~30 additional keys translated!');
