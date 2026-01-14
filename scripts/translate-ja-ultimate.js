#!/usr/bin/env node
/**
 * Ultimate Japanese Translation Script
 * Final pass - translates all remaining 208 keys
 */

const fs = require('fs');
const path = require('path');

const JA_PATH = path.join(__dirname, '../src/locales/ja.json');
const UNTRANSLATED_PATH = path.join(__dirname, 'untranslated-ja.json');

// Read files
const ja = JSON.parse(fs.readFileSync(JA_PATH, 'utf8'));
const untranslated = JSON.parse(fs.readFileSync(UNTRANSLATED_PATH, 'utf8'));

// Helper to set nested value
function deepSet(obj, path, value) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[parts[parts.length - 1]] = value;
}

// Comprehensive translations for all 208 keys
const translations = {
  // Simple keys
  'common.ok': 'OK',
  'auth.register.success.ok': 'OK',
  'units.km': 'km',
  'units.distanceKm': '{{distance}} km',
  'editProfile.common.ok': 'OK',
  'editClubPolicy.ok': 'OK',
  'teamInvitations.ok': 'OK',
  'createClubLeague.ok': 'OK',
  'manageAnnouncement.ok': 'OK',

  // Club Leagues Tournaments
  'clubLeaguesTournaments.memberPreLeagueStatus.period': '期間',
  'clubLeaguesTournaments.memberPreLeagueStatus.peopleUnit': '人',
  'clubLeaguesTournaments.memberPreLeagueStatus.format': '形式',
  'clubLeaguesTournaments.memberPreLeagueStatus.statusPreparing': '準備中',
  'clubLeaguesTournaments.memberPreLeagueStatus.applying': '申請中...',
  'clubLeaguesTournaments.memberPreLeagueStatus.notOpenWarning': '現在登録は受け付けていません',
  'clubLeaguesTournaments.memberPreLeagueStatus.applicationDate': '申請日:',
  'clubLeaguesTournaments.alerts.alreadyParticipant.title': '既に参加済みです',
  'clubLeaguesTournaments.alerts.applicationComplete.title': '登録完了',
  'clubLeaguesTournaments.alerts.registrationComplete.title': '登録完了',
  'clubLeaguesTournaments.alerts.teamConfirmed.titleTournament': '登録完了!',

  // Club Tournament Management
  'clubTournamentManagement.buttons.openRegistration': '登録受付開始',
  'clubTournamentManagement.common.confirm': 'OK',

  // Event Card
  'eventCard.labels.participants': '{{current}}/{{max}}',

  // Create Event
  'createEvent.alerts.confirm': 'OK',
  'createEvent.languages.japanese': '日本語',

  // Dues Management - Nested objects
  'duesManagement.alerts.ok': 'OK',
  'duesManagement.settings.venmo': 'Venmo',
  'duesManagement.modals.tapToUploadQr': 'タップしてQRコード画像をアップロード',
  'duesManagement.memberCard.owed': '未払い',
  'duesManagement.memberCard.lateFeeItems': '件',
  'duesManagement.paymentForm.transactionPlaceholder': '取引IDを入力',
  'duesManagement.paymentForm.notesPlaceholder': '備考を入力',
  'duesManagement.paymentDetails.method': '方法',
  'duesManagement.paymentDetails.requested': '要求済み',
  'duesManagement.types.quarterly': '四半期',
  'duesManagement.inputs.gracePeriodLabel': '猶予期間 (日)',
  'duesManagement.inputs.paymentMethodPlaceholder': '例: PayPal, KakaoPay',
  'duesManagement.inputs.addPaymentPlaceholder': '例: PayPal, KakaoPay',

  // Create Meetup
  'createMeetup.success.copied': 'ミートアップがコピーされました!',
  'createMeetup.court.courtNumbersPlaceholder': '例: 3, 4, 5',
  'createMeetup.buttons.confirming': '確認中...',
  'createMeetup.buttons.confirm': '✅ 確認',

  // Club Dues Management
  'clubDuesManagement.errors.invalidDueDay': '支払日は1～31の間である必要があります',
  'clubDuesManagement.success.remindersSent': 'リマインダーが送信されました',
  'clubDuesManagement.settings.monthly': '月額',
  'clubDuesManagement.settings.yearly': '年額',
  'clubDuesManagement.settings.gracePeriodPlaceholder': '日数',
  'clubDuesManagement.settings.dayUnit': '日',
  'clubDuesManagement.unpaid.reminderCount': '{{count}}件のリマインダーを送信しました',

  // Event Participation
  'eventParticipation.statusLabels.waitlisted': 'ウェイトリスト',
  'eventParticipation.typeLabels.league': 'リーグ',
  'eventParticipation.typeLabels.event': 'イベント',
  'eventParticipation.messages.joinSuccess': '参加しました',

  // Schedules
  'schedules.form.description': '説明',
  'schedules.form.type': 'タイプ',
  'schedules.form.recurring': '繰り返し',
  'schedules.form.participants': '参加者',

  // Modals
  'modals.leagueCompleted.title': 'リーグ完了',
  'modals.playoffCreated.title': 'プレーオフ作成',
  'modals.playoffCreated.message': 'プレーオフが作成されました',
  'modals.playoffCreated.ok': 'OK',

  // Create Club Tournament
  'createClubTournament.seedingMethods.elo': 'ELOベース',
  'createClubTournament.seedingMethods.random': 'ランダム',
  'createClubTournament.seedingMethods.manual': '手動',

  // Hall of Fame
  'hallOfFame.counts.trophies': '{{count}}個のトロフィー',
  'hallOfFame.counts.badges': '{{count}}個のバッジ',
  'hallOfFame.honorBadges.title': '名誉バッジ',

  // Club Communication
  'clubCommunication.timeAgo.yearsAgo': '{{count}}年前',
  'clubCommunication.validation.titleMinLength': 'タイトルは少なくとも{{min}}文字必要です',
  'clubCommunication.validation.contentMinLength': '内容は少なくとも{{min}}文字必要です',

  // AI Chat
  'aiChat.navigation.chat': 'チャット',
  'aiChat.navigation.settings': '設定',

  // Tournament Detail
  'tournamentDetail.bestFinish.quarterfinalist': 'ベスト8',
  'tournamentDetail.bestFinish.firstRound': '1回戦',

  // Event Chat
  'eventChat.errors.permissionDenied': '権限がありません',
  'eventChat.errors.notMember': 'メンバーではありません',

  // Record Score
  'recordScore.specialCases.doubleWalkover': 'ダブル不戦勝',
  'recordScore.alerts.saved': '保存されました',

  // League
  'league.genderLabels.mixed': '混合',
  'league.genderLabels.open': 'オープン',

  // Tournament
  'tournament.bestFinish.quarterfinalist': 'ベスト8',
  'tournament.bestFinish.firstRound': '1回戦',

  // Find Club
  'findClub.status.loading': '読み込み中...',
  'findClub.errors.notFound': '見つかりません',

  // Utils
  'utils.ltr.short': 'LTR',
  'utils.ltr.full': 'Lightning Tennis Rating',

  // Create Modal
  'createModal.lightningMeetup': 'ライトニングミートアップ',

  // My Club Settings
  'myClubSettings.alerts.updateSuccess': '更新されました',

  // Match Detail
  'matchDetail.status.upcoming': '予定',

  // NTRP Selector
  'ntrpSelector.levels.title': 'レベル選択',

  // Club Hall of Fame
  'clubHallOfFame.tabs.achievements': '実績',

  // Contexts
  'contexts.notification.title': '通知',

  // App Navigator
  'appNavigator.screens.discover': '発見',

  // Club Policies
  'clubPolicies.fees.title': '料金',

  // Services - Camera
  'services.camera.camera': 'カメラ',
  'services.camera.gallery': 'ギャラリー',
  'services.camera.fileSizeError': 'ファイルサイズ超過',

  // Services - Location
  'services.location.later': '後で',

  // Services - Feed
  'services.feed.deletePermissionDenied': '削除する権限がありません',
  'services.feed.reportTitle': '[フィード報告] {{contentSummary}}',

  // Services - Performance Analytics
  'services.performanceAnalytics.insights.lowFrequency.title': 'プレイ頻度を増やす必要があります',
  'services.performanceAnalytics.monthlyReport.improvements.serveSpeed': 'サーブスピード',
  'services.performanceAnalytics.monthlyReport.improvements.backhandStability':
    'バックハンド安定性',
  'services.performanceAnalytics.monthlyReport.improvements.netPlay': 'ネットプレイ',

  // Services - Leaderboard
  'services.leaderboard.period.today': '今日',
  'services.leaderboard.period.thisWeek': '今週',
  'services.leaderboard.period.thisMonth': '今月',
  'services.leaderboard.period.allTime': '全期間',
  'services.leaderboard.score': 'スコア',
  'services.leaderboard.record': '記録',
  'services.leaderboard.points': 'ポイント',
  'services.leaderboard.trend': 'トレンド',

  // Performance Dashboard
  'performanceDashboard.stats.totalWins': '総勝利数',
  'performanceDashboard.stats.totalLosses': '総敗北数',
  'performanceDashboard.charts.winLossRatio': '勝敗比',
  'performanceDashboard.weekLabels.Sun': '日',
  'performanceDashboard.weekLabels.Mon': '月',
  'performanceDashboard.weekLabels.Tue': '火',
  'performanceDashboard.weekLabels.Wed': '水',
  'performanceDashboard.weekLabels.Thu': '木',
  'performanceDashboard.weekLabels.Fri': '金',
  'performanceDashboard.weekLabels.Sat': '土',
  'performanceDashboard.dayLabels.Mon': '月',
  'performanceDashboard.dayLabels.Tue': '火',
  'performanceDashboard.dayLabels.Wed': '水',
  'performanceDashboard.dayLabels.Thu': '木',
  'performanceDashboard.dayLabels.Fri': '金',
  'performanceDashboard.dayLabels.Sat': '土',
  'performanceDashboard.dayLabels.Sun': '日',
  'performanceDashboard.insights.improvement': '改善中',
  'performanceDashboard.monthlyReport.generateReport': 'レポート作成',
  'performanceDashboard.monthlyReport.viewFullReport': '完全なレポートを表示',

  // AI Matching
  'aiMatching.results.refreshing': '更新中...',
  'aiMatching.results.clearFilters': 'フィルターをクリア',
  'aiMatching.results.noFilters': 'フィルターなし',
  'aiMatching.mockData.location1': '新宿',
  'aiMatching.mockData.location2': '渋谷',
  'aiMatching.mockData.location3': '品川',

  // Matches
  'matches.card.datetime': '日時',
  'matches.card.court': 'コート',
  'matches.skillLevels.expert': 'エキスパート',
  'matches.skillLevels.master': 'マスター',
  'matches.skillLevels.allLevels': '全レベル',
  'matches.skillLevels.custom': 'カスタム',
  'matches.recurringPatterns.biweekly': '隔週',
  'matches.createModal.creating': '作成中...',
  'matches.createModal.created': '作成されました',
  'matches.alerts.cancelled': 'キャンセルされました',
  'matches.mockData.court1': 'コート1',
  'matches.mockData.court2': 'コート2',
  'matches.mockData.court3': 'コート3',

  // League Detail
  'leagueDetail.standings.wins': '勝利',
  'leagueDetail.adminDashboard.manageSchedule': 'スケジュール管理',
  'leagueDetail.adminDashboard.viewLeaderboard': 'ランキング表示',
  'leagueDetail.leagueManagement.noParticipants': '参加者がいません',
  'leagueDetail.playoffs.bronze': 'ブロンズ',
  'leagueDetail.playoffs.gold': 'ゴールド',
  'leagueDetail.playoffs.silver': 'シルバー',
  'leagueDetail.playoffs.consolation': '敗者復活戦',
  'leagueDetail.dialogs.confirmDelete': '削除を確認',
  'leagueDetail.dialogs.confirmButton': '確認',
  'leagueDetail.genderLabels.coed': '男女混合',
  'leagueDetail.genderLabels.all': 'すべて',

  // Badge Gallery
  'badgeGallery.modal.rarity': 'レア度',
  'badgeGallery.modal.requirements': '要件',
  'badgeGallery.badges.twoFiftyMatches': '250マッチ',
  'badgeGallery.badges.twoHundredWins': '200勝',
  'badgeGallery.badges.perfectMonth': '完璧な月',
  'badgeGallery.badges.clubFounder': 'クラブ創設者',
  'badgeGallery.badges.socialButterfly': 'ソーシャルバタフライ',
  'badgeGallery.badges.earlyBird': '早起き鳥',
  'badgeGallery.badges.nightOwl': '夜フクロウ',
  'badgeGallery.alerts.newBadge': '新しいバッジ!',
  'badgeGallery.alerts.unlocked': 'アンロック!',

  // Types
  'types.match.casual': 'カジュアル',
  'types.match.competitive': '競技',
  'types.clubSchedule.monthlyFirst': '毎月第1',
  'types.clubSchedule.monthlyLast': '毎月最終',
  'types.clubSchedule.tuesThurs': '火・木',
  'types.clubSchedule.monWedFri': '月・水・金',
  'types.clubSchedule.weekend': '週末',
  'types.clubSchedule.irregular': '不定期',
  'types.clubSchedule.seasonal': '季節',
  'types.dues.semiannual': '半年',
  'types.dues.lifetime': '生涯',

  // Leagues
  'leagues.admin.pauseLeague': 'リーグを一時停止',
  'leagues.admin.resumeLeague': 'リーグを再開',
  'leagues.admin.cloneLeague': 'リーグを複製',
  'leagues.admin.exportData': 'データをエクスポート',
  'leagues.admin.importData': 'データをインポート',
  'leagues.admin.viewHistory': '履歴を表示',
  'leagues.match.walkover': '不戦勝',
  'leagues.match.disputed': '異議あり',
  'leagues.match.final': '最終',

  // Meetup Detail
  'meetupDetail.weather.feels': '体感',
  'meetupDetail.weather.uvIndex': 'UVインデックス',
  'meetupDetail.weather.visibility': '視界',
  'meetupDetail.weather.forecast': '予報',
  'meetupDetail.rsvp.interested': '興味あり',
  'meetupDetail.rsvp.attending': '参加',
  'meetupDetail.rsvp.notAttending': '不参加',
  'meetupDetail.chat.typing': '入力中...',

  // Match Request
  'matchRequest.skillLevel.any': 'すべて',
  'matchRequest.schedule.asap': 'できるだけ早く',
  'matchRequest.schedule.thisWeek': '今週',
  'matchRequest.schedule.nextWeek': '来週',
  'matchRequest.court.any': 'どこでも',

  // JSON object translations
  'profileSettings.privacy': JSON.stringify({
    title: 'プライバシー設定',
    message: 'プライバシー設定に移動します。',
    comingSoonTitle: '近日公開',
    comingSoonMessage: 'プライバシー設定機能は近日公開予定です。',
  }),

  'profileSettings.deleteAccount': JSON.stringify({
    title: 'アカウント削除',
    warningMessage:
      'アカウントを削除してもよろしいですか？\n\nこの操作は取り消せません。すべてのデータ（プロフィール、マッチ履歴、クラブメンバーシップ、友達）が完全に削除されます。',
    confirmNicknameTitle: 'ニックネームを確認',
    confirmNicknameMessage:
      'アカウント削除を続行するには、ニックネーム「{{nickname}}」を入力してください。',
    finalConfirmationTitle: '最終確認',
    finalConfirmationMessage:
      'アカウント「{{nickname}}」を完全に削除しようとしています。\n\nこの操作は取り消せません。',
    deleteButton: 'アカウント削除',
    nicknameRequiredTitle: 'ニックネームが必要です',
    nicknameRequiredMessage: 'アカウント削除を続行するには、ニックネームを入力してください。',
    completeTitle: '完了',
    completeMessage: 'アカウントが削除されました。',
    noticeTitle: '通知',
    noticeMessage: 'アカウント削除中に問題が発生しました。もう一度お試しください。',
  }),

  'duesManagement.status': JSON.stringify({
    paid: '支払済み',
    unpaid: '未払い',
    exempt: '免除',
    overdue: '延滞',
    pending: '保留中',
  }),

  'duesManagement.overdue': JSON.stringify({
    membersWithOverdue: '延滞のあるメンバー',
    amountDue: '未払い金額',
    sendReminder: 'リマインダーを送信',
  }),
};

// Apply all translations
let count = 0;
for (const [path, value] of Object.entries(translations)) {
  try {
    deepSet(ja, path, value);
    count++;
  } catch (err) {
    console.error(`Error setting ${path}:`, err.message);
  }
}

console.log(`✅ Applied ${count} translations!`);
console.log('💾 Saving file...');

// Save
fs.writeFileSync(JA_PATH, JSON.stringify(ja, null, 2) + '\n', 'utf8');

console.log('✨ Complete! All translations applied.');
