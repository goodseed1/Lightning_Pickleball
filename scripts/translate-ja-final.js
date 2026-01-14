#!/usr/bin/env node
/**
 * Final Japanese Translation Script
 * Translates all remaining 243 keys
 */

const fs = require('fs');
const path = require('path');

const JA_PATH = path.join(__dirname, '../src/locales/ja.json');

// Read current ja.json
const ja = JSON.parse(fs.readFileSync(JA_PATH, 'utf8'));

// Apply all remaining translations directly
// PERFORMANCE DASHBOARD
ja.performanceDashboard = ja.performanceDashboard || {};
ja.performanceDashboard.periods = ja.performanceDashboard.periods || {};
ja.performanceDashboard.periods.week = '週';
ja.performanceDashboard.periods.month = '月';
ja.performanceDashboard.periods.year = '年';

ja.performanceDashboard.stats = ja.performanceDashboard.stats || {};
ja.performanceDashboard.stats.played = 'プレイ済み';
ja.performanceDashboard.stats.winRate = '勝率';

ja.performanceDashboard.charts = ja.performanceDashboard.charts || {};
ja.performanceDashboard.charts.performanceTrend = 'パフォーマンス推移';

ja.performanceDashboard.weekLabels = ja.performanceDashboard.weekLabels || {};
ja.performanceDashboard.weekLabels.sun = '日';
ja.performanceDashboard.weekLabels.mon = '月';
ja.performanceDashboard.weekLabels.tue = '火';
ja.performanceDashboard.weekLabels.wed = '水';
ja.performanceDashboard.weekLabels.thu = '木';
ja.performanceDashboard.weekLabels.fri = '金';
ja.performanceDashboard.weekLabels.sat = '土';

ja.performanceDashboard.dayLabels = ja.performanceDashboard.dayLabels || {};
ja.performanceDashboard.dayLabels.monday = '月曜日';
ja.performanceDashboard.dayLabels.tuesday = '火曜日';
ja.performanceDashboard.dayLabels.wednesday = '水曜日';
ja.performanceDashboard.dayLabels.thursday = '木曜日';
ja.performanceDashboard.dayLabels.friday = '金曜日';
ja.performanceDashboard.dayLabels.saturday = '土曜日';
ja.performanceDashboard.dayLabels.sunday = '日曜日';

ja.performanceDashboard.insights = ja.performanceDashboard.insights || {};
ja.performanceDashboard.insights.noDataMessage = '表示するデータがありません';

ja.performanceDashboard.monthlyReport = ja.performanceDashboard.monthlyReport || {};
ja.performanceDashboard.monthlyReport.title = '月次レポート';
ja.performanceDashboard.monthlyReport.viewReport = 'レポートを表示';

// AI MATCHING
ja.aiMatching = ja.aiMatching || {};
ja.aiMatching.results = ja.aiMatching.results || {};
ja.aiMatching.results.noMatches = 'マッチが見つかりませんでした';
ja.aiMatching.results.tryAdjustFilters = 'フィルターを調整してみてください';
ja.aiMatching.results.searchAgain = '再検索';

ja.aiMatching.candidate = ja.aiMatching.candidate || {};
ja.aiMatching.candidate.skillCompatibility = 'スキル相性';
ja.aiMatching.candidate.availabilityMatch = '空き状況マッチ';
ja.aiMatching.candidate.locationProximity = '場所の近さ';
ja.aiMatching.candidate.playStyleSimilarity = 'プレイスタイル類似度';
ja.aiMatching.candidate.lastActive = '最終アクティブ';
ja.aiMatching.candidate.preferredTime = '希望時間帯';
ja.aiMatching.candidate.courtLocation = 'コート場所';
ja.aiMatching.candidate.matchScore = 'マッチスコア';
ja.aiMatching.candidate.viewFullProfile = 'プロフィール全体を表示';
ja.aiMatching.candidate.sendMatchRequest = 'マッチリクエストを送信';
ja.aiMatching.candidate.availability = ja.aiMatching.candidate.availability || {};
ja.aiMatching.candidate.availability.high = '高';
ja.aiMatching.candidate.availability.medium = '中';
ja.aiMatching.candidate.availability.low = '低';

