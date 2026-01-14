#!/usr/bin/env node
/**
 * Comprehensive Japanese Translation Script
 * Translates all 379 remaining untranslated keys
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const JA_PATH = path.join(__dirname, '../src/locales/ja.json');
const UNTRANSLATED_PATH = path.join(__dirname, 'untranslated-ja.json');

// Deep set utility to set nested values
function deepSet(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

// All translations mapped from untranslated keys
const translations = {
  // COMMON
  'common.ok': 'OK',
  'auth.register.success.ok': 'OK',
  'editProfile.common.ok': 'OK',

  // UNITS
  'units.km': 'km',
  'units.distanceKm': '{{distance}} km',

  // EDIT PROFILE - Activity Time
  'editProfile.activityTime.earlyMorning': '早朝 (6-9時)',
  'editProfile.activityTime.morning': '午前 (9-12時)',
  'editProfile.activityTime.lunch': 'お昼 (12-14時)',
  'editProfile.activityTime.afternoon': '午後 (14-18時)',
  'editProfile.activityTime.evening': '夕方 (18-21時)',
  'editProfile.activityTime.night': '夜 (21-24時)',

  // DISCOVER - Alerts
  'discover.alerts.cannotApply': '申請できません',
  'discover.alerts.canceled': 'キャンセルされました',
  'discover.alerts.chatError': 'チャットルームを開けません',
  'discover.alerts.chatAccessDenied': 'チャットルーム通知',
  'discover.alerts.quickMatch.cannotChallenge': 'チャレンジできません',
  'discover.alerts.quickMatch.ntrpOutOfRange': 'LPR {{ntrp}}はチャレンジ範囲外です (最大 +1.0)',
  'discover.alerts.quickMatch.challenge': 'チャレンジ',
  'discover.alerts.quickMatch.success': 'チャレンジを送信しました!',
  'discover.alerts.teamApplication.submitted': '申請が送信されました',
  'discover.alerts.teamApplication.success': '申請が完了しました',

  // SERVICES
  'services.map.cannotOpenApp': '{{appName}}を開けません',
  'services.map.appNotInstalled': '{{appName}}がインストールされていません',
  'services.map.install': 'インストール',
  'services.event.untitled': '無題',
  'services.activity.loginRequired': 'ログインが必要です',
  'services.activity.invalidApplication': '無効な申請です',
  'services.activity.notifications.playoffsQualifiedTitle': 'プレーオフ進出!',
  'services.activity.notifications.playoffsQualifiedMessage':
    'おめでとうございます！"{{leagueName}}"のプレーオフに進出しました！',
  'services.activity.pickleballUserFallback': 'テニスユーザー{{id}}',
  'services.camera.simulatorError':
    'iOSシミュレーターでギャラリーにアクセス中に問題が発生しました。実機でテストしてください。',
  'services.camera.imageSizeExceeded': '画像サイズが制限を超えています (最大 {{maxSize}}MB)',
  'services.camera.permissionDenied': 'カメラの許可が拒否されました',
  'services.camera.uploadFailed': '画像のアップロードに失敗しました',
  'services.location.permissionDenied': '位置情報の許可が拒否されました',
  'services.feed.couldNotLoadData': 'データを読み込めませんでした',
  'services.feed.tryAgainLater': '後でもう一度お試しください',
  'services.performanceAnalytics.noData': 'データがありません',
  'services.performanceAnalytics.error': 'エラーが発生しました',
  'services.performanceAnalytics.insufficientData': 'データが不足しています',
  'services.performanceAnalytics.calculating': '計算中...',
  'services.leaderboard.loading': '読み込み中...',
  'services.leaderboard.error': 'ランキングの読み込みに失敗しました',
  'services.leaderboard.noPlayers': 'プレイヤーがいません',
  'services.leaderboard.period.weekly': '週間',
  'services.leaderboard.period.monthly': '月間',
  'services.leaderboard.period.allTime': '全期間',
  'services.leaderboard.rank': '順位',
  'services.leaderboard.player': 'プレイヤー',

  // LEAGUE DETAIL
  'leagueDetail.alreadyAppliedOrJoined': '既に申請済み、または参加済みです',
  'leagueDetail.applicationComplete': '申請が完了しました',
  'leagueDetail.startPlayoffs': 'プレーオフ開始',
  'leagueDetail.fourthPlace': '4位',
  'leagueDetail.resultSubmitSuccess': '結果が送信されました',
  'leagueDetail.checkNetwork': 'ネットワーク接続を確認してください',
  'leagueDetail.bulkApprovalSuccess': 'すべての申請が承認されました',
  'leagueDetail.bulkApprovalPartial': '{{approved}}件の申請が承認されました（{{failed}}件失敗）',
  'leagueDetail.champion': 'チャンピオン',
  'leagueDetail.startAcceptingApplications': '申請受付開始',
  'leagueDetail.reasonLabel': '理由',
  'leagueDetail.walkoverReasonLabel': '不戦勝理由',
  'leagueDetail.standings.placement': '順位',
  'leagueDetail.adminDashboard.enterResultButton': '結果を入力',
  'leagueDetail.adminDashboard.notStartedYet': 'まだ開始されていません',
  'leagueDetail.leagueManagement.emptyLeagueMessage': '参加者がいません',
  'leagueDetail.playoffs.firstPlace': '1位',
  'leagueDetail.playoffs.secondPlace': '2位',
  'leagueDetail.playoffs.thirdPlace': '3位',
  'leagueDetail.playoffs.fourthPlace': '4位',
  'leagueDetail.dialogs.deleteConfirmMessage': 'このリーグを削除してもよろしいですか？',
  'leagueDetail.dialogs.deleteConfirmButton': '削除',
  'leagueDetail.genderLabels.mens': '男子',
  'leagueDetail.genderLabels.womens': '女子',

  // PERFORMANCE DASHBOARD
  'performanceDashboard.periods.week': '週',
  'performanceDashboard.periods.month': '月',
  'performanceDashboard.periods.year': '年',
  'performanceDashboard.stats.played': 'プレイ済み',
  'performanceDashboard.stats.winRate': '勝率',
  'performanceDashboard.charts.performanceTrend': 'パフォーマンス推移',
  'performanceDashboard.weekLabels.sun': '日',
  'performanceDashboard.weekLabels.mon': '月',
  'performanceDashboard.weekLabels.tue': '火',
  'performanceDashboard.weekLabels.wed': '水',
  'performanceDashboard.weekLabels.thu': '木',
  'performanceDashboard.weekLabels.fri': '金',
  'performanceDashboard.weekLabels.sat': '土',
  'performanceDashboard.dayLabels.monday': '月曜日',
  'performanceDashboard.dayLabels.tuesday': '火曜日',
  'performanceDashboard.dayLabels.wednesday': '水曜日',
  'performanceDashboard.dayLabels.thursday': '木曜日',
  'performanceDashboard.dayLabels.friday': '金曜日',
  'performanceDashboard.dayLabels.saturday': '土曜日',
  'performanceDashboard.dayLabels.sunday': '日曜日',
  'performanceDashboard.insights.noDataMessage': '表示するデータがありません',
  'performanceDashboard.monthlyReport.title': '月次レポート',
  'performanceDashboard.monthlyReport.viewReport': 'レポートを表示',
  'performanceDashboard.detailedAnalysis.title': '詳細分析',

  // AI MATCHING
  'aiMatching.results.noMatches': 'マッチが見つかりませんでした',
  'aiMatching.results.tryAdjustFilters': 'フィルターを調整してみてください',
  'aiMatching.results.searchAgain': '再検索',
  'aiMatching.candidate.skillCompatibility': 'スキル相性',
  'aiMatching.candidate.availabilityMatch': '空き状況マッチ',
  'aiMatching.candidate.locationProximity': '場所の近さ',
  'aiMatching.candidate.playStyleSimilarity': 'プレイスタイル類似度',
  'aiMatching.candidate.lastActive': '最終アクティブ',
  'aiMatching.candidate.preferredTime': '希望時間帯',
  'aiMatching.candidate.courtLocation': 'コート場所',
  'aiMatching.candidate.matchScore': 'マッチスコア',
  'aiMatching.candidate.viewFullProfile': 'プロフィール全体を表示',
  'aiMatching.candidate.sendMatchRequest': 'マッチリクエストを送信',
  'aiMatching.candidate.availability.high': '高',
  'aiMatching.candidate.availability.medium': '中',
  'aiMatching.candidate.availability.low': '低',
  'aiMatching.mockData.player1': 'プレイヤー1',
  'aiMatching.mockData.player2': 'プレイヤー2',
  'aiMatching.mockData.player3': 'プレイヤー3',

  // DUES MANAGEMENT
  'duesManagement.status.current': '最新',
  'duesManagement.alerts.paymentSuccess': '支払いが完了しました',
  'duesManagement.settings.enableAutoPay': '自動支払いを有効にする',
  'duesManagement.modals.confirmPaymentTitle': '支払いを確認',
  'duesManagement.memberCard.memberSince': '入会日',
  'duesManagement.memberCard.unpaidMonths': '未払い月数',
  'duesManagement.overdue.title': '延滞',
  'duesManagement.paymentForm.cardNumber': 'カード番号',
  'duesManagement.paymentForm.expiryDate': '有効期限',
  'duesManagement.paymentDetails.invoice': '請求書',
  'duesManagement.paymentDetails.receipt': '領収書',
  'duesManagement.types.monthly': '月額',
  'duesManagement.types.annual': '年額',
  'duesManagement.inputs.amountLabel': '金額',
  'duesManagement.inputs.amountPlaceholder': '金額を入力',
  'duesManagement.inputs.dueDateLabel': '支払期限',

  // MATCHES
  'matches.card.courtInfo': 'コート情報',
  'matches.card.timeRemaining': '残り時間',
  'matches.skillLevels.beginner': '初級',
  'matches.skillLevels.intermediate': '中級',
  'matches.skillLevels.advanced': '上級',
  'matches.skillLevels.professional': 'プロフェッショナル',
  'matches.recurringPatterns.daily': '毎日',
  'matches.recurringPatterns.weekly': '毎週',
  'matches.recurringPatterns.biweekly': '隔週',
  'matches.recurringPatterns.monthly': '毎月',
  'matches.createModal.successTitle': 'マッチ作成成功',
  'matches.createModal.successMessage': 'マッチが正常に作成されました',
  'matches.alerts.error': 'エラーが発生しました',
  'matches.mockData.player1': 'プレイヤー1',
  'matches.mockData.player2': 'プレイヤー2',
  'matches.mockData.player3': 'プレイヤー3',

  // CLUB LEAGUES TOURNAMENTS
  'clubLeaguesTournaments.labels.startDate': '開始日',
  'clubLeaguesTournaments.labels.endDate': '終了日',
  'clubLeaguesTournaments.memberPreLeagueStatus.notEligible': '参加資格なし',
  'clubLeaguesTournaments.memberPreLeagueStatus.eligible': '参加可能',
  'clubLeaguesTournaments.memberPreLeagueStatus.pending': '保留中',
  'clubLeaguesTournaments.memberPreLeagueStatus.approved': '承認済み',
  'clubLeaguesTournaments.memberPreLeagueStatus.rejected': '拒否',
  'clubLeaguesTournaments.memberPreLeagueStatus.joined': '参加済み',
  'clubLeaguesTournaments.memberPreLeagueStatus.full': '満員',
  'clubLeaguesTournaments.alerts.applicationSubmitted': '申請が送信されました',
  'clubLeaguesTournaments.alerts.applicationApproved': '申請が承認されました',
  'clubLeaguesTournaments.alerts.applicationRejected': '申請が拒否されました',
  'clubLeaguesTournaments.alerts.alreadyJoined': '既に参加済みです',

  // CLUB DUES MANAGEMENT
  'clubDuesManagement.errors.loadFailed': '読み込みに失敗しました',
  'clubDuesManagement.success.saved': '保存されました',
  'clubDuesManagement.settings.enableDues': '会費を有効にする',
  'clubDuesManagement.settings.monthlyAmount': '月額',
  'clubDuesManagement.settings.dueDay': '支払日',
  'clubDuesManagement.settings.currency': '通貨',
  'clubDuesManagement.settings.graceperiod': '猶予期間',
  'clubDuesManagement.settings.autoInvoice': '自動請求書',
  'clubDuesManagement.unpaid.sendReminder': 'リマインダーを送信',
  'clubDuesManagement.autoInvoice.enabled': '有効',
  'clubDuesManagement.autoInvoice.disabled': '無効',

  // MEETUP DETAIL
  'meetupDetail.weather.temperature': '気温',
  'meetupDetail.weather.conditions': '天候',
  'meetupDetail.weather.wind': '風',
  'meetupDetail.weather.humidity': '湿度',
  'meetupDetail.weather.precipitation': '降水量',
  'meetupDetail.weather.loading': '天気を読み込み中...',
  'meetupDetail.weather.unavailable': '天気情報が利用できません',
  'meetupDetail.rsvp.going': '参加',
  'meetupDetail.rsvp.notGoing': '不参加',
  'meetupDetail.rsvp.maybe': '未定',
  'meetupDetail.chat.sendMessage': 'メッセージを送信',

  // BADGE GALLERY
  'badgeGallery.modal.earnedOn': '獲得日',
  'badgeGallery.modal.description': '説明',
  'badgeGallery.badges.firstMatch': '初マッチ',
  'badgeGallery.badges.tenMatches': '10マッチ',
  'badgeGallery.badges.fiftyMatches': '50マッチ',
  'badgeGallery.badges.hundredMatches': '100マッチ',
  'badgeGallery.badges.firstWin': '初勝利',
  'badgeGallery.badges.tenWins': '10勝',
  'badgeGallery.badges.perfectWeek': '完璧な週',
  'badgeGallery.alerts.badgeEarned': 'バッジ獲得!',
  'badgeGallery.alerts.congratulations': 'おめでとうございます！',

  // TYPES
  'types.match.singles': 'シングルス',
  'types.match.doubles': 'ダブルス',
  'types.clubSchedule.oneTime': '1回限り',
  'types.clubSchedule.daily': '毎日',
  'types.clubSchedule.weekly': '毎週',
  'types.clubSchedule.biweekly': '隔週',
  'types.clubSchedule.monthly': '毎月',
  'types.clubSchedule.custom': 'カスタム',
  'types.clubSchedule.everyWeekday': '平日',
  'types.dues.monthly': '月額',
  'types.dues.annual': '年額',

  // CLUB COMMUNICATION
  'clubCommunication.timeAgo.justNow': 'たった今',
  'clubCommunication.timeAgo.minutesAgo': '{{count}}分前',
  'clubCommunication.timeAgo.hoursAgo': '{{count}}時間前',
  'clubCommunication.timeAgo.daysAgo': '{{count}}日前',
  'clubCommunication.timeAgo.weeksAgo': '{{count}}週間前',
  'clubCommunication.timeAgo.monthsAgo': '{{count}}ヶ月前',
  'clubCommunication.validation.titleRequired': 'タイトルは必須です',
  'clubCommunication.validation.contentRequired': '内容は必須です',
  'clubCommunication.validation.titleTooLong': 'タイトルが長すぎます',
  'clubCommunication.validation.contentTooLong': '内容が長すぎます',

  // LEAGUES
  'leagues.admin.startLeague': 'リーグ開始',
  'leagues.admin.endLeague': 'リーグ終了',
  'leagues.admin.cancelLeague': 'リーグキャンセル',
  'leagues.admin.editLeague': 'リーグ編集',
  'leagues.admin.deleteLeague': 'リーグ削除',
  'leagues.admin.manageParticipants': '参加者管理',
  'leagues.match.scheduled': '予定',
  'leagues.match.inProgress': '進行中',
  'leagues.match.completed': '完了',

  // EMAIL LOGIN
  'emailLogin.title.signIn': 'サインイン',
  'emailLogin.buttons.signIn': 'サインイン',
  'emailLogin.buttons.signUp': 'サインアップ',
  'emailLogin.toggle.signUp': 'アカウント作成',
  'emailLogin.emailStatus.verified': '確認済み',
  'emailLogin.verification.title': 'メール確認',
  'emailLogin.alerts.success': '成功',
  'emailLogin.alerts.error': 'エラー',

  // SCORE CONFIRMATION
  'scoreConfirmation.submittedAt': '送信日時',
  'scoreConfirmation.agree': '同意する',
  'scoreConfirmation.disagree': '同意しない',
  'scoreConfirmation.reasonLabel': '理由',
  'scoreConfirmation.warningTitle': '警告',
  'scoreConfirmation.submitDisagree': '異議を送信',
  'scoreConfirmation.submitDefault': '送信',

  // CLUB OVERVIEW SCREEN
  'clubOverviewScreen.playoffsInProgress': 'プレーオフ進行中',
  'clubOverviewScreen.emptyStateMemberTitle': 'まだアクティビティがありません',
  'clubOverviewScreen.emptyStateGuestTitle': 'クラブに参加してアクティビティを確認',
  'clubOverviewScreen.emptyStateGuestAction1': '参加してアクティビティを確認',
  'clubOverviewScreen.aiHelperHint': 'AIアシスタントに質問してみませんか？',
  'clubOverviewScreen.aiHelperButton': 'AIに質問',
  'clubOverviewScreen.aiHelperSubtext': 'クラブについて何でも聞いてください',

  // MANAGE ANNOUNCEMENT
  'manageAnnouncement.title': 'お知らせ管理',
  'manageAnnouncement.ok': 'OK',
  'manageAnnouncement.savedSuccess': '保存されました',
  'manageAnnouncement.contentLabel': '内容',
  'manageAnnouncement.importantNotice': '重要なお知らせ',
  'manageAnnouncement.importantNoticeDescription': 'この機能はまもなく利用可能になります',

  // POLICY EDIT SCREEN
  'policyEditScreen.quickInsert': 'クイック挿入',
  'policyEditScreen.section': 'セクション',
  'policyEditScreen.characters': '文字',
  'policyEditScreen.modified': '変更済み',
  'policyEditScreen.unsavedChangesMessage': '保存されていない変更があります',
  'policyEditScreen.dontSave': '保存しない',

  // CREATE CLUB TOURNAMENT
  'createClubTournament.seedingMethod': 'シーディング方法',
  'createClubTournament.seedingMethods.manual': '手動',
  'createClubTournament.seedingMethods.random': 'ランダム',
  'createClubTournament.seedingMethods.elo': 'ELOベース',
  'createClubTournament.seedingMethods.none': 'なし',

  // TOURNAMENT DETAIL
  'tournamentDetail.participantsSuffix': '人',
  'tournamentDetail.bestFinish.champion': 'チャンピオン',
  'tournamentDetail.bestFinish.runnerUp': '準優勝',
  'tournamentDetail.bestFinish.semifinalist': 'ベスト4',
  'tournamentDetail.bestFinish.quarterfinalist': 'ベスト8',

  // MATCH REQUEST
  'matchRequest.skillLevel': 'スキルレベル',
  'matchRequest.schedule.preferredDate': '希望日',
  'matchRequest.schedule.preferredTime': '希望時間',
  'matchRequest.schedule.flexibility': '柔軟性',
  'matchRequest.court': 'コート',

  // MAP APP SELECTOR
  'mapAppSelector.appNotInstalled': 'アプリ未インストール',
  'mapAppSelector.appNotInstalledMessage': '{{appName}}がインストールされていません',
  'mapAppSelector.install': 'インストール',
  'mapAppSelector.installed': 'インストール済み',
  'mapAppSelector.checkingApps': 'アプリ確認中...',

  // MY ACTIVITIES
  'myActivities.profile': 'プロフィール',
  'myActivities.stats': '統計',
  'myActivities.settings': '設定',
  'myActivities.alerts.error': 'エラー',

  // CREATE MEETUP
  'createMeetup.success': '作成成功',
  'createMeetup.court': 'コート',
  'createMeetup.buttons.create': '作成',
  'createMeetup.buttons.cancel': 'キャンセル',

  // ACTIVITY TAB
  'activityTab.chatRoomNotice': 'チャットルーム通知',
  'activityTab.cannotOpenChat': 'チャットを開けません',
  'activityTab.appliedTab': '申請済み',
  'activityTab.hostedTab': '主催',

  // EVENT PARTICIPATION
  'eventParticipation.statusLabels.pending': '保留中',
  'eventParticipation.typeLabels.match': 'マッチ',
  'eventParticipation.typeLabels.tournament': 'トーナメント',
  'eventParticipation.messages.success': '成功',

  // EDIT CLUB POLICY
  'editClubPolicy.ok': 'OK',
  'editClubPolicy.unsavedChangesMessage': '保存されていない変更があります',
  'editClubPolicy.recurring': '繰り返し',
  'editClubPolicy.unsavedChangesWarning': '変更が保存されていません',

  // TOURNAMENT
  'tournament.bestFinish.champion': 'チャンピオン',
  'tournament.bestFinish.runnerUp': '準優勝',
  'tournament.bestFinish.semifinalist': 'ベスト4',
  'tournament.bestFinish.quarterfinalist': 'ベスト8',

  // CLUB POLICIES SCREEN
  'clubPoliciesScreen.regularMeetings': '定例ミーティング',
  'clubPoliciesScreen.recurring': '繰り返し',
  'clubPoliciesScreen.dueDateValue': '支払期限値',
  'clubPoliciesScreen.qrCodeTitle': 'QRコード',

  // SCHEDULES
  'schedules.form.title': 'タイトル',
  'schedules.form.date': '日付',
  'schedules.form.time': '時間',
  'schedules.form.location': '場所',

  // MODALS
  'modals.leagueCompleted': 'リーグ完了',
  'modals.playoffCreated.title': 'プレーオフ作成',
  'modals.playoffCreated.message': 'プレーオフが作成されました',
  'modals.playoffCreated.ok': 'OK',

  // FEED CARD
  'feedCard.daysAgo': '{{count}}日前',
  'feedCard.newMemberJoined': '新メンバーが参加しました',
  'feedCard.actorActivity': '{{actor}}のアクティビティ',
  'feedCard.feedTextError': 'フィードテキストエラー',

  // CREATE EVENT
  'createEvent.dateFormat': '日付形式',
  'createEvent.alerts.success': 'イベントが作成されました',
  'createEvent.languages.english': '英語',

  // CREATE CLUB LEAGUE
  'createClubLeague.selectedInfo': '選択済み情報',
  'createClubLeague.applicationDeadline': '申請締切',
  'createClubLeague.ok': 'OK',

  // LESSON CARD
  'lessonCard.consultButton': '相談',
  'lessonCard.currencySuffix': '円',
  'lessonCard.capacity': '定員',

  // AI CHAT
  'aiChat.navigation.home': 'ホーム',
  'aiChat.navigation.history': '履歴',
  'aiChat.loginRequired': 'ログインが必要です',

  // ELO TREND
  'eloTrend.titleBase': 'ELO推移',
  'eloTrend.soloLobby': 'ソロロビー',
  'eloTrend.friendInvite': '友達招待',

  // HALL OF FAME
  'hallOfFame.counts.trophy': '{{count}}個のトロフィー',
  'hallOfFame.counts.badge': '{{count}}個のバッジ',
  'hallOfFame.honorBadges': '名誉バッジ',

  // RECORD SCORE
  'recordScore.specialCases.walkover': '不戦勝',
  'recordScore.retired': '途中棄権',
  'recordScore.alerts.success': '記録されました',

  // PARTICIPANT SELECTOR
  'participantSelector.peopleSuffix': '人',
  'participantSelector.customInput': 'カスタム入力',
  'participantSelector.placeholder': '名前を入力',

  // CLUB DETAIL SCREEN
  'clubDetailScreen.joinWaiting': '参加待機中',
  'clubDetailScreen.reapply': '再申請',
  'clubDetailScreen.joinMessagePlaceholder': '参加メッセージを入力',

  // CLUB POLICIES
  'clubPolicies.recurring': '繰り返し',
  'clubPolicies.fees': '料金',
  'clubPolicies.qrModal.title': 'QRコード',

  // FIND CLUB
  'findClub.searchResults': '検索結果',
  'findClub.status.searching': '検索中...',
  'findClub.errors.loadFailed': '読み込みに失敗しました',

  // CLUB TOURNAMENT MANAGEMENT
  'clubTournamentManagement.buttons.startTournament': 'トーナメント開始',
  'clubTournamentManagement.common.participants': '参加者',

  // PROFILE SETTINGS
  'profileSettings.privacy.title': 'プライバシー',
  'profileSettings.deleteAccount.title': 'アカウント削除',

  // REGULAR MEETUP
  'regularMeetup.regularMeetupTitle': '定例ミートアップ',
  'regularMeetup.crowdOk': '混雑OK',

  // MANAGE LEAGUE PARTICIPANTS
  'manageLeagueParticipants.enterResult': '結果を入力',
  'manageLeagueParticipants.resultPreview': '結果プレビュー',

  // PLAYER CARD
  'playerCard.notAvailable': '利用不可',
  'playerCard.skilled': '熟練',

  // EVENT CHAT
  'eventChat.errors.loadFailed': '読み込みに失敗しました',
  'eventChat.errors.sendFailed': '送信に失敗しました',

  // ACHIEVEMENTS GUIDE
  'achievementsGuide.seasonTrophies': 'シーズントロフィー',
  'achievementsGuide.notYetEarned': '未獲得',

  // CLUB HALL OF FAME
  'clubHallOfFame.tabs.trophies': 'トロフィー',
  'clubHallOfFame.tabs.badges': 'バッジ',

  // LEAGUE
  'league.genderLabels.mens': '男子',
  'league.genderLabels.womens': '女子',

  // FIND CLUB SCREEN
  'findClubScreen.joinComplete': '参加完了',
  'findClubScreen.joinDeclined': '参加辞退',

  // UTILS
  'utils.ltr.short': 'LPR',
  'utils.ltr.full': 'Lightning Pickleball Rating',

  // EVENT CARD
  'eventCard.labels.organizer': '主催者',

  // TEAM INVITATIONS
  'teamInvitations.ok': 'OK',

  // CREATE MODAL
  'createModal.lightningMeetup': 'ライトニングミートアップ',

  // MY CLUB SETTINGS
  'myClubSettings.alerts.saved': '保存されました',

  // MATCH DETAIL
  'matchDetail.status.upcoming': '予定',

  // NTRP SELECTOR
  'ntrpSelector.levels.title': 'レベル選択',

  // CONTEXTS
  'contexts.notification.title': '通知',

  // ROLE MANAGEMENT
  'roleManagement.roleChangeTitle': '役割変更',

  // APP NAVIGATOR
  'appNavigator.screens.home': 'ホーム',
};

// Find untranslated keys (where ja value === en value)
function findUntranslated(en, ja, currentPath = '', results = []) {
  for (const key in en) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    const enValue = en[key];
    const jaValue = ja[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      if (typeof jaValue === 'object' && !Array.isArray(jaValue)) {
        findUntranslated(enValue, jaValue, newPath, results);
      }
    } else {
      if (!jaValue || jaValue === enValue) {
        results.push({ path: newPath, en: enValue, ja: jaValue });
      }
    }
  }

  return results;
}

async function main() {
  console.log('🇯🇵 Comprehensive Japanese Translation');
  console.log('======================================\n');

  // Load existing files
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const ja = JSON.parse(fs.readFileSync(JA_PATH, 'utf8'));

  // Find untranslated keys before
  const untranslatedBefore = findUntranslated(en, ja);
  console.log(`📊 Untranslated keys before: ${untranslatedBefore.length}`);

  // Apply translations
  let updated = JSON.parse(JSON.stringify(ja)); // Deep clone
  let translatedCount = 0;

  for (const [path, value] of Object.entries(translations)) {
    const enValue = path.split('.').reduce((obj, key) => obj?.[key], en);
    const currentJaValue = path.split('.').reduce((obj, key) => obj?.[key], ja);

    // Only translate if currently untranslated (matches English or is empty)
    if (!currentJaValue || currentJaValue === enValue) {
      deepSet(updated, path, value);
      translatedCount++;
    }
  }

  // Find untranslated keys after
  const untranslatedAfter = findUntranslated(en, updated);

  console.log(`✅ Keys translated: ${translatedCount}`);
  console.log(`📊 Untranslated keys remaining: ${untranslatedAfter.length}\n`);

  // Save updated file
  fs.writeFileSync(JA_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log('💾 File saved successfully!\n');

  if (untranslatedAfter.length > 0) {
    console.log('📋 Remaining untranslated keys (sample):');
    untranslatedAfter.slice(0, 20).forEach(item => {
      console.log(`  ${item.path}: "${item.en}"`);
    });
  }

  console.log('\n✨ Translation complete!');
}

main().catch(console.error);
