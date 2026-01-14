#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
let es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

// Simple recursive replace - replaces ALL untranslated keys (where es[key] === en[key]) with Spanish
function translateAll(enObj, esObj = {}) {
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key]) && enObj[key] !== null) {
      esObj[key] = esObj[key] || {};
      translateAll(enObj[key], esObj[key]);
    } else if (typeof enObj[key] === 'string') {
      // Only translate if es equals en (untranslated)
      if (esObj[key] === enObj[key]) {
        esObj[key] = autoTranslate(enObj[key]);
      }
    }
  }
  return esObj;
}

// Auto-translate function with comprehensive rules
function autoTranslate(text) {
  // Direct word-for-word replacements (most common patterns)
  const directMap = {
    Error: 'Error',
    OK: 'OK',
    Venmo: 'Venmo',
    'Background Location Permission': 'Permiso de Ubicación en Segundo Plano',
    'Background location permission is needed for features such as match notifications.':
      'Se necesita permiso de ubicación en segundo plano para funciones como notificaciones de partidos.',
    'Location Services Disabled': 'Servicios de Ubicación Desactivados',
    'Location services are disabled. Please enable them in settings.':
      'Los servicios de ubicación están desactivados. Por favor actívalos en configuración.',
    "You don't have permission to delete": 'No tienes permiso para eliminar',
    '[Feed Report] {{contentSummary}}': '[Reporte de Feed] {{contentSummary}}',
    '🎾 Match Reminder': '🎾 Recordatorio de Partido',
    '🎾 Partner Invitation': '🎾 Invitación de Compañero',
    '🏟️ New Club Event: {{title}}': '🏟️ Nuevo Evento del Club: {{title}}',
    '⚡ New Lightning Match: {{title}}': '⚡ Nuevo Partido Lightning: {{title}}',
    '"{{title}}" match starts in {{minutes}} minutes!':
      '¡El partido "{{title}}" comienza en {{minutes}} minutos!',
    '{{inviterName}} invited you as a partner for "{{eventTitle}}" doubles match!':
      '¡{{inviterName}} te invitó como compañero para el partido de dobles "{{eventTitle}}"!',
    'Minimum participants not met. (Current: {{current}}, Required: {{required}})':
      'No se alcanzó el mínimo de participantes. (Actual: {{current}}, Requerido: {{required}})',
    '{{count}} team(s) need partner confirmation.':
      '{{count}} equipo(s) necesitan confirmación de compañero.',
    'Participant count must be {{required}} or use byes for this tournament format.':
      'El conteo de participantes debe ser {{required}} o usar byes para este formato de torneo.',
    'An error occurred during validation.': 'Ocurrió un error durante la validación.',
    'Maintaining High Win Rate': 'Manteniendo Alta Tasa de Victoria',
    'You are currently achieving an excellent win rate of {{winRate}}%.':
      'Actualmente estás logrando una excelente tasa de victoria del {{winRate}}%.',
    Auto: 'Auto',
    English: 'Inglés',
    中文: '中文',
    日本語: '日本語',
    Español: 'Español',
    Français: 'Français',
    'Display Name': 'Nombre para Mostrar',
    'Account/ID Info': 'Información de Cuenta/ID',
    'Add payment methods': 'Agregar métodos de pago',
    th: 'º',
    'Auto invoice has been enabled': 'La facturación automática ha sido activada',
    'Auto invoice has been disabled': 'La facturación automática ha sido desactivada',
    'Settings Updated': 'Configuración Actualizada',
    'Payment reminder for {{clubName}} dues': 'Recordatorio de pago para cuotas de {{clubName}}',
    '🎭 Start Accepting Applications': '🎭 Comenzar a Aceptar Solicitudes',
    'Correct Result': 'Resultado Correcto',
    Reschedule: 'Reprogramar',
    Court: 'Cancha',
    'Submitted Result (Pending Approval)': 'Resultado Enviado (Pendiente de Aprobación)',
    'Submit Result': 'Enviar Resultado',
    'Submit Result (Admin)': 'Enviar Resultado (Admin)',
    'No matches yet': 'Aún no hay partidos',
    'Matches will appear here once created.': 'Los partidos aparecerán aquí una vez creados.',
    'Reject Payment': 'Rechazar Pago',
    'Reject this payment?': '¿Rechazar este pago?',
    'Add Late Fee': 'Agregar Recargo por Mora',
    'Manage Late Fees': 'Gestionar Recargos por Mora',
    'Total Late Fees: ${{amount}}': 'Total de Recargos por Mora: ${{amount}}',
    'Delete Late Fee': 'Eliminar Recargo por Mora',
    'Delete this late fee?': '¿Eliminar este recargo por mora?',
    'Manage Join Fee': 'Gestionar Cuota de Ingreso',
    'Delete Join Fee': 'Eliminar Cuota de Ingreso',
    'Delete this join fee record?': '¿Eliminar este registro de cuota de ingreso?',
    'Set Exemption': 'Establecer Exención',
    'Set this member as dues exempt?': '¿Establecer este miembro como exento de cuotas?',
    'Remove Exemption': 'Remover Exención',
    'Remove exemption for this member?': '¿Remover exención para este miembro?',
    'Create Dues Record': 'Crear Registro de Cuotas',
    'Which type of record would you like to create for this member?':
      '¿Qué tipo de registro te gustaría crear para este miembro?',
    'Edit Dues Settings': 'Editar Configuración de Cuotas',
  };

  if (directMap[text]) return directMap[text];

  // For very long texts (legal documents), use a simplified Spanish version
  if (text.length > 500) {
    return text; // Keep English for now for legal documents (manual translation recommended)
  }

  // Pattern-based translations
  if (text.includes('📍') && text.includes('🕒')) {
    return text.replace('miles away', 'millas de distancia');
  }

  return text;
}

// Count untranslated
function countUntranslated(enObj, esObj) {
  let count = 0;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], esObj[key] || {});
    } else if (esObj[key] === enObj[key]) {
      count++;
    }
  }
  return count;
}

console.log('🌍 Final Complete Spanish Translation');
console.log('====================================\n');

const before = countUntranslated(en, es);
console.log(`📊 Untranslated before: ${before}\n`);

es = translateAll(en, es);

const after = countUntranslated(en, es);
console.log(`✅ Keys translated: ${before - after}`);
console.log(`📊 Remaining: ${after}\n`);

fs.writeFileSync(ES_PATH, JSON.stringify(es, null, 2), 'utf8');
console.log('💾 Saved to es.json\n');

if (after === 0) {
  console.log('🎉 ALL KEYS TRANSLATED!');
} else {
  console.log(`⚠️ ${after} keys still need manual translation (likely long legal texts)`);
}
