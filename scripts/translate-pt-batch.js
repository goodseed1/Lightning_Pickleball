#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PT_FILE = path.join(__dirname, '../src/locales/pt.json');

// Read current pt.json
const ptData = JSON.parse(fs.readFileSync(PT_FILE, 'utf8'));

// Helper function to set nested value
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((acc, key) => {
    if (!acc[key]) acc[key] = {};
    return acc[key];
  }, obj);
  target[lastKey] = value;
}

// === DUESMANAGEMENT TRANSLATIONS ===
const duesTranslations = {
  'alerts.ok': 'OK',
  'settings.venmo': 'Venmo',
  'modals.createRecord': 'Criar Registro de Mensalidades',
  'modals.createRecordPrompt': 'Que tipo de registro você gostaria de criar para este membro?',
  'modals.editDuesSettings': 'Editar Configurações de Mensalidades',
  'modals.addPaymentMethodDialog': 'Adicionar Método de Pagamento',
  'modals.qrCodeDialog': 'Código QR',
  'modals.uploadQrCode': 'Enviar Código QR',
  'modals.tapToUploadQr': 'Toque para enviar imagem do código QR',
  'modals.qrCodeHelper': 'Os membros podem usar este código QR para fazer pagamentos.',
  'modals.noQrCodeYet': 'Nenhum código QR definido ainda.',
  'modals.processPaymentDialog': 'Processar Pagamento',
  'modals.paymentDetails': 'Detalhes da Solicitação de Pagamento',
  'modals.paymentReminder': 'Lembrete de Pagamento',
  'overview.totalMembers': 'Total de Membros',
  'overview.totalOwed': 'Total Devido',
  'overview.totalPaid': 'Total Pago',
  'overview.collectionRate': 'Taxa de Cobrança',
  'overview.pendingApproval': 'Pendente de Aprovação',
  'overview.memberDuesStatus': 'Status de Mensalidades dos Membros',
  'overview.filter': 'Filtrar',
  'overview.sort': 'Ordenar',
  'overview.search': 'Buscar membros...',
  'overview.duesManagement': 'Gerenciamento de Mensalidades',
  'overview.settings': 'Configurações',
  'overview.noMembers': 'Nenhum Membro',
  'overview.addMembers': 'Adicione membros ao seu clube para começar a gerenciar mensalidades.',
  'memberCard.paid': 'Pago',
  'memberCard.pending': 'Pendente',
  'memberCard.overdue': 'Atrasado',
  'memberCard.exempt': 'Isento',
  'memberCard.unpaid': 'Não Pago',
  'memberCard.viewHistory': 'Ver Histórico',
  'memberCard.recordPayment': 'Registrar Pagamento',
  'memberCard.sendReminder': 'Enviar Lembrete',
  'memberCard.markExempt': 'Marcar como Isento',
  'memberCard.unmarkExempt': 'Desmarcar como Isento',
  'memberCard.manageDues': 'Gerenciar Mensalidades',
  'historyScreen.title': 'Histórico de Mensalidades',
  'historyScreen.noHistory': 'Nenhum Histórico',
  'historyScreen.noHistoryMessage': 'Nenhum registro de pagamento encontrado para este membro.',
  'historyScreen.statusPaid': 'Pago',
  'historyScreen.statusPending': 'Pendente',
  'historyScreen.statusOverdue': 'Atrasado',
  'historyScreen.statusExempt': 'Isento',
  'historyScreen.statusUnpaid': 'Não Pago',
  'historyScreen.paymentRecord': 'Registro de Pagamento',
  'historyScreen.exemptionRecord': 'Registro de Isenção',
  'historyScreen.recordedBy': 'Registrado por',
  'historyScreen.deleteRecord': 'Excluir Registro',
  'historyScreen.confirmDelete': 'Tem certeza que deseja excluir este registro?',
  'recordTypes.payment': 'Pagamento',
  'recordTypes.exemption': 'Isenção',
  'recordTypes.selectType': 'Selecionar Tipo',
  'recordTypes.paymentDescription': 'Marcar membro como tendo pago',
  'recordTypes.exemptionDescription': 'Marcar membro como isento',
  'recordPayment.title': 'Registrar Pagamento',
  'recordPayment.amount': 'Valor',
  'recordPayment.period': 'Período',
  'recordPayment.notes': 'Notas (opcional)',
  'recordPayment.recordButton': 'Registrar Pagamento',
  'recordPayment.success': 'Pagamento registrado com sucesso',
  'recordExemption.title': 'Registrar Isenção',
  'recordExemption.period': 'Período',
  'recordExemption.reason': 'Motivo',
  'recordExemption.notes': 'Notas (opcional)',
  'recordExemption.recordButton': 'Registrar Isenção',
  'recordExemption.success': 'Isenção registrada com sucesso',
  'settingsScreen.title': 'Configurações de Mensalidades',
  'settingsScreen.generalSettings': 'Configurações Gerais',
  'settingsScreen.paymentMethods': 'Métodos de Pagamento',
  'settingsScreen.addPaymentMethod': 'Adicionar Método de Pagamento',
  'settingsScreen.noPaymentMethods': 'Nenhum método de pagamento configurado ainda',
  'settingsScreen.enableDues': 'Habilitar Mensalidades',
  'settingsScreen.duesAmount': 'Valor das Mensalidades',
};

