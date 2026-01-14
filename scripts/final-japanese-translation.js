#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Comprehensive translation dictionary
const translations = {
  // Theme
  'Choose Your Theme': 'テーマを選択',
  'Select your preferred visual theme': 'お好みのビジュアルテーマを選択してください',
  'Light Mode': 'ライトモード',
  'Bright and clean interface': '明るくクリーンなインターフェース',
  'Dark Mode': 'ダークモード',
  'Easy on the eyes, saves battery': '目に優しく、バッテリーを節約',
  'Follow System': 'システムに従う',
  'System Default': 'システムデフォルト',

  // Auth
  'Sign Up': '新規登録',
  'Signing up...': '登録中...',
  'I agree to the Terms of Service (Required)': '利用規約に同意します（必須）',
  'Sign In': 'ログイン',
  'Signing in...': 'ログイン中...',
  'Sign Out': 'ログアウト',
  'Forgot Password?': 'パスワードをお忘れですか？',
  'Reset Password': 'パスワードをリセット',
  'Enter your email': 'メールアドレスを入力',
  'Enter your password': 'パスワードを入力',
  'Confirm Password': 'パスワード確認',
  'Password must be at least 6 characters': 'パスワードは6文字以上にしてください',
  'Passwords do not match': 'パスワードが一致しません',
  'Email is invalid': 'メールアドレスが無効です',
  'Email already in use': 'このメールアドレスは既に使用されています',
  'Invalid credentials': '認証情報が無効です',
  'User not found': 'ユーザーが見つかりません',
  'Wrong password': 'パスワードが間違っています',

  // Services
  'An error occurred while processing your request': 'リクエストの処理中にエラーが発生しました',
  'The operation failed. Please try again.': '操作に失敗しました。もう一度お試しください。',
  'Network connection error. Please check your internet.':
    'ネットワーク接続エラー。インターネット接続を確認してください。',
  'Operation timed out. Please try again.': '操作がタイムアウトしました。もう一度お試しください。',
  'Invalid input. Please check your data.': '入力が無効です。データを確認してください。',
  'Permission denied. You do not have access to this resource.':
    'アクセスが拒否されました。このリソースへのアクセス権限がありません。',
  'Resource not found.': 'リソースが見つかりません。',
  'This operation is not allowed.': 'この操作は許可されていません。',
  'The server is temporarily unavailable. Please try again later.':
    'サーバーが一時的に利用できません。後でもう一度お試しください。',

  // Admin
  'Admin Dashboard': '管理者ダッシュボード',
  'User Management': 'ユーザー管理',
  'Club Management': 'クラブ管理',
  'Event Management': 'イベント管理',
  'System Settings': 'システム設定',
  Analytics: '分析',
  Reports: 'レポート',
  'Moderator Tools': 'モデレーターツール',
  'Ban User': 'ユーザーを禁止',
  'Unban User': 'ユーザーの禁止を解除',
  'Delete User': 'ユーザーを削除',
  'Verify Club': 'クラブを認証',
  Featured: '注目',
  'Make Featured': '注目にする',
  'Remove Featured': '注目から削除',

  // Performance Dashboard
  'Performance Dashboard': 'パフォーマンスダッシュボード',
  'Win Rate': '勝率',
  'Match History': '試合履歴',
  'Recent Matches': '最近の試合',
  'Head to Head': '対戦成績',
  Strengths: '強み',
  Weaknesses: '弱点',
  'Improvement Areas': '改善点',
  Statistics: '統計',
  'Performance Trends': 'パフォーマンストレンド',
  'Compare Players': 'プレーヤーを比較',

  // Edit Profile
  'Edit Profile': 'プロフィールを編集',
  'Personal Information': '個人情報',
  'Tennis Information': 'テニス情報',
  'Privacy Settings': 'プライバシー設定',
  'Notification Preferences': '通知設定',
  'Account Settings': 'アカウント設定',
  'Change Password': 'パスワードを変更',
  'Delete Account': 'アカウントを削除',
  'Save Changes': '変更を保存',
  'Discard Changes': '変更を破棄',
  'Unsaved Changes': '保存されていない変更',
  'Are you sure you want to discard your changes?': '変更を破棄してもよろしいですか？',

  // AI Matching
  'AI Matching': 'AIマッチング',
  'Finding Your Perfect Match...': '最適なマッチを探しています...',
  'Analyzing Your Profile...': 'プロフィールを分析中...',
  'Matching Skill Levels...': 'スキルレベルをマッチング中...',
  'Checking Availability...': '空き状況を確認中...',
  'Finalizing Recommendations...': '推奨を最終決定中...',
  'Recommended Players': 'おすすめのプレーヤー',
  'Compatibility Score': '互換性スコア',
  'Best Match': 'ベストマッチ',
  'Good Match': '良いマッチ',
  'Average Match': '平均的なマッチ',

  // Event Card / Hosted Event Card
  'Hosted by': '主催者：',
  Organizer: '主催者',
  'Max Participants': '最大参加者数',
  Participants: '参加者',
  'Spots Available': '空き枠',
  Full: '満員',
  Waitlist: 'ウェイティングリスト',
  'Join Waitlist': 'ウェイティングリストに参加',
  'Leave Waitlist': 'ウェイティングリストを脱退',
  RSVP: '出欠確認',
  Going: '参加',
  Maybe: '未定',
  'Not Going': '不参加',
  Interested: '興味あり',

  // Meetup Detail
  'Meetup Details': 'ミートアップ詳細',
  'Recurring Event': '定期イベント',
  'One-time Event': '単発イベント',
  'Every Week': '毎週',
  'Every Month': '毎月',
  'Next Occurrence': '次回開催',
  'View All Occurrences': '全開催を表示',
  'Edit Recurring Event': '定期イベントを編集',
  'Delete Recurring Event': '定期イベントを削除',

  // Badge Gallery
  'Badge Gallery': 'バッジギャラリー',
  'My Badges': 'マイバッジ',
  'All Badges': '全バッジ',
  Earned: '獲得済み',
  Locked: 'ロック中',
  'In Progress': '進行中',
  'Earn this badge by:': 'このバッジを獲得するには：',
  'Achievement Unlocked!': '実績解除！',
  'Congratulations!': 'おめでとうございます！',
  'You earned a new badge': '新しいバッジを獲得しました',

  // Discover
  Discover: '探す',
  Nearby: '近く',
  Popular: '人気',
  New: '新着',
  'Search by location': '場所で検索',
  'Filter by skill': 'スキルでフィルター',
  'Filter by availability': '空き状況でフィルター',
  Distance: '距離',
  Within: '範囲内',
  miles: 'マイル',
  kilometers: 'キロメートル',

  // Create Meetup
  'Create Meetup': 'ミートアップを作成',
  'Meetup Name': 'ミートアップ名',
  'Meetup Description': 'ミートアップ説明',
  'Select Date and Time': '日時を選択',
  'Select Location': '場所を選択',
  'Add Court Information': 'コート情報を追加',
  'Set Max Participants': '最大参加者数を設定',
  'Require Approval': '承認が必要',
  'Auto Approve': '自動承認',
  'Make Recurring': '定期開催にする',
  'Repeat Pattern': '繰り返しパターン',

  // Create Club Tournament
  'Create Tournament': 'トーナメントを作成',
  'Tournament Name': 'トーナメント名',
  'Tournament Type': 'トーナメントタイプ',
  'Single Elimination': 'シングルエリミネーション',
  'Double Elimination': 'ダブルエリミネーション',
  'Round Robin': 'ラウンドロビン',
  'Swiss System': 'スイス方式',
  'Draw Size': 'ドロー数',
  'Registration Opens': '登録開始',
  'Registration Closes': '登録終了',
  'Tournament Starts': 'トーナメント開始',
  'Entry Fee': '参加費',
  'Prize Pool': '賞金総額',

  // Types
  'Match Types': '試合タイプ',
  'Event Types': 'イベントタイプ',
  'Skill Levels': 'スキルレベル',
  'Court Types': 'コートタイプ',
  'Hard Court': 'ハードコート',
  'Clay Court': 'クレーコート',
  'Grass Court': '芝コート',
  Indoor: '屋内',
  Outdoor: '屋外',

  // Common phrases
  'View More': 'もっと見る',
  'View Less': '閉じる',
  'Show All': '全て表示',
  'Show Less': '表示を減らす',
  Expand: '展開',
  Collapse: '折りたたむ',
  Refresh: '更新',
  Reload: '再読み込み',
  'Try Again': 'もう一度試す',
  'Go Back': '戻る',
  Close: '閉じる',
  Done: '完了',
  Finish: '完了',
  Submit: '送信',
  Confirm: '確認',
  'Are you sure?': '本当によろしいですか？',
  'This action cannot be undone': 'この操作は元に戻せません',
  'Do you want to continue?': '続行しますか？',
  Yes: 'はい',
  No: 'いいえ',
  Maybe: '未定',
  OK: 'OK',
  'Got it': 'わかりました',
  Understood: '理解しました',
  'Learn More': '詳細を見る',
  'Read More': 'もっと読む',
  'See Details': '詳細を表示',
  Download: 'ダウンロード',
  Upload: 'アップロード',
  Import: 'インポート',
  Export: 'エクスポート',
  Copy: 'コピー',
  Paste: '貼り付け',
  Share: '共有',
  Print: '印刷',
  Preview: 'プレビュー',
  Attachment: '添付ファイル',
  Browse: '参照',
  'Choose File': 'ファイルを選択',
  'Drop files here': 'ファイルをここにドロップ',
  'Upload Photo': '写真をアップロード',
  'Change Photo': '写真を変更',
  'Remove Photo': '写真を削除',
  'Take Photo': '写真を撮る',
  'Choose from Library': 'ライブラリから選択',

  // Time-related
  'Just now': 'たった今',
  'minute ago': '分前',
  'minutes ago': '分前',
  'hour ago': '時間前',
  'hours ago': '時間前',
  'day ago': '日前',
  'days ago': '日前',
  'week ago': '週間前',
  'weeks ago': '週間前',
  'month ago': 'ヶ月前',
  'months ago': 'ヶ月前',
  'year ago': '年前',
  'years ago': '年前',
  In: 'あと',
  ago: '前',
  'from now': '後',

  // Notifications
  'Mark as Read': '既読にする',
  'Mark all as Read': '全て既読にする',
  'Clear All': '全てクリア',
  'No notifications': '通知がありません',
  'You have no unread notifications': '未読の通知はありません',
  'Enable Notifications': '通知を有効化',
  'Disable Notifications': '通知を無効化',
  'Notification Settings': '通知設定',
  'Push Notifications': 'プッシュ通知',
  'Email Notifications': 'メール通知',
  'SMS Notifications': 'SMS通知',
};

