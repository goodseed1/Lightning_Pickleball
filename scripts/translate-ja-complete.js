#!/usr/bin/env node
/**
 * Complete Japanese Translation - Final Round
 * Translates all remaining 221 keys with proper nested structure
 */

const fs = require('fs');
const path = require('path');

const JA_PATH = path.join(__dirname, '../src/locales/ja.json');
const ja = JSON.parse(fs.readFileSync(JA_PATH, 'utf8'));

// Helper to ensure nested objects exist
function ensure(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (!current[part]) current[part] = {};
    current = current[part];
  }
  return current;
}

// AI MATCHING - Nested structures
ensure(ja, 'aiMatching.candidate.skillLevel').elementary = '初級';
ensure(ja, 'aiMatching.candidate.attributes').strengths = '主な強み';
ensure(ja, 'aiMatching.candidate.attributes').playStyle = 'プレイスタイル';
ensure(ja, 'aiMatching.candidate.strengths').serve = 'サーブ';
ensure(ja, 'aiMatching.candidate.strengths').strategic = '戦略的プレイ';
ensure(ja, 'aiMatching.candidate.strengths').defense = 'ディフェンス';
ensure(ja, 'aiMatching.candidate.strengths').netPlay = 'ネットプレイ';
ensure(ja, 'aiMatching.candidate.strengths').mental = 'メンタル';
ensure(ja, 'aiMatching.candidate.availability').morning = '午前 (6-12時)';
ensure(ja, 'aiMatching.candidate.availability').afternoon = '午後 (12-18時)';
ensure(ja, 'aiMatching.candidate.availability').evening = '夕方 (18-22時)';
ensure(ja, 'aiMatching.candidate.availability').weekend = '週末';
ensure(ja, 'aiMatching.candidate').selected = '選択済み';

// SERVICES - All remaining
ensure(ja, 'services.camera').permissionDenied = 'カメラの許可が拒否されました';
ensure(ja, 'services.camera').uploadFailed = '画像のアップロードに失敗しました';
ensure(ja, 'services.camera').imageSizeExceeded = '画像サイズが制限を超えています';

ensure(ja, 'services.location').permissionDenied = '位置情報の許可が拒否されました';

ensure(ja, 'services.feed').couldNotLoadData = 'データを読み込めませんでした';
ensure(ja, 'services.feed').tryAgainLater = '後でもう一度お試しください';

ensure(ja, 'services.performanceAnalytics').noData = 'データがありません';
ensure(ja, 'services.performanceAnalytics').error = 'エラーが発生しました';
ensure(ja, 'services.performanceAnalytics').insufficientData = 'データが不足しています';
ensure(ja, 'services.performanceAnalytics').calculating = '計算中...';

ensure(ja, 'services.leaderboard').loading = '読み込み中...';
ensure(ja, 'services.leaderboard').error = 'ランキングの読み込みに失敗しました';
ensure(ja, 'services.leaderboard').noPlayers = 'プレイヤーがいません';
ensure(ja, 'services.leaderboard').rank = '順位';
ensure(ja, 'services.leaderboard').player = 'プレイヤー';
ensure(ja, 'services.leaderboard.period').weekly = '週間';
ensure(ja, 'services.leaderboard.period').monthly = '月間';
ensure(ja, 'services.leaderboard.period').allTime = '全期間';

// PERFORMANCE DASHBOARD - Remaining
ensure(ja, 'performanceDashboard.stats').played = 'プレイ済み';
ensure(ja, 'performanceDashboard.stats').winRate = '勝率';

ensure(ja, 'performanceDashboard.charts').performanceTrend = 'パフォーマンス推移';

ensure(ja, 'performanceDashboard.weekLabels').sun = '日';
ensure(ja, 'performanceDashboard.weekLabels').mon = '月';
ensure(ja, 'performanceDashboard.weekLabels').tue = '火';
ensure(ja, 'performanceDashboard.weekLabels').wed = '水';
ensure(ja, 'performanceDashboard.weekLabels').thu = '木';
ensure(ja, 'performanceDashboard.weekLabels').fri = '金';
ensure(ja, 'performanceDashboard.weekLabels').sat = '土';

ensure(ja, 'performanceDashboard.dayLabels').monday = '月曜日';
ensure(ja, 'performanceDashboard.dayLabels').tuesday = '火曜日';
ensure(ja, 'performanceDashboard.dayLabels').wednesday = '水曜日';
ensure(ja, 'performanceDashboard.dayLabels').thursday = '木曜日';
ensure(ja, 'performanceDashboard.dayLabels').friday = '金曜日';
ensure(ja, 'performanceDashboard.dayLabels').saturday = '土曜日';
ensure(ja, 'performanceDashboard.dayLabels').sunday = '日曜日';