// === SERVICES TRANSLATIONS ===
const servicesTranslations = {
  'performanceAnalytics.monthlyReport.nextMonthGoals.newPartner': 'Jogar com Novos Parceiros',
  'leaderboard.challenges.weeklyMatches.title': 'Desafio de Partidas Semanais',
  'leaderboard.challenges.weeklyMatches.description': 'Complete 5 partidas esta semana',
  'leaderboard.challenges.weeklyMatches.reward': '100 pontos + emblema "Guerreiro Semanal"',
  'leaderboard.challenges.winStreak.title': 'Desafio de Sequência de Vitórias',
  'leaderboard.challenges.winStreak.description': 'Alcance 3 vitórias consecutivas',
  'leaderboard.challenges.winStreak.reward': '200 pontos + emblema "Artilheiro"',
  'leaderboard.challenges.monthlyImprovement.title': 'Melhoria Mensal',
  'leaderboard.challenges.monthlyImprovement.description':
    'Melhore o nível de habilidade em 5 pontos',
  'leaderboard.challenges.monthlyImprovement.reward': '500 pontos + emblema "Rei da Melhoria"',
  'leaderboard.challenges.socialPlayer.title': 'Jogador Social',
  'leaderboard.challenges.socialPlayer.description': 'Jogue com 10 novos adversários',
  'leaderboard.challenges.socialPlayer.reward': '300 pontos + emblema "Borboleta Social"',
  'leaderboard.achievements.firstWin.name': 'Primeira Vitória',
  'leaderboard.achievements.firstWin.description': 'Vença sua primeira partida',
  'leaderboard.achievements.winStreak3.name': 'Sequência de 3 Vitórias',
  'leaderboard.achievements.winStreak3.description': 'Vença 3 partidas seguidas',
  'leaderboard.achievements.winStreak5.name': 'Sequência de 5 Vitórias',
  'leaderboard.achievements.winStreak5.description': 'Vença 5 partidas seguidas',
  'leaderboard.achievements.totalWins10.name': 'Colecionador de Vitórias',
  'leaderboard.achievements.totalWins10.description': 'Vença 10 partidas no total',
  'leaderboard.achievements.totalWins25.name': 'Veterano',
  'leaderboard.achievements.totalWins25.description': 'Vença 25 partidas no total',
  'leaderboard.achievements.totalWins50.name': 'Campeão',
  'leaderboard.achievements.totalWins50.description': 'Vença 50 partidas no total',
  'leaderboard.achievements.perfectMonth.name': 'Mês Perfeito',
  'leaderboard.achievements.perfectMonth.description':
    'Jogue pelo menos 10 partidas em um mês sem perder',
  'leaderboard.achievements.socialButterfly.name': 'Borboleta Social',
  'leaderboard.achievements.socialButterfly.description': 'Jogue com 20 parceiros diferentes',
  'leaderboard.achievements.earlyBird.name': 'Madrugador',
  'leaderboard.achievements.earlyBird.description': 'Jogue 5 partidas antes das 8h',
  'leaderboard.achievements.nightOwl.name': 'Coruja Noturna',
  'leaderboard.achievements.nightOwl.description': 'Jogue 5 partidas após as 20h',
  'leaderboard.achievements.weekendWarrior.name': 'Guerreiro de Fim de Semana',
  'leaderboard.achievements.weekendWarrior.description': 'Jogue 20 partidas nos fins de semana',
  'leaderboard.achievements.consistency.name': 'Consistência',
  'leaderboard.achievements.consistency.description':
    'Jogue pelo menos uma partida por semana durante um mês',
  'leaderboard.achievements.rapidImprovement.name': 'Melhoria Rápida',
  'leaderboard.achievements.rapidImprovement.description': 'Melhore 10 pontos de nível em um mês',
  'leaderboard.achievements.clubLoyalty.name': 'Lealdade ao Clube',
  'leaderboard.achievements.clubLoyalty.description': 'Participe de 50 eventos do clube',
  'leaderboard.achievements.mentorship.name': 'Mentor',
  'leaderboard.achievements.mentorship.description': 'Ajude 5 jogadores iniciantes a melhorar',
  'leaderboard.achievements.tournamentChampion.name': 'Campeão de Torneio',
  'leaderboard.achievements.tournamentChampion.description': 'Vença um torneio do clube',
  'leaderboard.achievements.communityBuilder.name': 'Construtor da Comunidade',
  'leaderboard.achievements.communityBuilder.description': 'Organize 10 eventos comunitários',
  'leaderboard.achievements.allRounder.name': 'Jogador Completo',
  'leaderboard.achievements.allRounder.description': 'Jogue singles, doubles e mixed doubles',
  'leaderboard.achievements.speedDemon.name': 'Demônio da Velocidade',
  'leaderboard.achievements.speedDemon.description': 'Complete uma partida em menos de 30 minutos',
  'leaderboard.achievements.marathon.name': 'Maratona',
  'leaderboard.achievements.marathon.description': 'Complete uma partida com mais de 2 horas',
  'leaderboard.achievements.comeback.name': 'Retorno',
  'leaderboard.achievements.comeback.description':
    'Vença uma partida depois de perder o primeiro set',
  'leaderboard.achievements.shutout.name': 'Shutout',
  'leaderboard.achievements.shutout.description': 'Vença uma partida 6-0, 6-0',
  'leaderboard.achievements.tiebreakKing.name': 'Rei do Tiebreak',
  'leaderboard.achievements.tiebreakKing.description': 'Vença 10 tiebreaks',
  'leaderboard.achievements.globalPlayer.name': 'Jogador Global',
  'leaderboard.achievements.globalPlayer.description': 'Jogue com jogadores de 5 países diferentes',
  'leaderboard.achievements.localHero.name': 'Herói Local',
  'leaderboard.achievements.localHero.description':
    'Seja o jogador mais ativo em sua região por um mês',
};

