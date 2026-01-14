const fs = require('fs');
const path = require('path');

const ptPath = path.join(__dirname, '../src/locales/pt.json');
const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

function set(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') current[key] = {};
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

// Massive bulk translations for major sections
const bulkTranslations = {
  // Services section (123 keys)
  'services.error.generic': 'Ocorreu um erro. Por favor, tente novamente.',
  'services.error.network': 'Erro de rede. Verifique sua conexão.',
  'services.error.auth': 'Erro de autenticação. Faça login novamente.',
  'services.error.notFound': 'Recurso não encontrado.',
  'services.error.permission': 'Você não tem permissão para esta ação.',
  'services.error.validation': 'Dados inválidos fornecidos.',
  'services.error.timeout': 'Tempo esgotado. Por favor, tente novamente.',
  'services.error.serverError': 'Erro do servidor. Tente novamente mais tarde.',
  'services.success.generic': 'Operação realizada com sucesso.',
  'services.success.saved': 'Salvo com sucesso.',
  'services.success.deleted': 'Excluído com sucesso.',
  'services.success.updated': 'Atualizado com sucesso.',
  'services.success.created': 'Criado com sucesso.',
  'services.loading.generic': 'Carregando...',
  'services.loading.fetching': 'Buscando dados...',
  'services.loading.saving': 'Salvando...',
  'services.loading.deleting': 'Excluindo...',
  'services.loading.updating': 'Atualizando...',

  // DuesManagement section (93 keys)
  'duesManagement.title': 'Gerenciamento de Mensalidades',
  'duesManagement.subtitle': 'Gerenciar mensalidades do clube',
  'duesManagement.noDues': 'Nenhuma mensalidade configurada',
  'duesManagement.createFirst': 'Crie sua primeira mensalidade',
  'duesManagement.addDues': 'Adicionar Mensalidade',
  'duesManagement.editDues': 'Editar Mensalidade',
  'duesManagement.deleteDues': 'Excluir Mensalidade',
  'duesManagement.confirmDelete': 'Tem certeza que deseja excluir esta mensalidade?',
  'duesManagement.form.name': 'Nome da Mensalidade',
  'duesManagement.form.description': 'Descrição',
  'duesManagement.form.amount': 'Valor',
  'duesManagement.form.frequency': 'Frequência',
  'duesManagement.form.dueDay': 'Dia do Vencimento',
  'duesManagement.form.status': 'Status',
  'duesManagement.frequency.monthly': 'Mensal',
  'duesManagement.frequency.quarterly': 'Trimestral',
  'duesManagement.frequency.yearly': 'Anual',
  'duesManagement.frequency.oneTime': 'Único',
  'duesManagement.status.pending': 'Pendente',
  'duesManagement.status.paid': 'Pago',
  'duesManagement.status.overdue': 'Vencido',

  // EmailLogin section (47 keys)
  'emailLogin.title': 'Login com E-mail',
  'emailLogin.subtitle': 'Entre com seu e-mail e senha',
  'emailLogin.email': 'E-mail',
  'emailLogin.password': 'Senha',
  'emailLogin.forgotPassword': 'Esqueceu a senha?',
  'emailLogin.signIn': 'Entrar',
  'emailLogin.signUp': 'Criar Conta',
  'emailLogin.noAccount': 'Não tem uma conta?',
  'emailLogin.validation.emailRequired': 'E-mail é obrigatório',
  'emailLogin.validation.passwordRequired': 'Senha é obrigatória',
  'emailLogin.errors.invalidCredentials': 'E-mail ou senha incorretos',

  // Types section (43 keys)
  'types.match.singles': 'Simples',
  'types.match.doubles': 'Duplas',
  'types.match.mixedDoubles': 'Duplas Mistas',
  'types.status.pending': 'Pendente',
  'types.status.confirmed': 'Confirmado',
  'types.status.cancelled': 'Cancelado',
  'types.status.completed': 'Concluído',
  'types.skill.beginner': 'Iniciante',
  'types.skill.intermediate': 'Intermediário',
  'types.skill.advanced': 'Avançado',
  'types.gender.male': 'Masculino',
  'types.gender.female': 'Feminino',

  // MyActivities section (38 keys)
  'myActivities.title': 'Minhas Atividades',
  'myActivities.upcoming': 'Próximas',
  'myActivities.past': 'Anteriores',
  'myActivities.all': 'Todas',
  'myActivities.noActivities': 'Nenhuma atividade encontrada',

  // Club section (37 keys)
  'club.myClubs': 'Meus Clubes',
  'club.findClubs': 'Encontrar Clubes',
  'club.createClub': 'Criar Clube',
  'club.members': 'Membros',
  'club.events': 'Eventos',
  'club.join': 'Entrar no Clube',
  'club.leave': 'Sair do Clube',

  // Additional common patterns
  'createMeetup.title': 'Criar Encontro',
  'eventCard.register': 'Inscrever-se',
  'eventCard.viewDetails': 'Ver Detalhes',
  'profile.edit': 'Editar',
  'matches.title': 'Partidas',
  'leagues.title': 'Ligas',
  'auth.signIn': 'Entrar',
  'auth.signUp': 'Cadastrar',
};

console.log('Applying ' + Object.keys(bulkTranslations).length + ' bulk translations...\n');

let count = 0;
Object.entries(bulkTranslations).forEach(([key, value]) => {
  set(pt, key, value);
  count++;
});

fs.writeFileSync(ptPath, JSON.stringify(pt, null, 2), 'utf8');

console.log('✅ Applied ' + count + ' translations!');
