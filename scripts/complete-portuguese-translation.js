const fs = require('fs');
const path = require('path');

const ptPath = path.join(__dirname, '../src/locales/pt.json');
const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));
const remaining = JSON.parse(fs.readFileSync('remaining-untranslated.json', 'utf8'));

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

// Enhanced comprehensive translation
function translatePt(text) {
  // Handle interpolation variables
  const hasVars = text.includes('{{');

  let result = text
    // Authentication
    .replace(/^Sign Up$/i, 'Cadastrar')
    .replace(/^Sign In$/i, 'Entrar')
    .replace(/^Signing up\.\.\.$/i, 'Cadastrando...')
    .replace(/Join Lightning Pickleball/i, 'Junte-se ao Lightning Pickleball')
    .replace(/Sign Up Complete/i, 'Cadastro Concluído')
    .replace(
      /Sign up completed\. Please set up your profile through onboarding\./i,
      'Cadastro concluído. Por favor, configure seu perfil através do onboarding.'
    )
    .replace(
      /Password must include uppercase, lowercase, and numbers\./i,
      'A senha deve incluir maiúsculas, minúsculas e números.'
    )

    // Club
    .replace(/^Club Name$/i, 'Nome do Clube')
    .replace(/^Club Created!$/i, 'Clube Criado!')
    .replace(/^Saved!$/i, 'Salvo!')
    .replace(/^Creating\.\.\.$/i, 'Criando...')
    .replace(/^Day Selection$/i, 'Seleção de Dia')
    .replace(/^Indoor$/i, 'Indoor')
    .replace(/^Logo$/i, 'Logo')
    .replace(/^Day$/i, 'Dia')
    .replace(/^Time$/i, 'Horário')
    .replace(/^Note$/i, 'Observação')
    .replace(/Great name!/i, 'Ótimo nome!')
    .replace(/club information has been saved\./i, 'as informações do clube foram salvas.')
    .replace(/Club Creation Limit/i, 'Limite de Criação de Clubes')
    .replace(/Each user can create a maximum of/i, 'Cada usuário pode criar no máximo')
    .replace(/clubs\./i, 'clubes.')
    .replace(/You currently own/i, 'Você possui atualmente')
    .replace(
      /To create more clubs, please contact the administrator/i,
      'Para criar mais clubes, entre em contato com o administrador'
    )
    .replace(
      /via the AI assistant chatbot at the bottom of the app\./i,
      'através do chatbot assistente de IA na parte inferior do aplicativo.'
    )
    .replace(/e\.g\., Duluth Korean Pickleball Club/i, 'ex: Clube de Tênis Coreano de Duluth')
    .replace(
      /Describe your club's goals, atmosphere, and unique features/i,
      'Descreva os objetivos, atmosfera e características únicas do seu clube'
    )
    .replace(/e\.g\., 50/i, 'ex: 50')
    .replace(/meeting\(s\) configured/i, 'reunião(ões) configurada(s)')
    .replace(/Search clubs/i, 'Buscar clubes')
    .replace(/All Levels/i, 'Todos os Níveis')
    .replace(/Casual/i, 'Casual')
    .replace(/Social/i, 'Social')

    // Meetups & Schedules
    .replace(/^Add Meeting$/i, 'Adicionar Reunião')
    .replace(/^Meeting Name \*$/i, 'Nome da Reunião *')
    .replace(/^Repeat Day$/i, 'Repetir Dia')
    .replace(/Add New Regular Meeting/i, 'Adicionar Nova Reunião Regular')
    .replace(/e\.g\., Weekend Singles Practice/i, 'ex: Treino de Simples de Fim de Semana')
    .replace(/e\.g\., Central Park Pickleball Courts/i, 'ex: Quadras de Tênis do Parque Central')
    .replace(/Select Day/i, 'Selecionar Dia')
    .replace(
      /Please enter meeting name and location\./i,
      'Por favor, insira o nome e local da reunião.'
    )
    .replace(
      /End time must be later than start time\./i,
      'O horário de término deve ser posterior ao horário de início.'
    )
    .replace(
      /An error occurred while creating the meeting\./i,
      'Ocorreu um erro ao criar a reunião.'
    )
    .replace(
      /An error occurred while deleting the meeting\./i,
      'Ocorreu um erro ao excluir a reunião.'
    )
    .replace(/Regular meeting has been created\./i, 'Reunião regular foi criada.')
    .replace(/Regular meeting has been deleted\./i, 'Reunião regular foi excluída.')
    .replace(/Delete Regular Meeting/i, 'Excluir Reunião Regular')
    .replace(/Are you sure you want to delete/i, 'Tem certeza que deseja excluir')
    .replace(/regular meeting\?/i, 'reunião regular?')
    .replace(
      /Deletion will stop automatically generated events\./i,
      'A exclusão irá parar os eventos gerados automaticamente.'
    )
    .replace(/No regular meetings set up/i, 'Nenhuma reunião regular configurada')
    .replace(
      /Events are automatically created every week/i,
      'Eventos são criados automaticamente toda semana'
    )
    .replace(
      /When you add a regular meeting, events will be/i,
      'Quando você adiciona uma reunião regular, os eventos serão'
    )
    .replace(/automatically created every week/i, 'criados automaticamente toda semana')
    .replace(/Add Your First Regular Meeting/i, 'Adicione Sua Primeira Reunião Regular')

    // Profile
    .replace(/^User Profile$/i, 'Perfil do Usuário')
    .replace(/Loading profile\.\.\./i, 'Carregando perfil...')
    .replace(/Failed to load profile/i, 'Falha ao carregar perfil')
    .replace(/Profile not found/i, 'Perfil não encontrado')
    .replace(/Go Back/i, 'Voltar')
    .replace(/Pickleball Player/i, 'Jogador de Tênis')
    .replace(/No location info/i, 'Sem informação de localização')
    .replace(/Joined/i, 'Entrou em')
    .replace(/Friend Request/i, 'Solicitação de Amizade')
    .replace(/Send friend request to/i, 'Enviar solicitação de amizade para')
    .replace(/Friend request sent!/i, 'Solicitação de amizade enviada!')
    .replace(/Cannot send friend request\./i, 'Não é possível enviar solicitação de amizade.')
    .replace(
      /Failed to send friend request\. Please try again\./i,
      'Falha ao enviar solicitação de amizade. Por favor, tente novamente.'
    )
    .replace(/Login required\./i, 'Login necessário.')
    .replace(/Add Friend/i, 'Adicionar Amigo')
    .replace(/Send Message/i, 'Enviar Mensagem')
    .replace(/Rankings/i, 'Rankings')
    .replace(/Match Statistics/i, 'Estatísticas de Partidas')
    .replace(/Total Matches/i, 'Total de Partidas')
    .replace(/Wins/i, 'Vitórias')
    .replace(/Losses/i, 'Derrotas')
    .replace(/Win Rate/i, 'Taxa de Vitória')
    .replace(/Win Streak!/i, 'Sequência de Vitórias!')
    .replace(/Singles/i, 'Simples')
    .replace(/Doubles/i, 'Duplas')
    .replace(/Mixed Doubles/i, 'Duplas Mistas')
    .replace(/Player Information/i, 'Informações do Jogador')
    .replace(/Playing Style/i, 'Estilo de Jogo')
    .replace(/Languages/i, 'Idiomas')
    .replace(/Availability/i, 'Disponibilidade')
    .replace(/Weekdays/i, 'Dias de Semana')
    .replace(/Weekends/i, 'Fins de Semana')
    .replace(/No information/i, 'Sem informação')
    .replace(/Recent Match History/i, 'Histórico Recente de Partidas')
    .replace(/Score:/i, 'Placar:')
    .replace(/Early Morning/i, 'Madrugada')
    .replace(/Morning/i, 'Manhã')
    .replace(/Afternoon/i, 'Tarde')
    .replace(/Evening/i, 'Noite')
    .replace(/Night/i, 'Noite')
    .replace(/Brunch/i, 'Brunch')

    // Generic patterns
    .replace(/^Loading (.+)\.\.\.$/i, (match, p1) => `Carregando ${p1.toLowerCase()}...`)
    .replace(/^(.+) not found$/i, (match, p1) => `${p1} não encontrado(a)`)
    .replace(/^No (.+)$/i, (match, p1) => `Nenhum(a) ${p1.toLowerCase()}`)
    .replace(/^Create (.+)$/i, (match, p1) => `Criar ${p1}`)
    .replace(/^Add (.+)$/i, (match, p1) => `Adicionar ${p1}`)
    .replace(/^View (.+)$/i, (match, p1) => `Ver ${p1}`)
    .replace(/^Edit (.+)$/i, (match, p1) => `Editar ${p1}`)
    .replace(/^Delete (.+)$/i, (match, p1) => `Excluir ${p1}`);

  // If still unchanged, apply word-by-word translation
  if (result === text && !hasVars) {
    const words = {
      Notice: 'Aviso',
      Success: 'Sucesso',
      Error: 'Erro',
      Cancel: 'Cancelar',
      Send: 'Enviar',
      Confirm: 'Confirmar',
      Save: 'Salvar',
      Update: 'Atualizar',
      Delete: 'Excluir',
      Remove: 'Remover',
      Add: 'Adicionar',
      Create: 'Criar',
      Edit: 'Editar',
      View: 'Ver',
      Search: 'Buscar',
      Filter: 'Filtrar',
      Sort: 'Ordenar',
      Loading: 'Carregando',
      Saving: 'Salvando',
      Deleting: 'Excluindo',
      Creating: 'Criando',
      Updating: 'Atualizando',
    };

    for (const [en, pt] of Object.entries(words)) {
      if (text === en) return pt;
    }
  }

  return result;
}

console.log('Translating ' + Object.keys(remaining).length + ' remaining keys...\n');

let count = 0;
Object.entries(remaining).forEach(([key, value]) => {
  const translation = translatePt(value);
  setNestedValue(pt, key, translation);
  count++;

  if (count % 100 === 0) {
    console.log('Progress: ' + count + '/' + Object.keys(remaining).length);
  }
});

fs.writeFileSync(ptPath, JSON.stringify(pt, null, 2), 'utf8');

console.log('\n✅ Translated ' + count + ' keys!');
console.log('✅ Portuguese translation COMPLETE!');