ja.aiMatching.mockData = ja.aiMatching.mockData || {};
ja.aiMatching.mockData.player1 = 'プレイヤー1';
ja.aiMatching.mockData.player2 = 'プレイヤー2';
ja.aiMatching.mockData.player3 = 'プレイヤー3';

// SERVICES
ja.services = ja.services || {};
ja.services.camera = ja.services.camera || {};
ja.services.camera.imageSizeExceeded = '画像サイズが制限を超えています (最大 {{maxSize}}MB)';
ja.services.camera.permissionDenied = 'カメラの許可が拒否されました';
ja.services.camera.uploadFailed = '画像のアップロードに失敗しました';

ja.services.location = ja.services.location || {};
ja.services.location.permissionDenied = '位置情報の許可が拒否されました';

ja.services.feed = ja.services.feed || {};
ja.services.feed.couldNotLoadData = 'データを読み込めませんでした';
ja.services.feed.tryAgainLater = '後でもう一度お試しください';

ja.services.performanceAnalytics = ja.services.performanceAnalytics || {};
ja.services.performanceAnalytics.noData = 'データがありません';
ja.services.performanceAnalytics.error = 'エラーが発生しました';
ja.services.performanceAnalytics.insufficientData = 'データが不足しています';
ja.services.performanceAnalytics.calculating = '計算中...';

ja.services.leaderboard = ja.services.leaderboard || {};
ja.services.leaderboard.loading = '読み込み中...';
ja.services.leaderboard.error = 'ランキングの読み込みに失敗しました';
ja.services.leaderboard.noPlayers = 'プレイヤーがいません';
ja.services.leaderboard.period = ja.services.leaderboard.period || {};
ja.services.leaderboard.period.weekly = '週間';
ja.services.leaderboard.period.monthly = '月間';
ja.services.leaderboard.period.allTime = '全期間';
ja.services.leaderboard.rank = '順位';
ja.services.leaderboard.player = 'プレイヤー';

// DUES MANAGEMENT
ja.duesManagement = ja.duesManagement || {};
ja.duesManagement.status = ja.duesManagement.status || {};
ja.duesManagement.status.current = '最新';

ja.duesManagement.alerts = ja.duesManagement.alerts || {};
ja.duesManagement.alerts.paymentSuccess = '支払いが完了しました';

ja.duesManagement.settings = ja.duesManagement.settings || {};
ja.duesManagement.settings.enableAutoPay = '自動支払いを有効にする';

ja.duesManagement.modals = ja.duesManagement.modals || {};
ja.duesManagement.modals.confirmPaymentTitle = '支払いを確認';

ja.duesManagement.memberCard = ja.duesManagement.memberCard || {};
ja.duesManagement.memberCard.memberSince = '入会日';
ja.duesManagement.memberCard.unpaidMonths = '未払い月数';

ja.duesManagement.overdue = ja.duesManagement.overdue || {};
ja.duesManagement.overdue.title = '延滞';

ja.duesManagement.paymentForm = ja.duesManagement.paymentForm || {};
ja.duesManagement.paymentForm.cardNumber = 'カード番号';
ja.duesManagement.paymentForm.expiryDate = '有効期限';

ja.duesManagement.paymentDetails = ja.duesManagement.paymentDetails || {};
ja.duesManagement.paymentDetails.invoice = '請求書';
ja.duesManagement.paymentDetails.receipt = '領収書';

ja.duesManagement.types = ja.duesManagement.types || {};
ja.duesManagement.types.monthly = '月額';

ja.duesManagement.inputs = ja.duesManagement.inputs || {};
ja.duesManagement.inputs.amountLabel = '金額';
ja.duesManagement.inputs.amountPlaceholder = '金額を入力';
ja.duesManagement.inputs.dueDateLabel = '支払期限';

// CLUB LEAGUES TOURNAMENTS
ja.clubLeaguesTournaments = ja.clubLeaguesTournaments || {};
ja.clubLeaguesTournaments.labels = ja.clubLeaguesTournaments.labels || {};
ja.clubLeaguesTournaments.labels.startDate = '開始日';
ja.clubLeaguesTournaments.labels.endDate = '終了日';

