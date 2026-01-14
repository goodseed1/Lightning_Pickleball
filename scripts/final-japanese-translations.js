const fs = require('fs');
const path = require('path');

// Read the untranslated keys report
const reportPath = path.join(__dirname, 'untranslated-keys-report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Massive comprehensive translation map - covers ALL remaining patterns
const translationMap = {
  // Simple common
  OK: 'OK',
  km: 'km',
  '{{distance}} km': '{{distance}} km',

  // Time slots
  Brunch: 'ブランチ',

  // Terms & Legal
  'Liability Disclaimer': '免責事項',
  'Marketing Communications Consent': 'マーケティングコミュニケーションの同意',

  // Admin logs
  'System Logs': 'システムログ',
  Critical: '重要',
  Healthy: '正常',
  'Log Categories': 'ログカテゴリー',
  'Cloud Functions Logs': 'Cloud Functionsログ',
  'Open Firebase Console': 'Firebaseコンソールを開く',
  'Auth Logs': '認証ログ',
  'System is running normally': 'システムは正常に動作しています',
  entries: 'エントリー',
  ' minutes ago': ' 分前',
  ' hours ago': ' 時間前',
  ' days ago': ' 日前',
  'miles away': 'マイル離れた',
  mile: 'マイル',
  'Quiet Hours': '静寂時間',
  Korean: '韓国語',
  'Are you sure you want to logout?': 'ログアウトしてもよろしいですか？',
  '🔧 Developer Tools': '🔧 開発者ツール',
  'Resetting...': 'リセット中...',
  '⚠️ For Developers Only - Run Once!': '⚠️ 開発者専用 - 一度だけ実行！',
  'Reset Complete': 'リセット完了',
  'Applications ({{count}})': '申請 ({{count}})',

  // Dues Management specific
  'Send Payment Reminder': '支払いリマインダーを送信',
  'Payment Reminders': '支払いリマインダー',
  'Automatic Reminders': '自動リマインダー',
  'Days Before Due': '支払期日前の日数',
  'View All Payments': 'すべての支払いを見る',
  'Total Collected': '総回収額',
  'Outstanding Amount': '未収金額',
  'Average Payment': '平均支払い額',
  'Payment Trends': '支払い傾向',
  'Monthly Report': '月次レポート',
  'Annual Report': '年次レポート',
  'Generate Report': 'レポートを生成',
  'Download Report': 'レポートをダウンロード',
  'Email Report': 'レポートをメール送信',
  'Payment Methods': '支払い方法',
  Cash: '現金',
  'Credit Card': 'クレジットカード',
  'Bank Transfer': '銀行振込',
  Check: '小切手',
  'Payment Method': '支払い方法',
  'Transaction ID': '取引ID',
  Receipt: '領収書',
  Invoice: '請求書',
  'Generate Invoice': '請求書を生成',
  'Send Invoice': '請求書を送信',
  'Due This Month': '今月の支払い',
  'Overdue Payments': '期限超過の支払い',
  'Recent Payments': '最近の支払い',
  'Payment Calendar': '支払いカレンダー',
  'Auto-calculate': '自動計算',
  'Manual Entry': '手動入力',
  'Bulk Actions': '一括操作',
  'Select All': 'すべて選択',
  'Deselect All': 'すべて解除',
  Apply: '適用',

  // Edit Profile extended
  'Profile Picture': 'プロフィール写真',
  'Cover Photo': 'カバー写真',
  'Privacy Settings': 'プライバシー設定',
  Visibility: '表示設定',
  Public: '公開',
  Private: '非公開',
  'Friends Only': '友達のみ',
  'Contact Information': '連絡先情報',
  'Emergency Contact': '緊急連絡先',
  'Emergency Phone': '緊急電話番号',
  'Emergency Name': '緊急連絡先名',
  'Medical Information': '医療情報',
  Allergies: 'アレルギー',
  'Medical Conditions': '病状',
  'Tennis Background': 'テニス経歴',
  'Coaching History': 'コーチング履歴',
  'Tournament Experience': 'トーナメント経験',
  'College Tennis': '大学テニス',
  Professional: 'プロ',
  Amateur: 'アマチュア',
  'Equipment Preferences': '装備の好み',
  'Racquet Brand': 'ラケットブランド',
  'String Tension': 'ストリングテンション',
  'Shoe Size': '靴サイズ',
  'Preferred Ball Brand': '好みのボールブランド',
  'Court Preferences': 'コート設定',
  'Social Links': 'ソーシャルリンク',
  Instagram: 'Instagram',
  Twitter: 'Twitter',
  Facebook: 'Facebook',
  Website: 'ウェブサイト',

  // Services errors
  'Authentication failed': '認証に失敗しました',
  'Session expired': 'セッションが期限切れです',
  'Access denied': 'アクセスが拒否されました',
  'Resource not found': 'リソースが見つかりません',
  'Server error': 'サーバーエラー',
  'Connection timeout': '接続タイムアウト',
  'Data sync failed': 'データ同期に失敗しました',
  'Upload failed': 'アップロードに失敗しました',
  'Download failed': 'ダウンロードに失敗しました',
  'Invalid data': '無効なデータ',
  'Validation error': '検証エラー',
  'Operation cancelled': '操作がキャンセルされました',
  'Operation failed': '操作に失敗しました',
  'Try again later': '後でもう一度試してください',
  'Please check your internet connection': 'インターネット接続を確認してください',
  'Something went wrong': '問題が発生しました',

  // League Detail
  'League Schedule': 'リーグスケジュール',
  'League Standings': 'リーグ順位表',
  'League Rules': 'リーグルール',
  'League Champion': 'リーグチャンピオン',
  'Runner-up': '準優勝',
  'Third Place': '3位',
  'Points Table': 'ポイント表',
  'Goal Difference': '得失点差',
  'Goals For': '得点',
  'Goals Against': '失点',
  Form: '調子',
  'Last 5 Matches': '直近5試合',
  'Home Record': 'ホーム戦績',
  'Away Record': 'アウェイ戦績',
  'Neutral Record': '中立地戦績',
  'League Stats': 'リーグ統計',
  'Top Performers': 'トップパフォーマー',
  'Most Wins': '最多勝利',
  'Most Points': '最多ポイント',
  'Best Win Rate': '最高勝率',
  'Current Champion': '現チャンピオン',
  'Defending Champion': 'ディフェンディングチャンピオン',
  'Promotion Zone': '昇格圏',
  'Relegation Zone': '降格圏',
  Playoffs: 'プレーオフ',
  'Regular Season': 'レギュラーシーズン',
  Postseason: 'ポストシーズン',

  // AI Matching extended
  'AI Analysis': 'AI分析',
  'Match Quality': 'マッチ品質',
  'Skill Compatibility': 'スキル相性',
  'Playing Style Match': 'プレイスタイルマッチ',
  'Location Convenience': 'ロケーション利便性',
  'Availability Match': '空き状況マッチ',
  'Previous Partners': '以前のパートナー',
  'Blocked Users': 'ブロックしたユーザー',
  'Favorite Partners': 'お気に入りパートナー',
  'Match History with User': 'ユーザーとのマッチ履歴',
  Rematch: '再戦',
  'Challenge Again': '再チャレンジ',
  'AI Suggested Time': 'AI推奨時間',
  'AI Suggested Location': 'AI推奨場所',
  'Best Match': 'ベストマッチ',
  'Good Match': '良いマッチ',
  'Fair Match': '普通のマッチ',
  'Poor Match': '悪いマッチ',
  'Match Score': 'マッチスコア',
  Compatibility: '相性',
  'Finding best matches...': 'ベストマッチを検索中...',
  'Analyzing preferences...': '設定を分析中...',
  'Calculating compatibility...': '相性を計算中...',

  // Hosted Event Card
  'Event Status': 'イベントステータス',
  'Registration Open': '登録受付中',
  'Registration Closed': '登録締切',
  'Event Completed': 'イベント完了',
  'Event Active': 'イベント進行中',
  'Waiting List': 'ウェイティングリスト',
  'Join Waiting List': 'ウェイティングリストに参加',
  'Remove from Waiting List': 'ウェイティングリストから削除',
  'Spots Available': '空き枠',
  'No Spots Available': '空き枠なし',
  'Check-in Required': 'チェックイン必須',
  'Check-in Open': 'チェックイン受付中',
  'Event Type': 'イベントタイプ',
  Tournament: 'トーナメント',
  'League Match': 'リーグマッチ',
  'Practice Session': '練習セッション',
  'Social Event': 'ソーシャルイベント',
  Clinic: 'クリニック',
  Workshop: 'ワークショップ',
  'Event Duration': 'イベント期間',
  'Start Time': '開始時間',
  'End Time': '終了時間',
  'Check-in Time': 'チェックイン時間',

  // Create Event
  'Event Details': 'イベント詳細',
  'Event Settings': 'イベント設定',
  'Registration Settings': '登録設定',
  'Allow Waiting List': 'ウェイティングリストを許可',
  'Require Check-in': 'チェックインを必須にする',
  'Auto-confirm Registration': '登録を自動承認',
  'Manual Approval': '手動承認',
  'Registration Fee': '登録料',
  'Refund Policy': '払い戻しポリシー',
  'Full Refund': '全額払い戻し',
  'Partial Refund': '一部払い戻し',
  'No Refund': '払い戻しなし',
  'Cancellation Deadline': 'キャンセル期限',
  'Event Image': 'イベント画像',
  'Upload Image': '画像をアップロード',
  'Event Tags': 'イベントタグ',
  'Add Tags': 'タグを追加',
  Visibility: '表示設定',
  'Public Event': '公開イベント',
  'Private Event': '非公開イベント',
  'Club Members Only': 'クラブメンバーのみ',
  'Invite Only': '招待のみ',

  // Performance Dashboard extended
  'Win/Loss Ratio': '勝敗率',
  'Performance Graph': 'パフォーマンスグラフ',
  'Rating History': 'レーティング履歴',
  'Match Statistics': 'マッチ統計',
  'Serve Statistics': 'サーブ統計',
  'Return Statistics': 'リターン統計',
  'First Serve %': 'ファーストサーブ%',
  'Second Serve %': 'セカンドサーブ%',
  Aces: 'エース',
  'Double Faults': 'ダブルフォルト',
  'Break Points': 'ブレークポイント',
  'Break Point Conversion': 'ブレークポイント獲得率',
  'Games Won': '獲得ゲーム',
  'Sets Won': '獲得セット',
  'Total Points': '総ポイント',
  Winners: 'ウィナー',
  'Unforced Errors': 'アンフォーストエラー',
  'Forced Errors': 'フォーストエラー',
  'Net Points': 'ネットポイント',
  'Baseline Points': 'ベースラインポイント',
  'Rally Length': 'ラリー長',
  'Average Rally': '平均ラリー',

  // Admin extended
  'User Reports': 'ユーザーレポート',
  'Content Moderation': 'コンテンツモデレーション',
  'Abuse Reports': '不正使用レポート',
  'Spam Detection': 'スパム検出',
  'Automated Actions': '自動アクション',
  'Manual Review': '手動レビュー',
  'Flagged Content': 'フラグ付きコンテンツ',
  'Suspended Accounts': '停止されたアカウント',
  'Warning Issued': '警告発行',
  'Ban Duration': 'BAN期間',
  'Permanent Ban': '永久BAN',
  'Temporary Ban': '一時BAN',
  'Ban Reason': 'BAN理由',
  Appeal: '異議申し立て',
  'Review Appeal': '異議を検討',
  'Reinstate User': 'ユーザーを復帰',
  'Activity Logs': 'アクティビティログ',
  'Audit Trail': '監査証跡',
  'Security Events': 'セキュリティイベント',
  'System Alerts': 'システムアラート',

  // Cards/UI extended
  'Card Title': 'カードタイトル',
  'Card Subtitle': 'カードサブタイトル',
  'Card Actions': 'カードアクション',
  'View More': 'もっと見る',
  'Show Less': '閉じる',
  'Expand All': 'すべて展開',
  'Collapse All': 'すべて折りたたむ',
  'Quick Actions': 'クイックアクション',
  'Primary Action': '主要アクション',
  'Secondary Action': '副次アクション',
  Menu: 'メニュー',
  Options: 'オプション',
  Actions: 'アクション',
  Details: '詳細',
  Summary: '概要',
  'Full Details': '完全な詳細',

  // Club Tournament Management
  'Tournament Settings': 'トーナメント設定',
  'Tournament Format': 'トーナメント形式',
  Seeding: 'シード',
  'Automatic Seeding': '自動シード',
  'Manual Seeding': '手動シード',
  'Random Draw': 'ランダム抽選',
  'Seed Players': 'シードプレイヤー',
  Unseeded: 'ノーシード',
  'Top Seed': '第1シード',
  'Match Schedule': 'マッチスケジュール',
  'Generate Schedule': 'スケジュールを生成',
  'Court Assignment': 'コート割り当て',
  'Match Court': 'マッチコート',
  'Center Court': 'センターコート',
  'Court 1': 'コート1',
  'Court 2': 'コート2',
  'Court 3': 'コート3',

  // Matches
  'Match Details': 'マッチ詳細',
  'Match Status': 'マッチステータス',
  Scheduled: '予定済み',
  'In Progress': '進行中',
  Completed: '完了',
  'Match Info': 'マッチ情報',
  Players: 'プレイヤー',
  'Player 1': 'プレイヤー1',
  'Player 2': 'プレイヤー2',
  'Team 1': 'チーム1',
  'Team 2': 'チーム2',
  'Match Notes': 'マッチメモ',
  'Add Notes': 'メモを追加',
  'Match Summary': 'マッチサマリー',
  'Key Moments': '重要な瞬間',
  Highlights: 'ハイライト',

  // Event Card
  'Event Info': 'イベント情報',
  Organizer: '主催者',
  'Event Contact': 'イベント連絡先',
  'Event Website': 'イベントウェブサイト',
  'Event Email': 'イベントメール',
  'Event Phone': 'イベント電話',
  Directions: '道順',
  'Parking Info': '駐車場情報',
  'Parking Available': '駐車場あり',
  'No Parking': '駐車場なし',
  'Street Parking': '路上駐車',
  'Paid Parking': '有料駐車場',
  Amenities: '設備',
  Restrooms: 'トイレ',
  Water: '水',
  Showers: 'シャワー',

  // Badge Gallery extended
  'Badge Details': 'バッジ詳細',
  'Badge Description': 'バッジ説明',
  'Unlock Criteria': '解除条件',
  'Badge Rarity': 'バッジレア度',
  Collection: 'コレクション',
  'Achievement Date': '実績日',
  'Share Badge': 'バッジを共有',
  'Recently Earned': '最近獲得',
  'Next Badge': '次のバッジ',
  'Almost There': 'もう少し',
  'Keep Going': '頑張って',

  // Club features
  'Club Activities': 'クラブアクティビティ',
  'Club Events': 'クラブイベント',
  'Club Schedule': 'クラブスケジュール',
  'Club Roster': 'クラブ名簿',
  'Club Stats': 'クラブ統計',
  'Club Achievements': 'クラブ実績',
  'Club History': 'クラブ履歴',
  Founded: '設立',
  Established: '創設',
  'Club Size': 'クラブサイズ',
  'Active Members': 'アクティブメンバー',
  'Inactive Members': '非アクティブメンバー',

  // Discover
  'Recommended for You': 'あなたへのおすすめ',
  'Recommended Events': 'おすすめイベント',
  'Recommended Clubs': 'おすすめクラブ',
  'Recommended Players': 'おすすめプレイヤー',
  'Based on Your Activity': 'あなたのアクティビティに基づく',
  'Similar to': '類似',
  'You May Also Like': 'こちらもおすすめ',
  Explore: '探索',
  'Browse All': 'すべて参照',

  // Rate Sportsmanship extended
  'Sportsmanship Rating': 'スポーツマンシップ評価',
  'Rate Match Experience': 'マッチ体験を評価',
  'Overall Experience': '全体的な体験',
  'Would Play Again': 'また対戦したい',
  'Recommend to Others': '他の人に推薦',
  'Report Issue': '問題を報告',
  'Additional Comments': '追加コメント',
  Optional: '任意',
  'Anonymous Feedback': '匿名フィードバック',

  // Club Communication
  'Club Announcements': 'クラブお知らせ',
  Important: '重要',
  Urgent: '緊急',
  General: '一般',
  'Announcement Type': 'お知らせタイプ',
  'Target Audience': '対象者',
  'All Members': 'すべてのメンバー',
  'Admins Only': '管理者のみ',
  'Coaches Only': 'コーチのみ',
  'Post to Feed': 'フィードに投稿',
  'Send Notification': '通知を送信',
  'Schedule Post': '投稿をスケジュール',
  'Publish Now': '今すぐ公開',
  'Save as Draft': '下書きとして保存',

  // Meetup Detail
  'Meetup Details': 'ミーティング詳細',
  'Meetup Location': 'ミーティング場所',
  'Meetup Time': 'ミーティング時間',
  Attendees: '出席者',
  RSVP: 'RSVP',
  Going: '参加',
  'Not Going': '不参加',
  Maybe: '未定',
  'Invite Friends': '友達を招待',
  'Share Meetup': 'ミーティングを共有',

  // Context/Utils
  'Loading data...': 'データを読み込み中...',
  'Saving...': '保存中...',
  'Processing...': '処理中...',
  'Please wait...': 'お待ちください...',
  'Almost done...': 'もう少しで完了...',
  'Fetching results...': '結果を取得中...',
  'Updating...': '更新中...',
  'Deleting...': '削除中...',
  'Uploading...': 'アップロード中...',
  'Downloading...': 'ダウンロード中...',

  // Other common patterns
  'Read More': 'もっと読む',
  'Read Less': '閉じる',
  'Show More': 'もっと見る',
  'Show Less': '閉じる',
  'Load More': 'もっと読み込む',
  'See All': 'すべて見る',
  'View Profile': 'プロフィールを見る',
  'Send Message': 'メッセージを送信',
  'Add Friend': '友達に追加',
  'Remove Friend': '友達から削除',
  'Block User': 'ユーザーをブロック',
  'Unblock User': 'ブロックを解除',
  'Report User': 'ユーザーを報告',
  Follow: 'フォロー',
  Unfollow: 'フォロー解除',
  Like: 'いいね',
  Unlike: 'いいね解除',
  Comment: 'コメント',
  Reply: '返信',
  'Delete Comment': 'コメントを削除',
  'Edit Comment': 'コメントを編集',
};

// Helper function to set nested value
function setNestedValue(obj, path, value) {
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

// Read existing Japanese translations
const jaPath = path.join(__dirname, '../src/locales/ja.json');
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

// Apply translations
let translatedCount = 0;
report.keys.forEach(item => {
  const translation = translationMap[item.enValue];
  if (translation) {
    setNestedValue(ja, item.path, translation);
    translatedCount++;
  }
});

// Write updated file
fs.writeFileSync(jaPath, JSON.stringify(ja, null, 2), 'utf8');

console.log(`\n✅ Successfully translated ${translatedCount} additional keys`);
console.log(`📝 Remaining untranslated: ${report.total - translatedCount} keys`);
console.log(`\n✨ Japanese locale file updated!\n`);

// Show which sections were improved
const sectionUpdates = {};
report.keys.forEach(item => {
  if (translationMap[item.enValue]) {
    const section = item.section;
    sectionUpdates[section] = (sectionUpdates[section] || 0) + 1;
  }
});

console.log('📊 Sections updated:');
Object.entries(sectionUpdates)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([section, count]) => {
    console.log(`   ${section}: +${count} keys`);
  });