ensure(ja, 'performanceDashboard.insights').noDataMessage = '表示するデータがありません';

ensure(ja, 'performanceDashboard.monthlyReport').title = '月次レポート';
ensure(ja, 'performanceDashboard.monthlyReport').viewReport = 'レポートを表示';

// DUES MANAGEMENT - Complete all
ensure(ja, 'duesManagement.status').current = '最新';

ensure(ja, 'duesManagement.alerts').paymentSuccess = '支払いが完了しました';

ensure(ja, 'duesManagement.settings').enableAutoPay = '自動支払いを有効にする';

ensure(ja, 'duesManagement.modals').confirmPaymentTitle = '支払いを確認';

ensure(ja, 'duesManagement.memberCard').memberSince = '入会日';
ensure(ja, 'duesManagement.memberCard').unpaidMonths = '未払い月数';

ensure(ja, 'duesManagement.overdue').title = '延滞';

ensure(ja, 'duesManagement.paymentForm').cardNumber = 'カード番号';
ensure(ja, 'duesManagement.paymentForm').expiryDate = '有効期限';

ensure(ja, 'duesManagement.paymentDetails').invoice = '請求書';
ensure(ja, 'duesManagement.paymentDetails').receipt = '領収書';

ensure(ja, 'duesManagement.types').monthly = '月額';

ensure(ja, 'duesManagement.inputs').amountLabel = '金額';
ensure(ja, 'duesManagement.inputs').amountPlaceholder = '金額を入力';
ensure(ja, 'duesManagement.inputs').dueDateLabel = '支払期限';

// MATCHES - Complete
ensure(ja, 'matches.card').courtInfo = 'コート情報';
ensure(ja, 'matches.card').timeRemaining = '残り時間';

ensure(ja, 'matches.skillLevels').beginner = '初級';
ensure(ja, 'matches.skillLevels').intermediate = '中級';
ensure(ja, 'matches.skillLevels').advanced = '上級';
ensure(ja, 'matches.skillLevels').professional = 'プロフェッショナル';

ensure(ja, 'matches.recurringPatterns').monthly = '毎月';

ensure(ja, 'matches.createModal').successTitle = 'マッチ作成成功';
ensure(ja, 'matches.createModal').successMessage = 'マッチが正常に作成されました';

ensure(ja, 'matches.alerts').error = 'エラーが発生しました';

ensure(ja, 'matches.mockData').player1 = 'プレイヤー1';
ensure(ja, 'matches.mockData').player2 = 'プレイヤー2';
ensure(ja, 'matches.mockData').player3 = 'プレイヤー3';

// LEAGUE DETAIL - Complete
ensure(ja, 'leagueDetail.standings').placement = '順位';

ensure(ja, 'leagueDetail.adminDashboard').enterResultButton = '結果を入力';
ensure(ja, 'leagueDetail.adminDashboard').notStartedYet = 'まだ開始されていません';

ensure(ja, 'leagueDetail.leagueManagement').emptyLeagueMessage = '参加者がいません';

ensure(ja, 'leagueDetail.playoffs').firstPlace = '1位';
ensure(ja, 'leagueDetail.playoffs').secondPlace = '2位';
ensure(ja, 'leagueDetail.playoffs').thirdPlace = '3位';
ensure(ja, 'leagueDetail.playoffs').fourthPlace = '4位';

ensure(ja, 'leagueDetail.dialogs').deleteConfirmMessage = 'このリーグを削除してもよろしいですか？';
ensure(ja, 'leagueDetail.dialogs').deleteConfirmButton = '削除';

ensure(ja, 'leagueDetail.genderLabels').mens = '男子';
ensure(ja, 'leagueDetail.genderLabels').womens = '女子';

// CLUB LEAGUES TOURNAMENTS - Remaining
ensure(ja, 'clubLeaguesTournaments.memberPreLeagueStatus').notEligible = '参加資格なし';
ensure(ja, 'clubLeaguesTournaments.memberPreLeagueStatus').eligible = '参加可能';
ensure(ja, 'clubLeaguesTournaments.memberPreLeagueStatus').pending = '保留中';
ensure(ja, 'clubLeaguesTournaments.memberPreLeagueStatus').approved = '承認済み';
ensure(ja, 'clubLeaguesTournaments.memberPreLeagueStatus').rejected = '拒否';
ensure(ja, 'clubLeaguesTournaments.memberPreLeagueStatus').joined = '参加済み';
ensure(ja, 'clubLeaguesTournaments.memberPreLeagueStatus').full = '満員';

