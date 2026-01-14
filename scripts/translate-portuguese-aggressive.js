const fs = require('fs');
const path = require('path');

// Read files
const ptPath = path.join(__dirname, '../src/locales/pt.json');
const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

// Helper to set nested values
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

// Complete translations map
const translations = {
  // Services section (167 keys)
  'services.error.generic': 'Ocorreu um erro. Por favor, tente novamente.',
  'services.error.network': 'Erro de rede. Verifique sua conexão.',
  'services.error.auth': 'Erro de autenticação. Faça login novamente.',
  'services.error.notFound': 'Recurso não encontrado.',
  'services.error.permission': 'Você não tem permissão para esta ação.',
  'services.error.validation': 'Dados inválidos fornecidos.',
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
  'services.validation.required': 'Este campo é obrigatório.',
  'services.validation.email': 'Endereço de e-mail inválido.',
  'services.validation.minLength': 'Mínimo de {{min}} caracteres necessários.',
  'services.validation.maxLength': 'Máximo de {{max}} caracteres permitidos.',
  'services.validation.pattern': 'Formato inválido.',
  'services.validation.number': 'Deve ser um número.',
  'services.validation.positive': 'Deve ser um número positivo.',
  'services.validation.integer': 'Deve ser um número inteiro.',
  'services.validation.url': 'URL inválida.',
  'services.validation.date': 'Data inválida.',
  'services.validation.time': 'Horário inválido.',
  'services.validation.phone': 'Número de telefone inválido.',
  'services.validation.zip': 'CEP inválido.',
  'services.validation.passwordMatch': 'As senhas não coincidem.',
  'services.validation.passwordStrength':
    'A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.',
  'services.auth.signInRequired': 'É necessário fazer login.',
  'services.auth.signInSuccess': 'Login realizado com sucesso.',
  'services.auth.signOutSuccess': 'Logout realizado com sucesso.',
  'services.auth.signUpSuccess': 'Cadastro realizado com sucesso.',
  'services.auth.invalidCredentials': 'Credenciais inválidas.',
  'services.auth.userNotFound': 'Usuário não encontrado.',
  'services.auth.emailInUse': 'Este e-mail já está em uso.',
  'services.auth.weakPassword': 'A senha é muito fraca.',
  'services.auth.accountDisabled': 'Conta desativada.',
  'services.auth.tooManyRequests': 'Muitas tentativas. Tente novamente mais tarde.',
  'services.auth.sessionExpired': 'Sessão expirada. Faça login novamente.',
  'services.club.joined': 'Você entrou no clube com sucesso.',
  'services.club.left': 'Você saiu do clube.',
  'services.club.created': 'Clube criado com sucesso.',
  'services.club.updated': 'Clube atualizado com sucesso.',
  'services.club.deleted': 'Clube excluído.',
  'services.club.notFound': 'Clube não encontrado.',
  'services.club.alreadyMember': 'Você já é membro deste clube.',
  'services.club.notMember': 'Você não é membro deste clube.',
  'services.club.adminOnly': 'Apenas administradores podem realizar esta ação.',
  'services.club.membershipRequired': 'Associação ao clube necessária.',
  'services.club.inviteSent': 'Convite enviado.',
  'services.club.inviteAccepted': 'Convite aceito.',
  'services.club.inviteDeclined': 'Convite recusado.',
  'services.club.requestSent': 'Solicitação enviada.',
  'services.club.requestApproved': 'Solicitação aprovada.',
  'services.club.requestRejected': 'Solicitação rejeitada.',
  'services.match.created': 'Partida criada com sucesso.',
  'services.match.updated': 'Partida atualizada.',
  'services.match.canceled': 'Partida cancelada.',
  'services.match.completed': 'Partida concluída.',
  'services.match.scoreSubmitted': 'Placar enviado.',
  'services.match.scoreConfirmed': 'Placar confirmado.',
  'services.match.notFound': 'Partida não encontrada.',
  'services.match.alreadyJoined': 'Você já entrou nesta partida.',
  'services.match.full': 'Esta partida está cheia.',
  'services.match.invalidScore': 'Placar inválido.',
  'services.match.cannotCancel': 'Não é possível cancelar esta partida.',
  'services.match.joinSuccess': 'Você entrou na partida.',
  'services.match.leaveSuccess': 'Você saiu da partida.',
  'services.event.created': 'Evento criado com sucesso.',
  'services.event.updated': 'Evento atualizado.',
  'services.event.canceled': 'Evento cancelado.',
  'services.event.deleted': 'Evento excluído.',
  'services.event.notFound': 'Evento não encontrado.',
  'services.event.registrationSuccess': 'Inscrição realizada com sucesso.',
  'services.event.registrationCanceled': 'Inscrição cancelada.',
  'services.event.full': 'Este evento está lotado.',
  'services.event.registrationClosed': 'As inscrições estão encerradas.',
  'services.event.alreadyRegistered': 'Você já está inscrito neste evento.',
  'services.league.created': 'Liga criada com sucesso.',
  'services.league.updated': 'Liga atualizada.',
  'services.league.deleted': 'Liga excluída.',
  'services.league.started': 'Liga iniciada.',
  'services.league.completed': 'Liga concluída.',
  'services.league.notFound': 'Liga não encontrada.',
  'services.league.joinSuccess': 'Você entrou na liga.',
  'services.league.leaveSuccess': 'Você saiu da liga.',
  'services.league.alreadyJoined': 'Você já está nesta liga.',
  'services.league.full': 'Esta liga está cheia.',
  'services.league.registrationClosed': 'As inscrições estão encerradas.',
  'services.tournament.created': 'Torneio criado com sucesso.',
  'services.tournament.updated': 'Torneio atualizado.',
  'services.tournament.deleted': 'Torneio excluído.',
  'services.tournament.started': 'Torneio iniciado.',
  'services.tournament.completed': 'Torneio concluído.',
  'services.tournament.notFound': 'Torneio não encontrado.',
  'services.tournament.registrationSuccess': 'Inscrição realizada com sucesso.',
  'services.tournament.registrationCanceled': 'Inscrição cancelada.',
  'services.tournament.full': 'Este torneio está lotado.',
  'services.tournament.registrationClosed': 'As inscrições estão encerradas.',
  'services.tournament.alreadyRegistered': 'Você já está inscrito neste torneio.',
  'services.notification.sent': 'Notificação enviada.',
  'services.notification.permissionDenied': 'Permissão de notificação negada.',
  'services.notification.permissionRequired': 'Permissão de notificação necessária.',
  'services.notification.tokenUpdated': 'Token de notificação atualizado.',
  'services.profile.updated': 'Perfil atualizado com sucesso.',
  'services.profile.photoUploaded': 'Foto carregada com sucesso.',
  'services.profile.photoDeleted': 'Foto excluída.',
  'services.profile.notFound': 'Perfil não encontrado.',
  'services.profile.incomplete': 'Por favor, complete seu perfil.',
  'services.friend.requestSent': 'Solicitação de amizade enviada.',
  'services.friend.requestAccepted': 'Solicitação de amizade aceita.',
  'services.friend.requestRejected': 'Solicitação de amizade rejeitada.',
  'services.friend.removed': 'Amigo removido.',
  'services.friend.notFound': 'Usuário não encontrado.',
  'services.friend.alreadyFriends': 'Vocês já são amigos.',
  'services.friend.pendingRequest': 'Já existe uma solicitação pendente.',
  'services.chat.messageSent': 'Mensagem enviada.',
  'services.chat.messageDeleted': 'Mensagem excluída.',
  'services.chat.notFound': 'Conversa não encontrada.',
  'services.chat.cannotSend': 'Não é possível enviar mensagem.',
  'services.upload.success': 'Upload realizado com sucesso.',
  'services.upload.failed': 'Falha no upload.',
  'services.upload.invalidFile': 'Arquivo inválido.',
  'services.upload.fileTooLarge': 'Arquivo muito grande. Máximo: {{max}}MB.',
  'services.upload.unsupportedFormat': 'Formato de arquivo não suportado.',
  'services.payment.success': 'Pagamento realizado com sucesso.',
  'services.payment.failed': 'Falha no pagamento.',
  'services.payment.pending': 'Pagamento pendente.',
  'services.payment.canceled': 'Pagamento cancelado.',
  'services.payment.refunded': 'Pagamento reembolsado.',
  'services.dues.created': 'Mensalidade criada com sucesso.',
  'services.dues.updated': 'Mensalidade atualizada.',
  'services.dues.deleted': 'Mensalidade excluída.',
  'services.dues.paid': 'Mensalidade paga.',
  'services.dues.overdue': 'Mensalidade vencida.',
  'services.dues.notFound': 'Mensalidade não encontrada.',
};

// Apply all translations
let updateCount = 0;
Object.entries(translations).forEach(([key, value]) => {
  setNestedValue(pt, key, value);
  updateCount++;
});

// Write back to file
fs.writeFileSync(ptPath, JSON.stringify(pt, null, 2), 'utf8');

console.log(`✅ Updated ${updateCount} translations`);
console.log('✅ Portuguese translation file updated successfully!');
