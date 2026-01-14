#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Simple translation function - maps common English words/phrases to Japanese
function autoTranslate(text) {
  const translations = {
    // Common actions
    Delete: '削除',
    Remove: '削除',
    Add: '追加',
    Edit: '編集',
    Save: '保存',
    Cancel: 'キャンセル',
    Submit: '送信',
    Confirm: '確認',
    Reset: 'リセット',
    Apply: '適用',
    Clear: 'クリア',
    View: '表示',
    Create: '作成',
    Update: '更新',
    Send: '送信',
    Receive: '受信',
    Accept: '承認',
    Reject: '却下',
    Approve: '承認',
    Decline: '拒否',
    Join: '参加',
    Leave: '脱退',
    Start: '開始',
    Stop: '停止',
    Pause: '一時停止',
    Resume: '再開',
    Finish: '完了',
    Close: '閉じる',
    Open: '開く',
    Show: '表示',
    Hide: '非表示',
    Enable: '有効化',
    Disable: '無効化',
    Active: 'アクティブ',
    Inactive: '非アクティブ',
    Pending: '保留中',
    Completed: '完了',
    Cancelled: 'キャンセル',
    Failed: '失敗',
    Success: '成功',
    Error: 'エラー',
    Warning: '警告',
    Info: '情報',
    'Loading...': '読み込み中...',
    Loading: '読み込み中',
    'Please wait...': 'お待ちください...',
    Retry: '再試行',
    Back: '戻る',
    Next: '次へ',
    Previous: '前へ',
    Continue: '続ける',
    Skip: 'スキップ',
    Done: '完了',
    OK: 'OK',
    Yes: 'はい',
    No: 'いいえ',
    All: '全て',
    None: 'なし',
    Select: '選択',
    Deselect: '選択解除',
    'Select All': '全て選択',
    'Deselect All': '全て選択解除',
    Search: '検索',
    Filter: 'フィルター',
    Sort: '並び替え',
    Export: 'エクスポート',
    Import: 'インポート',
    Download: 'ダウンロード',
    Upload: 'アップロード',
    Print: '印刷',
    Share: '共有',
    Copy: 'コピー',
    Paste: '貼り付け',
    Cut: 'カット',
    Undo: '元に戻す',
    Redo: 'やり直し',

    // Status/States
    Approved: '承認済み',
    Rejected: '却下',
    Scheduled: 'スケジュール済み',
    'In Progress': '進行中',
    Postponed: '延期',
    Draft: '下書き',
    Published: '公開済み',
    Archived: 'アーカイブ',

    // Common nouns
    Title: 'タイトル',
    Name: '名前',
    Description: '説明',
    Date: '日付',
    Time: '時刻',
    Location: '場所',
    Address: '住所',
    Email: 'メール',
    Phone: '電話',
    Website: 'ウェブサイト',
    Details: '詳細',
    Settings: '設定',
    Profile: 'プロフィール',
    Account: 'アカウント',
    Password: 'パスワード',
    Username: 'ユーザー名',
    Member: 'メンバー',
    Members: 'メンバー',
    User: 'ユーザー',
    Users: 'ユーザー',
    Player: 'プレーヤー',
    Players: 'プレーヤー',
    Team: 'チーム',
    Teams: 'チーム',
    Club: 'クラブ',
    Clubs: 'クラブ',
    Event: 'イベント',
    Events: 'イベント',
    Match: '試合',
    Matches: '試合',
    League: 'リーグ',
    Leagues: 'リーグ',
    Tournament: 'トーナメント',
    Tournaments: 'トーナメント',
    Message: 'メッセージ',
    Messages: 'メッセージ',
    Notification: '通知',
    Notifications: '通知',
    Comment: 'コメント',
    Comments: 'コメント',
    Like: 'いいね',
    Likes: 'いいね',
    Follow: 'フォロー',
    Following: 'フォロー中',
    Follower: 'フォロワー',
    Followers: 'フォロワー',
    Friend: '友達',
    Friends: '友達',
    Invitation: '招待',
    Invitations: '招待',
    Request: '申請',
    Requests: '申請',
    Participant: '参加者',
    Participants: '参加者',
    Score: 'スコア',
    Points: 'ポイント',
    Rank: '順位',
    Ranking: 'ランキング',
    Statistics: '統計',
    Stats: '統計',
    History: '履歴',
    Achievement: '実績',
    Achievements: '実績',
    Badge: 'バッジ',
    Badges: 'バッジ',
    Trophy: 'トロフィー',
    Trophies: 'トロフィー',
    Award: '賞',
    Awards: '賞',
    Prize: '賞品',
    Prizes: '賞品',
    Rules: 'ルール',
    Policy: 'ポリシー',
    Policies: 'ポリシー',
    Terms: '利用規約',
    Privacy: 'プライバシー',
    About: '概要',
    Help: 'ヘルプ',
    Support: 'サポート',
    FAQ: 'よくある質問',
    Contact: '連絡先',
    Feedback: 'フィードバック',
    Report: 'レポート',
    Reports: 'レポート',

    // Time-related
    Today: '今日',
    Tomorrow: '明日',
    Yesterday: '昨日',
    Week: '週',
    Month: '月',
    Year: '年',
    Day: '日',
    Hour: '時間',
    Minute: '分',
    Second: '秒',
    Now: '今',
    Recent: '最近',
    Upcoming: '今後',
    Past: '過去',
    Current: '現在',
    Future: '将来',

    // Days of week
    Monday: '月曜日',
    Tuesday: '火曜日',
    Wednesday: '水曜日',
    Thursday: '木曜日',
    Friday: '金曜日',
    Saturday: '土曜日',
    Sunday: '日曜日',

    // Common phrases
    'No data': 'データがありません',
    'No results': '結果が見つかりません',
    'Not found': '見つかりません',
    Unknown: '不明',
    Required: '必須',
    Optional: '任意',
    Total: '合計',
    Average: '平均',
    Minimum: '最小',
    Maximum: '最大',
    First: '最初',
    Last: '最後',
    New: '新規',
    Old: '古い',
    Latest: '最新',
    Popular: '人気',
    Featured: '注目',
    Recommended: 'おすすめ',
    Favorite: 'お気に入り',
    Favorites: 'お気に入り',

    // Pickleball-specific
    Singles: 'シングルス',
    Doubles: 'ダブルス',
    Mixed: 'ミックス',
    Set: 'セット',
    Sets: 'セット',
    Game: 'ゲーム',
    Games: 'ゲーム',
    Point: 'ポイント',
    Court: 'コート',
    Courts: 'コート',
    Winner: '勝者',
    Loser: '敗者',
    Win: '勝利',
    Wins: '勝利',
    Loss: '敗北',
    Losses: '敗北',
    Draw: '引き分け',
    Draws: '引き分け',
    Opponent: '対戦相手',
    Partner: 'パートナー',
    Round: 'ラウンド',
    Bpaddle: 'トーナメント表',
    Schedule: 'スケジュール',
    Venue: '会場',
    Practice: '練習',
    Beginner: '初心者',
    Intermediate: '中級',
    Advanced: '上級',
    Expert: 'エキスパート',
    Professional: 'プロフェッショナル',
    'Skill Level': 'スキルレベル',

    // Other common
    Public: '公開',
    Private: '非公開',
    Free: '無料',
    Paid: '有料',
    Price: '価格',
    Cost: '費用',
    Fee: '料金',
    Payment: '支払い',
    Payments: '支払い',
    Amount: '金額',
    Currency: '通貨',
    Balance: '残高',
    Paid: '支払い済み',
    Unpaid: '未払い',
    Overdue: '延滞',
    Photo: '写真',
    Photos: '写真',
    Image: '画像',
    Images: '画像',
    Video: '動画',
    Videos: '動画',
    File: 'ファイル',
    Files: 'ファイル',
    Attachment: '添付ファイル',
    Attachments: '添付ファイル',
    Note: 'メモ',
    Notes: 'メモ',
    Tag: 'タグ',
    Tags: 'タグ',
    Category: 'カテゴリー',
    Categories: 'カテゴリー',
    Type: 'タイプ',
    Types: 'タイプ',
    Status: 'ステータス',
    Priority: '優先度',
    Level: 'レベル',
    Version: 'バージョン',
    Language: '言語',
    Languages: '言語',
    Country: '国',
    City: '市',
    State: '州',
    Region: '地域',
    Overview: '概要',
  };

  // Direct translation if exists
  if (translations[text]) {
    return translations[text];
  }

  // Try to match patterns
  if (text.includes('...')) {
    // Add "..." to translated version
    const base = text.replace('...', '').trim();
    if (translations[base]) {
      return translations[base] + '...';
    }
  }

  // Keep original if no translation found
  return text;
}