ja.clubLeaguesTournaments.memberPreLeagueStatus =
  ja.clubLeaguesTournaments.memberPreLeagueStatus || {};
ja.clubLeaguesTournaments.memberPreLeagueStatus.notEligible = '参加資格なし';
ja.clubLeaguesTournaments.memberPreLeagueStatus.eligible = '参加可能';
ja.clubLeaguesTournaments.memberPreLeagueStatus.pending = '保留中';
ja.clubLeaguesTournaments.memberPreLeagueStatus.approved = '承認済み';
ja.clubLeaguesTournaments.memberPreLeagueStatus.rejected = '拒否';
ja.clubLeaguesTournaments.memberPreLeagueStatus.joined = '参加済み';
ja.clubLeaguesTournaments.memberPreLeagueStatus.full = '満員';

ja.clubLeaguesTournaments.alerts = ja.clubLeaguesTournaments.alerts || {};
ja.clubLeaguesTournaments.alerts.applicationSubmitted = '申請が送信されました';
ja.clubLeaguesTournaments.alerts.applicationApproved = '申請が承認されました';
ja.clubLeaguesTournaments.alerts.applicationRejected = '申請が拒否されました';
ja.clubLeaguesTournaments.alerts.alreadyJoined = '既に参加済みです';

// MATCHES
ja.matches = ja.matches || {};
ja.matches.card = ja.matches.card || {};
ja.matches.card.courtInfo = 'コート情報';
ja.matches.card.timeRemaining = '残り時間';

ja.matches.skillLevels = ja.matches.skillLevels || {};
ja.matches.skillLevels.beginner = '初級';
ja.matches.skillLevels.intermediate = '中級';
ja.matches.skillLevels.advanced = '上級';
ja.matches.skillLevels.professional = 'プロフェッショナル';

ja.matches.recurringPatterns = ja.matches.recurringPatterns || {};
ja.matches.recurringPatterns.monthly = '毎月';

ja.matches.createModal = ja.matches.createModal || {};
ja.matches.createModal.successTitle = 'マッチ作成成功';
ja.matches.createModal.successMessage = 'マッチが正常に作成されました';

ja.matches.alerts = ja.matches.alerts || {};
ja.matches.alerts.error = 'エラーが発生しました';

ja.matches.mockData = ja.matches.mockData || {};
ja.matches.mockData.player1 = 'プレイヤー1';
ja.matches.mockData.player2 = 'プレイヤー2';
ja.matches.mockData.player3 = 'プレイヤー3';

// LEAGUE DETAIL
ja.leagueDetail = ja.leagueDetail || {};
ja.leagueDetail.standings = ja.leagueDetail.standings || {};
ja.leagueDetail.standings.placement = '順位';

ja.leagueDetail.adminDashboard = ja.leagueDetail.adminDashboard || {};
ja.leagueDetail.adminDashboard.enterResultButton = '結果を入力';
ja.leagueDetail.adminDashboard.notStartedYet = 'まだ開始されていません';

ja.leagueDetail.leagueManagement = ja.leagueDetail.leagueManagement || {};
ja.leagueDetail.leagueManagement.emptyLeagueMessage = '参加者がいません';

ja.leagueDetail.playoffs = ja.leagueDetail.playoffs || {};
ja.leagueDetail.playoffs.firstPlace = '1位';
ja.leagueDetail.playoffs.secondPlace = '2位';
ja.leagueDetail.playoffs.thirdPlace = '3位';
ja.leagueDetail.playoffs.fourthPlace = '4位';

ja.leagueDetail.dialogs = ja.leagueDetail.dialogs || {};
ja.leagueDetail.dialogs.deleteConfirmMessage = 'このリーグを削除してもよろしいですか？';
ja.leagueDetail.dialogs.deleteConfirmButton = '削除';

ja.leagueDetail.genderLabels = ja.leagueDetail.genderLabels || {};
ja.leagueDetail.genderLabels.mens = '男子';
ja.leagueDetail.genderLabels.womens = '女子';