// Auto-translate remaining keys
function autoTranslate(text) {
  // Direct translation if exists
  if (translations[text]) {
    return translations[text];
  }

  // Pattern matching for common structures
  const patterns = [
    [/^Loading (.+)\.\.\.$/i, '{{1}}を読み込み中...'],
    [/^Creating (.+)\.\.\.$/i, '{{1}}を作成中...'],
    [/^Updating (.+)\.\.\.$/i, '{{1}}を更新中...'],
    [/^Deleting (.+)\.\.\.$/i, '{{1}}を削除中...'],
    [/^Sending (.+)\.\.\.$/i, '{{1}}を送信中...'],
    [/^Saving (.+)\.\.\.$/i, '{{1}}を保存中...'],
    [/^(.+) successfully created$/i, '{{1}}を作成しました'],
    [/^(.+) successfully updated$/i, '{{1}}を更新しました'],
    [/^(.+) successfully deleted$/i, '{{1}}を削除しました'],
    [/^Failed to create (.+)$/i, '{{1}}の作成に失敗しました'],
    [/^Failed to update (.+)$/i, '{{1}}の更新に失敗しました'],
    [/^Failed to delete (.+)$/i, '{{1}}の削除に失敗しました'],
    [/^Failed to load (.+)$/i, '{{1}}の読み込みに失敗しました'],
    [/^No (.+) found$/i, '{{1}}が見つかりません'],
    [/^(.+) not found$/i, '{{1}}が見つかりません'],
    [/^View (.+)$/i, '{{1}}を表示'],
    [/^Edit (.+)$/i, '{{1}}を編集'],
    [/^Delete (.+)$/i, '{{1}}を削除'],
    [/^Create (.+)$/i, '{{1}}を作成'],
    [/^Add (.+)$/i, '{{1}}を追加'],
    [/^Remove (.+)$/i, '{{1}}を削除'],
    [/^Update (.+)$/i, '{{1}}を更新'],
    [/^Save (.+)$/i, '{{1}}を保存'],
    [/^Cancel (.+)$/i, '{{1}}をキャンセル'],
    [/^Confirm (.+)$/i, '{{1}}を確認'],
    [/^Select (.+)$/i, '{{1}}を選択'],
    [/^Choose (.+)$/i, '{{1}}を選択'],
  ];

  for (const [pattern, template] of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let part = match[1].toLowerCase();
      // Translate common words in the matched part
      part = part
        .replace(/club/gi, 'クラブ')
        .replace(/event/gi, 'イベント')
        .replace(/match/gi, '試合')
        .replace(/league/gi, 'リーグ')
        .replace(/tournament/gi, 'トーナメント')
        .replace(/player/gi, 'プレーヤー')
        .replace(/member/gi, 'メンバー')
        .replace(/profile/gi, 'プロフィール')
        .replace(/settings/gi, '設定')
        .replace(/information/gi, '情報');
      return template.replace('{{1}}', part);
    }
  }

  return text; // Return original if no translation found
}

// Recursively translate untranslated keys
function translateDeep(enObj, jaObj) {
  for (const key in enObj) {
    const enVal = enObj[key];
    if (typeof enVal === 'object' && enVal !== null) {
      if (!jaObj[key]) jaObj[key] = {};
      translateDeep(enVal, jaObj[key]);
    } else if (typeof enVal === 'string') {
      if (enVal === jaObj[key] || !jaObj[key]) {
        jaObj[key] = autoTranslate(enVal);
      }
    }
  }
}

// Main
const enPath = path.join(__dirname, '..', 'src', 'locales', 'en.json');
const jaPath = path.join(__dirname, '..', 'src', 'locales', 'ja.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

console.log('🌸 Starting final Japanese translation...');
translateDeep(en, ja);

fs.writeFileSync(jaPath, JSON.stringify(ja, null, 2) + '\n', 'utf8');

console.log('✅ Final translation complete!');
console.log('📝 All keys have been processed.');
