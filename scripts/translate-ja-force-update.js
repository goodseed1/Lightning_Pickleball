#!/usr/bin/env node
/**
 * Force Update Japanese Translations
 * Replace English values with Japanese translations
 */

const fs = require('fs');
const path = require('path');

const JA_PATH = path.join(__dirname, '../src/locales/ja.json');

// Read current ja.json
const ja = JSON.parse(fs.readFileSync(JA_PATH, 'utf8'));

// Force update all translations (replace existing English values)

// PERFORMANCE DASHBOARD
ja.performanceDashboard.periods.weekly = '週間';
ja.performanceDashboard.periods.monthly = '月間';
ja.performanceDashboard.periods.yearly = '年間';

ja.performanceDashboard.stats.matchesPlayed = 'プレイ済みマッチ';
ja.performanceDashboard.stats.currentWinRate = '現在の勝率';

ja.performanceDashboard.charts.weeklyPerformance = '週間パフォーマンス';

ja.performanceDashboard.weekLabels.Sunday = '日曜日';
ja.performanceDashboard.weekLabels.Monday = '月曜日';
ja.performanceDashboard.weekLabels.Tuesday = '火曜日';
ja.performanceDashboard.weekLabels.Wednesday = '水曜日';
ja.performanceDashboard.weekLabels.Thursday = '木曜日';
ja.performanceDashboard.weekLabels.Friday = '金曜日';
ja.performanceDashboard.weekLabels.Saturday = '土曜日';

ja.performanceDashboard.dayLabels.Mon = '月';
ja.performanceDashboard.dayLabels.Tue = '火';
ja.performanceDashboard.dayLabels.Wed = '水';
ja.performanceDashboard.dayLabels.Thu = '木';
ja.performanceDashboard.dayLabels.Fri = '金';
ja.performanceDashboard.dayLabels.Sat = '土';
ja.performanceDashboard.dayLabels.Sun = '日';

ja.performanceDashboard.insights.improving = '改善中';

ja.performanceDashboard.monthlyReport.download = 'ダウンロード';
ja.performanceDashboard.monthlyReport.share = 'シェア';

// AI MATCHING
ja.aiMatching.results.loading = '読み込み中...';
ja.aiMatching.results.error = 'エラーが発生しました';
ja.aiMatching.results.retry = '再試行';

ja.aiMatching.candidate.name = '名前';
ja.aiMatching.candidate.level = 'レベル';
ja.aiMatching.candidate.distance = '距離';
ja.aiMatching.candidate.rating = '評価';
ja.aiMatching.candidate.schedule = 'スケジュール';
ja.aiMatching.candidate.status = 'ステータス';
ja.aiMatching.candidate.available = '利用可能';
ja.aiMatching.candidate.busy = '忙しい';
ja.aiMatching.candidate.away = '不在';
ja.aiMatching.candidate.invite = '招待';
ja.aiMatching.candidate.viewProfile = 'プロフィールを表示';
ja.aiMatching.candidate.sendRequest = 'リクエストを送信';
ja.aiMatching.candidate.cancel = 'キャンセル';

ja.aiMatching.mockData.name1 = '山田太郎';
ja.aiMatching.mockData.name2 = '佐藤花子';
ja.aiMatching.mockData.name3 = '鈴木次郎';

// SERVICES
ja.services.camera.permissionRequired = 'カメラ許可が必要です';
ja.services.camera.cameraError = 'カメラエラー';
ja.services.camera.galleryError = 'ギャラリーエラー';

ja.services.location.locationRequired = '位置情報が必要です';

ja.services.feed.loading = '読み込み中...';
ja.services.feed.error = 'エラーが発生しました';

ja.services.performanceAnalytics.loading = '読み込み中...';
ja.services.performanceAnalytics.notEnoughData = 'データが不足しています';
ja.services.performanceAnalytics.calculatingStats = '統計を計算中...';
ja.services.performanceAnalytics.dataUnavailable = 'データが利用できません';

ja.services.leaderboard.title = 'ランキング';
ja.services.leaderboard.rank = '順位';
ja.services.leaderboard.name = '名前';
ja.services.leaderboard.points = 'ポイント';
ja.services.leaderboard.wins = '勝利';
ja.services.leaderboard.losses = '敗北';
ja.services.leaderboard.winRate = '勝率';
ja.services.leaderboard.viewAll = 'すべて表示';

// DUES MANAGEMENT
ja.duesManagement.status.paid = '支払済み';

ja.duesManagement.alerts.paymentFailed = '支払いに失敗しました';

ja.duesManagement.settings.autoPayEnabled = '自動支払い有効';

ja.duesManagement.modals.confirmPayment = '支払いを確認しますか？';

ja.duesManagement.memberCard.name = '名前';
ja.duesManagement.memberCard.status = 'ステータス';

ja.duesManagement.overdue.amount = '金額';

ja.duesManagement.paymentForm.cardholderName = 'カード名義人';
ja.duesManagement.paymentForm.cvv = 'セキュリティコード';

ja.duesManagement.paymentDetails.transactionId = '取引ID';
ja.duesManagement.paymentDetails.paymentDate = '支払日';

ja.duesManagement.types.annual = '年額';

ja.duesManagement.inputs.notesLabel = '備考';
ja.duesManagement.inputs.notesPlaceholder = '備考を入力';
ja.duesManagement.inputs.paymentMethodLabel = '支払方法';

// CLUB LEAGUES TOURNAMENTS
ja.clubLeaguesTournaments.labels.format = '形式';
ja.clubLeaguesTournaments.labels.expiresIn = '{{hours}}時間後に期限切れ';

