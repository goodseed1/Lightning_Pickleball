#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const ptPath = path.join(__dirname, '../src/locales/pt.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

// Comprehensive word-by-word translation dictionary
const wordDict = {
  // Previous translations remain...
  all: 'todos',
  day: 'dia',
  week: 'semana',
  month: 'mês',
  year: 'ano',
  monday: 'segunda-feira',
  tuesday: 'terça-feira',
  wednesday: 'quarta-feira',
  thursday: 'quinta-feira',
  friday: 'sexta-feira',
  saturday: 'sábado',
  sunday: 'domingo',
  first: 'primeiro',
  second: 'segundo',
  third: 'terceiro',
  fourth: 'quarto',
  last: 'último',
  invite: 'convite',
  only: 'apenas',
  open: 'aberto',
  to: 'para',
  all: 'todos',
  cost: 'custo',
  per: 'por',
  person: 'pessoa',
  free: 'gratuito',
  event: 'evento',
  repeat: 'repetir',
  custom: 'personalizado',
  recurrence: 'recorrência',
  ends: 'termina',
  never: 'nunca',
  on: 'em',
  after: 'após',
  occurrences: 'ocorrências',
  weekly: 'semanalmente',
  monthly: 'mensalmente',
  yearly: 'anualmente',
  every: 'a cada',
  singles: 'simples',
  doubles: 'duplas',
  mixed: 'misto',
  men: 'masculino',
  women: 'feminino',
  juniors: 'juvenil',
  seniors: 'sênior',
  veterans: 'veteranos',
  wheelchair: 'cadeirante',
  recreational: 'recreativo',
  competitive: 'competitivo',
  beginner: 'iniciante',
  intermediate: 'intermediário',
  advanced: 'avançado',
  expert: 'especialista',
  professional: 'profissional',
  amateur: 'amador',
  casual: 'casual',
  serious: 'sério',
  friendly: 'amistoso',
  ranked: 'ranqueado',
  unranked: 'não ranqueado',
  indoor: 'indoor',
  outdoor: 'outdoor',
  hard: 'dura',
  clay: 'saibro',
  grass: 'grama',
  carpet: 'carpete',
  morning: 'manhã',
  afternoon: 'tarde',
  evening: 'noite',
};

// Smart translation function
function translatePhrase(text) {
  if (!text || typeof text !== 'string') return text;

  // Check if already translated (has Portuguese characters)
  if (/[áàâãéêíóôõúç]/i.test(text)) return text;

  // Try word-by-word translation
  const words = text.toLowerCase().split(/\s+/);
  const translated = words.map(word => wordDict[word] || word).join(' ');

  // Capitalize first letter if original was capitalized
  if (text[0] === text[0].toUpperCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }

  return translated;
}

// Recursively translate all untranslated keys
function translateAll(enObj, ptObj) {
  const result = { ...ptObj };

  for (const key in enObj) {
    const enValue = enObj[key];
    const ptValue = ptObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      result[key] = translateAll(enValue, ptValue || {});
    } else if (ptValue === enValue || ptValue === undefined) {
      result[key] = translatePhrase(enValue);
    }
  }

  return result;
}

console.log('🚀 Translating ALL remaining keys...');
const fullyTranslated = translateAll(en, pt);

fs.writeFileSync(ptPath, JSON.stringify(fullyTranslated, null, 2) + '\n', 'utf8');
console.log('✅ Complete! All keys processed.');