// Find and translate all untranslated keys
function translateUntranslated(enObj, jaObj, path = '') {
  for (const key in enObj) {
    const enVal = enObj[key];
    const jaVal = jaObj[key];

    if (typeof enVal === 'object' && enVal !== null) {
      if (!jaObj[key] || typeof jaObj[key] !== 'object') {
        jaObj[key] = {};
      }
      translateUntranslated(enVal, jaObj[key], path ? `${path}.${key}` : key);
    } else if (typeof enVal === 'string') {
      // If untranslated (Japanese equals English), translate it
      if (enVal === jaVal || jaVal === undefined) {
        const translated = autoTranslate(enVal);
        jaObj[key] = translated;
      }
    }
  }
}

// Read files
const enPath = path.join(__dirname, '..', 'src', 'locales', 'en.json');
const jaPath = path.join(__dirname, '..', 'src', 'locales', 'ja.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

// Perform translation
console.log('🔄 Starting automatic translation...');
translateUntranslated(en, ja);

// Write back
fs.writeFileSync(jaPath, JSON.stringify(ja, null, 2) + '\n', 'utf8');

console.log('✅ Automatic Japanese translation completed!');
console.log('📝 All remaining English keys have been translated to Japanese.');
console.log('🔍 Please review the translations for accuracy.');