// === DISCOVER TRANSLATIONS ===
const discoverTranslations = {
  'alerts.soloApplication.error': 'Ocorreu um erro: {{error}}',
  'partnerInvitation.banner': 'Você tem {{count}} convite{{plural}} de parceiro',
  'partnerInvitation.bannerSingle': 'Você tem 1 convite de parceiro',
  'pendingApplications.banner':
    'Você tem {{count}} inscrição{{plural}} pendente{{plural}}. Toque para revisar',
  'pendingApplications.bannerSingle': 'Você tem 1 inscrição pendente. Toque para revisar.',
};

// === MATCHES TRANSLATIONS ===
const matchesTranslations = {
  'skillLevels.2.0-3.0': '2.0-3.0',
  'skillLevels.3.0-4.0': '3.0-4.0',
  'skillLevels.4.0-5.0': '4.0-5.0',
  'skillLevels.5.0+': '5.0+',
  'createModal.maxParticipants.placeholder': '4',
  'createModal.cancelButton': 'Cancelar',
  'createModal.createButton': 'Criar Partida',
  'alerts.inputError.title': 'Erro de Entrada',
  'alerts.inputError.message': 'Título e localização são obrigatórios',
  'alerts.createSuccess.title': 'Partida Criada com Sucesso!',
  'alerts.createSuccess.messagePersonal':
    'A partida pessoal foi criada com sucesso.\n\n📱 Notificações foram enviadas a todos os participantes.',
  'alerts.createSuccess.messageClub':
    'A partida do clube foi criada com sucesso.\n\n📱 Notificações foram enviadas a todos os membros do clube.',
  'alerts.createSuccess.confirm': 'OK',
  'alerts.joinMatch.title': 'Entrar na Partida',
  'alerts.joinMatch.message': 'Você gostaria de entrar nesta partida?',
  'alerts.joinMatch.cancel': 'Cancelar',
  'mockData.weekendDoubles': 'Partida de Duplas de Fim de Semana',
  'mockData.weekendDescription': 'Partida de duplas relaxada',
  'mockData.mondayTraining': 'Treino Regular de Segunda',
  'mockData.mondayDescription': 'Treino semanal de segunda à noite',
};

// === EMAILLOGIN TRANSLATIONS ===
const emailLoginTranslations = {
  'labels.email': 'E-mail',
  'labels.password': 'Senha',
  'verification.sentTo': '{{email}}',
  'alerts.forgotPassword.notRegistered.title': 'E-mail Não Registrado',
  'alerts.forgotPassword.notRegistered.message':
    'Nenhuma conta encontrada com este e-mail.\nGostaria de se cadastrar?',
};

// Apply all translations
console.log('🌍 Applying Portuguese translations...\n');

let count = 0;

// Apply duesManagement translations
console.log('📦 DuesManagement: 73 keys');
Object.entries(duesTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.duesManagement, key, value);
  count++;
});

// Apply services translations
console.log('📦 Services: 49 keys');
Object.entries(servicesTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.services, key, value);
  count++;
});

// Apply discover translations
console.log('📦 Discover: 5 keys');
Object.entries(discoverTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.discover, key, value);
  count++;
});

// Apply matches translations
console.log('📦 Matches: 20 keys');
Object.entries(matchesTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.matches, key, value);
  count++;
});

// Apply emailLogin translations
console.log('📦 EmailLogin: 5 keys');
Object.entries(emailLoginTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.emailLogin, key, value);
  count++;
});

// Write updated pt.json
fs.writeFileSync(PT_FILE, JSON.stringify(ptData, null, 2) + '\n', 'utf8');

console.log(`\n✅ Successfully translated ${count} keys to Brazilian Portuguese!`);
console.log(`📄 Updated: ${PT_FILE}`);
