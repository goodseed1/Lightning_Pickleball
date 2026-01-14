#!/usr/bin/env node
/**
 * Japanese Translation Script - Round 2
 * Translates remaining 294 untranslated keys
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const JA_PATH = path.join(__dirname, '../src/locales/ja.json');

// Deep merge utility
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(output[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

// Find untranslated keys (where ja value === en value)
function findUntranslated(en, ja, path = '') {
  const untranslated = [];

  for (const key in en) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof en[key] === 'object' && !Array.isArray(en[key])) {
      untranslated.push(...findUntranslated(en[key], ja[key] || {}, currentPath));
    } else {
      if (ja[key] === en[key] || !ja[key]) {
        untranslated.push({ path: currentPath, en: en[key], ja: ja[key] });
      }
    }
  }

  return untranslated;
}

// Main translations object
const translations = {
  // ========== SERVICES (25 keys) ==========
  services: {
    authService: {
      loginSuccess: 'ログインに成功しました',
      loginError: 'ログインエラー',
      logoutSuccess: 'ログアウトに成功しました',
      registrationSuccess: '登録が完了しました',
      registrationError: '登録エラー',
      profileUpdateSuccess: 'プロフィールが更新されました',
      profileUpdateError: 'プロフィール更新エラー',
    },
    matchService: {
      matchCreated: 'マッチが作成されました',
      matchUpdated: 'マッチが更新されました',
      matchCanceled: 'マッチがキャンセルされました',
      matchError: 'マッチエラー',
      invitationSent: '招待を送信しました',
      invitationAccepted: '招待を承諾しました',
      invitationDeclined: '招待を辞退しました',
    },
    clubService: {
      clubCreated: 'クラブが作成されました',
      clubUpdated: 'クラブが更新されました',
      clubError: 'クラブエラー',
      memberAdded: 'メンバーが追加されました',
      memberRemoved: 'メンバーが削除されました',
      roleUpdated: '役割が更新されました',
    },
    notificationService: {
      notificationSent: '通知を送信しました',
      notificationError: '通知エラー',
      permissionDenied: '通知の許可が拒否されました',
      permissionGranted: '通知の許可が付与されました',
    },
    analyticsService: {
      dataLoaded: 'データが読み込まれました',
      dataError: 'データエラー',
      statsCalculated: '統計が計算されました',
    },
  },

  // ========== LEAGUE DETAIL (22 keys) ==========
  leagueDetail: {
    overview: '概要',
    standings: '順位表',
    schedule: 'スケジュール',
    participants: '参加者',
    rules: 'ルール',
    prizes: '賞品',
    leagueInfo: 'リーグ情報',
    format: '形式',
    duration: '期間',
    registrationDeadline: '登録締切',
    registrationOpen: '登録受付中',
    registrationClosed: '登録終了',
    leagueFull: 'リーグ満員',
    joinLeague: 'リーグに参加',
    leaveLeague: 'リーグから退出',
    matchHistory: 'マッチ履歴',
    upcomingMatches: '今後のマッチ',
    completedMatches: '完了したマッチ',
    noMatches: 'マッチがありません',
    viewDetails: '詳細を表示',
    position: '順位',
    player: 'プレイヤー',
  },

  // ========== PERFORMANCE DASHBOARD (20 keys) ==========
  performanceDashboard: {
    title: 'パフォーマンスダッシュボード',
    overview: '概要',
    statistics: '統計',
    trends: 'トレンド',
    achievements: '実績',
    winRate: '勝率',
    totalMatches: '総マッチ数',
    wins: '勝利',
    losses: '敗北',
    recentForm: '最近の成績',
    matchesPlayed: 'プレイしたマッチ',
    averageScore: '平均スコア',
    bestPerformance: 'ベストパフォーマンス',
    improvement: '改善',
    decline: '低下',
    noChange: '変化なし',
    last7Days: '過去7日間',
    last30Days: '過去30日間',
    last90Days: '過去90日間',
    allTime: '全期間',
  },

  // ========== AI MATCHING (19 keys) ==========
  aiMatching: {
    title: 'AIマッチング',
    findingMatches: 'マッチを検索中...',
    noMatchesFound: 'マッチが見つかりませんでした',
    recommendedPlayers: 'おすすめのプレイヤー',
    matchScore: 'マッチスコア',
    compatibility: '相性',
    skillLevel: 'スキルレベル',
    playStyle: 'プレイスタイル',
    availability: '空き状況',
    location: '場所',
    preferences: '設定',
    distance: '距離',
    inviteToMatch: 'マッチに招待',
    viewProfile: 'プロフィールを表示',
    refresh: '更新',
    filters: 'フィルター',
    sortBy: '並び替え',
    bestMatch: 'ベストマッチ',
    nearestFirst: '近い順',
  },

  // ========== DUES MANAGEMENT (13 keys) ==========
  duesManagement: {
    title: '会費管理',
    monthlyDues: '月会費',
    amount: '金額',
    dueDate: '支払期限',
    status: 'ステータス',
    paid: '支払済み',
    unpaid: '未払い',
    overdue: '延滞',
    payNow: '今すぐ支払う',
    paymentHistory: '支払履歴',
    noPayments: '支払履歴がありません',
    receiptDownload: '領収書をダウンロード',
    autoPayment: '自動支払い',
  },

  // ========== TROPHIES (18 keys) ==========
  trophies: {
    myTrophies: 'マイトロフィー',
    allTrophies: '全トロフィー',
    earned: '獲得済み',
    locked: 'ロック中',
    progress: '進捗',
    earnedDate: '獲得日',
    category: 'カテゴリー',
    rarity: 'レア度',
    common: 'コモン',
    rare: 'レア',
    epic: 'エピック',
    legendary: 'レジェンダリー',
    achievements: '実績',
    milestones: 'マイルストーン',
    challenges: 'チャレンジ',
    rewards: '報酬',
    claimReward: '報酬を受け取る',
    shareAchievement: '実績をシェア',
  },

  // ========== CLUB POLICIES (15 keys) ==========
  clubPolicies: {
    title: 'クラブポリシー',
    rules: 'ルール',
    codeOfConduct: '行動規範',
    membershipRequirements: '会員要件',
    attendance: '出席',
    dress: '服装',
    equipment: '装備',
    courtUsage: 'コート使用',
    guestPolicy: 'ゲストポリシー',
    cancellation: 'キャンセル',
    refund: '返金',
    disciplinary: '懲戒',
    privacy: 'プライバシー',
    termsOfService: '利用規約',
    lastUpdated: '最終更新日',
  },

  // ========== MATCH DETAIL (16 keys) ==========
  matchDetail: {
    matchDetails: 'マッチ詳細',
    players: 'プレイヤー',
    score: 'スコア',
    date: '日付',
    time: '時間',
    location: '場所',
    court: 'コート',
    duration: '時間',
    type: 'タイプ',
    format: '形式',
    status: 'ステータス',
    winner: '勝者',
    stats: '統計',
    notes: 'メモ',
    editMatch: 'マッチを編集',
    deleteMatch: 'マッチを削除',
  },

  // ========== NOTIFICATIONS (14 keys) ==========
  notifications: {
    all: 'すべて',
    unread: '未読',
    read: '既読',
    markAsRead: '既読にする',
    markAllAsRead: 'すべて既読にする',
    delete: '削除',
    deleteAll: 'すべて削除',
    noNotifications: '通知がありません',
    matchInvite: 'マッチ招待',
    friendRequest: '友達リクエスト',
    clubUpdate: 'クラブ更新',
    systemMessage: 'システムメッセージ',
    settings: '設定',
    enable: '有効にする',
  },

  // ========== PROFILE SETTINGS (12 keys) ==========
  profileSettings: {
    editProfile: 'プロフィールを編集',
    personalInfo: '個人情報',
    playingInfo: 'プレイ情報',
    preferences: '設定',
    privacy: 'プライバシー',
    notifications: '通知',
    account: 'アカウント',
    changePassword: 'パスワード変更',
    deleteAccount: 'アカウント削除',
    saveChanges: '変更を保存',
    discardChanges: '変更を破棄',
    confirmDelete: '削除を確認',
  },

  // ========== SEARCH (10 keys) ==========
  search: {
    searchPlaceholder: '検索...',
    recentSearches: '最近の検索',
    popularSearches: '人気の検索',
    noResults: '結果が見つかりませんでした',
    searchPlayers: 'プレイヤーを検索',
    searchClubs: 'クラブを検索',
    searchMatches: 'マッチを検索',
    clearHistory: '履歴をクリア',
    filters: 'フィルター',
    sortBy: '並び替え',
  },

  // ========== CHAT (15 keys) ==========
  chat: {
    messages: 'メッセージ',
    sendMessage: 'メッセージを送信',
    typeMessage: 'メッセージを入力...',
    noMessages: 'メッセージがありません',
    delivered: '配信済み',
    seen: '既読',
    typing: '入力中...',
    online: 'オンライン',
    offline: 'オフライン',
    lastSeen: '最終接続',
    attachImage: '画像を添付',
    attachFile: 'ファイルを添付',
    deleteMessage: 'メッセージを削除',
    editMessage: 'メッセージを編集',
    blockUser: 'ユーザーをブロック',
  },

  // ========== CALENDAR (12 keys) ==========
  calendar: {
    today: '今日',
    week: '週',
    month: '月',
    year: '年',
    events: 'イベント',
    addEvent: 'イベントを追加',
    editEvent: 'イベントを編集',
    deleteEvent: 'イベントを削除',
    noEvents: 'イベントがありません',
    upcomingEvents: '今後のイベント',
    pastEvents: '過去のイベント',
    allDay: '終日',
  },

  // ========== PAYMENTS (11 keys) ==========
  payments: {
    payment: '支払い',
    paymentMethod: '支払方法',
    addPaymentMethod: '支払方法を追加',
    creditCard: 'クレジットカード',
    debitCard: 'デビットカード',
    paypal: 'PayPal',
    bankTransfer: '銀行振込',
    processingPayment: '支払い処理中...',
    paymentSuccess: '支払いが完了しました',
    paymentFailed: '支払いに失敗しました',
    refund: '返金',
  },

  // ========== RATINGS (9 keys) ==========
  ratings: {
    ratePlayer: 'プレイヤーを評価',
    rating: '評価',
    skillRating: 'スキル評価',
    sportsmanship: 'スポーツマンシップ',
    punctuality: '時間厳守',
    communication: 'コミュニケーション',
    submitRating: '評価を送信',
    averageRating: '平均評価',
    reviews: 'レビュー',
  },

  // ========== REPORTS (10 keys) ==========
  reports: {
    reportUser: 'ユーザーを報告',
    reportMatch: 'マッチを報告',
    reportClub: 'クラブを報告',
    reason: '理由',
    description: '説明',
    submitReport: '報告を送信',
    reportSubmitted: '報告が送信されました',
    spam: 'スパム',
    harassment: 'ハラスメント',
    inappropriate: '不適切',
  },

  // ========== SETTINGS (13 keys) ==========
  settings: {
    general: '一般',
    appearance: '外観',
    language: '言語',
    theme: 'テーマ',
    lightMode: 'ライトモード',
    darkMode: 'ダークモード',
    systemDefault: 'システムデフォルト',
    fontSize: 'フォントサイズ',
    sound: 'サウンド',
    vibration: 'バイブレーション',
    advanced: '詳細設定',
    about: 'について',
    version: 'バージョン',
  },

  // ========== SOCIAL (14 keys) ==========
  social: {
    share: 'シェア',
    shareProfile: 'プロフィールをシェア',
    shareMatch: 'マッチをシェア',
    shareAchievement: '実績をシェア',
    copyLink: 'リンクをコピー',
    linkCopied: 'リンクがコピーされました',
    follow: 'フォロー',
    unfollow: 'フォロー解除',
    followers: 'フォロワー',
    following: 'フォロー中',
    likes: 'いいね',
    comments: 'コメント',
    posts: '投稿',
    activity: 'アクティビティ',
  },

  // ========== TOURNAMENT (11 keys) ==========
  tournament: {
    bpaddles: 'トーナメント表',
    rounds: 'ラウンド',
    quarterfinals: '準々決勝',
    semifinals: '準決勝',
    finals: '決勝',
    thirdPlace: '3位決定戦',
    bye: '不戦勝',
    seed: 'シード',
    unseeded: 'ノーシード',
    wildcard: 'ワイルドカード',
    withdrawals: '棄権',
  },

  // ========== VENUE (8 keys) ==========
  venue: {
    facilities: '施設',
    amenities: 'アメニティ',
    parking: '駐車場',
    accessibility: 'アクセシビリティ',
    directions: '道順',
    openingHours: '営業時間',
    contactInfo: '連絡先',
    website: 'ウェブサイト',
  },

  // ========== WEATHER (7 keys) ==========
  weather: {
    forecast: '天気予報',
    temperature: '気温',
    conditions: '天候',
    wind: '風',
    humidity: '湿度',
    rainChance: '降水確率',
    alert: '警報',
  },

  // ========== FILTERS (8 keys) ==========
  filters: {
    applyFilters: 'フィルターを適用',
    clearFilters: 'フィルターをクリア',
    dateRange: '期間',
    skillRange: 'スキル範囲',
    ageRange: '年齢範囲',
    gender: '性別',
    availability: '空き状況',
    distance: '距離',
  },

  // ========== ERRORS (15 keys) ==========
  errors: {
    networkError: 'ネットワークエラー',
    serverError: 'サーバーエラー',
    notFound: '見つかりません',
    unauthorized: '未承認',
    forbidden: '禁止されています',
    timeout: 'タイムアウト',
    invalidInput: '無効な入力',
    required: '必須',
    invalidEmail: '無効なメールアドレス',
    invalidPhone: '無効な電話番号',
    passwordMismatch: 'パスワードが一致しません',
    weakPassword: 'パスワードが弱すぎます',
    tryAgain: '再試行',
    contactSupport: 'サポートに連絡',
    dismiss: '閉じる',
  },

  // ========== SUCCESS MESSAGES (8 keys) ==========
  success: {
    saved: '保存されました',
    updated: '更新されました',
    deleted: '削除されました',
    sent: '送信されました',
    created: '作成されました',
    invited: '招待されました',
    joined: '参加しました',
    left: '退出しました',
  },

  // ========== COMMON ACTIONS (10 keys) ==========
  actions: {
    retry: '再試行',
    reload: '再読み込み',
    undo: '元に戻す',
    redo: 'やり直す',
    copy: 'コピー',
    paste: '貼り付け',
    cut: '切り取り',
    selectAll: 'すべて選択',
    clear: 'クリア',
    reset: 'リセット',
  },
};

// Main execution
async function main() {
  console.log('🇯🇵 Japanese Translation Script - Round 2');
  console.log('==========================================\n');

  // Load existing files
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const ja = JSON.parse(fs.readFileSync(JA_PATH, 'utf8'));

  // Find untranslated keys before
  const untranslatedBefore = findUntranslated(en, ja);
  console.log(`📊 Untranslated keys before: ${untranslatedBefore.length}`);

  // Apply translations
  const updated = deepMerge(ja, translations);

  // Find untranslated keys after
  const untranslatedAfter = findUntranslated(en, updated);
  const translated = untranslatedBefore.length - untranslatedAfter.length;

  console.log(`✅ Keys translated: ${translated}`);
  console.log(`📊 Untranslated keys remaining: ${untranslatedAfter.length}\n`);

  // Save updated file
  fs.writeFileSync(JA_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log('💾 File saved successfully!\n');

  // Show top remaining sections
  if (untranslatedAfter.length > 0) {
    console.log('📋 Top sections still needing translation:');
    const sections = {};
    untranslatedAfter.forEach(item => {
      const section = item.path.split('.')[0];
      sections[section] = (sections[section] || 0) + 1;
    });

    const sorted = Object.entries(sections)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sorted.forEach(([section, count]) => {
      console.log(`  - ${section}: ${count} keys`);
    });
  }

  console.log('\n✨ Translation complete!');
}

main().catch(console.error);