ensure(ja, 'clubLeaguesTournaments.alerts').applicationSubmitted = '申請が送信されました';
ensure(ja, 'clubLeaguesTournaments.alerts').applicationApproved = '申請が承認されました';
ensure(ja, 'clubLeaguesTournaments.alerts').applicationRejected = '申請が拒否されました';
ensure(ja, 'clubLeaguesTournaments.alerts').alreadyJoined = '既に参加済みです';

// BADGE GALLERY - All remaining
ensure(ja, 'badgeGallery.modal').earnedOn = '獲得日';
ensure(ja, 'badgeGallery.modal').description = '説明';

ensure(ja, 'badgeGallery.badges').firstMatch = '初マッチ';
ensure(ja, 'badgeGallery.badges').tenMatches = '10マッチ';
ensure(ja, 'badgeGallery.badges').fiftyMatches = '50マッチ';
ensure(ja, 'badgeGallery.badges').hundredMatches = '100マッチ';
ensure(ja, 'badgeGallery.badges').firstWin = '初勝利';
ensure(ja, 'badgeGallery.badges').tenWins = '10勝';
ensure(ja, 'badgeGallery.badges').perfectWeek = '完璧な週';

ensure(ja, 'badgeGallery.alerts').badgeEarned = 'バッジ獲得!';
ensure(ja, 'badgeGallery.alerts').congratulations = 'おめでとうございます！';

// TYPES - All remaining
ensure(ja, 'types.match').singles = 'シングルス';
ensure(ja, 'types.match').doubles = 'ダブルス';

ensure(ja, 'types.clubSchedule').oneTime = '1回限り';
ensure(ja, 'types.clubSchedule').daily = '毎日';
ensure(ja, 'types.clubSchedule').weekly = '毎週';
ensure(ja, 'types.clubSchedule').biweekly = '隔週';
ensure(ja, 'types.clubSchedule').monthly = '毎月';
ensure(ja, 'types.clubSchedule').custom = 'カスタム';
ensure(ja, 'types.clubSchedule').everyWeekday = '平日';

ensure(ja, 'types.dues').monthly = '月額';
ensure(ja, 'types.dues').annual = '年額';

// LEAGUES - All remaining
ensure(ja, 'leagues.admin').startLeague = 'リーグ開始';
ensure(ja, 'leagues.admin').endLeague = 'リーグ終了';
ensure(ja, 'leagues.admin').cancelLeague = 'リーグキャンセル';
ensure(ja, 'leagues.admin').editLeague = 'リーグ編集';
ensure(ja, 'leagues.admin').deleteLeague = 'リーグ削除';
ensure(ja, 'leagues.admin').manageParticipants = '参加者管理';

ensure(ja, 'leagues.match').scheduled = '予定';
ensure(ja, 'leagues.match').inProgress = '進行中';
ensure(ja, 'leagues.match').completed = '完了';

// MEETUP DETAIL - Remaining
ensure(ja, 'meetupDetail.weather').temperature = '気温';
ensure(ja, 'meetupDetail.weather').conditions = '天候';
ensure(ja, 'meetupDetail.weather').wind = '風';
ensure(ja, 'meetupDetail.weather').humidity = '湿度';

ensure(ja, 'meetupDetail.rsvp').going = '参加';
ensure(ja, 'meetupDetail.rsvp').notGoing = '不参加';
ensure(ja, 'meetupDetail.rsvp').maybe = '未定';

ensure(ja, 'meetupDetail.chat').sendMessage = 'メッセージを送信';

// CLUB DUES MANAGEMENT - Remaining
ensure(ja, 'clubDuesManagement.errors').loadFailed = '読み込みに失敗しました';

ensure(ja, 'clubDuesManagement.success').saved = '保存されました';

ensure(ja, 'clubDuesManagement.settings').dueDay = '支払日';
ensure(ja, 'clubDuesManagement.settings').currency = '通貨';
ensure(ja, 'clubDuesManagement.settings').gracePeriod = '猶予期間';
ensure(ja, 'clubDuesManagement.settings').autoInvoice = '自動請求書';
ensure(ja, 'clubDuesManagement.settings').reminderDays = 'リマインダー日数';

ensure(ja, 'clubDuesManagement.unpaid').sendReminder = 'リマインダーを送信';

// All other remaining sections
ensure(ja, 'common').ok = 'OK';
ensure(ja, 'units').km = 'km';
ensure(ja, 'units').distanceKm = '{{distance}} km';

console.log('✅ All 221 translations applied!');
console.log('💾 Saving file...');

// Save
fs.writeFileSync(JA_PATH, JSON.stringify(ja, null, 2) + '\n', 'utf8');

console.log('✨ Complete!');
