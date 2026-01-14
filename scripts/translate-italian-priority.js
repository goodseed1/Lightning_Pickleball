#!/usr/bin/env node
/**
 * Italian translations for priority sections:
 * - hostedEventCard (20 keys)
 * - duesManagement (26 keys)
 * - performanceDashboard (19 keys)
 * - services (26 keys)
 * TOTAL: 91 keys
 */

const fs = require('fs');
const path = require('path');

// Simple set value by path
function setValue(obj, path, value) {
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

const itPath = path.join(__dirname, '../src/locales/it.json');

console.log('🇮🇹 Translating Priority Sections (91 keys)...\n');

try {
  const itData = JSON.parse(fs.readFileSync(itPath, 'utf8'));

  // === HOSTED EVENT CARD (20 keys) ===
  const hostedEventCardTranslations = {
    'hostedEventCard.eventTypes.practice': 'Pratica',
    'hostedEventCard.eventTypes.meetup': 'Incontro',
    'hostedEventCard.eventTypes.casual': 'Casual',
    'hostedEventCard.buttons.chat': 'Chat',
    'hostedEventCard.weather.conditions.Mostly Cloudy': 'Parzialmente Nuvoloso',
    'hostedEventCard.weather.conditions.Overcast': 'Coperto',
    'hostedEventCard.weather.conditions.Fog': 'Nebbia',
    'hostedEventCard.weather.conditions.Rain': 'Pioggia',
    'hostedEventCard.weather.conditions.Heavy Rain': 'Forte Pioggia',
    'hostedEventCard.weather.conditions.Drizzle': 'Pioggerella',
    'hostedEventCard.weather.conditions.Showers': 'Rovesci',
    'hostedEventCard.weather.conditions.Thunderstorm': 'Temporale',
    'hostedEventCard.weather.conditions.Snow': 'Neve',
    'hostedEventCard.weather.conditions.Heavy Snow': 'Forte Nevicata',
    'hostedEventCard.weather.conditions.Sleet': 'Nevischio',
    'hostedEventCard.weather.conditions.Hail': 'Grandine',
    'hostedEventCard.weather.conditions.Windy': 'Ventoso',
    'hostedEventCard.weather.conditions.Humid': 'Umido',
    'hostedEventCard.weather.conditions.Hot': 'Caldo',
    'hostedEventCard.weather.conditions.Cold': 'Freddo',
  };

  // === DUES MANAGEMENT (26 keys) ===
  const duesManagementTranslations = {
    'duesManagement.alerts.ok': 'OK',
    'duesManagement.settings.venmo': 'Venmo',
    'duesManagement.modals.qrCodeDialog': 'Codice QR',
    'duesManagement.modals.noQrCodeYet': 'Nessun codice QR impostato ancora.',
    'duesManagement.modals.processPaymentDialog': 'Elabora Pagamento',
    'duesManagement.modals.paymentReminder': 'Promemoria Pagamento',
    'duesManagement.overview.collectionRate': 'Tasso di Riscossione',
    'duesManagement.memberCard.owed': 'Dovuto',
    'duesManagement.memberCard.joinFeeLabel': 'Quota Iscrizione',
    'duesManagement.memberCard.lateFeeLabel': 'Penale Ritardo',
    'duesManagement.memberCard.lateFeeItems': 'elementi',
    'duesManagement.memberCard.unpaidCount': '{{count}} non pagati',
    'duesManagement.report.noRecordsFound': 'Nessun record di pagamento trovato per {{year}}.',
    'duesManagement.paymentDetails.method': 'Metodo',
    'duesManagement.paymentDetails.paymentProof': 'Prova di Pagamento',
    'duesManagement.types.joinFee': 'Quota Iscrizione',
    'duesManagement.types.lateFee': 'Penale Ritardo',
    'duesManagement.types.quarterly': 'Trimestrale',
    'duesManagement.inputs.joinFeeDollar': 'Quota Iscrizione ($)',
    'duesManagement.inputs.monthlyFeeDollar': 'Quota Mensile ($)',
    'duesManagement.inputs.quarterlyFeeDollar': 'Quota Trimestrale ($)',
    'duesManagement.inputs.yearlyFeeDollar': 'Quota Annuale ($)',
    'duesManagement.inputs.lateFeeDollar': 'Penale Ritardo ($)',
    'duesManagement.inputs.paymentMethodPlaceholder': 'es. PayPal, KakaoPay',
    'duesManagement.inputs.addPaymentPlaceholder': 'es. PayPal, KakaoPay',
    'duesManagement.countSuffix': '',
  };

  // === PERFORMANCE DASHBOARD (19 keys) ===
  const performanceDashboardTranslations = {
    'performanceDashboard.charts.skillProgress.subtitle': 'In base alle ultime 10 partite',
    'performanceDashboard.charts.winRateTrend.subtitle':
      'Cambiamenti settimanali del tasso di vittoria',
    'performanceDashboard.charts.matchFrequency.subtitle': 'Partite medie',
    'performanceDashboard.charts.timePerformance.subtitle': 'Orari di gioco preferiti',
    'performanceDashboard.weekLabels.week1': 'Settimana 1',
    'performanceDashboard.weekLabels.week2': 'Settimana 2',
    'performanceDashboard.weekLabels.week3': 'Settimana 3',
    'performanceDashboard.weekLabels.week4': 'Settimana 4',
    'performanceDashboard.dayLabels.mon': 'Lun',
    'performanceDashboard.dayLabels.tue': 'Mar',
    'performanceDashboard.dayLabels.wed': 'Mer',
    'performanceDashboard.dayLabels.thu': 'Gio',
    'performanceDashboard.dayLabels.fri': 'Ven',
    'performanceDashboard.dayLabels.sat': 'Sab',
    'performanceDashboard.dayLabels.sun': 'Dom',
    'performanceDashboard.insights.title': 'Approfondimenti Prestazioni',
    'performanceDashboard.insights.recommendations': 'Raccomandazioni:',
    'performanceDashboard.monthlyReport.improvements': 'Aree di Miglioramento',
    'performanceDashboard.detailedAnalysis.title': 'Analisi Dettagliata',
  };

  // === SERVICES (26 keys) ===
  const servicesTranslations = {
    'services.camera.selectPhotoMessage': 'Come vorresti selezionare una foto?',
    'services.camera.gallerySaveNotice':
      'La funzione di salvataggio nella galleria è disponibile nella versione App Store.',
    'services.location.later': 'Dopo',
    'services.leaderboard.challenges.weeklyMatches.description':
      'Completa 5 partite questa settimana',
    'services.leaderboard.challenges.weeklyMatches.reward':
      '100 punti + badge "Guerriero Settimanale"',
    'services.leaderboard.challenges.winStreak.description': 'Ottieni 3 vittorie consecutive',
    'services.leaderboard.challenges.winStreak.reward': '200 punti + badge "Attaccante"',
    'services.leaderboard.challenges.monthlyImprovement.title': 'Miglioramento Mensile',
    'services.leaderboard.challenges.monthlyImprovement.description':
      'Migliora il livello di abilità di 5 punti',
    'services.leaderboard.challenges.monthlyImprovement.reward':
      '500 punti + badge "Re del Miglioramento"',
    'services.leaderboard.challenges.socialPlayer.reward': '300 punti + badge "Farfalla Sociale"',
    'services.leaderboard.achievements.firstWin.name': 'Prima Vittoria',
    'services.leaderboard.achievements.winStreak3.description': 'Vinci 3 partite di fila',
    'services.leaderboard.achievements.winStreak5.description': 'Vinci 5 partite di fila',
    'services.leaderboard.achievements.totalWins10.name': 'Collezionista di Vittorie',
    'services.leaderboard.achievements.totalWins10.description': 'Ottieni 10 vittorie totali',
    'services.leaderboard.achievements.totalWins50.name': 'Maestro delle Vittorie',
    'services.leaderboard.achievements.totalWins50.description': 'Ottieni 50 vittorie totali',
    'services.leaderboard.achievements.matchesPlayed10.description': 'Completa 10 partite totali',
    'services.leaderboard.achievements.matchesPlayed100.description': 'Completa 100 partite totali',
    'services.leaderboard.achievements.skillLevel70.description': 'Raggiungi livello abilità 70',
    'services.leaderboard.achievements.skillLevel85.description': 'Raggiungi livello abilità 85',
    'services.leaderboard.achievements.earlyBird.name': 'Mattiniero',
    'services.leaderboard.achievements.earlyBird.description':
      'Completa 10 partite prima delle 10:00',
    'services.leaderboard.achievements.nightOwl.name': 'Nottambulo',
    'services.leaderboard.achievements.nightOwl.description': 'Completa 10 partite dopo le 20:00',
  };

  // Apply all translations
  const allTranslations = {
    ...hostedEventCardTranslations,
    ...duesManagementTranslations,
    ...performanceDashboardTranslations,
    ...servicesTranslations,
  };

  Object.entries(allTranslations).forEach(([key, value]) => {
    setValue(itData, key, value);
  });

  // Write back
  fs.writeFileSync(itPath, JSON.stringify(itData, null, 2) + '\n', 'utf8');

  console.log('✅ Priority Sections Translated!\n');
  console.log('📊 Summary:');
  console.log('   • hostedEventCard: 20 keys (weather + types)');
  console.log('   • duesManagement: 26 keys (payment system)');
  console.log('   • performanceDashboard: 19 keys (stats/insights)');
  console.log('   • services: 26 keys (achievements/challenges)');
  console.log('\n   TOTAL: 91 keys\n');

  console.log(
    '🎯 Verification: node scripts/find-untranslated.js it | grep -E "(hostedEventCard|duesManagement|performanceDashboard|services)"\n'
  );
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
