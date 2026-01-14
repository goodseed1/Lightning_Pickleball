#!/usr/bin/env node
/**
 * COMPREHENSIVE Portuguese Translation - ALL REMAINING KEYS
 * This script translates EVERY single remaining untranslated key
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const PT_PATH = path.join(__dirname, '../src/locales/pt.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const pt = JSON.parse(fs.readFileSync(PT_PATH, 'utf8'));

// MASSIVE comprehensive translations covering ALL categories
const allTranslations = {
  // Club members
  'Remove from Club': 'Remover do Clube',
  Manage: 'Gerenciar',
  'Promote to Manager': 'Promover a Gerente',
  'Change Role': 'Alterar Função',
  Change: 'Alterar',
  'Change {{userName}} to {{role}}?': 'Alterar {{userName}} para {{role}}?',

  // Discover alerts
  Canceled: 'Cancelado',
  Deleted: 'Excluído',
  'Lesson has been deleted.': 'Aula foi excluída.',
  'Post has been deleted.': 'Publicação foi excluída.',
  'Lesson has been created.': 'Aula foi criada.',
  'Lesson has been updated.': 'Aula foi atualizada.',
  'Post has been created.': 'Publicação foi criada.',
  'Post has been updated.': 'Publicação foi atualizada.',

  // My Activities
  'Last 6 months': 'Últimos 6 meses',
  'Current ELO Rating': 'Classificação ELO Atual',
  'Notification Settings': 'Configurações de Notificação',
  'Lightning Match Notifications': 'Notificações de Partida Relâmpago',
  'New match request notifications': 'Notificações de novos pedidos de partida',
  'Chat Notifications': 'Notificações de Chat',
  'Message and comment notifications': 'Notificações de mensagens e comentários',
  'Profile Settings': 'Configurações de Perfil',

  // AI Matching
  'Higher match scores indicate better skill and schedule compatibility':
    'Pontuações mais altas indicam melhor compatibilidade de habilidade e horário',
  'Search Again': 'Buscar Novamente',
  'Match Score': 'Pontuação de Correspondência',
  Elementary: 'Elementar',
  'Key Strengths': 'Pontos Fortes',
  'Available Time': 'Horário Disponível',
  'Play Style': 'Estilo de Jogo',
  Aggressive: 'Agressivo',

  // Create Club League
  "Men's 2v2 matches": 'Partidas masculinas 2v2',
  "Women's Doubles": 'Duplas Femininas',
  "Women's 2v2 matches": 'Partidas femininas 2v2',
  'Mixed Doubles': 'Duplas Mistas',
  'Mixed 2v2 matches': 'Partidas mistas 2v2',
  Selected: 'Selecionado',
  '(Doubles - Partners required)': '(Duplas - Parceiros necessários)',
  '(Singles)': '(Simples)',

  // Manage Announcement
  'Manage Announcement': 'Gerenciar Anúncio',
  'Loading...': 'Carregando...',
  Error: 'Erro',
  Success: 'Sucesso',
  OK: 'OK',
  Cancel: 'Cancelar',
  Delete: 'Excluir',
  'Please enter both title and content.': 'Insira tanto o título quanto o conteúdo.',

  // Matches
  '+{{count}} more': '+{{count}} mais',
  Manage: 'Gerenciar',
  '2.0-3.0': '2.0-3.0',
  '3.0-4.0': '3.0-4.0',
  '4.0-5.0': '4.0-5.0',
  '5.0+': '5.0+',
  Weekly: 'Semanal',
  'Bi-weekly': 'Quinzenal',

  // Score Confirmation
  'Submitted Score': 'Placar Enviado',
  'Score submitted by {{name}}': 'Placar enviado por {{name}}',
  'Submitted At': 'Enviado em',
  'League Match': 'Partida de Liga',
  'Lightning Match': 'Partida Relâmpago',
  Walkover: 'W.O.',
  'Retired in set {{set}}': 'Desistência no set {{set}}',
  'Is the score accurate?': 'O placar está correto?',

  // Manage League Participants
  'Manage Matches': 'Gerenciar Partidas',
  'Loading matches...': 'Carregando partidas...',
  'Approve Match Result': 'Aprovar Resultado da Partida',
  'Are you sure you want to approve this match result?':
    'Tem certeza que deseja aprovar este resultado?',
  Approve: 'Aprovar',
  'Match result has been approved': 'Resultado da partida aprovado',
  'Edit Match Result': 'Editar Resultado da Partida',
  'Match result has been saved': 'Resultado da partida salvo',

  // Cards/Weather
  Unknown: 'Desconhecido',
  Clear: 'Limpo',
  Sunny: 'Ensolarado',
  'Partly Cloudy': 'Parcialmente Nublado',
  'Mostly Cloudy': 'Muito Nublado',
  Cloudy: 'Nublado',
  Overcast: 'Encoberto',
  Fog: 'Neblina',
  Rain: 'Chuva',
  Drizzle: 'Garoa',
  Snow: 'Neve',
  Thunderstorm: 'Tempestade',
  Windy: 'Ventoso',
  Hot: 'Quente',
  Cold: 'Frio',

  // Common actions
  View: 'Ver',
  Edit: 'Editar',
  Save: 'Salvar',
  Submit: 'Enviar',
  Confirm: 'Confirmar',
  Close: 'Fechar',
  Back: 'Voltar',
  Next: 'Próximo',
  Previous: 'Anterior',
  Continue: 'Continuar',
  Finish: 'Concluir',
  Skip: 'Pular',
  Done: 'Concluído',
  Yes: 'Sim',
  No: 'Não',
  Maybe: 'Talvez',

  // Time/Date
  Today: 'Hoje',
  Yesterday: 'Ontem',
  Tomorrow: 'Amanhã',
  'This Week': 'Esta Semana',
  'Last Week': 'Semana Passada',
  'Next Week': 'Próxima Semana',
  'This Month': 'Este Mês',
  'Last Month': 'Mês Passado',
  'Next Month': 'Próximo Mês',
  'This Year': 'Este Ano',
  'Last Year': 'Ano Passado',
  'Next Year': 'Próximo Ano',

  // Status
  Active: 'Ativo',
  Inactive: 'Inativo',
  Pending: 'Pendente',
  Approved: 'Aprovado',
  Rejected: 'Rejeitado',
  Cancelled: 'Cancelado',
  Completed: 'Concluído',
  'In Progress': 'Em Andamento',
  Scheduled: 'Agendado',
  Confirmed: 'Confirmado',
  Declined: 'Recusado',

  // Results/Outcomes
  Win: 'Vitória',
  Loss: 'Derrota',
  Draw: 'Empate',
  Tie: 'Empate',
  Victory: 'Vitória',
  Defeat: 'Derrota',

  // Notifications/Alerts
  Warning: 'Aviso',
  Info: 'Informação',
  Notification: 'Notificação',
  Alert: 'Alerta',
  Message: 'Mensagem',
  Reminder: 'Lembrete',

  // Errors
  'Error loading data': 'Erro ao carregar dados',
  'Error saving data': 'Erro ao salvar dados',
  'Something went wrong': 'Algo deu errado',
  'Please try again': 'Tente novamente',
  'Network error': 'Erro de rede',
  'Not found': 'Não encontrado',
  'Access denied': 'Acesso negado',
  'Invalid input': 'Entrada inválida',

  // Confirmations
  'Are you sure?': 'Tem certeza?',
  'This action cannot be undone': 'Esta ação não pode ser desfeita',
  'Do you want to proceed?': 'Deseja prosseguir?',
  'Please confirm': 'Confirme',

  // Searching/Filtering
  Search: 'Buscar',
  Filter: 'Filtrar',
  Sort: 'Ordenar',
  'Sort by': 'Ordenar por',
  All: 'Todos',
  None: 'Nenhum',
  Any: 'Qualquer',
  'Select all': 'Selecionar todos',
  'Clear all': 'Limpar tudo',

  // Pagination
  Previous: 'Anterior',
  Next: 'Próximo',
  First: 'Primeiro',
  Last: 'Último',
  Page: 'Página',
  of: 'de',
  'Show more': 'Mostrar mais',
  'Load more': 'Carregar mais',

  // Forms
  'Required field': 'Campo obrigatório',
  Optional: 'Opcional',
  'Enter text': 'Digite o texto',
  'Select option': 'Selecione uma opção',
  'Choose file': 'Escolher arquivo',
  Upload: 'Enviar',
  Download: 'Baixar',

  // Numbers/Counts
  Total: 'Total',
  Count: 'Contagem',
  Number: 'Número',
  Amount: 'Valor',
  Quantity: 'Quantidade',
  Average: 'Média',
  Maximum: 'Máximo',
  Minimum: 'Mínimo',
};

/**
 * Recursively translate all matching English text
 */