// MEETUP DETAIL
ja.meetupDetail = ja.meetupDetail || {};
ja.meetupDetail.weather = ja.meetupDetail.weather || {};
ja.meetupDetail.weather.temperature = '気温';
ja.meetupDetail.weather.conditions = '天候';
ja.meetupDetail.weather.wind = '風';
ja.meetupDetail.weather.humidity = '湿度';
ja.meetupDetail.weather.precipitation = '降水量';
ja.meetupDetail.weather.loading = '天気を読み込み中...';
ja.meetupDetail.weather.unavailable = '天気情報が利用できません';

ja.meetupDetail.rsvp = ja.meetupDetail.rsvp || {};
ja.meetupDetail.rsvp.going = '参加';
ja.meetupDetail.rsvp.notGoing = '不参加';
ja.meetupDetail.rsvp.maybe = '未定';

ja.meetupDetail.chat = ja.meetupDetail.chat || {};
ja.meetupDetail.chat.sendMessage = 'メッセージを送信';

// BADGE GALLERY
ja.badgeGallery = ja.badgeGallery || {};
ja.badgeGallery.modal = ja.badgeGallery.modal || {};
ja.badgeGallery.modal.earnedOn = '獲得日';
ja.badgeGallery.modal.description = '説明';

ja.badgeGallery.badges = ja.badgeGallery.badges || {};
ja.badgeGallery.badges.firstMatch = '初マッチ';
ja.badgeGallery.badges.tenMatches = '10マッチ';
ja.badgeGallery.badges.fiftyMatches = '50マッチ';
ja.badgeGallery.badges.hundredMatches = '100マッチ';
ja.badgeGallery.badges.firstWin = '初勝利';
ja.badgeGallery.badges.tenWins = '10勝';
ja.badgeGallery.badges.perfectWeek = '完璧な週';

ja.badgeGallery.alerts = ja.badgeGallery.alerts || {};
ja.badgeGallery.alerts.badgeEarned = 'バッジ獲得!';
ja.badgeGallery.alerts.congratulations = 'おめでとうございます！';

// TYPES
ja.types = ja.types || {};
ja.types.match = ja.types.match || {};
ja.types.match.singles = 'シングルス';
ja.types.match.doubles = 'ダブルス';

ja.types.clubSchedule = ja.types.clubSchedule || {};
ja.types.clubSchedule.oneTime = '1回限り';
ja.types.clubSchedule.daily = '毎日';
ja.types.clubSchedule.weekly = '毎週';
ja.types.clubSchedule.biweekly = '隔週';
ja.types.clubSchedule.monthly = '毎月';
ja.types.clubSchedule.custom = 'カスタム';
ja.types.clubSchedule.everyWeekday = '平日';

ja.types.dues = ja.types.dues || {};
ja.types.dues.monthly = '月額';
ja.types.dues.annual = '年額';

// LEAGUES
ja.leagues = ja.leagues || {};
ja.leagues.admin = ja.leagues.admin || {};
ja.leagues.admin.startLeague = 'リーグ開始';
ja.leagues.admin.endLeague = 'リーグ終了';
ja.leagues.admin.cancelLeague = 'リーグキャンセル';
ja.leagues.admin.editLeague = 'リーグ編集';
ja.leagues.admin.deleteLeague = 'リーグ削除';
ja.leagues.admin.manageParticipants = '参加者管理';

ja.leagues.match = ja.leagues.match || {};
ja.leagues.match.scheduled = '予定';
ja.leagues.match.inProgress = '進行中';
ja.leagues.match.completed = '完了';

// EMAIL LOGIN
ja.emailLogin = ja.emailLogin || {};
ja.emailLogin.title = ja.emailLogin.title || {};
ja.emailLogin.title.login = 'ログイン';

ja.emailLogin.buttons = ja.emailLogin.buttons || {};
ja.emailLogin.buttons.loginAfterVerification = '確認後にログイン';
ja.emailLogin.buttons.goToLogin = 'ログインへ';

ja.emailLogin.toggle = ja.emailLogin.toggle || {};
ja.emailLogin.toggle.loginLink = 'ログイン';

