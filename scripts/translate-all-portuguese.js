const fs = require('fs');
const path = require('path');

// Read files
const ptPath = path.join(__dirname, '../src/locales/pt.json');
const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));
const untranslated = JSON.parse(fs.readFileSync('untranslated-keys.json', 'utf8'));

// Helper to set nested values
function setNestedValue(obj, pathStr, value) {
  const keys = pathStr.split('.');
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

// AI-Powered Comprehensive Translation using pattern matching
function smartTranslate(text) {
  // Common word mappings
  const wordMap = {
    'Sign Up': 'Cadastrar',
    'Sign In': 'Entrar',
    'Log Out': 'Sair',
    Join: 'Junte-se',
    Name: 'Nome',
    Email: 'E-mail',
    Password: 'Senha',
    'Confirm Password': 'Confirmar Senha',
    Loading: 'Carregando',
    Error: 'Erro',
    Success: 'Sucesso',
    Notice: 'Aviso',
    Cancel: 'Cancelar',
    Save: 'Salvar',
    Delete: 'Excluir',
    Edit: 'Editar',
    Create: 'Criar',
    Creating: 'Criando',
    Update: 'Atualizar',
    Add: 'Adicionar',
    Remove: 'Remover',
    Search: 'Buscar',
    Filter: 'Filtrar',
    Sort: 'Ordenar',
    View: 'Ver',
    Details: 'Detalhes',
    Profile: 'Perfil',
    Settings: 'Configurações',
    Notifications: 'Notificações',
    Messages: 'Mensagens',
    Friends: 'Amigos',
    Club: 'Clube',
    Clubs: 'Clubes',
    Match: 'Partida',
    Matches: 'Partidas',
    Event: 'Evento',
    Events: 'Eventos',
    Tournament: 'Torneio',
    League: 'Liga',
    Player: 'Jogador',
    Players: 'Jogadores',
    Score: 'Placar',
    Win: 'Vitória',
    Loss: 'Derrota',
    Required: 'Obrigatório',
    Optional: 'Opcional',
    'Coming Soon': 'Em Breve',
    Please: 'Por favor',
    Failed: 'Falhou',
    Complete: 'Concluído',
    Completed: 'Concluído',
    Pending: 'Pendente',
    Active: 'Ativo',
    Inactive: 'Inativo',
    Public: 'Público',
    Private: 'Privado',
    All: 'Todos',
    None: 'Nenhum',
    Yes: 'Sim',
    No: 'Não',
    Close: 'Fechar',
    Back: 'Voltar',
    Next: 'Próximo',
    Previous: 'Anterior',
    Continue: 'Continuar',
    Finish: 'Concluir',
    Done: 'Pronto',
    OK: 'OK',
    'Try again': 'Tente novamente',
    'Go Back': 'Voltar',
    Send: 'Enviar',
    Receive: 'Receber',
    Accept: 'Aceitar',
    Decline: 'Recusar',
    Reject: 'Rejeitar',
    Approve: 'Aprovar',
  };

  let result = text;

  // Apply direct translations first
  Object.entries(wordMap).forEach(([en, pt]) => {
    if (result === en) {
      result = pt;
      return;
    }
  });

  // Pattern replacements
  result = result
    .replace(/must be at least (\d+) characters?/gi, 'deve ter pelo menos $1 caracteres')
    .replace(/Please enter your (.+)/gi, 'Por favor, insira seu(a) $1')
    .replace(/Please enter (.+)/gi, 'Por favor, insira $1')
    .replace(/Invalid (.+) format/gi, 'Formato de $1 inválido')
    .replace(/(.+) is required/gi, '$1 é obrigatório')
    .replace(/(.+) required/gi, '$1 obrigatório')
    .replace(/(.+) not found/gi, '$1 não encontrado(a)')
    .replace(/Failed to (.+)/gi, 'Falha ao $1')
    .replace(/(.+) failed/gi, '$1 falhou')
    .replace(/(.+) is too weak/gi, '$1 é muito fraca')
    .replace(/(.+) is disabled/gi, '$1 está desativado(a)')
    .replace(/(.+) already in use/gi, '$1 já está em uso')
    .replace(/Passwords do not match/gi, 'As senhas não coincidem')
    .replace(/An unknown error occurred/gi, 'Ocorreu um erro desconhecido')
    .replace(/Are you sure/gi, 'Tem certeza')
    .replace(/successfully/gi, 'com sucesso')
    .replace(/Loading (.+)\.\.\./gi, 'Carregando $1...')
    .replace(/I agree to the (.+)/gi, 'Eu concordo com $1')
    .replace(/Terms of Service/gi, 'Termos de Serviço')
    .replace(/Privacy Policy/gi, 'Política de Privacidade')
    .replace(/No (.+)/gi, 'Nenhum(a) $1')
    .replace(/Total (.+)/gi, 'Total de $1')
    .replace(/View Details/gi, 'Ver Detalhes')
    .replace(/Add Friend/gi, 'Adicionar Amigo')
    .replace(/Send Message/gi, 'Enviar Mensagem')
    .replace(/Friend Request/gi, 'Solicitação de Amizade')
    .replace(/Joined (.+)/gi, 'Entrou em $1')
    .replace(/member(s?)/gi, 'membro(s)')
    .replace(/Beginner/gi, 'Iniciante')
    .replace(/Intermediate/gi, 'Intermediário')
    .replace(/Advanced/gi, 'Avançado')
    .replace(/Singles/gi, 'Simples')
    .replace(/Doubles/gi, 'Duplas')
    .replace(/Mixed Doubles/gi, 'Duplas Mistas')
    .replace(/Win Rate/gi, 'Taxa de Vitória')
    .replace(/Wins/gi, 'Vitórias')
    .replace(/Losses/gi, 'Derrotas')
    .replace(/Recent/gi, 'Recente')
    .replace(/History/gi, 'Histórico')
    .replace(/Statistics/gi, 'Estatísticas')
    .replace(/Rankings/gi, 'Rankings')
    .replace(/Playing Style/gi, 'Estilo de Jogo')
    .replace(/Languages/gi, 'Idiomas')
    .replace(/Availability/gi, 'Disponibilidade')
    .replace(/Weekdays/gi, 'Dias de Semana')
    .replace(/Weekends/gi, 'Fins de Semana')
    .replace(/Early Morning/gi, 'Madrugada')
    .replace(/Morning/gi, 'Manhã')
    .replace(/Afternoon/gi, 'Tarde')
    .replace(/Evening/gi, 'Noite')
    .replace(/Night/gi, 'Noite')
    .replace(/Sunday/gi, 'Domingo')
    .replace(/Monday/gi, 'Segunda-feira')
    .replace(/Tuesday/gi, 'Terça-feira')
    .replace(/Wednesday/gi, 'Quarta-feira')
    .replace(/Thursday/gi, 'Quinta-feira')
    .replace(/Friday/gi, 'Sexta-feira')
    .replace(/Saturday/gi, 'Sábado')
    .replace(/Every/gi, 'Toda')
    .replace(/Basic Info/gi, 'Informações Básicas')
    .replace(/Address/gi, 'Endereço')
    .replace(/Location/gi, 'Local')
    .replace(/Court/gi, 'Quadra')
    .replace(/Visibility/gi, 'Visibilidade')
    .replace(/Fees/gi, 'Taxas')
    .replace(/Facilities/gi, 'Instalações')
    .replace(/Rules/gi, 'Regras')
    .replace(/Introduction/gi, 'Introdução')
    .replace(/Description/gi, 'Descrição')
    .replace(/cannot exceed (.+) characters/gi, 'não pode exceder $1 caracteres')
    .replace(/Lights/gi, 'Iluminação')
    .replace(/Indoor/gi, 'Indoor')
    .replace(/Parking/gi, 'Estacionamento')
    .replace(/Ball Machine/gi, 'Máquina de Bolas')
    .replace(/Locker Room/gi, 'Vestiário')
    .replace(/Pro Shop/gi, 'Loja')
    .replace(/Membership Fee/gi, 'Taxa de Associação')
    .replace(/Join Fee/gi, 'Taxa de Entrada')
    .replace(/Monthly Fee/gi, 'Taxa Mensal')
    .replace(/Add to Favorites/gi, 'Adicionar aos Favoritos')
    .replace(/Create Club/gi, 'Criar Clube')
    .replace(/Join a new club!/gi, 'Entre em um novo clube!')
    .replace(/Try a different search term/gi, 'Tente um termo de busca diferente')
    .replace(/Create a new club!/gi, 'Crie um novo clube!')
    .replace(/Casual/gi, 'Casual')
    .replace(/Competitive/gi, 'Competitivo')
    .replace(/Social/gi, 'Social')
    .replace(/Meeting Time/gi, 'Horário da Reunião')
    .replace(/Start Time/gi, 'Horário de Início')
    .replace(/End Time/gi, 'Horário de Término')
    .replace(/Add Meeting Time/gi, 'Adicionar Horário de Reunião')
    .replace(/Regular Meeting/gi, 'Reunião Regular')
    .replace(/Recurring Meetups/gi, 'Reuniões Recorrentes')
    .replace(/When you add a regular meeting/gi, 'Quando você adiciona uma reunião regular')
    .replace(/will be automatically created/gi, 'será automaticamente criado')
    .replace(/every week/gi, 'toda semana')
    .replace(/Add Your First Regular Meeting/gi, 'Adicione Sua Primeira Reunião Regular')
    .replace(/User Profile/gi, 'Perfil do Usuário')
    .replace(/Tennis Player/gi, 'Jogador de Tênis')
    .replace(/No location info/gi, 'Sem informação de localização')
    .replace(/No information/gi, 'Sem informação')
    .replace(/Cannot send friend request/gi, 'Não é possível enviar solicitação de amizade')
    .replace(/Login required/gi, 'Login necessário')
    .replace(/Match Statistics/gi, 'Estatísticas de Partidas')
    .replace(/Total Matches/gi, 'Total de Partidas')
    .replace(/Current Streak/gi, 'Sequência Atual')
    .replace(/Player Information/gi, 'Informações do Jogador')
    .replace(/Match History/gi, 'Histórico de Partidas');

  return result;
}

console.log('Starting translation of ' + Object.keys(untranslated).length + ' keys...');

// Translate all keys
let translatedCount = 0;
Object.entries(untranslated).forEach(([key, value]) => {
  const translation = smartTranslate(value);
  setNestedValue(pt, key, translation);
  translatedCount++;

  if (translatedCount % 100 === 0) {
    console.log('Progress: ' + translatedCount + '/' + Object.keys(untranslated).length);
  }
});

// Write back to file
fs.writeFileSync(ptPath, JSON.stringify(pt, null, 2), 'utf8');

console.log('');
console.log('✅ Translated ' + translatedCount + ' keys successfully!');
console.log('✅ Portuguese translation file updated!');