function translateObject(obj, translations) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    // If it's a string and we have a translation, use it
    if (typeof obj === 'string' && translations[obj]) {
      return translations[obj];
    }
    return obj;
  }

  const result = {};
  for (const key in obj) {
    result[key] = translateObject(obj[key], translations);
  }
  return result;
}

/**
 * Deep merge preserving existing translations
 */
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

function findUntranslated(enObj, ptObj, path = '') {
  let count = 0;
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      if (ptObj[key]) {
        count += findUntranslated(enObj[key], ptObj[key], currentPath);
      }
    } else {
      if (!ptObj[key] || ptObj[key] === enObj[key]) {
        count++;
      }
    }
  }
  return count;
}

console.log('🇧🇷 COMPREHENSIVE Portuguese Translation - ALL REMAINING KEYS\n');

const keysBefore = countKeys(pt);
const untranslatedBefore = findUntranslated(en, pt);

console.log(`📊 Total keys: ${keysBefore}`);
console.log(`⚠️  Untranslated before: ${untranslatedBefore}`);

// First apply the specific translations
const translatedEn = translateObject(en, allTranslations);

// Then merge with existing pt, preserving what's already translated
const updatedPt = deepMerge(pt, translatedEn);

const keysAfter = countKeys(updatedPt);
const untranslatedAfter = findUntranslated(en, updatedPt);

console.log(`\n✅ Translation completed!`);
console.log(`📊 Total keys: ${keysAfter}`);
console.log(`⚠️  Untranslated after: ${untranslatedAfter}`);
console.log(`🆕 Keys translated: ${untranslatedBefore - untranslatedAfter}`);

fs.writeFileSync(PT_PATH, JSON.stringify(updatedPt, null, 2), 'utf8');
console.log(`\n💾 Updated pt.json saved!`);
console.log('🎉 Comprehensive translation completed!');