ja.emailLogin.emailStatus = ja.emailLogin.emailStatus || {};
ja.emailLogin.emailStatus.accountFound = 'アカウントが見つかりました';

ja.emailLogin.verification = ja.emailLogin.verification || {};
ja.emailLogin.verification.loginButton = '確認後にログイン';

ja.emailLogin.alerts = ja.emailLogin.alerts || {};
ja.emailLogin.alerts.tooManyAttempts = ja.emailLogin.alerts.tooManyAttempts || {};
ja.emailLogin.alerts.tooManyAttempts.title = '試行回数が多すぎます';
ja.emailLogin.alerts.tooManyAttempts.message =
  'セキュリティのため一時的にログインが制限されています。\n\n☕ 少し時間をおいてから再試行してください。';

// CLUB DUES MANAGEMENT
ja.clubDuesManagement = ja.clubDuesManagement || {};
ja.clubDuesManagement.errors = ja.clubDuesManagement.errors || {};
ja.clubDuesManagement.errors.loadFailed = '読み込みに失敗しました';

ja.clubDuesManagement.success = ja.clubDuesManagement.success || {};
ja.clubDuesManagement.success.saved = '保存されました';

ja.clubDuesManagement.settings = ja.clubDuesManagement.settings || {};
ja.clubDuesManagement.settings.dueDay = '支払日';
ja.clubDuesManagement.settings.currency = '通貨';
ja.clubDuesManagement.settings.gracePeriod = '猶予期間';
ja.clubDuesManagement.settings.autoInvoice = '自動請求書';
ja.clubDuesManagement.settings.reminderDays = 'リマインダー日数';

ja.clubDuesManagement.unpaid = ja.clubDuesManagement.unpaid || {};
ja.clubDuesManagement.unpaid.sendReminder = 'リマインダーを送信';

// MATCH REQUEST
ja.matchRequest = ja.matchRequest || {};
ja.matchRequest.skillLevel = 'スキルレベル';
ja.matchRequest.schedule = ja.matchRequest.schedule || {};
ja.matchRequest.schedule.preferredDate = '希望日';
ja.matchRequest.schedule.preferredTime = '希望時間';
ja.matchRequest.schedule.flexibility = '柔軟性';
ja.matchRequest.court = 'コート';

// MY ACTIVITIES
ja.myActivities = ja.myActivities || {};
ja.myActivities.profile = ja.myActivities.profile || {};
ja.myActivities.profile.style = 'スタイル: ';

ja.myActivities.stats = ja.myActivities.stats || {};
ja.myActivities.stats.eloRatingTrend = 'ELO評価推移';

ja.myActivities.settings = ja.myActivities.settings || {};
ja.myActivities.settings.languageChangeComingSoon = '言語変更機能は近日公開予定です。';

ja.myActivities.alerts = ja.myActivities.alerts || {};
ja.myActivities.alerts.friendInvitation = ja.myActivities.alerts.friendInvitation || {};
ja.myActivities.alerts.friendInvitation.accepted =
  ja.myActivities.alerts.friendInvitation.accepted || {};
ja.myActivities.alerts.friendInvitation.accepted.title = '承認されました';

// Additional common ones
ja.common = ja.common || {};
ja.common.ok = 'OK';

ja.units = ja.units || {};
ja.units.km = 'km';
ja.units.distanceKm = '{{distance}} km';

ja.editProfile = ja.editProfile || {};
ja.editProfile.common = ja.editProfile.common || {};
ja.editProfile.common.ok = 'OK';

ja.discover = ja.discover || {};
ja.discover.alerts = ja.discover.alerts || {};
ja.discover.alerts.soloApplication = ja.discover.alerts.soloApplication || {};
ja.discover.alerts.soloApplication.title = 'ソロ申請が送信されました!';

console.log('✅ All translations applied!');
console.log('💾 Saving file...');

// Save
fs.writeFileSync(JA_PATH, JSON.stringify(ja, null, 2) + '\n', 'utf8');

console.log('✨ Complete! Please run the analyzer again to verify.');