ja.clubLeaguesTournaments.memberPreLeagueStatus.waitlisted = 'ウェイトリスト';
ja.clubLeaguesTournaments.memberPreLeagueStatus.withdrawn = '辞退';
ja.clubLeaguesTournaments.memberPreLeagueStatus.invited = '招待済み';
ja.clubLeaguesTournaments.memberPreLeagueStatus.confirmed = '確認済み';
ja.clubLeaguesTournaments.memberPreLeagueStatus.declined = '辞退';
ja.clubLeaguesTournaments.memberPreLeagueStatus.expired = '期限切れ';
ja.clubLeaguesTournaments.memberPreLeagueStatus.canceled = 'キャンセル';

ja.clubLeaguesTournaments.alerts.joinSuccess = '参加が完了しました';
ja.clubLeaguesTournaments.alerts.joinFailed = '参加に失敗しました';
ja.clubLeaguesTournaments.alerts.alreadyMember = '既にメンバーです';
ja.clubLeaguesTournaments.alerts.notEligible = '参加資格がありません';

// MATCHES
ja.matches.card.location = '場所';
ja.matches.card.participants = '参加者';

ja.matches.skillLevels.allLevels = '全レベル';
ja.matches.skillLevels.beginner = '初級';
ja.matches.skillLevels.intermediate = '中級';
ja.matches.skillLevels.advanced = '上級';

ja.matches.recurringPatterns.none = 'なし';

ja.matches.createModal.error = 'エラー';
ja.matches.createModal.errorMessage = 'マッチ作成に失敗しました';

ja.matches.alerts.cancelled = 'キャンセルされました';

ja.matches.mockData.name1 = '山田太郎';
ja.matches.mockData.name2 = '佐藤花子';
ja.matches.mockData.name3 = '鈴木次郎';

// LEAGUE DETAIL
ja.leagueDetail.standings.rank = '順位';

ja.leagueDetail.adminDashboard.viewMatches = 'マッチを表示';
ja.leagueDetail.adminDashboard.viewStandings = '順位を表示';

ja.leagueDetail.leagueManagement.addParticipants = '参加者を追加';

ja.leagueDetail.playoffs.champion = 'チャンピオン';
ja.leagueDetail.playoffs.runnerUp = '準優勝';
ja.leagueDetail.playoffs.semifinals = '準決勝';
ja.leagueDetail.playoffs.finals = '決勝';

ja.leagueDetail.dialogs.deleteTitle = 'リーグを削除';
ja.leagueDetail.dialogs.cancel = 'キャンセル';

ja.leagueDetail.genderLabels.mixed = '混合';
ja.leagueDetail.genderLabels.open = 'オープン';

// BADGE GALLERY
ja.badgeGallery.modal.close = '閉じる';
ja.badgeGallery.modal.share = 'シェア';

ja.badgeGallery.badges.fiveHundredMatches = '500マッチ';
ja.badgeGallery.badges.twentyFiveWins = '25勝';
ja.badgeGallery.badges.fiftyWins = '50勝';
ja.badgeGallery.badges.hundredWins = '100勝';
ja.badgeGallery.badges.winStreak = '連勝';
ja.badgeGallery.badges.tournamentWin = 'トーナメント優勝';
ja.badgeGallery.badges.leagueChampion = 'リーグチャンピオン';

ja.badgeGallery.alerts.shareSuccess = 'シェアしました';
ja.badgeGallery.alerts.shareFailed = 'シェアに失敗しました';

// TYPES
ja.types.match.mixed = '混合';
ja.types.match.team = 'チーム';

ja.types.clubSchedule.weekend = '週末';
ja.types.clubSchedule.firstMonday = '第1月曜日';
ja.types.clubSchedule.lastFriday = '最終金曜日';
ja.types.clubSchedule.specificDates = '特定の日';
ja.types.clubSchedule.seasonal = '季節';
ja.types.clubSchedule.adhoc = 'アドホック';
ja.types.clubSchedule.recurring = '繰り返し';

ja.types.dues.oneTime = '1回限り';
ja.types.dues.quarterly = '四半期';

// LEAGUES
ja.leagues.admin.viewParticipants = '参加者を表示';
ja.leagues.admin.exportResults = '結果をエクスポート';
ja.leagues.admin.sendNotification = '通知を送信';
ja.leagues.admin.duplicateLeague = 'リーグを複製';
ja.leagues.admin.archiveLeague = 'リーグをアーカイブ';
ja.leagues.admin.settings = '設定';

ja.leagues.match.pending = '保留中';
ja.leagues.match.confirmed = '確認済み';
ja.leagues.match.cancelled = 'キャンセル';

// MEETUP DETAIL
ja.meetupDetail.weather.sunny = '晴れ';
ja.meetupDetail.weather.cloudy = '曇り';
ja.meetupDetail.weather.rainy = '雨';
ja.meetupDetail.weather.snowy = '雪';

ja.meetupDetail.rsvp.yes = 'はい';
ja.meetupDetail.rsvp.no = 'いいえ';
ja.meetupDetail.rsvp.pending = '保留中';

ja.meetupDetail.chat.placeholder = 'メッセージを入力...';

// CLUB DUES MANAGEMENT
ja.clubDuesManagement.settings.enableDues = '会費を有効にする';
ja.clubDuesManagement.settings.monthlyAmount = '月額';
ja.clubDuesManagement.settings.annualAmount = '年額';
ja.clubDuesManagement.settings.paymentMethods = '支払方法';
ja.clubDuesManagement.settings.notificationSettings = '通知設定';

console.log('✅ All force updates applied!');
console.log('💾 Saving file...');

// Save
fs.writeFileSync(JA_PATH, JSON.stringify(ja, null, 2) + '\n', 'utf8');

console.log('✨ Complete!');
